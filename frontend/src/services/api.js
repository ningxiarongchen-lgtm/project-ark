import axios from 'axios'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useAuthStore } from '../store/authStore'

// 🚀 API URL 配置 - 使用环境变量
const getApiUrl = () => {
  // 优先使用环境变量
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // 生产环境默认值（如果没有配置环境变量）
  if (import.meta.env.PROD) {
    return 'https://project-ark-efy7.onrender.com/api'
  }
  
  // 本地开发环境
  return 'http://localhost:5001/api'
}

const API_URL = getApiUrl()

// Configure NProgress
NProgress.configure({ 
  showSpinner: false,  // Hide spinner, only show bar
  trickleSpeed: 200,   // Adjust speed
  minimum: 0.08        // Minimum progress percentage
})

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // 🔒 安全改进：启用 withCredentials，允许发送和接收 Cookie
  withCredentials: true,
  // ⏱️ 超时配置：避免长时间等待（Render冷启动或网络慢）
  timeout: 30000 // 30秒超时
})

// Track active requests for NProgress
let activeRequests = 0

// Request interceptor to add auth token and start NProgress
api.interceptors.request.use(
  (config) => {
    // Start NProgress on first request
    if (activeRequests === 0) {
      NProgress.start()
    }
    activeRequests++
    
    // Cookie 模式下，token 会自动通过 Cookie 发送，无需手动添加
    // 保留此代码以向后兼容可能仍使用 localStorage 的情况
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    // Decrement and stop NProgress on error
    activeRequests--
    if (activeRequests === 0) {
      NProgress.done()
    }
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and stop NProgress
api.interceptors.response.use(
  (response) => {
    // Decrement and stop NProgress on success
    activeRequests--
    if (activeRequests === 0) {
      NProgress.done()
    }
    return response
  },
  async (error) => {
    // Decrement and stop NProgress on error
    activeRequests--
    if (activeRequests === 0) {
      NProgress.done()
    }
    
    // ⏱️ 处理超时错误
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.error('请求超时：后端服务响应缓慢，可能是Render冷启动')
      // 返回更友好的错误信息
      error.message = '服务器响应超时，请稍后重试'
    }
    
    // 🌐 处理网络错误
    if (error.message === 'Network Error') {
      console.error('网络错误：无法连接到后端服务')
      error.message = '网络连接失败，请检查您的网络连接'
    }
    
    // 🔒 防止无限循环：只处理非 logout 请求的 401 错误
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/logout')) {
      // 🔒 安全改进：在401错误时调用后端 logout API 清除 Cookie
      try {
        await api.post('/auth/logout')
      } catch (logoutError) {
        // 即使 logout 失败也继续清除本地状态（这是预期行为）
        console.error('Logout API call failed (expected if already logged out):', logoutError)
      }
      
      // Unauthorized - clear auth and redirect to login
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ==================== 认证 API ====================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'), // 🔒 添加 logout 接口以清除服务器端的 Cookie
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data)
}

// ==================== 执行器 API ====================
export const actuatorsAPI = {
  // CRUD
  getAll: (params) => api.get('/actuators', { params }),
  getById: (id) => api.get(`/actuators/${id}`),
  create: (data) => api.post('/actuators', data),
  update: (id, data) => api.put(`/actuators/${id}`, data),
  delete: (id) => api.delete(`/actuators/${id}`),
  
  // 按扭矩查找
  findByTorque: (data) => api.post('/actuators/find-by-torque', data),
  
  // 版本管理
  getVersionHistory: (id) => api.get(`/actuators/${id}/versions`),
  createNewVersion: (id, data) => api.post(`/actuators/${id}/new-version`, data),
  
  // Excel 导入导出
  uploadExcel: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/actuators/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  downloadTemplate: () => api.get('/actuators/template', { 
    responseType: 'blob' 
  })
}

// ==================== 手动操作装置 API ====================
export const manualOverridesAPI = {
  // CRUD
  getAll: (params) => api.get('/manual-overrides', { params }),
  getById: (id) => api.get(`/manual-overrides/${id}`),
  create: (data) => api.post('/manual-overrides', data),
  update: (id, data) => api.put(`/manual-overrides/${id}`, data),
  delete: (id) => api.delete(`/manual-overrides/${id}`),
  
  // 查找兼容设备
  findCompatible: (bodySize) => api.get(`/manual-overrides/compatible/${bodySize}`),
  
  // Excel 导入导出
  uploadExcel: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/manual-overrides/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  downloadTemplate: () => api.get('/manual-overrides/template', { 
    responseType: 'blob' 
  })
}

// ==================== 智能选型引擎 API ====================
export const selectionAPI = {
  // 计算推荐
  calculate: (data) => api.post('/selection/calculate', data),
  
  // 获取推荐
  recommend: (data) => api.post('/selection/recommend', data),
  
  // 批量选型
  batch: (data) => api.post('/selection/batch', data)
}

// ==================== 项目管理 API ====================
export const projectsAPI = {
  // CRUD - 使用 /projects 端点
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  
  // 项目选型
  addSelection: (projectId, data) => api.post(`/projects/${projectId}/selections`, data),
  updateSelection: (projectId, selectionId, data) => api.put(`/projects/${projectId}/selections/${selectionId}`, data),
  removeSelection: (projectId, selectionId) => api.delete(`/projects/${projectId}/selections/${selectionId}`),
  
  // 自动选型
  autoSelect: (id, data) => api.post(`/new-projects/${id}/auto-select`, data),
  
  // 统计
  getStats: () => api.get('/projects/stats/summary'),
  getSalesEngineerStats: () => api.get('/projects/stats/sales-engineer'),
  
  // 获取技术工程师列表
  getTechnicalEngineers: () => api.get('/projects/technical-engineers/list'),
  
  // 指派技术工程师
  assignTechnicalEngineer: (projectId, data) => api.post(`/projects/${projectId}/assign-technical`, data),
  
  // 🔒 技术清单版本管理
  submitTechnicalList: (id, notes) => api.post(`/new-projects/${id}/submit-technical-list`, { notes }),                                                         
  rejectTechnicalList: (id, suggestions, target_version) => api.post(`/new-projects/${id}/reject-technical-list`, { suggestions, target_version }),             
  respondToModification: (id, request_id, response, accept) => api.post(`/new-projects/${id}/respond-modification`, { request_id, response, accept }),          
  confirmTechnicalVersion: (id, version) => api.post(`/new-projects/${id}/confirm-technical-version`, { version }),                                             
  getTechnicalVersions: (id) => api.get(`/new-projects/${id}/technical-versions`),                                                                              
  getModificationRequests: (id) => api.get(`/new-projects/${id}/modification-requests`),
  
  // 💰 款到发货流程 - 尾款确认
  getPendingFinalPayment: () => api.get('/new-projects/pending-final-payment'),
  confirmFinalPayment: (id, data) => api.post(`/new-projects/${id}/confirm-final-payment`, data)
}

// ==================== 旧的 Products/Accessories API（向后兼容）====================
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  search: (criteria) => api.post('/products/search', criteria)
}

export const accessoriesAPI = {
  getAll: (params) => api.get('/accessories', { params }),
  getById: (id) => api.get(`/accessories/${id}`),
  create: (data) => api.post('/accessories', data),
  update: (id, data) => api.put(`/accessories/${id}`, data),
  delete: (id) => api.delete(`/accessories/${id}`),
  
  // 按类别获取
  getByCategory: (category) => api.get(`/accessories/category/${category}`),
  
  // 获取兼容配件
  getCompatible: (actuatorId, params) => api.get(`/accessories/compatible/${actuatorId}`, { params }),
  
  // Excel 导入导出
  uploadExcel: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/accessories/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  downloadTemplate: () => api.get('/accessories/template', { 
    responseType: 'blob' 
  })
}

// ==================== 报价 API（向后兼容）====================
export const quotesAPI = {
  getAll: (params) => api.get('/quotes', { params }),
  getById: (id) => api.get(`/quotes/${id}`),
  create: (data) => api.post('/quotes', data),
  update: (id, data) => api.put(`/quotes/${id}`, data),
  delete: (id) => api.delete(`/quotes/${id}`),
  revise: (id, data) => api.post(`/quotes/${id}/revise`, data),
  getStats: () => api.get('/quotes/stats/summary')
}

// ==================== AI 优化建议 API ====================
export const aiAPI = {
  // 获取BOM优化建议
  optimizeBOM: (data) => api.post('/ai/optimize-bom', data),
  
  // 获取AI服务状态
  getStatus: () => api.get('/ai/status')
}

// ==================== 供应商管理 API ====================
export const suppliersAPI = {
  // CRUD
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  
  // 状态和评级
  updateStatus: (id, status) => api.patch(`/suppliers/${id}/status`, { status }),
  updateRating: (id, rating) => api.patch(`/suppliers/${id}/rating`, { rating }),
  
  // 统计
  getStats: () => api.get('/suppliers/stats/summary')
}

// ==================== 采购订单管理 API ====================
export const purchaseOrdersAPI = {
  // CRUD
  getAll: (params) => api.get('/purchase-orders', { params }),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  update: (id, data) => api.put(`/purchase-orders/${id}`, data),
  delete: (id) => api.delete(`/purchase-orders/${id}`),
  
  // 状态管理
  updateStatus: (id, status) => api.patch(`/purchase-orders/${id}/status`, { status }),
  
  // 统计
  getStats: () => api.get('/purchase-orders/stats/summary'),
  
  // 按供应商查询
  getBySupplier: (supplierId) => api.get(`/purchase-orders/supplier/${supplierId}`)
}

// ==================== 物料需求 API ====================
export const materialRequirementsAPI = {
  // CRUD
  getAll: (params) => api.get('/material-requirements', { params }),
  getById: (id) => api.get(`/material-requirements/${id}`),
  create: (data) => api.post('/material-requirements', data),
  update: (id, data) => api.put(`/material-requirements/${id}`, data),
  delete: (id) => api.delete(`/material-requirements/${id}`),
  
  // 统计
  getStats: () => api.get('/material-requirements/stats'),
  
  // 工作流操作
  submit: (id) => api.post(`/material-requirements/${id}/submit`),
  accept: (id) => api.post(`/material-requirements/${id}/accept`),
  addFollowUp: (id, data) => api.post(`/material-requirements/${id}/follow-up`, data),
  updateItemStatus: (id, data) => api.post(`/material-requirements/${id}/update-item-status`, data),
  
  // 创建采购订单
  createPurchaseOrder: (id, data) => api.post(`/material-requirements/${id}/create-purchase-order`, data)
}

// ==================== ECO管理 API ====================
export const ecoAPI = {
  // CRUD
  getAll: (params) => api.get('/ecos', { params }),
  getById: (id) => api.get(`/ecos/${id}`),
  create: (data) => api.post('/ecos', data),
  update: (id, data) => api.put(`/ecos/${id}`, data),
  delete: (id) => api.delete(`/ecos/${id}`),
  
  // 审批操作
  submitForApproval: (id) => api.post(`/ecos/${id}/submit`),
  approve: (id, data) => api.post(`/ecos/${id}/approve`, data),
  reject: (id, data) => api.post(`/ecos/${id}/reject`, data),
  
  // 关闭ECO
  close: (id, data) => api.post(`/ecos/${id}/close`, data),
  
  // 获取待审批
  getPendingApprovals: () => api.get('/ecos/pending-approvals'),
  
  // 统计
  getStats: () => api.get('/ecos/stats'),
  
  // 按产品查询
  getByProduct: (actuatorId) => api.get(`/ecos/by-product/${actuatorId}`)
}

// ==================== MES管理 API ====================
// 工单API
export const workOrdersAPI = {
  getAll: (params) => api.get('/mes/work-orders', { params }),
  getById: (id) => api.get(`/mes/work-orders/${id}`),
  generate: (productionOrderId, options) => api.post(`/mes/work-orders/generate/${productionOrderId}`, options),
  getMyWorkOrders: (params) => api.get('/mes/work-orders/my-work-orders', { params }),
  getStats: (params) => api.get('/mes/work-orders/stats/summary', { params }),
  
  // 工单操作
  start: (id) => api.post(`/mes/work-orders/${id}/start`),
  reportProgress: (id, data) => api.post(`/mes/work-orders/${id}/progress`, data),
  complete: (id) => api.post(`/mes/work-orders/${id}/complete`),
  pause: (id, reason) => api.post(`/mes/work-orders/${id}/pause`, { reason }),
  resume: (id) => api.post(`/mes/work-orders/${id}/resume`),
  reportIssue: (id, data) => api.post(`/mes/work-orders/${id}/issue`, data)
}

// 工作中心API
export const workCentersAPI = {
  getAll: (params) => api.get('/mes/work-centers', { params }),
  getById: (id) => api.get(`/mes/work-centers/${id}`),
  create: (data) => api.post('/mes/work-centers', data),
  update: (id, data) => api.put(`/mes/work-centers/${id}`, data),
  delete: (id) => api.delete(`/mes/work-centers/${id}`),
  getStats: () => api.get('/mes/work-centers/stats/summary')
}

// 工艺路线API
export const routingsAPI = {
  getAll: (params) => api.get('/mes/routings', { params }),
  getById: (id) => api.get(`/mes/routings/${id}`),
  create: (data) => api.post('/mes/routings', data),
  update: (id, data) => api.put(`/mes/routings/${id}`, data),
  release: (id) => api.post(`/mes/routings/${id}/release`),
  getByProduct: (productId) => api.get(`/mes/routings/by-product/${productId}`)
}

// MES报表API
export const mesReportsAPI = {
  getCapacityReport: (startDate, endDate) => api.get('/mes/reports/capacity', {
    params: { start_date: startDate, end_date: endDate }
  }),
  reschedule: (startDate, endDate) => api.post('/mes/work-orders/reschedule', {
    start_date: startDate,
    end_date: endDate
  })
}

// ==================== 质量管理 API ====================
export const qualityAPI = {
  // 质检任务CRUD
  getAll: (params) => api.get('/quality/checks', { params }),
  getById: (id) => api.get(`/quality/checks/${id}`),
  create: (data) => api.post('/quality/checks', data),
  delete: (id) => api.delete(`/quality/checks/${id}`),
  
  // 待检列表
  getPending: (params) => api.get('/quality/checks/pending', { params }),
  
  // 我的质检任务
  getMyTasks: (params) => api.get('/quality/checks/my-tasks', { params }),
  
  // 检验操作
  start: (id) => api.post(`/quality/checks/${id}/start`),
  complete: (id, data) => api.post(`/quality/checks/${id}/complete`, data),
  addDefect: (id, data) => api.post(`/quality/checks/${id}/defects`, data),
  addCorrectiveAction: (id, data) => api.post(`/quality/checks/${id}/corrective-actions`, data),
  
  // 审核
  review: (id, data) => api.post(`/quality/checks/${id}/review`, data),
  
  // 质检通过，更新生产订单状态
  markProductionOrderQCPassed: (productionOrderId, data) => api.post(`/quality/production-order/${productionOrderId}/pass`, data),
  
  // 统计和分析
  getStats: (params) => api.get('/quality/stats', { params }),
  getDefectAnalysis: (params) => api.get('/quality/defect-analysis', { params })
}

// ==================== 财务管理 API ====================
// 发票API
export const invoiceAPI = {
  getAll: (params) => api.get('/finance/invoices', { params }),
  getById: (id) => api.get(`/finance/invoices/${id}`),
  create: (data) => api.post('/finance/invoices', data),
  update: (id, data) => api.put(`/finance/invoices/${id}`, data),
  
  // 发票操作
  issue: (id, data) => api.post(`/finance/invoices/${id}/issue`, data),
  void: (id, reason) => api.post(`/finance/invoices/${id}/void`, { reason }),
  redInvoice: (id, reason) => api.post(`/finance/invoices/${id}/red-invoice`, { reason }),
  
  // 统计
  getStats: (params) => api.get('/finance/invoices/stats/summary', { params })
}

// 回款API
export const paymentAPI = {
  getAll: (params) => api.get('/finance/payments', { params }),
  getById: (id) => api.get(`/finance/payments/${id}`),
  create: (data) => api.post('/finance/payments', data),
  delete: (id) => api.delete(`/finance/payments/${id}`),
  
  // 回款操作
  confirm: (id, notes) => api.post(`/finance/payments/${id}/confirm`, { notes }),
  void: (id, reason) => api.post(`/finance/payments/${id}/void`, { reason }),
  
  // 查询
  getPending: () => api.get('/finance/payments/pending'),
  
  // 统计
  getStats: (params) => api.get('/finance/payments/stats/summary', { params })
}

// ==================== ERP统计 API ====================
export const erpAPI = {
  getDashboard: (params) => api.get('/erp/dashboard', { params }),
  getSalesStats: (params) => api.get('/erp/sales', { params }),
  getProductionStats: (params) => api.get('/erp/production', { params }),
  getFinanceStats: (params) => api.get('/erp/finance', { params })
}

// ==================== 订单管理 API ====================
export const ordersAPI = {
  // 从项目创建订单
  createFromProject: (projectId, data) => api.post(`/orders/from-project/${projectId}`, data),
  
  // CRUD
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.put(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`),
  
  // 状态管理
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  
  // 审批
  approve: (id, data) => api.post(`/orders/${id}/approve`, data),
  
  // 付款记录
  addPayment: (id, data) => api.post(`/orders/${id}/payment`, data),
  
  // 质检通过的订单列表（商务工程师）
  getQCPassedOrders: (params) => api.get('/orders/qc-passed/list', { params }),
  
  // 待发货订单列表（物流人员）
  getReadyToShipOrders: (params) => api.get('/orders/ready-to-ship/list', { params }),
  
  // 确认收到70%尾款（商务工程师）
  confirmFinalPayment: (id, data) => api.post(`/orders/${id}/confirm-final-payment`, data),
  
  // 准备发货（商务工程师确认尾款后）
  markAsReadyToShip: (id, data) => api.post(`/orders/${id}/mark-ready-to-ship`, data),
  
  // 录入物流信息（物流人员）
  addShipment: (id, data) => api.post(`/orders/${id}/add-shipment`, data),
  
  // 统计
  getStatistics: () => api.get('/orders/statistics')
}

// ==================== 生产管理 API ====================
export const productionAPI = {
  // 从项目创建销售订单和生产订单（确认收款后）
  createFromProject: (projectId, data) => api.post(`/production/from-project/${projectId}`, data),
  
  // 从销售订单创建生产订单
  createFromOrder: (salesOrderId, data) => api.post(`/production/from-order/${salesOrderId}`, data),
  
  // CRUD
  getAll: (params) => api.get('/production', { params }),
  getById: (id) => api.get(`/production/${id}`),
  update: (id, data) => api.put(`/production/${id}`, data),
  delete: (id) => api.delete(`/production/${id}`),
  
  // 状态管理
  updateStatus: (id, data) => api.patch(`/production/${id}/status`, data),
  
  // 进度更新
  updateProgress: (id, data) => api.patch(`/production/${id}/progress`, data),
  
  // 资源分配
  assignResources: (id, data) => api.post(`/production/${id}/assign-resources`, data),
  
  // APS智能排程
  scheduleProduction: (id, options = {}) => api.post(`/production/${id}/schedule`, options),
  
  // 甘特图数据
  getGanttData: (params) => api.get('/production/gantt/data', { params }),
  
  // 统计
  getStatistics: () => api.get('/production/statistics'),
  
  // BOM展开
  explodeBOM: (id) => api.post(`/production/${id}/explode-bom`),
  
  // 生成采购需求
  generateProcurement: (id, data) => api.post(`/production/${id}/generate-procurement`, data),
  
  // 更新执行器BOM结构
  updateActuatorBOM: (actuatorId, bom_structure) => api.put(`/data-management/actuators/${actuatorId}/bom-structure`, { bom_structure }),
  
  // 生产完成，标记为待质检
  markAsAwaitingQC: (id, data) => api.post(`/production/${id}/mark-awaiting-qc`, data)
}

// ==================== 售后服务 API ====================
export const ticketsAPI = {
  // CRUD
  create: (data) => api.post('/tickets', data),
  getAll: (params) => api.get('/tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
  
  // 状态管理
  updateStatus: (id, data) => api.patch(`/tickets/${id}/status`, data),
  
  // 分配工程师
  assignEngineer: (id, data) => api.post(`/tickets/${id}/assign`, data),
  
  // 跟进记录
  addFollowUp: (id, data) => api.post(`/tickets/${id}/follow-up`, data),
  
  // 客户反馈
  submitFeedback: (id, data) => api.post(`/tickets/${id}/feedback`, data),
  
  // 我的工单
  getMyTickets: (params) => api.get('/tickets/my-tickets', { params }),
  
  // 统计
  getStatistics: () => api.get('/tickets/statistics')
}

// ==================== 合同管理 API ====================
export const contractsAPI = {
  // 获取合同列表
  getAll: (params) => api.get('/contracts', { params }),
  
  // 获取合同统计
  getStats: () => api.get('/contracts/stats'),
  
  // 获取单个合同详情
  getById: (id) => api.get(`/contracts/${id}`),
  
  // 创建销售合同（销售经理）
  createSalesContract: (data) => api.post('/contracts/sales', data),
  
  // 创建采购合同（采购专员）
  createPurchaseContract: (data) => api.post('/contracts/purchase', data),
  
  // 商务工程师接单
  acceptContract: (id) => api.put(`/contracts/${id}/accept`),
  
  // 上传盖章版合同
  sealContract: (id, data) => api.put(`/contracts/${id}/seal`, data),
  
  // 驳回合同
  rejectContract: (id, data) => api.put(`/contracts/${id}/reject`, data),
  
  // 更新合同
  update: (id, data) => api.put(`/contracts/${id}`, data),
  
  // 添加跟进记录
  addFollowUp: (id, data) => api.post(`/contracts/${id}/follow-up`, data),
  
  // 删除合同
  delete: (id) => api.delete(`/contracts/${id}`),
  
  // 获取项目的所有合同
  getByProject: (projectId) => api.get(`/contracts/project/${projectId}`),
  
  // 获取采购订单的所有合同
  getByPurchaseOrder: (purchaseOrderId) => api.get(`/contracts/purchase-order/${purchaseOrderId}`)                                                              
}

// ==================== 发货单管理 API ====================
export const deliveryNotesAPI = {
  // 获取所有发货单（支持筛选）
  getAll: (params) => api.get('/delivery-notes', { params }),
  
  // 获取单个发货单详情
  getById: (id) => api.get(`/delivery-notes/${id}`),
  
  // 创建发货通知单（生产计划员/车间主管）
  create: (data) => api.post('/delivery-notes', data),
  
  // 更新发货单信息
  update: (id, data) => api.put(`/delivery-notes/${id}`, data),
  
  // 确认发货（物流专员）
  confirmShipment: (id, data) => api.post(`/delivery-notes/${id}/confirm-shipment`, data),
  
  // 取消发货单
  cancel: (id, data) => api.post(`/delivery-notes/${id}/cancel`, data),
  
  // 获取我的发货任务（物流专员专用）
  getMyTasks: (params) => api.get('/delivery-notes/my-tasks', { params }),
  
  // 获取待处理的发货单（生产计划员/管理员）
  getPending: () => api.get('/delivery-notes/pending')
}

// ==================== 数据管理 API ====================
// 创建通用的数据管理API工厂函数
const createDataManagementAPI = (resource) => ({
  // 获取所有数据（支持分页、搜索、排序）
  getAll: (params) => api.get(`/data-management/${resource}`, { params }),
  
  // 根据ID获取单条数据
  getById: (id) => api.get(`/data-management/${resource}/${id}`),
  
  // 创建新数据
  create: (data) => api.post(`/data-management/${resource}`, data),
  
  // 更新数据
  update: (id, data) => api.put(`/data-management/${resource}/${id}`, data),
  
  // 删除数据
  delete: (id) => api.delete(`/data-management/${resource}/${id}`),
  
  // 批量删除
  bulkDelete: (ids) => api.post(`/data-management/${resource}/bulk-delete`, { ids }),
  
  // 下载CSV模板
  downloadTemplate: () => api.get(`/data-management/${resource}/template`, {
    responseType: 'blob'
  }),
  
  // 批量导入
  bulkImport: (formData) => {
    return api.post(`/data-management/${resource}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 获取统计信息
  getStatistics: () => api.get(`/data-management/${resource}/statistics`)
})

export const dataManagementAPI = {
  actuators: {
    ...createDataManagementAPI('actuators'),
    // Actuator特定方法
    getByTorque: (params) => api.get('/data-management/actuators/by-torque', { params }),
    getBySeries: (series) => api.get(`/data-management/actuators/series/${series}`)
  },
  
  accessories: {
    ...createDataManagementAPI('accessories'),
    // Accessory特定方法
    getByCategory: (category) => api.get(`/data-management/accessories/category/${category}`),
    checkLowStock: () => api.get('/data-management/accessories/low-stock')
  },
  
  suppliers: {
    ...createDataManagementAPI('suppliers'),
    // Supplier特定方法
    getByStatus: (status) => api.get(`/data-management/suppliers/status/${status}`),
    getTopSuppliers: (params) => api.get('/data-management/suppliers/top', { params })
  },
  
  users: {
    ...createDataManagementAPI('users'),
    // User特定方法
    getByRole: (role) => api.get(`/data-management/users/role/${role}`),
    getActiveUsers: () => api.get('/data-management/users/active'),
    toggleStatus: (id) => api.patch(`/data-management/users/${id}/toggle-status`),
    resetPassword: (id, newPassword) => api.put(`/data-management/users/${id}/reset-password`, { newPassword })
  }
}

// ==================== 提醒管理 API ====================
export const remindersAPI = {
  // 获取当前用户的提醒
  getMyReminders: () => api.get('/reminders'),
  
  // 获取所有提醒（管理员）
  getAllReminders: () => api.get('/reminders/all'),
  
  // 获取提醒统计
  getStats: () => api.get('/reminders/stats'),
  
  // 刷新提醒
  refresh: () => api.post('/reminders/refresh'),
  
  // 关闭提醒
  dismiss: (contractId, type) => api.delete(`/reminders/${contractId}/${type}`)
}

// ==================== 管理员 API ====================
export const adminAPI = {
  // 获取系统统计数据
  getSystemStats: () => api.get('/admin/stats'),
  
  // 导入产品数据
  importProducts: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/admin/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  // 导入配件数据
  importAccessories: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/admin/accessories/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  // 下载模板
  downloadTemplate: (type) => api.get(`/admin/${type}/template`, {
    responseType: 'blob'
  })
}

export default api


