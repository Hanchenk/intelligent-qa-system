'use client';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';

export default function NotFound() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // 确定返回链接
  const getBackLink = () => {
    if (!isAuthenticated) {
      return '/';
    }
    
    if (user?.role === 'teacher') {
      return '/dashboard/teacher';
    }
    
    return '/dashboard/student';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="text-blue-600 dark:text-blue-400">
            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">页面未找到</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          抱歉，您访问的页面不存在或正在开发中。
        </p>
        <div className="flex flex-col space-y-3">
          <Link
            href={getBackLink()}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            返回仪表板
          </Link>
          <button
            onClick={() => router.back()}
            className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition-colors"
          >
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
} 