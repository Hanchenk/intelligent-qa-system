'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { logout } from '../../redux/features/authSlice';
import AuthGuard from '../../components/AuthGuard';
import TeacherNavBar from '../../components/TeacherNavBar';
import axios from 'axios';
import { CircularProgress } from '@mui/material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function TeacherDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    questionCount: 0,
    examCount: 0,
    tagCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_URL}/stats/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setStats({
            questionCount: response.data.stats.questionCount || 0,
            examCount: response.data.stats.examCount || 0,
            tagCount: response.data.stats.tagCount || 0
          });
        } else {
          throw new Error(response.data.message || '获取统计数据失败');
        }
      } catch (err) {
        console.error('获取统计数据失败:', err);
        setError('获取统计数据失败，请刷新页面重试');
        
        // 设置备用统计数据
        setStats({
          questionCount: 0,
          examCount: 0,
          tagCount: 0
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [user]);
  
  const handleLogout = async () => {
    try {
      // 调用登出action
      await dispatch(logout());
      // 延迟300ms确保Redux状态更新
      setTimeout(() => {
        console.log('教师登出成功，重定向到登录页');
        router.push('/auth/login');
      }, 300);
    } catch (error) {
      console.error('登出时发生错误:', error);
    }
  };

  return (
    <AuthGuard allowedRoles={['teacher']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 顶部导航栏 */}
        <TeacherNavBar />

        {/* 主内容区 */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 h-96">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                欢迎回来，{user?.name || '老师'}！
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 题库统计卡片 */}
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          题库总数
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">
                            {loading ? (
                              <CircularProgress size={20} />
                            ) : (
                              `${stats.questionCount}题`
                            )}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/dashboard/teacher/questions" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        管理题库
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 考试统计卡片 */}
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          考试数量
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">
                            {loading ? (
                              <CircularProgress size={20} />
                            ) : (
                              `${stats.examCount}场`
                            )}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/dashboard/teacher/exams" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        管理考试
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 标签统计卡片 */}
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          标签数量
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">
                            {loading ? (
                              <CircularProgress size={20} />
                            ) : (
                              `${stats.tagCount}个`
                            )}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/dashboard/teacher/tags" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        管理标签
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* 快捷操作区域 */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">快捷操作</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/dashboard/teacher/questions/create" className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-800 p-3 rounded-md">
                      <svg className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">创建新题目</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">添加新的题目到题库中</p>
                    </div>
                  </Link>
                  <Link href="/dashboard/teacher/exams/create" className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 bg-green-100 dark:bg-green-800 p-3 rounded-md">
                      <svg className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">安排新考试</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">创建并安排新的考试</p>
                    </div>
                  </Link>
                  <Link href="/dashboard/teacher/tags" className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-800 p-3 rounded-md">
                      <svg className="h-6 w-6 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">管理标签</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">整理和分类您的题库</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
} 