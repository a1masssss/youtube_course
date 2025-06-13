import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './SummaryTab.css';

const SummaryTab = ({ video }) => {
  if (!video || !video.summary) {
    return (
      <div className="summary-section">
        <div className="no-content">
          <p>No summary available yet.</p>
          <small>The summary will be generated automatically once the video is processed.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="summary-section">
      <div className="summary-container">
        <div className="markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              // Headings
              h1: ({ children }) => (
                <h1 className="markdown-h1">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="markdown-h2">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="markdown-h3">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="markdown-h4">
                  {children}
                </h4>
              ),
              h5: ({ children }) => (
                <h5 className="markdown-h5">
                  {children}
                </h5>
              ),
              h6: ({ children }) => (
                <h6 className="markdown-h6">
                  {children}
                </h6>
              ),
              
              // Paragraphs
              p: ({ children }) => (
                <p className="markdown-paragraph">
                  {children}
                </p>
              ),
              
              // Lists
              ul: ({ children }) => (
                <ul className="markdown-list markdown-list--unordered">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="markdown-list markdown-list--ordered">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="markdown-list-item">
                  <div className="markdown-list-item__bullet" />
                  <span className="markdown-list-item__content">{children}</span>
                </li>
              ),
              
              // Links
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  className="markdown-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              
              // Emphasis
              strong: ({ children }) => (
                <strong className="markdown-strong">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="markdown-emphasis">
                  {children}
                </em>
              ),
              
              // Code
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="markdown-code-block">
                    <SyntaxHighlighter
                      style={tomorrow}
                      language={match[1]}
                      PreTag="div"
                      className="markdown-code-block__content"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code 
                    className="markdown-inline-code"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              
              // Blockquotes
              blockquote: ({ children }) => (
                <blockquote className="markdown-blockquote">
                  {children}
                </blockquote>
              ),
              
              // Tables
              table: ({ children }) => (
                <div className="markdown-table-wrapper">
                  <table className="markdown-table">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="markdown-table__header">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="markdown-table__cell">
                  {children}
                </td>
              ),
              
              // Horizontal rule
              hr: () => (
                <hr className="markdown-divider" />
              ),
            }}
          >
            {video.summary}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default SummaryTab; 