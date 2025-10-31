const mongoose = require('mongoose');
const { calculatePrice } = require('../utils/pricing');

const selectionSchema = new mongoose.Schema({
  // 位号标签
  tag_number: {
    type: String,
    trim: true,
    uppercase: true
  },
  
  // 用户输入参数（灵活存储所有选型输入）
  input_params: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // 说明：input_params 现在可以灵活存储任意字段，包括：
  // - required_torque: 所需扭矩 (Nm)
  // - valve_torque: 阀门扭矩 (Nm)
  // - safety_factor: 安全系数
  // - working_pressure: 工作压力 (MPa)
  // - working_angle: 工作角度 (degrees)
  // - mechanism: 执行机构类型 ('Scotch Yoke' / 'Rack & Pinion')
  // - valve_type: 阀门类型 ('Ball Valve' / 'Butterfly Valve')
  // - valve_size: 阀门口径 (例如 'DN100')
  // - flange_size: 法兰连接尺寸 (例如 'F07/F10')
  // - needs_manual_override: 是否需要手动操作装置
  // - max_budget: 最大预算
  // - special_requirements: 其他要求
  // - fail_safe_position: 故障安全位置 ('Fail Close' / 'Fail Open' / 'Not Applicable')
  // 以及任何其他前端发送的选型参数
  
  // 故障安全位置（独立字段，用于单作用执行器）
  fail_safe_position: {
    type: String,
    enum: ['Fail Close', 'Fail Open', 'Not Applicable'],
    default: 'Not Applicable',
    trim: true
  },
  
  // 选中的执行器配置
  selected_actuator: {
    actuator_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Actuator'
    },
    model_base: String,
    body_size: String,
    action_type: String,
    yoke_type: String,
    actual_torque: Number,  // 实际提供的扭矩
    price: Number,
    notes: String
  },
  
  // 选中的手动操作装置
  selected_override: {
    override_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ManualOverride'
    },
    model: String,
    price: Number,
    notes: String
  },
  
  // 选中的配件数组
  selected_accessories: [{
    accessory_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accessory'
    },
    name: String,
    category: String,
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    unit_price: Number,
    total_price: Number,
    notes: String
  }],
  
  // 总价
  total_price: {
    type: Number,
    default: 0
  },
  
  // 选型状态
  status: {
    type: String,
    enum: ['待选型', '已选型', '已确认', '已报价'],
    default: '待选型'
  },
  
  // 备注
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const projectSchema = new mongoose.Schema({
  // 项目名称
  project_name: {
    type: String,
    required: [true, '请提供项目名称'],
    trim: true
  },
  
  // 项目编号（自动生成）
  project_number: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // 客户名称
  client_name: {
    type: String,
    trim: true
  },
  
  // 客户联系信息
  client_contact: {
    company: String,
    contact_person: String,
    phone: String,
    address: String
  },
  
  // 创建者
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 分配的团队成员
  assigned_to: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // 选型配置数组
  selections: [selectionSchema],
  
  // 项目状态
  project_status: {
    type: String,
    enum: ['草稿', '进行中', '选型进行中', '已提交审核', '选型修正中', '已报价', '已确认', '已完成', '已取消'],
    default: '草稿'
  },
  
  // 优先级
  priority: {
    type: String,
    enum: ['低', '中', '高', '紧急'],
    default: '中'
  },
  
  // 行业类型
  industry: {
    type: String,
    enum: ['石油天然气', '化工', '水处理', '电力', '制造业', '食品饮料', '其他']
  },
  
  // 应用场景
  application: {
    type: String,
    trim: true
  },
  
  // 项目时间线
  timeline: {
    start_date: Date,
    expected_completion: Date,
    actual_completion: Date
  },
  
  // 预算信息
  budget: {
    estimated: Number,
    actual: Number,
    currency: {
      type: String,
      default: 'CNY'
    }
  },
  
  // 项目总价
  total_project_price: {
    type: Number,
    default: 0
  },
  
  // 优化后的物料清单（选型优化结果）
  optimized_bill_of_materials: [{
    // 最终选定的执行机构完整型号
    actuator_model: {
      type: String,
      trim: true,
      uppercase: true
      // 例如: 'SF10/C-150DA-T1', 'AT-DA63-T2'
    },
    
    // 该型号的总数量
    total_quantity: {
      type: Number,
      required: true,
      min: [1, '数量必须大于0']
    },
    
    // 单价
    unit_price: {
      type: Number,
      required: true,
      min: [0, '单价不能为负数']
    },
    
    // 总价 (total_quantity × unit_price)
    total_price: {
      type: Number,
      required: true,
      min: [0, '总价不能为负数']
    },
    
    // 该型号所覆盖的所有阀门位号列表（关键字段）
    covered_tags: [{
      type: String,
      trim: true,
      uppercase: true
      // 例如: ['V-101', 'V-102', 'V-105']
      // 用于跟踪哪些阀门使用了这个型号
    }],
    
    // 备注信息
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // 物料清单 BOM (Bill of Materials) - 当前活动BOM
  bill_of_materials: [{
    // 项目类型
    item_type: {
      type: String,
      required: true,
      enum: ['Actuator', 'Manual Override', 'Accessory', 'Valve', 'Manual', 'Other'],
      trim: true
    },
    
    // 型号名称
    model_name: {
      type: String,
      required: true,
      trim: true
    },
    
    // 数量
    quantity: {
      type: Number,
      required: true,
      min: [1, '数量必须大于0'],
      default: 1
    },
    
    // 单价
    unit_price: {
      type: Number,
      required: true,
      min: [0, '单价不能为负数']
    },
    
    // 总价
    total_price: {
      type: Number,
      required: true,
      min: [0, '总价不能为负数']
    },
    
    // 描述（可选）
    description: {
      type: String,
      trim: true
    },
    
    // 规格详情（可选，灵活对象）
    specifications: {
      type: mongoose.Schema.Types.Mixed
    },
    
    // 备注（可选）
    notes: {
      type: String,
      trim: true
    },
    
    // 覆盖的位号（可选，用于优化BOM）
    covered_tags: [{
      type: String,
      trim: true,
      uppercase: true
    }],
    
    // 创建时间
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // BOM历史版本 - 追踪所有BOM版本
  bom_history: [{
    // 版本名称
    version_name: {
      type: String,
      required: true,
      trim: true
      // 例如: 'v1.0', 'Initial', 'Optimized v2'
    },
    
    // 创建时间
    created_at: {
      type: Date,
      default: Date.now,
      required: true
    },
    
    // 创建者
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 该版本的总金额
    total_amount: {
      type: Number,
      required: true,
      min: [0, '总金额不能为负数']
    },
    
    // 变更描述（可选）
    change_description: {
      type: String,
      trim: true
    },
    
    // 版本备注（可选）
    notes: {
      type: String,
      trim: true
    },
    
    // BOM项目列表
    items: [{
      item_type: {
        type: String,
        required: true,
        enum: ['Actuator', 'Manual Override', 'Accessory', 'Valve', 'Manual', 'Other'],
        trim: true
      },
      model_name: {
        type: String,
        required: true,
        trim: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      unit_price: {
        type: Number,
        required: true,
        min: 0
      },
      total_price: {
        type: Number,
        required: true,
        min: 0
      },
      description: {
        type: String,
        trim: true
      },
      specifications: {
        type: mongoose.Schema.Types.Mixed
      },
      notes: {
        type: String,
        trim: true
      },
      covered_tags: [{
        type: String,
        trim: true,
        uppercase: true
      }]
    }]
  }],
  
  // 关联的报价单
  quotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote'
  }],
  
  // 项目文档
  documents: [{
    name: String,
    type: String,
    url: String,
    uploaded_at: Date,
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // 项目备注
  notes: {
    type: String,
    trim: true
  },
  
  // 内部备注（不对外显示）
  internal_notes: {
    type: String,
    trim: true
  },
  
  // 🔒 技术清单版本管理
  technical_list_versions: [{
    // 版本号
    version: {
      type: String,
      required: true,
      trim: true
      // 例如: 'v1.0', 'v2.0'
    },
    
    // 创建时间
    created_at: {
      type: Date,
      default: Date.now,
      required: true
    },
    
    // 创建者（技术工程师）
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // 版本状态
    status: {
      type: String,
      enum: ['草稿', '已提交', '已驳回', '已确认'],
      default: '草稿'
    },
    
    // 选型配置快照（该版本的技术清单）
    selections_snapshot: [selectionSchema],
    
    // 版本说明
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // 🔒 当前活动的技术清单版本号
  current_technical_version: {
    type: String,
    trim: true
    // 例如: 'v2.0'
  },
  
  // 🔒 是否锁定技术清单（技术工程师提交后锁定）
  technical_list_locked: {
    type: Boolean,
    default: false
  },
  
  // 🔒 锁定时间
  technical_list_locked_at: {
    type: Date
  },
  
  // 🔒 报价BOM基于的技术清单版本号
  quotation_based_on_version: {
    type: String,
    trim: true
    // 例如: 'v1.0', 'v2.0', 记录此报价基于哪个技术清单版本
  },
  
  // 🔒 项目锁定状态（转化为合同订单后锁定，防止修改报价）
  is_locked: {
    type: Boolean,
    default: false
  },
  
  // 🔒 锁定时间
  locked_at: {
    type: Date
  },
  
  // 🔒 锁定原因
  locked_reason: {
    type: String,
    trim: true
    // 例如: '已转化为合同订单', '已签订合同'
  },
  
  // 🔒 报价BOM（商务工程师从技术清单生成的报价物料清单）
  quotation_bom: [{
    // 项目类型
    item_type: {
      type: String,
      required: true,
      enum: ['Actuator', 'Manual Override', 'Accessory', 'Valve', 'Manual', 'Other'],
      trim: true
    },
    
    // 型号名称
    model_name: {
      type: String,
      required: true,
      trim: true
    },
    
    // 数量
    quantity: {
      type: Number,
      required: true,
      min: [1, '数量必须大于0'],
      default: 1
    },
    
    // 基础价格（来自系统）
    base_price: {
      type: Number,
      required: true,
      min: [0, '基础价格不能为负数']
    },
    
    // 成本价格（用于利润计算，仅授权角色可见）
    cost_price: {
      type: Number,
      min: [0, '成本价格不能为负数']
    },
    
    // 临时定价规则
    pricing_rules: {
      // 定价类型: 'standard' | 'tiered' | 'manual_override'
      type: {
        type: String,
        enum: ['standard', 'tiered', 'manual_override'],
        default: 'standard'
      },
      
      // 阶梯定价规则
      tiers: [{
        min_quantity: {
          type: Number,
          required: true,
          min: 1
        },
        unit_price: {
          type: Number,
          required: true,
          min: 0
        }
      }],
      
      // 手动覆盖价格
      manual_price: {
        type: Number,
        min: 0
      },
      
      // 折扣百分比（用于显示）
      discount_percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      
      // 定价决策备注
      notes: String
    },
    
    // 计算后的单价（基于定价规则和数量）
    unit_price: {
      type: Number,
      required: true,
      min: [0, '单价不能为负数']
    },
    
    // 总价
    total_price: {
      type: Number,
      required: true,
      min: [0, '总价不能为负数']
    },
    
    // 描述（可选）
    description: {
      type: String,
      trim: true
    },
    
    // 规格详情（可选）
    specifications: {
      type: mongoose.Schema.Types.Mixed
    },
    
    // 备注（可选）
    notes: {
      type: String,
      trim: true
    },
    
    // 覆盖的位号（可选）
    covered_tags: [{
      type: String,
      trim: true,
      uppercase: true
    }],
    
    // 是否为手动条目
    is_manual: {
      type: Boolean,
      default: false
    },
    
    // 创建时间
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 🔒 商务工程师的修改建议列表
  modification_requests: [{
    // 请求ID
    request_id: {
      type: String,
      default: () => `REQ-${Date.now()}`
    },
    
    // 请求时间
    requested_at: {
      type: Date,
      default: Date.now
    },
    
    // 请求人（商务工程师）
    requested_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 针对的技术清单版本
    target_version: {
      type: String,
      trim: true
    },
    
    // 修改建议内容
    suggestions: [{
      // 位号
      tag_number: String,
      
      // 原型号
      original_model: String,
      
      // 建议型号
      suggested_model: String,
      
      // 修改原因
      reason: String,
      
      // 建议详情
      details: String
    }],
    
    // 请求状态
    status: {
      type: String,
      enum: ['待处理', '处理中', '已接受', '已拒绝'],
      default: '待处理'
    },
    
    // 技术工程师回复
    response: {
      type: String,
      trim: true
    },
    
    // 回复时间
    responded_at: {
      type: Date
    }
  }],
  
  // 💰 合同与付款信息（用于"款到发货"流程）
  contract: {
    // 合同签订状态
    contractSigned: {
      type: Boolean,
      default: false
    },
    
    // 合同签订日期
    contractSignedDate: {
      type: Date
    },
    
    // 合同总金额
    totalAmount: {
      type: Number,
      min: 0
    },
    
    // 定金金额
    depositAmount: {
      type: Number,
      min: 0
    },
    
    // 定金状态
    depositStatus: {
      type: String,
      enum: ['Pending', 'Received', 'Not Required'],
      default: 'Pending'
    },
    
    // 定金收款日期
    depositReceivedDate: {
      type: Date
    },
    
    // 尾款金额
    finalPaymentAmount: {
      type: Number,
      min: 0
    },
    
    // 尾款状态（核心字段，控制发货）
    finalPaymentStatus: {
      type: String,
      enum: ['Pending', 'Confirmed'],
      default: 'Pending'
    },
    
    // 尾款确认日期
    finalPaymentConfirmedDate: {
      type: Date
    },
    
    // 尾款确认人（商务工程师）
    finalPaymentConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 发货状态
    deliveryStatus: {
      type: String,
      enum: ['Pending', 'Ready to Ship', 'Shipped', 'Delivered'],
      default: 'Pending'
    },
    
    // 发货日期
    shippedDate: {
      type: Date
    },
    
    // 交付日期
    deliveredDate: {
      type: Date
    },
    
    // 付款备注
    paymentNotes: {
      type: String,
      trim: true
    }
  }
  
}, {
  timestamps: true
});

// 自动生成项目编号
projectSchema.pre('save', async function(next) {
  if (!this.project_number) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('NewProject').countDocuments();
    this.project_number = `PROJ-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  
  // 自动计算项目总价
  if (this.selections && this.selections.length > 0) {
    this.total_project_price = this.selections.reduce((sum, selection) => {
      return sum + (selection.total_price || 0);
    }, 0);
  }
  
  next();
});

// 索引优化查询性能
projectSchema.index({ project_number: 1 });
projectSchema.index({ project_name: 1 });
projectSchema.index({ client_name: 1 });
projectSchema.index({ created_by: 1 });
projectSchema.index({ project_status: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ createdAt: -1 });

// 实例方法：添加选型配置
projectSchema.methods.addSelection = function(selectionData) {
  this.selections.push(selectionData);
  return this.save();
};

// 实例方法：更新选型配置
projectSchema.methods.updateSelection = function(selectionId, updateData) {
  const selection = this.selections.id(selectionId);
  if (selection) {
    Object.assign(selection, updateData);
    return this.save();
  }
  throw new Error('未找到指定的选型配置');
};

// 实例方法：删除选型配置
projectSchema.methods.removeSelection = function(selectionId) {
  this.selections.pull(selectionId);
  return this.save();
};

// 实例方法：为选型添加配件
projectSchema.methods.addAccessoryToSelection = function(selectionId, accessoryData) {
  const selection = this.selections.id(selectionId);
  if (selection) {
    const quantity = accessoryData.quantity || 1;
    let unitPrice = accessoryData.unit_price;
    let totalPrice;
    
    // 尝试使用阶梯定价（如果配件支持）
    if (accessoryData.price_tiers && accessoryData.price_tiers.length > 0) {
      const priceInfo = calculatePrice(accessoryData.price_tiers, quantity, 'normal');
      if (priceInfo) {
        unitPrice = priceInfo.unit_price;
        totalPrice = priceInfo.total_price;
      } else {
        // 降级：使用单一价格
        totalPrice = unitPrice * quantity;
      }
    } else {
      // 使用单一价格
      totalPrice = unitPrice * quantity;
    }
    
    selection.selected_accessories.push({
      ...accessoryData,
      unit_price: unitPrice,
      quantity: quantity,
      total_price: totalPrice
    });
    
    return this.save();
  }
  throw new Error('未找到指定的选型配置');
};

// 实例方法：从选型中移除配件
projectSchema.methods.removeAccessoryFromSelection = function(selectionId, accessoryId) {
  const selection = this.selections.id(selectionId);
  if (selection) {
    selection.selected_accessories.pull(accessoryId);
    return this.save();
  }
  throw new Error('未找到指定的选型配置');
};

// 实例方法：计算单个选型的总价
projectSchema.methods.calculateSelectionPrice = function(selectionId) {
  const selection = this.selections.id(selectionId);
  if (selection) {
    let total = 0;
    
    // 执行器价格
    if (selection.selected_actuator && selection.selected_actuator.price) {
      total += selection.selected_actuator.price;
    }
    
    // 手动操作装置价格
    if (selection.selected_override && selection.selected_override.price) {
      total += selection.selected_override.price;
    }
    
    // 配件价格
    if (selection.selected_accessories && selection.selected_accessories.length > 0) {
      selection.selected_accessories.forEach(accessory => {
        if (accessory.total_price) {
          total += accessory.total_price;
        } else if (accessory.unit_price && accessory.quantity) {
          // 如果 total_price 未设置，尝试使用阶梯定价计算
          if (accessory.price_tiers && accessory.price_tiers.length > 0) {
            const priceInfo = calculatePrice(accessory.price_tiers, accessory.quantity, 'normal');
            if (priceInfo) {
              accessory.total_price = priceInfo.total_price;
            } else {
              // 降级：简单计算
              accessory.total_price = accessory.unit_price * accessory.quantity;
            }
          } else {
            // 简单计算
            accessory.total_price = accessory.unit_price * accessory.quantity;
          }
          total += accessory.total_price;
        }
      });
    }
    
    selection.total_price = total;
    return this.save();
  }
  throw new Error('未找到指定的选型配置');
};

// 静态方法：按状态统计项目
projectSchema.statics.getStatsByStatus = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$project_status',
        count: { $sum: 1 },
        total_value: { $sum: '$total_project_price' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// 静态方法：获取用户的项目
projectSchema.statics.getUserProjects = async function(userId) {
  return await this.find({
    $or: [
      { created_by: userId },
      { assigned_to: userId }
    ]
  }).sort({ createdAt: -1 });
};

// 🔒 实例方法：技术工程师提交技术清单（锁定版本）
projectSchema.methods.submitTechnicalList = function(userId, notes = '') {
  // 生成新版本号
  const versionNumber = this.technical_list_versions.length + 1;
  const version = `v${versionNumber}.0`;
  
  // 创建版本快照
  const versionSnapshot = {
    version: version,
    created_by: userId,
    status: '已提交',
    selections_snapshot: JSON.parse(JSON.stringify(this.selections)), // 深拷贝
    notes: notes || `技术清单版本 ${version} 提交审核`,
    created_at: new Date()
  };
  
  this.technical_list_versions.push(versionSnapshot);
  this.current_technical_version = version;
  this.technical_list_locked = true;
  this.technical_list_locked_at = new Date();
  this.project_status = '已提交审核';
  
  return this.save();
};

// 🔒 实例方法：商务工程师驳回并提出修改建议
projectSchema.methods.rejectWithSuggestions = function(userId, suggestions, targetVersion) {
  // 创建修改请求
  const modificationRequest = {
    requested_by: userId,
    target_version: targetVersion || this.current_technical_version,
    suggestions: suggestions,
    status: '待处理',
    requested_at: new Date()
  };
  
  this.modification_requests.push(modificationRequest);
  
  // 更新版本状态为已驳回
  const versionIndex = this.technical_list_versions.findIndex(
    v => v.version === (targetVersion || this.current_technical_version)
  );
  if (versionIndex !== -1) {
    this.technical_list_versions[versionIndex].status = '已驳回';
  }
  
  // 解锁技术清单，允许技术工程师修改
  this.technical_list_locked = false;
  this.project_status = '选型修正中';
  
  return this.save();
};

// 🔒 实例方法：技术工程师回复修改建议
projectSchema.methods.respondToModificationRequest = function(requestId, response, accept = true) {
  const request = this.modification_requests.find(r => r.request_id === requestId);
  
  if (request) {
    request.response = response;
    request.status = accept ? '已接受' : '已拒绝';
    request.responded_at = new Date();
    
    if (accept) {
      // 如果接受建议，可以选择应用建议的修改
      this.project_status = '选型进行中';
    }
  }
  
  return this.save();
};

// 🔒 实例方法：商务工程师确认技术清单版本
projectSchema.methods.confirmTechnicalVersion = function(version) {
  const versionIndex = this.technical_list_versions.findIndex(v => v.version === version);
  
  if (versionIndex !== -1) {
    this.technical_list_versions[versionIndex].status = '已确认';
    this.current_technical_version = version;
    // 保持锁定状态，商务可以基于此版本进行报价
    this.technical_list_locked = true;
  }
  
  return this.save();
};

// 🔒 实例方法：获取当前活动的技术清单版本
projectSchema.methods.getCurrentTechnicalVersion = function() {
  if (!this.current_technical_version) {
    return null;
  }
  
  return this.technical_list_versions.find(
    v => v.version === this.current_technical_version
  );
};

// 🔒 实例方法：获取待处理的修改请求
projectSchema.methods.getPendingModificationRequests = function() {
  return this.modification_requests.filter(r => r.status === '待处理');
};

// 🔒 实例方法：从技术清单生成报价BOM
projectSchema.methods.generateQuotationBomFromTechnicalList = function(version) {
  // 如果未指定版本，使用当前活动版本
  const targetVersion = version || this.current_technical_version;
  
  if (!targetVersion) {
    throw new Error('未找到技术清单版本');
  }
  
  // 查找指定版本的技术清单
  const technicalVersion = this.technical_list_versions.find(
    v => v.version === targetVersion
  );
  
  if (!technicalVersion) {
    throw new Error(`未找到技术清单版本 ${targetVersion}`);
  }
  
  if (technicalVersion.status !== '已提交' && technicalVersion.status !== '已确认') {
    throw new Error(`技术清单版本 ${targetVersion} 尚未提交或确认`);
  }
  
  // 从技术清单快照生成报价BOM
  const quotationItems = [];
  
  if (technicalVersion.selections_snapshot && technicalVersion.selections_snapshot.length > 0) {
    technicalVersion.selections_snapshot.forEach(selection => {
      // 添加执行器
      if (selection.selected_actuator && selection.selected_actuator.actuator_id) {
        const basePrice = selection.selected_actuator.price || 0;
        quotationItems.push({
          item_type: 'Actuator',
          model_name: selection.selected_actuator.final_model_name || 
                     selection.selected_actuator.recommended_model || 
                     selection.selected_actuator.model_base,
          quantity: 1,
          base_price: basePrice,
          unit_price: basePrice,
          total_price: basePrice,
          description: `位号: ${selection.tag_number || 'N/A'}`,
          specifications: selection.input_params,
          notes: selection.notes,
          covered_tags: selection.tag_number ? [selection.tag_number] : [],
          is_manual: false
        });
      }
      
      // 添加手动操作装置
      if (selection.selected_override && selection.selected_override.override_id) {
        const basePrice = selection.selected_override.price || 0;
        quotationItems.push({
          item_type: 'Manual Override',
          model_name: selection.selected_override.model,
          quantity: 1,
          base_price: basePrice,
          unit_price: basePrice,
          total_price: basePrice,
          description: `位号: ${selection.tag_number || 'N/A'}`,
          notes: selection.selected_override.notes,
          covered_tags: selection.tag_number ? [selection.tag_number] : [],
          is_manual: false
        });
      }
      
      // 添加配件
      if (selection.selected_accessories && selection.selected_accessories.length > 0) {
        selection.selected_accessories.forEach(accessory => {
          const quantity = accessory.quantity || 1;
          const unitPrice = accessory.unit_price || 0;
          const totalPrice = accessory.total_price || (unitPrice * quantity);
          
          quotationItems.push({
            item_type: 'Accessory',
            model_name: accessory.name,
            quantity: quantity,
            base_price: unitPrice,
            unit_price: unitPrice,
            total_price: totalPrice,
            description: accessory.category || '',
            notes: accessory.notes,
            covered_tags: selection.tag_number ? [selection.tag_number] : [],
            is_manual: false
          });
        });
      }
    });
  }
  
  // 设置报价BOM和版本号
  this.quotation_bom = quotationItems;
  this.quotation_based_on_version = targetVersion;
  
  return this.save();
};

module.exports = mongoose.model('NewProject', projectSchema);


