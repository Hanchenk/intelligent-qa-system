'use client';

import { useEffect, useState } from 'react';

// 这个组件用于解决Next.js中的客户端水合问题
// 确保组件只在浏览器中渲染，避免服务器端和客户端渲染不匹配的问题
export default function ClientOnly({ children }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
} 