'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import CircularProgress from '@mui/material/CircularProgress';
import AuthGuard from '../../../components/AuthGuard';
import TeacherNavBar from '../../../components/TeacherNavBar';
import TagItem from '../../../components/tags/TagItem';
import TagForm from '../../../components/tags/TagForm';
import DeleteIcon from '@mui/icons-material/Delete';

// 确保API URL可用
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const TagsPage = () => {
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [popularTags, setPopularTags] = useState([]);
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/tags`, {
        params: { search },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTags(res.data.data || []);
    } catch (error) {
      console.error('获取课程失败:', error);
      toast.error('获取课程列表失败，请稍后重试');
      setTags([]); // 确保在错误时设置为空数组
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularTags = async () => {
    try {
      const res = await axios.get(`${API_URL}/tags/stats/popular`, {
        params: { limit: 10 },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setPopularTags(res.data.data || []);
    } catch (error) {
      console.error('获取热门课程失败:', error);
      setPopularTags([]); // 确保在错误时设置为空数组
    }
  };

  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchTags();
      fetchPopularTags();
    }
  }, [user]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTags();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个课程吗？')) return;

    try {
      await axios.delete(`${API_URL}/tags/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      toast.success('课程删除成功');
      fetchTags();
      fetchPopularTags();
    } catch (error) {
      console.error('删除课程失败:', error);
      if (error.response && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('删除课程失败，请稍后重试');
      }
    }
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setShowForm(true);
  };

  const handleFormSubmit = async (tagData) => {
    try {
      if (editingTag) {
        // 更新课程
        await axios.put(
          `${API_URL}/tags/${editingTag._id}`,
          tagData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        toast.success('课程更新成功');
      } else {
        // 创建新课程
        await axios.post(
          `${API_URL}/tags`,
          tagData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        toast.success('课程创建成功');
      }
      
      setShowForm(false);
      setEditingTag(null);
      fetchTags();
      fetchPopularTags();
    } catch (error) {
      console.error('保存课程失败:', error);
      if (error.response && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('保存课程失败，请稍后重试');
      }
    }
  };

  return (
    <AuthGuard allowedRoles={['teacher']}>
      <div className="min-h-screen bg-gray-50">
        <TeacherNavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">课程管理</h1>
            <button
              onClick={() => {
                setEditingTag(null);
                setShowForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              创建课程
            </button>
          </div>

          {/* 搜索栏 */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="搜索课程名称..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                搜索
              </button>
            </form>
          </div>

          {/* 热门课程 */}
          {popularTags.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-3">热门课程</h2>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <div
                    key={tag._id}
                    className="px-3 py-1 rounded-full text-sm text-white"
                    style={{ backgroundColor: tag.color || '#1976d2' }}
                  >
                    {tag.name} ({tag.useCount})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 课程列表 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <CircularProgress />
              </div>
            ) : tags.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {search ? '没有找到匹配的课程' : '还没有创建任何课程，点击"创建课程"按钮开始添加'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {tags.map(tag => (
                  <TagItem
                    key={tag._id}
                    tag={tag}
                    onEdit={() => handleEdit(tag)}
                    onDelete={() => handleDelete(tag._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 课程表单模态框 */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingTag ? '编辑课程' : '创建新课程'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingTag(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <TagForm
                initialData={editingTag}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingTag(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
};

export default TagsPage; 