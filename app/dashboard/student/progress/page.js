'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import AuthGuard from '../../../components/AuthGuard';
import { getUserStatistics, getExerciseRecords } from '@/app/services/recordService';
import { getUserBookmarks } from '@/app/services/bookmarkService';
import { useTheme } from '@mui/material/styles';
import dynamic from 'next/dynamic';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

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
  LinearProgress,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip as MuiTooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardActions,
  Snackbar
} from '@mui/material';

// Material Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import TimelineIcon from '@mui/icons-material/Timeline';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SchoolIcon from '@mui/icons-material/School';
import StarIcon from '@mui/icons-material/Star';
import WarningIcon from '@mui/icons-material/Warning';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ErrorIcon from '@mui/icons-material/Error';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import { EmojiEvents, CheckCircle, WarningAmber, ErrorOutline } from '@mui/icons-material';
import HistoryIcon from '@mui/icons-material/History';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// 动态导入 recharts 组件，并禁用 SSR
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
// BarChart 和 Bar 如果也使用，同样需要动态导入
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });

// 确保 API URL 定义正确
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ensureCorrectApiUrl = (url, endpoint) => {
  let baseUrl = url.replace(/\/+$/, '');
  if (baseUrl.endsWith('/api') && !endpoint.startsWith('/api')) {
    return `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  }
  if (!baseUrl.endsWith('/api') && !endpoint.startsWith('/api')) {
    return `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  }
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

export default function StudentProgressPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [bookmarks, setBookmarks] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // --- 新增状态 ---
  const [reportLoading, setReportLoading] = useState(false);
  const [learningReport, setLearningReport] = useState('');
  const [reportError, setReportError] = useState(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendedQuestions, setRecommendedQuestions] = useState([]);
  const [recommendationsError, setRecommendationsError] = useState(null);

  const [recentRecords, setRecentRecords] = useState([]); // 用于图表

  useEffect(() => {
    if (user && user.id) {
      loadUserStats();
      loadUserBookmarks();
    } else {
      // 如果用户未登录，加载模拟数据
      loadMockData();
    }
  }, [user]);
  
  // 加载模拟数据
  const loadMockData = () => {
    setStatsLoading(false);
    
    const mockStats = {
      userId: 'mock-user',
      totalExercises: 5,
      totalQuestions: 25,
      correctQuestions: 18,
      totalScore: 18,
      averageScore: 72,
      exercisesByCategory: {
        '前端': { count: 3, totalScore: 210, averageScore: 70 },
        'JavaScript': { count: 2, totalScore: 170, averageScore: 85 },
        'HTML': { count: 1, totalScore: 80, averageScore: 80 },
        'CSS': { count: 1, totalScore: 60, averageScore: 60 }
      },
      recentScores: [
        { exerciseId: '1', exerciseTitle: '前端基础练习', score: 80, timestamp: new Date().toISOString() },
        { exerciseId: '2', exerciseTitle: 'JavaScript基础', score: 85, timestamp: new Date(Date.now() - 86400000).toISOString() },
        { exerciseId: '3', exerciseTitle: 'CSS样式练习', score: 60, timestamp: new Date(Date.now() - 172800000).toISOString() },
      ],
      tagMastery: [
        { tag: 'JavaScript', correct: 10, total: 12, percentage: 83, exerciseCount: 2 },
        { tag: 'HTML', correct: 5, total: 6, percentage: 83, exerciseCount: 1 },
        { tag: 'CSS', correct: 3, total: 5, percentage: 60, exerciseCount: 1 },
        { tag: '数组', correct: 4, total: 5, percentage: 80, exerciseCount: 1 },
        { tag: '函数', correct: 3, total: 4, percentage: 75, exerciseCount: 1 },
        { tag: '标签', correct: 4, total: 4, percentage: 100, exerciseCount: 1 }
      ],
      strongTopics: [
        { tag: '标签', percentage: 100 },
        { tag: 'JavaScript', percentage: 83 },
        { tag: 'HTML', percentage: 83 }
      ],
      weakTopics: [
        { tag: 'CSS', percentage: 60 }
      ],
      records: [
        {
          id: 'mock-record-1',
          exerciseId: '1',
          exerciseTitle: '前端基础练习',
          date: new Date().toISOString(),
          score: { percentage: 80, totalScore: 4, possibleScore: 5 },
          timeSpent: 600,
          tags: ['前端', 'Web开发', 'HTML', 'CSS', 'JavaScript']
        },
        {
          id: 'mock-record-2',
          exerciseId: '2',
          exerciseTitle: 'JavaScript基础',
          date: new Date(Date.now() - 86400000).toISOString(),
          score: { percentage: 85, totalScore: 17, possibleScore: 20 },
          timeSpent: 900,
          tags: ['JavaScript', '前端', '编程语言']
        },
        {
          id: 'mock-record-3',
          exerciseId: '3',
          exerciseTitle: 'CSS样式练习',
          date: new Date(Date.now() - 172800000).toISOString(),
          score: { percentage: 60, totalScore: 6, possibleScore: 10 },
          timeSpent: 450,
          tags: ['CSS', '前端', 'Web开发']
        }
      ]
    };
    
    const mockBookmarks = [
      {
        exerciseId: '1',
        exerciseTitle: '前端基础练习',
        timestamp: new Date().toISOString(),
        tags: ['前端', 'Web开发', 'HTML', 'CSS', 'JavaScript']
      },
      {
        exerciseId: '2',
        exerciseTitle: 'JavaScript基础',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        tags: ['JavaScript', '前端', '编程语言']
      }
    ];
    
    setUserStats(mockStats);
    setBookmarks(mockBookmarks);
  };
  
  // 加载用户统计信息
  const loadUserStats = async () => {
    if (!user) return;
    
    setStatsLoading(true);
    
    try {
      // 获取用户统计信息（包括后端计算的整体学习进度）
      // getUserStatistics函数已更新为异步并从后端API获取最新的学习进度数据
      // progressPercentage 是基于用户在系统题库中已回答的题目数量计算的
      const stats = await getUserStatistics(user.id);
      
      // 分析标签掌握情况
      const tagMastery = {};
      
      if (stats.records && stats.records.length > 0) {
        // 遍历所有记录
        stats.records.forEach(record => {
          // 处理问题标签
          record.questions.forEach((question, index) => {
            const isCorrect = record.results.questionResults?.[index]?.isCorrect || false;
            
            // 为每个标签更新掌握情况
            if (question.tags && question.tags.length > 0) {
              question.tags.forEach(tag => {
                if (!tagMastery[tag]) {
                  tagMastery[tag] = { correct: 0, total: 0 };
                }
                
                tagMastery[tag].total += 1;
                if (isCorrect) {
                  tagMastery[tag].correct += 1;
                }
              });
            }
          });
          
          // 处理练习整体标签
          if (record.tags && record.tags.length > 0) {
            record.tags.forEach(tag => {
              if (!tagMastery[tag]) {
                tagMastery[tag] = { correct: 0, total: 0 };
              }
              
              // 计入整体统计
              if (!tagMastery[tag].exerciseCount) {
                tagMastery[tag].exerciseCount = 0;
              }
              tagMastery[tag].exerciseCount += 1;
            });
          }
        });
      }
      
      // 计算标签掌握百分比
      const tagMasteryWithPercentage = Object.entries(tagMastery).map(([tag, data]) => ({
        tag,
        correct: data.correct,
        total: data.total,
        percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        exerciseCount: data.exerciseCount || 0
      }));
      
      // 找出强项和弱项（至少有3个问题）
      const strongTopics = tagMasteryWithPercentage
        .filter(item => item.total >= 3 && item.percentage >= 80)
        .sort((a, b) => b.percentage - a.percentage);
        
      const weakTopics = tagMasteryWithPercentage
        .filter(item => item.total >= 3 && item.percentage < 60)
        .sort((a, b) => a.percentage - b.percentage);
      
      // 更新统计信息
      setUserStats({
        ...stats,
        tagMastery: tagMasteryWithPercentage,
        strongTopics,
        weakTopics
      });

      // 获取最近练习记录用于图表
      const records = getExerciseRecords(user.id);
      setRecentRecords(records.slice(0, 10).reverse()); // 取最近10条并反转，使图表从左到右为时间顺序
      
      // 获取统计后触发推荐
      if (stats) {
        fetchRecommendations(stats);
      }

    } catch (error) {
      console.error('加载统计信息失败:', error);
      setStatsError(error.message || '加载统计信息失败');
    } finally {
      setStatsLoading(false);
    }
  };
  
  // 加载用户收藏
  const loadUserBookmarks = async () => {
    try {
      if (!user) return;
      
      const bookmarksData = await getUserBookmarks();
      setBookmarks(bookmarksData);
    } catch (error) {
      console.error('加载用户收藏失败:', error);
      // 即使加载失败也不影响页面渲染，设置为空数组
      setBookmarks([]);
    }
  };
  
  // 处理标签切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };
  
  // 格式化时间
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // 渲染知识点掌握情况
  const renderKnowledgePoints = () => {
    if (!userStats || !userStats.exercisesByCategory) {
      return (
        <Typography color="textSecondary">
          暂无知识点掌握数据
        </Typography>
      );
    }
    
    // 从分类统计中获取数据
    const categories = Object.entries(userStats.exercisesByCategory);
    
    // 如果没有数据，显示提示信息
    if (categories.length === 0) {
      return (
        <Typography color="textSecondary">
          暂无知识点掌握数据
        </Typography>
      );
    }
    
    // 按掌握程度排序
    const sortedCategories = [...categories].sort((a, b) => b[1].averageScore - a[1].averageScore);
    
    return (
      <Grid container spacing={2}>
        {sortedCategories.slice(0, 6).map(([category, data]) => (
          <Grid item xs={12} sm={6} md={4} key={category}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {category}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={data.averageScore > 100 ? 100 : data.averageScore} 
                    sx={{ 
                      flexGrow: 1, 
                      mr: 2, 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 
                          data.averageScore >= 80 ? theme.palette.success.main :
                          data.averageScore >= 60 ? theme.palette.warning.main :
                          theme.palette.error.main
                      }
                    }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    {data.averageScore.toFixed(1)}%
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  已完成: {data.count} 次练习
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  掌握程度: {
                    data.averageScore >= 80 ? '优秀' :
                    data.averageScore >= 60 ? '良好' :
                    data.averageScore >= 40 ? '一般' : '需加强'
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // 渲染强项和弱项
  const renderStrengthsAndWeaknesses = () => {
    // 检查userStats和exercisesByCategory是否存在
    if (!userStats || !userStats.exercisesByCategory) {
      return (
        <Typography color="textSecondary">
          暂无足够统计数据，请完成更多练习。
        </Typography>
      );
    }
    
    // 从分类统计中提取标签的掌握程度
    const categories = Object.entries(userStats.exercisesByCategory);
    
    // 区分优秀和需要加强的知识点
    const excellentCategories = categories.filter(([_, data]) => 
      data.averageScore >= 80 || (data.averageScore >= 60 && data.count >= 3)
    );
    
    const weakCategories = categories.filter(([_, data]) => 
      data.averageScore < 80 && !(data.averageScore >= 60 && data.count >= 3)
    );

    return (
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {/* 强项 */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmojiEvents sx={{ color: theme.palette.success.main, mr: 1 }} />
                  <Typography variant="h6">掌握得好的知识点</Typography>
                </Box>
                {excellentCategories.length > 0 ? (
                  <List dense>
                    {excellentCategories.slice(0, 5).map(([category, data]) => (
                      <ListItem key={category} disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircle sx={{ color: theme.palette.success.main }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={category} 
                          secondary={`${data.averageScore.toFixed(1)}% 掌握度 (${data.count} 次练习)`} 
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="textSecondary">
                    继续练习，期待你的强项很快出现！
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* 弱项 */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WarningAmber sx={{ color: theme.palette.error.main, mr: 1 }} />
                  <Typography variant="h6">需要加强的知识点</Typography>
                </Box>
                {weakCategories.length > 0 ? (
                  <List dense>
                    {weakCategories.slice(0, 5).map(([category, data]) => (
                      <ListItem key={category} disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <ErrorOutline sx={{ color: theme.palette.error.main }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={category} 
                          secondary={`${data.averageScore.toFixed(1)}% 掌握度 (${data.count} 次练习)`} 
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="textSecondary">
                    目前没有特别薄弱的知识点，继续保持！
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // 渲染概览面板
  const renderOverview = () => {
    if (!userStats) {
      return (
        <Alert severity="info" className="mb-4">
          暂无学习数据，请先完成一些练习来查看学习进度。
        </Alert>
      );
    }
    
    return (
      <>
        <Grid container spacing={3}>
          {/* 总体进度卡片 */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AssessmentIcon color="primary" className="mr-2" fontSize="large" />
                  <Typography variant="h6">总体进度</Typography>
                </Box>
                <Box position="relative" display="flex" justifyContent="center" mb={2}>
                  <CircularProgress 
                    variant="determinate" 
                    value={userStats.averageScore > 100 ? 100 : userStats.averageScore} 
                    size={100} 
                    thickness={5}
                    color={userStats.averageScore >= 60 ? 'success' : 'error'}
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
                    <Typography variant="h5" color="text.primary">
                      {Math.round(userStats.averageScore)}%
                    </Typography>
                  </Box>
                </Box>
                <List dense disablePadding>
                  <ListItem>
                    <ListItemText 
                      primary="完成练习" 
                      secondary={`${userStats.totalExercises} 个`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="答题总数" 
                      secondary={`${userStats.totalQuestions} 题`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="正确率" 
                      secondary={`${userStats.totalQuestions ? (userStats.correctQuestions / userStats.totalQuestions * 100).toFixed(1) : '0.0'}%`} 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          {/* 最近成绩卡片 */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <TimelineIcon color="primary" className="mr-2" fontSize="large" />
                  <Typography variant="h6">最近成绩</Typography>
                </Box>
                {userStats.recentScores && userStats.recentScores.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>练习名称</TableCell>
                          <TableCell align="center">得分</TableCell>
                          <TableCell align="right">日期</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userStats.recentScores.slice(0, 5).map((score, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Link 
                                href={`/dashboard/student/exercises/${score.exerciseId}`}
                                className="text-blue-600 hover:underline"
                              >
                                {score.exerciseTitle}
                              </Link>
                            </TableCell>
                            <TableCell align="center">
                              <Box display="flex" alignItems="center" justifyContent="center">
                                <Typography
                                  variant="body2"
                                  color={score.score >= 60 ? 'success.main' : 'error.main'}
                                  fontWeight="medium"
                                >
                                  {score.score}%
                                </Typography>
                                {index === 0 && (
                                  <MuiTooltip title="最新">
                                    <StarIcon fontSize="small" color="primary" className="ml-1" />
                                  </MuiTooltip>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="right">{formatDate(score.timestamp)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary" align="center" className="py-4">
                    暂无成绩记录
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* 近期练习分数趋势 */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>近期练习分数趋势</Typography>
            {recentRecords.length > 0 ? (
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatChartData(recentRecords)} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" activeDot={{ r: 8 }} name="得分率" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography color="text.secondary">暂无足够练习记录生成趋势图。</Typography>
            )}
          </Grid>
          
          {/* 知识点掌握情况 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <SchoolIcon color="primary" className="mr-2" fontSize="large" />
                  <Typography variant="h6">知识点掌握情况</Typography>
                </Box>
                
                <Grid container spacing={3}>
                  {/* 强项 */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" fontWeight="medium" className="mb-2">
                      <EmojiEventsIcon fontSize="small" className="mr-1" color="success" />
                      掌握得好的知识点
                    </Typography>
                    {userStats.exercisesByCategory && Object.entries(userStats.exercisesByCategory).some(([_, data]) => data.averageScore >= 80) ? (
                      Object.entries(userStats.exercisesByCategory)
                        .filter(([_, data]) => data.averageScore >= 80)
                        .sort(([_, a], [__, b]) => b.averageScore - a.averageScore)
                        .slice(0, 5)
                        .map(([category, data], index) => (
                          <Box key={index} mb={1}>
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                              <Typography variant="body2">{category}</Typography>
                              <Typography variant="body2" color="success.main">
                                {data.averageScore.toFixed(1)}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={data.averageScore > 100 ? 100 : data.averageScore} 
                              color="success" 
                            />
                          </Box>
                        ))
                    ) : (
                      <Typography color="text.secondary">
                        尚未收集足够数据，继续练习以获取分析
                      </Typography>
                    )}
                  </Grid>
                  
                  {/* 弱项 */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" fontWeight="medium" className="mb-2">
                      <WarningIcon fontSize="small" className="mr-1" color="error" />
                      需要加强的知识点
                    </Typography>
                    {userStats.exercisesByCategory && Object.entries(userStats.exercisesByCategory).some(([_, data]) => data.averageScore < 80) ? (
                      Object.entries(userStats.exercisesByCategory)
                        .filter(([_, data]) => data.averageScore < 80)
                        .sort(([_, a], [__, b]) => a.averageScore - b.averageScore)
                        .slice(0, 5)
                        .map(([category, data], index) => (
                          <Box key={index} mb={1}>
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                              <Typography variant="body2">{category}</Typography>
                              <Typography variant="body2" color="error.main">
                                {data.averageScore.toFixed(1)}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={data.averageScore}
                              sx={{
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: 
                                    data.averageScore >= 60 ? theme.palette.warning.main : 
                                    theme.palette.error.main
                                }
                              }}
                            />
                          </Box>
                        ))
                    ) : (
                      <Typography color="text.secondary">
                        尚未收集足够数据，继续练习以获取分析
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    );
  };
  
  // 渲染详细面板
  const renderDetails = () => {
    if (!userStats) {
      return (
        <Alert severity="info" className="mb-4">
          暂无学习数据，请先完成一些练习来查看详细统计。
        </Alert>
      );
    }
    
    // 显示掌握程度的辅助函数
    const getMasteryLevel = (score) => {
      if (score >= 80) return { text: '优秀', color: theme.palette.success.main };
      if (score >= 60) return { text: '良好', color: theme.palette.warning.main };
      if (score >= 40) return { text: '一般', color: theme.palette.info.main };
      return { text: '需加强', color: theme.palette.error.main };
    };
    
    return (
      <Grid container spacing={3}>
        {/* 分类统计 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <EqualizerIcon className="mr-1" />
                分类统计
              </Typography>
              
              {Object.keys(userStats.exercisesByCategory).length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>分类</TableCell>
                        <TableCell align="center">完成数量</TableCell>
                        <TableCell align="center">平均分数</TableCell>
                        <TableCell align="right">掌握程度</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(userStats.exercisesByCategory)
                        .sort(([_, dataA], [__, dataB]) => dataB.averageScore - dataA.averageScore)
                        .map(([category, data]) => {
                          const masteryLevel = getMasteryLevel(data.averageScore);
                          return (
                            <TableRow key={category}>
                              <TableCell>{category}</TableCell>
                              <TableCell align="center">{data.count}</TableCell>
                              <TableCell align="center">
                                {data.averageScore.toFixed(1)}%
                              </TableCell>
                              <TableCell align="right">
                                <Box display="flex" alignItems="center" justifyContent="flex-end">
                                  <Box width="150px" mr={1}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={data.averageScore > 100 ? 100 : data.averageScore}
                                      sx={{ 
                                        backgroundColor: '#e0e0e0',
                                        '& .MuiLinearProgress-bar': {
                                          backgroundColor: masteryLevel.color
                                        }
                                      }}
                                    />
                                  </Box>
                                  <Typography variant="body2" sx={{ color: masteryLevel.color, fontWeight: 'medium' }}>
                                    {masteryLevel.text}
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" align="center" className="py-4">
                  暂无分类数据
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* 答题记录 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <HistoryIcon className="mr-1" />
                答题记录
              </Typography>
              
              {userStats && userStats.records && userStats.records.length > 0 ? (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>练习名称</TableCell>
                          <TableCell align="center">日期</TableCell>
                          <TableCell align="center">得分</TableCell>
                          <TableCell align="center">用时</TableCell>
                          <TableCell align="center">知识点</TableCell>
                          <TableCell align="right">操作</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userStats.records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <Typography variant="body2">
                                {record.exerciseTitle}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">
                                {formatDate(record.date)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {new Date(record.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                size="small"
                                label={`${record.score.percentage}%`}
                                color={
                                  record.score.percentage >= 80 ? 'success' :
                                  record.score.percentage >= 60 ? 'warning' : 'error'
                                }
                              />
                            </TableCell>
                            <TableCell align="center">
                              {formatTime(record.timeSpent)}
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                                {record.tags && record.tags.slice(0, 2).map((tag, idx) => (
                                  <Chip key={idx} label={tag} size="small" variant="outlined" />
                                ))}
                                {record.tags && record.tags.length > 2 && (
                                  <MuiTooltip title={record.tags.slice(2).join(', ')} arrow>
                                    <Chip label={`+${record.tags.length - 2}`} size="small" variant="outlined" />
                                  </MuiTooltip>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                variant="text"
                                color="primary"
                                size="small"
                                onClick={() => router.push(`/dashboard/student/exercises/${record.exerciseId}`)}
                              >
                                查看详情
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <Typography color="text.secondary" align="center" className="py-4">
                  暂无答题记录
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* 收藏练习 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BookmarkIcon className="mr-1" />
                收藏练习
              </Typography>
              
              {bookmarks.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>练习名称</TableCell>
                        <TableCell align="center">标签</TableCell>
                        <TableCell align="right">收藏日期</TableCell>
                        <TableCell align="right">操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bookmarks.map((bookmark, index) => (
                        <TableRow key={index}>
                          <TableCell>{bookmark.exerciseTitle}</TableCell>
                          <TableCell align="center">
                            <Box display="flex" flexWrap="wrap" justifyContent="center" gap={0.5}>
                              {bookmark.tags && bookmark.tags.map((tag, i) => (
                                <Chip key={i} label={tag} size="small" />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{formatDate(bookmark.timestamp)}</TableCell>
                          <TableCell align="right">
                            <Button
                              variant="text"
                              color="primary"
                              size="small"
                              onClick={() => router.push(`/dashboard/student/exercises/${bookmark.exerciseId}`)}
                            >
                              重做
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" align="center" className="py-4">
                  暂无收藏练习
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  // 在总览标签页内容中添加
  const renderOverviewTabContent = () => (
    <>
      {/* 学习报告按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateFeedback}
          disabled={reportLoading || !userStats || !userStats.records || userStats.records.length === 0}
          startIcon={reportLoading ? <CircularProgress size={20} /> : <AssessmentIcon />}
        >
          生成个人学习报告
        </Button>
        {reportError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {reportError}
          </Alert>
        )}
      </Box>

      {/* 整体进度 */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            整体学习进度
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {userStats?.totalExercises || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  已完成练习
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {userStats?.totalQuestions || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  已回答问题
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ 
                  color: userStats?.averageScore >= 80 
                    ? theme.palette.success.main 
                    : userStats?.averageScore >= 60 
                      ? theme.palette.warning.main 
                      : theme.palette.error.main 
                }}>
                  {userStats?.averageScore ? userStats.averageScore.toFixed(1) : '0.0'}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  平均得分率
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {userStats?.tagMastery?.length || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  涉及知识点
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* 显示整体学习进度百分比 */}
          {userStats?.progressPercentage !== undefined && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body1" sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                <span>整体学习进度</span>
                <span>{userStats.progressPercentage.toFixed(1)}%</span>
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={userStats.progressPercentage} 
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 
                      userStats.progressPercentage >= 80 ? theme.palette.success.main : 
                      userStats.progressPercentage >= 60 ? theme.palette.warning.main : 
                      theme.palette.error.main
                  }
                }} 
              />
              {/* <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                已回答不重复题目：{userStats.uniqueAnswered || 0} / {userStats.totalQuestions || 0}
              </Typography> */}
              {/* <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                注：重复回答同一题目在整体学习进度中只计算一次
              </Typography> */}
              {userStats.totalAnswered > 0 && (
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                  答题总次数：{userStats.totalAnswered}（包含重复作答）
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* 强项和弱项 */}
      {renderStrengthsAndWeaknesses()}
      
      {/* 个性化推荐题目 */}
      <Card variant="outlined" sx={{ mt: 3, mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FitnessCenterIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6">个性化练习推荐</Typography>
            </Box>
            <Button 
              size="small" 
              onClick={() => fetchRecommendations(userStats, true)}
              disabled={recommendationsLoading}
              startIcon={recommendationsLoading ? <CircularProgress size={16} /> : null}
            >
              重新生成
            </Button>
          </Box>
          
          {recommendationsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : recommendationsError ? (
            <Alert severity="error" sx={{ mb: 2 }}>{recommendationsError}</Alert>
          ) : recommendedQuestions.length === 0 ? (
            <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
              {userStats?.weakTopics?.length === 0 
                ? "目前没有发现明显的弱项，继续保持！" 
                : "暂无个性化推荐题目"}
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {recommendedQuestions.map((question, index) => (
                <Grid item xs={12} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {index + 1}. {question.title}
                      </Typography>
                      
                      {question.content && (
                        <Typography variant="body2" color="textSecondary" paragraph>
                          {question.content}
                        </Typography>
                      )}
                      
                      {question.type.includes('选题') && question.options && (
                        <List dense>
                          {question.options.map((option, optIndex) => (
                            <ListItem key={optIndex}>
                              <Chip 
                                size="small" 
                                label={option.text}
                                variant={option.isCorrect ? "filled" : "outlined"}
                                color={option.isCorrect ? "success" : "default"}
                                sx={{ mr: 1 }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                      
                      <Box sx={{ display: 'flex', mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip size="small" label={question.difficulty} color="primary" variant="outlined" />
                        <Chip size="small" label={question.type} color="secondary" variant="outlined" />
                        {question.tags && question.tags.map((tag, idx) => (
                          <Chip key={idx} size="small" label={tag} variant="outlined" />
                        ))}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button size="small" color="primary">
                        开始练习
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
      
      {/* 知识点掌握情况 */}
      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            知识点掌握情况
          </Typography>
          {renderKnowledgePoints()}
        </CardContent>
      </Card>
    </>
  );
  
  // --- 学习报告 --- 
  const handleGenerateReport = async () => {
    if (!stats) {
      setReportError('请先等待统计数据加载完成');
      return;
    }
    setReportLoading(true);
    setReportError(null);
    setLearningReport('');
    try {
      const apiEndpoint = ensureCorrectApiUrl(API_URL, '/llm/generate-learning-report');
      console.log("调用学习报告API:", apiEndpoint);

      const response = await axios.post(
        apiEndpoint,
        { stats: stats }, 
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (response.data.success) {
        setLearningReport(response.data.report);
        setIsReportDialogOpen(true);
      } else {
        setReportError(response.data.message || '生成报告失败');
      }
    } catch (error) {
      console.error("生成报告API调用失败:", error);
      setReportError(`生成报告出错: ${error.response?.data?.message || error.message}`);
    } finally {
      setReportLoading(false);
    }
  };

  // --- 个性化推荐 ---
  const fetchRecommendations = async (currentStats, forceUpdate = false) => { // 接收 stats 作为参数
    if (!currentStats) {
      console.log("统计数据不存在，跳过推荐请求");
      setRecommendedQuestions([]);
      return;
    }
    
    setRecommendationsLoading(true);
    setRecommendationsError(null);
    
    try {
      // 如果不是强制更新，先检查数据库中是否已有缓存的推荐题目
      if (!forceUpdate) {
        const checkApiEndpoint = ensureCorrectApiUrl(API_URL, '/llm/recommended-questions');
        console.log("检查已保存的推荐题目:", checkApiEndpoint);

        const checkResponse = await axios.get(
          checkApiEndpoint,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (checkResponse.data.success) {
          // 如果存在已保存的推荐题目且不需要更新，直接使用
          if (checkResponse.data.exists && !checkResponse.data.needsUpdate) {
            console.log("使用已保存的推荐题目");
            setRecommendedQuestions(checkResponse.data.questions || []);
            setRecommendationsLoading(false);
            return;
          }
        }
      } else {
        console.log("强制重新生成推荐题目");
      }
      
      // 如果没有保存的推荐题目或需要更新，则重新请求
      if (!currentStats.weakTopics || currentStats.weakTopics.length === 0) {
        console.log("没有发现明确的弱项，从错题本中获取标签");
        // 后端API会自动从错题本获取标签
      }

      const apiEndpoint = ensureCorrectApiUrl(API_URL, '/llm/recommend-questions');
      console.log("调用题目推荐API:", apiEndpoint);

      const response = await axios.post(
        apiEndpoint,
        { 
          weakTopics: currentStats.weakTopics || [], // 即使为空也发送请求，后端会从错题本获取标签
          forceUpdate: forceUpdate // 告诉后端是否需要强制更新
        }, 
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      if (response.data.success) {
        setRecommendedQuestions(response.data.questions || []);
        console.log(`获取到${response.data.questions.length}个推荐题目${response.data.fromCache ? '(已缓存)' : '(新生成)'}`);
      } else {
        setRecommendationsError(response.data.message || '获取推荐失败');
      }
    } catch (error) {
      console.error("获取推荐API调用失败:", error);
      setRecommendationsError(`获取推荐题目出错: ${error.response?.data?.message || error.message}`);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  // 格式化图表数据
  const formatChartData = (records) => {
    return records.map((record, index) => ({
      name: `练习 ${index + 1}`,
      score: record.results?.percentage || record.score?.percentage || 0, // 尝试兼容不同记录结构
    }));
  };

  // 生成个人学习报告
  const handleGenerateFeedback = async () => {
    if (!userStats || !userStats.records || userStats.records.length === 0) {
      setReportError('暂无足够的学习数据，请先完成一些练习');
      return;
    }
    
    setReportLoading(true);
    setReportError(null);
    setLearningReport('');
    
    try {
      // 准备提交历史数据
      const submissionHistory = userStats.records.map(record => ({
        question: {
          title: record.exerciseTitle,
          category: record.tags?.[0] || '未分类',
          difficulty: '中等' // 假设难度，实际应该从记录中获取
        },
        isCorrect: record.score.percentage >= 60,
        score: record.score.percentage
      }));
      
      const apiEndpoint = ensureCorrectApiUrl(API_URL, '/llm/generate-feedback');
      console.log("调用学习反馈API:", apiEndpoint);

      const response = await axios.post(
        apiEndpoint,
        { 
          userId: user.id,
          submissionHistory: submissionHistory
        }, 
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      if (response.data.success) {
        // 将返回的JSON格式化为字符串显示
        const feedback = response.data.feedback;
        let reportText = `# 个人学习报告\n\n`;
        
        // 添加强项
        reportText += `## 你的强项\n`;
        if (feedback.strengths && feedback.strengths.length > 0) {
          feedback.strengths.forEach(strength => {
            reportText += `- ${strength}\n`;
          });
        } else {
          reportText += `- 暂无明显强项\n`;
        }
        
        // 添加弱项
        reportText += `\n## 需要改进的地方\n`;
        if (feedback.weaknesses && feedback.weaknesses.length > 0) {
          feedback.weaknesses.forEach(weakness => {
            reportText += `- ${weakness}\n`;
          });
        } else {
          reportText += `- 暂无明显弱项\n`;
        }
        
        // 添加改进建议
        reportText += `\n## 改进建议\n`;
        if (feedback.improvementSuggestions && feedback.improvementSuggestions.length > 0) {
          feedback.improvementSuggestions.forEach(suggestion => {
            reportText += `- ${suggestion}\n`;
          });
        } else {
          reportText += `- 暂无具体建议\n`;
        }
        
        // 添加下一步计划
        reportText += `\n## 下一步学习计划\n`;
        if (feedback.nextSteps && feedback.nextSteps.length > 0) {
          feedback.nextSteps.forEach(step => {
            reportText += `- ${step}\n`;
          });
        } else {
          reportText += `- 暂无具体计划\n`;
        }
        
        // 添加总结
        if (feedback.summary) {
          reportText += `\n## 总结\n${feedback.summary}\n`;
        }
        
        setLearningReport(reportText);
        setIsReportDialogOpen(true);
      } else {
        setReportError(response.data.message || '生成报告失败');
      }
    } catch (error) {
      console.error("生成学习报告API调用失败:", error);
      setReportError(`生成报告出错: ${error.response?.data?.message || error.message}`);
    } finally {
      setReportLoading(false);
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
                  <Link href="/dashboard/student/progress" className="px-3 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-gray-700">
                    学习进度
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
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <Typography variant="h4" component="h1" className="mb-6 font-bold">
                学习进度
              </Typography>
              
              {statsLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : !user ? (
                <Alert severity="warning" className="mb-4">
                  请先登录以查看学习进度
                </Alert>
              ) : (
                <>
                  <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange} 
                    variant="fullWidth" 
                    className="mb-4"
                  >
                    <Tab label="概览" icon={<AssessmentIcon />} iconPosition="start" />
                    <Tab label="详细统计" icon={<EqualizerIcon />} iconPosition="start" />
                  </Tabs>
                  
                  <Box className="mb-6">
                    {activeTab === 0 && renderOverviewTabContent()}
                    {activeTab === 1 && renderDetails()}
                  </Box>
                  
                  <Box className="flex justify-center mt-6">
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => router.push('/dashboard/student/exercises')}
                      startIcon={<MenuBookIcon />}
                    >
                      继续练习
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      onClick={() => router.push('/dashboard/student/mistakes')}
                      startIcon={<ErrorIcon />}
                      className="ml-4"
                    >
                      查看错题
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="info" 
                      onClick={() => router.push('/dashboard/student/records')}
                      startIcon={<HistoryIcon />}
                      className="ml-4"
                    >
                      详细记录
                    </Button>
                  </Box>
                </>
              )}
            </div>
          </div>
        </main>

        {/* 学习报告弹窗 */}    
        <ReportDialog open={isReportDialogOpen} onClose={() => setIsReportDialogOpen(false)} report={learningReport} />

      </div>
    </AuthGuard>
  );
}

// 学习报告弹窗
const ReportDialog = ({ open, onClose, report }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        backgroundColor: 'primary.main', 
        color: 'white',
        display: 'flex',
        alignItems: 'center'
      }}>
        <AssessmentIcon sx={{ mr: 1 }} />
        个人学习报告
      </DialogTitle>
      <DialogContent dividers>
        {report ? (
          <Box sx={{ p: 2 }}>
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <Typography variant="h4" color="primary" gutterBottom {...props} />,
                h2: ({ node, ...props }) => <Typography variant="h6" color="primary" sx={{ mt: 2, mb: 1 }} {...props} />,
                p: ({ node, ...props }) => <Typography variant="body1" paragraph {...props} />,
                ul: ({ node, ...props }) => <Box component="ul" sx={{ pl: 2 }} {...props} />,
                li: ({ node, ...props }) => <Typography component="li" variant="body1" sx={{ my: 0.5 }} {...props} />
              }}
            >
              {report}
            </ReactMarkdown>
          </Box>
        ) : (
          <Typography color="textSecondary" align="center" py={3}>报告内容为空。</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">关闭</Button>
      </DialogActions>
    </Dialog>
  );
}; 