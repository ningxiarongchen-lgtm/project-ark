import { useState, useMemo } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Badge, Tooltip, Popover } from 'antd'
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
  BellOutlined,
  SettingOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../../store/authStore'
import { colors } from '../../styles/theme'
import AttioCommandPalette from '../Attio/AttioCommandPalette'
import NotificationPanel from '../Notifications/NotificationPanel'
import useNotifications from '../../hooks/useNotifications'
import '../Attio/AttioSidebar.css'

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
    roles: ['Administrator', 'After-sales Engineer', 'Sales Manager'],
  },
  {
    key: '/product-catalog',
    label: '产品目录',
    icon: <DatabaseOutlined />,
    roles: ['Sales Manager'],
  },
  {
    key: '/products',
    label: '产品数据库',
    icon: <DatabaseOutlined />,
    roles: ['Administrator', 'Technical Engineer', 'Sales Engineer', 'Procurement Specialist', 'Production Planner', 'After-sales Engineer'],
  },
  {
    key: '/data-management',
    label: '数据管理',
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

const AttioLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  
  // Notifications hook
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll
  } = useNotifications()

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

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
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
      danger: true,
    },
  ]

  return (
    <>
      {/* Global Command Palette */}
      <AttioCommandPalette 
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
      
      <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar - Attio Style */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        collapsedWidth={64}
        className={`attio-sidebar ${collapsed ? 'collapsed' : ''}`}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: colors.background.secondary,     // #FBFBFA
          borderRight: `1px solid ${colors.border.light}`,
          transition: 'all 0.2s',
        }}
      >
        {/* Logo Area */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            borderBottom: `1px solid ${colors.border.light}`,
            transition: 'all 0.2s',
          }}
        >
          <div
            style={{
              color: colors.text.primary,
              fontSize: collapsed ? '18px' : '20px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              transition: 'all 0.2s',
            }}
          >
            {collapsed ? '智造' : '智能制造系统'}
          </div>
        </div>

        {/* Navigation Menu - Attio Style */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '8px 0',
          }}
        />
      </Sider>

      {/* Main Layout */}
      <Layout
        style={{
          marginLeft: collapsed ? 64 : 240,
          transition: 'all 0.2s',
          background: colors.background.primary,
        }}
      >
        {/* Header - Attio Style */}
        <Header
          style={{
            padding: '0 24px',
            background: colors.background.primary,
            borderBottom: `1px solid ${colors.border.light}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          {/* Left Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Collapse Toggle */}
            <div
              onClick={() => setCollapsed(!collapsed)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 6,
                transition: 'background-color 0.2s',
                color: colors.text.secondary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.tertiary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {collapsed ? (
                <MenuUnfoldOutlined style={{ fontSize: 16 }} />
              ) : (
                <MenuFoldOutlined style={{ fontSize: 16 }} />
              )}
            </div>

            {/* Page Title */}
            <h1
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: colors.text.primary,
                letterSpacing: '-0.01em',
              }}
            >
              智能制造综合管理系统
            </h1>
          </div>

          {/* Right Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Command Palette Trigger */}
            <Tooltip title="搜索 (⌘K)">
              <div
                onClick={() => setCommandPaletteOpen(true)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  transition: 'background-color 0.2s',
                  color: colors.text.secondary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.tertiary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <SearchOutlined style={{ fontSize: 18 }} />
              </div>
            </Tooltip>

            {/* Notifications */}
            <Popover
              content={
                <NotificationPanel
                  notifications={notifications}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onClear={clearNotification}
                  onClearAll={clearAll}
                />
              }
              trigger="click"
              open={notificationPanelOpen}
              onOpenChange={setNotificationPanelOpen}
              placement="bottomRight"
              overlayStyle={{ padding: 0 }}
            >
              <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                <Tooltip title="通知">
                  <div
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      transition: 'background-color 0.2s',
                      color: colors.text.secondary,
                      backgroundColor: notificationPanelOpen ? colors.background.tertiary : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!notificationPanelOpen) {
                        e.currentTarget.style.backgroundColor = colors.background.tertiary
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!notificationPanelOpen) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <BellOutlined style={{ fontSize: 18 }} />
                  </div>
                </Tooltip>
              </Badge>
            </Popover>

            {/* User Menu */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.tertiary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Avatar
                  size={32}
                  style={{
                    backgroundColor: colors.primary.main,
                    fontWeight: 500,
                  }}
                  icon={<UserOutlined />}
                />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: colors.text.primary,
                    }}
                  >
                    {user?.full_name || user?.phone}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: colors.text.secondary,
                    }}
                  >
                    {roleTranslations[user?.role] || user?.role}
                  </span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content Area */}
        <Content
          style={{
            margin: 0,
            padding: 0,
            minHeight: 'calc(100vh - 64px)',
            background: colors.background.primary,
          }}
        >
          <div
            style={{
              padding: 24,
              maxWidth: 1600,
              margin: '0 auto',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
    </>
  )
}

export default AttioLayout

