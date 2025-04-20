const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Submission = require('../models/Submission');
const { protect, authorize } = require('../middleware/auth');
// 恢复引入bcryptjs
const bcrypt = require('bcryptjs');
const { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser,
  getUserProfile,
  updateUserProfile
} = require('../controllers/userController');

// @route   GET /api/users/:id
// @desc    获取用户信息
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    更新用户个人资料
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    
    // 获取当前用户
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 验证邮箱是否已被其他用户使用
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: '该邮箱已被使用'
        });
      }
    }
    
    // 更新基本信息
    if (username) user.username = username;
    if (email) user.email = email;
    
    // 恢复密码更新功能
    if (newPassword && currentPassword) {
      // 验证当前密码
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: '当前密码不正确'
        });
      }
      
      // 加密新密码
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }
    
    // 保存更新
    await user.save();
    
    // 返回更新后的用户信息（不包含密码）
    const updatedUser = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('更新个人资料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    更新用户信息
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    // 确保用户只能更新自己的信息，除非是管理员
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限更新其他用户信息'
      });
    }

    const { username, email, profile } = req.body;
    
    // 构建更新对象
    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (profile) updateFields.profile = profile;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// @route   GET /api/users/:id/progress
// @desc    获取用户学习进度
// @access  Private
router.get('/:id/progress', protect, async (req, res) => {
  try {
    // 确保用户只能查看自己的进度，除非是教师
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: '无权限查看其他用户的学习进度'
      });
    }

    // 获取用户答题记录
    const submissions = await Submission.find({ user: req.params.id })
      .populate('question', 'title category difficulty')
      .sort({ submittedAt: -1 });

    // 计算正确率
    const totalSubmissions = submissions.length;
    const correctSubmissions = submissions.filter(sub => sub.isCorrect).length;
    const accuracy = totalSubmissions > 0 ? (correctSubmissions / totalSubmissions) * 100 : 0;

    // 按类别统计
    const categoryStats = {};
    submissions.forEach(sub => {
      const category = sub.question.category;
      if (!categoryStats[category]) {
        categoryStats[category] = {
          total: 0,
          correct: 0,
          accuracy: 0
        };
      }
      categoryStats[category].total += 1;
      if (sub.isCorrect) {
        categoryStats[category].correct += 1;
      }
    });

    // 计算每个类别的正确率
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category];
      stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    });

    res.json({
      success: true,
      progress: {
        totalSubmissions,
        correctSubmissions,
        accuracy,
        categoryStats,
        recentSubmissions: submissions.slice(0, 10) // 最近10次答题记录
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

// 公开路由
router.post('/', createUser);

// 受保护的路由 - 需要登录
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// 受保护的路由 - 需要管理员权限
router.get('/', protect, authorize('admin', 'teacher'), getAllUsers);
router.get('/:id', protect, authorize('admin', 'teacher'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router; 