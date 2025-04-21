const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Question = require('../models/Question');
const Tag = require('../models/Tag');
const Exam = require('../models/Exam');

// @route   GET /api/stats/dashboard
// @desc    获取教师仪表盘统计数据
// @access  Private/Teacher
router.get('/dashboard', protect, authorize('teacher'), async (req, res) => {
  try {
    // 并行请求所有统计数据以提高性能
    const [questionCount, examCount, tagCount] = await Promise.all([
      // 获取教师创建的题目数量
      Question.countDocuments({ creator: req.user.id }),
      
      // 获取教师创建的考试数量（假设Exam模型中有creator字段）
      Exam.countDocuments({ creator: req.user.id }),
      
      // 获取系统中所有标签的数量（标签通常是全局共享的）
      Tag.countDocuments()
    ]);
    
    res.json({
      success: true,
      stats: {
        questionCount,
        examCount,
        tagCount
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取统计数据'
    });
  }
});

module.exports = router; 