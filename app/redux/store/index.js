'use client';

import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import questionReducer from '../features/questionSlice';
import submissionReducer from '../features/submissionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    questions: questionReducer,
    submissions: submissionReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store; 