'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import AuthGuard from '../../../../components/AuthGuard';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  FormControl, 
  FormLabel, 
  Checkbox, 
  FormGroup,
  TextField,
  Divider,
  Alert,
  CircularProgress,
  LinearProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import axios from 'axios';

export default function ExamPage({ params }) {
  const router = useRouter();
  const { token } = useSelector((state) => state.auth);
  const examId = params.id;
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  // 考试数据
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 对话框控制
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [timeoutDialogOpen, setTimeoutDialogOpen] = useState(false);
  
  // 倒计时定时器
  const timerRef = useRef(null);
  
  // 加载考试数据
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/exams/student/${examId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setExam(response.data);
        
        // 初始化答案对象
        const initialAnswers = {};
        response.data.questions.forEach(q => {
          if (q.question.type === '多选题') {
            initialAnswers[q.question._id] = [];
          } else {
            initialAnswers[q.question._id] = '';
          }
        });
        
        setAnswers(initialAnswers);
        setTimeLeft(response.data.duration * 60); // 转换为秒
        setLoading(false);
      } catch (error) {
        console.error('获取考试失败:', error);
        setError(error.response?.data?.message || '加载考试失败');
        setLoading(false);
      }
    };
    
    fetchExam();
    
    // 组件卸载时清除定时器
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [examId, token]);
  
  // 开始倒计时
  useEffect(() => {
    if (timeLeft > 0 && exam) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimeoutDialogOpen(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft, exam]);
  
  // 格式化剩余时间
  const formatTimeLeft = () => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // 处理选择题答案变更
  const handleSingleChoiceChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value
    });
  };
  
  // 处理多选题答案变更
  const handleMultiChoiceChange = (questionId, optionId, checked) => {
    const currentAnswers = [...(answers[questionId] || [])];
    
    if (checked) {
      if (!currentAnswers.includes(optionId)) {
        currentAnswers.push(optionId);
      }
    } else {
      const index = currentAnswers.indexOf(optionId);
      if (index !== -1) {
        currentAnswers.splice(index, 1);
      }
    }
    
    setAnswers({
      ...answers,
      [questionId]: currentAnswers
    });
  };
  
  // 处理填空题和简答题答案变更
  const handleTextAnswerChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value
    });
  };
  
  // 处理判断题答案变更
  const handleBooleanChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value === 'true'
    });
  };
  
  // 导航到下一题
  const handleNextQuestion = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // 导航到上一题
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // 导航到指定题目
  const handleJumpToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };
  
  // 提交考试
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // 转换答案格式
      const formattedAnswers = Object.keys(answers).map(questionId => ({
        questionId,
        answer: answers[questionId]
      }));
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/exams/student/${examId}/submit`, 
        { answers: formattedAnswers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // 提交成功后导航到结果页面
      router.push(`/dashboard/student/exams/${examId}/result?score=${response.data.totalScore}`);
    } catch (error) {
      console.error('提交考试失败:', error);
      setError(error.response?.data?.message || '提交考试失败');
      setIsSubmitting(false);
    }
  };
  
  // 检查是否所有题目都已作答
  const isAllAnswered = () => {
    if (!exam) return false;
    
    const questionIds = exam.questions.map(q => q.question._id);
    return questionIds.every(id => {
      const answer = answers[id];
      if (Array.isArray(answer)) {
        return answer.length > 0;
      }
      return answer !== '';
    });
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', p: 3 }}>
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          {error}
        </Alert>
      </Box>
    );
  }
  
  if (!exam) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', p: 3 }}>
        <Alert severity="warning" sx={{ maxWidth: 600 }}>
          考试不存在或已结束
        </Alert>
      </Box>
    );
  }
  
  const currentQuestion = exam.questions[currentQuestionIndex].question;
  const currentQuestionScore = exam.questions[currentQuestionIndex].score;

  return (
    <AuthGuard allowedRoles={['student']}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 2 }}>
        {/* 顶部导航和计时器 */}
        <Paper 
          sx={{ 
            p: 2, 
            mb: 2, 
            mx: 2, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            borderRadius: 2
          }}
          elevation={3}
        >
          <Typography variant="h6">{exam.title}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip 
              label={`剩余时间：${formatTimeLeft()}`} 
              color={timeLeft < 300 ? "error" : "primary"} 
              variant="outlined"
              sx={{ mr: 2, p: 1, fontSize: '1rem' }}
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => setConfirmDialogOpen(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : '提交试卷'}
            </Button>
          </Box>
        </Paper>
        
        <Box sx={{ display: 'flex', mx: 2, gap: 2 }}>
          {/* 左侧题目导航 */}
          <Paper 
            sx={{ 
              width: { xs: '100px', md: '200px' }, 
              p: 2, 
              height: 'fit-content',
              position: 'sticky',
              top: '80px',
              display: { xs: 'none', sm: 'block' }
            }}
            elevation={2}
          >
            <Typography variant="subtitle1" gutterBottom>题目导航</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {exam.questions.map((q, index) => {
                const questionId = q.question._id;
                const answer = answers[questionId];
                let isAnswered = false;
                
                if (Array.isArray(answer)) {
                  isAnswered = answer.length > 0;
                } else {
                  isAnswered = answer !== '';
                }
                
                return (
                  <Button 
                    key={index} 
                    variant={currentQuestionIndex === index ? "contained" : "outlined"} 
                    color={isAnswered ? "success" : "primary"}
                    size="small"
                    onClick={() => handleJumpToQuestion(index)}
                    sx={{ minWidth: '36px', height: '36px', p: 0 }}
                  >
                    {index + 1}
                  </Button>
                );
              })}
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                已完成 {Object.values(answers).filter(a => Array.isArray(a) ? a.length > 0 : a !== '').length} / {exam.questions.length} 题
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(Object.values(answers).filter(a => Array.isArray(a) ? a.length > 0 : a !== '').length / exam.questions.length) * 100} 
                sx={{ mt: 1 }}
              />
            </Box>
          </Paper>
          
          {/* 主要考试内容 */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>
                  <span style={{ fontWeight: 'bold' }}>第 {currentQuestionIndex + 1} 题</span> / 共 {exam.questions.length} 题
                </Typography>
                <Typography>
                  分值：<span style={{ fontWeight: 'bold', color: theme.palette.primary.main }}>{currentQuestionScore}</span> 分
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  [{currentQuestion.type}] {currentQuestion.title}
                </Typography>
                <Chip 
                  label={currentQuestion.difficulty} 
                  size="small" 
                  sx={{ 
                    bgcolor: 
                      currentQuestion.difficulty === '简单' ? '#e8f5e9' : 
                      currentQuestion.difficulty === '中等' ? '#fff3e0' : '#ffebee',
                    color: 
                      currentQuestion.difficulty === '简单' ? '#2e7d32' : 
                      currentQuestion.difficulty === '中等' ? '#e65100' : '#c62828',
                    mt: 1
                  }} 
                />
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              {/* 根据题目类型渲染不同的答题界面 */}
              {currentQuestion.type === '单选题' && (
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <RadioGroup 
                    value={answers[currentQuestion._id] || ''}
                    onChange={(e) => handleSingleChoiceChange(currentQuestion._id, e.target.value)}
                  >
                    {currentQuestion.options.map((option) => (
                      <FormControlLabel 
                        key={option._id} 
                        value={option._id} 
                        control={<Radio />} 
                        label={option.content} 
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
              
              {currentQuestion.type === '多选题' && (
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <FormGroup>
                    {currentQuestion.options.map((option) => (
                      <FormControlLabel 
                        key={option._id} 
                        control={
                          <Checkbox 
                            checked={(answers[currentQuestion._id] || []).includes(option._id)} 
                            onChange={(e) => handleMultiChoiceChange(currentQuestion._id, option._id, e.target.checked)} 
                          />
                        } 
                        label={option.content}
                        sx={{ mb: 1 }} 
                      />
                    ))}
                  </FormGroup>
                </FormControl>
              )}
              
              {currentQuestion.type === '判断题' && (
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <RadioGroup 
                    value={answers[currentQuestion._id] === true ? 'true' : answers[currentQuestion._id] === false ? 'false' : ''}
                    onChange={(e) => handleBooleanChange(currentQuestion._id, e.target.value)}
                  >
                    <FormControlLabel value="true" control={<Radio />} label="正确" sx={{ mb: 1 }} />
                    <FormControlLabel value="false" control={<Radio />} label="错误" sx={{ mb: 1 }} />
                  </RadioGroup>
                </FormControl>
              )}
              
              {currentQuestion.type === '填空题' && (
                <TextField 
                  fullWidth 
                  label="请输入答案，多个空用分号(;)分隔" 
                  multiline 
                  rows={3}
                  value={answers[currentQuestion._id] || ''}
                  onChange={(e) => handleTextAnswerChange(currentQuestion._id, e.target.value)}
                  placeholder="例如: 答案1;答案2;答案3"
                />
              )}
              
              {(currentQuestion.type === '简答题' || currentQuestion.type === '编程题') && (
                <TextField 
                  fullWidth 
                  label={`请输入${currentQuestion.type === '简答题' ? '答案' : '代码'}`} 
                  multiline 
                  rows={8}
                  value={answers[currentQuestion._id] || ''}
                  onChange={(e) => handleTextAnswerChange(currentQuestion._id, e.target.value)}
                />
              )}
            </Paper>
            
            {/* 导航按钮 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Button 
                variant="outlined" 
                disabled={currentQuestionIndex === 0}
                onClick={handlePrevQuestion}
              >
                上一题
              </Button>
              
              {currentQuestionIndex === exam.questions.length - 1 ? (
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => setConfirmDialogOpen(true)}
                >
                  完成并提交
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  onClick={handleNextQuestion}
                >
                  下一题
                </Button>
              )}
            </Box>
          </Box>
        </Box>
        
        {/* 提交确认对话框 */}
        <Dialog
          fullScreen={fullScreen}
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          aria-labelledby="submit-dialog-title"
        >
          <DialogTitle id="submit-dialog-title">
            确认提交考试
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {isAllAnswered() 
                ? '你已完成所有题目。确定要提交考试吗？提交后将无法修改答案。' 
                : `你还有 ${exam.questions.length - Object.values(answers).filter(a => Array.isArray(a) ? a.length > 0 : a !== '').length} 道题未作答，确定要提交吗？`
              }
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)} color="primary">
              取消
            </Button>
            <Button onClick={handleSubmit} color="primary" autoFocus disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : '确认提交'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* 时间到对话框 */}
        <Dialog
          fullScreen={fullScreen}
          open={timeoutDialogOpen}
          aria-labelledby="timeout-dialog-title"
          disableEscapeKeyDown
          disableBackdropClick
        >
          <DialogTitle id="timeout-dialog-title">
            考试时间已到
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              考试时间已结束，系统将自动提交您的答案。
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleSubmit} color="primary" autoFocus disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : '确认'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AuthGuard>
  );
} 