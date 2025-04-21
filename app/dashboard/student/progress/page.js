'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import AuthGuard from '../../../components/AuthGuard';
import { getUserStatistics } from '@/app/services/recordService';
import { getUserBookmarks } from '@/app/services/bookmarkService';
import { useTheme } from '@mui/material/styles';

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
  Tooltip,
  Chip,
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
    if (!userStats || !userStats.tagMastery) {
      return (
        <Typography color="textSecondary">
          暂无知识点掌握数据
        </Typography>
      );
    }
    
    // 按掌握程度排序
    const sortedTags = [...userStats.tagMastery].sort((a, b) => b.percentage - a.percentage);
    
    return (
      <Grid container spacing={2}>
        {sortedTags.slice(0, 6).map((tag) => (
          <Grid item xs={12} sm={6} md={4} key={tag.tag}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {tag.tag}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={tag.percentage} 
                    sx={{ 
                      flexGrow: 1, 
                      mr: 2, 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 
                          tag.percentage >= 80 ? theme.palette.success.main :
                          tag.percentage >= 60 ? theme.palette.warning.main :
                          theme.palette.error.main
                      }
                    }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    {tag.percentage.toFixed(1)}%
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  已答: {tag.total} 题 | 正确: {tag.correct} 题
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  出现于 {tag.exerciseCount || 0} 个练习中
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
                {userStats && userStats.strongTopics && userStats.strongTopics.length > 0 ? (
                  <List dense>
                    {userStats.strongTopics.slice(0, 5).map((topic) => (
                      <ListItem key={topic.tag} disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircle sx={{ color: theme.palette.success.main }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={topic.tag} 
                          secondary={`${topic.percentage.toFixed(1)}% 正确率 (${topic.correct}/${topic.total})`} 
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
                {userStats && userStats.weakTopics && userStats.weakTopics.length > 0 ? (
                  <List dense>
                    {userStats.weakTopics.slice(0, 5).map((topic) => (
                      <ListItem key={topic.tag} disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <ErrorOutline sx={{ color: theme.palette.error.main }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={topic.tag} 
                          secondary={`${topic.percentage.toFixed(1)}% 正确率 (${topic.correct}/${topic.total})`} 
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
                                  <Tooltip title="最新">
                                    <StarIcon fontSize="small" color="primary" className="ml-1" />
                                  </Tooltip>
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
                      强项
                    </Typography>
                    {userStats.strongTopics && userStats.strongTopics.length > 0 ? (
                      userStats.strongTopics.map((topic, index) => (
                        <Box key={index} mb={1}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2">{topic.tag}</Typography>
                            <Typography variant="body2" color="success.main">
                              {topic.percentage.toFixed(1)}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={topic.percentage} 
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
                      弱项
                    </Typography>
                    {userStats.weakTopics && userStats.weakTopics.length > 0 ? (
                      userStats.weakTopics.map((topic, index) => (
                        <Box key={index} mb={1}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2">{topic.tag}</Typography>
                            <Typography variant="body2" color="error.main">
                              {topic.percentage.toFixed(1)}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={topic.percentage} 
                            color="error" 
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
                      {Object.entries(userStats.exercisesByCategory).map(([category, data]) => (
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
                                  color={data.averageScore >= 60 ? 'success' : 'error'}
                                />
                              </Box>
                              <Typography variant="body2">
                                {data.averageScore >= 80 ? '优秀' : 
                                 data.averageScore >= 60 ? '良好' : 
                                 data.averageScore >= 40 ? '一般' : '需加强'}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
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
              <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                基于系统题库中已回答题目数量计算
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* 强项和弱项 */}
      {renderStrengthsAndWeaknesses()}
      
      {/* 近期得分 */}
      <Card variant="outlined" sx={{ mt: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            近期得分
          </Typography>
          {userStats && userStats.records && userStats.records.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>练习名称</TableCell>
                    <TableCell align="center">完成时间</TableCell>
                    <TableCell align="center">得分</TableCell>
                    <TableCell align="center">用时</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userStats.records.slice(0, 5).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Tooltip title={record.tags.join(', ')} arrow>
                          <span>{record.exerciseTitle}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">{formatDate(record.date)}</TableCell>
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
                      <TableCell align="center">{formatTime(record.timeSpent)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="textSecondary">
              暂无练习记录
            </Typography>
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
      </div>
    </AuthGuard>
  );
} 