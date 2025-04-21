'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import AuthGuard from '../../../components/AuthGuard';
import StudentNavBar from '../../../components/StudentNavBar';
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
  const [error, setError] = useState('');
  const [allExercises, setAllExercises] = useState([]); // 存储所有练习，用于分页
  
  // 每页显示的卡片数量
  const itemsPerPage = 18;

  // 计算当前页面应该显示的练习
  const getCurrentPageExercises = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allExercises.slice(startIndex, endIndex);
  };

  // 加载练习数据
  const fetchExercises = async () => {
    setLoading(true);
    
    try {
      // 构建查询参数
      const params = {
        page: 1,
        limit: 50  // 增加获取的题目数量，确保我们能得到所有标签的数据
      };
      
      if (difficulty && difficulty !== 'all') {
        params.difficulty = difficulty;
      }
      
      // 只有当实际选择了标签时才添加标签筛选
      if (selectedTags && selectedTags.length > 0) {
        params.tags = selectedTags.join(',');
      }
      
      console.log("请求参数:", params);
      
      // 从API获取数据
      const response = await axios.get(`${API_URL}/questions`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      console.log("API响应:", response.data);
      
      // 将API返回的题目转换为练习形式
      const questionData = response.data.data || [];
      const exerciseData = transformQuestionsToExercises(questionData);
      
      console.log("转换后的练习数据:", exerciseData);
      
      // 在这里应用搜索筛选，而不是在API请求中
      let filteredExercises = exerciseData;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredExercises = exerciseData.filter(exercise => 
          exercise.title.toLowerCase().includes(term) || 
          exercise.tagName.toLowerCase().includes(term) ||
          exercise.description.toLowerCase().includes(term)
        );
      }
      
      setAllExercises(filteredExercises);
      setTotalPages(Math.ceil(filteredExercises.length / itemsPerPage) || 1);
      
      // 计算当前页面显示的练习
      setExercises(getCurrentPageExercises());
    } catch (err) {
      console.error('获取题目列表失败:', err);
      // 只设置空数据，不使用模拟数据
      setAllExercises([]);
      setExercises([]);
      setTotalPages(1);
      // 设置错误信息
      setError('获取练习数据失败，请刷新页面重试或联系管理员');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchExercises();
    
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
    
    fetchTags();
  }, [difficulty, selectedTags, token, searchTerm]); // 移除currentPage依赖

  // 当页码变化时，更新显示的练习
  useEffect(() => {
    setExercises(getCurrentPageExercises());
  }, [currentPage, allExercises]);

  // 将题目数据转换为练习格式
  const transformQuestionsToExercises = (questions) => {
    console.log("原始问题数据:", questions);
    
    // 按标签分组题目
    const taggedQuestions = {};
    
    // 首先收集所有现有的标签集合
    questions.forEach(question => {
      if (question.tags && Array.isArray(question.tags)) {
        question.tags.forEach(tag => {
          // 处理标签可能是对象或字符串的情况
          const tagName = typeof tag === 'object' && tag !== null ? 
            (tag.name || '') : (tag || '');
            
          if (tagName && !taggedQuestions[tagName]) {
            taggedQuestions[tagName] = {
              questions: [],
              difficulty: question.difficulty || '中等', // 使用第一个题目的难度作为初始值
              tags: [tagName]
            };
          }
        });
      }
    });
    
    // 然后将所有题目分配到对应的标签练习中
    questions.forEach(question => {
      if (question.tags && Array.isArray(question.tags)) {
        question.tags.forEach(tag => {
          // 处理标签可能是对象或字符串的情况
          const tagName = typeof tag === 'object' && tag !== null ? 
            (tag.name || '') : (tag || '');
            
          if (tagName && taggedQuestions[tagName]) {
            // 避免重复添加同一题目
            if (!taggedQuestions[tagName].questions.some(q => q._id === question._id)) {
              taggedQuestions[tagName].questions.push(question);
            }
            
            // 更新难度（取最高难度）
            if (question.difficulty === '困难') {
              taggedQuestions[tagName].difficulty = '困难';
            } else if (question.difficulty === '中等' && taggedQuestions[tagName].difficulty !== '困难') {
              taggedQuestions[tagName].difficulty = '中等';
            }
          }
        });
      }
    });
    
    // 添加一个未分类标签，用于没有标签的题目
    const untaggedQuestions = questions.filter(q => !q.tags || !Array.isArray(q.tags) || q.tags.length === 0);
    if (untaggedQuestions.length > 0) {
      taggedQuestions['未分类'] = {
        questions: untaggedQuestions,
        difficulty: '中等',
        tags: ['未分类']
      };
    }
    
    console.log("分组后的题目:", taggedQuestions);
    
    // 转换为练习格式，并按题目数量排序
    const exerciseList = Object.entries(taggedQuestions).map(([tag, data], index) => {
      // 计算该组题目的总尝试次数
      let totalAttempts = 0;
      data.questions.forEach(question => {
        if (question.attempts) {
          totalAttempts += question.attempts;
        }
      });
      
      return {
        id: `exercise-${index}`,
        title: `${tag}练习`,
        totalQuestions: data.questions.length,
        difficulty: data.difficulty || '中等',
        tags: data.tags,
        tagName: tag, // 保存标签名，方便筛选
        completedCount: totalAttempts, // 使用总尝试次数
        description: `包含所有"${tag}"标签的题目，总计${data.questions.length}道题。`,
        questionIds: data.questions.map(q => q._id) // 保存题目ID列表，用于开始练习
      };
    });
    
    // 排序：首先按题目数量降序，然后按尝试次数降序
    exerciseList.sort((a, b) => {
      if (b.totalQuestions !== a.totalQuestions) {
        return b.totalQuestions - a.totalQuestions; // 题目数量降序
      }
      return b.completedCount - a.completedCount; // 尝试次数降序
    });
    
    return exerciseList;
  };
  
  // 处理搜索
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // 重置页码
    
    console.log("搜索关键词:", searchTerm);
    // 直接在客户端筛选，不需要重新请求API
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filteredExercises = allExercises.filter(exercise => 
        exercise.title.toLowerCase().includes(term) || 
        exercise.tagName.toLowerCase().includes(term) ||
        exercise.description.toLowerCase().includes(term)
      );
      setAllExercises(filteredExercises);
      setTotalPages(Math.ceil(filteredExercises.length / itemsPerPage) || 1);
      setExercises(filteredExercises.slice(0, itemsPerPage));
    } else {
      // 如果搜索词为空，清除筛选
      fetchExercises();
    }
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
    const values = event.target.value;
    console.log("选择的标签:", values);
    setSelectedTags(values);
    setCurrentPage(1); // 重置页码
  };

  return (
    <AuthGuard allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StudentNavBar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
              {/* 页面标题和搜索栏 */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <Typography variant="h5" component="h1" className="font-bold mb-1">
                    我的练习
                  </Typography>
                  <Typography variant="body2" color="textSecondary" className="mb-4 md:mb-0">
                    每个标签对应一个练习，包含该标签下的所有题目
                  </Typography>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
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
                          {selected.map((value) => {
                            const tag = availableTags.find(t => t._id === value);
                            return <Chip key={value} label={tag?.name || value} size="small" />;
                          })}
                        </Box>
                      )}
                    >
                      {availableTags.length > 0 ? (
                        availableTags.map((tag) => (
                          <MenuItem key={tag._id} value={tag._id}>
                            {tag.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>暂无可用标签</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                  
                  <Box component="form" onSubmit={handleSearch} className="w-full md:w-auto">
                    <TextField
                      size="small"
                      placeholder="搜索标签或练习..."
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
                  
                  {(searchTerm || difficulty !== 'all' || selectedTags.length > 0) && (
                    <Button 
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSearchTerm('');
                        setDifficulty('all');
                        setSelectedTags([]);
                        setCurrentPage(1);
                        // 重新获取数据
                        fetchExercises();
                      }}
                    >
                      清除筛选
                    </Button>
                  )}
                </div>
              </div>
              
              {/* 题目卡片 */}
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <CircularProgress size={40} thickness={4} />
                  <Typography variant="h6" className="ml-3">加载练习中...</Typography>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <Typography variant="body1" color="error" className="mb-4">
                    {error}
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => {
                      setCurrentPage(1);
                      setError('');
                      setSearchTerm('');
                      setDifficulty('all');
                      setSelectedTags([]);
                    }}
                  >
                    重新加载
                  </Button>
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
                    {searchTerm || difficulty !== 'all' || selectedTags.length > 0 ? 
                      '没有找到符合当前筛选条件的练习，请尝试调整筛选条件。' : 
                      '目前数据库中没有可用的练习题目，请稍后再来查看。'
                    }
                  </Typography>
                </div>
              ) : (
                <>
                  <Grid 
                    container 
                    spacing={{ xs: 2, sm: 3 }} 
                    sx={{ mb: 4 }}
                  >
                    {exercises.map((exercise) => (
                      <Grid item key={exercise.id} xs={12} sm={6} md={4} lg={4}>
                        <Card 
                          elevation={2} 
                          className="h-full flex flex-col transition-shadow duration-200 hover:shadow-lg"
                          sx={{ minHeight: '280px' }}
                        >
                          <CardContent className="flex-grow">
                            <Typography 
                              variant="h6" 
                              component="h2" 
                              className="font-bold mb-2 flex items-center flex-wrap"
                              sx={{ 
                                minHeight: '48px',
                                display: 'flex',
                                alignItems: 'flex-start'
                              }}
                            >
                              <span className="mr-1">{exercise.title}</span>
                              {renderDifficultyChip(exercise.difficulty)}
                            </Typography>
                            
                            <Typography 
                              variant="body2" 
                              color="textSecondary" 
                              className="mb-3"
                              sx={{ minHeight: '60px' }}
                            >
                              {exercise.description}
                            </Typography>
                            
                            <Box 
                              className="mb-3"
                              sx={{ minHeight: '32px' }}
                            >
                              <Typography variant="body2" fontWeight="medium" color="primary">
                                包含题目：{exercise.totalQuestions}题
                              </Typography>
                            </Box>
                            
                            <Box 
                              className="flex items-center justify-between text-sm text-gray-500"
                              sx={{ minHeight: '24px' }}
                            >
                              <span>
                                {exercise.completedCount > 0 ? (
                                  <Box className="flex items-center">
                                    <HistoryIcon fontSize="small" className="mr-1" style={{ verticalAlign: 'middle' }} />
                                    <span>{exercise.completedCount} 次尝试</span>
                                  </Box>
                                ) : '暂无尝试记录'}
                              </span>
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
                    <Box className="flex justify-center mt-8 mb-4">
                      <Pagination 
                        count={totalPages} 
                        page={currentPage}
                        onChange={(e, page) => {
                          setCurrentPage(page);
                          window.scrollTo(0, 0); // 滚动到页面顶部
                        }}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                        siblingCount={1}
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