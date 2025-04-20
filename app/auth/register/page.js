'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../redux/features/authSlice';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student', // 默认为学生角色
  });
  const [success, setSuccess] = useState('');
  
  // 监听认证状态
  useEffect(() => {
    // 如果用户已经登录，则跳转到仪表板
    if (isAuthenticated) {
      setSuccess('注册成功！即将跳转到登录页面...');
      
      // 3秒后重定向到登录页面
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    }
    
    // 组件卸载时清除错误
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, router, dispatch]);
  
  // 添加调试信息
  useEffect(() => {
    console.log('注册页面已加载');
    
    // 返回清理函数
    return () => {
      console.log('注册页面将卸载');
    };
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('提交按钮已点击');
    
    // 表单验证
    if (formData.password !== formData.confirmPassword) {
      dispatch({ type: 'auth/setError', payload: '两次输入的密码不一致' });
      return;
    }
    
    if (formData.password.length < 6) {
      dispatch({ type: 'auth/setError', payload: '密码至少需要6个字符' });
      return;
    }
    
    try {
      // 准备要发送到后端的数据
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };
      
      console.log('发送注册请求:', userData);
      
      // 使用Redux action注册
      await dispatch(registerUser(userData));
      
      // 注意：重定向逻辑已移至useEffect中处理
    } catch (err) {
      console.error('注册过程中出现错误:', err);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          注册账号
        </h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              用户名
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="请输入用户名"
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              邮箱
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="请输入邮箱"
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              密码
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="请设置密码，至少6位"
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              确认密码
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="请再次输入密码"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              账号类型
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={formData.role === 'student'}
                  onChange={handleChange}
                  className="form-radio h-4 w-4 text-blue-600"
                  disabled={loading}
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">学生</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="teacher"
                  checked={formData.role === 'teacher'}
                  onChange={handleChange}
                  className="form-radio h-4 w-4 text-blue-600"
                  disabled={loading}
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">教师</span>
              </label>
            </div>
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </div>
        </form>
        
        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          已有账号？
          <Link href="/auth/login">
            <span className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-1">
              立即登录
            </span>
          </Link>
        </p>
        
        <div className="flex items-center justify-center mt-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
} 