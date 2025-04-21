'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import AuthGuard from '../../../components/AuthGuard';
import MarkdownPreview from '../../../components/MarkdownPreview';
import axios from 'axios';

// Material UI 组件
import { 
  CircularProgress, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Pagination,
  Autocomplete,
  Box
} from '@mui/material';

// Material Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LabelIcon from '@mui/icons-material/Label';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function TeacherQuestionsPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // 状态变量
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterTags, setFilterTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  
  // 每页显示的题目数量
  const ITEMS_PER_PAGE = 10;
  
  // 题目类型和难度选项
  const questionTypes = ['单选题', '多选题', '判断题', '填空题', '简答题', '编程题'];
  const difficultyLevels = ['简单', '中等', '困难'];
  
  // 加载题目数据和标签数据
  useEffect(() => {
    fetchQuestions();
    fetchTags();
  }, [page, filterType, filterDifficulty, filterTags, searchTerm]);
  
  // 获取所有标签
  const fetchTags = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API_URL}/tags`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAvailableTags(response.data || []);
    } catch (err) {
      console.error('获取标签列表失败:', err);
    }
  };
  
  // 获取题目列表
  const fetchQuestions = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 构建查询参数
      let queryParams = `?page=${page}&limit=${ITEMS_PER_PAGE}`;
      if (filterType !== 'all') queryParams += `&type=${filterType}`;
      if (filterDifficulty !== 'all') queryParams += `&difficulty=${filterDifficulty}`;
      if (searchTerm.trim()) queryParams += `&search=${encodeURIComponent(searchTerm.trim())}`;
      if (filterTags.length > 0) queryParams += `&tags=${filterTags.join(',')}`;
      
      const response = await axios.get(`${API_URL}/questions${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 更新状态
      setQuestions(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      // 保存总数据量用于显示
      const totalItems = response.data.pagination?.total || 0;
      sessionStorage.setItem('totalQuestions', totalItems);
    } catch (err) {
      console.error('获取题目列表失败:', err);
      setError('获取题目列表失败，请重试');
      
      // 如果没有从API获取到数据，则使用演示数据
      setQuestions(mockQuestions);
      
      // 确保演示数据也有正确的分页
      const mockTotalPages = Math.ceil(mockQuestions.length / ITEMS_PER_PAGE);
      setTotalPages(mockTotalPages > 0 ? mockTotalPages : 1);
      // 保存演示数据总量
      sessionStorage.setItem('totalQuestions', mockQuestions.length);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理页码改变
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  // 处理搜索
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // 重置页码
    fetchQuestions();
  };
  
  // 处理重置筛选
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterDifficulty('all');
    setFilterTags([]);
    setPage(1);
  };
  
  // 处理标签筛选变更
  const handleTagsChange = (event, newValue) => {
    setFilterTags(newValue.map(tag => tag._id));
    setPage(1); // 重置页码
  };
  
  // 打开删除确认对话框
  const openDeleteDialog = (question) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };
  
  // 关闭删除确认对话框
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  };
  
  // 删除题目
  const handleDeleteQuestion = async () => {
    if (!questionToDelete || !token) return;
    
    try {
      await axios.delete(`${API_URL}/questions/${questionToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 重新获取题目列表
      fetchQuestions();
      
      // 关闭对话框
      closeDeleteDialog();
    } catch (err) {
      console.error('删除题目失败:', err);
      setError('删除题目失败，请重试');
    }
  };
  
  // 渲染题目难度标签
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
    
    return <Chip size="small" label={difficulty} color={color} />;
  };
  
  // 处理标题显示，移除过长标题中的markdown语法
  const formatTitle = (title) => {
    // 如果标题超过80个字符，截取前80个字符并添加省略号
    let displayTitle = title;
    if (title.length > 80) {
      displayTitle = `${title.substring(0, 80)}...`;
    }
    return displayTitle;
  };
  
  // 渲染题目标签
  const renderTags = (question) => {
    if (!question.tags || question.tags.length === 0) return null;
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
        {question.tags.map(tag => (
          <Chip
            key={tag._id}
            label={tag.name}
            size="small"
            variant="outlined"
            style={{ backgroundColor: tag.color, color: '#fff' }}
          />
        ))}
      </Box>
    );
  };
  
  // 暂时使用的模拟数据
  const mockQuestions = [
    { 
      _id: '1', 
      title: '下列关于JavaScript中的变量声明，哪一个是正确的？', 
      type: '单选题', 
      difficulty: '简单',
      createdAt: new Date('2023-05-15')
    },
    { 
      _id: '2', 
      title: 'React中的状态管理可以使用以下哪些工具？', 
      type: '多选题', 
      difficulty: '中等',
      createdAt: new Date('2023-05-20')
    },
    { 
      _id: '3', 
      title: 'HTTP状态码200表示请求成功', 
      type: '判断题', 
      difficulty: '简单',
      createdAt: new Date('2023-05-25')
    },
    { 
      _id: '4', 
      title: '在JavaScript中，请实现一个函数，计算斐波那契数列的第n项', 
      type: '编程题', 
      difficulty: '困难',
      createdAt: new Date('2023-06-01')
    },
    { 
      _id: '5', 
      title: '请描述REST API的主要特点和设计原则', 
      type: '简答题', 
      difficulty: '中等',
      createdAt: new Date('2023-06-05')
    },
    { 
      _id: '6', 
      title: 'SQL中的JOIN操作有哪几种类型？它们的区别是什么？', 
      type: '简答题', 
      difficulty: '中等',
      createdAt: new Date('2023-06-10')
    },
    { 
      _id: '7', 
      title: '请填写HTML中创建无序列表的标签：<__>...</__>', 
      type: '填空题', 
      difficulty: '简单',
      createdAt: new Date('2023-06-15')
    },
    { 
      _id: '8', 
      title: 'React Hook useEffect的第二个参数是依赖数组', 
      type: '判断题', 
      difficulty: '简单',
      createdAt: new Date('2023-06-20')
    },
    { 
      _id: '9', 
      title: '以下哪个不是JavaScript基本数据类型？', 
      type: '单选题', 
      difficulty: '简单',
      createdAt: new Date('2023-06-25')
    },
    { 
      _id: '10', 
      title: 'Git中，以下哪些命令可以用来撤销更改？', 
      type: '多选题', 
      difficulty: '中等',
      createdAt: new Date('2023-07-01')
    },
    { 
      _id: '11', 
      title: '请实现一个函数，找出数组中的最大值和最小值', 
      type: '编程题', 
      difficulty: '中等',
      createdAt: new Date('2023-07-05')
    },
    { 
      _id: '12', 
      title: 'CSS中，display:none与visibility:hidden的区别是什么？', 
      type: '简答题', 
      difficulty: '简单',
      createdAt: new Date('2023-07-10')
    },
    { 
      _id: '13', 
      title: '在Python中，列表和元组的主要区别是元组是不可变的', 
      type: '判断题', 
      difficulty: '简单',
      createdAt: new Date('2023-07-15')
    },
    { 
      _id: '14', 
      title: '在HTTP请求头中，用于缓存控制的字段是：____', 
      type: '填空题', 
      difficulty: '中等',
      createdAt: new Date('2023-07-20')
    },
    { 
      _id: '15', 
      title: '以下关于数据库索引的说法，哪一个是正确的？', 
      type: '单选题', 
      difficulty: '中等',
      createdAt: new Date('2023-07-25')
    }
  ];
  
  // 处理分页 - 移除前端分页逻辑，直接使用API返回的当前页数据
  const getPaginatedQuestions = () => {
    if (questions.length === 0) return [];
    return questions; // 直接返回API已分页的数据
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
                  <Link href="/dashboard/teacher/questions" className="px-3 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900">
                    题库管理
                  </Link>
                  <Link href="/dashboard/teacher/exams" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
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
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              {/* 页面标题与添加按钮 */}
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">题库管理</h1>
                <div className="flex space-x-2">
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    startIcon={<CloudUploadIcon />}
                    onClick={() => router.push('/dashboard/teacher/questions/import')}
                  >
                    批量导入
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    startIcon={<SmartToyIcon />}
                    onClick={() => router.push('/dashboard/teacher/questions/ai-generate')}
                  >
                    AI生成
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/dashboard/teacher/questions/create')}
                  >
                    添加题目
                  </Button>
                </div>
              </div>
              
              {/* 搜索和筛选工具栏 */}
              <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  {/* 搜索框 */}
                  <div className="flex mb-4 md:mb-0">
                    <TextField
                      variant="outlined"
                      size="small"
                      placeholder="搜索题目..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                      InputProps={{
                        endAdornment: (
                          <IconButton size="small" onClick={handleSearch}>
                            <SearchIcon />
                          </IconButton>
                        ),
                      }}
                    />
                  </div>
                  
                  {/* 筛选区域切换按钮 */}
                  <div>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<FilterListIcon />}
                      onClick={() => setShowFilters(!showFilters)}
                      size="small"
                      className="mr-2"
                    >
                      {showFilters ? '隐藏筛选' : '显示筛选'}
                    </Button>
                    
                    {showFilters && (
                      <Button
                        variant="text"
                        color="primary"
                        size="small"
                        onClick={handleResetFilters}
                      >
                        重置筛选
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* 筛选选项 */}
                {showFilters && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormControl variant="outlined" size="small">
                      <InputLabel>题目类型</InputLabel>
                      <Select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        label="题目类型"
                      >
                        <MenuItem value="all">全部类型</MenuItem>
                        {questionTypes.map((type) => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl variant="outlined" size="small">
                      <InputLabel>难度等级</InputLabel>
                      <Select
                        value={filterDifficulty}
                        onChange={(e) => setFilterDifficulty(e.target.value)}
                        label="难度等级"
                      >
                        <MenuItem value="all">全部难度</MenuItem>
                        {difficultyLevels.map((level) => (
                          <MenuItem key={level} value={level}>{level}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl variant="outlined" size="small" sx={{ gridColumn: { md: 'span 2' } }}>
                      <Autocomplete
                        multiple
                        options={availableTags}
                        getOptionLabel={(option) => option.name}
                        value={availableTags.filter(tag => filterTags.includes(tag._id))}
                        onChange={handleTagsChange}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="标签筛选"
                            placeholder="选择标签"
                            variant="outlined"
                            size="small"
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              label={option.name}
                              {...getTagProps({ index })}
                              size="small"
                              style={{ backgroundColor: option.color, color: '#fff' }}
                            />
                          ))
                        }
                        renderOption={(props, option) => (
                          <li {...props}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box 
                                component="span" 
                                sx={{ 
                                  width: 14, 
                                  height: 14, 
                                  mr: 1, 
                                  borderRadius: '50%', 
                                  bgcolor: option.color 
                                }} 
                              />
                              {option.name}
                            </Box>
                          </li>
                        )}
                      />
                    </FormControl>
                  </div>
                )}
              </div>
              
              {/* 错误提示 */}
              {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              {/* 题目列表 */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <CircularProgress />
                </div>
              ) : getPaginatedQuestions().length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">没有找到匹配的题目</p>
                </div>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell width="50%">题目</TableCell>
                        <TableCell>类型</TableCell>
                        <TableCell>难度</TableCell>
                        <TableCell>创建时间</TableCell>
                        <TableCell align="center">操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getPaginatedQuestions().map((question) => (
                        <TableRow key={question._id} hover>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {question.title ? formatTitle(question.title) : '未命名题目'}
                              </span>
                              {renderTags(question)}
                            </div>
                          </TableCell>
                          <TableCell>{question.type}</TableCell>
                          <TableCell>{renderDifficultyChip(question.difficulty)}</TableCell>
                          <TableCell>
                            {new Date(question.createdAt).toLocaleDateString('zh-CN')}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => router.push(`/dashboard/teacher/questions/view/${question._id}`)}
                            >
                              <i className="fas fa-eye"></i>
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => router.push(`/dashboard/teacher/questions/edit/${question._id}`)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => openDeleteDialog(question)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {/* 分页 */}
              <div className="flex justify-center mt-6">
                <Pagination 
                  count={totalPages} 
                  page={page} 
                  onChange={handlePageChange} 
                  color="primary"
                />
              </div>
            </div>
          </div>
        </main>
        
        {/* 删除确认对话框 */}
        <Dialog
          open={deleteDialogOpen}
          onClose={closeDeleteDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">确认删除题目</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              您确定要删除这道题目吗？此操作无法撤销。
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeleteDialog} color="primary">
              取消
            </Button>
            <Button onClick={handleDeleteQuestion} color="error" autoFocus>
              删除
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </AuthGuard>
  );
} 