/**
 * NotificationBell Component
 * 实时通知铃铛，显示在页面右上角
 */

import React, { useEffect, useState } from 'react';
import { Badge, Dropdown, Button, List, Empty, Typography, Space, Tag, Spin, Divider, notification as antdNotification } from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  CloseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/notificationStore';
import { initializeSocket, subscribeToNotifications, disconnectSocket } from '../../services/socketService';
import { useAuthStore } from '../../store/authStore';
import './NotificationBell.css';

const { Text } = Typography;

const NotificationBell = () => {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    addNotification,
  } = useNotificationStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // 初始加载通知
  useEffect(() => {
    if (token) {
      fetchNotifications({ limit: 20 });
    }
  }, [token]);

  // WebSocket 连接和实时通知监听
  useEffect(() => {
    if (!token || !user) return;

    try {
      // 初始化 socket
      const socket = initializeSocket(token);
      setSocketConnected(true);

      // 监听新通知
      const unsubscribe = subscribeToNotifications((notification) => {
        // 添加到列表
        addNotification(notification);

        // 显示弹窗提示
        showNotificationPopup(notification);
      });

      // 清理
      return () => {
        unsubscribe();
        disconnectSocket();
        setSocketConnected(false);
      };
    } catch (error) {
      console.error('WebSocket 连接失败:', error);
      setSocketConnected(false);
    }
  }, [token, user]);

  // 显示实时通知弹窗
  const showNotificationPopup = (notif) => {
    const config = {
      message: notif.title,
      description: notif.message,
      placement: 'topRight',
      duration: 10, // 显示10秒
      onClick: () => {
        if (notif.link) {
          navigate(notif.link);
          markAsRead(notif._id);
        }
      },
      style: {
        cursor: notif.link ? 'pointer' : 'default',
      },
    };

    // 根据优先级选择通知类型
    switch (notif.priority) {
      case 'urgent':
        antdNotification.error({
          ...config,
          icon: <BellOutlined style={{ color: '#ff4d4f' }} />,
        });
        break;
      case 'high':
        antdNotification.warning({
          ...config,
          icon: <BellOutlined style={{ color: '#faad14' }} />,
        });
        break;
      default:
        antdNotification.info({
          ...config,
          icon: <BellOutlined style={{ color: '#1890ff' }} />,
        });
        break;
    }
  };

  // 处理通知点击
  const handleNotificationClick = async (notification) => {
    // 标记为已读
    if (notification.status === 'Unread') {
      await markAsRead(notification._id);
    }

    // 关闭下拉菜单
    setDropdownOpen(false);

    // 跳转到目标页面
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString('zh-CN');
  };

  // 获取优先级标签颜色
  const getPriorityColor = (priority) => {
    const colorMap = {
      urgent: 'error',
      high: 'warning',
      medium: 'processing',
      low: 'default',
    };
    return colorMap[priority] || 'default';
  };

  // 获取优先级文本
  const getPriorityText = (priority) => {
    const textMap = {
      urgent: '紧急',
      high: '高',
      medium: '中',
      low: '低',
    };
    return textMap[priority] || priority;
  };

  // 下拉菜单内容
  const dropdownContent = (
    <div className="notification-bell-dropdown">
      {/* Header */}
      <div className="notification-bell-header">
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong style={{ fontSize: 16 }}>通知中心</Text>
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                fetchNotifications({ limit: 20 });
              }}
              title="刷新"
            />
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
              disabled={unreadCount === 0}
              title="全部已读"
            />
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                clearReadNotifications();
              }}
              title="清除已读"
            />
          </Space>
        </Space>
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* Notification List */}
      <div className="notification-bell-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={<BellOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
            description="暂无通知"
            style={{ padding: '40px 0' }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                key={notification._id}
                className={`notification-bell-item ${notification.status === 'Unread' ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
                style={{ cursor: 'pointer', padding: '12px 16px' }}
              >
                <List.Item.Meta
                  title={
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        {notification.status === 'Unread' && (
                          <div className="notification-unread-indicator" />
                        )}
                        <Text strong={notification.status === 'Unread'}>
                          {notification.title}
                        </Text>
                        <Tag color={getPriorityColor(notification.priority)} style={{ fontSize: 11 }}>
                          {getPriorityText(notification.priority)}
                        </Tag>
                      </Space>
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        style={{ color: '#999' }}
                      />
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      {notification.message && (
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {notification.message}
                        </Text>
                      )}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatTime(notification.createdAt)}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Dropdown
      open={dropdownOpen}
      onOpenChange={setDropdownOpen}
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
      overlayStyle={{ width: 400, maxHeight: 600, overflow: 'hidden' }}
    >
      <Badge count={unreadCount} overflowCount={99} offset={[-5, 5]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 18 }} />}
          style={{ color: socketConnected ? '#1890ff' : '#999' }}
          title={socketConnected ? '实时通知已连接' : '通知'}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;

