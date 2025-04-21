'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import axios from 'axios';
import { CircularProgress, Button, Card, CardContent, CardActions, Typography, Chip, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import AuthGuard from './AuthGuard';
import StudentNavBar from '../components/StudentNavBar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DiscussionsPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    console.log('讨论列表页面加载，开始获取讨论列表');
    fetchDiscussions();
    
    // 页面每次显示时刷新讨论列表
    const handleFocus = () => {
      console.log('页面获得焦点，刷新讨论列表');
      fetchDiscussions();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  const fetchDiscussions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      console.log('获取讨论列表: 请求API', `${API_URL}/discussions`);
      
      // 添加超时处理
      const response = await axios.get(`${API_URL}/discussions`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10秒超时
        validateStatus: function (status) {
          return status < 500; // 只对500以上的错误抛出异常
        }
      });
      
      console.log('讨论列表返回数据:', response.data);
      
      if (response.data && response.data.success) {
        const fetchedDiscussions = response.data.discussions || [];
        console.log(`获取到${fetchedDiscussions.length}个讨论`);
        setDiscussions(fetchedDiscussions);
        
        if (fetchedDiscussions.length === 0) {
          console.log('返回的讨论列表为空');
        }
      } else {
        throw new Error(response.data?.message || '获取讨论列表失败');
      }
    } catch (err) {
      console.error('获取讨论列表失败:', err);
      
      // 根据不同错误类型提供不同错误信息
      let errorMessage = '获取讨论列表失败，请刷新页面重试';
      if (err.code === 'ECONNABORTED') {
        errorMessage = '请求超时，请检查您的网络连接并刷新页面';
      } else if (err.response && err.response.status >= 500) {
        errorMessage = '服务器暂时不可用，请稍后再试';
      }
      
      setError(errorMessage);
      
      // 设置测试数据
      console.log('使用测试数据');
      const mockDiscussions = [
        {
          id: 1,
          title: '关于微积分题目的理解问题',
          content: '在解题过程中遇到了一些困难，请教老师...',
          createdAt: '2023-05-15T10:30:00',
          author: {
            id: 101,
            name: '张三',
            role: 'student'
          },
          tags: ['微积分', '数学'],
          replies: 3,
          questionId: 123
        },
        {
          id: 2,
          title: '数据结构课程中的链表问题',
          content: '链表的插入和删除操作有什么不同？',
          createdAt: '2023-05-12T14:20:00',
          author: {
            id: 102,
            name: '李四',
            role: 'student'
          },
          tags: ['数据结构', '计算机科学'],
          replies: 2,
          courseTag: '数据结构'
        }
      ];
      setDiscussions(mockDiscussions);
    } finally {
      setLoading(false);
    }
  };
  
  // 手动刷新讨论列表
  const handleRefresh = () => {
    console.log('手动刷新讨论列表');
    fetchDiscussions();
  };
  
  const filteredDiscussions = discussions.filter(discussion => 
    discussion.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discussion.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (Array.isArray(discussion.tags) && discussion.tags.some(tag => 
      tag?.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );
  
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('日期格式化错误:', e);
      return '未知日期';
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StudentNavBar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mr-4">
                  讨论区
                </h1>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  {loading ? '加载中...' : '刷新'}
                </Button>
              </div>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={() => router.push('/discussions/create')}
              >
                发起讨论
              </Button>
            </div>
            
            {/* 搜索框 */}
            <div className="mb-6">
              <TextField
                fullWidth
                variant="outlined"
                placeholder="搜索讨论..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <CircularProgress />
                <Typography variant="body1" className="ml-2">加载讨论列表中...</Typography>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
                <Typography color="error" variant="body1" className="mb-2">{error}</Typography>
                <Button variant="outlined" color="primary" onClick={handleRefresh}>
                  重新加载
                </Button>
              </div>
            ) : filteredDiscussions.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-md text-center">
                {searchTerm ? (
                  <Typography variant="body1" color="textSecondary">
                    没有找到与"{searchTerm}"相关的讨论
                  </Typography>
                ) : (
                  <>
                    <Typography variant="body1" color="textSecondary" className="mb-4">
                      暂无讨论内容
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<AddIcon />}
                      onClick={() => router.push('/discussions/create')}
                    >
                      发起第一个讨论
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <>
                <Typography variant="subtitle1" className="mb-2">
                  共找到 {filteredDiscussions.length} 个讨论
                </Typography>
                <div className="space-y-4">
                  {filteredDiscussions.map((discussion) => (
                    <Card key={discussion.id} className="hover:shadow-lg transition-shadow duration-200">
                      <CardContent>
                        <div className="flex justify-between items-start">
                          <Typography variant="h6" component="h2" gutterBottom>
                            {discussion.title}
                          </Typography>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(discussion.tags) && discussion.tags.map((tag, idx) => (
                              <Chip 
                                key={idx} 
                                label={tag} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                            ))}
                          </div>
                        </div>
                        <Typography variant="body2" color="textSecondary" className="line-clamp-2 mb-2">
                          {discussion.content}
                        </Typography>
                        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                          <div>
                            作者: {discussion.author?.name || '未知用户'} 
                            ({discussion.author?.role === 'teacher' ? '教师' : '学生'})
                          </div>
                          <div>
                            发布于: {formatDate(discussion.createdAt)}
                          </div>
                        </div>
                      </CardContent>
                      <CardActions>
                        <div className="flex justify-between w-full items-center">
                          <div>
                            <Chip 
                              label={`${discussion.replies || 0} 回复`} 
                              size="small" 
                              color="default" 
                              variant="outlined"
                            />
                          </div>
                          <Button 
                            size="small" 
                            color="primary"
                            onClick={() => {
                              console.log('跳转到讨论详情页:', discussion.id);
                              router.push(`/discussions/${discussion.id}`);
                            }}
                          >
                            查看详情
                          </Button>
                        </div>
                      </CardActions>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
} 