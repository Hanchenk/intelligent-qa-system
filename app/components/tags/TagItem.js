import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const TagItem = ({ tag, onEdit, onDelete }) => {
  const createdAt = new Date(tag.createdAt);
  const timeAgo = formatDistanceToNow(createdAt, {
    addSuffix: true,
    locale: zhCN
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div 
          className="px-3 py-1 rounded-full text-sm text-white font-medium"
          style={{ backgroundColor: tag.color || '#1976d2' }}
        >
          {tag.name}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-800"
            title="编辑标签"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-800"
            title="删除标签"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="my-2">
        <p className="text-gray-600 text-sm line-clamp-2">
          {tag.description || <span className="text-gray-400 italic">无描述</span>}
        </p>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
        <div>
          使用次数: <span className="font-medium">{tag.useCount}</span>
        </div>
        <div className="flex items-center">
          <span>创建于 {timeAgo}</span>
        </div>
      </div>
      
      {tag.creator && (
        <div className="mt-2 text-xs text-gray-500">
          创建者: {tag.creator.username}
        </div>
      )}
      
      {tag.isGlobal && (
        <div className="mt-2">
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
            全局标签
          </span>
        </div>
      )}
    </div>
  );
};

export default TagItem; 