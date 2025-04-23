'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { use } from 'react';
import AuthGuard from '../../../../../components/AuthGuard';
import { MarkdownPreview, OptionMarkdownPreview } from '@/app/components/markdown/MarkdownPreview';
import { saveExerciseRecord, createRecord } from '@/app/services/recordService';
import { getUserBookmarks, createBookmark, deleteBookmarkByExerciseId } from '@/app/services/bookmarkService';

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
  ListItemIcon,
  CircularProgress,
  LinearProgress,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

// Material Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import SchoolIcon from '@mui/icons-material/School';
import HomeIcon from '@mui/icons-material/Home';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

export default function ResultPage({ params }) {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const exerciseId = use(params).id;
  
  // 状态
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  useEffect(() => {
    // 获取结果数据
    const fetchResults = async () => {
      setLoading(true);
      
      // 从localStorage获取结果数据
      const storedResults = localStorage.getItem('exerciseResults');
      
      if (storedResults) {
        try {
          const parsedResults = JSON.parse(storedResults);
          
          // 检查是否是当前练习的结果
          if (parsedResults.exerciseId === exerciseId) {
            setResults(parsedResults);
            
            // 如果用户已登录，自动保存记录
            if (user && user.id) {
              saveRecord(parsedResults);
            }
          } else {
            // 不是当前练习的结果，提示错误
            alert('找不到当前练习的结果数据');
            router.push('/dashboard/student/exercises');
          }
        } catch (error) {
          console.error('解析结果数据错误:', error);
          alert('解析结果数据时出错');
          router.push('/dashboard/student/exercises');
        }
      } else {
        // 没有结果数据，返回练习列表
        alert('没有找到练习结果数据');
        router.push('/dashboard/student/exercises');
      }
      
      setLoading(false);
    };
    
    fetchResults();
    
    // 检查练习是否已收藏
    checkBookmarkStatus();
  }, [exerciseId, router, user]);
  
  // 计算得分百分比
  const calculatePercentage = (resultData) => {
    if (!resultData || !resultData.results) return 0;
    const { totalScore, maxScore } = resultData.results;
    return Math.round((totalScore / maxScore) * 100);
  };
  
  // 保存记录到服务
  const saveRecord = async (resultData) => {
    if (!user || isSaving) return;
    
    setIsSaving(true);
    
    try {
      // 准备记录数据
      const recordData = {
        userId: user.id,
        exerciseId: resultData.exerciseId,
        exerciseTitle: resultData.exerciseTitle,
        date: new Date().toISOString(),
        score: {
          percentage: calculatePercentage(resultData),
          totalScore: resultData.results.totalScore,
          possibleScore: resultData.questions.length
        },
        timeSpent: resultData.timeSpent,
        answers: resultData.userAnswers,
        questions: resultData.questions.map(q => ({
          id: q.id,
          title: q.title,
          type: q.type,
          correctAnswer: q.correctAnswer,
          tags: q.tags || []
        })),
        tags: resultData.tags || [],
        results: resultData.results
      };
      
      // 保存记录 - 注意这是异步函数
      await saveExerciseRecord(recordData);
      
      setIsSaved(true);
      setIsSaving(false);
      setSaveError(null);
    } catch (error) {
      console.error('保存记录失败:', error);
      setSaveError(error.message || '保存记录失败，请稍后重试');
      setIsSaving(false);
    }
  };
  
  // 检查练习是否已收藏
  const checkBookmarkStatus = async () => {
    try {
      if (!user || !user.id) return;
      
      // 从API获取收藏列表
      const bookmarksData = await getUserBookmarks();
      setBookmarked(bookmarksData.some(item => item.exerciseId === exerciseId));
    } catch (error) {
      console.error('检查收藏状态失败:', error);
    }
  };
  
  // 切换收藏状态
  const toggleBookmark = async () => {
    try {
      if (!user || !user.id || !results) return;
      
      if (bookmarked) {
        // 取消收藏
        await deleteBookmarkByExerciseId(exerciseId);
        setBookmarked(false);
      } else {
        // 添加收藏
        await createBookmark({
          exerciseId,
          exerciseTitle: results.exerciseTitle,
          tags: results.tags || ['练习']
        });
        setBookmarked(true);
      }
    } catch (error) {
      console.error('更新收藏状态失败:', error);
      alert('更新收藏状态失败，请稍后再试');
    }
  };
  
  // 格式化时间
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours > 0 ? `${hours}小时` : null,
      minutes > 0 ? `${minutes}分钟` : null,
      `${secs}秒`
    ].filter(Boolean).join(' ');
  };
  
  // 获取评语
  const getFeedback = (percentage) => {
    if (percentage >= 90) {
      return '太棒了！你的表现非常出色，继续保持！';
    } else if (percentage >= 80) {
      return '做得好！你已经掌握了大部分知识点。';
    } else if (percentage >= 70) {
      return '不错！还有一些需要提高的地方。';
    } else if (percentage >= 60) {
      return '及格！还需要更多的练习来巩固知识。';
    } else {
      return '需要加强学习，建议重新复习相关知识点。';
    }
  };
  
  // 渲染选项内容
  const renderOptionContent = (option, isCorrect, isSelected) => {
    let color = 'inherit';
    let icon = null;
    
    if (isSelected && isCorrect) {
      color = 'success.main';
      icon = <CheckCircleIcon fontSize="small" color="success" />;
    } else if (isSelected && !isCorrect) {
      color = 'error.main';
      icon = <CancelIcon fontSize="small" color="error" />;
    } else if (!isSelected && isCorrect) {
      color = 'success.main';
      icon = <CheckCircleIcon fontSize="small" color="success" />;
    }
    
    return (
      <Box display="flex" alignItems="flex-start">
        {icon && <Box mr={1}>{icon}</Box>}
        <Box color={color}>
          <Typography component="span" fontWeight="medium">{option.id.toUpperCase()}. </Typography>
          <OptionMarkdownPreview content={option.content} />
        </Box>
      </Box>
    );
  };
  
  // 渲染问题和答案
  const renderQuestionReview = (question, userAnswer, index) => {
    // 获取问题结果，包含评估信息
    const questionResult = results?.results?.questionResults?.find(r => r.questionId === question.id);
    const isSubjective = question.type === '简答题' || question.type === '编程题' || question.type === '填空题';
    
    // 检查是否有AI评估结果
    const hasAiEvaluation = isSubjective && questionResult && questionResult.aiEvaluation;
    
    // 确定题目是否正确
    const isCorrect = (() => {
      // 如果有明确的评估结果，使用评估结果
      if (questionResult && questionResult.isCorrect !== undefined) {
        return questionResult.isCorrect;
      }
      // 否则使用传统判断方法 (注意：calculateResults已更新，此处逻辑可能简化)
      // 这里可以信任 questionResult.isCorrect 的初步判断值
      return questionResult?.isCorrect || false; 
    })();
    
    // 获取用于显示的正确答案 (格式化后的用于客观题，原始的用于主观题参考)
    const displayCorrectAnswer = isSubjective ? question.originalStandardAnswer : question.formattedCorrectAnswer;

    return (
      <Accordion key={question.id} defaultExpanded={index === 0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" width="100%">
            <Box display="flex" alignItems="center" mr={2}>
              {isCorrect ? (
                <CheckCircleIcon color="success" />
              ) : (
                <CancelIcon color="error" />
              )}
            </Box>
            <Typography variant="subtitle1" fontWeight="medium">
              {index + 1}. {question.type}
            </Typography>
            <Box ml="auto">
              <Chip 
                label={isCorrect ? '正确' : '错误'} 
                color={isCorrect ? 'success' : 'error'} 
                size="small" 
              />
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            {/* 题目内容 */}
            <Box mb={3}>
              <MarkdownPreview content={question.title} />
            </Box>
            
            {/* 选项内容（如果有） */}
            {question.options && question.options.length > 0 && (
              <Box mb={3}>
                <div className="option-list">
                  {question.options.map((option) => {
                    const isOptionCorrect = question.type === '多选题' 
                      ? (question.formattedCorrectAnswer || []).includes(option.id)
                      : question.formattedCorrectAnswer === option.id;
                    const isOptionSelected = question.type === '多选题'
                      ? (userAnswer || []).includes(option.id)
                      : userAnswer === option.id;

                    return (
                      <div key={option.id} className="option-item mb-2">
                        <Box display="flex" alignItems="flex-start">
                          {/* 图标显示区域 */}
                          <Box minWidth="32px">
                            {isOptionSelected ? (
                              isOptionCorrect ? (
                                <CheckCircleIcon fontSize="small" color="success" />
                              ) : (
                                <CancelIcon fontSize="small" color="error" />
                              )
                            ) : isOptionCorrect ? (
                              <CheckCircleIcon fontSize="small" color="success" />
                            ) : null}
                          </Box>
                          
                          {/* 选项内容区域 */}
                          <Box 
                            flex="1"
                            color={isOptionSelected ? (isOptionCorrect ? 'success.main' : 'error.main') : (isOptionCorrect ? 'success.main' : 'inherit')}
                          >
                            <Typography component="span" fontWeight="medium">
                              {option.id.toUpperCase()}. 
                            </Typography>
                            <OptionMarkdownPreview content={option.content} />
                          </Box>
                        </Box>
                      </div>
                    );
                  })}
                </div>
              </Box>
            )}
            
            {/* 用户答案 */}
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                你的答案:
              </Typography>
              <Paper variant="outlined" className={`p-3 ${!isCorrect ? 'border-red-300' : ''}`}>
                {isSubjective || question.type === '填空题' ? (
                  <Typography 
                    component="pre" 
                    className={`${question.type === '编程题' ? 'font-mono text-sm' : ''} whitespace-pre-wrap`}
                  >
                    {userAnswer || '(未作答)'}
                  </Typography>
                ) : (
                  // 选择题/判断题显示选项内容
                  <Typography>
                    {userAnswer ? (
                      question.options?.find(opt => opt.id === userAnswer)?.content || userAnswer
                    ) : '(未作答)'}
                  </Typography>
                )}
              </Paper>
            </Box>
            
            {/* AI评估结果（如果有） */}
            {hasAiEvaluation && (
              <Box mb={3} p={2} bgcolor="background.paper" borderRadius={1} border="1px solid #e0e0e0">
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  AI评估结果
                </Typography>
                
                {/* 分数 */}
                {questionResult.aiEvaluation.score !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      得分:
                    </Typography>
                    <Typography variant="body2" sx={{ color: questionResult.isCorrect ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                      {questionResult.aiEvaluation.score}/100分
                    </Typography>
                  </Box>
                )}
                
                {/* 总体评价 */}
                {questionResult.aiEvaluation.feedback && (
                  <Box mb={2} p={1} bgcolor="#f5f5f5" borderRadius={1}>
                    <Typography variant="body2">
                      {questionResult.aiEvaluation.feedback}
                    </Typography>
                  </Box>
                )}
                
                {/* 详细评估（编程题） */}
                {question.type === '编程题' && questionResult.aiEvaluation.strengthPoints && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>代码优点:</Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                      {questionResult.aiEvaluation.strengthPoints.map((point, i) => (
                        <Box component="li" key={i} sx={{ mb: 0.5 }}>
                          <Typography variant="body2">{point}</Typography>
                        </Box>
                      ))}
                    </Box>
                    
                    {questionResult.aiEvaluation.weaknessPoints && (
                      <>
                        <Typography variant="subtitle2" gutterBottom>代码缺点:</Typography>
                        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                          {questionResult.aiEvaluation.weaknessPoints.map((point, i) => (
                            <Box component="li" key={i} sx={{ mb: 0.5 }}>
                              <Typography variant="body2" color="error.main">{point}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </>
                    )}
                  </>
                )}
                
                {/* 详细评估（简答题） */}
                {question.type === '简答题' && questionResult.aiEvaluation.keyPointsCovered && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>已覆盖要点:</Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                      {questionResult.aiEvaluation.keyPointsCovered.map((point, i) => (
                        <Box component="li" key={i} sx={{ mb: 0.5 }}>
                          <Typography variant="body2">{point}</Typography>
                        </Box>
                      ))}
                    </Box>
                    
                    {questionResult.aiEvaluation.missingPoints && (
                      <>
                        <Typography variant="subtitle2" gutterBottom>遗漏要点:</Typography>
                        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                          {questionResult.aiEvaluation.missingPoints.map((point, i) => (
                            <Box component="li" key={i} sx={{ mb: 0.5 }}>
                              <Typography variant="body2" color="error.main">{point}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </>
                    )}
                  </>
                )}
                
                {/* 改进建议 */}
                {questionResult.aiEvaluation.improvementSuggestions && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>改进建议:</Typography>
                    <Box p={1} bgcolor="#f9f9f9" borderRadius={1}>
                      <Typography variant="body2">
                        {questionResult.aiEvaluation.improvementSuggestions}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            )}
            
            {/* 正确答案 */}
            <Box mb={3}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {isSubjective ? '参考答案' : '正确答案'}:
              </Typography>
              <Paper variant="outlined" className="p-3 bg-green-50 border-green-300">
                {isSubjective ? (
                  <Typography 
                    component="pre" 
                    className={`${question.type === '编程题' ? 'font-mono text-sm' : ''} whitespace-pre-wrap`}
                  >
                    {displayCorrectAnswer || '(未提供)'}
                  </Typography>
                ) : (
                   // 选择题/判断题显示选项内容
                   <Typography>
                    {question.type === '多选题' ? (
                      (displayCorrectAnswer || []).map(id => 
                        question.options?.find(opt => opt.id === id)?.content || id
                      ).join(', ') || '(未提供)'
                    ) : (
                      question.options?.find(opt => opt.id === displayCorrectAnswer)?.content || displayCorrectAnswer || '(未提供)'
                    )}
                   </Typography>
                )}
              </Paper>
            </Box>
            
            {/* 解释 */}
            {question.explanation && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  解析:
                </Typography>
                <MarkdownPreview content={question.explanation} />
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  };
  
  // 渲染结果总结
  const renderSummary = () => {
    if (!results) return null;
    
    const { timeSpent, questions, userAnswers, results: scoreResults } = results;
    
    return (
      <Grid container spacing={3}>
        {/* 成绩卡片 */}
        <Grid item xs={12} md={4}>
          <Card className="text-center">
            <CardContent>
              <Box position="relative" display="inline-block" className="mb-4">
                <CircularProgress 
                  variant="determinate" 
                  value={scoreResults.percentage} 
                  size={120} 
                  thickness={5}
                  color={scoreResults.percentage >= 60 ? 'success' : 'error'}
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
                  <Typography variant="h4" component="div" color="text.primary">
                    {scoreResults.percentage}%
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                {scoreResults.totalScore} / {scoreResults.maxScore} 分
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                {getFeedback(scoreResults.percentage)}
              </Typography>
              
              {/* 记录保存状态 */}
              {user && user.id && (
                <Box mt={2}>
                  {isSaving ? (
                    <Box display="flex" alignItems="center" justifyContent="center">
                      <CircularProgress size={20} className="mr-2" />
                      <Typography variant="body2" color="text.secondary">保存中...</Typography>
                    </Box>
                  ) : isSaved ? (
                    <Typography variant="body2" color="success.main">
                      <CheckCircleIcon fontSize="small" className="mr-1" />
                      记录已保存
                    </Typography>
                  ) : saveError ? (
                    <Typography variant="body2" color="error">
                      {saveError}
                      <Button 
                        variant="text" 
                        color="primary" 
                        size="small" 
                        onClick={() => saveRecord(results)}
                        className="ml-2"
                      >
                        重试
                      </Button>
                    </Typography>
                  ) : (
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      size="small" 
                      onClick={() => saveRecord(results)}
                      startIcon={<CheckCircleIcon />}
                    >
                      保存记录
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* 统计信息 */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                练习统计
              </Typography>
              
              <List disablePadding>
                <ListItem disablePadding className="py-2">
                  <ListItemIcon className="min-w-10">
                    <TimerIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="用时" 
                    secondary={formatTime(timeSpent)} 
                  />
                </ListItem>
                
                <Divider component="li" />
                
                <ListItem disablePadding className="py-2">
                  <ListItemIcon className="min-w-10">
                    <CheckCircleIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="正确题数" 
                    secondary={`${scoreResults.correctCount} / ${questions.length} 题`} 
                  />
                </ListItem>
                
                <Divider component="li" />
                
                <ListItem disablePadding className="py-2">
                  <ListItemIcon className="min-w-10">
                    <SchoolIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="完成率" 
                    secondary={`${Object.values(userAnswers).filter(a => Array.isArray(a) ? a.length > 0 : a !== '').length} / ${questions.length} 题`} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
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
                
                {!loading && results && (
                  <Typography variant="h6" className="ml-4 font-bold">
                    {results.exerciseTitle} - 结果
                  </Typography>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* 主内容区 */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <CircularProgress />
            </div>
          ) : results ? (
            <div className="px-4 py-6 sm:px-0">
              {/* 结果总结 */}
              <Box className="mb-8">
                {renderSummary()}
              </Box>
              
              {/* 操作按钮 */}
              <Box className="flex justify-center flex-wrap gap-4 mb-8">
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<HomeIcon />}
                  onClick={() => router.push('/dashboard/student')}
                >
                  返回仪表盘
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  onClick={toggleBookmark}
                >
                  {bookmarked ? '取消收藏' : '收藏练习'}
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="success" 
                  startIcon={<EmojiEventsIcon />}
                  onClick={() => router.push('/dashboard/student/progress')}
                >
                  查看学习进度
                </Button>
              </Box>
              
              {/* 详细题目回顾 */}
              <Box>
                <Typography variant="h5" component="h2" className="mb-4 font-bold">
                  题目回顾
                </Typography>
                
                <Box>
                  {results.questions.map((question, index) => (
                    renderQuestionReview(
                      question, 
                      results.userAnswers[question.id], 
                      index
                    )
                  ))}
                </Box>
              </Box>
            </div>
          ) : (
            <div className="text-center py-20">
              <Typography variant="h6" color="text.secondary">
                没有找到练习结果数据
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => router.push('/dashboard/student/exercises')}
                className="mt-4"
              >
                返回练习列表
              </Button>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
} 