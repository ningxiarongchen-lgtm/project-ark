/**
 * Notification Store
 * 管理全局通知状态，与后端API同步
 */

import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  /**
   * 从后端加载通知列表
   */
  fetchNotifications: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const { status = 'All', limit = 50 } = params;
      const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
        params: { status, limit },
        withCredentials: true,
      });

      if (response.data.success) {
        set({
          notifications: response.data.data.notifications,
          unreadCount: response.data.data.unreadCount,
          loading: false,
        });
      }
    } catch (error) {
      console.error('获取通知列表失败:', error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * 获取未读数量
   */
  fetchUnreadCount: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/notifications/unread-count`, {
        withCredentials: true,
      });

      if (response.data.success) {
        set({ unreadCount: response.data.data.unreadCount });
      }
    } catch (error) {
      console.error('获取未读数量失败:', error);
    }
  },

  /**
   * 标记单个通知为已读
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/notifications/${notificationId}/mark-read`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif._id === notificationId
              ? { ...notif, status: 'Read', readAt: new Date() }
              : notif
          ),
          unreadCount: response.data.data.unreadCount,
        }));
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  },

  /**
   * 标记所有通知为已读
   */
  markAllAsRead: async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/notifications/mark-all-read`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        set((state) => ({
          notifications: state.notifications.map((notif) => ({
            ...notif,
            status: 'Read',
            readAt: new Date(),
          })),
          unreadCount: 0,
        }));
      }
    } catch (error) {
      console.error('批量标记已读失败:', error);
    }
  },

  /**
   * 删除单个通知
   */
  deleteNotification: async (notificationId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/notifications/${notificationId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        set((state) => ({
          notifications: state.notifications.filter((notif) => notif._id !== notificationId),
          unreadCount: response.data.data.unreadCount,
        }));
      }
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  },

  /**
   * 清除所有已读通知
   */
  clearReadNotifications: async () => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/notifications/clear-read`, {
        withCredentials: true,
      });

      if (response.data.success) {
        set((state) => ({
          notifications: state.notifications.filter((notif) => notif.status === 'Unread'),
        }));
      }
    } catch (error) {
      console.error('清除已读通知失败:', error);
    }
  },

  /**
   * 添加新通知（由 WebSocket 调用）
   */
  addNotification: (notification) => {
    set((state) => {
      // 检查是否已存在
      const exists = state.notifications.some((notif) => notif._id === notification._id);
      if (exists) return state;

      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    });
  },

  /**
   * 清空本地通知（不影响服务器）
   */
  clearLocal: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));

export default useNotificationStore;

