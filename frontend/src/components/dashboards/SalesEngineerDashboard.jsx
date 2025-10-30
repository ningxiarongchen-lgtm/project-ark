/**
 * SalesEngineerDashboard - 销售工程师仪表盘
 * 
 * 显示客户项目、报价单、跟进任务等
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, List, Tag, Space, Typography,
  Empty, Spin, Timeline
} from 'antd'
import { 
  ProjectOutlined, FileTextOutlined, CustomerServiceOutlined,
  DollarOutlined, PhoneOutlined, CheckCircleOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import GreetingWidget from './GreetingWidget'

const { Title, Text } = Typography

const SalesEngineerDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    myProjects: 0,
    quotations: 0,
    followUps: 0,
    closedDeals: 0,
  })
  const [followUpTasks, setFollowUpTasks] = useState([])

  useEffect(() => {
    fetchSalesData()
  }, [])

  const fetchSalesData = async () => {
    setLoading(true)
    try {
      // TODO: 调用实际API
      setTimeout(() => {
        setStats({
          myProjects: 12,
          quotations: 8,
          followUps: 6,
          closedDeals: 5,
        })
        setFollowUpTasks([
          { id: 1, client: '中石化北京分公司', task: '报价单跟进', date: '今天', status: 'pending' },
          { id: 2, client: '某电力公司', task: '技术交流', date: '明天', status: 'pending' },
          { id: 3, client: '某制药厂', task: '现场考察', date: '2025-11-05', status: 'scheduled' },
        ])
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('Failed to fetch sales data:', error)
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: '新建项目',
      description: '为客户创建项目',
      icon: <ProjectOutlined />,
      color: '#1890ff',
      onClick: () => navigate('/projects'),
    },
    {
      title: '查看报价',
      description: '管理报价单',
      icon: <FileTextOutlined />,
      color: '#52c41a',
      onClick: () => navigate('/quotes'),
    },
    {
      title: '客户跟进',
      description: '记录客户沟通',
      icon: <CustomerServiceOutlined />,
      color: '#722ed1',
      onClick: () => navigate('/service-center'),
    },
  ]

  const getStatusColor = (status) => {
    const colors = { pending: 'orange', scheduled: 'blue', completed: 'green' }
    return colors[status] || 'default'
  }

  const getStatusText = (status) => {
    const texts = { pending: '待处理', scheduled: '已安排', completed: '已完成' }
    return texts[status] || status
  }

  return (
    <Spin spinning={loading}>
      <div>
        {/* 动态问候语 */}
        <GreetingWidget />

        {/* 销售统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="我的客户项目"
                value={stats.myProjects}
                prefix={<ProjectOutlined />}
                suffix="个"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="进行中报价"
                value={stats.quotations}
                prefix={<FileTextOutlined />}
                suffix="份"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="待跟进客户"
                value={stats.followUps}
                prefix={<PhoneOutlined />}
                suffix="个"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="本月成交"
                value={stats.closedDeals}
                prefix={<CheckCircleOutlined />}
                suffix="单"
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

          {/* 待跟进任务 */}
          <Col xs={24} lg={12}>
            <Card title="待跟进任务" extra={<Text type="secondary">{followUpTasks.length} 项</Text>}>
              {followUpTasks.length === 0 ? (
                <Empty description="暂无跟进任务" />
              ) : (
                <List
                  dataSource={followUpTasks}
                  renderItem={task => (
                    <List.Item
                      actions={[
                        <Button type="link" onClick={() => navigate('/service-center')}>
                          处理
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            {task.client}
                            <Tag color={getStatusColor(task.status)}>
                              {getStatusText(task.status)}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size="small">
                            <Text type="secondary">任务：{task.task}</Text>
                            <Text type="secondary">时间：{task.date}</Text>
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

        {/* 最近动态 */}
        <Card title="最近动态" style={{ marginTop: 24 }}>
          <Timeline
            items={[
              {
                color: 'green',
                children: (
                  <>
                    <Text strong>成功签约</Text>
                    <br />
                    <Text type="secondary">某石化项目顺利签约 - 2小时前</Text>
                  </>
                ),
              },
              {
                color: 'blue',
                children: (
                  <>
                    <Text strong>报价单发送</Text>
                    <br />
                    <Text type="secondary">已向某电力公司发送报价 - 昨天</Text>
                  </>
                ),
              },
              {
                children: (
                  <>
                    <Text strong>客户沟通</Text>
                    <br />
                    <Text type="secondary">与某制药厂技术交流 - 2天前</Text>
                  </>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </Spin>
  )
}

export default SalesEngineerDashboard

