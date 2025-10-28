import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import MainLayout from './components/Layout/MainLayout'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ChangePassword from './pages/ChangePassword'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductDetails from './pages/ProductDetails'
import ECODetails from './pages/ECODetails'
import Projects from './pages/Projects'
import ProjectDetails from './pages/ProjectDetails'
import Quotes from './pages/Quotes'
import QuoteDetails from './pages/QuoteDetails'
import SelectionEngine from './pages/SelectionEngine'
import AdminPanel from './pages/AdminPanel'
import SupplierManagement from './pages/SupplierManagement'
import PurchaseOrderManagement from './pages/PurchaseOrderManagement'
import CreatePurchaseOrder from './pages/CreatePurchaseOrder'
import OrderManagement from './pages/OrderManagement'
import OrderDetails from './pages/OrderDetails'
import ProductionSchedule from './pages/ProductionSchedule'
import ShopFloorTerminal from './pages/ShopFloorTerminal'
import QualityManagement from './pages/QualityManagement'
import ERPDashboard from './pages/ERPDashboard'
import ServiceCenter from './pages/ServiceCenter'
import TicketDetails from './pages/TicketDetails'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import DataManagement from './pages/DataManagement'

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
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Change Password Route - Protected but skips password check */}
      <Route path="/change-password" element={
        <ProtectedRoute skipPasswordCheck={true}>
          <ChangePassword />
        </ProtectedRoute>
      } />

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetails />} />
        <Route path="ecos/:id" element={<ECODetails />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="quotes/:id" element={<QuoteDetails />} />
        <Route path="selection-engine" element={<SelectionEngine />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="orders/:id" element={<OrderDetails />} />
        <Route path="production-schedule" element={<ProductionSchedule />} />
        <Route path="shop-floor" element={<ShopFloorTerminal />} />
        <Route path="quality" element={<QualityManagement />} />
        <Route path="erp-dashboard" element={<ERPDashboard />} />
        <Route path="service-center" element={<ServiceCenter />} />
        <Route path="service-center/:id" element={<TicketDetails />} />
        <Route path="profile" element={<Profile />} />
        
        {/* Admin Only Routes */}
        <Route path="admin" element={
          <ProtectedRoute requiredRole="Administrator">
            <AdminPanel />
          </ProtectedRoute>
        } />
        <Route path="data-management" element={
          <ProtectedRoute requiredRoles={['Administrator', 'Technical Engineer', 'Procurement Specialist']}>
            <DataManagement />
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
      </Route>

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App


