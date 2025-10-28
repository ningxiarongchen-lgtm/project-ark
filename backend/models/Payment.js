const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // 回款编号
  payment_number: {
    type: String,
    required: [true, '请提供回款编号'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // 关联发票
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  
  // 关联销售订单
  sales_order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
    required: true
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
    }
  },
  
  // 回款类型
  payment_type: {
    type: String,
    enum: {
      values: ['预付款', '货款', '尾款', '质保金', '其他'],
      message: '无效的回款类型'
    },
    required: true
  },
  
  // 回款方式
  payment_method: {
    type: String,
    enum: {
      values: ['银行转账', '支票', '承兑汇票', '现金', '其他'],
      message: '无效的回款方式'
    },
    required: true
  },
  
  // 回款金额
  amount: {
    type: Number,
    required: [true, '请提供回款金额'],
    min: 0
  },
  
  // 回款状态
  status: {
    type: String,
    enum: {
      values: ['待确认', '已确认', '已作废'],
      message: '无效的回款状态'
    },
    default: '待确认',
    required: true
  },
  
  // 回款日期
  payment_date: {
    type: Date,
    required: [true, '请提供回款日期']
  },
  
  // 到账日期
  received_date: {
    type: Date
  },
  
  // 银行信息
  bank_info: {
    // 付款银行
    payer_bank: String,
    
    // 付款账号
    payer_account: String,
    
    // 收款银行
    receiver_bank: String,
    
    // 收款账号
    receiver_account: String,
    
    // 交易流水号
    transaction_no: String
  },
  
  // 票据信息（承兑汇票）
  bill_info: {
    // 票据号码
    bill_number: String,
    
    // 出票日期
    issue_date: Date,
    
    // 到期日期
    due_date: Date,
    
    // 承兑银行
    acceptance_bank: String,
    
    // 票据状态
    bill_status: {
      type: String,
      enum: ['持有', '已贴现', '已到期', '已背书'],
      default: '持有'
    }
  },
  
  // 备注
  notes: {
    type: String,
    trim: true
  },
  
  // 附件（回款凭证）
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 确认信息
  confirmation: {
    // 确认人
    confirmed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 确认日期
    confirmed_date: Date,
    
    // 确认备注
    notes: String
  },
  
  // 作废信息
  void_info: {
    // 作废原因
    reason: String,
    
    // 作废人
    voided_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 作废日期
    voided_date: Date
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
paymentSchema.index({ payment_number: 1 });
paymentSchema.index({ invoice: 1 });
paymentSchema.index({ sales_order: 1 });
paymentSchema.index({ 'customer.customer_id': 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ payment_date: -1 });
paymentSchema.index({ created_by: 1 });

// 自动生成回款编号
paymentSchema.pre('save', async function(next) {
  if (!this.payment_number) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // 查找本月的最后一个回款编号
    const lastPayment = await mongoose.model('Payment')
      .findOne({ payment_number: new RegExp(`^PAY-${year}${month}`) })
      .sort({ payment_number: -1 });
    
    let sequence = 1;
    if (lastPayment) {
      const lastSequence = parseInt(lastPayment.payment_number.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.payment_number = `PAY-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
  
  next();
});

// 保存后更新发票的回款金额
paymentSchema.post('save', async function(doc) {
  if (doc.status === '已确认') {
    const Invoice = mongoose.model('Invoice');
    const invoice = await Invoice.findById(doc.invoice);
    if (invoice) {
      await invoice.updatePaidAmount();
    }
  }
});

// 虚拟字段：是否逾期（票据）
paymentSchema.virtual('is_bill_overdue').get(function() {
  if (this.payment_method !== '承兑汇票' || !this.bill_info.due_date) {
    return false;
  }
  return new Date() > this.bill_info.due_date && this.bill_info.bill_status === '持有';
});

// 实例方法：确认回款
paymentSchema.methods.confirm = function(userId, notes) {
  if (this.status !== '待确认') {
    throw new Error('只有待确认状态的回款可以确认');
  }
  
  this.status = '已确认';
  this.received_date = new Date();
  this.confirmation = {
    confirmed_by: userId,
    confirmed_date: new Date(),
    notes
  };
  
  return this.save();
};

// 实例方法：作废回款
paymentSchema.methods.void = function(userId, reason) {
  if (this.status === '已作废') {
    throw new Error('回款已作废');
  }
  
  this.status = '已作废';
  this.void_info = {
    reason,
    voided_by: userId,
    voided_date: new Date()
  };
  
  return this.save();
};

// 实例方法：票据贴现
paymentSchema.methods.discountBill = function() {
  if (this.payment_method !== '承兑汇票') {
    throw new Error('只有承兑汇票可以贴现');
  }
  if (this.bill_info.bill_status !== '持有') {
    throw new Error('只有持有状态的票据可以贴现');
  }
  
  this.bill_info.bill_status = '已贴现';
  
  return this.save();
};

// 静态方法：获取统计信息
paymentSchema.statics.getStatistics = async function(filters = {}) {
  const matchStage = { status: '已确认' };
  
  if (filters.start_date) {
    matchStage.payment_date = { $gte: new Date(filters.start_date) };
  }
  if (filters.end_date) {
    matchStage.payment_date = {
      ...matchStage.payment_date,
      $lte: new Date(filters.end_date)
    };
  }
  if (filters.customer_id) {
    matchStage['customer.customer_id'] = mongoose.Types.ObjectId(filters.customer_id);
  }
  if (filters.payment_type) {
    matchStage.payment_type = filters.payment_type;
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
        byType: {
          $push: {
            type: '$payment_type',
            amount: '$amount'
          }
        },
        byMethod: {
          $push: {
            method: '$payment_method',
            amount: '$amount'
          }
        }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      total: 0,
      totalAmount: 0,
      avgAmount: 0,
      byType: {},
      byMethod: {}
    };
  }
  
  const result = stats[0];
  
  // 按类型汇总
  result.byType = result.byType.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + item.amount;
    return acc;
  }, {});
  
  // 按方式汇总
  result.byMethod = result.byMethod.reduce((acc, item) => {
    acc[item.method] = (acc[item.method] || 0) + item.amount;
    return acc;
  }, {});
  
  return result;
};

// 静态方法：获取待确认回款
paymentSchema.statics.getPendingPayments = async function() {
  return await this.find({ status: '待确认' })
    .populate('invoice', 'invoice_number amount_summary')
    .populate('sales_order', 'orderNumber')
    .populate('customer.customer_id', 'name contact')
    .populate('created_by', 'username email')
    .sort({ payment_date: -1 });
};

// 静态方法：获取逾期票据
paymentSchema.statics.getOverdueBills = async function() {
  const today = new Date();
  
  return await this.find({
    payment_method: '承兑汇票',
    'bill_info.bill_status': '持有',
    'bill_info.due_date': { $lt: today }
  }).populate('invoice', 'invoice_number')
    .populate('sales_order', 'orderNumber')
    .populate('customer.customer_id', 'name contact')
    .sort({ 'bill_info.due_date': 1 });
};

module.exports = mongoose.model('Payment', paymentSchema);

