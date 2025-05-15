'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { 
  Typography, Box, Card, CardContent, CircularProgress, Alert, Button, Chip,
  Breadcrumbs, Divider, Paper, Grid
} from '@mui/material';
import React from 'react';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import BugReportIcon from '@mui/icons-material/BugReport';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PieChartIcon from '@mui/icons-material/PieChart';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ReactMarkdown from 'react-markdown';
import AuthGuard from '../../../../components/AuthGuard';
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

export default function ReportDetailPage({ params }) {
  // 使用 React.use() 解包 params
  const unwrappedParams = React.use(params);
  const reportId = unwrappedParams.id;
  
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (reportId) {
      loadReport(reportId);
    }
  }, [reportId, user]);

  const loadReport = async (id) => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiEndpoint = ensureCorrectApiUrl(API_URL, `/llm/learning-reports/${id}`);
      
      const response = await axios.get(
        apiEndpoint,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setReport(response.data.report);
      } else {
        setError(response.data.message || '加载报告详情失败');
      }
    } catch (error) {
      console.error('获取学习报告详情失败:', error);
      setError('获取学习报告详情失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
    } catch (e) {
      return dateString || '未知日期';
    }
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
            {/* 面包屑导航 */}
            <Breadcrumbs 
              separator={<NavigateNextIcon fontSize="small" />} 
              aria-label="breadcrumb"
              sx={{ mb: 3 }}
            >
              <Link href="/dashboard/student" className="text-gray-500 hover:text-gray-700">
                仪表盘
              </Link>
              <Link href="/dashboard/student/reports" className="text-gray-500 hover:text-gray-700">
                学习报告
              </Link>
              <Typography color="text.primary">报告详情</Typography>
            </Breadcrumbs>

            <Button
              startIcon={<ArrowBackIcon />}
              variant="outlined"
              onClick={() => router.push('/dashboard/student/reports')}
              sx={{ mb: 3 }}
            >
              返回报告列表
            </Button>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              ) : !report ? (
                <Alert severity="warning" sx={{ mb: 2 }}>报告不存在或已被删除</Alert>
              ) : (
                <>
                  {/* 报告标题 */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                      <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      个人学习报告
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      生成时间: {formatDate(report.createdAt)}
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 4 }} />

                  {/* 统计信息卡片 */}
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <BugReportIcon color="error" sx={{ mr: 1 }} />
                          <Typography variant="h6">错题统计</Typography>
                        </Box>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body1">
                            未解决错题: <strong>{report.mistakeStats?.totalMistakes || 0}</strong> 题
                          </Typography>
                          <Typography variant="body1">
                            已解决错题: <strong>{report.mistakeStats?.resolvedMistakes || 0}</strong> 题
                          </Typography>
                          {report.mistakeStats?.mistakeTags && report.mistakeStats.mistakeTags.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2">错题主要涉及课程:</Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                {report.mistakeStats.mistakeTags.slice(0, 8).map((tagInfo, idx) => (
                                  <Chip
                                    key={idx}
                                    label={`${tagInfo.tag} (${tagInfo.count})`}
                                    size="small"
                                    color={idx < 3 ? "error" : "default"}
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <PieChartIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6">总体评估</Typography>
                        </Box>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body1">
                            主要弱项数量: <strong>{report.content?.weaknesses?.length || 0}</strong>
                          </Typography>
                          <Typography variant="body1">
                            具体改进建议: <strong>{report.content?.improvementSuggestions?.length || 0}</strong> 条
                          </Typography>
                          <Typography variant="body1">
                            推荐学习资源: <strong>{report.content?.recommendedResources?.length || 0}</strong> 条
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* 报告内容 */}
                  <Card variant="outlined" sx={{ mb: 4 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <LibraryBooksIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h5" component="h2">报告详情</Typography>
                      </Box>
                      <div className="markdown-report">
                        <ReactMarkdown components={{
                          h1: ({ node, ...props }) => <Typography variant="h4" color="primary" gutterBottom {...props} />,
                          h2: ({ node, ...props }) => <Typography variant="h6" color="primary" sx={{ mt: 2, mb: 1 }} {...props} />,
                          p: ({ node, ...props }) => <Typography variant="body1" paragraph {...props} />,
                          ul: ({ node, ...props }) => <Box component="ul" sx={{ pl: 2 }} {...props} />,
                          li: ({ node, ...props }) => <Typography component="li" variant="body1" sx={{ my: 0.5 }} {...props} />
                        }}>
                          {report.markdownReport}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 建议操作 */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<LightbulbIcon />}
                      onClick={() => router.push('/dashboard/student/progress')}
                    >
                      查看学习进度
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<BugReportIcon />}
                      onClick={() => router.push('/dashboard/student/mistakes')}
                    >
                      前往错题本
                    </Button>
                    <Button
                      variant="outlined"
                      color="info"
                      startIcon={<BookmarkIcon />}
                      onClick={() => router.push('/dashboard/student/exercises')}
                    >
                      开始练习
                    </Button>
                  </Box>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
} 