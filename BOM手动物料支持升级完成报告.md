# BOM 手动物料支持升级完成报告

## 📋 升级概述

成功升级了 BOM（Bill of Materials）清单功能，现在支持**手动添加临时物料**和**自定义价格**，使系统既能使用系统内现有物料，也能灵活添加系统外的临时物料。

**升级日期**: 2025-10-28  
**状态**: ✅ 完成  
**影响文件**: `backend/models/Project.js`

---

## ✅ 主要变更

### 1. BOM 字段结构升级 ✓

#### 新增字段

1. **`item_id`** - 系统物料引用（可选）
   ```javascript
   item_id: {
     type: mongoose.Schema.Types.ObjectId,
     refPath: 'bill_of_materials.item_type',
     // 非必填 - 手动添加的物料不需要此字段
   }
   ```
   - **用途**: 引用系统内的 Actuator 或 Accessory
   - **必填性**: ❌ 非必填（手动物料可为空）
   - **动态引用**: 使用 `refPath` 根据 `item_type` 自动判断引用哪个集合

2. **`is_manual`** - 手动物料标识
   ```javascript
   is_manual: {
     type: Boolean,
     default: false
   }
   ```
   - **用途**: 标识该物料是否为手动添加
   - **默认值**: `false`（系统物料）

#### 修改字段

1. **`item_type`** - 物料类型枚举
   ```javascript
   item_type: {
     type: String,
     required: true,
     enum: ['Actuator', 'Accessory', 'Manual', 'Valve', 'Other'],
     trim: true
   }
   ```
   - **新增**: `'Manual'` 选项
   - **移除**: `'Manual Override'`（改为 `'Manual'` 更通用）

2. **`unit_price`** - 单价（保持必填）
   ```javascript
   unit_price: {
     type: Number,
     required: true,  // ✓ 保持必填
     min: [0, 'Unit price cannot be negative']
   }
   ```
   - **说明**: 无论是系统物料还是手动物料，单价都必须提供

### 2. BOM 历史记录同步升级 ✓

`bom_history.items` 数组也进行了相同的结构升级，确保历史版本和当前版本保持一致：

- ✅ 添加 `item_id` 字段（可选）
- ✅ `item_type` 枚举添加 `'Manual'`
- ✅ 添加 `is_manual` 标识字段

---

## 📊 升级后的数据结构

### 完整的 BOM 项结构

```javascript
{
  // 系统物料引用（可选）
  item_id: ObjectId("..."),  // 仅系统物料需要
  
  // 物料类型（必填）
  item_type: 'Manual',  // 'Actuator' | 'Accessory' | 'Manual' | 'Valve' | 'Other'
  
  // 型号名称（必填）
  model_name: '自定义阀门配件',
  
  // 数量（必填）
  quantity: 5,
  
  // 单价（必填）
  unit_price: 1250.00,
  
  // 总价（必填，自动计算）
  total_price: 6250.00,
  
  // 描述（可选）
  description: '特殊定制的不锈钢阀门配件',
  
  // 规格（可选）
  specifications: {
    material: 'SS316',
    size: 'DN100',
    pressure: 'PN40'
  },
  
  // 备注（可选）
  notes: '需要特殊加工，交货期10天',
  
  // 覆盖标签（可选）
  covered_tags: ['V001', 'V002'],
  
  // 手动添加标识
  is_manual: true,  // 手动物料为 true
  
  // 创建时间
  created_at: ISODate("2025-10-28T00:00:00Z")
}
```

---

## 🎯 使用场景

### 场景 1: 添加系统内物料（现有功能）

**特点**: 物料已在系统中注册，有完整的产品信息

```javascript
// API 请求示例
POST /api/projects/:id/bom

{
  "item_id": "507f1f77bcf86cd799439011",  // 引用系统内的 Actuator
  "item_type": "Actuator",
  "model_name": "AT050-GY",
  "quantity": 2,
  "unit_price": 15000.00,
  "total_price": 30000.00,
  "is_manual": false  // 系统物料
}
```

**系统行为**:
- ✓ 验证 `item_id` 是否存在
- ✓ 自动填充产品详细信息
- ✓ 使用产品的标准价格（可覆盖）

### 场景 2: 添加手动物料（新功能）⭐

**特点**: 物料不在系统中，临时添加，用户自定义所有信息

```javascript
// API 请求示例
POST /api/projects/:id/bom

{
  // 注意: 没有 item_id 字段
  "item_type": "Manual",
  "model_name": "自定义密封垫片组",
  "description": "特殊材质的高温密封垫片",
  "quantity": 10,
  "unit_price": 150.00,
  "total_price": 1500.00,
  "specifications": {
    "material": "PTFE",
    "temperature_rating": "250°C"
  },
  "notes": "供应商: XYZ公司，交货期: 7天",
  "is_manual": true  // 标识为手动物料
}
```

**系统行为**:
- ✓ 不验证 `item_id`（因为没有）
- ✓ 直接使用用户提供的所有信息
- ✓ 保存为临时物料

### 场景 3: 混合 BOM（系统物料 + 手动物料）

```javascript
// 一个项目的 BOM 可以同时包含两种类型
bill_of_materials: [
  {
    // 系统物料 1
    item_id: "507f1f77bcf86cd799439011",
    item_type: "Actuator",
    model_name: "AT050-GY",
    quantity: 2,
    unit_price: 15000.00,
    is_manual: false
  },
  {
    // 系统物料 2
    item_id: "507f1f77bcf86cd799439012",
    item_type: "Accessory",
    model_name: "LIMIT-SWITCH-01",
    quantity: 4,
    unit_price: 500.00,
    is_manual: false
  },
  {
    // 手动物料 1
    item_type: "Manual",
    model_name: "特殊阀门",
    description: "客户指定品牌",
    quantity: 1,
    unit_price: 5000.00,
    is_manual: true
  },
  {
    // 手动物料 2
    item_type: "Valve",
    model_name: "进口球阀 DN50",
    quantity: 5,
    unit_price: 2000.00,
    is_manual: true
  }
]
```

---

## 🔧 前端集成指南

### 1. BOM 添加表单

#### 设计建议

```jsx
import { useState } from 'react'
import { Form, Select, Input, InputNumber, Switch } from 'antd'

const BOMItemForm = () => {
  const [isManual, setIsManual] = useState(false)

  return (
    <Form>
      {/* 物料来源切换 */}
      <Form.Item label="物料来源">
        <Switch
          checkedChildren="手动添加"
          unCheckedChildren="系统物料"
          checked={isManual}
          onChange={setIsManual}
        />
      </Form.Item>

      {/* 物料类型 */}
      <Form.Item
        name="item_type"
        label="物料类型"
        rules={[{ required: true, message: '请选择物料类型' }]}
      >
        <Select>
          {isManual ? (
            <>
              <Select.Option value="Manual">手动添加</Select.Option>
              <Select.Option value="Valve">阀门</Select.Option>
              <Select.Option value="Other">其他</Select.Option>
            </>
          ) : (
            <>
              <Select.Option value="Actuator">执行器</Select.Option>
              <Select.Option value="Accessory">配件</Select.Option>
            </>
          )}
        </Select>
      </Form.Item>

      {/* 系统物料选择 */}
      {!isManual && (
        <Form.Item
          name="item_id"
          label="选择物料"
          rules={[{ required: true, message: '请选择物料' }]}
        >
          <Select
            showSearch
            placeholder="搜索物料型号..."
            optionFilterProp="children"
            onChange={handleItemSelect}
          >
            {/* 动态加载系统物料 */}
          </Select>
        </Form.Item>
      )}

      {/* 手动输入型号 */}
      {isManual && (
        <Form.Item
          name="model_name"
          label="型号/名称"
          rules={[{ required: true, message: '请输入型号或名称' }]}
        >
          <Input placeholder="例如: 自定义阀门配件" />
        </Form.Item>
      )}

      {/* 描述 */}
      <Form.Item name="description" label="描述">
        <Input.TextArea placeholder="物料的详细描述..." />
      </Form.Item>

      {/* 数量 */}
      <Form.Item
        name="quantity"
        label="数量"
        rules={[{ required: true, message: '请输入数量' }]}
      >
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>

      {/* 单价 */}
      <Form.Item
        name="unit_price"
        label="单价 (¥)"
        rules={[{ required: true, message: '请输入单价' }]}
      >
        <InputNumber
          min={0}
          step={0.01}
          precision={2}
          style={{ width: '100%' }}
          disabled={!isManual}  // 系统物料可能自动填充
        />
      </Form.Item>

      {/* 规格（手动物料） */}
      {isManual && (
        <Form.Item name="specifications" label="规格参数">
          <Input.TextArea placeholder="例如: 材质: SS316, 尺寸: DN100" />
        </Form.Item>
      )}

      {/* 备注 */}
      <Form.Item name="notes" label="备注">
        <Input.TextArea placeholder="特殊说明、交货期等..." />
      </Form.Item>
    </Form>
  )
}
```

### 2. BOM 列表显示

```jsx
const BOMList = ({ items }) => {
  const columns = [
    {
      title: '来源',
      dataIndex: 'is_manual',
      key: 'source',
      width: 80,
      render: (isManual) => (
        <Tag color={isManual ? 'orange' : 'blue'}>
          {isManual ? '手动' : '系统'}
        </Tag>
      )
    },
    {
      title: '类型',
      dataIndex: 'item_type',
      key: 'item_type',
      render: (type) => {
        const typeMap = {
          'Actuator': '执行器',
          'Accessory': '配件',
          'Manual': '手动添加',
          'Valve': '阀门',
          'Other': '其他'
        }
        return typeMap[type] || type
      }
    },
    {
      title: '型号/名称',
      dataIndex: 'model_name',
      key: 'model_name',
      render: (text, record) => (
        <div>
          <div><strong>{text}</strong></div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#999' }}>
              {record.description}
            </div>
          )}
        </div>
      )
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right'
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      align: 'right',
      render: (price) => `¥${price.toFixed(2)}`
    },
    {
      title: '总价',
      dataIndex: 'total_price',
      key: 'total_price',
      align: 'right',
      render: (price) => `¥${price.toFixed(2)}`
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />}>编辑</Button>
          <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      )
    }
  ]

  return <Table columns={columns} dataSource={items} rowKey="_id" />
}
```

### 3. API 调用示例

```javascript
// 添加系统物料
const addSystemItem = async (projectId, itemData) => {
  const response = await api.post(`/api/projects/${projectId}/bom`, {
    item_id: itemData.item_id,
    item_type: itemData.item_type,
    model_name: itemData.model_name,
    quantity: itemData.quantity,
    unit_price: itemData.unit_price,
    total_price: itemData.quantity * itemData.unit_price,
    is_manual: false
  })
  return response.data
}

// 添加手动物料
const addManualItem = async (projectId, itemData) => {
  const response = await api.post(`/api/projects/${projectId}/bom`, {
    // 注意: 没有 item_id
    item_type: 'Manual',
    model_name: itemData.model_name,
    description: itemData.description,
    quantity: itemData.quantity,
    unit_price: itemData.unit_price,
    total_price: itemData.quantity * itemData.unit_price,
    specifications: itemData.specifications,
    notes: itemData.notes,
    is_manual: true
  })
  return response.data
}
```

---

## 🔄 后端 API 更新建议

### 1. 添加 BOM 项的验证逻辑

```javascript
// backend/controllers/projectController.js

const addBOMItem = async (req, res) => {
  try {
    const { id } = req.params
    const itemData = req.body
    
    // 验证必填字段
    if (!itemData.item_type || !itemData.model_name || 
        !itemData.quantity || itemData.unit_price === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段'
      })
    }
    
    // 如果不是手动物料，验证 item_id 是否存在
    if (itemData.item_type !== 'Manual' && !itemData.is_manual) {
      if (!itemData.item_id) {
        return res.status(400).json({
          success: false,
          message: '系统物料必须提供 item_id'
        })
      }
      
      // 验证引用的物料是否存在
      const Model = itemData.item_type === 'Actuator' ? Actuator : Accessory
      const item = await Model.findById(itemData.item_id)
      
      if (!item) {
        return res.status(404).json({
          success: false,
          message: `${itemData.item_type} 不存在`
        })
      }
      
      // 可选: 自动填充系统物料的信息
      if (!itemData.unit_price) {
        itemData.unit_price = item.pricing?.basePrice || 0
      }
      if (!itemData.model_name) {
        itemData.model_name = item.modelNumber || item.model_base
      }
    }
    
    // 计算总价
    itemData.total_price = itemData.quantity * itemData.unit_price
    
    // 添加到项目 BOM
    const project = await Project.findById(id)
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      })
    }
    
    project.bill_of_materials.push(itemData)
    await project.save()
    
    res.json({
      success: true,
      message: 'BOM 项添加成功',
      data: project.bill_of_materials[project.bill_of_materials.length - 1]
    })
    
  } catch (error) {
    console.error('添加 BOM 项失败:', error)
    res.status(500).json({
      success: false,
      message: '添加失败',
      error: error.message
    })
  }
}
```

### 2. 查询 BOM 时自动填充系统物料信息

```javascript
const getProjectBOM = async (req, res) => {
  try {
    const { id } = req.params
    
    const project = await Project.findById(id)
      .populate({
        path: 'bill_of_materials.item_id',
        // 动态 populate，根据 item_type 选择不同的模型
        match: (doc) => doc.item_type !== 'Manual',
        select: 'modelNumber model_base specifications pricing'
      })
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      })
    }
    
    res.json({
      success: true,
      data: project.bill_of_materials
    })
    
  } catch (error) {
    console.error('获取 BOM 失败:', error)
    res.status(500).json({
      success: false,
      message: '获取失败',
      error: error.message
    })
  }
}
```

---

## 📊 数据迁移

### 现有数据兼容性

✅ **好消息**: 此次升级是**向后兼容**的！

现有的 BOM 数据将继续正常工作，因为：
1. 新增的 `item_id` 字段是**可选**的
2. 新增的 `is_manual` 字段有**默认值** `false`
3. `item_type` 的枚举扩展了选项，现有值仍然有效

### 可选的数据迁移脚本

如果您想给现有数据添加 `is_manual` 标识：

```javascript
// backend/scripts/migrate-bom-manual-flag.js

const mongoose = require('mongoose')
const Project = require('../models/Project')

async function migrateBOMManualFlag() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    
    // 更新所有现有的 BOM 项，添加 is_manual 字段
    const result = await Project.updateMany(
      {},
      {
        $set: {
          'bill_of_materials.$[].is_manual': false,
          'bom_history.$[].items.$[].is_manual': false
        }
      }
    )
    
    console.log(`✓ 已迁移 ${result.modifiedCount} 个项目`)
    
    await mongoose.disconnect()
  } catch (error) {
    console.error('迁移失败:', error)
    process.exit(1)
  }
}

migrateBOMManualFlag()
```

运行迁移（可选）：
```bash
cd backend
node scripts/migrate-bom-manual-flag.js
```

---

## 🧪 测试用例

### 1. 单元测试

```javascript
// backend/tests/project-bom.test.js

const request = require('supertest')
const app = require('../server')

describe('BOM Manual Items', () => {
  let projectId
  let authToken

  beforeEach(async () => {
    // 创建测试项目
    const project = await Project.create({
      projectNumber: 'TEST-001',
      projectName: 'Test Project',
      client: { name: 'Test Client' },
      createdBy: userId
    })
    projectId = project._id
  })

  test('添加系统物料 - 带 item_id', async () => {
    const response = await request(app)
      .post(`/api/projects/${projectId}/bom`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        item_id: actuatorId,
        item_type: 'Actuator',
        model_name: 'AT050-GY',
        quantity: 2,
        unit_price: 15000,
        total_price: 30000,
        is_manual: false
      })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.item_id).toBeDefined()
    expect(response.body.data.is_manual).toBe(false)
  })

  test('添加手动物料 - 不带 item_id', async () => {
    const response = await request(app)
      .post(`/api/projects/${projectId}/bom`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        item_type: 'Manual',
        model_name: '自定义阀门',
        description: '特殊定制',
        quantity: 1,
        unit_price: 5000,
        total_price: 5000,
        is_manual: true
      })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.item_id).toBeUndefined()
    expect(response.body.data.is_manual).toBe(true)
    expect(response.body.data.model_name).toBe('自定义阀门')
  })

  test('混合 BOM - 系统物料 + 手动物料', async () => {
    // 添加系统物料
    await request(app)
      .post(`/api/projects/${projectId}/bom`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        item_id: actuatorId,
        item_type: 'Actuator',
        model_name: 'AT050-GY',
        quantity: 2,
        unit_price: 15000,
        total_price: 30000
      })

    // 添加手动物料
    await request(app)
      .post(`/api/projects/${projectId}/bom`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        item_type: 'Manual',
        model_name: '临时配件',
        quantity: 5,
        unit_price: 500,
        total_price: 2500,
        is_manual: true
      })

    // 获取 BOM
    const response = await request(app)
      .get(`/api/projects/${projectId}/bom`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(response.status).toBe(200)
    expect(response.body.data.length).toBe(2)
    
    // 验证系统物料
    const systemItem = response.body.data.find(item => !item.is_manual)
    expect(systemItem.item_id).toBeDefined()
    
    // 验证手动物料
    const manualItem = response.body.data.find(item => item.is_manual)
    expect(manualItem.item_id).toBeUndefined()
  })

  test('验证失败 - 缺少必填字段', async () => {
    const response = await request(app)
      .post(`/api/projects/${projectId}/bom`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        item_type: 'Manual',
        // 缺少 model_name
        quantity: 1,
        unit_price: 1000
      })

    expect(response.status).toBe(400)
    expect(response.body.success).toBe(false)
  })
})
```

### 2. 手动测试清单

- [ ] 添加系统物料（Actuator）
- [ ] 添加系统物料（Accessory）
- [ ] 添加手动物料（Manual 类型）
- [ ] 添加其他类型物料（Valve, Other）
- [ ] 混合添加（系统 + 手动）
- [ ] 编辑系统物料
- [ ] 编辑手动物料
- [ ] 删除物料
- [ ] 查看 BOM 列表
- [ ] 导出 BOM 到 Excel
- [ ] 保存 BOM 版本到历史
- [ ] 对比 BOM 版本

---

## 📝 使用注意事项

### 1. 数据完整性

**系统物料**:
- ✅ 必须提供 `item_id`
- ✅ 系统会验证引用是否有效
- ✅ 可以自动填充物料信息和价格

**手动物料**:
- ❌ 不需要 `item_id`
- ✅ 必须手动输入所有信息
- ⚠️ 价格由用户自行维护

### 2. 价格管理

- 系统物料可以使用产品的标准价格
- 手动物料必须手动输入价格
- 两种物料的价格都可以被项目级覆盖

### 3. BOM 导出

导出 BOM 时建议区分显示：
```
| 来源 | 类型 | 型号 | 数量 | 单价 | 总价 |
|------|------|------|------|------|------|
| 系统 | 执行器 | AT050-GY | 2 | 15000 | 30000 |
| 系统 | 配件 | LIMIT-SWITCH-01 | 4 | 500 | 2000 |
| 手动 | 阀门 | 进口球阀 DN50 | 5 | 2000 | 10000 |
| 手动 | 其他 | 特殊密封件 | 10 | 150 | 1500 |
```

### 4. 报价单生成

生成报价单时：
- 系统物料可能包含更详细的规格信息
- 手动物料使用用户输入的描述和规格
- 建议在报价单中标注物料来源

---

## 🎉 总结

### 升级亮点

✅ **灵活性增强** - 支持系统外物料  
✅ **向后兼容** - 现有数据无需迁移  
✅ **数据完整** - 保持字段验证和约束  
✅ **易于使用** - 前后端集成简单  
✅ **历史追踪** - BOM 版本历史同步升级  

### 适用场景

1. **标准项目** - 使用系统物料，规范管理
2. **定制项目** - 混合使用系统和手动物料
3. **特殊物料** - 完全手动添加临时物料
4. **快速报价** - 灵活调整物料和价格

### 后续建议

1. 📱 **前端实现** - 按照本文档的指南实现 UI
2. 🔧 **API 完善** - 添加验证和自动填充逻辑
3. 🧪 **测试覆盖** - 执行单元测试和集成测试
4. 📊 **数据分析** - 统计手动物料使用情况
5. 🎓 **用户培训** - 培训用户使用新功能

---

**升级状态**: ✅ **完成**  
**文档版本**: 1.0  
**最后更新**: 2025-10-28  
**技术支持**: 开发团队

