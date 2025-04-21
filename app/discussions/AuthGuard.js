'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials } from '@/app/redux/features/authSlice';
import { CircularProgress } from '@mui/material';

/**
 * 讨论区权限控制组件 - 用于保护需要特定权限才能访问的路由
 */
export default function AuthGuard({ allowedRoles = ['student', 'teacher'], children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const [initializing, setInitializing] = useState(true);
  
  useEffect(() => {
    // 检查本地存储中是否有认证信息
    const checkLocalAuth = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      
      // 如果本地存储有token和角色，但Redux状态中未认证
      if (token && role && !isAuthenticated && !user) {
        console.log('从本地存储恢复认证状态');
        // 从本地存储恢复认证状态
        dispatch(setCredentials({
          token,
          user: { role, id: localStorage.getItem('userId') || 'local-user' }
        }));
        return true;
      }
      return false;
    };
    
    // 检查本地存储中的认证信息并设置初始化完成状态
    const wasRestoredFromLocal = checkLocalAuth();
    setInitializing(false);
    
    // 如果认证状态已加载完成，且不是从本地存储恢复的状态
    if (!loading && !wasRestoredFromLocal && !initializing) {
      // 如果未登录，重定向到登录页
      if (!isAuthenticated) {
        // 记录当前URL以便登录后返回
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        console.log('未登录用户，重定向到登录页');
        router.push('/auth/login');
        return;
      }
      
      // 如果用户没有所需权限，重定向到适当页面
      if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        console.log('用户无权限，重定向到对应仪表板');
        // 根据用户角色重定向到对应的仪表板
        if (user.role === 'student') {
          router.push('/dashboard/student');
        } else if (user.role === 'teacher') {
          router.push('/dashboard/teacher');
        } else {
          // 未知角色，重定向到首页
          router.push('/');
        }
      }
    }
  }, [isAuthenticated, loading, user, router, allowedRoles, dispatch, initializing]);

  // 如果正在加载或验证权限，显示加载指示器
  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CircularProgress />
        <p className="ml-2">正在验证权限...</p>
      </div>
    );
  }

  // 如果未登录，但本地存储有token，尝试使用本地存储的凭据
  if (!isAuthenticated && typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (token && role) {
      // 如果本地有认证信息，显示子组件而不是重定向
      if (!allowedRoles || allowedRoles.includes(role)) {
        return children;
      }
    }
    
    // 如果确实未登录，显示加载指示器
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CircularProgress />
        <p className="ml-2">请先登录...</p>
      </div>
    );
  }

  // 如果用户没有权限，但已登录
  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CircularProgress />
        <p className="ml-2">正在重定向到合适页面...</p>
      </div>
    );
  }

  // 如果用户有权限，显示被保护的内容
  return children;
} 