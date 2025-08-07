#!/usr/bin/env python3
"""
FastAPI backend proxy for Gemini API
Provides secure API key management for XRP Web application
"""

import os
import logging
from typing import List, Optional, AsyncGenerator
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import asyncio
from dotenv import load_dotenv
from code_buddy import XRPCodeBuddy

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="XRP Gemini API Proxy",
    description="Secure proxy for Gemini API integration with XRP Web",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize XRP Code Buddy
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY environment variable not set")
    raise ValueError("GEMINI_API_KEY environment variable is required")

# Global XRP Code Buddy instance
code_buddy: Optional[XRPCodeBuddy] = None

# Pydantic models
class ChatMessage(BaseModel):
    role: str
    content: str

class SimpleChatRequest(BaseModel):
    """Simplified chat request with just user message and dynamic context"""
    user_message: str
    conversation_history: Optional[List[ChatMessage]] = []
    editor_context: Optional[str] = ""
    terminal_context: Optional[str] = ""

class ChatRequest(BaseModel):
    """Legacy chat request format for backward compatibility"""
    messages: List[ChatMessage]
    files: Optional[List[str]] = None  # List of file URIs

class UploadResponse(BaseModel):
    uri: str
    mimeType: str
    displayName: str

@app.on_event("startup")
async def startup_event():
    """Initialize XRP Code Buddy and load documentation on startup"""
    global code_buddy
    try:
        code_buddy = XRPCodeBuddy(GEMINI_API_KEY)
        logger.info("XRP Code Buddy initialized successfully")
        
        # Load XRP documentation
        try:
            # Try to load the combined documentation file
            docs_path = os.path.join(os.path.dirname(__file__), "../src/assets/class_docs/combined_documentation.md")
            docs_path = os.path.abspath(docs_path)
            
            if os.path.exists(docs_path):
                with open(docs_path, 'r', encoding='utf-8') as f:
                    docs_content = f.read()
                
                await code_buddy.load_documentation(docs_content)
                logger.info("XRP documentation loaded successfully")
            else:
                logger.warning(f"Documentation file not found at {docs_path}")
        except Exception as e:
            logger.error(f"Failed to load documentation: {e}")
            
    except Exception as e:
        logger.error(f"Failed to initialize XRP Code Buddy: {e}")
        raise

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    if code_buddy:
        model_info = code_buddy.get_model_info()
        return {
            "status": "healthy",
            "service": "XRP Gemini API Proxy",
            "model": model_info["model_name"]
        }
    else:
        return {
            "status": "initializing",
            "service": "XRP Gemini API Proxy",
            "model": "XRP Code Buddy"
        }

@app.get("/api/model-info")
async def get_model_info():
    """Get model information"""
    if code_buddy:
        return code_buddy.get_model_info()
    else:
        return {
            "model_id": "initializing",
            "model_name": "XRP Code Buddy",
            "status": "initializing"
        }

@app.post("/api/chat")
async def simplified_chat(request: SimpleChatRequest):
    """Simplified chat endpoint using XRP Code Buddy with built-in teaching guidelines"""
    try:
        if not code_buddy:
            raise HTTPException(status_code=503, detail="XRP Code Buddy is not initialized")
        
        logger.info(f"Simplified chat request: {request.user_message[:50]}...")
        
        # Convert conversation history to format expected by Code Buddy
        conversation_history = []
        for msg in request.conversation_history:
            conversation_history.append({
                "role": msg.role if msg.role == "model" else "user",
                "content": msg.content
            })
        
        # Generate streaming response using Code Buddy
        async def generate_stream():
            try:
                async for content_chunk in code_buddy.chat_with_student(
                    conversation_history=conversation_history,
                    user_message=request.user_message,
                    editor_context=request.editor_context or "",
                    terminal_context=request.terminal_context or ""
                ):
                    yield f"data: {json.dumps({'content': content_chunk, 'type': 'content'})}\n\n"
                
                # Send completion signal
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                
            except Exception as e:
                logger.error(f"Error in simplified chat stream: {e}")
                yield f"data: {json.dumps({'error': str(e), 'type': 'error'})}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )
        
    except Exception as e:
        logger.error(f"Simplified chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat generation failed: {str(e)}")

@app.post("/api/gemini/chat")
async def chat_proxy(request: ChatRequest):
    """Legacy chat endpoint - deprecated, use /api/chat instead"""
    try:
        if not code_buddy:
            raise HTTPException(status_code=503, detail="XRP Code Buddy is not initialized")
            
        logger.info(f"Legacy chat request received with {len(request.messages)} messages")
        
        # Convert to simplified format and redirect to new endpoint
        if request.messages:
            user_message = request.messages[-1].content
            conversation_history = [
                {"role": msg.role, "content": msg.content} 
                for msg in request.messages[:-1]
            ]
        else:
            user_message = ""
            conversation_history = []
        
        # Use Code Buddy for response
        async def generate_stream():
            try:
                async for content_chunk in code_buddy.chat_with_student(
                    conversation_history=conversation_history,
                    user_message=user_message,
                    editor_context="",
                    terminal_context=""
                ):
                    yield f"data: {json.dumps({'content': content_chunk, 'type': 'content'})}\n\n"
                
                # Send completion signal
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                
            except Exception as e:
                logger.error(f"Error in legacy chat stream: {e}")
                yield f"data: {json.dumps({'error': str(e), 'type': 'error'})}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )
        
    except Exception as e:
        logger.error(f"Chat proxy error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat generation failed: {str(e)}")

@app.post("/api/gemini/upload")
async def upload_proxy(file: UploadFile = File(...), display_name: str = Form("uploaded_file")):
    """Proxy file uploads to Gemini File API using Code Buddy"""
    try:
        if not code_buddy:
            raise HTTPException(status_code=503, detail="XRP Code Buddy is not initialized")
        
        logger.info(f"File upload request: {display_name}")
        
        # Read file content
        content = await file.read()
        
        # Determine MIME type
        mime_type = "text/markdown" if file.filename and file.filename.endswith('.md') else (file.content_type or "text/plain")
        
        # Upload using Code Buddy
        file_uri = await code_buddy.upload_file(content, display_name, mime_type)
        
        if not file_uri:
            raise HTTPException(status_code=500, detail=f"File upload failed for {display_name}")
        
        return UploadResponse(
            uri=file_uri,
            mimeType=mime_type,
            displayName=display_name
        )
        
    except Exception as e:
        logger.error(f"Upload proxy error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)