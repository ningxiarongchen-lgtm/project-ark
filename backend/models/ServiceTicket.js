const mongoose = require('mongoose');

const serviceTicketSchema = new mongoose.Schema({
  // 工单编号
  ticketNumber: {
    type: String,
    required: [true, 'Ticket number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // 工单类型
  ticketType: {
    type: String,
    enum: ['Installation', 'Maintenance', 'Repair', 'Inspection', 'Training', 'Consultation', 'Complaint', 'Other'],
    required: true,
    default: 'Repair'
  },
  
  // 工单状态
  status: {
    type: String,
    enum: ['Open', 'Assigned', 'In Progress', 'Pending Parts', 'On Hold', 'Resolved', 'Closed', 'Cancelled'],
    default: 'Open'
  },
  
  // 优先级
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent', 'Critical'],
    default: 'Normal'
  },
  
  // 客户信息
  customer: {
    name: {
      type: String,
      required: [true, 'Customer name is required']
    },
    company: String,
    email: String,
    phone: {
      type: String,
      required: [true, 'Customer phone is required']
    },
    address: String,
    contactPerson: String
  },
  
  // 关联的项目/订单（可选）
  relatedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder'
  },
  
  // 产品信息
  products: [{
    productType: {
      type: String,
      enum: ['Actuator', 'Manual Override', 'Accessory', 'Valve', 'Other']
    },
    modelName: String,
    serialNumber: String,
    quantity: {
      type: Number,
      default: 1
    },
    purchaseDate: Date,
    warrantyStatus: {
      type: String,
      enum: ['In Warranty', 'Out of Warranty', 'Extended Warranty', 'Unknown'],
      default: 'Unknown'
    }
  }],
  
  // 问题描述
  issue: {
    title: {
      type: String,
      required: [true, 'Issue title is required']
    },
    description: {
      type: String,
      required: [true, 'Issue description is required']
    },
    category: {
      type: String,
      enum: ['Hardware Failure', 'Software Issue', 'Performance Problem', 'Installation Issue', 'User Error', 'Other']
    },
    severity: {
      type: String,
      enum: ['Minor', 'Moderate', 'Major', 'Critical'],
      default: 'Moderate'
    },
    // 附件
    attachments: [{
      filename: String,
      url: String,
      uploadedAt: Date
    }]
  },
  
  // 服务安排
  service: {
    // 服务类型
    serviceType: {
      type: String,
      enum: ['On-site', 'Remote', 'Workshop', 'Phone Support', 'Email Support'],
      default: 'On-site'
    },
    
    // 计划服务日期
    scheduledDate: Date,
    
    // 实际服务日期
    actualServiceDate: Date,
    
    // 服务地址
    serviceAddress: String,
    
    // 分配的工程师
    assignedEngineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 服务团队
    serviceTeam: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    
    // 预计工时
    estimatedHours: Number,
    
    // 实际工时
    actualHours: Number
  },
  
  // 解决方案
  resolution: {
    // 解决方案描述
    description: String,
    
    // 根本原因
    rootCause: String,
    
    // 采取的行动
    actionTaken: String,
    
    // 更换的零件
    partsReplaced: [{
      partName: String,
      partNumber: String,
      quantity: Number,
      cost: Number
    }],
    
    // 解决日期
    resolvedDate: Date,
    
    // 解决人
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // 费用信息
  costs: {
    // 人工费
    laborCost: {
      type: Number,
      default: 0
    },
    
    // 零件费
    partsCost: {
      type: Number,
      default: 0
    },
    
    // 差旅费
    travelCost: {
      type: Number,
      default: 0
    },
    
    // 其他费用
    otherCost: {
      type: Number,
      default: 0
    },
    
    // 总费用
    totalCost: {
      type: Number,
      default: 0
    },
    
    // 是否收费
    chargeable: {
      type: Boolean,
      default: true
    },
    
    // 付款状态
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Waived', 'Disputed'],
      default: 'Pending'
    }
  },
  
  // SLA (服务级别协议)
  sla: {
    // 响应时间目标（小时）
    responseTimeTarget: {
      type: Number,
      default: 24
    },
    
    // 实际响应时间（小时）
    actualResponseTime: Number,
    
    // 解决时间目标（小时）
    resolutionTimeTarget: {
      type: Number,
      default: 72
    },
    
    // 实际解决时间（小时）
    actualResolutionTime: Number,
    
    // 是否违反SLA
    slaViolated: {
      type: Boolean,
      default: false
    }
  },
  
  // 客户反馈
  feedback: {
    // 满意度评分 (1-5)
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    
    // 评论
    comments: String,
    
    // 反馈日期
    feedbackDate: Date
  },
  
  // 跟进记录
  followUps: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['Call', 'Email', 'Visit', 'Note']
    },
    content: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // 内部备注
  internalNotes: String,
  
  // 客户备注
  customerNotes: String,
  
  // 创建人
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 关闭人
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 关闭日期
  closedDate: Date
  
}, {
  timestamps: true
});

// 自动生成工单编号
serviceTicketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('ServiceTicket').countDocuments();
    this.ticketNumber = `TK-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// 计算总费用
serviceTicketSchema.methods.calculateTotalCost = function() {
  this.costs.totalCost = 
    (this.costs.laborCost || 0) + 
    (this.costs.partsCost || 0) + 
    (this.costs.travelCost || 0) + 
    (this.costs.otherCost || 0);
};

// 计算响应时间
serviceTicketSchema.methods.calculateResponseTime = function() {
  if (this.service.assignedEngineer && this.createdAt) {
    const now = new Date();
    const created = new Date(this.createdAt);
    this.sla.actualResponseTime = Math.round((now - created) / (1000 * 60 * 60)); // 小时
    
    if (this.sla.actualResponseTime > this.sla.responseTimeTarget) {
      this.sla.slaViolated = true;
    }
  }
};

// 计算解决时间
serviceTicketSchema.methods.calculateResolutionTime = function() {
  if (this.resolution.resolvedDate && this.createdAt) {
    const resolved = new Date(this.resolution.resolvedDate);
    const created = new Date(this.createdAt);
    this.sla.actualResolutionTime = Math.round((resolved - created) / (1000 * 60 * 60)); // 小时
    
    if (this.sla.actualResolutionTime > this.sla.resolutionTimeTarget) {
      this.sla.slaViolated = true;
    }
  }
};

// 添加跟进记录
serviceTicketSchema.methods.addFollowUp = function(type, content, userId) {
  this.followUps.push({
    date: new Date(),
    type,
    content,
    user: userId
  });
};

// 索引
serviceTicketSchema.index({ ticketNumber: 1 });
serviceTicketSchema.index({ status: 1 });
serviceTicketSchema.index({ priority: 1 });
serviceTicketSchema.index({ ticketType: 1 });
serviceTicketSchema.index({ 'customer.name': 1 });
serviceTicketSchema.index({ 'customer.phone': 1 });
serviceTicketSchema.index({ 'service.assignedEngineer': 1 });
serviceTicketSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ServiceTicket', serviceTicketSchema);


