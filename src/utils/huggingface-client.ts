import { InferenceClient } from '@huggingface/inference';
import { ChatMessage, ChatModel, ChatProvider } from './types';

// Available models through HF Inference API only
// ONLY FREE TIER models that actually work
export const CHAT_PROVIDERS: ChatProvider[] = [
    {
        id: 'hf-inference',
        name: 'HF Inference',
        models: [
            {
                id: 'meta-llama/Llama-3.3-70B-Instruct',
                name: 'Llama 3.3 70B Instruct',
                provider: 'hf-inference',
                description: ''
            },
            {
                id: 'deepseek-ai/DeepSeek-R1-0528',
                name: 'DeepSeek R1',
                provider: 'hf-inference',
                description: ''
            },
            {
                id: 'microsoft/phi-4',
                name: 'Phi-4',
                provider: 'hf-inference',
                description: ''
            }, 
            {
                id: 'google/gemma-3-27b-it',
                name: 'Gemma3 27B',
                provider: 'hf-inference',
                description: ''
            }
        ]
    }
];

export class HuggingFaceClient {
    private client: InferenceClient;

    constructor(apiKey?: string) {
        // Use provided API key or fall back to environment variable
        this.client = new InferenceClient(
            apiKey || import.meta.env.VITE_HF_API_KEY || 'hf_placeholder'
        );
    }

    /**
     * Send a chat completion request to Hugging Face
     */
    async chatCompletion(
        messages: ChatMessage[],
        model: ChatModel,
        onStream?: (content: string) => void
    ): Promise<string> {
        try {
            const formattedMessages = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            if (onStream) {
                // Streaming response
                let fullContent = '';
                const stream = this.client.chatCompletionStream({
                    model: model.id,
                    messages: formattedMessages,
                    max_tokens: 1000,
                    temperature: 0.7,
                });

                for await (const chunk of stream) {
                    if (chunk.choices && chunk.choices.length > 0) {
                        const content = chunk.choices[0].delta?.content || '';
                        if (content) {
                            fullContent += content;
                            onStream(fullContent);
                        }
                    }
                }

                return fullContent;
            } else {
                // Non-streaming response
                const response = await this.client.chatCompletion({
                    model: model.id,
                    messages: formattedMessages,
                    max_tokens: 1000,
                    temperature: 0.7,
                });

                return response.choices[0]?.message?.content || '';
            }
        } catch (error) {
            console.error('Chat completion error:', error);
            throw new Error(`Failed to get response from ${model.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get all available models
     */
    getAvailableModels(): ChatModel[] {
        return CHAT_PROVIDERS.flatMap(provider => provider.models);
    }

    /**
     * Get models by provider
     */
    getModelsByProvider(providerId: string): ChatModel[] {
        const provider = CHAT_PROVIDERS.find(p => p.id === providerId);
        return provider ? provider.models : [];
    }

    /**
     * Find a model by ID
     */
    findModel(modelId: string): ChatModel | undefined {
        return this.getAvailableModels().find(model => model.id === modelId);
    }
} 