const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  getMe,
  updateProfile,
  getUsers,
  deleteUser,
  updateUserRole,
  refreshToken,
  revokeToken,
  logout,
  getSessions,
  changePassword
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { 
  userRegistrationValidation,
  userLoginValidation,
  userUpdateValidation,
  validate
} = require('../middleware/validators');
const { body } = require('express-validator');

// Rate limiter for login attempts
// 在开发和测试环境中放宽限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟窗口期
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 生产环境临时提高到100次便于测试
  message: {
    success: false,
    message: '尝试次数过多，请15分钟后再试'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // 可选：基于IP地址限制
  skipSuccessfulRequests: false, // 不跳过成功的请求
  skipFailedRequests: false, // 不跳过失败的请求
});

// Public routes
router.post('/login', loginLimiter, userLoginValidation, validate, login);

// Refresh Token routes - Public (but requires valid refresh token)
router.post('/refresh-token', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], validate, refreshToken);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, userUpdateValidation, validate, updateProfile);
router.post('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('当前密码不能为空'),
  body('newPassword').notEmpty().withMessage('新密码不能为空').isLength({ min: 6 }).withMessage('新密码至少需要6个字符')
], validate, changePassword);
router.post('/logout', protect, logout);
router.post('/revoke-token', protect, [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], validate, revokeToken);
router.get('/sessions', protect, getSessions);

// Admin only routes
router.post('/register', protect, authorize('Administrator'), userRegistrationValidation, validate, register);
router.get('/users', protect, authorize('Administrator'), getUsers);
router.delete('/users/:id', protect, authorize('Administrator'), deleteUser);
router.put('/users/:id/role', protect, authorize('Administrator'), [
  body('role').notEmpty().withMessage('角色不能为空').isIn(['Technical Engineer', 'Business Engineer', 'Sales Manager', 'Procurement Specialist', 'Production Planner', 'QA Inspector', 'Logistics Specialist', 'Shop Floor Worker', 'Administrator']).withMessage('无效的角色')
], validate, updateUserRole);

module.exports = router;


