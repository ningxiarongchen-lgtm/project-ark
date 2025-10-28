# Jest 测试 - 快速开始

> 3分钟设置并运行测试

---

## 🚀 安装

```bash
cd backend
npm install jest --save-dev
```

**已完成**！Jest 已添加到 `package.json` 的 `devDependencies` 中。

---

## ▶️ 运行测试

### 方式 1: 运行所有测试

```bash
npm test
```

### 方式 2: 运行特定测试

```bash
npm test pricing.test.js
```

### 方式 3: 监听模式（推荐开发时使用）

```bash
npm run test:watch
```

### 方式 4: 生成覆盖率报告

```bash
npm run test:coverage
```

---

## ✅ 预期输出

### 成功情况

```
 PASS  tests/pricing.test.js
  pricing.calculatePrice()
    基础功能
      ✓ 当 quantity=5 时，应该返回单价 100（使用第一档）
      ✓ 当 quantity=15 时，应该返回单价 90（使用第二档）
      ✓ 所有其他测试...

Test Suites: 1 passed, 1 total
Tests:       28 passed, 28 total
Snapshots:   0 total
Time:        1.234 s
Ran all test suites.
```

---

## 📋 关键测试用例

### 测试 1: quantity=5 → unit_price=100

```javascript
const mockPriceTiers = [
  { min_quantity: 1, unit_price: 100 },
  { min_quantity: 10, unit_price: 90 }
];

const result = pricing.calculatePrice(mockPriceTiers, 5);

// 断言
expect(result.unit_price).toBe(100);
expect(result.total_price).toBe(500);
```

**逻辑**: 数量5小于第二档的min_quantity(10)，所以使用第一档价格100

---

### 测试 2: quantity=15 → unit_price=90

```javascript
const result = pricing.calculatePrice(mockPriceTiers, 15);

// 断言
expect(result.unit_price).toBe(90);
expect(result.total_price).toBe(1350);
```

**逻辑**: 数量15大于等于第二档的min_quantity(10)，所以使用第二档价格90

---

## 🔍 验证测试

### 检查所有测试通过

```bash
npm test
```

看到 `Tests: 28 passed` 即表示成功！

---

## 📊 查看覆盖率

```bash
npm run test:coverage
```

**输出示例**:

```
---------------------------|---------|----------|---------|---------|
File                       | % Stmts | % Branch | % Funcs | % Lines |
---------------------------|---------|----------|---------|---------|
All files                  |   95.12 |    90.48 |     100 |   95.12 |
 utils/pricing.js          |   95.12 |    90.48 |     100 |   95.12 |
---------------------------|---------|----------|---------|---------|
```

**HTML报告**: 打开 `coverage/lcov-report/index.html`

---

## ⚡ 常用命令

| 命令 | 说明 |
|------|------|
| `npm test` | 运行所有测试 |
| `npm test -- pricing` | 运行包含 'pricing' 的测试 |
| `npm run test:watch` | 监听模式 |
| `npm run test:coverage` | 覆盖率报告 |

---

## 🐛 故障排除

### 问题 1: Jest 未找到

**错误**: `jest: command not found`

**解决**:
```bash
npm install
```

---

### 问题 2: 测试失败

**查看详细输出**:
```bash
npm test -- --verbose
```

---

### 问题 3: 模块未找到

**确保在正确目录**:
```bash
pwd
# 应该在 backend 目录
```

---

## 📚 下一步

- 📖 查看 [完整测试指南](./README.md)
- 📖 查看 [pricing.test.js](./pricing.test.js) 了解详细测试用例
- 📖 添加更多测试文件

---

**准备好了？运行测试吧！**

```bash
npm test
```

✨ **全部通过后，你的测试环境就设置完成了！**

