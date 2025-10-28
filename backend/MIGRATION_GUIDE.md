# 价格字段迁移指南

> **一次性数据迁移：base_price → price_tiers**

---

## 🎯 迁移目的

将所有执行器的旧价格字段 (`base_price`, `pricing.base_price_normal` 等) 迁移到新的阶梯定价结构 (`price_tiers`)。

---

## 📋 迁移内容

脚本将自动执行以下操作：

### 1. 读取旧价格字段
- `base_price`
- `pricing.base_price_normal`
- `pricing.base_price_low`
- `pricing.base_price_high`
- `price`

### 2. 创建 price_tiers 数组
```javascript
// 示例：基础价格 ¥5,280
price_tiers: [
  { min_quantity: 1,  unit_price: 5280, price_type: 'normal', notes: '基础价格' },
  { min_quantity: 5,  unit_price: 5016, price_type: 'normal', notes: '批量折扣5%' },
  { min_quantity: 10, unit_price: 4752, price_type: 'normal', notes: '批量折扣10%' },
  { min_quantity: 20, unit_price: 4488, price_type: 'normal', notes: '批量折扣15%' }
]
```

### 3. 提取手动操作装置信息
```javascript
manual_override: {
  model: 'SD-1',
  price: 860
}
```

### 4. 提取配件价格信息
```javascript
accessories_pricing: {
  seal_kit_price: 12
}
```

---

## 🚀 使用方法

### 步骤 1: 备份数据库（推荐）

```bash
# MongoDB 备份
mongodump --db cmax-selection --out ./backup/$(date +%Y%m%d)
```

### 步骤 2: 确认环境配置

确保 `backend/.env` 文件中有正确的数据库连接：

```env
MONGODB_URI=mongodb://localhost:27017/cmax-selection
```

### 步骤 3: 运行迁移脚本

```bash
cd backend
node migration_price_tiers.js
```

### 步骤 4: 查看执行结果

脚本会显示详细的迁移进度和统计信息：

```
═══════════════════════════════════════════════
  执行器价格字段迁移脚本 v1.0.0
  Price Tiers Migration Script
═══════════════════════════════════════════════

ℹ 正在连接数据库: mongodb://localhost:27017/cmax-selection
✓ 数据库连接成功！

🚀 开始执行价格字段迁移

ℹ 正在读取所有执行器文档...
ℹ 找到 95 个执行器文档

📝 开始迁移数据...

[1/95] 处理中... ✓ 迁移成功: SF-200SR (基础价: ¥12800, 4个价格档位)
[2/95] 处理中... ✓ 迁移成功: AT-SR52K8 (基础价: ¥5280, 4个价格档位)
[3/95] 处理中... ⚠ 跳过 AT-DA75K12: 已存在 price_tiers
...

📊 迁移完成统计

┌─────────────────────────────────────┐
│ 总文档数:             95 个      │
│ ✓ 成功迁移:           92 个      │
│ ⊘ 已有价格档位:        2 个      │
│ ? 无价格字段:          1 个      │
│ ✗ 失败:                0 个      │
└─────────────────────────────────────┘

✓ 迁移成功率: 96.8% ✨

🔍 验证迁移结果...

ℹ 具有 price_tiers 的文档: 94 个

📋 迁移示例（查看第一个迁移的文档）

型号: SF-200SR

price_tiers:
[
  {
    "min_quantity": 1,
    "unit_price": 12800,
    "price_type": "normal",
    "notes": "基础价格（从旧字段迁移）"
  },
  {
    "min_quantity": 5,
    "unit_price": 12160,
    "price_type": "normal",
    "notes": "批量折扣5%（5-9件）"
  },
  {
    "min_quantity": 10,
    "unit_price": 11520,
    "price_type": "normal",
    "notes": "批量折扣10%（10-19件）"
  },
  {
    "min_quantity": 20,
    "unit_price": 10880,
    "price_type": "normal",
    "notes": "批量折扣15%（20件以上）"
  }
]

ℹ 正在关闭数据库连接...
✓ 数据库连接已关闭

✨ 迁移脚本执行完成！
```

---

## ✅ 迁移验证

### 方法 1: 使用 MongoDB Shell

```javascript
// 连接数据库
mongo

use cmax-selection

// 查看迁移后的数据
db.actuators.findOne({ model_base: "AT-SR52K8" })

// 统计具有 price_tiers 的文档
db.actuators.countDocuments({ "price_tiers.0": { $exists: true } })

// 查看所有价格档位
db.actuators.find(
  { "price_tiers.0": { $exists: true } },
  { model_base: 1, price_tiers: 1 }
).limit(5).pretty()
```

### 方法 2: 使用 API 测试

```bash
# 获取执行器信息（应该包含 price_tiers）
curl http://localhost:5001/api/actuators/[ACTUATOR_ID]

# 测试价格计算
curl "http://localhost:5001/api/actuators/[ACTUATOR_ID]/price?quantity=10"
```

---

## ⚠️ 注意事项

### 脚本特性

✅ **幂等性** - 可以多次运行，不会重复迁移已有 `price_tiers` 的文档

✅ **安全性** - 只添加新字段，不删除旧字段

✅ **智能判断** - 自动从多个可能的旧字段中提取价格

✅ **详细日志** - 显示每个文档的处理结果

### 迁移规则

1. **跳过已迁移** - 如果文档已有 `price_tiers`，将跳过
2. **跳过无价格** - 如果找不到任何价格字段，将跳过
3. **自动折扣** - 如果只有基础价格，自动生成 5%、10%、15% 的批量折扣档位
4. **保留旧数据** - 迁移后旧字段仍保留（可后续手动清理）

---

## 🔧 故障排除

### 问题 1: 数据库连接失败

**错误信息**:
```
✗ 数据库连接失败: connect ECONNREFUSED
```

**解决方案**:
1. 确认 MongoDB 服务已启动
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. 检查 `.env` 文件中的 `MONGODB_URI` 是否正确

---

### 问题 2: 找不到 dotenv 模块

**错误信息**:
```
Error: Cannot find module 'dotenv'
```

**解决方案**:
```bash
cd backend
npm install dotenv
```

---

### 问题 3: 部分文档迁移失败

**查看失败原因**:
- 脚本会显示每个失败文档的错误信息
- 检查这些文档的数据格式是否正确
- 可以手动修正后重新运行脚本

---

## 🔄 回滚方案

如果需要回滚迁移：

### 方法 1: 从备份恢复

```bash
# 恢复备份
mongorestore --db cmax-selection ./backup/20251027/cmax-selection
```

### 方法 2: 删除 price_tiers 字段

```javascript
// MongoDB Shell
db.actuators.updateMany(
  {},
  { $unset: { price_tiers: "", manual_override: "", accessories_pricing: "" } }
)
```

---

## 📊 迁移后续工作

### 1. 验证数据准确性

- 抽查几个执行器的价格档位
- 确认折扣计算正确
- 测试价格 API 接口

### 2. 更新应用代码

- 更新控制器使用 `getPriceByQuantity()` 方法
- 更新前端显示阶梯定价
- 测试报价生成功能

### 3. 清理旧字段（可选）

在确认迁移成功且系统运行正常后，可以删除旧字段：

```javascript
// 谨慎操作！确保先备份
db.actuators.updateMany(
  {},
  { 
    $unset: { 
      base_price: "",
      price: "",
      "pricing.base_price_normal": "",
      "pricing.base_price_low": "",
      "pricing.base_price_high": ""
    } 
  }
)
```

---

## 📞 技术支持

遇到问题？

- 📖 查看 [阶梯定价升级说明](../阶梯定价升级说明.md)
- 📋 查看 [阶梯定价快速参考](../阶梯定价快速参考.md)
- 📧 联系技术支持: tech@cmax.com

---

**迁移脚本版本**: v1.0.0  
**最后更新**: 2025-10-27  
**编写**: C-MAX 技术团队

