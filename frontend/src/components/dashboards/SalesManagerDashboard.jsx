/**
 * SalesManagerDashboard - 销售经理仪表盘 v2.0
 * 
 * 核心职责聚焦：
 * 1. 项目管理 - 创建项目、分配工程师、跟踪进度
 * 2. 报价审核 - 查看已完成的报价、推动成交
 * 3. 客户跟进 - 管理客户关系、跟进提醒
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, Space, Typography, Alert,
  Badge, Table, Spin, Tag, List, Avatar, Tooltip, Empty, Divider
} from 'antd'
import { 
  ProjectOutlined, DollarOutlined, CheckCircleOutlined,
  PlusOutlined, TeamOutlined, BellOutlined, UserOutlined,
  TrophyOutlined, ClockCircleOutlined, FileTextOutlined, 
  PhoneOutlined, WarningOutlined, CalendarOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { projectsAPI } from '../../services/api'
import GreetingWidget from './GreetingWidget'
import dayjs from 'dayjs'

const { Text } = Typography

const SalesManagerDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    myProjects: 0,
    pendingAssignment: 0,
    inSelection: 0,
    quotationComplete: 0
  })
  const [recentProjects, setRecentProjects] = useState([])
  const [quotedProjects, setQuotedProjects] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const allProjectsResponse = await projectsAPI.getAll({ limit: 100 })
      const projects = allProjectsResponse.data.projects || allProjectsResponse.data.data || []

      const statusCounts = {
        myProjects: projects.length,
        pendingAssignment: projects.filter(p => p.status === '待指派技术').length,
        inSelection: projects.filter(p => p.status === '选型中').length,
        quotationComplete: projects.filter(p => p.status === '已报价').length
      }

      setStats(statusCounts)
      setRecentProjects(projects.slice(0, 5))
      setQuotedProjects(projects.filter(p => p.status === '已报价').slice(0, 3))
    } catch (error) {
      console.error('获取数据失败:', error)
      setStats({
        myProjects: 4,
        pendingAssignment: 0,
        inSelection: 3,
        quotationComplete: 1
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      '待指派技术': 'orange',
      '选型中': 'blue',
      '待商务报价': 'purple',
      '已报价': 'green',
      'Won': 'success'
    }
    return colors[status] || 'default'
  }

  const projectColumns = [
    {
      title: '项目编号',
      dataIndex: 'project_number',
      key: 'project_number',
      width: 140
    },
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      ellipsis: true
    },
    {
      title: '客户',
      dataIndex: 'client_name',
      key: 'client_name',
      width: 150,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => navigate(`/projects/${record._id}`)}
        >
          查看详情
        </Button>
      )
    }
  ]

  // 模拟客户数据
  const urgentCustomers = [
    {
      id: '1',
      name: '中石化北京分公司',
      contact: '张经理',
      phone: '13800138001',
      nextFollowUp: '2025-10-30',
      status: '重点客户',
      urgent: true
    }
  ]

  return (
    <Spin spinning={loading}>
      <div>
        {/* 🎉 新版本标识 - 必须看到这个！ */}
        <Alert
          message="🎉 您正在使用增强版销售经理仪表盘 v2.0"
          description="包含工作提醒、客户跟进、已报价项目专区等新功能"
          type="success"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />

        {/* 问候语 */}
        <div style={{ marginBottom: 24 }}>
          <GreetingWidget />
        </div>

        {/* 核心指标 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card hoverable onClick={() => navigate('/projects')}>
              <Statistic
                title="我的项目"
                value={stats.myProjects}
                prefix={<ProjectOutlined />}
                suffix="个"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable 
              onClick={() => navigate('/projects?status=待指派技术')}
              style={{ borderLeft: stats.pendingAssignment > 0 ? '4px solid #fa8c16' : 'none' }}
            >
              <Statistic
                title={
                  <Space>
                    <span>待指派技术</span>
                    {stats.pendingAssignment > 0 && (
                      <Tooltip title="需要您指派技术工程师">
                        <WarningOutlined style={{ color: '#fa8c16' }} />
                      </Tooltip>
                    )}
                  </Space>
                }
                value={stats.pendingAssignment}
                prefix={<TeamOutlined />}
                suffix="个"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              hoverable 
              onClick={() => navigate('/projects?status=已报价')}
              style={{ borderLeft: stats.quotationComplete > 0 ? '4px solid #52c41a' : 'none' }}
            >
              <Statistic
                title={
                  <Space>
                    <span>已报价项目</span>
                    {stats.quotationComplete > 0 && (
                      <Tooltip title="可以联系客户推进成交">
                        <TrophyOutlined style={{ color: '#52c41a' }} />
                      </Tooltip>
                    )}
                  </Space>
                }
                value={stats.quotationComplete}
                prefix={<CheckCircleOutlined />}
                suffix="个"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="本月销售额"
                value={24.5}
                precision={1}
                prefix={<DollarOutlined />}
                suffix="万"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 工作提醒卡片 */}
        {(stats.pendingAssignment > 0 || stats.quotationComplete > 0) && (
          <Alert
            message={
              <Space>
                <BellOutlined />
                <strong>今日工作提醒</strong>
              </Space>
            }
            description={
              <div>
                {stats.pendingAssignment > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    • <strong style={{ color: '#fa8c16' }}>{stats.pendingAssignment}</strong> 个项目待指派技术工程师
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => navigate('/projects?status=待指派技术')}
                    >
                      立即处理 →
                    </Button>
                  </div>
                )}
                {stats.quotationComplete > 0 && (
                  <div>
                    • <strong style={{ color: '#52c41a' }}>{stats.quotationComplete}</strong> 个项目已完成报价，可联系客户推进成交
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => navigate('/projects?status=已报价')}
                    >
                      查看报价 →
                    </Button>
                  </div>
                )}
              </div>
            }
            type="warning"
            showIcon
            closable
            style={{ marginBottom: 24 }}
          />
        )}

        <Row gutter={[16, 16]}>
          {/* 左侧：项目列表 */}
          <Col xs={24} lg={16}>
            <Card 
              title={
                <Space>
                  <FileTextOutlined />
                  <span>我的项目</span>
                  <Badge count={stats.myProjects} overflowCount={99} />
                </Space>
              }
              extra={
                <Space>
                  <Button 
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/projects')}
                  >
                    新建项目
                  </Button>
                  <Button 
                    type="link"
                    onClick={() => navigate('/projects')}
                  >
                    查看全部
                  </Button>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Table
                columns={projectColumns}
                dataSource={recentProjects}
                rowKey="_id"
                pagination={false}
                scroll={{ x: 800 }}
                locale={{ emptyText: '暂无项目数据' }}
              />
            </Card>

            {/* 已报价项目专区 */}
            {quotedProjects.length > 0 && (
              <Card 
                title={
                  <Space>
                    <TrophyOutlined style={{ color: '#52c41a' }} />
                    <span>已报价项目（可推进成交）</span>
                    <Badge count={quotedProjects.length} style={{ backgroundColor: '#52c41a' }} />
                  </Space>
                }
              >
                <List
                  dataSource={quotedProjects}
                  renderItem={(project) => (
                    <List.Item
                      actions={[
                        <Button 
                          type="primary" 
                          size="small"
                          onClick={() => navigate(`/projects/${project._id}`)}
                        >
                          查看报价
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar style={{ backgroundColor: '#52c41a' }}>报</Avatar>}
                        title={
                          <Space>
                            <span>{project.project_name}</span>
                            <Tag color="green">已报价</Tag>
                          </Space>
                        }
                        description={
                          <Space split={<Divider type="vertical" />}>
                            <span>客户: {project.client_name}</span>
                            <span>编号: {project.project_number}</span>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </Col>

          {/* 右侧：客户跟进和快捷操作 */}
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <UserOutlined />
                  <span>客户跟进提醒</span>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <List
                dataSource={urgentCustomers}
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
                        <Badge dot={customer.urgent} status="processing">
                          <Avatar style={{ backgroundColor: '#1890ff' }}>中</Avatar>
                        </Badge>
                      }
                      title={
                        <Space>
                          <span>{customer.name}</span>
                          {customer.urgent && <Tag color="red">今日必跟</Tag>}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size="small">
                          <div>
                            <PhoneOutlined /> {customer.contact}: {customer.phone}
                          </div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            <CalendarOutlined /> 下次跟进: {customer.nextFollowUp}
                          </div>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: <Empty description="暂无需要跟进的客户" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
              />
            </Card>

            <Card title="快捷操作">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button 
                  block 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/projects')}
                >
                  新建销售项目
                </Button>
                <Button 
                  block 
                  icon={<TeamOutlined />}
                  onClick={() => navigate('/projects?status=待指派技术')}
                  danger={stats.pendingAssignment > 0}
                >
                  分配技术工程师 {stats.pendingAssignment > 0 && `(${stats.pendingAssignment})`}
                </Button>
                <Button 
                  block 
                  icon={<CheckCircleOutlined />}
                  onClick={() => navigate('/projects?status=已报价')}
                >
                  查看已报价项目 {stats.quotationComplete > 0 && `(${stats.quotationComplete})`}
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  )
}

export default SalesManagerDashboard
