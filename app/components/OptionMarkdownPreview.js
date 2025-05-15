'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Box } from '@mui/material';
import MarkdownStyles from './MarkdownStyles';

// 动态导入预览组件以避免SSR问题
const MDPreview = dynamic(
  () => import('@uiw/react-markdown-preview'),
  { ssr: false }
);

/**
 * 为选项内容定制的Markdown预览组件
 * 会阻止内部渲染li课程，以避免嵌套问题
 * 
 * @param {string} content - Markdown内容
 * @param {string} className - 额外的CSS类名
 * @param {object} style - 内联样式
 */
const OptionMarkdownPreview = ({ content, className = '', style = {} }) => {
  // 如果内容为空，则不显示任何内容
  if (!content) {
    return null;
  }
  
  // 自定义组件渲染器，防止渲染li课程
  const components = {
    // 将li转换为span，防止嵌套问题
    li: ({ node, children, ...props }) => (
      <span className="markdown-li" {...props}>
        {children}
      </span>
    ),
    // 将ul转换为div
    ul: ({ node, children, ...props }) => (
      <div className="markdown-ul" {...props}>
        {children}
      </div>
    ),
    // 将ol转换为div
    ol: ({ node, children, ...props }) => (
      <div className="markdown-ol" {...props}>
        {children}
      </div>
    )
  };
  
  return (
    <Box className={`option-markdown-preview ${className}`} style={style}>
      <MarkdownStyles />
      <div data-color-mode="light">
        <MDPreview source={content} components={components} />
      </div>
      
      <style jsx global>{`
        .option-markdown-preview {
          display: inline;
        }
        
        .option-markdown-preview .wmde-markdown {
          display: inline;
        }
        
        .option-markdown-preview p {
          display: inline;
          margin: 0;
        }
        
        .markdown-li {
          display: inline-block;
          position: relative;
          padding-left: 1.5em;
          margin: 0.2em 0;
        }
        
        .markdown-li::before {
          content: "•";
          position: absolute;
          left: 0.5em;
        }
        
        .markdown-ul, .markdown-ol {
          padding-left: 1em;
          margin: 0.5em 0;
        }
      `}</style>
    </Box>
  );
};

export default OptionMarkdownPreview; 