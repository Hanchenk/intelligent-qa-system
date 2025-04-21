const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Bookmark = require('../models/Bookmark');

// @route   GET /api/bookmarks
// @desc    获取用户的所有收藏
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.id }).sort({ timestamp: -1 });
    
    res.json({
      success: true,
      count: bookmarks.length,
      data: bookmarks
    });
  } catch (error) {
    console.error('获取收藏失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取收藏'
    });
  }
});

// @route   POST /api/bookmarks
// @desc    创建收藏
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { exerciseId, exerciseTitle, tags } = req.body;
    
    if (!exerciseId || !exerciseTitle) {
      return res.status(400).json({
        success: false,
        message: '练习ID和标题是必填项'
      });
    }
    
    // 检查是否已收藏
    const existingBookmark = await Bookmark.findOne({
      user: req.user.id,
      exerciseId
    });
    
    if (existingBookmark) {
      return res.status(400).json({
        success: false,
        message: '该练习已被收藏'
      });
    }
    
    // 创建新收藏
    const bookmark = await Bookmark.create({
      user: req.user.id,
      exerciseId,
      exerciseTitle,
      tags: tags || []
    });
    
    res.status(201).json({
      success: true,
      data: bookmark
    });
  } catch (error) {
    console.error('创建收藏失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法创建收藏'
    });
  }
});

// @route   DELETE /api/bookmarks/:id
// @desc    删除收藏
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const bookmark = await Bookmark.findById(req.params.id);
    
    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: '未找到该收藏'
      });
    }
    
    // 确保是用户自己的收藏
    if (bookmark.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权删除其他用户的收藏'
      });
    }
    
    await bookmark.deleteOne();
    
    res.json({
      success: true,
      message: '收藏已删除'
    });
  } catch (error) {
    console.error('删除收藏失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法删除收藏'
    });
  }
});

// @route   DELETE /api/bookmarks/exercise/:exerciseId
// @desc    通过练习ID删除收藏
// @access  Private
router.delete('/exercise/:exerciseId', protect, async (req, res) => {
  try {
    const bookmark = await Bookmark.findOne({
      user: req.user.id,
      exerciseId: req.params.exerciseId
    });
    
    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: '未找到该收藏'
      });
    }
    
    await bookmark.deleteOne();
    
    res.json({
      success: true,
      message: '收藏已删除'
    });
  } catch (error) {
    console.error('删除收藏失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法删除收藏'
    });
  }
});

module.exports = router; 