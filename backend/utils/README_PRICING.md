# 定价工具模块使用说明

> `utils/pricing.js` - 阶梯定价计算工具

---

## 📋 目录

1. [快速开始](#快速开始)
2. [核心函数](#核心函数)
3. [使用示例](#使用示例)
4. [API参考](#api参考)
5. [测试](#测试)

---

## 快速开始

### 导入模块

```javascript
const pricing = require('./utils/pricing');
```

### 基本使用

```javascript
// 价格档位数据
const priceTiers = [
  { min_quantity: 1,  unit_price: 5280, price_type: 'normal' },
  { min_quantity: 5,  unit_price: 5016, price_type: 'normal' },
  { min_quantity: 10, unit_price: 4752, price_type: 'normal' },
  { min_quantity: 20, unit_price: 4488, price_type: 'normal' }
];

// 计算采购8件的价格
const price = pricing.calculatePrice(priceTiers, 8);

console.log(price);
// 输出:
// {
//   unit_price: 5016,
//   total_price: 40128,
//   min_quantity: 5,
//   quantity: 8,
//   price_type: 'normal',
//   notes: '批量折扣5%（5-9件）'
// }
```

---

## 核心函数

### 1. calculatePrice() ⭐ 最常用

**根据数量计算价格**

```javascript
calculatePrice(priceTiers, quantity, priceType)
```

**参数**:
- `priceTiers` (Array) - 价格档位数组
- `quantity` (Number) - 采购数量，默认 1
- `priceType` (String) - 价格类型，默认 'normal'

**返回**: Object | null

```javascript
{
  unit_price: 5016,        // 单价
  total_price: 40128,      // 总价
  min_quantity: 5,         // 适用档位
  quantity: 8,             // 采购数量
  price_type: 'normal',    // 价格类型
  notes: '批量折扣5%...'   // 备注
}
```

---

### 2. getAllPriceTiers()

**获取所有价格档位（升序排列）**

```javascript
getAllPriceTiers(priceTiers, priceType)
```

**示例**:
```javascript
const tiers = pricing.getAllPriceTiers(priceTiers);
// 返回按 min_quantity 升序排列的数组
```

---

### 3. getRecommendedQuantity()

**推荐最优采购数量**

```javascript
getRecommendedQuantity(priceTiers, currentQuantity, priceType)
```

**示例**:
```javascript
const recommendation = pricing.getRecommendedQuantity(priceTiers, 8);

console.log(recommendation);
// {
//   recommended_quantity: 10,
//   current_quantity: 8,
//   current_unit_price: 5016,
//   next_tier_unit_price: 4752,
//   savings_per_unit: 264,
//   total_savings: 2640,
//   additional_quantity_needed: 2,
//   message: '再购买 2 件即可享受 ¥4752/件的优惠价格...'
// }
```

---

### 4. calculateSavings()

**计算批量采购节省金额**

```javascript
calculateSavings(priceTiers, quantity, priceType)
```

**示例**:
```javascript
const savings = pricing.calculateSavings(priceTiers, 20);

console.log(savings);
// {
//   base_unit_price: 5280,
//   actual_unit_price: 4488,
//   base_total_price: 105600,
//   actual_total_price: 89760,
//   total_savings: 15840,
//   savings_rate: 15.00,
//   quantity: 20
// }
```

---

### 5. generateStandardPriceTiers()

**生成标准阶梯定价**

```javascript
generateStandardPriceTiers(basePrice, discountRates, priceType)
```

**示例**:
```javascript
// 基于基础价格 ¥5280 生成标准档位
const tiers = pricing.generateStandardPriceTiers(5280);

// 自定义折扣档位
const customTiers = pricing.generateStandardPriceTiers(5280, [
  { quantity: 1,  rate: 0,    notes: '基础价格' },
  { quantity: 10, rate: 0.10, notes: '10% 折扣' },
  { quantity: 50, rate: 0.20, notes: '20% 折扣' }
]);
```

---

### 6. validatePriceTiers()

**验证价格档位数据**

```javascript
validatePriceTiers(priceTiers)
```

**示例**:
```javascript
const result = pricing.validatePriceTiers(priceTiers);

console.log(result);
// {
//   valid: true,
//   errors: []
// }
```

---

### 7. enrichPriceTiersWithDiscount()

**添加折扣率信息**

```javascript
enrichPriceTiersWithDiscount(priceTiers)
```

**示例**:
```javascript
const enriched = pricing.enrichPriceTiersWithDiscount(priceTiers);
// 每个档位会添加 discount_rate 和 is_base_price 字段
```

---

### 8. calculateBulkPrice()

**批量计算多个产品总价**

```javascript
calculateBulkPrice(items)
```

**示例**:
```javascript
const items = [
  { priceTiers: tiers1, quantity: 8 },
  { priceTiers: tiers2, quantity: 15 },
  { priceTiers: tiers3, quantity: 25 }
];

const result = pricing.calculateBulkPrice(items);
// {
//   total_price: 245760,
//   items_count: 3,
//   total_quantity: 48,
//   items: [...]
// }
```

---

### 9. formatPrice()

**格式化价格显示**

```javascript
formatPrice(price, currency)
```

**示例**:
```javascript
pricing.formatPrice(5280);        // "¥5,280"
pricing.formatPrice(5280, '$');   // "$5,280"
pricing.formatPrice(5280, '€');   // "€5,280"
```

---

## 使用示例

### 示例 1: 在控制器中使用

```javascript
// backend/controllers/actuatorController.js

const pricing = require('../utils/pricing');
const Actuator = require('../models/Actuator');

exports.getActuatorPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity = 1, price_type = 'normal' } = req.query;
    
    // 获取执行器
    const actuator = await Actuator.findById(id);
    
    if (!actuator) {
      return res.status(404).json({
        success: false,
        message: '执行器不存在'
      });
    }
    
    // 使用 pricing 工具计算价格
    const priceInfo = pricing.calculatePrice(
      actuator.price_tiers,
      parseInt(quantity),
      price_type
    );
    
    if (!priceInfo) {
      return res.status(404).json({
        success: false,
        message: '未配置价格信息'
      });
    }
    
    // 获取推荐数量
    const recommendation = pricing.getRecommendedQuantity(
      actuator.price_tiers,
      parseInt(quantity),
      price_type
    );
    
    // 计算节省金额
    const savings = pricing.calculateSavings(
      actuator.price_tiers,
      parseInt(quantity),
      price_type
    );
    
    res.json({
      success: true,
      data: {
        actuator_model: actuator.model_base,
        quantity: parseInt(quantity),
        price: priceInfo,
        recommendation: recommendation,
        savings: savings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

---

### 示例 2: 在选型接口中使用

```javascript
// backend/controllers/selectionController.js

const pricing = require('../utils/pricing');

exports.calculate = async (req, res) => {
  try {
    const { required_torque, quantity = 1, price_type = 'normal' } = req.body;
    
    // ... 选型逻辑 ...
    
    // 为每个推荐的执行器添加价格信息
    const resultsWithPrice = recommendations.map(rec => {
      const priceInfo = pricing.calculatePrice(
        rec.actuator.price_tiers,
        quantity,
        price_type
      );
      
      return {
        ...rec,
        pricing: priceInfo,
        manual_override: rec.actuator.manual_override,
        accessories: rec.actuator.accessories_pricing
      };
    });
    
    res.json({
      success: true,
      data: resultsWithPrice,
      count: resultsWithPrice.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

---

### 示例 3: 报价单生成

```javascript
// backend/controllers/quoteController.js

const pricing = require('../utils/pricing');

exports.generateQuote = async (req, res) => {
  try {
    const { project_id, items } = req.body;
    
    // 计算每个产品的价格
    const quoteItems = items.map(item => {
      const priceInfo = pricing.calculatePrice(
        item.actuator.price_tiers,
        item.quantity,
        item.price_type
      );
      
      return {
        actuator_id: item.actuator._id,
        model: item.actuator.model_base,
        quantity: item.quantity,
        unit_price: priceInfo.unit_price,
        subtotal: priceInfo.total_price,
        notes: priceInfo.notes
      };
    });
    
    // 计算总价
    const bulkResult = pricing.calculateBulkPrice(
      items.map(item => ({
        priceTiers: item.actuator.price_tiers,
        quantity: item.quantity,
        priceType: item.price_type
      }))
    );
    
    // 创建报价单
    const quote = await Quote.create({
      project_id: project_id,
      items: quoteItems,
      total_price: bulkResult.total_price,
      total_quantity: bulkResult.total_quantity,
      status: 'draft'
    });
    
    res.json({
      success: true,
      data: quote
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

---

### 示例 4: 前端价格展示组件

```javascript
// 在前端 API 调用中使用

import { actuatorsAPI } from '../services/api';

async function fetchPrice(actuatorId, quantity) {
  try {
    const response = await actuatorsAPI.getPrice(actuatorId, quantity);
    
    const { price, recommendation, savings } = response.data;
    
    // 显示价格信息
    console.log(`单价: ¥${price.unit_price}`);
    console.log(`总价: ¥${price.total_price}`);
    console.log(`节省: ¥${savings.total_savings} (${savings.savings_rate}%)`);
    
    // 显示推荐
    if (recommendation) {
      console.log(recommendation.message);
    }
    
    return price;
  } catch (error) {
    console.error('获取价格失败:', error);
  }
}
```

---

## API 参考

### 完整函数列表

| 函数 | 用途 | 常用度 |
|------|------|--------|
| `calculatePrice()` | 计算价格 | ⭐⭐⭐⭐⭐ |
| `getAllPriceTiers()` | 获取所有档位 | ⭐⭐⭐⭐ |
| `getRecommendedQuantity()` | 推荐数量 | ⭐⭐⭐⭐ |
| `calculateSavings()` | 计算节省 | ⭐⭐⭐ |
| `enrichPriceTiersWithDiscount()` | 添加折扣率 | ⭐⭐⭐ |
| `generateStandardPriceTiers()` | 生成档位 | ⭐⭐ |
| `validatePriceTiers()` | 验证数据 | ⭐⭐ |
| `formatPrice()` | 格式化 | ⭐⭐ |
| `calculateBulkPrice()` | 批量计算 | ⭐⭐⭐ |

---

## 测试

### 运行测试

```bash
cd backend
node utils/pricing.test.js
```

### 测试输出示例

```
═══════════════════════════════════════════════
  定价工具模块测试
═══════════════════════════════════════════════

📋 测试 1: calculatePrice - 基础价格计算
─────────────────────────────────────────────

✓ 数量 1 件:
  单价: ¥5280 (预期: ¥5280)
  总价: ¥5,280
  档位: 1件起

✓ 数量 8 件:
  单价: ¥5016 (预期: ¥5016)
  总价: ¥40,128
  档位: 5件起

✓ 数量 20 件:
  单价: ¥4488 (预期: ¥4488)
  总价: ¥89,760
  档位: 20件起

...
```

---

## 最佳实践

### 1. 错误处理

```javascript
const priceInfo = pricing.calculatePrice(priceTiers, quantity);

if (!priceInfo) {
  // 处理无价格信息的情况
  console.error('无法获取价格信息');
  return;
}

// 继续处理
```

### 2. 参数验证

```javascript
// 验证价格档位
const validation = pricing.validatePriceTiers(priceTiers);

if (!validation.valid) {
  console.error('价格档位无效:', validation.errors);
  return;
}
```

### 3. 缓存优化

```javascript
// 对于频繁查询的价格，可以缓存结果
const priceCache = new Map();

function getCachedPrice(actuatorId, quantity) {
  const key = `${actuatorId}_${quantity}`;
  
  if (priceCache.has(key)) {
    return priceCache.get(key);
  }
  
  const price = pricing.calculatePrice(priceTiers, quantity);
  priceCache.set(key, price);
  
  return price;
}
```

---

## 常见问题

### Q1: 如何处理多种价格类型？

```javascript
// 标准温度
const normalPrice = pricing.calculatePrice(priceTiers, 10, 'normal');

// 高温型号
const highTempPrice = pricing.calculatePrice(priceTiers, 10, 'high_temp');
```

### Q2: 如何生成自定义折扣档位？

```javascript
const customTiers = pricing.generateStandardPriceTiers(5280, [
  { quantity: 1,   rate: 0,    notes: '零售价' },
  { quantity: 10,  rate: 0.08, notes: '小批量' },
  { quantity: 100, rate: 0.15, notes: '大批量' },
  { quantity: 500, rate: 0.25, notes: '超大批量' }
]);
```

### Q3: 如何在前端显示价格区间？

```javascript
const tiers = pricing.getAllPriceTiers(priceTiers);
const priceRange = `¥${tiers[tiers.length - 1].unit_price} - ¥${tiers[0].unit_price}`;
console.log(`价格范围: ${priceRange}`);
```

---

## 更新日志

### v1.0.0 (2025-10-27)
- ✅ 初始版本
- ✅ 实现 9 个核心函数
- ✅ 完整测试和文档

---

## 技术支持

- 📧 tech@projectark.com
- 💬 dev@projectark.com

---

**文档版本**: v1.0.0  
**最后更新**: 2025-10-27

