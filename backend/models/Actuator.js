const mongoose = require('mongoose');
const { calculatePrice, getAllPriceTiers } = require('../utils/pricing');

const actuatorSchema = new mongoose.Schema({
  // 基础型号信息
  model_base: {
    type: String,
    required: [true, '请提供基础型号'],
    trim: true,
    uppercase: true,
    unique: true
  },
  
  // 系列（新增字段，用于区分 SF、AT、GY 系列）
  series: {
    type: String,
    trim: true,
    uppercase: true
  },
  
  // 机构类型（新增字段）
  mechanism: {
    type: String,
    trim: true
  },
  
  // 供应商ID（关联Supplier模型）
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  
  // 本体尺寸
  body_size: {
    type: String,
    trim: true,
    uppercase: true
  },
  
  // 作用类型
  action_type: {
    type: String,
    enum: {
      values: ['DA', 'SR'],
      message: '作用类型必须是 DA（双作用）或 SR（弹簧复位）'
    },
    required: [true, '请提供作用类型']
  },
  
  // 弹簧范围（用于 SR 类型，如 K8, K10）
  spring_range: {
    type: String,
    trim: true,
    uppercase: true
  },
  
  // ========== 定价模式控制 ==========
  // 定价模式开关：决定使用固定价格还是阶梯价格
  pricing_model: {
    type: String,
    enum: {
      values: ['fixed', 'tiered'],
      message: '定价模式必须是 fixed（固定价格）或 tiered（阶梯价格）'
    },
    default: 'fixed',
    required: [true, '请提供定价模式']
  },
  
  // 固定单价（当 pricing_model = 'fixed' 时使用）
  base_price: {
    type: Number,
    min: [0, '基础价格不能为负数']
  },
  
  // 阶梯定价 (Price Tiers) - 根据采购数量的不同价格（当 pricing_model = 'tiered' 时使用）
  // 注意：此字段现在为可选字段
  price_tiers: [{
    // 最小数量（起订量）
    min_quantity: {
      type: Number,
      required: [true, '请提供最小数量'],
      min: [1, '最小数量必须大于0']
    },
    
    // 该数量档位的单价
    unit_price: {
      type: Number,
      required: [true, '请提供单价'],
      min: [0, '单价不能为负数']
    },
    
    // 可选：价格类型标识（用于温度等变体）
    price_type: {
      type: String,
      enum: ['normal', 'low_temp', 'high_temp', 'standard'],
      default: 'normal',
      trim: true
    },
    
    // 可选：备注说明
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // 手动操作装置信息（从 pricing 中提取出来）
  manual_override: {
    // 手动操作装置型号
    model: {
      type: String,
      trim: true
    },
    // 手动操作装置价格（也可以使用阶梯定价）
    price: {
      type: Number,
      min: [0, '价格不能为负数']
    }
  },
  
  // 配件价格信息
  accessories_pricing: {
    // 密封套件价格
    seal_kit_price: {
      type: Number,
      min: [0, '价格不能为负数']
    }
  },
  
  // 温度选项（支持的温度等级及代码）
  temperature_options: [{
    // 温度代码
    code: {
      type: String,
      trim: true,
      uppercase: true
      // 例如: 'NO CODE', 'T1', 'T2', 'T3', 'M'
    },
    // 温度描述
    description: {
      type: String,
      trim: true
      // 例如: '常温 Normal atmospheric temperature'
      // '低温 Low T1', '低温 Low T2', '低温 Low T3'
      // '高温 High Temp'
    },
    // 温度范围
    range: {
      type: String,
      trim: true
      // 例如: '-20~80°C', '-40~80°C', '-50~80°C', '-60~80°C', '-20~120°C'
    }
  }],
  
  // 对称轭架扭矩（保留用于 SF 系列）
  // 使用 Map 类型存储键值对，例如 "0.3_0": 309
  torque_symmetric: {
    type: Map,
    of: Number,
    default: new Map()
  },
  
  // 倾斜轭架扭矩（保留用于 SF 系列）
  // 使用 Map 类型存储键值对，例如 "0.3_0": 417
  torque_canted: {
    type: Map,
    of: Number,
    default: new Map()
  },
  
  // 扭矩数据（新增字段，用于 AT/GY 系列）
  // 存储为混合类型对象，例如 { "spring_end": 7.7, "0.3MPa": 6 }
  torque_data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // 尺寸数据（新增字段，用于 AT/GY 系列）
  // 存储为对象，例如 { "A": 147, "B": 65, "H": 92 }
  dimensions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // 额外的技术字段
  specifications: {
    // 工作压力范围 (bar)
    pressure_range: {
      min: { type: Number, default: 2 },
      max: { type: Number, default: 8 }
    },
    
    // 工作温度范围 (°C)
    temperature_range: {
      min: { type: Number, default: -20 },
      max: { type: Number, default: 80 }
    },
    
    // 旋转角度
    rotation_angle: {
      type: Number,
      enum: [90, 120, 180],
      default: 90
    },
    
    // 重量 (kg)
    weight: {
      type: Number,
      min: 0
    },
    
    // 接口类型
    port_connection: {
      type: String,
      default: 'G1/4'
    },
    
    // 安装标准
    mounting_standard: {
      type: String,
      enum: ['ISO5211', 'NAMUR', 'DIN'],
      default: 'ISO5211'
    },
    
    // 材质
    materials: {
      body: { type: String, default: '铝合金' },
      piston: { type: String, default: '铝合金' },
      seal: { type: String, default: 'NBR' }
    }
  },
  
  // 库存信息
  stock_info: {
    available: {
      type: Boolean,
      default: true
    },
    lead_time: {
      type: Number,
      default: 14,
      min: 0
    }
  },
  
  // 描述和备注
  description: {
    type: String,
    trim: true
  },
  
  notes: {
    type: String,
    trim: true
  },
  
  // 是否激活
  is_active: {
    type: Boolean,
    default: true
  },
  
  // ========== 版本管理 ==========
  // 版本号
  version: {
    type: String,
    trim: true,
    default: '1.0'
  },
  
  // 产品状态
  status: {
    type: String,
    enum: {
      values: ['设计中', '已发布', '已停产'],
      message: '状态必须是 设计中、已发布 或 已停产'
    },
    default: '已发布',
    required: [true, '请提供产品状态']
  },
  
  // 父版本ID（用于关联旧版本）
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Actuator',
    default: null
  },
  
  // 版本变更说明
  version_notes: {
    type: String,
    trim: true
  },
  
  // 版本发布日期
  release_date: {
    type: Date
  },
  
  // 停产日期
  discontinue_date: {
    type: Date
  },
  
  // 关联的工程变更单
  eco_references: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EngineeringChangeOrder'
  }]
  
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // 将 Map 转换为普通对象以便 JSON 序列化
      if (ret.torque_symmetric instanceof Map) {
        ret.torque_symmetric = Object.fromEntries(ret.torque_symmetric);
      }
      if (ret.torque_canted instanceof Map) {
        ret.torque_canted = Object.fromEntries(ret.torque_canted);
      }
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// 索引优化查询性能
actuatorSchema.index({ model_base: 1 });
actuatorSchema.index({ series: 1 });
actuatorSchema.index({ body_size: 1 });
actuatorSchema.index({ action_type: 1 });
actuatorSchema.index({ is_active: 1 });
actuatorSchema.index({ 'stock_info.available': 1 });
actuatorSchema.index({ status: 1 });
actuatorSchema.index({ version: 1 });
actuatorSchema.index({ parent_id: 1 });

// 虚拟字段：完整型号名称
actuatorSchema.virtual('full_model_name').get(function() {
  return `${this.body_size}-${this.action_type}`;
});

// 实例方法：获取特定压力下的扭矩
actuatorSchema.methods.getTorque = function(pressure, angle, yokeType = 'symmetric') {
  // 转换键格式：0.3 -> 0_3 (去掉小数点，用下划线替换)
  const pressureKey = String(pressure).replace('.', '_');
  const key = `${pressureKey}_${angle}`;
  const torqueMap = yokeType === 'symmetric' ? this.torque_symmetric : this.torque_canted;
  return torqueMap.get(key) || null;
};

// 实例方法：根据数量获取对应的单价（支持固定价格和阶梯定价）
// 注：此方法现在会根据 pricing_model 来决定返回固定价格还是阶梯价格
actuatorSchema.methods.getPriceByQuantity = function(quantity, priceType = 'normal') {
  // 如果定价模式为固定价格，直接返回 base_price
  if (this.pricing_model === 'fixed') {
    return this.base_price || null;
  }
  
  // 如果定价模式为阶梯价格，使用 price_tiers
  if (this.pricing_model === 'tiered') {
    // 如果没有配置阶梯定价，返回 null
    if (!this.price_tiers || this.price_tiers.length === 0) {
      return null;
    }
    
    // 使用统一的 calculatePrice 函数
    return calculatePrice(this.price_tiers, quantity, priceType);
  }
  
  // 默认情况：如果 pricing_model 未定义或无效，优先返回 base_price
  return this.base_price || null;
};

// 实例方法：获取所有价格档位（用于展示）
// 注：此方法现在会根据 pricing_model 来返回相应的价格信息
actuatorSchema.methods.getAllPriceTiers = function(priceType = null) {
  // 如果定价模式为固定价格，返回单一价格信息
  if (this.pricing_model === 'fixed') {
    if (!this.base_price) {
      return [];
    }
    return [{
      min_quantity: 1,
      unit_price: this.base_price,
      price_type: 'normal',
      notes: '固定单价'
    }];
  }
  
  // 如果定价模式为阶梯价格，返回阶梯价格列表
  if (this.pricing_model === 'tiered') {
    if (!this.price_tiers || this.price_tiers.length === 0) {
      return [];
    }
    
    // 使用统一的 getAllPriceTiers 函数
    return getAllPriceTiers(this.price_tiers, priceType);
  }
  
  // 默认情况
  return [];
};

// 静态方法：根据扭矩要求查找合适的执行器
actuatorSchema.statics.findByTorqueRequirement = async function(requiredTorque, pressure, angle, yokeType = 'symmetric') {
  const actuators = await this.find({ is_active: true });
  // 转换键格式：0.3 -> 0_3 (去掉小数点，用下划线替换)
  const pressureKey = String(pressure).replace('.', '_');
  const key = `${pressureKey}_${angle}`;
  
  const suitable = actuators.filter(actuator => {
    const torqueMap = yokeType === 'symmetric' ? actuator.torque_symmetric : actuator.torque_canted;
    const torque = torqueMap.get(key);
    return torque && torque >= requiredTorque;
  });
  
  // 按扭矩从小到大排序（选择最接近需求的）
  return suitable.sort((a, b) => {
    const torqueA = (yokeType === 'symmetric' ? a.torque_symmetric : a.torque_canted).get(key);
    const torqueB = (yokeType === 'symmetric' ? b.torque_symmetric : b.torque_canted).get(key);
    return torqueA - torqueB;
  });
};

// 保存前的验证
actuatorSchema.pre('save', function(next) {
  // 确保 model_base 格式正确
  if (this.model_base && !this.model_base.includes('-')) {
    this.model_base = `${this.body_size}-${this.action_type}`;
  }
  
  // ========== 定价模式数据验证 ==========
  // 验证定价模式和相应的价格数据
  if (this.pricing_model === 'fixed') {
    // 固定价格模式：必须提供 base_price
    if (!this.base_price || this.base_price <= 0) {
      return next(new Error('固定价格模式下必须提供有效的 base_price（基础价格）'));
    }
  } else if (this.pricing_model === 'tiered') {
    // 阶梯价格模式：必须提供 price_tiers 且至少有一个价格档位
    if (!this.price_tiers || this.price_tiers.length === 0) {
      return next(new Error('阶梯价格模式下必须提供至少一个 price_tiers（价格档位）'));
    }
    
    // 验证阶梯价格数据的完整性
    for (let tier of this.price_tiers) {
      if (!tier.min_quantity || tier.min_quantity < 1) {
        return next(new Error('price_tiers 中的 min_quantity 必须大于 0'));
      }
      if (!tier.unit_price || tier.unit_price < 0) {
        return next(new Error('price_tiers 中的 unit_price 不能为负数'));
      }
    }
  }
  
  next();
});

module.exports = mongoose.model('Actuator', actuatorSchema);

