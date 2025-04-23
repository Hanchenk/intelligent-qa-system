'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { 
  Typography, Box, Card, CardContent, List, ListItem, ListItemText, 
  Divider, CircularProgress, Alert, Button, Chip, IconButton
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BugReportIcon from '@mui/icons-material/BugReport';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ErrorIcon from '@mui/icons-material/Error';
import AuthGuard from '../../../components/AuthGuard';
import axios from 'axios';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 确保 API URL 正确
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const ensureCorrectApiUrl = (url, endpoint) => {
  // 规范化 base URL
  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  // 规范化 endpoint
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
};

export default function LearningReportsPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    loadReports();
  }, [user]);

  const loadReports = async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiEndpoint = ensureCorrectApiUrl(API_URL, '/llm/learning-reports');
      
      const response = await axios.get(
        apiEndpoint,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setReports(response.data.reports || []);
      } else {
        setError(response.data.message || '加载报告列表失败');
      }
    } catch (error) {
      console.error('获取学习报告列表失败:', error);
      setError('获取学习报告列表失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: zhCN });
    } catch (e) {
      return dateString || '未知日期';
    }
  };

  const viewReport = (reportId) => {
    router.push(`/dashboard/student/reports/${reportId}`);
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
                  <Link href="/dashboard/student/mistakes" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    错题本
                  </Link>
                  <Link href="/dashboard/student/reports" className="px-3 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-gray-700">
                    学习报告
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" className="font-bold">
                  <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  我的学习报告
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => router.push('/dashboard/student/progress')}
                  startIcon={<AssessmentIcon />}
                >
                  生成新报告
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              ) : reports.length === 0 ? (
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <DescriptionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        暂无学习报告
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        您还没有生成过个人学习报告
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => router.push('/dashboard/student/progress')}
                        sx={{ mt: 2 }}
                      >
                        前往生成报告
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {reports.map((report, index) => (
                      <div key={report._id}>
                        <ListItem
                          alignItems="flex-start"
                          secondaryAction={
                            <IconButton edge="end" onClick={() => viewReport(report._id)}>
                              <OpenInNewIcon />
                            </IconButton>
                          }
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            }
                          }}
                          onClick={() => viewReport(report._id)}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="subtitle1" component="span" fontWeight="bold">
                                  学习报告 #{reports.length - index}
                                </Typography>
                                <Chip
                                  icon={<BugReportIcon />}
                                  label={`${report.mistakeStats?.totalMistakes || 0}个错题`}
                                  variant="outlined"
                                  size="small"
                                  color="primary"
                                  sx={{ ml: 2 }}
                                />
                              </Box>
                            }
                            secondary={
                              <Typography component="div" variant="body2" color="text.secondary">
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                  <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                  <span>生成于: {formatDate(report.createdAt)}</span>
                                </Box>
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < reports.length - 1 && <Divider component="li" />}
                      </div>
                    ))}
                  </List>

                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => router.push('/dashboard/student/progress')}
                      startIcon={<AssessmentIcon />}
                    >
                      生成新报告
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => router.push('/dashboard/student/mistakes')}
                      startIcon={<ErrorIcon />}
                      sx={{ ml: 2 }}
                    >
                      查看错题本
                    </Button>
                  </Box>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
} 