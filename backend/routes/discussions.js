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
    console.log('获取讨论列表请求 - 用户ID:', req.user._id);
    const { questionId, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (questionId) query.question = questionId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('执行查询:', JSON.stringify(query));
    
    const discussions = await Discussion.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('author', 'username role')
      .populate('question', 'title');

    const total = await Discussion.countDocuments(query);
    
    console.log(`找到${discussions.length}个讨论，总数${total}`);

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
    console.error('获取讨论列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

// @route   GET /api/discussions/:id
// @desc    获取讨论详情
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('author', 'username role')
      .populate('question', 'title')
      .populate('replies.author', 'username role');

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
      .populate('author', 'username role')
      .populate('replies.author', 'username role');

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

// @route   GET /api/discussions/test-data
// @desc    添加测试讨论数据
// @access  Public
router.get('/test-data', async (req, res) => {
  try {
    // 检查是否已有讨论
    const existingCount = await Discussion.countDocuments();
    
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: `已存在${existingCount}条讨论数据`,
        count: existingCount
      });
    }
    
    // 创建测试用户（如果不存在）
    const User = require('../models/User');
    let testUser = await User.findOne({ username: 'testuser' });
    
    if (!testUser) {
      testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123', // 实际应用中应该加密
        role: 'student'
      });
      await testUser.save();
    }
    
    // 创建测试讨论
    const testDiscussion = new Discussion({
      title: '测试讨论标题',
      content: '这是一个测试讨论内容，用于验证讨论功能是否正常工作。',
      author: testUser._id,
      replies: [
        {
          content: '这是一个测试回复',
          author: testUser._id,
          createdAt: new Date()
        }
      ]
    });
    
    await testDiscussion.save();
    
    res.json({
      success: true,
      message: '测试讨论数据已添加',
      discussion: testDiscussion
    });
  } catch (error) {
    console.error('添加测试数据失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 