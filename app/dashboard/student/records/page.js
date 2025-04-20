'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import AuthGuard from '../../../components/AuthGuard';
import { getExerciseRecords } from '@/app/services/recordService';

// Material UI 组件
import {
  Button,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  CircularProgress,
  Divider,
  List,
  ListItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Rating,
  Badge,
  Alert,
} from '@mui/material';

// Material Icons
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import HelpIcon from '@mui/icons-material/Help';

export default function StudentRecordsPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  
  // 状态
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, score, title
  const [filterTag, setFilterTag] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tags, setTags] = useState([]);
  
  // 加载记录
  useEffect(() => {
    if (user && user.id) {
      loadUserRecords(user.id);
    } else {
      loadMockRecords();
    }
  }, [user]);
  
  // 当筛选条件变化时，更新显示的记录
  useEffect(() => {
    if (records.length > 0) {
      applyFilters();
    }
  }, [records, searchTerm, sortBy, filterTag]);
  
  // 加载用户记录
  const loadUserRecords = async (userId) => {
    setLoading(true);
    try {
      const userRecords = await getExerciseRecords(userId);
      
      // 提取所有标签
      const allTags = new Set();
      userRecords.forEach(record => {
        if (record.tags && Array.isArray(record.tags)) {
          record.tags.forEach(tag => allTags.add(tag));
        }
      });
      
      setRecords(userRecords);
      setTags(Array.from(allTags));
      setLoading(false);
    } catch (error) {
      console.error('加载记录失败:', error);
      setLoading(false);
    }
  };
  
  // 加载模拟记录数据
  const loadMockRecords = () => {
    const mockRecords = [
      {
        id: 'r1',
        exerciseId: '1',
        exerciseTitle: '前端基础知识练习',
        date: new Date(Date.now() - 86400000).toISOString(), // 1天前
        score: {
          percentage: 85,
          totalScore: 17,
          possibleScore: 20
        },
        timeSpent: 1200, // 20分钟
        questions: Array(20).fill({}).map((_, i) => ({
          id: `q${i+1}`,
          title: `问题 ${i+1}`,
          type: i % 3 === 0 ? '单选题' : i % 3 === 1 ? '多选题' : '编程题'
        })),
        tags: ['HTML', 'CSS', 'JavaScript']
      },
      {
        id: 'r2',
        exerciseId: '2',
        exerciseTitle: 'JavaScript进阶练习',
        date: new Date(Date.now() - 172800000).toISOString(), // 2天前
        score: {
          percentage: 73,
          totalScore: 11,
          possibleScore: 15
        },
        timeSpent: 1500, // 25分钟
        questions: Array(15).fill({}).map((_, i) => ({
          id: `q${i+1}`,
          title: `问题 ${i+1}`,
          type: i % 3 === 0 ? '单选题' : i % 3 === 1 ? '多选题' : '编程题'
        })),
        tags: ['JavaScript', '闭包', '原型链']
      },
      {
        id: 'r3',
        exerciseId: '3',
        exerciseTitle: 'React基础知识测试',
        date: new Date(Date.now() - 259200000).toISOString(), // 3天前
        score: {
          percentage: 92,
          totalScore: 23,
          possibleScore: 25
        },
        timeSpent: 1800, // 30分钟
        questions: Array(25).fill({}).map((_, i) => ({
          id: `q${i+1}`,
          title: `问题 ${i+1}`,
          type: i % 3 === 0 ? '单选题' : i % 3 === 1 ? '多选题' : '编程题'
        })),
        tags: ['React', '组件', 'Hooks']
      }
    ];
    
    // 设置记录和标签
    setRecords(mockRecords);
    setTags([...new Set(mockRecords.flatMap(r => r.tags))]);
    setLoading(false);
  };
  
  // 应用过滤和排序
  const applyFilters = () => {
    let filtered = [...records];
    
    // 按搜索词过滤
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(record => 
        record.exerciseTitle.toLowerCase().includes(term) ||
        (record.tags && record.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }
    
    // 按标签过滤
    if (filterTag !== 'all') {
      filtered = filtered.filter(record => 
        record.tags && record.tags.includes(filterTag)
      );
    }
    
    // 应用排序
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'score':
        filtered.sort((a, b) => b.score.percentage - a.score.percentage);
        break;
      case 'title':
        filtered.sort((a, b) => a.exerciseTitle.localeCompare(b.exerciseTitle));
        break;
      default:
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    setFilteredRecords(filtered);
  };
  
  // 处理页面变化
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // 处理每页行数变化
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // 处理排序方式变化
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };
  
  // 处理标签过滤变化
  const handleTagFilterChange = (event) => {
    setFilterTag(event.target.value);
  };
  
  // 处理搜索词变化
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // 查看详细记录
  const handleViewRecord = (recordId) => {
    router.push(`/dashboard/student/records/${recordId}`);
  };
  
  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };
  
  // 格式化时间（秒转为分:秒）
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 获取分数对应的颜色
  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'primary';
    if (percentage >= 60) return 'warning';
    return 'error';
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
                    我的练习
                  </Link>
                  <Link href="/dashboard/student/progress" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    学习进度
                  </Link>
                  <Link href="/dashboard/student/records" className="px-3 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-gray-700">
                    答题记录
                  </Link>
                  <Link href="/dashboard/student/mistakes" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    错题本
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
              <Box className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <Typography variant="h4" component="h1" className="font-bold mb-4 md:mb-0">
                  答题记录
                </Typography>
                
                <Box className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto">
                  <TextField
                    placeholder="搜索记录..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    className="w-full sm:w-auto"
                  />
                  
                  <FormControl variant="outlined" size="small" className="min-w-[120px]">
                    <InputLabel>排序</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={handleSortChange}
                      label="排序"
                      startAdornment={<SortIcon className="mr-2" />}
                    >
                      <MenuItem value="recent">最近</MenuItem>
                      <MenuItem value="score">分数</MenuItem>
                      <MenuItem value="title">标题</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl variant="outlined" size="small" className="min-w-[120px]">
                    <InputLabel>标签</InputLabel>
                    <Select
                      value={filterTag}
                      onChange={handleTagFilterChange}
                      label="标签"
                      startAdornment={<FilterListIcon className="mr-2" />}
                    >
                      <MenuItem value="all">全部</MenuItem>
                      {tags.map((tag, index) => (
                        <MenuItem key={index} value={tag}>{tag}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredRecords.length === 0 ? (
                <Alert severity="info">
                  没有找到匹配的记录。{searchTerm || filterTag !== 'all' ? '请尝试调整搜索条件。' : '开始练习以创建记录！'}
                </Alert>
              ) : (
                <>
                  <TableContainer component={Paper} variant="outlined">
                    <Table sx={{ minWidth: 650 }} aria-label="答题记录表格">
                      <TableHead>
                        <TableRow>
                          <TableCell>练习</TableCell>
                          <TableCell align="center">日期</TableCell>
                          <TableCell align="center">分数</TableCell>
                          <TableCell align="center">题目数</TableCell>
                          <TableCell align="center">用时</TableCell>
                          <TableCell align="center">标签</TableCell>
                          <TableCell align="center">操作</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredRecords
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((record) => (
                            <TableRow key={record.id} hover>
                              <TableCell component="th" scope="row">
                                {record.exerciseTitle || `练习 ${record.exerciseId}`}
                              </TableCell>
                              <TableCell align="center">{formatDate(record.date || record.timestamp)}</TableCell>
                              <TableCell align="center">
                                <Box display="flex" alignItems="center" justifyContent="center">
                                  <CircularProgress
                                    variant="determinate"
                                    value={record.score.percentage}
                                    color={getScoreColor(record.score.percentage)}
                                    size={36}
                                    thickness={4}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    style={{ position: 'absolute' }}
                                  >
                                    {`${Math.round(record.score.percentage)}%`}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                {record.score.totalScore} / {record.score.possibleScore}
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title="完成用时">
                                  <Box display="flex" alignItems="center" justifyContent="center">
                                    <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                    <Typography variant="body2">{formatTime(record.timeSpent)}</Typography>
                                  </Box>
                                </Tooltip>
                              </TableCell>
                              <TableCell align="center">
                                <Box display="flex" flexWrap="wrap" gap={0.5} justifyContent="center">
                                  {record.tags && record.tags.map((tag, index) => (
                                    <Chip
                                      key={index}
                                      label={tag}
                                      size="small"
                                      clickable
                                      onClick={() => setFilterTag(tag)}
                                    />
                                  ))}
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title="查看详情">
                                  <IconButton
                                    color="primary"
                                    onClick={() => handleViewRecord(record.id)}
                                    size="small"
                                  >
                                    <RemoveRedEyeIcon />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredRecords.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="每页行数:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                  />
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
} 