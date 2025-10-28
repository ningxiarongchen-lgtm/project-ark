# AT/GY 系列最终版数据导入指南 📚

**版本**: 2.0 Final  
**创建时间**: 2025-10-27  
**数据文件**: `at_gy_actuators_data_final.csv`

---

## 📋 概述

本指南介绍如何使用 `seed_at_gy_final.js` 脚本将包含完整价格结构的 AT/GY 系列执行器数据导入到数据库中。

### 🆕 新版本特性

相比之前的版本，最终版包含以下新特性：

1. **三级价格体系**
   - 标准价格（base_price_normal）
   - 低价（base_price_low）
   - 高价（base_price_high）

2. **手动操作装置信息**
   - 手动操作装置型号（manual_override_model）
   - 手动操作装置价格（manual_override_price）

3. **配件价格**
   - 密封套件价格（seal_kit_price）

---

## 🔧 模型升级说明

### Actuator 模型新增字段

```javascript
{
  // 旧字段（保留，用于SF系列）
  base_price: Number,
  
  // 新增：详细价格结构（用于AT/GY系列）
  pricing: {
    base_price_normal: Number,    // 标准价格
    base_price_low: Number,        // 低价
    base_price_high: Number,       // 高价
    manual_override_model: String, // 手动操作装置型号
    manual_override_price: Number, // 手动操作装置价格
    seal_kit_price: Number         // 密封套件价格
  }
}
```

### 向后兼容性

✅ **完全兼容**：
- SF 系列继续使用 `base_price` 字段
- AT/GY 系列同时设置 `base_price` 和 `pricing` 对象
- 旧的查询和API不受影响

---

## 📄 CSV 文件格式

### 文件位置
```
backend/data_imports/at_gy_actuators_data_final.csv
```

### 列结构

| 列名 | 说明 | 示例 | 必填 |
|------|------|------|------|
| model_base | 基础型号 | AT-SR52K8 | ✅ |
| series | 系列 | AT 或 GY | ✅ |
| mechanism | 机构类型 | Rack & Pinion | ✅ |
| action_type | 作用类型 | SR 或 DA | ✅ |
| spring_range | 弹簧范围 | K8 | ❌ |
| base_price_normal | 标准价格 | 75 | ✅ |
| base_price_low | 低价 | 77 | ✅ |
| base_price_high | 高价 | 86 | ✅ |
| manual_override_model | 手动操作装置型号 | SD-1 | ❌ |
| manual_override_price | 手动操作装置价格 | 127 | ❌ |
| seal_kit_price | 密封套件价格 | 1.5 | ❌ |
| torque_data | 扭矩数据（JSON） | {"spring_end":7.7,...} | ✅ |
| dimensions | 尺寸数据（JSON） | {"A":147,"B":65,...} | ❌ |

### CSV 示例

```csv
model_base,series,mechanism,action_type,spring_range,base_price_normal,base_price_low,base_price_high,manual_override_model,manual_override_price,seal_kit_price,torque_data,dimensions
AT-SR52K8,AT,Rack & Pinion,SR,K8,75,77,86,SD-1,127,1.5,"{""spring_end"":7.7,""air_start_0.55MPa"":9.9,""air_end_0.55MPa"":6.7}","{""A"":147,""B"":65,""H"":92}"
AT-DA52,AT,Rack & Pinion,DA,,64,66,76,SD-1,127,1.5,"{""0.55MPa"":11}","{""A"":147,""B"":65,""H"":92}"
GY-52SR,GY,Rack & Pinion,SR,,770,770,770,,,,,"{""torque_0.5MPa"":10}",""
```

---

## 🚀 使用步骤

### 步骤 1: 准备环境

确保已安装依赖：
```bash
cd backend
npm install
```

确保 `.env` 文件中配置了数据库连接：
```env
MONGO_URI=mongodb://localhost:27017/cmax_selection
```

### 步骤 2: 准备数据文件

确认 CSV 文件位于正确位置：
```bash
ls -la backend/data_imports/at_gy_actuators_data_final.csv
```

### 步骤 3: 运行导入脚本

**方式 1: 使用 npm 脚本**（推荐）
```bash
cd backend
npm run seed:atgy:final
```

**方式 2: 直接运行**
```bash
cd backend
node seed_at_gy_final.js
```

### 步骤 4: 查看导入结果

脚本会显示详细的导入信息：

```
╔═══════════════════════════════════════════════════════╗
║   AT/GY 系列执行器数据导入工具（最终版）             ║
║   包含完整价格结构和手动操作装置信息                 ║
╚═══════════════════════════════════════════════════════╝

✅ 数据库连接成功: cmax_selection

🗑️  删除旧的 AT/GY 系列数据...
  ✅ 删除了 XX 条旧的 AT/GY 系列记录
  ℹ️  SF 系列数据已保留

📦 开始读取 AT/GY 系列执行器数据（最终版）...
📄 文件路径: /path/to/at_gy_actuators_data_final.csv

📊 CSV 读取完成: 共读取 55 行数据

💾 开始导入 55 条数据到数据库...
✅ 成功导入 55 条 AT/GY 系列执行器数据！

📈 导入统计:
  ┌─────────────────────────────────────┐
  │ AT-SR (弹簧复位):      16 条    │
  │ AT-DA (双作用):        16 条    │
  │ GY-SR (弹簧复位):      12 条    │
  │ GY-DA (双作用):        11 条    │
  ├─────────────────────────────────────┤
  │ 配手动操作装置:        32 条    │
  │ 含密封套件价格:        32 条    │
  └─────────────────────────────────────┘

💰 价格范围:
  最低价格: ¥64
  最高价格: ¥73,450

🔍 验证导入结果...
  ✅ AT 系列: 32 条
  ✅ GY 系列: 23 条
  ✅ 总计（含SF系列）: 197 条

📋 示例数据（前3条）:

  1. AT-SR52K8
     系列: AT | 机构: Rack & Pinion
     作用类型: SR | 本体尺寸: 52
     标准价格: ¥75
     价格范围: ¥77 - ¥86
     手动装置: SD-1 (¥127)
     密封套件: ¥1.5
     扭矩数据: {"spring_end":7.7,"air_start_0.55MPa":9.9,...}

  2. AT-SR63K8
     系列: AT | 机构: Rack & Pinion
     作用类型: SR | 本体尺寸: 63
     标准价格: ¥102
     价格范围: ¥105 - ¥122
     手动装置: SD-1 (¥127)
     密封套件: ¥2.6
     扭矩数据: {"spring_end":12.8,"air_start_0.55MPa":16.4,...}

✅ AT/GY 系列数据导入完成！

使用说明:
  1. 所有价格数据已包含三个级别（标准/低价/高价）
  2. 手动操作装置信息已关联
  3. 密封套件价格已录入
  4. 可通过 pricing 对象访问详细价格信息
```

---

## 🔍 数据验证

### 使用 MongoDB Shell 验证

```bash
# 连接数据库
mongo

# 使用数据库
use cmax_selection

# 查询 AT 系列数据
db.actuators.find({ series: "AT" }).count()

# 查看完整数据结构
db.actuators.findOne({ model_base: "AT-SR52K8" })

# 验证价格字段
db.actuators.find({
  "pricing.base_price_normal": { $exists: true }
}).count()

# 验证手动操作装置
db.actuators.find({
  "pricing.manual_override_model": { $exists: true, $ne: null }
}).count()
```

### 使用 API 验证

```bash
# 获取所有 AT 系列执行器
curl -X GET http://localhost:5001/api/actuators?series=AT \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取特定型号
curl -X GET http://localhost:5001/api/actuators?model_base=AT-SR52K8 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 数据统计

### 导入的数据分布

| 系列 | 作用类型 | 数量 | 说明 |
|------|----------|------|------|
| AT | SR (弹簧复位) | 16 | AT-SR52K8 到 AT-SR400K8 |
| AT | DA (双作用) | 16 | AT-DA52 到 AT-DA400 |
| GY | SR (弹簧复位) | 12 | GY-52SR 到 GY-400SR |
| GY | DA (双作用) | 11 | GY-52 到 GY-400 |
| **总计** | | **55** | |

### 价格信息覆盖率

- ✅ 所有 55 条记录都包含三级价格
- ✅ 32 条记录包含手动操作装置信息（主要是 AT 系列）
- ✅ 32 条记录包含密封套件价格（主要是 AT 系列）
- ℹ️ GY 系列通常不配手动操作装置和密封套件

---

## 💡 API 使用示例

### 获取带价格信息的执行器

```javascript
// 前端调用示例
const response = await actuatorsAPI.getAll({ series: 'AT' });
const actuators = response.data.data;

actuators.forEach(actuator => {
  console.log(`型号: ${actuator.model_base}`);
  console.log(`标准价格: ¥${actuator.pricing.base_price_normal}`);
  console.log(`价格范围: ¥${actuator.pricing.base_price_low} - ¥${actuator.pricing.base_price_high}`);
  
  if (actuator.pricing.manual_override_model) {
    console.log(`手动装置: ${actuator.pricing.manual_override_model} (¥${actuator.pricing.manual_override_price})`);
  }
  
  if (actuator.pricing.seal_kit_price) {
    console.log(`密封套件: ¥${actuator.pricing.seal_kit_price}`);
  }
});
```

### 报价时使用多级价格

```javascript
// 根据客户等级选择价格
function getActuatorPrice(actuator, customerLevel) {
  switch (customerLevel) {
    case 'VIP':
      return actuator.pricing.base_price_low;
    case 'STANDARD':
      return actuator.pricing.base_price_normal;
    case 'NEW':
      return actuator.pricing.base_price_high;
    default:
      return actuator.pricing.base_price_normal;
  }
}

// 生成报价单
const totalPrice = 
  getActuatorPrice(actuator, 'VIP') + 
  (actuator.pricing.manual_override_price || 0) +
  (actuator.pricing.seal_kit_price || 0);
```

---

## ⚠️ 注意事项

### 1. 数据覆盖

- ⚠️ **脚本会删除所有现有的 AT 和 GY 系列数据**
- ✅ SF 系列数据会被保留
- 💡 建议在导入前备份数据库

### 2. JSON 格式

扭矩数据和尺寸数据必须是有效的 JSON 格式：
```json
{"spring_end":7.7,"air_start_0.55MPa":9.9}
```

注意事项：
- ✅ 使用双引号包裹键和字符串值
- ✅ 数字不加引号
- ❌ 不要使用单引号
- ❌ JSON 字符串在 CSV 中需要转义双引号

### 3. 空值处理

- 空字符串会被转换为 `null`
- 空的 JSON 字段（`""` 或空白）会使用默认值 `{}`
- 可选字段可以为空

### 4. 价格单位

- 所有价格单位为：人民币（¥）
- 手动操作装置价格为单独购买价格
- 密封套件价格为更换套件价格

---

## 🔄 更新数据

如果需要更新数据：

1. 修改 `at_gy_actuators_data_final.csv` 文件
2. 重新运行导入脚本
3. 脚本会自动删除旧数据并导入新数据

---

## 🐛 故障排查

### 问题 1: 数据库连接失败

**错误信息**:
```
❌ 数据库连接失败: ...
```

**解决方案**:
1. 检查 MongoDB 服务是否运行
2. 检查 `.env` 文件中的 `MONGO_URI` 配置
3. 确认数据库访问权限

### 问题 2: CSV 文件未找到

**错误信息**:
```
CSV 文件不存在: ...
```

**解决方案**:
1. 确认文件路径正确
2. 检查文件名拼写
3. 确认文件在 `backend/data_imports/` 目录下

### 问题 3: JSON 解析失败

**错误信息**:
```
⚠️  JSON 解析失败: ...
```

**解决方案**:
1. 检查 CSV 中的 JSON 格式
2. 确保双引号正确转义
3. 使用在线 JSON 验证工具验证格式

### 问题 4: 部分数据导入失败

**现象**:
- 显示 "X 行处理失败"
- 导入数量少于预期

**解决方案**:
1. 查看错误日志中的具体行号
2. 检查该行的数据格式
3. 确认必填字段都有值
4. 验证数字字段格式

---

## 📈 性能优化

### 批量插入

脚本使用 `insertMany()` 批量插入，性能优异：
- 55 条数据约 1-2 秒完成
- 支持部分失败继续插入（`ordered: false`）

### 索引

模型已创建必要索引：
```javascript
actuatorSchema.index({ model_base: 1 });
actuatorSchema.index({ series: 1 });
actuatorSchema.index({ body_size: 1 });
actuatorSchema.index({ action_type: 1 });
```

---

## 📚 相关文档

- [Actuator 模型文档](./backend/models/Actuator.js)
- [AT_GY系列导入完成报告.md](./AT_GY系列导入完成报告.md)
- [CSV数据导入指南.md](./backend/CSV数据导入指南.md)
- [API接口文档.md](./API接口文档.md)

---

## ✅ 完成清单

导入完成后，请检查：

- [ ] 数据库中 AT 系列数量正确（32 条）
- [ ] 数据库中 GY 系列数量正确（23 条）
- [ ] 所有记录都有 `pricing` 对象
- [ ] AT 系列记录包含手动操作装置信息
- [ ] 价格数据完整（标准/低价/高价）
- [ ] 扭矩数据正确解析
- [ ] 尺寸数据正确解析
- [ ] SF 系列数据未受影响

---

## 🎉 总结

使用本导入脚本，您可以：

✅ 快速导入完整的 AT/GY 系列数据  
✅ 获得三级价格体系支持  
✅ 关联手动操作装置信息  
✅ 包含配件价格数据  
✅ 保持与 SF 系列的兼容性  

**下一步**: 您可以在前端选型系统中使用这些详细的价格信息，为不同客户提供差异化报价！

---

**文档版本**: 2.0  
**最后更新**: 2025-10-27  
**维护者**: C-MAX Team

