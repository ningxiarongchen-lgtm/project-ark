/**
 * AdminDashboard - 管理员仪表盘
 * 
 * 显示系统整体运营数据、用户管理、系统监控等
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, Table, Tag, Space, Typography,
  Progress, Alert, Spin, Badge, Empty, Divider
} from 'antd'
import { 
  UserOutlined, ProjectOutlined, ShoppingCartOutlined, 
  ToolOutlined, TeamOutlined, RiseOutlined, SettingOutlined,
  DashboardOutlined, CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, FileDoneOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import GreetingWidget from './GreetingWidget'
import axios from 'axios'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [pendingOrdersLoading, setPendingOrdersLoading] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeTickets: 0,
  })
  const [pendingApprovalOrders, setPendingApprovalOrders] = useState([])

  useEffect(() => {
    fetchAdminStats()
    fetchPendingApprovalOrders()
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

  const fetchPendingApprovalOrders = async () => {
    setPendingOrdersLoading(true)
    try {
      const response = await axios.get('/api/purchase-orders/pending-admin-approval')
      if (response.data.success) {
        setPendingApprovalOrders(response.data.data || [])
      }
    } catch (error) {
      console.error('获取待审批订单失败:', error)
    } finally {
      setPendingOrdersLoading(false)
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

  const pendingApprovalColumns = [
    {
      title: '订单号',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (text) => <strong style={{ color: '#1890ff' }}>{text}</strong>
    },
    {
      title: '供应商',
      dataIndex: ['supplier_id', 'name'],
      key: 'supplier',
    },
    {
      title: '订单金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => (
        <strong style={{ color: '#f5222d' }}>
          ¥{(amount || 0).toLocaleString()}
        </strong>
      ),
      sorter: (a, b) => (a.total_amount || 0) - (b.total_amount || 0),
    },
    {
      title: '创建人',
      dataIndex: ['created_by', 'full_name'],
      key: 'creator',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/purchase-orders/${record._id}`)}
        >
          查看审批
        </Button>
      )
    }
  ]

  return (
    <Spin spinning={loading}>
      <div>
        {/* 动态问候语 */}
        <GreetingWidget />

        {/* 待审批提醒 - 如果有待审批订单，显示醒目提示 */}
        {pendingApprovalOrders.length > 0 && (
          <Alert
            message={
              <Space>
                <FileDoneOutlined style={{ fontSize: 18 }} />
                <strong>待审批提醒</strong>
              </Space>
            }
            description={`您有 ${pendingApprovalOrders.length} 个采购订单待审批，请及时处理！`}
            type="warning"
            showIcon={false}
            style={{ marginBottom: 24 }}
            action={
              <Button 
                type="primary" 
                size="small"
                onClick={() => {
                  const element = document.getElementById('pending-approvals')
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
              >
                立即查看
              </Button>
            }
          />
        )}

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

        {/* 待我审批区域 */}
        <Card 
          id="pending-approvals"
          title={
            <Space>
              <FileDoneOutlined style={{ color: '#faad14', fontSize: 20 }} />
              <span style={{ fontSize: 18 }}>待我审批</span>
              {pendingApprovalOrders.length > 0 && (
                <Badge count={pendingApprovalOrders.length} showZero={false} />
              )}
            </Space>
          }
          style={{ marginBottom: 24 }}
          extra={
            <Button 
              icon={<ToolOutlined />}
              onClick={fetchPendingApprovalOrders}
              loading={pendingOrdersLoading}
            >
              刷新
            </Button>
          }
        >
          {pendingOrdersLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin />
            </div>
          ) : pendingApprovalOrders.length > 0 ? (
            <>
              <Alert
                message="审批说明"
                description="以下是来自"临时供应商"且订单金额超过 ¥100,000 的采购订单，需要您进行审批。合作供应商的订单无需审批，可直接进入商务审核流程。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Table
                columns={pendingApprovalColumns}
                dataSource={pendingApprovalOrders}
                rowKey="_id"
                pagination={{
                  pageSize: 5,
                  showTotal: (total) => `共 ${total} 个待审批订单`,
                }}
                scroll={{ x: 800 }}
              />
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: '#999' }}>
                  暂无待审批的采购订单
                </span>
              }
            />
          )}
        </Card>

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

