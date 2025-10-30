const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true
  },
  product_code: {
    type: String,
    trim: true
  },
  specification: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity'],
    min: [1, 'Quantity must be at least 1']
  },
  unit: {
    type: String,
    default: '件',
    trim: true
  },
  unit_price: {
    type: Number,
    required: [true, 'Please provide unit price'],
    min: [0, 'Unit price cannot be negative']
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: true });

const purchaseOrderSchema = new mongoose.Schema({
  order_number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Please provide supplier']
  },
  items: {
    type: [purchaseOrderItemSchema],
    required: [true, 'Please provide at least one item'],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Purchase order must have at least one item'
    }
  },
  total_amount: {
    type: Number,
    required: [true, 'Please provide total amount'],
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: [
      '草稿 (Draft)',
      '待处理 (Pending)',
      '待管理员审批 (Pending Admin Approval)',
      '已驳回 (Rejected)',
      '待拟定合同 (Pending Contract Draft)',
      '待商务审核 (Pending Commercial Review)',
      '待供应商确认 (Pending Supplier Confirmation)',
      '执行中 (In Progress)',
      '已发货 (Shipped)',
      '已收货 (Received)',
      '已取消 (Cancelled)'
    ],
    default: '草稿 (Draft)'
  },
  rejection_reason: {
    type: String,
    trim: true
  },
  rejected_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejected_at: {
    type: Date
  },
  order_date: {
    type: Date,
    default: Date.now
  },
  expected_delivery_date: {
    type: Date
  },
  actual_delivery_date: {
    type: Date
  },
  payment_terms: {
    type: String,
    trim: true
  },
  shipping_address: {
    type: String,
    trim: true
  },
  contact_person: {
    type: String,
    trim: true
  },
  contact_phone: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approved_at: {
    type: Date
  },
  documents: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['contract_draft', 'contract_sealed', 'contract_final', 'other'],
      default: 'other'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // 付款信息
  payment_info: {
    paid_amount: {
      type: Number,
      default: 0,
      min: 0
    },
    payment_status: {
      type: String,
      enum: ['未付款 (Unpaid)', '部分付款 (Partial)', '已付款 (Paid)', '逾期 (Overdue)'],
      default: '未付款 (Unpaid)'
    },
    payment_records: [{
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      payment_date: {
        type: Date,
        required: true
      },
      payment_method: {
        type: String,
        enum: ['银行转账', '支票', '现金', '信用证', '其他'],
        default: '银行转账'
      },
      reference_number: {
        type: String,
        trim: true
      },
      notes: {
        type: String,
        trim: true
      },
      recorded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      recorded_at: {
        type: Date,
        default: Date.now
      }
    }]
  },
  // 物流信息
  shipments: [{
    shipment_number: {
      type: String,
      trim: true
    },
    tracking_number: {
      type: String,
      trim: true
    },
    carrier: {
      type: String,
      trim: true
    },
    shipped_date: {
      type: Date
    },
    estimated_delivery_date: {
      type: Date
    },
    actual_delivery_date: {
      type: Date
    },
    shipment_status: {
      type: String,
      enum: ['准备中', '已发货', '运输中', '已送达', '异常'],
      default: '准备中'
    },
    items_shipped: [{
      product_name: String,
      product_code: String,
      quantity: Number,
      unit: String
    }],
    packaging_info: {
      packages_count: Number,
      total_weight: Number,
      weight_unit: {
        type: String,
        default: 'kg'
      },
      dimensions: String
    },
    carrier_contact: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  // 收货信息
  receiving_info: {
    received_date: {
      type: Date
    },
    received_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    received_items: [{
      product_name: String,
      product_code: String,
      ordered_quantity: Number,
      received_quantity: Number,
      damaged_quantity: {
        type: Number,
        default: 0
      },
      unit: String,
      notes: String
    }],
    quality_check: {
      status: {
        type: String,
        enum: ['待检验', '检验中', '合格', '不合格', '部分合格'],
        default: '待检验'
      },
      inspector: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      inspection_date: Date,
      inspection_notes: String,
      defect_description: String
    },
    warehouse_location: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  },
  
  // 跟进记录（采购员与供应商沟通、交期变更等）
  follow_ups: [{
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    follow_up_type: {
      type: String,
      enum: ['常规跟进', '交期确认', '交期延迟', '质量问题', '价格变更', '紧急催货', '其他'],
      default: '常规跟进'
    },
    contact_person: {
      type: String,
      trim: true
    },
    contact_method: {
      type: String,
      enum: ['电话', '邮件', '微信', '现场拜访', '视频会议', '其他'],
      trim: true
    },
    updated_delivery_date: {
      type: Date
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }]
}, {
  timestamps: true
});

// 索引
purchaseOrderSchema.index({ order_number: 1 });
purchaseOrderSchema.index({ supplier_id: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ order_date: -1 });
purchaseOrderSchema.index({ created_by: 1 });

// 生成订单编号的静态方法
purchaseOrderSchema.statics.generateOrderNumber = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const prefix = `PO${year}${month}${day}`;
  
  // 查找当天最后一个订单号
  const lastOrder = await this.findOne({
    order_number: new RegExp(`^${prefix}`)
  }).sort({ order_number: -1 });
  
  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.order_number.slice(-4));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

// 计算总金额的方法
purchaseOrderSchema.methods.calculateTotalAmount = function() {
  return this.items.reduce((total, item) => {
    return total + (item.quantity * item.unit_price);
  }, 0);
};

// 保存前自动计算小计和总金额
purchaseOrderSchema.pre('save', function(next) {
  // 计算每个项目的小计
  this.items.forEach(item => {
    item.subtotal = item.quantity * item.unit_price;
  });
  
  // 计算总金额
  this.total_amount = this.calculateTotalAmount();
  
  next();
});

// 更新供应商交易数据
purchaseOrderSchema.post('save', async function(doc) {
  if (doc.status === '已收货 (Received)') {
    const Supplier = mongoose.model('Supplier');
    await Supplier.findByIdAndUpdate(doc.supplier_id, {
      $inc: { total_transaction_value: doc.total_amount }
    });
  }
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);

