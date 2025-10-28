/**
 * 定价工具模块
 * 
 * 提供价格计算、阶梯定价处理等功能
 * 
 * @module utils/pricing
 * @author C-MAX 技术团队
 * @date 2025-10-27
 */

/**
 * 根据产品定价模式计算价格（核心函数 - 已升级支持新定价架构）
 * 
 * 支持两种调用方式：
 * 1. 新方式（推荐）：calculatePrice(product, quantity)
 * 2. 旧方式（向后兼容）：calculatePrice(priceTiers, quantity, priceType)
 * 
 * @param {Object|Array} productOrPriceTiers - 产品对象或价格档位数组
 * @param {Number} quantity - 采购数量
 * @param {String} priceType - 价格类型（仅用于旧方式调用）
 * @returns {Number|Object} 单价（新方式）或价格信息对象（旧方式）
 * 
 * @example
 * // 新方式：固定价格产品
 * const product = { pricing_model: 'fixed', base_price: 1200 };
 * const unitPrice = calculatePrice(product, 5);
 * // 返回: 1200
 * 
 * @example
 * // 新方式：阶梯价格产品
 * const product = {
 *   pricing_model: 'tiered',
 *   base_price: 2500,
 *   price_tiers: [
 *     { min_quantity: 1, unit_price: 2500 },
 *     { min_quantity: 10, unit_price: 2300 },
 *     { min_quantity: 50, unit_price: 2100 }
 *   ]
 * };
 * const unitPrice = calculatePrice(product, 15);
 * // 返回: 2300
 * 
 * @example
 * // 旧方式（向后兼容）
 * const priceTiers = [
 *   { min_quantity: 1, unit_price: 5280, price_type: 'normal' },
 *   { min_quantity: 10, unit_price: 4752, price_type: 'normal' }
 * ];
 * const priceInfo = calculatePrice(priceTiers, 8, 'normal');
 * // 返回: { unit_price: 5280, total_price: 42240, ... }
 */
function calculatePrice(productOrPriceTiers, quantity = 1, priceType = 'normal') {
  // 参数验证
  if (!quantity || quantity < 1) {
    quantity = 1;
  }

  // ========== 新方式：接收完整的产品对象 ==========
  if (productOrPriceTiers && typeof productOrPriceTiers === 'object' && !Array.isArray(productOrPriceTiers)) {
    const product = productOrPriceTiers;
    
    // 检查是否使用阶梯定价模式
    if (product.pricing_model === 'tiered' && product.price_tiers && product.price_tiers.length > 0) {
      // --- 执行阶梯价格查找逻辑 ---
      let applicablePrice = product.base_price || 0; // 默认使用基础价格
      
      // 倒序遍历价格档位，找到第一个满足数量要求的阶梯
      for (let i = product.price_tiers.length - 1; i >= 0; i--) {
        if (quantity >= product.price_tiers[i].min_quantity) {
          applicablePrice = product.price_tiers[i].unit_price;
          break;
        }
      }
      
      return applicablePrice; // 返回单价
    } else {
      // --- 固定价格模式 ---
      return product.base_price || 0; // 返回固定单价
    }
  }

  // ========== 旧方式：接收价格档位数组（向后兼容）==========
  const priceTiers = productOrPriceTiers;
  
  // 参数验证
  if (!priceTiers || !Array.isArray(priceTiers) || priceTiers.length === 0) {
    return null;
  }

  // 筛选符合价格类型的档位
  let tiers = priceTiers.filter(tier => {
    // 如果 tier 没有 price_type，或者 price_type 匹配
    return !tier.price_type || tier.price_type === priceType;
  });

  // 如果没有找到对应类型的档位，使用全部档位
  if (tiers.length === 0) {
    tiers = priceTiers;
  }

  // 按 min_quantity 从大到小排序
  tiers = tiers.sort((a, b) => b.min_quantity - a.min_quantity);

  // 找到第一个满足条件的价格档位（即 quantity >= min_quantity 的最大档位）
  for (const tier of tiers) {
    if (quantity >= tier.min_quantity) {
      return {
        unit_price: tier.unit_price,
        total_price: tier.unit_price * quantity,
        min_quantity: tier.min_quantity,
        quantity: quantity,
        price_type: tier.price_type || priceType,
        notes: tier.notes || null,
        discount_rate: null // 稍后计算
      };
    }
  }

  // 如果数量小于所有档位的最小数量，返回最低档位的价格（带警告）
  const lowestTier = tiers[tiers.length - 1];
  return {
    unit_price: lowestTier.unit_price,
    total_price: lowestTier.unit_price * quantity,
    min_quantity: lowestTier.min_quantity,
    quantity: quantity,
    price_type: lowestTier.price_type || priceType,
    notes: lowestTier.notes || null,
    warning: `数量 ${quantity} 低于最小起订量 ${lowestTier.min_quantity}`
  };
}

/**
 * 获取所有价格档位（按数量升序排列）
 * 
 * @param {Array} priceTiers - 价格档位数组
 * @param {String} priceType - 可选：价格类型筛选
 * @returns {Array} 排序后的价格档位数组
 * 
 * @example
 * const tiers = getAllPriceTiers(priceTiers, 'normal');
 */
function getAllPriceTiers(priceTiers, priceType = null) {
  if (!priceTiers || !Array.isArray(priceTiers) || priceTiers.length === 0) {
    return [];
  }

  let tiers = priceTiers;

  // 如果指定了价格类型，进行筛选
  if (priceType) {
    tiers = tiers.filter(tier => tier.price_type === priceType);
  }

  // 按 min_quantity 从小到大排序
  return tiers.sort((a, b) => a.min_quantity - b.min_quantity);
}

/**
 * 计算折扣率
 * 
 * @param {Number} originalPrice - 原价
 * @param {Number} discountedPrice - 折后价
 * @returns {Number} 折扣率（百分比，保留2位小数）
 * 
 * @example
 * const discount = calculateDiscountRate(5280, 4752);
 * // 返回: 10.00 (表示10%折扣)
 */
function calculateDiscountRate(originalPrice, discountedPrice) {
  if (!originalPrice || originalPrice <= 0) {
    return 0;
  }

  const rate = ((originalPrice - discountedPrice) / originalPrice) * 100;
  return Math.round(rate * 100) / 100; // 保留2位小数
}

/**
 * 为价格档位添加折扣率信息
 * 
 * @param {Array} priceTiers - 价格档位数组
 * @returns {Array} 带折扣率信息的价格档位数组
 * 
 * @example
 * const tiersWithDiscount = enrichPriceTiersWithDiscount(priceTiers);
 */
function enrichPriceTiersWithDiscount(priceTiers) {
  if (!priceTiers || !Array.isArray(priceTiers) || priceTiers.length === 0) {
    return [];
  }

  // 找到基础价格（通常是数量为1的档位）
  const sortedTiers = [...priceTiers].sort((a, b) => a.min_quantity - b.min_quantity);
  const basePrice = sortedTiers[0].unit_price;

  return priceTiers.map(tier => ({
    ...tier,
    discount_rate: calculateDiscountRate(basePrice, tier.unit_price),
    is_base_price: tier.min_quantity === sortedTiers[0].min_quantity
  }));
}

/**
 * 查找推荐的采购数量（达到更优价格档位）
 * 
 * @param {Array} priceTiers - 价格档位数组
 * @param {Number} currentQuantity - 当前数量
 * @param {String} priceType - 价格类型
 * @returns {Object|null} 推荐信息
 * 
 * @example
 * const recommendation = getRecommendedQuantity(priceTiers, 8);
 * // 可能返回: { 
 * //   recommended_quantity: 10, 
 * //   current_unit_price: 5016,
 * //   next_tier_unit_price: 4752,
 * //   savings_per_unit: 264,
 * //   additional_quantity_needed: 2
 * // }
 */
function getRecommendedQuantity(priceTiers, currentQuantity, priceType = 'normal') {
  const currentPrice = calculatePrice(priceTiers, currentQuantity, priceType);
  
  if (!currentPrice) {
    return null;
  }

  // 获取所有档位（升序）
  const tiers = getAllPriceTiers(priceTiers, priceType);
  
  // 找到当前档位的索引
  const currentTierIndex = tiers.findIndex(
    tier => tier.min_quantity === currentPrice.min_quantity
  );

  // 如果已经是最高档位，无需推荐
  if (currentTierIndex === tiers.length - 1) {
    return null;
  }

  // 获取下一个档位
  const nextTier = tiers[currentTierIndex + 1];
  
  if (!nextTier) {
    return null;
  }

  const additionalQuantity = nextTier.min_quantity - currentQuantity;
  const savingsPerUnit = currentPrice.unit_price - nextTier.unit_price;
  const totalSavings = savingsPerUnit * nextTier.min_quantity;

  return {
    recommended_quantity: nextTier.min_quantity,
    current_quantity: currentQuantity,
    current_unit_price: currentPrice.unit_price,
    next_tier_unit_price: nextTier.unit_price,
    savings_per_unit: savingsPerUnit,
    total_savings: totalSavings,
    additional_quantity_needed: additionalQuantity,
    message: `再购买 ${additionalQuantity} 件即可享受 ¥${nextTier.unit_price}/件的优惠价格，每件节省 ¥${savingsPerUnit}`
  };
}

/**
 * 计算批量采购的节省金额
 * 
 * @param {Array} priceTiers - 价格档位数组
 * @param {Number} quantity - 采购数量
 * @param {String} priceType - 价格类型
 * @returns {Object} 节省金额信息
 * 
 * @example
 * const savings = calculateSavings(priceTiers, 15);
 */
function calculateSavings(priceTiers, quantity, priceType = 'normal') {
  if (!priceTiers || quantity < 1) {
    return null;
  }

  const actualPrice = calculatePrice(priceTiers, quantity, priceType);
  
  if (!actualPrice) {
    return null;
  }

  // 获取基础价格（数量为1的价格）
  const basePrice = calculatePrice(priceTiers, 1, priceType);
  
  if (!basePrice) {
    return null;
  }

  const baseTotalPrice = basePrice.unit_price * quantity;
  const actualTotalPrice = actualPrice.total_price;
  const savings = baseTotalPrice - actualTotalPrice;
  const savingsRate = (savings / baseTotalPrice) * 100;

  return {
    base_unit_price: basePrice.unit_price,
    actual_unit_price: actualPrice.unit_price,
    base_total_price: baseTotalPrice,
    actual_total_price: actualTotalPrice,
    total_savings: savings,
    savings_rate: Math.round(savingsRate * 100) / 100,
    quantity: quantity
  };
}

/**
 * 生成标准阶梯定价（基于基础价格）
 * 
 * @param {Number} basePrice - 基础价格
 * @param {Array} discountRates - 折扣率数组 [{ quantity, rate }]
 * @param {String} priceType - 价格类型
 * @returns {Array} 生成的价格档位数组
 * 
 * @example
 * const tiers = generateStandardPriceTiers(5280, [
 *   { quantity: 1, rate: 0 },
 *   { quantity: 5, rate: 0.05 },
 *   { quantity: 10, rate: 0.10 },
 *   { quantity: 20, rate: 0.15 }
 * ]);
 */
function generateStandardPriceTiers(basePrice, discountRates = null, priceType = 'normal') {
  if (!basePrice || basePrice <= 0) {
    return [];
  }

  // 默认折扣档位
  const defaultDiscountRates = [
    { quantity: 1, rate: 0, notes: '基础价格' },
    { quantity: 5, rate: 0.05, notes: '批量折扣5%（5-9件）' },
    { quantity: 10, rate: 0.10, notes: '批量折扣10%（10-19件）' },
    { quantity: 20, rate: 0.15, notes: '批量折扣15%（20件以上）' }
  ];

  const rates = discountRates || defaultDiscountRates;

  return rates.map(({ quantity, rate, notes }) => ({
    min_quantity: quantity,
    unit_price: Math.round(basePrice * (1 - rate)),
    price_type: priceType,
    notes: notes || `${rate * 100}% 折扣`
  }));
}

/**
 * 验证价格档位数据
 * 
 * @param {Array} priceTiers - 价格档位数组
 * @returns {Object} 验证结果 { valid: Boolean, errors: Array }
 */
function validatePriceTiers(priceTiers) {
  const errors = [];

  if (!priceTiers || !Array.isArray(priceTiers)) {
    errors.push('price_tiers 必须是数组');
    return { valid: false, errors };
  }

  if (priceTiers.length === 0) {
    errors.push('price_tiers 不能为空');
    return { valid: false, errors };
  }

  // 检查每个档位
  priceTiers.forEach((tier, index) => {
    if (!tier.min_quantity || tier.min_quantity < 1) {
      errors.push(`档位 ${index + 1}: min_quantity 必须大于0`);
    }

    if (tier.unit_price === undefined || tier.unit_price === null || tier.unit_price < 0) {
      errors.push(`档位 ${index + 1}: unit_price 不能为负数`);
    }
  });

  // 检查是否有重复的 min_quantity
  const quantities = priceTiers.map(t => t.min_quantity);
  const uniqueQuantities = [...new Set(quantities)];
  
  if (quantities.length !== uniqueQuantities.length) {
    errors.push('存在重复的 min_quantity');
  }

  // 检查价格是否递减（通常批量应该更便宜）
  const sorted = [...priceTiers].sort((a, b) => a.min_quantity - b.min_quantity);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].unit_price > sorted[i - 1].unit_price) {
      errors.push(`警告: 档位 ${sorted[i].min_quantity} 的价格高于前一档位`);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * 格式化价格显示
 * 
 * @param {Number} price - 价格
 * @param {String} currency - 货币符号
 * @returns {String} 格式化后的价格字符串
 * 
 * @example
 * formatPrice(5280); // "¥5,280"
 * formatPrice(5280, '$'); // "$5,280"
 */
function formatPrice(price, currency = '¥') {
  if (price === undefined || price === null) {
    return '-';
  }

  return `${currency}${price.toLocaleString('zh-CN')}`;
}

/**
 * 批量计算多个产品的总价
 * 
 * @param {Array} items - 产品数组 [{ priceTiers, quantity, priceType }] 或 [{ product, quantity }]
 * @returns {Object} 总价信息
 */
function calculateBulkPrice(items) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return {
      total_price: 0,
      items_count: 0,
      items: []
    };
  }

  const calculatedItems = items.map((item, index) => {
    let unitPrice, subtotal;
    
    // 支持新方式（product对象）
    if (item.product) {
      unitPrice = calculatePrice(item.product, item.quantity);
      subtotal = unitPrice * item.quantity;
      
      return {
        index: index,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal: subtotal,
        pricing_model: item.product.pricing_model
      };
    }
    
    // 支持旧方式（priceTiers数组）
    const price = calculatePrice(item.priceTiers, item.quantity, item.priceType);
    
    return {
      index: index,
      quantity: item.quantity,
      price_info: price,
      subtotal: price ? price.total_price : 0
    };
  });

  const totalPrice = calculatedItems.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    total_price: totalPrice,
    items_count: items.length,
    total_quantity: calculatedItems.reduce((sum, item) => sum + item.quantity, 0),
    items: calculatedItems
  };
}

/**
 * 获取产品的价格信息（包含详细信息）
 * 
 * @param {Object} product - 产品对象
 * @param {Number} quantity - 采购数量
 * @returns {Object} 详细价格信息
 * 
 * @example
 * const product = {
 *   model_base: 'AT-SR52K8',
 *   pricing_model: 'tiered',
 *   base_price: 2500,
 *   price_tiers: [
 *     { min_quantity: 1, unit_price: 2500 },
 *     { min_quantity: 10, unit_price: 2300 },
 *     { min_quantity: 50, unit_price: 2100 }
 *   ]
 * };
 * 
 * const priceInfo = getProductPriceInfo(product, 15);
 * // 返回: {
 * //   unit_price: 2300,
 * //   total_price: 34500,
 * //   quantity: 15,
 * //   pricing_model: 'tiered',
 * //   applied_tier: { min_quantity: 10, unit_price: 2300 },
 * //   savings: { amount: 3000, rate: 8.7 }
 * // }
 */
function getProductPriceInfo(product, quantity = 1) {
  if (!product) {
    return null;
  }

  const unitPrice = calculatePrice(product, quantity);
  const totalPrice = unitPrice * quantity;
  
  const priceInfo = {
    unit_price: unitPrice,
    total_price: totalPrice,
    quantity: quantity,
    pricing_model: product.pricing_model || 'fixed',
    base_price: product.base_price
  };

  // 如果是阶梯定价，添加额外信息
  if (product.pricing_model === 'tiered' && product.price_tiers && product.price_tiers.length > 0) {
    // 找到应用的价格档位
    let appliedTier = null;
    for (let i = product.price_tiers.length - 1; i >= 0; i--) {
      if (quantity >= product.price_tiers[i].min_quantity) {
        appliedTier = product.price_tiers[i];
        break;
      }
    }
    
    if (appliedTier) {
      priceInfo.applied_tier = {
        min_quantity: appliedTier.min_quantity,
        unit_price: appliedTier.unit_price,
        price_type: appliedTier.price_type,
        notes: appliedTier.notes
      };
      
      // 计算节省金额（相对于基础价格）
      if (product.base_price && unitPrice < product.base_price) {
        const savingsAmount = (product.base_price - unitPrice) * quantity;
        const savingsRate = ((product.base_price - unitPrice) / product.base_price) * 100;
        
        priceInfo.savings = {
          amount: Math.round(savingsAmount),
          rate: Math.round(savingsRate * 100) / 100,
          per_unit: product.base_price - unitPrice
        };
      }
      
      // 查找下一个价格档位（推荐更多采购）
      const currentTierIndex = product.price_tiers.indexOf(appliedTier);
      if (currentTierIndex < product.price_tiers.length - 1) {
        const nextTier = product.price_tiers[currentTierIndex + 1];
        priceInfo.next_tier = {
          min_quantity: nextTier.min_quantity,
          unit_price: nextTier.unit_price,
          additional_quantity_needed: nextTier.min_quantity - quantity,
          additional_savings_per_unit: unitPrice - nextTier.unit_price
        };
      }
    }
    
    // 添加所有可用档位
    priceInfo.available_tiers = product.price_tiers.map(tier => ({
      min_quantity: tier.min_quantity,
      unit_price: tier.unit_price,
      price_type: tier.price_type,
      notes: tier.notes
    }));
  }

  return priceInfo;
}

// 导出所有函数
module.exports = {
  calculatePrice,              // 核心函数：根据产品和数量计算价格
  getProductPriceInfo,         // 新增：获取产品的详细价格信息
  getAllPriceTiers,
  calculateDiscountRate,
  enrichPriceTiersWithDiscount,
  getRecommendedQuantity,
  calculateSavings,
  generateStandardPriceTiers,
  validatePriceTiers,
  formatPrice,
  calculateBulkPrice
};

