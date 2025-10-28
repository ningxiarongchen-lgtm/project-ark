const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  // 发票号
  invoice_number: {
    type: String,
    required: [true, '请提供发票号'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // 关联销售订单
  sales_order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
    required: true
  },
  
  // 订单信息快照
  order_snapshot: {
    order_number: String,
    project_number: String,
    project_name: String
  },
  
  // 客户信息
  customer: {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    name: {
      type: String,
      required: true
    },
    tax_id: String,           // 纳税人识别号
    address: String,
    phone: String,
    bank_name: String,        // 开户银行
    bank_account: String      // 银行账号
  },
  
  // 发票类型
  invoice_type: {
    type: String,
    enum: {
      values: ['增值税专用发票', '增值税普通发票', '电子发票'],
      message: '无效的发票类型'
    },
    required: true
  },
  
  // 发票状态
  status: {
    type: String,
    enum: {
      values: ['草稿', '待开票', '已开票', '已作废', '已红冲'],
      message: '无效的发票状态'
    },
    default: '草稿',
    required: true
  },
  
  // 开票日期
  invoice_date: {
    type: Date
  },
  
  // 发票明细
  items: [{
    // 物料信息
    item_type: {
      type: String,
      required: true
    },
    
    item_name: {
      type: String,
      required: true
    },
    
    specification: String,    // 规格型号
    unit: String,             // 计量单位
    
    // 数量
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    
    // 单价
    unit_price: {
      type: Number,
      required: true,
      min: 0
    },
    
    // 金额（不含税）
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    
    // 税率
    tax_rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 13
    },
    
    // 税额
    tax_amount: {
      type: Number,
      required: true,
      min: 0
    },
    
    // 价税合计
    total_amount: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  
  // 金额汇总
  amount_summary: {
    // 不含税金额
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    
    // 税额
    tax_amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    
    // 价税合计
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  
  // 备注
  notes: {
    type: String,
    trim: true
  },
  
  // 收款人
  payee: {
    type: String,
    trim: true
  },
  
  // 复核人
  reviewer: {
    type: String,
    trim: true
  },
  
  // 开票人
  drawer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 发票代码
  invoice_code: {
    type: String,
    trim: true
  },
  
  // 发票文件
  invoice_file: {
    url: String,
    uploaded_at: Date
  },
  
  // 作废/红冲信息
  void_info: {
    // 作废/红冲原因
    reason: String,
    
    // 操作人
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 操作时间
    operation_date: Date,
    
    // 原发票号（红冲时使用）
    original_invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice'
    }
  },
  
  // 关联的回款记录
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  
  // 已回款金额
  paid_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 未回款金额
  unpaid_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 创建人
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
  
}, {
  timestamps: true
});

// 索引
invoiceSchema.index({ invoice_number: 1 });
invoiceSchema.index({ sales_order: 1 });
invoiceSchema.index({ 'customer.customer_id': 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoice_date: -1 });
invoiceSchema.index({ created_by: 1 });

// 自动生成发票号
invoiceSchema.pre('save', async function(next) {
  if (!this.invoice_number) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // 查找本月的最后一个发票号
    const lastInvoice = await mongoose.model('Invoice')
      .findOne({ invoice_number: new RegExp(`^INV-${year}${month}`) })
      .sort({ invoice_number: -1 });
    
    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoice_number.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.invoice_number = `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
  
  // 计算金额汇总
  if (this.items && this.items.length > 0) {
    this.amount_summary.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
    this.amount_summary.tax_amount = this.items.reduce((sum, item) => sum + item.tax_amount, 0);
    this.amount_summary.total = this.items.reduce((sum, item) => sum + item.total_amount, 0);
    
    // 计算未回款金额
    this.unpaid_amount = this.amount_summary.total - this.paid_amount;
  }
  
  next();
});

// 虚拟字段：回款率
invoiceSchema.virtual('payment_rate').get(function() {
  if (this.amount_summary.total === 0) return 0;
  return Math.round((this.paid_amount / this.amount_summary.total) * 100);
});

// 虚拟字段：是否已全额回款
invoiceSchema.virtual('is_fully_paid').get(function() {
  return this.paid_amount >= this.amount_summary.total;
});

// 虚拟字段：是否逾期
invoiceSchema.virtual('is_overdue').get(function() {
  if (this.is_fully_paid) return false;
  if (!this.invoice_date) return false;
  
  // 如果发票日期超过60天未全额回款，视为逾期
  const days = Math.floor((Date.now() - this.invoice_date.getTime()) / (1000 * 60 * 60 * 24));
  return days > 60;
});

// 实例方法：开票
invoiceSchema.methods.issue = function(userId, invoiceCode) {
  if (this.status !== '待开票' && this.status !== '草稿') {
    throw new Error('只有待开票或草稿状态的发票可以开票');
  }
  
  this.status = '已开票';
  this.invoice_date = new Date();
  this.drawer = userId;
  if (invoiceCode) {
    this.invoice_code = invoiceCode;
  }
  
  return this.save();
};

// 实例方法：作废
invoiceSchema.methods.void = function(userId, reason) {
  if (this.status !== '已开票') {
    throw new Error('只有已开票状态的发票可以作废');
  }
  
  this.status = '已作废';
  this.void_info = {
    reason,
    operator: userId,
    operation_date: new Date()
  };
  
  return this.save();
};

// 实例方法：红冲
invoiceSchema.methods.redInvoice = async function(userId, reason) {
  if (this.status !== '已开票') {
    throw new Error('只有已开票状态的发票可以红冲');
  }
  
  // 创建红字发票
  const redInvoiceData = {
    sales_order: this.sales_order,
    order_snapshot: this.order_snapshot,
    customer: this.customer,
    invoice_type: this.invoice_type,
    status: '已开票',
    invoice_date: new Date(),
    items: this.items.map(item => ({
      ...item.toObject(),
      quantity: -item.quantity,
      amount: -item.amount,
      tax_amount: -item.tax_amount,
      total_amount: -item.total_amount
    })),
    amount_summary: {
      subtotal: -this.amount_summary.subtotal,
      tax_amount: -this.amount_summary.tax_amount,
      total: -this.amount_summary.total
    },
    drawer: userId,
    notes: `红冲发票，原发票号：${this.invoice_number}`,
    created_by: userId
  };
  
  const redInvoice = await mongoose.model('Invoice').create(redInvoiceData);
  
  // 更新原发票状态
  this.status = '已红冲';
  this.void_info = {
    reason,
    operator: userId,
    operation_date: new Date(),
    original_invoice: redInvoice._id
  };
  
  await this.save();
  
  return redInvoice;
};

// 实例方法：更新回款金额
invoiceSchema.methods.updatePaidAmount = async function() {
  const Payment = mongoose.model('Payment');
  const payments = await Payment.find({
    invoice: this._id,
    status: '已确认'
  });
  
  this.paid_amount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  this.unpaid_amount = this.amount_summary.total - this.paid_amount;
  
  return this.save();
};

// 静态方法：获取统计信息
invoiceSchema.statics.getStatistics = async function(filters = {}) {
  const matchStage = { status: { $in: ['已开票', '已红冲'] } };
  
  if (filters.start_date) {
    matchStage.invoice_date = { $gte: new Date(filters.start_date) };
  }
  if (filters.end_date) {
    matchStage.invoice_date = {
      ...matchStage.invoice_date,
      $lte: new Date(filters.end_date)
    };
  }
  if (filters.customer_id) {
    matchStage['customer.customer_id'] = mongoose.Types.ObjectId(filters.customer_id);
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalAmount: { $sum: '$amount_summary.total' },
        paidAmount: { $sum: '$paid_amount' },
        unpaidAmount: { $sum: '$unpaid_amount' },
        avgAmount: { $avg: '$amount_summary.total' }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      total: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
      avgAmount: 0,
      paymentRate: 0
    };
  }
  
  const result = stats[0];
  result.paymentRate = result.totalAmount > 0 
    ? Math.round((result.paidAmount / result.totalAmount) * 100) 
    : 0;
  
  return result;
};

// 静态方法：获取逾期发票
invoiceSchema.statics.getOverdueInvoices = async function() {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  return await this.find({
    status: '已开票',
    invoice_date: { $lt: sixtyDaysAgo },
    $expr: { $lt: ['$paid_amount', '$amount_summary.total'] }
  }).populate('sales_order', 'orderNumber')
    .populate('customer.customer_id', 'name contact')
    .sort({ invoice_date: 1 });
};

module.exports = mongoose.model('Invoice', invoiceSchema);

