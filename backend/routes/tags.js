const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');
const Question = require('../models/Question');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/tags
// @desc    创建新课程
// @access  Private/Teacher
router.post('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const { name, description, color } = req.body;

    // 检查课程是否已存在
    const existingTag = await Tag.findOne({ name: name.trim() });
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: '该课程名称已存在'
      });
    }

    // 创建新课程
    const tag = new Tag({
      name: name.trim(),
      description: description || '',
      color: color || '#1976d2',
      creator: req.user._id
    });

    await tag.save();

    res.status(201).json({
      success: true,
      data: tag
    });
  } catch (error) {
    console.error('创建课程出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// @route   GET /api/tags
// @desc    获取课程列表
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search } = req.query;
    
    // 构建查询条件
    let query = {};
    
    // 根据用户角色筛选
    if (req.user.role === 'teacher') {
      // 教师可以看到自己创建的课程和全局课程
      query.$or = [
        { creator: req.user._id },
        { isGlobal: true }
      ];
    }
    
    // 添加搜索条件
    if (search) {
      query.$and = [
        query.$or ? { $or: query.$or } : {},
        { $text: { $search: search } }
      ];
      delete query.$or;
    }

    // 获取课程列表
    const tags = await Tag.find(query)
      .sort({ useCount: -1, name: 1 })
      .populate('creator', 'username');

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('获取课程列表出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// @route   GET /api/tags/:id
// @desc    获取课程详情
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id).populate('creator', 'username');

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }

    // 检查权限
    if (req.user.role === 'teacher' && 
        tag.creator.toString() !== req.user._id.toString() && 
        !tag.isGlobal) {
      return res.status(403).json({
        success: false,
        message: '无权访问此课程'
      });
    }

    res.json({
      success: true,
      data: tag
    });
  } catch (error) {
    console.error('获取课程详情出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// @route   PUT /api/tags/:id
// @desc    更新课程
// @access  Private/Teacher
router.put('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }

    // 检查权限
    if (tag.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权修改此课程'
      });
    }

    const { name, description, color } = req.body;

    // 检查课程名是否重复
    if (name && name.trim() !== tag.name) {
      const existingTag = await Tag.findOne({ name: name.trim() });
      if (existingTag) {
        return res.status(400).json({
          success: false,
          message: '该课程名称已存在'
        });
      }
    }

    // 更新课程
    tag.name = name ? name.trim() : tag.name;
    tag.description = description !== undefined ? description : tag.description;
    tag.color = color || tag.color;

    await tag.save();

    res.json({
      success: true,
      data: tag
    });
  } catch (error) {
    console.error('更新课程出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// @route   DELETE /api/tags/:id
// @desc    删除课程
// @access  Private/Teacher
router.delete('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }

    // 检查权限
    if (tag.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权删除此课程'
      });
    }

    // 检查课程是否在使用中
    const questionCount = await Question.countDocuments({ tags: tag.name });
    if (questionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `该课程已被 ${questionCount} 个题目使用，无法删除`
      });
    }

    await tag.deleteOne();

    res.json({
      success: true,
      message: '课程已删除'
    });
  } catch (error) {
    console.error('删除课程出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// @route   GET /api/tags/stats/popular
// @desc    获取热门课程
// @access  Private
router.get('/stats/popular', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // 构建查询条件
    let query = {};
    
    // 根据用户角色筛选
    if (req.user.role === 'teacher') {
      // 教师可以看到自己创建的课程和全局课程
      query.$or = [
        { creator: req.user._id },
        { isGlobal: true }
      ];
    }
    
    // 获取使用次数最多的课程
    const popularTags = await Tag.find(query)
      .sort({ useCount: -1 })
      .limit(parseInt(limit))
      .select('name color useCount');

    res.json({
      success: true,
      data: popularTags
    });
  } catch (error) {
    console.error('获取热门课程出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

module.exports = router; 