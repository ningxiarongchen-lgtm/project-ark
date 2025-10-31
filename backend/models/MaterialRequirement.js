const mongoose = require('mongoose');

/**
 * 物料需求模型
 * 用于生产计划员提交物料需求，采购专员处理并转化为采购订单
 */
const materialRequirementSchema = new mongoose.Schema({
  // 需求编号
  requirement_number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // 关联的生产订单
  production_order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionOrder',
    required: true
  },
  
  // 生产订单信息快照
  production_order_snapshot: {
    order_number: String,
    sales_order_number: String,
    client_name: String,
    project_name: String,
    priority: String
  },
  
  // 物料需求项目列表
  items: [{
    // 物料信息
    material_code: {
      type: String,
      trim: true
    },
    material_name: {
      type: String,
      required: true,
      trim: true
    },
    specification: {
      type: String,
      trim: true
    },
    
    // 需求数量
    required_quantity: {
      type: Number,
      required: true,
      min: 1
    },
    
    // 单位
    unit: {
      type: String,
      default: '件',
      trim: true
    },
    
    // 需求日期（生产需要此物料的日期）
    required_date: {
      type: Date,
      required: true
    },
    
    // 当前库存
    current_stock: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // 实际需采购数量（需求数量 - 库存）
    purchase_quantity: {
      type: Number,
      required: true,
      min: 0
    },
    
    // 预估单价
    estimated_unit_price: {
      type: Number,
      min: 0
    },
    
    // 预估金额
    estimated_amount: {
      type: Number,
      min: 0
    },
    
    // 建议供应商
    suggested_supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    
    // 采购状态
    procurement_status: {
      type: String,
      enum: ['待采购', '已下单', '部分到货', '已到货', '已取消'],
      default: '待采购'
    },
    
    // 关联的采购订单
    purchase_order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder'
    },
    
    // 备注
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // 总体状态
  status: {
    type: String,
    enum: [
      '草稿',           // 生产计划员正在编辑
      '已提交',         // 已提交给采购部门
      '采购中',         // 采购专员正在处理
      '部分完成',       // 部分物料已到货
      '已完成',         // 所有物料已到货
      '已取消'          // 需求已取消
    ],
    default: '草稿'
  },
  
  // 优先级
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  
  // 需求说明
  description: {
    type: String,
    trim: true
  },
  
  // 紧急原因（如果是紧急需求）
  urgent_reason: {
    type: String,
    trim: true
  },
  
  // 需求提交时间
  submitted_at: {
    type: Date
  },
  
  // 要求到货日期
  required_delivery_date: {
    type: Date,
    required: true
  },
  
  // 创建人（生产计划员）
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 指派的采购专员
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 采购专员接单时间
  accepted_at: {
    type: Date
  },
  
  // 关联的采购订单列表
  purchase_orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
  }],
  
  // 跟进记录
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
      enum: ['状态更新', '价格确认', '交期确认', '问题反馈', '其他'],
      default: '状态更新'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  
  // 统计信息
  statistics: {
    total_items: {
      type: Number,
      default: 0
    },
    total_estimated_amount: {
      type: Number,
      default: 0
    },
    completed_items: {
      type: Number,
      default: 0
    },
    pending_items: {
      type: Number,
      default: 0
    }
  }
  
}, {
  timestamps: true
});

// 自动生成需求编号
materialRequirementSchema.pre('save', async function(next) {
  if (!this.requirement_number) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('MaterialRequirement').countDocuments();
    this.requirement_number = `MR-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// 保存前自动计算统计信息
materialRequirementSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.statistics.total_items = this.items.length;
    
    this.statistics.total_estimated_amount = this.items.reduce((sum, item) => {
      return sum + (item.estimated_amount || 0);
    }, 0);
    
    this.statistics.completed_items = this.items.filter(item => 
      item.procurement_status === '已到货'
    ).length;
    
    this.statistics.pending_items = this.items.filter(item => 
      item.procurement_status === '待采购'
    ).length;
    
    // 根据物料状态自动更新总体状态
    if (this.statistics.completed_items === this.statistics.total_items && this.statistics.total_items > 0) {
      this.status = '已完成';
    } else if (this.statistics.completed_items > 0) {
      this.status = '部分完成';
    } else if (this.status !== '草稿' && this.status !== '已取消') {
      this.status = '采购中';
    }
  }
  next();
});

// 添加跟进记录的方法
materialRequirementSchema.methods.addFollowUp = function(content, type, userId) {
  this.follow_ups.push({
    content,
    follow_up_type: type,
    user: userId,
    timestamp: new Date()
  });
};

// 提交给采购部门
materialRequirementSchema.methods.submitToProcurement = function() {
  if (this.status === '草稿') {
    this.status = '已提交';
    this.submitted_at = new Date();
  }
};

// 采购专员接单
materialRequirementSchema.methods.acceptByProcurement = function(userId) {
  if (this.status === '已提交') {
    this.status = '采购中';
    this.assigned_to = userId;
    this.accepted_at = new Date();
  }
};

// 索引
materialRequirementSchema.index({ requirement_number: 1 });
materialRequirementSchema.index({ production_order: 1 });
materialRequirementSchema.index({ status: 1 });
materialRequirementSchema.index({ created_by: 1 });
materialRequirementSchema.index({ assigned_to: 1 });
materialRequirementSchema.index({ priority: 1 });
materialRequirementSchema.index({ required_delivery_date: 1 });
materialRequirementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MaterialRequirement', materialRequirementSchema);

