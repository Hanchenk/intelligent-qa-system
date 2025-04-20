'use client';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import AuthGuard from '../../../components/AuthGuard';

export default function StudentExamsPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);

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
                  <Link href="/dashboard/student" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    仪表盘
                  </Link>
                  <Link href="/dashboard/student/exercises" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                    我的练习
                  </Link>
                  <Link href="/dashboard/student/exams" className="px-3 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900">
                    我的考试
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
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full mb-6">
                  <svg className="w-16 h-16 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">考试功能开发中</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-8 text-center max-w-md">
                  我们正在努力开发考试功能，该功能将在下一个版本中推出。请稍后再来查看！
                </p>
                <div className="flex space-x-4">
                  <Link 
                    href="/dashboard/student"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                  >
                    返回仪表板
                  </Link>
                  <button
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition-colors"
                  >
                    返回上一页
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
} 