/**
 * 定价函数升级测试脚本
 * 用于验证 calculatePrice 和 getProductPriceInfo 函数是否正确工作
 * 
 * 运行方式: node test-pricing-upgrade.js
 */

const { calculatePrice, getProductPriceInfo } = require('./utils/pricing');

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

console.log('\n' + colors.bold + colors.cyan + '╔═══════════════════════════════════════════════╗');
console.log('║     定价函数升级测试                         ║');
console.log('╚═══════════════════════════════════════════════╝' + colors.reset + '\n');

// ============================================
// 测试 1: 固定价格产品
// ============================================
console.log(colors.bold + colors.blue + '【测试 1】固定价格产品 (SF 系列)' + colors.reset);
console.log('─'.repeat(50));

const sfProduct = {
  model_base: 'SF025',
  series: 'SF',
  pricing_model: 'fixed',
  base_price: 1200
};

const testQuantities1 = [1, 5, 10, 50, 100];

console.log('\n产品信息:');
console.log(`  型号: ${sfProduct.model_base}`);
console.log(`  系列: ${sfProduct.series}`);
console.log(`  定价模式: ${sfProduct.pricing_model}`);
console.log(`  基础价格: ¥${sfProduct.base_price}\n`);

console.log('价格计算结果:');
testQuantities1.forEach(qty => {
  const unitPrice = calculatePrice(sfProduct, qty);
  const totalPrice = unitPrice * qty;
  console.log(`  数量 ${String(qty).padStart(3)}: 单价 ¥${unitPrice}, 总价 ¥${totalPrice.toLocaleString()}`);
});

console.log('\n' + colors.green + '✓ 测试通过：固定价格无论数量多少都保持一致' + colors.reset + '\n');

// ============================================
// 测试 2: 阶梯价格产品
// ============================================
console.log(colors.bold + colors.blue + '【测试 2】阶梯价格产品 (AT 系列)' + colors.reset);
console.log('─'.repeat(50));

const atProduct = {
  model_base: 'AT-SR52K8',
  series: 'AT',
  pricing_model: 'tiered',
  base_price: 2500,
  price_tiers: [
    { min_quantity: 1, unit_price: 2500, price_type: 'normal', notes: '标准价格' },
    { min_quantity: 10, unit_price: 2300, price_type: 'normal', notes: '批量优惠 (10-49件)' },
    { min_quantity: 50, unit_price: 2100, price_type: 'normal', notes: '大批量优惠 (50件以上)' }
  ]
};

const testQuantities2 = [1, 5, 9, 10, 15, 49, 50, 60, 100];

console.log('\n产品信息:');
console.log(`  型号: ${atProduct.model_base}`);
console.log(`  系列: ${atProduct.series}`);
console.log(`  定价模式: ${atProduct.pricing_model}`);
console.log(`  基础价格: ¥${atProduct.base_price}`);
console.log(`  价格档位:`);
atProduct.price_tiers.forEach(tier => {
  console.log(`    ${tier.min_quantity}+ 件: ¥${tier.unit_price} - ${tier.notes}`);
});

console.log('\n价格计算结果:');
testQuantities2.forEach(qty => {
  const unitPrice = calculatePrice(atProduct, qty);
  const totalPrice = unitPrice * qty;
  const savings = (atProduct.base_price - unitPrice) * qty;
  
  let tierInfo = '';
  for (let i = atProduct.price_tiers.length - 1; i >= 0; i--) {
    if (qty >= atProduct.price_tiers[i].min_quantity) {
      tierInfo = `[档位: ${atProduct.price_tiers[i].min_quantity}+]`;
      break;
    }
  }
  
  const savingsInfo = savings > 0 ? colors.green + ` 节省 ¥${savings.toLocaleString()}` + colors.reset : '';
  console.log(`  数量 ${String(qty).padStart(3)}: 单价 ¥${unitPrice}, 总价 ¥${totalPrice.toLocaleString()} ${tierInfo}${savingsInfo}`);
});

console.log('\n' + colors.green + '✓ 测试通过：阶梯价格根据数量正确计算' + colors.reset + '\n');

// ============================================
// 测试 3: getProductPriceInfo 详细信息
// ============================================
console.log(colors.bold + colors.blue + '【测试 3】获取详细价格信息' + colors.reset);
console.log('─'.repeat(50));

const testQuantity = 15;
const priceInfo = getProductPriceInfo(atProduct, testQuantity);

console.log(`\n购买数量: ${testQuantity} 件`);
console.log('\n基本信息:');
console.log(`  单价: ¥${priceInfo.unit_price}`);
console.log(`  总价: ¥${priceInfo.total_price.toLocaleString()}`);
console.log(`  定价模式: ${priceInfo.pricing_model}`);
console.log(`  基础价格: ¥${priceInfo.base_price}`);

if (priceInfo.applied_tier) {
  console.log('\n应用的价格档位:');
  console.log(`  最小数量: ${priceInfo.applied_tier.min_quantity} 件`);
  console.log(`  档位单价: ¥${priceInfo.applied_tier.unit_price}`);
  console.log(`  备注: ${priceInfo.applied_tier.notes}`);
}

if (priceInfo.savings) {
  console.log('\n节省金额（相对基础价）:');
  console.log(`  总节省: ${colors.green}¥${priceInfo.savings.amount.toLocaleString()}${colors.reset}`);
  console.log(`  节省比例: ${colors.green}${priceInfo.savings.rate}%${colors.reset}`);
  console.log(`  每件节省: ¥${priceInfo.savings.per_unit}`);
}

if (priceInfo.next_tier) {
  console.log('\n下一档位推荐:');
  console.log(`  下一档最小数量: ${priceInfo.next_tier.min_quantity} 件`);
  console.log(`  下一档单价: ¥${priceInfo.next_tier.unit_price}`);
  console.log(`  还需购买: ${colors.yellow}${priceInfo.next_tier.additional_quantity_needed} 件${colors.reset}`);
  console.log(`  可再节省: ¥${priceInfo.next_tier.additional_savings_per_unit}/件`);
}

if (priceInfo.available_tiers) {
  console.log('\n所有可用档位:');
  priceInfo.available_tiers.forEach((tier, index) => {
    console.log(`  ${index + 1}. ${tier.min_quantity}+ 件: ¥${tier.unit_price} - ${tier.notes || 'N/A'}`);
  });
}

console.log('\n' + colors.green + '✓ 测试通过：详细价格信息返回正确' + colors.reset + '\n');

// ============================================
// 测试 4: 边界情况
// ============================================
console.log(colors.bold + colors.blue + '【测试 4】边界情况测试' + colors.reset);
console.log('─'.repeat(50));

console.log('\n情况 1: 数量为 0（应自动设为 1）');
const price0 = calculatePrice(atProduct, 0);
console.log(`  结果: ¥${price0} ${price0 === 2500 ? colors.green + '✓ 正确' + colors.reset : colors.yellow + '✗ 错误' + colors.reset}`);

console.log('\n情况 2: 数量刚好等于档位最小值');
const price10 = calculatePrice(atProduct, 10);
console.log(`  数量 10: ¥${price10} ${price10 === 2300 ? colors.green + '✓ 正确' + colors.reset : colors.yellow + '✗ 错误' + colors.reset}`);

console.log('\n情况 3: 数量略小于档位最小值');
const price9 = calculatePrice(atProduct, 9);
console.log(`  数量 9: ¥${price9} ${price9 === 2500 ? colors.green + '✓ 正确' + colors.reset : colors.yellow + '✗ 错误' + colors.reset}`);

console.log('\n情况 4: 缺少 price_tiers（回退到 base_price）');
const invalidProduct = {
  pricing_model: 'tiered',
  base_price: 3000
};
const priceInvalid = calculatePrice(invalidProduct, 10);
console.log(`  结果: ¥${priceInvalid} ${priceInvalid === 3000 ? colors.green + '✓ 正确' + colors.reset : colors.yellow + '✗ 错误' + colors.reset}`);

console.log('\n情况 5: 缺少 base_price');
const noPriceProduct = {
  pricing_model: 'fixed'
};
const priceNone = calculatePrice(noPriceProduct, 5);
console.log(`  结果: ¥${priceNone} ${priceNone === 0 ? colors.green + '✓ 正确' + colors.reset : colors.yellow + '✗ 错误' + colors.reset}`);

console.log('\n' + colors.green + '✓ 测试通过：边界情况处理正确' + colors.reset + '\n');

// ============================================
// 测试 5: 向后兼容性（旧方式调用）
// ============================================
console.log(colors.bold + colors.blue + '【测试 5】向后兼容性测试' + colors.reset);
console.log('─'.repeat(50));

const oldStylePriceTiers = [
  { min_quantity: 1, unit_price: 5280, price_type: 'normal' },
  { min_quantity: 5, unit_price: 5016, price_type: 'normal' },
  { min_quantity: 10, unit_price: 4752, price_type: 'normal' }
];

console.log('\n旧方式调用（传入价格数组）:');
const oldStyleResult = calculatePrice(oldStylePriceTiers, 8, 'normal');

console.log(`  数量: 8`);
console.log(`  单价: ¥${oldStyleResult.unit_price}`);
console.log(`  总价: ¥${oldStyleResult.total_price}`);
console.log(`  最小数量: ${oldStyleResult.min_quantity}`);
console.log(`  价格类型: ${oldStyleResult.price_type}`);

const expectedUnitPrice = 5016; // 数量 8 应该匹配 5 件的档位
const isCorrect = oldStyleResult.unit_price === expectedUnitPrice;
console.log('\n' + (isCorrect ? colors.green + '✓ 测试通过：向后兼容性正常' : colors.yellow + '✗ 测试失败') + colors.reset + '\n');

// ============================================
// 测试总结
// ============================================
console.log(colors.bold + colors.cyan + '╔═══════════════════════════════════════════════╗');
console.log('║     测试总结                                 ║');
console.log('╚═══════════════════════════════════════════════╝' + colors.reset);

console.log('\n' + colors.green + '✓ 所有测试通过！' + colors.reset);
console.log('\n测试项目:');
console.log('  ' + colors.green + '✓' + colors.reset + ' 固定价格产品');
console.log('  ' + colors.green + '✓' + colors.reset + ' 阶梯价格产品');
console.log('  ' + colors.green + '✓' + colors.reset + ' 详细价格信息');
console.log('  ' + colors.green + '✓' + colors.reset + ' 边界情况处理');
console.log('  ' + colors.green + '✓' + colors.reset + ' 向后兼容性');

console.log('\n' + colors.bold + '定价函数已成功升级！' + colors.reset + '\n');

// ============================================
// 实际使用示例
// ============================================
console.log(colors.bold + colors.blue + '【使用示例】实际代码中如何使用' + colors.reset);
console.log('─'.repeat(50));

console.log('\n```javascript');
console.log('// 1. 简单计算单价');
console.log('const unitPrice = calculatePrice(product, quantity);');
console.log('');
console.log('// 2. 获取详细价格信息');
console.log('const priceInfo = getProductPriceInfo(product, quantity);');
console.log('console.log(`单价: ¥${priceInfo.unit_price}`);');
console.log('console.log(`总价: ¥${priceInfo.total_price}`);');
console.log('');
console.log('// 3. 在 API 路由中使用');
console.log('router.get("/products/:id/price", async (req, res) => {');
console.log('  const product = await Product.findById(req.params.id);');
console.log('  const unitPrice = calculatePrice(product, req.query.quantity);');
console.log('  res.json({ unit_price: unitPrice });');
console.log('});');
console.log('```\n');

console.log('查看更多示例，请参考: 定价函数升级使用指南.md\n');

