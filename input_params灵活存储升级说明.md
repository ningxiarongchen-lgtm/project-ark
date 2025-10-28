# input_params 灵活存储升级说明

## 📋 升级概述

已将 `NewProject` 模型中 `selections` 数组的 `input_params` 字段从**严格定义的对象**升级为**灵活的 Mixed 类型**，现在可以存储任意选型参数，包括新增的阀门信息字段。

---

## ✅ 完成的修改

**文件**: `backend/models/NewProject.js`

**修改位置**: 第 11-29 行

### 修改前（严格结构）
```javascript
// ❌ 旧方式：只能存储预定义的字段
input_params: {
  required_torque: { type: Number, required: true, min: 0 },
  working_pressure: { type: Number, required: true, min: 0 },
  working_angle: { type: Number, required: true, enum: [0, 15, 30, 45, 60, 75, 90] },
  yoke_type: { type: String, enum: ['symmetric', 'canted'], default: 'symmetric' },
  needs_manual_override: { type: Boolean, default: false },
  preferred_override_type: { type: String, trim: true },
  special_requirements: { type: String, trim: true }
}
```

### 修改后（灵活类型）
```javascript
// ✅ 新方式：可以存储任意字段
input_params: {
  type: mongoose.Schema.Types.Mixed,
  default: {}
}
```

---

## 🎯 支持的字段（示例）

`input_params` 现在可以灵活存储以下所有字段：

### 基础选型参数
| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `required_torque` | Number | 所需扭矩 | `130` (N·m) |
| `valve_torque` | Number | 阀门扭矩 | `100` (N·m) |
| `safety_factor` | Number | 安全系数 | `1.3` |
| `working_pressure` | Number | 工作压力 | `0.6` (MPa) |
| `working_angle` | Number | 工作角度 | `90` (degrees) |

### 机构和阀门信息
| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `mechanism` | String | 执行机构类型 | `"Scotch Yoke"` / `"Rack & Pinion"` |
| `valve_type` | String | 阀门类型 | `"Ball Valve"` / `"Butterfly Valve"` |
| `valve_size` | String | **阀门口径** ✅ 新增 | `"DN100"`, `"DN150"`, `"DN200"` |
| `flange_size` | String | **法兰连接尺寸** ✅ 新增 | `"F07/F10"`, `"F10/F12"`, `"F14/F16"` |

### 其他参数
| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `needs_manual_override` | Boolean | 是否需要手动操作装置 | `true` / `false` |
| `max_budget` | Number | 最大预算 | `10000` (元) |
| `special_requirements` | String | 其他要求 | `"需要防爆型"` |
| `tag_number` | String | 位号标识 | `"FV-101"` |

---

## 📊 数据存储示例

### 示例 1: 球阀选型记录

```javascript
{
  tag_number: "FV-101",
  input_params: {
    // 基础参数
    mechanism: "Scotch Yoke",
    valve_type: "Ball Valve",
    valve_torque: 100,
    safety_factor: 1.3,
    required_torque: 130,
    working_pressure: 0.6,
    working_angle: 90,
    
    // 阀门信息 ✅
    valve_size: "DN100",
    flange_size: "F07/F10",
    
    // 其他参数
    needs_manual_override: false,
    max_budget: 5000,
    special_requirements: "标准配置"
  },
  selected_actuator: {
    model_base: "SF14-200DA",
    actual_torque: 150,
    price: 2850
  },
  total_price: 2850
}
```

### 示例 2: 蝶阀选型记录

```javascript
{
  tag_number: "FV-102",
  input_params: {
    mechanism: "Scotch Yoke",
    valve_type: "Butterfly Valve",
    valve_torque: 150,
    safety_factor: 1.3,
    required_torque: 195,
    working_pressure: 0.6,
    working_angle: 90,
    
    // 阀门信息 ✅
    valve_size: "DN150",
    flange_size: "F10/F12",
    
    needs_manual_override: true,
    max_budget: 8000
  },
  selected_actuator: {
    model_base: "SF16-250DA",
    recommended_model: "SF16-250DA/C",
    actual_torque: 220,
    price: 3500
  },
  selected_override: {
    model: "SF16-250DA",
    price: 2000
  },
  total_price: 5500
}
```

### 示例 3: Rack & Pinion 选型记录

```javascript
{
  tag_number: "FV-103",
  input_params: {
    mechanism: "Rack & Pinion",
    valve_type: null, // Rack & Pinion 不需要阀门类型
    valve_torque: 200,
    safety_factor: 1.3,
    required_torque: 260,
    working_pressure: 0.6,
    action_type_preference: "DA",
    
    // 阀门信息 ✅
    valve_size: "DN200",
    flange_size: "F14/F16",
    
    max_budget: 15000
  },
  selected_actuator: {
    model_base: "AT-200DA",
    actual_torque: 300,
    price: 12000
  },
  total_price: 12000
}
```

---

## 🔧 前端保存逻辑（参考）

在前端保存选型记录时，确保将阀门信息包含在 `input_params` 中：

```javascript
// frontend/src/pages/SelectionEngine.jsx

const handleSaveToProject = async () => {
  try {
    if (!currentProject) {
      message.warning('请先选择一个项目')
      return
    }

    // 获取所有表单值
    const formValues = form.getFieldsValue()
    
    // 构建选型数据
    const selectionData = {
      tag_number: formValues.tag_number || `TAG-${Date.now()}`,
      
      // ✅ input_params 包含所有表单值，包括新增的阀门信息
      input_params: {
        ...formValues,
        valve_size: formValues.valve_size,      // 阀门口径 ✅
        flange_size: formValues.flange_size,    // 法兰尺寸 ✅
      },
      
      selected_actuator: selectedActuator,
      selected_override: selectedOverride
    }

    // 发送到后端
    await projectsAPI.autoSelect(currentProject._id, selectionData)
    message.success('已保存到项目')
    
  } catch (error) {
    message.error('保存失败')
  }
}
```

---

## 🎯 后端接收逻辑（参考）

后端控制器会自动接收并保存这些字段：

```javascript
// backend/controllers/newProjectController.js

exports.addSelection = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { tag_number, input_params, selected_actuator, selected_override } = req.body;
    
    const project = await NewProject.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: '项目不存在' });
    }
    
    // ✅ input_params 会自动存储所有字段，包括 valve_size 和 flange_size
    const newSelection = {
      tag_number,
      input_params,  // 灵活存储，包含 valve_size, flange_size 等
      selected_actuator,
      selected_override,
      status: '已选型'
    };
    
    project.selections.push(newSelection);
    await project.save();
    
    res.json({
      success: true,
      message: '选型记录已添加',
      selection: newSelection
    });
    
  } catch (error) {
    res.status(500).json({ message: '保存失败', error: error.message });
  }
};
```

---

## 📈 查询和显示示例

### 查询选型记录
```javascript
// 查询特定项目的选型记录
const project = await NewProject.findById(projectId);

// 访问选型记录
project.selections.forEach(selection => {
  console.log('位号:', selection.tag_number);
  console.log('阀门口径:', selection.input_params.valve_size);
  console.log('法兰尺寸:', selection.input_params.flange_size);
  console.log('阀门类型:', selection.input_params.valve_type);
  console.log('需求扭矩:', selection.input_params.required_torque);
});
```

### 在前端显示
```jsx
// 显示选型记录详情
<Descriptions title="选型参数">
  <Descriptions.Item label="位号">
    {selection.tag_number}
  </Descriptions.Item>
  <Descriptions.Item label="执行机构类型">
    {selection.input_params.mechanism}
  </Descriptions.Item>
  <Descriptions.Item label="阀门类型">
    {selection.input_params.valve_type}
  </Descriptions.Item>
  <Descriptions.Item label="阀门口径">
    {selection.input_params.valve_size}  {/* ✅ 新增 */}
  </Descriptions.Item>
  <Descriptions.Item label="法兰尺寸">
    {selection.input_params.flange_size}  {/* ✅ 新增 */}
  </Descriptions.Item>
  <Descriptions.Item label="需求扭矩">
    {selection.input_params.required_torque} N·m
  </Descriptions.Item>
  <Descriptions.Item label="工作压力">
    {selection.input_params.working_pressure} MPa
  </Descriptions.Item>
</Descriptions>
```

---

## ⚠️ 重要说明

### 1. Mixed 类型的特点

**优点**:
- ✅ 灵活：可以存储任意字段，无需修改 schema
- ✅ 扩展性强：添加新字段无需数据库迁移
- ✅ 适合动态表单：前端可以自由添加新参数

**注意事项**:
- ⚠️ Mongoose 不会自动检测 Mixed 类型的变化
- ⚠️ 修改 Mixed 字段后需要调用 `markModified()`

### 2. 更新 Mixed 字段的正确方式

```javascript
// ❌ 错误方式（Mongoose 可能检测不到变化）
selection.input_params.valve_size = 'DN100';
await project.save();

// ✅ 正确方式 1：使用 markModified()
selection.input_params.valve_size = 'DN100';
selection.markModified('input_params');
await project.save();

// ✅ 正确方式 2：替换整个对象
selection.input_params = {
  ...selection.input_params,
  valve_size: 'DN100',
  flange_size: 'F07/F10'
};
await project.save();
```

### 3. 查询 Mixed 字段

```javascript
// 查询包含特定阀门口径的选型记录
const projects = await NewProject.find({
  'selections.input_params.valve_size': 'DN100'
});

// 查询包含特定法兰尺寸的选型记录
const projects = await NewProject.find({
  'selections.input_params.flange_size': 'F07/F10'
});
```

---

## 🎉 升级优势

### 1. 灵活性提升 🚀
- 无需修改 schema 即可添加新字段
- 支持动态表单和自定义参数
- 适应业务快速变化

### 2. 向后兼容 ✅
- 现有数据不受影响
- 旧字段仍然可以正常访问
- 平滑升级，无需数据迁移

### 3. 扩展性增强 💡
- 支持未来添加更多阀门参数
- 支持不同类型的执行器参数
- 支持自定义业务字段

### 4. 数据完整性 📊
- 完整保存所有用户输入
- 便于追溯和审计
- 支持数据分析和报告生成

---

## ✅ 验证清单

- ✅ `input_params` 类型已改为 `Mixed`
- ✅ 默认值为空对象 `{}`
- ✅ 无 linter 错误
- ✅ 向后兼容现有数据
- ✅ 可以存储 `valve_size`
- ✅ 可以存储 `flange_size`
- ✅ 可以存储任意其他字段

---

## 🚀 后续建议

### 1. 前端表单添加阀门信息输入

```jsx
<Form.Item
  label="阀门口径"
  name="valve_size"
  tooltip="例如：DN100, DN150, DN200"
>
  <Input placeholder="请输入阀门口径，如 DN100" />
</Form.Item>

<Form.Item
  label="法兰连接尺寸"
  name="flange_size"
  tooltip="例如：F07/F10, F10/F12"
>
  <Input placeholder="请输入法兰尺寸，如 F07/F10" />
</Form.Item>
```

### 2. 在项目详情页显示阀门信息

```jsx
{/* 在选型记录列表中显示阀门信息 */}
<List
  dataSource={project.selections}
  renderItem={selection => (
    <Card>
      <Descriptions>
        <Descriptions.Item label="位号">
          {selection.tag_number}
        </Descriptions.Item>
        <Descriptions.Item label="阀门口径">
          {selection.input_params.valve_size || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="法兰尺寸">
          {selection.input_params.flange_size || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="阀门类型">
          {selection.input_params.valve_type || '-'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )}
/>
```

### 3. PDF 报告生成包含阀门信息

```javascript
// 在生成 PDF 报告时包含阀门信息
const generatePDF = (selection) => {
  return {
    title: '选型报告',
    content: [
      { label: '位号', value: selection.tag_number },
      { label: '阀门口径', value: selection.input_params.valve_size },
      { label: '法兰尺寸', value: selection.input_params.flange_size },
      { label: '阀门类型', value: selection.input_params.valve_type },
      { label: '推荐型号', value: selection.selected_actuator.recommended_model },
      // ... 更多信息
    ]
  };
};
```

---

## 📝 总结

✅ **已完成**: `input_params` 字段已升级为灵活的 `Mixed` 类型  
✅ **新增支持**: 现在可以存储 `valve_size` 和 `flange_size`  
✅ **扩展性**: 未来可以轻松添加更多字段，无需修改数据库结构  
✅ **向后兼容**: 不影响现有数据和功能  

---

**升级日期**: 2025-10-27  
**升级状态**: ✅ 已完成  
**文件**: `backend/models/NewProject.js`  
**负责人**: Cursor AI Assistant

