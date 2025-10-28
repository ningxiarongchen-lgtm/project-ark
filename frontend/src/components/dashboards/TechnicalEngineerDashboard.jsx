/**
 * TechnicalEngineerDashboard - 技术工程师仪表盘
 * 
 * 显示项目任务、技术选型、产品数据等
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, List, Tag, Space, Typography,
  Progress, Empty, Spin
} from 'antd'
import { 
  ProjectOutlined, ToolOutlined, CheckCircleOutlined,
  ClockCircleOutlined, RocketOutlined, DatabaseOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'

const { Title, Text } = Typography

const TechnicalEngineerDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    myProjects: 0,
    completedSelections: 0,
    pendingTasks: 0,
  })
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    fetchEngineerData()
  }, [])

  const fetchEngineerData = async () => {
    setLoading(true)
    try {
      // TODO: 调用实际API
      setTimeout(() => {
        setStats({
          myProjects: 8,
          completedSelections: 23,
          pendingTasks: 5,
        })
        setTasks([
          { id: 1, title: '某石化项目阀门选型', project: '中石化项目', priority: 'high', deadline: '2025-11-05' },
          { id: 2, title: '某电厂执行器配置', project: '火电厂改造', priority: 'medium', deadline: '2025-11-08' },
          { id: 3, title: '某制药厂技术方案', project: '制药厂新建', priority: 'low', deadline: '2025-11-10' },
        ])
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('Failed to fetch engineer data:', error)
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: '智能选型',
      description: '开始新的技术选型',
      icon: <ToolOutlined />,
      color: '#1890ff',
      onClick: () => navigate('/selection-engine'),
    },
    {
      title: '我的项目',
      description: '查看项目列表',
      icon: <ProjectOutlined />,
      color: '#52c41a',
      onClick: () => navigate('/projects'),
    },
    {
      title: '产品数据库',
      description: '查询产品参数',
      icon: <DatabaseOutlined />,
      color: '#722ed1',
      onClick: () => navigate('/products'),
    },
  ]

  const getPriorityColor = (priority) => {
    const colors = { high: 'red', medium: 'orange', low: 'blue' }
    return colors[priority] || 'default'
  }

  const getPriorityText = (priority) => {
    const texts = { high: '紧急', medium: '普通', low: '低优先级' }
    return texts[priority] || priority
  }

  return (
    <Spin spinning={loading}>
      <div>
        {/* 欢迎信息 */}
        <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Space direction="vertical" size="small">
            <Title level={3} style={{ margin: 0, color: 'white' }}>
              <RocketOutlined /> 技术工程师工作台
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
              Welcome to Project Ark，{user?.name}！专注于技术选型与方案设计
            </Text>
          </Space>
        </Card>

        {/* 工作统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="我的项目"
                value={stats.myProjects}
                prefix={<ProjectOutlined />}
                suffix="个"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="已完成选型"
                value={stats.completedSelections}
                prefix={<CheckCircleOutlined />}
                suffix="次"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="待处理任务"
                value={stats.pendingTasks}
                prefix={<ClockCircleOutlined />}
                suffix="项"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* 快捷操作 */}
          <Col xs={24} lg={12}>
            <Card title="快捷操作">
              <Row gutter={[16, 16]}>
                {quickActions.map((action, index) => (
                  <Col span={24} key={index}>
                    <Card
                      hoverable
                      style={{ borderLeft: `4px solid ${action.color}` }}
                      onClick={action.onClick}
                    >
                      <Space>
                        <div style={{ fontSize: 32, color: action.color }}>
                          {action.icon}
                        </div>
                        <div>
                          <Title level={5} style={{ margin: 0 }}>
                            {action.title}
                          </Title>
                          <Text type="secondary">{action.description}</Text>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          {/* 待办任务 */}
          <Col xs={24} lg={12}>
            <Card title="我的任务" extra={<Text type="secondary">{tasks.length} 项待办</Text>}>
              {tasks.length === 0 ? (
                <Empty description="暂无待办任务" />
              ) : (
                <List
                  dataSource={tasks}
                  renderItem={task => (
                    <List.Item
                      actions={[
                        <Button type="link" onClick={() => navigate('/projects')}>
                          查看
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            {task.title}
                            <Tag color={getPriorityColor(task.priority)}>
                              {getPriorityText(task.priority)}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size="small">
                            <Text type="secondary">项目：{task.project}</Text>
                            <Text type="secondary">截止：{task.deadline}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* 本周进度 */}
        <Card title="本周工作进度" style={{ marginTop: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text>项目完成度</Text>
              <Progress percent={65} status="active" />
            </div>
            <div>
              <Text>选型任务完成度</Text>
              <Progress percent={80} status="active" />
            </div>
            <div>
              <Text>技术方案评审</Text>
              <Progress percent={45} status="normal" />
            </div>
          </Space>
        </Card>
      </div>
    </Spin>
  )
}

export default TechnicalEngineerDashboard

