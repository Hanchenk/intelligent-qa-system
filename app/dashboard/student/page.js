'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { logout } from '../../redux/features/authSlice';
import AuthGuard from '../../components/AuthGuard';

export default function StudentDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
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
        {/* 顶部导航栏 */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-500">
                    智能答题系统
                  </span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                  <Link href="/dashboard/student" className="px-3 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900">
                    仪表盘
                  </Link>
                  <Link href="/dashboard/student/exercises" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    我的练习
                  </Link>
                  <Link href="/dashboard/student/exams" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    我的考试
                  </Link>
                  <Link href="/dashboard/profile" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    个人中心
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                    {user?.name || '学生用户'}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                  >
                    登出
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* 主内容区 */}
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
                            65%
                          </div>
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

                {/* 近期考试卡片 */}
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
                            2个待完成
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
                            24题
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