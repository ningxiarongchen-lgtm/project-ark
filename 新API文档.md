# 新增 API 文档

## 概述

根据新的需求，系统已添加以下三个新的数据库模型和相应的 API 端点：

1. **Actuator（执行器）** - 管理气动执行器产品
2. **ManualOverride（手动操作装置）** - 管理手动操作装置
3. **NewProject（新项目）** - 管理项目和选型配置

---

## 1. 执行器 API (Actuators)

### 数据模型说明

```javascript
{
  model_base: String,           // 基础型号，如 "SF10-150DA"
  body_size: String,            // 本体尺寸，如 "SF10"
  action_type: String,          // 作用类型：'DA'（双作用）或 'SR'（弹簧复位）
  base_price: Number,           // 基础价格（对称和倾斜轭架相同）
  torque_symmetric: Map,        // 对称轭架扭矩数据，键值对如 "0.3_0": 309
  torque_canted: Map,           // 倾斜轭架扭矩数据，键值对如 "0.3_0": 417
  specifications: {             // 技术规格
    pressure_range: {           // 压力范围
      min: Number,
      max: Number
    },
    temperature_range: {        // 温度范围
      min: Number,
      max: Number
    },
    rotation_angle: Number,     // 旋转角度：90, 120, 180
    weight: Number,             // 重量
    port_connection: String,    // 接口类型
    mounting_standard: String,  // 安装标准
    materials: {                // 材质
      body: String,
      piston: String,
      seal: String
    }
  },
  stock_info: {                 // 库存信息
    available: Boolean,
    lead_time: Number
  },
  is_active: Boolean            // 是否激活
}
```

### API 端点

#### 1.1 获取所有执行器

```
GET /api/actuators
```

**查询参数：**
- `body_size` - 按本体尺寸过滤
- `action_type` - 按作用类型过滤（DA/SR）
- `is_active` - 是否激活（true/false）
- `min_price` - 最低价格
- `max_price` - 最高价格

**响应示例：**
```json
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

#### 1.2 根据ID获取执行器

```
GET /api/actuators/:id
```

#### 1.3 创建执行器（仅管理员）

```
POST /api/actuators
```

**请求体示例：**
```json
{
  "model_base": "SF10-150DA",
  "body_size": "SF10",
  "action_type": "DA",
  "base_price": 5000,
  "torque_symmetric": {
    "0.3_0": 309,
    "0.4_0": 412,
    "0.5_0": 515
  },
  "torque_canted": {
    "0.3_0": 417,
    "0.4_0": 556,
    "0.5_0": 695
  },
  "specifications": {
    "pressure_range": { "min": 2, "max": 8 },
    "temperature_range": { "min": -20, "max": 80 },
    "rotation_angle": 90,
    "weight": 12.5,
    "port_connection": "G1/4",
    "mounting_standard": "ISO5211"
  }
}
```

#### 1.4 更新执行器（仅管理员）

```
PUT /api/actuators/:id
```

#### 1.5 删除执行器（仅管理员）

```
DELETE /api/actuators/:id
```

**说明：** 软删除，将 `is_active` 设置为 false

#### 1.6 根据扭矩要求查找执行器

```
POST /api/actuators/find-by-torque
```

**请求体：**
```json
{
  "required_torque": 400,
  "pressure": 0.4,
  "angle": 0,
  "yoke_type": "symmetric"
}
```

**响应示例：**
```json
{
  "success": true,
  "count": 3,
  "search_criteria": {
    "required_torque": 400,
    "pressure": 0.4,
    "angle": 0,
    "yoke_type": "symmetric"
  },
  "data": [
    {
      "actuator": {...},
      "actual_torque": 412,
      "margin": "3.00",
      "recommendation": "推荐"
    }
  ]
}
```

#### 1.7 批量导入执行器（仅管理员）

```
POST /api/actuators/bulk-import
```

**请求体：**
```json
{
  "actuators": [
    {...},
    {...}
  ]
}
```

---

## 2. 手动操作装置 API (Manual Overrides)

### 数据模型说明

```javascript
{
  model: String,                    // 型号，如 "HG", "HW"
  name: String,                     // 名称/描述
  price: Number,                    // 价格
  compatible_body_sizes: [String],  // 兼容的本体尺寸，如 ["SF10", "SF12"]
  specifications: {                 // 技术规格
    operation_type: String,         // 操作类型：手轮、手柄、链轮、蜗轮箱
    gear_ratio: String,             // 减速比
    output_torque: Number,          // 输出扭矩
    weight: Number,                 // 重量
    mounting_position: String,      // 安装位置
    material: String,               // 材质
    protection_class: String        // 防护等级
  },
  dimensions: {                     // 尺寸
    length: Number,
    width: Number,
    height: Number
  },
  stock_info: {                     // 库存信息
    available: Boolean,
    lead_time: Number
  },
  is_active: Boolean                // 是否激活
}
```

### API 端点

#### 2.1 获取所有手动操作装置

```
GET /api/manual-overrides
```

**查询参数：**
- `operation_type` - 按操作类型过滤
- `is_active` - 是否激活
- `compatible_with` - 兼容的本体尺寸

#### 2.2 根据ID获取手动操作装置

```
GET /api/manual-overrides/:id
```

#### 2.3 创建手动操作装置（仅管理员）

```
POST /api/manual-overrides
```

**请求体示例：**
```json
{
  "model": "HG",
  "name": "手轮装置",
  "price": 800,
  "compatible_body_sizes": ["SF10", "SF12", "SF14"],
  "specifications": {
    "operation_type": "手轮",
    "gear_ratio": "1:1",
    "output_torque": 100,
    "weight": 2.5,
    "mounting_position": "顶部",
    "material": "铸铁",
    "protection_class": "IP65"
  }
}
```

#### 2.4 更新手动操作装置（仅管理员）

```
PUT /api/manual-overrides/:id
```

#### 2.5 删除手动操作装置（仅管理员）

```
DELETE /api/manual-overrides/:id
```

#### 2.6 查找兼容指定本体尺寸的装置

```
GET /api/manual-overrides/compatible/:bodySize
```

**示例：**
```
GET /api/manual-overrides/compatible/SF10
```

**响应：**
```json
{
  "success": true,
  "body_size": "SF10",
  "count": 3,
  "data": [...]
}
```

#### 2.7 批量查找兼容装置

```
POST /api/manual-overrides/compatible-multiple
```

**请求体：**
```json
{
  "body_sizes": ["SF10", "SF12", "SF14"]
}
```

#### 2.8 批量导入（仅管理员）

```
POST /api/manual-overrides/bulk-import
```

---

## 3. 项目 API (New Projects)

### 数据模型说明

```javascript
{
  project_name: String,         // 项目名称
  project_number: String,       // 项目编号（自动生成）
  client_name: String,          // 客户名称
  client_contact: {             // 客户联系信息
    company: String,
    contact_person: String,
    email: String,
    phone: String,
    address: String
  },
  created_by: ObjectId,         // 创建者（User引用）
  assigned_to: [ObjectId],      // 分配的团队成员
  selections: [                 // 选型配置数组
    {
      tag_number: String,       // 位号标签
      input_params: {           // 用户输入参数
        required_torque: Number,
        working_pressure: Number,
        working_angle: Number,
        yoke_type: String,
        needs_manual_override: Boolean,
        special_requirements: String
      },
      selected_actuator: {      // 选中的执行器
        actuator_id: ObjectId,
        model_base: String,
        body_size: String,
        action_type: String,
        yoke_type: String,
        actual_torque: Number,
        price: Number
      },
      selected_override: {      // 选中的手动操作装置
        override_id: ObjectId,
        model: String,
        price: Number
      },
      total_price: Number,      // 总价
      status: String,           // 状态：待选型、已选型、已确认、已报价
      notes: String
    }
  ],
  project_status: String,       // 项目状态
  priority: String,             // 优先级：低、中、高、紧急
  industry: String,             // 行业类型
  application: String,          // 应用场景
  timeline: {                   // 时间线
    start_date: Date,
    expected_completion: Date,
    actual_completion: Date
  },
  budget: {                     // 预算
    estimated: Number,
    actual: Number,
    currency: String
  },
  total_project_price: Number,  // 项目总价
  quotes: [ObjectId],           // 关联的报价单
  notes: String,                // 项目备注
  internal_notes: String        // 内部备注
}
```

### API 端点

#### 3.1 获取所有项目

```
GET /api/new-projects
```

**查询参数：**
- `status` - 按项目状态过滤
- `priority` - 按优先级过滤
- `client_name` - 按客户名称搜索

**说明：** 非管理员用户只能看到自己创建或被分配的项目

#### 3.2 根据ID获取项目

```
GET /api/new-projects/:id
```

#### 3.3 创建新项目

```
POST /api/new-projects
```

**请求体示例：**
```json
{
  "project_name": "某化工厂阀门改造项目",
  "client_name": "XX化工有限公司",
  "client_contact": {
    "company": "XX化工有限公司",
    "contact_person": "张工",
    "email": "zhang@example.com",
    "phone": "138****1234"
  },
  "priority": "高",
  "industry": "化工",
  "application": "球阀自动化控制"
}
```

#### 3.4 更新项目

```
PUT /api/new-projects/:id
```

#### 3.5 删除项目（仅管理员）

```
DELETE /api/new-projects/:id
```

#### 3.6 添加选型配置到项目

```
POST /api/new-projects/:id/selections
```

**请求体示例：**
```json
{
  "tag_number": "V-101",
  "input_params": {
    "required_torque": 400,
    "working_pressure": 0.4,
    "working_angle": 0,
    "yoke_type": "symmetric",
    "needs_manual_override": true
  },
  "selected_actuator": {
    "actuator_id": "...",
    "model_base": "SF10-150DA",
    "body_size": "SF10",
    "action_type": "DA",
    "yoke_type": "symmetric",
    "actual_torque": 412,
    "price": 5000
  },
  "selected_override": {
    "override_id": "...",
    "model": "HG",
    "price": 800
  },
  "total_price": 5800
}
```

#### 3.7 更新选型配置

```
PUT /api/new-projects/:id/selections/:selectionId
```

#### 3.8 删除选型配置

```
DELETE /api/new-projects/:id/selections/:selectionId
```

#### 3.9 自动选型（智能推荐）

```
POST /api/new-projects/:id/auto-select
```

**请求体：**
```json
{
  "tag_number": "V-102",
  "required_torque": 400,
  "working_pressure": 0.4,
  "working_angle": 0,
  "yoke_type": "symmetric",
  "needs_manual_override": true,
  "preferred_override_type": "手轮"
}
```

**响应：**
```json
{
  "success": true,
  "message": "自动选型完成",
  "data": {...},
  "selection_details": {
    "actuator": {...},
    "override": {...},
    "total_price": 5800
  }
}
```

**说明：** 系统会自动根据输入参数查找最合适的执行器和手动操作装置，并添加到项目中。

#### 3.10 获取项目统计信息

```
GET /api/new-projects/stats/summary
```

**响应：**
```json
{
  "success": true,
  "total_projects": 25,
  "by_status": [
    { "_id": "进行中", "count": 10, "total_value": 150000 },
    { "_id": "已完成", "count": 12, "total_value": 280000 }
  ]
}
```

---

## 数据验证说明

所有 API 端点都实现了以下验证：

### 执行器
- ✅ 必填字段：model_base, body_size, action_type, base_price
- ✅ action_type 只能是 'DA' 或 'SR'
- ✅ base_price 不能为负数
- ✅ 扭矩数据使用 Map 类型存储

### 手动操作装置
- ✅ 必填字段：model, price
- ✅ price 不能为负数
- ✅ compatible_body_sizes 自动转换为大写

### 项目
- ✅ 必填字段：project_name, created_by
- ✅ project_number 自动生成（格式：PROJ-2025-00001）
- ✅ total_project_price 自动计算
- ✅ 权限验证：非管理员只能访问自己相关的项目

---

## 使用示例

### 完整的选型流程

```javascript
// 1. 创建项目
POST /api/new-projects
{
  "project_name": "化工厂阀门项目",
  "client_name": "XX化工"
}

// 2. 自动选型
POST /api/new-projects/{projectId}/auto-select
{
  "tag_number": "V-101",
  "required_torque": 400,
  "working_pressure": 0.4,
  "working_angle": 0,
  "yoke_type": "symmetric",
  "needs_manual_override": true
}

// 3. 查看项目详情
GET /api/new-projects/{projectId}

// 4. 生成报价（可以使用现有的 quotes API）
POST /api/quotes
{
  "projectId": "{projectId}"
}
```

---

## 注意事项

1. **认证要求**：所有 API 都需要在请求头中包含 JWT 令牌
   ```
   Authorization: Bearer <token>
   ```

2. **权限控制**：
   - 创建/更新/删除执行器和手动操作装置：仅管理员
   - 删除项目：仅管理员
   - 其他操作：所有认证用户

3. **数据格式**：
   - 扭矩数据的键格式：`"{压力}_{角度}"` 例如 `"0.4_0"`
   - 所有尺寸代码自动转换为大写（SF10, SF12等）

4. **自动计算**：
   - 项目编号自动生成
   - 项目总价自动计算
   - 选型配置的总价自动计算

---

## 错误处理

所有 API 遵循统一的错误响应格式：

```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息"
}
```

常见HTTP状态码：
- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 无权限
- `404` - 资源未找到
- `500` - 服务器错误

---

## 后续步骤

1. ✅ 数据库模型已创建
2. ✅ API 路由已实现
3. ✅ 数据验证已添加
4. ⏳ 需要重启后端服务以加载新路由
5. ⏳ 可以使用 Postman 或类似工具测试 API
6. ⏳ 前端界面开发（根据需要）

---

**文档版本：** 1.0  
**创建日期：** 2025-10-26  
**最后更新：** 2025-10-26


