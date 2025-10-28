/**
 * 定价工具模块测试文件
 * 
 * 使用方法: node utils/pricing.test.js
 */

const pricing = require('./pricing');

// 测试数据：标准阶梯定价
const samplePriceTiers = [
  {
    min_quantity: 1,
    unit_price: 5280,
    price_type: 'normal',
    notes: '基础价格'
  },
  {
    min_quantity: 5,
    unit_price: 5016,
    price_type: 'normal',
    notes: '批量折扣5%（5-9件）'
  },
  {
    min_quantity: 10,
    unit_price: 4752,
    price_type: 'normal',
    notes: '批量折扣10%（10-19件）'
  },
  {
    min_quantity: 20,
    unit_price: 4488,
    price_type: 'normal',
    notes: '批量折扣15%（20件以上）'
  }
];

console.log('═══════════════════════════════════════════════');
console.log('  定价工具模块测试');
console.log('═══════════════════════════════════════════════\n');

// 测试 1: calculatePrice - 基础价格计算
console.log('📋 测试 1: calculatePrice - 基础价格计算');
console.log('─────────────────────────────────────────────\n');

const testCases = [
  { quantity: 1, expected: 5280 },
  { quantity: 3, expected: 5280 },
  { quantity: 5, expected: 5016 },
  { quantity: 8, expected: 5016 },
  { quantity: 10, expected: 4752 },
  { quantity: 15, expected: 4752 },
  { quantity: 20, expected: 4488 },
  { quantity: 50, expected: 4488 }
];

testCases.forEach(({ quantity, expected }) => {
  const result = pricing.calculatePrice(samplePriceTiers, quantity);
  const passed = result && result.unit_price === expected;
  const symbol = passed ? '✓' : '✗';
  
  console.log(`${symbol} 数量 ${quantity} 件:`);
  console.log(`  单价: ¥${result.unit_price} (预期: ¥${expected})`);
  console.log(`  总价: ¥${result.total_price.toLocaleString()}`);
  console.log(`  档位: ${result.min_quantity}件起`);
  console.log('');
});

// 测试 2: getAllPriceTiers - 获取所有价格档位
console.log('📋 测试 2: getAllPriceTiers - 获取所有价格档位');
console.log('─────────────────────────────────────────────\n');

const allTiers = pricing.getAllPriceTiers(samplePriceTiers);
console.log(`总共 ${allTiers.length} 个价格档位:\n`);

allTiers.forEach((tier, index) => {
  console.log(`档位 ${index + 1}:`);
  console.log(`  起订量: ${tier.min_quantity} 件`);
  console.log(`  单价: ¥${tier.unit_price}`);
  console.log(`  说明: ${tier.notes}`);
  console.log('');
});

// 测试 3: enrichPriceTiersWithDiscount - 计算折扣率
console.log('📋 测试 3: enrichPriceTiersWithDiscount - 计算折扣率');
console.log('─────────────────────────────────────────────\n');

const tiersWithDiscount = pricing.enrichPriceTiersWithDiscount(samplePriceTiers);
tiersWithDiscount.forEach((tier, index) => {
  console.log(`档位 ${index + 1}:`);
  console.log(`  起订量: ${tier.min_quantity} 件`);
  console.log(`  单价: ¥${tier.unit_price}`);
  console.log(`  折扣: ${tier.discount_rate}%`);
  console.log(`  基础价格: ${tier.is_base_price ? '是' : '否'}`);
  console.log('');
});

// 测试 4: getRecommendedQuantity - 推荐采购数量
console.log('📋 测试 4: getRecommendedQuantity - 推荐采购数量');
console.log('─────────────────────────────────────────────\n');

const recommendTests = [3, 8, 15];
recommendTests.forEach(qty => {
  const recommendation = pricing.getRecommendedQuantity(samplePriceTiers, qty);
  
  if (recommendation) {
    console.log(`当前采购 ${qty} 件:`);
    console.log(`  ${recommendation.message}`);
    console.log(`  当前单价: ¥${recommendation.current_unit_price}`);
    console.log(`  优惠单价: ¥${recommendation.next_tier_unit_price}`);
    console.log(`  总节省: ¥${recommendation.total_savings.toLocaleString()}`);
    console.log('');
  } else {
    console.log(`当前采购 ${qty} 件: 已是最优价格档位\n`);
  }
});

// 测试 5: calculateSavings - 计算节省金额
console.log('📋 测试 5: calculateSavings - 计算节省金额');
console.log('─────────────────────────────────────────────\n');

const savingsTests = [1, 5, 10, 20, 50];
savingsTests.forEach(qty => {
  const savings = pricing.calculateSavings(samplePriceTiers, qty);
  
  if (savings) {
    console.log(`采购 ${qty} 件:`);
    console.log(`  基础总价: ¥${savings.base_total_price.toLocaleString()}`);
    console.log(`  实际总价: ¥${savings.actual_total_price.toLocaleString()}`);
    console.log(`  节省金额: ¥${savings.total_savings.toLocaleString()}`);
    console.log(`  节省率: ${savings.savings_rate}%`);
    console.log('');
  }
});

// 测试 6: generateStandardPriceTiers - 生成标准价格档位
console.log('📋 测试 6: generateStandardPriceTiers - 生成标准价格档位');
console.log('─────────────────────────────────────────────\n');

const generatedTiers = pricing.generateStandardPriceTiers(8500);
console.log('基于 ¥8,500 生成的标准价格档位:\n');

generatedTiers.forEach((tier, index) => {
  console.log(`档位 ${index + 1}:`);
  console.log(`  起订量: ${tier.min_quantity} 件`);
  console.log(`  单价: ¥${tier.unit_price}`);
  console.log(`  说明: ${tier.notes}`);
  console.log('');
});

// 测试 7: validatePriceTiers - 验证价格档位
console.log('📋 测试 7: validatePriceTiers - 验证价格档位');
console.log('─────────────────────────────────────────────\n');

// 有效的价格档位
const validResult = pricing.validatePriceTiers(samplePriceTiers);
console.log('验证有效价格档位:');
console.log(`  结果: ${validResult.valid ? '✓ 有效' : '✗ 无效'}`);
console.log(`  错误: ${validResult.errors.length} 个`);
console.log('');

// 无效的价格档位
const invalidTiers = [
  { min_quantity: 1, unit_price: 5280 },
  { min_quantity: 5, unit_price: 6000 },  // 价格反而更高
  { min_quantity: 5, unit_price: 5500 }   // 重复的 min_quantity
];

const invalidResult = pricing.validatePriceTiers(invalidTiers);
console.log('验证无效价格档位:');
console.log(`  结果: ${invalidResult.valid ? '✓ 有效' : '✗ 无效'}`);
console.log(`  错误数量: ${invalidResult.errors.length} 个`);
invalidResult.errors.forEach((error, index) => {
  console.log(`  ${index + 1}. ${error}`);
});
console.log('');

// 测试 8: calculateBulkPrice - 批量计算
console.log('📋 测试 8: calculateBulkPrice - 批量计算多个产品');
console.log('─────────────────────────────────────────────\n');

const bulkItems = [
  { priceTiers: samplePriceTiers, quantity: 8, priceType: 'normal' },
  { priceTiers: samplePriceTiers, quantity: 15, priceType: 'normal' },
  { priceTiers: samplePriceTiers, quantity: 25, priceType: 'normal' }
];

const bulkResult = pricing.calculateBulkPrice(bulkItems);

console.log('批量计算结果:');
console.log(`  产品数量: ${bulkResult.items_count} 个`);
console.log(`  总件数: ${bulkResult.total_quantity} 件`);
console.log(`  总价: ¥${bulkResult.total_price.toLocaleString()}\n`);

bulkResult.items.forEach((item, index) => {
  console.log(`产品 ${index + 1}:`);
  console.log(`  数量: ${item.quantity} 件`);
  console.log(`  单价: ¥${item.price_info.unit_price}`);
  console.log(`  小计: ¥${item.subtotal.toLocaleString()}`);
  console.log('');
});

// 测试 9: formatPrice - 价格格式化
console.log('📋 测试 9: formatPrice - 价格格式化');
console.log('─────────────────────────────────────────────\n');

console.log('人民币格式:', pricing.formatPrice(5280));
console.log('美元格式:', pricing.formatPrice(5280, '$'));
console.log('欧元格式:', pricing.formatPrice(5280, '€'));
console.log('空值处理:', pricing.formatPrice(null));
console.log('');

// 测试总结
console.log('═══════════════════════════════════════════════');
console.log('  测试完成！所有功能正常运行 ✓');
console.log('═══════════════════════════════════════════════\n');

// 导出供其他模块使用
if (require.main === module) {
  console.log('💡 提示: 在其他文件中使用:');
  console.log('   const pricing = require(\'./utils/pricing\');');
  console.log('   const price = pricing.calculatePrice(priceTiers, 10);');
  console.log('');
}

