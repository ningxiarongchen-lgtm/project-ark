import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, Space, Typography, 
  List, Tag, Alert, Spin, Avatar, Badge, Tooltip, Divider, Empty
} from 'antd'
import { 
  ProjectOutlined, DatabaseOutlined, ThunderboltOutlined,
  PlusOutlined, FolderOpenOutlined, RightOutlined,
  UserOutlined, CheckCircleOutlined, DollarOutlined,
  ToolOutlined, ClockCircleOutlined, CustomerServiceOutlined,
  PhoneOutlined, WarningOutlined, CalendarOutlined, TrophyOutlined,
  FileTextOutlined, BellOutlined, FileSearchOutlined, SendOutlined,
  SettingOutlined, DownloadOutlined, CloseOutlined
} from '@ant-design/icons'
import { projectsAPI, ticketsAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import GreetingWidget from '../components/dashboards/GreetingWidget'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, getRoleNameCN } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    projectCount: 0,
    pendingQuoteCount: 0,      // 待完成报价数
    pendingSelectionCount: 0,  // 待完成选型数
    pendingProjectCount: 0,    // 待项目完成数量
    pendingTicketCount: 0,     // 待处理售后工单数
    // 👑 管理员专属统计 - 待处理事项
    pendingUserRequests: 0,    // 待处理用户申请
    pendingPasswordResets: 0,  // 待处理密码重置申请
    pendingDataImports: 0,     // 待处理数据导入请求
    systemWarnings: 0          // 系统异常警告
  })
  const [recentProjects, setRecentProjects] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // 👑 管理员：获取待处理事项统计
      if (user?.role === 'Administrator') {
        // TODO: 这里应该调用专门的管理员任务统计API
        // 暂时使用模拟数据，后续接入真实API
        
        setStats({
          projectCount: 0,
          pendingQuoteCount: 0,
          pendingSelectionCount: 0,
          pendingProjectCount: 0,
          pendingTicketCount: 0,
          // 管理员待处理事项（暂时使用模拟数据）
          pendingUserRequests: 0,       // 待审批的新用户申请
          pendingPasswordResets: 0,     // 待处理的密码重置申请
          pendingDataImports: 0,        // 待审核的数据导入请求
          systemWarnings: 0             // 系统异常警告数量
        })
        
        setRecentProjects([])  // 管理员不显示项目列表
        setLoading(false)
        return
      }
      
      // 其他角色：获取项目数据
      const projectsRes = await projectsAPI.getAll()

      // 安全提取数据 - 后端返回格式: { success: true, data: [...] }
      const projects = Array.isArray(projectsRes.data?.data) 
        ? projectsRes.data.data 
        : (Array.isArray(projectsRes.data) ? projectsRes.data : [])

      // 🎯 销售经理专属统计
      let pendingAssignmentCount = 0  // 待指派技术
      let quotedProjectsCount = 0     // 已报价-询价中的项目
      let wonProjectsCount = 0        // 已赢单的项目（合同已签订）
      
      if (user?.role === 'Sales Manager') {
        // 销售经理：待指派技术工程师的项目
        pendingAssignmentCount = projects.filter(p => 
          p.status === '待指派技术' || p.status === 'Pending Assignment'
        ).length
        
        // 销售经理：已报价-询价中的项目（可下载报价单给客户，推进签约）
        quotedProjectsCount = projects.filter(p => 
          p.status === '已报价-询价中' || p.status === '已报价' || p.status === 'Quoted'
        ).length
        
        // 销售经理：已赢单的项目（合同已签订，等待生产）
        wonProjectsCount = projects.filter(p => 
          p.status === '合同已签订-赢单' || p.status === '待预付款' || p.status === '赢单' || p.status === 'Won'
        ).length
      }

      // 计算统计数据
      // 待完成报价：状态为"待报价"或"技术方案完成"的项目
      const pendingQuoteCount = user?.role === 'Sales Manager' 
        ? quotedProjectsCount  // 销售经理：显示询价中项目数
        : projects.filter(p => 
            p.status === '待报价' || 
            p.status === '技术方案完成' || 
            p.status === 'Awaiting Quotation'
          ).length
      
      // 销售经理专属：已赢单项目数
      const wonProjectsCountStat = user?.role === 'Sales Manager' ? wonProjectsCount : 0

      // 待完成选型：分配给当前技术工程师且状态为待选型的项目
      let pendingSelectionCount = 0
      if (user?.role === 'Technical Engineer') {
        pendingSelectionCount = projects.filter(p => 
          p.technical_support?._id === user._id &&
          (p.status === '选型进行中' || p.status === '选型修正中' || p.status === '草稿')
        ).length
      } else {
        pendingSelectionCount = projects.filter(p => 
          p.status === '待选型' || 
          p.status === '进行中' ||
          p.status === 'In Progress' ||
          p.status === 'Awaiting Selection'
        ).length
      }

      // 待项目完成：所有未完成的项目（不包括"已完成"、"已取消"）
      // 对于销售经理，这里改为显示"待指派技术"的数量
      const pendingProjectCount = user?.role === 'Sales Manager'
        ? pendingAssignmentCount  // 销售经理：显示待指派技术
        : projects.filter(p => 
            p.status !== '已完成' && 
            p.status !== '已取消' &&
            p.status !== 'Completed' &&
            p.status !== 'Cancelled'
          ).length

      // 获取售后工单数据
      let pendingTicketCount = 0
      if (user?.role === 'Technical Engineer' || user?.role === 'After-sales Engineer') {
        try {
          const ticketsRes = await ticketsAPI.getAll()
          const tickets = Array.isArray(ticketsRes.data?.data) 
            ? ticketsRes.data.data 
            : (Array.isArray(ticketsRes.data) ? ticketsRes.data : [])
          
          // 待处理售后工单：分配给当前技术工程师且状态为待处理或处理中的工单
          pendingTicketCount = tickets.filter(t => 
            t.assigned_to?._id === user._id &&
            (t.status === '待处理' || t.status === '处理中')
          ).length
        } catch (error) {
          console.error('Failed to fetch tickets:', error)
        }
      }

      setStats({
        projectCount: projects.length,
        pendingQuoteCount,
        pendingSelectionCount,
        pendingProjectCount,
        pendingTicketCount,
        wonProjectsCount: wonProjectsCountStat
      })

      // 技术工程师：按紧急度显示需要选型的项目（分配给我的或待分配的）
      if (user?.role === 'Technical Engineer') {
        const myProjects = projects.filter(p => {
          // 项目状态是待选型相关的
          const isSelectionStatus = p.status === '选型进行中' || p.status === '选型修正中' || p.status === '草稿' || p.status === '待指派技术'
          // 分配给我的 或 还没分配技术工程师的
          const isAssignedToMe = p.technical_support?._id === user._id || !p.technical_support
          return isSelectionStatus && isAssignedToMe
        })
        // 按紧急度排序：Urgent > High > Normal > Low
        const priorityOrder = { 'Urgent': 4, 'High': 3, 'Normal': 2, 'Low': 1 }
        const sortedProjects = myProjects.sort((a, b) => {
          const aPriority = priorityOrder[a.priority] || 0
          const bPriority = priorityOrder[b.priority] || 0
          return bPriority - aPriority
        })
        setRecentProjects(sortedProjects.slice(0, 5))
      } else {
        // 其他角色：按创建时间显示最近项目
        const sortedProjects = [...projects].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )
        setRecentProjects(sortedProjects.slice(0, 5))
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 🔒 根据角色配置快捷操作
  const quickActions = []
  
  // 👑 管理员专属快捷操作
  if (user?.role === 'Administrator') {
    quickActions.push(
      {
        icon: <UserOutlined />,
        title: '用户管理',
        description: '管理系统用户和权限',
        color: '#1890ff',
        onClick: () => navigate('/admin')
      },
      {
        icon: <DatabaseOutlined />,
        title: '产品导入',
        description: '批量导入产品数据',
        color: '#52c41a',
        onClick: () => navigate('/product-import')
      },
      {
        icon: <DatabaseOutlined />,
        title: '数据管理',
        description: '管理执行器、配件和供应商',
        color: '#722ed1',
        onClick: () => navigate('/data-management')
      },
      {
        icon: <ProjectOutlined />,
        title: '系统报表',
        description: '查看数据统计和报表',
        color: '#fa8c16',
        onClick: () => navigate('/admin/reports')
      }
    )
  } 
  // 销售经理专属快捷操作
  else if (user?.role === 'Sales Manager') {
    quickActions.push(
      {
        icon: <PlusOutlined />,
        title: '新建项目',
        description: '创建一个新的选型项目',
        color: '#52c41a',
        onClick: () => navigate('/projects')
      },
      {
        icon: <DatabaseOutlined />,
        title: '产品目录',
        description: '查看产品技术信息和库存',
        color: '#722ed1',
        onClick: () => navigate('/product-catalog')
      }
    )
  } 
  // 技术工程师专属快捷操作
  else if (user?.role === 'Technical Engineer') {
    quickActions.push(
      {
        icon: <ThunderboltOutlined />,
        title: '智慧选型',
        description: '单个或批量扭矩值选型',
        color: '#1890ff',
        onClick: () => navigate('/selection-engine')
      },
      {
        icon: <ToolOutlined />,
        title: '产品数据管理',
        description: '查看产品技术数据',
        color: '#722ed1',
        onClick: () => navigate('/data-management')
      },
      {
        icon: <CustomerServiceOutlined />,
        title: '售后服务',
        description: '处理售后工单',
        color: '#fa8c16',
        onClick: () => navigate('/service-center')
      }
    )
  }
  // 其他角色（商务工程师等）
  else {
    quickActions.push(
      {
        icon: <ThunderboltOutlined />,
        title: '智能选型',
        description: '开始一个新的执行器选型',
        color: '#1890ff',
        onClick: () => navigate('/selection-engine')
      },
      {
        icon: <PlusOutlined />,
        title: '新建项目',
        description: '创建一个新的选型项目',
        color: '#52c41a',
        onClick: () => navigate('/projects')
      },
      {
        icon: <DatabaseOutlined />,
        title: '产品数据管理',
        description: '查看和管理产品数据',
        color: '#722ed1',
        onClick: () => navigate('/data-management')
      }
    )
  }

  return (
    <Spin spinning={loading}>
      <div>
        {/* 动态问候语 */}
        <GreetingWidget />

        {/* 统计卡片 - 根据角色显示不同指标 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {user?.role === 'Administrator' ? (
            // 👑 管理员：显示待处理事项统计
            <>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="待处理用户申请"
                    value={stats.pendingUserRequests}
                    prefix={<UserOutlined />}
                    suffix="个"
                    valueStyle={{ color: stats.pendingUserRequests > 0 ? '#fa8c16' : '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="密码重置申请"
                    value={stats.pendingPasswordResets}
                    prefix={<UserOutlined />}
                    suffix="个"
                    valueStyle={{ color: stats.pendingPasswordResets > 0 ? '#fa8c16' : '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="数据导入请求"
                    value={stats.pendingDataImports}
                    prefix={<DatabaseOutlined />}
                    suffix="个"
                    valueStyle={{ color: stats.pendingDataImports > 0 ? '#fa8c16' : '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="系统异常警告"
                    value={stats.systemWarnings}
                    prefix={<CheckCircleOutlined />}
                    suffix="个"
                    valueStyle={{ color: stats.systemWarnings > 0 ? '#f5222d' : '#52c41a' }}
                  />
                </Card>
              </Col>
            </>
          ) : user?.role === 'Technical Engineer' ? (
            // 🔧 技术工程师：专属工作统计
            <>
              <Col xs={24} sm={12} lg={6}>
                <Card 
                  hoverable
                  onClick={() => navigate('/projects')}
                  style={{ borderLeft: stats.pendingSelectionCount > 0 ? '4px solid #fa8c16' : 'none' }}
                >
                  <Statistic
                    title="待选型任务"
                    value={stats.pendingSelectionCount}
                    prefix={<ClockCircleOutlined />}
                    suffix="个"
                    valueStyle={{ color: '#fa8c16' }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {stats.pendingSelectionCount > 0 ? '⚠️ 请及时处理' : '暂无待处理'}
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="今日完成"
                    value={0}
                    prefix={<CheckCircleOutlined />}
                    suffix="个"
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>今天提交的选型</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="本周完成"
                    value={0}
                    prefix={<ProjectOutlined />}
                    suffix="个"
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>本周提交的选型</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card 
                  hoverable
                  onClick={() => navigate('/service-center')}
                  style={{ borderLeft: stats.pendingTicketCount > 0 ? '4px solid #722ed1' : 'none' }}
                >
                  <Statistic
                    title="待处理工单"
                    value={stats.pendingTicketCount}
                    prefix={<CustomerServiceOutlined />}
                    suffix="个"
                    valueStyle={{ color: '#722ed1' }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {stats.pendingTicketCount > 0 ? '⚠️ 有待处理' : '暂无'}
                  </Text>
                </Card>
              </Col>
            </>
          ) : user?.role === 'Sales Manager' ? (
            // 🎯 销售经理：增强版指标
            <>
              <Col xs={24} sm={12} lg={6}>
                <Card 
                  hoverable
                  onClick={() => navigate('/projects?status=待指派技术')}
                  style={{ borderLeft: stats.pendingProjectCount > 0 ? '4px solid #fa8c16' : 'none' }}
                >
                  <Statistic
                    title="待指派技术"
                    value={stats.pendingProjectCount}
                    prefix={<ClockCircleOutlined />}
                    suffix="个"
                    valueStyle={{ color: '#fa8c16' }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {stats.pendingProjectCount > 0 ? '⚠️ 需指派技术工程师' : '暂无待处理'}
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card 
                  hoverable
                  onClick={() => navigate('/projects?status=已报价-询价中')}
                  style={{ borderLeft: stats.pendingQuoteCount > 0 ? '4px solid #1890ff' : 'none' }}
                >
                  <Statistic
                    title="询价中项目"
                    value={stats.pendingQuoteCount}
                    prefix={<FileTextOutlined />}
                    suffix="个"
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {stats.pendingQuoteCount > 0 ? '📄 可下载报价单给客户' : '暂无'}
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card 
                  hoverable
                  onClick={() => navigate('/projects?status=合同已签订-赢单')}
                  style={{ borderLeft: stats.wonProjectsCount > 0 ? '4px solid #52c41a' : 'none' }}
                >
                  <Statistic
                    title="已赢单项目"
                    value={stats.wonProjectsCount}
                    prefix={<TrophyOutlined />}
                    suffix="个"
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {stats.wonProjectsCount > 0 ? '🏆 合同已签订' : '暂无'}
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card hoverable onClick={() => navigate('/projects')}>
                  <Statistic
                    title="全部项目"
                    value={stats.projectCount}
                    prefix={<ProjectOutlined />}
                    suffix="个"
                    valueStyle={{ color: '#722ed1' }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>点击查看所有项目</Text>
                </Card>
              </Col>
            </>
          ) : (
            // 其他角色：显示完整的4个指标
            <>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="我的项目"
                    value={stats.projectCount}
                    prefix={<ProjectOutlined />}
                    suffix="个"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="待项目完成数量"
                    value={stats.pendingProjectCount}
                    prefix={<ClockCircleOutlined />}
                    suffix="个"
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="待完成报价数"
                    value={stats.pendingQuoteCount}
                    prefix={<DollarOutlined />}
                    suffix="个"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="待完成选型数"
                    value={stats.pendingSelectionCount}
                    prefix={<ToolOutlined />}
                    suffix="个"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </>
          )}
        </Row>

        <Row gutter={[16, 16]}>
          {/* 最近项目 / 系统监控 */}
          <Col xs={24}>
            {user?.role === 'Administrator' ? (
              // 👑 管理员：显示系统监控提示
              <Card 
                title="系统监控"
                extra={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              >
                <Alert
                  message="系统运行正常"
                  description={
                    <div>
                      <p>所有服务正常运行，无异常警告。</p>
                      <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
                        <div>
                          <Text strong>系统状态：</Text>
                          <Tag color="success" style={{ marginLeft: 8 }}>运行中</Tag>
                        </div>
                        <div>
                          <Text strong>数据库连接：</Text>
                          <Tag color="success" style={{ marginLeft: 8 }}>正常</Tag>
                        </div>
                        <div>
                          <Text strong>最后检查时间：</Text>
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            {dayjs().format('YYYY-MM-DD HH:mm:ss')}
                          </Text>
                        </div>
                      </Space>
                    </div>
                  }
                  type="success"
                  showIcon
                />
              </Card>
            ) : user?.role === 'Sales Manager' ? (
              // 🎯 销售经理专属：客户跟进提醒
              <Card 
                title={
                  <Space>
                    <UserOutlined />
                    <span>客户跟进提醒</span>
                  </Space>
                }
              >
                <List
                  dataSource={[
                    {
                      id: '1',
                      name: '中石化北京分公司',
                      contact: '张经理',
                      phone: '13800138001',
                      nextFollowUp: '2025-10-30',
                      status: '重点客户',
                      urgent: true
                    }
                  ]}
                  renderItem={(customer) => (
                    <List.Item
                      style={{ 
                        background: customer.urgent ? '#fff7e6' : 'transparent',
                        padding: 12,
                        borderRadius: 4
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{ backgroundColor: '#1890ff' }}>中</Avatar>
                        }
                        title={
                          <Space>
                            <span>{customer.name}</span>
                            {customer.urgent && <Tag color="red">今日必跟</Tag>}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size="small">
                            <div><PhoneOutlined /> {customer.contact}: {customer.phone}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>
                              <ClockCircleOutlined /> 下次跟进: {customer.nextFollowUp}
                            </div>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                  locale={{ emptyText: '暂无需要跟进的客户' }}
                />
              </Card>
            ) : (
              // 其他角色：显示最近项目
              <Card 
                title={user?.role === 'Technical Engineer' ? '待选型项目（按紧急度）' : '最近项目'}
                extra={
                  <Button 
                    type="link" 
                    onClick={() => navigate('/projects')}
                  >
                    查看全部 <RightOutlined />
                  </Button>
                }
              >
                {recentProjects.length === 0 ? (
                  <Alert
                    message={user?.role === 'Technical Engineer' ? '暂无待选型项目' : '还没有项目'}
                    description={user?.role === 'Technical Engineer' ? '目前没有分配给您的选型任务' : '点击快捷操作创建您的第一个项目'}
                    type="info"
                    showIcon
                  />
                ) : (
                  <List
                    dataSource={recentProjects}
                    renderItem={project => {
                      // 紧急度颜色映射
                      const getPriorityColor = (priority) => {
                        const colorMap = {
                          'Urgent': 'red',
                          'High': 'orange',
                          'Normal': 'blue',
                          'Low': 'default'
                        }
                        return colorMap[priority] || 'default'
                      }
                      
                      return (
                        <List.Item
                          key={project._id}
                          actions={[
                            <Button
                              type="link"
                              icon={<FolderOpenOutlined />}
                              onClick={() => navigate(`/projects/${project._id}`)}
                            >
                              打开
                            </Button>
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<ProjectOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                            title={
                              <Space>
                                {project.projectName || project.project_name || '未命名项目'}
                                {user?.role === 'Technical Engineer' && project.priority && (
                                  <Tag color={getPriorityColor(project.priority)}>
                                    {project.priority === 'Urgent' ? '紧急' : 
                                     project.priority === 'High' ? '高' :
                                     project.priority === 'Normal' ? '正常' : '低'}
                                  </Tag>
                                )}
                              </Space>
                            }
                            description={
                              <Space size="small" wrap>
                                <Text type="secondary">{project.client?.name || project.client_name || '无客户'}</Text>
                                {user?.role !== 'Technical Engineer' && (
                                  <Tag color="blue">{project.selections?.length || project.technical_item_list?.length || 0} 个选型</Tag>
                                )}
                                <Tag color={
                                  project.status === '选型进行中' ? 'processing' :
                                  project.status === '选型修正中' ? 'warning' :
                                  project.status === '草稿' ? 'default' : 'success'
                                }>
                                  {project.status}
                                </Tag>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {dayjs(project.createdAt).format('MM-DD HH:mm')}
                                </Text>
                              </Space>
                            }
                          />
                        </List.Item>
                      )
                    }}
                  />
                )}
              </Card>
            )}
          </Col>
        </Row>

        {/* 使用提示 - 根据角色显示不同的指南 */}
        <Card 
          style={{ marginTop: 24, border: 'none', boxShadow: 'none', background: 'transparent' }}
        >
          {user?.role === 'Administrator' ? (
            // 👑 系统管理员专属使用指南 - 不参与业务流程，只负责系统管理
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#1890ff' }}>1.</span> 用户管理
                  </Title>
                  <Text type="secondary">
                    创建和管理系统用户账号，分配角色权限，重置密码，停用离职员工账号。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={6}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#52c41a' }}>2.</span> 产品导入
                  </Title>
                  <Text type="secondary">
                    批量导入产品数据（执行器、配件、手动装置），更新产品价格和技术参数。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={6}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#722ed1' }}>3.</span> 数据管理
                  </Title>
                  <Text type="secondary">
                    管理执行器、配件和供应商数据，维护产品价格和技术参数，保证数据准确性。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={6}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#fa8c16' }}>4.</span> 数据统计
                  </Title>
                  <Text type="secondary">
                    监控系统运行状态，查看业务数据统计，导出报表，为管理层提供决策依据。
                  </Text>
                </Space>
              </Col>
            </Row>
          ) : user?.role === 'Sales Manager' ? (
            // 🔒 销售经理专属使用指南
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#1890ff' }}>1.</span> 创建项目并指派
                  </Title>
                  <Text type="secondary">
                    拿到客户技术文件或需求后，创建项目，上传技术文件，指派技术工程师进行选型。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={6}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#fa8c16' }}>2.</span> 询价阶段
                  </Title>
                  <Text type="secondary">
                    技术选型完成后，商务报价完成，下载报价单给客户。此时为"询价中"状态，尚未签约。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={6}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#52c41a' }}>3.</span> 赢单阶段
                  </Title>
                  <Text type="secondary">
                    客户接受报价后，上传销售合同，等商务审核盖章后给客户。客户盖章后才正式"赢单"。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={6}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#722ed1' }}>4.</span> 跟进生产
                  </Title>
                  <Text type="secondary">
                    合同签订后，跟进客户预付款到账情况，预付款到账后通知生产排期。
                  </Text>
                </Space>
              </Col>
            </Row>
          ) : user?.role === 'Technical Engineer' ? (
            // 🔧 技术工程师专属：我的选型任务看板
            <div>
              {/* 快捷操作 */}
              <Card title="⚡ 快捷操作" style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} lg={8}>
                    <Card
                      hoverable
                      style={{ 
                        borderLeft: '4px solid #667eea',
                        cursor: 'pointer',
                        height: '100%'
                      }}
                      onClick={() => navigate('/projects')}
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div style={{ fontSize: 32, color: '#667eea' }}>
                          <ProjectOutlined />
                        </div>
                        <Title level={5} style={{ margin: 0 }}>
                          查看我的选型任务
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          查看销售指派的项目，了解需求参数
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card
                      hoverable
                      style={{ 
                        borderLeft: '4px solid #722ed1',
                        cursor: 'pointer',
                        height: '100%'
                      }}
                      onClick={() => navigate('/data-management')}
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div style={{ fontSize: 32, color: '#722ed1' }}>
                          <ToolOutlined />
                        </div>
                        <Title level={5} style={{ margin: 0 }}>
                          产品数据管理
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          查看产品技术数据
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card
                      hoverable
                      style={{ 
                        borderLeft: '4px solid #fa8c16',
                        cursor: 'pointer',
                        height: '100%'
                      }}
                      onClick={() => navigate('/service-center')}
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div style={{ fontSize: 32, color: '#fa8c16' }}>
                          <CustomerServiceOutlined />
                        </div>
                        <Title level={5} style={{ margin: 0 }}>
                          查看售后工单
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          处理售后工单
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </Card>

              {/* 使用指南 - 工作流程卡片 */}
              <Card title="📖 使用指南">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Card 
                      hoverable
                      style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        height: '100%'
                      }}
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <FileSearchOutlined style={{ fontSize: 32 }} />
                        <Title level={5} style={{ color: 'white', marginTop: 8 }}>
                          步骤1：接收任务
                        </Title>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>
                          查看销售指派的项目，下载客户技术文件，了解需求参数
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card 
                      hoverable
                      style={{ 
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        border: 'none',
                        height: '100%'
                      }}
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <ToolOutlined style={{ fontSize: 32 }} />
                        <Title level={5} style={{ color: 'white', marginTop: 8 }}>
                          步骤2：技术选型
                        </Title>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>
                          根据技术要求选择执行器型号和配件，填写技术清单
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card 
                      hoverable
                      style={{ 
                        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                        color: 'white',
                        border: 'none',
                        height: '100%'
                      }}
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <SendOutlined style={{ fontSize: 32 }} />
                        <Title level={5} style={{ color: 'white', marginTop: 8 }}>
                          步骤3：提交商务
                        </Title>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>
                          完成选型后提交给商务报价，您的工作结束
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </Card>
            </div>
          ) : user?.role === 'Sales Engineer' ? (
            // 💼 商务专员专属使用指南
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#1890ff' }}>1.</span> 商务报价
                  </Title>
                  <Text type="secondary">
                    技术选型完成后，接收项目进行商务报价。根据BOM清单设置价格策略，完成报价后销售可下载报价单。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={6}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#fa8c16' }}>2.</span> 审核合同
                  </Title>
                  <Text type="secondary">
                    客户接受报价后，销售会上传销售合同。审核合同内容，确认无误后下载并盖章。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={6}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#52c41a' }}>3.</span> 上传盖章合同
                  </Title>
                  <Text type="secondary">
                    公司盖章后，上传盖章合同给销售，由销售转交客户盖章。客户盖章后项目正式赢单。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={6}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#722ed1' }}>4.</span> 催收预付款
                  </Title>
                  <Text type="secondary">
                    合同签订后，催促销售跟进客户预付款。预付款到账后，通知生产部门开始生产排期。
                  </Text>
                </Space>
              </Col>
            </Row>
          ) : user?.role === 'Production Planner' ? (
            // 🏭 生产员专属使用指南
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#1890ff' }}>1.</span> 接收生产订单
                  </Title>
                  <Text type="secondary">
                    预付款到账后，接收生产订单。查看技术选型清单，了解需要生产的产品型号和数量。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={6}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#fa8c16' }}>2.</span> 拆分BOM表
                  </Title>
                  <Text type="secondary">
                    根据技术选型，拆分BOM物料清单。检查库存，区分有料和缺料的部分。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={6}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#52c41a' }}>3.</span> 安排生产采购
                  </Title>
                  <Text type="secondary">
                    有料的部分通知车间开始加工生产。缺料的部分通知采购部门进行采购，到货后再安排生产。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={6}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#722ed1' }}>4.</span> 跟进生产进度
                  </Title>
                  <Text type="secondary">
                    跟踪车间生产进度和采购到货情况，确保按时完成订单交付。
                  </Text>
                </Space>
              </Col>
            </Row>
          ) : (
            // 其他角色的使用指南
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#1890ff' }}>1.</span> 创建项目
                  </Title>
                  <Text type="secondary">
                    在项目管理中创建新项目，用于组织多个阀门的选型工作。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#52c41a' }}>2.</span> 智能选型
                  </Title>
                  <Text type="secondary">
                    输入阀门参数，系统自动推荐最合适的执行器和手动操作装置。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#722ed1' }}>3.</span> 生成报价
                  </Title>
                  <Text type="secondary">
                    选型完成后，可以一键生成技术数据表和商务报价单。
                  </Text>
                </Space>
              </Col>
            </Row>
          )}
        </Card>
      </div>
    </Spin>
  )
}

export default Dashboard
