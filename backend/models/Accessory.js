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
  // 注意：此字段为可选字段
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
    
    // 可选：价格类型标识
    price_type: {
      type: String,
      enum: ['normal', 'bulk', 'promotional'],
      default: 'normal',
      trim: true
    },
    
    // 可选：备注说明
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // 兼容性保留：旧的 price 字段（已弃用，请使用 base_price）
  price: {
    type: Number,
    min: [0, '价格不能为负数']
  },
  
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
accessorySchema.index({ price: 1 });
accessorySchema.index({ is_active: 1 });

// 虚拟字段：是否有货
accessorySchema.virtual('in_stock').get(function() {
  return this.stock_info?.quantity > 0 && this.stock_info?.available;
});

// ========== 定价相关实例方法 ==========

// 实例方法：根据数量获取对应的单价（支持固定价格和阶梯定价）
accessorySchema.methods.getPriceByQuantity = function(quantity, priceType = 'normal') {
  // 如果定价模式为固定价格，直接返回 base_price
  if (this.pricing_model === 'fixed') {
    return this.base_price || this.price || null; // 兼容旧的 price 字段
  }
  
  // 如果定价模式为阶梯价格，使用 price_tiers
  if (this.pricing_model === 'tiered') {
    if (!this.price_tiers || this.price_tiers.length === 0) {
      return null;
    }
    
    // 筛选符合价格类型的档位
    let tiers = this.price_tiers;
    if (priceType) {
      tiers = tiers.filter(tier => tier.price_type === priceType);
    }
    
    // 如果没有符合的档位，使用所有档位
    if (tiers.length === 0) {
      tiers = this.price_tiers;
    }
    
    // 按 min_quantity 降序排序
    const sortedTiers = tiers.sort((a, b) => b.min_quantity - a.min_quantity);
    
    // 找到第一个 min_quantity 小于等于 quantity 的档位
    for (let tier of sortedTiers) {
      if (quantity >= tier.min_quantity) {
        return tier.unit_price;
      }
    }
    
    // 如果没有找到合适的档位，返回最小数量的档位价格
    return sortedTiers[sortedTiers.length - 1]?.unit_price || null;
  }
  
  // 默认情况：优先返回 base_price，其次是 price（向后兼容）
  return this.base_price || this.price || null;
};

// 实例方法：获取所有价格档位（用于展示）
accessorySchema.methods.getAllPriceTiers = function(priceType = null) {
  // 如果定价模式为固定价格，返回单一价格信息
  if (this.pricing_model === 'fixed') {
    const fixedPrice = this.base_price || this.price;
    if (!fixedPrice) {
      return [];
    }
    return [{
      min_quantity: 1,
      unit_price: fixedPrice,
      price_type: 'normal',
      notes: '固定单价'
    }];
  }
  
  // 如果定价模式为阶梯价格，返回阶梯价格列表
  if (this.pricing_model === 'tiered') {
    if (!this.price_tiers || this.price_tiers.length === 0) {
      return [];
    }
    
    let tiers = this.price_tiers;
    
    // 如果指定了价格类型，进行筛选
    if (priceType) {
      tiers = tiers.filter(tier => tier.price_type === priceType);
    }
    
    // 按 min_quantity 升序排序
    return tiers.sort((a, b) => a.min_quantity - b.min_quantity);
  }
  
  // 默认情况
  return [];
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
  return this.find({ category, is_active: true }).sort({ price: 1 });
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

// 静态方法：按价格范围查找
accessorySchema.statics.findByPriceRange = function(minPrice, maxPrice, category = null) {
  const query = {
    price: { $gte: minPrice, $lte: maxPrice },
    is_active: true
  };
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query).sort({ price: 1 });
};

// 前置钩子：保存前验证
accessorySchema.pre('save', function(next) {
  // ========== 定价模式数据验证 ==========
  // 验证定价模式和相应的价格数据
  if (this.pricing_model === 'fixed') {
    // 固定价格模式：必须提供 base_price 或 price
    const fixedPrice = this.base_price || this.price;
    if (!fixedPrice || fixedPrice <= 0) {
      return next(new Error('固定价格模式下必须提供有效的 base_price 或 price（基础价格）'));
    }
    
    // 如果同时有 base_price 和 price，同步它们
    if (!this.base_price && this.price) {
      this.base_price = this.price;
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
  
  // 向后兼容：确保旧的 price 字段为正数
  if (this.price && this.price < 0) {
    return next(new Error('配件价格不能为负数'));
  }
  
  next();
});

// 导出模型
const Accessory = mongoose.model('Accessory', accessorySchema);

module.exports = Accessory;
