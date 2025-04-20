import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const TagSelector = ({ selectedTags = [], onChange, placeholder = "选择或搜索标签..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredTags, setFilteredTags] = useState([]);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // 获取标签数据
  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/tags`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTags(res.data.data);
      setFilteredTags(res.data.data);
    } catch (error) {
      console.error('获取标签失败:', error);
      toast.error('无法加载标签，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载标签
  useEffect(() => {
    fetchTags();
  }, []);

  // 过滤标签
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredTags(tags);
    } else {
      const filtered = tags.filter(tag => 
        tag.name.toLowerCase().includes(search.toLowerCase()) ||
        (tag.description && tag.description.toLowerCase().includes(search.toLowerCase()))
      );
      setFilteredTags(filtered);
    }
  }, [search, tags]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 处理标签选择
  const handleTagSelect = (tag) => {
    // 检查标签是否已被选中
    const tagIndex = selectedTags.findIndex(t => t._id === tag._id);
    
    let newSelectedTags;
    if (tagIndex >= 0) {
      // 如果已选中，则移除该标签
      newSelectedTags = [...selectedTags];
      newSelectedTags.splice(tagIndex, 1);
    } else {
      // 如果未选中，则添加该标签
      newSelectedTags = [...selectedTags, tag];
    }
    
    onChange(newSelectedTags);
    setSearch('');
  };

  // 移除标签
  const handleRemoveTag = (e, tagId) => {
    e.stopPropagation();
    const newSelectedTags = selectedTags.filter(tag => tag._id !== tagId);
    onChange(newSelectedTags);
  };

  // 处理下拉框打开
  const handleDropdownOpen = () => {
    setIsOpen(true);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 标签显示区域 */}
      <div 
        className={`w-full min-h-[42px] px-2 py-1 border rounded-lg cursor-text flex flex-wrap items-center gap-1 ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={handleDropdownOpen}
      >
        {selectedTags.length > 0 ? (
          <>
            {selectedTags.map(tag => (
              <div 
                key={tag._id}
                className="flex items-center px-2 py-1 rounded-full text-white text-sm my-1"
                style={{ backgroundColor: tag.color || '#1976d2' }}
              >
                <span>{tag.name}</span>
                <button
                  type="button"
                  className="ml-1 text-white hover:text-gray-200"
                  onClick={(e) => handleRemoveTag(e, tag._id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
            <input 
              ref={searchInputRef}
              type="text" 
              className="flex-grow min-w-[120px] border-0 outline-none text-sm py-1 px-2 my-1"
              placeholder={selectedTags.length > 0 ? "添加更多标签..." : placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsOpen(true)}
            />
          </>
        ) : (
          <input 
            ref={searchInputRef}
            type="text" 
            className="flex-grow border-0 outline-none text-sm py-1 px-2"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
          />
        )}
      </div>
      
      {/* 下拉选择框 */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500">加载中...</div>
          ) : filteredTags.length === 0 ? (
            <div className="p-3 text-center text-gray-500">
              {search ? '未找到匹配的标签' : '暂无可用标签'}
            </div>
          ) : (
            <div>
              {filteredTags.map(tag => {
                const isSelected = selectedTags.some(t => t._id === tag._id);
                return (
                  <div 
                    key={tag._id}
                    className={`p-2 cursor-pointer hover:bg-gray-100 flex items-center ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleTagSelect(tag)}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: tag.color || '#1976d2' }}
                    ></div>
                    <div className="flex-grow">
                      <div className="text-sm font-medium">{tag.name}</div>
                      {tag.description && (
                        <div className="text-xs text-gray-500 truncate">{tag.description}</div>
                      )}
                    </div>
                    {isSelected && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="p-2 border-t border-gray-200">
            <Link 
              href="/dashboard/teacher/tags"
              className="text-xs text-blue-600 hover:text-blue-800 block text-center"
              onClick={() => setIsOpen(false)}
            >
              管理标签
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagSelector; 