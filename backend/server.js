const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/discussions', require('./routes/discussions'));
app.use('/api/llm', require('./routes/llm'));
app.use('/api/tags', require('./routes/tags'));
// 导入stats路由对象
const { router: statsRouter } = require('./routes/stats');
// 使用路由
app.use('/api/stats', statsRouter);
app.use('/api/mistakes', require('./routes/mistakes'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
// 注释掉考试相关API
// app.use('/api/exams', require('./routes/exams'));

// 基础路由
app.get('/', (req, res) => {
  res.send('课程习题网站API服务已启动');
});

// 添加健康检查/ping端点
app.get('/api/ping', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'API服务正常', 
    timestamp: new Date().toISOString() 
  });
});

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 