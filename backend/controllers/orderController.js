const SalesOrder = require('../models/SalesOrder');
const Project = require('../models/Project');

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

    // 更新项目状态为 "已转订单" (可选)
    // project.status = 'Order Created';
    // await project.save();

    // 填充关联数据
    await salesOrder.populate([
      { path: 'project', select: 'projectNumber projectName status' },
      { path: 'created_by', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Sales order created successfully from project',
      data: salesOrder
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

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 查询订单
    const orders = await SalesOrder.find(query)
      .populate('project', 'projectNumber projectName status')
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
 * 获取订单统计信息
 */
exports.getOrderStatistics = async (req, res) => {
  try {
    const totalOrders = await SalesOrder.countDocuments();
    const pendingOrders = await SalesOrder.countDocuments({ status: 'Pending' });
    const confirmedOrders = await SalesOrder.countDocuments({ status: 'Confirmed' });
    const inProductionOrders = await SalesOrder.countDocuments({ status: 'In Production' });
    const shippedOrders = await SalesOrder.countDocuments({ status: 'Shipped' });
    const deliveredOrders = await SalesOrder.countDocuments({ status: 'Delivered' });
    const completedOrders = await SalesOrder.countDocuments({ status: 'Completed' });

    // 计算总收入（已确认的订单）
    const revenueResult = await SalesOrder.aggregate([
      { $match: { status: { $in: ['Confirmed', 'In Production', 'Shipped', 'Delivered', 'Completed'] } } },
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


