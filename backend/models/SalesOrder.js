const mongoose = require('mongoose');

const salesOrderSchema = new mongoose.Schema({
  // 订单编号
  orderNumber: {
    type: String,
    required: [true, 'Order number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // 关联的项目
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project reference is required']
  },
  
  // 项目基本信息快照（冗余存储，防止项目修改影响订单）
  projectSnapshot: {
    projectNumber: String,
    projectName: String,
    client: {
      name: String,
      company: String,
      phone: String,
      address: String
    }
  },
  
  // 订单状态
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'In Production', 'Shipped', 'Delivered', 'Cancelled', 'Completed'],
    default: 'Pending'
  },
  
  // 订单日期
  orderDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // 要求交付日期
  requestedDeliveryDate: {
    type: Date
  },
  
  // 实际交付日期
  actualDeliveryDate: {
    type: Date
  },
  
  // 订单明细（基于项目的BOM）
  orderItems: [{
    // 物料类型
    item_type: {
      type: String,
      required: true,
      enum: ['Actuator', 'Manual Override', 'Accessory', 'Valve', 'Other'],
      trim: true
    },
    
    // 型号
    model_name: {
      type: String,
      required: true,
      trim: true
    },
    
    // 订购数量
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    
    // 单价
    unit_price: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative']
    },
    
    // 总价
    total_price: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative']
    },
    
    // 描述
    description: {
      type: String,
      trim: true
    },
    
    // 规格说明
    specifications: {
      type: mongoose.Schema.Types.Mixed
    },
    
    // 备注
    notes: {
      type: String,
      trim: true
    },
    
    // 覆盖位号
    covered_tags: [{
      type: String,
      trim: true,
      uppercase: true
    }],
    
    // 生产状态
    production_status: {
      type: String,
      enum: ['Pending', 'In Production', 'Completed', 'Shipped'],
      default: 'Pending'
    }
  }],
  
  // 财务信息
  financial: {
    // 小计
    subtotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    
    // 税率 (%)
    tax_rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    // 税额
    tax_amount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // 运费
    shipping_cost: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // 折扣
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // 总金额
    total_amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    }
  },
  
  // 交付信息
  delivery: {
    // 交付方式
    shipping_method: {
      type: String,
      default: 'Standard'
    },
    
    // 交付地址
    shipping_address: {
      type: String
    },
    
    // 交付条款
    delivery_terms: {
      type: String,
      default: 'FOB Factory'
    },
    
    // 跟踪号
    tracking_number: {
      type: String,
      trim: true
    }
  },
  
  // 付款信息
  payment: {
    // 付款条款
    payment_terms: {
      type: String,
      default: 'Net 30'
    },
    
    // 付款状态
    payment_status: {
      type: String,
      enum: ['Pending', 'Partial', 'Paid', 'Overdue'],
      default: 'Pending'
    },
    
    // 已付金额
    paid_amount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // 付款记录
    payment_records: [{
      date: Date,
      amount: Number,
      method: String,
      reference: String,
      notes: String
    }]
  },
  
  // 质保信息
  warranty: {
    type: String,
    default: '12 months from delivery'
  },
  
  // 特殊要求
  special_requirements: {
    type: String
  },
  
  // 备注
  notes: {
    type: String
  },
  
  // 内部备注（不对客户显示）
  internal_notes: {
    type: String
  },
  
  // 订单创建者
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 负责人
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 审批信息
  approval: {
    // 审批状态
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    
    // 审批人
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 审批时间
    approved_at: {
      type: Date
    },
    
    // 审批备注
    approval_notes: {
      type: String
    }
  },
  
  // 相关文档
  documents: [{
    name: String,
    type: String, // 'Contract', 'Invoice', 'Shipping', 'Other'
    url: String,
    uploaded_at: Date,
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // 发货记录
  shipments: [{
    // 发货批次号
    shipment_number: {
      type: String,
      trim: true
    },
    
    // 物流单号
    tracking_number: {
      type: String,
      required: true,
      trim: true
    },
    
    // 承运商
    carrier: {
      type: String,
      required: true,
      trim: true
    },
    
    // 承运商联系方式
    carrier_contact: {
      type: String,
      trim: true
    },
    
    // 发货日期
    shipment_date: {
      type: Date,
      required: true,
      default: Date.now
    },
    
    // 预计送达日期
    estimated_delivery_date: {
      type: Date
    },
    
    // 实际送达日期
    actual_delivery_date: {
      type: Date
    },
    
    // 发货物料清单
    items: [{
      item_type: String,
      model_name: String,
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      notes: String
    }],
    
    // 发货状态
    status: {
      type: String,
      enum: ['Preparing', 'Shipped', 'In Transit', 'Delivered', 'Failed'],
      default: 'Preparing'
    },
    
    // 包装信息
    packaging: {
      packages_count: Number,
      total_weight: Number,
      weight_unit: {
        type: String,
        default: 'kg'
      },
      dimensions: String
    },
    
    // 备注
    notes: {
      type: String,
      trim: true
    },
    
    // 创建人
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 创建时间
    created_at: {
      type: Date,
      default: Date.now
    }
  }]
  
}, {
  timestamps: true
});

// 自动生成订单编号
salesOrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('SalesOrder').countDocuments();
    this.orderNumber = `SO-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// 计算订单财务信息
salesOrderSchema.methods.calculateFinancials = function() {
  // 计算小计
  this.financial.subtotal = this.orderItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
  
  // 计算税额
  this.financial.tax_amount = this.financial.subtotal * (this.financial.tax_rate / 100);
  
  // 计算总金额
  this.financial.total_amount = 
    this.financial.subtotal + 
    this.financial.tax_amount + 
    this.financial.shipping_cost - 
    this.financial.discount;
};

// 索引
salesOrderSchema.index({ orderNumber: 1 });
salesOrderSchema.index({ project: 1 });
salesOrderSchema.index({ status: 1 });
salesOrderSchema.index({ 'projectSnapshot.client.name': 1 });
salesOrderSchema.index({ orderDate: -1 });
salesOrderSchema.index({ created_by: 1 });

module.exports = mongoose.model('SalesOrder', salesOrderSchema);


