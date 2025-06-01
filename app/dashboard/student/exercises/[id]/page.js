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
import { createBookmark, deleteBookmarkByExerciseId, getUserBookmarks } from '@/app/services/bookmarkService';

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
  DialogActions,
  Chip
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

// 确保API路径格式正确
const ensureCorrectApiUrl = (url, endpoint) => {
  // 移除URL尾部的斜杠
  let baseUrl = url.replace(/\/+$/, '');
  
  // 确保endpoint以/开头
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  
  // 直接返回baseUrl + endpoint，不添加/api前缀
  return `${baseUrl}${cleanEndpoint}`;
};

export default function ExercisePage({ params }) {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const exerciseId = use(params).id;
  
  // 获取URL参数，检查是否只显示标记的题目
  const [markedOnly, setMarkedOnly] = useState(false);
  
  // 状态
  const [loading, setLoading] = useState(true);
  const [exercise, setExercise] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationStatus, setEvaluationStatus] = useState({ current: 0, total: 0, message: '' });
  const [markedQuestions, setMarkedQuestions] = useState({});
  const [isExerciseBookmarked, setIsExerciseBookmarked] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  
  // 检查URL参数
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const markedOnlyParam = urlParams.get('markedOnly');
      setMarkedOnly(markedOnlyParam === 'true');
    }
  }, []);
  
  // 载入练习数据之前，检查API_URL格式
  useEffect(() => {
    // 验证API_URL格式
    console.log('当前使用的API_URL:', API_URL);
    if (API_URL.endsWith('/api')) {
      console.log('API_URL已包含/api路径');
    } else if (!API_URL.endsWith('/')) {
      console.log('API_URL不包含结尾的斜杠，这是正确的格式');
    } else {
      console.warn('API_URL格式可能有问题，包含结尾斜杠:', API_URL);
    }
  }, []);

  // 加载练习数据
  useEffect(() => {
    const fetchExercise = async () => {
      setLoading(true);
      
      try {
        // 从本地存储获取练习信息
        const exerciseDataString = localStorage.getItem('currentExercise');
        
        if (!exerciseDataString) {
          alert('练习信息不存在');
          router.push('/dashboard/student/exercises');
          return;
        }
        
        const exerciseData = JSON.parse(exerciseDataString);
        
        if (!exerciseData || !exerciseData.questionIds || exerciseData.questionIds.length === 0) {
          alert('练习题目不存在');
          router.push('/dashboard/student/exercises');
          return;
        }
        
        // 设置练习基本信息
        setExercise({
          id: exerciseData.id,
          title: exerciseData.title,
          totalQuestions: exerciseData.questionIds.length,
          timeLimit: 30, // 默认30分钟
          tags: exerciseData.tags || []
        });
        
        // 设置倒计时
        setRemainingTime(30 * 60); // 30分钟，转换为秒
        
        // 获取题目详情
        const questionPromises = exerciseData.questionIds.map(questionId => 
          axios.get(ensureCorrectApiUrl(API_URL, `/questions/${questionId}`), {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
        
        const questionResponses = await Promise.allSettled(questionPromises);
        
        // 处理题目数据
        const fetchedQuestions = questionResponses
          .filter(response => response.status === 'fulfilled')
          .map(response => {
            const questionData = response.value.data.data;
            
            // 将API返回的题目格式转换为本地格式
            return {
              id: questionData._id,
              title: questionData.title,
              type: questionData.type,
              tags: questionData.tags?.map(t => t.name) || [],
              options: Array.isArray(questionData.options) ? questionData.options.map((opt, index) => ({
                id: String.fromCharCode(97 + index), // a, b, c, d...
                content: opt.text || opt.content,
                isCorrect: opt.isCorrect
              })) : [],
              // 保留格式化后的答案用于客观题评分和显示
              formattedCorrectAnswer: formatCorrectAnswer(questionData),
              // 存储原始标准答案用于主观题评估
              originalStandardAnswer: questionData.correctAnswer || questionData.answer || '', 
              explanation: questionData.explanation || ''
            };
          });
        
        if (fetchedQuestions.length === 0) {
          alert('未能获取任何题目');
          router.push('/dashboard/student/exercises');
          return;
        }
        
        // 保存所有题目
        setAllQuestions(fetchedQuestions);
        
        // 加载标记状态
        const markedQuestionsStorage = JSON.parse(localStorage.getItem('markedQuestions') || '{}');
        setMarkedQuestions(markedQuestionsStorage);
        
        // 根据markedOnly参数过滤题目
        if (markedOnly) {
          const filteredQuestions = fetchedQuestions.filter(q => markedQuestionsStorage[q.id]);
          if (filteredQuestions.length === 0) {
            alert('没有标记的题目，将显示所有题目');
            setQuestions(fetchedQuestions);
          } else {
            setQuestions(filteredQuestions);
          }
        } else {
          setQuestions(fetchedQuestions);
        }
        
        // 初始化用户答案对象
        const initialAnswers = {};
        fetchedQuestions.forEach(q => {
          initialAnswers[q.id] = q.type === '多选题' ? [] : '';
        });
        setUserAnswers(initialAnswers);
        
        setLoading(false);
      } catch (error) {
        console.error('获取练习数据失败:', error);
        alert('获取练习数据失败，请重试');
        router.push('/dashboard/student/exercises');
      }
    };
    
    // 格式化正确答案
    const formatCorrectAnswer = (question) => {
      if (question.type === '多选题') {
        // 对多选题，返回正确选项的ID数组
        return question.options
          .filter(opt => opt.isCorrect)
          .map((_, index) => String.fromCharCode(97 + index));
      } else if (question.type === '单选题') {
        // 对单选题，返回正确选项的ID
        const correctIndex = question.options.findIndex(opt => opt.isCorrect);
        return correctIndex >= 0 ? String.fromCharCode(97 + correctIndex) : '';
      } else if (question.type === '判断题') {
        // 判断题返回"true"或"false"
        return question.answer === true || question.answer === 'true' ? 'true' : 'false';
      } else {
        // 其他题型返回答案文本
        return question.answer || '';
      }
    };
    
    if (exerciseId) {
      fetchExercise();
    }
  }, [exerciseId, router, token, markedOnly]);
  
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
  const submitAnswers = async () => {
    // 关闭可能存在的确认对话框
    setIsFinishDialogOpen(false);
    
    try {
      const subjectiveQuestions = questions.filter(q => 
        q.type === '简答题' || q.type === '编程题'
      );
      const totalSubjective = subjectiveQuestions.length;
      
      // 初始计算结果 (只计算客观题)
      let results = calculateObjectiveResults();
      
      // *** 开始评估前：显示加载框 ***
      if (totalSubjective > 0) {
        setIsEvaluating(true);
        setEvaluationStatus({ current: 0, total: totalSubjective, message: '准备开始评估主观题...' });
      }
      
      // 如果有主观题，进行自动评估
      if (totalSubjective > 0) {
        console.log(`找到${totalSubjective}道主观题需要评估`);
        
        let evaluatedCount = 0;
        for (const question of subjectiveQuestions) {
          evaluatedCount++;
          const questionId = question.id;
          const questionType = question.type;
          const userAnswer = userAnswers[questionId];
          const questionResultIndex = results.questionResults.findIndex(r => r.questionId === questionId);
          
          // *** 更新评估状态 ***
          setEvaluationStatus({
            current: evaluatedCount,
            total: totalSubjective,
            message: `正在评估第 ${evaluatedCount} / ${totalSubjective} 道主观题...`
          });

          // 如果用户没有回答此题或找不到结果条目，跳过评估
          if (!userAnswer || questionResultIndex === -1) {
            console.log(`题目 ${questionId} 未作答或结果不存在，跳过评估`);
            continue;
          }
          
          try {
            console.log(`开始评估${questionType}：`, questionId);
            
            const apiPath = ensureCorrectApiUrl(API_URL, '/llm/evaluate-answer');
            const requestData = {
              questionId,
              questionContent: question.title,
              standardAnswer: question.originalStandardAnswer,
              userAnswer,
              questionType
            };
            
            console.log('请求参数:', requestData);
            
            const response = await axios.post(
              apiPath,
              requestData,
              { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            
            console.log('评估API响应:', response.data);
            
            if (response.data.success && response.data.evaluation) {
              const evaluation = response.data.evaluation;
              console.log(`评估结果：分数 ${evaluation.score}，反馈：${evaluation.feedback.substring(0, 50)}...`);
              const isCorrect = evaluation.score >= 80;
              
              results.questionResults[questionResultIndex] = {
                ...results.questionResults[questionResultIndex],
                isCorrect: isCorrect,
                score: Math.round(evaluation.score / 100),
                feedback: evaluation.feedback,
                aiEvaluation: evaluation
              };
            } else {
              console.error('评估响应无效：', response.data);
            }
          } catch (error) {
            console.error(`评估主观题 ${questionId} 失败:`, error);
            console.error('错误详情:', error.response?.data || '无详细信息');
            console.error('错误状态码:', error.response?.status);
            // 评估失败，isCorrect 保持 false
          }
        }
      }
      
      // *** 评估结束后：隐藏加载框 ***
      setIsEvaluating(false);

      // 在所有评估完成后，重新计算最终的总分和正确数
      let finalCorrectCount = 0;
      results.questionResults.forEach(result => {
        if (result.isCorrect) {
          finalCorrectCount++;
        }
      });
      results.correctCount = finalCorrectCount;
      results.totalScore = finalCorrectCount;
      results.percentage = results.maxScore > 0 ? Math.round((finalCorrectCount / results.maxScore) * 100) : 0;

      console.log('最终评估结果（包含主观题）:', results);
      
      // 保存到本地存储
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
    } catch (error) {
      // *** 出错时也要隐藏加载框 ***
      setIsEvaluating(false);
      console.error('提交答案时出错:', error);
      console.error('错误详情:', error.response?.data || '无详细信息');
      console.error('错误状态码:', error.response?.status);
      alert(`提交答案失败: ${error.response?.data?.message || error.message}`);
    }
  };
  
  // *** 新增：仅计算客观题结果的函数 ***
  const calculateObjectiveResults = () => {
    let correctCount = 0;
    let totalScore = 0;
    let maxScore = questions.length;
    let questionResults = [];

    questions.forEach((question) => {
      let isCorrect = false;
      let userAnswer = userAnswers[question.id];
      const isSubjective = question.type === '简答题' || question.type === '编程题' || question.type === '填空题';

      if (!isSubjective) { // 只处理客观题
        if (question.type === '多选题') {
          const uAnswer = userAnswer || [];
          const cAnswer = question.formattedCorrectAnswer || [];
          isCorrect = uAnswer.length === cAnswer.length && cAnswer.every(value => uAnswer.includes(value));
        } else {
          isCorrect = userAnswer === question.formattedCorrectAnswer;
        }

        if (isCorrect) {
          correctCount++;
          totalScore++;
        }
      } // 主观题 isCorrect 保持 false

      questionResults.push({
        questionId: question.id,
        isCorrect, 
        userAnswer,
        correctAnswer: question.formattedCorrectAnswer 
      });
    });

    return {
      totalScore, // 客观题得分
      maxScore,   // 总题数
      percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0, // 基于客观题的百分比
      correctCount, // 客观题正确数
      questionResults 
    };
  };
  
  // 格式化剩余时间
  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 检查练习是否已收藏
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!user || !exerciseId) return;
      
      try {
        const bookmarks = await getUserBookmarks();
        const isBookmarked = bookmarks.some(bookmark => bookmark.exerciseId === exerciseId);
        setIsExerciseBookmarked(isBookmarked);
      } catch (error) {
        console.error('检查收藏状态失败:', error);
      }
    };
    
    checkBookmarkStatus();
  }, [user, exerciseId]);
  
  // 标记题目
  const handleMarkQuestion = async () => {
    if (!user || !currentQuestion) return;
    
    try {
      // 更新本地状态
      const currentId = currentQuestion.id;
      const newMarkedState = !markedQuestions[currentId];
      
      const updatedMarkedQuestions = {
        ...markedQuestions,
        [currentId]: newMarkedState
      };
      
      setMarkedQuestions(updatedMarkedQuestions);
      
      // 在本地存储中保存标记状态
      localStorage.setItem('markedQuestions', JSON.stringify(updatedMarkedQuestions));
      
      // 如果是只显示标记题目模式，并且取消标记了当前题目，则需要从列表中移除
      if (markedOnly && !newMarkedState) {
        const updatedQuestions = questions.filter(q => q.id !== currentId);
        if (updatedQuestions.length === 0) {
          // 如果没有标记的题目了，显示提示并加载所有题目
          alert('没有更多标记的题目，将显示所有题目');
          setQuestions(allQuestions);
          setMarkedOnly(false);
        } else {
          setQuestions(updatedQuestions);
          // 如果当前是最后一题，需要调整索引
          if (currentQuestionIndex >= updatedQuestions.length) {
            setCurrentQuestionIndex(updatedQuestions.length - 1);
          }
        }
      }
      
      // 显示操作结果
      alert(newMarkedState ? '已标记题目' : '已取消标记');
    } catch (error) {
      console.error('标记题目失败:', error);
      alert('操作失败，请稍后重试');
    }
  };
  
  // 收藏或取消收藏练习
  const handleToggleBookmark = async () => {
    if (!user || !exercise) return;
    
    try {
      if (isExerciseBookmarked) {
        // 取消收藏
        await deleteBookmarkByExerciseId(exerciseId);
        setIsExerciseBookmarked(false);
        alert('已取消收藏');
      } else {
        // 添加收藏
        await createBookmark({
          exerciseId,
          exerciseTitle: exercise.title,
          tags: exercise.tags || []
        });
        setIsExerciseBookmarked(true);
        alert('已收藏练习');
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      alert('操作失败，请稍后重试');
    }
  };
  
  // 加载本地存储的标记状态
  useEffect(() => {
    if (!currentQuestion) return;
    
    try {
      const markedQuestionsStorage = JSON.parse(localStorage.getItem('markedQuestions') || '{}');
      setMarkedQuestions(markedQuestionsStorage);
    } catch (error) {
      console.error('加载标记状态失败:', error);
    }
  }, [currentQuestion]);
  
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
            <IconButton 
              color="primary" 
              className="mr-2"
              onClick={handleMarkQuestion}
            >
              {markedQuestions[currentQuestion.id] ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
            <IconButton 
              color="error" 
              className="mr-2"
              onClick={handleToggleBookmark}
            >
              <Flag color={isExerciseBookmarked ? "error" : "action"} />
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
                    {exercise.title} {markedOnly && <Chip label="仅标记题目" color="secondary" size="small" />}
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

        {/* AI 评估加载对话框 (新增) */}
        <Dialog
          open={isEvaluating}
          aria-labelledby="evaluating-dialog-title"
          disableEscapeKeyDown
          // disableBackdropClick // 可选：阻止点击背景关闭
        >
          <DialogTitle id="evaluating-dialog-title">正在评估主观题</DialogTitle>
          <DialogContent>
            <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
              <DialogContentText sx={{ mb: 1 }}>
                {evaluationStatus.message || '请稍候...'}
              </DialogContentText>
              <LinearProgress
                variant="determinate"
                value={evaluationStatus.total > 0 ? (evaluationStatus.current / evaluationStatus.total) * 100 : 0}
              />
              <Typography variant="body2" sx={{ textAlign: 'right', mt: 1 }}>
                {evaluationStatus.current} / {evaluationStatus.total}
              </Typography>
            </Box>
          </DialogContent>
        </Dialog>

      </div>
    </AuthGuard>
  );
} 