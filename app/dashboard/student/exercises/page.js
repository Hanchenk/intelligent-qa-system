'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import AuthGuard from '../../../components/AuthGuard';
import axios from 'axios';

// Material UI 组件
import { 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Grid, 
  Chip,
  CircularProgress,
  Box,
  TextField,
  InputAdornment,
  Pagination,
  IconButton
} from '@mui/material';

// Material Icons
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import BookmarkIcon from '@mui/icons-material/Bookmark';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function StudentExercisesPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // 状态
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 模拟练习数据
  const mockExercises = [
    {
      id: '1',
      title: '前端基础知识练习',
      totalQuestions: 20,
      difficulty: '中等',
      tags: ['JavaScript', 'HTML', 'CSS'],
      completedCount: 423,
      description: '涵盖前端开发基础知识，包括HTML、CSS和JavaScript的基本概念和常见问题。'
    },
    {
      id: '2',
      title: 'JavaScript进阶练习',
      totalQuestions: 15,
      difficulty: '困难',
      tags: ['JavaScript', '闭包', '原型链'],
      completedCount: 246,
      description: '针对JavaScript高级特性的练习，包括闭包、原型链、异步编程等内容。'
    },
    {
      id: '3',
      title: 'React基础知识测试',
      totalQuestions: 25,
      difficulty: '简单',
      tags: ['React', '组件', 'Hooks'],
      completedCount: 587,
      description: '测试React框架的基础知识，包括组件生命周期、Hooks使用等内容。'
    },
    {
      id: '4',
      title: '后端开发基础练习',
      totalQuestions: 18,
      difficulty: '中等',
      tags: ['Node.js', 'Express', 'MongoDB'],
      completedCount: 312,
      description: '后端开发基础知识，包括Node.js、Express框架和MongoDB数据库的使用。'
    },
    {
      id: '5',
      title: '算法与数据结构练习',
      totalQuestions: 30,
      difficulty: '困难',
      tags: ['算法', '数据结构', '编程题'],
      completedCount: 195,
      description: '涵盖常见算法和数据结构的练习题，包括排序、查找、图论等内容。'
    },
    {
      id: '6',
      title: '网络协议基础知识',
      totalQuestions: 22,
      difficulty: '中等',
      tags: ['HTTP', 'TCP/IP', '网络安全'],
      completedCount: 267,
      description: '测试网络协议基础知识，包括HTTP、TCP/IP协议和常见网络安全问题。'
    }
  ];
  
  // 加载练习数据
  useEffect(() => {
    // 模拟API请求
    setLoading(true);
    
    // 在实际项目中，这里应该是从API获取数据
    // const fetchExercises = async () => {
    //   try {
    //     const response = await axios.get(`${API_URL}/api/exercises`, {
    //       headers: { Authorization: `Bearer ${token}` }
    //     });
    //     setExercises(response.data.data || []);
    //     setTotalPages(response.data.pagination?.totalPages || 1);
    //   } catch (err) {
    //     console.error('获取练习列表失败:', err);
    //     setExercises(mockExercises);
    //     setTotalPages(Math.ceil(mockExercises.length / 6));
    //   }
    // };
    
    // 使用模拟数据
    setTimeout(() => {
      setExercises(mockExercises);
      setTotalPages(Math.ceil(mockExercises.length / 6));
      setLoading(false);
    }, 1000);
    
    // fetchExercises();
  }, []);
  
  // 处理搜索
  const handleSearch = (e) => {
    e.preventDefault();
    // 在实际项目中，这里应该触发API请求
    // 现在我们只是在前端过滤
    
    const filtered = mockExercises.filter(exercise => 
      exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setExercises(filtered);
  };
  
  // 处理开始练习
  const handleStartExercise = (exerciseId) => {
    router.push(`/dashboard/student/exercises/${exerciseId}`);
  };
  
  // 渲染难度标签
  const renderDifficultyChip = (difficulty) => {
    let color = 'default';
    
    switch (difficulty) {
      case '简单':
        color = 'success';
        break;
      case '中等':
        color = 'warning';
        break;
      case '困难':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return <Chip size="small" label={difficulty} color={color} className="ml-2" />;
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
                  <Link href="/dashboard/student/exercises" className="px-3 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900">
                    我的练习
                  </Link>
                  <Link href="/dashboard/student/exams" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    我的考试
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
              {/* 页面标题和搜索栏 */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <Typography variant="h5" component="h1" className="font-bold mb-4 md:mb-0">
                  我的练习
                </Typography>
                
                <Box component="form" onSubmit={handleSearch} className="w-full md:w-auto">
                  <TextField
                    size="small"
                    placeholder="搜索练习..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton type="submit" edge="end">
                            <SearchIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <CircularProgress />
                </div>
              ) : exercises.length === 0 ? (
                <div className="text-center py-16">
                  <Box className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full mb-6 inline-flex">
                    <BookmarkIcon className="w-16 h-16 text-blue-600 dark:text-blue-300" />
                  </Box>
                  <Typography variant="h5" className="mb-4 font-bold">
                    暂无练习
                  </Typography>
                  <Typography variant="body1" className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                    目前没有找到符合条件的练习。请尝试调整搜索条件或稍后再来查看。
                  </Typography>
                </div>
              ) : (
                <>
                  <Grid container spacing={3}>
                    {exercises.map((exercise) => (
                      <Grid item key={exercise.id} xs={12} sm={6} md={4}>
                        <Card elevation={2} className="h-full flex flex-col">
                          <CardContent className="flex-grow">
                            <Typography variant="h6" component="h2" className="font-bold mb-2 flex items-center">
                              {exercise.title}
                              {renderDifficultyChip(exercise.difficulty)}
                            </Typography>
                            
                            <Typography variant="body2" color="textSecondary" className="mb-3">
                              {exercise.description}
                            </Typography>
                            
                            <Box className="flex flex-wrap gap-1 mb-3">
                              {exercise.tags.map(tag => (
                                <Chip 
                                  key={tag} 
                                  label={tag} 
                                  size="small" 
                                  variant="outlined" 
                                />
                              ))}
                            </Box>
                            
                            <Box className="flex items-center justify-between text-sm text-gray-500">
                              <span>{exercise.totalQuestions} 题</span>
                              <span><HistoryIcon fontSize="small" className="mr-1" style={{ verticalAlign: 'middle' }} /> {exercise.completedCount} 人完成</span>
                            </Box>
                          </CardContent>
                          
                          <CardActions>
                            <Button 
                              variant="contained" 
                              color="primary" 
                              fullWidth
                              startIcon={<PlayArrowIcon />}
                              onClick={() => handleStartExercise(exercise.id)}
                            >
                              开始练习
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                  
                  {totalPages > 1 && (
                    <Box className="flex justify-center mt-6">
                      <Pagination 
                        count={totalPages} 
                        page={currentPage}
                        onChange={(e, page) => setCurrentPage(page)}
                        color="primary"
                      />
                    </Box>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
} 