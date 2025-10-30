/**
 * SalesEngineerDashboard - 商务工程师仪表盘
 * 
 * 核心职责：
 * 1. 接收技术选型完成的项目
 * 2. 生成商务BOM（添加成本和利润）
 * 3. 完成报价审批
 * 4. 生成报价单和合同
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, List, Tag, Space, Typography,
  Empty, Spin, Progress, Alert, Table, Badge
} from 'antd'
import { 
  FileTextOutlined, DollarOutlined, CheckCircleOutlined,
  ClockCircleOutlined, LineChartOutlined, AuditOutlined,
  CalculatorOutlined, FileDoneOutlined, RiseOutlined,
  AlertOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { projectsAPI } from '../../services/api'
import GreetingWidget from './GreetingWidget'

const { Title, Text } = Typography

const SalesEngineerDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    pendingQuotation: 0,      // 待报价项目
    quotationInProgress: 0,   // 报价中
    quotationCompleted: 0,    // 已报价待确认
    monthlyQuotationAmount: 0,// 本月报价总额
  })
  const [pendingProjects, setPendingProjects] = useState([])
  const [recentQuotations, setRecentQuotations] = useState([])

  useEffect(() => {
    fetchCommercialData()
  }, [])

  const fetchCommercialData = async () => {
    setLoading(true)
    try {
      // 获取待商务报价的项目
      const pendingResponse = await projectsAPI.getAll({ 
        status: '待商务报价',
        limit: 5,
        sortBy: 'priority'
      })
      
      // 获取已报价的项目
      const quotedResponse = await projectsAPI.getAll({ 
        status: '已报价',
        limit: 5
      })

      // 设置统计数据
      setStats({
        pendingQuotation: pendingResponse.data.pagination?.total || 0,
        quotationInProgress: 0, // 可以通过其他状态统计
        quotationCompleted: quotedResponse.data.pagination?.total || 0,
        monthlyQuotationAmount: 0, // 需要后端提供统计API
      })

      setPendingProjects(pendingResponse.data.projects || pendingResponse.data.data || [])
      setRecentQuotations(quotedResponse.data.projects || quotedResponse.data.data || [])
      
    } catch (error) {
      console.error('获取商务数据失败:', error)
      // 使用模拟数据作为降级方案
      setStats({
        pendingQuotation: 5,
        quotationInProgress: 3,
        quotationCompleted: 8,
        monthlyQuotationAmount: 1850000,
      })
      setPendingProjects([
        { 
          _id: '1', 
          project_number: 'PRJ-2025-001', 
          project_name: '中石化阀门选型项目',
          client_name: '中石化北京分公司',
          priority: '高',
          createdAt: '2025-10-28'
        },
        { 
          _id: '2', 
          project_number: 'PRJ-2025-002', 
          project_name: '某电厂执行器采购',
          client_name: '某电力公司',
          priority: '中',
          createdAt: '2025-10-29'
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: '待报价项目',
      description: '查看需要报价的项目',
      icon: <FileTextOutlined />,
      color: '#1890ff',
      count: stats.pendingQuotation,
      onClick: () => navigate('/projects?status=待商务报价'),
    },
    {
      title: '生成BOM',
      description: '创建商务报价清单',
      icon: <CalculatorOutlined />,
      color: '#52c41a',
      onClick: () => navigate('/projects'),
    },
    {
      title: '价格审核',
      description: '审核报价和利润率',
      icon: <AuditOutlined />,
      color: '#722ed1',
      onClick: () => navigate('/projects?status=已报价'),
    },
    {
      title: '报价分析',
      description: '查看报价统计和趋势',
      icon: <LineChartOutlined />,
      color: '#fa8c16',
      onClick: () => navigate('/projects'),
    },
  ]

  const getPriorityColor = (priority) => {
    const colors = { 
      '紧急': 'red', 
      '高': 'orange', 
      '中': 'blue', 
      '低': 'default' 
    }
    return colors[priority] || 'default'
  }

  const pendingColumns = [
    {
      title: '项目编号',
      dataIndex: 'project_number',
      key: 'project_number',
      width: 140,
    },
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
    },
    {
      title: '客户',
      dataIndex: 'client_name',
      key: 'client_name',
      width: 180,
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
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            onClick={() => navigate(`/projects/${record._id}`)}
          >
            开始报价
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

        {/* 商务统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="待报价项目"
                value={stats.pendingQuotation}
                prefix={<ClockCircleOutlined />}
                suffix="个"
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  技术选型已完成
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="报价进行中"
                value={stats.quotationInProgress}
                prefix={<CalculatorOutlined />}
                suffix="个"
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  BOM生成中
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="已报价待确认"
                value={stats.quotationCompleted}
                prefix={<FileDoneOutlined />}
                suffix="个"
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  等待客户反馈
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="本月报价金额"
                value={stats.monthlyQuotationAmount}
                prefix={<DollarOutlined />}
                suffix="元"
                valueStyle={{ color: '#722ed1' }}
                precision={0}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  总计 {stats.quotationCompleted} 个项目
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

          {/* 本月业绩指标 */}
          <Col xs={24} lg={16}>
            <Card title="本月业绩指标">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <Text>报价完成率</Text>
                    <Text strong style={{ float: 'right' }}>85%</Text>
                  </div>
                  <Progress 
                    percent={85} 
                    status="active"
                    strokeColor="#52c41a"
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <Text>报价转化率（赢单）</Text>
                    <Text strong style={{ float: 'right' }}>68%</Text>
                  </div>
                  <Progress 
                    percent={68} 
                    status="active"
                    strokeColor="#1890ff"
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <Text>平均报价周期</Text>
                    <Text strong style={{ float: 'right' }}>2.3 天</Text>
                  </div>
                  <Progress 
                    percent={77} 
                    status="normal"
                    strokeColor="#722ed1"
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    目标: 3天内完成
                  </Text>
                </div>
                
                <Alert
                  message="💡 报价效率提示"
                  description="本月表现优秀！平均报价周期控制在3天内，转化率达到68%，继续保持！"
                  type="success"
                  showIcon
                />
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 待报价项目列表 */}
        <Card 
          title={
            <Space>
              <AlertOutlined style={{ color: '#fa8c16' }} />
              <span>紧急待报价项目</span>
              <Badge count={stats.pendingQuotation} />
            </Space>
          }
          extra={
            <Button 
              type="link"
              onClick={() => navigate('/projects?status=待商务报价')}
            >
              查看全部
            </Button>
          }
          style={{ marginTop: 24 }}
        >
          <Table
            columns={pendingColumns}
            dataSource={pendingProjects}
            rowKey="_id"
            pagination={false}
            locale={{ emptyText: '暂无待报价项目' }}
          />
        </Card>

        {/* 最近完成的报价 */}
        <Card 
          title="最近完成的报价" 
          style={{ marginTop: 24 }}
          extra={
            <Button 
              type="link"
              onClick={() => navigate('/projects?status=已报价')}
            >
              查看全部
            </Button>
          }
        >
          {recentQuotations.length === 0 ? (
            <Empty description="暂无已完成报价" />
          ) : (
            <List
              dataSource={recentQuotations}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      onClick={() => navigate(`/projects/${item._id}`)}
                    >
                      查看详情
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{item.project_name}</Text>
                        <Tag color="green">已报价</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Text type="secondary">项目编号：{item.project_number}</Text>
                        <Text type="secondary">客户：{item.client_name}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>
    </Spin>
  )
}

export default SalesEngineerDashboard

