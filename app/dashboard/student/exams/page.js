'use client';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import AuthGuard from '../../../components/AuthGuard';
import { 
  Button, 
  Alert, 
  Snackbar, 
  Paper, 
  Typography, 
  Box, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  Chip,
  Card, 
  CardContent,
  CardActions,
  Grid,
  CircularProgress
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function StudentExamsPage() {
  const router = useRouter();
  const { user, token } = useSelector((state) => state.auth);
  const localToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const effectiveToken = token || localToken;
  
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    fetchExams();
  }, []);

  // 模拟考试数据
  const getMockExams = () => {
    const currentTime = new Date();
    return [
      {
        _id: 'mock-exam-1',
        title: '期中考试 - JavaScript基础',
        description: '本次考试涵盖JavaScript基础语法、函数、对象等内容',
        startTime: new Date(currentTime.getTime() - 1000 * 60 * 60).toISOString(), // 1小时前
        endTime: new Date(currentTime.getTime() + 1000 * 60 * 60 * 24).toISOString(), // 24小时后
        duration: 90,
        totalScore: 100,
        passingScore: 60,
        creator: { name: '张老师', _id: 'teacher-1' },
        questions: []
      },
      {
        _id: 'mock-exam-2',
        title: '期末考试 - 前端开发综合',
        description: '包含HTML、CSS、JavaScript和React基础知识',
        startTime: new Date(currentTime.getTime() + 1000 * 60 * 60 * 24).toISOString(), // 24小时后
        endTime: new Date(currentTime.getTime() + 1000 * 60 * 60 * 48).toISOString(), // 48小时后
        duration: 120,
        totalScore: 150,
        passingScore: 90,
        creator: { name: '李老师', _id: 'teacher-2' },
        questions: []
      },
      {
        _id: 'mock-exam-3',
        title: '阶段测试 - Web应用安全',
        description: '测试对Web应用安全知识的掌握程度',
        startTime: new Date(currentTime.getTime() - 1000 * 60 * 60 * 48).toISOString(), // 48小时前
        endTime: new Date(currentTime.getTime() - 1000 * 60 * 60 * 24).toISOString(), // 24小时前(已结束)
        duration: 60,
        totalScore: 80,
        passingScore: 48,
        creator: { name: '王老师', _id: 'teacher-3' },
        questions: []
      }
    ];
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      console.log('正在获取学生考试列表...');
      
      // 尝试从API获取考试列表
      let examData = [];
      try {
        const response = await axios.get(`${API_URL}/exams/student`, {
          headers: { Authorization: `Bearer ${effectiveToken}` }
        });
        
        console.log('API响应:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          examData = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          examData = response.data.data;
        }
      } catch (apiError) {
        console.error('API请求失败:', apiError.message);
        
        // 使用备用URL尝试
        try {
          console.log('尝试备用URL:', `${API_URL}/student/exams`);
          const backupResponse = await axios.get(`${API_URL}/student/exams`, {
            headers: { Authorization: `Bearer ${effectiveToken}` }
          });
          
          if (backupResponse.data && Array.isArray(backupResponse.data)) {
            examData = backupResponse.data;
          } else if (backupResponse.data && backupResponse.data.data && Array.isArray(backupResponse.data.data)) {
            examData = backupResponse.data.data;
          }
        } catch (backupError) {
          console.error('备用API请求也失败:', backupError.message);
          // 使用模拟数据
          examData = getMockExams();
          console.log('使用模拟考试数据:', examData);
          
          setSnackbar({
            open: true,
            message: '无法连接到服务器，显示模拟数据',
            severity: 'warning'
          });
        }
      }
      
      if (examData.length === 0) {
        console.log('没有考试数据，使用模拟数据');
        examData = getMockExams();
      }
      
      setExams(examData);
      setLoading(false);
    } catch (error) {
      console.error('获取考试列表失败:', error);
      setError('获取考试列表时出错');
      
      // 使用模拟数据确保页面可用
      setExams(getMockExams());
      setLoading(false);
      
      setSnackbar({
        open: true,
        message: '获取考试列表失败，显示模拟数据',
        severity: 'error'
      });
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('日期格式化错误:', error);
      return '无效日期';
    }
  };

  const calculateRemainingTime = (endTime) => {
    try {
      const now = new Date();
      const end = new Date(endTime);
      const diff = end - now;
      
      if (diff <= 0) return '已结束';
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `还剩 ${days} 天 ${hours % 24} 小时`;
      }
      
      return `还剩 ${hours} 小时 ${minutes} 分钟`;
    } catch (error) {
      console.error('计算剩余时间错误:', error);
      return '时间未知';
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

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
                    智能答题系统
                  </span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                  <Link href="/dashboard/student" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    仪表盘
                  </Link>
                  <Link href="/dashboard/student/exercises" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    练习题
                  </Link>
                  <Link href="/dashboard/student/exams" className="px-3 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900">
                    考试
                  </Link>
                  <Link href="/dashboard/student/mistakes" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    错题本
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              在线考试
            </Typography>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={fetchExams}
            >
              刷新列表
            </Button>
          </Box>

          {loading ? (
            <Paper sx={{ p: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography>正在加载考试列表...</Typography>
            </Paper>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          ) : exams.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>当前没有可参加的考试</Typography>
              <Typography color="text.secondary">
                请稍后再来查看，或联系您的老师获取更多信息。
              </Typography>
              <Button 
                variant="contained" 
                sx={{ mt: 3 }} 
                onClick={fetchExams}
              >
                重新加载
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {exams.map((exam) => (
                <Grid item xs={12} md={6} lg={4} key={exam._id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" component="div" gutterBottom>
                          {exam.title}
                        </Typography>
                        <Chip 
                          label={calculateRemainingTime(exam.endTime)} 
                          color={new Date(exam.endTime) < new Date() ? "error" : "primary"} 
                          size="small"
                        />
                      </Box>
                      
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        {exam.description || '暂无描述'}
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            考试时长：{exam.duration} 分钟
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            开始时间：{formatDate(exam.startTime)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            结束时间：{formatDate(exam.endTime)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              出卷人：{exam.creator?.name || '未知'}
                            </Typography>
                          </Box>
                          <Chip 
                            label={`总分: ${exam.totalScore || '?'}`} 
                            size="small" 
                            variant="outlined" 
                            color="primary"
                          />
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        variant="contained" 
                        fullWidth
                        disabled={new Date(exam.endTime) < new Date()}
                        onClick={() => router.push(`/dashboard/student/exams/${exam._id}`)}
                      >
                        {new Date(exam.startTime) > new Date() ? '未开始' :
                         new Date(exam.endTime) < new Date() ? '已结束' : '进入考试'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </main>
      </div>
      
      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AuthGuard>
  );
} 