'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 p-4">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 dark:text-white">
        基于大语言模型的课程习题网站的设计与实现
      </h1>
      <p className="text-lg text-center mb-12 text-gray-600 dark:text-gray-300 max-w-2xl">
        基于大语言模型的智能学习平台，为您提供个性化学习体验
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/auth/login">
          <span className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors inline-block">
            登录
          </span>
        </Link>
        <Link href="/auth/register">
          <span className="border border-blue-600 text-blue-600 px-6 py-3 rounded-md hover:bg-blue-50 transition-colors inline-block">
            注册
          </span>
        </Link>
      </div>
      
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl">
        {features.map((feature, index) => (
          <FeatureCard 
            key={index}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

const features = [
  {
    title: "智能题目生成",
    description: "基于大语言模型自动生成高质量题目，覆盖多种知识点"
  },
  {
    title: "个性化学习推荐",
    description: "根据学习进度和掌握情况，智能推荐适合的习题"
  },
  {
    title: "详细解析与点评",
    description: "提供专业的解题思路和个性化学习建议"
  }
];
