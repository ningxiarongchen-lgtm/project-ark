const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const SalesOrder = require('../models/SalesOrder');

// ==================== 发票管理 ====================

// @desc    获取所有发票
// @route   GET /api/finance/invoices
// @access  Private
exports.getInvoices = async (req, res) => {
  try {
    const {
      status,
      customer_id,
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (customer_id) query['customer.customer_id'] = customer_id;
    
    if (start_date || end_date) {
      query.invoice_date = {};
      if (start_date) query.invoice_date.$gte = new Date(start_date);
      if (end_date) query.invoice_date.$lte = new Date(end_date);
    }
    
    const skip = (page - 1) * limit;
    
    const invoices = await Invoice.find(query)
      .populate('sales_order', 'orderNumber projectNumber projectName')
      .populate('customer.customer_id', 'name contact')
      .populate('drawer', 'full_name phone')
      .populate('created_by', 'full_name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Invoice.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      pages: Math.ceil(total / limit),
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取发票列表失败',
      error: error.message
    });
  }
};

// @desc    获取单个发票
// @route   GET /api/finance/invoices/:id
// @access  Private
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('sales_order')
      .populate('customer.customer_id', 'name contact')
      .populate('drawer', 'full_name phone')
      .populate('payments')
      .populate('created_by', 'full_name phone');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: '发票不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取发票详情失败',
      error: error.message
    });
  }
};

// @desc    创建发票
// @route   POST /api/finance/invoices
// @access  Private
exports.createInvoice = async (req, res) => {
  try {
    req.body.created_by = req.user._id;
    
    // 如果从订单创建，获取订单信息
    if (req.body.sales_order) {
      const salesOrder = await SalesOrder.findById(req.body.sales_order)
        .populate('customer', 'name contact tax_id address phone bank_name bank_account');
      
      if (!salesOrder) {
        return res.status(404).json({
          success: false,
          message: '销售订单不存在'
        });
      }
      
      // 填充订单快照
      req.body.order_snapshot = {
        order_number: salesOrder.orderNumber,
        project_number: salesOrder.projectNumber,
        project_name: salesOrder.projectName
      };
      
      // 填充客户信息
      if (salesOrder.customer) {
        req.body.customer = {
          customer_id: salesOrder.customer._id,
          name: salesOrder.customer.name,
          tax_id: salesOrder.customer.tax_id,
          address: salesOrder.customer.address,
          phone: salesOrder.customer.phone,
          bank_name: salesOrder.customer.bank_name,
          bank_account: salesOrder.customer.bank_account
        };
      }
    }
    
    const invoice = await Invoice.create(req.body);
    
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('sales_order', 'orderNumber')
      .populate('customer.customer_id', 'name');
    
    res.status(201).json({
      success: true,
      message: '发票创建成功',
      data: populatedInvoice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建发票失败',
      error: error.message
    });
  }
};

// @desc    更新发票
// @route   PUT /api/finance/invoices/:id
// @access  Private
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: '发票不存在'
      });
    }
    
    // 只有草稿和待开票状态可以修改
    if (invoice.status !== '草稿' && invoice.status !== '待开票') {
      return res.status(400).json({
        success: false,
        message: '只有草稿和待开票状态的发票可以修改'
      });
    }
    
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: '发票更新成功',
      data: updatedInvoice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新发票失败',
      error: error.message
    });
  }
};

// @desc    开票
// @route   POST /api/finance/invoices/:id/issue
// @access  Private
exports.issueInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: '发票不存在'
      });
    }
    
    await invoice.issue(req.user._id, req.body.invoice_code);
    
    res.status(200).json({
      success: true,
      message: '开票成功',
      data: invoice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '开票失败'
    });
  }
};

// @desc    作废发票
// @route   POST /api/finance/invoices/:id/void
// @access  Private (Admin/Finance Manager)
exports.voidInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: '发票不存在'
      });
    }
    
    await invoice.void(req.user._id, req.body.reason);
    
    res.status(200).json({
      success: true,
      message: '发票已作废',
      data: invoice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '作废失败'
    });
  }
};

// @desc    红冲发票
// @route   POST /api/finance/invoices/:id/red-invoice
// @access  Private (Admin/Finance Manager)
exports.redInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: '发票不存在'
      });
    }
    
    const redInvoice = await invoice.redInvoice(req.user._id, req.body.reason);
    
    res.status(200).json({
      success: true,
      message: '红冲成功',
      data: {
        original: invoice,
        redInvoice
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '红冲失败'
    });
  }
};

// @desc    获取发票统计
// @route   GET /api/finance/invoices/stats/summary
// @access  Private
exports.getInvoiceStats = async (req, res) => {
  try {
    const filters = {};
    if (req.query.start_date) filters.start_date = req.query.start_date;
    if (req.query.end_date) filters.end_date = req.query.end_date;
    if (req.query.customer_id) filters.customer_id = req.query.customer_id;
    
    const stats = await Invoice.getStatistics(filters);
    
    // 获取逾期发票
    const overdueInvoices = await Invoice.getOverdueInvoices();
    stats.overdue = overdueInvoices.length;
    stats.overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.unpaid_amount, 0);
    
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

// ==================== 回款管理 ====================

// @desc    获取所有回款
// @route   GET /api/finance/payments
// @access  Private
exports.getPayments = async (req, res) => {
  try {
    const {
      status,
      invoice_id,
      customer_id,
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (invoice_id) query.invoice = invoice_id;
    if (customer_id) query['customer.customer_id'] = customer_id;
    
    if (start_date || end_date) {
      query.payment_date = {};
      if (start_date) query.payment_date.$gte = new Date(start_date);
      if (end_date) query.payment_date.$lte = new Date(end_date);
    }
    
    const skip = (page - 1) * limit;
    
    const payments = await Payment.find(query)
      .populate('invoice', 'invoice_number amount_summary')
      .populate('sales_order', 'orderNumber')
      .populate('customer.customer_id', 'name contact')
      .populate('confirmation.confirmed_by', 'full_name phone')
      .populate('created_by', 'full_name phone')
      .sort({ payment_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Payment.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      pages: Math.ceil(total / limit),
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取回款列表失败',
      error: error.message
    });
  }
};

// @desc    获取单个回款
// @route   GET /api/finance/payments/:id
// @access  Private
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('invoice')
      .populate('sales_order')
      .populate('customer.customer_id')
      .populate('confirmation.confirmed_by', 'full_name phone')
      .populate('created_by', 'full_name phone');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '回款记录不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取回款详情失败',
      error: error.message
    });
  }
};

// @desc    创建回款记录
// @route   POST /api/finance/payments
// @access  Private
exports.createPayment = async (req, res) => {
  try {
    req.body.created_by = req.user._id;
    
    // 获取发票信息
    if (req.body.invoice) {
      const invoice = await Invoice.findById(req.body.invoice)
        .populate('sales_order')
        .populate('customer.customer_id', 'name');
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: '发票不存在'
        });
      }
      
      // 填充销售订单和客户信息
      req.body.sales_order = invoice.sales_order._id;
      req.body.customer = {
        customer_id: invoice.customer.customer_id._id,
        name: invoice.customer.name
      };
    }
    
    const payment = await Payment.create(req.body);
    
    const populatedPayment = await Payment.findById(payment._id)
      .populate('invoice', 'invoice_number')
      .populate('sales_order', 'orderNumber')
      .populate('customer.customer_id', 'name');
    
    res.status(201).json({
      success: true,
      message: '回款记录创建成功',
      data: populatedPayment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建回款记录失败',
      error: error.message
    });
  }
};

// @desc    确认回款
// @route   POST /api/finance/payments/:id/confirm
// @access  Private (Admin/Finance Manager)
exports.confirmPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '回款记录不存在'
      });
    }
    
    await payment.confirm(req.user._id, req.body.notes);
    
    res.status(200).json({
      success: true,
      message: '回款已确认',
      data: payment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '确认失败'
    });
  }
};

// @desc    作废回款
// @route   POST /api/finance/payments/:id/void
// @access  Private (Admin/Finance Manager)
exports.voidPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '回款记录不存在'
      });
    }
    
    await payment.void(req.user._id, req.body.reason);
    
    res.status(200).json({
      success: true,
      message: '回款已作废',
      data: payment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '作废失败'
    });
  }
};

// @desc    获取回款统计
// @route   GET /api/finance/payments/stats/summary
// @access  Private
exports.getPaymentStats = async (req, res) => {
  try {
    const filters = {};
    if (req.query.start_date) filters.start_date = req.query.start_date;
    if (req.query.end_date) filters.end_date = req.query.end_date;
    if (req.query.customer_id) filters.customer_id = req.query.customer_id;
    if (req.query.payment_type) filters.payment_type = req.query.payment_type;
    
    const stats = await Payment.getStatistics(filters);
    
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

// @desc    获取待确认回款
// @route   GET /api/finance/payments/pending
// @access  Private
exports.getPendingPayments = async (req, res) => {
  try {
    const payments = await Payment.getPendingPayments();
    
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取待确认回款失败',
      error: error.message
    });
  }
};

// @desc    删除回款记录
// @route   DELETE /api/finance/payments/:id
// @access  Private (Admin)
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '回款记录不存在'
      });
    }
    
    // 只能删除待确认状态的回款
    if (payment.status !== '待确认') {
      return res.status(400).json({
        success: false,
        message: '只能删除待确认状态的回款记录'
      });
    }
    
    await payment.deleteOne();
    
    res.status(200).json({
      success: true,
      message: '回款记录已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除回款记录失败',
      error: error.message
    });
  }
};

