import { ChatMessage } from './types';

// Hardcoded model - only using Gemini 2.5 Flash
const GEMINI_MODEL_ID = 'gemini-2.5-flash';
const GEMINI_MODEL_NAME = 'XRPCode Buddy';

export interface UploadedFile {
    uri: string;
    mimeType: string;
    displayName: string;
}

export class GeminiClient {
    private uploadedFiles: Map<string, UploadedFile> = new Map();
    private backendUrl: string;

    constructor(apiKey?: string) {
        // Use FastAPI backend proxy instead of direct Gemini API calls
        this.backendUrl = '/api';
        // Note: apiKey parameter maintained for backward compatibility but not used
        // The backend handles API key management securely
    }

    /**
     * Get the model name for display purposes
     */
    getModelName(): string {
        return GEMINI_MODEL_NAME;
    }

    /**
     * Upload a markdown file via FastAPI backend
     */
    async uploadMarkdownFile(content: string, displayName: string): Promise<UploadedFile> {
        try {
            // Check if file is already uploaded
            const cacheKey = `${displayName}_${content.length}`;
            if (this.uploadedFiles.has(cacheKey)) {
                return this.uploadedFiles.get(cacheKey)!;
            }

            // Create form data for upload
            const formData = new FormData();
            const fileBlob = new Blob([content], { type: 'text/markdown' });
            formData.append('file', fileBlob, `${displayName}.md`);
            formData.append('display_name', displayName);

            const response = await fetch(`${this.backendUrl}/gemini/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Upload failed: ${errorData.detail || response.statusText}`);
            }

            const uploadedFile: UploadedFile = await response.json();

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
     * Send a chat completion request via FastAPI backend
     */
    async chatCompletion(
        messages: ChatMessage[],
        onStream?: (content: string) => void,
        contextFile?: UploadedFile,
        signal?: AbortSignal
    ): Promise<string> {
        try {
            // Check if already aborted
            if (signal?.aborted) {
                throw new DOMException('Request was aborted', 'AbortError');
            }

            // Prepare request payload
            const payload = {
                messages: messages.map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : msg.role,
                    content: msg.content
                })),
                files: contextFile ? [contextFile.uri] : []
            };

            console.log('Sending chat request to backend:', payload);

            const response = await fetch(`${this.backendUrl}/gemini/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: signal
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Chat request failed: ${errorData.detail || response.statusText}`);
            }

            if (onStream) {
                // Handle streaming response
                return await this.handleStreamingResponse(response, onStream, signal);
            } else {
                // Handle non-streaming response
                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error('No response body available');
                }

                let fullContent = '';
                const decoder = new TextDecoder();

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const data = JSON.parse(line.substring(6));
                                    if (data.type === 'content') {
                                        fullContent += data.content;
                                    } else if (data.type === 'error') {
                                        throw new Error(data.error);
                                    }
                                } catch (parseError) {
                                    console.warn('Failed to parse streaming data:', parseError);
                                }
                            }
                        }
                    }
                } finally {
                    reader.releaseLock();
                }

                return fullContent;
            }
        } catch (error) {
            // Re-throw abort errors as-is
            if (error instanceof DOMException && error.name === 'AbortError') {
                throw error;
            }
            
            console.error('Chat completion error:', error);
            throw new Error(`Failed to get response from backend: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle streaming response from FastAPI backend
     */
    private async handleStreamingResponse(
        response: Response,
        onStream: (content: string) => void,
        signal?: AbortSignal
    ): Promise<string> {
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body available');
        }

        let fullContent = '';
        const decoder = new TextDecoder();

        try {
            while (true) {
                // Check for abortion
                if (signal?.aborted) {
                    throw new DOMException('Request was aborted', 'AbortError');
                }

                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.type === 'content') {
                                fullContent += data.content;
                                onStream(fullContent);
                            } else if (data.type === 'error') {
                                throw new Error(data.error);
                            } else if (data.type === 'done') {
                                return fullContent;
                            }
                        } catch (parseError) {
                            console.warn('Failed to parse streaming data:', parseError);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        return fullContent;
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