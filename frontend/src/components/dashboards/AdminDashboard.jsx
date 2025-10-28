/**
 * AdminDashboard - 管理员仪表盘
 * 
 * 显示系统整体运营数据、用户管理、系统监控等
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, Table, Tag, Space, Typography,
  Progress, Alert, Spin
} from 'antd'
import { 
  UserOutlined, ProjectOutlined, ShoppingCartOutlined, 
  ToolOutlined, TeamOutlined, RiseOutlined, SettingOutlined,
  DashboardOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'

const { Title, Text } = Typography

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeTickets: 0,
  })

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    setLoading(true)
    try {
      // TODO: 调用实际的API获取管理员统计数据
      // 模拟数据
      setTimeout(() => {
        setStats({
          totalUsers: 25,
          totalProjects: 156,
          totalOrders: 89,
          totalRevenue: 2580000,
          activeTickets: 12,
        })
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('Failed to fetch admin stats:', error)
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: '用户管理',
      description: '管理系统用户和权限',
      icon: <UserOutlined />,
      color: '#1890ff',
      onClick: () => navigate('/admin'),
    },
    {
      title: '系统设置',
      description: '配置系统参数',
      icon: <SettingOutlined />,
      color: '#52c41a',
      onClick: () => navigate('/admin/settings'),
    },
    {
      title: '数据分析',
      description: '查看运营报表',
      icon: <DashboardOutlined />,
      color: '#722ed1',
      onClick: () => navigate('/admin/analytics'),
    },
  ]

  return (
    <Spin spinning={loading}>
      <div>
        {/* 欢迎信息 */}
        <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Space direction="vertical" size="small">
            <Title level={3} style={{ margin: 0, color: 'white' }}>
              管理员控制台
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
              欢迎回来，{user?.name}！Welcome to Project Ark - 系统运行正常
            </Text>
          </Space>
        </Card>

        {/* 系统统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="系统用户"
                value={stats.totalUsers}
                prefix={<UserOutlined />}
                suffix="人"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总项目数"
                value={stats.totalProjects}
                prefix={<ProjectOutlined />}
                suffix="个"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="订单总数"
                value={stats.totalOrders}
                prefix={<ShoppingCartOutlined />}
                suffix="单"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总营收"
                value={stats.totalRevenue}
                prefix={<RiseOutlined />}
                suffix="元"
                valueStyle={{ color: '#fa8c16' }}
                precision={0}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* 快捷操作 */}
          <Col xs={24} lg={12}>
            <Card title="管理功能">
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

          {/* 系统状态 */}
          <Col xs={24} lg={12}>
            <Card title="系统状态">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <Text>CPU 使用率</Text>
                  <Progress percent={45} status="active" />
                </div>
                <div>
                  <Text>内存使用率</Text>
                  <Progress percent={62} status="active" />
                </div>
                <div>
                  <Text>磁盘使用率</Text>
                  <Progress percent={78} status="normal" />
                </div>
                <Alert
                  message="系统运行正常"
                  description="所有服务运行稳定，无异常情况"
                  type="success"
                  showIcon
                />
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 待处理事项 */}
        <Card title="待处理事项" style={{ marginTop: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message={`${stats.activeTickets} 个活跃工单待处理`}
              type="warning"
              showIcon
              action={
                <Button size="small" onClick={() => navigate('/service-center')}>
                  查看
                </Button>
              }
            />
            <Alert
              message="3 个用户待审批"
              type="info"
              showIcon
              action={
                <Button size="small" onClick={() => navigate('/admin')}>
                  审批
                </Button>
              }
            />
          </Space>
        </Card>
      </div>
    </Spin>
  )
}

export default AdminDashboard

