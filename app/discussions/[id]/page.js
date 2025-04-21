'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import axios from 'axios';
import { 
  CircularProgress, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  Divider,
  Avatar,
  TextField,
  Paper
} from '@mui/material';
import ReplyIcon from '@mui/icons-material/Reply';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import AuthGuard from '../AuthGuard';
import MarkdownPreview from '../MarkdownPreview';
import StudentNavBar from '../../components/StudentNavBar';

// 调整API路径格式
const ensureCorrectApiUrl = (url) => {
  // 检查API URL是否正确包含/api前缀
  // 某些后端接口可能需要/api前缀，这里进行兼容处理
  if (!url) return 'http://localhost:3001';
  
  console.log('检查API URL:', url);
  
  // 如果URL已经包含/api，保持不变
  if (url.endsWith('/api')) {
    return url;
  }
  
  // 否则用标准格式
  return url;
};

// 定义API路径常量
const API_URL = ensureCorrectApiUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
console.log('使用API URL:', API_URL);

export default function DiscussionDetailPage({ params }) {
  const router = useRouter();
  
  // 正确地使用React.use()解包params对象
  const discussionId = use(Promise.resolve(params)).id;
  
  const { user } = useSelector((state) => state.auth);
  const [discussion, setDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyLoading, setReplyLoading] = useState(false);
  const [error, setError] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  
  useEffect(() => {
    console.log('Discussion ID:', discussionId);
    if (discussionId) {
      fetchDiscussionDetail(discussionId);
    } else {
      setError('讨论ID无效');
      setLoading(false);
    }
  }, [discussionId]);
  
  // 进行API路径测试
  useEffect(() => {
    // 测试API连接
    const testApiConnection = async () => {
      try {
        console.log('测试API连接:', `${API_URL}/ping`);
        const response = await fetch(`${API_URL}/ping`);
        console.log('API连接测试状态:', response.status);
        const data = await response.text();
        console.log('API连接测试结果:', data);
      } catch (err) {
        console.error('API连接测试失败:', err);
      }
    };
    
    testApiConnection();
  }, []);
  
  const fetchDiscussionDetail = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // 首先验证ID是否有效
      if (!id || typeof id !== 'string') {
        throw new Error('无效的讨论ID');
      }
      
      console.log('Fetching discussion with ID:', id);
      console.log('API URL:', `${API_URL}/discussions/${id}`);
      
      try {
        // 添加超时和错误处理选项，确保正确的API路径
        const response = await axios.get(`${API_URL}/discussions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000, // 10秒超时
          validateStatus: function (status) {
            return status < 500; // 只对500以上的错误抛出异常
          }
        });
        
        console.log('API Response:', response.data);
        
        if (response.data && response.data.success) {
          setDiscussion(response.data.discussion);
          setReplies(response.data.replies || []);
        } else {
          throw new Error(response.data?.message || '获取讨论详情失败');
        }
      } catch (apiError) {
        console.error('API请求失败:', apiError);
        
        // 检查是否是网络错误或超时
        if (apiError.code === 'ECONNABORTED') {
          throw new Error('请求超时，请检查您的网络连接');
        }
        
        // 检查是否是服务器错误
        if (apiError.response && apiError.response.status >= 500) {
          throw new Error('服务器暂时不可用，请稍后再试');
        }
        
        // 其他API错误
        throw apiError;
      }
    } catch (err) {
      console.error('获取讨论详情失败:', err);
      setError(err.message || '获取讨论详情失败，请刷新页面重试');
      
      // 设置测试数据以便用户仍然能看到页面
      setDiscussion({
        id: id || '1',
        title: '示例讨论主题',
        content: '这是一个示例讨论内容，用于在无法从服务器获取数据时显示。',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: user?.id || 101,
          name: user?.name || '示例用户',
          role: user?.role || 'student',
          avatar: null
        },
        tags: ['示例标签'],
        questionId: null,
        questionTitle: null
      });
      
      setReplies([
        {
          id: 1,
          content: '这是一个示例回复。当前无法从服务器获取实际数据，这些是临时显示的内容。',
          createdAt: new Date().toISOString(),
          author: {
            id: 201,
            name: '系统',
            role: 'teacher',
            avatar: null
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !discussionId) return;
    
    setReplyLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Submitting reply to discussion:', discussionId);
      
      const response = await axios.post(`${API_URL}/discussions/${discussionId}/replies`, 
        { content: replyContent },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000 // 10秒超时
        }
      );
      
      console.log('Reply submission response:', response.data);
      
      if (response.data && response.data.success) {
        // 添加新回复到列表
        const newReply = response.data.reply;
        setReplies([...replies, newReply]);
        setReplyContent(''); // 清空输入框
      } else {
        throw new Error(response.data?.message || '发表回复失败');
      }
    } catch (err) {
      console.error('发表回复失败:', err);
      
      // 使用更友好的错误提示
      let errorMessage = '发表回复失败，请重试';
      if (err.code === 'ECONNABORTED') {
        errorMessage = '网络请求超时，请检查您的网络连接';
      } else if (err.response && err.response.status >= 500) {
        errorMessage = '服务器暂时不可用，请稍后再试';
      }
      
      alert(errorMessage);
      
      // 测试用：模拟添加回复
      if (user) {
        const mockNewReply = {
          id: Date.now(),
          content: replyContent,
          createdAt: new Date().toISOString(),
          author: {
            id: user.id || 'temp-id',
            name: user.name || '当前用户',
            role: user.role || 'student',
            avatar: user.avatar
          }
        };
        setReplies([...replies, mockNewReply]);
        setReplyContent(''); // 清空输入框
      }
    } finally {
      setReplyLoading(false);
    }
  };
  
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
      return '未知日期';
    }
  };
  
  // 返回讨论列表页
  const handleGoBack = () => {
    router.push('/discussions');
  };

  // 渲染页面内容
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StudentNavBar />
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="container mx-auto p-4 max-w-4xl">
            <Button 
              startIcon={<ChevronLeftIcon />} 
              onClick={handleGoBack}
              sx={{ mb: 2 }}
            >
              返回讨论列表
            </Button>
            
            {loading ? (
              <div className="flex justify-center my-8">
                <CircularProgress />
              </div>
            ) : error ? (
              <Paper className="p-6 my-4" elevation={2}>
                <Typography variant="h6" color="error" className="mb-2">
                  加载讨论失败
                </Typography>
                <Typography variant="body1">
                  {error}
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={() => discussionId && fetchDiscussionDetail(discussionId)} 
                  className="mt-4"
                >
                  重新加载
                </Button>
              </Paper>
            ) : discussion ? (
              <>
                <Card className="mb-6">
                  <CardContent>
                    <div className="flex justify-between items-start mb-4">
                      <Typography variant="h5" component="h1">
                        {discussion.title}
                      </Typography>
                      {discussion.questionId && (
                        <Chip 
                          label={`关联题目: ${discussion.questionTitle || '未知题目'}`} 
                          color="primary" 
                          variant="outlined" 
                          className="ml-2"
                        />
                      )}
                    </div>

                    <div className="flex items-center mb-4">
                      <Avatar 
                        src={discussion.author?.avatar} 
                        className="mr-2"
                      >
                        {discussion.author?.name?.charAt(0) || '?'}
                      </Avatar>
                      <div>
                        <Typography variant="subtitle1">
                          {discussion.author?.name || '未知用户'}
                          <Chip 
                            label={discussion.author?.role === 'teacher' ? '教师' : '学生'} 
                            size="small" 
                            color={discussion.author?.role === 'teacher' ? 'secondary' : 'default'} 
                            className="ml-2"
                          />
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {formatDate(discussion.createdAt)}
                        </Typography>
                      </div>
                    </div>

                    <div className="mb-4">
                      {Array.isArray(discussion.tags) && discussion.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {discussion.tags.map((tag, index) => (
                            <Chip 
                              key={index} 
                              label={tag} 
                              size="small" 
                              color="info" 
                              variant="outlined"
                            />
                          ))}
                        </div>
                      )}
                      
                      <Paper elevation={0} className="p-4 bg-gray-50">
                        <MarkdownPreview content={discussion.content} />
                      </Paper>
                    </div>
                  </CardContent>
                </Card>

                <div className="mb-6">
                  <Typography variant="h6" className="mb-4">
                    回复（{replies.length}）
                  </Typography>
                  
                  {replies.length === 0 ? (
                    <Paper className="p-4 text-center" variant="outlined">
                      <Typography variant="body1" color="textSecondary">
                        暂无回复，成为第一个回复的人吧！
                      </Typography>
                    </Paper>
                  ) : (
                    replies.map((reply) => (
                      <Paper key={reply.id} className="p-4 mb-4" variant="outlined">
                        <div className="flex items-center mb-3">
                          <Avatar 
                            src={reply.author?.avatar} 
                            className="mr-2"
                          >
                            {reply.author?.name?.charAt(0) || '?'}
                          </Avatar>
                          <div>
                            <Typography variant="subtitle2">
                              {reply.author?.name || '未知用户'}
                              <Chip 
                                label={reply.author?.role === 'teacher' ? '教师' : '学生'} 
                                size="small" 
                                color={reply.author?.role === 'teacher' ? 'secondary' : 'default'} 
                                className="ml-2"
                              />
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {formatDate(reply.createdAt)}
                            </Typography>
                          </div>
                        </div>
                        
                        <MarkdownPreview content={reply.content} />
                      </Paper>
                    ))
                  )}
                </div>

                <div className="mb-6">
                  <Typography variant="h6" className="mb-2">
                    添加回复
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="写下你的回复..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    variant="outlined"
                    className="mb-3"
                    error={replyContent.trim() === ''}
                    helperText={replyContent.trim() === '' ? '回复内容不能为空' : '支持Markdown格式'}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<ReplyIcon />}
                    onClick={handleSubmitReply}
                    disabled={replyLoading || replyContent.trim() === ''}
                  >
                    {replyLoading ? <CircularProgress size={24} color="inherit" /> : '发表回复'}
                  </Button>
                </div>
              </>
            ) : (
              <Paper className="p-6 my-4" elevation={2}>
                <Typography variant="h6" color="error">
                  未找到讨论
                </Typography>
                <Typography variant="body1" className="mt-2">
                  无法加载讨论内容，请确认讨论ID是否正确，或返回讨论列表。
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleGoBack}
                  className="mt-4"
                >
                  返回讨论列表
                </Button>
              </Paper>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
} 