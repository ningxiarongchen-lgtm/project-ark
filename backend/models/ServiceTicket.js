const mongoose = require('mongoose');

/**
 * 售后服务工单模型
 * 支持销售-技术工程师协同流程、方案审批、完整历史记录
 */
const serviceTicketSchema = new mongoose.Schema({
  // ==================== 基本信息 ====================
  
  // 工单号（自动生成，唯一）
  ticket_number: {
    type: String,
    required: [true, '工单号是必需的'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // 关联的销售订单
  related_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
    required: false  // 不是所有工单都必须关联订单
  },
  
  // 客户名称（冗余存储，便于快速查询）
  client_name: {
    type: String,
    required: [true, '客户名称是必需的'],
    trim: true
  },
  
  // 客户详细信息（可选，用于存储更多客户信息）
  client_info: {
    company: String,           // 公司名称
    contact_person: String,    // 联系人
    phone: String,             // 联系电话
    email: String,             // 电子邮件
    address: String            // 地址
  },
  
  // ==================== 人员信息 ====================
  
  // 创建人（通常是销售）
  created_by: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true,
      enum: ['销售', '技术工程师', '技术主管', '客服', '管理员']
    }
  },
  
  // 被指派的技术工程师
  assigned_to: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    role: {
      type: String,
      enum: ['技术工程师', '技术主管']
    },
    assigned_at: {
      type: Date,
      default: Date.now
    }
  },
  
  // ==================== 服务类型与状态 ====================
  
  // 服务类型
  service_type: {
    type: String,
    required: [true, '服务类型是必需的'],
    enum: [
      '维修',
      '备件',
      '技术咨询',
      '安装调试',
      '设备巡检',
      '培训',
      '投诉处理',
      '其他'
    ],
    default: '维修'
  },
  
  // 工单状态（精细化状态流）
  status: {
    type: String,
    required: true,
    enum: [
      '待技术受理',                    // Pending Acceptance - 销售创建后，等待技术工程师接单
      '技术处理中',                    // In Progress - 技术工程师已接单，正在处理
      '方案待审批',                    // Pending Solution Approval - 技术提交方案，等待主管审批
      '等待客户反馈',                  // Pending Customer Feedback - 等待客户确认方案或提供信息
      '问题已解决-待确认',             // Resolved-Pending Confirmation - 技术认为已解决，等待客户确认
      '已关闭'                         // Closed - 工单已完成并关闭
    ],
    default: '待技术受理'
  },
  
  // 优先级
  priority: {
    type: String,
    enum: ['低', '正常', '高', '紧急', '危急'],
    default: '正常'
  },
  
  // ==================== 问题描述 ====================
  
  // 问题标题
  title: {
    type: String,
    required: [true, '问题标题是必需的'],
    trim: true,
    maxlength: [200, '标题不能超过200个字符']
  },
  
  // 问题详细描述
  description: {
    type: String,
    required: [true, '问题描述是必需的']
  },
  
  // 问题分类
  issue_category: {
    type: String,
    enum: [
      '硬件故障',
      '软件问题',
      '性能问题',
      '安装问题',
      '操作问题',
      '配件需求',
      '技术咨询',
      '其他'
    ]
  },
  
  // 严重程度
  severity: {
    type: String,
    enum: ['轻微', '中等', '严重', '危急'],
    default: '中等'
  },
  
  // 附件（客户提供的现场照片/视频）
  attachments: [{
    file_name: {
      type: String,
      required: true
    },
    file_url: {
      type: String,
      required: true
    },
    file_type: String,          // 文件类型（image/video/document）
    file_size: Number,          // 文件大小（字节）
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ==================== 产品信息 ====================
  
  // 相关产品
  products: [{
    product_type: {
      type: String,
      enum: ['执行器', '手动操作机构', '阀门', '附件', '其他']
    },
    model_name: String,         // 型号
    serial_number: String,      // 序列号
    quantity: {
      type: Number,
      default: 1
    },
    purchase_date: Date,        // 购买日期
    warranty_status: {
      type: String,
      enum: ['在保', '过保', '延保', '未知'],
      default: '未知'
    }
  }],
  
  // ==================== 解决方案草案（方案审批功能）====================
  
  // 技术工程师提交的解决方案草案
  solution_draft: {
    // 问题分析
    analysis: {
      type: String,
      trim: true
    },
    
    // 解决方案
    solution: {
      type: String,
      trim: true
    },
    
    // 所需配件
    required_parts: [{
      part_name: {
        type: String,
        required: true
      },
      part_number: String,      // 配件编号
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      unit_price: Number,       // 单价
      total_price: Number       // 小计
    }],
    
    // 预估成本
    estimated_cost: {
      parts_cost: {             // 配件成本
        type: Number,
        default: 0
      },
      labor_cost: {             // 人工成本
        type: Number,
        default: 0
      },
      travel_cost: {            // 差旅成本
        type: Number,
        default: 0
      },
      other_cost: {             // 其他成本
        type: Number,
        default: 0
      },
      total: {                  // 总成本
        type: Number,
        default: 0
      }
    },
    
    // 预计解决时间（小时）
    estimated_hours: Number,
    
    // 提交时间
    submitted_at: Date,
    
    // 提交人
    submitted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 审批状态
    approval_status: {
      type: String,
      enum: ['待审批', '已批准', '已拒绝', '需修改'],
      default: '待审批'
    },
    
    // 审批人
    approved_by: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      role: String
    },
    
    // 审批时间
    approved_at: Date,
    
    // 审批意见
    approval_comments: String
  },
  
  // ==================== 服务执行信息 ====================
  
  // 服务方式
  service_method: {
    type: String,
    enum: ['现场服务', '远程支持', '返厂维修', '电话支持', '邮件支持'],
    default: '现场服务'
  },
  
  // 计划服务日期
  scheduled_date: Date,
  
  // 实际服务日期
  actual_service_date: Date,
  
  // 服务地址
  service_address: String,
  
  // 实际工时（小时）
  actual_hours: Number,
  
  // 实际更换的零件
  parts_replaced: [{
    part_name: String,
    part_number: String,
    quantity: Number,
    actual_cost: Number
  }],
  
  // ==================== 最终报告 ====================
  
  // 最终的售后解决报告
  final_report: {
    // 报告内容（富文本或Markdown）
    content: String,
    
    // 根本原因分析
    root_cause: String,
    
    // 采取的措施
    actions_taken: String,
    
    // 预防措施建议
    preventive_measures: String,
    
    // 生成的PDF报告文件链接
    file_url: String,
    
    // 报告生成时间
    generated_at: Date,
    
    // 报告生成人
    generated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // ==================== 费用信息 ====================
  
  // 实际费用
  actual_costs: {
    labor_cost: {
      type: Number,
      default: 0
    },
    parts_cost: {
      type: Number,
      default: 0
    },
    travel_cost: {
      type: Number,
      default: 0
    },
    other_cost: {
      type: Number,
      default: 0
    },
    total_cost: {
      type: Number,
      default: 0
    },
    
    // 是否收费
    is_chargeable: {
      type: Boolean,
      default: true
    },
    
    // 收费原因（如果不收费）
    charge_reason: String,
    
    // 付款状态
    payment_status: {
      type: String,
      enum: ['待付款', '已付款', '免费', '争议中'],
      default: '待付款'
    }
  },
  
  // ==================== SLA (服务级别协议) ====================
  
  sla: {
    // 响应时间目标（小时）
    response_time_target: {
      type: Number,
      default: 24
    },
    
    // 实际响应时间（小时）
    actual_response_time: Number,
    
    // 解决时间目标（小时）
    resolution_time_target: {
      type: Number,
      default: 72
    },
    
    // 实际解决时间（小时）
    actual_resolution_time: Number,
    
    // 是否违反SLA
    sla_violated: {
      type: Boolean,
      default: false
    },
    
    // SLA违反原因
    violation_reason: String
  },
  
  // ==================== 客户反馈 ====================
  
  // 客户反馈
  customer_feedback: {
    // 满意度评分 (1-5星)
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    
    // 评论
    comments: String,
    
    // 是否愿意推荐
    would_recommend: Boolean,
    
    // 反馈日期
    feedback_date: Date,
    
    // 反馈人
    feedback_by: String
  },
  
  // ==================== 完整的操作和沟通历史记录 ====================
  
  // 历史记录（完整的时间线）
  history: [{
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    },
    
    // 操作类型
    action_type: {
      type: String,
      required: true,
      enum: [
        '创建工单',
        '分配工程师',
        '接受工单',
        '拒绝工单',
        '开始处理',
        '提交方案',
        '审批方案',
        '拒绝方案',
        '请求客户反馈',
        '客户回复',
        '更新状态',
        '添加附件',
        '更换零件',
        '完成服务',
        '提交报告',
        '关闭工单',
        '重新打开',
        '添加备注',
        '内部沟通',
        '外部沟通',
        '其他'
      ]
    },
    
    // 操作人
    performed_by: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      role: {
        type: String,
        required: true
      }
    },
    
    // 操作描述/内容
    description: {
      type: String,
      required: true
    },
    
    // 从哪个状态
    from_status: String,
    
    // 到哪个状态
    to_status: String,
    
    // 相关附件
    attachments: [{
      file_name: String,
      file_url: String
    }],
    
    // 是否可见（内部/外部）
    visibility: {
      type: String,
      enum: ['内部', '外部', '全部'],
      default: '全部'
    },
    
    // 额外数据（JSON格式，用于存储特定操作的详细信息）
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // ==================== 其他信息 ====================
  
  // 内部备注（仅内部可见）
  internal_notes: String,
  
  // 客户备注（客户可见）
  customer_notes: String,
  
  // 标签（用于分类和搜索）
  tags: [String],
  
  // 关闭人
  closed_by: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    role: String
  },
  
  // 关闭日期
  closed_date: Date,
  
  // 关闭原因
  close_reason: {
    type: String,
    enum: ['问题已解决', '客户取消', '无法解决', '重复工单', '其他']
  }
  
}, {
  timestamps: true,  // 自动添加 createdAt 和 updatedAt
  collection: 'service_tickets'
});

// ==================== 中间件（Middleware）====================

/**
 * 保存前自动生成工单号
 */
serviceTicketSchema.pre('save', async function(next) {
  if (!this.ticket_number) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // 查找当月最后一个工单号
    const lastTicket = await this.constructor.findOne({
      ticket_number: new RegExp(`^TK-${year}${month}`)
    }).sort({ ticket_number: -1 });
    
    let sequence = 1;
    if (lastTicket && lastTicket.ticket_number) {
      const lastSequence = parseInt(lastTicket.ticket_number.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.ticket_number = `TK-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
  next();
});

/**
 * 保存前自动添加历史记录（仅在状态变更时）
 */
serviceTicketSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    // 状态变更会在controller中手动添加历史记录
  }
  next();
});

// ==================== 实例方法 ====================

/**
 * 计算总费用
 */
serviceTicketSchema.methods.calculateTotalCost = function() {
  if (this.actual_costs) {
    this.actual_costs.total_cost = 
      (this.actual_costs.labor_cost || 0) + 
      (this.actual_costs.parts_cost || 0) + 
      (this.actual_costs.travel_cost || 0) + 
      (this.actual_costs.other_cost || 0);
  }
  return this.actual_costs.total_cost;
};

/**
 * 计算方案预估总成本
 */
serviceTicketSchema.methods.calculateEstimatedCost = function() {
  if (this.solution_draft && this.solution_draft.estimated_cost) {
    this.solution_draft.estimated_cost.total = 
      (this.solution_draft.estimated_cost.parts_cost || 0) + 
      (this.solution_draft.estimated_cost.labor_cost || 0) + 
      (this.solution_draft.estimated_cost.travel_cost || 0) + 
      (this.solution_draft.estimated_cost.other_cost || 0);
  }
  return this.solution_draft?.estimated_cost?.total || 0;
};

/**
 * 计算响应时间
 */
serviceTicketSchema.methods.calculateResponseTime = function() {
  if (this.assigned_to && this.assigned_to.assigned_at && this.createdAt) {
    const assignedTime = new Date(this.assigned_to.assigned_at);
    const createdTime = new Date(this.createdAt);
    this.sla.actual_response_time = Math.round((assignedTime - createdTime) / (1000 * 60 * 60)); // 小时
    
    if (this.sla.actual_response_time > this.sla.response_time_target) {
      this.sla.sla_violated = true;
    }
  }
  return this.sla.actual_response_time;
};

/**
 * 计算解决时间
 */
serviceTicketSchema.methods.calculateResolutionTime = function() {
  if (this.closed_date && this.createdAt) {
    const closedTime = new Date(this.closed_date);
    const createdTime = new Date(this.createdAt);
    this.sla.actual_resolution_time = Math.round((closedTime - createdTime) / (1000 * 60 * 60)); // 小时
    
    if (this.sla.actual_resolution_time > this.sla.resolution_time_target) {
      this.sla.sla_violated = true;
    }
  }
  return this.sla.actual_resolution_time;
};

/**
 * 添加历史记录
 */
serviceTicketSchema.methods.addHistory = function(actionType, performedBy, description, options = {}) {
  const historyEntry = {
    timestamp: new Date(),
    action_type: actionType,
    performed_by: {
      id: performedBy.id || performedBy._id,
      name: performedBy.name,
      role: performedBy.role
    },
    description: description,
    from_status: options.from_status || this.status,
    to_status: options.to_status,
    attachments: options.attachments || [],
    visibility: options.visibility || '全部',
    metadata: options.metadata || {}
  };
  
  this.history.push(historyEntry);
  return historyEntry;
};

/**
 * 分配工程师
 */
serviceTicketSchema.methods.assignEngineer = function(engineer, assignedBy) {
  this.assigned_to = {
    id: engineer._id || engineer.id,
    name: engineer.name,
    role: engineer.role,
    assigned_at: new Date()
  };
  
  this.addHistory(
    '分配工程师',
    assignedBy,
    `工单已分配给技术工程师：${engineer.name}`,
    {
      to_status: this.status,
      metadata: { engineer_id: engineer._id || engineer.id }
    }
  );
  
  return this;
};

/**
 * 接受工单
 */
serviceTicketSchema.methods.acceptTicket = function(engineer) {
  const oldStatus = this.status;
  this.status = '技术处理中';
  
  this.addHistory(
    '接受工单',
    engineer,
    `技术工程师已接受工单并开始处理`,
    {
      from_status: oldStatus,
      to_status: this.status
    }
  );
  
  this.calculateResponseTime();
  
  return this;
};

/**
 * 提交解决方案
 */
serviceTicketSchema.methods.submitSolution = function(solutionData, engineer) {
  const oldStatus = this.status;
  this.status = '方案待审批';
  
  this.solution_draft = {
    ...solutionData,
    submitted_at: new Date(),
    submitted_by: engineer._id || engineer.id,
    approval_status: '待审批'
  };
  
  this.calculateEstimatedCost();
  
  this.addHistory(
    '提交方案',
    engineer,
    `技术工程师已提交解决方案，等待审批`,
    {
      from_status: oldStatus,
      to_status: this.status,
      metadata: { estimated_cost: this.solution_draft.estimated_cost.total }
    }
  );
  
  return this;
};

/**
 * 审批方案
 */
serviceTicketSchema.methods.approveSolution = function(approver, approved, comments) {
  if (!this.solution_draft) {
    throw new Error('没有待审批的方案');
  }
  
  const oldStatus = this.status;
  this.solution_draft.approval_status = approved ? '已批准' : '已拒绝';
  this.solution_draft.approved_by = {
    id: approver._id || approver.id,
    name: approver.name,
    role: approver.role
  };
  this.solution_draft.approved_at = new Date();
  this.solution_draft.approval_comments = comments;
  
  if (approved) {
    this.status = '技术处理中';
  } else {
    this.status = '技术处理中';  // 拒绝后返回处理中，让工程师重新提交
  }
  
  this.addHistory(
    '审批方案',
    approver,
    `方案${approved ? '已批准' : '已拒绝'}${comments ? '：' + comments : ''}`,
    {
      from_status: oldStatus,
      to_status: this.status,
      metadata: { approved, comments }
    }
  );
  
  return this;
};

/**
 * 标记为已解决
 */
serviceTicketSchema.methods.markAsResolved = function(engineer, reportData) {
  const oldStatus = this.status;
  this.status = '问题已解决-待确认';
  
  if (reportData) {
    this.final_report = {
      ...reportData,
      generated_at: new Date(),
      generated_by: engineer._id || engineer.id
    };
  }
  
  this.addHistory(
    '完成服务',
    engineer,
    `技术工程师已完成服务，问题已解决，等待客户确认`,
    {
      from_status: oldStatus,
      to_status: this.status
    }
  );
  
  return this;
};

/**
 * 关闭工单
 */
serviceTicketSchema.methods.closeTicket = function(closedBy, reason, feedback) {
  const oldStatus = this.status;
  this.status = '已关闭';
  this.closed_by = {
    id: closedBy._id || closedBy.id,
    name: closedBy.name,
    role: closedBy.role
  };
  this.closed_date = new Date();
  this.close_reason = reason;
  
  if (feedback) {
    this.customer_feedback = {
      ...feedback,
      feedback_date: new Date()
    };
  }
  
  this.addHistory(
    '关闭工单',
    closedBy,
    `工单已关闭。原因：${reason}`,
    {
      from_status: oldStatus,
      to_status: this.status,
      metadata: { reason, feedback }
    }
  );
  
  this.calculateResolutionTime();
  
  return this;
};

/**
 * 添加附件
 */
serviceTicketSchema.methods.addAttachment = function(fileData, uploadedBy) {
  const attachment = {
    file_name: fileData.file_name,
    file_url: fileData.file_url,
    file_type: fileData.file_type,
    file_size: fileData.file_size,
    uploaded_by: uploadedBy._id || uploadedBy.id,
    uploaded_at: new Date()
  };
  
  this.attachments.push(attachment);
  
  this.addHistory(
    '添加附件',
    uploadedBy,
    `上传了附件：${fileData.file_name}`,
    {
      attachments: [{ file_name: fileData.file_name, file_url: fileData.file_url }]
    }
  );
  
  return attachment;
};

// ==================== 静态方法 ====================

/**
 * 按状态统计工单
 */
serviceTicketSchema.statics.getStatusStatistics = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

/**
 * 获取工程师的工单统计
 */
serviceTicketSchema.statics.getEngineerStatistics = async function(engineerId) {
  return await this.aggregate([
    {
      $match: { 'assigned_to.id': mongoose.Types.ObjectId(engineerId) }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

/**
 * 获取SLA违反的工单
 */
serviceTicketSchema.statics.getSLAViolations = async function() {
  return await this.find({ 'sla.sla_violated': true })
    .sort({ createdAt: -1 })
    .populate('assigned_to.id', 'name email')
    .populate('created_by.id', 'name email');
};

// ==================== 索引 ====================

// 基本索引
serviceTicketSchema.index({ ticket_number: 1 }, { unique: true });
serviceTicketSchema.index({ status: 1 });
serviceTicketSchema.index({ priority: 1 });
serviceTicketSchema.index({ service_type: 1 });

// 关联索引
serviceTicketSchema.index({ related_order_id: 1 });
serviceTicketSchema.index({ client_name: 1 });

// 人员索引
serviceTicketSchema.index({ 'created_by.id': 1 });
serviceTicketSchema.index({ 'assigned_to.id': 1 });

// 时间索引
serviceTicketSchema.index({ createdAt: -1 });
serviceTicketSchema.index({ closed_date: -1 });
serviceTicketSchema.index({ scheduled_date: 1 });

// SLA索引
serviceTicketSchema.index({ 'sla.sla_violated': 1 });

// 组合索引（用于常见查询）
serviceTicketSchema.index({ status: 1, priority: -1, createdAt: -1 });
serviceTicketSchema.index({ 'assigned_to.id': 1, status: 1 });

// 文本搜索索引
serviceTicketSchema.index({ title: 'text', description: 'text' });

// ==================== 虚拟字段 ====================

/**
 * 工单年龄（天数）
 */
serviceTicketSchema.virtual('age_in_days').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
});

/**
 * 是否超时
 */
serviceTicketSchema.virtual('is_overdue').get(function() {
  return this.sla && this.sla.sla_violated;
});

/**
 * 是否已分配
 */
serviceTicketSchema.virtual('is_assigned').get(function() {
  return this.assigned_to && this.assigned_to.id;
});

// ==================== 导出模型 ====================

module.exports = mongoose.model('ServiceTicket', serviceTicketSchema);
