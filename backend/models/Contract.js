const mongoose = require('mongoose');

/**
 * 合同管理模型
 * 统一管理销售合同和采购合同
 * 商务工程师的合同管理中心
 */
const contractSchema = new mongoose.Schema({
  // 合同编号
  contract_number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // 合同类型
  contract_type: {
    type: String,
    required: true,
    enum: ['销售合同', '采购合同'],
    trim: true
  },
  
  // ========== 关联信息 ==========
  // 关联的项目（销售合同必填）
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  
  // 项目信息快照
  project_snapshot: {
    project_number: String,
    project_name: String,
    client_name: String,
    client_company: String
  },
  
  // 关联的采购订单（采购合同必填）
  purchase_order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
  },
  
  // 采购订单信息快照
  purchase_order_snapshot: {
    order_number: String,
    supplier_name: String,
    total_amount: Number
  },
  
  // ========== 合同基本信息 ==========
  // 合同名称
  contract_name: {
    type: String,
    required: true,
    trim: true
  },
  
  // 合同金额
  contract_amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // 币种
  currency: {
    type: String,
    default: 'CNY',
    enum: ['CNY', 'USD', 'EUR', 'JPY', 'OTHER']
  },
  
  // 签订日期
  signing_date: {
    type: Date
  },
  
  // 生效日期
  effective_date: {
    type: Date
  },
  
  // 到期日期
  expiry_date: {
    type: Date
  },
  
  // ========== 对方信息 ==========
  // 销售合同：客户信息；采购合同：供应商信息
  counterparty: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    company: {
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
    contact_email: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  
  // ========== 合同状态 ==========
  status: {
    type: String,
    required: true,
    enum: [
      '待盖章',         // 待商务工程师盖章
      '已盖章',         // 商务工程师已盖章（Active）
      '已驳回',         // 商务工程师驳回
      '已作废'          // 合同作废
    ],
    default: '待盖章'
  },
  
  // ========== 合同文件 ==========
  // 草稿文件（发起人上传）
  draft_file: {
    file_name: String,
    file_url: String,
    objectId: String,
    file_size: Number,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // 盖章版文件（商务工程师上传）
  sealed_file: {
    file_name: String,
    file_url: String,
    objectId: String,
    file_size: Number,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // 文件版本历史
  file_history: [{
    version_type: {
      type: String,
      enum: ['草稿', '盖章版'],
      required: true
    },
    file_name: String,
    file_url: String,
    objectId: String,
    file_size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  
  // ========== 人员信息 ==========
  // 发起人（销售经理或采购员）
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 提交到合同中心的时间
  submitted_at: {
    type: Date,
    default: Date.now
  },
  
  // 商务工程师（处理人）
  business_engineer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 商务工程师接单时间
  accepted_at: {
    type: Date
  },
  
  // 商务工程师盖章完成时间
  sealed_at: {
    type: Date
  },
  
  // ========== 审批信息 ==========
  // 审批状态
  approval_status: {
    type: String,
    enum: ['待审批', '已通过', '已驳回'],
    default: '待审批'
  },
  
  // 审批意见
  approval_comments: {
    type: String,
    trim: true
  },
  
  // 驳回原因
  rejection_reason: {
    type: String,
    trim: true
  },
  
  // ========== 付款信息 ==========
  payment_terms: {
    // 付款方式
    method: {
      type: String,
      enum: ['预付款+尾款', '货到付款', '月结', '其他'],
      trim: true
    },
    
    // 预付款比例
    advance_payment_ratio: {
      type: Number,
      min: 0,
      max: 100
    },
    
    // 预付款金额
    advance_payment_amount: {
      type: Number,
      min: 0
    },
    
    // 预付款状态
    advance_payment_status: {
      type: String,
      enum: ['未支付', '已支付', '部分支付'],
      default: '未支付'
    },
    
    // 预付款到账日期
    advance_payment_date: {
      type: Date
    },
    
    // 尾款金额
    final_payment_amount: {
      type: Number,
      min: 0
    },
    
    // 尾款状态
    final_payment_status: {
      type: String,
      enum: ['未支付', '已支付'],
      default: '未支付'
    },
    
    // 尾款到账日期
    final_payment_date: {
      type: Date
    }
  },
  
  // ========== 交付信息 ==========
  delivery_info: {
    // 交付地址
    delivery_address: {
      type: String,
      trim: true
    },
    
    // 交付日期
    delivery_date: {
      type: Date
    },
    
    // 交付方式
    delivery_method: {
      type: String,
      enum: ['物流', '快递', '自提', '其他'],
      trim: true
    },
    
    // 收货联系人
    contact_person: {
      type: String,
      trim: true
    },
    
    // 收货联系电话
    contact_phone: {
      type: String,
      trim: true
    }
  },
  
  // ========== 备注和附加信息 ==========
  description: {
    type: String,
    trim: true
  },
  
  notes: {
    type: String,
    trim: true
  },
  
  internal_notes: {
    type: String,
    trim: true
  },
  
  // ========== 跟进记录 ==========
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
      enum: ['状态更新', '文件上传', '审批意见', '付款确认', '其他'],
      default: '状态更新'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    user_name: String,
    user_role: String
  }],
  
  // ========== 操作历史 ==========
  operation_history: [{
    operation_type: {
      type: String,
      required: true,
      enum: [
        'created',              // 创建合同
        'submitted',            // 提交审批
        'accepted',             // 商务接单
        'sealed',               // 完成盖章
        'rejected',             // 驳回
        'status_changed',       // 状态变更
        'file_uploaded',        // 文件上传
        'other'
      ]
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    operator_name: String,
    operator_role: String,
    operation_time: {
      type: Date,
      default: Date.now,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  
  // ========== 优先级 ==========
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  
  // ========== 标签 ==========
  tags: [{
    type: String,
    trim: true
  }]
  
}, {
  timestamps: true
});

// ========== 自动生成合同编号 ==========
contractSchema.pre('save', async function(next) {
  if (!this.contract_number) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('Contract').countDocuments();
    
    // 根据合同类型生成不同的前缀
    const prefix = this.contract_type === '销售合同' ? 'SC' : 'PC';
    this.contract_number = `${prefix}-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// ========== 实例方法 ==========

// 提交到合同中心
contractSchema.methods.submitToCenter = function() {
  this.submitted_at = new Date();
  this.addOperationHistory('submitted', this.created_by, '提交到合同管理中心');
};

// 商务工程师接单
contractSchema.methods.acceptByBusinessEngineer = function(userId) {
  this.business_engineer = userId;
  this.accepted_at = new Date();
  this.addOperationHistory('accepted', userId, '商务工程师接单处理');
};

// 完成盖章
contractSchema.methods.completeSealing = function(userId) {
  this.status = '已盖章';
  this.sealed_at = new Date();
  this.approval_status = '已通过';
  this.addOperationHistory('sealed', userId, '完成盖章，合同生效');
};

// 驳回合同
contractSchema.methods.reject = function(userId, reason) {
  this.status = '已驳回';
  this.approval_status = '已驳回';
  this.rejection_reason = reason;
  this.addOperationHistory('rejected', userId, `驳回合同：${reason}`);
};

// 添加跟进记录
contractSchema.methods.addFollowUp = function(content, type, userId, userName, userRole) {
  this.follow_ups.push({
    content,
    follow_up_type: type,
    user: userId,
    user_name: userName,
    user_role: userRole,
    timestamp: new Date()
  });
};

// 添加操作历史
contractSchema.methods.addOperationHistory = function(operationType, operator, description, details = {}) {
  this.operation_history.push({
    operation_type: operationType,
    operator: operator,
    description: description,
    details: details,
    operation_time: new Date()
  });
};

// 上传草稿文件
contractSchema.methods.uploadDraftFile = function(fileInfo, userId) {
  this.draft_file = {
    ...fileInfo,
    uploadedAt: new Date(),
    uploadedBy: userId
  };
  
  // 添加到历史记录
  this.file_history.push({
    version_type: '草稿',
    ...fileInfo,
    uploadedAt: new Date(),
    uploadedBy: userId
  });
  
  this.addOperationHistory('file_uploaded', userId, '上传合同草稿');
};

// 上传盖章版文件
contractSchema.methods.uploadSealedFile = function(fileInfo, userId) {
  this.sealed_file = {
    ...fileInfo,
    uploadedAt: new Date(),
    uploadedBy: userId
  };
  
  // 添加到历史记录
  this.file_history.push({
    version_type: '盖章版',
    ...fileInfo,
    uploadedAt: new Date(),
    uploadedBy: userId
  });
  
  this.addOperationHistory('file_uploaded', userId, '上传盖章版合同');
};

// ========== 索引 ==========
contractSchema.index({ contract_number: 1 });
contractSchema.index({ contract_type: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ project: 1 });
contractSchema.index({ purchase_order: 1 });
contractSchema.index({ created_by: 1 });
contractSchema.index({ business_engineer: 1 });
contractSchema.index({ priority: 1 });
contractSchema.index({ createdAt: -1 });
contractSchema.index({ submitted_at: -1 });
contractSchema.index({ contract_type: 1, status: 1 }); // 复合索引

module.exports = mongoose.model('Contract', contractSchema);
