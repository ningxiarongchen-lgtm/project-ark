import { useState, useMemo } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, theme, Space } from 'antd'
import {
  DashboardOutlined,
  ProjectOutlined,
  FileDoneOutlined,
  ScheduleOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  DatabaseOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CustomerServiceOutlined,
  UploadOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../../store/authStore'
import NotificationBell from '../NotificationBell'

const { Header, Sider, Content } = Layout

// 菜单配置 - 定义所有菜单项及其访问权限
const menuConfig = [
  {
    key: '/dashboard',
    label: '仪表盘',
    icon: <DashboardOutlined />,
    roles: ['Administrator', 'Technical Engineer', 'Business Engineer', 'Sales Manager', 'Procurement Specialist', 'Production Planner', 'QA Inspector', 'Logistics Specialist', 'Shop Floor Worker'],
  },
  // 👑 管理员专属菜单
  {
    key: '/admin',
    label: '用户管理',
    icon: <UserOutlined />,
    roles: ['Administrator'],
  },
  {
    key: '/data-management',
    label: '产品数据库',
    icon: <DatabaseOutlined />,
    roles: ['Administrator', 'Procurement Specialist'],
  },
  {
    key: '/suppliers',
    label: '供应商管理',
    icon: <TeamOutlined />,
    roles: ['Administrator', 'Procurement Specialist'],
  },
  // 🔒 业务菜单（管理员不可见）
  {
    key: '/projects',
    label: '项目管理',
    icon: <ProjectOutlined />,
    roles: ['Technical Engineer', 'Business Engineer', 'Sales Manager'],
  },
  {
    key: '/orders',
    label: '订单管理',
    icon: <FileDoneOutlined />,
    roles: ['Sales Manager', 'Production Planner'],
  },
  {
    key: '/production-schedule',
    label: '生产排期',
    icon: <ScheduleOutlined />,
    roles: ['Production Planner'],
  },
  {
    key: '/purchase-orders',
    label: '采购管理',
    icon: <ShoppingCartOutlined />,
    roles: ['Procurement Specialist'],
  },
  {
    key: '/quality',
    label: '质检管理',
    icon: <SafetyOutlined />,
    roles: ['QA Inspector', 'Production Planner', 'Administrator'],
  },
  {
    key: '/service-center',
    label: '售后服务',
    icon: <CustomerServiceOutlined />,
    roles: ['Technical Engineer', 'Sales Manager'],
  },
  {
    key: '/product-catalog',
    label: '产品目录',
    icon: <DatabaseOutlined />,
    roles: ['Sales Manager'],
  },
  // 质检员专属菜单
  {
    key: '/quality-inspection',
    label: '质检任务',
    icon: <FileDoneOutlined />,
    roles: ['QA Inspector'],
  },
  // 物流专员专属菜单
  {
    key: '/my-delivery-tasks',
    label: '发货任务',
    icon: <ScheduleOutlined />,
    roles: ['Logistics Specialist'],
  },
  // 车间工人专属菜单
  {
    key: '/shop-floor',
    label: '我的工单',
    icon: <FileDoneOutlined />,
    roles: ['Shop Floor Worker'],
  },
]

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  // 根据用户角色动态生成菜单项
  const menuItems = useMemo(() => {
    if (!user || !user.role) return []

    // 筛选出当前角色有权访问的菜单项
    return menuConfig
      .filter(item => item.roles.includes(user.role))
      .map(item => ({
        key: item.key,
        icon: item.icon,
        label: item.label,
      }))
  }, [user])

  // 角色中文翻译映射
  const roleTranslations = {
    'Technical Engineer': '技术工程师',
    'Business Engineer': '商务工程师',
    'Sales Manager': '销售经理',
    'Procurement Specialist': '采购专员',
    'Production Planner': '生产计划员',
    'QA Inspector': '质检员',
    'Logistics Specialist': '物流专员',
    'Shop Floor Worker': '车间工人',
    'Administrator': '管理员',
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? '16px' : '20px',
          fontWeight: 'bold',
          transition: 'all 0.2s',
        }}>
          {collapsed ? '智造' : '智能制造系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {collapsed ? (
              <MenuUnfoldOutlined
                style={{ fontSize: '18px', cursor: 'pointer' }}
                onClick={() => setCollapsed(!collapsed)}
              />
            ) : (
              <MenuFoldOutlined
                style={{ fontSize: '18px', cursor: 'pointer' }}
                onClick={() => setCollapsed(!collapsed)}
              />
            )}
            <h2 style={{ marginLeft: 24, marginBottom: 0 }}>
              智能制造综合管理系统
            </h2>
          </div>
          <Space size="middle">
            {/* 实时通知铃铛 */}
            <NotificationBell />
            
            {/* 用户菜单 */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                <span style={{ marginLeft: 8, fontWeight: 500 }}>
                  {user?.full_name || user?.phone}
                </span>
                <span style={{ fontSize: '12px', color: '#999', marginLeft: 8 }}>
                  {roleTranslations[user?.role] || user?.role}
                </span>
              </div>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 8,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout


