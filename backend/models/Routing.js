const mongoose = require('mongoose');

const routingSchema = new mongoose.Schema({
  // 工艺路线编码
  code: {
    type: String,
    required: [true, '请提供工艺路线编码'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // 工艺路线名称
  name: {
    type: String,
    required: [true, '请提供工艺路线名称'],
    trim: true
  },
  
  // 关联产品（执行器）
  product: {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Actuator',
      required: true
    },
    model_base: String,
    version: String
  },
  
  // 版本号
  version: {
    type: String,
    default: '1.0',
    trim: true
  },
  
  // 状态
  status: {
    type: String,
    enum: {
      values: ['草稿', '审批中', '已发布', '已停用'],
      message: '无效的状态'
    },
    default: '草稿',
    required: true
  },
  
  // 工序列表
  operations: [{
    // 工序序号
    sequence: {
      type: Number,
      required: true,
      min: 1
    },
    
    // 工序编码
    operation_code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    
    // 工序名称
    operation_name: {
      type: String,
      required: true,
      trim: true
    },
    
    // 工序类型
    operation_type: {
      type: String,
      enum: ['装配', '机加工', '测试', '包装', '检验', '其他'],
      required: true
    },
    
    // 工序描述
    description: {
      type: String,
      trim: true
    },
    
    // 指定工作中心
    work_center: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkCenter',
      required: true
    },
    
    // 备选工作中心
    alternative_work_centers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkCenter'
    }],
    
    // 时间信息（分钟）
    timing: {
      // 准备时间
      setup_time: {
        type: Number,
        min: 0,
        default: 0
      },
      
      // 单件加工时间
      unit_time: {
        type: Number,
        min: 0,
        required: true
      },
      
      // 等待时间
      wait_time: {
        type: Number,
        min: 0,
        default: 0
      },
      
      // 移动时间
      move_time: {
        type: Number,
        min: 0,
        default: 0
      }
    },
    
    // 所需物料
    materials: [{
      material_code: String,
      material_name: String,
      quantity: Number,
      unit: String
    }],
    
    // 所需工具/夹具
    tools: [{
      tool_code: String,
      tool_name: String,
      quantity: Number
    }],
    
    // 质量检查点
    quality_checks: [{
      check_point: String,
      check_method: String,
      acceptance_criteria: String
    }],
    
    // 工艺参数
    process_parameters: [{
      parameter_name: String,
      target_value: String,
      tolerance: String,
      unit: String
    }],
    
    // 作业指导
    work_instructions: {
      type: String,
      trim: true
    },
    
    // 安全注意事项
    safety_notes: {
      type: String,
      trim: true
    },
    
    // 是否关键工序
    is_critical: {
      type: Boolean,
      default: false
    },
    
    // 是否允许并行
    allow_parallel: {
      type: Boolean,
      default: false
    },
    
    // 是否需要质检
    is_quality_check_required: {
      type: Boolean,
      default: false
    },
    
    // 质检类型
    quality_check_type: {
      type: String,
      enum: ['首件检验', '过程检验', '完工检验', '抽检', '全检'],
      default: '完工检验'
    },
    
    // 前置工序（依赖关系）
    prerequisites: [{
      type: Number // 引用工序序号
    }]
  }],
  
  // 总工时估算（分钟）
  total_time: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // 总成本估算
  total_cost: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // 适用批量范围
  batch_size: {
    min: {
      type: Number,
      min: 1,
      default: 1
    },
    max: {
      type: Number,
      min: 1
    }
  },
  
  // 审批信息
  approval: {
    // 审批状态
    status: {
      type: String,
      enum: ['待审批', '已批准', '已拒绝'],
      default: '待审批'
    },
    
    // 审批人
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 审批日期
    approval_date: {
      type: Date
    },
    
    // 审批意见
    comments: {
      type: String,
      trim: true
    }
  },
  
  // 发布信息
  release: {
    // 发布日期
    release_date: {
      type: Date
    },
    
    // 发布人
    released_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 生效日期
    effective_date: {
      type: Date
    }
  },
  
  // 创建人
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 最后修改人
  last_modified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 备注
  notes: {
    type: String,
    trim: true
  },
  
  // 是否激活
  is_active: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true
});

// 索引
routingSchema.index({ code: 1 });
routingSchema.index({ 'product.product_id': 1 });
routingSchema.index({ status: 1 });
routingSchema.index({ is_active: 1 });
routingSchema.index({ 'operations.work_center': 1 });

// 保存前验证和计算
routingSchema.pre('save', function(next) {
  // 按sequence排序工序
  this.operations.sort((a, b) => a.sequence - b.sequence);
  
  // 计算总工时
  let totalTime = 0;
  this.operations.forEach(op => {
    totalTime += op.timing.setup_time + 
                 op.timing.unit_time + 
                 op.timing.wait_time + 
                 op.timing.move_time;
  });
  this.total_time = totalTime;
  
  // 验证工序序号连续性
  for (let i = 0; i < this.operations.length; i++) {
    if (this.operations[i].sequence !== i + 1) {
      return next(new Error(`工序序号不连续，期望 ${i + 1}，实际 ${this.operations[i].sequence}`));
    }
  }
  
  // 验证前置工序的有效性
  const sequences = this.operations.map(op => op.sequence);
  for (const op of this.operations) {
    if (op.prerequisites && op.prerequisites.length > 0) {
      for (const prereq of op.prerequisites) {
        if (!sequences.includes(prereq)) {
          return next(new Error(`工序 ${op.sequence} 的前置工序 ${prereq} 不存在`));
        }
        if (prereq >= op.sequence) {
          return next(new Error(`工序 ${op.sequence} 的前置工序 ${prereq} 必须在其之前`));
        }
      }
    }
  }
  
  next();
});

// 虚拟字段：关键路径
routingSchema.virtual('critical_path').get(function() {
  return this.operations.filter(op => op.is_critical);
});

// 实例方法：获取指定工序
routingSchema.methods.getOperation = function(sequence) {
  return this.operations.find(op => op.sequence === sequence);
};

// 实例方法：获取下一道工序
routingSchema.methods.getNextOperation = function(currentSequence) {
  return this.operations.find(op => op.sequence === currentSequence + 1);
};

// 实例方法：获取可并行的工序
routingSchema.methods.getParallelOperations = function(sequence) {
  const operation = this.getOperation(sequence);
  if (!operation || !operation.allow_parallel) {
    return [];
  }
  
  // 查找具有相同前置工序的其他并行工序
  return this.operations.filter(op => 
    op.allow_parallel && 
    op.sequence !== sequence &&
    JSON.stringify(op.prerequisites) === JSON.stringify(operation.prerequisites)
  );
};

// 实例方法：检查工序依赖是否满足
routingSchema.methods.arePrerequisitesMet = function(sequence, completedSequences) {
  const operation = this.getOperation(sequence);
  if (!operation || !operation.prerequisites || operation.prerequisites.length === 0) {
    return true;
  }
  
  return operation.prerequisites.every(prereq => 
    completedSequences.includes(prereq)
  );
};

// 实例方法：计算批量的总工时
routingSchema.methods.calculateBatchTime = function(quantity) {
  let totalTime = 0;
  
  this.operations.forEach(op => {
    // 准备时间（一次性）+ 单件时间 * 数量 + 等待时间 + 移动时间
    totalTime += op.timing.setup_time + 
                 (op.timing.unit_time * quantity) +
                 op.timing.wait_time + 
                 op.timing.move_time;
  });
  
  return totalTime;
};

// 实例方法：发布工艺路线
routingSchema.methods.releaseRouting = function(userId) {
  this.status = '已发布';
  this.release.release_date = new Date();
  this.release.released_by = userId;
  this.release.effective_date = new Date();
  
  return this.save();
};

// 静态方法：根据产品查找工艺路线
routingSchema.statics.findByProduct = async function(productId) {
  return await this.find({
    'product.product_id': productId,
    is_active: true
  }).populate('operations.work_center', 'code name type')
    .populate('operations.alternative_work_centers', 'code name type')
    .populate('created_by', 'full_name phone')
    .sort({ version: -1 });
};

// 静态方法：获取已发布的工艺路线
routingSchema.statics.getReleasedRoutings = async function() {
  return await this.find({
    status: '已发布',
    is_active: true
  }).populate('product.product_id', 'model_base version')
    .populate('created_by', 'full_name phone')
    .sort({ createdAt: -1 });
};

// 静态方法：获取统计信息
routingSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        draft: {
          $sum: { $cond: [{ $eq: ['$status', '草稿'] }, 1, 0] }
        },
        released: {
          $sum: { $cond: [{ $eq: ['$status', '已发布'] }, 1, 0] }
        },
        avgOperations: { $avg: { $size: '$operations' } },
        avgTotalTime: { $avg: '$total_time' }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    total: 0,
    draft: 0,
    released: 0,
    avgOperations: 0,
    avgTotalTime: 0
  };
};

module.exports = mongoose.model('Routing', routingSchema);

