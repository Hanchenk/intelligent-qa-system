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
  AccordionDetails,
  Rating
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CodeIcon from '@mui/icons-material/Code';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
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
          `${process.env.NEXT_PUBLIC_API_URL}/exams/teacher/${examId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setExam(examResponse.data);
        
        // 获取学生考试提交情况
        try {
          const resultsResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/exams/student/${examId}/results`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          setResults(resultsResponse.data.answers || []);
        } catch (err) {
          console.error('获取答题结果失败:', err);
          // 如果API不可用，创建模拟数据
          setResults([]);
        }
        
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
  
  // 显示主观题评估结果
  const renderSubjectiveEvaluation = (result) => {
    if (!result || !result.aiEvaluation) return null;
    
    const evaluation = result.aiEvaluation;
    
    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          AI评估结果
        </Typography>
        
        {/* 分数评级 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            得分评级:
          </Typography>
          <Rating 
            value={Math.ceil(evaluation.score/20)} 
            readOnly 
            max={5}
            size="small"
          />
          <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
            ({evaluation.score}/100分)
          </Typography>
        </Box>
        
        {/* 总体评价 */}
        <Typography variant="body2" sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          {evaluation.feedback}
        </Typography>
        
        {/* 评估详情 */}
        <Accordion sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">查看详细评估</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* 对于简答题 */}
            {evaluation.keyPointsCovered && (
              <>
                <Typography variant="subtitle2" gutterBottom>已覆盖要点:</Typography>
                <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                  {evaluation.keyPointsCovered.map((point, i) => (
                    <Box component="li" key={i} sx={{ mb: 0.5 }}>
                      <Typography variant="body2">{point}</Typography>
                    </Box>
                  ))}
                </Box>
                
                {evaluation.missingPoints && evaluation.missingPoints.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>遗漏要点:</Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                      {evaluation.missingPoints.map((point, i) => (
                        <Box component="li" key={i} sx={{ mb: 0.5 }}>
                          <Typography variant="body2" color="error.main">{point}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
                
                {evaluation.misconceptions && evaluation.misconceptions.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>概念误区:</Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                      {evaluation.misconceptions.map((point, i) => (
                        <Box component="li" key={i} sx={{ mb: 0.5 }}>
                          <Typography variant="body2" color="warning.main">{point}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </>
            )}
            
            {/* 对于编程题 */}
            {evaluation.strengthPoints && (
              <>
                <Typography variant="subtitle2" gutterBottom>代码优点:</Typography>
                <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                  {evaluation.strengthPoints.map((point, i) => (
                    <Box component="li" key={i} sx={{ mb: 0.5 }}>
                      <Typography variant="body2">{point}</Typography>
                    </Box>
                  ))}
                </Box>
                
                {evaluation.weaknessPoints && evaluation.weaknessPoints.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>代码缺点:</Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                      {evaluation.weaknessPoints.map((point, i) => (
                        <Box component="li" key={i} sx={{ mb: 0.5 }}>
                          <Typography variant="body2" color="error.main">{point}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
                
                {evaluation.codeAnalysis && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>代码分析:</Typography>
                    <Typography variant="body2" sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      {evaluation.codeAnalysis}
                    </Typography>
                  </>
                )}
              </>
            )}
            
            {/* 通用 - 改进建议 */}
            {(evaluation.improvementSuggestions || evaluation.improvement) && (
              <>
                <Typography variant="subtitle2" gutterBottom>改进建议:</Typography>
                <Typography variant="body2" sx={{ mb: 2, p: 1, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                  {evaluation.improvementSuggestions || evaluation.improvement}
                </Typography>
              </>
            )}
            
            {/* 参考答案 */}
            {(evaluation.modelAnswer || evaluation.correctSolution) && (
              <>
                <Typography variant="subtitle2" gutterBottom color="primary">参考解答:</Typography>
                <Typography variant="body2" sx={{ p: 1, bgcolor: '#e3f2fd', borderRadius: 1, fontFamily: evaluation.correctSolution ? 'monospace' : 'inherit' }}>
                  {evaluation.modelAnswer || evaluation.correctSolution}
                </Typography>
              </>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };
  
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
          
          {/* 题目清单与评估结果 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              答题详情
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              以下是您在本次考试中的答题情况，包括评分和反馈。
            </Typography>
            
            {exam && exam.questions ? (
              <List>
                {exam.questions.map((q, index) => {
                  const questionResult = results.find(r => r.questionId === q.question._id);
                  const isCorrect = questionResult?.isCorrect || false;
                  const isSubjective = q.question.type === '简答题' || q.question.type === '编程题';
                  
                  return (
                    <Accordion key={index} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Chip 
                            size="small"
                            icon={isSubjective ? 
                              (q.question.type === '简答题' ? <QuestionAnswerIcon /> : <CodeIcon />) : 
                              (isCorrect ? <CheckCircleIcon /> : <CancelIcon />)
                            }
                            label={q.question.type}
                            color={isSubjective ? "primary" : isCorrect ? "success" : "error"}
                            sx={{ mr: 2 }}
                          />
                          <Typography sx={{ flexGrow: 1 }}>
                            {index + 1}. {q.question.title}
                          </Typography>
                          <Typography sx={{ ml: 2, color: isCorrect ? 'success.main' : 'error.main' }}>
                            {questionResult ? questionResult.score : 0}/{q.score}分
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            正确答案:
                          </Typography>
                          <Typography variant="body2" color="success.main" gutterBottom sx={{ 
                            whiteSpace: 'pre-wrap',
                            fontFamily: q.question.type === '编程题' ? 'monospace' : 'inherit'
                          }}>
                            {q.question.correctAnswer || '未提供标准答案'}
                          </Typography>
                          
                          <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                            您的答案:
                          </Typography>
                          <Typography variant="body2" gutterBottom sx={{ 
                            whiteSpace: 'pre-wrap',
                            fontFamily: q.question.type === '编程题' ? 'monospace' : 'inherit'
                          }}>
                            {questionResult?.userAnswer || '未作答'}
                          </Typography>
                          
                          {/* 显示主观题的AI评估结果 */}
                          {isSubjective && renderSubjectiveEvaluation(questionResult)}
                          
                          {/* 显示传统解析 */}
                          {q.question.explanation && !isSubjective && (
                            <>
                              <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                                解析:
                              </Typography>
                              <Typography variant="body2" gutterBottom>
                                {q.question.explanation}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
                
                {exam.questions.length === 0 && (
                  <Alert severity="info">本次考试中没有题目</Alert>
                )}
              </List>
            ) : (
              <Alert severity="info">考试信息加载中或不可用</Alert>
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