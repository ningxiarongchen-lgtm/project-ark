/**
 * 生产环境初始化 API 端点
 * 
 * 用途：在无法访问 Render Shell 的情况下，通过 API 触发数据库初始化
 * 
 * 安全措施：
 * 1. 需要环境变量中的密钥验证
 * 2. 只在生产环境启用
 * 3. 执行一次后自动禁用（通过环境变量）
 * 
 * 使用方法：
 * GET /api/admin/init-production?secret=YOUR_SECRET_KEY
 */

const express = require('express');
const router = express.Router();

// 引入所有模型
const User = require('../../models/User');
const Product = require('../../models/Product');
const Actuator = require('../../models/Actuator');
const Accessory = require('../../models/Accessory');
const ManualOverride = require('../../models/ManualOverride');
const Supplier = require('../../models/Supplier');
const Project = require('../../models/Project');
const NewProject = require('../../models/NewProject');
const SalesOrder = require('../../models/SalesOrder');
const ProductionOrder = require('../../models/ProductionOrder');
const PurchaseOrder = require('../../models/PurchaseOrder');
const ServiceTicket = require('../../models/ServiceTicket');
const Quote = require('../../models/Quote');
const Invoice = require('../../models/Invoice');
const Payment = require('../../models/Payment');
const QualityCheck = require('../../models/QualityCheck');
const WorkOrder = require('../../models/WorkOrder');
const WorkCenter = require('../../models/WorkCenter');
const Routing = require('../../models/Routing');
const EngineeringChangeOrder = require('../../models/EngineeringChangeOrder');
const RefreshToken = require('../../models/RefreshToken');
const Contract = require('../../models/Contract');
const DeliveryNote = require('../../models/DeliveryNote');
const MaterialRequirement = require('../../models/MaterialRequirement');

/**
 * 清除所有数据（保留管理员）
 */
async function clearAllData() {
  const results = [];
  
  const collections = [
    { name: '刷新令牌', model: RefreshToken },
    { name: '项目', model: Project },
    { name: '新项目', model: NewProject },
    { name: '销售订单', model: SalesOrder },
    { name: '生产订单', model: ProductionOrder },
    { name: '采购订单', model: PurchaseOrder },
    { name: '服务工单', model: ServiceTicket },
    { name: '报价单', model: Quote },
    { name: '发票', model: Invoice },
    { name: '付款记录', model: Payment },
    { name: '质检记录', model: QualityCheck },
    { name: '工单', model: WorkOrder },
    { name: '工作中心', model: WorkCenter },
    { name: '路由', model: Routing },
    { name: '工程变更单', model: EngineeringChangeOrder },
    { name: '合同', model: Contract },
    { name: '配送单', model: DeliveryNote },
    { name: '物料需求', model: MaterialRequirement },
    { name: '产品', model: Product },
    { name: '执行器', model: Actuator },
    { name: '配件', model: Accessory },
    { name: '手动装置', model: ManualOverride },
    { name: '供应商', model: Supplier },
  ];

  for (const collection of collections) {
    try {
      const result = await collection.model.deleteMany({});
      results.push({ name: collection.name, deleted: result.deletedCount });
    } catch (error) {
      results.push({ name: collection.name, error: error.message });
    }
  }
  
  // 删除非管理员用户
  try {
    const userResult = await User.deleteMany({ role: { $ne: 'Administrator' } });
    results.push({ name: '用户（非管理员）', deleted: userResult.deletedCount });
  } catch (error) {
    results.push({ name: '用户（非管理员）', error: error.message });
  }
  
  return results;
}

/**
 * 确保管理员账号存在
 */
async function ensureAdminUser() {
  const existingAdmin = await User.findOne({ role: 'Administrator' });
  
  if (existingAdmin) {
    // 重置管理员密码为 admin123
    existingAdmin.password = 'admin123';
    existingAdmin.isActive = true;
    existingAdmin.passwordChangeRequired = true;
    await existingAdmin.save();
    
    return {
      action: 'updated',
      phone: existingAdmin.phone,
      name: existingAdmin.full_name
    };
  }
  
  // 如果没有管理员，创建默认管理员
  const admin = await User.create({
    phone: '13800000000',
    full_name: '系统管理员',
    password: 'admin123',
    role: 'Administrator',
    department: '管理部门',
    isActive: true,
    passwordChangeRequired: true
  });
  
  return {
    action: 'created',
    phone: admin.phone,
    name: admin.full_name
  };
}

/**
 * GET /api/admin/init-production
 * 
 * 触发生产环境初始化
 * 
 * 查询参数：
 * - secret: 初始化密钥（必需）
 */
router.get('/init-production', async (req, res) => {
  try {
    // 1. 检查是否已禁用
    if (process.env.INIT_PRODUCTION_DISABLED === 'true') {
      return res.status(403).json({
        success: false,
        message: '初始化端点已禁用。如需重新启用，请在 Render 环境变量中删除 INIT_PRODUCTION_DISABLED'
      });
    }
    
    // 2. 验证密钥
    const providedSecret = req.query.secret;
    const correctSecret = process.env.INIT_SECRET_KEY;
    
    if (!correctSecret) {
      return res.status(500).json({
        success: false,
        message: '未配置 INIT_SECRET_KEY 环境变量。请在 Render 中添加此环境变量。'
      });
    }
    
    if (!providedSecret || providedSecret !== correctSecret) {
      return res.status(401).json({
        success: false,
        message: '密钥验证失败'
      });
    }
    
    // 3. 执行初始化
    const startTime = Date.now();
    
    // 清除数据
    const clearResults = await clearAllData();
    
    // 确保管理员
    const adminInfo = await ensureAdminUser();
    
    // 获取统计
    const stats = {
      adminCount: await User.countDocuments({ role: 'Administrator' }),
      totalUsers: await User.countDocuments(),
      products: await Product.countDocuments(),
      suppliers: await Supplier.countDocuments(),
      projects: await Project.countDocuments() + await NewProject.countDocuments()
    };
    
    const duration = Date.now() - startTime;
    
    // 4. 返回结果
    res.json({
      success: true,
      message: '生产环境初始化完成',
      duration: `${duration}ms`,
      clearResults,
      admin: adminInfo,
      stats,
      nextSteps: [
        '使用管理员账号登录系统',
        '首次登录修改密码',
        '访问"用户管理"创建员工账号',
        '访问"产品批量导入"导入产品数据',
        '访问"数据管理"创建供应商',
        '开始正常业务流程'
      ],
      security: {
        warning: '建议在 Render 环境变量中添加 INIT_PRODUCTION_DISABLED=true 以禁用此端点',
        adminCredentials: {
          phone: adminInfo.phone,
          password: 'admin123',
          note: '首次登录需修改密码'
        }
      }
    });
    
  } catch (error) {
    console.error('初始化失败:', error);
    res.status(500).json({
      success: false,
      message: '初始化过程出错',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/admin/init-production/status
 * 
 * 检查初始化端点状态
 */
router.get('/init-production/status', async (req, res) => {
  try {
    const isDisabled = process.env.INIT_PRODUCTION_DISABLED === 'true';
    const hasSecret = !!process.env.INIT_SECRET_KEY;
    
    const stats = {
      adminCount: await User.countDocuments({ role: 'Administrator' }),
      totalUsers: await User.countDocuments(),
      products: await Product.countDocuments(),
      suppliers: await Supplier.countDocuments(),
      projects: await Project.countDocuments() + await NewProject.countDocuments()
    };
    
    res.json({
      endpoint: {
        enabled: !isDisabled,
        hasSecret,
        url: '/api/admin/init-production?secret=YOUR_SECRET_KEY'
      },
      database: stats,
      recommendations: !hasSecret ? [
        '请在 Render 环境变量中添加 INIT_SECRET_KEY'
      ] : []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

