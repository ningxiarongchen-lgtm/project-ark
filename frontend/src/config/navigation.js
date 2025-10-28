/**
 * 导航菜单配置文件
 * 
 * 每个菜单项包含：
 * - key: 路由路径
 * - label: 菜单显示名称
 * - icon: 图标名称（字符串形式）
 * - allowedRoles: 允许访问的角色数组，'all' 表示所有角色都可访问
 */

export const menuConfig = [
  { 
    key: '/dashboard', 
    label: '仪表盘', 
    icon: '<DashboardOutlined />', 
    allowedRoles: ['all'] 
  },
  { 
    key: '/projects', 
    label: '项目管理', 
    icon: '<ProjectOutlined />', 
    allowedRoles: ['Technical Engineer', 'Sales Engineer', 'Sales Manager', 'Administrator'] 
  },
  { 
    key: '/orders', 
    label: '订单管理', 
    icon: '<FileDoneOutlined />', 
    allowedRoles: ['Sales Manager', 'Production Planner', 'Administrator'] 
  },
  { 
    key: '/production', 
    label: '生产排期', 
    icon: '<ScheduleOutlined />', 
    allowedRoles: ['Production Planner', 'Administrator'] 
  },
  { 
    key: '/suppliers', 
    label: '供应商管理', 
    icon: '<TeamOutlined />', 
    allowedRoles: ['Procurement Specialist', 'Administrator'] 
  },
  { 
    key: '/purchase-orders', 
    label: '采购管理', 
    icon: '<ShoppingCartOutlined />', 
    allowedRoles: ['Procurement Specialist', 'Administrator'] 
  },
  { 
    key: '/service', 
    label: '售后服务', 
    icon: '<CustomerServiceOutlined />', 
    allowedRoles: ['After-sales Engineer', 'Sales Manager', 'Administrator'] 
  },
  { 
    key: '/database', 
    label: '产品数据库', 
    icon: '<DatabaseOutlined />', 
    allowedRoles: ['all'] 
  },
  { 
    key: '/admin/users', 
    label: '用户管理', 
    icon: '<UserOutlined />', 
    allowedRoles: ['Administrator'] 
  },
];

/**
 * 根据用户角色过滤可见菜单项
 * @param {string} userRole - 用户角色
 * @returns {Array} 过滤后的菜单配置数组
 */
export const getMenuByRole = (userRole) => {
  if (!userRole) return [];
  
  return menuConfig.filter(item => {
    // 如果菜单项允许所有角色访问
    if (item.allowedRoles.includes('all')) {
      return true;
    }
    // 检查用户角色是否在允许的角色列表中
    return item.allowedRoles.includes(userRole);
  });
};

/**
 * 检查用户是否有权限访问指定路由
 * @param {string} path - 路由路径
 * @param {string} userRole - 用户角色
 * @returns {boolean} 是否有权限
 */
export const hasRoutePermission = (path, userRole) => {
  if (!userRole) return false;
  
  const menuItem = menuConfig.find(item => item.key === path);
  if (!menuItem) return true; // 如果路由不在配置中，默认允许访问
  
  if (menuItem.allowedRoles.includes('all')) {
    return true;
  }
  
  return menuItem.allowedRoles.includes(userRole);
};

