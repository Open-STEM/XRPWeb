import { ChatMessage } from '@/utils/types';
import { IoPersonSharp, IoSparkles } from 'react-icons/io5';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
    message: ChatMessage;
    isStreaming?: boolean;
}

export default function ChatMessageComponent({ message, isStreaming = false }: ChatMessageProps) {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';

    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[80%] gap-2`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isUser 
                        ? 'bg-curious-blue-600 text-white' 
                        : 'bg-mountain-mist-200 dark:bg-mountain-mist-700 text-mountain-mist-700 dark:text-mountain-mist-300'
                }`}>
                    {isUser ? (
                        <IoPersonSharp size={16} />
                    ) : (
                        <IoSparkles size={16} />
                    )}
                </div>

                {/* Message Content */}
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2 rounded-2xl ${
                        isUser
                            ? 'bg-curious-blue-600 text-white'
                            : 'bg-mountain-mist-100 dark:bg-mountain-mist-800 text-mountain-mist-900 dark:text-mountain-mist-100 border border-mountain-mist-200 dark:border-mountain-mist-700'
                    } ${isStreaming ? 'animate-pulse' : ''}`}>
                        <div className="whitespace-pre-wrap break-words">
                            {message.content}
                            {isStreaming && (
                                <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse">|</span>
                            )}
                        </div>
                    </div>

                    {/* Message metadata */}
                    <div className={`flex items-center gap-2 mt-1 text-xs text-mountain-mist-500 dark:text-mountain-mist-400 ${
                        isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                        <span>{formatDistanceToNow(message.timestamp, { addSuffix: true })}</span>
                        {isAssistant && message.model && (
                            <>
                                <span>•</span>
                                <span>{message.model}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 