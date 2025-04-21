'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import AuthGuard from '../../../../../components/AuthGuard';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  Alert, 
  CircularProgress, 
  List, 
  ListItem, 
  ListItemText,
  Card,
  CardContent,
  Chip,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';

export default function ExamResultPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useSelector((state) => state.auth);
  const examId = params.id;
  const score = searchParams.get('score');
  
  // 状态
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 加载考试和结果数据
  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        setLoading(true);
        
        // 获取考试详情
        const examResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/exams/teacher/${examId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setExam(examResponse.data);
        
        // 这里应该还有一个获取考试结果的请求
        // 由于我们目前没有单独的考试结果API，暂时使用URL参数中的score
        
        setLoading(false);
      } catch (error) {
        console.error('获取考试结果失败:', error);
        setError('获取考试结果失败');
        setLoading(false);
      }
    };
    
    fetchExamDetails();
  }, [examId, token]);
  
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
  
  // 计算是否通过考试
  const isPassed = score && exam?.passingScore ? parseInt(score) >= exam.passingScore : false;
  
  return (
    <AuthGuard allowedRoles={['student']}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4, px: { xs: 2, md: 4 } }}>
        <Paper sx={{ maxWidth: 1000, mx: 'auto', p: 4, borderRadius: 2 }} elevation={3}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              考试结果
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {exam?.title || '考试详情'}
            </Typography>
            <Divider sx={{ my: 2 }} />
          </Box>
          
          {/* 分数展示 */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              您的得分
            </Typography>
            <Box sx={{ 
              width: 150, 
              height: 150, 
              borderRadius: '50%', 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              bgcolor: isPassed ? 'success.light' : 'error.light',
              color: 'white',
              mx: 'auto',
              mb: 2
            }}>
              <Typography variant="h3">
                {score || 0}
              </Typography>
              <Typography variant="body2">
                总分 {exam?.totalScore || 100}
              </Typography>
            </Box>
            
            <Chip 
              icon={isPassed ? <CheckCircleIcon /> : <CancelIcon />}
              label={isPassed ? '恭喜，您已通过考试！' : '很遗憾，您未通过考试'}
              color={isPassed ? 'success' : 'error'}
              variant="outlined"
              sx={{ px: 2, py: 1 }}
            />
            
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              及格分数：{exam?.passingScore || 60}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 4 }} />
          
          {/* 错题记录 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              错题记录
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              以下是您在本次考试中答错的题目，这些题目已添加到您的错题本中。
            </Typography>
            
            {exam && exam.questions ? (
              <List>
                {exam.questions.filter(q => results.some(r => r.questionId === q.question._id && !r.isCorrect)).map((q, index) => (
                  <Accordion key={index} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>
                        {index + 1}. [{q.question.type}] {q.question.title}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          正确答案：
                        </Typography>
                        <Typography variant="body2" color="success.main" gutterBottom>
                          {q.question.correctAnswer}
                        </Typography>
                        
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                          您的答案：
                        </Typography>
                        <Typography variant="body2" color="error.main" gutterBottom>
                          {/* 这里应该显示用户的答案，由于没有完整的结果数据，暂时略过 */}
                        </Typography>
                        
                        {q.question.explanation && (
                          <>
                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                              解析：
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              {q.question.explanation}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
                
                {exam.questions.filter(q => results.some(r => r.questionId === q.question._id && !r.isCorrect)).length === 0 && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    您答对了所有题目，真棒！
                  </Alert>
                )}
              </List>
            ) : (
              <Alert severity="info">
                暂无错题数据
              </Alert>
            )}
          </Box>
          
          {/* 按钮区域 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
            <Button 
              variant="outlined" 
              onClick={() => router.push('/dashboard/student/exams')}
            >
              返回考试列表
            </Button>
            <Button 
              variant="contained" 
              onClick={() => router.push('/dashboard/student/mistakes')}
            >
              查看错题本
            </Button>
          </Box>
        </Paper>
      </Box>
    </AuthGuard>
  );
} 