import { ChatMessage } from './types';

/**
 * Simplified Gemini client for XRP Code Buddy
 * All AI configuration and teaching guidelines are now handled by the backend
 */
export class GeminiClient {
    private backendUrl: string;

    constructor() {
        this.backendUrl = '/api';
    }

    /**
     * Get the model name for display purposes
     * Note: This now fetches from backend to maintain single source of truth
     */
    async getModelName(): Promise<string> {
        try {
            const response = await fetch(`${this.backendUrl}/model-info`);
            if (response.ok) {
                const data = await response.json();
                return data.model_name || 'XRPCode Buddy';
            }
        } catch (error) {
            console.warn('Failed to fetch model name from backend:', error);
        }
        return 'XRPCode Buddy'; // Fallback
    }

    /**
     * Send a simplified chat request with user message and context
     */
    async chatWithContext(
        userMessage: string,
        conversationHistory: ChatMessage[] = [],
        editorContext: string = '',
        terminalContext: string = '',
        onStream?: (content: string) => void,
        signal?: AbortSignal
    ): Promise<string> {
        try {
            // Check if already aborted
            if (signal?.aborted) {
                throw new DOMException('Request was aborted', 'AbortError');
            }

            // Prepare simplified request payload
            const payload = {
                user_message: userMessage,
                conversation_history: conversationHistory.map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : msg.role,
                    content: msg.content
                })),
                editor_context: editorContext,
                terminal_context: terminalContext
            };

            console.log('Sending simplified chat request to backend');

            const response = await fetch(`${this.backendUrl}/chat`, {
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
                // Handle non-streaming response (though streaming is preferred)
                return await this.handleNonStreamingResponse(response);
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
     * Handle streaming response from the simplified chat endpoint
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
     * Handle non-streaming response (fallback)
     */
    private async handleNonStreamingResponse(response: Response): Promise<string> {
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

    /**
     * Legacy method for backward compatibility
     * @deprecated Use chatWithContext instead
     */
    async chatCompletion(
        messages: ChatMessage[],
        onStream?: (content: string) => void,
        _contextFile?: any, // Ignored - context now handled by backend
        signal?: AbortSignal
    ): Promise<string> {
        console.warn('chatCompletion is deprecated, use chatWithContext instead');
        
        if (messages.length === 0) {
            throw new Error('No messages provided');
        }

        const userMessage = messages[messages.length - 1].content;
        const conversationHistory = messages.slice(0, -1);

        return this.chatWithContext(
            userMessage,
            conversationHistory,
            '', // No editor context in legacy mode
            '', // No terminal context in legacy mode
            onStream,
            signal
        );
    }
}