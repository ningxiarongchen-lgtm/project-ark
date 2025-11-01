/**
 * 角色中英文映射工具
 * 统一管理系统中所有角色的中英文翻译
 */

// 角色英文到中文的映射
export const ROLE_TRANSLATIONS = {
  'Administrator': '管理员',
  'Sales Manager': '销售经理',
  'Technical Engineer': '技术工程师',
  'Business Engineer': '商务工程师',
  'Procurement Specialist': '采购专员',
  'Production Planner': '生产计划员',
  'QA Inspector': '质检员',
  'Logistics Specialist': '物流专员',
  'Shop Floor Worker': '车间工人'
}

// 角色中文到英文的映射（用于表单提交等场景）
export const ROLE_TRANSLATIONS_CN_TO_EN = {
  '管理员': 'Administrator',
  '销售经理': 'Sales Manager',
  '技术工程师': 'Technical Engineer',
  '商务工程师': 'Business Engineer',
  '采购专员': 'Procurement Specialist',
  '生产计划员': 'Production Planner',
  '质检员': 'QA Inspector',
  '物流专员': 'Logistics Specialist',
  '车间工人': 'Shop Floor Worker'
}

// 角色选项（用于下拉选择）
export const ROLE_OPTIONS = [
  { value: 'Administrator', label: '管理员' },
  { value: 'Sales Manager', label: '销售经理' },
  { value: 'Technical Engineer', label: '技术工程师' },
  { value: 'Business Engineer', label: '商务工程师' },
  { value: 'Procurement Specialist', label: '采购专员' },
  { value: 'Production Planner', label: '生产计划员' },
  { value: 'QA Inspector', label: '质检员' },
  { value: 'Logistics Specialist', label: '物流专员' },
  { value: 'Shop Floor Worker', label: '车间工人' }
]

/**
 * 将英文角色名转换为中文
 * @param {string} roleEn - 英文角色名
 * @returns {string} - 中文角色名
 */
export const getRoleNameCN = (roleEn) => {
  return ROLE_TRANSLATIONS[roleEn] || roleEn || '未知角色'
}

/**
 * 将中文角色名转换为英文
 * @param {string} roleCn - 中文角色名
 * @returns {string} - 英文角色名
 */
export const getRoleNameEN = (roleCn) => {
  return ROLE_TRANSLATIONS_CN_TO_EN[roleCn] || roleCn || 'Unknown'
}

/**
 * 获取角色的简短描述
 * @param {string} roleEn - 英文角色名
 * @returns {string} - 角色描述
 */
export const getRoleDescription = (roleEn) => {
  const descriptions = {
    'Administrator': '系统管理员，拥有所有权限',
    'Sales Manager': '销售经理，管理销售团队和客户',
    'Technical Engineer': '技术工程师，负责产品选型和技术支持',
    'Business Engineer': '商务工程师，负责合同管理和商务跟进',
    'Procurement Specialist': '采购专员，负责采购管理和供应商对接',
    'Production Planner': '生产计划员，负责生产计划和物料需求',
    'QA Inspector': '质检员，负责质量检验和不合格品处理',
    'Logistics Specialist': '物流专员，负责物流配送和发货管理',
    'Shop Floor Worker': '车间工人，负责生产任务执行'
  }
  return descriptions[roleEn] || '无描述'
}

/**
 * 状态翻译
 */
export const STATUS_TRANSLATIONS = {
  'pending': '待处理',
  'in_progress': '进行中',
  'completed': '已完成',
  'cancelled': '已取消',
  'approved': '已批准',
  'rejected': '已拒绝',
  'draft': '草稿',
  'submitted': '已提交',
  'active': '激活',
  'inactive': '禁用',
  'open': '开放',
  'closed': '关闭',
  'shipped': '已发货',
  'delivered': '已送达',
  'paid': '已付款',
  'unpaid': '未付款',
  'overdue': '逾期'
}

/**
 * 将英文状态转换为中文
 * @param {string} statusEn - 英文状态
 * @returns {string} - 中文状态
 */
export const getStatusCN = (statusEn) => {
  return STATUS_TRANSLATIONS[statusEn] || statusEn || '未知状态'
}

/**
 * 订单类型翻译
 */
export const ORDER_TYPE_TRANSLATIONS = {
  'sales': '销售订单',
  'purchase': '采购订单',
  'production': '生产订单',
  'service': '服务工单'
}

/**
 * 优先级翻译
 */
export const PRIORITY_TRANSLATIONS = {
  'low': '低',
  'normal': '普通',
  'high': '高',
  'urgent': '紧急',
  'critical': '严重'
}

/**
 * 将英文优先级转换为中文
 * @param {string} priorityEn - 英文优先级
 * @returns {string} - 中文优先级
 */
export const getPriorityCN = (priorityEn) => {
  return PRIORITY_TRANSLATIONS[priorityEn] || priorityEn || '普通'
}

export default {
  ROLE_TRANSLATIONS,
  ROLE_TRANSLATIONS_CN_TO_EN,
  ROLE_OPTIONS,
  getRoleNameCN,
  getRoleNameEN,
  getRoleDescription,
  STATUS_TRANSLATIONS,
  getStatusCN,
  ORDER_TYPE_TRANSLATIONS,
  PRIORITY_TRANSLATIONS,
  getPriorityCN
}

