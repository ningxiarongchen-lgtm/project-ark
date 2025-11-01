/**
 * NotificationCenter - 实时通知中心
 * 提供实时消息推送、提醒管理、消息历史等功能
 */

import { useState, useEffect } from 'react'
import {
  Badge, Drawer, List, Avatar, Space, Tag, Button, Tabs,
  Empty, Popover, Tooltip, message, Switch, Divider, Typography
} from 'antd'
import {
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  SettingOutlined,
  SoundOutlined,
  MailOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { Text } = Typography

const NotificationCenter = () => {
  const [visible, setVisible] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(true)

  useEffect(() => {
    // 初始化通知数据
    fetchNotifications()
    
    // 模拟实时通知（实际应使用WebSocket）
    const interval = setInterval(() => {
      addMockNotification()
    }, 30000) // 每30秒添加一条模拟通知

    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = () => {
    // 模拟通知数据
    const mockNotifications = [
      {
        id: '1',
        type: 'info',
        title: '新项目分配',
        content: '您有一个新项目"中石化阀门选型"已被分配给技术工程师',
        time: dayjs().subtract(10, 'minute'),
        read: false,
        link: '/projects/1'
      },
      {
        id: '2',
        type: 'success',
        title: '报价已完成',
        content: '项目"某电厂执行器采购"的商务报价已完成，请查看',
        time: dayjs().subtract(2, 'hour'),
        read: false,
        link: '/projects/2'
      },
      {
        id: '3',
        type: 'warning',
        title: '客户跟进提醒',
        content: '客户"钢铁制造有限公司"需要今天进行跟进',
        time: dayjs().subtract(5, 'hour'),
        read: false,
        link: '/crm'
      },
      {
        id: '4',
        type: 'error',
        title: '项目逾期警告',
        content: '项目"水处理系统改造"已逾期3天，请及时处理',
        time: dayjs().subtract(1, 'day'),
        read: true,
        link: '/projects/3'
      },
      {
        id: '5',
        type: 'info',
        title: '系统公告',
        content: '系统将于本周六凌晨2:00-4:00进行维护升级',
        time: dayjs().subtract(2, 'day'),
        read: true
      }
    ]
    
    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.read).length)
  }

  const addMockNotification = () => {
    const types = ['info', 'success', 'warning', 'error']
    const titles = ['新项目创建', '报价已提交', '客户跟进提醒', '任务即将到期']
    const contents = [
      '新项目已创建，等待分配',
      '商务工程师已提交报价，请审核',
      '今日需要跟进的客户有5个',
      '您有3个任务将在24小时内到期'
    ]
    
    const randomIndex = Math.floor(Math.random() * types.length)
    const newNotification = {
      id: Date.now().toString(),
      type: types[randomIndex],
      title: titles[randomIndex],
      content: contents[randomIndex],
      time: dayjs(),
      read: false
    }
    
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
    
    // 播放提示音（如果启用）
    if (soundEnabled) {
      playNotificationSound()
    }
    
    // 显示浏览器通知
    showBrowserNotification(newNotification)
  }

  const playNotificationSound = () => {
    // 实际项目中应该加载真实的音频文件
    // const audio = new Audio('/notification.mp3')
    // audio.play()
  }

  const showBrowserNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.content,
        icon: '/logo.png'
      })
    }
  }

  const handleMarkAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
    setUnreadCount(0)
    message.success('已全部标记为已读')
  }

  const handleDelete = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    const notification = notifications.find(n => n.id === id)
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    message.success('通知已删除')
  }

  const handleClearAll = () => {
    setNotifications([])
    setUnreadCount(0)
    message.success('已清空所有通知')
  }

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          message.success('浏览器通知已开启')
        }
      })
    }
  }

  const getNotificationIcon = (type) => {
    const icons = {
      info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      warning: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      error: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
    }
    return icons[type] || icons.info
  }

  const getNotificationColor = (type) => {
    const colors = {
      info: '#1890ff',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f'
    }
    return colors[type] || colors.info
  }

  const unreadNotifications = notifications.filter(n => !n.read)
  const readNotifications = notifications.filter(n => n.read)

  const settingsContent = (
    <div style={{ width: 280, padding: 8 }}>
      <h4>通知设置</h4>
      <Divider style={{ margin: '12px 0' }} />
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <SoundOutlined />
            <span>声音提醒</span>
          </Space>
          <Switch checked={soundEnabled} onChange={setSoundEnabled} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <MailOutlined />
            <span>邮件通知</span>
          </Space>
          <Switch checked={emailEnabled} onChange={setEmailEnabled} />
        </div>
        <Divider style={{ margin: '12px 0' }} />
        <Button 
          block 
          size="small"
          onClick={requestNotificationPermission}
        >
          开启浏览器通知
        </Button>
      </Space>
    </div>
  )

  return (
    <>
      <Tooltip title="通知中心">
        <Badge count={unreadCount} overflowCount={99}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: 20 }} />}
            onClick={() => setVisible(true)}
          />
        </Badge>
      </Tooltip>

      <Drawer
        title={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>通知中心</span>
            <Space>
              <Popover content={settingsContent} trigger="click" placement="bottomRight">
                <Button type="text" icon={<SettingOutlined />} size="small" />
              </Popover>
            </Space>
          </Space>
        }
        placement="right"
        onClose={() => setVisible(false)}
        open={visible}
        width={450}
        extra={
          <Space>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllAsRead}>
                全部已读
              </Button>
            )}
            {notifications.length > 0 && (
              <Button size="small" danger onClick={handleClearAll}>
                清空全部
              </Button>
            )}
          </Space>
        }
      >
        <Tabs defaultActiveKey="unread">
          <Tabs.TabPane 
            tab={
              <Badge count={unreadCount} offset={[10, 0]}>
                <span>未读</span>
              </Badge>
            } 
            key="unread"
          >
            {unreadNotifications.length > 0 ? (
              <List
                dataSource={unreadNotifications}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Tooltip title="标记为已读">
                        <Button
                          type="text"
                          icon={<CheckCircleOutlined />}
                          size="small"
                          onClick={() => handleMarkAsRead(item.id)}
                        />
                      </Tooltip>,
                      <Tooltip title="删除">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          onClick={() => handleDelete(item.id)}
                        />
                      </Tooltip>
                    ]}
                    style={{ 
                      background: '#f0f5ff', 
                      marginBottom: 8, 
                      padding: 12,
                      borderRadius: 8,
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      handleMarkAsRead(item.id)
                      if (item.link) {
                        window.location.href = item.link
                      }
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ backgroundColor: getNotificationColor(item.type) }}
                          icon={getNotificationIcon(item.type)}
                        />
                      }
                      title={
                        <Space>
                          <Text strong>{item.title}</Text>
                          <Tag color={getNotificationColor(item.type)}>
                            {item.type}
                          </Tag>
                        </Space>
                      }
                      description={
                        <>
                          <div style={{ marginBottom: 4 }}>{item.content}</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <ClockCircleOutlined /> {item.time.fromNow()}
                          </Text>
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无未读通知" />
            )}
          </Tabs.TabPane>
          
          <Tabs.TabPane tab="已读" key="read">
            {readNotifications.length > 0 ? (
              <List
                dataSource={readNotifications}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Tooltip title="删除">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          onClick={() => handleDelete(item.id)}
                        />
                      </Tooltip>
                    ]}
                    style={{ 
                      marginBottom: 8, 
                      padding: 12,
                      borderRadius: 8,
                      cursor: 'pointer',
                      opacity: 0.7
                    }}
                    onClick={() => {
                      if (item.link) {
                        window.location.href = item.link
                      }
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ backgroundColor: '#d9d9d9' }}
                          icon={getNotificationIcon(item.type)}
                        />
                      }
                      title={<Text>{item.title}</Text>}
                      description={
                        <>
                          <div style={{ marginBottom: 4 }}>{item.content}</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <ClockCircleOutlined /> {item.time.fromNow()}
                          </Text>
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无已读通知" />
            )}
          </Tabs.TabPane>

          <Tabs.TabPane tab="全部" key="all">
            {notifications.length > 0 ? (
              <List
                dataSource={notifications}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      !item.read && (
                        <Tooltip title="标记为已读">
                          <Button
                            type="text"
                            icon={<CheckCircleOutlined />}
                            size="small"
                            onClick={() => handleMarkAsRead(item.id)}
                          />
                        </Tooltip>
                      ),
                      <Tooltip title="删除">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          onClick={() => handleDelete(item.id)}
                        />
                      </Tooltip>
                    ].filter(Boolean)}
                    style={{ 
                      background: item.read ? 'transparent' : '#f0f5ff',
                      marginBottom: 8, 
                      padding: 12,
                      borderRadius: 8,
                      cursor: 'pointer',
                      opacity: item.read ? 0.7 : 1
                    }}
                    onClick={() => {
                      if (!item.read) {
                        handleMarkAsRead(item.id)
                      }
                      if (item.link) {
                        window.location.href = item.link
                      }
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ 
                            backgroundColor: item.read ? '#d9d9d9' : getNotificationColor(item.type) 
                          }}
                          icon={getNotificationIcon(item.type)}
                        />
                      }
                      title={
                        <Space>
                          <Text strong={!item.read}>{item.title}</Text>
                          {!item.read && <Badge status="processing" />}
                        </Space>
                      }
                      description={
                        <>
                          <div style={{ marginBottom: 4 }}>{item.content}</div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <ClockCircleOutlined /> {item.time.fromNow()}
                          </Text>
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无通知" />
            )}
          </Tabs.TabPane>
        </Tabs>
      </Drawer>
    </>
  )
}

export default NotificationCenter

