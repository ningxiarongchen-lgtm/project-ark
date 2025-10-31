/**
 * 通知路由
 * 处理用户通知相关的所有请求
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// 所有通知路由都需要身份验证
router.use(protect);

// 获取通知列表
// GET /api/notifications?status=Unread&limit=10
router.get('/', notificationController.getNotifications);

// 获取未读数量
// GET /api/notifications/unread-count
router.get('/unread-count', notificationController.getUnreadCount);

// 标记所有通知为已读 (必须在 /:id 路由之前，避免路由冲突)
// POST /api/notifications/mark-all-read
router.post('/mark-all-read', notificationController.markAllAsRead);

// 清除所有已读通知
// DELETE /api/notifications/clear-read
router.delete('/clear-read', notificationController.clearReadNotifications);

// 获取单个通知详情
// GET /api/notifications/:id
router.get('/:id', notificationController.getNotificationById);

// 标记单个通知为已读
// POST /api/notifications/:id/mark-read
router.post('/:id/mark-read', notificationController.markAsRead);

// 删除单个通知
// DELETE /api/notifications/:id
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;

