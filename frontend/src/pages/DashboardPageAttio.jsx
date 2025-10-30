import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Statistic, message } from 'antd'
import {
  ProjectOutlined,
  FileDoneOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import {
  AttioCard,
  AttioTable,
  AttioTag,
  AttioButton,
  AttioContextMenu,
  commonContextMenuItems,
} from '../components'
import { projectsAPI, ordersAPI } from '../services/api'
import { colors } from '../styles/theme'

/**
 * DashboardPageAttio - Attio-style dashboard with grid layout
 * 
 * Layout:
 * - Top: KPI statistics cards (white, no shadow, thin gray border)
 * - Main: Large table/kanban for projects/tasks
 */

const DashboardPageAttio = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeOrders: 0,
    pendingPurchases: 0,
    monthlyRevenue: 0,
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch projects
      const projectsRes = await projectsAPI.getProjects({ page: 1, limit: 10 })
      setProjects(projectsRes.data?.projects || [])
      
      // Mock stats (replace with real API)
      setStats({
        totalProjects: 45,
        activeOrders: 23,
        pendingPurchases: 8,
        monthlyRevenue: 1250000,
      })
    } catch (error) {
      message.error('加载数据失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // KPI Cards Data
  const kpiCards = [
    {
      title: '总项目数',
      value: stats.totalProjects,
      icon: <ProjectOutlined style={{ fontSize: 24, color: colors.primary.main }} />,
      trend: { value: 12, isUp: true },
      color: colors.primary.main,
    },
    {
      title: '进行中订单',
      value: stats.activeOrders,
      icon: <FileDoneOutlined style={{ fontSize: 24, color: colors.success.main }} />,
      trend: { value: 8, isUp: true },
      color: colors.success.main,
    },
    {
      title: '待处理采购',
      value: stats.pendingPurchases,
      icon: <ShoppingCartOutlined style={{ fontSize: 24, color: colors.warning.main }} />,
      trend: { value: 3, isUp: false },
      color: colors.warning.main,
    },
    {
      title: '本月收入 (¥)',
      value: stats.monthlyRevenue.toLocaleString(),
      icon: <DollarOutlined style={{ fontSize: 24, color: colors.info.main }} />,
      trend: { value: 15, isUp: true },
      color: colors.info.main,
    },
  ]

  // Projects table columns
  const projectColumns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text, record) => (
        <a
          onClick={() => navigate(`/projects/${record._id}`)}
          style={{ color: colors.primary.main, fontWeight: 500 }}
        >
          {text}
        </a>
      ),
    },
    {
      title: '客户',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const colorMap = {
          '报价': 'warning',
          '合同': 'primary',
          '生产': 'info',
          '已完成': 'success',
        }
        return (
          <AttioTag color={colorMap[status] || 'default'}>
            {status}
          </AttioTag>
        )
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: '负责人',
      dataIndex: 'created_by',
      key: 'created_by',
      width: 100,
      render: (user) => user?.full_name || '-',
    },
  ]

  // Context menu for table rows
  const getProjectContextMenu = (record) => [
    commonContextMenuItems.view(() => navigate(`/projects/${record._id}`)),
    commonContextMenuItems.edit(() => message.info('编辑项目')),
    commonContextMenuItems.divider(),
    {
      label: '生成报价',
      icon: <FileDoneOutlined />,
      onClick: () => message.info('生成报价'),
    },
    commonContextMenuItems.divider(),
    commonContextMenuItems.delete(() => message.warning('删除项目')),
  ]

  return (
    <div className="attio-fade-in">
      {/* KPI Statistics - Top Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {kpiCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <AttioCard 
              bordered={true}
              padding="default"
              style={{
                height: '100%',
                transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = card.color
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = colors.border.light
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: 13, 
                    color: colors.text.secondary, 
                    marginBottom: 8,
                    fontWeight: 500,
                  }}>
                    {card.title}
                  </div>
                  <div style={{ 
                    fontSize: 32, 
                    fontWeight: 600, 
                    color: colors.text.primary,
                    lineHeight: 1,
                    marginBottom: 8,
                  }}>
                    {card.value}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {card.trend.isUp ? (
                      <ArrowUpOutlined style={{ color: colors.success.main, fontSize: 12 }} />
                    ) : (
                      <ArrowDownOutlined style={{ color: colors.error.main, fontSize: 12 }} />
                    )}
                    <span style={{ 
                      fontSize: 12, 
                      color: card.trend.isUp ? colors.success.main : colors.error.main,
                      fontWeight: 500,
                    }}>
                      {card.trend.value}%
                    </span>
                    <span style={{ fontSize: 12, color: colors.text.secondary }}>
                      vs 上月
                    </span>
                  </div>
                </div>
                <div style={{
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${card.color}15`,
                  borderRadius: 8,
                }}>
                  {card.icon}
                </div>
              </div>
            </AttioCard>
          </Col>
        ))}
      </Row>

      {/* Main Content - Projects Table */}
      <AttioCard 
        title="最近项目" 
        padding="default"
        extra={
          <AttioButton 
            variant="primary" 
            size="small"
            onClick={() => navigate('/projects')}
          >
            查看全部
          </AttioButton>
        }
      >
        <AttioTable
          columns={projectColumns}
          dataSource={projects}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          components={{
            body: {
              row: (props) => {
                const record = projects.find(p => p._id === props['data-row-key'])
                return record ? (
                  <AttioContextMenu items={getProjectContextMenu(record)}>
                    <tr {...props} />
                  </AttioContextMenu>
                ) : <tr {...props} />
              },
            },
          }}
        />
      </AttioCard>

      {/* Additional sections can be added here */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <AttioCard title="待办事项" padding="default">
            <div style={{ 
              padding: '40px 0', 
              textAlign: 'center', 
              color: colors.text.secondary 
            }}>
              暂无待办事项
            </div>
          </AttioCard>
        </Col>
        <Col xs={24} lg={12}>
          <AttioCard title="最近活动" padding="default">
            <div style={{ 
              padding: '40px 0', 
              textAlign: 'center', 
              color: colors.text.secondary 
            }}>
              暂无最近活动
            </div>
          </AttioCard>
        </Col>
      </Row>
    </div>
  )
}

export default DashboardPageAttio

