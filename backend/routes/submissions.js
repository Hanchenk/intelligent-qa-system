const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Question = require('../models/Question');
const MistakeRecord = require('../models/MistakeRecord');
const { protect } = require('../middleware/auth');

// @route   POST /api/submissions
// @desc    提交答案
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { questionId, userAnswer, timeSpent } = req.body;

    // 获取题目信息
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    // 判断答案是否正确
    let isCorrect = false;
    let score = 0;

    if (question.type === '单选题' || question.type === '多选题') {
      // 选择题判分
      if (question.type === '多选题' && Array.isArray(userAnswer)) {
        // 检查每个正确选项是否被选中，且没有选中错误选项
        const correctOptions = question.options
          .filter(opt => opt.isCorrect)
          .map(opt => opt._id.toString());
        
        const userSelectedIds = Array.isArray(userAnswer) 
          ? userAnswer.map(id => id.toString()) 
          : [];
        
        isCorrect = correctOptions.length === userSelectedIds.length &&
          correctOptions.every(id => userSelectedIds.includes(id)) &&
          userSelectedIds.every(id => correctOptions.includes(id));
      } else if (question.type === '单选题') {
        // 单选题，检查选中的选项是否是正确选项
        const correctOptionId = question.options
          .find(opt => opt.isCorrect)?._id?.toString();
        
        isCorrect = correctOptionId === userAnswer.toString();
      }
    } else if (question.type === '判断题') {
      // 判断题判分
      isCorrect = question.correctAnswer === userAnswer;
    } else {
      // 其他题型（填空题、简答题、编程题等）暂时使用人工评分或LLM评分
      // 这里默认设为未正确，等待评分
      isCorrect = false;
    }

    // 根据正确与否设置分数
    score = isCorrect ? question.score || 100 : 0;

    // 创建提交记录
    const submission = new Submission({
      user: req.user.id,
      question: questionId,
      userAnswer,
      isCorrect,
      score,
      timeSpent
    });

    await submission.save();

    // 如果答案错误，添加到错题本
    if (!isCorrect) {
      try {
        // 使用upsert操作，如果记录已存在则更新，不存在则创建
        await MistakeRecord.findOneAndUpdate(
          { user: req.user.id, question: questionId },
          { 
            user: req.user.id, 
            question: questionId,
            submission: submission._id,
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('添加错题记录失败:', err);
        // 不影响主流程，所以这里只记录错误，不返回错误响应
      }
    }

    res.status(201).json({
      success: true,
      submission,
      isCorrect,
      score
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   GET /api/submissions/user/:userId
// @desc    获取用户答题记录
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: '无权限查看其他用户的答题记录'
      });
    }

    const submissions = await Submission.find({ user: req.params.userId })
      .populate('question', 'title content type difficulty')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   GET /api/submissions/question/:questionId
// @desc    获取题目所有提交记录(教师权限)
// @access  Private/Teacher
router.get('/question/:questionId', protect, async (req, res) => {
  try {
    // 只有教师可以查看题目的所有提交记录
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: '无权限查看此资源'
      });
    }

    const submissions = await Submission.find({ question: req.params.questionId })
      .populate('user', 'username')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 