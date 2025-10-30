import { useState, useMemo } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd'
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
} from '@ant-design/icons'
import { useAuthStore } from '../../store/authStore'

const { Header, Sider, Content } = Layout

// 菜单配置 - 定义所有菜单项及其访问权限
const menuConfig = [
  {
    key: '/dashboard',
    label: '仪表盘',
    icon: <DashboardOutlined />,
    roles: ['Administrator', 'Technical Engineer', 'Sales Engineer', 'Sales Manager', 'Procurement Specialist', 'Production Planner', 'After-sales Engineer'],
  },
  {
    key: '/projects',
    label: '项目管理',
    icon: <ProjectOutlined />,
    roles: ['Administrator', 'Technical Engineer', 'Sales Engineer', 'Sales Manager'],
  },
  {
    key: '/orders',
    label: '订单管理',
    icon: <FileDoneOutlined />,
    roles: ['Administrator', 'Sales Manager', 'Production Planner'],
  },
  {
    key: '/production-schedule',
    label: '生产排期',
    icon: <ScheduleOutlined />,
    roles: ['Administrator', 'Production Planner'],
  },
  {
    key: '/suppliers',
    label: '供应商管理',
    icon: <TeamOutlined />,
    roles: ['Administrator', 'Procurement Specialist'],
  },
  {
    key: '/purchase-orders',
    label: '采购管理',
    icon: <ShoppingCartOutlined />,
    roles: ['Administrator', 'Procurement Specialist'],
  },
  {
    key: '/service-center',
    label: '售后服务',
    icon: <CustomerServiceOutlined />,
    roles: ['Administrator', 'After-sales Engineer', 'Sales Manager', 'Technical Engineer'],
  },
  {
    key: '/product-catalog',
    label: '产品目录',
    icon: <DatabaseOutlined />,
    roles: ['Sales Manager'],
  },
  {
    key: '/data-management',
    label: '产品数据管理',
    icon: <DatabaseOutlined />,
    roles: ['Administrator', 'Technical Engineer', 'Procurement Specialist'],
  },
  {
    key: '/product-import',
    label: '产品批量导入',
    icon: <UploadOutlined />,
    roles: ['Administrator', 'Technical Engineer'],
  },
  {
    key: '/admin',
    label: '用户管理',
    icon: <UserOutlined />,
    roles: ['Administrator'],
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
    'Sales Engineer': '销售工程师',
    'Sales Manager': '销售经理',
    'Procurement Specialist': '采购专员',
    'Production Planner': '生产计划员',
    'After-sales Engineer': '售后工程师',
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


