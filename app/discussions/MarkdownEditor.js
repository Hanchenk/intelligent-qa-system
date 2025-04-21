'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Box, FormHelperText, Typography } from '@mui/material';

// 动态导入编辑器组件以避免SSR问题
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

/**
 * 讨论区专用Markdown编辑器组件
 */
const MarkdownEditor = ({
  value,
  onChange,
  placeholder,
  height = 200,
  error
}) => {
  // 维护一个内部状态，用于处理与父组件的状态同步
  const [editorValue, setEditorValue] = useState(value || '');
  
  // 当外部value变化时更新内部状态
  useEffect(() => {
    setEditorValue(value || '');
  }, [value]);
  
  // 处理编辑器内容变化
  const handleChange = (val) => {
    setEditorValue(val);
    
    // 调用父组件的onChange
    if (onChange) {
      onChange(val);
    }
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <div data-color-mode="light">
        <MDEditor
          value={editorValue}
          onChange={handleChange}
          height={height}
          placeholder={placeholder}
          preview="edit"
          className={error ? 'md-editor-error' : ''}
        />
      </div>
      
      {error && <FormHelperText error>{error}</FormHelperText>}
      
      <style jsx global>{`
        .w-md-editor {
          box-shadow: none !important;
          border: 1px solid #ddd;
        }
        
        .md-editor-error .w-md-editor {
          border-color: #d32f2f;
        }
        
        .w-md-editor-toolbar {
          border-bottom: 1px solid #ddd !important;
        }
      `}</style>
    </Box>
  );
};

export default MarkdownEditor; 