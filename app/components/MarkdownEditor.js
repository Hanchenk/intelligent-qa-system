'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Box, FormHelperText, Typography } from '@mui/material';
import MarkdownStyles from './MarkdownStyles';

// 动态导入编辑器组件以避免SSR问题
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

// 导入预览组件
const MDPreview = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown),
  { ssr: false }
);

/**
 * Markdown编辑器组件
 * @param {string} value - 编辑器内容
 * @param {function} onChange - 内容改变时的回调函数
 * @param {string} label - 标签文本
 * @param {string} placeholder - 占位文本
 * @param {number} height - 编辑器高度，默认为200px
 * @param {boolean} fullWidth - 是否宽度100%
 * @param {string} error - 错误信息
 * @param {boolean} readOnly - 是否只读模式
 * @param {boolean} preview - 是否默认展示预览视图
 */
const MarkdownEditor = ({
  value,
  onChange,
  label,
  placeholder,
  height = 200,
  fullWidth = true,
  error,
  readOnly = false,
  preview = false
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
  
  // 只读模式仅显示预览
  if (readOnly) {
    return (
      <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
        <MarkdownStyles />
        {label && (
          <Typography variant="subtitle1" className="mb-2 font-bold">
            {label}
          </Typography>
        )}
        <div data-color-mode="light">
          <MDPreview source={editorValue} style={{ padding: '16px' }} />
        </div>
      </Box>
    );
  }
  
  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <MarkdownStyles />
      {label && (
        <Typography variant="subtitle1" className="mb-2 font-bold">
          {label}
        </Typography>
      )}
      
      <div data-color-mode="light">
        <MDEditor
          value={editorValue}
          onChange={handleChange}
          height={height}
          placeholder={placeholder}
          preview={preview ? 'preview' : 'edit'}
          className={error ? 'md-editor-error' : ''}
        />
      </div>
      
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
};

export default MarkdownEditor; 