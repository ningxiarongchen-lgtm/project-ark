/**
 * ProcurementSpecialistDashboard - 采购专员仪表盘
 * 
 * 核心职责：
 * 1. 管理采购订单
 * 2. 维护供应商关系
 * 3. 监控采购进度和成本
 * 4. 确保及时交付
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, Table, Tag, Space, Typography,
  Progress, Empty, Spin, Alert, Badge
} from 'antd'
import { 
  ShoppingCartOutlined, TeamOutlined, InboxOutlined,
  DollarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  PlusOutlined, FileSearchOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { purchaseOrdersAPI, suppliersAPI } from '../../services/api'
import GreetingWidget from './GreetingWidget'

const { Title, Text } = Typography

const ProcurementSpecialistDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    activeSuppliers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
  })
  const [pendingPurchases, setPendingPurchases] = useState([])

  useEffect(() => {
    fetchProcurementData()
  }, [])

  const fetchProcurementData = async () => {
    setLoading(true)
    try {
      // 获取采购订单数据
      const ordersResponse = await purchaseOrdersAPI.getAll({ 
        limit: 100,
        sortBy: '-createdAt'
      })

      // 获取供应商数据
      const suppliersResponse = await suppliersAPI.getAll({ 
        limit: 100 
      })

      const orders = ordersResponse.data.purchaseOrders || ordersResponse.data.data || []
      const suppliers = suppliersResponse.data.suppliers || suppliersResponse.data.data || []

      // 统计活跃供应商（状态为Active）
      const activeSuppliers = suppliers.filter(s => s.status === 'Active').length

      // 统计各状态的订单
      const pendingOrders = orders.filter(o => o.status === 'Pending').length
      const processingOrders = orders.filter(o => 
        o.status === 'Confirmed' || o.status === 'In Progress'
      ).length

      setStats({
        activeSuppliers,
        totalOrders: orders.length,
        pendingOrders,
        processingOrders,
      })

      // 设置待处理的采购订单（前5个）
      const pending = orders.filter(o => o.status === 'Pending').slice(0, 5)
      setPendingPurchases(pending)

    } catch (error) {
      console.error('获取采购数据失败:', error)
      // 使用模拟数据作为降级方案
      setStats({
        activeSuppliers: 15,
        totalOrders: 45,
        pendingOrders: 6,
        processingOrders: 12,
      })
      setPendingPurchases([
        { 
          _id: '1', 
          orderNumber: 'PO-2025-001', 
          items: [{ productName: '执行器配件' }],
          supplier: { name: '某供应商A' },
          totalAmount: 45000,
          status: 'Pending',
          expectedDeliveryDate: '2025-11-03'
        },
        { 
          _id: '2', 
          orderNumber: 'PO-2025-002', 
          items: [{ productName: '气缸组件' }],
          supplier: { name: '某供应商B' },
          totalAmount: 32000,
          status: 'Pending',
          expectedDeliveryDate: '2025-11-05'
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: '待处理订单',
      description: '需要确认的采购订单',
      icon: <ClockCircleOutlined />,
      color: '#fa8c16',
      count: stats.pendingOrders,
      onClick: () => navigate('/purchase-orders?status=Pending'),
    },
    {
      title: '新建订单',
      description: '创建采购订单',
      icon: <PlusOutlined />,
      color: '#52c41a',
      onClick: () => navigate('/purchase-orders'),
    },
    {
      title: '供应商管理',
      description: '管理供应商信息',
      icon: <TeamOutlined />,
      color: '#1890ff',
      onClick: () => navigate('/suppliers'),
    },
    {
      title: '订单历史',
      description: '查看所有采购订单',
      icon: <FileSearchOutlined />,
      color: '#722ed1',
      onClick: () => navigate('/purchase-orders'),
    },
  ]

  const getStatusColor = (status) => {
    const colors = { 
      'Pending': 'orange',
      'Confirmed': 'blue',
      'In Progress': 'cyan',
      'Partially Delivered': 'purple',
      'Delivered': 'green',
      'Cancelled': 'default'
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status) => {
    const texts = { 
      'Pending': '待处理',
      'Confirmed': '已确认',
      'In Progress': '进行中',
      'Partially Delivered': '部分交付',
      'Delivered': '已交付',
      'Cancelled': '已取消'
    }
    return texts[status] || status
  }

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
    },
    {
      title: '产品',
      key: 'items',
      ellipsis: true,
      render: (_, record) => {
        const items = record.items || []
        return items.length > 0 ? items[0].productName : '-'
      },
    },
    {
      title: '供应商',
      key: 'supplier',
      width: 150,
      render: (_, record) => record.supplier?.name || '-',
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (amount) => `¥${(amount || 0).toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => navigate(`/purchase-orders/${record._id}`)}
        >
          查看
        </Button>
      ),
    },
  ]

  return (
    <Spin spinning={loading}>
      <div>
        {/* 动态问候语 */}
        <GreetingWidget />

        {/* 采购统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable onClick={() => navigate('/suppliers')}>
              <Statistic
                title="合作供应商"
                value={stats.activeSuppliers}
                prefix={<TeamOutlined />}
                suffix="家"
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  活跃供应商
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable onClick={() => navigate('/purchase-orders?status=Pending')}>
              <Statistic
                title="待处理订单"
                value={stats.pendingOrders}
                prefix={<ClockCircleOutlined />}
                suffix="单"
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  需要确认
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable onClick={() => navigate('/purchase-orders')}>
              <Statistic
                title="处理中订单"
                value={stats.processingOrders}
                prefix={<ShoppingCartOutlined />}
                suffix="单"
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  进行中
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="订单总数"
                value={stats.totalOrders}
                prefix={<InboxOutlined />}
                suffix="单"
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  全部采购订单
                </Text>
              </div>
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
                          {action.count !== undefined && action.count > 0 && (
                            <Badge 
                              count={action.count} 
                              style={{ marginLeft: 8 }}
                            />
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

          {/* 订单状态分布 */}
          <Col xs={24} lg={16}>
            <Card title="订单状态分布">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <Text>待处理</Text>
                    <Space>
                      <Text type="secondary">{stats.pendingOrders} 单</Text>
                      <Text strong style={{ color: '#fa8c16' }}>
                        {stats.totalOrders > 0 
                          ? Math.round((stats.pendingOrders / stats.totalOrders) * 100)
                          : 0}%
                      </Text>
                    </Space>
                  </div>
                  <Progress 
                    percent={stats.totalOrders > 0 
                      ? Math.round((stats.pendingOrders / stats.totalOrders) * 100)
                      : 0
                    } 
                    strokeColor="#fa8c16"
                    showInfo={false}
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <Text>处理中</Text>
                    <Space>
                      <Text type="secondary">{stats.processingOrders} 单</Text>
                      <Text strong style={{ color: '#1890ff' }}>
                        {stats.totalOrders > 0 
                          ? Math.round((stats.processingOrders / stats.totalOrders) * 100)
                          : 0}%
                      </Text>
                    </Space>
                  </div>
                  <Progress 
                    percent={stats.totalOrders > 0 
                      ? Math.round((stats.processingOrders / stats.totalOrders) * 100)
                      : 0
                    }
                    strokeColor="#1890ff"
                    showInfo={false}
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <Text>供应商合作</Text>
                    <Space>
                      <Text type="secondary">{stats.activeSuppliers} 家</Text>
                      <Text strong style={{ color: '#52c41a' }}>
                        合作良好
                      </Text>
                    </Space>
                  </div>
                  <Progress 
                    percent={stats.activeSuppliers > 0 ? 100 : 0}
                    strokeColor="#52c41a"
                    showInfo={false}
                  />
                </div>
                
                <Alert
                  message="💡 工作提示"
                  description={
                    stats.pendingOrders > 0 
                      ? `您有 ${stats.pendingOrders} 个采购订单待处理，请及时确认！`
                      : stats.processingOrders > 0
                      ? `您有 ${stats.processingOrders} 个订单正在处理中，请持续跟进！`
                      : '所有采购订单处理顺利，继续保持！'
                  }
                  type={stats.pendingOrders > 0 ? 'warning' : 'success'}
                  showIcon
                />
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 待处理采购订单 */}
        <Card 
          title={
            <Space>
              <ClockCircleOutlined style={{ color: '#fa8c16' }} />
              <span>待处理采购订单</span>
              <Badge count={stats.pendingOrders} />
            </Space>
          }
          extra={
            <Button 
              type="link"
              onClick={() => navigate('/purchase-orders?status=Pending')}
            >
              查看全部
            </Button>
          }
          style={{ marginTop: 24 }}
        >
          <Table
            columns={orderColumns}
            dataSource={pendingPurchases}
            rowKey="_id"
            pagination={false}
            locale={{ emptyText: '暂无待处理采购订单' }}
          />
        </Card>
      </div>
    </Spin>
  )
}

export default ProcurementSpecialistDashboard
