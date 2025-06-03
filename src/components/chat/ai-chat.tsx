import { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatModel, ChatStatus } from '@/utils/types';
import { HuggingFaceClient, CHAT_PROVIDERS } from '@/utils/huggingface-client';
import ChatMessageComponent from './chat-message';
import ModelSelector from './model-selector';
import { IoSend, IoRefresh, IoTrash, IoSparkles } from 'react-icons/io5';
import { v4 as uuidv4 } from 'uuid';

export default function AIChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [status, setStatus] = useState<ChatStatus>(ChatStatus.IDLE);
    const [selectedModel, setSelectedModel] = useState<ChatModel>(CHAT_PROVIDERS[0].models[0]);
    const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);
    const [apiKey, setApiKey] = useState<string>('');
    const [showApiKeyInput, setShowApiKeyInput] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const hfClient = useRef<HuggingFaceClient | null>(null);

    // Initialize client when API key is provided
    useEffect(() => {
        if (apiKey.trim()) {
            hfClient.current = new HuggingFaceClient(apiKey);
            setShowApiKeyInput(false);
        }
    }, [apiKey]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingMessage]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);

    const sendMessage = async () => {
        if (!inputValue.trim() || status === ChatStatus.LOADING || status === ChatStatus.STREAMING || !hfClient.current) {
            return;
        }

        const userMessage: ChatMessage = {
            id: uuidv4(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setStatus(ChatStatus.STREAMING);

        // Create initial assistant message for streaming
        const assistantMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            model: selectedModel.name,
            provider: selectedModel.provider,
        };

        setStreamingMessage(assistantMessage);

        try {
            const response = await hfClient.current.chatCompletion(
                [...messages, userMessage],
                selectedModel,
                (content: string) => {
                    setStreamingMessage(prev => prev ? { ...prev, content } : null);
                }
            );

            // Add final message
            const finalMessage: ChatMessage = {
                ...assistantMessage,
                content: response,
            };

            setMessages(prev => [...prev, finalMessage]);
            setStreamingMessage(null);
            setStatus(ChatStatus.IDLE);
        } catch (error) {
            console.error('Error sending message:', error);
            
            const errorMessage: ChatMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
                timestamp: new Date(),
                model: selectedModel.name,
                provider: selectedModel.provider,
            };

            setMessages(prev => [...prev, errorMessage]);
            setStreamingMessage(null);
            setStatus(ChatStatus.ERROR);
            
            // Reset to idle after 3 seconds
            setTimeout(() => setStatus(ChatStatus.IDLE), 3000);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearMessages = () => {
        setMessages([]);
        setStreamingMessage(null);
        setStatus(ChatStatus.IDLE);
    };

    const resetConnection = () => {
        setApiKey('');
        setShowApiKeyInput(true);
        hfClient.current = null;
        clearMessages();
    };

    if (showApiKeyInput) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="max-w-md w-full space-y-6">
                        <div className="text-center">
                            <IoSparkles size={48} className="mx-auto text-curious-blue-600 mb-4" />
                            <h2 className="text-2xl font-bold text-mountain-mist-900 dark:text-mountain-mist-100 mb-2">
                                AI Chat
                            </h2>
                            <p className="text-mountain-mist-600 dark:text-mountain-mist-400">
                                Enter your Hugging Face API key to start chatting with AI models.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-mountain-mist-700 dark:text-mountain-mist-300 mb-2">
                                    Hugging Face API Key
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    className="w-full px-3 py-2 border border-mountain-mist-300 dark:border-mountain-mist-600 rounded-lg bg-white dark:bg-mountain-mist-900 text-mountain-mist-900 dark:text-mountain-mist-100 focus:ring-2 focus:ring-curious-blue-500 focus:border-curious-blue-500"
                                />
                            </div>
                            
                            <button
                                onClick={() => apiKey.trim() && setApiKey(apiKey)}
                                disabled={!apiKey.trim()}
                                className="w-full bg-curious-blue-600 hover:bg-curious-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Connect
                            </button>

                            <div className="text-xs text-mountain-mist-500 dark:text-mountain-mist-400 text-center">
                                Get your free API key at{' '}
                                <a 
                                    href="https://huggingface.co/settings/tokens" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-curious-blue-600 hover:underline"
                                >
                                    huggingface.co/settings/tokens
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-mountain-mist-950">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-mountain-mist-200 dark:border-mountain-mist-700">
                <div className="flex items-center gap-3">
                    <ModelSelector
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                        disabled={status === ChatStatus.STREAMING}
                    />
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={clearMessages}
                        disabled={messages.length === 0 || status === ChatStatus.STREAMING}
                        className="p-2 text-mountain-mist-500 hover:text-mountain-mist-700 dark:text-mountain-mist-400 dark:hover:text-mountain-mist-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Clear messages"
                    >
                        <IoTrash size={16} />
                    </button>
                    
                    <button
                        onClick={resetConnection}
                        className="p-2 text-mountain-mist-500 hover:text-mountain-mist-700 dark:text-mountain-mist-400 dark:hover:text-mountain-mist-200 transition-colors"
                        title="Reset connection"
                    >
                        <IoRefresh size={16} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !streamingMessage && (
                    <div className="flex items-center justify-center h-full text-center">
                        <div className="max-w-md">
                            <IoSparkles size={48} className="mx-auto text-mountain-mist-400 mb-4" />
                            <h3 className="text-lg font-semibold text-mountain-mist-700 dark:text-mountain-mist-300 mb-2">
                                Start a conversation
                            </h3>
                            <p className="text-mountain-mist-500 dark:text-mountain-mist-400">
                                Ask questions, get help with code, or chat about anything with {selectedModel.name}.
                            </p>
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <ChatMessageComponent key={message.id} message={message} />
                ))}

                {streamingMessage && (
                    <ChatMessageComponent 
                        message={streamingMessage} 
                        isStreaming={true}
                    />
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-mountain-mist-200 dark:border-mountain-mist-700 p-4">
                <div className="flex gap-3 items-end">
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={`Message ${selectedModel.name}...`}
                            disabled={status === ChatStatus.STREAMING}
                            className="w-full px-4 py-3 pr-12 border border-mountain-mist-300 dark:border-mountain-mist-600 rounded-xl bg-white dark:bg-mountain-mist-900 text-mountain-mist-900 dark:text-mountain-mist-100 placeholder-mountain-mist-500 dark:placeholder-mountain-mist-400 focus:ring-2 focus:ring-curious-blue-500 focus:border-curious-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none min-h-[52px] max-h-32"
                            rows={1}
                        />
                    </div>
                    
                    <button
                        onClick={sendMessage}
                        disabled={!inputValue.trim() || status === ChatStatus.STREAMING}
                        className="p-3 bg-curious-blue-600 hover:bg-curious-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                    >
                        <IoSend size={16} />
                    </button>
                </div>

                {status === ChatStatus.STREAMING && (
                    <div className="mt-2 text-xs text-mountain-mist-500 dark:text-mountain-mist-400">
                        {selectedModel.name} is typing...
                    </div>
                )}
            </div>
        </div>
    );
} 