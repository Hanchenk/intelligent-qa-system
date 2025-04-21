'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Box } from '@mui/material';

// 动态导入预览组件以避免SSR问题
const MDPreview = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
  { ssr: false }
);

/**
 * 讨论区专用Markdown预览组件
 */
const MarkdownPreview = ({ content, className = '', style = {} }) => {
  // 如果内容为空，则不显示任何内容
  if (!content) {
    return null;
  }
  
  return (
    <Box className={`markdown-preview ${className}`} style={style}>
      <div data-color-mode="light">
        <MDPreview source={content} />
      </div>
      
      <style jsx global>{`
        .markdown-preview {
          background-color: #fff;
          border-radius: 4px;
          padding: 16px;
        }
        
        .markdown-preview p {
          margin-bottom: 1em;
        }
        
        .markdown-preview h1, .markdown-preview h2, .markdown-preview h3,
        .markdown-preview h4, .markdown-preview h5, .markdown-preview h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        
        .markdown-preview code {
          background-color: #f5f5f5;
          padding: 0.2em 0.4em;
          border-radius: 3px;
        }
        
        .markdown-preview pre {
          background-color: #f5f5f5;
          padding: 1em;
          border-radius: 5px;
          overflow-x: auto;
        }
        
        .markdown-preview blockquote {
          border-left: 4px solid #ddd;
          padding-left: 1em;
          color: #666;
          margin-left: 0;
        }
        
        .markdown-preview img {
          max-width: 100%;
        }
        
        .markdown-preview table {
          border-collapse: collapse;
          width: 100%;
        }
        
        .markdown-preview table th, .markdown-preview table td {
          border: 1px solid #ddd;
          padding: 8px;
        }
        
        .markdown-preview table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
      `}</style>
    </Box>
  );
};

export default MarkdownPreview; 