const WorkCenter = require('../models/WorkCenter');
const Routing = require('../models/Routing');
const WorkOrder = require('../models/WorkOrder');
const ProductionOrder = require('../models/ProductionOrder');
const QualityCheck = require('../models/QualityCheck');
const {
  createWorkOrdersFromProductionOrder,
  updateProductionOrderProgress,
  rescheduleWorkOrders,
  generateCapacityReport
} = require('../services/mesService');

// ==================== 工作中心管理 ====================

// @desc    获取所有工作中心
// @route   GET /api/mes/work-centers
// @access  Private
exports.getWorkCenters = async (req, res) => {
  try {
    const { type, workshop, is_active } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (workshop) query.workshop = workshop;
    if (is_active !== undefined) query.is_active = is_active === 'true';
    
    const workCenters = await WorkCenter.find(query)
      .populate('supervisor', 'username email')
      .populate('operators', 'username email')
      .sort({ code: 1 });
    
    res.status(200).json({
      success: true,
      count: workCenters.length,
      data: workCenters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取工作中心列表失败',
      error: error.message
    });
  }
};

// @desc    获取单个工作中心
// @route   GET /api/mes/work-centers/:id
// @access  Private
exports.getWorkCenterById = async (req, res) => {
  try {
    const workCenter = await WorkCenter.findById(req.params.id)
      .populate('supervisor', 'username email role')
      .populate('operators', 'username email role');
    
    if (!workCenter) {
      return res.status(404).json({
        success: false,
        message: '工作中心不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: workCenter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取工作中心详情失败',
      error: error.message
    });
  }
};

// @desc    创建工作中心
// @route   POST /api/mes/work-centers
// @access  Private (Admin)
exports.createWorkCenter = async (req, res) => {
  try {
    const workCenter = await WorkCenter.create(req.body);
    
    res.status(201).json({
      success: true,
      message: '工作中心创建成功',
      data: workCenter
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建工作中心失败',
      error: error.message
    });
  }
};

// @desc    更新工作中心
// @route   PUT /api/mes/work-centers/:id
// @access  Private (Admin)
exports.updateWorkCenter = async (req, res) => {
  try {
    const workCenter = await WorkCenter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!workCenter) {
      return res.status(404).json({
        success: false,
        message: '工作中心不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '工作中心更新成功',
      data: workCenter
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新工作中心失败',
      error: error.message
    });
  }
};

// @desc    删除工作中心
// @route   DELETE /api/mes/work-centers/:id
// @access  Private (Admin)
exports.deleteWorkCenter = async (req, res) => {
  try {
    const workCenter = await WorkCenter.findById(req.params.id);
    
    if (!workCenter) {
      return res.status(404).json({
        success: false,
        message: '工作中心不存在'
      });
    }
    
    await workCenter.deleteOne();
    
    res.status(200).json({
      success: true,
      message: '工作中心删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除工作中心失败',
      error: error.message
    });
  }
};

// @desc    获取工作中心统计
// @route   GET /api/mes/work-centers/stats/summary
// @access  Private
exports.getWorkCenterStats = async (req, res) => {
  try {
    const stats = await WorkCenter.getStatistics();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
};

// ==================== 工艺路线管理 ====================

// @desc    获取所有工艺路线
// @route   GET /api/mes/routings
// @access  Private
exports.getRoutings = async (req, res) => {
  try {
    const { status, product_id } = req.query;
    
    const query = { is_active: true };
    if (status) query.status = status;
    if (product_id) query['product.product_id'] = product_id;
    
    const routings = await Routing.find(query)
      .populate('product.product_id', 'model_base version')
      .populate('operations.work_center', 'code name type')
      .populate('created_by', 'username email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: routings.length,
      data: routings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取工艺路线列表失败',
      error: error.message
    });
  }
};

// @desc    获取单个工艺路线
// @route   GET /api/mes/routings/:id
// @access  Private
exports.getRoutingById = async (req, res) => {
  try {
    const routing = await Routing.findById(req.params.id)
      .populate('product.product_id', 'model_base version')
      .populate('operations.work_center', 'code name type workshop')
      .populate('operations.alternative_work_centers', 'code name type')
      .populate('created_by', 'username email')
      .populate('last_modified_by', 'username email')
      .populate('approval.approver', 'username email')
      .populate('release.released_by', 'username email');
    
    if (!routing) {
      return res.status(404).json({
        success: false,
        message: '工艺路线不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: routing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取工艺路线详情失败',
      error: error.message
    });
  }
};

// @desc    创建工艺路线
// @route   POST /api/mes/routings
// @access  Private
exports.createRouting = async (req, res) => {
  try {
    req.body.created_by = req.user._id;
    
    const routing = await Routing.create(req.body);
    
    const populatedRouting = await Routing.findById(routing._id)
      .populate('product.product_id', 'model_base version')
      .populate('operations.work_center', 'code name type')
      .populate('created_by', 'username email');
    
    res.status(201).json({
      success: true,
      message: '工艺路线创建成功',
      data: populatedRouting
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建工艺路线失败',
      error: error.message
    });
  }
};

// @desc    更新工艺路线
// @route   PUT /api/mes/routings/:id
// @access  Private
exports.updateRouting = async (req, res) => {
  try {
    req.body.last_modified_by = req.user._id;
    
    const routing = await Routing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('product.product_id', 'model_base version')
     .populate('operations.work_center', 'code name type');
    
    if (!routing) {
      return res.status(404).json({
        success: false,
        message: '工艺路线不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '工艺路线更新成功',
      data: routing
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新工艺路线失败',
      error: error.message
    });
  }
};

// @desc    发布工艺路线
// @route   POST /api/mes/routings/:id/release
// @access  Private (Admin/Supervisor)
exports.releaseRouting = async (req, res) => {
  try {
    const routing = await Routing.findById(req.params.id);
    
    if (!routing) {
      return res.status(404).json({
        success: false,
        message: '工艺路线不存在'
      });
    }
    
    await routing.releaseRouting(req.user._id);
    
    res.status(200).json({
      success: true,
      message: '工艺路线已发布',
      data: routing
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '发布工艺路线失败',
      error: error.message
    });
  }
};

// @desc    按产品查询工艺路线
// @route   GET /api/mes/routings/by-product/:productId
// @access  Private
exports.getRoutingsByProduct = async (req, res) => {
  try {
    const routings = await Routing.findByProduct(req.params.productId);
    
    res.status(200).json({
      success: true,
      count: routings.length,
      data: routings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取工艺路线失败',
      error: error.message
    });
  }
};

// ==================== 工单管理 ====================

// @desc    获取所有工单
// @route   GET /api/mes/work-orders
// @access  Private
exports.getWorkOrders = async (req, res) => {
  try {
    const {
      status,
      work_center,
      priority,
      start_date,
      end_date,
      operator_id,
      page = 1,
      limit = 20
    } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (work_center) query.work_center = work_center;
    if (priority) query.priority = priority;
    if (operator_id) query['assigned_operators.operator'] = operator_id;
    
    if (start_date || end_date) {
      query['plan.planned_start_time'] = {};
      if (start_date) query['plan.planned_start_time'].$gte = new Date(start_date);
      if (end_date) query['plan.planned_start_time'].$lte = new Date(end_date);
    }
    
    const skip = (page - 1) * limit;
    
    const workOrders = await WorkOrder.find(query)
      .populate('product.product_id', 'model_base version')
      .populate('work_center', 'code name type')
      .populate('production_order', 'productionOrderNumber status')
      .populate('assigned_operators.operator', 'username email')
      .sort({ 'plan.planned_start_time': 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await WorkOrder.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: workOrders.length,
      total,
      pages: Math.ceil(total / limit),
      data: workOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取工单列表失败',
      error: error.message
    });
  }
};

// @desc    获取单个工单
// @route   GET /api/mes/work-orders/:id
// @access  Private
exports.getWorkOrderById = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id)
      .populate('product.product_id', 'model_base version series')
      .populate('work_center', 'code name type workshop location')
      .populate('production_order', 'productionOrderNumber status priority')
      .populate('sales_order', 'orderNumber')
      .populate('assigned_operators.operator', 'username email role')
      .populate('execution_logs.operator', 'username email')
      .populate('quality_checks.checked_by', 'username email')
      .populate('issues.reported_by', 'username email')
      .populate('created_by', 'username email');
    
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: '工单不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: workOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取工单详情失败',
      error: error.message
    });
  }
};

// @desc    从生产订单创建工单
// @route   POST /api/mes/work-orders/generate/:productionOrderId
// @access  Private
exports.generateWorkOrders = async (req, res) => {
  try {
    const productionOrder = await ProductionOrder.findById(req.params.productionOrderId)
      .populate('productionItems.product_id')
      .populate('productionItems.routing');
    
    if (!productionOrder) {
      return res.status(404).json({
        success: false,
        message: '生产订单不存在'
      });
    }
    
    if (productionOrder.work_orders_generated) {
      return res.status(400).json({
        success: false,
        message: '工单已经生成过了'
      });
    }
    
    const workOrders = await createWorkOrdersFromProductionOrder(
      productionOrder,
      req.body.options || {}
    );
    
    res.status(201).json({
      success: true,
      message: `成功生成 ${workOrders.length} 个工单`,
      data: workOrders
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '生成工单失败',
      error: error.message
    });
  }
};

// @desc    开始工单
// @route   POST /api/mes/work-orders/:id/start
// @access  Private
exports.startWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: '工单不存在'
      });
    }
    
    await workOrder.startWorkOrder(req.user._id);
    
    res.status(200).json({
      success: true,
      message: '工单已开始',
      data: workOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '开始工单失败'
    });
  }
};

// @desc    报告工单进度
// @route   POST /api/mes/work-orders/:id/progress
// @access  Private
exports.reportWorkOrderProgress = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: '工单不存在'
      });
    }
    
    await workOrder.reportProgress(req.user._id, req.body);
    
    // 更新生产订单进度
    await updateProductionOrderProgress(workOrder.production_order);
    
    res.status(200).json({
      success: true,
      message: '进度已更新',
      data: workOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新进度失败',
      error: error.message
    });
  }
};

// @desc    完成工单
// @route   POST /api/mes/work-orders/:id/complete
// @access  Private
exports.completeWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id)
      .populate('product.product_id', 'model_base version')
      .populate('production_order', 'productionOrderNumber');
    
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: '工单不存在'
      });
    }
    
    await workOrder.completeWorkOrder(req.user._id);
    
    // 如果需要质检，自动创建质检任务
    if (workOrder.requires_quality_check && workOrder.status === '待质检') {
      const qualityCheckData = {
        work_order: workOrder._id,
        production_order: workOrder.production_order._id,
        
        product: {
          product_id: workOrder.product.product_id._id,
          model_base: workOrder.product.model_base,
          version: workOrder.product.version
        },
        
        operation: {
          sequence: workOrder.operation.sequence,
          operation_code: workOrder.operation.operation_code,
          operation_name: workOrder.operation.operation_name,
          operation_type: workOrder.operation.operation_type
        },
        
        inspection_type: workOrder.quality_check_type || '完工检验',
        
        quantity: {
          submitted_quantity: workOrder.actual.actual_quantity
        },
        
        status: '待检',
        result: '待判定',
        
        created_by: req.user._id
      };
      
      const qualityCheck = await QualityCheck.create(qualityCheckData);
      
      // 关联质检任务到工单
      workOrder.quality_check = qualityCheck._id;
      await workOrder.save();
      
      res.status(200).json({
        success: true,
        message: '工单已完成，已创建质检任务',
        data: {
          workOrder,
          qualityCheck
        }
      });
    } else {
      // 更新生产订单进度
      await updateProductionOrderProgress(workOrder.production_order);
      
      res.status(200).json({
        success: true,
        message: '工单已完成',
        data: workOrder
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '完成工单失败'
    });
  }
};

// @desc    暂停工单
// @route   POST /api/mes/work-orders/:id/pause
// @access  Private
exports.pauseWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: '工单不存在'
      });
    }
    
    await workOrder.pauseWorkOrder(req.user._id, req.body.reason);
    
    res.status(200).json({
      success: true,
      message: '工单已暂停',
      data: workOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '暂停工单失败'
    });
  }
};

// @desc    恢复工单
// @route   POST /api/mes/work-orders/:id/resume
// @access  Private
exports.resumeWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: '工单不存在'
      });
    }
    
    await workOrder.resumeWorkOrder(req.user._id);
    
    res.status(200).json({
      success: true,
      message: '工单已恢复',
      data: workOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '恢复工单失败'
    });
  }
};

// @desc    报告异常
// @route   POST /api/mes/work-orders/:id/issue
// @access  Private
exports.reportIssue = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: '工单不存在'
      });
    }
    
    await workOrder.reportIssue(req.user._id, req.body);
    
    res.status(200).json({
      success: true,
      message: '异常已记录',
      data: workOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '报告异常失败',
      error: error.message
    });
  }
};

// @desc    获取操作工的工单
// @route   GET /api/mes/work-orders/my-work-orders
// @access  Private
exports.getMyWorkOrders = async (req, res) => {
  try {
    const { status } = req.query;
    
    const workOrders = await WorkOrder.findByOperator(req.user._id, status);
    
    res.status(200).json({
      success: true,
      count: workOrders.length,
      data: workOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取我的工单失败',
      error: error.message
    });
  }
};

// @desc    获取工单统计
// @route   GET /api/mes/work-orders/stats/summary
// @access  Private
exports.getWorkOrderStats = async (req, res) => {
  try {
    const stats = await WorkOrder.getStatistics(req.query);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
};

// @desc    生成产能报告
// @route   GET /api/mes/reports/capacity
// @access  Private
exports.getCapacityReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: '请提供开始日期和结束日期'
      });
    }
    
    const report = await generateCapacityReport(
      new Date(start_date),
      new Date(end_date)
    );
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '生成产能报告失败',
      error: error.message
    });
  }
};

// @desc    重新调度工单
// @route   POST /api/mes/work-orders/reschedule
// @access  Private (Admin/Supervisor)
exports.reschedule = async (req, res) => {
  try {
    const { start_date, end_date } = req.body;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: '请提供开始日期和结束日期'
      });
    }
    
    const rescheduled = await rescheduleWorkOrders(
      new Date(start_date),
      new Date(end_date)
    );
    
    res.status(200).json({
      success: true,
      message: `重新调度了 ${rescheduled.length} 个工单`,
      data: rescheduled
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '重新调度失败',
      error: error.message
    });
  }
};

