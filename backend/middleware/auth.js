const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 保护路由，要求用户登录
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 检查Authorization头中的token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('收到带有token的请求:', req.path);
    }

    // 如果没有token，返回错误
    if (!token) {
      console.log('未提供token，拒绝访问:', req.path);
      return res.status(401).json({
        success: false,
        message: '未授权，请登录'
      });
    }

    try {
      // 验证token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token验证成功，用户ID:', decoded.id);

      // 查找用户
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        console.log('用户不存在，ID:', decoded.id);
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      console.log('用户已验证，角色:', user.role);
      // 将用户信息添加到req对象中
      req.user = user;
      next();
    } catch (error) {
      console.error('Token验证错误:', error);
      return res.status(401).json({
        success: false,
        message: '未授权，token无效'
      });
    }
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 角色授权
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      console.log('用户缺少角色信息，拒绝访问:', req.path);
      return res.status(403).json({
        success: false,
        message: '缺少角色信息，无法验证权限'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      console.log(`用户角色 ${req.user.role} 无权访问，需要角色:`, roles, '路径:', req.path);
      return res.status(403).json({
        success: false,
        message: '您没有访问此资源的权限'
      });
    }
    
    console.log(`用户角色 ${req.user.role} 已授权访问:`, req.path);
    next();
  };
}; 