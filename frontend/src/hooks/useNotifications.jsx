/**
 * useNotifications Hook
 * 
 * Custom hook for managing real-time notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { notification as antdNotification } from 'antd';
import { 
  BellOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { initializeSocket, subscribeToNotifications, disconnectSocket } from '../services/socketService';
import { useAuthStore } from '../store/authStore';

const useNotifications = () => {
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!token) return;

    // Initialize socket
    const socket = initializeSocket(token);

    // Subscribe to notifications
    const unsubscribe = subscribeToNotifications((notification) => {
      handleNewNotification(notification);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      disconnectSocket();
    };
  }, [token]);

  // Handle new notification
  const handleNewNotification = useCallback((notification) => {
    // Add to notification list
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show Ant Design notification popup
    showNotificationPopup(notification);
  }, []);

  // Show notification popup
  const showNotificationPopup = (notif) => {
    const config = {
      message: notif.title,
      description: notif.message,
      placement: 'topRight',
      duration: 4.5,
      onClick: () => {
        if (notif.link) {
          window.location.href = notif.link;
        }
      },
      style: {
        cursor: notif.link ? 'pointer' : 'default'
      }
    };

    // Choose notification type based on priority
    switch (notif.priority) {
      case 'urgent':
        antdNotification.error({
          ...config,
          icon: <WarningOutlined style={{ color: '#ff4d4f' }} />
        });
        break;
      case 'high':
        antdNotification.warning({
          ...config,
          icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />
        });
        break;
      case 'medium':
        antdNotification.info({
          ...config,
          icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />
        });
        break;
      case 'low':
      default:
        antdNotification.open({
          ...config,
          icon: <BellOutlined style={{ color: '#52c41a' }} />
        });
        break;
    }
  };

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Clear a notification
  const clearNotification = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
    
    // Decrease unread count if notification was unread
    setNotifications(prev => {
      const notif = prev.find(n => n.id === notificationId);
      if (notif && !notif.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev;
    });
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll
  };
};

export default useNotifications;

