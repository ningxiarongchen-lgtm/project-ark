/**
 * 仪表盘组件导出索引
 * 
 * 集中导出所有角色的专属仪表盘组件
 * 
 * 注意：
 * - 技术工程师Dashboard包含技术选型和售后工单处理两个功能
 * - 不存在独立的售后工程师Dashboard
 * - 商务工程师Dashboard直接在 pages/Dashboard.jsx 中内联定义
 */

export { default as AdminDashboard } from './AdminDashboard'
export { default as TechnicalEngineerDashboard } from './TechnicalEngineerDashboard'
// SalesEngineerDashboard 在 pages/Dashboard.jsx 中内联定义
export { default as SalesManagerDashboard } from './SalesManagerDashboard'
export { default as ProcurementSpecialistDashboard } from './ProcurementSpecialistDashboard'
export { default as ProductionPlannerDashboard } from './ProductionPlannerDashboard'

