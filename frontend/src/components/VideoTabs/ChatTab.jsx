import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './ChatTab.css';

const ChatTab = ({ video }) => {
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Chat messages ref for auto-scroll
  const chatMessagesRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // Send message to chatbot with streaming
  const sendChatMessage = async () => {
    if (!currentMessage.trim() || chatLoading || !video) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setChatLoading(true);

    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newUserMessage]);

    // Create a placeholder bot message for streaming
    const botMessageId = Date.now() + 1;
    const botMessage = {
      id: botMessageId,
      type: 'bot',
      content: '',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, botMessage]);

    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/summary-chatbot/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          video_uuid: video.uuid_video,
          user_message: userMessage
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          setChatLoading(false);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix
            if (data.trim() === '[DONE]') {
              setChatLoading(false);
              break;
            } else if (data.trim() && !data.startsWith('[Error:')) {
              // Update the bot message content by appending new text
              setChatMessages(prev => 
                prev.map(msg => 
                  msg.id === botMessageId 
                    ? { ...msg, content: msg.content + data }
                    : msg
                )
              );
            } else if (data.startsWith('[Error:')) {
              // Handle error messages
              setChatMessages(prev => 
                prev.map(msg => 
                  msg.id === botMessageId 
                    ? { ...msg, content: msg.content + data }
                    : msg
                )
              );
              setChatLoading(false);
              break;
            }
          }
        }
      }

    } catch (error) {
      console.error('Error with streaming chat:', error);
      setChatLoading(false);
      
      // Update with error message
      setChatMessages(prev => 
        prev.map(msg => 
          msg.id === botMessageId
            ? { ...msg, content: msg.content || 'Sorry, there was an error processing your message. Please try again.' }
            : msg
        )
      );
    }
  };

  // Handle Enter key press in chat input
  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  // Reset chat when video changes
  useEffect(() => {
    setChatMessages([]);
    setCurrentMessage('');
    setChatLoading(false);
  }, [video?.uuid_video]);

  return (
    <div className="chat-container">
      {!video?.summary ? (
        <div className="chat-empty-state">
          <div className="empty-icon">💬</div>
          <h3 className="empty-title">Chat unavailable</h3>
          <p className="empty-description">
            Video summary must be generated first to enable chat functionality.
          </p>
        </div>
      ) : (
        <>
          {/* Messages Area */}
          <div className="chat-messages" ref={chatMessagesRef}>
            {chatMessages.length === 0 ? (
              <div className="chat-welcome">
                <h3 className="welcome-title">Ask me anything about this video</h3>
              </div>
            ) : (
              <div className="messages-list">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`message ${message.type}`}>
                    <div className="message-avatar">
                      {message.type === 'user' ? (
                        <div className="user-avatar">You</div>
                      ) : (
                        <div className="bot-avatar">🤖</div>
                      )}
                    </div>
                    <div className="message-content">
                      {message.type === 'bot' ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            // Headings
                            h1: ({ children }) => (
                              <h1 className="text-lg font-semibold text-white mb-3 mt-4">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-base font-semibold text-white mb-2 mt-3">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-base font-medium text-white mb-2 mt-3">
                                {children}
                              </h3>
                            ),
                            
                            // Paragraphs
                            p: ({ children }) => (
                              <p className="text-gray-200 leading-relaxed mb-3">
                                {children}
                              </p>
                            ),
                            
                            // Lists
                            ul: ({ children }) => (
                              <ul className="list-none space-y-1 mb-3 ml-4">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside space-y-1 mb-3 ml-4 text-gray-200">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="flex items-start gap-2 text-gray-200">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                                <span>{children}</span>
                              </li>
                            ),
                            
                            // Code
                            code: ({ node, inline, className, children, ...props }) => {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <div className="my-3">
                                  <SyntaxHighlighter
                                    style={tomorrow}
                                    language={match[1]}
                                    PreTag="div"
                                    className="rounded-lg text-sm"
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code 
                                  className="bg-gray-700/60 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono"
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                            
                            // Blockquotes
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-3 border-blue-400/50 bg-blue-400/10 pl-3 py-2 my-3 text-gray-200">
                                {children}
                              </blockquote>
                            ),
                            
                            // Links
                            a: ({ href, children }) => (
                              <a 
                                href={href} 
                                className="text-blue-400 hover:text-blue-300 underline transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                            
                            // Emphasis
                            strong: ({ children }) => (
                              <strong className="font-semibold text-white">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-gray-300">
                                {children}
                              </em>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="user-message-text">{message.content}</div>
                      )}
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="message bot">
                    <div className="message-avatar">
                      <div className="bot-avatar">🤖</div>
                    </div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className="chat-input-area">
            <div className="input-container">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleChatKeyPress}
                placeholder="Message..."
                className="chat-input"
                rows="1"
                disabled={chatLoading}
              />
              <button 
                onClick={sendChatMessage}
                disabled={!currentMessage.trim() || chatLoading}
                className="send-button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatTab; 