import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, Space, Typography, 
  List, Tag, Alert, Spin
} from 'antd'
import { 
  ProjectOutlined, DatabaseOutlined, ThunderboltOutlined,
  PlusOutlined, FolderOpenOutlined, RightOutlined,
  UserOutlined, CheckCircleOutlined, DollarOutlined,
  ToolOutlined, ClockCircleOutlined
} from '@ant-design/icons'
import { projectsAPI } from '../services/api'
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
    pendingProjectCount: 0     // 待项目完成数量
  })
  const [recentProjects, setRecentProjects] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // 获取项目数据
      const projectsRes = await projectsAPI.getAll()

      // 安全提取数据 - 后端返回格式: { success: true, data: [...] }
      const projects = Array.isArray(projectsRes.data?.data) 
        ? projectsRes.data.data 
        : (Array.isArray(projectsRes.data) ? projectsRes.data : [])

      // 计算统计数据
      // 待完成报价：状态为"待报价"或"技术方案完成"的项目
      const pendingQuoteCount = projects.filter(p => 
        p.status === '待报价' || 
        p.status === '技术方案完成' || 
        p.status === 'Awaiting Quotation'
      ).length

      // 待完成选型：状态为"待选型"或"进行中"的项目
      const pendingSelectionCount = projects.filter(p => 
        p.status === '待选型' || 
        p.status === '进行中' ||
        p.status === 'In Progress' ||
        p.status === 'Awaiting Selection'
      ).length

      // 待项目完成：所有未完成的项目（不包括"已完成"、"已取消"）
      const pendingProjectCount = projects.filter(p => 
        p.status !== '已完成' && 
        p.status !== '已取消' &&
        p.status !== 'Completed' &&
        p.status !== 'Cancelled'
      ).length

      setStats({
        projectCount: projects.length,
        pendingQuoteCount,
        pendingSelectionCount,
        pendingProjectCount
      })

      // 获取最近的5个项目
      const sortedProjects = [...projects].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      setRecentProjects(sortedProjects.slice(0, 5))

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 🔒 根据角色配置快捷操作
  const quickActions = []
  
  // 销售经理专属快捷操作
  if (user?.role === 'Sales Manager') {
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
  // 其他角色（技术工程师、商务工程师等）
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
        title: '产品管理',
        description: '查看和管理产品数据',
        color: '#722ed1',
        onClick: () => navigate('/products')
      }
    )
  }

  // 管理员额外的快捷操作
  if (user?.role === 'Administrator') {
    quickActions.push({
      icon: <DatabaseOutlined />,
      title: '数据管理',
      description: '管理系统基础数据',
      color: '#fa8c16',
      onClick: () => navigate('/admin')
    })
  }

  return (
    <Spin spinning={loading}>
      <div>
        {/* 动态问候语 */}
        <GreetingWidget />

        {/* 统计卡片 - 只显示4个业务相关指标 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
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
        </Row>

        <Row gutter={[16, 16]}>
          {/* 快捷操作 */}
          <Col xs={24} lg={12}>
            <Card 
              title="快捷操作"
              extra={<RightOutlined />}
            >
              <Row gutter={[16, 16]}>
                {quickActions.map((action, index) => (
                  <Col span={12} key={index}>
                    <Card
                      hoverable
                      style={{ 
                        borderLeft: `4px solid ${action.color}`,
                        cursor: 'pointer'
                      }}
                      onClick={action.onClick}
                    >
                      <Space direction="vertical" size="small">
                        <div style={{ fontSize: 32, color: action.color }}>
                          {action.icon}
                        </div>
                        <Title level={5} style={{ margin: 0 }}>
                          {action.title}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {action.description}
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          {/* 最近项目 */}
          <Col xs={24} lg={12}>
            <Card 
              title="最近项目"
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
                  message="还没有项目"
                  description="点击快捷操作创建您的第一个项目"
                  type="info"
                  showIcon
                />
              ) : (
                <List
                  dataSource={recentProjects}
                  renderItem={project => (
                    <List.Item
                      key={project._id}
                      actions={[
                        <Button
                          type="link"
                          icon={<FolderOpenOutlined />}
                          onClick={() => navigate(`/selection-engine?projectId=${project._id}`)}
                        >
                          打开
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<ProjectOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                        title={project.project_name}
                        description={
                          <Space size="small">
                            <Text type="secondary">{project.client_name || '无客户'}</Text>
                            <Tag color="blue">{project.selections?.length || 0} 个选型</Tag>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(project.createdAt).format('MM-DD HH:mm')}
                            </Text>
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

        {/* 使用提示 - 根据角色显示不同的指南 */}
        <Card 
          title="使用指南" 
          style={{ marginTop: 24 }}
        >
          {user?.role === 'Sales Manager' ? (
            // 🔒 销售经理专属使用指南
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#1890ff' }}>1.</span> 创建项目并指派
                  </Title>
                  <Text type="secondary">
                    创建新项目，填写客户信息和需求，上传技术说明书后，指派给技术工程师进行选型。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#52c41a' }}>2.</span> 跟踪项目进度
                  </Title>
                  <Text type="secondary">
                    等待技术工程师完成选型并提交给商务团队，商务团队对项目进行报价。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space direction="vertical">
                  <Title level={5}>
                    <span style={{ color: '#722ed1' }}>3.</span> 查看并下载报价
                  </Title>
                  <Text type="secondary">
                    商务完成报价后，在项目中查看报价详情并下载报价单，推进客户成交。
                  </Text>
                </Space>
              </Col>
            </Row>
          ) : (
            // 其他角色（技术工程师、商务工程师等）的使用指南
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
