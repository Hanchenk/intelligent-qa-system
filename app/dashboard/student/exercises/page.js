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
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput
} from '@mui/material';

// Material Icons
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import FilterListIcon from '@mui/icons-material/FilterList';

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
  const [difficulty, setDifficulty] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  
  // 加载练习数据
  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      
      try {
        // 构建查询参数
        const params = {
          page: currentPage,
          limit: 6
        };
        
        if (searchTerm) {
          params.search = searchTerm;
        }
        
        if (difficulty && difficulty !== 'all') {
          params.difficulty = difficulty;
        }
        
        if (selectedTags.length > 0) {
          params.tags = selectedTags.join(',');
        }
        
        // 从API获取数据
        const response = await axios.get(`${API_URL}/questions`, {
          headers: { Authorization: `Bearer ${token}` },
          params
        });
        
        // 将API返回的题目转换为练习形式
        const questionData = response.data.data || [];
        const exerciseData = transformQuestionsToExercises(questionData);
        
        setExercises(exerciseData);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } catch (err) {
        console.error('获取题目列表失败:', err);
        // 如果API请求失败，设置空数据
        setExercises([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    
    // 加载可用标签
    const fetchTags = async () => {
      try {
        const response = await axios.get(`${API_URL}/tags`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAvailableTags(response.data.data || []);
      } catch (err) {
        console.error('获取标签列表失败:', err);
        setAvailableTags([]);
      }
    };
    
    fetchExercises();
    fetchTags();
  }, [currentPage, difficulty, selectedTags, token]);
  
  // 将题目数据转换为练习格式
  const transformQuestionsToExercises = (questions) => {
    // 按标签分组题目
    const groupedQuestions = {};
    
    questions.forEach(question => {
      const mainTag = question.tags && question.tags.length > 0 
        ? question.tags[0].name 
        : '未分类';
      
      if (!groupedQuestions[mainTag]) {
        groupedQuestions[mainTag] = {
          questions: [],
          difficulty: question.difficulty,
          tags: []
        };
      }
      
      groupedQuestions[mainTag].questions.push(question);
      
      // 收集所有标签
      if (question.tags) {
        question.tags.forEach(tag => {
          if (!groupedQuestions[mainTag].tags.includes(tag.name)) {
            groupedQuestions[mainTag].tags.push(tag.name);
          }
        });
      }
    });
    
    // 转换为练习格式
    return Object.entries(groupedQuestions).map(([tag, data], index) => ({
      id: `exercise-${index}`,
      title: `${tag}练习`,
      totalQuestions: data.questions.length,
      difficulty: data.difficulty || '中等',
      tags: data.tags,
      completedCount: Math.floor(Math.random() * 500) + 100, // 模拟完成人数
      description: `针对${tag}相关知识的练习，包含${data.questions.length}道题目。`,
      questionIds: data.questions.map(q => q._id) // 保存题目ID列表，用于开始练习
    }));
  };
  
  // 处理搜索
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // 重置页码
    // 搜索由useEffect处理
  };
  
  // 处理开始练习
  const handleStartExercise = (exerciseId) => {
    // 找到选中的练习
    const selectedExercise = exercises.find(ex => ex.id === exerciseId);
    
    if (selectedExercise && selectedExercise.questionIds && selectedExercise.questionIds.length > 0) {
      // 保存练习信息到本地存储
      localStorage.setItem('currentExercise', JSON.stringify({
        id: exerciseId,
        title: selectedExercise.title,
        questionIds: selectedExercise.questionIds,
        tags: selectedExercise.tags
      }));
      
      // 跳转到练习页面
      router.push(`/dashboard/student/exercises/${exerciseId}`);
    } else {
      alert('该练习中没有题目');
    }
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
  
  // 处理难度筛选变化
  const handleDifficultyChange = (event) => {
    setDifficulty(event.target.value);
    setCurrentPage(1); // 重置页码
  };
  
  // 处理标签筛选变化
  const handleTagChange = (event) => {
    setSelectedTags(event.target.value);
    setCurrentPage(1); // 重置页码
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
                
                <div className="flex flex-col md:flex-row gap-3">
                  {/* 筛选选项 */}
                  <FormControl size="small" style={{ minWidth: 120 }}>
                    <InputLabel id="difficulty-select-label">难度</InputLabel>
                    <Select
                      labelId="difficulty-select-label"
                      value={difficulty}
                      onChange={handleDifficultyChange}
                      label="难度"
                    >
                      <MenuItem value="all">全部</MenuItem>
                      <MenuItem value="简单">简单</MenuItem>
                      <MenuItem value="中等">中等</MenuItem>
                      <MenuItem value="困难">困难</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" style={{ minWidth: 150 }}>
                    <InputLabel id="tags-select-label">标签</InputLabel>
                    <Select
                      labelId="tags-select-label"
                      multiple
                      value={selectedTags}
                      onChange={handleTagChange}
                      input={<OutlinedInput label="标签" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {availableTags.map((tag) => (
                        <MenuItem key={tag._id} value={tag._id}>
                          {tag.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
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