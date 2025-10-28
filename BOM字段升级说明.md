# BOM字段升级说明 📋

**文件**: `backend/models/Project.js`  
**完成时间**: 2025-10-27  
**版本**: v1.0  
**状态**: ✅ 完成

---

## 📋 概述

成功在 `Project` 模型中添加了两个新字段，用于更专业的物料清单（BOM）管理和版本控制。

---

## 🆕 新增字段

### 1. `bill_of_materials` - 当前活动BOM

**用途**: 存储项目的当前物料清单

**数据结构**:

```javascript
bill_of_materials: [{
  // 必需字段
  item_type: String,        // 项目类型: 'Actuator', 'Manual Override', 'Accessory', 'Valve', 'Other'
  model_name: String,       // 型号名称
  quantity: Number,         // 数量 (≥1)
  unit_price: Number,       // 单价 (≥0)
  total_price: Number,      // 总价 (≥0)
  
  // 可选字段
  description: String,      // 描述
  specifications: Mixed,    // 规格详情（灵活对象）
  notes: String,           // 备注
  covered_tags: [String],  // 覆盖的位号（用于优化BOM）
  created_at: Date         // 创建时间（自动生成）
}]
```

---

### 2. `bom_history` - BOM历史版本

**用途**: 追踪所有BOM版本的变更历史

**数据结构**:

```javascript
bom_history: [{
  // 必需字段
  version_name: String,     // 版本名称: 'v1.0', 'Initial', 'Optimized v2'
  created_at: Date,        // 创建时间
  total_amount: Number,    // 该版本的总金额 (≥0)
  
  // 可选字段
  created_by: ObjectId,    // 创建者（User引用）
  change_description: String, // 变更描述
  notes: String,           // 版本备注
  
  // BOM项目列表
  items: [{
    item_type: String,
    model_name: String,
    quantity: Number,
    unit_price: Number,
    total_price: Number,
    description: String,
    specifications: Mixed,
    notes: String,
    covered_tags: [String]
  }]
}]
```

---

## 📊 字段详解

### `bill_of_materials` 字段

#### 必需字段

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `item_type` | String | enum, required | 项目类型 |
| `model_name` | String | required, trim | 型号名称 |
| `quantity` | Number | required, ≥1 | 数量 |
| `unit_price` | Number | required, ≥0 | 单价 |
| `total_price` | Number | required, ≥0 | 总价 |

#### 可选字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `description` | String | 项目描述 |
| `specifications` | Mixed | 技术规格（灵活对象） |
| `notes` | String | 备注信息 |
| `covered_tags` | [String] | 覆盖的位号（用于优化BOM） |
| `created_at` | Date | 创建时间（自动生成） |

---

### `bom_history` 字段

#### 必需字段

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `version_name` | String | required, trim | 版本名称 |
| `created_at` | Date | required, default: now | 创建时间 |
| `total_amount` | Number | required, ≥0 | 版本总金额 |
| `items` | Array | required | BOM项目列表 |

#### 可选字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `created_by` | ObjectId | 创建者（User引用） |
| `change_description` | String | 变更描述 |
| `notes` | String | 版本备注 |

---

## 💡 使用示例

### 示例 1: 创建基础BOM

```javascript
const project = new Project({
  projectNumber: 'PRJ-2025-0001',
  projectName: '某化工厂项目',
  // ... 其他必需字段
  
  bill_of_materials: [
    {
      item_type: 'Actuator',
      model_name: 'SF10-150DA',
      quantity: 3,
      unit_price: 8500,
      total_price: 25500,
      description: 'Pneumatic Actuator SF Series',
      covered_tags: ['V-101', 'V-102', 'V-103'],
      notes: '优化归并 3 个位号'
    },
    {
      item_type: 'Manual Override',
      model_name: 'HW-SF10',
      quantity: 2,
      unit_price: 500,
      total_price: 1000,
      description: 'Manual Handwheel'
    },
    {
      item_type: 'Accessory',
      model_name: 'PV-001',
      quantity: 5,
      unit_price: 150,
      total_price: 750,
      description: 'Positioner Valve',
      notes: '控制类配件'
    }
  ]
})

await project.save()
```

---

### 示例 2: 添加BOM历史版本

```javascript
// 保存当前BOM到历史
const currentBOM = project.bill_of_materials
const totalAmount = currentBOM.reduce((sum, item) => sum + item.total_price, 0)

project.bom_history.push({
  version_name: 'v1.0 - Initial',
  created_at: new Date(),
  created_by: userId,
  total_amount: totalAmount,
  items: currentBOM.map(item => ({
    item_type: item.item_type,
    model_name: item.model_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    description: item.description,
    specifications: item.specifications,
    notes: item.notes,
    covered_tags: item.covered_tags
  })),
  change_description: '初始版本创建',
  notes: '项目启动时的初始BOM'
})

await project.save()
```

---

### 示例 3: 更新BOM并保存历史

```javascript
// 1. 保存当前BOM到历史
const oldBOM = [...project.bill_of_materials]
const oldTotal = oldBOM.reduce((sum, item) => sum + item.total_price, 0)

project.bom_history.push({
  version_name: 'v1.0',
  created_at: new Date(),
  created_by: userId,
  total_amount: oldTotal,
  items: oldBOM,
  notes: '优化前的版本'
})

// 2. 更新当前BOM（优化后）
project.bill_of_materials = [
  {
    item_type: 'Actuator',
    model_name: 'SF10-150DA',
    quantity: 5,  // 从3增加到5（归并）
    unit_price: 8500,
    total_price: 42500,
    covered_tags: ['V-101', 'V-102', 'V-103', 'V-104', 'V-105'],
    notes: '优化归并 5 个位号'
  }
  // ... 其他优化项目
]

// 3. 保存新版本到历史
const newTotal = project.bill_of_materials.reduce((sum, item) => sum + item.total_price, 0)

project.bom_history.push({
  version_name: 'v2.0 - Optimized',
  created_at: new Date(),
  created_by: userId,
  total_amount: newTotal,
  items: [...project.bill_of_materials],
  change_description: '执行优化算法，归并相同型号',
  notes: '优化后节省成本约15%'
})

await project.save()
```

---

### 示例 4: 查询BOM历史

```javascript
// 获取项目及其BOM历史
const project = await Project.findById(projectId)
  .populate('bom_history.created_by', 'name email')

// 显示所有版本
console.log('BOM版本历史:')
project.bom_history.forEach((version, index) => {
  console.log(`\n版本 ${index + 1}: ${version.version_name}`)
  console.log(`创建时间: ${version.created_at}`)
  console.log(`创建者: ${version.created_by?.name}`)
  console.log(`总金额: ¥${version.total_amount.toLocaleString()}`)
  console.log(`项目数: ${version.items.length}`)
  if (version.change_description) {
    console.log(`变更说明: ${version.change_description}`)
  }
})

// 获取最新版本
const latestVersion = project.bom_history[project.bom_history.length - 1]

// 对比两个版本
const v1 = project.bom_history[0]
const v2 = project.bom_history[1]
const savings = v1.total_amount - v2.total_amount
const savingsPercent = ((savings / v1.total_amount) * 100).toFixed(2)

console.log(`\n成本优化:`)
console.log(`原始总价: ¥${v1.total_amount.toLocaleString()}`)
console.log(`优化后: ¥${v2.total_amount.toLocaleString()}`)
console.log(`节省: ¥${savings.toLocaleString()} (${savingsPercent}%)`)
```

---

## 🔄 工作流示例

### 完整的BOM管理流程

```
1. 项目创建
   ↓
2. 添加选型数据
   └─ 使用 selections 字段
   ↓
3. 生成初始BOM
   ├─ 从 selections 提取数据
   ├─ 保存到 bill_of_materials
   └─ 创建历史版本 (v1.0 - Initial)
   ↓
4. 执行优化
   ├─ 运行优化算法
   └─ 获得优化建议
   ↓
5. 应用优化
   ├─ 保存当前BOM到历史 (v1.x)
   ├─ 更新 bill_of_materials
   └─ 创建新历史版本 (v2.0 - Optimized)
   ↓
6. 客户确认
   ├─ 客户要求修改
   └─ 创建修改版本 (v2.1 - Client Revisions)
   ↓
7. 最终确认
   └─ 创建最终版本 (v3.0 - Final)
   ↓
8. 生成报价单/PDF
   └─ 使用当前 bill_of_materials
```

---

## 🎯 与现有字段的关系

### 数据流向图

```
┌─────────────────┐
│   selections    │  原始选型数据
│  (Legacy Data)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│optimized_bill_  │  优化后的BOM（临时）
│of_materials     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ bill_of_        │  ← 当前活动BOM
│ materials       │    (新字段)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  bom_history    │  ← BOM版本历史
│                 │    (新字段)
└─────────────────┘
```

---

## ✅ 验证清单

### 数据完整性

```javascript
// 验证BOM项目完整性
function validateBOMItem(item) {
  if (!item.item_type) throw new Error('item_type is required')
  if (!item.model_name) throw new Error('model_name is required')
  if (!item.quantity || item.quantity < 1) throw new Error('quantity must be ≥ 1')
  if (item.unit_price === undefined || item.unit_price < 0) throw new Error('unit_price must be ≥ 0')
  if (item.total_price === undefined || item.total_price < 0) throw new Error('total_price must be ≥ 0')
  
  // 验证总价计算
  const expectedTotal = item.quantity * item.unit_price
  if (Math.abs(item.total_price - expectedTotal) > 0.01) {
    console.warn('total_price mismatch:', {
      calculated: expectedTotal,
      stored: item.total_price
    })
  }
  
  return true
}

// 验证BOM历史版本
function validateBOMVersion(version) {
  if (!version.version_name) throw new Error('version_name is required')
  if (!version.created_at) throw new Error('created_at is required')
  if (version.total_amount === undefined || version.total_amount < 0) {
    throw new Error('total_amount must be ≥ 0')
  }
  if (!Array.isArray(version.items)) throw new Error('items must be an array')
  
  // 验证每个项目
  version.items.forEach(item => validateBOMItem(item))
  
  // 验证总金额
  const calculatedTotal = version.items.reduce((sum, item) => sum + item.total_price, 0)
  if (Math.abs(version.total_amount - calculatedTotal) > 0.01) {
    console.warn('total_amount mismatch:', {
      calculated: calculatedTotal,
      stored: version.total_amount
    })
  }
  
  return true
}
```

---

## 📊 查询示例

### 常用查询

```javascript
// 1. 获取有BOM的项目
const projectsWithBOM = await Project.find({
  'bill_of_materials.0': { $exists: true }
})

// 2. 按BOM总价排序
const projects = await Project.aggregate([
  {
    $addFields: {
      bomTotal: { $sum: '$bill_of_materials.total_price' }
    }
  },
  { $sort: { bomTotal: -1 } },
  { $limit: 10 }
])

// 3. 统计各类项目的数量
const stats = await Project.aggregate([
  { $unwind: '$bill_of_materials' },
  {
    $group: {
      _id: '$bill_of_materials.item_type',
      count: { $sum: '$bill_of_materials.quantity' },
      totalValue: { $sum: '$bill_of_materials.total_price' }
    }
  },
  { $sort: { totalValue: -1 } }
])

// 4. 获取BOM版本最多的项目
const projectsWithMostVersions = await Project.find()
  .sort({ 'bom_history': -1 })
  .limit(10)
  .select('projectNumber projectName bom_history')

// 5. 查找特定型号
const projectsWithModel = await Project.find({
  'bill_of_materials.model_name': 'SF10-150DA'
})
```

---

## 🚀 最佳实践

### 1. 总是保存历史

```javascript
// ❌ 不好的做法
project.bill_of_materials = newBOM
await project.save()

// ✅ 好的做法
// 1. 先保存到历史
project.bom_history.push({
  version_name: `v${project.bom_history.length + 1}.0`,
  created_at: new Date(),
  created_by: userId,
  total_amount: calculateTotal(project.bill_of_materials),
  items: [...project.bill_of_materials],
  change_description: '更新原因'
})

// 2. 再更新当前BOM
project.bill_of_materials = newBOM

await project.save()
```

---

### 2. 使用有意义的版本名

```javascript
// ✅ 好的版本命名
'v1.0 - Initial'
'v2.0 - Optimized'
'v2.1 - Client Revisions'
'v3.0 - Final'
'v3.1 - Post-Audit Corrections'

// ❌ 不好的命名
'version 1'
'new'
'updated'
```

---

### 3. 始终验证价格计算

```javascript
// 创建BOM项目时验证
const item = {
  item_type: 'Actuator',
  model_name: 'SF10-150DA',
  quantity: 3,
  unit_price: 8500,
  total_price: 3 * 8500  // ✅ 显式计算
}

// 使用辅助函数
function createBOMItem(type, model, quantity, unitPrice) {
  return {
    item_type: type,
    model_name: model,
    quantity: quantity,
    unit_price: unitPrice,
    total_price: quantity * unitPrice  // 自动计算
  }
}
```

---

### 4. 添加变更追踪

```javascript
// 记录详细的变更信息
project.bom_history.push({
  version_name: 'v2.0 - Optimized',
  created_at: new Date(),
  created_by: userId,
  total_amount: newTotal,
  items: optimizedBOM,
  change_description: [
    '归并了5个相同型号的执行器',
    '总价从 ¥45,000 降至 ¥38,000',
    '节省成本 15.6%'
  ].join('\n'),
  notes: '客户已确认优化方案'
})
```

---

## 📚 相关文档

- `backend/models/NewProject.js` - 新项目模型（包含 `optimized_bill_of_materials`）
- `frontend/src/utils/optimization.js` - 优化算法
- `报价单PDF优化功能完成报告.md` - PDF生成文档

---

## 🎉 总结

**BOM字段升级**已成功完成！

**新增功能**:
- ✅ `bill_of_materials` - 当前活动BOM
- ✅ `bom_history` - 完整的版本历史
- ✅ 灵活的数据结构
- ✅ 完整的字段验证
- ✅ 支持多种项目类型
- ✅ 覆盖位号追踪

**业务价值**:
- 📊 专业的BOM管理
- 📜 完整的变更历史
- 🔍 可追溯性
- 📈 版本对比分析
- 💰 成本优化追踪

---

**完成时间**: 2025-10-27  
**状态**: ✅ Production Ready  
**版本**: v1.0

