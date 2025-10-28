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
  requestPasswordReset,
  getPasswordResetRequests,
  approvePasswordReset,
  denyPasswordReset,
  validateResetCode,
  performPasswordReset,
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
  validate,
  validateEmail
} = require('../middleware/validators');
const { body } = require('express-validator');

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟窗口期
  max: 5, // 限制5次尝试
  message: {
    success: false,
    message: '尝试次数过多，请5分钟后再试'
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

// Password reset routes - Public
router.post('/request-password-reset', [
  validateEmail('email', true)
], validate, requestPasswordReset);

router.post('/validate-reset-code', [
  validateEmail('email', true),
  body('code').notEmpty().withMessage('验证码不能为空').isLength({ min: 6, max: 6 }).withMessage('验证码必须是6位数字')
], validate, validateResetCode);

router.post('/perform-reset', [
  validateEmail('email', true),
  body('code').notEmpty().withMessage('验证码不能为空'),
  body('newPassword').notEmpty().withMessage('新密码不能为空').isLength({ min: 6 }).withMessage('密码至少需要6个字符')
], validate, performPasswordReset);

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
  body('role').notEmpty().withMessage('角色不能为空').isIn(['Technical Engineer', 'Sales Engineer', 'Sales Manager', 'Procurement Specialist', 'Production Planner', 'After-sales Engineer', 'Administrator']).withMessage('无效的角色')
], validate, updateUserRole);

// Password reset management - Admin only
router.get('/password-reset-requests', protect, authorize('Administrator'), getPasswordResetRequests);
router.post('/approve-password-reset', protect, authorize('Administrator'), approvePasswordReset);
router.post('/deny-password-reset', protect, authorize('Administrator'), denyPasswordReset);

module.exports = router;


