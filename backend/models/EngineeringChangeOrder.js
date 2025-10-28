const mongoose = require('mongoose');

const engineeringChangeOrderSchema = new mongoose.Schema({
  // ECO编号（自动生成）
  eco_number: {
    type: String,
    required: [true, '请提供ECO编号'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // ECO标题
  title: {
    type: String,
    required: [true, '请提供ECO标题'],
    trim: true
  },
  
  // 变更类型
  change_type: {
    type: String,
    enum: {
      values: [
        '设计变更',
        '纠正措施',
        '性能优化',
        '成本优化',
        '材料替换',
        '工艺改进',
        '安全改进',
        '客户要求',
        '其他'
      ],
      message: '无效的变更类型'
    },
    required: [true, '请提供变更类型']
  },
  
  // 优先级
  priority: {
    type: String,
    enum: {
      values: ['低', '中', '高', '紧急'],
      message: '无效的优先级'
    },
    default: '中',
    required: [true, '请提供优先级']
  },
  
  // 变更描述
  description: {
    type: String,
    required: [true, '请提供变更描述'],
    trim: true
  },
  
  // 变更原因/背景
  reason: {
    type: String,
    required: [true, '请提供变更原因'],
    trim: true
  },
  
  // 影响分析
  impact_analysis: {
    // 技术影响
    technical: {
      type: String,
      trim: true
    },
    
    // 质量影响
    quality: {
      type: String,
      trim: true
    },
    
    // 成本影响
    cost: {
      type: String,
      trim: true
    },
    
    // 交付影响
    delivery: {
      type: String,
      trim: true
    },
    
    // 库存影响
    inventory: {
      type: String,
      trim: true
    }
  },
  
  // 受影响的产品（关联Actuator）
  affected_products: [{
    actuator_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Actuator',
      required: true
    },
    // 产品型号快照
    model_base: {
      type: String,
      trim: true
    },
    // 当前版本
    current_version: {
      type: String,
      trim: true
    },
    // 新版本
    new_version: {
      type: String,
      trim: true
    },
    // 变更说明
    change_notes: {
      type: String,
      trim: true
    }
  }],
  
  // 变更详情
  change_details: {
    // 变更前
    before: {
      type: String,
      trim: true
    },
    
    // 变更后
    after: {
      type: String,
      trim: true
    },
    
    // 具体变更项
    changes: [{
      item: {
        type: String,
        trim: true
      },
      old_value: {
        type: String,
        trim: true
      },
      new_value: {
        type: String,
        trim: true
      },
      reason: {
        type: String,
        trim: true
      }
    }]
  },
  
  // 实施计划
  implementation: {
    // 计划开始日期
    planned_start_date: {
      type: Date
    },
    
    // 计划完成日期
    planned_completion_date: {
      type: Date
    },
    
    // 实际开始日期
    actual_start_date: {
      type: Date
    },
    
    // 实际完成日期
    actual_completion_date: {
      type: Date
    },
    
    // 实施负责人
    responsible_person: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 实施团队
    team_members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    
    // 实施步骤
    steps: [{
      sequence: {
        type: Number,
        required: true
      },
      description: {
        type: String,
        required: true,
        trim: true
      },
      responsible: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['待开始', '进行中', '已完成', '已取消'],
        default: '待开始'
      },
      completed_date: {
        type: Date
      },
      notes: {
        type: String,
        trim: true
      }
    }]
  },
  
  // 审批流程
  approval: {
    // 当前审批状态
    status: {
      type: String,
      enum: {
        values: ['草稿', '待审批', '审批中', '已批准', '已拒绝', '已取消'],
        message: '无效的审批状态'
      },
      default: '草稿',
      required: [true, '请提供审批状态']
    },
    
    // 发起人
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '请提供发起人']
    },
    
    // 发起日期
    initiated_date: {
      type: Date,
      default: Date.now
    },
    
    // 审批记录
    approvals: [{
      // 审批人
      approver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      
      // 审批角色
      role: {
        type: String,
        enum: ['技术审批', '质量审批', '生产审批', '财务审批', '管理审批'],
        required: true
      },
      
      // 审批顺序
      sequence: {
        type: Number,
        required: true
      },
      
      // 审批状态
      status: {
        type: String,
        enum: ['待审批', '已批准', '已拒绝', '已跳过'],
        default: '待审批'
      },
      
      // 审批日期
      approval_date: {
        type: Date
      },
      
      // 审批意见
      comments: {
        type: String,
        trim: true
      },
      
      // 附加条件
      conditions: {
        type: String,
        trim: true
      }
    }]
  },
  
  // 验证和测试
  validation: {
    // 是否需要测试
    requires_testing: {
      type: Boolean,
      default: false
    },
    
    // 测试计划
    test_plan: {
      type: String,
      trim: true
    },
    
    // 测试结果
    test_results: {
      type: String,
      trim: true
    },
    
    // 测试负责人
    test_responsible: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 测试完成日期
    test_completion_date: {
      type: Date
    }
  },
  
  // 相关文档和附件
  documents: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    
    type: {
      type: String,
      enum: ['图纸', '规范', '测试报告', '分析报告', '照片', '其他'],
      default: '其他'
    },
    
    file_url: {
      type: String,
      trim: true
    },
    
    description: {
      type: String,
      trim: true
    },
    
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 关联的其他ECO
  related_ecos: [{
    eco_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EngineeringChangeOrder'
    },
    relationship: {
      type: String,
      enum: ['前置', '后续', '相关', '替代'],
      default: '相关'
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // 成本估算
  cost_estimate: {
    // 设计成本
    design_cost: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // 材料成本变化
    material_cost_change: {
      type: Number,
      default: 0
    },
    
    // 工装成本
    tooling_cost: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // 测试成本
    testing_cost: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // 其他成本
    other_cost: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // 总成本
    total_cost: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // 预期节省（如果适用）
    expected_savings: {
      type: Number,
      default: 0
    },
    
    // 成本说明
    notes: {
      type: String,
      trim: true
    }
  },
  
  // 备注和跟踪
  notes: {
    type: String,
    trim: true
  },
  
  // 内部备注（不对外显示）
  internal_notes: {
    type: String,
    trim: true
  },
  
  // 关闭/完成信息
  closure: {
    // 是否已关闭
    is_closed: {
      type: Boolean,
      default: false
    },
    
    // 关闭日期
    closed_date: {
      type: Date
    },
    
    // 关闭原因
    closed_reason: {
      type: String,
      enum: ['成功实施', '取消', '合并到其他ECO', '不再需要'],
      trim: true
    },
    
    // 关闭说明
    closed_notes: {
      type: String,
      trim: true
    },
    
    // 关闭人
    closed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
  
}, {
  timestamps: true
});

// 索引优化
engineeringChangeOrderSchema.index({ eco_number: 1 });
engineeringChangeOrderSchema.index({ 'approval.status': 1 });
engineeringChangeOrderSchema.index({ 'approval.initiator': 1 });
engineeringChangeOrderSchema.index({ change_type: 1 });
engineeringChangeOrderSchema.index({ priority: 1 });
engineeringChangeOrderSchema.index({ 'affected_products.actuator_id': 1 });
engineeringChangeOrderSchema.index({ 'closure.is_closed': 1 });
engineeringChangeOrderSchema.index({ createdAt: -1 });

// 自动生成ECO编号
engineeringChangeOrderSchema.pre('save', async function(next) {
  if (!this.eco_number) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // 查找本月最后一个ECO编号
    const lastEco = await mongoose.model('EngineeringChangeOrder')
      .findOne({ eco_number: new RegExp(`^ECO-${year}${month}`) })
      .sort({ eco_number: -1 });
    
    let sequence = 1;
    if (lastEco) {
      const lastSequence = parseInt(lastEco.eco_number.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.eco_number = `ECO-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
  
  // 计算总成本
  if (this.cost_estimate) {
    this.cost_estimate.total_cost = 
      (this.cost_estimate.design_cost || 0) +
      (this.cost_estimate.material_cost_change || 0) +
      (this.cost_estimate.tooling_cost || 0) +
      (this.cost_estimate.testing_cost || 0) +
      (this.cost_estimate.other_cost || 0);
  }
  
  next();
});

// 虚拟字段：是否可以编辑
engineeringChangeOrderSchema.virtual('is_editable').get(function() {
  return this.approval.status === '草稿' || this.approval.status === '已拒绝';
});

// 虚拟字段：是否正在审批中
engineeringChangeOrderSchema.virtual('is_in_approval').get(function() {
  return this.approval.status === '待审批' || this.approval.status === '审批中';
});

// 实例方法：提交审批
engineeringChangeOrderSchema.methods.submitForApproval = function() {
  if (this.approval.status !== '草稿' && this.approval.status !== '已拒绝') {
    throw new Error('只有草稿或已拒绝状态的ECO可以提交审批');
  }
  
  this.approval.status = '待审批';
  this.approval.initiated_date = new Date();
  
  return this.save();
};

// 实例方法：添加审批意见
engineeringChangeOrderSchema.methods.addApproval = function(approverId, role, status, comments, conditions) {
  const approval = {
    approver: approverId,
    role: role,
    sequence: this.approval.approvals.length + 1,
    status: status,
    approval_date: new Date(),
    comments: comments,
    conditions: conditions
  };
  
  this.approval.approvals.push(approval);
  
  // 如果有拒绝，整体状态改为已拒绝
  if (status === '已拒绝') {
    this.approval.status = '已拒绝';
  } else if (status === '已批准') {
    // 检查是否所有必需的审批都已完成
    const allApproved = this.approval.approvals.every(
      app => app.status === '已批准' || app.status === '已跳过'
    );
    
    if (allApproved) {
      this.approval.status = '已批准';
    } else {
      this.approval.status = '审批中';
    }
  }
  
  return this.save();
};

// 实例方法：关闭ECO
engineeringChangeOrderSchema.methods.closeEco = function(userId, reason, notes) {
  this.closure.is_closed = true;
  this.closure.closed_date = new Date();
  this.closure.closed_reason = reason;
  this.closure.closed_notes = notes;
  this.closure.closed_by = userId;
  
  return this.save();
};

// 静态方法：获取待审批的ECO
engineeringChangeOrderSchema.statics.getPendingApprovals = async function(approverId) {
  return await this.find({
    'approval.status': { $in: ['待审批', '审批中'] },
    'approval.approvals': {
      $elemMatch: {
        approver: approverId,
        status: '待审批'
      }
    }
  }).populate('approval.initiator', 'username')
    .populate('affected_products.actuator_id', 'model_base version')
    .sort({ priority: -1, createdAt: -1 });
};

// 静态方法：获取统计信息
engineeringChangeOrderSchema.statics.getStatistics = async function(filters = {}) {
  const stats = await this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        draft: {
          $sum: { $cond: [{ $eq: ['$approval.status', '草稿'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $in: ['$approval.status', ['待审批', '审批中']] }, 1, 0] }
        },
        approved: {
          $sum: { $cond: [{ $eq: ['$approval.status', '已批准'] }, 1, 0] }
        },
        rejected: {
          $sum: { $cond: [{ $eq: ['$approval.status', '已拒绝'] }, 1, 0] }
        },
        closed: {
          $sum: { $cond: ['$closure.is_closed', 1, 0] }
        }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    total: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    closed: 0
  };
};

module.exports = mongoose.model('EngineeringChangeOrder', engineeringChangeOrderSchema);

