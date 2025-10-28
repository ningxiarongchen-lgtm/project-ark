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

module.exports = router;

