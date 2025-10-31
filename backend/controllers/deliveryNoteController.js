const DeliveryNote = require('../models/DeliveryNote');
const ProductionOrder = require('../models/ProductionOrder');
const NewProject = require('../models/NewProject');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

// 创建发货通知单
exports.createDeliveryNote = async (req, res) => {
  try {
    const {
      projectId,
      productionOrderId,
      items,
      shippingAddress,
      handlerId,
      notes
    } = req.body;

    // 验证项目和生产订单
    const project = await NewProject.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    const productionOrder = await ProductionOrder.findById(productionOrderId);
    if (!productionOrder) {
      return res.status(404).json({
        success: false,
        message: '生产订单不存在'
      });
    }

    // 检查生产订单状态，必须是 Ready to Ship
    if (productionOrder.status !== 'Ready to Ship') {
      return res.status(400).json({
        success: false,
        message: `生产订单状态不符合发货条件。当前状态: ${productionOrder.status}，需要状态: Ready to Ship`
      });
    }

    // 验证物流专员
    if (handlerId) {
      const handler = await User.findById(handlerId);
      if (!handler) {
        return res.status(404).json({
          success: false,
          message: '指定的物流专员不存在'
        });
      }

      // 可以添加角色验证，确保 handler 是物流专员
      // if (handler.role !== 'Logistics Specialist') { ... }
    }

    // 创建项目快照
    const projectSnapshot = {
      projectNumber: project.project_number,
      projectName: project.project_name,
      clientName: project.client_name,
      clientContact: project.client_contact?.contact_person || '',
      clientPhone: project.client_contact?.phone || ''
    };

    // 创建发货单
    const deliveryNote = new DeliveryNote({
      project: projectId,
      productionOrder: productionOrderId,
      projectSnapshot,
      items,
      shippingAddress,
      handler: handlerId,
      createdBy: req.user._id,
      notes
    });

    await deliveryNote.save();

    // 通知物流专员
    if (handlerId) {
      await createNotification({
        recipient: handlerId,
        type: 'delivery_task_assigned',
        title: '新的发货任务',
        message: `您有一个新的发货任务：${project.project_name}（${project.project_number}），请及时处理。`,
        relatedModel: 'DeliveryNote',
        relatedId: deliveryNote._id,
        priority: 'high'
      });
    }

    // 返回完整的发货单信息
    const populatedDeliveryNote = await DeliveryNote.findById(deliveryNote._id)
      .populate('project', 'project_name project_number client_name')
      .populate('productionOrder', 'productionOrderNumber status')
      .populate('handler', 'name email phone')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: '发货通知单创建成功',
      data: populatedDeliveryNote
    });

  } catch (error) {
    console.error('创建发货通知单失败:', error);
    res.status(500).json({
      success: false,
      message: '创建发货通知单失败',
      error: error.message
    });
  }
};

// 获取所有发货单（支持筛选）
exports.getDeliveryNotes = async (req, res) => {
  try {
    const {
      status,
      handler,
      projectId,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // 筛选条件
    if (status) {
      query.status = status;
    }

    if (handler === 'ME') {
      // 查询当前用户作为 handler 的发货单
      query.handler = req.user._id;
    } else if (handler) {
      query.handler = handler;
    }

    if (projectId) {
      query.project = projectId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const deliveryNotes = await DeliveryNote.find(query)
      .populate('project', 'project_name project_number client_name')
      .populate('productionOrder', 'productionOrderNumber status')
      .populate('handler', 'name email phone')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DeliveryNote.countDocuments(query);

    res.json({
      success: true,
      data: deliveryNotes,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('获取发货单列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取发货单列表失败',
      error: error.message
    });
  }
};

// 获取单个发货单详情
exports.getDeliveryNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    const deliveryNote = await DeliveryNote.findById(id)
      .populate('project', 'project_name project_number client_name client_contact')
      .populate('productionOrder', 'productionOrderNumber status')
      .populate('handler', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('shippedBy', 'name email')
      .populate('cancelledBy', 'name email');

    if (!deliveryNote) {
      return res.status(404).json({
        success: false,
        message: '发货单不存在'
      });
    }

    res.json({
      success: true,
      data: deliveryNote
    });

  } catch (error) {
    console.error('获取发货单详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取发货单详情失败',
      error: error.message
    });
  }
};

// 更新发货单信息
exports.updateDeliveryNote = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const deliveryNote = await DeliveryNote.findById(id);
    if (!deliveryNote) {
      return res.status(404).json({
        success: false,
        message: '发货单不存在'
      });
    }

    // 如果已经发货，不允许修改
    if (deliveryNote.status === 'Shipped') {
      return res.status(400).json({
        success: false,
        message: '已发货的订单不能修改'
      });
    }

    // 更新允许的字段
    const allowedUpdates = ['items', 'shippingAddress', 'handler', 'notes', 'logistics'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        deliveryNote[key] = updates[key];
      }
    });

    await deliveryNote.save();

    const updatedDeliveryNote = await DeliveryNote.findById(id)
      .populate('project', 'project_name project_number client_name')
      .populate('productionOrder', 'productionOrderNumber status')
      .populate('handler', 'name email phone')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: '发货单更新成功',
      data: updatedDeliveryNote
    });

  } catch (error) {
    console.error('更新发货单失败:', error);
    res.status(500).json({
      success: false,
      message: '更新发货单失败',
      error: error.message
    });
  }
};

// 确认发货（核心功能）
exports.confirmShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { logistics } = req.body;

    const deliveryNote = await DeliveryNote.findById(id);
    if (!deliveryNote) {
      return res.status(404).json({
        success: false,
        message: '发货单不存在'
      });
    }

    // 验证权限：只有指定的 handler 或管理员可以确认发货
    if (
      deliveryNote.handler && 
      deliveryNote.handler.toString() !== req.user._id.toString() &&
      !['Admin', 'Production Planner'].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: '您没有权限确认此发货单'
      });
    }

    // 确认发货
    await deliveryNote.confirmShipment(req.user._id, logistics);

    // 同步更新生产订单状态
    const productionOrder = await ProductionOrder.findById(deliveryNote.productionOrder);
    if (productionOrder) {
      productionOrder.status = 'Shipped';
      await productionOrder.save();
    }

    // 同步更新项目的发货状态
    const project = await NewProject.findById(deliveryNote.project);
    if (project && project.contract) {
      project.contract.deliveryStatus = 'Shipped';
      project.contract.shippedDate = new Date();
      await project.save();
    }

    // 通知销售经理或相关人员
    if (project && project.created_by) {
      await createNotification({
        recipient: project.created_by,
        type: 'shipment_confirmed',
        title: '项目已发货',
        message: `您负责的项目 ${project.project_name}（${project.project_number}）已于今日发货。运单号：${logistics?.trackingNumber || '待更新'}`,
        relatedModel: 'NewProject',
        relatedId: project._id,
        priority: 'normal'
      });
    }

    // 返回更新后的发货单
    const updatedDeliveryNote = await DeliveryNote.findById(id)
      .populate('project', 'project_name project_number client_name')
      .populate('productionOrder', 'productionOrderNumber status')
      .populate('handler', 'name email phone')
      .populate('shippedBy', 'name email');

    res.json({
      success: true,
      message: '发货确认成功',
      data: updatedDeliveryNote
    });

  } catch (error) {
    console.error('确认发货失败:', error);
    res.status(500).json({
      success: false,
      message: '确认发货失败',
      error: error.message
    });
  }
};

// 取消发货单
exports.cancelDeliveryNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: '请提供取消原因'
      });
    }

    const deliveryNote = await DeliveryNote.findById(id);
    if (!deliveryNote) {
      return res.status(404).json({
        success: false,
        message: '发货单不存在'
      });
    }

    // 已发货的不能取消
    if (deliveryNote.status === 'Shipped') {
      return res.status(400).json({
        success: false,
        message: '已发货的订单不能取消'
      });
    }

    await deliveryNote.cancel(req.user._id, reason);

    // 通知相关人员
    if (deliveryNote.handler) {
      await createNotification({
        recipient: deliveryNote.handler,
        type: 'delivery_cancelled',
        title: '发货单已取消',
        message: `发货单 ${deliveryNote.noteNumber} 已被取消。原因：${reason}`,
        relatedModel: 'DeliveryNote',
        relatedId: deliveryNote._id,
        priority: 'normal'
      });
    }

    const updatedDeliveryNote = await DeliveryNote.findById(id)
      .populate('project', 'project_name project_number client_name')
      .populate('handler', 'name email phone')
      .populate('cancelledBy', 'name email');

    res.json({
      success: true,
      message: '发货单已取消',
      data: updatedDeliveryNote
    });

  } catch (error) {
    console.error('取消发货单失败:', error);
    res.status(500).json({
      success: false,
      message: '取消发货单失败',
      error: error.message
    });
  }
};

// 获取我的发货任务（物流专员专用）
exports.getMyTasks = async (req, res) => {
  try {
    const { status } = req.query;

    const tasks = await DeliveryNote.getTasksByHandler(
      req.user._id,
      status || null
    );

    // 统计数据
    const statistics = {
      pending: tasks.filter(t => t.status === 'Pending').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      shipped: tasks.filter(t => t.status === 'Shipped').length,
      total: tasks.length
    };

    res.json({
      success: true,
      data: tasks,
      statistics
    });

  } catch (error) {
    console.error('获取我的发货任务失败:', error);
    res.status(500).json({
      success: false,
      message: '获取我的发货任务失败',
      error: error.message
    });
  }
};

// 获取待处理的发货单（生产计划员/管理员）
exports.getPendingDeliveries = async (req, res) => {
  try {
    const deliveries = await DeliveryNote.getPendingDeliveries();

    res.json({
      success: true,
      data: deliveries
    });

  } catch (error) {
    console.error('获取待处理发货单失败:', error);
    res.status(500).json({
      success: false,
      message: '获取待处理发货单失败',
      error: error.message
    });
  }
};

