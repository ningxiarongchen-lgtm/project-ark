/**
 * 测试环境专用路由 - 仅在 NODE_ENV === 'test' 时加载
 * 提供测试数据清理等辅助功能
 */

const express = require('express');
const router = express.Router();

// 导入所有需要清理的模型
const Project = require('../models/Project');
const NewProject = require('../models/NewProject');
const SalesOrder = require('../models/SalesOrder');
const ProductionOrder = require('../models/ProductionOrder');
const ServiceTicket = require('../models/ServiceTicket');
const User = require('../models/User');
const Actuator = require('../models/Actuator');
const Accessory = require('../models/Accessory');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Quote = require('../models/Quote');
const PurchaseOrder = require('../models/PurchaseOrder');
const WorkOrder = require('../models/WorkOrder');
const QualityCheck = require('../models/QualityCheck');
const EngineeringChangeOrder = require('../models/EngineeringChangeOrder');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const RefreshToken = require('../models/RefreshToken');
const ManualOverride = require('../models/ManualOverride');

/**
 * POST /api/testing/cleanup
 * 
 * 清理所有以指定前缀开头的测试数据
 * 支持级联删除相关的订单、生产任务和售后工单
 * 
 * 请求体:
 * {
 *   "projectNamePrefix": "Test-Project-"  // 要清理的项目名称前缀
 * }
 * 
 * 响应:
 * {
 *   "success": true,
 *   "message": "测试数据清理成功",
 *   "deleted": {
 *     "projects": 5,
 *     "newProjects": 3,
 *     "salesOrders": 4,
 *     "productionOrders": 2,
 *     "serviceTickets": 1
 *   }
 * }
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { projectNamePrefix } = req.body;

    // 验证输入
    if (!projectNamePrefix) {
      return res.status(400).json({
        success: false,
        message: '请提供 projectNamePrefix 参数'
      });
    }

    console.log(`[测试清理] 开始清理前缀为 "${projectNamePrefix}" 的测试数据...`);

    // 统计删除数量
    const deletedCount = {
      projects: 0,
      newProjects: 0,
      salesOrders: 0,
      productionOrders: 0,
      serviceTickets: 0
    };

    // === 第一步: 查找并删除所有匹配的 Project (老项目) ===
    const projectsToDelete = await Project.find({
      projectName: { $regex: `^${projectNamePrefix}`, $options: 'i' }
    }).select('_id projectName');

    const projectIds = projectsToDelete.map(p => p._id);
    
    if (projectIds.length > 0) {
      console.log(`[测试清理] 找到 ${projectIds.length} 个老项目需要清理`);
      
      // 删除这些项目相关的 SalesOrders
      const salesOrdersResult = await SalesOrder.deleteMany({
        project: { $in: projectIds }
      });
      deletedCount.salesOrders += salesOrdersResult.deletedCount || 0;
      console.log(`[测试清理] 删除了 ${salesOrdersResult.deletedCount} 个销售订单`);

      // 查找这些项目的所有销售订单ID（用于删除生产订单）
      const salesOrderIds = await SalesOrder.find({
        project: { $in: projectIds }
      }).distinct('_id');

      // 删除相关的 ProductionOrders
      const productionOrdersResult = await ProductionOrder.deleteMany({
        salesOrder: { $in: salesOrderIds }
      });
      deletedCount.productionOrders += productionOrdersResult.deletedCount || 0;
      console.log(`[测试清理] 删除了 ${productionOrdersResult.deletedCount} 个生产订单`);

      // 删除相关的 ServiceTickets (通过 relatedProject)
      const serviceTicketsResult = await ServiceTicket.deleteMany({
        $or: [
          { relatedProject: { $in: projectIds } },
          { relatedOrder: { $in: salesOrderIds } }
        ]
      });
      deletedCount.serviceTickets += serviceTicketsResult.deletedCount || 0;
      console.log(`[测试清理] 删除了 ${serviceTicketsResult.deletedCount} 个售后工单`);

      // 最后删除项目本身
      const projectsResult = await Project.deleteMany({
        _id: { $in: projectIds }
      });
      deletedCount.projects = projectsResult.deletedCount || 0;
      console.log(`[测试清理] 删除了 ${projectsResult.deletedCount} 个老项目`);
    }

    // === 第二步: 查找并删除所有匹配的 NewProject (新项目) ===
    const newProjectsToDelete = await NewProject.find({
      project_name: { $regex: `^${projectNamePrefix}`, $options: 'i' }
    }).select('_id project_name');

    const newProjectIds = newProjectsToDelete.map(p => p._id);
    
    if (newProjectIds.length > 0) {
      console.log(`[测试清理] 找到 ${newProjectIds.length} 个新项目需要清理`);
      
      // NewProject 通常不直接关联 SalesOrder，但为了安全起见，我们也检查一下
      // (如果你的系统中 NewProject 也可能有关联订单，请调整这里的逻辑)
      
      // 删除新项目本身
      const newProjectsResult = await NewProject.deleteMany({
        _id: { $in: newProjectIds }
      });
      deletedCount.newProjects = newProjectsResult.deletedCount || 0;
      console.log(`[测试清理] 删除了 ${newProjectsResult.deletedCount} 个新项目`);
    }

    // === 第三步: 额外清理孤立的测试数据 ===
    // 清理订单编号以 'SO-' 开头且客户名称包含前缀的订单（防止遗漏）
    const orphanOrdersResult = await SalesOrder.deleteMany({
      'projectSnapshot.projectName': { $regex: `^${projectNamePrefix}`, $options: 'i' }
    });
    
    if (orphanOrdersResult.deletedCount > 0) {
      console.log(`[测试清理] 清理了 ${orphanOrdersResult.deletedCount} 个孤立的销售订单`);
      deletedCount.salesOrders += orphanOrdersResult.deletedCount;
    }

    // 构建响应消息
    const totalDeleted = Object.values(deletedCount).reduce((sum, count) => sum + count, 0);
    
    console.log(`[测试清理] 清理完成！总计删除 ${totalDeleted} 条记录`);
    console.log(`[测试清理] 详细统计:`, deletedCount);

    return res.status(200).json({
      success: true,
      message: `测试数据清理成功！总计删除 ${totalDeleted} 条记录`,
      deleted: deletedCount,
      details: {
        projectNamePrefix,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[测试清理] 清理过程中发生错误:', error);
    return res.status(500).json({
      success: false,
      message: '测试数据清理失败',
      error: error.message
    });
  }
});

/**
 * GET /api/testing/status
 * 
 * 获取测试环境状态信息
 */
router.get('/status', async (req, res) => {
  try {
    const status = {
      environment: process.env.NODE_ENV,
      database: {
        projects: await Project.countDocuments(),
        newProjects: await NewProject.countDocuments(),
        salesOrders: await SalesOrder.countDocuments(),
        productionOrders: await ProductionOrder.countDocuments(),
        serviceTickets: await ServiceTicket.countDocuments()
      },
      timestamp: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      status
    });
  } catch (error) {
    console.error('[测试状态] 获取状态失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取测试状态失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/testing/cleanup-all
 * 
 * 危险操作：清空所有测试数据（不推荐在生产环境使用）
 * 此接口仅在测试环境可用
 */
router.delete('/cleanup-all', async (req, res) => {
  try {
    // 双重检查：确保不在生产环境
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: '此操作在生产环境中被禁用'
      });
    }

    console.log('[测试清理] ⚠️  开始清空所有测试数据...');

    const results = {
      projects: await Project.deleteMany({}),
      newProjects: await NewProject.deleteMany({}),
      salesOrders: await SalesOrder.deleteMany({}),
      productionOrders: await ProductionOrder.deleteMany({}),
      serviceTickets: await ServiceTicket.deleteMany({})
    };

    const totalDeleted = Object.values(results).reduce((sum, r) => sum + (r.deletedCount || 0), 0);

    console.log(`[测试清理] ✅ 清空完成！总计删除 ${totalDeleted} 条记录`);

    return res.status(200).json({
      success: true,
      message: `所有测试数据已清空！总计删除 ${totalDeleted} 条记录`,
      deleted: {
        projects: results.projects.deletedCount || 0,
        newProjects: results.newProjects.deletedCount || 0,
        salesOrders: results.salesOrders.deletedCount || 0,
        productionOrders: results.productionOrders.deletedCount || 0,
        serviceTickets: results.serviceTickets.deletedCount || 0
      }
    });

  } catch (error) {
    console.error('[测试清理] 清空数据时发生错误:', error);
    return res.status(500).json({
      success: false,
      message: '清空测试数据失败',
      error: error.message
    });
  }
});

/**
 * POST /api/testing/seed-users
 * 
 * 创建E2E测试用户账户
 * 清空所有测试用户并重新创建（基于test_data.json的结构）
 * 
 * 请求体:
 * {
 *   "users": {
 *     "admin": { "phone": "18800000000", "password": "Password123!", "fullName": "系统管理员", "role": "Administrator", "department": "管理部门" },
 *     ...
 *   }
 * }
 * 
 * 响应:
 * {
 *   "success": true,
 *   "message": "测试用户创建成功",
 *   "users": [...]
 * }
 */
router.post('/seed-users', async (req, res) => {
  try {
    const { users } = req.body;

    // 验证输入
    if (!users || typeof users !== 'object') {
      return res.status(400).json({
        success: false,
        message: '请提供有效的 users 对象'
      });
    }

    console.log('[测试用户] 开始创建E2E测试用户...');

    // 第一步：收集所有测试用户的手机号
    const testPhones = Object.values(users).map(u => u.phone);
    
    // 第二步：删除所有已存在的测试用户
    const deleteResult = await User.deleteMany({ 
      phone: { $in: testPhones } 
    });
    
    if (deleteResult.deletedCount > 0) {
      console.log(`[测试用户] 已清理 ${deleteResult.deletedCount} 个旧测试用户`);
    }

    // 第三步：准备创建用户数据
    const usersToCreate = Object.values(users).map(user => ({
      full_name: user.fullName,
      phone: user.phone,
      password: user.password,
      role: user.role,
      department: user.department || '测试部门',
      isActive: true,
      passwordChangeRequired: false // E2E测试不需要强制修改密码
    }));

    // 第四步：批量创建用户
    const createdUsers = await User.create(usersToCreate);
    
    console.log(`[测试用户] ✅ 成功创建 ${createdUsers.length} 个测试用户`);

    // 第五步：返回创建的用户信息（不包含密码）
    const usersSummary = createdUsers.map(user => ({
      id: user._id,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
      department: user.department
    }));

    return res.status(200).json({
      success: true,
      message: `测试用户创建成功！共创建 ${createdUsers.length} 个用户`,
      users: usersSummary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[测试用户] 创建测试用户失败:', error);
    return res.status(500).json({
      success: false,
      message: '创建测试用户失败',
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : undefined
    });
  }
});

/**
 * POST /api/testing/reset-and-seed
 * 
 * 【核心测试接口】重置数据库并填充测试数据
 * 
 * 这是E2E测试的核心接口，提供完整的数据库重置和数据填充功能。
 * 它会清空所有测试数据，然后按照指定的数据集重新填充。
 * 
 * 请求体:
 * {
 *   "clearAll": true,  // 是否清空所有数据（默认 true）
 *   "seedData": {
 *     "users": [...],  // 用户数据数组（可选，使用默认测试用户）
 *     "actuators": [...],  // 执行器数据数组（可选）
 *     "accessories": [...],  // 配件数据数组（可选）
 *     "suppliers": [...]  // 供应商数据数组（可选）
 *   }
 * }
 * 
 * 响应:
 * {
 *   "success": true,
 *   "message": "数据库重置和填充成功",
 *   "cleared": {
 *     "users": 10,
 *     "projects": 5,
 *     ...
 *   },
 *   "seeded": {
 *     "users": 10,
 *     "actuators": 50,
 *     ...
 *   },
 *   "timestamp": "2025-10-29T10:00:00.000Z"
 * }
 */
router.post('/reset-and-seed', async (req, res) => {
  try {
    const { clearAll = true, seedData = {} } = req.body;

    console.log('\n🔄 [Reset-and-Seed] 开始数据库重置和填充流程...');
    console.log(`   清空模式: ${clearAll ? '全部清空' : '仅清空测试数据'}`);

    // ==================== 第一阶段：按正确顺序清空所有数据 ====================
    const clearedCounts = {};
    
    if (clearAll) {
      console.log('\n📦 [第1阶段] 依次清空所有数据表（按依赖关系顺序）...');
      
      // 重要：按照依赖关系的逆序删除，避免外键引用问题
      // 先删除依赖其他表的数据，最后删除被依赖的基础数据
      const collections = [
        // 第一层：最顶层的业务数据（依赖最多）
        { name: 'payments', model: Payment },
        { name: 'invoices', model: Invoice },
        { name: 'qualityChecks', model: QualityCheck },
        { name: 'workOrders', model: WorkOrder },
        { name: 'ecos', model: EngineeringChangeOrder },
        { name: 'serviceTickets', model: ServiceTicket },
        
        // 第二层：订单和生产相关
        { name: 'productionOrders', model: ProductionOrder },
        { name: 'purchaseOrders', model: PurchaseOrder },
        { name: 'salesOrders', model: SalesOrder },
        
        // 第三层：项目和报价
        { name: 'quotes', model: Quote },
        { name: 'newProjects', model: NewProject },
        { name: 'projects', model: Project },
        
        // 第四层：认证和会话
        { name: 'refreshTokens', model: RefreshToken },
        
        // 第五层：基础数据（产品、供应商等）
        { name: 'manualOverrides', model: ManualOverride },
        { name: 'accessories', model: Accessory },
        { name: 'actuators', model: Actuator },
        { name: 'products', model: Product },
        { name: 'suppliers', model: Supplier },
        
        // 最后：用户数据
        { name: 'users', model: User }
      ];

      for (const collection of collections) {
        try {
          const result = await collection.model.deleteMany({});
          clearedCounts[collection.name] = result.deletedCount || 0;
          console.log(`   ✓ ${collection.name}: 删除 ${clearedCounts[collection.name]} 条记录`);
        } catch (error) {
          console.log(`   ⚠️  ${collection.name}: 清空失败 (${error.message})`);
          clearedCounts[collection.name] = 0;
        }
      }
      
      const totalCleared = Object.values(clearedCounts).reduce((sum, count) => sum + count, 0);
      console.log(`\n   ✅ 清空完成！总计删除 ${totalCleared} 条记录`);
    }

    // ==================== 第二阶段：填充测试数据 ====================
    const seededCounts = {};
    
    console.log('\n🌱 [第2阶段] 填充测试数据...');

    // === 2.1 填充测试用户（每个角色至少一个） ===
    let createdUsers = [];
    if (seedData.users && Array.isArray(seedData.users) && seedData.users.length > 0) {
      console.log('\n   [用户] 使用自定义用户数据...');
      createdUsers = await User.create(seedData.users);
      seededCounts.users = createdUsers.length;
      console.log(`   ✓ 创建了 ${seededCounts.users} 个用户`);
    } else {
      console.log('\n   [用户] 创建所有角色的测试用户账户...');
      
      // 为每个角色创建测试账户，便于E2E测试
      const defaultTestUsers = [
        {
          full_name: 'Admin User',
          phone: '18800000001',
          password: 'Test123456!',
          role: 'Administrator',
          department: '管理部',
          isActive: true,
          passwordChangeRequired: false
        },
        {
          full_name: 'Sales Manager User',
          phone: '18800000002',
          password: 'Test123456!',
          role: 'Sales Manager',
          department: '销售部',
          isActive: true,
          passwordChangeRequired: false
        },
        {
          full_name: 'Business Engineer User',
          phone: '18800000003',
          password: 'Test123456!',
          role: 'Business Engineer',
          department: '销售部',
          isActive: true,
          passwordChangeRequired: false
        },
        {
          full_name: 'Tech Engineer User',
          phone: '18800000004',
          password: 'Test123456!',
          role: 'Technical Engineer',
          department: '技术部',
          isActive: true,
          passwordChangeRequired: false
        },
        {
          full_name: 'Procurement User',
          phone: '18800000005',
          password: 'Test123456!',
          role: 'Procurement Specialist',
          department: '采购部',
          isActive: true,
          passwordChangeRequired: false
        },
        {
          full_name: 'Production Planner User',
          phone: '18800000006',
          password: 'Test123456!',
          role: 'Production Planner',
          department: '生产部',
          isActive: true,
          passwordChangeRequired: false
        },
        {
          full_name: 'QA Inspector User',
          phone: '18800000007',
          password: 'Test123456!',
          role: 'QA Inspector',
          department: '质检部',
          isActive: true,
          passwordChangeRequired: false
        },
        {
          full_name: 'Logistics User',
          phone: '18800000008',
          password: 'Test123456!',
          role: 'Logistics Specialist',
          department: '物流部',
          isActive: true,
          passwordChangeRequired: false
        },
        {
          full_name: 'Shop Floor User',
          phone: '18800000009',
          password: 'Test123456!',
          role: 'Shop Floor Worker',
          department: '生产车间',
          isActive: true,
          passwordChangeRequired: false
        }
      ];
      
      createdUsers = await User.create(defaultTestUsers);
      seededCounts.users = createdUsers.length;
      console.log(`   ✓ 创建了 ${seededCounts.users} 个测试用户（覆盖所有角色）`);
      
      // 打印用户凭证表格
      console.log('\n   ┌─────────────────────────────────────────────────────────────┐');
      console.log('   │  角色              │ 手机号        │ 密码                   │');
      console.log('   ├─────────────────────────────────────────────────────────────┤');
      defaultTestUsers.forEach(user => {
        const role = user.role.padEnd(18);
        const phone = user.phone.padEnd(13);
        console.log(`   │  ${role} │ ${phone} │ Test123456!        │`);
      });
      console.log('   └─────────────────────────────────────────────────────────────┘\n');
    }

    // === 2.2 填充供应商数据（合作供应商 + 临时供应商） ===
    let createdSuppliers = [];
    if (seedData.suppliers && Array.isArray(seedData.suppliers) && seedData.suppliers.length > 0) {
      console.log('\n   [供应商] 使用自定义供应商数据...');
      createdSuppliers = await Supplier.create(seedData.suppliers);
      seededCounts.suppliers = createdSuppliers.length;
      console.log(`   ✓ 创建了 ${seededCounts.suppliers} 个供应商`);
    } else {
      console.log('\n   [供应商] 创建测试供应商（合作 + 临时）...');
      const defaultSuppliers = [
        // 合作供应商 - 长期稳定合作
        {
          name: '苏阀自控',
          contact_person: '张经理',
          phone: '0512-88888888',
          address: '江苏省苏州市工业园区',
          status: '合格 (Qualified)',
          rating: 5,
          certification_status: 'Certified',
          notes: '合作供应商 - 主力供应商，质量稳定，长期合作'
        },
        {
          name: '奥托尼克斯',
          contact_person: '李经理',
          phone: '021-66666666',
          address: '上海市浦东新区',
          status: '合格 (Qualified)',
          rating: 5,
          certification_status: 'Certified',
          notes: '合作供应商 - 进口品牌，高端产品线'
        },
        // 临时供应商 - 测试用途
        {
          name: '临时供应商A',
          contact_person: '王临时',
          phone: '0755-99999999',
          address: '广东省深圳市',
          status: '考察中 (Onboarding)',
          rating: 3,
          certification_status: 'Pending',
          notes: '临时供应商 - 仅用于特殊项目或紧急采购'
        }
      ];
      
      createdSuppliers = await Supplier.create(defaultSuppliers);
      seededCounts.suppliers = createdSuppliers.length;
      console.log(`   ✓ 创建了 ${seededCounts.suppliers} 个供应商（2个合作 + 1个临时）`);
    }

    // === 2.3 填充产品数据（执行器：DA、SR、AT等代表性型号） ===
    let createdActuators = [];
    if (seedData.actuators && Array.isArray(seedData.actuators) && seedData.actuators.length > 0) {
      console.log('\n   [产品] 使用自定义执行器数据...');
      
      // 如果提供了 supplier_code，自动关联供应商ID
      const actuatorsToCreate = seedData.actuators.map(actuator => {
        if (actuator.supplier_code && !actuator.supplier_id) {
          const supplier = createdSuppliers.find(s => s.code === actuator.supplier_code);
          if (supplier) {
            return { ...actuator, supplier_id: supplier._id };
          }
        }
        return actuator;
      });
      
      createdActuators = await Actuator.create(actuatorsToCreate);
      seededCounts.actuators = createdActuators.length;
      console.log(`   ✓ 创建了 ${seededCounts.actuators} 个执行器`);
    } else {
      console.log('\n   [产品] 创建代表性执行器产品（DA、SR、AT系列）...');
      
      // 查找供应商ID
      const sfSupplier = createdSuppliers.find(s => s.code === 'SF');
      const atSupplier = createdSuppliers.find(s => s.code === 'AT');
      
      const defaultActuators = [
        // SF系列 - DA（双作用）型号
        {
          model_base: 'SF10-DA',
          series: 'SF',
          mechanism: '齿轮齿条',
          supplier_id: sfSupplier?._id,
          body_size: 'SF10',
          action_type: 'DA',
          torque_6bar: 110,
          torque_output_start: 99,
          torque_output_end: 121,
          price_base: 1200,
          price_tiers: [
            { quantity: 1, price: 1200 },
            { quantity: 10, price: 1140 },
            { quantity: 50, price: 1080 }
          ],
          weight: 2.5,
          lead_time: 14,
          stock_status: 'In Stock',
          notes: '小型双作用执行器，适用于小口径阀门'
        },
        {
          model_base: 'SF16-DA',
          series: 'SF',
          mechanism: '齿轮齿条',
          supplier_id: sfSupplier?._id,
          body_size: 'SF16',
          action_type: 'DA',
          torque_6bar: 730,
          torque_output_start: 657,
          torque_output_end: 803,
          price_base: 2800,
          price_tiers: [
            { quantity: 1, price: 2800 },
            { quantity: 10, price: 2660 },
            { quantity: 50, price: 2520 }
          ],
          weight: 8.5,
          lead_time: 14,
          stock_status: 'In Stock',
          notes: '中型双作用执行器，适用于中等口径阀门'
        },
        
        // SF系列 - SR（弹簧复位）型号
        {
          model_base: 'SF10-SR-K8',
          series: 'SF',
          mechanism: '齿轮齿条',
          supplier_id: sfSupplier?._id,
          body_size: 'SF10',
          action_type: 'SR',
          spring_range: 'K8',
          torque_6bar: 88,
          torque_output_start: 79,
          torque_output_end: 97,
          price_base: 1450,
          price_tiers: [
            { quantity: 1, price: 1450 },
            { quantity: 10, price: 1378 },
            { quantity: 50, price: 1305 }
          ],
          weight: 2.8,
          lead_time: 14,
          stock_status: 'In Stock',
          notes: '小型弹簧复位执行器（K8弹簧），用于安全关闭应用'
        },
        {
          model_base: 'SF14-SR-K10',
          series: 'SF',
          mechanism: '齿轮齿条',
          supplier_id: sfSupplier?._id,
          body_size: 'SF14',
          action_type: 'SR',
          spring_range: 'K10',
          torque_6bar: 420,
          torque_output_start: 378,
          torque_output_end: 462,
          price_base: 2200,
          price_tiers: [
            { quantity: 1, price: 2200 },
            { quantity: 10, price: 2090 },
            { quantity: 50, price: 1980 }
          ],
          weight: 6.2,
          lead_time: 14,
          stock_status: 'In Stock',
          notes: '中型弹簧复位执行器（K10弹簧）'
        },
        
        // AT系列 - 高端产品线
        {
          model_base: 'AT100-DA',
          series: 'AT',
          mechanism: '齿轮齿条',
          supplier_id: atSupplier?._id,
          body_size: 'AT100',
          action_type: 'DA',
          torque_6bar: 120,
          torque_output_start: 108,
          torque_output_end: 132,
          price_base: 1800,
          price_tiers: [
            { quantity: 1, price: 1800 },
            { quantity: 10, price: 1710 },
            { quantity: 50, price: 1620 }
          ],
          weight: 3.0,
          lead_time: 21,
          stock_status: 'Available',
          notes: 'AT系列高端双作用执行器，进口品质'
        },
        {
          model_base: 'AT200-SR-K8',
          series: 'AT',
          mechanism: '齿轮齿条',
          supplier_id: atSupplier?._id,
          body_size: 'AT200',
          action_type: 'SR',
          spring_range: 'K8',
          torque_6bar: 250,
          torque_output_start: 225,
          torque_output_end: 275,
          price_base: 3200,
          price_tiers: [
            { quantity: 1, price: 3200 },
            { quantity: 10, price: 3040 },
            { quantity: 50, price: 2880 }
          ],
          weight: 5.5,
          lead_time: 21,
          stock_status: 'Available',
          notes: 'AT系列高端弹簧复位执行器'
        }
      ];
      
      // 只创建有有效supplier_id的执行器
      const validActuators = defaultActuators.filter(a => a.supplier_id);
      
      if (validActuators.length > 0) {
        createdActuators = await Actuator.create(validActuators);
        seededCounts.actuators = createdActuators.length;
        console.log(`   ✓ 创建了 ${seededCounts.actuators} 个代表性执行器产品`);
        console.log(`     - ${validActuators.filter(a => a.action_type === 'DA').length} 个DA（双作用）型号`);
        console.log(`     - ${validActuators.filter(a => a.action_type === 'SR').length} 个SR（弹簧复位）型号`);
        console.log(`     - ${validActuators.filter(a => a.series === 'SF').length} 个SF系列`);
        console.log(`     - ${validActuators.filter(a => a.series === 'AT').length} 个AT系列`);
      } else {
        console.log(`   ⚠️  跳过执行器创建（未找到有效供应商）`);
        seededCounts.actuators = 0;
      }
    }

    // === 2.4 填充配件数据 ===
    if (seedData.accessories && Array.isArray(seedData.accessories) && seedData.accessories.length > 0) {
      console.log('\n   [配件] 使用自定义配件数据...');
      const createdAccessories = await Accessory.create(seedData.accessories);
      seededCounts.accessories = createdAccessories.length;
      console.log(`   ✓ 创建了 ${seededCounts.accessories} 个配件`);
    } else {
      console.log('\n   [配件] 跳过（未提供数据）');
      seededCounts.accessories = 0;
    }

    // ==================== 第三阶段：返回成功结果 ====================
    const totalSeeded = Object.values(seededCounts).reduce((sum, count) => sum + count, 0);
    const totalCleared = Object.values(clearedCounts).reduce((sum, count) => sum + count, 0);

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║       System Reset and Seeded Successfully! 🎉       ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log(`   📊 清除记录: ${totalCleared} 条`);
    console.log(`   🌱 填充记录: ${totalSeeded} 条`);
    console.log(`   👥 测试用户: ${seededCounts.users || 0} 个`);
    console.log(`   🏢 供应商: ${seededCounts.suppliers || 0} 个`);
    console.log(`   📦 产品: ${seededCounts.actuators || 0} 个`);
    console.log('');
    console.log('   ✅ 数据库已准备就绪，可以开始E2E测试！');
    console.log('');

    return res.status(200).json({
      success: true,
      message: "System reset and seeded successfully.",
      details: {
        totalCleared,
        totalSeeded,
        cleared: clearedCounts,
        seeded: seededCounts
      },
      testData: {
        users: createdUsers.map(user => ({
          id: user._id,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role,
          department: user.department
        })),
        suppliers: createdSuppliers.map(supplier => ({
          id: supplier._id,
          name: supplier.name,
          code: supplier.code,
          status: supplier.status
        })),
        actuators: createdActuators.map(actuator => ({
          id: actuator._id,
          model: actuator.model_base,
          series: actuator.series,
          actionType: actuator.action_type
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('\n❌ [Reset-and-Seed] 执行失败:', error);
    return res.status(500).json({
      success: false,
      message: '数据库重置和填充失败',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;

