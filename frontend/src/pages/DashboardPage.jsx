/**
 * DashboardPage - 智能仪表盘路由组件
 * 
 * 根据用户角色自动显示对应的专属仪表盘
 */

import { useAuth } from '../hooks/useAuth'
import { Spin, Result, Button } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

// 引入各角色的专属仪表盘组件
import AdminDashboard from '../components/dashboards/AdminDashboard'
import TechnicalEngineerDashboard from '../components/dashboards/TechnicalEngineerDashboard'
import SalesEngineerDashboard from '../components/dashboards/SalesEngineerDashboard'
import SalesManagerDashboard from '../components/dashboards/SalesManagerDashboard'
import ProcurementSpecialistDashboard from '../components/dashboards/ProcurementSpecialistDashboard'
import ProductionPlannerDashboard from '../components/dashboards/ProductionPlannerDashboard'
import AfterSalesEngineerDashboard from '../components/dashboards/AfterSalesEngineerDashboard'

const DashboardPage = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // 如果用户未登录
  if (!isAuthenticated || !user) {
    return (
      <Result
        status="403"
        title="未登录"
        subTitle="请先登录以访问仪表盘"
        extra={
          <Button type="primary" onClick={() => navigate('/login')}>
            前往登录
          </Button>
        }
      />
    )
  }

  // 如果用户没有角色
  if (!user.role) {
    return (
      <Result
        icon={<UserOutlined />}
        title="角色未分配"
        subTitle="您的账号尚未分配角色，请联系管理员"
      />
    )
  }

  // 根据用户角色渲染对应的仪表盘
  switch (user.role) {
    case 'Administrator':
      return <AdminDashboard />

    case 'Technical Engineer':
      return <TechnicalEngineerDashboard />

    case 'Sales Engineer':
      return <SalesEngineerDashboard />

    case 'Sales Manager':
      return <SalesManagerDashboard />

    case 'Procurement Specialist':
      return <ProcurementSpecialistDashboard />

    case 'Production Planner':
      return <ProductionPlannerDashboard />

    case 'After-sales Engineer':
      return <AfterSalesEngineerDashboard />

    default:
      return (
        <Result
          status="warning"
          title="未知角色"
          subTitle={`未知的角色类型：${user.role}`}
          extra={
            <Button type="primary" onClick={() => navigate('/profile')}>
              查看个人资料
            </Button>
          }
        />
      )
  }
}

export default DashboardPage

