/**
 * 车间工人专属Dashboard
 * 
 * 功能：
 * 1. 今日任务概览
 * 2. 工作统计
 * 3. 快捷操作
 * 4. 任务提醒
 * 5. 个人绩效
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Row, Col, Card, Statistic, Button, Space, Typography,
  List, Tag, Alert, Spin, Progress, Badge, Timeline, Empty
} from 'antd'
import {
  ToolOutlined, PlayCircleOutlined, CheckCircleOutlined,
  ClockCircleOutlined, WarningOutlined, TrophyOutlined,
  RightOutlined, ReloadOutlined, FireOutlined,
  CalendarOutlined, SmileOutlined, RiseOutlined
} from '@ant-design/icons'
import { workOrdersAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(duration)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

const { Title, Text } = Typography

const ShopFloorDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [workOrders, setWorkOrders] = useState([])
  const [stats, setStats] = useState({
    today: 0,
    inProgress: 0,
    completed: 0,
    urgent: 0,
    completionRate: 0
  })

  useEffect(() => {
    fetchData()
    // 每30秒自动刷新
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 获取我的工单
      const response = await workOrdersAPI.getMyWorkOrders({
        status: '已发布,进行中,已接收'
      })
      const orders = response.data.data || []
      setWorkOrders(orders)

      // 计算统计数据
      const today = dayjs().startOf('day')
      const todayEnd = dayjs().endOf('day')
      
      const todayOrders = orders.filter(wo => 
        dayjs(wo.plan.planned_start_time).isSameOrAfter(today) &&
        dayjs(wo.plan.planned_start_time).isSameOrBefore(todayEnd)
      )
      
      const inProgress = orders.filter(wo => wo.status === '进行中')
      const urgent = orders.filter(wo => wo.priority === '紧急' || wo.priority === '高')
      
      // 计算今日完成率
      let totalCompleted = 0
      let totalPlanned = 0
      todayOrders.forEach(wo => {
        totalCompleted += wo.actual.actual_quantity || 0
        totalPlanned += wo.plan.planned_quantity || 0
      })
      const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0

      setStats({
        today: todayOrders.length,
        inProgress: inProgress.length,
        completed: todayOrders.filter(wo => wo.status === '已完成').length,
        urgent: urgent.length,
        completionRate
      })
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取状态颜色
  const getStatusColor = (status) => {
    const colorMap = {
      '已发布': 'blue',
      '已接收': 'cyan',
      '进行中': 'processing',
      '暂停': 'warning',
      '已完成': 'success'
    }
    return colorMap[status] || 'default'
  }

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    const colorMap = {
      '低': 'default',
      '正常': 'blue',
      '高': 'orange',
      '紧急': 'red'
    }
    return colorMap[priority] || 'default'
  }

  // 检查是否延期
  const isDelayed = (workOrder) => {
    return workOrder.is_delayed || (
      new Date() > new Date(workOrder.plan.planned_end_time) && 
      workOrder.status !== '已完成'
    )
  }

  // 计算完成率
  const getCompletionRate = (wo) => {
    if (wo.plan.planned_quantity === 0) return 0
    return Math.round((wo.actual.actual_quantity / wo.plan.planned_quantity) * 100)
  }

  // 问候语
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 9) return '早上好'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }

  // 今日任务列表
  const TodayTasks = () => {
    const today = dayjs().startOf('day')
    const todayEnd = dayjs().endOf('day')
    
    const todayOrders = workOrders
      .filter(wo => 
        dayjs(wo.plan.planned_start_time).isSameOrAfter(today) &&
        dayjs(wo.plan.planned_start_time).isSameOrBefore(todayEnd)
      )
      .slice(0, 5) // 只显示前5个

    if (todayOrders.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="今日暂无任务"
        />
      )
    }

    return (
      <List
        dataSource={todayOrders}
        renderItem={wo => (
          <List.Item
            key={wo._id}
            style={{
              background: wo.status === '进行中' ? '#e6f7ff' : 'white',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '8px',
              border: '1px solid #f0f0f0'
            }}
            actions={[
              <Button
                type={wo.status === '进行中' ? 'primary' : 'default'}
                size="small"
                icon={wo.status === '进行中' ? <CheckCircleOutlined /> : <PlayCircleOutlined />}
                onClick={() => navigate('/shop-floor')}
              >
                {wo.status === '进行中' ? '继续' : '开始'}
              </Button>
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Tag color={getPriorityColor(wo.priority)}>{wo.priority}</Tag>
                  <Tag color={getStatusColor(wo.status)}>{wo.status}</Tag>
                  {isDelayed(wo) && <Tag color="red">延期</Tag>}
                  <Text strong>{wo.work_order_number}</Text>
                </Space>
              }
              description={
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary">产品：</Text>
                    <Text>{wo.product?.model_base || '-'}</Text>
                  </div>
                  <div>
                    <Text type="secondary">工序：</Text>
                    <Text>{wo.operation?.operation_name || '-'}</Text>
                  </div>
                  <div>
                    <Text type="secondary">数量：</Text>
                    <Text>{wo.plan.planned_quantity} 件</Text>
                    <span style={{ marginLeft: 16 }}>
                      <Text type="secondary">完成：</Text>
                      <Text>{wo.actual.actual_quantity || 0} 件</Text>
                    </span>
                  </div>
                  <Progress 
                    percent={getCompletionRate(wo)} 
                    size="small" 
                    status={getCompletionRate(wo) >= 100 ? 'success' : 'active'}
                  />
                  <div>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    <Text type="secondary">
                      {dayjs(wo.plan.planned_start_time).format('HH:mm')} - 
                      {dayjs(wo.plan.planned_end_time).format('HH:mm')}
                    </Text>
                  </div>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    )
  }

  // 紧急任务提醒
  const UrgentTasks = () => {
    const urgentOrders = workOrders
      .filter(wo => (wo.priority === '紧急' || wo.priority === '高') && wo.status !== '已完成')
      .slice(0, 3)

    if (urgentOrders.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <SmileOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          <p style={{ marginTop: 16, color: '#888' }}>太棒了！暂无紧急任务</p>
        </div>
      )
    }

    return (
      <Timeline>
        {urgentOrders.map(wo => (
          <Timeline.Item
            key={wo._id}
            color={wo.priority === '紧急' ? 'red' : 'orange'}
            dot={<FireOutlined />}
          >
            <div>
              <Space>
                <Tag color={getPriorityColor(wo.priority)}>{wo.priority}</Tag>
                <Text strong>{wo.work_order_number}</Text>
              </Space>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">{wo.product?.model_base}</Text>
              </div>
              <div style={{ marginTop: 4 }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  截止：{dayjs(wo.plan.planned_end_time).format('MM-DD HH:mm')}
                </Text>
              </div>
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    )
  }

  return (
    <Spin spinning={loading}>
      <div style={{ padding: 24 }}>
        {/* 问候区域 */}
        <Card
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            marginBottom: 24,
            border: 'none'
          }}
        >
          <div style={{ color: 'white' }}>
            <Title level={2} style={{ color: 'white', marginBottom: 8 }}>
              <ToolOutlined /> {getGreeting()}，{user?.full_name || '工人'}！
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
              "认真做好每一件产品，质量是我们的尊严。"
            </Text>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center' }}>
              <CalendarOutlined style={{ marginRight: 8 }} />
              <Text style={{ color: 'white' }}>
                {dayjs().format('YYYY年MM月DD日 dddd')}
              </Text>
              <span style={{ marginLeft: 16, marginRight: 8 }}>
                <ClockCircleOutlined />
              </span>
              <Text style={{ color: 'white' }}>
                {dayjs().format('HH:mm:ss')}
              </Text>
            </div>
          </div>
        </Card>

        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="今日任务"
                value={stats.today}
                suffix="个"
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="进行中"
                value={stats.inProgress}
                suffix="个"
                prefix={<PlayCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Statistic
                title="今日完成"
                value={stats.completed}
                suffix="个"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable>
              <Badge count={stats.urgent} offset={[-10, 10]}>
                <Statistic
                  title="紧急任务"
                  value={stats.urgent}
                  suffix="个"
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: stats.urgent > 0 ? '#ff4d4f' : '#888' }}
                />
              </Badge>
            </Card>
          </Col>
        </Row>

        {/* 今日完成率 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <Text type="secondary">今日完成率</Text>
                  <div style={{ marginTop: 8 }}>
                    <Progress
                      percent={stats.completionRate}
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                      status={stats.completionRate >= 100 ? 'success' : 'active'}
                    />
                  </div>
                </div>
                <div style={{ marginLeft: 32, textAlign: 'center' }}>
                  <RiseOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">继续加油！</Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 今日任务和紧急任务 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <CalendarOutlined />
                  <span>今日任务</span>
                  <Badge count={stats.today} showZero style={{ backgroundColor: '#52c41a' }} />
                </Space>
              }
              extra={
                <Button
                  type="link"
                  onClick={() => navigate('/shop-floor')}
                  icon={<RightOutlined />}
                >
                  查看全部
                </Button>
              }
            >
              <TodayTasks />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <FireOutlined />
                  <span>紧急任务</span>
                  {stats.urgent > 0 && <Badge count={stats.urgent} />}
                </Space>
              }
            >
              <UrgentTasks />
            </Card>
          </Col>
        </Row>

        {/* 快捷操作 */}
        <Row gutter={16}>
          <Col span={24}>
            <Card title={<><ToolOutlined /> 快捷操作</>}>
              <Row gutter={16}>
                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => navigate('/shop-floor')}
                  >
                    <PlayCircleOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                    <div style={{ marginTop: 16 }}>
                      <Text strong>开始工作</Text>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        查看并开始我的工单
                      </Text>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => navigate('/shop-floor')}
                  >
                    <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                    <div style={{ marginTop: 16 }}>
                      <Text strong>报告进度</Text>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        更新工单完成情况
                      </Text>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Card
                    hoverable
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => navigate('/shop-floor')}
                  >
                    <WarningOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
                    <div style={{ marginTop: 16 }}>
                      <Text strong>报告异常</Text>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        设备故障或质量问题
                      </Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* 刷新按钮 */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
            size="large"
          >
            刷新数据
          </Button>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              数据每30秒自动更新
            </Text>
          </div>
        </div>

        {/* 工作流程说明 */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small">
              <Title level={5} style={{ margin: 0 }}>
                <span style={{ color: '#1890ff' }}>1.</span> 接收工单
              </Title>
              <Text type="secondary">
                在"我的工单"页面查看生产计划员分配的工单，了解产品型号、工序要求和数量。
              </Text>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small">
              <Title level={5} style={{ margin: 0 }}>
                <span style={{ color: '#fa8c16' }}>2.</span> 生产操作
              </Title>
              <Text type="secondary">
                点击"开始"后按照工艺要求生产，记录完成数量、合格数量和不合格数量。
              </Text>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small">
              <Title level={5} style={{ margin: 0 }}>
                <span style={{ color: '#52c41a' }}>3.</span> 报告进度
              </Title>
              <Text type="secondary">
                生产过程中定期点击"报告进度"，系统自动记录时间和数量，更新完成率。
              </Text>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small">
              <Title level={5} style={{ margin: 0 }}>
                <span style={{ color: '#722ed1' }}>4.</span> 完成工单
              </Title>
              <Text type="secondary">
                生产完成后点击"完成"按钮提交，工单进入质检流程，您的任务结束。
              </Text>
            </Space>
          </Col>
        </Row>
      </div>
    </Spin>
  )
}

export default ShopFloorDashboard

