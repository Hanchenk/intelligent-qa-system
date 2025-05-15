'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import AuthGuard from '../../../../components/AuthGuard';
import axios from 'axios';
import TagSelector from '../../../../components/tags/TagSelector';
import MarkdownEditor from '@/app/components/MarkdownEditor';

// Material UI 组件
import {
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Box,
  Paper,
  Typography,
  Divider,
  Alert,
  IconButton,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
  Chip,
  Stack,
  Snackbar,
  CircularProgress
} from '@mui/material';

// Material Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CreateQuestionPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // 题目基本信息
  const [question, setQuestion] = useState({
    title: '',
    type: '单选题',
    difficulty: '中等',
    score: 5,
    options: [
      { id: 1, content: '', isCorrect: false },
      { id: 2, content: '', isCorrect: false },
      { id: 3, content: '', isCorrect: false },
      { id: 4, content: '', isCorrect: false }
    ],
    correctAnswer: '',  // 用于填空题、判断题
    explanation: '',    // 解析
    tags: []            // 课程 - 现在存储对象数组，每个对象包含_id和name
  });
  
  // 表单验证错误
  const [errors, setErrors] = useState({});
  
  // 加载和提交状态
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  
  // 题目类型和难度选项
  const questionTypes = ['单选题', '多选题', '判断题', '填空题', '简答题', '编程题'];
  const difficultyLevels = ['简单', '中等', '困难'];
  
  // 处理基本信息变更
  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    
    // 清除相关字段的错误
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
    
    // 如果改变题目类型，重置选项和答案
    if (name === 'type') {
      let updatedQuestion = { ...question, [name]: value };
      
      // 根据题目类型设置默认值
      switch (value) {
        case '单选题':
          updatedQuestion.options = [
            { id: 1, content: '', isCorrect: false },
            { id: 2, content: '', isCorrect: false },
            { id: 3, content: '', isCorrect: false },
            { id: 4, content: '', isCorrect: false }
          ];
          updatedQuestion.correctAnswer = '';
          break;
        case '多选题':
          updatedQuestion.options = [
            { id: 1, content: '', isCorrect: false },
            { id: 2, content: '', isCorrect: false },
            { id: 3, content: '', isCorrect: false },
            { id: 4, content: '', isCorrect: false }
          ];
          updatedQuestion.correctAnswer = '';
          break;
        case '判断题':
          updatedQuestion.options = [];
          updatedQuestion.correctAnswer = 'true';
          break;
        case '填空题':
        case '简答题':
        case '编程题':
          updatedQuestion.options = [];
          updatedQuestion.correctAnswer = '';
          break;
      }
      
      setQuestion(updatedQuestion);
    } else {
      setQuestion({
        ...question,
        [name]: value
      });
    }
  };
  
  // 处理选项变更
  const handleOptionChange = (optionId, field, value) => {
    const updatedOptions = question.options.map(option => {
      if (option.id === optionId) {
        return { ...option, [field]: value };
      }
      
      // 如果是单选题且更改正确性，则其他选项设为false
      if (field === 'isCorrect' && value === true && question.type === '单选题') {
        return { ...option, isCorrect: option.id === optionId };
      }
      
      return option;
    });
    
    setQuestion({
      ...question,
      options: updatedOptions
    });
    
    // 清除选项相关错误
    if (errors.options) {
      setErrors({
        ...errors,
        options: null
      });
    }
  };
  
  // 添加选项
  const handleAddOption = () => {
    const newId = Math.max(...question.options.map(o => o.id), 0) + 1;
    
    setQuestion({
      ...question,
      options: [...question.options, { id: newId, content: '', isCorrect: false }]
    });
  };
  
  // 删除选项
  const handleDeleteOption = (optionId) => {
    // 至少保留两个选项
    if (question.options.length <= 2) {
      setErrors({
        ...errors,
        options: '至少需要两个选项'
      });
      return;
    }
    
    setQuestion({
      ...question,
      options: question.options.filter(option => option.id !== optionId)
    });
  };
  
  // 处理课程变更
  const handleTagsChange = (newTags) => {
    setQuestion({
      ...question,
      tags: newTags // 新的课程对象数组
    });
  };
  
  // 表单验证
  const validateForm = () => {
    const newErrors = {};
    
    // 验证题目
    if (!question.title.trim()) {
      newErrors.title = '请输入题目内容';
    }
    
    // 根据题目类型验证
    switch (question.type) {
      case '单选题':
      case '多选题':
        // 验证选项内容
        if (question.options.some(option => !option.content.trim())) {
          newErrors.options = '所有选项必须填写内容';
        }
        
        // 验证是否选择了正确答案
        if (!question.options.some(option => option.isCorrect)) {
          newErrors.correctAnswer = '请至少选择一个正确答案';
        }
        break;
        
      case '判断题':
        if (!question.correctAnswer) {
          newErrors.correctAnswer = '请选择正确答案';
        }
        break;
        
      case '填空题':
      case '简答题':
        if (!question.correctAnswer.trim()) {
          newErrors.correctAnswer = '请输入参考答案';
        }
        break;
        
      case '编程题':
        // 编程题可以没有标准答案，但至少需要题目描述
        break;
    }
    
    // 验证分数
    if (!question.score || question.score <= 0) {
      newErrors.score = '请输入有效的分数';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 表单验证
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // 准备提交数据
      const formData = {
        ...question,
        // 修改tags字段，从对象数组中只提取ID
        tags: question.tags.map(tag => tag._id),
        // 根据题目类型处理选项和答案
        ...(question.type === '单选题' || question.type === '多选题' 
          ? { 
              options: question.options.map(o => ({ 
                content: o.content, 
                isCorrect: o.isCorrect 
              })),
              correctAnswer: null
            }
          : { 
              options: [],
              ...(question.type === '判断题' 
                ? { correctAnswer: question.correctAnswer === 'true' }
                : { correctAnswer: question.correctAnswer }
              )
            }
        )
      };
      
      // 提交到API
      await axios.post(`${API_URL}/questions`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // 显示成功消息
      setSubmitStatus({
        open: true,
        message: '题目创建成功！',
        severity: 'success'
      });
      
      // 延迟导航回列表页面
      setTimeout(() => {
        router.push('/dashboard/teacher/questions');
      }, 1500);
      
    } catch (err) {
      console.error('创建题目失败:', err);
      
      // 显示错误消息
      setSubmitStatus({
        open: true,
        message: err.response?.data?.message || '创建题目失败，请重试',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 关闭提示
  const handleCloseSnackbar = () => {
    setSubmitStatus({
      ...submitStatus,
      open: false
    });
  };
  
  // 处理取消
  const handleCancel = () => {
    router.push('/dashboard/teacher/questions');
  };
  
  // 渲染不同题型的表单
  const renderQuestionTypeForm = () => {
    switch (question.type) {
      case '单选题':
      case '多选题':
        return (
          <Box className="mt-6">
            <Typography variant="subtitle1" className="mb-2 font-bold">
              选项
              {errors.options && <FormHelperText error>{errors.options}</FormHelperText>}
              {errors.correctAnswer && <FormHelperText error>{errors.correctAnswer}</FormHelperText>}
            </Typography>
            
            {question.options.map((option, index) => (
              <Box key={option.id} className="flex items-center mb-3">
                <FormControlLabel
                  control={
                    question.type === '单选题' ? (
                      <Radio
                        checked={option.isCorrect}
                        onChange={(e) => handleOptionChange(option.id, 'isCorrect', e.target.checked)}
                        color="primary"
                      />
                    ) : (
                      <Switch
                        checked={option.isCorrect}
                        onChange={(e) => handleOptionChange(option.id, 'isCorrect', e.target.checked)}
                        color="primary"
                      />
                    )
                  }
                  label={`选项 ${String.fromCharCode(65 + index)}`}
                  className="min-w-[80px]"
                />
                
                <TextField
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={option.content}
                  onChange={(e) => handleOptionChange(option.id, 'content', e.target.value)}
                  placeholder={`选项 ${String.fromCharCode(65 + index)} 内容`}
                  className="mr-2"
                />
                
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteOption(option.id)}
                  disabled={question.options.length <= 2}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddOption}
              size="small"
              className="mt-2"
            >
              添加选项
            </Button>
          </Box>
        );
        
      case '判断题':
        return (
          <Box className="mt-6">
            <Typography variant="subtitle1" className="mb-2 font-bold">
              正确答案
            </Typography>
            
            <RadioGroup
              row
              value={question.correctAnswer}
              onChange={(e) => handleBasicInfoChange({ target: { name: 'correctAnswer', value: e.target.value } })}
            >
              <FormControlLabel value="true" control={<Radio />} label="正确" />
              <FormControlLabel value="false" control={<Radio />} label="错误" />
            </RadioGroup>
            
            {errors.correctAnswer && <FormHelperText error>{errors.correctAnswer}</FormHelperText>}
          </Box>
        );
        
      case '填空题':
        return (
          <Box className="mt-6">
            <Typography variant="subtitle1" className="mb-2 font-bold">
              参考答案
            </Typography>
            
            <TextField
              fullWidth
              variant="outlined"
              name="correctAnswer"
              value={question.correctAnswer}
              onChange={handleBasicInfoChange}
              placeholder="请输入参考答案"
              error={Boolean(errors.correctAnswer)}
              helperText={errors.correctAnswer}
            />
            
            <FormHelperText>
              如有多个填空，请用分号 (;) 分隔每个填空的答案
            </FormHelperText>
          </Box>
        );
        
      case '简答题':
      case '编程题':
        return (
          <Box className="mt-6">
            <Typography variant="subtitle1" className="mb-2 font-bold">
              参考答案 {question.type === '编程题' && '(可选)'}
            </Typography>
            
            <TextField
              fullWidth
              variant="outlined"
              name="correctAnswer"
              value={question.correctAnswer}
              onChange={handleBasicInfoChange}
              placeholder="请输入参考答案"
              multiline
              rows={6}
              error={Boolean(errors.correctAnswer)}
              helperText={errors.correctAnswer}
            />
          </Box>
        );
        
      default:
        return null;
    }
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
                  <Link href="/dashboard/teacher/questions" className="px-3 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900">
                    题库管理
                  </Link>
                  <Link href="/dashboard/teacher/exams" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
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
          <div className="px-4 py-6 sm:px-0">
            <Paper className="p-6">
              {/* 返回按钮和页面标题 */}
              <div className="flex items-center mb-6">
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => router.push('/dashboard/teacher/questions')}
                  variant="text"
                  color="primary"
                >
                  返回题库
                </Button>
                <Typography variant="h5" component="h1" className="ml-4 font-bold">
                  创建新题目
                </Typography>
              </div>
              
              <Divider className="mb-6" />
              
              {/* 创建题目表单 */}
              <form onSubmit={handleSubmit}>
                {/* 基本信息 */}
                <Box className="mb-6">
                  <Typography variant="subtitle1" className="mb-4 font-bold">
                    基本信息
                  </Typography>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <FormControl fullWidth>
                      <InputLabel>题目类型</InputLabel>
                      <Select
                        name="type"
                        value={question.type}
                        onChange={handleBasicInfoChange}
                        label="题目类型"
                      >
                        {questionTypes.map((type) => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth>
                      <InputLabel>难度等级</InputLabel>
                      <Select
                        name="difficulty"
                        value={question.difficulty}
                        onChange={handleBasicInfoChange}
                        label="难度等级"
                      >
                        {difficultyLevels.map((level) => (
                          <MenuItem key={level} value={level}>{level}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <TextField
                      label="分值"
                      type="number"
                      name="score"
                      value={question.score}
                      onChange={handleBasicInfoChange}
                      variant="outlined"
                      InputProps={{ inputProps: { min: 1, max: 100 } }}
                      error={Boolean(errors.score)}
                      helperText={errors.score}
                    />
                  </div>
                  
                  {/* 替换为Markdown编辑器 */}
                  <Box className="mb-4">
                    <MarkdownEditor
                      label="题目内容"
                      value={question.title}
                      onChange={(value) => handleBasicInfoChange({ target: { name: 'title', value }})}
                      placeholder="请输入题目内容"
                      height={300}
                      error={errors.title}
                    />
                  </Box>
                  
                  {/* 课程输入 */}
                  <Box className="mt-6">
                    <Typography variant="subtitle1" className="mb-2 font-bold">
                      课程
                    </Typography>
                    <TagSelector 
                      selectedTags={question.tags} 
                      onChange={handleTagsChange}
                      placeholder="选择或搜索相关课程..."
                    />
                    <FormHelperText>
                      添加课程有助于对题目分类和查找
                    </FormHelperText>
                  </Box>
                </Box>
                
                <Divider className="my-4" />
                
                {/* 根据题型渲染不同表单 */}
                {renderQuestionTypeForm()}
                
                <Divider className="my-4" />
                
                {/* 题目解析 - 替换为Markdown编辑器 */}
                <Box className="mt-6">
                  <MarkdownEditor
                    label="题目解析 (可选)"
                    value={question.explanation}
                    onChange={(value) => handleBasicInfoChange({ target: { name: 'explanation', value }})}
                    placeholder="请输入题目解析"
                    height={250}
                  />
                </Box>
                
                {/* 表单按钮 */}
                <Box className="mt-8 flex justify-end space-x-2">
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    取消
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? '保存中...' : '保存题目'}
                  </Button>
                </Box>
              </form>
            </Paper>
          </div>
        </main>
        
        {/* 提示消息 */}
        <Snackbar
          open={submitStatus.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={submitStatus.severity}
            variant="filled"
          >
            {submitStatus.message}
          </Alert>
        </Snackbar>
      </div>
    </AuthGuard>
  );
} 