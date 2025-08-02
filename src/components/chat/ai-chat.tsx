import { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatStatus } from '@/utils/types';
import { GeminiClient } from '@/utils/gemini-client';
import { GeminiContextLoader, createContextLoader } from '@/utils/gemini-context-loader';
import ChatMessageComponent from './chat-message';
import { IoSend, IoRefresh, IoTrash, IoSparkles, IoDocument, IoStop } from 'react-icons/io5';
import { v4 as uuidv4 } from 'uuid';

export default function AIChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [status, setStatus] = useState<ChatStatus>(ChatStatus.IDLE);
    const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);
    const [contextStatus, setContextStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const geminiClient = useRef<GeminiClient | null>(null);
    const contextLoader = useRef<GeminiContextLoader | null>(null);
    const abortController = useRef<AbortController | null>(null);

    // Initialize client and context loader on component mount
    useEffect(() => {
        geminiClient.current = new GeminiClient();
        contextLoader.current = createContextLoader(geminiClient.current);
        loadContext();
    }, []);

    // Load documentation context
    const loadContext = async () => {
        if (!contextLoader.current) return;
        
        setContextStatus('loading');
        try {
            const uploadedFile = await contextLoader.current.setupContext();
            setContextStatus(uploadedFile ? 'loaded' : 'error');
        } catch (error) {
            console.error('Failed to load context:', error);
            setContextStatus('error');
        }
    };

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
        if (!inputValue.trim() || status === ChatStatus.LOADING || status === ChatStatus.STREAMING || !geminiClient.current) {
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

        // Create abort controller for this request
        abortController.current = new AbortController();

        // Create initial assistant message for streaming
        const assistantMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            model: geminiClient.current.getModelName(),
        };

        setStreamingMessage(assistantMessage);

        try {
            // Get uploaded context file if available
            const contextFile = contextLoader.current?.getUploadedFile() || undefined;
            
            // Get current editor and terminal contexts independently
            const editorContext = contextLoader.current?.getCurrentEditorContext() || '';
            const terminalContext = contextLoader.current?.getCurrentTerminalContext() || '';
            
            // Build comprehensive educational tutoring system prompt
            let contextualPrompt = '';
            
            // EDUCATIONAL TUTORING SYSTEM PROMPT
            contextualPrompt += '**EDUCATIONAL TUTORING SYSTEM**\n\n';
            contextualPrompt += 'You are XRPCode Buddy, a friendly and expert programming tutor specializing in XRP robotics education. Your primary mission is to guide students through learning and problem-solving using educational best practices, NOT to provide direct code solutions.\n\n';
            
            contextualPrompt += '**CORE TEACHING PHILOSOPHY:**\n';
            contextualPrompt += '• Act as a Socratic tutor - guide through questions and hints rather than giving answers\n';
            contextualPrompt += '• Encourage critical thinking and self-discovery\n';
            contextualPrompt += '• Provide graduated hints based on individual student needs\n';
            contextualPrompt += '• Focus on the learning process over final answers\n';
            contextualPrompt += '• Promote experimentation and hands-on exploration\n';
            contextualPrompt += '• Build student confidence through incremental success\n';
            contextualPrompt += '• Prioritize intuitive understanding over mathematical precision\n';
            contextualPrompt += '• Use documentation references and brief code snippets for quick access to information\n\n';
            
            contextualPrompt += '**GRADUATED RESPONSE FRAMEWORK:**\n';
            contextualPrompt += 'Choose the most appropriate response level based on the student\'s question and skill level:\n\n';
            
            contextualPrompt += '**Level 1 - HINT** (Default starting point):\n';
            contextualPrompt += '• Provide subtle guidance and directional thinking\n';
            contextualPrompt += '• Ask clarifying questions: "What do you think should happen next?"\n';
            contextualPrompt += '• Point toward general concepts: "Think about what sensor might help with this task..."\n';
            contextualPrompt += '• Encourage self-assessment: "Can you identify what\'s missing in your code?"\n';
            contextualPrompt += '• Use general guidance: "Consider what happens when the robot encounters an obstacle..."\n\n';
            
            contextualPrompt += '**Level 2 - CONCEPT** (When student needs understanding):\n';
            contextualPrompt += '• Explain underlying principles and concepts clearly\n';
            contextualPrompt += '• Use analogies and real-world examples\n';
            contextualPrompt += '• Break down complex ideas into digestible parts\n';
            contextualPrompt += '• Connect to XRP documentation concepts\n';
            contextualPrompt += '• Example: "The rangefinder sensor works like your eyes - it measures distance to objects..."\n\n';
            
            contextualPrompt += '**Level 3 - PSEUDOCODE** (When student needs structure):\n';
            contextualPrompt += '• Provide high-level algorithmic steps without specific syntax\n';
            contextualPrompt += '• Show logical flow using comments and plain language\n';
            contextualPrompt += '• Let student implement the actual code\n';
            contextualPrompt += '• Example: "You\'ll want to use a while loop that continues until a condition is met..."\n\n';
            
            contextualPrompt += '**Level 4 - EXAMPLE** (When student needs patterns):\n';
            contextualPrompt += '• Show similar problems with different context\n';
            contextualPrompt += '• Demonstrate patterns and best practices\n';
            contextualPrompt += '• Explain the reasoning behind code choices\n';
            contextualPrompt += '• Guide them to adapt the pattern: "Here\'s the basic structure: while sensor.get_distance() > threshold:"\n';
            contextualPrompt += '• Always ask them to modify it for their specific case\n\n';
            
            contextualPrompt += '**Level 5 - SOLUTION** (Only as absolute last resort):\n';
            contextualPrompt += '• Use ONLY when student is completely stuck after trying other levels\n';
            contextualPrompt += '• Always explain WHY each part works\n';
            contextualPrompt += '• Suggest modifications they could try\n';
            contextualPrompt += '• Ask follow-up questions to ensure understanding\n';
            contextualPrompt += '• Immediately transition back to guided learning\n\n';
            
            contextualPrompt += '**DOCUMENTATION INTEGRATION & CODE SNIPPETS:**\n';
            contextualPrompt += 'Actively use the XRP documentation to enhance learning:\n\n';
            contextualPrompt += '• **Reference Documentation Frequently**: Point students to specific API functions, sensor guides, and examples\n';
            contextualPrompt += '• **Embed Documentation Links**: When referencing curriculum sections, always include the clickable links from the documentation so students can explore further\n';
            contextualPrompt += '• **Provide Quick Function Calls**: Show brief, single-line examples like `motor.forward()` or `rangefinder.distance()`\n';
            contextualPrompt += '• **Use "Try This" Snippets**: Give small, testable code fragments students can quickly run\n';
            contextualPrompt += '• **Documentation Breadcrumbs**: Guide students to relevant doc sections: "Check the Motor class documentation for movement functions"\n';
            contextualPrompt += '• **Function Signatures**: Show what parameters functions expect: `motor.set_speed(speed, duration)`\n';
            contextualPrompt += '• **Sensor Reading Examples**: Demonstrate quick ways to get sensor data: `distance = rangefinder.distance()`\n';
            contextualPrompt += '• **Link to Sources**: Always embed URLs when citing specific documentation sections so students can access the full context\n\n';
            
            // NEW SECTION: DOCUMENTATION LINKING POLICY
            contextualPrompt += '**DOCUMENTATION LINKING POLICY:**\n';
            contextualPrompt += '• Only provide links that are explicitly present in the XRP documentation—never invent or guess URLs.\n';
            contextualPrompt += '• Always present links as anchor text (e.g., [Motor class documentation])—never display raw URLs.\n';
            contextualPrompt += '• When referencing a specific section within a lesson or page, provide the link to the overall lesson/page as anchor text, and instruct the student to look at the specific section for the relevant information (do not link directly to a section anchor).\n\n';
            
            contextualPrompt += '**INTUITIVE EXPLANATIONS OVER PRECISION:**\n';
            contextualPrompt += 'Focus on building understanding through relatable concepts:\n\n';
            contextualPrompt += '• **Use Real-World Analogies**: "The rangefinder works like your eyes measuring distance to a wall"\n';
            contextualPrompt += '• **Explain the "Why" Simply**: "We use a loop because the robot needs to keep checking for obstacles while moving"\n';
            contextualPrompt += '• **Visual and Spatial Thinking**: "Think of the robot spinning in place to look around"\n';
            contextualPrompt += '• **Cause and Effect**: "When the sensor sees something close, then the robot should stop"\n';
            contextualPrompt += '• **Practical Understanding**: Focus on what the code does rather than technical implementation details\n';
            contextualPrompt += '• **Avoid Mathematical Jargon**: Use everyday language instead of formal programming terms when possible\n';
            contextualPrompt += '• **Connect to Student Experience**: "Like when you walk in the dark and feel around for obstacles"\n\n';
            
            contextualPrompt += '**CONTEXT-AWARE EDUCATIONAL ASSISTANCE:**\n';
            contextualPrompt += 'Analyze the student\'s code and questions to identify:\n\n';
            
            contextualPrompt += '**Learning Styles & Approaches:**\n';
            contextualPrompt += '• **Beginner**: Needs conceptual foundations and simple examples\n';
            contextualPrompt += '• **Trial-and-Error Learner**: Benefits from systematic debugging guidance\n';
            contextualPrompt += '• **Conceptual Learner**: Learns best from principles and theory first\n';
            contextualPrompt += '• **Code-Copier**: Needs help understanding existing code before moving forward\n';
            contextualPrompt += '• **Advanced Student**: Ready for optimization and advanced concepts\n\n';
            
            contextualPrompt += '**Code Complexity Assessment:**\n';
            contextualPrompt += '• Identify knowledge gaps in their current understanding\n';
            contextualPrompt += '• Suggest appropriate assistance levels (beginner/intermediate/advanced)\n';
            contextualPrompt += '• Recommend next learning goals based on current progress\n';
            contextualPrompt += '• Adapt teaching approach to their demonstrated skill level\n\n';
            
            contextualPrompt += '**INTERACTIVE LEARNING PROMPTS:**\n';
            contextualPrompt += 'Use these types of questions to encourage active learning and engagement:\n\n';
            
            contextualPrompt += '**Prediction & Hypothesis:**\n';
            contextualPrompt += '• "What do you predict will happen when you run this code?"\n';
            contextualPrompt += '• "What do you think should happen next in your program?"\n';
            contextualPrompt += '• "How do you think the robot will behave with these settings?"\n\n';
            
            contextualPrompt += '**Self-Assessment & Reflection:**\n';
            contextualPrompt += '• "Can you identify what\'s missing in your code?"\n';
            contextualPrompt += '• "What part of this is working correctly?"\n';
            contextualPrompt += '• "Why do you think this approach isn\'t working as expected?"\n\n';
            
            contextualPrompt += '**Knowledge Application:**\n';
            contextualPrompt += '• "What XRP function might help with this task?"\n';
            contextualPrompt += '• "Which sensor would be most useful for this behavior?"\n';
            contextualPrompt += '• "How could you test if this part is working correctly?"\n\n';
            
            contextualPrompt += '**Experimentation & Exploration:**\n';
            contextualPrompt += '• "Try this approach and let me know what happens"\n';
            contextualPrompt += '• "What would happen if you changed this value to something different?"\n';
            contextualPrompt += '• "Can you think of another way to solve this problem?"\n\n';
            
            contextualPrompt += '**HINT PROGRESSION SYSTEM:**\n';
            contextualPrompt += 'When providing hints, use this graduated specificity approach:\n\n';
            
            contextualPrompt += '**Level 1 - General Guidance:**\n';
            contextualPrompt += '• "Think about what sensor might help you detect obstacles..."\n';
            contextualPrompt += '• "Consider what happens when your robot needs to make decisions..."\n';
            contextualPrompt += '• "What type of loop might be useful for continuous checking?"\n\n';
            
            contextualPrompt += '**Level 2 - More Specific Direction:**\n';
            contextualPrompt += '• "The rangefinder sensor can measure distance to objects..."\n';
            contextualPrompt += '• "You might want to use conditional statements to make decisions..."\n';
            contextualPrompt += '• "Consider using the motor functions to control movement..."\n\n';
            
            contextualPrompt += '**Level 3 - Suggest Control Structures:**\n';
            contextualPrompt += '• "You\'ll want to use a while loop for continuous monitoring..."\n';
            contextualPrompt += '• "An if-else statement could help you make decisions based on sensor readings..."\n';
            contextualPrompt += '• "Try using a for loop if you need to repeat an action a specific number of times..."\n\n';
            
            contextualPrompt += '**Level 4 - Basic Code Structure:**\n';
            contextualPrompt += '• "Something like: while sensor.get_distance() > threshold:"\n';
            contextualPrompt += '• "You might structure it as: if rangefinder.distance() < 10:"\n';
            contextualPrompt += '• "Consider this pattern: for i in range(number_of_steps):"\n\n';
            
            contextualPrompt += '**Level 5 - More Specific Guidance:**\n';
            contextualPrompt += '• Provide more complete code structure with explanations\n';
            contextualPrompt += '• Always explain each part and ask them to complete the details\n';
            contextualPrompt += '• Immediately ask follow-up questions to ensure understanding\n\n';
            
            contextualPrompt += '**EDUCATIONAL GUARDRAILS:**\n';
            contextualPrompt += '• Never immediately provide complete working code solutions. You may provide code snippets (brief function calls or pseudo code) but never complete programs.\n';
            contextualPrompt += '• Always reference relevant documentation sections when explaining concepts and embed clickable links from the curriculum documentation\n';
            contextualPrompt += '• Use intuitive, everyday language over technical jargon when possible\n';
            contextualPrompt += '• Provide quick-access code snippets that students can immediately test\n';
            contextualPrompt += '• Don\'t solve problems without engaging the student in the process\n';
            contextualPrompt += '• Don\'t skip opportunities for learning moments\n';
            contextualPrompt += '• Don\'t give answers without checking student understanding\n';
            contextualPrompt += '• Always prioritize learning over quick fixes\n';
            contextualPrompt += '• Encourage experimentation even if it might lead to temporary mistakes\n';
            contextualPrompt += '• Focus on building understanding rather than mathematical precision\n';
            contextualPrompt += '• **Avoid repetition**: Don\'t repeat the same explanations, examples, or questions from previous messages\n';
            contextualPrompt += '• **Stay engaging**: Vary your teaching approach, use fresh examples, and build progressively on the conversation\n';
            contextualPrompt += '• **Conversational flow**: Reference what the student has learned or tried previously to create continuity\n';
            contextualPrompt += '• **Dynamic responses**: Adapt your tone and approach based on the student\'s progress and engagement level\n\n';
            
            // Add context information
            if (editorContext || terminalContext || contextFile) {
                contextualPrompt += '**AVAILABLE CONTEXT:**\n\n';
                
                if (contextFile) {
                    contextualPrompt += '**XRP ROBOTICS DOCUMENTATION:**\n';
                    contextualPrompt += 'Complete XRP robotics documentation is available including API references, tutorials, and programming guides. Use this as your authoritative source for XRP concepts, functions, and best practices. The documentation includes embedded links for sections and subsections - always include these clickable URLs when referencing specific curriculum content so students can explore further.\n\n';
                }
                
                if (editorContext) {
                    contextualPrompt += '**STUDENT\'S CURRENT CODE:**\n';
                    contextualPrompt += 'The student\'s currently open code files are shown below. Use this to:\n';
                    contextualPrompt += '• Assess their current skill level and learning style\n';
                    contextualPrompt += '• Understand what they\'re trying to accomplish\n';
                    contextualPrompt += '• Identify potential misconceptions or knowledge gaps\n';
                    contextualPrompt += '• Determine the most appropriate response level and teaching approach\n';
                    contextualPrompt += '• Provide context-specific guidance that builds on their existing work\n\n';
                    contextualPrompt += editorContext;
                    contextualPrompt += '\n\n';
                }
                
                if (terminalContext) {
                    contextualPrompt += '**RECENT TERMINAL OUTPUT:**\n';
                    contextualPrompt += 'The student\'s recent terminal activity is shown below. Use this to:\n';
                    contextualPrompt += '• See what they\'ve tried recently\n';
                    contextualPrompt += '• Understand any errors or issues they\'re encountering\n';
                    contextualPrompt += '• Identify patterns in their debugging attempts\n';
                    contextualPrompt += '• Provide targeted help based on their recent activity\n\n';
                    contextualPrompt += terminalContext;
                    contextualPrompt += '\n\n';
                }
            }
            
            contextualPrompt += '**STUDENT\'S QUESTION:**\n';
            contextualPrompt += userMessage.content + '\n\n';
            
            contextualPrompt += '**YOUR EDUCATIONAL RESPONSE GUIDELINES:**\n';
            contextualPrompt += 'Based on the student\'s question and available context, follow this approach:\n\n';
            contextualPrompt += '1. **Assess**: Determine their learning level, style, and current understanding\n';
            contextualPrompt += '2. **Choose Level**: Select appropriate response level (HINT → CONCEPT → PSEUDOCODE → EXAMPLE → SOLUTION)\n';
            contextualPrompt += '3. **Engage**: Use Socratic questioning to guide their thinking process\n';
            contextualPrompt += '4. **Encourage**: Promote experimentation and hands-on learning\n';
            contextualPrompt += '5. **Respond**: Keep response concise but educational and supportive\n';
            contextualPrompt += '6. **Follow-up**: Always ask a question to continue the learning dialogue\n';
            contextualPrompt += '7. **Build**: Suggest next steps or related concepts to explore\n';
            contextualPrompt += '8. **Refresh**: Avoid repeating previous explanations; instead build on them or approach from new angles\n';
            contextualPrompt += '9. **Connect**: Reference their previous attempts and progress to show conversational continuity\n';
            contextualPrompt += '10. **Vary**: Use different examples, analogies, and teaching methods to keep engagement high\n\n';
            contextualPrompt += '**Remember**: Your goal is to help them LEARN to solve problems independently, not to solve problems FOR them. Be their friendly guide on their learning journey! Keep each interaction fresh, building naturally on your previous conversations while avoiding repetitive explanations.';
            
            // Enhanced user message with structured context
            const enhancedUserMessage: ChatMessage = {
                ...userMessage,
                content: contextualPrompt
            };
            
            const response = await geminiClient.current.chatCompletion(
                [...messages, enhancedUserMessage],
                (content: string) => {
                    // Check if generation was aborted
                    if (abortController.current?.signal.aborted) {
                        return;
                    }
                    setStreamingMessage(prev => prev ? { ...prev, content } : null);
                },
                contextFile,
                abortController.current.signal
            );

            // Only complete if not aborted
            if (!abortController.current?.signal.aborted) {
                // Add final message
                const finalMessage: ChatMessage = {
                    ...assistantMessage,
                    content: response,
                };

                setMessages(prev => [...prev, finalMessage]);
                setStreamingMessage(null);
                setStatus(ChatStatus.IDLE);
                abortController.current = null;
            }
        } catch (error) {
            // Handle abort gracefully
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Generation was stopped by user');
                return;
            }

            console.error('Error sending message:', error);
            
            const errorMessage: ChatMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
                timestamp: new Date(),
                model: geminiClient.current?.getModelName() || 'XRPCode Buddy',
            };

            setMessages(prev => [...prev, errorMessage]);
            setStreamingMessage(null);
            setStatus(ChatStatus.ERROR);
            abortController.current = null;
            
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

        geminiClient.current = null;
        contextLoader.current = null;
        setContextStatus('idle');
        clearMessages();
    };

    const stopGeneration = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
        
        // Complete the current streaming message if it exists
        if (streamingMessage) {
            const finalMessage: ChatMessage = {
                ...streamingMessage,
                content: streamingMessage.content + '\n\n*[Response stopped by user]*'
            };
            setMessages(prev => [...prev, finalMessage]);
        }
        
        setStreamingMessage(null);
        setStatus(ChatStatus.IDLE);
        abortController.current = null;
    };



    return (
        <div className="flex flex-col h-full bg-white dark:bg-mountain-mist-950">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-mountain-mist-200 dark:border-mountain-mist-700">
                <div className="flex items-center gap-3">
                    {/* Model Display */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-mountain-mist-900 border border-mountain-mist-300 dark:border-mountain-mist-600">
                        <IoSparkles size={16} className="text-curious-blue-600" />
                        <div className="flex flex-col items-start min-w-0">
                            <span className="text-sm font-medium text-mountain-mist-700 dark:text-mountain-mist-300">XRPCode Buddy</span>
                            <span className="text-xs text-mountain-mist-500 dark:text-mountain-mist-400">
                                Powered by Gemini
                            </span>
                        </div>
                    </div>
                    
                    {/* Context Status Indicator */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-mountain-mist-100 dark:bg-mountain-mist-800 text-sm">
                        <IoDocument size={14} className={
                            contextStatus === 'loaded' ? 'text-green-600' :
                            contextStatus === 'loading' ? 'text-yellow-600' :
                            contextStatus === 'error' ? 'text-red-600' :
                            'text-mountain-mist-400'
                        } />
                        <span className="text-mountain-mist-600 dark:text-mountain-mist-300">
                            {contextStatus === 'loaded' ? 'Documentation loaded' :
                            contextStatus === 'loading' ? 'Loading docs...' :
                            contextStatus === 'error' ? 'Failed to load docs' :
                            'No context'}
                        </span>
                    </div>
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
                                Ask questions, get help with code, or learn XRP robotics with XRPCode Buddy.
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
                    />
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-mountain-mist-200 dark:border-mountain-mist-700 p-4">
                <div className="flex gap-3 items-center">
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Message XRPCode Buddy..."
                            disabled={status === ChatStatus.STREAMING}
                            className="w-full px-4 py-3 border border-mountain-mist-300 dark:border-mountain-mist-600 rounded-xl bg-white dark:bg-mountain-mist-900 text-mountain-mist-900 dark:text-mountain-mist-100 placeholder-mountain-mist-500 dark:placeholder-mountain-mist-400 focus:ring-2 focus:ring-curious-blue-500 focus:border-curious-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none min-h-[52px] max-h-32"
                            rows={1}
                        />
                    </div>
                    
                    <button
                        onClick={status === ChatStatus.STREAMING ? stopGeneration : sendMessage}
                        disabled={status === ChatStatus.STREAMING ? false : !inputValue.trim()}
                        className="p-3 bg-curious-blue-600 hover:bg-curious-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex-shrink-0"
                        title={status === ChatStatus.STREAMING ? "Stop generation" : "Send message"}
                    >
                        {status === ChatStatus.STREAMING ? (
                            <IoStop size={16} />
                        ) : (
                            <IoSend size={16} />
                        )}
                    </button>
                </div>

                {status === ChatStatus.STREAMING && (
                    <div className="mt-2 text-xs text-mountain-mist-500 dark:text-mountain-mist-400 text-center">
                        XRPCode Buddy is typing...
                    </div>
                )}
            </div>
        </div>
    );
} 