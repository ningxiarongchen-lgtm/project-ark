/**
 * SalesManagerDashboard - 销售经理仪表盘
 * 
 * 显示团队业绩、订单审批、销售分析等
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, Table, Tag, Space, Typography,
  Progress, Alert, Spin
} from 'antd'
import { 
  TeamOutlined, RiseOutlined, DollarOutlined, CheckCircleOutlined,
  FileTextOutlined, TrophyOutlined, ClockCircleOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import GreetingWidget from './GreetingWidget'

const { Title, Text } = Typography

const SalesManagerDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    pendingOrders: 0,
    teamMembers: 0,
    achievementRate: 0,
  })
  const [pendingApprovals, setPendingApprovals] = useState([])

  useEffect(() => {
    fetchManagerData()
  }, [])

  const fetchManagerData = async () => {
    setLoading(true)
    try {
      // TODO: 调用实际API
      setTimeout(() => {
        setStats({
          monthlyRevenue: 1250000,
          pendingOrders: 8,
          teamMembers: 12,
          achievementRate: 85,
        })
        setPendingApprovals([
          { id: 1, orderNo: 'ORD-2025-001', client: '中石化项目', amount: 180000, engineer: '张工' },
          { id: 2, orderNo: 'ORD-2025-002', client: '某电厂', amount: 95000, engineer: '李工' },
          { id: 3, orderNo: 'ORD-2025-003', client: '制药厂', amount: 120000, engineer: '王工' },
        ])
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('Failed to fetch manager data:', error)
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: '订单审批',
      description: '审批待处理订单',
      icon: <CheckCircleOutlined />,
      color: '#1890ff',
      count: stats.pendingOrders,
      onClick: () => navigate('/orders'),
    },
    {
      title: '团队管理',
      description: '查看团队业绩',
      icon: <TeamOutlined />,
      color: '#52c41a',
      onClick: () => navigate('/team'),
    },
    {
      title: '销售报表',
      description: '查看销售数据',
      icon: <RiseOutlined />,
      color: '#722ed1',
      onClick: () => navigate('/reports'),
    },
  ]

  const approvalColumns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '客户',
      dataIndex: 'client',
      key: 'client',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '销售工程师',
      dataIndex: 'engineer',
      key: 'engineer',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/orders/${record.id}`)}>
            查看
          </Button>
          <Button type="primary" size="small">
            审批
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Spin spinning={loading}>
      <div>
        {/* 动态问候语 */}
        <GreetingWidget />

        {/* 业绩统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="本月营收"
                value={stats.monthlyRevenue}
                prefix={<DollarOutlined />}
                suffix="元"
                valueStyle={{ color: '#52c41a' }}
                precision={0}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="待审批订单"
                value={stats.pendingOrders}
                prefix={<ClockCircleOutlined />}
                suffix="单"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="团队人数"
                value={stats.teamMembers}
                prefix={<TeamOutlined />}
                suffix="人"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="目标达成率"
                value={stats.achievementRate}
                prefix={<RiseOutlined />}
                suffix="%"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* 快捷操作 */}
          <Col xs={24} lg={8}>
            <Card title="快捷操作">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {quickActions.map((action, index) => (
                  <Card
                    key={index}
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
                          {action.count > 0 && (
                            <Tag color="red" style={{ marginLeft: 8 }}>
                              {action.count}
                            </Tag>
                          )}
                        </Title>
                        <Text type="secondary">{action.description}</Text>
                      </div>
                    </Space>
                  </Card>
                ))}
              </Space>
            </Card>
          </Col>

          {/* 本月目标进度 */}
          <Col xs={24} lg={16}>
            <Card title="本月目标进度">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <Text>营收目标（150万）</Text>
                  <Progress 
                    percent={Math.round((stats.monthlyRevenue / 1500000) * 100)} 
                    status="active"
                    strokeColor="#52c41a"
                  />
                </div>
                <div>
                  <Text>订单数量目标（30单）</Text>
                  <Progress percent={73} status="active" strokeColor="#1890ff" />
                </div>
                <div>
                  <Text>客户开发目标（10家）</Text>
                  <Progress percent={60} status="normal" strokeColor="#722ed1" />
                </div>
                <Alert
                  message="本月业绩良好"
                  description="团队表现出色，继续保持！距离目标还差15%"
                  type="success"
                  showIcon
                />
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 待审批订单 */}
        <Card title="待审批订单" style={{ marginTop: 24 }}>
          <Table
            columns={approvalColumns}
            dataSource={pendingApprovals}
            rowKey="id"
            pagination={false}
          />
        </Card>
      </div>
    </Spin>
  )
}

export default SalesManagerDashboard

