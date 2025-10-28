import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null, // 保留以向后兼容，但在 Cookie 模式下不再使用
      isAuthenticated: false,

      // 🔒 安全改进：登录时不再存储 token（使用 HttpOnly Cookie）
      login: (userData, token = null) => {
        set({
          user: userData,
          token, // 仅在向后兼容模式下使用
          isAuthenticated: true
        })
      },

      // 🔒 安全改进：登出时需要调用后端 API 清除 Cookie
      // 注意：实际的 logout 应该在组件中调用 authAPI.logout()
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        })
      },

      // 更新用户信息（合并更新）
      updateUser: (userData) => {
        set((state) => ({ 
          user: { ...state.user, ...userData } 
        }))
      },

      // 检查是否是管理员
      isAdmin: () => {
        const { user } = get()
        return user?.role === 'Administrator'
      },

      // 检查是否是工程师
      isEngineer: () => {
        const { user } = get()
        return user?.role === 'Engineer'
      },

      // 检查是否是销售经理
      isSalesManager: () => {
        const { user } = get()
        return user?.role === 'Sales Manager'
      },

      // 检查是否有特定角色
      hasRole: (role) => {
        const { user } = get()
        return user?.role === role
      },

      // 检查是否有任一角色
      hasAnyRole: (roles) => {
        const { user } = get()
        return roles.includes(user?.role)
      },

      // 获取用户角色名（中文）
      getRoleNameCN: () => {
        const { user } = get()
        switch (user?.role) {
          case 'Administrator':
            return '管理员'
          case 'Engineer':
            return '工程师'
          case 'Sales Manager':
            return '销售经理'
          default:
            return '未知'
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)


