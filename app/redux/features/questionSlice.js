'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// 使用环境变量API_URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const initialState = {
  questions: [],
  currentQuestion: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  }
};

// 获取题目列表
export const fetchQuestions = createAsyncThunk(
  'questions/fetchQuestions',
  async (params, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      if (!token) {
        return rejectWithValue('未登录');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params
      };
      
      const response = await axios.get(`${API_URL}/questions`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || '获取题目列表失败'
      );
    }
  }
);

// 获取题目详情
export const fetchQuestionById = createAsyncThunk(
  'questions/fetchQuestionById',
  async (id, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      if (!token) {
        return rejectWithValue('未登录');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/questions/${id}`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || '获取题目详情失败'
      );
    }
  }
);

// 创建题目
export const createQuestion = createAsyncThunk(
  'questions/createQuestion',
  async (questionData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      if (!token) {
        return rejectWithValue('未登录');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.post(`${API_URL}/questions`, questionData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || '创建题目失败'
      );
    }
  }
);

// 更新题目
export const updateQuestion = createAsyncThunk(
  'questions/updateQuestion',
  async ({ id, questionData }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      if (!token) {
        return rejectWithValue('未登录');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.put(`${API_URL}/questions/${id}`, questionData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || '更新题目失败'
      );
    }
  }
);

// 删除题目
export const deleteQuestion = createAsyncThunk(
  'questions/deleteQuestion',
  async (id, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      if (!token) {
        return rejectWithValue('未登录');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.delete(`${API_URL}/questions/${id}`, config);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || '删除题目失败'
      );
    }
  }
);

// 搜索题目
export const searchQuestions = createAsyncThunk(
  'questions/searchQuestions',
  async (query, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      if (!token) {
        return rejectWithValue('未登录');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: { query }
      };
      
      const response = await axios.get(`${API_URL}/questions/search`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || '搜索题目失败'
      );
    }
  }
);

const questionSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    clearQuestionError: (state) => {
      state.error = null;
    },
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload;
    },
    clearCurrentQuestion: (state) => {
      state.currentQuestion = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 获取题目列表
      .addCase(fetchQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.data.questions;
        state.pagination = {
          page: action.payload.data.page,
          limit: action.payload.data.limit,
          total: action.payload.data.total,
          pages: action.payload.data.pages
        };
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 获取题目详情
      .addCase(fetchQuestionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuestion = action.payload.question;
      })
      .addCase(fetchQuestionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 创建题目
      .addCase(createQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = [action.payload.question, ...state.questions];
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 更新题目
      .addCase(updateQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = state.questions.map(question => 
          question._id === action.payload.question._id ? action.payload.question : question
        );
        if (state.currentQuestion && state.currentQuestion._id === action.payload.question._id) {
          state.currentQuestion = action.payload.question;
        }
      })
      .addCase(updateQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 删除题目
      .addCase(deleteQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = state.questions.filter(question => question._id !== action.payload.id);
        if (state.currentQuestion && state.currentQuestion._id === action.payload.id) {
          state.currentQuestion = null;
        }
      })
      .addCase(deleteQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 搜索题目
      .addCase(searchQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.questions;
        // 搜索结果不更新分页信息
      })
      .addCase(searchQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearQuestionError, setCurrentQuestion, clearCurrentQuestion } = questionSlice.actions;

export default questionSlice.reducer; 