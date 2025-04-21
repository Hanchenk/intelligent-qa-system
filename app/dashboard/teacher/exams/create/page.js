'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import AuthGuard from '../../../../components/AuthGuard';
import { 
  Button, 
  TextField, 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Grid, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Snackbar,
  InputAdornment,
  Autocomplete
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

// 定义API URL常量 - 确保它与.env.local中的设置一致
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function CreateExamPage() {
  const router = useRouter();
  const { token } = useSelector((state) => state.auth);
  const localToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const effectiveToken = token || localToken;
  
  // 考试基本信息
  const [examInfo, setExamInfo] = useState({
    title: '',
    description: '',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 默认为明天
    endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),   // 默认为后天
    duration: 60,  // 默认60分钟
    passingScore: 60
  });
  
  // 题目搜索和筛选
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  
  // 准备默认的模拟标签数据
  const defaultTags = [
    { _id: 't1', name: 'JavaScript', color: '#F0DB4F' },
    { _id: 't2', name: 'React', color: '#61DAFB' },
    { _id: 't3', name: '前端', color: '#E34F26' },
    { _id: 't4', name: '后端', color: '#68A063' },
    { _id: 't5', name: '数据库', color: '#336791' },
    { _id: 't6', name: '网络', color: '#007ACC' }
  ];
  
  const [availableTags, setAvailableTags] = useState(defaultTags);
  const [loading, setLoading] = useState(false);
  
  // 已选择的题目
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // 题目类型和难度选项
  const questionTypes = ['单选题', '多选题', '判断题', '填空题', '简答题', '编程题'];
  const difficultyLevels = ['简单', '中等', '困难'];
  
  useEffect(() => {
    // 确保在挂载组件时立即加载数据
    
    // 设置初始题目数据
    const initialQuestions = getMockQuestions();
    setQuestions(initialQuestions);
    setFilteredQuestions(initialQuestions);
    
    // 然后尝试从API获取真实数据
    fetchQuestions();
    fetchTags();
  }, []);
  
  // 获取题目列表
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      console.log('正在请求API:', `${API_URL}/questions`);
      
      // 创建一个完整的请求，确保获取所有题目
      const params = new URLSearchParams();
      params.append('page', 1);
      params.append('limit', 100); // 设置一个较大的限制，确保获取更多题目
      
      const response = await axios.get(`${API_URL}/questions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${effectiveToken}` }
      });
      
      console.log('API响应:', response.data);
      
      // 检查响应格式
      let questionData = [];
      if(response.data && response.data.data && Array.isArray(response.data.data)) {
        questionData = response.data.data;
      } else if(Array.isArray(response.data)) {
        questionData = response.data;
      }
      
      // 确保每个题目都有score属性
      questionData = questionData.map(q => ({
        ...q,
        score: q.score || 5 // 如果没有分数，默认设为5分
      }));
      
      if(questionData.length > 0) {
        setQuestions(questionData);
        setFilteredQuestions(questionData);
        console.log(`成功加载 ${questionData.length} 道题目`);
      } else {
        // 加载模拟数据
        const mockData = getMockQuestions();
        setQuestions(mockData);
        setFilteredQuestions(mockData);
        console.log('API返回题目为空，使用模拟数据');
      }
      setLoading(false);
    } catch (error) {
      console.error('获取题目失败:', error);
      // 显示错误提示
      setSnackbar({
        open: true,
        message: `获取题目失败: ${error.message}`,
        severity: 'warning'
      });
      
      // 使用模拟数据
      const mockData = getMockQuestions();
      setQuestions(mockData);
      setFilteredQuestions(mockData);
      setLoading(false);
    }
  };
  
  // 获取标签列表
  const fetchTags = async () => {
    try {
      console.log('正在请求API:', `${API_URL}/tags`);
      const response = await axios.get(`${API_URL}/tags`, {
        headers: { Authorization: `Bearer ${effectiveToken}` }
      });
      console.log('获取到标签:', response.data);
      
      // 尝试不同的响应格式
      let tagsData = [];
      if (Array.isArray(response.data)) {
        tagsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        tagsData = response.data.data;
      } else if (response.data && typeof response.data === 'object') {
        // 尝试从对象中提取数组
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          // 使用找到的第一个数组
          tagsData = possibleArrays[0];
        }
      }
      
      console.log('处理后的标签数据:', tagsData);
      
      if (tagsData && tagsData.length > 0) {
        // 确保每个标签都有必要的属性
        const formattedTags = tagsData.map(tag => ({
          _id: tag._id || tag.id || `tag-${Math.random().toString(36).substr(2, 9)}`,
          name: tag.name || '未命名标签',
          color: tag.color || getRandomColor()
        }));
        
        setAvailableTags(formattedTags);
        console.log('设置标签数据:', formattedTags);
      } else {
        // 使用默认标签
        console.log('API返回的标签为空，使用默认标签');
        setAvailableTags(defaultTags);
      }
    } catch (error) {
      console.error('获取标签失败:', error);
      // 显示错误提示
      setSnackbar({
        open: true,
        message: `获取标签失败: ${error.message}`,
        severity: 'warning'
      });
      
      // 使用模拟标签数据
      console.log('使用默认标签');
      setAvailableTags(defaultTags);
    }
  };
  
  // 生成随机颜色的辅助函数
  const getRandomColor = () => {
    const colors = [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
      '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
      '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
      '#FF5722', '#795548', '#9E9E9E', '#607D8B'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // 处理基本信息变更
  const handleExamInfoChange = (field, value) => {
    setExamInfo({
      ...examInfo,
      [field]: value
    });
  };

  // 格式化日期时间为输入框格式
  const formatDateTimeForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // 处理日期时间输入变更
  const handleDateTimeChange = (field, value) => {
    const newDate = value ? new Date(value) : null;
    handleExamInfoChange(field, newDate);
  };
  
  // 处理搜索和筛选
  const handleSearch = () => {
    setLoading(true);
    console.log('开始筛选，原始题目数量:', questions.length);
    
    // 复制一份原始题目列表
    let results = [...questions];
    console.log('筛选前总题目数:', results.length);
    
    // 应用筛选条件
    if (selectedTypes.length > 0) {
      console.log('应用类型筛选:', selectedTypes);
      results = results.filter(q => selectedTypes.includes(q.type));
      console.log(`按类型筛选后剩余: ${results.length}题`);
    }
    
    if (selectedDifficulties.length > 0) {
      console.log('应用难度筛选:', selectedDifficulties);
      results = results.filter(q => selectedDifficulties.includes(q.difficulty));
      console.log(`按难度筛选后剩余: ${results.length}题`);
    }
    
    if (searchTerm) {
      console.log('应用关键词筛选:', searchTerm);
      results = results.filter(q => 
        q.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log(`按关键词筛选后剩余: ${results.length}题`);
    }
    
    // 更新筛选后的题目列表
    setFilteredQuestions(results);
    console.log('筛选结果已更新，筛选后题目数:', results.length);
    
    // 提示用户
    if (results.length > 0) {
      setSnackbar({
        open: true,
        message: `筛选成功，找到 ${results.length} 道题目`,
        severity: 'success'
      });
    } else {
      setSnackbar({
        open: true,
        message: '没有找到符合条件的题目',
        severity: 'info'
      });
    }
    
    setLoading(false);
  };
  
  // 添加题目到考试
  const handleAddQuestion = (question) => {
    // 检查是否已添加
    if (selectedQuestions.some(q => q.question._id === question._id)) {
      setSnackbar({
        open: true,
        message: '该题目已添加到考试中',
        severity: 'warning'
      });
      return;
    }
    
    setSelectedQuestions([
      ...selectedQuestions,
      {
        question: question,
        score: question.score // 默认使用题目的分数
      }
    ]);
  };
  
  // 从考试中移除题目
  const handleRemoveQuestion = (index) => {
    const newSelectedQuestions = [...selectedQuestions];
    newSelectedQuestions.splice(index, 1);
    setSelectedQuestions(newSelectedQuestions);
  };
  
  // 更新题目分数
  const handleScoreChange = (index, value) => {
    const newSelectedQuestions = [...selectedQuestions];
    newSelectedQuestions[index].score = Number(value);
    setSelectedQuestions(newSelectedQuestions);
  };
  
  // 计算总分
  const calculateTotalScore = () => {
    return selectedQuestions.reduce((total, q) => total + q.score, 0);
  };
  
  // 创建考试
  const handleCreateExam = async () => {
    // 验证表单
    if (!examInfo.title) {
      setSnackbar({
        open: true,
        message: '请输入考试标题',
        severity: 'error'
      });
      return;
    }
    
    if (selectedQuestions.length === 0) {
      setSnackbar({
        open: true,
        message: '请至少添加一道题目',
        severity: 'error'
      });
      return;
    }
    
    // 构建考试数据
    const examData = {
      ...examInfo,
      questions: selectedQuestions.map(q => ({
        question: q.question._id,
        questionId: q.question._id,
        score: q.score,
        // 添加题目详细信息，确保编辑和学生端能正确显示
        questionDetails: {
          _id: q.question._id,
          title: q.question.title,
          type: q.question.type,
          difficulty: q.question.difficulty,
          tags: q.question.tags,
          options: q.question.options,
          answer: q.question.answer,
          content: q.question.content
        }
      })),
      totalScore: calculateTotalScore()
    };
    
    try {
      console.log('发送创建考试请求:', `${API_URL}/exams`, examData);
      const response = await axios.post(`${API_URL}/exams`, examData, {
        headers: { Authorization: `Bearer ${effectiveToken}` }
      });
      
      console.log('创建考试响应:', response.data);
      
      // 如果API返回的考试数据缺少题目详细信息，尝试更新考试
      if (response.data && response.data._id) {
        try {
          const examId = response.data._id;
          const updateResponse = await axios.put(`${API_URL}/exams/${examId}`, examData, {
            headers: { Authorization: `Bearer ${effectiveToken}` }
          });
          console.log('更新考试详情响应:', updateResponse.data);
        } catch (updateError) {
          console.warn('二次更新考试失败，但不影响基本功能:', updateError);
        }
      }
      
      setSnackbar({
        open: true,
        message: '考试创建成功',
        severity: 'success'
      });
      
      // 延迟导航，让用户看到成功消息
      setTimeout(() => {
        router.push('/dashboard/teacher/exams');
      }, 1500);
    } catch (error) {
      console.error('创建考试失败:', error);
      
      // 特殊处理：如果后端不支持完整题目信息的存储，改为只存储必要信息
      if (error.response?.status === 400) {
        try {
          console.log('尝试简化数据格式并重新提交...');
          const simplifiedData = {
            ...examInfo,
            questions: selectedQuestions.map(q => ({
              question: q.question._id,
              questionId: q.question._id,
              score: q.score
            })),
            totalScore: calculateTotalScore()
          };
          
          const retryResponse = await axios.post(`${API_URL}/exams`, simplifiedData, {
            headers: { Authorization: `Bearer ${effectiveToken}` }
          });
          
          console.log('使用简化数据创建考试成功:', retryResponse.data);
          setSnackbar({
            open: true,
            message: '考试创建成功(简化模式)',
            severity: 'success'
          });
          
          // 延迟导航
          setTimeout(() => {
            router.push('/dashboard/teacher/exams');
          }, 1500);
          
          return;
        } catch (retryError) {
          console.error('简化模式创建考试也失败:', retryError);
        }
      }
      
      setSnackbar({
        open: true,
        message: `创建考试失败: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    }
  };

  // 获取模拟题目数据的函数
  const getMockQuestions = () => {
    return [
      { 
        _id: '1', 
        title: 'JavaScript中的闭包是什么？',
        type: '简答题', 
        difficulty: '中等',
        score: 10,
        createdAt: new Date('2023-05-01')
      },
      { 
        _id: '2', 
        title: 'React组件的生命周期包括哪些阶段？',
        type: '简答题', 
        difficulty: '中等',
        score: 10,
        createdAt: new Date('2023-05-05')
      },
      { 
        _id: '3', 
        title: 'CSS选择器的优先级规则是什么？',
        type: '简答题', 
        difficulty: '简单',
        score: 5,
        createdAt: new Date('2023-05-10')
      },
      { 
        _id: '4', 
        title: '在JavaScript中，undefined和null有什么区别？',
        type: '简答题', 
        difficulty: '简单',
        score: 5,
        createdAt: new Date('2023-05-15')
      },
      { 
        _id: '5', 
        title: 'HTTP状态码403表示什么？',
        type: '单选题', 
        difficulty: '简单',
        score: 2,
        createdAt: new Date('2023-05-20')
      },
      { 
        _id: '6', 
        title: 'SQL注入是一种常见的网络攻击方式',
        type: '判断题', 
        difficulty: '简单',
        score: 2,
        createdAt: new Date('2023-06-01')
      },
      { 
        _id: '7', 
        title: '以下哪些是NoSQL数据库？',
        type: '多选题', 
        difficulty: '中等',
        score: 4,
        createdAt: new Date('2023-06-10')
      },
      {
        _id: '8',
        title: '如何实现一个深拷贝函数？',
        type: '编程题',
        difficulty: '困难',
        score: 15,
        createdAt: new Date('2023-07-01')
      },
      {
        _id: '9',
        title: '什么是RESTful API？',
        type: '简答题',
        difficulty: '中等',
        score: 8,
        createdAt: new Date('2023-07-05')
      },
      {
        _id: '10',
        title: '线程和进程的区别是什么？',
        type: '简答题',
        difficulty: '中等',
        score: 8,
        createdAt: new Date('2023-07-10')
      }
    ];
  };

  return (
    <AuthGuard allowedRoles={['teacher']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 顶部导航栏 */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-500">
                    课程习题网站
                  </span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                  <Link href="/dashboard/teacher" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    仪表盘
                  </Link>
                  <Link href="/dashboard/teacher/questions" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    题库管理
                  </Link>
                  <Link href="/dashboard/teacher/exams" className="px-3 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900">
                    考试管理
                  </Link>
                  <Link href="/dashboard/profile" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    个人中心
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* 主内容区 */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              创建新考试
            </Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/dashboard/teacher/exams')}
              sx={{ mt: 1 }}
            >
              返回考试列表
            </Button>
          </Box>

          {/* 考试基本信息 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>基本信息</Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="考试标题"
                  value={examInfo.title}
                  onChange={(e) => handleExamInfoChange('title', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="考试时长(分钟)"
                  type="number"
                  value={examInfo.duration}
                  onChange={(e) => handleExamInfoChange('duration', parseInt(e.target.value))}
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">分钟</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="开始时间"
                  type="datetime-local"
                  value={formatDateTimeForInput(examInfo.startTime)}
                  onChange={(e) => handleDateTimeChange('startTime', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="结束时间"
                  type="datetime-local"
                  value={formatDateTimeForInput(examInfo.endTime)}
                  onChange={(e) => handleDateTimeChange('endTime', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="及格分数"
                  type="number"
                  value={examInfo.passingScore}
                  onChange={(e) => handleExamInfoChange('passingScore', parseInt(e.target.value))}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="考试说明"
                  multiline
                  rows={3}
                  value={examInfo.description}
                  onChange={(e) => handleExamInfoChange('description', e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>
          
          {/* 选择题目 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>选择题目</Typography>
            <Divider sx={{ mb: 3 }} />
            
            {/* 筛选条件 */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="搜索题目"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleSearch}>
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>题目类型</InputLabel>
                  <Select
                    multiple
                    value={selectedTypes}
                    onChange={(e) => setSelectedTypes(e.target.value)}
                    input={<OutlinedInput label="题目类型" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {questionTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        <Checkbox checked={selectedTypes.indexOf(type) > -1} />
                        <ListItemText primary={type} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>难度级别</InputLabel>
                  <Select
                    multiple
                    value={selectedDifficulties}
                    onChange={(e) => setSelectedDifficulties(e.target.value)}
                    input={<OutlinedInput label="难度级别" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {difficultyLevels.map((level) => (
                      <MenuItem key={level} value={level}>
                        <Checkbox checked={selectedDifficulties.indexOf(level) > -1} />
                        <ListItemText primary={level} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  options={Array.isArray(availableTags) ? availableTags : []}
                  getOptionLabel={(option) => option?.name || ''}
                  value={
                    Array.isArray(availableTags) && selectedTags.length > 0
                      ? availableTags.filter(tag => tag && tag._id && selectedTags.includes(tag._id))
                      : []
                  }
                  onChange={(event, newValue) => {
                    console.log('标签选择变更:', newValue);
                    if (Array.isArray(newValue)) {
                      const tagIds = newValue
                        .filter(tag => tag && tag._id)
                        .map(tag => tag._id);
                      setSelectedTags(tagIds);
                      console.log('设置选中标签IDs:', tagIds);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="标签"
                      placeholder="选择标签"
                      helperText={availableTags.length === 0 ? "没有可用标签" : ""}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    Array.isArray(value) ? value.map((option, index) => {
                      const tagName = option?.name || '未命名标签';
                      const tagColor = option?.color || '#cccccc';
                      return (
                        <Chip
                          key={option?._id || index}
                          label={tagName}
                          {...getTagProps({ index })}
                          size="small"
                          style={{ 
                            backgroundColor: tagColor, 
                            color: '#fff',
                            margin: '2px'
                          }}
                        />
                      );
                    }) : null
                  }
                  renderOption={(props, option) => (
                    <li {...props}>
                      <div
                        style={{
                          backgroundColor: option.color || '#cccccc',
                          width: 14,
                          height: 14,
                          marginRight: 10,
                          borderRadius: 2
                        }}
                      ></div>
                      {option.name || '未命名标签'}
                    </li>
                  )}
                  isOptionEqualToValue={(option, value) => 
                    option?._id === value?._id
                  }
                  sx={{ width: '100%' }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button 
                  variant="contained" 
                  onClick={handleSearch}
                  startIcon={<SearchIcon />}
                >
                  筛选题目
                </Button>
              </Grid>
            </Grid>
            
            {/* 题目列表 */}
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>标题</TableCell>
                    <TableCell>类型</TableCell>
                    <TableCell>难度</TableCell>
                    <TableCell>分数</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">加载中...</TableCell>
                    </TableRow>
                  ) : filteredQuestions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">没有找到题目</TableCell>
                    </TableRow>
                  ) : (
                    filteredQuestions.map((question) => (
                      <TableRow key={question._id} hover>
                        <TableCell sx={{ maxWidth: 300 }}>
                          <Typography noWrap>
                            {question.title}
                          </Typography>
                        </TableCell>
                        <TableCell>{question.type}</TableCell>
                        <TableCell>{question.difficulty}</TableCell>
                        <TableCell>{question.score}</TableCell>
                        <TableCell>
                          <IconButton 
                            color="primary" 
                            onClick={() => handleAddQuestion(question)}
                            size="small"
                          >
                            <AddIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          
          {/* 已选择的题目 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">已选题目</Typography>
              <Typography>
                总分：{calculateTotalScore()} 分 | 题目数：{selectedQuestions.length} 题
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            {selectedQuestions.length === 0 ? (
              <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                尚未选择任何题目
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>序号</TableCell>
                      <TableCell>题目标题</TableCell>
                      <TableCell>类型</TableCell>
                      <TableCell>难度</TableCell>
                      <TableCell>分数</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedQuestions.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>
                          <Typography noWrap>
                            {item.question.title}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.question.type}</TableCell>
                        <TableCell>{item.question.difficulty}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.score}
                            onChange={(e) => handleScoreChange(index, e.target.value)}
                            size="small"
                            sx={{ width: 80 }}
                            InputProps={{
                              inputProps: { min: 1 }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            color="error" 
                            onClick={() => handleRemoveQuestion(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
          
          {/* 提交按钮 */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button 
              variant="outlined" 
              onClick={() => router.push('/dashboard/teacher/exams')}
              sx={{ mr: 2 }}
            >
              取消
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreateExam}
              disabled={selectedQuestions.length === 0 || !examInfo.title}
            >
              创建考试
            </Button>
          </Box>
        </main>
      </div>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AuthGuard>
  );
} 