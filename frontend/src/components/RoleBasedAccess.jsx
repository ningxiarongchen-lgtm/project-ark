/**
 * RoleBasedAccess 组件
 * 
 * 基于角色的访问控制组件，根据用户角色决定是否渲染子组件
 * 
 * @param {Array<string>} allowedRoles - 允许访问的角色数组，支持 'all' 表示所有角色
 * @param {ReactNode} children - 子组件
 * @param {ReactNode} fallback - 可选，无权限时显示的内容，默认为 null
 * @param {boolean} showMessage - 可选，无权限时是否显示提示消息，默认为 false
 * 
 * @example
 * // 基础用法
 * <RoleBasedAccess allowedRoles={['Administrator']}>
 *   <AdminPanel />
 * </RoleBasedAccess>
 * 
 * @example
 * // 多个角色
 * <RoleBasedAccess allowedRoles={['Sales Manager', 'Administrator']}>
 *   <OrderApprovalButton />
 * </RoleBasedAccess>
 * 
 * @example
 * // 所有角色都可访问
 * <RoleBasedAccess allowedRoles={['all']}>
 *   <Dashboard />
 * </RoleBasedAccess>
 * 
 * @example
 * // 带自定义无权限提示
 * <RoleBasedAccess 
 *   allowedRoles={['Administrator']} 
 *   fallback={<div>您无权访问此功能</div>}
 * >
 *   <DeleteButton />
 * </RoleBasedAccess>
 * 
 * @example
 * // 显示默认提示消息
 * <RoleBasedAccess allowedRoles={['Administrator']} showMessage>
 *   <SensitiveData />
 * </RoleBasedAccess>
 */

import PropTypes from 'prop-types'
import { Alert } from 'antd'
import { useAuth } from '../hooks/useAuth'

const RoleBasedAccess = ({ 
  allowedRoles, 
  children, 
  fallback = null,
  showMessage = false 
}) => {
  const { user } = useAuth()

  // 如果用户未登录，不渲染内容
  if (!user || !user.role) {
    return showMessage ? (
      <Alert
        message="未授权"
        description="请先登录以访问此内容"
        type="warning"
        showIcon
      />
    ) : fallback
  }

  // 检查是否允许所有角色访问
  if (allowedRoles.includes('all')) {
    return children
  }

  // 检查用户角色是否在允许的角色列表中
  const hasPermission = allowedRoles.includes(user.role)

  if (hasPermission) {
    return children
  }

  // 无权限时的处理
  if (showMessage) {
    return (
      <Alert
        message="权限不足"
        description={`此功能仅限 ${allowedRoles.join('、')} 访问`}
        type="error"
        showIcon
      />
    )
  }

  return fallback
}

RoleBasedAccess.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  showMessage: PropTypes.bool,
}

export default RoleBasedAccess

