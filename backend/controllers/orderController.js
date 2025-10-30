const SalesOrder = require('../models/SalesOrder');
const Project = require('../models/Project');
const ProductionOrder = require('../models/ProductionOrder');

/**
 * 从项目创建销售订单
 */
exports.createOrderFromProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      requestedDeliveryDate,
      shippingAddress,
      shippingMethod,
      deliveryTerms,
      paymentTerms,
      taxRate,
      shippingCost,
      discount,
      specialRequirements,
      notes,
      internalNotes
    } = req.body;

    // 获取项目信息
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // 检查项目状态（只有"赢单"状态的项目才能生成订单）
    if (project.status !== 'Won') {
      return res.status(400).json({ 
        message: 'Only projects with status "Won" can be converted to orders',
        currentStatus: project.status
      });
    }

    // 检查是否已有订单
    const existingOrder = await SalesOrder.findOne({ project: projectId });
    if (existingOrder) {
      return res.status(400).json({ 
        message: 'Order already exists for this project',
        orderNumber: existingOrder.orderNumber
      });
    }

    // 检查项目是否有BOM数据
    const bomData = project.optimized_bill_of_materials || project.bill_of_materials || [];
    if (bomData.length === 0) {
      return res.status(400).json({ 
        message: 'Project has no BOM data. Please create BOM before generating order.'
      });
    }

    // 创建订单明细（从BOM转换）
    const orderItems = bomData.map(item => ({
      item_type: item.item_type || 'Actuator',
      model_name: item.model_name || item.actuator_model,
      quantity: item.quantity || item.total_quantity || 1,
      unit_price: item.unit_price || 0,
      total_price: item.total_price || 0,
      description: item.description,
      specifications: item.specifications,
      notes: item.notes,
      covered_tags: item.covered_tags || [],
      production_status: 'Pending'
    }));

    // 创建项目快照
    const projectSnapshot = {
      projectNumber: project.projectNumber,
      projectName: project.projectName,
      client: {
        name: project.client.name,
        company: project.client.company,
        email: project.client.email,
        phone: project.client.phone,
        address: project.client.address
      }
    };

    // 创建销售订单
    const salesOrder = new SalesOrder({
      project: projectId,
      projectSnapshot,
      orderItems,
      requestedDeliveryDate: requestedDeliveryDate || null,
      delivery: {
        shipping_method: shippingMethod || 'Standard',
        shipping_address: shippingAddress || project.client.address,
        delivery_terms: deliveryTerms || 'FOB Factory'
      },
      payment: {
        payment_terms: paymentTerms || 'Net 30',
        payment_status: 'Pending',
        paid_amount: 0
      },
      financial: {
        tax_rate: taxRate || 0,
        shipping_cost: shippingCost || 0,
        discount: discount || 0
      },
      warranty: '12 months from delivery',
      special_requirements: specialRequirements,
      notes,
      internal_notes: internalNotes,
      created_by: req.user.id,
      approval: {
        status: 'Pending'
      }
    });

    // 计算财务信息
    salesOrder.calculateFinancials();

    // 保存订单
    await salesOrder.save();

    // 🔒 锁定项目，防止修改报价数据
    project.is_locked = true;
    project.locked_at = new Date();
    project.locked_reason = '已转化为合同订单';
    await project.save();

    // 填充关联数据
    await salesOrder.populate([
      { path: 'project', select: 'projectNumber projectName status is_locked' },
      { path: 'created_by', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Sales order created successfully from project. Project is now locked.',
      data: salesOrder,
      projectLocked: true
    });

  } catch (error) {
    console.error('Error creating order from project:', error);
    res.status(500).json({ 
      message: 'Failed to create order from project',
      error: error.message 
    });
  }
};

/**
 * 获取所有订单
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { 
      status, 
      paymentStatus, 
      startDate, 
      endDate,
      page = 1,
      limit = 20,
      sortBy = '-orderDate'
    } = req.query;

    // 构建查询条件
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query['payment.payment_status'] = paymentStatus;
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }

    // 🔒 销售经理权限过滤：只能看到自己作为owner的项目的订单
    if (req.user.role === 'Sales Manager') {
      // 先查找该销售经理作为owner的项目
      const userProjects = await Project.find({ owner: req.user._id }).select('_id');
      const projectIds = userProjects.map(p => p._id);
      query.project = { $in: projectIds };
    }

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 查询订单
    const orders = await SalesOrder.find(query)
      .populate('project', 'projectNumber projectName status owner')
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email')
      .populate('approval.approved_by', 'name email')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    // 获取总数
    const total = await SalesOrder.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      message: 'Failed to fetch orders',
      error: error.message 
    });
  }
};

/**
 * 获取单个订单详情
 */
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await SalesOrder.findById(id)
      .populate('project')
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email')
      .populate('approval.approved_by', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      message: 'Failed to fetch order',
      error: error.message 
    });
  }
};

/**
 * 更新订单
 */
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const order = await SalesOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // 更新允许的字段
    const allowedUpdates = [
      'status',
      'requestedDeliveryDate',
      'actualDeliveryDate',
      'orderItems',
      'financial',
      'delivery',
      'payment',
      'warranty',
      'special_requirements',
      'notes',
      'internal_notes',
      'assigned_to'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        order[field] = updates[field];
      }
    });

    // 重新计算财务信息
    order.calculateFinancials();

    await order.save();

    await order.populate([
      { path: 'project', select: 'projectNumber projectName status' },
      { path: 'created_by', select: 'name email' },
      { path: 'assigned_to', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ 
      message: 'Failed to update order',
      error: error.message 
    });
  }
};

/**
 * 更新订单状态
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await SalesOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;

    // 如果状态变更为"已交付"，记录实际交付日期
    if (status === 'Delivered' && !order.actualDeliveryDate) {
      order.actualDeliveryDate = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      message: 'Failed to update order status',
      error: error.message 
    });
  }
};

/**
 * 审批订单
 */
exports.approveOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus, approvalNotes } = req.body;

    const order = await SalesOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.approval.status = approvalStatus; // 'Approved' or 'Rejected'
    order.approval.approved_by = req.user.id;
    order.approval.approved_at = new Date();
    order.approval.approval_notes = approvalNotes;

    // 如果审批通过，将订单状态更新为"已确认"
    if (approvalStatus === 'Approved') {
      order.status = 'Confirmed';
    }

    await order.save();

    await order.populate('approval.approved_by', 'name email');

    res.json({
      success: true,
      message: `Order ${approvalStatus.toLowerCase()} successfully`,
      data: order
    });

  } catch (error) {
    console.error('Error approving order:', error);
    res.status(500).json({ 
      message: 'Failed to approve order',
      error: error.message 
    });
  }
};

/**
 * 添加付款记录
 */
exports.addPaymentRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, amount, method, reference, notes } = req.body;

    const order = await SalesOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // 添加付款记录
    order.payment.payment_records.push({
      date: date || new Date(),
      amount,
      method,
      reference,
      notes
    });

    // 更新已付金额
    order.payment.paid_amount += amount;

    // 更新付款状态
    if (order.payment.paid_amount >= order.financial.total_amount) {
      order.payment.payment_status = 'Paid';
    } else if (order.payment.paid_amount > 0) {
      order.payment.payment_status = 'Partial';
    }

    await order.save();

    res.json({
      success: true,
      message: 'Payment record added successfully',
      data: order
    });

  } catch (error) {
    console.error('Error adding payment record:', error);
    res.status(500).json({ 
      message: 'Failed to add payment record',
      error: error.message 
    });
  }
};

/**
 * 删除订单
 */
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await SalesOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // 只允许删除"待处理"或"已取消"状态的订单
    if (!['Pending', 'Cancelled'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Only orders with status "Pending" or "Cancelled" can be deleted',
        currentStatus: order.status
      });
    }

    await order.deleteOne();

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ 
      message: 'Failed to delete order',
      error: error.message 
    });
  }
};

/**
 * 确认收到70%尾款（商务工程师）
 */
exports.confirmFinalPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_amount, payment_method, payment_reference, notes } = req.body;

    const salesOrder = await SalesOrder.findById(id);
    if (!salesOrder) {
      return res.status(404).json({ message: 'Sales order not found' });
    }

    // 检查订单状态
    if (salesOrder.status !== 'QC Passed') {
      return res.status(400).json({ 
        message: 'Only QC passed orders can confirm final payment',
        currentStatus: salesOrder.status
      });
    }

    // 记录付款
    if (payment_amount) {
      salesOrder.payment.payment_records.push({
        date: new Date(),
        amount: payment_amount,
        method: payment_method || 'Bank Transfer',
        reference: payment_reference || '',
        notes: notes || '尾款（70%）'
      });
      salesOrder.payment.paid_amount += payment_amount;
    }

    // 更新付款状态
    if (salesOrder.payment.paid_amount >= salesOrder.financial.total_amount) {
      salesOrder.payment.payment_status = 'Paid';
    } else {
      salesOrder.payment.payment_status = 'Partial';
    }

    // 标记尾款已确认
    salesOrder.payment.final_payment_confirmed = true;
    salesOrder.payment.final_payment_confirmed_by = req.user._id;
    salesOrder.payment.final_payment_confirmed_at = new Date();

    await salesOrder.save();

    res.json({
      success: true,
      message: 'Final payment confirmed successfully',
      data: salesOrder
    });

  } catch (error) {
    console.error('Error confirming final payment:', error);
    res.status(500).json({ 
      message: 'Failed to confirm final payment',
      error: error.message 
    });
  }
};

/**
 * 准备发货（商务工程师确认尾款后）
 */
exports.markAsReadyToShip = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const salesOrder = await SalesOrder.findById(id);
    if (!salesOrder) {
      return res.status(404).json({ message: 'Sales order not found' });
    }

    // 检查订单状态
    if (salesOrder.status !== 'QC Passed') {
      return res.status(400).json({ 
        message: 'Only QC passed orders can be marked as ready to ship',
        currentStatus: salesOrder.status
      });
    }

    // 检查是否确认尾款
    if (!salesOrder.payment.final_payment_confirmed) {
      return res.status(400).json({ 
        message: 'Please confirm final payment (70%) before marking as ready to ship'
      });
    }

    // 更新订单状态
    salesOrder.status = 'Ready to Ship';
    
    // 同时更新生产订单状态
    const productionOrder = await ProductionOrder.findOne({ salesOrder: id });
    if (productionOrder) {
      productionOrder.status = 'Ready to Ship';
      productionOrder.addLog(
        'Ready to Ship',
        notes || '已确认尾款，准备发货',
        req.user._id
      );
      await productionOrder.save();
    }

    await salesOrder.save();

    res.json({
      success: true,
      message: 'Order marked as ready to ship',
      data: salesOrder
    });

  } catch (error) {
    console.error('Error marking order as ready to ship:', error);
    res.status(500).json({ 
      message: 'Failed to mark order as ready to ship',
      error: error.message 
    });
  }
};

/**
 * 录入物流信息（物流人员）
 */
exports.addShipmentInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tracking_number,
      carrier,
      carrier_contact,
      shipment_date,
      estimated_delivery_date,
      items,
      packaging,
      notes
    } = req.body;

    const salesOrder = await SalesOrder.findById(id);
    if (!salesOrder) {
      return res.status(404).json({ message: 'Sales order not found' });
    }

    // 检查订单状态
    if (salesOrder.status !== 'Ready to Ship') {
      return res.status(400).json({ 
        message: 'Only orders in "Ready to Ship" status can add shipment information',
        currentStatus: salesOrder.status
      });
    }

    // 生成发货批次号
    const shipmentNumber = `SH-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(salesOrder.shipments.length + 1).padStart(4, '0')}`;

    // 添加发货记录
    const shipment = {
      shipment_number: shipmentNumber,
      tracking_number,
      carrier,
      carrier_contact,
      shipment_date: shipment_date || new Date(),
      estimated_delivery_date,
      items: items || salesOrder.orderItems.map(item => ({
        item_type: item.item_type,
        model_name: item.model_name,
        quantity: item.quantity,
        notes: item.notes
      })),
      status: 'Shipped',
      packaging,
      notes,
      created_by: req.user._id,
      created_at: new Date()
    };

    salesOrder.shipments.push(shipment);

    // 更新订单状态为已发货
    salesOrder.status = 'Shipped';
    salesOrder.delivery.tracking_number = tracking_number;

    // 同时更新生产订单状态
    const productionOrder = await ProductionOrder.findOne({ salesOrder: id });
    if (productionOrder) {
      productionOrder.status = 'Shipped';
      productionOrder.addLog(
        'Shipped',
        `订单已发货，物流单号：${tracking_number}`,
        req.user._id
      );
      await productionOrder.save();
    }

    await salesOrder.save();

    res.json({
      success: true,
      message: 'Shipment information added successfully',
      data: {
        salesOrder,
        shipment
      }
    });

  } catch (error) {
    console.error('Error adding shipment info:', error);
    res.status(500).json({ 
      message: 'Failed to add shipment information',
      error: error.message 
    });
  }
};

/**
 * 获取待发货订单列表（物流人员）
 */
exports.getReadyToShipOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await SalesOrder.find({ status: 'Ready to Ship' })
      .populate('project', 'projectNumber projectName')
      .populate('assigned_to', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SalesOrder.countDocuments({ status: 'Ready to Ship' });

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching ready to ship orders:', error);
    res.status(500).json({ 
      message: 'Failed to fetch ready to ship orders',
      error: error.message 
    });
  }
};

/**
 * 获取质检通过的订单列表（商务工程师）
 */
exports.getQCPassedOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await SalesOrder.find({ status: 'QC Passed' })
      .populate('project', 'projectNumber projectName')
      .populate('assigned_to', 'name email phone')
      .populate('payment.final_payment_confirmed_by', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SalesOrder.countDocuments({ status: 'QC Passed' });

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching QC passed orders:', error);
    res.status(500).json({ 
      message: 'Failed to fetch QC passed orders',
      error: error.message 
    });
  }
};

/**
 * 获取订单统计信息
 */
exports.getOrderStatistics = async (req, res) => {
  try {
    const totalOrders = await SalesOrder.countDocuments();
    const pendingOrders = await SalesOrder.countDocuments({ status: 'Pending' });
    const confirmedOrders = await SalesOrder.countDocuments({ status: 'Confirmed' });
    const inProductionOrders = await SalesOrder.countDocuments({ status: 'In Production' });
    const awaitingQCOrders = await SalesOrder.countDocuments({ status: 'Awaiting QC' });
    const qcPassedOrders = await SalesOrder.countDocuments({ status: 'QC Passed' });
    const readyToShipOrders = await SalesOrder.countDocuments({ status: 'Ready to Ship' });
    const shippedOrders = await SalesOrder.countDocuments({ status: 'Shipped' });
    const deliveredOrders = await SalesOrder.countDocuments({ status: 'Delivered' });
    const completedOrders = await SalesOrder.countDocuments({ status: 'Completed' });

    // 计算总收入（已确认的订单）
    const revenueResult = await SalesOrder.aggregate([
      { $match: { status: { $in: ['Confirmed', 'In Production', 'Awaiting QC', 'QC Passed', 'Ready to Ship', 'Shipped', 'Delivered', 'Completed'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$financial.total_amount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // 计算未付款金额
    const unpaidResult = await SalesOrder.aggregate([
      { $match: { 'payment.payment_status': { $in: ['Pending', 'Partial', 'Overdue'] } } },
      { 
        $group: { 
          _id: null, 
          totalUnpaid: { 
            $sum: { 
              $subtract: ['$financial.total_amount', '$payment.paid_amount'] 
            } 
          } 
        } 
      }
    ]);
    const totalUnpaid = unpaidResult.length > 0 ? unpaidResult[0].totalUnpaid : 0;

    res.json({
      success: true,
      data: {
        totalOrders,
        ordersByStatus: {
          pending: pendingOrders,
          confirmed: confirmedOrders,
          inProduction: inProductionOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          completed: completedOrders
        },
        financials: {
          totalRevenue,
          totalUnpaid
        }
      }
    });

  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch order statistics',
      error: error.message 
    });
  }
};


