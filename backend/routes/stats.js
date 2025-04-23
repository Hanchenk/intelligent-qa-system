const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Question = require('../models/Question');
const Tag = require('../models/Tag');
const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const MistakeRecord = require('../models/MistakeRecord');
const User = require('../models/User');

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

// @route   GET /api/stats/student-dashboard
// @desc    获取学生仪表盘统计数据
// @access  Private/Student
router.get('/student-dashboard', protect, authorize('student'), async (req, res) => {
  try {
    const now = new Date();
    
    // 并行请求所有统计数据以提高性能
    const [submissions, upcomingExams, totalQuestions, mistakeCount] = await Promise.all([
      // 获取学生的所有提交记录
      Submission.find({ user: req.user.id }),
      
      // 获取未来的考试（考试开始时间大于当前时间）
      Exam.find({ 
        startTime: { $gt: now },
        isActive: true 
      }),
      
      // 获取系统中总题目数量（用于计算学习进度）
      Question.countDocuments(),
      
      // 获取学生的错题数量（未标记为已解决的）
      MistakeRecord.countDocuments({ 
        user: req.user.id,
        resolved: false
      })
    ]);
    
    // 计算学习进度百分比（已答题数量 / 总题目数量）
    // 使用distinct查询来确保每个题目只计算一次，重复回答同一题目只算作一次
    const answeredQuestions = await Submission.find({ 
      user: req.user.id 
    }).distinct('question');
    
    const progressPercentage = totalQuestions > 0 
      ? Math.round((answeredQuestions.length / totalQuestions) * 100) 
      : 0;
    
    // 如果错题记录为空，使用旧的计算方法作为备用
    let finalMistakeCount = mistakeCount;
    
    if (mistakeCount === 0 && submissions.length > 0) {
      // 在提交记录中寻找错误答案
      const incorrectSubmissions = submissions.filter(sub => !sub.isCorrect);
      finalMistakeCount = incorrectSubmissions.length;
    }
    
    // 计算总答题次数（包括重复作答）
    const totalAnswered = submissions.length;
    
    // 计算唯一题目的数量
    const uniqueAnswered = answeredQuestions.length;
    
    // 返回统计数据
    res.json({
      success: true,
      stats: {
        progressPercentage, // 整体学习进度百分比
        upcomingExamCount: upcomingExams.length,
        mistakeCount: finalMistakeCount,
        totalAnswered, // 总答题次数（包括重复）
        uniqueAnswered, // 不重复的题目数量
        totalQuestions  // 系统中题目总数
      }
    });
  } catch (error) {
    console.error('获取学生仪表盘统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

module.exports = router; 