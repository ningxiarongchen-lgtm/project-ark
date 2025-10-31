import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuthStore } from './store/authStore'
import AttioLayout from './components/Layout/AttioLayout'

// 全局加载指示器组件
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#FFFFFF'
  }}>
    <Spin size="large" />
  </div>
)

// 代码分割 - 懒加载所有页面组件
const Login = lazy(() => import('./pages/Login'))
const ChangePassword = lazy(() => import('./pages/ChangePassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetails = lazy(() => import('./pages/ProductDetails'))
const ECODetails = lazy(() => import('./pages/ECODetails'))
const Projects = lazy(() => import('./pages/Projects'))
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'))
const ProjectDashboard = lazy(() => import('./pages/ProjectDashboard'))
const Quotes = lazy(() => import('./pages/Quotes'))
const QuoteDetails = lazy(() => import('./pages/QuoteDetails'))
const SelectionEngine = lazy(() => import('./pages/SelectionEngine'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const SupplierManagement = lazy(() => import('./pages/SupplierManagement'))
const PurchaseOrderManagement = lazy(() => import('./pages/PurchaseOrderManagement'))
const PurchaseOrderDetails = lazy(() => import('./pages/PurchaseOrderDetails'))
const CreatePurchaseOrder = lazy(() => import('./pages/CreatePurchaseOrder'))
const OrderManagement = lazy(() => import('./pages/OrderManagement'))
const OrderDetails = lazy(() => import('./pages/OrderDetails'))
const ProductionSchedule = lazy(() => import('./pages/ProductionSchedule'))
const ShopFloorTerminal = lazy(() => import('./pages/ShopFloorTerminal'))
const QualityManagement = lazy(() => import('./pages/QualityManagement'))
const ERPDashboard = lazy(() => import('./pages/ERPDashboard'))
const ServiceCenter = lazy(() => import('./pages/ServiceCenter'))
const TicketDetails = lazy(() => import('./pages/TicketDetails'))
const Profile = lazy(() => import('./pages/Profile'))
const NotFound = lazy(() => import('./pages/NotFound'))
const DataManagement = lazy(() => import('./pages/DataManagement'))
const ProductCatalog = lazy(() => import('./pages/ProductCatalog'))
const ProductImport = lazy(() => import('./pages/ProductImport'))
const AdminReports = lazy(() => import('./pages/AdminReports'))
const MaterialRequirements = lazy(() => import('./pages/MaterialRequirements'))
const MaterialRequirementDetail = lazy(() => import('./pages/MaterialRequirementDetail'))
const ContractCenter = lazy(() => import('./pages/ContractCenter'))
const ContractAnalytics = lazy(() => import('./pages/ContractAnalytics'))
const QualityInspectorDashboard = lazy(() => import('./pages/quality/QualityInspectorDashboard'))
const QualityInspectionPage = lazy(() => import('./pages/quality/QualityInspectionPage'))
const MyDeliveryTasks = lazy(() => import('./pages/logistics/MyDeliveryTasks'))

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole, requiredRoles, skipPasswordCheck }) => {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 检查是否需要强制修改密码（除非是修改密码页面本身）
  if (!skipPasswordCheck && user?.passwordChangeRequired) {
    return <Navigate to="/change-password" replace />
  }

  // 单一角色验证
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  // 多角色验证（数组）
  if (requiredRoles && Array.isArray(requiredRoles) && !requiredRoles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Change Password Route - Protected but skips password check */}
        <Route path="/change-password" element={
          <ProtectedRoute skipPasswordCheck={true}>
            <ChangePassword />
          </ProtectedRoute>
        } />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AttioLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          {/* 产品路由重定向到产品数据管理，保持向后兼容 */}
          <Route path="products" element={<Navigate to="/data-management" replace />} />
          <Route path="products/:id" element={
            <ProtectedRoute requiredRoles={['Administrator', 'Technical Engineer', 'Business Engineer', 'Procurement Specialist', 'Production Planner']}>
              <ProductDetails />
            </ProtectedRoute>
          } />
          <Route path="ecos/:id" element={<ECODetails />} />
          <Route path="projects" element={<ProjectDashboard />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="quotes/:id" element={<QuoteDetails />} />
          <Route path="selection-engine" element={<SelectionEngine />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="orders/:id" element={<OrderDetails />} />
          <Route path="production-schedule" element={<ProductionSchedule />} />
          <Route path="quality" element={
            <ProtectedRoute requiredRoles={['Administrator', 'QA Inspector', 'Production Planner']}>
              <QualityManagement />
            </ProtectedRoute>
          } />
          <Route path="erp-dashboard" element={<ERPDashboard />} />
          <Route path="service-center" element={<ServiceCenter />} />
          <Route path="service-center/:id" element={<TicketDetails />} />
          <Route path="profile" element={<Profile />} />
          
          {/* Product Catalog - Sales Manager Only */}
          <Route path="product-catalog" element={
            <ProtectedRoute requiredRoles={['Sales Manager', 'Administrator']}>
              <ProductCatalog />
            </ProtectedRoute>
          } />
          
          {/* Admin Only Routes */}
          <Route path="admin" element={
            <ProtectedRoute requiredRole="Administrator">
              <AdminPanel />
            </ProtectedRoute>
          } />
          <Route path="admin/reports" element={
            <ProtectedRoute requiredRole="Administrator">
              <AdminReports />
            </ProtectedRoute>
          } />
          <Route path="data-management" element={
            <ProtectedRoute requiredRoles={['Administrator', 'Technical Engineer', 'Procurement Specialist']}>
              <DataManagement />
            </ProtectedRoute>
          } />
          <Route path="product-import" element={
            <ProtectedRoute requiredRoles={['Administrator', 'Technical Engineer']}>
              <ProductImport />
            </ProtectedRoute>
          } />
          <Route path="suppliers" element={
            <ProtectedRoute requiredRoles={['Administrator', 'Procurement Specialist']}>
              <SupplierManagement />
            </ProtectedRoute>
          } />
          <Route path="purchase-orders" element={
            <ProtectedRoute requiredRoles={['Administrator', 'Procurement Specialist']}>
              <PurchaseOrderManagement />
            </ProtectedRoute>
          } />
          <Route path="purchase-orders/:id" element={
            <ProtectedRoute requiredRoles={['Administrator', 'Procurement Specialist']}>
              <PurchaseOrderDetails />
            </ProtectedRoute>
          } />
          <Route path="purchase-orders/create" element={
            <ProtectedRoute requiredRoles={['Administrator', 'Procurement Specialist']}>
              <CreatePurchaseOrder />
            </ProtectedRoute>
          } />
          <Route path="purchase-orders/edit/:id" element={
            <ProtectedRoute requiredRoles={['Administrator', 'Procurement Specialist']}>
              <CreatePurchaseOrder />
            </ProtectedRoute>
          } />
          
          {/* Material Requirements Routes */}
          <Route path="material-requirements" element={
            <ProtectedRoute requiredRoles={['Administrator', 'Production Planner', 'Procurement Specialist']}>
              <MaterialRequirements />
            </ProtectedRoute>
          } />
          <Route path="material-requirements/:id" element={
            <ProtectedRoute requiredRoles={['Administrator', 'Production Planner', 'Procurement Specialist']}>
              <MaterialRequirementDetail />
            </ProtectedRoute>
          } />
          
          {/* Contract Management Center - Business Engineer & Administrator */}
          <Route path="contracts" element={
            <ProtectedRoute requiredRoles={['Administrator', 'Business Engineer']}>
              <ContractCenter />
            </ProtectedRoute>
          } />
          
          {/* Contract Analytics - Business Engineer & Administrator */}
          <Route path="contract-analytics" element={
            <ProtectedRoute requiredRoles={['Administrator', 'Business Engineer', 'Sales Manager']}>
              <ContractAnalytics />
            </ProtectedRoute>
          } />
          
          {/* Quality Inspector Routes - QA Inspector & Administrator */}
          <Route path="quality-inspection" element={
            <ProtectedRoute requiredRoles={['QA Inspector', 'Administrator']}>
              <QualityInspectorDashboard />
            </ProtectedRoute>
          } />
          <Route path="quality/dashboard" element={
            <ProtectedRoute requiredRoles={['QA Inspector', 'Administrator']}>
              <QualityInspectorDashboard />
            </ProtectedRoute>
          } />
          <Route path="quality/inspect/:id" element={
            <ProtectedRoute requiredRoles={['QA Inspector', 'Administrator']}>
              <QualityInspectionPage />
            </ProtectedRoute>
          } />
          
          {/* Logistics Specialist Routes */}
          <Route path="my-delivery-tasks" element={
            <ProtectedRoute requiredRoles={['Logistics Specialist', 'Administrator']}>
              <MyDeliveryTasks />
            </ProtectedRoute>
          } />
          
          {/* Shop Floor Worker Routes */}
          <Route path="shop-floor" element={
            <ProtectedRoute requiredRoles={['Shop Floor Worker', 'Production Planner', 'Administrator']}>
              <AttioLayout>
                <ShopFloorTerminal />
              </AttioLayout>
            </ProtectedRoute>
          } />
        </Route>

        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default App


