const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Tag = require('../models/Tag');
const { protect, authorize } = require('../middleware/auth');
const mongoose = require('mongoose');

// @route   POST /api/questions
// @desc    创建新题目
// @access  Private/Teacher
router.post('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const {
      title,
      type,
      difficulty,
      score,
      options,
      correctAnswer,
      explanation,
      tags
    } = req.body;

    // 验证课程IDs
    if (tags && tags.length > 0) {
      // 验证所有课程ID是否有效
      for (const tagId of tags) {
        // 检查是否为有效的MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(tagId)) {
          return res.status(400).json({
            success: false,
            message: `课程ID格式无效: ${tagId}`
          });
        }

        // 检查课程是否存在且用户有权使用
        const tag = await Tag.findById(tagId);
        if (!tag) {
          return res.status(400).json({
            success: false,
            message: `课程ID不存在: ${tagId}`
          });
        }

        // 验证权限：教师只能使用自己创建的或全局课程
        if (req.user.role === 'teacher' && 
            tag.creator.toString() !== req.user._id.toString() && 
            !tag.isGlobal) {
          return res.status(403).json({
            success: false,
            message: `无权使用课程: ${tag.name}`
          });
        }
      }
    }

    // 创建新题目
    const question = new Question({
      title,
      type,
      difficulty,
      score,
      options,
      correctAnswer,
      explanation,
      tags,
      creator: req.user._id
    });

    await question.save();

    // 填充返回数据中的课程和创建者信息
    await question.populate('tags', 'name color');
    await question.populate('creator', 'username');

    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('创建题目出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// @route   GET /api/questions
// @desc    获取题目列表
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      type,
      difficulty,
      search,
      tags,
      page = 1,
      limit = 10
    } = req.query;

    // 构建查询条件
    let query = { isActive: true };
    
    // 根据角色筛选
    if (req.user.role === 'teacher') {
      // 教师可以看到自己创建的所有题目
      query.creator = req.user._id;
    }
    
    // 应用筛选条件
    if (type && type !== 'all') query.type = type;
    if (difficulty && difficulty !== 'all') query.difficulty = difficulty;
    
    // 课程筛选
    if (tags) {
      // 支持多个课程ID，以逗号分隔
      const tagIds = tags.split(',').filter(id => id.trim());
      if (tagIds.length > 0) {
        query.tags = { $in: tagIds };
      }
    }
    
    // 搜索
    if (search) {
      query.$text = { $search: search };
    }

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 查询题目
    const questions = await Question.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .select('-__v')
      .populate('creator', 'username')
      .populate('tags', 'name color');

    // 获取总数
    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取题目列表出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// @route   GET /api/questions/:id
// @desc    获取题目详情
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('creator', 'username')
      .populate('tags', 'name color description');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    // 权限检查：学生只能查看活动状态的题目
    if (req.user.role === 'student' && !question.isActive) {
      return res.status(403).json({
        success: false,
        message: '无权访问此题目'
      });
    }

    // 权限检查：教师只能查看自己创建的题目
    if (req.user.role === 'teacher' && question.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权访问此题目'
      });
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('获取题目详情出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// @route   PUT /api/questions/:id
// @desc    更新题目
// @access  Private/Teacher
router.put('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    // 检查是否是题目创建者
    if (question.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权限修改此题目'
      });
    }

    // 获取更新内容
    const {
      title,
      type,
      difficulty,
      score,
      options,
      correctAnswer,
      explanation,
      tags
    } = req.body;

    // 验证课程IDs
    if (tags && tags.length > 0) {
      // 验证所有课程ID是否有效
      for (const tagId of tags) {
        // 检查是否为有效的MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(tagId)) {
          return res.status(400).json({
            success: false,
            message: `课程ID格式无效: ${tagId}`
          });
        }

        // 检查课程是否存在且用户有权使用
        const tag = await Tag.findById(tagId);
        if (!tag) {
          return res.status(400).json({
            success: false,
            message: `课程ID不存在: ${tagId}`
          });
        }

        // 验证权限：教师只能使用自己创建的或全局课程
        if (req.user.role === 'teacher' && 
            tag.creator.toString() !== req.user._id.toString() && 
            !tag.isGlobal) {
          return res.status(403).json({
            success: false,
            message: `无权使用课程: ${tag.name}`
          });
        }
      }
    }

    // 更新题目
    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          title,
          type,
          difficulty,
          score,
          options,
          correctAnswer,
          explanation,
          tags
        }
      },
      { new: true, runValidators: true }
    ).populate('creator', 'username')
      .populate('tags', 'name color');

    res.json({
      success: true,
      data: updatedQuestion
    });
  } catch (error) {
    console.error('更新题目出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// @route   DELETE /api/questions/:id
// @desc    删除题目
// @access  Private/Teacher
router.delete('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    // 检查是否是题目创建者
    if (question.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权限删除此题目'
      });
    }

    // 如果题目已被使用，则标记为不活跃而非删除
    if (question.useCount > 0) {
      await Question.findByIdAndUpdate(req.params.id, { isActive: false });
    } else {
      // 删除题目前先减少关联课程的使用计数
      await question.deleteOne();
    }

    res.json({
      success: true,
      message: '题目已删除'
    });
  } catch (error) {
    console.error('删除题目出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// @route   GET /api/questions/stats/count
// @desc    获取题目统计信息
// @access  Private/Teacher
router.get('/stats/count', protect, authorize('teacher'), async (req, res) => {
  try {
    // 获取当前教师创建的题目总数
    const totalCount = await Question.countDocuments({ creator: req.user._id });
    
    // 按类型统计
    const typeStats = await Question.aggregate([
      { $match: { creator: req.user._id } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    // 按难度统计
    const difficultyStats = await Question.aggregate([
      { $match: { creator: req.user._id } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalCount,
        typeStats,
        difficultyStats
      }
    });
  } catch (error) {
    console.error('获取题目统计信息出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// @route   GET /api/questions/search
// @desc    搜索题目
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { query, type } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词'
      });
    }

    // 构建查询条件
    let searchQuery = {
      $text: { $search: query },
      isActive: true
    };
    
    // 根据角色筛选
    if (req.user.role === 'teacher') {
      searchQuery.creator = req.user._id;
    }
    
    // 按类型筛选
    if (type && type !== 'all') {
      searchQuery.type = type;
    }

    const questions = await Question.find(
      searchQuery,
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .populate('creator', 'username');

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('搜索题目出错:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

module.exports = router; 