import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from './types';

// Available Gemini models
export const GEMINI_MODELS = [
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Latest fast and efficient model'
    },
    {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast and efficient model for everyday tasks'
    },
    {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Most capable model for complex reasoning tasks'
    }
];

export type GeminiModel = typeof GEMINI_MODELS[number];

export class GeminiClient {
    private ai: GoogleGenAI;

    constructor(apiKey?: string) {
        // Use provided API key or fall back to environment variable
        const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
        if (!key) {
            throw new Error('Gemini API key is required');
        }
        this.ai = new GoogleGenAI({ apiKey: key });
    }

    /**
     * Send a chat completion request to Gemini
     */
    async chatCompletion(
        messages: ChatMessage[],
        modelId: string,
        onStream?: (content: string) => void
    ): Promise<string> {
        try {
            // Convert messages to a single prompt for now
            // For more complex chat history, we might need to format differently
            const prompt = messages.map(msg => 
                `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
            ).join('\n') + '\nAssistant:';

            if (onStream) {
                // For streaming, we'll simulate it by getting the full response
                // and then streaming it character by character
                const response = await this.ai.models.generateContent({
                    model: modelId,
                    contents: prompt,
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
                    model: modelId,
                    contents: prompt,
                });
                
                return response.text || '';
            }
        } catch (error) {
            console.error('Chat completion error:', error);
            throw new Error(`Failed to get response from Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
} 