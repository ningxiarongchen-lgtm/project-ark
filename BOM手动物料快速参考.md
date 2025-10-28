# BOM 手动物料功能 - 快速参考

## 📋 核心变更

### ✅ 已修改字段

```javascript
bill_of_materials: [{
  item_id: ObjectId,      // ✨ 新增 - 可选（手动物料可为空）
  item_type: String,      // ✨ 枚举新增 'Manual' 选项
  model_name: String,     // 必填
  quantity: Number,       // 必填
  unit_price: Number,     // 必填（关键：手动物料由用户提供）
  total_price: Number,    // 必填
  description: String,    // 可选
  specifications: Mixed,  // 可选
  notes: String,          // 可选
  is_manual: Boolean,     // ✨ 新增 - 标识是否为手动物料
  created_at: Date        // 自动
}]
```

---

## 🎯 使用场景

### 场景 1: 系统物料（原有功能）

```javascript
{
  item_id: "507f1f77bcf86cd799439011",  // ✅ 必须有
  item_type: "Actuator",                // 系统类型
  model_name: "AT050-GY",
  quantity: 2,
  unit_price: 15000,
  total_price: 30000,
  is_manual: false
}
```

### 场景 2: 手动物料（新功能）⭐

```javascript
{
  // item_id: 无（不需要）          // ❌ 不提供
  item_type: "Manual",              // ✅ 使用 'Manual'
  model_name: "自定义配件",
  description: "特殊定制物料",
  quantity: 5,
  unit_price: 1000,                 // ✅ 用户输入
  total_price: 5000,
  specifications: {
    material: "SS316",
    size: "DN100"
  },
  notes: "供应商: XYZ, 交货期: 7天",
  is_manual: true                   // ✅ 必须为 true
}
```

---

## 🔧 前端实现要点

### 1. 表单切换

```jsx
const [isManual, setIsManual] = useState(false)

<Switch
  checkedChildren="手动添加"
  unCheckedChildren="系统物料"
  onChange={setIsManual}
/>

{isManual ? (
  // 显示手动输入表单
  <Input placeholder="输入型号..." />
) : (
  // 显示系统物料选择器
  <Select placeholder="选择系统物料..." />
)}
```

### 2. 数据提交

```javascript
// 系统物料
const systemData = {
  item_id: selectedItemId,    // ✅ 必须有
  item_type: 'Actuator',
  model_name: '...',
  quantity: 2,
  unit_price: 15000,
  total_price: 30000,
  is_manual: false
}

// 手动物料
const manualData = {
  // item_id: 无               // ❌ 不发送
  item_type: 'Manual',
  model_name: '...',
  quantity: 5,
  unit_price: 1000,
  total_price: 5000,
  is_manual: true            // ✅ 必须
}
```

### 3. 列表显示

```jsx
<Tag color={item.is_manual ? 'orange' : 'blue'}>
  {item.is_manual ? '手动' : '系统'}
</Tag>
```

---

## 🔍 字段说明

| 字段 | 系统物料 | 手动物料 | 说明 |
|------|---------|---------|------|
| `item_id` | ✅ 必须 | ❌ 不需要 | 引用系统物料ID |
| `item_type` | Actuator/Accessory | Manual/Valve/Other | 物料类型 |
| `model_name` | ✅ 必填 | ✅ 必填 | 型号名称 |
| `quantity` | ✅ 必填 | ✅ 必填 | 数量 |
| `unit_price` | ✅ 必填 | ✅ 必填 | **用户输入** |
| `total_price` | ✅ 必填 | ✅ 必填 | 自动计算 |
| `description` | 可选 | 推荐填写 | 描述 |
| `specifications` | 可选 | 推荐填写 | 规格参数 |
| `notes` | 可选 | 可选 | 备注 |
| `is_manual` | false | true | 是否手动物料 |

---

## ⚠️ 注意事项

### 系统物料
- ✅ 必须验证 `item_id` 是否存在
- ✅ 可以自动填充物料信息
- ✅ 价格可以从产品获取

### 手动物料
- ❌ 不需要 `item_id`
- ✅ 所有信息由用户输入
- ⚠️ 价格需要用户自行维护
- ⚠️ 无法关联系统产品信息

---

## 📊 item_type 枚举值

| 值 | 说明 | 需要 item_id |
|----|------|-------------|
| `Actuator` | 执行器（系统） | ✅ 是 |
| `Accessory` | 配件（系统） | ✅ 是 |
| `Manual` | 手动添加 | ❌ 否 |
| `Valve` | 阀门 | 看情况 |
| `Other` | 其他 | 看情况 |

---

## 🔄 API 端点（建议）

```bash
# 添加 BOM 项（系统或手动）
POST /api/projects/:id/bom
Content-Type: application/json

# 系统物料
{
  "item_id": "...",
  "item_type": "Actuator",
  ...
}

# 手动物料
{
  "item_type": "Manual",
  ...
}

# 更新 BOM 项
PUT /api/projects/:id/bom/:itemId

# 删除 BOM 项
DELETE /api/projects/:id/bom/:itemId

# 获取 BOM 列表
GET /api/projects/:id/bom
```

---

## 🎨 UI 设计建议

### 添加按钮

```
[+ 添加系统物料] [+ 手动添加物料]
```

### 列表显示

```
┌─────────────────────────────────────────────────────┐
│ 来源  │ 类型   │ 型号        │ 数量 │ 单价   │ 总价   │
├─────────────────────────────────────────────────────┤
│ 系统  │ 执行器 │ AT050-GY   │ 2   │ 15000 │ 30000 │
│ 系统  │ 配件   │ SWITCH-01  │ 4   │ 500   │ 2000  │
│ 手动  │ 阀门   │ 进口球阀   │ 5   │ 2000  │ 10000 │
│ 手动  │ 其他   │ 特殊密封件 │ 10  │ 150   │ 1500  │
└─────────────────────────────────────────────────────┘
                            总计: ¥43,500
```

---

## 🧪 快速测试

### 测试用例 1: 添加系统物料
```bash
curl -X POST http://localhost:5001/api/projects/123/bom \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "507f1f77bcf86cd799439011",
    "item_type": "Actuator",
    "model_name": "AT050-GY",
    "quantity": 2,
    "unit_price": 15000,
    "total_price": 30000,
    "is_manual": false
  }'
```

### 测试用例 2: 添加手动物料
```bash
curl -X POST http://localhost:5001/api/projects/123/bom \
  -H "Content-Type: application/json" \
  -d '{
    "item_type": "Manual",
    "model_name": "自定义阀门",
    "description": "特殊定制",
    "quantity": 1,
    "unit_price": 5000,
    "total_price": 5000,
    "is_manual": true
  }'
```

---

## 📖 相关文档

- 📄 详细文档: `BOM手动物料支持升级完成报告.md`
- 🔧 模型文件: `backend/models/Project.js`

---

**版本**: 1.0  
**更新日期**: 2025-10-28

