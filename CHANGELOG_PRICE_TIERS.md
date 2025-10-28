# 阶梯定价功能更新日志

## v2.1.0 - 2025-10-27

### 🎉 新功能

#### 阶梯定价系统 (Price Tiers)

将单一价格字段升级为灵活的阶梯定价结构，支持基于采购数量的批量折扣。

---

### 📝 变更内容

#### 数据模型升级

**修改文件**: `backend/models/Actuator.js`

**删除字段**:
```javascript
❌ pricing: {
     base_price_normal,
     base_price_low,
     base_price_high,
     manual_override_model,
     manual_override_price,
     seal_kit_price
   }
```

**新增字段**:
```javascript
✅ price_tiers: [{
     min_quantity: Number,
     unit_price: Number,
     price_type: String,
     notes: String
   }]

✅ manual_override: {
     model: String,
     price: Number
   }

✅ accessories_pricing: {
     seal_kit_price: Number
   }
```

**新增方法**:
- `getPriceByQuantity(quantity, priceType)` - 智能获取价格
- `getAllPriceTiers(priceType)` - 获取所有价格档位

---

### 🔧 新增工具

#### 1. 数据迁移脚本

**文件**: `backend/migration_price_tiers.js`

- ✅ 自动从旧字段提取价格
- ✅ 智能生成阶梯定价（4个档位）
- ✅ 提取手动装置和配件信息
- ✅ 幂等性设计（可重复运行）
- ✅ 详细日志和统计

**运行**: `node migration_price_tiers.js`

---

#### 2. 一键运行脚本

**Linux/macOS**: `backend/run_migration.sh`
- ✅ 环境检查
- ✅ 备份提示
- ✅ 自动执行迁移

**Windows**: `backend/run_migration.bat`
- ✅ Windows 批处理
- ✅ 中文界面
- ✅ 功能完整

---

### 📖 新增文档

| 文档 | 路径 | 用途 |
|------|------|------|
| 升级说明 | `阶梯定价升级说明.md` | 完整技术文档（5,000字） |
| 快速参考 | `阶梯定价快速参考.md` | 速查卡片（1,500字） |
| 迁移指南 | `backend/MIGRATION_GUIDE.md` | 迁移步骤（2,500字） |
| 迁移说明 | `backend/README_MIGRATION.md` | 快速开始（500字） |
| 完成报告 | `阶梯定价升级完成报告.md` | 项目总结（3,500字） |
| 更新日志 | `CHANGELOG_PRICE_TIERS.md` | 本文档 |

---

### 💡 使用示例

#### 创建带阶梯定价的执行器

```javascript
const actuator = new Actuator({
  model_base: 'AT-SR52K8',
  price_tiers: [
    { min_quantity: 1,  unit_price: 5280 },  // 基础价
    { min_quantity: 5,  unit_price: 5016 },  // 5% off
    { min_quantity: 10, unit_price: 4752 },  // 10% off
    { min_quantity: 20, unit_price: 4488 }   // 15% off
  ]
});
```

#### 获取价格

```javascript
// 采购 8 件
const price = actuator.getPriceByQuantity(8);
// 返回: { unit_price: 5016, total_price: 40128, ... }
```

---

### 🚀 升级步骤

#### 步骤 1: 运行迁移

```bash
cd backend
./run_migration.sh    # Linux/macOS
# 或
run_migration.bat     # Windows
```

#### 步骤 2: 验证结果

```bash
mongo
use cmax-selection
db.actuators.countDocuments({ "price_tiers.0": { $exists: true } })
```

#### 步骤 3: 更新应用代码

使用新的 `getPriceByQuantity()` 方法获取价格。

---

### ⚠️ 重要提示

#### 向后兼容

- ✅ 迁移脚本**不会删除**旧字段
- ✅ 可以渐进式升级
- ✅ 支持新旧系统共存

#### 迁移安全

- ✅ 幂等性 - 可重复运行
- ✅ 只添加字段，不删除数据
- ⚠️ 建议先备份数据库

---

### 📊 统计信息

#### 代码

- 新增代码: ~1,080 行
- 修改文件: 1 个（Actuator.js）
- 新增文件: 7 个

#### 文档

- 新增文档: 6 个
- 总字数: ~13,000 字
- 代码示例: 30+ 个

---

### 🎯 业务价值

- ✅ 支持灵活定价策略
- ✅ 鼓励批量采购
- ✅ 提升销售转化率
- ✅ 简化价格管理
- ✅ 提高报价效率

---

### 🔗 相关链接

- [阶梯定价升级说明](./阶梯定价升级说明.md)
- [阶梯定价快速参考](./阶梯定价快速参考.md)
- [迁移指南](./backend/MIGRATION_GUIDE.md)
- [完成报告](./阶梯定价升级完成报告.md)

---

### 👥 贡献者

- C-MAX 技术团队

---

### 📞 技术支持

- 📧 tech@cmax.com
- 💬 dev@cmax.com

---

**版本**: v2.1.0  
**发布日期**: 2025-10-27  
**状态**: ✅ 已发布

