const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const ProductionOrder = require('../models/ProductionOrder');

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
      sort = '-createdAt',
      page = 1,
      limit = 10
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
    
    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 执行查询，填充供应商和创建人信息
    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('supplier_id', 'name contact_person phone email')
      .populate('created_by', 'full_name phone')
      .populate('approved_by', 'full_name phone')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // 获取总数
    const total = await PurchaseOrder.countDocuments(query);
    
    res.json({
      success: true,
      data: purchaseOrders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
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
      .populate('created_by', 'full_name phone')
      .populate('approved_by', 'full_name phone')
      .populate('follow_ups.user_id', 'full_name phone')
      .populate('receiving_info.received_by', 'full_name phone')
      .populate('receiving_info.quality_check.inspector', 'full_name phone');
    
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
 * @desc    创建采购订单 - 使用双重风控逻辑
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
      notes
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
    
    // --- Start of New Logic: 双重风控逻辑 ---
    
    // 1. 获取供应商信息
    const supplier = await Supplier.findById(supplier_id);
    if (!supplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier not found.'
      });
    }
    
    // 检查供应商状态 - 只有"合作供应商"和"临时供应商"可以创建采购订单
    const allowedStatuses = ['合作供应商 (Partner)', '临时供应商 (Temporary)'];
    if (!allowedStatuses.includes(supplier.status)) {
      return res.status(400).json({
        success: false,
        message: `该供应商状态为"${supplier.status}"，只有"合作供应商 (Partner)"或"临时供应商 (Temporary)"才能创建采购订单`,
        supplierStatus: supplier.status,
        hint: '如需使用该供应商，请先在供应商管理中将其状态修改为"合作供应商"或"临时供应商"'
      });
    }
    
    // 2. 计算订单总金额
    const total_amount = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);
    
    // 3. 定义风控规则
    const IS_PARTNER_SUPPLIER = supplier.status === '合作供应商 (Partner)';
    const AMOUNT_THRESHOLD = 100000; // 金额阈值：10万元
    const IS_OVER_THRESHOLD = total_amount > AMOUNT_THRESHOLD;
    
    // 4. 智能审批判断
    let nextStatus;
    let approvalMessage;
    
    if (IS_PARTNER_SUPPLIER) {
      // 如果是合作供应商，则直接进入商务审核，无需管理员审批
      nextStatus = '待商务审核 (Pending Commercial Review)';
      approvalMessage = `采购订单创建成功！该供应商为"合作供应商 (Partner)"，订单已直接进入商务审核流程。`;
    } else {
      // 如果是临时供应商，则需要进行金额判断
      if (IS_OVER_THRESHOLD) {
        // 临时供应商 + 大金额 = 必须管理员审批
        nextStatus = '待管理员审批 (Pending Admin Approval)';
        approvalMessage = `采购订单创建成功！该供应商为"临时供应商"且订单金额 ¥${total_amount.toLocaleString()} 超过阈值 ¥${AMOUNT_THRESHOLD.toLocaleString()}，已提交给管理员审批。`;
      } else {
        // 临时供应商 + 小金额 = 直接进入商务审核
        nextStatus = '待商务审核 (Pending Commercial Review)';
        approvalMessage = `采购订单创建成功！订单金额在阈值范围内，已直接进入商务审核流程。`;
      }
    }
    
    // 生成订单号
    const order_number = await PurchaseOrder.generateOrderNumber();
    
    // 5. 创建采购订单
    const purchaseOrder = await PurchaseOrder.create({
      order_number,
      supplier_id,
      items,
      total_amount, // 使用计算出的总金额
      expected_delivery_date,
      payment_terms,
      shipping_address,
      contact_person,
      contact_phone,
      notes,
      status: nextStatus, // 使用智能计算出的状态
      created_by: req.user._id
    });
    
    // 填充供应商信息
    await purchaseOrder.populate('supplier_id', 'name contact_person phone email');
    await purchaseOrder.populate('created_by', 'full_name phone');
    
    // --- End of New Logic ---
    
    // 返回响应
    res.status(201).json({
      success: true,
      message: approvalMessage,
      data: purchaseOrder,
      riskControl: {
        isPartnerSupplier: IS_PARTNER_SUPPLIER,
        totalAmount: total_amount,
        amountThreshold: AMOUNT_THRESHOLD,
        isOverThreshold: IS_OVER_THRESHOLD,
        needsAdminApproval: nextStatus === '待管理员审批 (Pending Admin Approval)'
      }
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
      .populate('created_by', 'full_name phone')
      .populate('approved_by', 'full_name phone');
    
    // 🔒 触发生产订单物料齐套状态更新（异步执行，不阻塞响应）
    triggerMaterialReadinessUpdate(req.params.id).catch(err => 
      console.error('物料状态更新失败:', err)
    );
    
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
      .populate('created_by', 'full_name phone')
      .populate('approved_by', 'full_name phone');
    
    // 🔒 状态变更后触发物料齐套状态更新（异步执行）
    if (['confirmed', 'shipped', 'received'].includes(status)) {
      triggerMaterialReadinessUpdate(req.params.id).catch(err => 
        console.error('物料状态更新失败:', err)
      );
    }
    
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
      .populate('created_by', 'full_name phone')
      .populate('approved_by', 'full_name phone')
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

/**
 * @desc    添加文件到采购订单
 * @route   POST /api/purchase-orders/:id/add-file
 * @access  Private
 */
exports.addFileToPurchaseOrder = async (req, res) => {
  try {
    const { file_name, file_url, file_type, uploaded_by } = req.body;
    
    if (!file_name || !file_url) {
      return res.status(400).json({
        success: false,
        message: '请提供文件名和文件URL'
      });
    }
    
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }
    
    // 添加文件到文档数组
    const fileDoc = {
      name: file_name,
      url: file_url,
      type: file_type || 'other',
      uploadedAt: new Date(),
      uploaded_by: uploaded_by || req.user._id
    };
    
    purchaseOrder.documents.push(fileDoc);
    await purchaseOrder.save();
    
    // 填充用户信息
    await purchaseOrder.populate('documents.uploaded_by', 'full_name');
    
    res.json({
      success: true,
      message: '文件添加成功',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('添加文件失败:', error);
    res.status(500).json({
      success: false,
      message: '添加文件失败',
      error: error.message
    });
  }
};

/**
 * @desc    删除采购订单的文件
 * @route   DELETE /api/purchase-orders/:id/files/:fileId
 * @access  Private
 */
exports.deleteFileFromPurchaseOrder = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }
    
    // 移除文件
    purchaseOrder.documents = purchaseOrder.documents.filter(
      doc => doc._id.toString() !== fileId
    );
    
    await purchaseOrder.save();
    
    res.json({
      success: true,
      message: '文件删除成功',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({
      success: false,
      message: '删除文件失败',
      error: error.message
    });
  }
};

/**
 * @desc    添加付款记录
 * @route   POST /api/purchase-orders/:id/payments
 * @access  Private (Procurement Specialist, Commercial Engineer)
 */
exports.addPaymentRecord = async (req, res) => {
  try {
    const { amount, payment_date, payment_method, reference_number, notes } = req.body;
    
    if (!amount || !payment_date) {
      return res.status(400).json({
        success: false,
        message: '请提供付款金额和付款日期'
      });
    }
    
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }
    
    // 初始化 payment_info 如果不存在
    if (!purchaseOrder.payment_info) {
      purchaseOrder.payment_info = {
        paid_amount: 0,
        payment_status: '未付款 (Unpaid)',
        payment_records: []
      };
    }
    
    // 添加付款记录
    const paymentRecord = {
      amount,
      payment_date,
      payment_method: payment_method || '银行转账',
      reference_number,
      notes,
      recorded_by: req.user._id,
      recorded_at: new Date()
    };
    
    purchaseOrder.payment_info.payment_records.push(paymentRecord);
    
    // 更新已付款金额
    purchaseOrder.payment_info.paid_amount = purchaseOrder.payment_info.payment_records.reduce(
      (total, record) => total + record.amount,
      0
    );
    
    // 更新付款状态
    const totalAmount = purchaseOrder.total_amount;
    const paidAmount = purchaseOrder.payment_info.paid_amount;
    
    if (paidAmount >= totalAmount) {
      purchaseOrder.payment_info.payment_status = '已付款 (Paid)';
    } else if (paidAmount > 0) {
      purchaseOrder.payment_info.payment_status = '部分付款 (Partial)';
    } else {
      purchaseOrder.payment_info.payment_status = '未付款 (Unpaid)';
    }
    
    await purchaseOrder.save();
    
    // 填充用户信息
    await purchaseOrder.populate('payment_info.payment_records.recorded_by', 'full_name');
    
    res.json({
      success: true,
      message: '付款记录添加成功',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('添加付款记录失败:', error);
    res.status(500).json({
      success: false,
      message: '添加付款记录失败',
      error: error.message
    });
  }
};

/**
 * @desc    添加物流信息
 * @route   POST /api/purchase-orders/:id/shipments
 * @access  Private (Procurement Specialist)
 */
exports.addShipment = async (req, res) => {
  try {
    const {
      shipment_number,
      tracking_number,
      carrier,
      shipped_date,
      estimated_delivery_date,
      shipment_status,
      items_shipped,
      packaging_info,
      carrier_contact,
      notes
    } = req.body;
    
    if (!tracking_number || !carrier) {
      return res.status(400).json({
        success: false,
        message: '请提供物流单号和承运商'
      });
    }
    
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }
    
    // 添加物流信息
    const shipment = {
      shipment_number,
      tracking_number,
      carrier,
      shipped_date: shipped_date || new Date(),
      estimated_delivery_date,
      shipment_status: shipment_status || '已发货',
      items_shipped,
      packaging_info,
      carrier_contact,
      notes,
      created_by: req.user._id,
      created_at: new Date()
    };
    
    if (!purchaseOrder.shipments) {
      purchaseOrder.shipments = [];
    }
    
    purchaseOrder.shipments.push(shipment);
    
    // 如果订单状态还是"执行中"，自动更新为"已发货"
    if (purchaseOrder.status === '执行中 (In Progress)') {
      purchaseOrder.status = '已发货 (Shipped)';
    }
    
    await purchaseOrder.save();
    
    res.json({
      success: true,
      message: '物流信息添加成功',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('添加物流信息失败:', error);
    res.status(500).json({
      success: false,
      message: '添加物流信息失败',
      error: error.message
    });
  }
};

/**
 * @desc    更新物流状态
 * @route   PATCH /api/purchase-orders/:id/shipments/:shipmentId
 * @access  Private (Procurement Specialist)
 */
exports.updateShipmentStatus = async (req, res) => {
  try {
    const { id, shipmentId } = req.params;
    const { shipment_status, actual_delivery_date, notes } = req.body;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }
    
    const shipment = purchaseOrder.shipments.id(shipmentId);
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: '物流信息不存在'
      });
    }
    
    // 更新物流状态
    if (shipment_status) {
      shipment.shipment_status = shipment_status;
    }
    
    if (actual_delivery_date) {
      shipment.actual_delivery_date = actual_delivery_date;
    }
    
    if (notes) {
      shipment.notes = notes;
    }
    
    await purchaseOrder.save();
    
    res.json({
      success: true,
      message: '物流状态更新成功',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('更新物流状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新物流状态失败',
      error: error.message
    });
  }
};

/**
 * @desc    确认收货
 * @route   POST /api/purchase-orders/:id/receive
 * @access  Private (Procurement Specialist, Warehouse Staff)
 */
exports.confirmReceiving = async (req, res) => {
  try {
    const {
      received_items,
      warehouse_location,
      notes,
      quality_check_status
    } = req.body;
    
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }
    
    // 检查订单状态
    if (purchaseOrder.status !== '已发货 (Shipped)') {
      return res.status(400).json({
        success: false,
        message: '只有已发货的订单才能确认收货'
      });
    }
    
    // 初始化收货信息
    purchaseOrder.receiving_info = {
      received_date: new Date(),
      received_by: req.user._id,
      received_items: received_items || [],
      quality_check: {
        status: quality_check_status || '待检验',
        inspection_date: new Date()
      },
      warehouse_location,
      notes
    };
    
    // 更新订单状态为已收货
    purchaseOrder.status = '已收货 (Received)';
    purchaseOrder.actual_delivery_date = new Date();
    
    await purchaseOrder.save();
    
    // 填充用户信息
    await purchaseOrder.populate('receiving_info.received_by', 'full_name');
    
    // 🔗 自动创建IQC质检任务
    const { createQualityCheck } = require('./qualityCheckController');
    try {
      const itemsToCheck = received_items?.map(item => ({
        item: item.item_id,
        itemType: item.item_type || 'Accessory',
        model: item.item_name || item.model,
        quantity: item.received_quantity || item.quantity
      })) || [];
      
      await createQualityCheck(
        'IQC',
        {
          id: purchaseOrder._id,
          type: 'PurchaseOrder',
          number: purchaseOrder.order_number
        },
        itemsToCheck
      );
      
      console.log(`✅ 自动创建IQC检验任务: 采购订单 ${purchaseOrder.order_number}`);
    } catch (error) {
      console.error('创建IQC检验任务失败:', error);
      // 不影响主流程，继续执行
    }
    
    // 🔗 与生产系统关联：记录物料入库信息
    // 如果质检状态为合格，触发生产系统通知
    if (quality_check_status === '合格' || quality_check_status === '部分合格') {
      console.log(`📦 采购订单 ${purchaseOrder.order_number} 物料已入库且质检${quality_check_status}`);
      console.log(`🏭 可用于生产调度的物料清单:`, received_items);
      
      // 这里可以扩展：
      // 1. 发送系统通知给生产计划员
      // 2. 更新库存系统
      // 3. 检查是否有待采购的生产订单，自动关联
      // 4. 触发MES系统的物料可用性更新
    }
    
    res.json({
      success: true,
      message: '收货确认成功',
      data: purchaseOrder,
      productionNotification: quality_check_status === '合格' || quality_check_status === '部分合格' 
        ? '物料已入库且质检合格，可用于生产调度' 
        : null
    });
  } catch (error) {
    console.error('确认收货失败:', error);
    res.status(500).json({
      success: false,
      message: '确认收货失败',
      error: error.message
    });
  }
};

/**
 * @desc    更新质检状态
 * @route   PATCH /api/purchase-orders/:id/quality-check
 * @access  Private (Quality Inspector)
 */
exports.updateQualityCheck = async (req, res) => {
  try {
    const {
      status,
      inspection_notes,
      defect_description
    } = req.body;
    
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }
    
    if (!purchaseOrder.receiving_info) {
      return res.status(400).json({
        success: false,
        message: '该订单尚未收货'
      });
    }
    
    // 更新质检信息
    purchaseOrder.receiving_info.quality_check = {
      ...purchaseOrder.receiving_info.quality_check,
      status: status || purchaseOrder.receiving_info.quality_check.status,
      inspector: req.user._id,
      inspection_date: new Date(),
      inspection_notes,
      defect_description
    };
    
    await purchaseOrder.save();
    
    // 填充质检员信息
    await purchaseOrder.populate('receiving_info.quality_check.inspector', 'full_name');
    
    // 🔗 与生产系统关联：如果质检状态更新为合格，触发生产通知
    if (status === '合格' || status === '部分合格') {
      console.log(`✅ 采购订单 ${purchaseOrder.order_number} 质检${status}`);
      console.log(`🏭 物料可用于生产，建议生产计划员及时安排生产`);
      
      // 这里可以扩展：
      // 1. 自动创建生产可用物料清单
      // 2. 发送通知给生产计划员
      // 3. 更新MES系统的物料状态
      // 4. 自动匹配待生产的工单
    }
    
    res.json({
      success: true,
      message: '质检信息更新成功',
      data: purchaseOrder,
      productionReady: (status === '合格' || status === '部分合格')
    });
  } catch (error) {
    console.error('更新质检信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新质检信息失败',
      error: error.message
    });
  }
};

/**
 * @desc    添加采购跟进记录
 * @route   POST /api/purchase-orders/:id/follow-ups
 * @access  Private (Procurement Specialist)
 */
exports.addFollowUp = async (req, res) => {
  try {
    const { content, follow_up_type, contact_person, contact_method, updated_delivery_date, user_id } = req.body;
    
    // 验证必填字段
    if (!content || !user_id) {
      return res.status(400).json({
        success: false,
        message: '跟进内容和用户ID为必填项'
      });
    }
    
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }
    
    // 添加跟进记录
    const followUp = {
      timestamp: new Date(),
      content: content.trim(),
      follow_up_type: follow_up_type || '常规跟进',
      contact_person,
      contact_method,
      updated_delivery_date,
      user_id
    };
    
    purchaseOrder.follow_ups.push(followUp);
    
    // 如果跟进记录中更新了交期，同步更新订单的预计交货日期
    if (updated_delivery_date) {
      purchaseOrder.expected_delivery_date = updated_delivery_date;
    }
    
    await purchaseOrder.save();
    
    // 重新查询并填充用户信息
    const updatedOrder = await PurchaseOrder.findById(req.params.id)
      .populate('follow_ups.user_id', 'full_name phone')
      .populate('supplier_id', 'name contact_person phone email')
      .populate('created_by', 'full_name phone')
      .populate('approved_by', 'full_name phone');
    
    res.json({
      success: true,
      message: '跟进记录添加成功',
      data: updatedOrder
    });
  } catch (error) {
    console.error('添加跟进记录失败:', error);
    res.status(500).json({
      success: false,
      message: '添加跟进记录失败',
      error: error.message
    });
  }
};

/**
 * @desc    管理员审批采购订单（批准）
 * @route   POST /api/purchase-orders/:id/admin-approve
 * @access  Private (Administrator only)
 */
exports.adminApprovePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }
    
    // 检查订单状态
    if (purchaseOrder.status !== '待管理员审批 (Pending Admin Approval)') {
      return res.status(400).json({
        success: false,
        message: '该订单当前状态不是"待管理员审批"，无法执行审批操作',
        currentStatus: purchaseOrder.status
      });
    }
    
    // 批准：将状态更新为"待拟定合同"
    purchaseOrder.status = '待拟定合同 (Pending Contract Draft)';
    purchaseOrder.approved_by = req.user._id;
    purchaseOrder.approved_at = new Date();
    
    await purchaseOrder.save();
    
    // 填充用户信息
    await purchaseOrder.populate('supplier_id', 'name contact_person phone email');
    await purchaseOrder.populate('created_by', 'full_name phone');
    await purchaseOrder.populate('approved_by', 'full_name phone');
    
    res.json({
      success: true,
      message: '采购订单审批通过！订单已进入"待拟定合同"流程。',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('管理员审批失败:', error);
    res.status(500).json({
      success: false,
      message: '管理员审批失败',
      error: error.message
    });
  }
};

/**
 * @desc    管理员驳回采购订单
 * @route   POST /api/purchase-orders/:id/admin-reject
 * @access  Private (Administrator only)
 */
exports.adminRejectPurchaseOrder = async (req, res) => {
  try {
    const { rejection_reason } = req.body;
    
    // 验证驳回原因
    if (!rejection_reason || rejection_reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '请填写驳回原因'
      });
    }
    
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }
    
    // 检查订单状态
    if (purchaseOrder.status !== '待管理员审批 (Pending Admin Approval)') {
      return res.status(400).json({
        success: false,
        message: '该订单当前状态不是"待管理员审批"，无法执行驳回操作',
        currentStatus: purchaseOrder.status
      });
    }
    
    // 驳回：将状态更新为"已驳回"
    purchaseOrder.status = '已驳回 (Rejected)';
    purchaseOrder.rejection_reason = rejection_reason.trim();
    purchaseOrder.rejected_by = req.user._id;
    purchaseOrder.rejected_at = new Date();
    
    await purchaseOrder.save();
    
    // 填充用户信息
    await purchaseOrder.populate('supplier_id', 'name contact_person phone email');
    await purchaseOrder.populate('created_by', 'full_name phone');
    await purchaseOrder.populate('rejected_by', 'full_name phone');
    
    res.json({
      success: true,
      message: '采购订单已驳回！采购员将收到通知。',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('管理员驳回失败:', error);
    res.status(500).json({
      success: false,
      message: '管理员驳回失败',
      error: error.message
    });
  }
};

/**
 * @desc    获取待管理员审批的采购订单列表
 * @route   GET /api/purchase-orders/pending-admin-approval
 * @access  Private (Administrator only)
 */
exports.getPendingAdminApprovalOrders = async (req, res) => {
  try {
    const pendingOrders = await PurchaseOrder.find({
      status: '待管理员审批 (Pending Admin Approval)'
    })
      .populate('supplier_id', 'name contact_person phone email')
      .populate('created_by', 'full_name phone')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: pendingOrders.length,
      data: pendingOrders
    });
  } catch (error) {
    console.error('获取待审批订单列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取待审批订单列表失败',
      error: error.message
    });
  }
};

// 🔒 ========== 物料齐套状态触发器 ==========

/**
 * @desc    发送物料齐套通知
 * @param   {Object} productionOrder - 生产订单对象
 * @desc    当物料状态变为齐套时，通知相关生产计划员
 */
async function sendMaterialReadinessNotification(productionOrder) {
  try {
    const User = require('../models/User');
    
    // 查找所有生产计划员和管理员
    const usersToNotify = await User.find({
      role: { $in: ['Production Planner', 'Administrator'] }
    });
    
    if (usersToNotify.length === 0) {
      console.log('⚠️ 未找到需要通知的用户');
      return;
    }
    
    // 创建通知消息
    const notificationMessage = {
      type: 'material_ready',
      title: '🎉 物料齐套通知',
      message: `生产订单 ${productionOrder.productionOrderNumber} 的所有物料已齐套，可以开始安排生产！`,
      productionOrderId: productionOrder._id,
      productionOrderNumber: productionOrder.productionOrderNumber,
      timestamp: new Date()
    };
    
    // 为每个用户添加通知
    const notificationPromises = usersToNotify.map(async (user) => {
      try {
        // 如果用户模型有 notifications 字段，添加到该字段
        if (user.notifications) {
          user.notifications.unshift(notificationMessage);
          // 保留最近50条通知
          if (user.notifications.length > 50) {
            user.notifications = user.notifications.slice(0, 50);
          }
          await user.save();
        }
        
        console.log(`📧 通知已发送给: ${user.full_name} (${user.role})`);
        return { success: true, user: user.full_name };
      } catch (error) {
        console.error(`❌ 发送通知给 ${user.full_name} 失败:`, error);
        return { success: false, user: user.full_name, error: error.message };
      }
    });
    
    await Promise.all(notificationPromises);
    console.log(`✅ 物料齐套通知已发送给 ${usersToNotify.length} 位用户`);
    
  } catch (error) {
    console.error('❌ 发送物料齐套通知失败:', error);
  }
}

/**
 * @desc    触发生产订单物料齐套状态重新计算
 * @param   {String} purchaseOrderId - 采购订单ID（可选）
 * @desc    当采购订单状态或预计到货日期变更时调用此函数
 */
async function triggerMaterialReadinessUpdate(purchaseOrderId = null) {
  try {
    console.log('🔄 触发物料齐套状态更新...');
    
    // 查找所有需要更新的生产订单
    // 如果指定了采购订单ID，则只更新与该采购订单相关的生产订单
    let productionOrders;
    
    if (purchaseOrderId) {
      // 查找采购订单中的物料
      const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);
      if (purchaseOrder && purchaseOrder.items && purchaseOrder.items.length > 0) {
        const materialNames = purchaseOrder.items.map(item => item.item_name);
        
        // 查找包含这些物料的生产订单
        productionOrders = await ProductionOrder.find({
          'productionItems.model_name': { $in: materialNames },
          status: { $in: ['Pending', 'Scheduled', 'In Production'] } // 只更新进行中的订单
        });
      } else {
        return;
      }
    } else {
      // 更新所有进行中的生产订单
      productionOrders = await ProductionOrder.find({
        status: { $in: ['Pending', 'Scheduled', 'In Production'] }
      });
    }
    
    console.log(`📊 找到 ${productionOrders.length} 个生产订单需要更新物料状态`);
    
    // 并发更新所有生产订单的物料状态（并发送通知）
    const updatePromises = productionOrders.map(async (po) => {
      try {
        const oldStatus = po.material_readiness_status; // 🔒 记录旧状态
        await po.calculateMaterialReadiness();
        await po.save();
        const newStatus = po.material_readiness_status; // 🔒 记录新状态
        
        // 🔒 如果状态变为齐套，发送通知
        if (oldStatus !== '全部可用(齐套)' && newStatus === '全部可用(齐套)') {
          await sendMaterialReadinessNotification(po);
        }
        
        return { success: true, orderNumber: po.productionOrderNumber, statusChange: oldStatus !== newStatus };
      } catch (error) {
        console.error(`❌ 更新生产订单 ${po.productionOrderNumber} 失败:`, error);
        return { success: false, orderNumber: po.productionOrderNumber, error: error.message };
      }
    });
    
    const results = await Promise.all(updatePromises);
    const successCount = results.filter(r => r.success).length;
    const statusChangeCount = results.filter(r => r.statusChange).length;
    
    console.log(`✅ 物料齐套状态更新完成: ${successCount}/${productionOrders.length} 个订单更新成功，其中 ${statusChangeCount} 个订单状态发生变化`);
    
  } catch (error) {
    console.error('❌ 触发物料齐套状态更新失败:', error);
  }
}

// 导出触发器函数供外部使用
module.exports.triggerMaterialReadinessUpdate = triggerMaterialReadinessUpdate;

