/**
 * AfterSalesEngineerDashboard - 售后工程师仪表盘
 * 
 * 显示服务工单、客户反馈、维修记录等
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, List, Tag, Space, Typography,
  Progress, Empty, Spin, Rate
} from 'antd'
import { 
  CustomerServiceOutlined, ToolOutlined, PhoneOutlined,
  CheckCircleOutlined, ClockCircleOutlined, WarningOutlined,
  SmileOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'

const { Title, Text } = Typography

const AfterSalesEngineerDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    activeTickets: 0,
    resolvedToday: 0,
    avgResponseTime: 0,
    satisfaction: 0,
  })
  const [myTickets, setMyTickets] = useState([])

  useEffect(() => {
    fetchAfterSalesData()
  }, [])

  const fetchAfterSalesData = async () => {
    setLoading(true)
    try {
      // TODO: 调用实际API
      setTimeout(() => {
        setStats({
          activeTickets: 9,
          resolvedToday: 5,
          avgResponseTime: 2.5,
          satisfaction: 4.6,
        })
        setMyTickets([
          { id: 1, ticketNo: 'TKT-001', client: '中石化', issue: '执行器故障', priority: 'high', status: 'open' },
          { id: 2, ticketNo: 'TKT-002', client: '某电厂', issue: '定期保养', priority: 'medium', status: 'inProgress' },
          { id: 3, ticketNo: 'TKT-003', client: '制药厂', issue: '技术咨询', priority: 'low', status: 'open' },
        ])
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('Failed to fetch after-sales data:', error)
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: '我的工单',
      description: '查看分配工单',
      icon: <CustomerServiceOutlined />,
      color: '#1890ff',
      count: stats.activeTickets,
      onClick: () => navigate('/service-center'),
    },
    {
      title: '创建工单',
      description: '新建服务工单',
      icon: <ToolOutlined />,
      color: '#52c41a',
      onClick: () => navigate('/service-center/new'),
    },
    {
      title: '客户反馈',
      description: '查看客户评价',
      icon: <SmileOutlined />,
      color: '#722ed1',
      onClick: () => navigate('/feedback'),
    },
  ]

  const getPriorityColor = (priority) => {
    const colors = { high: 'red', medium: 'orange', low: 'blue' }
    return colors[priority] || 'default'
  }

  const getPriorityText = (priority) => {
    const texts = { high: '紧急', medium: '普通', low: '低' }
    return texts[priority] || priority
  }

  const getStatusColor = (status) => {
    const colors = { open: 'orange', inProgress: 'blue', resolved: 'green', closed: 'gray' }
    return colors[status] || 'default'
  }

  const getStatusText = (status) => {
    const texts = { open: '待处理', inProgress: '处理中', resolved: '已解决', closed: '已关闭' }
    return texts[status] || status
  }

  return (
    <Spin spinning={loading}>
      <div>
        {/* 欢迎信息 */}
        <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' }}>
          <Space direction="vertical" size="small">
            <Title level={3} style={{ margin: 0, color: '#333' }}>
              <CustomerServiceOutlined /> 售后工程师工作台
            </Title>
            <Text style={{ color: '#666' }}>
              Welcome to Project Ark，{user?.name}！客户满意度 <Rate disabled value={stats.satisfaction} style={{ fontSize: 14 }} />
            </Text>
          </Space>
        </Card>

        {/* 服务统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="活跃工单"
                value={stats.activeTickets}
                prefix={<WarningOutlined />}
                suffix="个"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="今日已解决"
                value={stats.resolvedToday}
                prefix={<CheckCircleOutlined />}
                suffix="个"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="平均响应时间"
                value={stats.avgResponseTime}
                prefix={<ClockCircleOutlined />}
                suffix="小时"
                valueStyle={{ color: '#1890ff' }}
                precision={1}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="客户满意度"
                value={stats.satisfaction}
                prefix={<SmileOutlined />}
                suffix="/ 5"
                valueStyle={{ color: '#722ed1' }}
                precision={1}
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
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          {/* 我的工单 */}
          <Col xs={24} lg={12}>
            <Card title="我的工单" extra={<Text type="secondary">{myTickets.length} 项</Text>}>
              {myTickets.length === 0 ? (
                <Empty description="暂无分配工单" />
              ) : (
                <List
                  dataSource={myTickets}
                  renderItem={ticket => (
                    <List.Item
                      actions={[
                        <Button type="link" onClick={() => navigate(`/service-center/${ticket.id}`)}>
                          处理
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            {ticket.ticketNo}
                            <Tag color={getPriorityColor(ticket.priority)}>
                              {getPriorityText(ticket.priority)}
                            </Tag>
                            <Tag color={getStatusColor(ticket.status)}>
                              {getStatusText(ticket.status)}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size="small">
                            <Text type="secondary">客户：{ticket.client}</Text>
                            <Text type="secondary">问题：{ticket.issue}</Text>
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

        {/* 服务质量 */}
        <Card title="本月服务质量" style={{ marginTop: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text>工单解决率</Text>
              <Progress percent={92} status="active" strokeColor="#52c41a" />
            </div>
            <div>
              <Text>首次解决率</Text>
              <Progress percent={78} status="active" strokeColor="#1890ff" />
            </div>
            <div>
              <Text>客户满意度</Text>
              <Progress percent={92} status="normal" strokeColor="#722ed1" />
            </div>
          </Space>
        </Card>
      </div>
    </Spin>
  )
}

export default AfterSalesEngineerDashboard

