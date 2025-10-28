const mongoose = require('mongoose');

const manualOverrideSchema = new mongoose.Schema({
  // 手动操作装置型号
  model: {
    type: String,
    required: [true, '请提供手动操作装置型号'],
    trim: true,
    uppercase: true,
    unique: true
  },
  
  // 型号名称/描述
  name: {
    type: String,
    trim: true
  },
  
  // 价格
  price: {
    type: Number,
    required: [true, '请提供价格'],
    min: [0, '价格不能为负数']
  },
  
  // 兼容的本体尺寸列表
  compatible_body_sizes: [{
    type: String,
    trim: true,
    uppercase: true
  }],
  
  // 技术规格
  specifications: {
    // 操作类型
    operation_type: {
      type: String,
      enum: ['手轮', '手柄', '链轮', '蜗轮箱'],
      default: '手轮'
    },
    
    // 减速比
    gear_ratio: {
      type: String,
      trim: true
    },
    
    // 输出扭矩 (Nm)
    output_torque: {
      type: Number,
      min: 0
    },
    
    // 重量 (kg)
    weight: {
      type: Number,
      min: 0
    },
    
    // 安装位置
    mounting_position: {
      type: String,
      enum: ['顶部', '侧面', '底部'],
      default: '顶部'
    },
    
    // 材质
    material: {
      type: String,
      default: '铸铁'
    },
    
    // 防护等级
    protection_class: {
      type: String,
      default: 'IP65'
    }
  },
  
  // 尺寸信息
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  
  // 库存信息
  stock_info: {
    available: {
      type: Boolean,
      default: true
    },
    lead_time: {
      type: Number,
      default: 7,
      min: 0
    }
  },
  
  // 适用场景描述
  application: {
    type: String,
    trim: true
  },
  
  // 特殊要求或限制
  restrictions: {
    type: String,
    trim: true
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

// 索引优化查询性能
manualOverrideSchema.index({ model: 1 });
manualOverrideSchema.index({ compatible_body_sizes: 1 });
manualOverrideSchema.index({ is_active: 1 });
manualOverrideSchema.index({ 'stock_info.available': 1 });

// 实例方法：检查是否兼容指定的本体尺寸
manualOverrideSchema.methods.isCompatibleWith = function(bodySize) {
  return this.compatible_body_sizes.includes(bodySize.toUpperCase());
};

// 静态方法：查找兼容指定本体尺寸的所有手动操作装置
manualOverrideSchema.statics.findCompatible = async function(bodySize) {
  return await this.find({
    compatible_body_sizes: bodySize.toUpperCase(),
    is_active: true,
    'stock_info.available': true
  }).sort({ price: 1 });
};

// 静态方法：批量检查兼容性
manualOverrideSchema.statics.findCompatibleForMultiple = async function(bodySizes) {
  const bodySizesUpper = bodySizes.map(size => size.toUpperCase());
  return await this.find({
    compatible_body_sizes: { $in: bodySizesUpper },
    is_active: true
  }).sort({ model: 1 });
};

// 保存前的验证
manualOverrideSchema.pre('save', function(next) {
  // 确保所有兼容尺寸都是大写
  if (this.compatible_body_sizes && this.compatible_body_sizes.length > 0) {
    this.compatible_body_sizes = this.compatible_body_sizes.map(size => size.toUpperCase());
  }
  next();
});

// 虚拟字段：完整描述
manualOverrideSchema.virtual('full_description').get(function() {
  return `${this.model} - ${this.name || '手动操作装置'}`;
});

module.exports = mongoose.model('ManualOverride', manualOverrideSchema);


