'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../redux/features/authSlice';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  // 监听认证状态，当成功登录后重定向到相应页面
  useEffect(() => {
    if (isAuthenticated && user) {
      // 检查是否有保存的重定向URL
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      
      if (redirectPath) {
        // 清除保存的重定向URL
        localStorage.removeItem('redirectAfterLogin');
        console.log('重定向到之前的页面:', redirectPath);
        router.push(redirectPath);
      } else {
        // 根据用户角色跳转到不同页面
        console.log('登录成功，用户角色:', user.role);
        
        if (user.role === 'teacher') {
          console.log('重定向到教师仪表板');
          router.push('/dashboard/teacher');
        } else {
          console.log('重定向到学生仪表板');
          router.push('/dashboard/student');
        }
      }
    }
  }, [isAuthenticated, user, router]);
  
  // 清除错误信息
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 使用Redux action登录
      console.log('提交登录:', formData);
      await dispatch(loginUser(formData));
      
      // 注意：重定向逻辑已移至useEffect中处理
    } catch (err) {
      console.error('登录过程中出现错误:', err);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          登录账号
        </h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="请输入您的邮箱"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="请输入您的密码"
              disabled={loading}
            />
          </div>
          
          <div>
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>
        
        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          还没有账号？
          <Link href="/auth/register">
            <span className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-1">
              立即注册
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