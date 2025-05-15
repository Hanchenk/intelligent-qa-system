'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import AuthGuard from '../../../../components/AuthGuard';
import axios from 'axios';

// Material UI 组件
import {
  Button,
  Paper,
  Typography,
  Divider,
  Box,
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar
} from '@mui/material';

// Material Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SaveIcon from '@mui/icons-material/Save';

const API_URL = 'http://localhost:3001/api';

export default function ImportQuestionsPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // 状态
  const [activeStep, setActiveStep] = useState(0);
  const [jsonText, setJsonText] = useState('');
  const [sampleVisible, setSampleVisible] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState({
    success: 0,
    failed: 0,
    total: 0
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });
  
  // 处理显示样例数据
  const handleShowSample = () => {
    setSampleVisible(!sampleVisible);
  };
  
  // 加载样例数据
  const handleLoadSample = () => {
    const sampleData = [
      {
        title: "下列关于JavaScript中的变量声明，哪一个是正确的？",
        type: "单选题",
        difficulty: "中等",
        score: 5,
        options: [
          { content: "let 声明的变量不可重新赋值", isCorrect: false },
          { content: "const 声明的变量可以重新赋值", isCorrect: false },
          { content: "var 声明的变量没有块级作用域", isCorrect: true },
          { content: "const 声明的对象内部属性不能修改", isCorrect: false }
        ],
        explanation: "在 JavaScript 中，var 声明的变量没有块级作用域，而是函数作用域或全局作用域。let 和 const 声明的变量有块级作用域，其中 const 声明的变量不能重新赋值，但如果是对象，其内部属性可以修改。",
        tags: ["JavaScript", "前端", "变量"]
      },
      {
        title: "HTTP状态码200的含义是什么？",
        type: "判断题",
        difficulty: "简单",
        score: 3,
        correctAnswer: true,
        explanation: "HTTP状态码200表示请求成功。服务器已成功处理了请求并返回所请求的内容。",
        tags: ["HTTP", "网络"]
      }
    ];
    
    setJsonText(JSON.stringify(sampleData, null, 2));
  };
  
  // 处理JSON输入变化
  const handleJsonChange = (e) => {
    setJsonText(e.target.value);
  };
  
  // 验证题目
  const validateQuestions = (questions) => {
    if (!Array.isArray(questions)) {
      return { 
        valid: false, 
        errors: [{ message: "导入数据必须是数组格式" }],
        questions: [] 
      };
    }
    
    const errors = [];
    const validQuestions = [];
    
    questions.forEach((question, index) => {
      const questionErrors = [];
      
      // 验证必须字段
      if (!question.title) {
        questionErrors.push(`第 ${index + 1} 题: 缺少题目内容`);
      }
      
      if (!question.type) {
        questionErrors.push(`第 ${index + 1} 题: 缺少题目类型`);
      } else if (!['单选题', '多选题', '判断题', '填空题', '简答题', '编程题'].includes(question.type)) {
        questionErrors.push(`第 ${index + 1} 题: 题目类型 "${question.type}" 无效`);
      }
      
      if (question.type === '单选题' || question.type === '多选题') {
        // 验证选项
        if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
          questionErrors.push(`第 ${index + 1} 题: 选择题至少需要两个选项`);
        } else {
          // 验证选项格式
          const hasValidOption = question.options.some(opt => opt.isCorrect);
          if (!hasValidOption) {
            questionErrors.push(`第 ${index + 1} 题: 至少需要一个正确选项`);
          }
          
          // 验证选项内容
          question.options.forEach((opt, optIndex) => {
            if (!opt.content) {
              questionErrors.push(`第 ${index + 1} 题，选项 ${optIndex + 1}: 缺少选项内容`);
            }
          });
        }
      }
      
      if (question.type === '判断题' && question.correctAnswer === undefined) {
        questionErrors.push(`第 ${index + 1} 题: 判断题缺少正确答案`);
      }
      
      if ((question.type === '填空题' || question.type === '简答题') && !question.correctAnswer) {
        questionErrors.push(`第 ${index + 1} 题: 缺少参考答案`);
      }
      
      // 记录错误
      if (questionErrors.length > 0) {
        errors.push(...questionErrors);
      } else {
        // 添加默认值
        const validQuestion = {
          ...question,
          difficulty: question.difficulty || '中等',
          score: question.score || 5,
          tags: Array.isArray(question.tags) ? question.tags : [],
          explanation: question.explanation || ''
        };
        
        validQuestions.push(validQuestion);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      questions: validQuestions
    };
  };
  
  // 处理解析JSON
  const handleParseJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const validation = validateQuestions(parsed);
      
      setParsedQuestions(validation.questions);
      setValidationErrors(validation.errors);
      
      if (validation.valid) {
        setActiveStep(1);
      }
    } catch (err) {
      setValidationErrors([`JSON解析错误: ${err.message}`]);
    }
  };
  
  // 提交题目
  const handleSubmit = async () => {
    if (parsedQuestions.length === 0) return;
    
    setIsSubmitting(true);
    
    let successCount = 0;
    let failedCount = 0;
    
    try {
      // 逐个提交题目
      for (const question of parsedQuestions) {
        try {
          await axios.post(`${API_URL}/questions`, question, {
            headers: { Authorization: `Bearer ${token}` }
          });
          successCount++;
        } catch (err) {
          console.error('题目导入失败:', err);
          failedCount++;
        }
      }
      
      setSubmitResult({
        success: successCount,
        failed: failedCount,
        total: parsedQuestions.length
      });
      
      setActiveStep(2);
      
      // 全部成功时的提示
      if (failedCount === 0) {
        setSnackbar({
          open: true,
          message: `成功导入 ${successCount} 道题目`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: `导入完成: ${successCount} 成功, ${failedCount} 失败`,
          severity: 'warning'
        });
      }
    } catch (err) {
      console.error('批量导入失败:', err);
      
      setSnackbar({
        open: true,
        message: '批量导入失败，请重试',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 返回题库
  const handleBackToLibrary = () => {
    router.push('/dashboard/teacher/questions');
  };
  
  // 重新开始
  const handleReset = () => {
    setActiveStep(0);
    setJsonText('');
    setParsedQuestions([]);
    setValidationErrors([]);
    setSubmitResult({
      success: 0,
      failed: 0,
      total: 0
    });
  };
  
  // 渲染步骤1: JSON输入
  const renderStepOne = () => (
    <Box>
      <Typography variant="subtitle1" className="mb-4 font-bold">
        JSON格式导入题目
      </Typography>
      
      <Typography variant="body2" className="mb-2">
        请在下方输入符合格式的JSON数据，或点击"加载样例"查看示例格式
      </Typography>
      
      <Box className="mb-4 flex justify-end">
        <Button
          size="small"
          variant="text"
          color="primary"
          onClick={handleShowSample}
          className="mr-2"
        >
          {sampleVisible ? '隐藏样例' : '查看样例'}
        </Button>
        
        <Button
          size="small"
          variant="text"
          color="primary"
          onClick={handleLoadSample}
        >
          加载样例
        </Button>
      </Box>
      
      {sampleVisible && (
        <Box className="mb-4 p-3 bg-gray-50 rounded border border-gray-300 overflow-auto max-h-80">
          <pre className="text-sm">
            {`[
  {
    "title": "下列关于JavaScript中的变量声明，哪一个是正确的？",
    "type": "单选题",
    "difficulty": "中等",
    "score": 5,
    "options": [
      { "content": "let 声明的变量不可重新赋值", "isCorrect": false },
      { "content": "const 声明的变量可以重新赋值", "isCorrect": false },
      { "content": "var 声明的变量没有块级作用域", "isCorrect": true },
      { "content": "const 声明的对象内部属性不能修改", "isCorrect": false }
    ],
    "explanation": "在 JavaScript 中，var 声明的变量没有块级作用域...",
    "tags": ["JavaScript", "前端", "变量"]
  },
  {
    "title": "HTTP状态码200的含义是什么？",
    "type": "判断题",
    "difficulty": "简单",
    "score": 3,
    "correctAnswer": true,
    "explanation": "HTTP状态码200表示请求成功...",
    "tags": ["HTTP", "网络"]
  }
]`}
          </pre>
        </Box>
      )}
      
      <TextField
        fullWidth
        multiline
        rows={15}
        variant="outlined"
        placeholder="请输入JSON格式的题目数据"
        value={jsonText}
        onChange={handleJsonChange}
        error={validationErrors.length > 0}
        className="font-mono"
      />
      
      {validationErrors.length > 0 && (
        <Box className="mt-4">
          <Alert severity="error">
            <Typography variant="subtitle2" className="font-bold mb-1">
              验证错误:
            </Typography>
            <ul className="pl-5 list-disc">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        </Box>
      )}
      
      <Box className="mt-4 flex justify-end">
        <Button
          variant="contained"
          color="primary"
          onClick={handleParseJson}
          disabled={!jsonText.trim()}
        >
          验证并预览
        </Button>
      </Box>
    </Box>
  );
  
  // 渲染步骤2: 预览和确认
  const renderStepTwo = () => (
    <Box>
      <Typography variant="subtitle1" className="mb-4 font-bold">
        预览导入题目
      </Typography>
      
      <Typography variant="body2" className="mb-4">
        以下{parsedQuestions.length}道题目将被导入到题库中，请确认无误后点击"确认导入"按钮。
      </Typography>
      
      <TableContainer component={Paper} className="mb-4 border">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>题目</TableCell>
              <TableCell align="center">类型</TableCell>
              <TableCell align="center">难度</TableCell>
              <TableCell align="center">分值</TableCell>
              <TableCell align="center">课程</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {parsedQuestions.map((question, index) => (
              <TableRow key={index} hover>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <div className="max-w-md truncate" title={question.title}>
                    {question.title}
                  </div>
                </TableCell>
                <TableCell align="center">
                  <Chip size="small" label={question.type} />
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    size="small" 
                    label={question.difficulty} 
                    color={
                      question.difficulty === '简单' ? 'success' : 
                      question.difficulty === '中等' ? 'warning' : 
                      'error'
                    } 
                  />
                </TableCell>
                <TableCell align="center">{question.score}</TableCell>
                <TableCell align="center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {question.tags.slice(0, 2).map((tag, i) => (
                      <Chip key={i} size="small" label={tag} variant="outlined" />
                    ))}
                    {question.tags.length > 2 && (
                      <Chip size="small" label={`+${question.tags.length - 2}`} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box className="mt-4 flex justify-between">
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => setActiveStep(0)}
        >
          返回编辑
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? '导入中...' : '确认导入'}
        </Button>
      </Box>
    </Box>
  );
  
  // 渲染步骤3: 导入结果
  const renderStepThree = () => (
    <Box>
      <Typography variant="subtitle1" className="mb-4 font-bold">
        导入结果
      </Typography>
      
      <Box className="mb-8 p-6 text-center">
        <Typography variant="h6" className="mb-4">
          题目导入已完成
        </Typography>
        
        <Box className="flex justify-center space-x-8 mb-6">
          <Box className="text-center">
            <Typography variant="h4" className="text-green-600 font-bold">
              {submitResult.success}
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              成功导入
            </Typography>
          </Box>
          
          <Box className="text-center">
            <Typography variant="h4" className="text-red-600 font-bold">
              {submitResult.failed}
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              导入失败
            </Typography>
          </Box>
          
          <Box className="text-center">
            <Typography variant="h4" className="font-bold">
              {submitResult.total}
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              总计题目
            </Typography>
          </Box>
        </Box>
        
        {submitResult.failed > 0 && (
          <Alert severity="warning" className="mb-4">
            部分题目导入失败，这可能是由于网络问题或数据格式问题导致的。
            您可以返回上一步，检查并重新提交失败的题目。
          </Alert>
        )}
      </Box>
      
      <Box className="mt-4 flex justify-between">
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleReset}
        >
          再次导入
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleBackToLibrary}
        >
          返回题库
        </Button>
      </Box>
    </Box>
  );
  
  // 步骤定义
  const steps = [
    { label: '题目编辑', component: renderStepOne },
    { label: '预览确认', component: renderStepTwo },
    { label: '导入结果', component: renderStepThree }
  ];
  
  // 关闭提示消息
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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
                  onClick={handleBackToLibrary}
                  variant="text"
                  color="primary"
                >
                  返回题库
                </Button>
                <Typography variant="h5" component="h1" className="ml-4 font-bold">
                  批量导入题目
                </Typography>
              </div>
              
              <Divider className="mb-6" />
              
              {/* 步骤指示器 */}
              <Stepper activeStep={activeStep} className="mb-8">
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel>{step.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              
              {/* 步骤内容 */}
              <div className="mt-6">
                {steps[activeStep].component()}
              </div>
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