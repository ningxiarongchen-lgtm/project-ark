/**
 * 认证与授权中间件
 * 提供 protect 和 authorize 中间件函数
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect 中间件 - 验证JWT令牌
 * 保护需要登录才能访问的路由
 */
exports.protect = async (req, res, next) => {
  let token;

  // 🔒 安全改进：优先从 HttpOnly Cookie 中读取 token，向后兼容 Bearer Token
  // 1. 首先尝试从 Cookie 中读取（更安全）
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  // 2. 如果 Cookie 中没有，尝试从 Authorization header 读取（向后兼容）
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized, no token' 
    });
  }

  try {
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 从令牌中获取用户信息
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // 检查用户是否处于激活状态
    if (!req.user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'User account is inactive' 
      });
    }

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized, token failed' 
    });
  }
};

/**
 * authorize 中间件 - 基于角色的访问控制
 * @param {...string} roles - 允许访问的角色列表
 * @returns {Function} Express 中间件函数
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // 检查用户是否存在（应该由 protect 中间件设置）
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, please login first'
      });
    }

    // 检查用户是否有角色
    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'User role not defined'
      });
    }

    // 检查用户角色是否在允许的角色列表中
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
        requiredRoles: roles
      });
    }

    // 用户已授权，继续处理请求
    next();
  };
};

