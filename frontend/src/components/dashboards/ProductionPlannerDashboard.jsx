/**
 * ProductionPlannerDashboard - 生产计划员仪表盘
 * 
 * 显示生产计划、资源分配、进度跟踪等
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, Timeline, Tag, Space, Typography,
  Progress, Alert, Spin
} from 'antd'
import { 
  ScheduleOutlined, ToolOutlined, CheckCircleOutlined,
  ClockCircleOutlined, WarningOutlined, RocketOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'

const { Title, Text } = Typography

const ProductionPlannerDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    activeOrders: 0,
    completedToday: 0,
    delayedOrders: 0,
    completionRate: 0,
  })
  const [todaySchedule, setTodaySchedule] = useState([])

  useEffect(() => {
    fetchProductionData()
  }, [])

  const fetchProductionData = async () => {
    setLoading(true)
    try {
      // TODO: 调用实际API
      setTimeout(() => {
        setStats({
          activeOrders: 15,
          completedToday: 8,
          delayedOrders: 2,
          completionRate: 87,
        })
        setTodaySchedule([
          { time: '08:00', task: '执行器A生产线启动', status: 'completed' },
          { time: '10:00', task: '阀门B组装', status: 'inProgress' },
          { time: '14:00', task: '质检C批次', status: 'pending' },
          { time: '16:00', task: '包装发货D订单', status: 'pending' },
        ])
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('Failed to fetch production data:', error)
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: '生产排期',
      description: '查看生产计划',
      icon: <ScheduleOutlined />,
      color: '#1890ff',
      onClick: () => navigate('/production-schedule'),
    },
    {
      title: '资源分配',
      description: '管理生产资源',
      icon: <ToolOutlined />,
      color: '#52c41a',
      onClick: () => navigate('/resources'),
    },
    {
      title: '订单管理',
      description: '查看生产订单',
      icon: <CheckCircleOutlined />,
      color: '#722ed1',
      onClick: () => navigate('/orders'),
    },
  ]

  const getTimelineColor = (status) => {
    const colors = { completed: 'green', inProgress: 'blue', pending: 'gray' }
    return colors[status] || 'gray'
  }

  const getTimelineIcon = (status) => {
    const icons = { 
      completed: <CheckCircleOutlined />, 
      inProgress: <ClockCircleOutlined />, 
      pending: <ClockCircleOutlined /> 
    }
    return icons[status] || <ClockCircleOutlined />
  }

  return (
    <Spin spinning={loading}>
      <div>
        {/* 欢迎信息 */}
        <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
          <Space direction="vertical" size="small">
            <Title level={3} style={{ margin: 0, color: '#333' }}>
              <RocketOutlined /> 生产计划员工作台
            </Title>
            <Text style={{ color: '#666' }}>
              Welcome to Project Ark，{user?.name}！今日已完成 {stats.completedToday} 单
            </Text>
          </Space>
        </Card>

        {/* 生产统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="进行中订单"
                value={stats.activeOrders}
                prefix={<ScheduleOutlined />}
                suffix="单"
                valueStyle={{ color: '#1890ff' }}
              />
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
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="延期订单"
                value={stats.delayedOrders}
                prefix={<WarningOutlined />}
                suffix="单"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="完成率"
                value={stats.completionRate}
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

          {/* 今日生产计划 */}
          <Col xs={24} lg={12}>
            <Card title="今日生产计划">
              <Timeline
                items={todaySchedule.map(item => ({
                  color: getTimelineColor(item.status),
                  dot: getTimelineIcon(item.status),
                  children: (
                    <>
                      <Text strong>{item.time}</Text>
                      <br />
                      <Text>{item.task}</Text>
                    </>
                  ),
                }))}
              />
            </Card>
          </Col>
        </Row>

        {/* 生产进度 */}
        <Card title="本周生产进度" style={{ marginTop: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text>本周订单完成度</Text>
              <Progress percent={72} status="active" strokeColor="#52c41a" />
            </div>
            <div>
              <Text>生产设备利用率</Text>
              <Progress percent={85} status="active" strokeColor="#1890ff" />
            </div>
            <div>
              <Text>质检通过率</Text>
              <Progress percent={96} status="normal" strokeColor="#722ed1" />
            </div>
            {stats.delayedOrders > 0 ? (
              <Alert
                message={`注意：有 ${stats.delayedOrders} 单延期`}
                description="请及时调整生产计划，确保按时交付"
                type="warning"
                showIcon
              />
            ) : (
              <Alert
                message="生产进度正常"
                description="所有订单按计划进行中，无延期情况"
                type="success"
                showIcon
              />
            )}
          </Space>
        </Card>
      </div>
    </Spin>
  )
}

export default ProductionPlannerDashboard

