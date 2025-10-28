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
  // 以及任何其他前端发送的选型参数
  
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
    enum: ['草稿', '进行中', '审核中', '已报价', '已确认', '已完成', '已取消'],
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

module.exports = mongoose.model('NewProject', projectSchema);


