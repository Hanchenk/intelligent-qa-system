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
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import axios from 'axios';

export default function TeacherExamsPage() {
  const router = useRouter();
  const { user, token } = useSelector((state) => state.auth);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/exams/teacher`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExams(response.data);
      setLoading(false);
    } catch (error) {
      console.error('获取考试列表失败:', error);
      setError('获取考试列表时出错');
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!confirm('确定要删除此考试吗？此操作不可撤销。')) {
      return;
    }

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSnackbar({
        open: true,
        message: '考试删除成功',
        severity: 'success'
      });
      
      // 刷新考试列表
      fetchExams();
    } catch (error) {
      console.error('删除考试失败:', error);
      setSnackbar({
        open: true,
        message: '删除考试失败',
        severity: 'error'
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                    智能答题系统
                  </span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                  <Link href="/dashboard/teacher" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    仪表盘
                  </Link>
                  <Link href="/dashboard/teacher/questions" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    题库管理
                  </Link>
                  <Link href="/dashboard/teacher/exams" className="px-3 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900">
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              考试管理
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => router.push('/dashboard/teacher/exams/create')}
            >
              创建新考试
            </Button>
          </Box>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>我创建的考试</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography>加载中...</Typography>
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : exams.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography>您还没有创建任何考试</Typography>
              </Box>
            ) : (
              <List>
                {exams.map((exam) => (
                  <ListItem
                    key={exam._id}
                    secondaryAction={
                      <Box>
                        <IconButton 
                          edge="end" 
                          aria-label="编辑"
                          onClick={() => router.push(`/dashboard/teacher/exams/edit/${exam._id}`)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="删除"
                          onClick={() => handleDeleteExam(exam._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                    divider
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 2 }}>
                            {exam.title}
                          </Typography>
                          <Chip 
                            size="small" 
                            color={new Date() > new Date(exam.endTime) ? "default" : "success"} 
                            label={new Date() > new Date(exam.endTime) ? "已结束" : "进行中"}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              开始时间：{formatDate(exam.startTime)} | 结束时间：{formatDate(exam.endTime)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              考试时长：{exam.duration} 分钟 | 总分：{exam.totalScore} 分 | 题目数量：{exam.questions.length} 题
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </main>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AuthGuard>
  );
} 