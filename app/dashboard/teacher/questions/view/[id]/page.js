'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import AuthGuard from '../../../../../components/AuthGuard';
import MarkdownPreview from '@/app/components/MarkdownPreview';
import axios from 'axios';

// Material UI 组件
import {
  Button,
  Paper,
  Typography,
  Divider,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  Stack,
  Snackbar
} from '@mui/material';

// Material Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const API_URL = 'http://localhost:3001/api';

export default function ViewQuestionPage({ params }) {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const questionId = params.id;
  
  // 状态
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });
  
  // 加载题目数据
  useEffect(() => {
    async function fetchQuestion() {
      if (!token || !questionId) return;
      
      try {
        const response = await axios.get(`${API_URL}/questions/${questionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // 处理API返回的题目数据
        // const questionData = response.data.data;
        
        // 模拟API返回的数据
        const mockQuestionData = {
          _id: questionId,
          title: '下列关于JavaScript中的变量声明，哪一个是正确的？',
          type: '单选题',
          difficulty: '中等',
          score: 5,
          options: [
            { _id: '1', content: 'let 声明的变量不可重新赋值', isCorrect: false },
            { _id: '2', content: 'const 声明的变量可以重新赋值', isCorrect: false },
            { _id: '3', content: 'var 声明的变量没有块级作用域', isCorrect: true },
            { _id: '4', content: 'const 声明的对象内部属性不能修改', isCorrect: false }
          ],
          correctAnswer: null, // 单选题和多选题的正确答案在options中
          explanation: '在 JavaScript 中，var 声明的变量没有块级作用域，而是函数作用域或全局作用域。let 和 const 声明的变量有块级作用域，其中 const 声明的变量不能重新赋值，但如果是对象，其内部属性可以修改。',
          tags: ['JavaScript', '前端', '变量'],
          creator: {
            _id: '123',
            username: '李老师'
          },
          createdAt: new Date('2023-05-10'),
          updatedAt: new Date('2023-05-15'),
          useCount: 8
        };
        
        // 使用模拟数据
        setQuestion(mockQuestionData);
        setError(null);
      } catch (err) {
        console.error('获取题目失败:', err);
        setError('获取题目失败，请重试');
      } finally {
        setLoading(false);
      }
    }
    
    fetchQuestion();
  }, [questionId, token]);
  
  // 处理删除题目
  const handleDelete = async () => {
    if (!token || !questionId) return;
    
    setLoading(true);
    
    try {
      await axios.delete(`${API_URL}/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSnackbar({
        open: true,
        message: '题目已删除',
        severity: 'success'
      });
      
      // 延迟跳转回题目列表
      setTimeout(() => {
        router.push('/dashboard/teacher/questions');
      }, 1500);
    } catch (err) {
      console.error('删除题目失败:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || '删除题目失败，请重试',
        severity: 'error'
      });
      setLoading(false);
    }
  };
  
  // 返回列表页
  const handleBack = () => {
    router.push('/dashboard/teacher/questions');
  };
  
  // 编辑题目
  const handleEdit = () => {
    router.push(`/dashboard/teacher/questions/edit/${questionId}`);
  };
  
  // 关闭提示消息
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // 渲染题目难度课程
  const renderDifficultyChip = (difficulty) => {
    let color = 'default';
    
    switch (difficulty) {
      case '简单':
        color = 'success';
        break;
      case '中等':
        color = 'warning';
        break;
      case '困难':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return <Chip size="small" label={difficulty} color={color} />;
  };
  
  // 渲染题目类型
  const renderQuestionType = (type) => {
    return <Chip size="small" label={type} />;
  };
  
  // 渲染选项
  const renderOptions = (options, type) => {
    return options.map((option, index) => {
      const isCorrect = option.isCorrect;
      const label = String.fromCharCode(65 + index); // A, B, C, D...
      
      return (
        <Box key={option._id || index} className="flex items-start mb-2">
          <Radio
            checked={isCorrect}
            color="primary"
            readOnly
            className="mt-0"
          />
          <Box className="ml-1">
            <Typography 
              variant="body1" 
              className={isCorrect ? 'font-bold text-green-600' : ''}
            >
              {label}. {option.content}
              {isCorrect && <span className="ml-2 text-green-600">(正确答案)</span>}
            </Typography>
          </Box>
        </Box>
      );
    });
  };
  
  // 渲染判断题答案
  const renderBooleanAnswer = (correctAnswer) => {
    return (
      <RadioGroup value={correctAnswer ? 'true' : 'false'} name="boolean-answer" className="ml-2">
        <FormControlLabel 
          value="true" 
          control={<Radio />} 
          label="正确" 
          disabled 
          checked={correctAnswer === true}
        />
        <FormControlLabel 
          value="false" 
          control={<Radio />} 
          label="错误" 
          disabled 
          checked={correctAnswer === false}
        />
      </RadioGroup>
    );
  };
  
  // 渲染题目内容
  const renderQuestionContent = () => {
    if (!question) return null;
    
    return (
      <>
        <Box className="mb-6">
          {/* 使用Markdown预览组件来显示题目内容 */}
          <Box className="mb-4">
            <MarkdownPreview content={question.title} />
          </Box>
          
          <Box className="flex flex-wrap gap-2 mb-4">
            {renderQuestionType(question.type)}
            {renderDifficultyChip(question.difficulty)}
            <Chip size="small" label={`${question.score}分`} color="primary" />
            {question.tags.map(tag => (
              <Chip key={tag} size="small" label={tag} variant="outlined" />
            ))}
          </Box>
          
          <Typography variant="body2" className="text-gray-500 mb-2">
            创建者: {question.creator.username}
          </Typography>
          
          <Typography variant="body2" className="text-gray-500">
            创建时间: {new Date(question.createdAt).toLocaleDateString('zh-CN')}
            {question.updatedAt && question.updatedAt !== question.createdAt && 
              ` (更新于 ${new Date(question.updatedAt).toLocaleDateString('zh-CN')})`
            }
          </Typography>
          
          {question.useCount > 0 && (
            <Typography variant="body2" className="text-gray-500 mt-1">
              已使用: {question.useCount} 次
            </Typography>
          )}
        </Box>
        
        <Divider className="my-4" />
        
        <Box className="my-6">
          <Typography variant="subtitle1" className="mb-3 font-bold">
            答案
          </Typography>
          
          {question.type === '单选题' || question.type === '多选题' ? (
            renderOptions(question.options, question.type)
          ) : question.type === '判断题' ? (
            renderBooleanAnswer(question.correctAnswer)
          ) : (
            <Box className="bg-gray-50 p-3 rounded border border-gray-300">
              <Typography variant="body1" className="whitespace-pre-line">
                {question.correctAnswer}
              </Typography>
            </Box>
          )}
        </Box>
        
        {question.explanation && (
          <>
            <Divider className="my-4" />
            
            <Box className="my-6">
              <Typography variant="subtitle1" className="mb-3 font-bold">
                解析
              </Typography>
              
              {/* 使用Markdown预览组件来显示题目解析 */}
              <MarkdownPreview content={question.explanation} />
            </Box>
          </>
        )}
      </>
    );
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
              {/* 返回按钮和操作区 */}
              <div className="flex justify-between items-center mb-6">
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={handleBack}
                  variant="text"
                  color="primary"
                >
                  返回题库
                </Button>
                
                <div className="flex space-x-2">
                  <Button
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                    variant="outlined"
                    color="primary"
                    disabled={loading}
                  >
                    编辑题目
                  </Button>
                  
                  <Button
                    startIcon={<DeleteIcon />}
                    onClick={handleDelete}
                    variant="outlined"
                    color="error"
                    disabled={loading}
                  >
                    删除题目
                  </Button>
                </div>
              </div>
              
              <Divider className="mb-6" />
              
              {/* 加载状态 */}
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <CircularProgress />
                </div>
              ) : error ? (
                <div className="text-center py-10">
                  <Alert severity="error" className="mb-4">
                    {error}
                  </Alert>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => window.location.reload()}
                  >
                    重试
                  </Button>
                </div>
              ) : (
                renderQuestionContent()
              )}
            </Paper>
          </div>
        </main>
        
        {/* 提示消息 */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </AuthGuard>
  );
} 