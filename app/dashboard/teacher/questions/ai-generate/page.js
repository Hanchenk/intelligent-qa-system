'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import AuthGuard from '../../../../components/AuthGuard';
import axios from 'axios';

// Material UI 组件
import {
  Button,
  Paper,
  Typography,
  Divider,
  Box,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Snackbar,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Grid,
  Stepper,
  Step,
  StepLabel,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';

// Material Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SaveIcon from '@mui/icons-material/Save';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AIGenerateQuestionsPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // 状态
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  
  // 输入状态
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('中等');
  const [selectedTags, setSelectedTags] = useState([]);
  const [questionType, setQuestionType] = useState('单选题');
  const [includeExplanation, setIncludeExplanation] = useState(true);
  const [questionCount, setQuestionCount] = useState(5);
  
  // 所有可用标签
  const [availableTags, setAvailableTags] = useState([]);
  
  // 获取所有标签
  useEffect(() => {
    const fetchTags = async () => {
      if (!token) return;
      
      try {
        const response = await axios.get(`${API_URL}/tags`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setAvailableTags(response.data.data || []);
      } catch (err) {
        console.error('获取标签失败:', err);
        // 使用模拟数据作为备用
        setAvailableTags([
          { _id: '1', name: 'JavaScript' },
          { _id: '2', name: 'React' },
          { _id: '3', name: 'Node.js' },
          { _id: '4', name: '数据库' },
          { _id: '5', name: '网络' },
          { _id: '6', name: '算法' }
        ]);
      }
    };
    
    fetchTags(); 
  }, [token]);
  
  // 难度选项
  const difficultyLevels = ['简单', '中等', '困难'];
  
  // 题目类型选项
  const questionTypes = ['单选题', '多选题', '判断题'];
  
  // JSON样例
  const getJsonSample = () => {
    if (questionType === '单选题') {
      return [
        {
          "title": "题目",
          "type": "单选题",
          "difficulty": difficulty,
          "score": 5,
          "options": [
            { "content": "选项A", "isCorrect": true },
            { "content": "选项B", "isCorrect": false },
            { "content": "选项C", "isCorrect": false },
            { "content": "选项D", "isCorrect": false }
          ],
          "explanation": includeExplanation ? "题目解析" : "",
          "tags": selectedTags.map(tag => tag.name || tag)
        }
      ];
    } else if (questionType === '多选题') {
      return [
        {
          "title": "题目",
          "type": "多选题",
          "difficulty": difficulty,
          "score": 5,
          "options": [
            { "content": "选项A", "isCorrect": true },
            { "content": "选项B", "isCorrect": true },
            { "content": "选项C", "isCorrect": false },
            { "content": "选项D", "isCorrect": false }
          ],
          "explanation": includeExplanation ? "题目解析" : "",
          "tags": selectedTags.map(tag => tag.name || tag)
        }
      ];
    } else if (questionType === '判断题') {
      return [
        {
          "title": "题目",
          "type": "判断题",
          "difficulty": difficulty,
          "score": 5,
          "correctAnswer": true,
          "explanation": includeExplanation ? "题目解析" : "",
          "tags": selectedTags.map(tag => tag.name || tag)
        }
      ];
    }
  };
  
  // 生成题目
  const generateQuestions = async () => {
    if (!topic) {
      setError('请输入题目主题');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 获取JSON样例
      const jsonSample = getJsonSample();
      
      // 构建请求数据
      const requestData = {
        topic: topic,
        difficulty: difficulty,
        type: questionType,
        includeExplanation: includeExplanation,
        jsonSample: JSON.stringify(jsonSample),
        count: questionCount
      };
      
      // 调用后端API
      const response = await axios.post(`${API_URL}/llm/generate-questions-custom`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setGeneratedQuestions(response.data.questions);
        setActiveStep(1); // 进入下一步
        setSuccess(true);
      } else {
        setError(response.data.message || '生成题目失败');
      }
    } catch (err) {
      console.error('生成题目请求失败:', err);
      setError('生成题目失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 导入生成的题目
  const importQuestions = async () => {
    if (generatedQuestions.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let successCount = 0;
      let failedCount = 0;
      
      // 为每个题目添加用户选择的标签
      const questionsWithTags = generatedQuestions.map(question => ({
        ...question,
        tags: selectedTags.map(tag => tag._id) // 使用标签ID
      }));
      
      // 逐个提交题目
      for (const question of questionsWithTags) {
        try {
          await axios.post(`${API_URL}/questions`, question, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          successCount++;
        } catch (err) {
          console.error('题目导入失败:', err);
          failedCount++;
        }
      }
      
      if (failedCount === 0) {
        setSuccess(true);
        setActiveStep(2); // 完成
      } else {
        setError(`部分题目导入失败: ${successCount} 成功, ${failedCount} 失败`);
      }
    } catch (err) {
      console.error('导入生成的题目失败:', err);
      setError('导入题目失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 返回题库页面
  const handleBackToLibrary = () => {
    router.push('/dashboard/teacher/questions');
  };
  
  // 重置表单
  const handleReset = () => {
    setTopic('');
    setDifficulty('中等');
    setSelectedTags([]);
    setQuestionType('单选题');
    setIncludeExplanation(true);
    setQuestionCount(5);
    setGeneratedQuestions([]);
    setActiveStep(0);
    setError(null);
    setSuccess(false);
  };
  
  // 处理标签选择
  const handleTagChange = (event) => {
    const { value } = event.target;
    setSelectedTags(
      typeof value === 'string' ? value.split(',') : value,
    );
  };
  
  // 渲染第一步 - 生成设置
  const renderStepOne = () => (
    <Box sx={{ width: '100%', mt: 3 }}>
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            AI生成题目设置
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="题目主题"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                placeholder="例如：JavaScript变量作用域、React生命周期、数据库索引等"
                helperText="输入越详细，生成的题目质量越高"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>难度</InputLabel>
                <Select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  label="难度"
                >
                  {difficultyLevels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>题目类型</InputLabel>
                <Select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  label="题目类型"
                >
                  {questionTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>生成数量</InputLabel>
                <Select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  label="生成数量"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                    <MenuItem key={count} value={count}>
                      {count}道题
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeExplanation}
                    onChange={(e) => setIncludeExplanation(e.target.checked)}
                    color="primary"
                  />
                }
                label="包含题目解析"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>所属标签</InputLabel>
                <Select
                  multiple
                  value={selectedTags}
                  onChange={handleTagChange}
                  label="所属标签"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((tag) => (
                        <Chip 
                          key={typeof tag === 'object' ? tag._id : tag} 
                          label={typeof tag === 'object' ? tag.name : tag} 
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {availableTags.map((tag) => (
                    <MenuItem key={tag._id} value={tag}>
                      {tag.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToLibrary}
        >
          返回题库
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<SmartToyIcon />}
          onClick={generateQuestions}
          disabled={isLoading || !topic}
        >
          {isLoading ? <CircularProgress size={24} /> : '生成题目'}
        </Button>
      </Box>
    </Box>
  );
  
  // 渲染第二步 - 预览生成的题目
  const renderStepTwo = () => (
    <Box sx={{ width: '100%', mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        预览生成的题目
      </Typography>
      
      {generatedQuestions.length > 0 ? (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>题目内容</TableCell>
                <TableCell align="center">类型</TableCell>
                <TableCell align="center">难度</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {generatedQuestions.map((question, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2">{question.title}</Typography>
                    
                    {/* 选项 */}
                    {(question.type === '单选题' || question.type === '多选题') && question.options && (
                      <Box sx={{ mt: 1 }}>
                        {question.options.map((option, optIndex) => (
                          <Typography key={optIndex} variant="body2" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Chip 
                              size="small" 
                              label={String.fromCharCode(65 + optIndex)} 
                              color={option.isCorrect ? "success" : "default"} 
                              sx={{ mr: 1, minWidth: 28 }} 
                            />
                            {option.content}
                          </Typography>
                        ))}
                      </Box>
                    )}
                    
                    {/* 判断题答案 */}
                    {question.type === '判断题' && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        正确答案: {question.correctAnswer ? '正确' : '错误'}
                      </Typography>
                    )}
                    
                    {/* 解析 */}
                    {question.explanation && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          <strong>解析:</strong> {question.explanation}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="center">{question.type}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      size="small" 
                      label={question.difficulty} 
                      color={
                        question.difficulty === '简单' ? 'success' : 
                        question.difficulty === '中等' ? 'warning' : 
                        'error'
                      } 
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          没有生成题目，请返回上一步重试
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={() => setActiveStep(0)}
        >
          返回修改
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={importQuestions}
          disabled={isLoading || generatedQuestions.length === 0}
        >
          {isLoading ? <CircularProgress size={24} /> : '导入题库'}
        </Button>
      </Box>
    </Box>
  );
  
  // 渲染第三步 - 完成
  const renderStepThree = () => (
    <Box sx={{ width: '100%', mt: 3, textAlign: 'center' }}>
      <Alert severity="success" sx={{ mb: 4 }}>
        题目已成功导入题库！
      </Alert>
      
      <Typography variant="body1" paragraph>
        已成功导入 {generatedQuestions.length} 道题目到您的题库。
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
        <Button
          variant="outlined"
          onClick={handleReset}
        >
          继续生成题目
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleBackToLibrary}
        >
          返回题库
        </Button>
      </Box>
    </Box>
  );
  
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
                    课程习题网站
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
              <div className="mb-6">
                <Typography variant="h5" component="h1">
                  <SmartToyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  AI生成题目
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  使用人工智能快速生成高质量的题目，并直接导入题库
                </Typography>
              </div>
              
              <Divider sx={{ mb: 3 }} />
              
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                <Step>
                  <StepLabel>设置参数</StepLabel>
                </Step>
                <Step>
                  <StepLabel>预览题目</StepLabel>
                </Step>
                <Step>
                  <StepLabel>导入完成</StepLabel>
                </Step>
              </Stepper>
              
              {activeStep === 0 && renderStepOne()}
              {activeStep === 1 && renderStepTwo()}
              {activeStep === 2 && renderStepThree()}
            </div>
          </div>
        </main>
      </div>
      
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        message="操作成功完成"
      />
    </AuthGuard>
  );
} 