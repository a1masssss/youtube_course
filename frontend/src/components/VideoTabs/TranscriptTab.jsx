import React, { useState, useEffect, useRef } from 'react';
import './TranscriptTab.css';

const TranscriptTab = ({ video, isCompact = false }) => {
  const [transcriptData, setTranscriptData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTranscript, setFilteredTranscript] = useState([]);
  const loadedVideoRef = useRef(null);

  useEffect(() => {
    if (video?.timecode_transcript && Array.isArray(video.timecode_transcript)) {
      // Only log and set data if it's a different video
      if (loadedVideoRef.current !== video.uuid_video) {
        console.log('📝 Transcript data:', video.timecode_transcript.slice(0, 3)); // Show first 3 segments
        loadedVideoRef.current = video.uuid_video;
      }
      setTranscriptData(video.timecode_transcript);
      setFilteredTranscript(video.timecode_transcript);
    }
  }, [video?.uuid_video, video?.timecode_transcript]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTranscript(transcriptData);
    } else {
      const filtered = transcriptData.filter(segment =>
        segment.text && segment.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTranscript(filtered);
    }
  }, [searchTerm, transcriptData]);

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '0:00';   
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimestampClick = (startTime) => {
    // Try to find YouTube iframe and set time
    const iframe = document.querySelector('iframe[src*="youtube.com"]');
    if (iframe && startTime) {
      const currentSrc = iframe.src;
      const baseUrl = currentSrc.split('?')[0];
      const newSrc = `${baseUrl}?start=${Math.floor(startTime)}&autoplay=1`;
      iframe.src = newSrc;
    }
  };

  const processCodeBlocks = (text) => {
    if (!text) return text;
    
    // Replace code blocks with highlighted versions
    return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
      const lang = language || '';
      return `<pre class="code-block ${lang}"><code class="language-${lang}">${code.trim()}</code></pre>`;
    });
  };

  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm.trim()) return processCodeBlocks(text);
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return processCodeBlocks(text.replace(regex, '<mark>$1</mark>'));
  };

  if (!video?.timecode_transcript || !Array.isArray(video.timecode_transcript) || video.timecode_transcript.length === 0) {
    return (
      <div className={`transcript-section ${isCompact ? 'compact' : ''}`}>
        <div className="no-content">
          <p>Transcript with timecodes is not available for this video.</p>
          <small>Timecode transcript is generated during video processing.</small>
        </div>
      </div>
    );
  }

  if (isCompact) {
    return (
      <div className="transcript-compact">
        <div className="space-y-3">
          {filteredTranscript.map((segment, index) => {
            return (
              <div
                key={index}
                className="flex items-center gap-3 hover:bg-gray-700/30 p-2 rounded-lg cursor-pointer transition-colors group min-h-[32px]"
                onClick={() => handleTimestampClick(segment.start)}
              >
                <div className="flex items-center justify-center px-2 py-1 text-xs bg-blue-600/20 text-blue-400 border border-blue-400/30 rounded flex-shrink-0 h-[22px]" style={{minWidth: '55px', width: '55px', fontFamily: 'Courier New, monospace'}}>
                  {formatTime(segment.start)}
                </div>
                <div 
                  className="text-gray-300 text-sm leading-relaxed flex-1 m-0 flex items-center min-h-[22px]"
                  dangerouslySetInnerHTML={{
                    __html: processCodeBlocks(segment.text || '')
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="transcript-section">
      <div className="transcript-header">
        <h3>Video Transcript</h3>
        <div className="transcript-search">
          <input
            type="text"
            placeholder="Search in transcript..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-results">
            {searchTerm && `${filteredTranscript.length} results`}
          </span>
        </div>
      </div>

      <div className="transcript-content">
        {filteredTranscript.length === 0 ? (
          <div className="no-results">
            <p>No results found for "{searchTerm}"</p>
          </div>
        ) : (
          <div className="transcript-segments">
            {filteredTranscript.map((segment, index) => {
              // Calculate end time if missing
              let endTime = segment.end;
              if (!endTime || endTime === 0) {
                // Use next segment's start time, or add 3 seconds if it's the last segment
                const nextSegment = filteredTranscript[index + 1];
                endTime = nextSegment ? nextSegment.start : (segment.start + 3);
              }
              
              return (
                <div key={index} className="transcript-segment">
                  <button
                    className="timestamp-button"
                    onClick={() => handleTimestampClick(segment.start)}
                    title="Click to jump to this time in the video"
                  >
                    {formatTime(segment.start)} - {formatTime(endTime)}
                  </button>
                  <div 
                    className="segment-text"
                    dangerouslySetInnerHTML={{
                      __html: highlightSearchTerm(segment.text || '', searchTerm)
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="transcript-info">
        <small>
          Click on any timestamp to jump to that moment in the video. 
          Total segments: {transcriptData.length}
        </small>
      </div>
    </div>
  );
};

export default TranscriptTab; 