'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import AuthGuard from '../../components/AuthGuard';
import { updateProfile, clearError } from '../../redux/features/authSlice';

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  
  // 当用户数据加载完成后，填充表单
  useEffect(() => {
    if (user) {
      setFormData(prevState => ({
        ...prevState,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);
  
  // 清除错误信息
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);
  
  // 处理错误信息
  useEffect(() => {
    if (error) {
      setMessage({ type: 'error', content: error });
    }
  }, [error]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCancel = () => {
    // 重置表单数据为原始用户数据
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
    setIsEditing(false);
    setMessage({ type: '', content: '' });
    dispatch(clearError());
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 密码修改验证
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', content: '新密码与确认密码不匹配' });
        return;
      }
      
      if (!formData.currentPassword) {
        setMessage({ type: 'error', content: '请输入当前密码' });
        return;
      }
    }
    
    // 准备要更新的数据
    const profileData = {
      name: formData.name,
      email: formData.email
    };
    
    // 如果有密码相关更新
    if (formData.newPassword) {
      profileData.currentPassword = formData.currentPassword;
      profileData.newPassword = formData.newPassword;
    }
    
    try {
      // 调用Redux action更新个人资料
      const resultAction = await dispatch(updateProfile(profileData));
      
      if (updateProfile.fulfilled.match(resultAction)) {
        setMessage({ type: 'success', content: '个人资料更新成功！' });
        setIsEditing(false);
        
        // 重置密码字段
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      }
    } catch (err) {
      setMessage({ type: 'error', content: err.message || '更新失败，请重试' });
    }
  };
  
  return (
    <AuthGuard allowedRoles={['student', 'teacher', 'admin']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 顶部导航栏 */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-500">
                    课程习题网站
                  </span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                  {user?.role === 'teacher' ? (
                    <Link href="/dashboard/teacher" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                      返回仪表盘
                    </Link>
                  ) : (
                    <Link href="/dashboard/student" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
                      返回仪表盘
                    </Link>
                  )}
                  <Link href="/dashboard/profile" className="px-3 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900">
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
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  个人资料
                </h1>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    编辑资料
                  </button>
                )}
              </div>
              
              {message.content && (
                <div className={`mb-4 p-3 rounded-md ${
                  message.type === 'error' 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {message.content}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      用户名
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing || loading}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
                        ${!isEditing || loading
                          ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' 
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                        } dark:text-white`}
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
                      disabled={!isEditing || loading}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
                        ${!isEditing || loading
                          ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' 
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                        } dark:text-white`}
                    />
                  </div>
                </div>
                
                {isEditing && (
                  <>
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b pb-2">修改密码</h2>
                    <div className="space-y-4 mb-6">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          当前密码
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleChange}
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          新密码
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          确认新密码
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                      >
                        {loading ? '保存中...' : '保存更改'}
                      </button>
                    </div>
                  </>
                )}
                
                {!isEditing && (
                  <div className="mt-6">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">账号信息</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">角色:</span> {user?.role === 'teacher' ? '教师' : '学生'}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">注册日期:</span> {new Date(user?.createdAt || Date.now()).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
} 