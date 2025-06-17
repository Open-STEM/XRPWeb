import React from 'react';
import { Message } from '../../utils/types';
import MarkdownIt from 'markdown-it';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItDeflist from 'markdown-it-deflist';
import markdownItAbbr from 'markdown-it-abbr';

interface ChatMessageProps {
  message: Message;
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
})
  .use(markdownItFootnote)
  .use(markdownItDeflist)
  .use(markdownItAbbr);

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div className={`mb-4 ${message.role === 'user' ? 'ml-8' : 'mr-8'}`}>
      {/* Message Header */}
      <div className={`flex items-center mb-1 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex items-center gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            message.role === 'user' 
              ? 'bg-curious-blue-500 text-white' 
              : 'bg-mountain-mist-200 text-mountain-mist-800'
          }`}>
            {message.role === 'user' ? 'U' : 'AI'}
          </div>
          <span className="text-xs font-medium text-mountain-mist-600">
            {message.role === 'user' ? 'You' : 'AI Assistant'}
          </span>
          <span className="text-xs text-mountain-mist-400">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
      
      {/* Message Content */}
      <div className={`${message.role === 'user' ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block max-w-full rounded-xl px-3 py-2 ${
          message.role === 'user'
            ? 'bg-curious-blue-500 text-white'
            : 'bg-mountain-mist-50 border border-mountain-mist-200'
        }`}>
          {message.role === 'user' ? (
            <div className="whitespace-pre-wrap text-white text-sm">
              {message.content}
            </div>
          ) : (
            <div 
              className="prose prose-sm max-w-none dark:prose-invert
                prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2
                prose-h1:text-curious-blue-600 prose-h1:text-lg prose-h1:mt-0 prose-h1:mb-2
                prose-h2:text-curious-blue-700 prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2
                prose-h3:text-curious-blue-800 prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1
                prose-p:text-mountain-mist-800 prose-p:leading-relaxed prose-p:my-2 prose-p:text-sm
                prose-a:text-curious-blue-600 prose-a:no-underline hover:prose-a:text-curious-blue-700 hover:prose-a:underline
                prose-strong:text-mountain-mist-900 prose-strong:font-semibold
                prose-em:text-mountain-mist-700
                prose-code:text-curious-blue-700 prose-code:bg-curious-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-medium prose-code:border prose-code:border-curious-blue-200
                prose-pre:bg-mountain-mist-900 prose-pre:text-mountain-mist-50 prose-pre:border prose-pre:border-mountain-mist-300 prose-pre:rounded-lg prose-pre:shadow-sm prose-pre:p-3 prose-pre:my-3
                prose-blockquote:border-l-curious-blue-300 prose-blockquote:bg-curious-blue-50 prose-blockquote:text-curious-blue-900 prose-blockquote:rounded-r prose-blockquote:shadow-sm prose-blockquote:my-3 prose-blockquote:py-2 prose-blockquote:px-3
                prose-ul:my-3 prose-ol:my-3 prose-ul:pl-4 prose-ol:pl-4
                prose-li:text-mountain-mist-800 prose-li:my-0.5 prose-li:text-sm
                prose-table:border prose-table:border-mountain-mist-300 prose-table:rounded-lg prose-table:overflow-hidden prose-table:my-3
                prose-th:bg-curious-blue-100 prose-th:text-curious-blue-900 prose-th:font-semibold prose-th:border-b prose-th:border-curious-blue-300 prose-th:px-3 prose-th:py-2 prose-th:text-xs
                prose-td:bg-white prose-td:text-mountain-mist-800 prose-td:border-b prose-td:border-mountain-mist-200 prose-td:px-3 prose-td:py-2 prose-td:text-xs
                prose-hr:border-mountain-mist-300 prose-hr:my-4"
              dangerouslySetInnerHTML={{ __html: md.render(message.content) }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 