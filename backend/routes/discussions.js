const express = require('express');
const router = express.Router();
const Discussion = require('../models/Discussion');
const { protect } = require('../middleware/auth');

// @route   POST /api/discussions
// @desc    创建新讨论
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, questionId } = req.body;

    const discussion = new Discussion({
      title,
      content,
      author: req.user._id,
      question: questionId || null
    });

    await discussion.save();

    res.status(201).json({
      success: true,
      discussion
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   GET /api/discussions
// @desc    获取讨论列表
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { questionId, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (questionId) query.question = questionId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const discussions = await Discussion.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('author', 'username')
      .populate('question', 'title');

    const total = await Discussion.countDocuments(query);

    res.json({
      success: true,
      data: {
        discussions,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   GET /api/discussions/:id
// @desc    获取讨论详情
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('author', 'username')
      .populate('question', 'title')
      .populate('replies.author', 'username');

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: '讨论不存在'
      });
    }

    res.json({
      success: true,
      discussion
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   POST /api/discussions/:id/replies
// @desc    添加回复
// @access  Private
router.post('/:id/replies', protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '回复内容不能为空'
      });
    }

    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: '讨论不存在'
      });
    }

    const reply = {
      content,
      author: req.user._id,
      createdAt: Date.now()
    };

    discussion.replies.push(reply);
    await discussion.save();

    // 重新查询以获取填充的作者信息
    const updatedDiscussion = await Discussion.findById(req.params.id)
      .populate('author', 'username')
      .populate('replies.author', 'username');

    res.json({
      success: true,
      discussion: updatedDiscussion
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