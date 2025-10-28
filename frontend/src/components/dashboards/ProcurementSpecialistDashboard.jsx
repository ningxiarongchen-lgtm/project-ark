/**
 * ProcurementSpecialistDashboard - 采购专员仪表盘
 * 
 * 显示采购订单、供应商管理、库存状态等
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, List, Tag, Space, Typography,
  Progress, Empty, Spin, Alert
} from 'antd'
import { 
  ShoppingCartOutlined, TeamOutlined, InboxOutlined,
  DollarOutlined, CheckCircleOutlined, ClockCircleOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'

const { Title, Text } = Typography

const ProcurementSpecialistDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    activeSuppliers: 0,
    pendingOrders: 0,
    monthlySpending: 0,
    onTimeRate: 0,
  })
  const [pendingPurchases, setPendingPurchases] = useState([])

  useEffect(() => {
    fetchProcurementData()
  }, [])

  const fetchProcurementData = async () => {
    setLoading(true)
    try {
      // TODO: 调用实际API
      setTimeout(() => {
        setStats({
          activeSuppliers: 15,
          pendingOrders: 6,
          monthlySpending: 850000,
          onTimeRate: 92,
        })
        setPendingPurchases([
          { id: 1, item: '执行器配件', supplier: '某供应商A', amount: 45000, status: 'pending', deadline: '2025-11-03' },
          { id: 2, item: '气缸组件', supplier: '某供应商B', amount: 32000, status: 'processing', deadline: '2025-11-05' },
          { id: 3, item: '控制阀', supplier: '某供应商C', amount: 58000, status: 'pending', deadline: '2025-11-08' },
        ])
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('Failed to fetch procurement data:', error)
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: '供应商管理',
      description: '管理供应商信息',
      icon: <TeamOutlined />,
      color: '#1890ff',
      onClick: () => navigate('/suppliers'),
    },
    {
      title: '采购订单',
      description: '查看采购订单',
      icon: <ShoppingCartOutlined />,
      color: '#52c41a',
      onClick: () => navigate('/orders'),
    },
    {
      title: '库存管理',
      description: '查看库存状态',
      icon: <InboxOutlined />,
      color: '#722ed1',
      onClick: () => navigate('/inventory'),
    },
  ]

  const getStatusColor = (status) => {
    const colors = { pending: 'orange', processing: 'blue', completed: 'green' }
    return colors[status] || 'default'
  }

  const getStatusText = (status) => {
    const texts = { pending: '待处理', processing: '处理中', completed: '已完成' }
    return texts[status] || status
  }

  return (
    <Spin spinning={loading}>
      <div>
        {/* 欢迎信息 */}
        <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
          <Space direction="vertical" size="small">
            <Title level={3} style={{ margin: 0, color: '#333' }}>
              <ShoppingCartOutlined /> 采购专员工作台
            </Title>
            <Text style={{ color: '#666' }}>
              Welcome to Project Ark，{user?.name}！准时交付率 {stats.onTimeRate}%
            </Text>
          </Space>
        </Card>

        {/* 采购统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="合作供应商"
                value={stats.activeSuppliers}
                prefix={<TeamOutlined />}
                suffix="家"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="待处理订单"
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
                title="本月采购额"
                value={stats.monthlySpending}
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
                title="准时交付率"
                value={stats.onTimeRate}
                prefix={<CheckCircleOutlined />}
                suffix="%"
                valueStyle={{ color: '#722ed1' }}
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

          {/* 待处理采购 */}
          <Col xs={24} lg={12}>
            <Card title="待处理采购" extra={<Text type="secondary">{pendingPurchases.length} 项</Text>}>
              {pendingPurchases.length === 0 ? (
                <Empty description="暂无待处理采购" />
              ) : (
                <List
                  dataSource={pendingPurchases}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Button type="link" onClick={() => navigate('/orders')}>
                          处理
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            {item.item}
                            <Tag color={getStatusColor(item.status)}>
                              {getStatusText(item.status)}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size="small">
                            <Text type="secondary">供应商：{item.supplier}</Text>
                            <Text type="secondary">金额：¥{item.amount.toLocaleString()}</Text>
                            <Text type="secondary">截止：{item.deadline}</Text>
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

        {/* 本月采购分析 */}
        <Card title="本月采购分析" style={{ marginTop: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text>预算使用率（100万预算）</Text>
              <Progress 
                percent={Math.round((stats.monthlySpending / 1000000) * 100)} 
                status="active"
              />
            </div>
            <div>
              <Text>订单完成率</Text>
              <Progress percent={78} status="active" />
            </div>
            <Alert
              message="采购进度正常"
              description="本月采购进度良好，供应商交付及时"
              type="success"
              showIcon
            />
          </Space>
        </Card>
      </div>
    </Spin>
  )
}

export default ProcurementSpecialistDashboard

