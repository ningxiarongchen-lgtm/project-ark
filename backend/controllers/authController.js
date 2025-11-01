const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate Access Token (short-lived)
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '8h'
  });
};

// Generate Refresh Token (long-lived)
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d'
  });
};

// Save refresh token to database
const saveRefreshToken = async (userId, token, ipAddress) => {
  const expiresAt = new Date();
  const expireDays = parseInt(process.env.REFRESH_TOKEN_EXPIRE) || 7;
  expiresAt.setDate(expiresAt.getDate() + expireDays);

  const refreshToken = await RefreshToken.create({
    token,
    user: userId,
    expiresAt,
    createdByIp: ipAddress
  });

  return refreshToken;
};

// Clean up old refresh tokens for user (keep only last 5)
const cleanupOldTokens = async (userId) => {
  const tokens = await RefreshToken.find({ user: userId, isRevoked: false })
    .sort({ createdAt: -1 })
    .skip(5);
  
  if (tokens.length > 0) {
    await RefreshToken.updateMany(
      { _id: { $in: tokens.map(t => t._id) } },
      { isRevoked: true, revokedAt: new Date() }
    );
  }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Private/Admin
exports.register = async (req, res) => {
  try {
    const { phone, full_name, password, role, department } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ message: '该手机号已被注册' });
    }

    // Create user
    const user = await User.create({
      phone,
      full_name,
      password,
      role,
      department
    });

    if (user) {
      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
      
      // Save refresh token
      const ipAddress = req.ip || req.connection.remoteAddress;
      await saveRefreshToken(user._id, refreshToken, ipAddress);
      
      // 🔒 安全改进：使用 HttpOnly Cookie 存储 Token
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 8 * 60 * 60 * 1000
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      res.status(201).json({
        _id: user._id,
        phone: user.phone,
        full_name: user.full_name,
        role: user.role,
        message: 'User registered successfully'
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate phone and password
    if (!phone || !password) {
      return res.status(400).json({ message: '请提供手机号和密码' });
    }

    // Check for user
    const user = await User.findOne({ phone }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is inactive. Please contact administrator.' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Save refresh token
    const ipAddress = req.ip || req.connection.remoteAddress;
    await saveRefreshToken(user._id, refreshToken, ipAddress);
    
    // Clean up old tokens
    await cleanupOldTokens(user._id);

    // 🔒 安全改进：使用 HttpOnly Cookie 存储 Token，防止 XSS 攻击
    // 设置 accessToken cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,  // JavaScript 无法访问，防止 XSS
      secure: process.env.NODE_ENV === 'production',  // 生产环境使用 HTTPS
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // 生产环境跨域需要 none
      maxAge: 8 * 60 * 60 * 1000  // 8 小时（与 JWT 过期时间一致）
    });

    // 设置 refreshToken cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // 生产环境跨域需要 none
      maxAge: 7 * 24 * 60 * 60 * 1000  // 7 天
    });

    // 只返回用户信息，不返回 token（token 已经在 cookie 中）
    res.json({
      _id: user._id,
      phone: user.phone,
      full_name: user.full_name,
      role: user.role,
      department: user.department,
      passwordChangeRequired: user.passwordChangeRequired,
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.department = req.body.department || user.department;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        phone: updatedUser.phone
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Soft delete - just deactivate
      user.isActive = false;
      await user.save();
      res.json({ message: 'User deactivated successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/auth/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.role = req.body.role || user.role;
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    // 🔒 安全改进：从 Cookie 中读取 refreshToken
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Find the refresh token in database
    const storedToken = await RefreshToken.findOne({ 
      token: refreshToken,
      user: decoded.id 
    });

    if (!storedToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    // Check if token is revoked
    if (storedToken.isRevoked) {
      return res.status(401).json({ message: 'Refresh token has been revoked' });
    }

    // Check if token is expired
    if (storedToken.isExpired) {
      return res.status(401).json({ message: 'Refresh token has expired' });
    }

    // Verify user still exists and is active
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'User account is inactive' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    // Optionally rotate refresh token (more secure)
    const newRefreshToken = generateRefreshToken(user._id);
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Revoke old refresh token and save new one
    storedToken.revoke(ipAddress, newRefreshToken);
    await storedToken.save();
    await saveRefreshToken(user._id, newRefreshToken, ipAddress);

    // 🔒 安全改进：将新 token 写入 Cookie
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 8 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Revoke refresh token (logout)
// @route   POST /api/auth/revoke-token
// @access  Private
exports.revokeToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken) {
      return res.status(404).json({ message: 'Token not found' });
    }

    // Check if user owns this token
    if (storedToken.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to revoke this token' });
    }

    // Revoke the token
    const ipAddress = req.ip || req.connection.remoteAddress;
    storedToken.revoke(ipAddress);
    await storedToken.save();

    res.json({ 
      success: true, 
      message: 'Token revoked successfully' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user (revoke all tokens)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    const userId = req.user._id;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Revoke all active refresh tokens for this user
    await RefreshToken.updateMany(
      { user: userId, isRevoked: false },
      { 
        isRevoked: true, 
        revokedAt: new Date(),
        revokedByIp: ipAddress 
      }
    );

    // 🔒 安全改进：清除 Cookie 中的 token
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all active sessions (refresh tokens) for current user
// @route   GET /api/auth/sessions
// @access  Private
exports.getSessions = async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await RefreshToken.find({ 
      user: userId, 
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    }).select('createdByIp createdAt expiresAt').sort({ createdAt: -1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password (for logged-in user)
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '请提供当前密码和新密码' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: '新密码长度至少为6个字符' });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: '当前密码不正确' });
    }

    // Update password and clear password change requirement
    user.password = newPassword; // pre-save hook will hash it
    user.passwordChangeRequired = false; // User has successfully changed password
    await user.save();

    res.json({
      message: '密码修改成功',
      passwordChangeRequired: false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


