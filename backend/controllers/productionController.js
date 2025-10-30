const ProductionOrder = require('../models/ProductionOrder');
const SalesOrder = require('../models/SalesOrder');
const Project = require('../models/Project');
const User = require('../models/User'); // 🔒 用于通知功能

/**
 * 从销售订单创建生产订单
 */
exports.createProductionOrderFromSalesOrder = async (req, res) => {
  try {
    const { salesOrderId } = req.params;
    const {
      plannedStartDate,
      plannedEndDate,
      priority,
      productionLines,
      supervisorId,
      productionNotes,
      technicalRequirements,
      specialInstructions
    } = req.body;

    // 获取销售订单信息
    const salesOrder = await SalesOrder.findById(salesOrderId);
    if (!salesOrder) {
      return res.status(404).json({ message: 'Sales order not found' });
    }

    // 检查销售订单状态
    if (!['Confirmed', 'In Production'].includes(salesOrder.status)) {
      return res.status(400).json({ 
        message: 'Only confirmed or in-production orders can create production orders',
        currentStatus: salesOrder.status
      });
    }

    // 检查是否已有生产订单
    const existingProductionOrder = await ProductionOrder.findOne({ salesOrder: salesOrderId });
    if (existingProductionOrder) {
      return res.status(400).json({ 
        message: 'Production order already exists for this sales order',
        productionOrderNumber: existingProductionOrder.productionOrderNumber
      });
    }

    // 创建订单快照
    const orderSnapshot = {
      orderNumber: salesOrder.orderNumber,
      projectNumber: salesOrder.projectSnapshot?.projectNumber,
      projectName: salesOrder.projectSnapshot?.projectName,
      clientName: salesOrder.projectSnapshot?.client?.name
    };

    // 创建生产明细（从销售订单明细转换）
    const productionItems = salesOrder.orderItems.map(item => ({
      item_type: item.item_type,
      model_name: item.model_name,
      ordered_quantity: item.quantity,
      produced_quantity: 0,
      qualified_quantity: 0,
      defective_quantity: 0,
      production_status: 'Pending',
      notes: item.notes
    }));

    // 创建生产订单
    const productionOrder = new ProductionOrder({
      salesOrder: salesOrderId,
      orderSnapshot,
      status: 'Pending',
      priority: priority || 'Normal',
      schedule: {
        plannedStartDate: plannedStartDate || new Date(),
        plannedEndDate: plannedEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 默认30天后
      },
      productionItems,
      resources: {
        production_lines: productionLines || [],
        supervisor: supervisorId || null,
        operators: [],
        equipment: []
      },
      production_notes: productionNotes,
      technical_requirements: technicalRequirements,
      special_instructions: specialInstructions,
      created_by: req.user.id
    });

    // 计算初始进度
    productionOrder.calculateProgress();
    productionOrder.calculateQualityRate();

    // 添加创建日志
    productionOrder.addLog(
      'Created',
      `Production order created from sales order ${salesOrder.orderNumber}`,
      req.user.id
    );

    // 保存生产订单
    await productionOrder.save();

    // 更新销售订单状态为"生产中"
    if (salesOrder.status === 'Confirmed') {
      salesOrder.status = 'In Production';
      await salesOrder.save();
    }

    // 填充关联数据
    await productionOrder.populate([
      { path: 'salesOrder', select: 'orderNumber status' },
      { path: 'created_by', select: 'name email' },
      { path: 'resources.supervisor', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Production order created successfully',
      data: productionOrder
    });

  } catch (error) {
    console.error('Error creating production order:', error);
    res.status(500).json({ 
      message: 'Failed to create production order',
      error: error.message 
    });
  }
};

/**
 * 获取所有生产订单
 */
exports.getAllProductionOrders = async (req, res) => {
  try {
    const { 
      status, 
      priority,
      startDate, 
      endDate,
      page = 1,
      limit = 20,
      sortBy = '-createdAt'
    } = req.query;

    // 构建查询条件
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (startDate || endDate) {
      query['schedule.plannedStartDate'] = {};
      if (startDate) query['schedule.plannedStartDate'].$gte = new Date(startDate);
      if (endDate) query['schedule.plannedStartDate'].$lte = new Date(endDate);
    }

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 查询生产订单
    const productionOrders = await ProductionOrder.find(query)
      .populate('salesOrder', 'orderNumber status')
      .populate('created_by', 'name email')
      .populate('resources.supervisor', 'name email')
      .populate('resources.operators', 'name email')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    // 获取总数
    const total = await ProductionOrder.countDocuments(query);

    res.json({
      success: true,
      data: productionOrders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching production orders:', error);
    res.status(500).json({ 
      message: 'Failed to fetch production orders',
      error: error.message 
    });
  }
};

/**
 * 获取单个生产订单详情
 */
exports.getProductionOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const productionOrder = await ProductionOrder.findById(id)
      .populate('salesOrder')
      .populate('created_by', 'name email')
      .populate('resources.supervisor', 'name email')
      .populate('resources.operators', 'name email')
      .populate('quality.inspector', 'name email')
      .populate('production_logs.user', 'name email');

    if (!productionOrder) {
      return res.status(404).json({ message: 'Production order not found' });
    }

    res.json({
      success: true,
      data: productionOrder
    });

  } catch (error) {
    console.error('Error fetching production order:', error);
    res.status(500).json({ 
      message: 'Failed to fetch production order',
      error: error.message 
    });
  }
};

/**
 * 更新生产订单
 */
exports.updateProductionOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const productionOrder = await ProductionOrder.findById(id);
    if (!productionOrder) {
      return res.status(404).json({ message: 'Production order not found' });
    }

    // 记录更新前的状态
    const oldStatus = productionOrder.status;

    // 更新允许的字段
    const allowedUpdates = [
      'status',
      'priority',
      'schedule',
      'productionItems',
      'resources',
      'production_notes',
      'technical_requirements',
      'special_instructions',
      'delay_reason'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        productionOrder[field] = updates[field];
      }
    });

    // 重新计算进度和质量
    productionOrder.calculateProgress();
    productionOrder.calculateQualityRate();

    // 如果状态改变，添加日志
    if (oldStatus !== productionOrder.status) {
      productionOrder.addLog(
        'Status Changed',
        `Status changed from ${oldStatus} to ${productionOrder.status}`,
        req.user.id
      );
    }

    await productionOrder.save();

    await productionOrder.populate([
      { path: 'salesOrder', select: 'orderNumber status' },
      { path: 'created_by', select: 'name email' },
      { path: 'resources.supervisor', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Production order updated successfully',
      data: productionOrder
    });

  } catch (error) {
    console.error('Error updating production order:', error);
    res.status(500).json({ 
      message: 'Failed to update production order',
      error: error.message 
    });
  }
};

/**
 * 更新生产订单状态
 */
exports.updateProductionOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const productionOrder = await ProductionOrder.findById(id);
    if (!productionOrder) {
      return res.status(404).json({ message: 'Production order not found' });
    }

    const oldStatus = productionOrder.status;
    productionOrder.status = status;

    // 如果延期，记录原因
    if (status === 'Delayed' && reason) {
      productionOrder.delay_reason = reason;
    }

    // 如果开始生产，记录实际开始时间
    if (status === 'In Production' && !productionOrder.schedule.actualStartDate) {
      productionOrder.schedule.actualStartDate = new Date();
    }

    // 如果完成，记录实际完成时间
    if (status === 'Completed' && !productionOrder.schedule.actualCompletedDate) {
      productionOrder.schedule.actualCompletedDate = new Date();
    }

    // 添加日志
    productionOrder.addLog(
      'Status Updated',
      `Status changed from ${oldStatus} to ${status}${reason ? ': ' + reason : ''}`,
      req.user.id
    );

    await productionOrder.save();

    res.json({
      success: true,
      message: 'Production order status updated successfully',
      data: productionOrder
    });

  } catch (error) {
    console.error('Error updating production order status:', error);
    res.status(500).json({ 
      message: 'Failed to update production order status',
      error: error.message 
    });
  }
};

/**
 * 更新生产进度
 */
exports.updateProductionProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemIndex, producedQuantity, qualifiedQuantity, defectiveQuantity } = req.body;

    const productionOrder = await ProductionOrder.findById(id);
    if (!productionOrder) {
      return res.status(404).json({ message: 'Production order not found' });
    }

    if (itemIndex < 0 || itemIndex >= productionOrder.productionItems.length) {
      return res.status(400).json({ message: 'Invalid item index' });
    }

    const item = productionOrder.productionItems[itemIndex];

    // 更新数量
    if (producedQuantity !== undefined) item.produced_quantity = producedQuantity;
    if (qualifiedQuantity !== undefined) item.qualified_quantity = qualifiedQuantity;
    if (defectiveQuantity !== undefined) item.defective_quantity = defectiveQuantity;

    // 更新物料状态
    if (item.qualified_quantity >= item.ordered_quantity) {
      item.production_status = 'Completed';
      if (!item.actual_end) {
        item.actual_end = new Date();
      }
    } else if (item.produced_quantity > 0) {
      item.production_status = 'In Production';
      if (!item.actual_start) {
        item.actual_start = new Date();
      }
    }

    // 重新计算进度和质量
    productionOrder.calculateProgress();
    productionOrder.calculateQualityRate();

    // 检查是否所有物料都完成
    const allCompleted = productionOrder.productionItems.every(
      item => item.production_status === 'Completed'
    );

    if (allCompleted && productionOrder.status !== 'Completed') {
      productionOrder.status = 'Completed';
      productionOrder.schedule.actualCompletedDate = new Date();
      
      productionOrder.addLog(
        'Completed',
        'All production items completed',
        req.user.id
      );
    }

    // 添加进度更新日志
    productionOrder.addLog(
      'Progress Updated',
      `Updated progress for ${item.model_name}: Produced ${producedQuantity}, Qualified ${qualifiedQuantity}`,
      req.user.id
    );

    await productionOrder.save();

    res.json({
      success: true,
      message: 'Production progress updated successfully',
      data: productionOrder
    });

  } catch (error) {
    console.error('Error updating production progress:', error);
    res.status(500).json({ 
      message: 'Failed to update production progress',
      error: error.message 
    });
  }
};

/**
 * 分配资源
 */
exports.assignResources = async (req, res) => {
  try {
    const { id } = req.params;
    const { supervisorId, operatorIds, productionLines, equipment } = req.body;

    const productionOrder = await ProductionOrder.findById(id);
    if (!productionOrder) {
      return res.status(404).json({ message: 'Production order not found' });
    }

    // 更新资源分配
    if (supervisorId !== undefined) {
      productionOrder.resources.supervisor = supervisorId;
    }
    if (operatorIds !== undefined) {
      productionOrder.resources.operators = operatorIds;
    }
    if (productionLines !== undefined) {
      productionOrder.resources.production_lines = productionLines;
    }
    if (equipment !== undefined) {
      productionOrder.resources.equipment = equipment;
    }

    // 添加日志
    productionOrder.addLog(
      'Resources Assigned',
      'Production resources updated',
      req.user.id
    );

    await productionOrder.save();

    await productionOrder.populate([
      { path: 'resources.supervisor', select: 'name email' },
      { path: 'resources.operators', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Resources assigned successfully',
      data: productionOrder
    });

  } catch (error) {
    console.error('Error assigning resources:', error);
    res.status(500).json({ 
      message: 'Failed to assign resources',
      error: error.message 
    });
  }
};

/**
 * 删除生产订单
 */
exports.deleteProductionOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const productionOrder = await ProductionOrder.findById(id);
    if (!productionOrder) {
      return res.status(404).json({ message: 'Production order not found' });
    }

    // 只允许删除"待处理"或"已取消"状态的生产订单
    if (!['Pending', 'Cancelled'].includes(productionOrder.status)) {
      return res.status(400).json({ 
        message: 'Only pending or cancelled production orders can be deleted',
        currentStatus: productionOrder.status
      });
    }

    await productionOrder.deleteOne();

    res.json({
      success: true,
      message: 'Production order deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting production order:', error);
    res.status(500).json({ 
      message: 'Failed to delete production order',
      error: error.message 
    });
  }
};

/**
 * 获取生产统计信息
 */
exports.getProductionStatistics = async (req, res) => {
  try {
    const totalOrders = await ProductionOrder.countDocuments();
    const pendingOrders = await ProductionOrder.countDocuments({ status: 'Pending' });
    const scheduledOrders = await ProductionOrder.countDocuments({ status: 'Scheduled' });
    const inProductionOrders = await ProductionOrder.countDocuments({ status: 'In Production' });
    const completedOrders = await ProductionOrder.countDocuments({ status: 'Completed' });
    const delayedOrders = await ProductionOrder.countDocuments({ status: 'Delayed' });

    // 计算平均完成率
    const avgCompletionResult = await ProductionOrder.aggregate([
      { $match: { status: { $in: ['In Production', 'Completed'] } } },
      { $group: { _id: null, avgCompletion: { $avg: '$progress.overall_percentage' } } }
    ]);
    const avgCompletion = avgCompletionResult.length > 0 ? Math.round(avgCompletionResult[0].avgCompletion) : 0;

    // 计算平均合格率
    const avgQualityResult = await ProductionOrder.aggregate([
      { $match: { status: { $in: ['In Production', 'Completed'] } } },
      { $group: { _id: null, avgQuality: { $avg: '$quality.pass_rate' } } }
    ]);
    const avgQuality = avgQualityResult.length > 0 ? Math.round(avgQualityResult[0].avgQuality) : 100;

    res.json({
      success: true,
      data: {
        totalOrders,
        ordersByStatus: {
          pending: pendingOrders,
          scheduled: scheduledOrders,
          inProduction: inProductionOrders,
          completed: completedOrders,
          delayed: delayedOrders
        },
        performance: {
          avgCompletion,
          avgQuality
        }
      }
    });

  } catch (error) {
    console.error('Error fetching production statistics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch production statistics',
      error: error.message 
    });
  }
};

/**
 * 生产完成，更新为待质检状态
 */
exports.markAsAwaitingQC = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const productionOrder = await ProductionOrder.findById(id)
      .populate('salesOrder');

    if (!productionOrder) {
      return res.status(404).json({ message: 'Production order not found' });
    }

    // 检查当前状态
    if (productionOrder.status !== 'Completed') {
      return res.status(400).json({ 
        message: 'Only completed production orders can be marked as awaiting QC',
        currentStatus: productionOrder.status
      });
    }

    // 更新生产订单状态
    productionOrder.status = 'Awaiting QC';
    productionOrder.addLog(
      'Status Changed to Awaiting QC',
      notes || 'Production completed, awaiting quality check',
      req.user.id
    );

    await productionOrder.save();

    // 同时更新销售订单状态
    if (productionOrder.salesOrder) {
      const salesOrder = await SalesOrder.findById(productionOrder.salesOrder);
      if (salesOrder) {
        salesOrder.status = 'Awaiting QC';
        await salesOrder.save();
      }
    }

    res.json({
      success: true,
      message: 'Production order marked as awaiting QC',
      data: productionOrder
    });

  } catch (error) {
    console.error('Error marking production order as awaiting QC:', error);
    res.status(500).json({ 
      message: 'Failed to update production order status',
      error: error.message 
    });
  }
};

/**
 * APS智能排程 - 为生产订单执行智能排程
 */
exports.scheduleProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const options = req.body; // 排程选项（可选）

    const productionOrder = await ProductionOrder.findById(id);
    if (!productionOrder) {
      return res.status(404).json({ message: 'Production order not found' });
    }

    // 调用APS服务进行智能排程
    const apsService = require('../services/aps.service');
    const scheduleResult = await apsService.scheduleProductionOrder(id, options);

    // 更新生产订单状态为已排期
    if (scheduleResult.status === 'success' && scheduleResult.summary.scheduledCount > 0) {
      productionOrder.status = 'Scheduled';
      await productionOrder.save();
    }

    res.json({
      success: true,
      message: 'Production scheduling completed successfully',
      data: scheduleResult
    });

  } catch (error) {
    console.error('Error scheduling production:', error);
    res.status(500).json({ 
      message: 'Failed to schedule production',
      error: error.message 
    });
  }
};

/**
 * 获取甘特图数据 - 返回所有工单的排程信息
 */
exports.getGanttData = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const WorkOrder = require('../models/WorkOrder');
    const WorkCenter = require('../models/WorkCenter');

    // 构建查询条件
    const query = {};
    
    if (status) {
      query.status = status;
    } else {
      // 默认排除已取消的工单
      query.status = { $ne: '已取消' };
    }

    // 日期范围过滤
    if (startDate || endDate) {
      query['plan.planned_start_time'] = {};
      if (startDate) {
        query['plan.planned_start_time'].$gte = new Date(startDate);
      }
      if (endDate) {
        query['plan.planned_start_time'].$lte = new Date(endDate);
      }
    }

    // 获取工单数据
    const workOrders = await WorkOrder.find(query)
      .populate('production_order', 'productionOrderNumber priority orderSnapshot')
      .populate('product.product_id', 'model_base version')
      .populate('work_center', 'code name type')
      .sort({ 'plan.planned_start_time': 1 })
      .lean();

    // 获取所有工作中心（用于甘特图分组）
    const workCenters = await WorkCenter.find({ is_active: true })
      .select('code name type')
      .lean();

    // 转换为甘特图数据格式
    const ganttTasks = workOrders.map((wo, index) => {
      const startDate = new Date(wo.plan.planned_start_time);
      const endDate = new Date(wo.plan.planned_end_time);
      
      return {
        id: wo._id.toString(),
        name: wo.work_order_number,
        start: startDate,
        end: endDate,
        progress: wo.status === '已完成' ? 100 : 
                 wo.status === '进行中' ? 
                   Math.round((wo.actual?.actual_quantity || 0) / (wo.plan.planned_quantity || 1) * 100) : 0,
        type: 'task',
        project: wo.work_center?.code || 'Unknown',
        dependencies: [], // 可以根据工序依赖关系添加
        
        // 额外信息
        workOrderNumber: wo.work_order_number,
        productionOrderNumber: wo.production_order?.productionOrderNumber,
        productModel: wo.product?.model_base,
        workCenter: {
          id: wo.work_center?._id,
          code: wo.work_center?.code,
          name: wo.work_center?.name,
          type: wo.work_center?.type
        },
        operation: {
          sequence: wo.operation.sequence,
          name: wo.operation.operation_name,
          type: wo.operation.operation_type
        },
        status: wo.status,
        priority: wo.production_order?.priority || 'Normal',
        plannedQuantity: wo.plan.planned_quantity,
        actualQuantity: wo.actual?.actual_quantity || 0,
        duration: wo.plan.planned_duration,
        
        // 用于甘特图显示的样式
        styles: {
          backgroundColor: getStatusColor(wo.status),
          progressColor: getProgressColor(wo.status),
          progressSelectedColor: getProgressColor(wo.status)
        }
      };
    });

    // 按工作中心分组
    const tasksByWorkCenter = workCenters.map(wc => ({
      workCenter: {
        id: wc._id,
        code: wc.code,
        name: wc.name,
        type: wc.type
      },
      tasks: ganttTasks.filter(task => task.workCenter.code === wc.code)
    }));

    res.json({
      success: true,
      data: {
        tasks: ganttTasks,
        workCenters: workCenters,
        tasksByWorkCenter: tasksByWorkCenter,
        summary: {
          totalTasks: ganttTasks.length,
          workCenterCount: workCenters.length,
          dateRange: ganttTasks.length > 0 ? {
            start: Math.min(...ganttTasks.map(t => t.start.getTime())),
            end: Math.max(...ganttTasks.map(t => t.end.getTime()))
          } : null
        }
      }
    });

  } catch (error) {
    console.error('Error fetching Gantt data:', error);
    res.status(500).json({ 
      message: 'Failed to fetch Gantt data',
      error: error.message 
    });
  }
};

/**
 * 辅助函数：根据状态获取颜色
 */
function getStatusColor(status) {
  const colorMap = {
    '待发布': '#d9d9d9',
    '已发布': '#91d5ff',
    '已接收': '#69c0ff',
    '进行中': '#1890ff',
    '暂停': '#faad14',
    '待质检': '#722ed1',
    '已完成': '#52c41a',
    '已关闭': '#8c8c8c',
    '已取消': '#ff4d4f'
  };
  return colorMap[status] || '#d9d9d9';
}

/**
 * 辅助函数：根据状态获取进度条颜色
 */
function getProgressColor(status) {
  const colorMap = {
    '待发布': '#bfbfbf',
    '已发布': '#40a9ff',
    '已接收': '#1890ff',
    '进行中': '#096dd9',
    '暂停': '#d48806',
    '待质检': '#531dab',
    '已完成': '#389e0d',
    '已关闭': '#595959',
    '已取消': '#cf1322'
  };
  return colorMap[status] || '#bfbfbf';
}

/**
 * 从项目创建销售订单和生产订单（确认收款后）
 * @route POST /api/production/from-project/:projectId
 * @access Private (Sales Engineer only)
 */
exports.createProductionOrderFromProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      payment_confirmed,
      payment_amount,
      payment_method,
      payment_reference,
      payment_notes,
      plannedStartDate,
      plannedEndDate,
      priority,
      productionNotes,
      technicalRequirements
    } = req.body;

    // 1. 验证付款确认
    if (!payment_confirmed) {
      return res.status(400).json({ 
        message: 'Payment confirmation is required to create production order' 
      });
    }
    
    // 获取操作人IP地址
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;

    // 2. 查找项目
    const project = await Project.findById(projectId)
      .populate('createdBy', 'name email phone full_name')
      .populate('contract_files.final_contract.uploadedBy', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // 3. 验证项目状态
    if (project.status !== 'Contract Signed') {
      return res.status(400).json({ 
        message: 'Can only create production order for projects with signed contract',
        currentStatus: project.status
      });
    }

    // 4. 检查是否已有销售订单
    let salesOrder = await SalesOrder.findOne({ project: projectId });
    
    if (salesOrder) {
      // 检查是否已有生产订单
      const existingProductionOrder = await ProductionOrder.findOne({ salesOrder: salesOrder._id });
      if (existingProductionOrder) {
        return res.status(400).json({ 
          message: 'Production order already exists for this project',
          salesOrderNumber: salesOrder.orderNumber,
          productionOrderNumber: existingProductionOrder.productionOrderNumber
        });
      }
    } else {
      // 5. 创建销售订单（基于quotation_bom）
      if (!project.quotation_bom || project.quotation_bom.length === 0) {
        return res.status(400).json({ 
          message: 'Project has no quotation BOM. Please create quotation BOM first.' 
        });
      }

      // 创建订单明细
      const orderItems = project.quotation_bom.map(item => ({
        item_type: item.item_type,
        model_name: item.model_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        description: item.description,
        specifications: item.specifications,
        notes: item.notes,
        covered_tags: item.covered_tags || [],
        production_status: 'Pending'
      }));

      // 计算财务信息
      const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
      const tax_rate = 13; // 默认13%增值税
      const tax_amount = subtotal * (tax_rate / 100);
      const total_amount = subtotal + tax_amount;

      // 创建销售订单
      salesOrder = new SalesOrder({
        project: projectId,
        projectSnapshot: {
          projectNumber: project.projectNumber,
          projectName: project.projectName,
          client: project.client
        },
        status: 'Confirmed',
        orderDate: new Date(),
        requestedDeliveryDate: plannedEndDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 默认60天后
        orderItems,
        financial: {
          subtotal,
          tax_rate,
          tax_amount,
          shipping_cost: 0,
          discount: 0,
          total_amount
        },
        delivery: {
          shipping_method: 'Standard',
          shipping_address: project.client?.address || '',
          delivery_terms: 'FOB Factory'
        },
        payment: {
          payment_terms: '30% prepayment, 70% before delivery',
          payment_status: 'Partial',
          paid_amount: payment_amount || (total_amount * 0.3), // 默认30%预付款
          payment_records: [{
            date: new Date(),
            amount: payment_amount || (total_amount * 0.3),
            method: payment_method || 'Bank Transfer',
            reference: payment_reference || '',
            notes: payment_notes || 'Prepayment (30%)'
          }]
        },
        warranty: '12 months from delivery',
        special_requirements: technicalRequirements || '',
        notes: `Created from project ${project.projectNumber}`,
        internal_notes: `Payment confirmed by ${req.user.name}`,
        created_by: req.user._id,
        assigned_to: project.createdBy,
        approval: {
          status: 'Approved',
          approved_by: req.user._id,
          approved_at: new Date(),
          approval_notes: 'Auto-approved with payment confirmation'
        }
      });

      await salesOrder.save();

      // 🔒 锁定项目，防止修改报价数据
      project.is_locked = true;
      project.locked_at = new Date();
      project.locked_reason = '已转化为合同订单（生产订单）';
      
      // 更新项目状态
      project.status = 'In Production';
      await project.save();
    }

    // 6. 创建生产订单
    const orderSnapshot = {
      orderNumber: salesOrder.orderNumber,
      projectNumber: project.projectNumber,
      projectName: project.projectName,
      clientName: project.client?.name
    };

    // 创建生产明细
    const productionItems = salesOrder.orderItems.map(item => ({
      item_type: item.item_type,
      model_name: item.model_name,
      ordered_quantity: item.quantity,
      produced_quantity: 0,
      qualified_quantity: 0,
      defective_quantity: 0,
      production_status: 'Pending',
      notes: item.notes
    }));

    // 创建生产订单
    const productionOrder = new ProductionOrder({
      salesOrder: salesOrder._id,
      orderSnapshot,
      status: 'Pending', // 待排产
      priority: priority || 'Normal',
      schedule: {
        plannedStartDate: plannedStartDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 默认7天后开始
        plannedEndDate: plannedEndDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 默认60天后完成
      },
      productionItems,
      resources: {
        production_lines: [],
        supervisor: null,
        operators: [],
        equipment: []
      },
      production_notes: productionNotes || `Created from project ${project.projectNumber}`,
      technical_requirements: technicalRequirements || project.description || '',
      special_instructions: `Payment confirmed: ${payment_amount || salesOrder.financial.total_amount * 0.3} (30% prepayment)`,
      created_by: req.user._id
    });

    // 计算初始进度
    productionOrder.calculateProgress();
    productionOrder.calculateQualityRate();

    // 添加创建日志
    productionOrder.addLog(
      'Created',
      `Production order created from project ${project.projectNumber} with payment confirmation`,
      req.user._id
    );

    await productionOrder.save();

    // 更新销售订单状态
    salesOrder.status = 'In Production';
    await salesOrder.save();
    
    // 🔒 记录关键操作：确认收到预付款
    const confirmationText = `我确认，款项 ¥${(payment_amount || salesOrder.financial.total_amount * 0.3).toFixed(2)} 已于 ${new Date().toLocaleDateString('zh-CN')} 到账。此操作将启动生产流程且不可逆。`;
    
    project.operation_history = project.operation_history || [];
    project.operation_history.push({
      operation_type: 'payment_confirmed',
      operator: req.user._id,
      operator_name: req.user.full_name || req.user.name || req.user.phone,
      operator_role: `${req.user.role}（兼财务负责人）`,  // 明确标注财务职责
      operation_time: new Date(),
      description: `💰 财务确认：收到预付款 ¥${(payment_amount || salesOrder.financial.total_amount * 0.3).toFixed(2)}`,
      details: {
        payment_amount: payment_amount || salesOrder.financial.total_amount * 0.3,
        total_amount: salesOrder.financial.total_amount,
        payment_method: payment_method || 'Bank Transfer',
        payment_reference: payment_reference || '',
        sales_order_number: salesOrder.orderNumber,
        production_order_number: productionOrder.productionOrderNumber,
        financial_responsibility: true,  // 财务责任标记
        confirmation_role: '财务负责人'
      },
      ip_address: ipAddress,
      confirmation_text: confirmationText,
      notes: payment_notes ? `${payment_notes}（财务负责人操作）` : '此操作由商务工程师以财务负责人身份执行，承担相应财务确认责任'
    });
    
    // 🔒 记录关键操作：创建生产订单
    project.operation_history.push({
      operation_type: 'production_order_created',
      operator: req.user._id,
      operator_name: req.user.full_name || req.user.name || req.user.phone,
      operator_role: req.user.role,
      operation_time: new Date(),
      description: `创建生产订单 ${productionOrder.productionOrderNumber}`,
      details: {
        production_order_number: productionOrder.productionOrderNumber,
        sales_order_number: salesOrder.orderNumber,
        planned_start_date: productionOrder.schedule.plannedStartDate,
        planned_end_date: productionOrder.schedule.plannedEndDate,
        total_items: productionOrder.productionItems.length,
        priority: productionOrder.priority
      },
      ip_address: ipAddress,
      notes: `基于销售订单 ${salesOrder.orderNumber} 创建`
    });
    
    // 更新项目状态为"生产中"
    project.status = 'In Production';
    await project.save();

    console.log('✅ Production order created:', productionOrder.productionOrderNumber);
    console.log('✅ Operation history recorded: payment_confirmed, production_order_created');

    // 返回结果
    res.status(201).json({
      success: true,
      message: 'Production order created successfully',
      data: {
        salesOrder: {
          _id: salesOrder._id,
          orderNumber: salesOrder.orderNumber,
          status: salesOrder.status,
          total_amount: salesOrder.financial.total_amount,
          paid_amount: salesOrder.payment.paid_amount,
          payment_status: salesOrder.payment.payment_status
        },
        productionOrder: {
          _id: productionOrder._id,
          productionOrderNumber: productionOrder.productionOrderNumber,
          status: productionOrder.status,
          priority: productionOrder.priority,
          plannedStartDate: productionOrder.schedule.plannedStartDate,
          plannedEndDate: productionOrder.schedule.plannedEndDate,
          totalItems: productionOrder.productionItems.length,
          totalQuantity: productionOrder.progress.total_quantity
        },
        project: {
          _id: project._id,
          projectNumber: project.projectNumber,
          status: project.status
        }
      }
    });

  } catch (error) {
    console.error('Create production order from project error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};


