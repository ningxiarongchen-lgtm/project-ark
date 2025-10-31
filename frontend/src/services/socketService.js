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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const WS_URL = API_URL.replace('/api', '').replace('http', 'ws');

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

