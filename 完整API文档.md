# C-MAX 执行器选型系统 - 完整API文档

## 📚 目录

1. [认证API](#认证api)
2. [选型引擎API](#选型引擎api) ⭐ 核心功能
3. [执行器管理API](#执行器管理api)
4. [手动操作装置API](#手动操作装置api)
5. [项目管理API](#项目管理api)
6. [Excel导入导出](#excel导入导出) ⭐ 批量操作

---

## 基础信息

### 基础URL
```
http://localhost:5001/api
```

### 认证方式
所有API（除登录外）都需要在请求头中包含JWT Token：
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### 响应格式
所有API响应都遵循统一格式：
```json
{
  "success": true/false,
  "message": "操作结果描述",
  "data": {...},  // 或 null
  "error": "错误信息"  // 仅在失败时返回
}
```

---

## 认证API

### 1. 用户登录
```http
POST /api/auth/login
```

**请求体**:
```json
{
  "email": "admin@cmax.com",
  "password": "admin123"
}
```

**响应**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "Admin",
    "email": "admin@cmax.com",
    "role": "administrator"
  }
}
```

**测试账号**:
- 管理员: `admin@cmax.com` / `admin123`
- 工程师: `john@cmax.com` / `engineer123`
- 销售经理: `sarah@cmax.com` / `sales123`

---

## 选型引擎API

### 2. 智能选型计算 ⭐ 核心功能
```http
POST /api/selection/calculate
```

**功能**: 根据输入参数智能推荐最合适的执行器和手动操作装置配置

**请求体**:
```json
{
  "required_torque": 600,              // 必需：要求扭矩 (Nm)
  "working_pressure": 0.5,             // 必需：工作压力 (MPa)
  "working_angle": 0,                  // 可选：工作角度 (度)，默认0
  "yoke_type": "symmetric",            // 可选：轭架类型 symmetric/canted
  "action_type_preference": "DA",      // 可选：作用类型偏好 DA/SR
  "body_size_preference": "SF12",      // 可选：本体尺寸偏好
  "needs_manual_override": true,       // 可选：是否需要手动操作装置
  "manual_override_type": "手轮",      // 可选：手动装置类型偏好
  "budget_limit": 10000,               // 可选：预算上限 (元)
  "special_requirements": "防爆型"     // 可选：特殊要求
}
```

**响应**:
```json
{
  "success": true,
  "message": "找到 3 个满足要求的执行器配置",
  "count": 3,
  "search_criteria": {
    "required_torque": 600,
    "working_pressure": 0.5,
    "working_angle": 0,
    "yoke_type": "symmetric"
  },
  "best_choice": {
    "actuator": {
      "id": "...",
      "model_base": "SF12-250SR",
      "body_size": "SF12",
      "action_type": "SR",
      "base_price": 6500,
      "specifications": {...}
    },
    "selection_details": {
      "actual_torque": 858,
      "required_torque": 600,
      "torque_margin": "43.00%",
      "recommendation": "强烈推荐"
    },
    "manual_override": {
      "id": "...",
      "model": "HG",
      "name": "手轮装置（标准型）",
      "price": 800
    },
    "pricing": {
      "actuator_price": 6500,
      "override_price": 800,
      "total_price": 7300,
      "currency": "CNY"
    },
    "delivery": {
      "lead_time": 14,
      "available": true
    }
  },
  "recommendations": [...]  // 所有推荐选项
}
```

**使用场景**:
```bash
# 场景1: 小型阀门选型
curl -X POST http://localhost:5001/api/selection/calculate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 300,
    "working_pressure": 0.3,
    "working_angle": 0,
    "yoke_type": "symmetric"
  }'

# 场景2: 带手动操作装置的中型阀门
curl -X POST http://localhost:5001/api/selection/calculate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 1000,
    "working_pressure": 0.5,
    "working_angle": 0,
    "yoke_type": "canted",
    "needs_manual_override": true,
    "manual_override_type": "手轮"
  }'
```

### 3. 批量选型
```http
POST /api/selection/batch
```

**请求体**:
```json
{
  "selections": [
    {
      "tag_number": "V-001",
      "required_torque": 500,
      "working_pressure": 0.4,
      "working_angle": 0,
      "yoke_type": "symmetric"
    },
    {
      "tag_number": "V-002",
      "required_torque": 1200,
      "working_pressure": 0.5,
      "working_angle": 0,
      "yoke_type": "canted"
    }
  ]
}
```

**响应**:
```json
{
  "success": true,
  "message": "批量选型完成：2 成功，0 失败",
  "total": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "index": 0,
      "tag_number": "V-001",
      "success": true,
      "recommended_actuator": "SF12-250SR",
      "actual_torque": 687,
      "price": 6500
    },
    {
      "index": 1,
      "tag_number": "V-002",
      "success": true,
      "recommended_actuator": "SF14-400DA",
      "actual_torque": 1430,
      "price": 8500
    }
  ]
}
```

---

## 执行器管理API

### 4. 获取所有执行器
```http
GET /api/actuators
```

**查询参数**:
- `body_size`: 过滤本体尺寸 (如 SF10)
- `action_type`: 过滤作用类型 (DA/SR)
- `is_active`: 是否激活 (true/false)
- `min_price`: 最低价格
- `max_price`: 最高价格

**示例**:
```bash
# 获取所有双作用执行器
GET /api/actuators?action_type=DA

# 获取价格在5000-10000的执行器
GET /api/actuators?min_price=5000&max_price=10000
```

### 5. 根据扭矩查找执行器
```http
POST /api/actuators/find-by-torque
```

**请求体**:
```json
{
  "required_torque": 500,
  "pressure": 0.4,
  "angle": 0,
  "yoke_type": "symmetric"
}
```

### 6. 创建执行器 (仅管理员)
```http
POST /api/actuators
```

**请求体**:
```json
{
  "model_base": "SF08-100DA",
  "body_size": "SF08",
  "action_type": "DA",
  "base_price": 4000,
  "torque_symmetric": {
    "0_3_0": 206,
    "0_4_0": 275,
    "0_5_0": 343
  },
  "torque_canted": {
    "0_3_0": 278,
    "0_4_0": 371,
    "0_5_0": 463
  },
  "specifications": {
    "pressure_range": { "min": 2, "max": 8 },
    "temperature_range": { "min": -20, "max": 80 },
    "rotation_angle": 90,
    "weight": 8.5
  }
}
```

### 7. 更新执行器 (仅管理员)
```http
PUT /api/actuators/:id
```

### 8. 删除执行器 (仅管理员)
```http
DELETE /api/actuators/:id
```

---

## 手动操作装置API

### 9. 获取所有手动操作装置
```http
GET /api/manual-overrides
```

**查询参数**:
- `operation_type`: 操作类型（手轮、手柄等）
- `compatible_with`: 兼容的本体尺寸
- `is_active`: 是否激活

### 10. 查找兼容的手动操作装置
```http
GET /api/manual-overrides/compatible/:bodySize
```

**示例**:
```bash
# 查找与SF10兼容的手动操作装置
GET /api/manual-overrides/compatible/SF10
```

**响应**:
```json
{
  "success": true,
  "body_size": "SF10",
  "count": 2,
  "data": [
    {
      "model": "HG",
      "name": "手轮装置（标准型）",
      "price": 800,
      "compatible_body_sizes": ["SF10", "SF12", "SF14"]
    },
    {
      "model": "HL",
      "name": "手柄装置",
      "price": 600,
      "compatible_body_sizes": ["SF10", "SF12"]
    }
  ]
}
```

### 11. 批量查找兼容性
```http
POST /api/manual-overrides/compatible-multiple
```

**请求体**:
```json
{
  "body_sizes": ["SF10", "SF14", "SF20"]
}
```

### 12. 创建手动操作装置 (仅管理员)
```http
POST /api/manual-overrides
```

### 13. 更新手动操作装置 (仅管理员)
```http
PUT /api/manual-overrides/:id
```

### 14. 删除手动操作装置 (仅管理员)
```http
DELETE /api/manual-overrides/:id
```

---

## 项目管理API

### 15. 获取所有项目
```http
GET /api/new-projects
```

**查询参数**:
- `status`: 项目状态
- `priority`: 优先级
- `industry`: 行业

### 16. 创建项目
```http
POST /api/new-projects
```

**请求体**:
```json
{
  "project_name": "某化工厂阀门自动化改造",
  "client_name": "XX化工有限公司",
  "client_contact": {
    "company": "XX化工有限公司",
    "contact_person": "张工",
    "email": "zhang@chemical.com",
    "phone": "138-1234-5678"
  },
  "priority": "高",
  "industry": "化工",
  "application": "球阀和蝶阀的气动自动化控制"
}
```

### 17. 自动选型并添加到项目 ⭐ 核心功能
```http
POST /api/new-projects/:projectId/auto-select
```

**请求体**:
```json
{
  "tag_number": "V-101",
  "required_torque": 600,
  "working_pressure": 0.5,
  "working_angle": 0,
  "yoke_type": "symmetric",
  "needs_manual_override": true,
  "preferred_override_type": "手轮",
  "notes": "主管道球阀"
}
```

**功能**: 
1. 自动查找合适的执行器
2. 自动匹配兼容的手动操作装置
3. 计算总价
4. 添加到项目选型列表

### 18. 获取项目详情
```http
GET /api/new-projects/:projectId
```

### 19. 更新项目
```http
PUT /api/new-projects/:projectId
```

### 20. 删除项目 (仅管理员)
```http
DELETE /api/new-projects/:projectId
```

### 21. 获取项目统计
```http
GET /api/new-projects/stats/summary
```

---

## Excel导入导出

### 22. 上传Excel文件 - 执行器 (仅管理员) ⭐
```http
POST /api/actuators/upload
```

**请求类型**: `multipart/form-data`

**请求体**:
- `file`: Excel文件 (.xlsx)

**查询参数**:
- `update_existing=true`: 更新已存在的数据（默认跳过）

**功能**:
1. 上传Excel文件
2. 自动解析数据
3. 验证每一行数据
4. 生成详细的验证报告
5. 导入有效数据

**示例 (使用 curl)**:
```bash
curl -X POST http://localhost:5001/api/actuators/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@actuators.xlsx"

# 更新已存在的数据
curl -X POST "http://localhost:5001/api/actuators/upload?update_existing=true" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@actuators.xlsx"
```

**响应**:
```json
{
  "success": true,
  "message": "Excel文件导入完成",
  "validation_report": {
    "summary": {
      "total_rows": 10,
      "valid_rows": 9,
      "invalid_rows": 1,
      "total_errors": 2,
      "total_warnings": 3,
      "success_rate": "90.00%"
    },
    "invalid_data": [
      {
        "row": 5,
        "errors": ["价格必须是正数", "缺少 body_size 字段"],
        "warnings": []
      }
    ]
  },
  "import_results": {
    "success": 9,
    "failed": 0,
    "skipped": 0,
    "errors": []
  },
  "summary": {
    "total_rows": 10,
    "validated": 9,
    "imported": 9,
    "skipped": 0,
    "failed": 0
  }
}
```

### 23. 下载Excel模板 - 执行器 (仅管理员)
```http
GET /api/actuators/template
```

**功能**: 下载包含示例数据的Excel模板

**响应**: Excel文件下载

**示例**:
```bash
curl -X GET http://localhost:5001/api/actuators/template \
  -H "Authorization: Bearer $TOKEN" \
  -o actuator_template.xlsx
```

### 24. 上传Excel文件 - 手动操作装置 (仅管理员)
```http
POST /api/manual-overrides/upload
```

**使用方式与执行器上传相同**

### 25. 下载Excel模板 - 手动操作装置 (仅管理员)
```http
GET /api/manual-overrides/template
```

---

## Excel文件格式说明

### 执行器Excel格式

| 列名 | 类型 | 必需 | 说明 | 示例 |
|------|------|------|------|------|
| model_base | String | 是 | 基础型号 | SF10-150DA |
| body_size | String | 是 | 本体尺寸 | SF10 |
| action_type | String | 是 | 作用类型 | DA 或 SR |
| base_price | Number | 是 | 基础价格 | 5000 |
| torque_symmetric | JSON | 否 | 对称轭架扭矩 | {"0_3_0":309,"0_4_0":412} |
| torque_canted | JSON | 否 | 倾斜轭架扭矩 | {"0_3_0":417,"0_4_0":556} |
| specifications | JSON | 否 | 技术规格 | {...} |
| description | String | 否 | 描述 | SF10 双作用气动执行器 |
| is_active | Boolean | 否 | 是否激活 | true |

**扭矩数据键格式**: `{压力}_{角度}` (如 `0_3_0` 表示 0.3MPa, 0°)

### 手动操作装置Excel格式

| 列名 | 类型 | 必需 | 说明 | 示例 |
|------|------|------|------|------|
| model | String | 是 | 型号 | HG |
| name | String | 否 | 名称 | 手轮装置（标准型） |
| price | Number | 是 | 价格 | 800 |
| compatible_body_sizes | String | 是 | 兼容尺寸 | SF10,SF12,SF14 |
| specifications | JSON | 否 | 规格 | {...} |
| dimensions | JSON | 否 | 尺寸 | {...} |
| description | String | 否 | 描述 | 适用于手动操作 |
| application | String | 否 | 应用 | 紧急控制 |
| is_active | Boolean | 否 | 是否激活 | true |

---

## 错误代码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源未找到 |
| 500 | 服务器错误 |

---

## 完整测试流程

### 1. 登录
```bash
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmax.com","password":"admin123"}' \
  | jq -r '.token')
```

### 2. 智能选型
```bash
curl -X POST http://localhost:5001/api/selection/calculate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 600,
    "working_pressure": 0.5,
    "working_angle": 0,
    "yoke_type": "symmetric",
    "needs_manual_override": true
  }'
```

### 3. 创建项目
```bash
PROJECT_ID=$(curl -s -X POST http://localhost:5001/api/new-projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "测试项目",
    "client_name": "测试客户"
  }' | jq -r '.data._id')
```

### 4. 自动选型并添加到项目
```bash
curl -X POST http://localhost:5001/api/new-projects/$PROJECT_ID/auto-select \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tag_number": "V-001",
    "required_torque": 600,
    "working_pressure": 0.5,
    "working_angle": 0,
    "yoke_type": "symmetric",
    "needs_manual_override": true
  }'
```

### 5. 下载Excel模板
```bash
curl -X GET http://localhost:5001/api/actuators/template \
  -H "Authorization: Bearer $TOKEN" \
  -o template.xlsx
```

### 6. 上传Excel文件
```bash
curl -X POST http://localhost:5001/api/actuators/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@my_actuators.xlsx"
```

---

## 高级功能

### 选型算法说明
1. **扭矩匹配**: 查找实际扭矩 ≥ 要求扭矩的执行器
2. **优先排序**: 按扭矩从小到大排序，优先推荐最接近需求的型号
3. **兼容性匹配**: 根据执行器本体尺寸自动匹配手动操作装置
4. **智能推荐**: 
   - 扭矩裕度 < 20%: 强烈推荐
   - 扭矩裕度 20-50%: 推荐
   - 扭矩裕度 > 50%: 可选

### 数据验证规则
**执行器验证**:
- model_base: 必需，字符串
- body_size: 必需，字符串
- action_type: 必需，DA 或 SR
- base_price: 必需，正数
- 扭矩键格式: `数字_数字_数字` (如 0_3_0)

**手动操作装置验证**:
- model: 必需，字符串
- price: 必需，正数
- compatible_body_sizes: 必需，数组且不为空

---

## 常见问题 FAQ

### Q: 如何处理Excel上传失败？
A: 系统会返回详细的验证报告，指出哪一行的哪个字段有问题。修正后重新上传。

### Q: 扭矩数据的键格式是什么？
A: 格式为 `{压力}_{角度}`，例如：
- `0_3_0`: 0.3 MPa, 0°
- `0_4_15`: 0.4 MPa, 15°
- `0_5_0`: 0.5 MPa, 0°

### Q: 如何更新已存在的数据？
A: 在上传时添加查询参数 `?update_existing=true`

### Q: 批量选型最多支持多少条？
A: 建议不超过100条，以确保响应速度。

### Q: 如何获取详细的错误信息？
A: 所有API错误响应都包含 `error` 字段，提供详细的错误信息。

---

**文档版本**: v2.0.0  
**最后更新**: 2025-10-26  
**联系方式**: 技术支持团队


