const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Question = require('../models/Question');
const Tag = require('../models/Tag');
// const Exam = require('../models/Exam'); // 注释掉考试模型导入
const Submission = require('../models/Submission');
const MistakeRecord = require('../models/MistakeRecord');
const User = require('../models/User');
const LearningProgress = require('../models/LearningProgress');

// @route   GET /api/stats/dashboard
// @desc    获取教师仪表盘统计数据
// @access  Private/Teacher
router.get('/dashboard', protect, authorize('teacher'), async (req, res) => {
  try {
    // 并行请求所有统计数据以提高性能
    const [questionCount, tagCount] = await Promise.all([
      // 获取教师创建的题目数量
      Question.countDocuments({ creator: req.user.id }),
      
      // 注释掉考试数量统计
      // 获取教师创建的考试数量（假设Exam模型中有creator字段）
      // Exam.countDocuments({ creator: req.user.id }),
      
      // 获取系统中所有课程的数量（课程通常是全局共享的）
      Tag.countDocuments()
    ]);
    
    res.json({
      success: true,
      stats: {
        questionCount,
        // examCount, // 注释掉考试数量
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
    const userId = req.user.id;
    
    // 首先检查用户是否有提交记录
    const hasSubmissions = await Submission.exists({ user: userId });
    
    // 如果用户没有任何提交记录，直接返回零值统计数据
    if (!hasSubmissions) {
      return res.json({
        success: true,
        stats: {
          progressPercentage: 0,
          upcomingExamCount: 0,
          mistakeCount: 0,
          totalAnswered: 0,
          uniqueAnswered: 0,
          totalQuestions: await Question.countDocuments(),
          correctAnswers: 0,
          averageScore: 0,
          tagMastery: [],
          strongTopics: [],
          weakTopics: [],
          lastUpdated: now,
          isNewUser: true // 标识这是新用户数据
        }
      });
    }
    
    // 并行请求所有统计数据以提高性能
    const [submissions, totalQuestions, mistakeCount, progressRecord] = await Promise.all([
      // 获取学生的所有提交记录（用于计算基本统计）
      Submission.find({ user: userId }),
      
      // 获取系统中总题目数量（用于计算学习进度）
      Question.countDocuments(),
      
      // 获取学生的错题数量（未标记为已解决的）
      MistakeRecord.countDocuments({ 
        user: userId,
        resolved: false
      }),
      
      // 获取用户的学习进度记录（包含更详细的统计数据）
      LearningProgress.findOne({ user: userId })
    ]);
    
    // 如果已有详细的学习进度记录且在24小时内更新过，优先使用该记录
    if (progressRecord && 
        progressRecord.lastUpdated && 
        (now - new Date(progressRecord.lastUpdated)) < 24 * 60 * 60 * 1000) {
      // 返回学习进度记录中的统计数据（更详细）
      return res.json({
        success: true,
        stats: {
          progressPercentage: progressRecord.progressPercentage,
          upcomingExamCount: 0, // 将考试数量设为0
          mistakeCount: mistakeCount,
          totalAnswered: progressRecord.totalAnswered,
          uniqueAnswered: progressRecord.uniqueAnswered,
          totalQuestions,
          correctAnswers: progressRecord.correctAnswers,
          averageScore: progressRecord.averageScore,
          tagMastery: progressRecord.tagMastery,
          strongTopics: progressRecord.strongTopics,
          weakTopics: progressRecord.weakTopics,
          lastUpdated: progressRecord.lastUpdated,
          isNewUser: false
        }
      });
    }
    
    // 如果没有详细记录或记录已过期，计算基本的统计数据
    // 计算学习进度百分比（已答题数量 / 总题目数量）
    const answeredQuestions = await Submission.find({ 
      user: userId 
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
    
    // 计算正确答题数
    const correctAnswers = submissions.filter(sub => sub.isCorrect).length;
    
    // 计算平均分
    const averageScore = totalAnswered > 0 
      ? Math.round((correctAnswers / totalAnswered) * 100) 
      : 0;
    
    // 计算课程掌握情况（简单版本）
    const tagMastery = [];
    const tagMasteryMap = {};
    
    if (submissions.length > 0) {
      // 遍历所有提交记录
      for (const submission of submissions) {
        // 获取问题
        if (submission.question) {
          const questionId = submission.question;
          const question = await Question.findById(questionId).populate('tags', 'name');
          
          if (question && question.tags) {
            const isCorrect = submission.isCorrect;
            
            // 处理课程
            for (const tag of question.tags) {
              const tagName = typeof tag === 'object' ? tag.name : tag;
              
              if (!tagMasteryMap[tagName]) {
                tagMasteryMap[tagName] = { correct: 0, total: 0, exerciseCount: 0 };
              }
              
              tagMasteryMap[tagName].total += 1;
              tagMasteryMap[tagName].exerciseCount += 1;
              
              if (isCorrect) {
                tagMasteryMap[tagName].correct += 1;
              }
            }
          }
        }
      }
      
      // 转换为数组格式
      for (const [tag, data] of Object.entries(tagMasteryMap)) {
        tagMastery.push({
          tag,
          correct: data.correct,
          total: data.total,
          percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
          exerciseCount: data.exerciseCount
        });
      }
    }
    
    // 找出强项和弱项（至少有3个问题）
    const strongTopics = tagMastery
      .filter(item => item.total >= 3 && item.percentage >= 80)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)
      .map(({ tag, percentage }) => ({ tag, percentage }));
      
    const weakTopics = tagMastery
      .filter(item => item.total >= 3 && item.percentage < 60)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 5)
      .map(({ tag, percentage }) => ({ tag, percentage }));
    
    // 触发异步更新学习进度记录（不等待完成）
    updateLearningProgressAsync(userId);
    
    // 返回基本统计数据
    res.json({
      success: true,
      stats: {
        progressPercentage, // 整体学习进度百分比
        upcomingExamCount: 0, // 将考试数量设为0
        mistakeCount: finalMistakeCount,
        totalAnswered, // 总答题次数（包括重复）
        uniqueAnswered, // 不重复的题目数量
        totalQuestions,  // 系统中题目总数
        correctAnswers,  // 正确答题数
        averageScore,    // 平均分
        tagMastery,      // 课程掌握情况
        strongTopics,    // 强项课程
        weakTopics,      // 弱项课程
        lastUpdated: now,
        isNewUser: false
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

// @route   POST /api/stats/update-progress
// @desc    更新用户学习进度
// @access  Private
router.post('/update-progress', protect, async (req, res) => {
  try {
    const now = new Date();
    const userId = req.user.id;
    
    // 并行请求所有统计数据以提高性能
    const [submissions, totalQuestions, mistakeCount] = await Promise.all([
      // 获取学生的所有提交记录
      Submission.find({ user: userId })
        .populate({
          path: 'question', 
          select: 'title category difficulty tags',
          populate: { path: 'tags', select: 'name' }
        }),
      
      // 获取系统中总题目数量（用于计算学习进度）
      Question.countDocuments(),
      
      // 获取学生的错题数量（未标记为已解决的）
      MistakeRecord.countDocuments({ 
        user: userId,
        resolved: false
      })
    ]);
    
    // 计算学习进度百分比（已答题数量 / 总题目数量）
    // 使用distinct查询来确保每个题目只计算一次，重复回答同一题目只算作一次
    const answeredQuestions = await Submission.find({ 
      user: userId 
    }).distinct('question');
    
    const progressPercentage = totalQuestions > 0 
      ? Math.round((answeredQuestions.length / totalQuestions) * 100) 
      : 0;
    
    // 计算总答题次数（包括重复作答）
    const totalAnswered = submissions.length;
    
    // 计算唯一题目的数量
    const uniqueAnswered = answeredQuestions.length;
    
    // 计算正确答题数
    const correctAnswers = submissions.filter(sub => sub.isCorrect).length;
    
    // 计算平均分
    const averageScore = totalAnswered > 0 
      ? (correctAnswers / totalAnswered) * 100 
      : 0;
      
    // 处理课程掌握情况
    const tagMasteryMap = {};
    
    submissions.forEach(submission => {
      if (submission.question && submission.question.tags) {
        const isCorrect = submission.isCorrect;
        const tags = submission.question.tags;
        
        // 确保课程是数组
        const tagList = Array.isArray(tags) ? tags : [tags];
        
        tagList.forEach(tagItem => {
          // 处理课程对象或字符串
          const tagName = typeof tagItem === 'object' ? 
            (tagItem.name || 'unknown') : tagItem;
          
          if (!tagMasteryMap[tagName]) {
            tagMasteryMap[tagName] = { 
              correct: 0, 
              total: 0, 
              exerciseCount: 0 
            };
          }
          
          tagMasteryMap[tagName].total += 1;
          tagMasteryMap[tagName].exerciseCount += 1;
          
          if (isCorrect) {
            tagMasteryMap[tagName].correct += 1;
          }
        });
      }
    });
    
    // 计算课程掌握百分比
    const tagMastery = Object.entries(tagMasteryMap).map(([tag, data]) => ({
      tag,
      correct: data.correct,
      total: data.total,
      percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      exerciseCount: data.exerciseCount
    }));
    
    // 找出强项和弱项（至少有3个问题）
    const strongTopics = tagMastery
      .filter(item => item.total >= 3 && item.percentage >= 80)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)
      .map(({ tag, percentage }) => ({ tag, percentage }));
      
    const weakTopics = tagMastery
      .filter(item => item.total >= 3 && item.percentage < 60)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 5)
      .map(({ tag, percentage }) => ({ tag, percentage }));
    
    // 使用findOneAndUpdate替代find+save方式，防止版本冲突
    const progressRecord = await LearningProgress.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          progressPercentage: progressPercentage,
          uniqueAnswered: uniqueAnswered,
          totalAnswered: totalAnswered,
          correctAnswers: correctAnswers,
          averageScore: averageScore,
          tagMastery: tagMastery,
          strongTopics: strongTopics,
          weakTopics: weakTopics,
          lastUpdated: now
        }
      },
      { new: true, upsert: true }
    );
    
    // 返回更新后的学习进度数据
    res.json({
      success: true,
      message: '学习进度已更新',
      progress: progressRecord
    });
  } catch (error) {
    console.error('更新学习进度失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，更新学习进度失败'
    });
  }
});

// 异步更新学习进度记录
async function updateLearningProgressAsync(userId) {
  try {
    // 创建异步任务，更新用户的学习进度记录
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) return;
    
    // 这是一个模拟的请求处理函数，直接调用更新逻辑
    const now = new Date();
    
    // 并行请求所有统计数据以提高性能
    const [submissions, totalQuestions] = await Promise.all([
      // 获取学生的所有提交记录
      Submission.find({ user: userId })
        .populate({
          path: 'question', 
          select: 'title category difficulty tags',
          populate: { path: 'tags', select: 'name' }
        }),
      
      // 获取系统中总题目数量（用于计算学习进度）
      Question.countDocuments()
    ]);
    
    // 计算学习进度百分比（已答题数量 / 总题目数量）
    const answeredQuestions = await Submission.find({ 
      user: userId 
    }).distinct('question');
    
    const progressPercentage = totalQuestions > 0 
      ? Math.round((answeredQuestions.length / totalQuestions) * 100) 
      : 0;
    
    // 计算总答题次数（包括重复作答）
    const totalAnswered = submissions.length;
    
    // 计算唯一题目的数量
    const uniqueAnswered = answeredQuestions.length;
    
    // 计算正确答题数
    const correctAnswers = submissions.filter(sub => sub.isCorrect).length;
    
    // 计算平均分
    const averageScore = totalAnswered > 0 
      ? (correctAnswers / totalAnswered) * 100 
      : 0;
      
    // 处理课程掌握情况
    const tagMasteryMap = {};
    
    submissions.forEach(submission => {
      if (submission.question && submission.question.tags) {
        const isCorrect = submission.isCorrect;
        const tags = submission.question.tags;
        
        // 确保课程是数组
        const tagList = Array.isArray(tags) ? tags : [tags];
        
        tagList.forEach(tagItem => {
          // 处理课程对象或字符串
          const tagName = typeof tagItem === 'object' ? 
            (tagItem.name || 'unknown') : tagItem;
          
          if (!tagMasteryMap[tagName]) {
            tagMasteryMap[tagName] = { 
              correct: 0, 
              total: 0, 
              exerciseCount: 0 
            };
          }
          
          tagMasteryMap[tagName].total += 1;
          tagMasteryMap[tagName].exerciseCount += 1;
          
          if (isCorrect) {
            tagMasteryMap[tagName].correct += 1;
          }
        });
      }
    });
    
    // 计算课程掌握百分比
    const tagMastery = Object.entries(tagMasteryMap).map(([tag, data]) => ({
      tag,
      correct: data.correct,
      total: data.total,
      percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      exerciseCount: data.exerciseCount
    }));
    
    // 找出强项和弱项（至少有3个问题）
    const strongTopics = tagMastery
      .filter(item => item.total >= 3 && item.percentage >= 80)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)
      .map(({ tag, percentage }) => ({ tag, percentage }));
      
    const weakTopics = tagMastery
      .filter(item => item.total >= 3 && item.percentage < 60)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 5)
      .map(({ tag, percentage }) => ({ tag, percentage }));
    
    // 使用findOneAndUpdate替代find+save，以避免并发更新问题
    // 使用{ new: true, upsert: true }确保返回更新后的文档，且如果文档不存在则创建
    // 添加重试机制
    let maxRetries = 3;
    let retryCount = 0;
    let success = false;
    
    while (!success && retryCount < maxRetries) {
      try {
        // 使用findOneAndUpdate替代find+save方式，防止版本冲突
        const updatedRecord = await LearningProgress.findOneAndUpdate(
          { user: userId },
          {
            $set: {
              progressPercentage: progressPercentage,
              uniqueAnswered: uniqueAnswered,
              totalAnswered: totalAnswered,
              correctAnswers: correctAnswers,
              averageScore: averageScore,
              tagMastery: tagMastery,
              strongTopics: strongTopics,
              weakTopics: weakTopics,
              lastUpdated: now
            }
          },
          { new: true, upsert: true }
        );
        
        success = true;
        console.log(`已异步更新用户 ${userId} 的学习进度记录`, `(尝试 ${retryCount + 1}/${maxRetries})`);
      } catch (updateError) {
        retryCount++;
        console.error(`更新学习进度记录失败 (尝试 ${retryCount}/${maxRetries}):`, updateError.message);
        
        // 如果已经尝试了最大次数，则抛出错误
        if (retryCount >= maxRetries) {
          throw updateError;
        }
        
        // 添加短暂延迟后重试
        await new Promise(resolve => setTimeout(resolve, 200 * retryCount));
      }
    }
  } catch (error) {
    console.error('异步更新学习进度失败:', error);
  }
}

module.exports = { 
  router,
  updateLearningProgressAsync
}; 