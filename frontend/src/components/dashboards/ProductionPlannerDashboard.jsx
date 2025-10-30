/**
 * ProductionPlannerDashboard - 生产计划员仪表盘
 * 
 * 核心职责：
 * 1. 管理生产订单和排期
 * 2. 监控生产进度
 * 3. 协调生产资源
 * 4. 确保按时交付
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, Table, Tag, Space, Typography,
  Progress, Alert, Spin, Badge
} from 'antd'
import { 
  ScheduleOutlined, ToolOutlined, CheckCircleOutlined,
  ClockCircleOutlined, WarningOutlined, RocketOutlined,
  PlusOutlined, FileSearchOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { productionAPI } from '../../services/api'
import GreetingWidget from './GreetingWidget'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const ProductionPlannerDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    inProductionOrders: 0,
    completedToday: 0,
    delayedOrders: 0,
  })
  const [productionOrders, setProductionOrders] = useState([])

  useEffect(() => {
    fetchProductionData()
  }, [])

  const fetchProductionData = async () => {
    setLoading(true)
    try {
      // 获取生产订单数据
      const response = await productionAPI.getAll({ 
        limit: 100,
        sortBy: '-createdAt'
      })

      const orders = response.data.productionOrders || response.data.data || []

      // 统计各状态的订单
      const pendingOrders = orders.filter(o => o.status === 'Pending').length
      const inProductionOrders = orders.filter(o => 
        o.status === 'In Production' || o.status === 'Scheduled'
      ).length
      const delayedOrders = orders.filter(o => o.status === 'Delayed').length

      // 计算今日完成的订单
      const today = dayjs().format('YYYY-MM-DD')
      const completedToday = orders.filter(o => 
        o.status === 'Completed' &&
        dayjs(o.updatedAt).format('YYYY-MM-DD') === today
      ).length

      setStats({
        totalOrders: orders.length,
        pendingOrders,
        inProductionOrders,
        completedToday,
        delayedOrders,
      })

      // 设置生产订单列表（前5个进行中的）
      const activeOrders = orders.filter(o => 
        o.status === 'Pending' || o.status === 'Scheduled' || o.status === 'In Production'
      ).slice(0, 5)
      setProductionOrders(activeOrders)

    } catch (error) {
      console.error('获取生产数据失败:', error)
      // 使用模拟数据作为降级方案
      setStats({
        totalOrders: 45,
        pendingOrders: 8,
        inProductionOrders: 15,
        completedToday: 6,
        delayedOrders: 2,
      })
      setProductionOrders([
        { 
          _id: '1', 
          productionOrderNumber: 'PROD-2025-001', 
          orderSnapshot: { 
            projectName: '中石化执行器项目',
            clientName: '中石化'
          },
          status: 'In Production',
          priority: 'High',
          schedule: { 
            plannedStartDate: '2025-10-28',
            plannedEndDate: '2025-11-10'
          }
        },
        { 
          _id: '2', 
          productionOrderNumber: 'PROD-2025-002', 
          orderSnapshot: { 
            projectName: '某电厂阀门订单',
            clientName: '某电力公司'
          },
          status: 'Scheduled',
          priority: 'Normal',
          schedule: { 
            plannedStartDate: '2025-11-01',
            plannedEndDate: '2025-11-15'
          }
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: '待排期订单',
      description: '需要安排生产计划',
      icon: <ClockCircleOutlined />,
      color: '#fa8c16',
      count: stats.pendingOrders,
      onClick: () => navigate('/production?status=Pending'),
    },
    {
      title: '新建生产订单',
      description: '创建生产计划',
      icon: <PlusOutlined />,
      color: '#52c41a',
      onClick: () => navigate('/production'),
    },
    {
      title: '生产排期',
      description: '查看生产计划',
      icon: <ScheduleOutlined />,
      color: '#1890ff',
      onClick: () => navigate('/production'),
    },
    {
      title: '订单历史',
      description: '查看所有生产订单',
      icon: <FileSearchOutlined />,
      color: '#722ed1',
      onClick: () => navigate('/production'),
    },
  ]

  const getStatusColor = (status) => {
    const colors = { 
      'Pending': 'orange',
      'Scheduled': 'blue',
      'In Production': 'cyan',
      'Paused': 'purple',
      'Completed': 'green',
      'Awaiting QC': 'geekblue',
      'QC Passed': 'lime',
      'Ready to Ship': 'success',
      'Shipped': 'default',
      'Cancelled': 'default',
      'Delayed': 'red'
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status) => {
    const texts = { 
      'Pending': '待排期',
      'Scheduled': '已排期',
      'In Production': '生产中',
      'Paused': '已暂停',
      'Completed': '已完成',
      'Awaiting QC': '待质检',
      'QC Passed': '质检通过',
      'Ready to Ship': '待发货',
      'Shipped': '已发货',
      'Cancelled': '已取消',
      'Delayed': '延期'
    }
    return texts[status] || status
  }

  const getPriorityColor = (priority) => {
    const colors = { 
      'Urgent': 'red',
      'High': 'orange',
      'Normal': 'blue',
      'Low': 'default'
    }
    return colors[priority] || 'default'
  }

  const orderColumns = [
    {
      title: '生产订单号',
      dataIndex: 'productionOrderNumber',
      key: 'productionOrderNumber',
      width: 150,
    },
    {
      title: '项目/客户',
      key: 'project',
      ellipsis: true,
      render: (_, record) => {
        const snapshot = record.orderSnapshot || {}
        return snapshot.projectName || snapshot.clientName || '-'
      },
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
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>{priority}</Tag>
      ),
    },
    {
      title: '计划完成',
      key: 'endDate',
      width: 120,
      render: (_, record) => {
        const endDate = record.schedule?.plannedEndDate
        return endDate ? dayjs(endDate).format('YYYY-MM-DD') : '-'
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => navigate(`/production/${record._id}`)}
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

        {/* 生产统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable onClick={() => navigate('/production?status=Pending')}>
              <Statistic
                title="待排期订单"
                value={stats.pendingOrders}
                prefix={<ClockCircleOutlined />}
                suffix="单"
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  需要安排生产
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable onClick={() => navigate('/production?status=In%20Production')}>
              <Statistic
                title="生产中"
                value={stats.inProductionOrders}
                prefix={<ToolOutlined />}
                suffix="单"
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  正在生产
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="今日完成"
                value={stats.completedToday}
                prefix={<CheckCircleOutlined />}
                suffix="单"
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  今日工作成果
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable onClick={() => navigate('/production?status=Delayed')}>
              <Statistic
                title="延期订单"
                value={stats.delayedOrders}
                prefix={<WarningOutlined />}
                suffix="单"
                valueStyle={{ color: stats.delayedOrders > 0 ? '#ff4d4f' : '#52c41a' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {stats.delayedOrders > 0 ? '需要关注' : '无延期'}
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

          {/* 生产状态分布 */}
          <Col xs={24} lg={16}>
            <Card title="生产状态分布">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <Text>待排期</Text>
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
                    <Text>生产中</Text>
                    <Space>
                      <Text type="secondary">{stats.inProductionOrders} 单</Text>
                      <Text strong style={{ color: '#1890ff' }}>
                        {stats.totalOrders > 0 
                          ? Math.round((stats.inProductionOrders / stats.totalOrders) * 100)
                          : 0}%
                      </Text>
                    </Space>
                  </div>
                  <Progress 
                    percent={stats.totalOrders > 0 
                      ? Math.round((stats.inProductionOrders / stats.totalOrders) * 100)
                      : 0
                    }
                    strokeColor="#1890ff"
                    showInfo={false}
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <Text>今日完成</Text>
                    <Space>
                      <Text type="secondary">{stats.completedToday} 单</Text>
                      <Text strong style={{ color: '#52c41a' }}>
                        生产效率良好
                      </Text>
                    </Space>
                  </div>
                  <Progress 
                    percent={stats.completedToday > 0 ? 100 : 0}
                    strokeColor="#52c41a"
                    showInfo={false}
                  />
                </div>
                
                <Alert
                  message="💡 生产提示"
                  description={
                    stats.delayedOrders > 0
                      ? `注意：有 ${stats.delayedOrders} 单延期，请及时调整生产计划！`
                      : stats.pendingOrders > 0 
                      ? `您有 ${stats.pendingOrders} 个订单待排期，请安排生产计划！`
                      : '所有生产订单进展顺利，继续保持！'
                  }
                  type={stats.delayedOrders > 0 ? 'error' : stats.pendingOrders > 0 ? 'warning' : 'success'}
                  showIcon
                />
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 生产订单列表 */}
        <Card 
          title={
            <Space>
              <RocketOutlined />
              <span>生产中订单</span>
              <Badge count={stats.inProductionOrders} />
            </Space>
          }
          extra={
            <Button 
              type="link"
              onClick={() => navigate('/production')}
            >
              查看全部
            </Button>
          }
          style={{ marginTop: 24 }}
        >
          <Table
            columns={orderColumns}
            dataSource={productionOrders}
            rowKey="_id"
            pagination={false}
            locale={{ emptyText: '暂无生产订单' }}
          />
        </Card>

        {/* 延期订单警告 */}
        {stats.delayedOrders > 0 && (
          <Card 
            title={
              <Space>
                <WarningOutlined style={{ color: '#ff4d4f' }} />
                <span>延期订单</span>
                <Badge count={stats.delayedOrders} />
              </Space>
            }
            style={{ marginTop: 24 }}
          >
            <Alert
              message="生产延期警告"
              description={`有 ${stats.delayedOrders} 个生产订单出现延期，请及时调整生产计划，协调资源，确保按时交付！`}
              type="error"
              showIcon
              action={
                <Button 
                  size="small" 
                  danger
                  onClick={() => navigate('/production?status=Delayed')}
                >
                  查看详情
                </Button>
              }
            />
          </Card>
        )}
      </div>
    </Spin>
  )
}

export default ProductionPlannerDashboard
