/**
 * TeamCollaboration - 团队协作功能
 * 提供任务分配、团队消息、工作看板等协作功能
 */

import { useState, useEffect } from 'react'
import {
  Card, Row, Col, Avatar, List, Button, Space, Tag, Modal, Form,
  Input, Select, DatePicker, Badge, Tooltip, Timeline, Tabs,
  Progress, Statistic, message, Empty, Divider
} from 'antd'
import {
  TeamOutlined, UserOutlined, CheckCircleOutlined, ClockCircleOutlined,
  PlusOutlined, MessageOutlined, TrophyOutlined, RiseOutlined,
  SendOutlined, PaperClipOutlined, CalendarOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

const TeamCollaboration = () => {
  const [tasks, setTasks] = useState([])
  const [messages, setMessages] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false)
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = () => {
    // 模拟团队成员数据
    const mockMembers = [
      {
        id: '1',
        name: '张销售',
        role: 'Sales Manager',
        avatar: null,
        status: 'online',
        tasksCount: 5,
        completedTasks: 3,
        performance: 85
      },
      {
        id: '2',
        name: '李工程师',
        role: 'Technical Engineer',
        avatar: null,
        status: 'online',
        tasksCount: 8,
        completedTasks: 6,
        performance: 92
      },
      {
        id: '3',
        name: '王商务',
        role: 'Business Engineer',
        avatar: null,
        status: 'busy',
        tasksCount: 6,
        completedTasks: 4,
        performance: 88
      },
      {
        id: '4',
        name: '赵工',
        role: 'Technical Engineer',
        avatar: null,
        status: 'offline',
        tasksCount: 4,
        completedTasks: 2,
        performance: 75
      }
    ]

    // 模拟任务数据
    const mockTasks = [
      {
        id: '1',
        title: '中石化阀门选型项目 - 技术方案',
        assignee: '李工程师',
        assigneeId: '2',
        priority: '高',
        status: '进行中',
        dueDate: '2025-11-05',
        progress: 60,
        project: 'PRJ-2025-001'
      },
      {
        id: '2',
        title: '某电厂项目 - 商务报价',
        assignee: '王商务',
        assigneeId: '3',
        priority: '紧急',
        status: '进行中',
        dueDate: '2025-11-02',
        progress: 80,
        project: 'PRJ-2025-002'
      },
      {
        id: '3',
        title: '钢铁厂项目 - 现场勘查',
        assignee: '赵工',
        assigneeId: '4',
        priority: '中',
        status: '待开始',
        dueDate: '2025-11-10',
        progress: 0,
        project: 'PRJ-2025-003'
      }
    ]

    // 模拟消息数据
    const mockMessages = [
      {
        id: '1',
        sender: '李工程师',
        senderId: '2',
        content: '中石化项目的技术方案已经完成初稿，请审核',
        time: dayjs().subtract(30, 'minute'),
        type: 'text',
        unread: true
      },
      {
        id: '2',
        sender: '王商务',
        senderId: '3',
        content: '某电厂项目报价单已发送给客户',
        time: dayjs().subtract(2, 'hour'),
        type: 'text',
        unread: true
      },
      {
        id: '3',
        sender: '张销售',
        senderId: '1',
        content: '今天下午3点团队周会，请大家准时参加',
        time: dayjs().subtract(5, 'hour'),
        type: 'announcement',
        unread: false
      }
    ]

    setTeamMembers(mockMembers)
    setTasks(mockTasks)
    setMessages(mockMessages)
  }

  const handleCreateTask = (values) => {
    const newTask = {
      id: Date.now().toString(),
      ...values,
      status: '待开始',
      progress: 0,
      dueDate: values.dueDate.format('YYYY-MM-DD'),
      assignee: teamMembers.find(m => m.id === values.assigneeId)?.name
    }
    setTasks([newTask, ...tasks])
    setIsTaskModalVisible(false)
    form.resetFields()
    message.success('任务创建成功')
  }

  const handleSendMessage = (values) => {
    const newMessage = {
      id: Date.now().toString(),
      sender: '我',
      senderId: 'current',
      content: values.content,
      time: dayjs(),
      type: values.type || 'text',
      unread: false
    }
    setMessages([newMessage, ...messages])
    setIsMessageModalVisible(false)
    form.resetFields()
    message.success('消息发送成功')
  }

  const handleTaskStatusChange = (taskId, newStatus) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ))
    message.success('任务状态已更新')
  }

  const getStatusColor = (status) => {
    const colors = {
      '待开始': 'default',
      '进行中': 'processing',
      '已完成': 'success',
      '已延期': 'error'
    }
    return colors[status] || 'default'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      '紧急': 'red',
      '高': 'orange',
      '中': 'blue',
      '低': 'default'
    }
    return colors[priority] || 'default'
  }

  const getOnlineStatusColor = (status) => {
    const colors = {
      'online': 'success',
      'busy': 'warning',
      'offline': 'default'
    }
    return colors[status] || 'default'
  }

  const unreadCount = messages.filter(m => m.unread).length

  return (
    <div>
      {/* 团队统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="团队成员"
              value={teamMembers.length}
              suffix="人"
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="进行中任务"
              value={tasks.filter(t => t.status === '进行中').length}
              suffix="个"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已完成任务"
              value={tasks.filter(t => t.status === '已完成').length}
              suffix="个"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="团队效能"
              value={85}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 任务看板 */}
        <Col xs={24} lg={14}>
          <Card
            title="任务看板"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsTaskModalVisible(true)}
              >
                新建任务
              </Button>
            }
          >
            <Tabs defaultActiveKey="all">
              <Tabs.TabPane tab="全部任务" key="all">
                <List
                  dataSource={tasks}
                  renderItem={(task) => (
                    <List.Item
                      actions={[
                        <Select
                          value={task.status}
                          size="small"
                          style={{ width: 100 }}
                          onChange={(value) => handleTaskStatusChange(task.id, value)}
                        >
                          <Option value="待开始">待开始</Option>
                          <Option value="进行中">进行中</Option>
                          <Option value="已完成">已完成</Option>
                          <Option value="已延期">已延期</Option>
                        </Select>
                      ]}
                      style={{ padding: '12px 0' }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{ backgroundColor: '#1890ff' }}>
                            {task.assignee?.charAt(0)}
                          </Avatar>
                        }
                        title={
                          <Space>
                            <span>{task.title}</span>
                            <Tag color={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Tag>
                            <Tag color={getStatusColor(task.status)}>
                              {task.status}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Space>
                              <UserOutlined />
                              <span>{task.assignee}</span>
                              <Divider type="vertical" />
                              <CalendarOutlined />
                              <span>{task.dueDate}</span>
                              <Divider type="vertical" />
                              <span>项目: {task.project}</span>
                            </Space>
                            <Progress percent={task.progress} size="small" />
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Tabs.TabPane>
              <Tabs.TabPane 
                tab={
                  <Badge count={tasks.filter(t => t.status === '进行中').length}>
                    <span>进行中</span>
                  </Badge>
                }
                key="inProgress"
              >
                <List
                  dataSource={tasks.filter(t => t.status === '进行中')}
                  renderItem={(task) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{ backgroundColor: '#faad14' }}>
                            {task.assignee?.charAt(0)}
                          </Avatar>
                        }
                        title={task.title}
                        description={`负责人: ${task.assignee} | 截止: ${task.dueDate}`}
                      />
                      <Progress percent={task.progress} style={{ width: 150 }} />
                    </List.Item>
                  )}
                  locale={{ emptyText: '暂无进行中的任务' }}
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab="待开始" key="todo">
                <List
                  dataSource={tasks.filter(t => t.status === '待开始')}
                  renderItem={(task) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{ backgroundColor: '#d9d9d9' }}>
                            {task.assignee?.charAt(0)}
                          </Avatar>
                        }
                        title={task.title}
                        description={`负责人: ${task.assignee} | 截止: ${task.dueDate}`}
                      />
                    </List.Item>
                  )}
                  locale={{ emptyText: '暂无待开始的任务' }}
                />
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </Col>

        {/* 团队成员和消息 */}
        <Col xs={24} lg={10}>
          <Card
            title="团队成员"
            style={{ marginBottom: 16 }}
          >
            <List
              dataSource={teamMembers}
              renderItem={(member) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Badge status={getOnlineStatusColor(member.status)} dot>
                        <Avatar style={{ backgroundColor: '#87d068' }}>
                          {member.name.charAt(0)}
                        </Avatar>
                      </Badge>
                    }
                    title={
                      <Space>
                        <span>{member.name}</span>
                        <Tag size="small">{member.role}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div>
                          <span style={{ fontSize: 12, color: '#666' }}>
                            任务: {member.completedTasks}/{member.tasksCount}
                          </span>
                        </div>
                        <Progress
                          percent={member.performance}
                          size="small"
                          strokeColor={
                            member.performance >= 90 ? '#52c41a' :
                            member.performance >= 80 ? '#1890ff' : '#faad14'
                          }
                        />
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card
            title={
              <Badge count={unreadCount}>
                <span>团队消息</span>
              </Badge>
            }
            extra={
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                onClick={() => setIsMessageModalVisible(true)}
              >
                发送消息
              </Button>
            }
          >
            <Timeline
              items={messages.map(msg => ({
                color: msg.type === 'announcement' ? 'blue' : 'green',
                dot: msg.unread ? <Badge status="processing" /> : null,
                children: (
                  <div style={{ 
                    background: msg.unread ? '#f0f5ff' : 'transparent',
                    padding: msg.unread ? 8 : 0,
                    borderRadius: 4,
                    marginLeft: -8
                  }}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Space>
                        <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                          {msg.sender.charAt(0)}
                        </Avatar>
                        <strong>{msg.sender}</strong>
                        {msg.type === 'announcement' && (
                          <Tag color="blue">公告</Tag>
                        )}
                      </Space>
                      <div>{msg.content}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {msg.time.format('YYYY-MM-DD HH:mm')}
                      </div>
                    </Space>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* 新建任务Modal */}
      <Modal
        title="新建任务"
        open={isTaskModalVisible}
        onCancel={() => {
          setIsTaskModalVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTask}
        >
          <Form.Item
            label="任务标题"
            name="title"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="分配给"
                name="assigneeId"
                rules={[{ required: true, message: '请选择负责人' }]}
              >
                <Select placeholder="请选择负责人">
                  {teamMembers.map(member => (
                    <Option key={member.id} value={member.id}>
                      {member.name} - {member.role}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="优先级"
                name="priority"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select placeholder="请选择优先级">
                  <Option value="紧急">紧急</Option>
                  <Option value="高">高</Option>
                  <Option value="中">中</Option>
                  <Option value="低">低</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="截止日期"
                name="dueDate"
                rules={[{ required: true, message: '请选择截止日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="关联项目"
                name="project"
              >
                <Input placeholder="项目编号（可选）" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="任务描述"
            name="description"
          >
            <TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 发送消息Modal */}
      <Modal
        title="发送消息"
        open={isMessageModalVisible}
        onCancel={() => {
          setIsMessageModalVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSendMessage}
        >
          <Form.Item
            label="消息类型"
            name="type"
            initialValue="text"
          >
            <Select>
              <Option value="text">普通消息</Option>
              <Option value="announcement">团队公告</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="消息内容"
            name="content"
            rules={[{ required: true, message: '请输入消息内容' }]}
          >
            <TextArea rows={4} placeholder="请输入消息内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TeamCollaboration

