'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  submissions: [],
  currentSubmission: null,
  loading: false,
  error: null,
  userProgress: null
};

// 提交答案
export const submitAnswer = createAsyncThunk(
  'submissions/submitAnswer',
  async (submissionData, { rejectWithValue, getState }) => {
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
      
      const response = await axios.post('http://localhost:3001/api/submissions', submissionData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || '提交答案失败'
      );
    }
  }
);

// 获取用户答题记录
export const getUserSubmissions = createAsyncThunk(
  'submissions/getUserSubmissions',
  async (userId, { rejectWithValue, getState }) => {
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
      
      const response = await axios.get(`http://localhost:3001/api/submissions/user/${userId}`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || '获取答题记录失败'
      );
    }
  }
);

// 获取用户学习进度
export const getUserProgress = createAsyncThunk(
  'submissions/getUserProgress',
  async (userId, { rejectWithValue, getState }) => {
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
      
      const response = await axios.get(`http://localhost:3001/api/users/${userId}/progress`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || '获取学习进度失败'
      );
    }
  }
);

// 获取题目的所有提交记录(教师用)
export const getQuestionSubmissions = createAsyncThunk(
  'submissions/getQuestionSubmissions',
  async (questionId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const user = getState().auth.user;
      
      if (!token) {
        return rejectWithValue('未登录');
      }
      
      if (user.role !== 'teacher') {
        return rejectWithValue('无权限查看此资源');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`http://localhost:3001/api/submissions/question/${questionId}`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || '获取题目提交记录失败'
      );
    }
  }
);

const submissionSlice = createSlice({
  name: 'submissions',
  initialState,
  reducers: {
    clearSubmissionError: (state) => {
      state.error = null;
    },
    clearSubmissions: (state) => {
      state.submissions = [];
    },
    setCurrentSubmission: (state, action) => {
      state.currentSubmission = action.payload;
    },
    clearCurrentSubmission: (state) => {
      state.currentSubmission = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 提交答案
      .addCase(submitAnswer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSubmission = action.payload.submission;
        state.submissions = [action.payload.submission, ...state.submissions];
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 获取用户答题记录
      .addCase(getUserSubmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions = action.payload.submissions;
      })
      .addCase(getUserSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 获取用户学习进度
      .addCase(getUserProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProgress.fulfilled, (state, action) => {
        state.loading = false;
        state.userProgress = action.payload.progress;
      })
      .addCase(getUserProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 获取题目的所有提交记录
      .addCase(getQuestionSubmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuestionSubmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions = action.payload.submissions;
      })
      .addCase(getQuestionSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  clearSubmissionError, 
  clearSubmissions, 
  setCurrentSubmission, 
  clearCurrentSubmission 
} = submissionSlice.actions;

export default submissionSlice.reducer; 