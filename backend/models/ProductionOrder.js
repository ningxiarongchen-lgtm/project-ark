const mongoose = require('mongoose');

const productionOrderSchema = new mongoose.Schema({
  // 生产订单编号
  productionOrderNumber: {
    type: String,
    required: [true, 'Production order number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // 关联的销售订单
  salesOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
    required: [true, 'Sales order reference is required']
  },
  
  // 销售订单信息快照
  orderSnapshot: {
    orderNumber: String,
    projectNumber: String,
    projectName: String,
    clientName: String
  },
  
  // 生产订单状态
  status: {
    type: String,
    enum: ['Pending', 'Scheduled', 'In Production', 'Paused', 'Completed', 'Cancelled', 'Delayed'],
    default: 'Pending'
  },
  
  // 优先级
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  
  // 生产计划日期
  schedule: {
    // 计划开始日期
    plannedStartDate: {
      type: Date,
      required: true
    },
    
    // 计划完成日期
    plannedEndDate: {
      type: Date,
      required: true
    },
    
    // 实际开始日期
    actualStartDate: {
      type: Date
    },
    
    // 实际完成日期
    actualCompletedDate: {
      type: Date
    }
  },
  
  // 生产明细（每个物料的生产任务）
  productionItems: [{
    // 物料信息
    item_type: {
      type: String,
      required: true,
      enum: ['Actuator', 'Manual Override', 'Accessory', 'Valve', 'Other']
    },
    
    model_name: {
      type: String,
      required: true
    },
    
    // 产品ID（用于查找工艺路线）
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Actuator'
    },
    
    // 工艺路线
    routing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Routing'
    },
    
    // 订单数量
    ordered_quantity: {
      type: Number,
      required: true,
      min: 1
    },
    
    // 已生产数量
    produced_quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // 合格数量
    qualified_quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // 不合格数量
    defective_quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // 生产状态
    production_status: {
      type: String,
      enum: ['Pending', 'In Production', 'Completed', 'On Hold'],
      default: 'Pending'
    },
    
    // 分配的生产线
    production_line: {
      type: String,
      trim: true
    },
    
    // 计划开始时间
    planned_start: {
      type: Date
    },
    
    // 计划完成时间
    planned_end: {
      type: Date
    },
    
    // 实际开始时间
    actual_start: {
      type: Date
    },
    
    // 实际完成时间
    actual_end: {
      type: Date
    },
    
    // 备注
    notes: {
      type: String
    }
  }],
  
  // 关联的工单列表
  work_orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder'
  }],
  
  // 工单生成状态
  work_orders_generated: {
    type: Boolean,
    default: false
  },
  
  // 资源分配
  resources: {
    // 分配的生产线
    production_lines: [{
      type: String,
      trim: true
    }],
    
    // 负责人/主管
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 操作员
    operators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    
    // 设备/机器
    equipment: [{
      name: String,
      id: String
    }]
  },
  
  // 进度跟踪
  progress: {
    // 总体进度百分比 (0-100)
    overall_percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    // 总订单数量
    total_quantity: {
      type: Number,
      default: 0
    },
    
    // 已完成数量
    completed_quantity: {
      type: Number,
      default: 0
    },
    
    // 在产数量
    in_progress_quantity: {
      type: Number,
      default: 0
    }
  },
  
  // 质量检查
  quality: {
    // 合格率 (%)
    pass_rate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    
    // 质检员
    inspector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 质检备注
    inspection_notes: {
      type: String
    }
  },
  
  // 物料清单
  bom_items: [{
    material_code: String,
    material_name: String,
    required_quantity: Number,
    allocated_quantity: Number,
    unit: String
  }],
  
  // 生产备注
  production_notes: {
    type: String
  },
  
  // 技术要求
  technical_requirements: {
    type: String
  },
  
  // 特殊说明
  special_instructions: {
    type: String
  },
  
  // 延期原因（如果有）
  delay_reason: {
    type: String
  },
  
  // 创建人
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 生产日志
  production_logs: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      required: true
    },
    description: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
  
}, {
  timestamps: true
});

// 自动生成生产订单编号
productionOrderSchema.pre('save', async function(next) {
  if (!this.productionOrderNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('ProductionOrder').countDocuments();
    this.productionOrderNumber = `PO-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// 计算生产进度
productionOrderSchema.methods.calculateProgress = function() {
  if (!this.productionItems || this.productionItems.length === 0) {
    this.progress.overall_percentage = 0;
    this.progress.total_quantity = 0;
    this.progress.completed_quantity = 0;
    this.progress.in_progress_quantity = 0;
    return;
  }
  
  // 计算总数量
  this.progress.total_quantity = this.productionItems.reduce((sum, item) => 
    sum + (item.ordered_quantity || 0), 0
  );
  
  // 计算已完成数量
  this.progress.completed_quantity = this.productionItems.reduce((sum, item) => 
    sum + (item.qualified_quantity || 0), 0
  );
  
  // 计算在产数量
  this.progress.in_progress_quantity = this.productionItems.reduce((sum, item) => 
    sum + ((item.produced_quantity || 0) - (item.qualified_quantity || 0) - (item.defective_quantity || 0)), 0
  );
  
  // 计算总体进度百分比
  if (this.progress.total_quantity > 0) {
    this.progress.overall_percentage = Math.round(
      (this.progress.completed_quantity / this.progress.total_quantity) * 100
    );
  } else {
    this.progress.overall_percentage = 0;
  }
};

// 计算合格率
productionOrderSchema.methods.calculateQualityRate = function() {
  if (!this.productionItems || this.productionItems.length === 0) {
    this.quality.pass_rate = 100;
    return;
  }
  
  const totalProduced = this.productionItems.reduce((sum, item) => 
    sum + (item.produced_quantity || 0), 0
  );
  
  const totalQualified = this.productionItems.reduce((sum, item) => 
    sum + (item.qualified_quantity || 0), 0
  );
  
  if (totalProduced > 0) {
    this.quality.pass_rate = Math.round((totalQualified / totalProduced) * 100);
  } else {
    this.quality.pass_rate = 100;
  }
};

// 添加生产日志
productionOrderSchema.methods.addLog = function(action, description, userId) {
  this.production_logs.push({
    action,
    description,
    user: userId,
    timestamp: new Date()
  });
};

// 索引
productionOrderSchema.index({ productionOrderNumber: 1 });
productionOrderSchema.index({ salesOrder: 1 });
productionOrderSchema.index({ status: 1 });
productionOrderSchema.index({ 'schedule.plannedStartDate': 1 });
productionOrderSchema.index({ 'schedule.plannedEndDate': 1 });
productionOrderSchema.index({ priority: 1 });

module.exports = mongoose.model('ProductionOrder', productionOrderSchema);


