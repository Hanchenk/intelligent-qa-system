'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { use } from 'react';
import AuthGuard from '../../../../components/AuthGuard';
import MarkdownPreview from '@/app/components/MarkdownPreview';
import OptionMarkdownPreview from '@/app/components/OptionMarkdownPreview';
import axios from 'axios';

// Material UI 组件
import {
  Button,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  FormGroup,
  Checkbox,
  TextField,
  Card,
  CardContent,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepButton,
  LinearProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';

// Material Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Flag from '@mui/icons-material/Flag';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import TimerIcon from '@mui/icons-material/Timer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ExercisePage({ params }) {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const exerciseId = use(params).id;
  
  // 状态
  const [loading, setLoading] = useState(true);
  const [exercise, setExercise] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  
  // 模拟练习数据
  const mockExercises = {
    '1': {
      id: '1',
      title: '前端基础知识练习',
      totalQuestions: 5,
      timeLimit: 15, // 分钟
      description: '涵盖前端开发基础知识，包括HTML、CSS和JavaScript的基本概念和常见问题。',
      tags: ['前端', 'Web开发', 'HTML', 'CSS', 'JavaScript'],
      questions: [
        {
          id: 'q1',
          title: '以下哪个HTML标签用于创建无序列表？',
          type: '单选题',
          tags: ['HTML', '标签'],
          options: [
            { id: 'a', content: '<ol>' },
            { id: 'b', content: '<ul>' },
            { id: 'c', content: '<li>' },
            { id: 'd', content: '<dl>' }
          ],
          correctAnswer: 'b',
          explanation: '<ul>标签用于创建无序列表，而<ol>用于创建有序列表。<li>标签用于定义列表项，<dl>用于创建定义列表。'
        },
        {
          id: 'q2',
          title: '在CSS中，哪个属性用于设置元素的文本颜色？',
          type: '单选题',
          tags: ['CSS', '属性'],
          options: [
            { id: 'a', content: 'text-color' },
            { id: 'b', content: 'font-color' },
            { id: 'c', content: 'color' },
            { id: 'd', content: 'text-style' }
          ],
          correctAnswer: 'c',
          explanation: 'CSS中，color属性用于设置文本颜色。text-color、font-color和text-style不是有效的CSS属性。'
        },
        {
          id: 'q3',
          title: '在JavaScript中，以下哪个方法用于添加元素到数组末尾？',
          type: '单选题',
          tags: ['JavaScript', '数组', '方法'],
          options: [
            { id: 'a', content: 'push()' },
            { id: 'b', content: 'append()' },
            { id: 'c', content: 'add()' },
            { id: 'd', content: 'insert()' }
          ],
          correctAnswer: 'a',
          explanation: 'JavaScript中，push()方法用于将一个或多个元素添加到数组的末尾，并返回新的长度。'
        },
        {
          id: 'q4',
          title: '以下哪些是JavaScript中的基本数据类型？',
          type: '多选题',
          tags: ['JavaScript', '数据类型'],
          options: [
            { id: 'a', content: 'String' },
            { id: 'b', content: 'Array' },
            { id: 'c', content: 'Number' },
            { id: 'd', content: 'Boolean' },
            { id: 'e', content: 'Object' }
          ],
          correctAnswer: ['a', 'c', 'd'],
          explanation: 'JavaScript中的基本数据类型包括String、Number、Boolean、Undefined、Null和Symbol。Array和Object是引用类型。'
        },
        {
          id: 'q5',
          title: '编写一个JavaScript函数，接受一个数组参数，返回该数组中的最大值。',
          type: '编程题',
          tags: ['JavaScript', '函数', '算法'],
          correctAnswer: `function findMax(arr) {
  return Math.max(...arr);
}`,
          explanation: '使用Math.max()方法和扩展运算符(...)可以轻松找到数组中的最大值。另一种方法是使用reduce()或者手动循环比较。'
        }
      ]
    }
  };
  
  // 加载练习数据
  useEffect(() => {
    const fetchExercise = () => {
      setLoading(true);
      
      // 模拟API请求
      setTimeout(() => {
        const exerciseData = mockExercises[exerciseId];
        
        if (exerciseData) {
          setExercise(exerciseData);
          setQuestions(exerciseData.questions);
          
          // 初始化用户答案对象
          const initialAnswers = {};
          exerciseData.questions.forEach(q => {
            initialAnswers[q.id] = q.type === '多选题' ? [] : '';
          });
          setUserAnswers(initialAnswers);
          
          // 设置倒计时
          if (exerciseData.timeLimit) {
            setRemainingTime(exerciseData.timeLimit * 60); // 转换为秒
          }
        } else {
          // 没有找到对应的练习
          alert('未找到练习');
          router.push('/dashboard/student/exercises');
        }
        
        setLoading(false);
      }, 1000);
    };
    
    if (exerciseId) {
      fetchExercise();
    }
  }, [exerciseId, router]);
  
  // 倒计时
  useEffect(() => {
    if (remainingTime === null || remainingTime <= 0 || loading) return;
    
    const timer = setInterval(() => {
      setRemainingTime(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          
          // 时间到，自动提交
          handleFinishExercise();
          return 0;
        }
        return prevTime - 1;
      });
      
      // 更新已用时间
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [remainingTime, loading]);
  
  // 获取当前问题
  const currentQuestion = questions[currentQuestionIndex] || null;
  
  // 计算完成进度
  const calculateProgress = () => {
    if (!questions.length) return 0;
    
    const answeredCount = Object.values(userAnswers).filter(
      answer => Array.isArray(answer) ? answer.length > 0 : answer !== ''
    ).length;
    
    return (answeredCount / questions.length) * 100;
  };
  
  // 处理单选题答案
  const handleSingleChoiceAnswer = (questionId, value) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  // 处理多选题答案
  const handleMultiChoiceAnswer = (questionId, value) => {
    setUserAnswers(prev => {
      const currentAnswers = [...(prev[questionId] || [])];
      const valueIndex = currentAnswers.indexOf(value);
      
      if (valueIndex === -1) {
        currentAnswers.push(value);
      } else {
        currentAnswers.splice(valueIndex, 1);
      }
      
      return {
        ...prev,
        [questionId]: currentAnswers
      };
    });
  };
  
  // 处理主观题答案
  const handleTextAnswer = (questionId, value) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  // 下一题
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };
  
  // 上一题
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };
  
  // 跳转到特定题目
  const handleGoToQuestion = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };
  
  // 完成练习
  const handleFinishExercise = () => {
    // 在实际项目中，这里应该向后端提交答案
    const answeredCount = Object.values(userAnswers).filter(
      answer => Array.isArray(answer) ? answer.length > 0 : answer !== ''
    ).length;
    
    // 如果有未答题，显示确认对话框
    if (answeredCount < questions.length) {
      setIsFinishDialogOpen(true);
    } else {
      // 所有题目都已答，直接提交
      submitAnswers();
    }
  };
  
  // 提交答案
  const submitAnswers = () => {
    // 关闭对话框
    setIsFinishDialogOpen(false);
    
    // 模拟提交
    console.log('提交答案:', userAnswers);
    
    // 计算结果
    const results = calculateResults();
    
    // 保存到本地存储，以便结果页面使用
    localStorage.setItem('exerciseResults', JSON.stringify({
      exerciseId,
      exerciseTitle: exercise.title,
      questions,
      userAnswers,
      results,
      timeSpent,
      tags: exercise.tags || []
    }));
    
    // 跳转到结果页面
    router.push(`/dashboard/student/exercises/${exerciseId}/result`);
  };
  
  // 计算结果
  const calculateResults = () => {
    let correctCount = 0;
    let totalScore = 0;
    let maxScore = questions.length;
    let questionResults = [];
    
    questions.forEach((question, index) => {
      let isCorrect = false;
      let userAnswer = userAnswers[question.id];
      
      if (question.type === '多选题') {
        const uAnswer = userAnswer || [];
        const cAnswer = question.correctAnswer || [];
        
        // 检查数组长度是否相同且所有元素都匹配
        isCorrect = uAnswer.length === cAnswer.length &&
          cAnswer.every(value => uAnswer.includes(value));
      } else if (question.type === '编程题' || question.type === '填空题' || question.type === '简答题') {
        // 这些题型需要后端或AI评估，这里简单地假设非空即正确
        isCorrect = userAnswer !== '';
      } else {
        // 单选题和判断题
        isCorrect = userAnswer === question.correctAnswer;
      }
      
      if (isCorrect) {
        correctCount++;
        totalScore++;
      }
      
      // 添加到问题结果数组
      questionResults.push({
        questionId: question.id,
        isCorrect,
        userAnswer,
        correctAnswer: question.correctAnswer
      });
    });
    
    return {
      correctCount,
      totalScore,
      maxScore,
      percentage: Math.round((totalScore / maxScore) * 100),
      questionResults: questionResults
    };
  };
  
  // 格式化剩余时间
  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 渲染问题
  const renderQuestion = () => {
    if (!currentQuestion) return null;
    
    return (
      <Box>
        {/* 题目标题 */}
        <Box className="mb-4">
          <Typography variant="h6" component="h2" className="font-bold mb-2">
            {currentQuestionIndex + 1}. {currentQuestion.type}
          </Typography>
          <MarkdownPreview content={currentQuestion.title} />
        </Box>
        
        {/* 问题选项或输入区 */}
        <Box className="mb-6">
          {currentQuestion.type === '单选题' && (
            <FormControl component="fieldset" className="w-full">
              <RadioGroup 
                value={userAnswers[currentQuestion.id] || ''}
                onChange={(e) => handleSingleChoiceAnswer(currentQuestion.id, e.target.value)}
              >
                {currentQuestion.options.map((option) => (
                  <FormControlLabel
                    key={option.id}
                    value={option.id}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography component="span" className="font-medium">{option.id.toUpperCase()}. </Typography>
                        <OptionMarkdownPreview content={option.content} />
                      </Box>
                    }
                    className="mb-2"
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}
          
          {currentQuestion.type === '多选题' && (
            <FormControl component="fieldset" className="w-full">
              <FormGroup>
                {currentQuestion.options.map((option) => (
                  <FormControlLabel
                    key={option.id}
                    control={
                      <Checkbox 
                        checked={(userAnswers[currentQuestion.id] || []).includes(option.id)}
                        onChange={() => handleMultiChoiceAnswer(currentQuestion.id, option.id)}
                      />
                    }
                    label={
                      <Box>
                        <Typography component="span" className="font-medium">{option.id.toUpperCase()}. </Typography>
                        <OptionMarkdownPreview content={option.content} />
                      </Box>
                    }
                    className="mb-2"
                  />
                ))}
              </FormGroup>
            </FormControl>
          )}
          
          {(currentQuestion.type === '填空题' || currentQuestion.type === '简答题') && (
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="请输入您的答案..."
              value={userAnswers[currentQuestion.id] || ''}
              onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
              variant="outlined"
            />
          )}
          
          {currentQuestion.type === '编程题' && (
            <TextField
              fullWidth
              multiline
              rows={8}
              placeholder="请输入您的代码..."
              value={userAnswers[currentQuestion.id] || ''}
              onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
              variant="outlined"
              className="font-mono"
            />
          )}
          
          {currentQuestion.type === '判断题' && (
            <FormControl component="fieldset" className="w-full">
              <RadioGroup 
                value={userAnswers[currentQuestion.id] || ''}
                onChange={(e) => handleSingleChoiceAnswer(currentQuestion.id, e.target.value)}
              >
                <FormControlLabel value="true" control={<Radio />} label="正确" className="mb-2" />
                <FormControlLabel value="false" control={<Radio />} label="错误" />
              </RadioGroup>
            </FormControl>
          )}
        </Box>
        
        {/* 导航按钮 */}
        <Box className="flex justify-between items-center">
          <Button
            variant="outlined"
            startIcon={<NavigateBeforeIcon />}
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            上一题
          </Button>
          
          <Box className="flex items-center">
            <IconButton color="primary" className="mr-2">
              <BookmarkBorderIcon />
            </IconButton>
            <IconButton color="error" className="mr-2">
              <Flag />
            </IconButton>
          </Box>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              endIcon={<NavigateNextIcon />}
              onClick={handleNextQuestion}
            >
              下一题
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              endIcon={<CheckCircleIcon />}
              onClick={handleFinishExercise}
            >
              完成练习
            </Button>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <AuthGuard allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 顶部导航栏 */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => router.push('/dashboard/student/exercises')}
                  variant="text"
                  color="primary"
                >
                  返回练习列表
                </Button>
                
                {!loading && exercise && (
                  <Typography variant="h6" className="ml-4 font-bold">
                    {exercise.title}
                  </Typography>
                )}
              </div>
              
              {/* 计时器 */}
              {remainingTime !== null && (
                <Box className="flex items-center">
                  <TimerIcon className="mr-1" color={remainingTime < 300 ? 'error' : 'action'} />
                  <Typography 
                    variant="body1" 
                    className={`font-mono ${remainingTime < 300 ? 'text-red-500 font-bold' : ''}`}
                  >
                    {formatTime(remainingTime)}
                  </Typography>
                </Box>
              )}
            </div>
          </div>
        </nav>

        {/* 主内容区 */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <CircularProgress />
            </div>
          ) : (
            <div className="px-4 py-6 sm:px-0">
              <Box className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* 左侧题目列表 */}
                <Box className="md:col-span-1">
                  <Paper className="p-4">
                    <Typography variant="subtitle1" className="font-bold mb-4">
                      题目导航
                    </Typography>
                    
                    <Box className="mb-4">
                      <LinearProgress 
                        variant="determinate" 
                        value={calculateProgress()} 
                        className="mb-2"
                        color="primary"
                      />
                      <Typography variant="body2" className="text-right">
                        已完成: {Object.values(userAnswers).filter(
                          answer => Array.isArray(answer) ? answer.length > 0 : answer !== ''
                        ).length} / {questions.length}
                      </Typography>
                    </Box>
                    
                    <Box className="grid grid-cols-5 gap-2">
                      {questions.map((question, index) => {
                        const isAnswered = Array.isArray(userAnswers[question.id]) 
                          ? userAnswers[question.id].length > 0 
                          : userAnswers[question.id] !== '';
                          
                        return (
                          <Button
                            key={question.id}
                            variant={currentQuestionIndex === index ? 'contained' : 'outlined'}
                            color={isAnswered ? 'success' : 'primary'}
                            onClick={() => handleGoToQuestion(index)}
                            className="min-w-0 p-0 h-10 w-10"
                          >
                            {index + 1}
                          </Button>
                        );
                      })}
                    </Box>
                    
                    <Box className="mt-6">
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        onClick={handleFinishExercise}
                        startIcon={<CheckCircleIcon />}
                      >
                        完成练习
                      </Button>
                    </Box>
                  </Paper>
                </Box>
                
                {/* 右侧题目内容 */}
                <Box className="md:col-span-3">
                  <Paper className="p-6">
                    {renderQuestion()}
                  </Paper>
                </Box>
              </Box>
            </div>
          )}
        </main>
        
        {/* 确认完成对话框 */}
        <Dialog
          open={isFinishDialogOpen}
          onClose={() => setIsFinishDialogOpen(false)}
        >
          <DialogTitle>确认完成练习</DialogTitle>
          <DialogContent>
            <DialogContentText>
              您还有 {questions.length - Object.values(userAnswers).filter(
                answer => Array.isArray(answer) ? answer.length > 0 : answer !== ''
              ).length} 题未完成，确定要提交吗？
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsFinishDialogOpen(false)} color="primary">
              继续答题
            </Button>
            <Button onClick={submitAnswers} color="primary" variant="contained">
              确认提交
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </AuthGuard>
  );
} 