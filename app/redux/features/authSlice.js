'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
};

// 用户注册
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/register', userData);
      console.log('注册响应:', response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || '注册失败，请稍后再试'
      );
    }
  }
);

// 用户登录
export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', userData);
      console.log('登录响应:', response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || '登录失败，请稍后再试'
      );
    }
  }
);

// 获取当前用户信息
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      if (!token) {
        console.log('获取当前用户：无token');
        return rejectWithValue('未登录');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      console.log('获取当前用户：发送请求');
      const response = await axios.get('http://localhost:3001/api/auth/me', config);
      console.log('获取当前用户响应:', response.data);
      
      // 确保用户角色信息正确
      if (response.data.user && !response.data.user.role) {
        // 如果API没有返回角色，尝试从localStorage获取
        const savedRole = localStorage.getItem('userRole');
        if (savedRole) {
          console.log('从localStorage获取角色:', savedRole);
          response.data.user.role = savedRole;
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return rejectWithValue(
        error.response?.data?.message || '获取用户信息失败'
      );
    }
  }
);

// 更新用户个人资料
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue, getState }) => {
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
      
      const response = await axios.put('http://localhost:3001/api/users/profile', profileData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || '更新个人资料失败'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      
      // 移除本地存储的token和角色
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
      }
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      
      // 保存token和角色到本地存储
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.token);
        if (action.payload.user && action.payload.user.role) {
          localStorage.setItem('userRole', action.payload.user.role);
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // 注册
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        
        // 保存token和角色到本地存储
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', action.payload.token);
          if (action.payload.user && action.payload.user.role) {
            localStorage.setItem('userRole', action.payload.user.role);
          }
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 登录
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        
        // 保存token和角色到本地存储
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', action.payload.token);
          if (action.payload.user && action.payload.user.role) {
            localStorage.setItem('userRole', action.payload.user.role);
          }
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 获取当前用户
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        
        // 确保角色信息被保存
        if (action.payload.user && action.payload.user.role) {
          localStorage.setItem('userRole', action.payload.user.role);
        }
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
        
        // 移除本地存储的token和角色
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
        }
      })
      
      // 更新个人资料
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        
        // 确保角色信息被保存
        if (action.payload.user && action.payload.user.role) {
          localStorage.setItem('userRole', action.payload.user.role);
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, setCredentials, clearError, setError } = authSlice.actions;

export default authSlice.reducer; 