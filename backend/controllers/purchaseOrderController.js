const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');

/**
 * @desc    获取所有采购订单
 * @route   GET /api/purchase-orders
 * @access  Private
 */
exports.getPurchaseOrders = async (req, res) => {
  try {
    const { 
      status, 
      supplier_id, 
      search, 
      start_date, 
      end_date,
      sort = '-createdAt' 
    } = req.query;
    
    // 构建查询条件
    let query = {};
    
    // 状态筛选
    if (status) {
      query.status = status;
    }
    
    // 供应商筛选
    if (supplier_id) {
      query.supplier_id = supplier_id;
    }
    
    // 日期范围筛选
    if (start_date || end_date) {
      query.order_date = {};
      if (start_date) {
        query.order_date.$gte = new Date(start_date);
      }
      if (end_date) {
        query.order_date.$lte = new Date(end_date);
      }
    }
    
    // 搜索（订单号、备注）
    if (search) {
      query.$or = [
        { order_number: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 执行查询，填充供应商和创建人信息
    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('supplier_id', 'name contact_person phone email')
      .populate('created_by', 'username email')
      .populate('approved_by', 'username email')
      .sort(sort);
    
    res.json({
      success: true,
      count: purchaseOrders.length,
      data: purchaseOrders
    });
  } catch (error) {
    console.error('获取采购订单列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取采购订单列表失败',
      error: error.message
    });
  }
};

/**
 * @desc    获取单个采购订单
 * @route   GET /api/purchase-orders/:id
 * @access  Private
 */
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('supplier_id', 'name contact_person phone email address')
      .populate('created_by', 'username email')
      .populate('approved_by', 'username email');
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }
    
    res.json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    console.error('获取采购订单详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取采购订单详情失败',
      error: error.message
    });
  }
};

/**
 * @desc    创建采购订单
 * @route   POST /api/purchase-orders
 * @access  Private (Admin & Procurement Specialist)
 */
exports.createPurchaseOrder = async (req, res) => {
  try {
    const {
      supplier_id,
      items,
      expected_delivery_date,
      payment_terms,
      shipping_address,
      contact_person,
      contact_phone,
      notes,
      status
    } = req.body;
    
    // 验证必需字段
    if (!supplier_id) {
      return res.status(400).json({
        success: false,
        message: '请选择供应商'
      });
    }
    
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请添加至少一个采购项目'
      });
    }
    
    // 验证供应商是否存在
    const supplier = await Supplier.findById(supplier_id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: '供应商不存在'
      });
    }
    
    // 检查供应商状态
    if (supplier.status === 'blacklisted') {
      return res.status(400).json({
        success: false,
        message: '该供应商已被列入黑名单，无法创建采购订单'
      });
    }
    
    // 生成订单号
    const order_number = await PurchaseOrder.generateOrderNumber();
    
    // 创建采购订单
    const purchaseOrder = await PurchaseOrder.create({
      order_number,
      supplier_id,
      items,
      expected_delivery_date,
      payment_terms,
      shipping_address,
      contact_person,
      contact_phone,
      notes,
      status: status || 'draft',
      created_by: req.user._id
    });
    
    // 填充供应商信息
    await purchaseOrder.populate('supplier_id', 'name contact_person phone email');
    await purchaseOrder.populate('created_by', 'username email');
    
    res.status(201).json({
      success: true,
      message: '采购订单创建成功',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('创建采购订单失败:', error);
    res.status(500).json({
      success: false,
      message: '创建采购订单失败',
      error: error.message
    });
  }
};

/**
 * @desc    更新采购订单
 * @route   PUT /api/purchase-orders/:id
 * @access  Private (Admin & Procurement Specialist)
 */
exports.updatePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }
    
    // 检查订单状态，已取消或已完成的订单不允许修改
    if (['cancelled', 'received'].includes(purchaseOrder.status)) {
      return res.status(400).json({
        success: false,
        message: '已取消或已完成的订单不允许修改'
      });
    }
    
    // 如果要更改供应商，验证新供应商
    if (req.body.supplier_id && req.body.supplier_id !== purchaseOrder.supplier_id.toString()) {
      const supplier = await Supplier.findById(req.body.supplier_id);
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: '供应商不存在'
        });
      }
      if (supplier.status === 'blacklisted') {
        return res.status(400).json({
          success: false,
          message: '该供应商已被列入黑名单'
        });
      }
    }
    
    // 更新采购订单
    const updatedPurchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('supplier_id', 'name contact_person phone email')
      .populate('created_by', 'username email')
      .populate('approved_by', 'username email');
    
    res.json({
      success: true,
      message: '采购订单更新成功',
      data: updatedPurchaseOrder
    });
  } catch (error) {
    console.error('更新采购订单失败:', error);
    res.status(500).json({
      success: false,
      message: '更新采购订单失败',
      error: error.message
    });
  }
};

/**
 * @desc    删除采购订单
 * @route   DELETE /api/purchase-orders/:id
 * @access  Private (Admin only)
 */
exports.deletePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }
    
    // 只能删除草稿状态的订单
    if (purchaseOrder.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: '只能删除草稿状态的订单'
      });
    }
    
    await PurchaseOrder.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: '采购订单删除成功',
      data: {}
    });
  } catch (error) {
    console.error('删除采购订单失败:', error);
    res.status(500).json({
      success: false,
      message: '删除采购订单失败',
      error: error.message
    });
  }
};

/**
 * @desc    更新采购订单状态
 * @route   PATCH /api/purchase-orders/:id/status
 * @access  Private (Admin & Procurement Specialist)
 */
exports.updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['draft', 'pending', 'confirmed', 'shipped', 'received', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }
    
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }
    
    // 更新数据
    const updateData = { status };
    
    // 如果状态变为已确认，记录审批信息
    if (status === 'confirmed' && purchaseOrder.status !== 'confirmed') {
      updateData.approved_by = req.user._id;
      updateData.approved_at = new Date();
    }
    
    // 如果状态变为已收货，记录实际交货日期
    if (status === 'received' && purchaseOrder.status !== 'received') {
      updateData.actual_delivery_date = new Date();
    }
    
    const updatedPurchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('supplier_id', 'name contact_person phone email')
      .populate('created_by', 'username email')
      .populate('approved_by', 'username email');
    
    res.json({
      success: true,
      message: '采购订单状态更新成功',
      data: updatedPurchaseOrder
    });
  } catch (error) {
    console.error('更新采购订单状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新采购订单状态失败',
      error: error.message
    });
  }
};

/**
 * @desc    获取采购订单统计
 * @route   GET /api/purchase-orders/stats/summary
 * @access  Private
 */
exports.getPurchaseOrderStats = async (req, res) => {
  try {
    const total = await PurchaseOrder.countDocuments();
    const draft = await PurchaseOrder.countDocuments({ status: 'draft' });
    const pending = await PurchaseOrder.countDocuments({ status: 'pending' });
    const confirmed = await PurchaseOrder.countDocuments({ status: 'confirmed' });
    const shipped = await PurchaseOrder.countDocuments({ status: 'shipped' });
    const received = await PurchaseOrder.countDocuments({ status: 'received' });
    const cancelled = await PurchaseOrder.countDocuments({ status: 'cancelled' });
    
    // 计算总金额（已确认的订单）
    const totalAmountResult = await PurchaseOrder.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'shipped', 'received'] }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$total_amount' }
        }
      }
    ]);
    
    const totalAmount = totalAmountResult.length > 0 
      ? totalAmountResult[0].totalAmount 
      : 0;
    
    // 按月统计订单金额
    const monthlyStats = await PurchaseOrder.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'shipped', 'received'] },
          order_date: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$order_date' },
            month: { $month: '$order_date' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$total_amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // 按供应商统计
    const supplierStats = await PurchaseOrder.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'shipped', 'received'] }
        }
      },
      {
        $group: {
          _id: '$supplier_id',
          orderCount: { $sum: 1 },
          totalAmount: { $sum: '$total_amount' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id',
          foreignField: '_id',
          as: 'supplier'
        }
      },
      {
        $unwind: '$supplier'
      },
      {
        $project: {
          supplier_name: '$supplier.name',
          orderCount: 1,
          totalAmount: 1
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        total,
        statusCounts: {
          draft,
          pending,
          confirmed,
          shipped,
          received,
          cancelled
        },
        totalAmount,
        monthlyStats,
        topSuppliers: supplierStats
      }
    });
  } catch (error) {
    console.error('获取采购订单统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取采购订单统计失败',
      error: error.message
    });
  }
};

/**
 * @desc    获取供应商的采购订单
 * @route   GET /api/purchase-orders/supplier/:supplier_id
 * @access  Private
 */
exports.getPurchaseOrdersBySupplier = async (req, res) => {
  try {
    const { supplier_id } = req.params;
    
    // 验证供应商是否存在
    const supplier = await Supplier.findById(supplier_id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: '供应商不存在'
      });
    }
    
    const purchaseOrders = await PurchaseOrder.find({ supplier_id })
      .populate('created_by', 'username email')
      .populate('approved_by', 'username email')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: purchaseOrders.length,
      data: purchaseOrders
    });
  } catch (error) {
    console.error('获取供应商采购订单失败:', error);
    res.status(500).json({
      success: false,
      message: '获取供应商采购订单失败',
      error: error.message
    });
  }
};

