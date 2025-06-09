import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient, API_ENDPOINTS } from '../config/api';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import MindMap from './MindMap';
import 'katex/dist/katex.min.css';
import './VideoPage.css';

const VideoPage = () => {
  const { videoUuid } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Flashcards state
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [flashcardsError, setFlashcardsError] = useState(null);
  const [flashcardsAttempted, setFlashcardsAttempted] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // MindMap state
  const [mindmapData, setMindmapData] = useState(null);
  const [mindmapLoading, setMindmapLoading] = useState(false);
  const [mindmapError, setMindmapError] = useState(null);
  const [mindmapAttempted, setMindmapAttempted] = useState(false);
  const [mindmapLoadingMessage, setMindmapLoadingMessage] = useState('Loading mindmap...');
  
  // Chat messages ref for auto-scroll
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.video(videoUuid));
        setVideo(response.data);
      } catch (error) {
        console.error('Error fetching video:', error);
        setError('Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    if (videoUuid) {
      fetchVideo();
    }
  }, [videoUuid]);

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
      
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api'}/summary-chatbot/`, {
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

  // Flashcards functions
  const loadFlashcards = useCallback(async () => {
    if (!video || flashcardsAttempted) return;
    
    setFlashcardsLoading(true);
    setFlashcardsError(null);
    setFlashcardsAttempted(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api'}/flashcards/?video_uuid=${video.uuid_video}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFlashcards(data.flashcards || []);
        setCurrentCardIndex(0);
        setShowAnswer(false);
      } else {
        // If flashcards don't exist, that's not an error - just no flashcards yet
        if (response.status === 400) {
          setFlashcardsError(null);
          setFlashcards([]);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load flashcards');
        }
      }
    } catch (error) {
      console.error('Error loading flashcards:', error);
      setFlashcardsError('Failed to load flashcards');
    } finally {
      setFlashcardsLoading(false);
    }
  }, [video, flashcardsAttempted]);

  const generateFlashcards = async () => {
    if (!video) return;
    
    setFlashcardsLoading(true);
    setFlashcardsError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api'}/flashcards/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          video_uuid: video.uuid_video
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFlashcards(data.flashcards || []);
        setCurrentCardIndex(0);
        setShowAnswer(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate flashcards');
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      setFlashcardsError(error.message || 'Failed to generate flashcards');
    } finally {
      setFlashcardsLoading(false);
    }
  };

  const retryLoadFlashcards = () => {
    setFlashcardsAttempted(false);
    setFlashcardsError(null);
    loadFlashcards();
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  // MindMap functions
  const loadMindmap = useCallback(async () => {
    if (!video || mindmapAttempted) return;
    
    setMindmapLoading(true);
    setMindmapError(null);
    setMindmapAttempted(true);
    setMindmapLoadingMessage('Loading existing mindmap...');
    
    try {
      const token = localStorage.getItem('access_token');
      
      // First, try to get existing mindmap
      const getResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api'}/mindmap/?video_uuid=${video.uuid_video}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (getResponse.ok) {
        // Existing mindmap found
        const data = await getResponse.json();
        setMindmapData(data.mindmap);
        setMindmapLoading(false);
        return;
      }

      // If no existing mindmap, generate new one
      if (getResponse.status === 404) {
        setMindmapLoadingMessage('Generating new mindmap...');
        
        const postResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api'}/mindmap/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            video_uuid: video.uuid_video
          })
        });

        if (postResponse.ok) {
          const data = await postResponse.json();
          setMindmapData(data.mindmap);
        } else {
          const errorData = await postResponse.json();
          setMindmapError(errorData.error || 'Failed to generate mindmap');
        }
      } else {
        const errorData = await getResponse.json();
        setMindmapError(errorData.error || 'Failed to load mindmap');
      }
    } catch (error) {
      console.error('Error loading mindmap:', error);
      setMindmapError('Failed to load mindmap. Please try again.');
    } finally {
      setMindmapLoading(false);
    }
  }, [video, mindmapAttempted]);

  const retryLoadMindmap = () => {
    setMindmapAttempted(false);
    loadMindmap();
  };

  // Load mindmap when tab is activated
  useEffect(() => {
    if (activeTab === 'mindmap' && video && !mindmapAttempted && !mindmapLoading) {
      loadMindmap();
    }
  }, [activeTab, video, mindmapAttempted, mindmapLoading, loadMindmap]);

  // Load flashcards when tab is switched to flashcards
  useEffect(() => {
    if (activeTab === 'flashcards' && video && !flashcardsAttempted && !flashcardsLoading) {
      loadFlashcards();
    }
  }, [activeTab, video, flashcardsAttempted, flashcardsLoading, loadFlashcards]);

  // Reset flashcards state when video changes
  useEffect(() => {
    setFlashcardsAttempted(false);
    setFlashcards([]);
    setFlashcardsError(null);
    setCurrentCardIndex(0);
    setShowAnswer(false);
  }, [video?.uuid_video]);

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    
    return '';
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Jump to specific time in video
  const jumpToTime = (startTime) => {
    const iframe = document.querySelector('.video-player iframe');
    if (iframe) {
      const videoId = getYouTubeVideoId(video?.url);
      if (videoId) {
        const newSrc = `https://www.youtube.com/embed/${videoId}?start=${Math.floor(startTime)}&autoplay=1`;
        iframe.src = newSrc;
      }
    }
  };

  // Extract YouTube video ID
  const getYouTubeVideoId = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading video...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(video?.url);

  return (
    <div className="video-page">
      <div className="video-content">
        {/* Video Player Section */}
        <div className="video-player-section">
          {embedUrl ? (
            <div className="video-player">
              <iframe
                src={embedUrl}
                title={video?.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className="video-thumbnail-large">
              <img 
                src={video?.thumbnail} 
                alt={video?.title}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/640x360?text=No+Image';
                }}
              />
              <div className="play-overlay">
                <a href={video?.url} target="_blank" rel="noopener noreferrer" className="play-button">
                  ▶ Watch on YouTube
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Content Tabs */}
        <div className="content-tabs-section">
          <div className="tabs-header">
            <button 
              className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>

            <button 
              className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              AI Chat
            </button>


            <button 
              className={`tab-button ${activeTab === 'flashcards' ? 'active' : ''}`}
              onClick={() => setActiveTab('flashcards')}
            >
              Flashcards
            </button>
            
            
            <button 
              className={`tab-button ${activeTab === 'mindmap' ? 'active' : ''}`}
              onClick={() => setActiveTab('mindmap')}
            >
              Mindmap
            </button>



            <button 
              className={`tab-button ${activeTab === 'transcript' ? 'active' : ''}`}
              onClick={() => setActiveTab('transcript')}
            >
              Transcript
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'summary' && (
              <div className="summary-section">
                {video?.summary ? (
                  <div className="summary-content">
                    <div className="content-header">
                      <h2>Video Summary</h2>
                      <button 
                        className="copy-button"
                        onClick={() => copyToClipboard(video.summary)}
                        title="Copy summary"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <div className="summary-text">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={tomorrow}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {video.summary}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="no-content">
                    <p>No summary available for this video.</p>
                    <small>Summary will be generated automatically when the video is processed.</small>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="transcript-section">
                {video?.timecode_transcript && video.timecode_transcript.length > 0 ? (
                  <div className="transcript-content">
                    <div className="content-header">
                      <h2>Transcript with Timecodes</h2>
                      <button 
                        className="copy-button"
                        onClick={() => copyToClipboard(
                          video.timecode_transcript.map(item => 
                            `[${Math.floor(item.start / 60)}:${(item.start % 60).toFixed(0).padStart(2, '0')}] ${item.text}`
                          ).join('\n')
                        )}
                        title="Copy transcript"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <div className="transcript-text timecode-transcript">
                      {video.timecode_transcript.map((item, index) => {
                        const nextItem = video.timecode_transcript[index + 1];
                        const endTime = nextItem ? nextItem.start : item.start + (item.dur || 5);
                        
                        return (
                          <div 
                            key={index} 
                            className="transcript-line clickable"
                            onClick={() => jumpToTime(item.start)}
                          >
                            <span className="timecode">
                              [{formatTime(item.start)} - {formatTime(endTime)}]
                            </span>
                            <span className="transcript-text-content">{item.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="no-content">
                    <p>No transcript available for this video.</p>
                    <small>Transcript will be generated automatically when the video is processed.</small>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="chat-section">
                
                {!video?.summary ? (
                  <div className="no-content">
                    <p>Chat is not available for this video.</p>
                    <small>Video summary must be generated first to enable chat functionality.</small>
                  </div>
                ) : (
                  <div className="chat-container">
                    <div className="chat-messages" ref={chatMessagesRef}>
                      {chatMessages.length === 0 ? (
                        <div className="chat-welcome">
                          <div className="welcome-message">
                          </div>
                        </div>
                      ) : (
                        chatMessages.map((message) => (
                          <div key={message.id} className={`chat-message ${message.type}`}>
                            <div className="message-content">
                              {message.type === 'bot' ? (
                                <ReactMarkdown
                                  remarkPlugins={[remarkMath]}
                                  rehypePlugins={[rehypeKatex]}
                                  components={{
                                    code({ node, inline, className, children, ...props }) {
                                      const match = /language-(\w+)/.exec(className || '');
                                      return !inline && match ? (
                                        <SyntaxHighlighter
                                          style={tomorrow}
                                          language={match[1]}
                                          PreTag="div"
                                          {...props}
                                        >
                                          {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                      ) : (
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      );
                                    }
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              ) : (
                                <p>{message.content}</p>
                              )}
                            </div>
                            <div className="message-timestamp">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                      
                      {chatLoading && (
                        <div className="chat-message bot">
                          <div className="message-content">
                            <div className="typing-indicator">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="chat-input-container">
                      <div className="chat-input-wrapper">
                        <textarea
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          onKeyPress={handleChatKeyPress}
                          placeholder="Ask a question about this video..."
                          className="chat-input"
                          rows="2"
                          disabled={chatLoading}
                        />
                        <button 
                          onClick={sendChatMessage}
                          disabled={!currentMessage.trim() || chatLoading}
                          className="send-button"
                          title="Send message"
                        >
                          {chatLoading ? '⏳' : '📤'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'flashcards' && (
              <div className="flashcards-section">
                {flashcardsLoading && (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Generating flashcards...</p>
                  </div>
                )}
                
                {flashcardsError && (
                  <div className="no-content">
                    <p>{flashcardsError}</p>
                    <div className="flashcard-buttons">
                      <button 
                        onClick={retryLoadFlashcards}
                        disabled={flashcardsLoading}
                        className="retry-button"
                      >
                        {flashcardsLoading ? 'Loading...' : 'Try Again'}
                      </button>
                      <button 
                        onClick={generateFlashcards}
                        disabled={flashcardsLoading}
                        className="generate-flashcards-button"
                      >
                        {flashcardsLoading ? 'Generating...' : 'Generate New Flashcards'}
                      </button>
                    </div>
                  </div>
                )}
                
                {!flashcardsLoading && !flashcardsError && flashcards.length === 0 && (
                  <div className="no-content">
                    <p>No flashcards available for this video.</p>
                    <button 
                      onClick={generateFlashcards}
                      disabled={flashcardsLoading}
                      className="generate-flashcards-button"
                    >
                      {flashcardsLoading ? 'Generating...' : 'Generate Flashcards'}
                    </button>
                  </div>
                )}
                
                {!flashcardsLoading && flashcards.length > 0 && (
                  <div className="flashcards-container">
                    <div className="flashcard-progress">
                      Card {currentCardIndex + 1} of {flashcards.length}
                    </div>
                    
                    <div className="flashcard-content">
                      <div className="flashcard-front">
                        <strong>Question:</strong><br />
                        {flashcards[currentCardIndex].question}
                      </div>
                      
                      {showAnswer && (
                        <div className="flashcard-back">
                          <strong>Answer:</strong><br />
                          {flashcards[currentCardIndex].answer}
                        </div>
                      )}
                    </div>
                    
                    <div className="flashcard-controls">
                      <button 
                        onClick={prevCard}
                        disabled={currentCardIndex === 0}
                        className="flashcard-control prev"
                      >
                        ← Prev
                      </button>
                      
                      <button 
                        onClick={toggleAnswer}
                        className="flashcard-control toggle"
                      >
                        {showAnswer ? 'Hide Answer' : 'Show Answer'}
                      </button>
                      
                      <button 
                        onClick={nextCard}
                        disabled={currentCardIndex === flashcards.length - 1}
                        className="flashcard-control next"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'mindmap' && (
              <div className="mindmap-section">
                {mindmapLoading && (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>{mindmapLoadingMessage}</p>
                  </div>
                )}
                
                {mindmapError && (
                  <div className="no-content">
                    <p>{mindmapError}</p>
                    <div className="mindmap-buttons">
                      <button 
                        onClick={retryLoadMindmap}
                        disabled={mindmapLoading}
                        className="retry-button"
                      >
                        {mindmapLoading ? 'Loading...' : 'Try Again'}
                      </button>
                    </div>
                  </div>
                )}
                
                {!mindmapLoading && !mindmapError && !mindmapData && (
                  <div className="no-content">
                    <p>No mindmap available for this video.</p>
                  </div>
                )}
                
                {!mindmapLoading && !mindmapError && mindmapData && (
                  <div className="mindmap-content">
                    <MindMap mindmapData={mindmapData} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage; 