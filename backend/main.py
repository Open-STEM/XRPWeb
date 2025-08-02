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
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import json
import asyncio
from dotenv import load_dotenv

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

# Initialize Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY environment variable not set")
    raise ValueError("GEMINI_API_KEY environment variable is required")

genai.configure(api_key=GEMINI_API_KEY)

# Constants
GEMINI_MODEL_ID = "gemini-2.5-flash"
GEMINI_MODEL_NAME = "XRPCode Buddy"

# Pydantic models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    files: Optional[List[str]] = None  # List of file URIs

class UploadResponse(BaseModel):
    uri: str
    mimeType: str
    displayName: str

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "XRP Gemini API Proxy",
        "model": GEMINI_MODEL_NAME
    }

@app.get("/api/model-info")
async def get_model_info():
    """Get model information"""
    return {
        "model_id": GEMINI_MODEL_ID,
        "model_name": GEMINI_MODEL_NAME,
        "status": "ready"
    }

@app.post("/api/gemini/chat")
async def chat_proxy(request: ChatRequest):
    """Proxy chat requests to Gemini API with streaming support"""
    try:
        logger.info(f"Chat request received with {len(request.messages)} messages")
        
        # Initialize the model
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL_ID,
            safety_settings={
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }
        )
        
        # Convert messages to Gemini format
        conversation_history = []
        for msg in request.messages:
            if msg.role in ["user", "model"]:
                conversation_history.append({
                    "role": msg.role,
                    "parts": [msg.content]
                })
        
        # Add file parts if provided
        file_parts = []
        if request.files:
            for file_uri in request.files:
                file_parts.append({
                    "file_data": {
                        "mime_type": "text/markdown",
                        "file_uri": file_uri
                    }
                })
        
        # Prepare the prompt with files if any
        if conversation_history:
            last_message = conversation_history[-1]
            if file_parts:
                last_message["parts"].extend(file_parts)
        
        # Generate streaming response
        async def generate_stream():
            try:
                response = await asyncio.get_event_loop().run_in_executor(
                    None, 
                    lambda: model.generate_content(
                        conversation_history,
                        generation_config=genai.types.GenerationConfig(
                            temperature=0.7,
                            top_p=0.8,
                            top_k=40,
                            max_output_tokens=2048,
                        ),
                        stream=True
                    )
                )
                
                for chunk in response:
                    if chunk.text:
                        yield f"data: {json.dumps({'content': chunk.text, 'type': 'content'})}\n\n"
                        await asyncio.sleep(0.01)  # Small delay for better streaming
                
                # Send completion signal
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                
            except Exception as e:
                logger.error(f"Error in stream generation: {e}")
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
    """Proxy file uploads to Gemini File API"""
    try:
        logger.info(f"File upload request: {display_name}")
        
        # Read file content
        content = await file.read()
        
        # Create a temporary file-like object for Gemini upload
        import tempfile
        import os
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.md') as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Upload to Gemini using file path with proper MIME type
            mime_type = "text/markdown" if file.filename and file.filename.endswith('.md') else file.content_type
            uploaded_file = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: genai.upload_file(temp_file_path, mime_type=mime_type, display_name=display_name)
            )
            
            # Wait for processing
            while uploaded_file.state.name == "PROCESSING":
                logger.info(f"Processing file {display_name}: {uploaded_file.state.name}")
                await asyncio.sleep(2)
                uploaded_file = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: genai.get_file(uploaded_file.name)
                )
            
            if uploaded_file.state.name == "FAILED":
                raise HTTPException(status_code=500, detail=f"File processing failed for {display_name}")
            
            return UploadResponse(
                uri=uploaded_file.uri,
                mimeType=uploaded_file.mime_type,
                displayName=uploaded_file.display_name
            )
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except:
                pass
        
    except Exception as e:
        logger.error(f"Upload proxy error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)