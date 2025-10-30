/**
 * WebSocket Service using Socket.IO
 * 
 * Handles real-time notifications for cross-role events:
 * - Selection submission notifications
 * - Order status updates
 * - Delivery date changes
 * - Production updates
 * - Quality check results
 */

const jwt = require('jsonwebtoken');

let io = null;

/**
 * Initialize Socket.IO with the HTTP server
 */
const initializeSocket = (httpServer) => {
  const { Server } = require('socket.io');
  
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.userRole})`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    
    // Join role-specific room
    socket.join(`role:${socket.userRole}`);

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });

    // Ping-pong for connection health check
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  console.log('🔌 Socket.IO initialized');
  return io;
};

/**
 * Get the Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

/**
 * Send notification to a specific user
 */
const notifyUser = (userId, notification) => {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('notification', {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    read: false,
    ...notification
  });
};

/**
 * Send notification to all users with specific role
 */
const notifyRole = (role, notification) => {
  if (!io) return;
  
  io.to(`role:${role}`).emit('notification', {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    read: false,
    ...notification
  });
};

/**
 * Broadcast notification to all connected users
 */
const broadcastNotification = (notification) => {
  if (!io) return;
  
  io.emit('notification', {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    read: false,
    ...notification
  });
};

/**
 * Notification helper for common events
 */
const notifications = {
  // Project-related
  projectAssigned: (userId, projectData) => {
    notifyUser(userId, {
      type: 'project_assigned',
      title: '新项目分配',
      message: `您被分配到项目: ${projectData.projectName}`,
      link: `/projects/${projectData._id}`,
      priority: 'high'
    });
  },

  selectionSubmitted: (userId, projectData) => {
    notifyUser(userId, {
      type: 'selection_submitted',
      title: '选型已提交',
      message: `项目 ${projectData.projectName} 的选型已提交，等待审核`,
      link: `/projects/${projectData._id}`,
      priority: 'medium'
    });
  },

  // Order-related
  orderStatusUpdated: (userId, orderData, newStatus) => {
    notifyUser(userId, {
      type: 'order_status_updated',
      title: '订单状态更新',
      message: `订单 ${orderData.orderNumber} 状态更新为: ${newStatus}`,
      link: `/orders/${orderData._id}`,
      priority: 'medium'
    });
  },

  deliveryDateChanged: (userId, orderData, newDate) => {
    notifyUser(userId, {
      type: 'delivery_date_changed',
      title: '交货日期变更',
      message: `订单 ${orderData.orderNumber} 的交货日期已更改为: ${newDate}`,
      link: `/orders/${orderData._id}`,
      priority: 'high'
    });
  },

  // Production-related
  productionStarted: (userId, productionData) => {
    notifyUser(userId, {
      type: 'production_started',
      title: '生产开始',
      message: `生产订单 ${productionData.productionOrderNumber} 已开始生产`,
      link: `/production/${productionData._id}`,
      priority: 'medium'
    });
  },

  productionCompleted: (userId, productionData) => {
    notifyUser(userId, {
      type: 'production_completed',
      title: '生产完成',
      message: `生产订单 ${productionData.productionOrderNumber} 已完成生产`,
      link: `/production/${productionData._id}`,
      priority: 'high'
    });
  },

  // Quality-related
  qualityCheckPassed: (userId, qcData) => {
    notifyUser(userId, {
      type: 'quality_check_passed',
      title: '质检通过',
      message: `质检任务已通过，可以安排发货`,
      link: `/quality/${qcData._id}`,
      priority: 'high'
    });
  },

  qualityCheckFailed: (userId, qcData) => {
    notifyUser(userId, {
      type: 'quality_check_failed',
      title: '质检未通过',
      message: `质检任务未通过，需要返工`,
      link: `/quality/${qcData._id}`,
      priority: 'urgent'
    });
  },

  // Service ticket-related
  ticketAssigned: (userId, ticketData) => {
    notifyUser(userId, {
      type: 'ticket_assigned',
      title: '工单分配',
      message: `新的服务工单已分配给您: ${ticketData.title}`,
      link: `/service-center/${ticketData._id}`,
      priority: 'high'
    });
  },

  ticketStatusUpdated: (userId, ticketData, newStatus) => {
    notifyUser(userId, {
      type: 'ticket_status_updated',
      title: '工单状态更新',
      message: `工单 ${ticketData.ticketNumber} 状态更新为: ${newStatus}`,
      link: `/service-center/${ticketData._id}`,
      priority: 'medium'
    });
  }
};

module.exports = {
  initializeSocket,
  getIO,
  notifyUser,
  notifyRole,
  broadcastNotification,
  notifications
};

