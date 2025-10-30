const mongoose = require('mongoose');

const accessorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请提供配件名称'],
    trim: true
  },
  
  category: {
    type: String,
    required: [true, '请提供配件类别'],
    enum: {
      values: ['控制类', '连接与传动类', '安全与保护类', '检测与反馈类', '辅助与安装工具'],
      message: '{VALUE} 不是有效的配件类别'
    }
  },
  
  specifications: {
    type: Map,
    of: String,
    default: new Map()
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
  // 定义该配件由哪些零部件组成
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
  
  compatibility_rules: {
    type: Object,
    default: {}
  },
  
  // 额外的有用字段
  description: {
    type: String,
    trim: true
  },
  
  manufacturer: {
    type: String,
    trim: true
  },
  
  model_number: {
    type: String,
    trim: true
  },
  
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
      type: String,
      default: '7-14天'
    }
  },
  
  images: [{
    type: String
  }],
  
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
accessorySchema.index({ name: 1 });
accessorySchema.index({ category: 1 });
accessorySchema.index({ base_price_normal: 1 });
accessorySchema.index({ is_active: 1 });

// 虚拟字段：是否有货
accessorySchema.virtual('in_stock').get(function() {
  return this.stock_info?.quantity > 0 && this.stock_info?.available;
});

// ========== 价格相关实例方法 ==========

// 实例方法：根据温度类型获取标准价格
accessorySchema.methods.getBasePrice = function(temperatureType = 'normal') {
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

// 实例方法：检查与特定执行器的兼容性
accessorySchema.methods.isCompatibleWith = function(actuator) {
  if (!this.compatibility_rules || Object.keys(this.compatibility_rules).length === 0) {
    return true; // 如果没有兼容性规则，默认兼容
  }
  
  // 检查机身尺寸兼容性
  if (this.compatibility_rules.body_sizes) {
    const compatibleSizes = this.compatibility_rules.body_sizes;
    if (Array.isArray(compatibleSizes) && !compatibleSizes.includes(actuator.body_size)) {
      return false;
    }
  }
  
  // 检查作用类型兼容性
  if (this.compatibility_rules.action_types) {
    const compatibleTypes = this.compatibility_rules.action_types;
    if (Array.isArray(compatibleTypes) && !compatibleTypes.includes(actuator.action_type)) {
      return false;
    }
  }
  
  // 检查型号兼容性
  if (this.compatibility_rules.models) {
    const compatibleModels = this.compatibility_rules.models;
    if (Array.isArray(compatibleModels)) {
      const isModelCompatible = compatibleModels.some(pattern => {
        return actuator.model_base.includes(pattern);
      });
      if (!isModelCompatible) {
        return false;
      }
    }
  }
  
  return true;
};

// 静态方法：根据类别查找配件
accessorySchema.statics.findByCategory = function(category) {
  return this.find({ category, is_active: true }).sort({ base_price_normal: 1 });
};

// 静态方法：查找兼容的配件
accessorySchema.statics.findCompatibleAccessories = async function(actuator, category = null) {
  const query = { is_active: true };
  
  if (category) {
    query.category = category;
  }
  
  const accessories = await this.find(query);
  
  return accessories.filter(accessory => accessory.isCompatibleWith(actuator));
};

// 静态方法：按价格范围查找（基于常温标准价）
accessorySchema.statics.findByPriceRange = function(minPrice, maxPrice, category = null) {
  const query = {
    base_price_normal: { $gte: minPrice, $lte: maxPrice },
    is_active: true
  };
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query).sort({ base_price_normal: 1 });
};

// 前置钩子：保存前验证
accessorySchema.pre('save', function(next) {
  // 这里可以添加其他必要的验证逻辑
  next();
});

// 导出模型
const Accessory = mongoose.model('Accessory', accessorySchema);

module.exports = Accessory;
