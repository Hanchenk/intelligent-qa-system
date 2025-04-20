const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');
const Question = require('../models/Question');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/tags
// @desc    创建新标签
// @access  Private/Teacher
router.post('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const { name, description, color } = req.body;

    // 检查标签是否已存在
    const existingTag = await Tag.findOne({ name: name.trim() });
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: '该标签名称已存在'
      });
    }

    // 创建新标签
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
    console.error('创建标签出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// @route   GET /api/tags
// @desc    获取标签列表
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search } = req.query;
    
    // 构建查询条件
    let query = {};
    
    // 根据用户角色筛选
    if (req.user.role === 'teacher') {
      // 教师可以看到自己创建的标签和全局标签
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

    // 获取标签列表
    const tags = await Tag.find(query)
      .sort({ useCount: -1, name: 1 })
      .populate('creator', 'username');

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('获取标签列表出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// @route   GET /api/tags/:id
// @desc    获取标签详情
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id).populate('creator', 'username');

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '标签不存在'
      });
    }

    // 检查权限
    if (req.user.role === 'teacher' && 
        tag.creator.toString() !== req.user._id.toString() && 
        !tag.isGlobal) {
      return res.status(403).json({
        success: false,
        message: '无权访问此标签'
      });
    }

    res.json({
      success: true,
      data: tag
    });
  } catch (error) {
    console.error('获取标签详情出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// @route   PUT /api/tags/:id
// @desc    更新标签
// @access  Private/Teacher
router.put('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '标签不存在'
      });
    }

    // 检查权限
    if (tag.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权修改此标签'
      });
    }

    const { name, description, color } = req.body;

    // 检查标签名是否重复
    if (name && name.trim() !== tag.name) {
      const existingTag = await Tag.findOne({ name: name.trim() });
      if (existingTag) {
        return res.status(400).json({
          success: false,
          message: '该标签名称已存在'
        });
      }
    }

    // 更新标签
    tag.name = name ? name.trim() : tag.name;
    tag.description = description !== undefined ? description : tag.description;
    tag.color = color || tag.color;

    await tag.save();

    res.json({
      success: true,
      data: tag
    });
  } catch (error) {
    console.error('更新标签出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// @route   DELETE /api/tags/:id
// @desc    删除标签
// @access  Private/Teacher
router.delete('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: '标签不存在'
      });
    }

    // 检查权限
    if (tag.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权删除此标签'
      });
    }

    // 检查标签是否在使用中
    const questionCount = await Question.countDocuments({ tags: tag.name });
    if (questionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `该标签已被 ${questionCount} 个题目使用，无法删除`
      });
    }

    await tag.deleteOne();

    res.json({
      success: true,
      message: '标签已删除'
    });
  } catch (error) {
    console.error('删除标签出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// @route   GET /api/tags/stats/popular
// @desc    获取热门标签
// @access  Private
router.get('/stats/popular', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // 构建查询条件
    let query = {};
    
    // 根据用户角色筛选
    if (req.user.role === 'teacher') {
      // 教师可以看到自己创建的标签和全局标签
      query.$or = [
        { creator: req.user._id },
        { isGlobal: true }
      ];
    }
    
    // 获取使用次数最多的标签
    const popularTags = await Tag.find(query)
      .sort({ useCount: -1 })
      .limit(parseInt(limit))
      .select('name color useCount');

    res.json({
      success: true,
      data: popularTags
    });
  } catch (error) {
    console.error('获取热门标签出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

module.exports = router; 