const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Question = require('../models/Question');
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

    if (question.type === 'objective') {
      // 客观题判分
      if (Array.isArray(question.answer) && Array.isArray(userAnswer)) {
        // 多选题
        isCorrect = question.answer.length === userAnswer.length &&
          question.answer.every(ans => userAnswer.includes(ans));
      } else {
        // 单选题
        isCorrect = question.answer === userAnswer;
      }
      score = isCorrect ? 100 : 0;
    } else {
      // 主观题默认需要人工评分或LLM评分
      // 这里暂时设为0分，后续会通过LLM进行评分
      score = 0;
    }

    // 创建提交记录
    const submission = new Submission({
      user: req.user._id,
      question: questionId,
      userAnswer,
      isCorrect,
      score,
      timeSpent
    });

    await submission.save();

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