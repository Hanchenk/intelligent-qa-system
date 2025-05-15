# 基于大语言模型的课程习题网站

本项目旨在构建一个面向高校计算机专业学生的课程习题网站，利用大语言模型技术实现题目生成、答案评估和个性化学习推荐功能。系统采用简洁的设计风格，注重核心功能的实现，确保系统易用性和稳定性。

## 技术栈

### 前端
- **框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS + Material UI
- **状态管理**: Redux (使用Redux Toolkit)
- **HTTP客户端**: Axios
- **通知系统**: React Hot Toast

### 后端
- **运行时**: Node.js
- **API框架**: Express.js
- **数据库**: MongoDB
- **身份验证**: JWT (JSON Web Token)

### 大语言模型
- **主要模型**: Deepseek-r1-250120
- **API集成**: 采用RESTful API方式

## 系统架构

```
客户端 (Next.js) <---> 后端API (Express) <---> 数据库 (MongoDB)
                            |
                            v
                     大语言模型API (Deepseek)
```

## 当前开发进度

### 第一阶段：基础框架搭建（已完成 ✅）
- ✅ 搭建Next.js前端项目结构
- ✅ 创建Express后端项目
- ✅ 设计并实现数据库模型
- ✅ 完成基本路由设置
- ✅ 实现用户认证系统

### 第二阶段：核心功能开发（已完成 ✅）
- 用户管理模块开发
  - ✅ 注册/登录页面
  - ✅ 个人中心页面
  - ✅ 权限控制系统
- 题库管理模块开发
  - ✅ 题目上传与管理界面
  - ✅ 题目分类与搜索功能
  - ✅ 课程系统实现
  - ✅ Markdown编辑器集成
- 在线答题模块开发
  - ✅ 答题界面设计与实现
  - ✅ 答题记录与评分系统
  - ✅ 学习报告生成

### 第三阶段：大语言模型集成（已完成 ✅）
- ✅ 题目自动生成
- ✅ 主观题评分
- ✅ 学习建议生成

### 最近更新（2024-03-27）
- ✅ 修复课程管理相关功能
- ✅ 实现题目与课程关联系统
- ✅ 优化分页功能
- ✅ 统一API URL处理
- ✅ 修复组件导入路径

## 已解决的问题
- 修复依赖缺失导致的构建错误（react-hot-toast, date-fns）
- 修复组件导入路径错误
- 修复课程选择和表单提交问题
- 修复API URL一致性问题
- 优化分页组件，增强用户体验

## 最新功能更新：主观题支持

### 新增功能
1. **教师端**
   - AI生成题目功能支持两种新的题目类型：
     - 简答题 (10分)
     - 编程题 (20分)
   - 可以生成包含专业评分标准的主观题

2. **学生端**
   - 支持回答简答题和编程题
   - 主观题答案提交后，系统会自动调用大语言模型进行评分，包括：
     - 根据标准答案评估学生回答内容
     - 给出详细的评分反馈
     - 自动计算得分

3. **后端**
   - 新增对主观题自动评估的API接口
   - 针对不同题型（简答题/编程题）的专业评分标准
   - 评分数据存储在提交记录中，方便后续查看

### 如何使用
1. 教师创建主观题：
   - 在AI生成题目功能中选择"简答题"或"编程题"类型
   - 设置题目难度、分值、课程等参数
   - 生成后可以查看专业评分标准

2. 学生作答主观题：
   - 在考试/练习界面进行作答
   - 提交后AI自动评分并给出反馈
   - 学生可以查看详细的评分意见

### 技术实现
- 使用大语言模型API评估答案质量
- 根据题目类型采用不同的评分标准和提示
- 支持教师手动复核和调整评分结果

---

## 开发指南

这是一个使用 [Next.js](https://nextjs.org) 创建的项目，通过 [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) 引导搭建。

### 快速开始

首先，安装所有依赖：

```bash
# 安装前端依赖
npm install --legacy-peer-deps

# 安装后端依赖
cd backend
npm install
```

然后，运行开发服务器：

```bash
# 前端开发服务器
npm run dev

# 后端开发服务器
cd backend
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看前端页面。
后端API服务器运行在 [http://localhost:3001](http://localhost:3001)。

### 环境变量配置

创建`.env.local`文件，添加以下环境变量：

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

在`backend`目录下创建`.env`文件，添加以下环境变量：

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/intelligent-qa
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
LLM_API_KEY=your_llm_api_key
```

### 代码风格

项目使用ESLint进行代码格式化和风格检查。运行以下命令检查代码风格：

```bash
npm run lint
```
