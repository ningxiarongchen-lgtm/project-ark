/**
 * NotificationPanel Component
 * 
 * Displays a list of notifications in a dropdown/drawer
 */

import { Empty, List, Button, Tag, Typography, Space, Divider } from 'antd';
import {
  CloseOutlined,
  CheckOutlined,
  DeleteOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../styles/theme';
import './NotificationPanel.css';

const { Text, Title } = Typography;

const NotificationPanel = ({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead,
  onClear,
  onClearAll 
}) => {
  const navigate = useNavigate();

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getPriorityColor = (priority) => {
    const colorMap = {
      urgent: 'error',
      high: 'warning',
      medium: 'processing',
      low: 'default'
    };
    return colorMap[priority] || 'default';
  };

  const getPriorityText = (priority) => {
    const textMap = {
      urgent: '紧急',
      high: '高',
      medium: '中',
      low: '低'
    };
    return textMap[priority] || priority;
  };

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

  if (notifications.length === 0) {
    return (
      <div className="notification-panel-empty">
        <Empty
          image={<BellOutlined style={{ fontSize: 48, color: colors.text.tertiary }} />}
          description="暂无通知"
        />
      </div>
    );
  }

  return (
    <div className="notification-panel">
      {/* Header */}
      <div className="notification-panel-header">
        <Title level={5} style={{ margin: 0 }}>
          通知中心
        </Title>
        <Space>
          <Button 
            type="text" 
            size="small"
            icon={<CheckOutlined />}
            onClick={onMarkAllAsRead}
          >
            全部已读
          </Button>
          <Button 
            type="text" 
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={onClearAll}
          >
            清空
          </Button>
        </Space>
      </div>

      <Divider style={{ margin: 0 }} />

      {/* Notification List */}
      <List
        className="notification-list"
        dataSource={notifications}
        renderItem={(notification) => (
          <List.Item
            className={`notification-item ${!notification.read ? 'unread' : ''}`}
            onClick={() => handleNotificationClick(notification)}
            extra={
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onClear(notification.id);
                }}
                style={{ color: colors.text.tertiary }}
              />
            }
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text strong={!notification.read}>{notification.title}</Text>
                  <Tag color={getPriorityColor(notification.priority)} style={{ fontSize: 11 }}>
                    {getPriorityText(notification.priority)}
                  </Tag>
                  {!notification.read && (
                    <div className="notification-unread-dot" />
                  )}
                </Space>
              }
              description={
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {notification.message}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatTime(notification.timestamp)}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default NotificationPanel;

