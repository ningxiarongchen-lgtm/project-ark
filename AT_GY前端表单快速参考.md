# AT/GY 前端表单快速参考 🚀

## 新增字段

### 1️⃣ 使用温度 (temperature_type)

```jsx
<Form.Item
  label="使用温度"
  name="temperature_type"
  rules={[{ required: true }]}
>
  <Radio.Group buttonStyle="solid">
    <Radio.Button value="normal">常温 (Normal)</Radio.Button>
    <Radio.Button value="low">低温 (Low Temp)</Radio.Button>
    <Radio.Button value="high">高温 (High Temp)</Radio.Button>
  </Radio.Group>
</Form.Item>
```

**显示条件**: 仅 AT/GY 系列  
**默认值**: `normal`  
**必填**: ✅ Yes

---

### 2️⃣ 是否需要手轮 (needs_handwheel)

```jsx
<Form.Item
  label="是否需要手轮"
  name="needs_handwheel"
  valuePropName="checked"
>
  <Checkbox>需要手轮</Checkbox>
</Form.Item>
```

**显示条件**: 仅 AT/GY 系列  
**默认值**: `false`  
**必填**: ❌ No

---

## 价格映射

| 温度选择 | 对应价格字段 | 说明 |
|----------|-------------|------|
| 常温 (normal) | `pricing.base_price_normal` | 标准价格 |
| 低温 (low) | `pricing.base_price_low` | 低温型价格 |
| 高温 (high) | `pricing.base_price_high` | 高温型价格 |

---

## 表单数据示例

```javascript
// AT/GY 系列表单数据
{
  mechanism: "Rack & Pinion",
  temperature_type: "normal",      // ⭐ 新增
  needs_handwheel: true,            // ⭐ 新增
  required_torque: 50,
  working_pressure: 0.55,
  valve_size: "DN100",
  flange_size: "F07/F10"
}
```

---

## 后端处理逻辑

```javascript
// 根据温度选择价格
const price = 
  temperature_type === 'low' ? actuator.pricing.base_price_low :
  temperature_type === 'high' ? actuator.pricing.base_price_high :
  actuator.pricing.base_price_normal;

// 如果需要手轮
if (needs_handwheel) {
  price += actuator.pricing.manual_override_price;
}
```

---

## 快速测试

1. 选择"齿轮齿条式 (AT/GY系列)"
2. 验证显示"使用温度"和"是否需要手轮"字段
3. 切换到"拨叉式 (SF系列)"
4. 验证这两个字段隐藏

---

详细文档: [AT_GY系列前端表单升级报告.md](./AT_GY系列前端表单升级报告.md)

