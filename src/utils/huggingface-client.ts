import { InferenceClient } from '@huggingface/inference';
import { ChatMessage, ChatModel, ChatProvider } from './types';

// Available models and providers based on Hugging Face's current offerings
export const CHAT_PROVIDERS: ChatProvider[] = [
    {
        id: 'cerebras',
        name: 'Cerebras',
        models: [
            {
                id: 'llama3.3-70b',
                name: 'Llama 3.3 70B',
                provider: 'cerebras',
                description: 'Fast and capable model for everyday use'
            },
            {
                id: 'llama3.1-8b',
                name: 'Llama 3.1 8B',
                provider: 'cerebras',
                description: 'Smaller, faster model for quick responses'
            }
        ]
    },
    {
        id: 'together',
        name: 'Together AI',
        models: [
            {
                id: 'meta-llama/Llama-3.3-70B-Instruct',
                name: 'Llama 3.3 70B Instruct',
                provider: 'together',
                description: 'Latest Llama model with excellent instruction following'
            },
            {
                id: 'Qwen/Qwen2.5-72B-Instruct',
                name: 'Qwen 2.5 72B',
                provider: 'together',
                description: 'Advanced model with strong reasoning capabilities'
            }
        ]
    },
    {
        id: 'cohere',
        name: 'Cohere',
        models: [
            {
                id: 'command-r-plus',
                name: 'Command R+',
                provider: 'cohere',
                description: 'Optimized for conversational interaction and tool use'
            }
        ]
    },
    {
        id: 'novita',
        name: 'Novita AI',
        models: [
            {
                id: 'deepseek-ai/DeepSeek-V3-0324',
                name: 'DeepSeek V3',
                provider: 'novita',
                description: 'Advanced reasoning model'
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
                    provider: model.provider as any,
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
                    provider: model.provider as any,
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