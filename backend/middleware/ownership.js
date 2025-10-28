/**
 * 所有权校验中间件
 * 确保用户只能访问/修改自己拥有的资源
 * 管理员拥有所有资源的访问权限
 */

const Project = require('../models/Project');
const SalesOrder = require('../models/SalesOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const Ticket = require('../models/ServiceTicket');
const ProductionOrder = require('../models/ProductionOrder');

/**
 * 检查项目所有权
 * 用户只能访问自己创建的项目，除非是管理员
 */
exports.checkProjectOwnership = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    // 管理员拥有所有权限
    if (userRole === 'Administrator') {
      return next();
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // 检查是否是项目创建者
    if (project.createdBy && project.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. You can only modify projects you created.',
        reason: 'ownership_violation'
      });
    }

    // 将项目附加到请求对象，避免重复查询
    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 检查订单所有权
 * 销售人员只能访问自己创建的订单
 */
exports.checkOrderOwnership = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    // 管理员和销售经理拥有所有权限
    if (userRole === 'Administrator' || userRole === 'Sales Manager') {
      return next();
    }

    const order = await SalesOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Sales order not found' });
    }

    // 检查是否是订单创建者
    if (order.createdBy && order.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. You can only modify orders you created.',
        reason: 'ownership_violation'
      });
    }

    req.order = order;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 检查采购订单所有权
 * 采购专员只能访问自己创建的采购订单
 */
exports.checkPurchaseOrderOwnership = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    // 管理员拥有所有权限
    if (userRole === 'Administrator') {
      return next();
    }

    const purchaseOrder = await PurchaseOrder.findById(orderId);

    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    // 检查是否是采购订单创建者
    if (purchaseOrder.createdBy && purchaseOrder.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. You can only modify purchase orders you created.',
        reason: 'ownership_violation'
      });
    }

    req.purchaseOrder = purchaseOrder;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 检查工单所有权
 * 工程师只能处理分配给自己的工单
 */
exports.checkTicketOwnership = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    // 管理员和销售经理拥有所有权限
    if (userRole === 'Administrator' || userRole === 'Sales Manager') {
      return next();
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // 检查是否是工单创建者或被分配的工程师
    const isCreator = ticket.createdBy && ticket.createdBy.toString() === userId.toString();
    const isAssigned = ticket.assignedEngineer && ticket.assignedEngineer.toString() === userId.toString();

    if (!isCreator && !isAssigned) {
      return res.status(403).json({ 
        message: 'Access denied. You can only access tickets you created or are assigned to.',
        reason: 'ownership_violation'
      });
    }

    req.ticket = ticket;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 检查生产订单所有权
 * 生产计划员只能访问自己创建的生产订单
 */
exports.checkProductionOrderOwnership = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    // 管理员拥有所有权限
    if (userRole === 'Administrator') {
      return next();
    }

    const productionOrder = await ProductionOrder.findById(orderId);

    if (!productionOrder) {
      return res.status(404).json({ message: 'Production order not found' });
    }

    // 检查是否是生产订单创建者
    if (productionOrder.createdBy && productionOrder.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. You can only modify production orders you created.',
        reason: 'ownership_violation'
      });
    }

    req.productionOrder = productionOrder;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 通用所有权检查工具函数
 * 可在控制器中直接使用
 */
exports.verifyOwnership = (resource, userId, userRole) => {
  // 管理员始终拥有权限
  if (userRole === 'Administrator') {
    return { authorized: true };
  }

  // 销售经理对销售相关资源拥有权限
  if (userRole === 'Sales Manager' && 
      (resource.constructor.modelName === 'Order' || 
       resource.constructor.modelName === 'Project')) {
    return { authorized: true };
  }

  // 检查创建者
  if (resource.createdBy && resource.createdBy.toString() === userId.toString()) {
    return { authorized: true };
  }

  // 检查是否被分配（适用于工单等）
  if (resource.assignedEngineer && resource.assignedEngineer.toString() === userId.toString()) {
    return { authorized: true };
  }

  // 检查是否是负责人（适用于项目等）
  if (resource.owner && resource.owner.toString() === userId.toString()) {
    return { authorized: true };
  }

  return { 
    authorized: false, 
    message: 'Access denied. You do not have ownership of this resource.' 
  };
};

