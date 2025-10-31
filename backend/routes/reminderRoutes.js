const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const contractReminderService = require('../services/contractReminderService');

// 应用身份验证中间件
router.use(protect);

/**
 * @route   GET /api/reminders
 * @desc    获取当前用户的所有提醒
 * @access  已登录用户
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const reminders = contractReminderService.getRemindersForUser(userId);
    
    res.status(200).json({
      success: true,
      data: reminders,
      count: reminders.length
    });
  } catch (error) {
    console.error('获取提醒失败:', error);
    res.status(500).json({
      success: false,
      message: '获取提醒失败',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/reminders/stats
 * @desc    获取提醒统计信息
 * @access  管理员、商务工程师
 */
router.get('/stats', authorize('Administrator', 'Business Engineer'), async (req, res) => {
  try {
    const stats = contractReminderService.getReminderStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取提醒统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取提醒统计失败',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/reminders/all
 * @desc    获取所有提醒（管理员）
 * @access  管理员、商务工程师
 */
router.get('/all', authorize('Administrator', 'Business Engineer'), async (req, res) => {
  try {
    const reminders = contractReminderService.getReminders();
    
    res.status(200).json({
      success: true,
      data: reminders,
      count: reminders.length
    });
  } catch (error) {
    console.error('获取所有提醒失败:', error);
    res.status(500).json({
      success: false,
      message: '获取所有提醒失败',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/reminders/refresh
 * @desc    手动刷新提醒
 * @access  管理员、商务工程师
 */
router.post('/refresh', authorize('Administrator', 'Business Engineer'), async (req, res) => {
  try {
    await contractReminderService.checkReminders();
    const stats = contractReminderService.getReminderStats();
    
    res.status(200).json({
      success: true,
      message: '提醒已刷新',
      data: stats
    });
  } catch (error) {
    console.error('刷新提醒失败:', error);
    res.status(500).json({
      success: false,
      message: '刷新提醒失败',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/reminders/:contractId/:type
 * @desc    忽略/关闭指定提醒
 * @access  已登录用户
 */
router.delete('/:contractId/:type', async (req, res) => {
  try {
    const { contractId, type } = req.params;
    
    contractReminderService.dismissReminder(contractId, type);
    
    res.status(200).json({
      success: true,
      message: '提醒已关闭'
    });
  } catch (error) {
    console.error('关闭提醒失败:', error);
    res.status(500).json({
      success: false,
      message: '关闭提醒失败',
      error: error.message
    });
  }
});

module.exports = router;

