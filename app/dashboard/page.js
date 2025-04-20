'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentUser } from '../redux/features/authSlice';
import Link from 'next/link';

// 导入ClientOnly包裹组件，解决水合错误
import ClientOnly from '../components/ClientOnly';

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    completionRate: 0,
  });

  // 检查用户是否已登录并根据角色重定向
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else if (isAuthenticated && user) {
        // 根据用户角色重定向
        if (user.role === 'teacher') {
          router.push('/dashboard/teacher');
        } else {
          router.push('/dashboard/student');
        }
      }
    }
  }, [isAuthenticated, loading, router, user]);

  // 加载用户数据
  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 这个页面内容通常不会显示，因为会被重定向
  return (
    <ClientOnly>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在重定向到您的个人仪表板...</p>
        </div>
      </div>
    </ClientOnly>
  );
} 