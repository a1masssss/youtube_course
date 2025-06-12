import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './SummaryTab.css';

const SummaryTab = ({ video }) => {
  if (!video?.summary) {
    return (
      <div className="summary-section">
        <div className="no-content">
          <p className="text-gray-400 text-center">No summary available for this video.</p>
          <small className="text-gray-500 text-center block mt-2">Summary will be generated automatically when available.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="summary-section">
      <h3 className="text-xl font-semibold text-white mb-6">Course Summary</h3>
      
      <div className="bg-gray-700/30 rounded-xl p-6">
        <div className="markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              // Headings
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold text-white mb-4 pb-2 border-b border-blue-500/30">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-semibold text-white mb-3 mt-6">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-medium text-white mb-2 mt-4">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-base font-medium text-gray-200 mb-2 mt-3">
                  {children}
                </h4>
              ),
              h5: ({ children }) => (
                <h5 className="text-sm font-medium text-gray-300 mb-2 mt-3">
                  {children}
                </h5>
              ),
              h6: ({ children }) => (
                <h6 className="text-sm font-medium text-gray-400 mb-2 mt-3">
                  {children}
                </h6>
              ),
              
              // Paragraphs
              p: ({ children }) => (
                <p className="text-gray-300 leading-relaxed mb-4">
                  {children}
                </p>
              ),
              
              // Lists
              ul: ({ children }) => (
                <ul className="list-none space-y-2 mb-4 ml-4">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-2 mb-4 ml-4 text-gray-300">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="flex items-start gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span>{children}</span>
                </li>
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
                <em className="italic text-gray-200">
                  {children}
                </em>
              ),
              
              // Code
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="my-4">
                    <SyntaxHighlighter
                      style={tomorrow}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-lg"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code 
                    className="bg-gray-800/60 text-blue-300 px-2 py-1 rounded text-sm font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              
              // Blockquotes
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-500/50 bg-blue-500/10 pl-4 py-2 my-4 italic text-gray-300">
                  {children}
                </blockquote>
              ),
              
              // Tables
              table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                  <table className="w-full border-collapse border border-gray-600 rounded-lg">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-gray-600 bg-gray-700/50 px-4 py-2 text-left font-semibold text-white">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-gray-600 bg-gray-800/30 px-4 py-2 text-gray-300">
                  {children}
                </td>
              ),
              
              // Horizontal rule
              hr: () => (
                <hr className="border-gray-600 my-6" />
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