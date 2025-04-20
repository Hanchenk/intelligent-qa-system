const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * 获取所有用户
 * @route GET /api/users
 * @access Private (Admin, Teacher)
 */
exports.getAllUsers = async (req, res) => {
  try {
    // 支持简单过滤和分页
    const { role, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // 查询条件
    const query = {};
    if (role) {
      query.role = role;
    }
    
    // 执行查询，排除密码字段
    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    // 获取总用户数
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: users.length,
      total,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取用户列表'
    });
  }
};

/**
 * 根据ID获取单个用户
 * @route GET /api/users/:id
 * @access Private (Admin, Teacher)
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '未找到该用户'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取用户'
    });
  }
};

/**
 * 创建新用户
 * @route POST /api/users
 * @access Public (用于注册)
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已注册'
      });
    }
    
    // 创建用户
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student' // 默认为学生角色
    });
    
    // 返回不包含密码的用户信息
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
    
    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法创建用户'
    });
  }
};

/**
 * 更新用户信息
 * @route PUT /api/users/:id
 * @access Private (Admin)
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    
    // 查找用户
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '未找到该用户'
      });
    }
    
    // 如果邮箱变更，验证新邮箱是否已存在
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '该邮箱已被使用'
        });
      }
    }
    
    // 准备更新的字段
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (role) updateFields.role = role;
    
    // 如果提供了新密码，则加密
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }
    
    // 更新用户
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法更新用户'
    });
  }
};

/**
 * 删除用户
 * @route DELETE /api/users/:id
 * @access Private (Admin)
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '未找到该用户'
      });
    }
    
    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      message: '用户已成功删除'
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法删除用户'
    });
  }
};

/**
 * 获取当前登录用户的个人资料
 * @route GET /api/users/profile
 * @access Private
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '未找到用户'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户资料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法获取用户资料'
    });
  }
};

/**
 * 更新当前登录用户的个人资料
 * @route PUT /api/users/profile
 * @access Private
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    
    // 查找用户
    let user = await User.findById(req.user.id);
    
    // 准备更新的字段
    const updateFields = {};
    if (name) updateFields.name = name;
    
    // 如果要更改邮箱，验证新邮箱是否已存在
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '该邮箱已被使用'
        });
      }
      
      updateFields.email = email;
    }
    
    // 如果要更改密码
    if (newPassword) {
      // 验证当前密码
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: '请提供当前密码'
        });
      }
      
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: '当前密码不正确'
        });
      }
      
      // 加密新密码
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(newPassword, salt);
    }
    
    // 更新用户
    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('更新用户资料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，无法更新用户资料'
    });
  }
}; 