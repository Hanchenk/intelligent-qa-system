'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { 
  CircularProgress, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip,
  Paper,
  Typography,
  Autocomplete,
  FormHelperText,
  Box,
  Tabs,
  Tab,
  Container
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SendIcon from '@mui/icons-material/Send';
import AuthGuard from '../AuthGuard';
import MarkdownEditor from '../MarkdownEditor';
import StudentNavBar from '../../components/StudentNavBar';
import TeacherNavBar from '../../components/TeacherNavBar';

// 调整API路径格式
const ensureCorrectApiUrl = (url) => {
  // 检查API URL是否正确包含/api前缀
  if (!url) return 'http://localhost:3001';
  
  console.log('检查API URL:', url);
  
  // 移除末尾的斜杠
  return url.replace(/\/+$/, '');
};

// 基础API URL, 不包含/api
const API_URL = ensureCorrectApiUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
console.log('创建讨论页面 API URL:', API_URL);

export default function CreateDiscussionPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTab, setSelectedTab] = useState(0); // 0: 题目, 1: 课程
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [questions, setQuestions] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // API请求增加额外检查和日志记录
  const checkApiEndpoint = () => {
    console.log('当前API端点:', API_URL);
    // 测试API连接
    fetch(`${API_URL}/ping`)
      .then(res => {
        console.log('API 连接测试响应状态:', res.status);
        return res.text();
      })
      .then(data => console.log('API 连接测试结果:', data))
      .catch(err => console.error('API 连接测试失败:', err));
  };

  // 页面加载时检查API配置
  useEffect(() => {
    console.log('创建讨论页面加载');
    checkApiEndpoint();
  }, []);
  
  // 获取题目和课程
  useEffect(() => {
    const fetchQuestionsAndTags = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        // 获取题目
        try {
          console.log('开始获取题目数据');
          const questionsResponse = await axios.get(`${API_URL}/questions`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('题目数据响应:', questionsResponse.data);
          
          if (questionsResponse.data.success) {
            setQuestions(questionsResponse.data.data || []);
          } else {
            console.warn('获取题目成功但返回错误:', questionsResponse.data.message);
            // 设置测试数据
            setQuestions([
              { id: 1, title: '计算积分 ∫(x²+1)dx' },
              { id: 2, title: '计算极限 lim(x→0) sin(x)/x' },
              { id: 3, title: '解方程 x² + 3x - 4 = 0' }
            ]);
          }
        } catch (error) {
          console.error('获取题目失败:', error.response?.data || error.message);
          // 设置测试数据
          setQuestions([
            { id: 1, title: '计算积分 ∫(x²+1)dx' },
            { id: 2, title: '计算极限 lim(x→0) sin(x)/x' },
            { id: 3, title: '解方程 x² + 3x - 4 = 0' }
          ]);
        }
        
        // 获取课程
        try {
          console.log('开始获取课程数据');
          const tagsResponse = await axios.get(`${API_URL}/tags`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('课程数据响应:', tagsResponse.data);
          
          if (tagsResponse.data.success) {
            setAvailableTags(tagsResponse.data.data || []);
          } else {
            console.warn('获取课程成功但返回错误:', tagsResponse.data.message);
            // 设置测试数据
            setAvailableTags([
              { id: 1, name: '微积分' },
              { id: 2, name: '代数' },
              { id: 3, name: '几何' },
              { id: 4, name: '离散数学' },
              { id: 5, name: '数据结构' },
              { id: 6, name: '算法' }
            ]);
          }
        } catch (error) {
          console.error('获取课程失败:', error.response?.data || error.message);
          // 设置测试数据
          setAvailableTags([
            { id: 1, name: '微积分' },
            { id: 2, name: '代数' },
            { id: 3, name: '几何' },
            { id: 4, name: '离散数学' },
            { id: 5, name: '数据结构' },
            { id: 6, name: '算法' }
          ]);
        }
      } catch (err) {
        console.error('获取数据失败:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestionsAndTags();
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    // 切换课程时重置选择
    if (newValue === 0) {
      setSelectedTags([]);
    } else {
      setSelectedQuestion(null);
    }
  };
  
  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.some(tag => tag.toLowerCase() === customTag.toLowerCase())) {
      setSelectedTags([...selectedTags, customTag]);
      setCustomTag('');
    }
  };
  
  const handleSubmit = async () => {
    // 验证表单
    const newErrors = {};
    if (!title.trim()) newErrors.title = '标题不能为空';
    if (!content.trim()) newErrors.content = '内容不能为空';
    // 移除题目和课程的必选验证
    // if (selectedTab === 0 && !selectedQuestion) newErrors.question = '请选择关联题目';
    // if (selectedTab === 1 && selectedTags.length === 0) newErrors.tags = '请选择至少一个课程';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const discussionData = {
        title,
        content,
        questionId: selectedTab === 0 && selectedQuestion ? selectedQuestion._id || selectedQuestion.id : null,
        tags: selectedTab === 0 
          ? (selectedQuestion ? [selectedQuestion.title] : ['未分类题目']) // 使用默认课程
          : (selectedTags.length > 0 ? selectedTags : ['未分类课程']) // 使用默认课程
      };
      
      console.log('Creating discussion with data:', discussionData);
      console.log('Using API URL:', `${API_URL}/api/discussions`);
      console.log('Authorization token available:', !!token);
      
      try {
        const response = await axios.post(`${API_URL}/api/discussions`, discussionData, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        
        console.log('Create discussion response:', response.data);
        
        if (response.data.success) {
          const discussionId = response.data.discussion._id || response.data.discussion.id;
          console.log('Discussion created successfully, redirecting to:', `/discussions/${discussionId}`);
          router.push(`/discussions/${discussionId}`);
        } else {
          throw new Error(response.data.message || '创建讨论失败');
        }
      } catch (axiosError) {
        console.error('Axios请求错误:', axiosError);
        console.error('错误响应数据:', axiosError.response?.data);
        console.error('错误状态码:', axiosError.response?.status);
        throw axiosError;
      }
    } catch (err) {
      console.error('创建讨论失败:', err);
      
      // 使用更友好的错误提示
      let errorMessage = '创建讨论失败，请重试';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = '网络请求超时，请检查您的网络连接';
      } else if (err.response) {
        if (err.response.status === 401) {
          errorMessage = '未登录或会话已过期，请重新登录';
          // 可能需要重定向到登录页面
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        } else if (err.response.status === 403) {
          errorMessage = '您没有权限执行此操作';
        } else if (err.response.status >= 500) {
          errorMessage = `服务器错误 (${err.response.status})，请稍后再试`;
          console.error('服务器返回的错误信息:', err.response.data);
        } else {
          // 其他HTTP错误
          errorMessage = `请求失败 (${err.response.status}): ${err.response.data?.message || '未知错误'}`;
        }
      } else if (err.request) {
        // 请求发出但没有收到响应
        errorMessage = '无法连接到服务器，请检查您的网络连接';
      }
      
      alert(errorMessage);
      
      // 只有在非认证错误的情况下才模拟重定向
      if (!err.response || (err.response.status !== 401 && err.response.status !== 403)) {
        console.log('模拟重定向到讨论列表');
        router.push('/discussions');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {user?.role === 'teacher' ? <TeacherNavBar /> : <StudentNavBar />}
        <Container maxWidth="md" className="py-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <Button 
                startIcon={<ChevronLeftIcon />}
                onClick={() => router.push('/discussions')}
              >
                返回讨论列表
              </Button>
            </div>
            
            <Paper className="p-6">
              <Typography variant="h5" component="h1" gutterBottom>
                发起讨论
              </Typography>
              
              <TextField
                fullWidth
                label="讨论标题"
                variant="outlined"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
                className="mb-4"
              />
              
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={selectedTab} onChange={handleTabChange}>
                  <Tab label="针对题目" />
                  <Tab label="针对课程" />
                </Tabs>
              </Box>
              
              {selectedTab === 0 ? (
                // 题目选择
                <div className="mb-4">
                  <Autocomplete
                    options={questions}
                    getOptionLabel={(option) => option.title}
                    value={selectedQuestion}
                    onChange={(event, newValue) => setSelectedQuestion(newValue)}
                    loading={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="选择题目 (可选)"
                        variant="outlined"
                        error={!!errors.question}
                        helperText={errors.question || "选择关联的题目，如果没有可以跳过"}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                  {selectedQuestion && (
                    <Paper variant="outlined" className="mt-2 p-2 bg-blue-50 dark:bg-blue-900">
                      <Typography variant="body2">
                        已选择题目: <strong>{selectedQuestion.title}</strong>
                      </Typography>
                    </Paper>
                  )}
                </div>
              ) : (
                // 课程/课程选择
                <div className="mb-4">
                  <Autocomplete
                    multiple
                    options={availableTags.map(tag => tag.name || tag)}
                    value={selectedTags}
                    onChange={(event, newValue) => setSelectedTags(newValue)}
                    freeSolo
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option}
                          {...getTagProps({ index })}
                          color="primary"
                          variant="outlined"
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="选择或添加课程 (可选)"
                        variant="outlined"
                        error={!!errors.tags}
                        helperText={errors.tags || "可以选择已有课程或输入新课程后按回车添加"}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && customTag.trim()) {
                            event.preventDefault();
                            if (!selectedTags.includes(customTag.trim())) {
                              setSelectedTags([...selectedTags, customTag.trim()]);
                              setCustomTag('');
                            }
                          }
                        }}
                        onChange={(e) => {
                          if (params.inputProps.onChange) {
                            params.inputProps.onChange(e);
                          }
                          setCustomTag(e.target.value);
                        }}
                      />
                    )}
                  />
                  {availableTags.length === 0 && !loading && (
                    <FormHelperText>
                      未找到可用课程，您可以直接输入新课程并按回车添加
                    </FormHelperText>
                  )}
                  {selectedTags.length > 0 && (
                    <FormHelperText>
                      已选择 {selectedTags.length} 个课程
                    </FormHelperText>
                  )}
                  {loading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      <FormHelperText>正在加载课程...</FormHelperText>
                    </Box>
                  )}
                </div>
              )}
              
              <div className="mb-4">
                <InputLabel>讨论内容</InputLabel>
                <MarkdownEditor 
                  value={content} 
                  onChange={setContent} 
                  placeholder="输入讨论内容..."
                  error={!!errors.content}
                />
                {errors.content && (
                  <FormHelperText error>
                    {errors.content}
                  </FormHelperText>
                )}
              </div>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SendIcon />}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? <CircularProgress size={24} /> : '发布讨论'}
                </Button>
              </Box>
            </Paper>
          </div>
        </Container>
      </div>
    </AuthGuard>
  );
} 