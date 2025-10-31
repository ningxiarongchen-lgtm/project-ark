/**
 * WebSocket Client Service using Socket.IO
 * 
 * Handles real-time notifications from the backend
 */

import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket = null;

/**
 * Initialize Socket.IO connection
 */
export const initializeSocket = (token) => {
  if (socket?.connected) {
    return socket;
  }

  // 🚀 智能环境检测：自动判断生产环境或本地开发环境
  const getApiUrl = () => {
    // 优先使用环境变量
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL.replace('/api', '')
    }
    
    // 生产环境自动使用 Render 后端
    if (import.meta.env.MODE === 'production') {
      return 'https://project-ark-efy7.onrender.com'
    }
    
    // 在 Vercel 生产环境自动使用 Render 后端
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      return 'https://project-ark-efy7.onrender.com'
    }
    
    // 本地开发环境默认地址
    return 'http://localhost:5001'
  }

  const API_URL = getApiUrl();
  const WS_URL = API_URL.replace('http', 'ws');

  socket = io(API_URL.replace('/api', ''), {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('✅ WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error.message);
  });

  return socket;
};

/**
 * Disconnect Socket.IO
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Get the Socket.IO instance
 */
export const getSocket = () => {
  return socket;
};

/**
 * Subscribe to notifications
 */
export const subscribeToNotifications = (callback) => {
  if (!socket) {
    console.warn('Socket not initialized. Call initializeSocket first.');
    return () => {};
  }

  const handleNotification = (notification) => {
    console.log('📬 Received notification:', notification);
    callback(notification);
  };

  // Listen for both 'notification' and 'new_notification' events
  socket.on('notification', handleNotification);
  socket.on('new_notification', handleNotification);

  // Return unsubscribe function
  return () => {
    socket.off('notification', handleNotification);
    socket.off('new_notification', handleNotification);
  };
};

/**
 * Send ping to check connection health
 */
export const ping = () => {
  if (socket) {
    socket.emit('ping');
  }
};

/**
 * Check if socket is connected
 */
export const isConnected = () => {
  return socket?.connected || false;
};

