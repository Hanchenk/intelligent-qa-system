'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { logout } from '../../redux/features/authSlice';
import AuthGuard from '../../components/AuthGuard';
import StudentNavBar from '../../components/StudentNavBar';
import axios from 'axios';
import { CircularProgress } from '@mui/material';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
console.log('使用API基础URL:', API_URL);

export default function StudentDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    progressPercentage: 0,
    upcomingExamCount: 0,
    mistakeCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 获取统计数据
  useEffect(() => {
    // 检查用户是否已登录
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);

    // 获取统计数据
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('未找到认证令牌');
        }

        // 确保API URL正确构建
        let apiEndpoint = `${API_URL}/api/stats/student-dashboard`;
        // 处理可能的重复/api路径问题
        if (API_URL.endsWith('/api') && apiEndpoint.includes('/api/api/')) {
          apiEndpoint = apiEndpoint.replace('/api/api/', '/api/');
        }
        console.log('请求统计数据API:', apiEndpoint);

        const response = await axios.get(apiEndpoint, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data && response.data.success) {
          setStats({
            progressPercentage: response.data.stats.progressPercentage || 0,
            mistakeCount: response.data.stats.mistakeCount || 0,
            totalAnswered: response.data.stats.totalAnswered || 0,
            uniqueAnswered: response.data.stats.uniqueAnswered || 0,
            totalQuestions: response.data.stats.totalQuestions || 0,
            isNewUser: response.data.stats.isNewUser || false
          });
        } else {
          // 如果API失败，使用默认值
          setStats({
            progressPercentage: 0,
            mistakeCount: 0,
            totalAnswered: 0,
            uniqueAnswered: 0,
            totalQuestions: 0,
            isNewUser: true
          });
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
        // 错误时使用默认值
        setStats({
          progressPercentage: 0,
          mistakeCount: 0,
          totalAnswered: 0,
          uniqueAnswered: 0,
          totalQuestions: 0,
          isNewUser: true
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
        console.log('学生登出成功，重定向到登录页');
        router.push('/auth/login');
      }, 300);
    } catch (error) {
      console.error('登出时发生错误:', error);
    }
  };

  return (
    <AuthGuard allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StudentNavBar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 h-96">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                欢迎回来，{user?.name || '同学'}！
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 学习进度卡片 */}
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          学习进度
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">
                            {loading ? (
                              <CircularProgress size={20} />
                            ) : stats.isNewUser ? (
                              <span className="text-blue-500">新用户</span>
                            ) : (
                              `${stats.progressPercentage}%`
                            )}
                          </div>
                          {!loading && !stats.isNewUser && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              已答题目: {stats.uniqueAnswered || 0} / {stats.totalQuestions || 0}
                            </div>
                          )}
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/dashboard/student/progress" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        查看详情
                      </Link>
                    </div>
                  </div>
                </div>

                {/* 注释掉近期考试卡片 
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
                          近期考试
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">
                            {loading ? (
                              <CircularProgress size={20} />
                            ) : (
                              `${stats.upcomingExamCount}个待完成`
                            )}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/dashboard/student/exams" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        查看详情
                      </Link>
                    </div>
                  </div>
                </div>
                */}

                {/* 错题本卡片 */}
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          错题数量
                        </dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">
                            {loading ? (
                              <CircularProgress size={20} />
                            ) : (
                              `${stats.mistakeCount}题`
                            )}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                    <div className="text-sm">
                      <Link href="/dashboard/student/mistakes" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        查看详情
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
} 