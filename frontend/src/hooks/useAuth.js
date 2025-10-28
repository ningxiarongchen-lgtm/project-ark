/**
 * useAuth Hook
 * 
 * 自定义Hook，用于在任何组件中方便地获取用户认证信息
 * 
 * @returns {Object} 包含用户信息和认证相关方法的对象
 * @returns {Object} user - 当前登录的用户对象
 * @returns {Function} login - 登录方法
 * @returns {Function} logout - 登出方法
 * @returns {boolean} isAuthenticated - 是否已认证
 * 
 * @example
 * const { user, isAuthenticated, logout } = useAuth();
 * 
 * if (user.role === 'Administrator') {
 *   // 管理员特定逻辑
 * }
 */

import { useAuthStore } from '../store/authStore'

export const useAuth = () => {
  const { user, login, logout, isAuthenticated } = useAuthStore()

  return {
    user,
    login,
    logout,
    isAuthenticated,
    // 便捷方法：检查用户是否有特定角色
    hasRole: (role) => user?.role === role,
    // 便捷方法：检查用户是否有任一指定角色
    hasAnyRole: (roles) => roles.includes(user?.role),
    // 便捷方法：检查用户是否是管理员
    isAdmin: () => user?.role === 'Administrator',
  }
}

export default useAuth

