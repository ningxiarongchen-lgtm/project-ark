# AT/GY 最终版数据导入 - 快速开始 🚀

## 一键运行

```bash
cd backend
npm run seed:atgy:final
```

---

## 新增价格字段

```javascript
{
  pricing: {
    base_price_normal: 75,      // 标准价格
    base_price_low: 77,          // 低价
    base_price_high: 86,         // 高价
    manual_override_model: "SD-1", // 手动装置型号
    manual_override_price: 127,   // 手动装置价格
    seal_kit_price: 1.5          // 密封套件价格
  }
}
```

---

## CSV 文件位置

```
backend/data_imports/at_gy_actuators_data_final.csv
```

---

## 预期结果

✅ AT-SR: 16 条  
✅ AT-DA: 16 条  
✅ GY-SR: 12 条  
✅ GY-DA: 11 条  
✅ 总计: 55 条（不含SF系列）

---

## 使用新价格字段

### 前端示例

```javascript
// 获取执行器
const actuator = await actuatorsAPI.getById(id);

// 访问价格信息
const standardPrice = actuator.pricing.base_price_normal;
const priceRange = `¥${actuator.pricing.base_price_low} - ¥${actuator.pricing.base_price_high}`;
const manualOverride = actuator.pricing.manual_override_model;
const overridePrice = actuator.pricing.manual_override_price;

// 计算总价
const totalPrice = 
  actuator.pricing.base_price_normal + 
  (actuator.pricing.manual_override_price || 0) +
  (actuator.pricing.seal_kit_price || 0);
```

### 后端查询示例

```javascript
// 查询带价格信息的执行器
const actuators = await Actuator.find({
  series: 'AT',
  'pricing.base_price_normal': { $lte: 1000 }
});

// 获取带手动操作装置的执行器
const withManualOverride = await Actuator.find({
  'pricing.manual_override_model': { $exists: true, $ne: null }
});
```

---

## 验证导入

```bash
# MongoDB Shell
mongo
use cmax_selection
db.actuators.find({ series: "AT" }).count()  # 应该是 32
db.actuators.findOne({ model_base: "AT-SR52K8" })
```

---

## 故障排查

| 问题 | 解决方案 |
|------|----------|
| 数据库连接失败 | 检查 MongoDB 服务和 `.env` 配置 |
| CSV 文件未找到 | 确认文件在 `backend/data_imports/` 目录 |
| JSON 解析失败 | 检查 CSV 中 JSON 格式和引号转义 |

---

## 重要提示

⚠️ **脚本会删除所有 AT 和 GY 系列旧数据**  
✅ **SF 系列数据会被保留**  
💡 **建议先备份数据库**

---

详细文档: [AT_GY最终版数据导入指南.md](./AT_GY最终版数据导入指南.md)

