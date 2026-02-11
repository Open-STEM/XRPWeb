import { ChatMessage } from './types';

export class GeminiClient {
    private backendUrl: string;
    private handshakeToken: string | null = null;

    constructor() {
        this.backendUrl = '/api';
    }

    /**
     * Initializes the security handshake with the backend.
     * Must be called before other requests or internally.
     */
    private async ensureHandshake(): Promise<string> {
        if (this.handshakeToken) return this.handshakeToken;

        try {
            const response = await fetch(`${this.backendUrl}/handshake`);
            if (!response.ok) throw new Error('Handshake failed');
            const data = await response.json();
            this.handshakeToken = data.handshake_token;
            return this.handshakeToken!;
        } catch (error) {
            console.error('Critical Security Error: Could not establish handshake', error);
            throw error;
        }
    }

    private async getHeaders(): Promise<HeadersInit> {
        const token = await this.ensureHandshake();
        return {
            'Content-Type': 'application/json',
            'X-Handshake-Token': token
        };
    }

    async getDocsStatus(sessionId: string): Promise<{ loaded: boolean; uri?: string }> {
        try {
            const response = await fetch(`${this.backendUrl}/docs/status`, {
                method: 'POST',
                headers: await this.getHeaders(),
                body: JSON.stringify({ session_id: sessionId })
            });
            const data = await response.json();
            return { loaded: !!data.loaded, uri: data.uri };
        } catch (error) {
            return { loaded: false };
        }
    }

    async loadDocs(sessionId: string): Promise<{ success: boolean; status: string; uri?: string }> {
        try {
            const response = await fetch(`${this.backendUrl}/docs/load`, {
                method: 'POST',
                headers: await this.getHeaders(),
                body: JSON.stringify({ session_id: sessionId })
            });
            const data = await response.json();
            return { success: !!data.success, status: data.status, uri: data.uri };
        } catch (error) {
            return { success: false, status: 'error' };
        }
    }

    async getModelName(): Promise<string> {
        try {
            const response = await fetch(`${this.backendUrl}/model-info`);
            const data = await response.json();
            return data.model_name || 'XRPCode Buddy';
        } catch {
            return 'XRPCode Buddy';
        }
    }

    async cleanupSession(sessionId: string): Promise<void> {
        try {
            await fetch(`${this.backendUrl}/session/${sessionId}`, {
                method: 'DELETE',
                headers: await this.getHeaders()
            });
        } catch (error) {
            console.warn('Cleanup failed', error);
        }
    }

    async chatWithContext(
        sessionId: string,
        userMessage: string,
        conversationHistory: ChatMessage[] = [],
        editorContext: string = '',
        terminalContext: string = '',
        language: string = 'en',
        onStream?: (content: string) => void,
        signal?: AbortSignal
    ): Promise<string> {
        try {
            const payload = {
                session_id: sessionId,
                user_message: userMessage,
                conversation_history: conversationHistory.map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : msg.role,
                    content: msg.content
                })),
                editor_context: editorContext,
                terminal_context: terminalContext,
                language: language
            };

            const response = await fetch(`${this.backendUrl}/chat`, {
                method: 'POST',
                headers: await this.getHeaders(),
                body: JSON.stringify(payload),
                signal: signal
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Chat request failed');
            }

            return await this.handleStreamingResponse(response, onStream || (() => {}), signal);
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') throw error;
            throw error;
        }
    }

    private async handleStreamingResponse(
        response: Response,
        onStream: (content: string) => void,
        signal?: AbortSignal
    ): Promise<string> {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        let fullContent = '';
        const decoder = new TextDecoder();

        try {
            while (true) {
                if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
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
                        } catch (e) {}
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
        return fullContent;
    }
}