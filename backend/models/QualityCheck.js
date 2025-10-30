const mongoose = require('mongoose');

const qualityCheckSchema = new mongoose.Schema({
  // 质检编号
  qc_number: {
    type: String,
    required: [true, '请提供质检编号'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // 关联工单
  work_order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder',
    required: true
  },
  
  // 关联生产订单
  production_order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionOrder'
  },
  
  // 产品信息
  product: {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Actuator'
    },
    model_base: String,
    version: String
  },
  
  // 工序信息
  operation: {
    sequence: Number,
    operation_code: String,
    operation_name: String,
    operation_type: String
  },
  
  // 检验类型
  inspection_type: {
    type: String,
    enum: {
      values: ['首件检验', '过程检验', '完工检验', '抽检', '全检'],
      message: '无效的检验类型'
    },
    default: '完工检验',
    required: true
  },
  
  // 检验标准
  inspection_standard: {
    type: String,
    trim: true
  },
  
  // 检验状态
  status: {
    type: String,
    enum: {
      values: ['待检', '检验中', '已完成', '已取消'],
      message: '无效的检验状态'
    },
    default: '待检',
    required: true
  },
  
  // 检验数量
  quantity: {
    // 送检数量
    submitted_quantity: {
      type: Number,
      required: true,
      min: 0
    },
    
    // 抽检数量
    sample_quantity: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // 合格数量
    accepted_quantity: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // 不合格数量
    rejected_quantity: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // 让步接收数量
    concession_quantity: {
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
    }
  },
  
  // 检验结果
  result: {
    type: String,
    enum: ['合格', '不合格', '让步接收', '待判定'],
    default: '待判定'
  },
  
  // 检验项目
  inspection_items: [{
    // 检验项目名称
    item_name: {
      type: String,
      required: true,
      trim: true
    },
    
    // 检验方法
    inspection_method: {
      type: String,
      trim: true
    },
    
    // 技术要求/规格
    specification: {
      type: String,
      trim: true
    },
    
    // 测量工具
    measuring_tool: {
      type: String,
      trim: true
    },
    
    // 实测值
    measured_value: {
      type: String,
      trim: true
    },
    
    // 判定结果
    result: {
      type: String,
      enum: ['合格', '不合格', '无需检验'],
      default: '合格'
    },
    
    // 备注
    notes: String
  }],
  
  // 不合格项
  defects: [{
    // 缺陷类型
    defect_type: {
      type: String,
      enum: ['尺寸偏差', '外观缺陷', '性能不达标', '功能异常', '材料问题', '装配错误', '其他'],
      required: true
    },
    
    // 缺陷描述
    description: {
      type: String,
      required: true,
      trim: true
    },
    
    // 缺陷等级
    severity: {
      type: String,
      enum: ['严重', '主要', '次要'],
      default: '主要'
    },
    
    // 不合格数量
    quantity: {
      type: Number,
      min: 1,
      default: 1
    },
    
    // 处理方式
    disposition: {
      type: String,
      enum: ['返工', '返修', '让步接收', '报废', '待定'],
      default: '待定'
    },
    
    // 照片URL
    photos: [String],
    
    // 备注
    notes: String
  }],
  
  // 检验员信息
  inspector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 检验时间
  inspection_time: {
    // 开始检验时间
    start_time: {
      type: Date
    },
    
    // 完成检验时间
    end_time: {
      type: Date
    },
    
    // 检验用时（分钟）
    duration: {
      type: Number,
      min: 0
    }
  },
  
  // 检验设备/工具
  equipment_used: [{
    name: String,
    model: String,
    calibration_date: Date,
    calibration_status: {
      type: String,
      enum: ['合格', '过期'],
      default: '合格'
    }
  }],
  
  // 检验环境
  environment: {
    temperature: Number,      // 温度（℃）
    humidity: Number,         // 湿度（%）
    notes: String
  },
  
  // 审核信息
  review: {
    // 是否需要审核
    required: {
      type: Boolean,
      default: false
    },
    
    // 审核人
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 审核状态
    status: {
      type: String,
      enum: ['待审核', '已通过', '已驳回'],
      default: '待审核'
    },
    
    // 审核日期
    review_date: {
      type: Date
    },
    
    // 审核意见
    comments: String
  },
  
  // 处理措施
  corrective_actions: [{
    // 措施描述
    action: {
      type: String,
      required: true,
      trim: true
    },
    
    // 负责人
    responsible: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 完成期限
    due_date: {
      type: Date
    },
    
    // 完成状态
    status: {
      type: String,
      enum: ['待处理', '处理中', '已完成', '已验证'],
      default: '待处理'
    },
    
    // 完成日期
    completion_date: {
      type: Date
    },
    
    // 验证结果
    verification_result: String
  }],
  
  // 备注
  notes: {
    type: String,
    trim: true
  },
  
  // 附件
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 创建人
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true
});

// 索引
qualityCheckSchema.index({ qc_number: 1 });
qualityCheckSchema.index({ work_order: 1 });
qualityCheckSchema.index({ production_order: 1 });
qualityCheckSchema.index({ status: 1 });
qualityCheckSchema.index({ result: 1 });
qualityCheckSchema.index({ inspector: 1 });
qualityCheckSchema.index({ createdAt: -1 });

// 自动生成质检编号
qualityCheckSchema.pre('save', async function(next) {
  if (!this.qc_number) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    
    // 查找今天的最后一个质检编号
    const lastQC = await mongoose.model('QualityCheck')
      .findOne({ qc_number: new RegExp(`^QC-${year}${month}${day}`) })
      .sort({ qc_number: -1 });
    
    let sequence = 1;
    if (lastQC) {
      const lastSequence = parseInt(lastQC.qc_number.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.qc_number = `QC-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
  }
  
  next();
});

// 虚拟字段：合格率
qualityCheckSchema.virtual('pass_rate').get(function() {
  const total = this.quantity.submitted_quantity || 0;
  if (total === 0) return 0;
  const accepted = this.quantity.accepted_quantity || 0;
  return Math.round((accepted / total) * 100);
});

// 虚拟字段：不合格率
qualityCheckSchema.virtual('defect_rate').get(function() {
  const total = this.quantity.submitted_quantity || 0;
  if (total === 0) return 0;
  const rejected = this.quantity.rejected_quantity || 0;
  return Math.round((rejected / total) * 100);
});

// 虚拟字段：是否延期
qualityCheckSchema.virtual('is_overdue').get(function() {
  if (this.status === '已完成' || this.status === '已取消') return false;
  // 如果超过24小时未完成，视为延期
  const createdTime = this.createdAt.getTime();
  const now = Date.now();
  const hours = (now - createdTime) / (1000 * 60 * 60);
  return hours > 24;
});

// 实例方法：开始检验
qualityCheckSchema.methods.startInspection = function(inspectorId) {
  if (this.status !== '待检') {
    throw new Error('只有待检状态的质检任务可以开始');
  }
  
  this.status = '检验中';
  this.inspector = inspectorId;
  this.inspection_time.start_time = new Date();
  
  return this.save();
};

// 实例方法：完成检验
qualityCheckSchema.methods.completeInspection = function(data) {
  if (this.status !== '检验中') {
    throw new Error('只有检验中的质检任务可以完成');
  }
  
  // 更新检验数量
  if (data.quantity) {
    Object.assign(this.quantity, data.quantity);
  }
  
  // 判定结果
  if (this.quantity.rejected_quantity > 0) {
    this.result = '不合格';
  } else if (this.quantity.concession_quantity > 0) {
    this.result = '让步接收';
  } else {
    this.result = '合格';
  }
  
  this.status = '已完成';
  this.inspection_time.end_time = new Date();
  
  // 计算检验用时
  if (this.inspection_time.start_time) {
    this.inspection_time.duration = Math.round(
      (this.inspection_time.end_time - this.inspection_time.start_time) / 60000
    );
  }
  
  return this.save();
};

// 实例方法：添加不合格项
qualityCheckSchema.methods.addDefect = function(defectData) {
  this.defects.push(defectData);
  this.result = '不合格';
  return this.save();
};

// 实例方法：添加纠正措施
qualityCheckSchema.methods.addCorrectiveAction = function(actionData) {
  this.corrective_actions.push(actionData);
  return this.save();
};

// 静态方法：按检验员查询
qualityCheckSchema.statics.findByInspector = async function(inspectorId, status) {
  const query = { inspector: inspectorId };
  if (status) query.status = status;
  
  return await this.find(query)
    .populate('work_order', 'work_order_number status')
    .populate('product.product_id', 'model_base version')
    .populate('inspector', 'full_name phone')
    .sort({ createdAt: -1 });
};

// 静态方法：获取待检列表
qualityCheckSchema.statics.getPendingInspections = async function(filters = {}) {
  const query = { status: { $in: ['待检', '检验中'] } };
  
  if (filters.inspector) {
    query.inspector = filters.inspector;
  }
  
  if (filters.inspection_type) {
    query.inspection_type = filters.inspection_type;
  }
  
  return await this.find(query)
    .populate('work_order', 'work_order_number')
    .populate('production_order', 'productionOrderNumber')
    .populate('product.product_id', 'model_base version')
    .populate('inspector', 'full_name phone')
    .sort({ createdAt: 1 });
};

// 静态方法：获取统计信息
qualityCheckSchema.statics.getStatistics = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.start_date) {
    matchStage.createdAt = { $gte: new Date(filters.start_date) };
  }
  if (filters.end_date) {
    matchStage.createdAt = { 
      ...matchStage.createdAt,
      $lte: new Date(filters.end_date) 
    };
  }
  if (filters.inspector) {
    matchStage.inspector = mongoose.Types.ObjectId(filters.inspector);
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', '待检'] }, 1, 0] }
        },
        in_progress: {
          $sum: { $cond: [{ $eq: ['$status', '检验中'] }, 1, 0] }
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', '已完成'] }, 1, 0] }
        },
        passed: {
          $sum: { $cond: [{ $eq: ['$result', '合格'] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$result', '不合格'] }, 1, 0] }
        },
        concession: {
          $sum: { $cond: [{ $eq: ['$result', '让步接收'] }, 1, 0] }
        },
        totalSubmitted: { $sum: '$quantity.submitted_quantity' },
        totalAccepted: { $sum: '$quantity.accepted_quantity' },
        totalRejected: { $sum: '$quantity.rejected_quantity' },
        avgDuration: { $avg: '$inspection_time.duration' }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      passed: 0,
      failed: 0,
      concession: 0,
      totalSubmitted: 0,
      totalAccepted: 0,
      totalRejected: 0,
      avgDuration: 0,
      passRate: 0,
      defectRate: 0
    };
  }
  
  const result = stats[0];
  
  // 计算合格率和不良率
  if (result.totalSubmitted > 0) {
    result.passRate = Math.round((result.totalAccepted / result.totalSubmitted) * 100);
    result.defectRate = Math.round((result.totalRejected / result.totalSubmitted) * 100);
  } else {
    result.passRate = 0;
    result.defectRate = 0;
  }
  
  return result;
};

// 静态方法：获取不良原因分析
qualityCheckSchema.statics.getDefectAnalysis = async function(filters = {}) {
  const matchStage = { result: '不合格' };
  
  if (filters.start_date) {
    matchStage.createdAt = { $gte: new Date(filters.start_date) };
  }
  if (filters.end_date) {
    matchStage.createdAt = { 
      ...matchStage.createdAt,
      $lte: new Date(filters.end_date) 
    };
  }
  
  const analysis = await this.aggregate([
    { $match: matchStage },
    { $unwind: '$defects' },
    {
      $group: {
        _id: '$defects.defect_type',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$defects.quantity' }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  return analysis;
};

module.exports = mongoose.model('QualityCheck', qualityCheckSchema);

