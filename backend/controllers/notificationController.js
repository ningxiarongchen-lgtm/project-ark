/**
 * 通知控制器
 * 处理用户通知的查询、标记已读等操作
 */

const Notification = require('../models/Notification');

/**
 * 获取当前用户的通知列表
 * GET /api/notifications
 * Query params:
 *   - status: 'Unread' | 'Read' | 'All' (默认 'All')
 *   - limit: 数量限制 (默认 50)
 *   - skip: 跳过数量 (用于分页)
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'All', limit = 50, skip = 0 } = req.query;

    // 构建查询条件
    const query = { recipient: userId };
    if (status !== 'All' && ['Unread', 'Read'].includes(status)) {
      query.status = status;
    }

    // 查询通知
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 }) // 最新的在前
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // 获取未读数量
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      status: 'Unread'
    });

    // 获取总数
    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total,
        hasMore: total > parseInt(skip) + notifications.length
      }
    });
  } catch (error) {
    console.error('获取通知列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取通知列表失败',
      error: error.message
    });
  }
};

/**
 * 获取未读通知数量
 * GET /api/notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      status: 'Unread'
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('获取未读数量失败:', error);
    res.status(500).json({
      success: false,
      message: '获取未读数量失败',
      error: error.message
    });
  }
};

/**
 * 标记单个通知为已读
 * POST /api/notifications/:id/mark-read
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // 查找通知并验证所有权
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在或无权访问'
      });
    }

    // 如果已经是已读状态，直接返回
    if (notification.status === 'Read') {
      return res.json({
        success: true,
        message: '通知已是已读状态',
        data: notification
      });
    }

    // 标记为已读
    notification.status = 'Read';
    notification.readAt = new Date();
    await notification.save();

    // 获取更新后的未读数量
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      status: 'Unread'
    });

    res.json({
      success: true,
      message: '已标记为已读',
      data: {
        notification,
        unreadCount
      }
    });
  } catch (error) {
    console.error('标记通知已读失败:', error);
    res.status(500).json({
      success: false,
      message: '标记通知已读失败',
      error: error.message
    });
  }
};

/**
 * 标记所有通知为已读
 * POST /api/notifications/mark-all-read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    // 批量更新所有未读通知
    const result = await Notification.updateMany(
      { 
        recipient: userId, 
        status: 'Unread' 
      },
      { 
        $set: { 
          status: 'Read',
          readAt: new Date()
        } 
      }
    );

    res.json({
      success: true,
      message: '已标记所有通知为已读',
      data: {
        modifiedCount: result.modifiedCount,
        unreadCount: 0
      }
    });
  } catch (error) {
    console.error('批量标记已读失败:', error);
    res.status(500).json({
      success: false,
      message: '批量标记已读失败',
      error: error.message
    });
  }
};

/**
 * 删除单个通知
 * DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // 查找并删除（验证所有权）
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在或无权访问'
      });
    }

    // 获取更新后的未读数量
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      status: 'Unread'
    });

    res.json({
      success: true,
      message: '通知已删除',
      data: { unreadCount }
    });
  } catch (error) {
    console.error('删除通知失败:', error);
    res.status(500).json({
      success: false,
      message: '删除通知失败',
      error: error.message
    });
  }
};

/**
 * 批量删除已读通知
 * DELETE /api/notifications/clear-read
 */
exports.clearReadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.deleteMany({
      recipient: userId,
      status: 'Read'
    });

    res.json({
      success: true,
      message: '已清除所有已读通知',
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('清除已读通知失败:', error);
    res.status(500).json({
      success: false,
      message: '清除已读通知失败',
      error: error.message
    });
  }
};

/**
 * 获取单个通知详情
 * GET /api/notifications/:id
 */
exports.getNotificationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    }).lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在或无权访问'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('获取通知详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取通知详情失败',
      error: error.message
    });
  }
};

