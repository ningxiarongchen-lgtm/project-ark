const mongoose = require('mongoose');

const workOrderSchema = new mongoose.Schema({
  // 工单编号
  work_order_number: {
    type: String,
    required: [true, '请提供工单编号'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // 关联生产订单
  production_order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionOrder',
    required: true
  },
  
  // 关联销售订单（可选）
  sales_order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder'
  },
  
  // 产品信息
  product: {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Actuator',
      required: true
    },
    model_base: String,
    version: String
  },
  
  // 工序信息（来自工艺路线）
  operation: {
    sequence: {
      type: Number,
      required: true
    },
    operation_code: String,
    operation_name: String,
    operation_type: String,
    description: String
  },
  
  // 工作中心
  work_center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkCenter',
    required: true
  },
  
  // 计划信息
  plan: {
    // 计划数量
    planned_quantity: {
      type: Number,
      required: true,
      min: 1
    },
    
    // 计划开始时间
    planned_start_time: {
      type: Date,
      required: true
    },
    
    // 计划完成时间
    planned_end_time: {
      type: Date,
      required: true
    },
    
    // 计划工时（分钟）
    planned_duration: {
      type: Number,
      min: 0
    }
  },
  
  // 实际执行信息
  actual: {
    // 实际数量
    actual_quantity: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // 合格数量
    good_quantity: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // 不合格数量
    reject_quantity: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // 返工数量
    rework_quantity: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // 报废数量
    scrap_quantity: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // 实际开始时间
    actual_start_time: {
      type: Date
    },
    
    // 实际完成时间
    actual_end_time: {
      type: Date
    },
    
    // 实际工时（分钟）
    actual_duration: {
      type: Number,
      min: 0
    }
  },
  
  // 工单状态
  status: {
    type: String,
    enum: {
      values: ['待发布', '已发布', '已接收', '进行中', '暂停', '待质检', '已完成', '已关闭', '已取消'],
      message: '无效的工单状态'
    },
    default: '待发布',
    required: true
  },
  
  // 是否需要质检
  requires_quality_check: {
    type: Boolean,
    default: false
  },
  
  // 质检类型
  quality_check_type: {
    type: String,
    enum: ['首件检验', '过程检验', '完工检验', '抽检', '全检']
  },
  
  // 关联的质检任务
  quality_check: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QualityCheck'
  },
  
  // 优先级
  priority: {
    type: String,
    enum: ['低', '正常', '高', '紧急'],
    default: '正常'
  },
  
  // 分配的操作工
  assigned_operators: [{
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assigned_at: {
      type: Date,
      default: Date.now
    },
    role: String
  }],
  
  // 工序执行记录
  execution_logs: [{
    // 操作类型
    action: {
      type: String,
      enum: ['开始', '暂停', '恢复', '完成', '报告进度', '质检', '其他'],
      required: true
    },
    
    // 操作人
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 操作时间
    timestamp: {
      type: Date,
      default: Date.now
    },
    
    // 完成数量
    completed_quantity: {
      type: Number,
      min: 0
    },
    
    // 合格数量
    good_quantity: {
      type: Number,
      min: 0
    },
    
    // 不良数量
    reject_quantity: {
      type: Number,
      min: 0
    },
    
    // 备注
    notes: String
  }],
  
  // 质量检查记录
  quality_checks: [{
    check_point: String,
    check_result: {
      type: String,
      enum: ['合格', '不合格', '待检'],
      default: '待检'
    },
    checked_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checked_at: Date,
    remarks: String
  }],
  
  // 异常记录
  issues: [{
    issue_type: {
      type: String,
      enum: ['质量问题', '设备故障', '物料短缺', '工具缺失', '其他']
    },
    description: String,
    reported_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reported_at: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolved_at: Date,
    resolution: String
  }],
  
  // 物料消耗
  material_consumption: [{
    material_code: String,
    material_name: String,
    planned_quantity: Number,
    actual_quantity: Number,
    unit: String
  }],
  
  // 工具使用
  tool_usage: [{
    tool_code: String,
    tool_name: String,
    usage_time: Number, // 分钟
    condition: String
  }],
  
  // 备注
  notes: {
    type: String,
    trim: true
  },
  
  // 创建人
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true
});

// 索引
workOrderSchema.index({ work_order_number: 1 });
workOrderSchema.index({ production_order: 1 });
workOrderSchema.index({ sales_order: 1 });
workOrderSchema.index({ 'product.product_id': 1 });
workOrderSchema.index({ work_center: 1 });
workOrderSchema.index({ status: 1 });
workOrderSchema.index({ priority: 1 });
workOrderSchema.index({ 'plan.planned_start_time': 1 });
workOrderSchema.index({ 'assigned_operators.operator': 1 });

// 自动生成工单编号
workOrderSchema.pre('save', async function(next) {
  if (!this.work_order_number) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    
    // 查找今天的最后一个工单编号
    const lastWorkOrder = await mongoose.model('WorkOrder')
      .findOne({ work_order_number: new RegExp(`^WO-${year}${month}${day}`) })
      .sort({ work_order_number: -1 });
    
    let sequence = 1;
    if (lastWorkOrder) {
      const lastSequence = parseInt(lastWorkOrder.work_order_number.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.work_order_number = `WO-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
  }
  
  next();
});

// 虚拟字段：完成率
workOrderSchema.virtual('completion_rate').get(function() {
  if (this.plan.planned_quantity === 0) return 0;
  return (this.actual.actual_quantity / this.plan.planned_quantity) * 100;
});

// 虚拟字段：合格率
workOrderSchema.virtual('pass_rate').get(function() {
  if (this.actual.actual_quantity === 0) return 0;
  return (this.actual.good_quantity / this.actual.actual_quantity) * 100;
});

// 虚拟字段：是否延期
workOrderSchema.virtual('is_delayed').get(function() {
  if (this.status === '已完成' || this.status === '已关闭') {
    return this.actual.actual_end_time > this.plan.planned_end_time;
  }
  return new Date() > this.plan.planned_end_time && this.status !== '已完成';
});

// 虚拟字段：剩余数量
workOrderSchema.virtual('remaining_quantity').get(function() {
  return this.plan.planned_quantity - this.actual.actual_quantity;
});

// 实例方法：开始工单
workOrderSchema.methods.startWorkOrder = function(operatorId) {
  if (this.status !== '已发布' && this.status !== '已接收') {
    throw new Error('只有已发布或已接收的工单可以开始');
  }
  
  this.status = '进行中';
  this.actual.actual_start_time = new Date();
  
  this.execution_logs.push({
    action: '开始',
    operator: operatorId,
    timestamp: new Date()
  });
  
  return this.save();
};

// 实例方法：暂停工单
workOrderSchema.methods.pauseWorkOrder = function(operatorId, reason) {
  if (this.status !== '进行中') {
    throw new Error('只有进行中的工单可以暂停');
  }
  
  this.status = '暂停';
  
  this.execution_logs.push({
    action: '暂停',
    operator: operatorId,
    timestamp: new Date(),
    notes: reason
  });
  
  return this.save();
};

// 实例方法：恢复工单
workOrderSchema.methods.resumeWorkOrder = function(operatorId) {
  if (this.status !== '暂停') {
    throw new Error('只有暂停的工单可以恢复');
  }
  
  this.status = '进行中';
  
  this.execution_logs.push({
    action: '恢复',
    operator: operatorId,
    timestamp: new Date()
  });
  
  return this.save();
};

// 实例方法：报告进度
workOrderSchema.methods.reportProgress = function(operatorId, data) {
  const { completed_quantity, good_quantity, reject_quantity } = data;
  
  this.actual.actual_quantity += completed_quantity || 0;
  this.actual.good_quantity += good_quantity || 0;
  this.actual.reject_quantity += reject_quantity || 0;
  
  this.execution_logs.push({
    action: '报告进度',
    operator: operatorId,
    timestamp: new Date(),
    completed_quantity,
    good_quantity,
    reject_quantity,
    notes: data.notes
  });
  
  // 如果完成了所有数量，自动完成工单
  if (this.actual.actual_quantity >= this.plan.planned_quantity) {
    this.status = '已完成';
    this.actual.actual_end_time = new Date();
    
    // 计算实际工时
    if (this.actual.actual_start_time) {
      this.actual.actual_duration = Math.round(
        (this.actual.actual_end_time - this.actual.actual_start_time) / 60000
      );
    }
  }
  
  return this.save();
};

// 实例方法：完成工单
workOrderSchema.methods.completeWorkOrder = function(operatorId) {
  if (this.status !== '进行中' && this.status !== '暂停') {
    throw new Error('只有进行中或暂停的工单可以完成');
  }
  
  // 如果需要质检，状态变为待质检；否则变为已完成
  if (this.requires_quality_check) {
    this.status = '待质检';
  } else {
    this.status = '已完成';
  }
  
  this.actual.actual_end_time = new Date();
  
  // 计算实际工时
  if (this.actual.actual_start_time) {
    this.actual.actual_duration = Math.round(
      (this.actual.actual_end_time - this.actual.actual_start_time) / 60000
    );
  }
  
  this.execution_logs.push({
    action: this.requires_quality_check ? '完成(待质检)' : '完成',
    operator: operatorId,
    timestamp: new Date()
  });
  
  return this.save();
};

// 实例方法：报告异常
workOrderSchema.methods.reportIssue = function(operatorId, issueData) {
  this.issues.push({
    ...issueData,
    reported_by: operatorId,
    reported_at: new Date()
  });
  
  return this.save();
};

// 静态方法：按工作中心查询工单
workOrderSchema.statics.findByWorkCenter = async function(workCenterId, status) {
  const query = { work_center: workCenterId };
  if (status) query.status = status;
  
  return await this.find(query)
    .populate('product.product_id', 'model_base version')
    .populate('work_center', 'code name')
    .populate('assigned_operators.operator', 'full_name phone')
    .sort({ 'plan.planned_start_time': 1 });
};

// 静态方法：按操作工查询工单
workOrderSchema.statics.findByOperator = async function(operatorId, status) {
  const query = { 'assigned_operators.operator': operatorId };
  if (status) query.status = status;
  
  return await this.find(query)
    .populate('product.product_id', 'model_base version')
    .populate('work_center', 'code name')
    .sort({ 'plan.planned_start_time': 1 });
};

// 静态方法：获取工单统计
workOrderSchema.statics.getStatistics = async function(filters = {}) {
  const matchStage = {};
  if (filters.work_center) matchStage.work_center = mongoose.Types.ObjectId(filters.work_center);
  if (filters.status) matchStage.status = filters.status;
  if (filters.start_date) {
    matchStage['plan.planned_start_time'] = { 
      $gte: new Date(filters.start_date) 
    };
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', '待发布'] }, 1, 0] }
        },
        released: {
          $sum: { $cond: [{ $eq: ['$status', '已发布'] }, 1, 0] }
        },
        in_progress: {
          $sum: { $cond: [{ $eq: ['$status', '进行中'] }, 1, 0] }
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', '已完成'] }, 1, 0] }
        },
        avgCompletionRate: {
          $avg: {
            $cond: [
              { $eq: ['$plan.planned_quantity', 0] },
              0,
              {
                $multiply: [
                  { $divide: ['$actual.actual_quantity', '$plan.planned_quantity'] },
                  100
                ]
              }
            ]
          }
        },
        avgPassRate: {
          $avg: {
            $cond: [
              { $eq: ['$actual.actual_quantity', 0] },
              0,
              {
                $multiply: [
                  { $divide: ['$actual.good_quantity', '$actual.actual_quantity'] },
                  100
                ]
              }
            ]
          }
        }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    total: 0,
    pending: 0,
    released: 0,
    in_progress: 0,
    completed: 0,
    avgCompletionRate: 0,
    avgPassRate: 0
  };
};

module.exports = mongoose.model('WorkOrder', workOrderSchema);

