import { GoogleGenAI, createPartFromUri } from '@google/genai';
import { ChatMessage } from './types';

// Hardcoded model - only using Gemini 2.5 Flash
const GEMINI_MODEL_ID = 'gemini-2.5-flash';
const GEMINI_MODEL_NAME = 'Gemini 2.5 Flash';

export interface UploadedFile {
    uri: string;
    mimeType: string;
    displayName: string;
}

export class GeminiClient {
    private ai: GoogleGenAI;
    private uploadedFiles: Map<string, UploadedFile> = new Map();

    constructor(apiKey?: string) {
        // Use provided API key or fall back to environment variable
        const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
        if (!key) {
            throw new Error('Gemini API key is required');
        }
        this.ai = new GoogleGenAI({ apiKey: key });
    }

    /**
     * Get the model name for display purposes
     */
    getModelName(): string {
        return GEMINI_MODEL_NAME;
    }

    /**
     * Upload a markdown file to Gemini's File API
     */
    async uploadMarkdownFile(content: string, displayName: string): Promise<UploadedFile> {
        try {
            // Check if file is already uploaded
            const cacheKey = `${displayName}_${content.length}`;
            if (this.uploadedFiles.has(cacheKey)) {
                return this.uploadedFiles.get(cacheKey)!;
            }

            const fileBlob = new Blob([content], { type: 'text/markdown' });

            const file = await this.ai.files.upload({
                file: fileBlob,
                config: {
                    displayName: displayName,
                },
            });

            if (!file.name) {
                throw new Error(`File upload failed - no name returned for ${displayName}`);
            }

            // Wait for the file to be processed
            let getFile = await this.ai.files.get({ name: file.name });
            while (getFile.state === 'PROCESSING') {
                console.log(`Processing file ${displayName}: ${getFile.state}`);
                await new Promise((resolve) => setTimeout(resolve, 2000));
                getFile = await this.ai.files.get({ name: file.name });
            }

            if (getFile.state === 'FAILED') {
                throw new Error(`File processing failed for ${displayName}`);
            }

            if (!getFile.uri || !getFile.mimeType) {
                throw new Error(`File ${displayName} was processed but missing uri or mimeType`);
            }

            const uploadedFile: UploadedFile = {
                uri: getFile.uri as string,
                mimeType: getFile.mimeType as string,
                displayName: displayName
            };

            // Cache the uploaded file
            this.uploadedFiles.set(cacheKey, uploadedFile);
            
            return uploadedFile;
        } catch (error) {
            console.error(`Error uploading file ${displayName}:`, error);
            throw new Error(`Failed to upload ${displayName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Upload multiple markdown files from the class_docs directory
     */
    async uploadClassDocs(): Promise<UploadedFile[]> {
        const uploadedFiles: UploadedFile[] = [];

        try {
            // In a browser environment, we can't directly read files from the file system
            // This method assumes the markdown content is passed in or fetched via API
            // For now, we'll return empty array and let the caller handle file reading
            console.log('Note: uploadClassDocs requires file contents to be provided via other means in browser environment');
            return uploadedFiles;
        } catch (error) {
            console.error('Error uploading class docs:', error);
            throw new Error(`Failed to upload class docs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Upload context files from provided content map
     */
    async uploadContextFiles(fileContents: Map<string, string>): Promise<UploadedFile[]> {
        const uploadedFiles: UploadedFile[] = [];
        
        for (const [fileName, content] of fileContents.entries()) {
            try {
                const uploadedFile = await this.uploadMarkdownFile(content, fileName);
                uploadedFiles.push(uploadedFile);
                console.log(`Successfully uploaded context file: ${fileName}`);
            } catch (error) {
                console.warn(`Failed to upload context file ${fileName}:`, error);
                // Continue with other files even if one fails
            }
        }

        return uploadedFiles;
    }

    /**
     * Send a chat completion request to Gemini
     */
    async chatCompletion(
        messages: ChatMessage[],
        onStream?: (content: string) => void,
        contextFile?: UploadedFile
    ): Promise<string> {
        try {
            // Build the content array starting with the conversation
            const content: any[] = [];

            // Add the conversation as text
            const prompt = messages.map(msg => 
                `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
            ).join('\n') + '\nAssistant:';
            
            content.push(prompt);

            // Add context file if provided
            if (contextFile && contextFile.uri && contextFile.mimeType) {
                const fileContent = createPartFromUri(contextFile.uri, contextFile.mimeType);
                content.push(fileContent);
                console.log(`Including context file: ${contextFile.displayName}`);
            }

            if (onStream) {
                // For streaming, we'll simulate it by getting the full response
                // and then streaming it character by character
                const response = await this.ai.models.generateContent({
                    model: GEMINI_MODEL_ID,
                    contents: content,
                });
                
                const fullText = response.text || '';
                let currentText = '';
                
                // Simulate streaming by revealing text progressively
                for (let i = 0; i < fullText.length; i++) {
                    currentText += fullText[i];
                    onStream(currentText);
                    // Small delay to simulate streaming
                    await new Promise(resolve => setTimeout(resolve, 20));
                }
                
                return fullText;
            } else {
                // Non-streaming response
                const response = await this.ai.models.generateContent({
                    model: GEMINI_MODEL_ID,
                    contents: content,
                });
                
                return response.text || '';
            }
        } catch (error) {
            console.error('Chat completion error:', error);
            throw new Error(`Failed to get response from Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get all uploaded files
     */
    getUploadedFiles(): UploadedFile[] {
        return Array.from(this.uploadedFiles.values());
    }

    /**
     * Clear uploaded files cache
     */
    clearUploadedFiles(): void {
        this.uploadedFiles.clear();
    }
} 