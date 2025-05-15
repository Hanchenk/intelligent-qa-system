'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import AuthGuard from '../../../components/AuthGuard';
import { getMistakesFromDB, updateMistakeStatus, deleteMistake } from '@/app/services/recordService';
import MarkdownPreview from '@/app/components/MarkdownPreview';
import OptionMarkdownPreview from '@/app/components/OptionMarkdownPreview';

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
  FormControl,
  MenuItem,
  Select,
  InputLabel,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tabs,
  Tab,
  Alert,
  Tooltip,
} from '@mui/material';

// Material Icons
import SearchIcon from '@mui/icons-material/Search';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ReplayIcon from '@mui/icons-material/Replay';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';

export default function StudentMistakesPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [mistakes, setMistakes] = useState([]);
  const [filteredMistakes, setFilteredMistakes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, count, alphabetical
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [questionTypes, setQuestionTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  useEffect(() => {
    if (user && user.id) {
      loadMistakes();
    } else {
      // 用户未登录，重定向到登录页面
      router.push('/login');
    }
  }, [user]);
  
  useEffect(() => {
    if (mistakes.length > 0) {
      applyFilters();
    }
  }, [mistakes, searchTerm, sortBy, selectedCategory]);
  
  // 应用过滤器和排序
  const applyFilters = useCallback(() => {
    // 如果没有错题，返回空数组
    if (!mistakes || mistakes.length === 0) {
      setFilteredMistakes([]);
      return;
    }
    
    // 应用过滤
    let filtered = [...mistakes];
    
    // 按搜索词过滤
    if (searchTerm.trim() !== '') {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(mistake => 
        mistake.question.title.toLowerCase().includes(search) || 
        mistake.question.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }
    
    // 按分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(mistake => 
        mistake.question.tags.includes(selectedCategory)
      );
    }
    
    // 应用排序
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.lastWrongTime) - new Date(a.lastWrongTime));
        break;
      case 'count':
        filtered.sort((a, b) => b.count - a.count);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.question.title.localeCompare(b.question.title));
        break;
      default:
        // 默认按日期降序
        filtered.sort((a, b) => new Date(b.lastWrongTime) - new Date(a.lastWrongTime));
    }
    
    setFilteredMistakes(filtered);
  }, [mistakes, searchTerm, selectedCategory, sortBy]);
  
  // 加载错题
  const loadMistakes = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // 从数据库获取错题
      const userMistakes = await getMistakesFromDB(user.id);
      
      // 提取所有问题类型和分类
      const types = new Set();
      const cats = new Set();
      
      userMistakes.forEach(mistake => {
        if (mistake.question.type) {
          types.add(mistake.question.type);
        }
        
        if (mistake.question.tags && mistake.question.tags.length > 0) {
          mistake.question.tags.forEach(tag => cats.add(tag));
        }
      });
      
      setMistakes(userMistakes);
      setQuestionTypes(Array.from(types));
      setCategories(Array.from(cats));
      
    } catch (error) {
      console.error('加载错题失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理搜索输入
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // 处理排序方式变更
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };
  
  // 处理类别筛选
  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };
  
  // 打开问题详情对话框
  const handleOpenDetails = (mistake) => {
    setSelectedQuestion(mistake.question);
    setIsDialogOpen(true);
  };
  
  // 关闭问题详情对话框
  const handleCloseDetails = () => {
    setIsDialogOpen(false);
    setSelectedQuestion(null);
  };
  
  // 标记错题为已解决或未解决
  const handleMarkResolved = async (mistakeId, isResolved) => {
    try {
      const success = await updateMistakeStatus(mistakeId, isResolved);
      
      if (success) {
        // 更新本地状态
        setMistakes(prevMistakes => 
          prevMistakes.map(mistake => 
            mistake.id === mistakeId 
              ? { ...mistake, resolved: isResolved } 
              : mistake
          )
        );
      }
    } catch (error) {
      console.error('更新错题状态失败:', error);
    }
  };
  
  // 删除错题
  const handleDeleteMistake = async (mistakeId) => {
    try {
      const success = await deleteMistake(mistakeId);
      
      if (success) {
        // 更新本地状态
        setMistakes(prevMistakes => 
          prevMistakes.filter(mistake => mistake.id !== mistakeId)
        );
      }
    } catch (error) {
      console.error('删除错题失败:', error);
    }
  };
  
  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };
  
  // 渲染正确答案
  const renderCorrectAnswer = (question) => {
    if (!question) return '无法显示正确答案';
    
    if (question.type === '单选题') {
      if (!question.options || !Array.isArray(question.options)) {
        return question.correctAnswer || '无法显示';
      }
      const correct = question.options.find(opt => opt.id === question.correctAnswer);
      return correct ? `${correct.content} (${question.correctAnswer})` : question.correctAnswer;
    } else if (question.type === '多选题') {
      if (!Array.isArray(question.correctAnswer)) return question.correctAnswer;
      
      if (!question.options || !Array.isArray(question.options)) {
        return Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer;
      }
      
      const correctOptions = question.correctAnswer.map(id => {
        const option = question.options.find(opt => opt.id === id);
        return option ? `${option.content} (${id})` : id;
      });
      
      return correctOptions.join(', ');
    } else if (question.type === '编程题') {
      return (
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', backgroundColor: '#f0f0f0', padding: '8px', borderRadius: '4px' }}>
          {question.correctAnswer}
        </pre>
      );
    } else {
      return question.correctAnswer;
    }
  };
  
  // 渲染用户答案
  const renderUserAnswer = (userAnswer, questionType) => {
    if (userAnswer === undefined || userAnswer === null) return '未作答';
    
    if (questionType === '多选题' && Array.isArray(userAnswer)) {
      return userAnswer.join(', ');
    } else if (questionType === '编程题') {
      return (
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', backgroundColor: '#f0f0f0', padding: '8px', borderRadius: '4px' }}>
          {userAnswer}
        </pre>
      );
    } else {
      return userAnswer.toString();
    }
  };
  
  // 渲染错题列表
  const renderMistakesList = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (!filteredMistakes || filteredMistakes.length === 0) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            {searchTerm || selectedCategory !== 'all' ? 
              '没有找到符合条件的错题' : 
              '您还没有收集的错题，继续练习会自动收集错题'}
          </Typography>
        </Paper>
      );
    }
    
    return (
      <div>
        {filteredMistakes.map((mistake, index) => (
          <Accordion 
            key={mistake.id || index} 
            sx={{ 
              mb: 2,
              bgcolor: mistake.resolved ? 'rgba(76, 175, 80, 0.08)' : 'inherit'
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Typography variant="subtitle1" sx={{ 
                    textDecoration: mistake.resolved ? 'line-through' : 'none',
                    color: mistake.resolved ? 'text.secondary' : 'text.primary'
                  }}>
                    {mistake.question.title}
                  </Typography>
                  <Box>
                    {mistake.resolved && (
                      <Chip 
                        size="small" 
                        label="已解决" 
                        color="success"
                        sx={{ mr: 1 }}
                      />
                    )}
                    <Chip 
                      size="small" 
                      label={`错误次数: ${mistake.count}`} 
                      color={mistake.count > 2 ? "error" : "warning"}
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      size="small" 
                      label={mistake.question.type} 
                      color="primary"
                    />
                  </Box>
                </Box>
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {mistake.question.tags && mistake.question.tags.map((tag, i) => (
                    <Chip 
                      key={i} 
                      label={tag} 
                      size="small" 
                      variant="outlined" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategory(tag);
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  上次错误: {formatDate(mistake.lastWrongTime)}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                正确答案:
              </Typography>
              <Box sx={{ p: 1, bgcolor: 'success.light', borderRadius: 1, mb: 2 }}>
                {renderCorrectAnswer(mistake.question)}
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                您的答案:
              </Typography>
              <Box sx={{ p: 1, bgcolor: 'error.light', borderRadius: 1, mb: 2 }}>
                {renderUserAnswer(mistake.userAnswer, mistake.question.type)}
              </Box>
              
              {mistake.question.explanation && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    解析:
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                    <Typography>{mistake.question.explanation}</Typography>
                  </Box>
                </>
              )}
              
              {mistake.notes && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    笔记:
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: '#f0f7ff', borderRadius: 1, mb: 2 }}>
                    <Typography>{mistake.notes}</Typography>
                  </Box>
                </>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                <Button
                  variant="outlined"
                  color={mistake.resolved ? "warning" : "success"}
                  startIcon={mistake.resolved ? <CancelIcon /> : <CheckCircleIcon />}
                  onClick={() => handleMarkResolved(mistake.id, !mistake.resolved)}
                >
                  {mistake.resolved ? '标记为未解决' : '标记为已解决'}
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<PlayArrowIcon />}
                  onClick={() => router.push(`/dashboard/student/exercises?tags=${encodeURIComponent(mistake.question.tags.join(','))}`)}
                >
                  练习相关题目
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    if(window.confirm('确定要删除这道错题吗？')) {
                      handleDeleteMistake(mistake.id);
                    }
                  }}
                >
                  删除
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    );
  };
  
  // 渲染问题详情对话框
  const renderQuestionDetailsDialog = () => {
    if (!selectedQuestion) return null;
    
    return (
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          题目详情
          <IconButton
            aria-label="close"
            onClick={handleCloseDetails}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <ArrowBackIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box mb={3}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              题目类型：{selectedQuestion.type}
            </Typography>
            <Typography variant="h6" component="h2" className="font-bold">
              <MarkdownPreview content={selectedQuestion.title} />
            </Typography>
          </Box>
          
          {selectedQuestion.options && (
            <Box mb={3}>
              <Typography variant="subtitle1" className="mb-2">选项：</Typography>
              <List>
                {selectedQuestion.options.map((option) => (
                  <Paper key={option.id} variant="outlined" className="p-3 mb-2">
                    <Box display="flex" alignItems="flex-start">
                      <Box minWidth="32px">
                        {selectedQuestion.type === '多选题' ? (
                          (selectedQuestion.correctAnswer || []).includes(option.id) ? (
                            <CheckCircleIcon fontSize="small" color="success" />
                          ) : null
                        ) : (
                          option.id === selectedQuestion.correctAnswer ? (
                            <CheckCircleIcon fontSize="small" color="success" />
                          ) : null
                        )}
                      </Box>
                      <Box>
                        <Typography component="span" fontWeight="medium">{option.id.toUpperCase()}. </Typography>
                        <OptionMarkdownPreview content={option.content} />
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </List>
            </Box>
          )}
          
          {/* 正确答案（对于主观题） */}
          {(selectedQuestion.type === '填空题' || selectedQuestion.type === '简答题' || selectedQuestion.type === '编程题') && 
           selectedQuestion.correctAnswer && (
            <Box mb={3}>
              <Typography variant="subtitle1" className="mb-2">参考答案：</Typography>
              <Paper variant="outlined" className="p-3 bg-gray-50">
                <Typography 
                  component="pre" 
                  className={selectedQuestion.type === '编程题' ? 'font-mono text-sm' : ''}
                >
                  {selectedQuestion.correctAnswer}
                </Typography>
              </Paper>
            </Box>
          )}
          
          {/* 解析 */}
          {selectedQuestion.explanation && (
            <Box mt={3}>
              <Typography variant="subtitle1" className="mb-2">解析：</Typography>
              <Paper variant="outlined" className="p-3">
                <MarkdownPreview content={selectedQuestion.explanation} />
              </Paper>
            </Box>
          )}
          
          {/* 课程 */}
          {selectedQuestion.tags && selectedQuestion.tags.length > 0 && (
            <Box mt={3} display="flex" flexWrap="wrap" gap={1}>
              {selectedQuestion.tags.map((tag, index) => (
                <Chip key={index} label={tag} size="small" />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} color="primary">
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    );
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
                  <Link href="/dashboard/student/mistakes" className="px-3 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-gray-700">
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
                错题本
              </Typography>
              
              {renderMistakesList()}
            </div>
          </div>
        </main>
        
        {/* 问题详情对话框 */}
        {renderQuestionDetailsDialog()}
      </div>
    </AuthGuard>
  );
} 