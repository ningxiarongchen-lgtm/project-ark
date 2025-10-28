import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, Space, Typography, 
  List, Tag, Alert, Spin
} from 'antd'
import { 
  ProjectOutlined, DatabaseOutlined, ThunderboltOutlined,
  PlusOutlined, FolderOpenOutlined, RightOutlined,
  UserOutlined, CheckCircleOutlined
} from '@ant-design/icons'
import { projectsAPI, actuatorsAPI, manualOverridesAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, getRoleNameCN } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    projectCount: 0,
    actuatorCount: 0,
    overrideCount: 0,
    selectionCount: 0
  })
  const [recentProjects, setRecentProjects] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // 并行获取数据
      const [projectsRes, actuatorsRes, overridesRes] = await Promise.all([
        projectsAPI.getAll(),
        actuatorsAPI.getAll(),
        manualOverridesAPI.getAll()
      ])

      const projects = projectsRes.data || []
      const actuators = actuatorsRes.data || []
      const overrides = overridesRes.data || []

      // 计算统计数据
      const selectionCount = projects.reduce((sum, project) => {
        return sum + (project.selections?.length || 0)
      }, 0)

      setStats({
        projectCount: projects.length,
        actuatorCount: actuators.length,
        overrideCount: overrides.length,
        selectionCount: selectionCount
      })

      // 获取最近的5个项目
      const sortedProjects = [...projects].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      setRecentProjects(sortedProjects.slice(0, 5))

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      icon: <ThunderboltOutlined />,
      title: '智能选型',
      description: '开始一个新的执行器选型',
      color: '#1890ff',
      onClick: () => navigate('/selection-engine')
    },
    {
      icon: <PlusOutlined />,
      title: '新建项目',
      description: '创建一个新的选型项目',
      color: '#52c41a',
      onClick: () => navigate('/projects')
    },
    {
      icon: <DatabaseOutlined />,
      title: '产品管理',
      description: '查看和管理产品数据',
      color: '#722ed1',
      onClick: () => navigate('/products')
    },
  ]

  // 管理员额外的快捷操作
  if (user?.role === 'Administrator') {
    quickActions.push({
      icon: <DatabaseOutlined />,
      title: '数据管理',
      description: '管理系统基础数据',
      color: '#fa8c16',
      onClick: () => navigate('/admin')
    })
  }

  return (
    <Spin spinning={loading}>
      <div>
        {/* 欢迎信息 */}
        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" size="small">
            <Title level={3} style={{ margin: 0 }}>
              欢迎回来，{user?.username || user?.name}！
            </Title>
            <Text type="secondary">
              当前角色：<Tag color="blue">{getRoleNameCN()}</Tag> | 
              登录时间：{dayjs().format('YYYY-MM-DD HH:mm')}
            </Text>
            <Paragraph style={{ margin: '8px 0 0 0' }}>
              C-MAX SF系列气动执行器智能选型系统为您提供快速、准确的执行器选型服务。
            </Paragraph>
          </Space>
        </Card>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="我的项目"
                value={stats.projectCount}
                prefix={<ProjectOutlined />}
                suffix="个"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="完成选型"
                value={stats.selectionCount}
                prefix={<CheckCircleOutlined />}
                suffix="次"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="执行器库"
                value={stats.actuatorCount}
                prefix={<DatabaseOutlined />}
                suffix="个"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="手动装置"
                value={stats.overrideCount}
                prefix={<DatabaseOutlined />}
                suffix="个"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* 快捷操作 */}
          <Col xs={24} lg={12}>
            <Card 
              title="快捷操作"
              extra={<RightOutlined />}
            >
              <Row gutter={[16, 16]}>
                {quickActions.map((action, index) => (
                  <Col span={12} key={index}>
                    <Card
                      hoverable
                      style={{ 
                        borderLeft: `4px solid ${action.color}`,
                        cursor: 'pointer'
                      }}
                      onClick={action.onClick}
                    >
                      <Space direction="vertical" size="small">
                        <div style={{ fontSize: 32, color: action.color }}>
                          {action.icon}
                        </div>
                        <Title level={5} style={{ margin: 0 }}>
                          {action.title}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {action.description}
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          {/* 最近项目 */}
          <Col xs={24} lg={12}>
            <Card 
              title="最近项目"
              extra={
                <Button 
                  type="link" 
                  onClick={() => navigate('/projects')}
                >
                  查看全部 <RightOutlined />
                </Button>
              }
            >
              {recentProjects.length === 0 ? (
                <Alert
                  message="还没有项目"
                  description="点击快捷操作创建您的第一个项目"
                  type="info"
                  showIcon
                />
              ) : (
                <List
                  dataSource={recentProjects}
                  renderItem={project => (
                    <List.Item
                      key={project._id}
                      actions={[
                        <Button
                          type="link"
                          icon={<FolderOpenOutlined />}
                          onClick={() => navigate(`/selection-engine?projectId=${project._id}`)}
                        >
                          打开
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<ProjectOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                        title={project.project_name}
                        description={
                          <Space size="small">
                            <Text type="secondary">{project.client_name || '无客户'}</Text>
                            <Tag color="blue">{project.selections?.length || 0} 个选型</Tag>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(project.createdAt).format('MM-DD HH:mm')}
                            </Text>
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

        {/* 使用提示 */}
        <Card 
          title="使用指南" 
          style={{ marginTop: 24 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Space direction="vertical">
                <Title level={5}>
                  <span style={{ color: '#1890ff' }}>1.</span> 创建项目
                </Title>
                <Text type="secondary">
                  在项目管理中创建新项目，用于组织多个阀门的选型工作。
                </Text>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space direction="vertical">
                <Title level={5}>
                  <span style={{ color: '#52c41a' }}>2.</span> 智能选型
                </Title>
                <Text type="secondary">
                  输入阀门参数，系统自动推荐最合适的执行器和手动操作装置。
                </Text>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space direction="vertical">
                <Title level={5}>
                  <span style={{ color: '#722ed1' }}>3.</span> 生成报价
                </Title>
                <Text type="secondary">
                  选型完成后，可以一键生成技术数据表和商务报价单。
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>
    </Spin>
  )
}

export default Dashboard
