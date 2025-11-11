/**
 * User数据管理控制器
 * 提供User的完整CRUD和批量导入功能
 */

const User = require('../models/User');
const { createCrudController } = require('./dataManagementController');
const bcrypt = require('bcryptjs');

// 自定义验证逻辑
function validateUser(data) {
  const errors = [];
  
  // 验证手机号格式（11位中国大陆手机号）
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (data.phone && !phoneRegex.test(data.phone)) {
    errors.push('请输入有效的11位中国大陆手机号（以1开头）');
  }
  
  // 验证密码长度（仅在创建新用户时）
  if (data.password && data.password.length < 6) {
    errors.push('密码长度至少为6个字符');
  }
  
  return errors.length > 0 ? errors : null;
}

// 创建User CRUD控制器
const userController = createCrudController(User, {
  populateFields: [],
  searchFields: ['full_name', 'phone', 'department', 'role'],
  uniqueField: 'phone',
  customValidation: validateUser
});

// 重写create方法，确保密码被正确哈希
const originalCreate = userController.create;
userController.create = async (req, res) => {
  try {
    // 为批量导入的用户设置默认密码
    if (!req.body.password) {
      req.body.password = 'defaultPassword123'; // 应该通过邮件让用户重置
    }
    
    // 调用原始的create方法（Mongoose pre-save hook会处理密码哈希）
    await originalCreate(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建用户失败',
      error: error.message
    });
  }
};

// 重写update方法，处理密码更新
const originalUpdate = userController.update;
userController.update = async (req, res) => {
  try {
    // 如果请求中包含密码，需要特殊处理
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }
    
    await originalUpdate(req, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新用户失败',
      error: error.message
    });
  }
};

// 添加额外的User特定方法
userController.getByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    const users = await User.find({ role })
      .select('-password')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询失败',
      error: error.message
    });
  }
};

userController.getActiveUsers = async (req, res) => {
  try {
    const activeUsers = await User.find({ isActive: true })
      .select('-password')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: activeUsers,
      count: activeUsers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询失败',
      error: error.message
    });
  }
};

userController.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '未找到用户'
      });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({
      success: true,
      message: `用户已${user.isActive ? '激活' : '停用'}`,
      data: {
        _id: user._id,
        full_name: user.full_name,
        phone: user.phone,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '操作失败',
      error: error.message
    });
  }
};

userController.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度至少为6个字符'
      });
    }
    
    const user = await User.findById(req.params.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '未找到用户'
      });
    }
    
    user.password = newPassword; // pre-save hook会自动哈希
    user.passwordChangeRequired = true; // 强制用户下次登录时修改密码
    await user.save();
    
    res.json({
      success: true,
      message: '密码重置成功，用户下次登录时需要修改密码'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '密码重置失败',
      error: error.message
    });
  }
};

userController.getStatistics = async (req, res) => {
  try {
    const totalCount = await User.countDocuments();
    const activeCount = await User.countDocuments({ isActive: true });
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const byDepartment = await User.aggregate([
      { $match: { department: { $exists: true, $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      statistics: {
        totalCount,
        activeCount,
        inactiveCount: totalCount - activeCount,
        byRole,
        byDepartment
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
};

// 批量导出用户数据
userController.exportUsers = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要导出的用户ID列表'
      });
    }
    
    // 查询选中的用户（不包含密码）
    const users = await User.find({ _id: { $in: ids } })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到要导出的用户'
      });
    }
    
    // 准备Excel数据
    const XLSX = require('xlsx');
    const workbook = XLSX.utils.book_new();
    
    // 转换数据为表格格式
    const exportData = users.map(user => ({
      '手机号': user.phone || '',
      '姓名': user.full_name || '',
      '角色': user.role || '',
      '部门': user.department || '',
      '状态': user.isActive ? '激活' : '停用',
      '最后登录': user.lastLogin ? new Date(user.lastLogin).toLocaleString('zh-CN') : '-',
      '创建时间': user.createdAt ? new Date(user.createdAt).toLocaleString('zh-CN') : '-'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // 设置列宽
    worksheet['!cols'] = [
      { wch: 15 }, // 手机号
      { wch: 12 }, // 姓名
      { wch: 20 }, // 角色
      { wch: 15 }, // 部门
      { wch: 10 }, // 状态
      { wch: 20 }, // 最后登录
      { wch: 20 }  // 创建时间
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, '用户列表');
    
    // 生成Excel文件
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // 设置响应头
    const filename = `用户列表_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    
    res.send(buffer);
  } catch (error) {
    console.error('导出用户失败:', error);
    res.status(500).json({
      success: false,
      message: '导出用户失败',
      error: error.message
    });
  }
};

module.exports = userController;

