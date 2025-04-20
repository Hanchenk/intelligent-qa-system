'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Box } from '@mui/material';
import MarkdownStyles from './MarkdownStyles';

// 动态导入预览组件以避免SSR问题
const MDPreview = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
  { ssr: false }
);

/**
 * Markdown预览组件
 * @param {string} content - Markdown内容
 * @param {string} className - 额外的CSS类名
 * @param {object} style - 内联样式
 * @param {boolean} isTableCell - 是否在表格单元格中显示
 */
const MarkdownPreview = ({ content, className = '', style = {}, isTableCell = false }) => {
  // 如果内容为空，则不显示任何内容
  if (!content) {
    return null;
  }
  
  // 处理表格单元格中的显示
  const cellClass = isTableCell ? 'in-table-cell' : '';
  
  return (
    <Box className={`markdown-preview ${className} ${cellClass}`} style={style}>
      <MarkdownStyles />
      <div data-color-mode="light">
        <MDPreview source={content} />
      </div>
      
      <style jsx global>{`
        .markdown-preview {
          background-color: #fff;
          border-radius: 4px;
          padding: 16px;
        }
        
        .markdown-preview.in-table-cell {
          padding: 0;
          background-color: transparent;
        }
        
        .markdown-preview.in-table-cell p {
          margin: 0;
        }
      `}</style>
    </Box>
  );
};

export default MarkdownPreview; 