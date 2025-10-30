# AT和GY系列价格数据导入指南

## 📋 概述

本指南说明如何导入和更新 AT 和 GY 系列执行器的价格数据。

### 数据覆盖范围

| 系列 | 单作用(SR) | 双作用(DA) | 总计 |
|------|-----------|-----------|------|
| AT   | 16个型号   | 16个型号   | 32个 |
| GY   | 12个型号   | 12个型号   | 24个 |
| **总计** | **28个** | **28个** | **56个** |

---

## 📁 文件说明

### 1. at_gy_pricing_data.js - 价格数据文件

包含四个部分的数据：

```javascript
{
  at_sr_data,      // AT系列单作用 - 16个型号
  at_da_data,      // AT系列双作用 - 16个型号
  gy_sr_data,      // GY系列单作用 - 12个型号
  gy_da_data,      // GY系列双作用 - 12个型号
  all_at_gy_data   // 合并后的所有数据
}
```

### 2. updateATGYPricing.js - 价格更新脚本

功能：
- 批量更新价格数据
- 更新手轮配置（AT系列）
- 更新维修套件信息（AT系列）
- 数据验证和统计

---

## 🚀 使用方法

### 第一步：确认环境配置

确保 `.env` 文件中配置了数据库连接：

```bash
MONGODB_URI=mongodb://localhost:27017/model_selection_system
```

### 第二步：运行更新脚本

在项目根目录执行：

```bash
node backend/scripts/updateATGYPricing.js
```

### 第三步：查看执行结果

脚本会输出详细的执行日志：

```
✅ 数据库连接成功...

========== 开始更新 AT/GY 系列价格数据 ==========

总计需要更新: 56 个型号

✅ 成功更新型号: AT-SR52K8 - ¥77
✅ 成功更新型号: AT-SR63K8 - ¥102
...
✅ 成功更新型号: GY-400 - ¥71900

========== 价格数据更新完成 ==========
✅ 成功更新: 56 个型号
⚠️  未找到型号: 0 个型号
❌ 更新失败: 0 个型号
📊 总计处理: 56 个型号
📈 成功率: 100.00%

========== 验证更新结果 ==========
找到 32 个 AT 系列执行器
AT系列验证结果: ✅ 32 个完整, ⚠️ 0 个不完整

找到 24 个 GY 系列执行器
GY系列验证结果: ✅ 24 个完整, ⚠️ 0 个不完整

========== 价格统计 ==========
AT系列价格统计:
  双作用:
    数量: 16
    均价: ¥1753.06
    最低: ¥64
    最高: ¥8900

  单作用:
    数量: 16
    均价: ¥2154.88
    最低: ¥77
    最高: ¥9736

GY系列价格统计:
  双作用:
    数量: 12
    均价: ¥14129.17
    最低: ¥740
    最高: ¥71900

  单作用:
    数量: 12
    均价: ¥15087.92
    最低: ¥770
    最高: ¥73450

✅ 已断开数据库连接
🎉 脚本执行完成！
```

---

## 📊 数据结构说明

### AT系列数据结构

```javascript
{
  model: 'AT-SR52K8',                     // 型号
  series: 'AT',                           // 系列
  type: 'Single Acting',                  // 类型
  material: '铝合金+硬质氧化',             // 材质
  pricing: {                              // 价格信息
    standardTemp: 77,                     // 常温价格
    lowTemp: 86,                          // 低温价格
    highTemp: 122                         // 高温价格
  },
  handwheel: {                            // 手轮配置
    model: 'SD-1',                        // 手轮型号
    surcharge: 127                        // 附加费用
  },
  repairKit: {                            // 维修套件
    price: 1.5,                           // 价格
    description: '包含执行机构内所有密封件' // 说明（可选）
  }
}
```

### GY系列数据结构

```javascript
{
  model: 'GY-52SR',          // 型号
  series: 'GY',              // 系列
  type: 'Single Acting',     // 类型
  material: '不锈钢',         // 材质
  pricing: {                 // 价格信息
    standardTemp: 770        // 常温价格（仅此一个）
  }
  // GY系列无手轮和维修套件信息
}
```

---

## 🔧 数据映射

### 数据库字段映射

| 数据字段 | 数据库字段 | 说明 |
|---------|----------|------|
| `model` | `model_base` | 执行器型号 |
| `series` | `series` | 系列（AT/GY） |
| `type` | `action_type` | 作用类型（SR/DA） |
| `material` | `specifications.materials.body` | 材质 |
| `pricing.standardTemp` | `base_price_normal` | 常温价格 |
| `pricing.lowTemp` | `base_price_low` | 低温价格 |
| `pricing.highTemp` | `base_price_high` | 高温价格 |
| `handwheel` | `manual_override_options[]` | 手轮配置数组 |
| `repairKit.price` | `spare_parts.seal_kit_price` | 维修套件价格 |

---

## 💡 手轮型号对照表

### AT系列手轮配置

| 型号范围 | 手轮型号 | 附加费用 |
|---------|---------|---------|
| AT-52~75 | SD-1 | ¥127 |
| AT-83~92 | SD-2 | ¥167 |
| AT-105~125 | SD-3 | ¥249 |
| AT-140~160 | SD-4 | ¥407 |
| AT-190~210 | SD-5 | ¥702 |
| AT-240 | SD-6 | ¥932 |
| AT-270 | SD-7 | ¥1368 |
| AT-300~400 | 7寸球墨 | ¥2850~¥4550 |

---

## 📈 价格范围

### AT系列价格范围

| 型号 | 常温价格 | 低温价格 | 高温价格 |
|------|---------|---------|---------|
| **单作用 (SR)** |
| 最小 (AT-SR52K8) | ¥77 | ¥86 | ¥122 |
| 最大 (AT-SR400K8) | ¥9,736 | ¥9,896 | ¥10,106 |
| **双作用 (DA)** |
| 最小 (AT-DA52) | ¥64 | ¥66 | ¥76 |
| 最大 (AT-DA400) | ¥8,900 | ¥9,110 | ¥9,110 |

### GY系列价格范围

| 型号 | 常温价格 |
|------|---------|
| **单作用 (SR)** |
| 最小 (GY-52SR) | ¥770 |
| 最大 (GY-400SR) | ¥73,450 |
| **双作用 (DA)** |
| 最小 (GY-52) | ¥740 |
| 最大 (GY-400) | ¥71,900 |

---

## 🔄 数据维护

### 添加新型号

1. 在 `at_gy_pricing_data.js` 中添加新型号数据：

```javascript
// AT系列单作用
{
  model: 'AT-SR450K8',
  series: 'AT',
  type: 'Single Acting',
  material: '铝合金+硬质氧化',
  pricing: { standardTemp: 12000, lowTemp: 12200, highTemp: 12500 },
  handwheel: { model: '7寸球墨', surcharge: 4550 },
  repairKit: { price: 95.0 }
}
```

2. 运行更新脚本

### 修改价格

1. 在 `at_gy_pricing_data.js` 中修改对应型号的价格
2. 运行更新脚本，脚本会覆盖原有价格

---

## ⚙️ API 使用示例

### 获取执行器价格

```javascript
// 控制器中获取AT系列价格
const actuator = await Actuator.findOne({ model_base: 'AT-SR52K8' });

console.log('常温价格:', actuator.base_price_normal);  // 77
console.log('低温价格:', actuator.base_price_low);     // 86
console.log('高温价格:', actuator.base_price_high);    // 122

// 手轮信息
if (actuator.manual_override_options && actuator.manual_override_options.length > 0) {
  const handwheel = actuator.manual_override_options[0];
  console.log('手轮型号:', handwheel.override_model);        // SD-1
  console.log('手轮附加费:', handwheel.additional_price);    // 127
}

// 维修套件
if (actuator.spare_parts && actuator.spare_parts.seal_kit_price) {
  console.log('维修套件价格:', actuator.spare_parts.seal_kit_price); // 1.5
}
```

### 选型时计算总价

```javascript
// 在 selectionController.js 中
const temperatureType = req.body.temperature_type || 'normal';
const needsHandwheel = req.body.needs_handwheel || false;

// 根据温度类型获取基础价格
let basePrice;
switch (temperatureType) {
  case 'low':
    basePrice = actuator.base_price_low;
    break;
  case 'high':
    basePrice = actuator.base_price_high;
    break;
  default:
    basePrice = actuator.base_price_normal;
}

// 如果需要手轮，加上手轮价格
let totalPrice = basePrice;
if (needsHandwheel && actuator.manual_override_options && actuator.manual_override_options.length > 0) {
  totalPrice += actuator.manual_override_options[0].additional_price;
}

console.log('总价:', totalPrice);
```

---

## ✅ 验证数据

### 查询特定型号

```bash
# 使用 MongoDB Shell
mongo
use model_selection_system

# 查询 AT 系列
db.actuators.findOne({ model_base: 'AT-SR52K8' })

# 查询 GY 系列
db.actuators.findOne({ model_base: 'GY-52SR' })

# 统计价格
db.actuators.aggregate([
  { $match: { series: 'AT' } },
  { $group: {
    _id: '$action_type',
    avg: { $avg: '$base_price_normal' },
    min: { $min: '$base_price_normal' },
    max: { $max: '$base_price_normal' }
  }}
])
```

---

## ⚠️ 注意事项

### AT系列特殊情况

1. **AT-SR300K8** 和 **AT-DA400**:
   - 高温价格与常温价格相同
   - 这是数据源的实际值，不是错误

2. **手轮型号**:
   - 较大型号使用 "7寸球墨" 手轮
   - 价格差异较大（¥2850~¥4550）

### GY系列特点

1. **价格**:
   - 仅有常温价格
   - 无低温和高温价格
   - 价格相对较高（不锈钢材质）

2. **配置**:
   - 无手轮配置信息
   - 无维修套件信息

### 数据完整性

- 运行脚本前确保数据库中已存在对应的型号记录
- 脚本不会自动创建新型号，只会更新现有型号
- 建议在测试环境先运行验证

---

## 🐛 故障排查

### 问题：未找到型号

**原因：** 数据库中不存在该型号记录

**解决：**
1. 检查 `model_base` 字段是否与数据文件中的 `model` 一致
2. 确认该型号已在数据库中创建
3. 检查型号名称大小写和格式

### 问题：价格未更新

**原因：** 字段名称不匹配或数据类型错误

**解决：**
1. 检查数据库字段名称
2. 确认价格为数字类型（不是字符串）
3. 查看脚本错误日志

### 问题：手轮信息丢失

**原因：** GY系列没有手轮信息

**解决：**
- GY系列不需要手轮信息
- 仅AT系列有手轮配置

---

## 📚 相关文档

- `/backend/scripts/README.md` - 脚本目录总览
- `/backend/DIMENSIONS_STRUCTURE_GUIDE.md` - 尺寸数据结构
- `/backend/SF_DIMENSIONS_USAGE.md` - SF系列使用指南

---

## 🎯 使用建议

### 首次导入

```bash
# 1. 备份数据库
mongodump --db model_selection_system

# 2. 运行导入脚本
node backend/scripts/updateATGYPricing.js

# 3. 验证结果
# 查看脚本输出的统计信息
```

### 定期更新

```bash
# 1. 修改价格数据文件
nano backend/scripts/at_gy_pricing_data.js

# 2. 运行更新脚本
node backend/scripts/updateATGYPricing.js

# 3. 验证价格变化
# 对比更新前后的价格
```

---

**文档版本**: v1.0  
**创建日期**: 2025-10-30  
**作者**: AI Assistant  
**状态**: ✅ 就绪

