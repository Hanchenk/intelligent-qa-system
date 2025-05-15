'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { use } from 'react';
import Link from 'next/link';
import AuthGuard from '../../../../components/AuthGuard';
import MarkdownPreview from '@/app/components/MarkdownPreview';
import OptionMarkdownPreview from '@/app/components/OptionMarkdownPreview';
import { getRecordById } from '@/app/services/recordService';

// Material UI 组件
import {
  Button,
  Typography,
  Box,
  Paper,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tooltip,
  LinearProgress,
} from '@mui/material';

// Material Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';

export default function RecordDetailPage({ params }) {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const recordId = use(params).id;
  
  // 状态
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 加载记录详情
  useEffect(() => {
    loadRecord();
  }, [recordId]);
  
  // 加载记录
  const loadRecord = async () => {
    setLoading(true);
    try {
      // 从服务获取记录详情
      const recordData = await getRecordById(recordId);
      
      if (recordData) {
        setRecord(recordData);
      } else {
        // 如果没有找到记录，加载模拟数据
        loadMockRecord();
      }
    } catch (error) {
      console.error('加载记录失败:', error);
      setError('加载记录失败，请稍后重试');
      // 加载模拟数据
      loadMockRecord();
    } finally {
      setLoading(false);
    }
  };
  
  // 加载模拟记录数据
  const loadMockRecord = () => {
    // 创建一个模拟记录
    const mockRecord = {
      id: recordId,
      exerciseId: '1',
      exerciseTitle: '前端基础知识练习',
      date: new Date().toISOString(),
      score: {
        percentage: 85,
        totalScore: 17,
        possibleScore: 20
      },
      timeSpent: 1200, // 20分钟
      questions: [
        {
          id: 'q1',
          title: '以下哪个CSS属性可以用来改变文本颜色？',
          type: '单选题',
          tags: ['CSS', '样式', '文本'],
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
          id: 'q2',
          title: '以下哪些是JavaScript中的基本数据类型？',
          type: '多选题',
          tags: ['JavaScript', '数据类型', '基础知识'],
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
          id: 'q3',
          title: '编写一个函数，计算数组中所有数字的和',
          type: '编程题',
          tags: ['JavaScript', '数组', '函数', '算法'],
          correctAnswer: `function sum(arr) {
  return arr.reduce((acc, curr) => acc + curr, 0);
}`,
          explanation: '使用reduce方法可以高效地计算数组元素的总和。初始累加器值设为0，遍历时将当前元素加到累加器中。'
        }
      ],
      answers: {
        q1: 'a',
        q2: ['a', 'b', 'c'],
        q3: `function sum(arr) {
  let total = 0;
  for(let i=0; i<arr.length(); i++) {
    total += arr[i];
  }
  return total;
}`
      },
      results: {
        totalScore: 17,
        maxScore: 20,
        correctCount: 17,
        questionResults: [
          { questionId: 'q1', isCorrect: false, score: 0 },
          { questionId: 'q2', isCorrect: false, score: 0 },
          { questionId: 'q3', isCorrect: false, score: 0 }
        ]
      },
      tags: ['HTML', 'CSS', 'JavaScript']
    };
    
    setRecord(mockRecord);
    setError(null);
  };
  
  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // 格式化时间（秒转为分:秒）
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 获取分数对应的颜色
  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'primary';
    if (percentage >= 60) return 'warning';
    return 'error';
  };
  
  // 获取分数对应的文字评价
  const getFeedback = (percentage) => {
    if (percentage >= 90) return '优秀';
    if (percentage >= 80) return '良好';
    if (percentage >= 70) return '中等';
    if (percentage >= 60) return '及格';
    return '需要加强';
  };
  
  // 检查答案是否正确
  const isAnswerCorrect = (question, userAnswer) => {
    if (!userAnswer) return false;
    
    if (question.type === '多选题') {
      if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) return false;
      
      return userAnswer.length === question.correctAnswer.length && 
        question.correctAnswer.every(value => userAnswer.includes(value));
    } else if (question.type === '编程题' || question.type === '填空题' || question.type === '简答题') {
      // 这些题型需要评分，默认假设错误
      const questionResult = record.results?.questionResults?.find(r => r.questionId === question.id);
      return questionResult ? questionResult.isCorrect : false;
    } else {
      return userAnswer === question.correctAnswer;
    }
  };
  
  // 渲染单选题或多选题的选项
  const renderOptions = (question, userAnswer) => {
    if (!question.options || !Array.isArray(question.options)) return null;
    
    return (
      <List>
        {question.options.map((option) => {
          // 判断选项是否被选中
          const isSelected = question.type === '多选题'
            ? Array.isArray(userAnswer) && userAnswer.includes(option.id)
            : userAnswer === option.id;
          
          // 判断是否为正确答案选项
          const isCorrect = question.type === '多选题'
            ? Array.isArray(question.correctAnswer) && question.correctAnswer.includes(option.id)
            : question.correctAnswer === option.id;
          
          // 确定选项背景颜色
          let bgColor = '';
          if (isSelected && isCorrect) {
            bgColor = 'rgba(76, 175, 80, 0.2)'; // 绿色背景 - 选对了
          } else if (isSelected && !isCorrect) {
            bgColor = 'rgba(244, 67, 54, 0.2)'; // 红色背景 - 选错了
          } else if (!isSelected && isCorrect) {
            bgColor = 'rgba(76, 175, 80, 0.1)'; // 浅绿色背景 - 未选但是正确答案
          }
          
          return (
            <Paper 
              key={option.id} 
              variant="outlined" 
              sx={{ 
                mb: 1, 
                p: 1.5, 
                bgcolor: bgColor,
                borderColor: isCorrect ? 'success.main' : isSelected ? 'error.main' : 'divider'
              }}
            >
              <Box display="flex" alignItems="center">
                <Box minWidth={36} display="flex" justifyContent="center">
                  {isSelected && isCorrect && <CheckCircleIcon color="success" fontSize="small" />}
                  {isSelected && !isCorrect && <CancelIcon color="error" fontSize="small" />}
                  {!isSelected && isCorrect && <CheckCircleIcon color="success" fontSize="small" sx={{ opacity: 0.7 }} />}
                </Box>
                <Box>
                  <Typography component="span" fontWeight="medium">
                    {option.id.toUpperCase()}. 
                  </Typography>
                  <OptionMarkdownPreview content={option.content} />
                </Box>
              </Box>
            </Paper>
          );
        })}
      </List>
    );
  };
  
  // 渲染主观题的用户答案和正确答案
  const renderSubjectiveAnswer = (question, userAnswer) => {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>您的答案:</Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              fontFamily: question.type === '编程题' ? 'monospace' : 'inherit',
              whiteSpace: question.type === '编程题' ? 'pre-wrap' : 'normal',
              fontSize: question.type === '编程题' ? '0.875rem' : '1rem',
            }}
          >
            {userAnswer || '未作答'}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>参考答案:</Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              fontFamily: question.type === '编程题' ? 'monospace' : 'inherit',
              whiteSpace: question.type === '编程题' ? 'pre-wrap' : 'normal',
              fontSize: question.type === '编程题' ? '0.875rem' : '1rem',
              borderColor: 'success.main',
              borderWidth: 1
            }}
          >
            {question.correctAnswer || '无参考答案'}
          </Paper>
        </Grid>
      </Grid>
    );
  };
  
  // 渲染问题详情
  const renderQuestion = (question, index) => {
    const userAnswer = record?.answers?.[question.id];
    const questionResult = record?.results?.questionResults?.find(r => r.questionId === question.id);
    const isCorrect = isAnswerCorrect(question, userAnswer);
    
    return (
      <Accordion key={question.id} defaultExpanded={index === 0}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            backgroundColor: isCorrect ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
            borderLeft: `4px solid ${isCorrect ? '#4caf50' : '#f44336'}`
          }}
        >
          <Box display="flex" alignItems="center" width="100%">
            <Box display="flex" alignItems="center" flexGrow={1}>
              <Typography variant="subtitle1" component="div" sx={{ mr: 1 }}>
                {index + 1}. 
              </Typography>
              <Typography variant="subtitle1" component="div">
                {question.title}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              {question.type && (
                <Chip 
                  size="small" 
                  label={question.type} 
                  color="primary" 
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
              )}
              {isCorrect ? (
                <Chip 
                  size="small"
                  icon={<CheckIcon />} 
                  label="正确" 
                  color="success" 
                />
              ) : (
                <Chip 
                  size="small"
                  icon={<CloseIcon />} 
                  label="错误" 
                  color="error" 
                />
              )}
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box mt={2}>
            {/* 选择题渲染选项 */}
            {(question.type === '单选题' || question.type === '多选题') && renderOptions(question, userAnswer)}
            
            {/* 主观题渲染答案对比 */}
            {(question.type === '填空题' || question.type === '简答题' || question.type === '编程题') && 
              renderSubjectiveAnswer(question, userAnswer)}
            
            {/* 解析 */}
            {question.explanation && (
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>解析:</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                  <MarkdownPreview content={question.explanation} />
                </Paper>
              </Box>
            )}
            
            {/* 分数 */}
            {questionResult && (
              <Box mt={2} display="flex" justifyContent="flex-end">
                <Chip 
                  label={`得分: ${questionResult.score}`} 
                  color={questionResult.score > 0 ? "primary" : "default"}
                  variant="outlined"
                />
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  };
  
  // 渲染摘要信息
  const renderSummary = () => {
    if (!record) return null;
    
    const { score, questions, date, timeSpent, exerciseTitle, tags } = record;
    
    return (
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={3}>
            <Typography variant="h5" component="h1" gutterBottom>
              {exerciseTitle || `记录 ${recordId}`}
            </Typography>
            <Box>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push('/dashboard/student/records')}
                variant="outlined"
                size="small"
              >
                返回记录列表
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={3}>
            {/* 左侧 - 分数和基本信息 */}
            <Grid item xs={12} md={4}>
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={2}>
                <Box position="relative" display="inline-flex" mb={2}>
                  <CircularProgress
                    variant="determinate"
                    value={score.percentage}
                    color={getScoreColor(score.percentage)}
                    size={120}
                    thickness={5}
                  />
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    bottom={0}
                    right={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Typography variant="h4" component="div" color="text.secondary">
                      {`${Math.round(score.percentage)}%`}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h6" align="center" gutterBottom>
                  {getFeedback(score.percentage)}
                </Typography>
                <Typography variant="body1" align="center" color="text.secondary">
                  得分: {score.totalScore} / {score.possibleScore}
                </Typography>
              </Box>
            </Grid>
            
            {/* 右侧 - 详细信息 */}
            <Grid item xs={12} md={8}>
              <List disablePadding>
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText 
                    primary="完成时间" 
                    secondary={formatDate(date || record.timestamp)}
                    primaryTypographyProps={{ variant: 'subtitle2' }}
                  />
                </ListItem>
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText 
                    primary="题目数量" 
                    secondary={questions ? questions.length : 0}
                    primaryTypographyProps={{ variant: 'subtitle2' }}
                  />
                </ListItem>
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemText 
                    primary="用时" 
                    secondary={formatTime(timeSpent)}
                    primaryTypographyProps={{ variant: 'subtitle2' }}
                  />
                </ListItem>
                {tags && tags.length > 0 && (
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText 
                      primary="课程" 
                      secondary={
                        <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                          {tags.map((tag, i) => (
                            <Chip key={i} label={tag} size="small" />
                          ))}
                        </Box>
                      }
                      primaryTypographyProps={{ variant: 'subtitle2' }}
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItem>
                )}
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  if (loading) {
    return (
      <AuthGuard allowedRoles={['student']}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 64px)">
            <CircularProgress />
          </Box>
        </div>
      </AuthGuard>
    );
  }
  
  if (error) {
    return (
      <AuthGuard allowedRoles={['student']}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Box p={4} display="flex" flexDirection="column" alignItems="center">
            <Alert severity="error" sx={{ width: '100%', maxWidth: 600 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push('/dashboard/student/records')}
              sx={{ mt: 3 }}
            >
              返回记录列表
            </Button>
          </Box>
        </div>
      </AuthGuard>
    );
  }
  
  if (!record) {
    return (
      <AuthGuard allowedRoles={['student']}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Box p={4} display="flex" flexDirection="column" alignItems="center">
            <Alert severity="warning" sx={{ width: '100%', maxWidth: 600 }}>
              未找到记录
            </Alert>
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push('/dashboard/student/records')}
              sx={{ mt: 3 }}
            >
              返回记录列表
            </Button>
          </Box>
        </div>
      </AuthGuard>
    );
  }
  
  return (
    <AuthGuard allowedRoles={['student']}>
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
                  <Link href="/dashboard/student" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    仪表盘
                  </Link>
                  <Link href="/dashboard/student/exercises" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    我的练习
                  </Link>
                  <Link href="/dashboard/student/progress" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    学习进度
                  </Link>
                  <Link href="/dashboard/student/records" className="px-3 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-gray-700">
                    答题记录
                  </Link>
                  <Link href="/dashboard/student/mistakes" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    错题本
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* 主内容区 */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              {/* 摘要信息 */}
              {renderSummary()}
              
              {/* 问题列表 */}
              <Typography variant="h6" component="h2" gutterBottom>
                题目详情
              </Typography>
              <Box>
                {record.questions && record.questions.map((question, index) => (
                  renderQuestion(question, index)
                ))}
              </Box>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
} 