# 单元测试指南

> 使用 Jest 进行单元测试

---

## 📋 概述

本目录包含 Project Ark 后端的单元测试文件。

### 测试框架

- **Jest** - JavaScript 测试框架
- **版本**: v29.7.0
- **环境**: Node.js

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

这将安装 Jest 及其他依赖。

### 2. 运行所有测试

```bash
npm test
```

### 3. 运行特定测试文件

```bash
npm test pricing.test.js
```

### 4. 监听模式（自动重新运行）

```bash
npm run test:watch
```

### 5. 生成覆盖率报告

```bash
npm run test:coverage
```

---

## 📂 测试文件

| 文件 | 测试对象 | 状态 |
|------|----------|------|
| `pricing.test.js` | `utils/pricing.js` | ✅ 完成 |

---

## 📖 pricing.test.js 详解

### 测试覆盖

#### 主要测试组

1. **基础功能测试** (6个测试)
   - quantity=5 → unit_price=100
   - quantity=15 → unit_price=90
   - 边界值测试
   - 大数量测试

2. **参数验证测试** (6个测试)
   - null/空数组处理
   - 无效参数处理
   - 默认值测试

3. **价格类型测试** (3个测试)
   - normal 类型
   - high_temp 类型
   - 默认类型

4. **复杂场景测试** (3个测试)
   - 4档阶梯定价
   - 不同数量区间

5. **返回对象测试** (3个测试)
   - 字段完整性
   - 类型正确性
   - 计算准确性

6. **边界异常测试** (3个测试)
   - 低于最小量
   - 乱序档位
   - 单一档位

7. **性能测试** (1个测试)
   - 大量档位处理

8. **集成测试** (3个测试)
   - 与其他函数配合

**总计**: 28+ 个测试用例

---

## ✅ 核心测试用例

### 测试用例 1: 基本价格计算

```javascript
test('当 quantity=5 时，应该返回单价 100（使用第一档）', () => {
  const mockPriceTiers = [
    { min_quantity: 1, unit_price: 100 },
    { min_quantity: 10, unit_price: 90 }
  ];
  
  const result = pricing.calculatePrice(mockPriceTiers, 5);
  
  expect(result).not.toBeNull();
  expect(result.unit_price).toBe(100);
  expect(result.total_price).toBe(500);
  expect(result.min_quantity).toBe(1);
  expect(result.quantity).toBe(5);
});
```

**断言**:
- ✅ 返回值不为 null
- ✅ 单价为 100
- ✅ 总价为 500 (100 × 5)
- ✅ 使用档位 1 (min_quantity=1)
- ✅ 数量为 5

---

### 测试用例 2: 第二档价格

```javascript
test('当 quantity=15 时，应该返回单价 90（使用第二档）', () => {
  const mockPriceTiers = [
    { min_quantity: 1, unit_price: 100 },
    { min_quantity: 10, unit_price: 90 }
  ];
  
  const result = pricing.calculatePrice(mockPriceTiers, 15);
  
  expect(result).not.toBeNull();
  expect(result.unit_price).toBe(90);
  expect(result.total_price).toBe(1350);
  expect(result.min_quantity).toBe(10);
  expect(result.quantity).toBe(15);
});
```

**断言**:
- ✅ 返回值不为 null
- ✅ 单价为 90
- ✅ 总价为 1350 (90 × 15)
- ✅ 使用档位 2 (min_quantity=10)
- ✅ 数量为 15

---

## 📊 运行测试示例

### 成功输出

```
 PASS  tests/pricing.test.js
  pricing.calculatePrice()
    基础功能
      ✓ 当 quantity=5 时，应该返回单价 100（使用第一档） (3 ms)
      ✓ 当 quantity=15 时，应该返回单价 90（使用第二档） (1 ms)
      ✓ 当 quantity=1 时，应该返回单价 100（边界情况：最小值） (1 ms)
      ✓ 当 quantity=10 时，应该返回单价 90（边界情况：档位临界值） (1 ms)
      ✓ 当 quantity=9 时，应该返回单价 100（临界值前一个） (1 ms)
      ✓ 当 quantity=100 时，应该返回单价 90（大数量） (1 ms)
    参数验证
      ✓ 当 priceTiers 为 null 时，应该返回 null (1 ms)
      ✓ 当 priceTiers 为空数组时，应该返回 null (1 ms)
      ✓ 当 priceTiers 不是数组时，应该返回 null (1 ms)
      ✓ 当 quantity 为 0 时，应该使用默认值 1 (1 ms)
      ✓ 当 quantity 为负数时，应该使用默认值 1 (1 ms)
      ✓ 当 quantity 未提供时，应该使用默认值 1 (1 ms)
    ...

Test Suites: 1 passed, 1 total
Tests:       28 passed, 28 total
Snapshots:   0 total
Time:        1.234 s
```

---

### 覆盖率报告

```
---------------------------|---------|----------|---------|---------|
File                       | % Stmts | % Branch | % Funcs | % Lines |
---------------------------|---------|----------|---------|---------|
All files                  |   95.12 |    90.48 |     100 |   95.12 |
 utils                     |   95.12 |    90.48 |     100 |   95.12 |
  pricing.js               |   95.12 |    90.48 |     100 |   95.12 |
---------------------------|---------|----------|---------|---------|
```

---

## 🔧 测试命令详解

### npm test

运行所有测试文件

```bash
npm test
```

### npm test -- [文件名]

运行特定测试文件

```bash
npm test -- pricing.test.js
```

### npm run test:watch

监听模式，文件变化时自动重新运行

```bash
npm run test:watch
```

**适用场景**: 开发过程中持续测试

### npm run test:coverage

生成详细的覆盖率报告

```bash
npm run test:coverage
```

**输出**:
- 终端显示摘要
- HTML 报告在 `coverage/` 目录

---

## 📈 测试最佳实践

### 1. 测试命名

```javascript
// ✅ 好的命名
test('当 quantity=5 时，应该返回单价 100', () => {});

// ❌ 不好的命名
test('test1', () => {});
```

### 2. 使用 describe 分组

```javascript
describe('基础功能', () => {
  test('测试1', () => {});
  test('测试2', () => {});
});
```

### 3. 清晰的断言

```javascript
// ✅ 明确的断言
expect(result.unit_price).toBe(100);
expect(result.total_price).toBe(500);

// ❌ 模糊的断言
expect(result).toBeTruthy();
```

### 4. 测试边界情况

```javascript
// 最小值
test('quantity=1', () => {});

// 临界值
test('quantity=10', () => {});

// 大值
test('quantity=100', () => {});
```

### 5. 测试异常处理

```javascript
test('当参数为 null 时，应该返回 null', () => {
  expect(pricing.calculatePrice(null, 5)).toBeNull();
});
```

---

## 🐛 调试测试

### 1. 单独运行失败的测试

```bash
npm test -- pricing.test.js -t "当 quantity=5"
```

### 2. 查看详细输出

```bash
npm test -- --verbose
```

### 3. 使用 console.log

```javascript
test('调试测试', () => {
  const result = pricing.calculatePrice(mockPriceTiers, 5);
  console.log('Result:', result);
  expect(result.unit_price).toBe(100);
});
```

---

## 📝 添加新测试

### 步骤 1: 创建测试文件

```bash
touch tests/newModule.test.js
```

### 步骤 2: 编写测试

```javascript
const myModule = require('../path/to/module');

describe('myModule.myFunction()', () => {
  test('应该返回正确的结果', () => {
    const result = myModule.myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### 步骤 3: 运行测试

```bash
npm test
```

---

## 📚 Jest 常用匹配器

### 相等性

```javascript
expect(value).toBe(expected);           // 严格相等 ===
expect(value).toEqual(expected);        // 深度相等（对象、数组）
expect(value).not.toBe(unexpected);     // 不等于
```

### 真值性

```javascript
expect(value).toBeTruthy();             // 真值
expect(value).toBeFalsy();              // 假值
expect(value).toBeNull();               // null
expect(value).toBeUndefined();          // undefined
expect(value).toBeDefined();            // 已定义
```

### 数值

```javascript
expect(value).toBeGreaterThan(3);       // > 3
expect(value).toBeLessThan(5);          // < 5
expect(value).toBeGreaterThanOrEqual(3);// >= 3
expect(value).toBeLessThanOrEqual(5);   // <= 5
expect(value).toBeCloseTo(0.3);         // 浮点数近似
```

### 字符串

```javascript
expect(string).toMatch(/pattern/);      // 正则匹配
expect(string).toContain('substring');  // 包含子串
```

### 数组/对象

```javascript
expect(array).toContain(item);          // 包含元素
expect(object).toHaveProperty('key');   // 有属性
expect(array).toHaveLength(3);          // 长度为3
```

---

## 📞 需要帮助？

- 📖 [Jest 官方文档](https://jestjs.io/)
- 📖 [Jest 中文文档](https://jestjs.io/zh-Hans/)
- 💬 项目技术支持: dev@projectark.com

---

**版本**: v1.0.0  
**最后更新**: 2025-10-27  
**维护**: Project Ark 技术团队

