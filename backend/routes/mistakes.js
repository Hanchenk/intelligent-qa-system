const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const MistakeRecord = require('../models/MistakeRecord');
const Question = require('../models/Question');

// @route   GET /api/mistakes
// @desc    获取用户的错题本列表
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { resolved } = req.query;
    const filter = { user: req.user.id };
    
    // 如果指定了resolved参数，添加到过滤条件
    if (resolved !== undefined) {
      filter.resolved = resolved === 'true';
    }
    
    // 查找错题记录并填充题目信息
    const mistakes = await MistakeRecord.find(filter)
      .populate({
        path: 'question',
        select: 'title type difficulty options correctAnswer explanation tags',
        populate: {
          path: 'tags',
          select: 'name'
        }
      })
      .populate({
        path: 'submission',
        select: 'userAnswer score submittedAt'
      })
      .sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      count: mistakes.length,
      data: mistakes
    });
  } catch (error) {
    console.error('获取错题本失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   PUT /api/mistakes/:id
// @desc    更新错题记录（添加笔记或标记为已解决）
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { notes, resolved } = req.body;
    const updateData = { updatedAt: new Date() };
    
    // 只更新提供的字段
    if (notes !== undefined) updateData.notes = notes;
    if (resolved !== undefined) updateData.resolved = resolved;
    
    // 查找并更新错题记录
    const mistake = await MistakeRecord.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updateData,
      { new: true }
    );
    
    if (!mistake) {
      return res.status(404).json({
        success: false,
        message: '未找到错题记录或无权限修改'
      });
    }
    
    res.json({
      success: true,
      data: mistake
    });
  } catch (error) {
    console.error('更新错题记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   DELETE /api/mistakes/:id
// @desc    删除错题记录
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const mistake = await MistakeRecord.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!mistake) {
      return res.status(404).json({
        success: false,
        message: '未找到错题记录或无权限删除'
      });
    }
    
    res.json({
      success: true,
      message: '错题记录已删除'
    });
  } catch (error) {
    console.error('删除错题记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   POST /api/mistakes/add/:questionId
// @desc    手动添加题目到错题本
// @access  Private
router.post('/add/:questionId', protect, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { notes } = req.body;
    
    // 验证题目是否存在
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }
    
    // 检查是否已在错题本中
    let mistake = await MistakeRecord.findOne({
      user: req.user.id,
      question: questionId
    });
    
    if (mistake) {
      // 如果已存在，更新记录
      mistake.notes = notes || mistake.notes;
      mistake.resolved = false; // 如果手动添加，重置已解决状态
      mistake.updatedAt = new Date();
      await mistake.save();
    } else {
      // 如果不存在，创建新记录
      mistake = new MistakeRecord({
        user: req.user.id,
        question: questionId,
        notes: notes || '',
        resolved: false
      });
      await mistake.save();
    }
    
    res.status(201).json({
      success: true,
      data: mistake
    });
  } catch (error) {
    console.error('添加错题失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 