const mongoose = require('mongoose');

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
  
  // 阀门类型（扩展支持所有系列）
  valve_type: {
    type: String,
    trim: true,
    enum: [
      // SF系列（拨叉式）- 旋转阀门
      'Ball Valve',        // 球阀（对称拨叉，不带C）
      'Butterfly Valve',   // 蝶阀（偏心拨叉，带C）
      '球阀', 
      '蝶阀',
      // AT/GY系列（齿轮齿条式）- 直行程阀门
      'Gate Valve',        // 闸阀
      'Globe Valve',       // 截止阀
      'Control Valve',     // 直行程调节阀
      null
    ],
    default: null
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
  
  // 气缸尺寸（SF系列专用）
  cylinder_size: {
    type: Number,
    min: [0, '气缸尺寸不能为负数']
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
  
  // ========== 标准价格字段（目录价） ==========
  // 常温标准价
  base_price_normal: {
    type: Number,
    min: [0, '价格不能为负数']
  },
  
  // 低温标准价
  base_price_low: {
    type: Number,
    min: [0, '价格不能为负数']
  },
  
  // 高温标准价
  base_price_high: {
    type: Number,
    min: [0, '价格不能为负数']
  },
  
  // ========== 生产BOM结构 ==========
  // 定义该执行器由哪些零部件组成
  bom_structure: [{
    // 零件编号
    part_number: {
      type: String,
      trim: true,
      uppercase: true
    },
    // 零件名称
    part_name: {
      type: String,
      trim: true
    },
    // 数量
    quantity: {
      type: Number,
      min: [1, '数量必须大于0'],
      default: 1
    }
  }],
  
  // 手动操作装置选项（多个可选型号）
  manual_override_options: [{
    // 手动操作装置型号
    override_model: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    // 附加价格
    additional_price: {
      type: Number,
      required: true,
      min: [0, '价格不能为负数'],
      default: 0
    },
    // 描述
    description: {
      type: String,
      trim: true
    }
  }],
  
  // 备件信息
  spare_parts: {
    // 密封套件价格
    seal_kit_price: {
      type: Number,
      min: [0, '价格不能为负数']
    },
    // 其他备件
    other_parts: [{
      part_name: String,
      part_number: String,
      price: {
        type: Number,
        min: [0, '价格不能为负数']
      }
    }]
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
  
  // 尺寸数据（扩展字段，用于所有系列）
  // 存储完整的尺寸信息，包括轮廓、法兰、顶部安装和气动连接
  dimensions: {
    // 轮廓尺寸
    outline: {
      L1: { type: Number }, // 单作用总长
      L2: { type: Number }, // 双作用/单作用气缸长度
      m1: { type: Number },
      m2: { type: Number },
      A: { type: Number },
      H1: { type: Number },
      H2: { type: Number },
      D: { type: Number }
    },
    
    // 法兰尺寸
    flange: {
      standard: { type: String }, // 例如: 'ISO 5211 F10'
      D: { type: Number },
      A: { type: Number }, // 方口尺寸
      C: { type: Number },
      F: { type: Number },
      threadSpec: { type: String }, // 例如: '4-M10'
      threadDepth: { type: Number },
      B: { type: Number },
      T: { type: Number }
    },
    
    // 顶部安装尺寸
    topMounting: {
      standard: { type: String }, // 例如: 'NAMUR VDI/VDE 3845'
      L: { type: Number },
      h1: { type: Number },
      H: { type: Number }
    },
    
    // 气动连接尺寸
    pneumaticConnection: {
      size: { type: String }, // 例如: 'NPT1/4"'
      h2: { type: Number }
    }
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
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
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

// 实例方法：根据温度类型获取标准价格
actuatorSchema.methods.getBasePrice = function(temperatureType = 'normal') {
  switch (temperatureType) {
    case 'low':
    case 'low_temp':
      return this.base_price_low || null;
    case 'high':
    case 'high_temp':
      return this.base_price_high || null;
    case 'normal':
    default:
      return this.base_price_normal || null;
  }
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
  
  next();
});

// 性能优化：为经常查询的字段添加索引
actuatorSchema.index({ series: 1 }); // 按系列查询
actuatorSchema.index({ body_size: 1 }); // 按本体尺寸查询
actuatorSchema.index({ action_type: 1 }); // 按作用类型查询
actuatorSchema.index({ supplier_id: 1 }); // 按供应商查询
actuatorSchema.index({ mechanism: 1 }); // 按机构类型查询
actuatorSchema.index({ series: 1, body_size: 1 }); // 组合索引：系列+尺寸
actuatorSchema.index({ torque_90: 1 }); // 按扭矩查询（选型常用）
actuatorSchema.index({ createdAt: -1 }); // 按创建时间排序

module.exports = mongoose.model('Actuator', actuatorSchema);

