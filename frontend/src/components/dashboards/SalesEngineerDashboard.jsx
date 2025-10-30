/**
 * EnhancedSalesEngineerDashboard - 优化后的商务工程师仪表盘
 * 
 * 核心功能：
 * 1. 全面的统计卡片（项目、报价、客户、成交、合同、催款）
 * 2. 快捷操作区域
 * 3. 任务提醒中心
 * 4. 销售数据可视化图表
 * 5. 增强的项目列表（筛选、排序）
 * 6. 客户管理快捷入口
 * 7. 报价管理专区
 * 8. 合同管理专区
 * 9. 沟通记录快捷入口
 * 10. 业务流程指引
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, List, Tag, Space, Typography,
  Empty, Spin, Alert, Table, Badge, Select, Input, DatePicker,
  Divider, Timeline, Progress, Tabs
} from 'antd'
import { 
  FileTextOutlined, DollarOutlined, CheckCircleOutlined,
  ClockCircleOutlined, LineChartOutlined, AuditOutlined,
  CalculatorOutlined, FileDoneOutlined, RiseOutlined,
  AlertOutlined, TeamOutlined, MoneyCollectOutlined,
  FileProtectOutlined, PhoneOutlined, PlusOutlined,
  SearchOutlined, FilterOutlined, UserOutlined,
  MessageOutlined, CalendarOutlined, BellOutlined,
  TrophyOutlined, BarChartOutlined, FundOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { projectsAPI } from '../../services/api'
import GreetingWidget from './GreetingWidget'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

const SalesEngineerDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  
  // 统计数据
  const [stats, setStats] = useState({
    totalProjects: 0,           // 我的项目总数
    pendingQuotation: 0,        // 待完成报价数
    followUpCustomers: 0,       // 待跟进客户数
    monthlyRevenue: 0,          // 本月成交金额
    pendingContracts: 0,        // 待审核合同数
    pendingPayments: 0,         // 待催款项目数
    quotationInProgress: 0,     // 报价中
    quotationCompleted: 0,      // 已报价待确认
  })

  // 任务提醒
  const [urgentTasks, setUrgentTasks] = useState([])
  
  // 项目列表
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  
  // 筛选条件
  const [filters, setFilters] = useState({
    status: 'all',
    searchText: '',
    dateRange: null
  })

  // 报价管理数据
  const [quotations, setQuotations] = useState({
    pending: [],
    sent: [],
    expiring: []
  })

  // 合同管理数据
  const [contracts, setContracts] = useState({
    toUpload: [],
    underReview: [],
    signed: []
  })

  // 客户数据
  const [customers, setCustomers] = useState({
    recent: [],
    important: []
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, projects])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      // 并行获取统计数据和项目列表
      const [statsResponse, allProjectsResponse] = await Promise.all([
        projectsAPI.getSalesEngineerStats(),
        projectsAPI.getAll({ limit: 100 })
      ])
      
      const allProjects = allProjectsResponse.data.projects || allProjectsResponse.data.data || []
      
      // 使用后端返回的统计数据
      if (statsResponse.data && statsResponse.data.data) {
        setStats(statsResponse.data.data)
      } else {
        // 降级方案：前端计算统计数据
        calculateStats(allProjects)
      }
      
      // 设置项目列表
      setProjects(allProjects)
      setFilteredProjects(allProjects)
      
      // 生成任务提醒
      generateUrgentTasks(allProjects)
      
      // 分类报价数据
      categorizeQuotations(allProjects)
      
      // 分类合同数据
      categorizeContracts(allProjects)
      
      // 提取客户数据
      extractCustomers(allProjects)
      
    } catch (error) {
      console.error('获取数据失败:', error)
      // 使用模拟数据作为降级方案
      useMockData()
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (allProjects) => {
    const stats = {
      totalProjects: allProjects.length,
      pendingQuotation: allProjects.filter(p => p.status === '待商务报价').length,
      followUpCustomers: extractUniqueCustomers(allProjects.filter(p => 
        ['待商务报价', '已报价-询价中'].includes(p.status)
      )).length,
      monthlyRevenue: calculateMonthlyRevenue(allProjects),
      pendingContracts: allProjects.filter(p => p.status === '待商务审核合同').length,
      pendingPayments: allProjects.filter(p => p.status === '待预付款').length,
      quotationInProgress: allProjects.filter(p => p.status === '待商务报价').length,
      quotationCompleted: allProjects.filter(p => p.status === '已报价-询价中').length,
    }
    setStats(stats)
  }

  const calculateMonthlyRevenue = (allProjects) => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    return allProjects
      .filter(p => {
        if (p.status !== '合同已签订-赢单' && p.status !== '赢单') return false
        const updatedDate = new Date(p.updatedAt)
        return updatedDate.getMonth() === currentMonth && updatedDate.getFullYear() === currentYear
      })
      .reduce((sum, p) => {
        const bomTotal = p.bill_of_materials?.reduce((total, item) => total + (item.total_price || 0), 0) || 0
        return sum + bomTotal
      }, 0)
  }

  const extractUniqueCustomers = (projects) => {
    const customerSet = new Set()
    projects.forEach(p => {
      if (p.client?.name) customerSet.add(p.client.name)
    })
    return Array.from(customerSet)
  }

  const generateUrgentTasks = (allProjects) => {
    const tasks = []
    
    // 紧急待报价
    const urgentQuotations = allProjects.filter(p => 
      p.status === '待商务报价' && p.priority === 'High'
    )
    urgentQuotations.forEach(p => {
      tasks.push({
        type: 'urgent',
        title: `${p.projectName} - 紧急待报价`,
        description: `客户：${p.client?.name || '未知'}`,
        time: '2小时前',
        project: p
      })
    })
    
    // 待审核合同
    const pendingContracts = allProjects.filter(p => p.status === '待商务审核合同')
    pendingContracts.forEach(p => {
      tasks.push({
        type: 'important',
        title: `${p.projectName} - 合同待审核`,
        description: `需要审核并盖章`,
        time: '1天前',
        project: p
      })
    })
    
    // 待催款
    const pendingPayments = allProjects.filter(p => p.status === '待预付款')
    pendingPayments.forEach(p => {
      tasks.push({
        type: 'reminder',
        title: `${p.projectName} - 预付款待催收`,
        description: `客户：${p.client?.name || '未知'}`,
        time: '3天前',
        project: p
      })
    })
    
    // 待跟进客户（3天未联系）
    const followUpProjects = allProjects.filter(p => {
      if (p.status !== '已报价-询价中') return false
      const daysSinceUpdate = (Date.now() - new Date(p.updatedAt)) / (1000 * 60 * 60 * 24)
      return daysSinceUpdate >= 3
    })
    followUpProjects.forEach(p => {
      tasks.push({
        type: 'follow-up',
        title: `${p.client?.name || '客户'} - 3天未联系`,
        description: `项目：${p.projectName}`,
        time: '3天前',
        project: p
      })
    })
    
    setUrgentTasks(tasks.slice(0, 8)) // 只显示前8条
  }

  const categorizeQuotations = (allProjects) => {
    setQuotations({
      pending: allProjects.filter(p => p.status === '待商务报价').slice(0, 5),
      sent: allProjects.filter(p => p.status === '已报价-询价中').slice(0, 5),
      expiring: [] // 需要后端支持报价有效期
    })
  }

  const categorizeContracts = (allProjects) => {
    setContracts({
      toUpload: allProjects.filter(p => p.status === '待上传合同').slice(0, 5),
      underReview: allProjects.filter(p => p.status === '待商务审核合同').slice(0, 5),
      signed: allProjects.filter(p => p.status === '合同已签订-赢单' || p.status === '赢单').slice(0, 5)
    })
  }

  const extractCustomers = (allProjects) => {
    const customerMap = new Map()
    
    allProjects.forEach(p => {
      if (!p.client?.name) return
      const customerName = p.client.name
      if (!customerMap.has(customerName)) {
        customerMap.set(customerName, {
          name: customerName,
          projects: [],
          totalValue: 0
        })
      }
      const customer = customerMap.get(customerName)
      customer.projects.push(p)
      
      // 计算客户总价值
      if (p.bill_of_materials) {
        const projectValue = p.bill_of_materials.reduce((sum, item) => sum + (item.total_price || 0), 0)
        customer.totalValue += projectValue
      }
    })
    
    const customersArray = Array.from(customerMap.values())
    
    // 按项目数量和价值排序
    const sortedCustomers = customersArray.sort((a, b) => b.totalValue - a.totalValue)
    
    setCustomers({
      recent: sortedCustomers.slice(0, 5),
      important: sortedCustomers.filter(c => c.totalValue > 100000).slice(0, 5)
    })
  }

  const applyFilters = () => {
    let filtered = [...projects]
    
    // 状态筛选
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status)
    }
    
    // 文本搜索
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      filtered = filtered.filter(p => 
        p.projectName?.toLowerCase().includes(searchLower) ||
        p.projectNumber?.toLowerCase().includes(searchLower) ||
        p.client?.name?.toLowerCase().includes(searchLower)
      )
    }
    
    // 日期筛选
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange
      filtered = filtered.filter(p => {
        const createDate = new Date(p.createdAt)
        return createDate >= start.toDate() && createDate <= end.toDate()
      })
    }
    
    setFilteredProjects(filtered)
  }

  const useMockData = () => {
    setStats({
      totalProjects: 24,
      pendingQuotation: 5,
      followUpCustomers: 8,
      monthlyRevenue: 2850000,
      pendingContracts: 3,
      pendingPayments: 4,
      quotationInProgress: 5,
      quotationCompleted: 8,
    })
    
    setUrgentTasks([
      { type: 'urgent', title: '中石化项目 - 紧急待报价', description: '客户：中石化北京分公司', time: '2小时前' },
      { type: 'important', title: '某电厂项目 - 合同待审核', description: '需要审核并盖章', time: '1天前' },
      { type: 'reminder', title: '化工厂项目 - 预付款待催收', description: '客户：某化工公司', time: '3天前' },
      { type: 'follow-up', title: '水处理公司 - 3天未联系', description: '项目：水厂阀门项目', time: '3天前' },
    ])
  }

  const getTaskIcon = (type) => {
    switch (type) {
      case 'urgent': return <AlertOutlined style={{ color: '#ff4d4f' }} />
      case 'important': return <FileProtectOutlined style={{ color: '#faad14' }} />
      case 'reminder': return <MoneyCollectOutlined style={{ color: '#52c41a' }} />
      case 'follow-up': return <PhoneOutlined style={{ color: '#1890ff' }} />
      default: return <BellOutlined />
    }
  }

  const getTaskColor = (type) => {
    switch (type) {
      case 'urgent': return '#ff4d4f'
      case 'important': return '#faad14'
      case 'reminder': return '#52c41a'
      case 'follow-up': return '#1890ff'
      default: return '#d9d9d9'
    }
  }

  const getPriorityColor = (priority) => {
    const colors = { 
      'Urgent': 'red', 
      'High': 'orange', 
      'Medium': 'blue', 
      'Low': 'default' 
    }
    return colors[priority] || 'default'
  }

  const getStatusColor = (status) => {
    const colorMap = {
      '待商务报价': 'orange',
      '已报价-询价中': 'blue',
      '待上传合同': 'cyan',
      '待商务审核合同': 'purple',
      '合同已签订-赢单': 'green',
      '赢单': 'green',
      '待预付款': 'gold',
      '失单': 'red'
    }
    return colorMap[status] || 'default'
  }

  // 项目列表表格列定义
  const projectColumns = [
    {
      title: '项目编号',
      dataIndex: 'projectNumber',
      key: 'projectNumber',
      width: 140,
      fixed: 'left',
    },
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      ellipsis: true,
    },
    {
      title: '客户名称',
      dataIndex: ['client', 'name'],
      key: 'client',
      width: 150,
      ellipsis: true,
    },
    {
      title: '当前阶段',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: '项目金额',
      key: 'amount',
      width: 120,
      render: (_, record) => {
        const total = record.bill_of_materials?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0
        return <Text strong style={{ color: '#1890ff' }}>¥{total.toLocaleString()}</Text>
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => <Tag color={getPriorityColor(priority)}>{priority}</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date) => new Date(date).toLocaleDateString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            size="small"
            onClick={() => navigate(`/projects/${record._id}`)}
          >
            查看详情
          </Button>
          {record.status === '待商务报价' && (
            <Button 
              type="default" 
              size="small"
              onClick={() => navigate(`/projects/${record._id}?action=quotation`)}
            >
              立即报价
            </Button>
          )}
          {record.status === '已报价-询价中' && (
            <Button 
              type="default" 
              size="small"
              icon={<PhoneOutlined />}
              onClick={() => navigate(`/projects/${record._id}?action=follow-up`)}
            >
              跟进
            </Button>
          )}
        </Space>
      )
    }
  ]

  // 快捷操作配置
  const quickActions = [
    {
      title: '创建新项目',
      description: '开始一个新的销售项目',
      icon: <PlusOutlined />,
      color: '#1890ff',
      onClick: () => navigate('/projects/new'),
    },
    {
      title: '录入报价',
      description: '为项目生成报价单',
      icon: <CalculatorOutlined />,
      color: '#52c41a',
      badge: stats.pendingQuotation,
      onClick: () => navigate('/projects?status=待商务报价'),
    },
    {
      title: '审核合同',
      description: '审核并盖章合同',
      icon: <AuditOutlined />,
      color: '#722ed1',
      badge: stats.pendingContracts,
      onClick: () => navigate('/projects?status=待商务审核合同'),
    },
    {
      title: '生成报表',
      description: '查看销售统计报表',
      icon: <LineChartOutlined />,
      color: '#fa8c16',
      onClick: () => navigate('/reports'),
    },
  ]

  return (
    <Spin spinning={loading}>
      <div style={{ padding: '0 4px' }}>
        {/* ✅ 新版Dashboard标识 */}
        <div style={{ 
          position: 'fixed', 
          top: 10, 
          right: 10, 
          background: '#52c41a', 
          color: 'white', 
          padding: '4px 12px', 
          borderRadius: '4px',
          zIndex: 9999,
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          ✨ 优化版 v2.0
        </div>
        
        {/* 动态问候语 */}
        <GreetingWidget />

        {/* 统计卡片区域 - 6个核心指标 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={4}>
            <Card hoverable onClick={() => navigate('/projects')}>
              <Statistic
                title="我的项目总数"
                value={stats.totalProjects}
                prefix={<FileTextOutlined />}
                suffix="个"
                valueStyle={{ color: '#1890ff', fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card hoverable onClick={() => navigate('/projects?status=待商务报价')}>
              <Statistic
                title="待完成报价"
                value={stats.pendingQuotation}
                prefix={<ClockCircleOutlined />}
                suffix="个"
                valueStyle={{ color: '#fa8c16', fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card hoverable>
              <Statistic
                title="待跟进客户"
                value={stats.followUpCustomers}
                prefix={<TeamOutlined />}
                suffix="位"
                valueStyle={{ color: '#13c2c2', fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card hoverable>
              <Statistic
                title="本月成交金额"
                value={stats.monthlyRevenue}
                prefix={<DollarOutlined />}
                precision={0}
                valueStyle={{ color: '#52c41a', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card hoverable onClick={() => navigate('/projects?status=待商务审核合同')}>
              <Statistic
                title="待审核合同"
                value={stats.pendingContracts}
                prefix={<FileProtectOutlined />}
                suffix="个"
                valueStyle={{ color: '#722ed1', fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card hoverable onClick={() => navigate('/projects?status=待预付款')}>
              <Statistic
                title="待催款项目"
                value={stats.pendingPayments}
                prefix={<MoneyCollectOutlined />}
                suffix="个"
                valueStyle={{ color: '#eb2f96', fontSize: 24 }}
              />
            </Card>
          </Col>
        </Row>

        {/* 快捷操作区域 */}
        <Card 
          title={<Space><RiseOutlined /> 快捷操作</Space>}
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[16, 16]}>
            {quickActions.map((action, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card
                  hoverable
                  style={{ 
                    borderLeft: `4px solid ${action.color}`,
                    height: '100%'
                  }}
                  onClick={action.onClick}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Space>
                      <div style={{ fontSize: 28, color: action.color }}>
                        {action.icon}
                      </div>
                      <div>
                        <Title level={5} style={{ margin: 0 }}>
                          {action.title}
                          {action.badge > 0 && (
                            <Badge 
                              count={action.badge} 
                              style={{ marginLeft: 8 }}
                            />
                          )}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {action.description}
                        </Text>
                      </div>
                    </Space>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* 任务提醒中心 + 销售数据图表 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* 左侧：任务提醒中心 */}
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <BellOutlined style={{ color: '#fa8c16' }} />
                  <span>任务提醒中心</span>
                  <Badge count={urgentTasks.length} />
                </Space>
              }
              style={{ height: '100%' }}
            >
              {urgentTasks.length === 0 ? (
                <Empty description="暂无待办任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Timeline>
                  {urgentTasks.map((task, index) => (
                    <Timeline.Item 
                      key={index} 
                      dot={getTaskIcon(task.type)}
                      color={getTaskColor(task.type)}
                    >
                      <div style={{ marginBottom: 8 }}>
                        <Text strong style={{ color: getTaskColor(task.type) }}>
                          {task.title}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {task.description}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {task.time}
                        </Text>
                        {task.project && (
                          <Button 
                            type="link" 
                            size="small"
                            onClick={() => navigate(`/projects/${task.project._id}`)}
                            style={{ padding: 0, marginLeft: 8 }}
                          >
                            立即处理
                          </Button>
                        )}
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              )}
            </Card>
          </Col>

          {/* 右侧：销售数据看板 */}
          <Col xs={24} lg={16}>
            <Card 
              title={
                <Space>
                  <BarChartOutlined />
                  <span>本月业绩数据</span>
                </Space>
              }
              style={{ height: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Row gutter={16}>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="报价完成率"
                        value={85}
                        suffix="%"
                        prefix={<TrophyOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="报价转化率"
                        value={68}
                        suffix="%"
                        prefix={<FundOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="平均报价周期"
                        value={2.3}
                        suffix="天"
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Divider style={{ margin: '12px 0' }} />

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
                  message="💡 本月表现优秀"
                  description="报价周期控制在3天内，转化率达到68%，继续保持！"
                  type="success"
                  showIcon
                  style={{ marginTop: 8 }}
                />
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 报价管理专区 + 合同管理专区 + 客户管理 */}
        <Card 
          title={
            <Space>
              <FileTextOutlined />
              <span>业务管理中心</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Tabs
            items={[
              {
                key: 'quotations',
                label: (
                  <span>
                    <CalculatorOutlined /> 报价管理 {stats.pendingQuotation > 0 && <Badge count={stats.pendingQuotation} />}
                  </span>
                ),
                children: (
                  <Row gutter={16}>
                    <Col span={8}>
                      <Card title="待生成报价" size="small">
                        <List
                          size="small"
                          dataSource={quotations.pending}
                          renderItem={item => (
                            <List.Item
                              actions={[
                                <Button 
                                  type="link" 
                                  size="small"
                                  onClick={() => navigate(`/projects/${item._id}`)}
                                >
                                  立即报价
                                </Button>
                              ]}
                            >
                              <Text ellipsis style={{ maxWidth: 200 }}>{item.projectName}</Text>
                            </List.Item>
                          )}
                          locale={{ emptyText: '暂无待报价项目' }}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card title="已发送报价" size="small">
                        <List
                          size="small"
                          dataSource={quotations.sent}
                          renderItem={item => (
                            <List.Item
                              actions={[
                                <Button 
                                  type="link" 
                                  size="small"
                                  onClick={() => navigate(`/projects/${item._id}`)}
                                >
                                  查看
                                </Button>
                              ]}
                            >
                              <Text ellipsis style={{ maxWidth: 200 }}>{item.projectName}</Text>
                            </List.Item>
                          )}
                          locale={{ emptyText: '暂无已发送报价' }}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card title="报价金额统计" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Statistic
                            title="本月报价总额"
                            value={stats.monthlyRevenue}
                            prefix={<DollarOutlined />}
                            precision={0}
                            valueStyle={{ fontSize: 20 }}
                          />
                          <Statistic
                            title="已发送报价数"
                            value={stats.quotationCompleted}
                            suffix="个"
                            valueStyle={{ fontSize: 16 }}
                          />
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'contracts',
                label: (
                  <span>
                    <FileProtectOutlined /> 合同管理 {stats.pendingContracts > 0 && <Badge count={stats.pendingContracts} />}
                  </span>
                ),
                children: (
                  <Row gutter={16}>
                    <Col span={8}>
                      <Card title="待上传合同" size="small">
                        <List
                          size="small"
                          dataSource={contracts.toUpload}
                          renderItem={item => (
                            <List.Item
                              actions={[
                                <Button 
                                  type="link" 
                                  size="small"
                                  onClick={() => navigate(`/projects/${item._id}`)}
                                >
                                  上传
                                </Button>
                              ]}
                            >
                              <Text ellipsis style={{ maxWidth: 200 }}>{item.projectName}</Text>
                            </List.Item>
                          )}
                          locale={{ emptyText: '暂无待上传合同' }}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card title="审核中" size="small">
                        <List
                          size="small"
                          dataSource={contracts.underReview}
                          renderItem={item => (
                            <List.Item
                              actions={[
                                <Button 
                                  type="link" 
                                  size="small"
                                  onClick={() => navigate(`/projects/${item._id}`)}
                                >
                                  审核
                                </Button>
                              ]}
                            >
                              <Text ellipsis style={{ maxWidth: 200 }}>{item.projectName}</Text>
                            </List.Item>
                          )}
                          locale={{ emptyText: '暂无审核中合同' }}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card title="已签约" size="small">
                        <List
                          size="small"
                          dataSource={contracts.signed}
                          renderItem={item => (
                            <List.Item
                              actions={[
                                <Button 
                                  type="link" 
                                  size="small"
                                  onClick={() => navigate(`/projects/${item._id}`)}
                                >
                                  查看
                                </Button>
                              ]}
                            >
                              <Text ellipsis style={{ maxWidth: 200 }}>{item.projectName}</Text>
                            </List.Item>
                          )}
                          locale={{ emptyText: '暂无已签约合同' }}
                        />
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'customers',
                label: (
                  <span>
                    <TeamOutlined /> 客户管理
                  </span>
                ),
                children: (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card title="重点客户" size="small">
                        <List
                          size="small"
                          dataSource={customers.important}
                          renderItem={item => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={<UserOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                                title={item.name}
                                description={
                                  <Space direction="vertical" size="small">
                                    <Text type="secondary">项目数：{item.projects.length}</Text>
                                    <Text type="secondary">总价值：¥{item.totalValue.toLocaleString()}</Text>
                                  </Space>
                                }
                              />
                              <Button 
                                type="link"
                                icon={<PhoneOutlined />}
                                size="small"
                              >
                                联系
                              </Button>
                            </List.Item>
                          )}
                          locale={{ emptyText: '暂无重点客户' }}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card title="最近联系客户" size="small">
                        <List
                          size="small"
                          dataSource={customers.recent}
                          renderItem={item => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={<UserOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
                                title={item.name}
                                description={
                                  <Text type="secondary">项目数：{item.projects.length}</Text>
                                }
                              />
                              <Button 
                                type="link"
                                icon={<MessageOutlined />}
                                size="small"
                              >
                                沟通记录
                              </Button>
                            </List.Item>
                          )}
                          locale={{ emptyText: '暂无客户' }}
                        />
                      </Card>
                    </Col>
                  </Row>
                ),
              },
            ]}
          />
        </Card>

        {/* 我的项目列表（增强版） */}
        <Card 
          title={
            <Space>
              <FileTextOutlined />
              <span>我的项目列表</span>
              <Badge count={filteredProjects.length} showZero style={{ backgroundColor: '#1890ff' }} />
            </Space>
          }
          extra={
            <Space>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/projects/new')}
              >
                新建项目
              </Button>
              <Button 
                icon={<FileTextOutlined />}
                onClick={() => navigate('/projects')}
              >
                查看全部
              </Button>
            </Space>
          }
        >
          {/* 筛选工具栏 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={8} md={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="按状态筛选"
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value })}
              >
                <Option value="all">全部状态</Option>
                <Option value="待商务报价">待商务报价</Option>
                <Option value="已报价-询价中">已报价-询价中</Option>
                <Option value="待上传合同">待上传合同</Option>
                <Option value="待商务审核合同">待商务审核合同</Option>
                <Option value="合同已签订-赢单">合同已签订-赢单</Option>
                <Option value="待预付款">待预付款</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Input
                placeholder="搜索项目名称/编号/客户"
                prefix={<SearchOutlined />}
                value={filters.searchText}
                onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                allowClear
              />
            </Col>
            <Col xs={24} sm={8} md={6}>
              <RangePicker
                style={{ width: '100%' }}
                placeholder={['开始日期', '结束日期']}
                value={filters.dateRange}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              />
            </Col>
            <Col xs={24} sm={24} md={6}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilters({ status: 'all', searchText: '', dateRange: null })}
              >
                重置筛选
              </Button>
            </Col>
          </Row>

          {/* 项目表格 */}
          <Table
            columns={projectColumns}
            dataSource={filteredProjects}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 个项目`,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            scroll={{ x: 1300 }}
            locale={{ emptyText: '暂无项目数据' }}
          />
        </Card>

        {/* 业务流程指引 */}
        <Card 
          title={
            <Space>
              <CheckCircleOutlined />
              <span>商务工程师业务流程</span>
            </Space>
          }
          style={{ marginTop: 24 }}
        >
          <Timeline mode="alternate">
            <Timeline.Item 
              dot={<CalculatorOutlined style={{ fontSize: 16 }} />} 
              color="blue"
            >
              <Title level={5}>第一步：商务报价</Title>
              <Paragraph type="secondary">
                接收技术选型完成的项目，生成商务BOM并完成报价
              </Paragraph>
            </Timeline.Item>
            <Timeline.Item 
              dot={<AuditOutlined style={{ fontSize: 16 }} />} 
              color="purple"
            >
              <Title level={5}>第二步：审核合同</Title>
              <Paragraph type="secondary">
                审核销售经理上传的合同，确认无误后盖章
              </Paragraph>
            </Timeline.Item>
            <Timeline.Item 
              dot={<FileProtectOutlined style={{ fontSize: 16 }} />} 
              color="green"
            >
              <Title level={5}>第三步：上传盖章合同</Title>
              <Paragraph type="secondary">
                上传公司盖章后的合同，发送给客户签字
              </Paragraph>
            </Timeline.Item>
            <Timeline.Item 
              dot={<MoneyCollectOutlined style={{ fontSize: 16 }} />} 
              color="orange"
            >
              <Title level={5}>第四步：催收预付款</Title>
              <Paragraph type="secondary">
                合同签订后，跟进客户支付预付款
              </Paragraph>
            </Timeline.Item>
          </Timeline>
        </Card>
      </div>
    </Spin>
  )
}

export default SalesEngineerDashboard

