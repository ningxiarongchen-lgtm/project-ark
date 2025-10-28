# API 接口文档

C-MAX 执行器选型系统完整 API 参考。

**基础 URL：** `http://localhost:5000/api`

## 身份认证

除 `/auth/login` 外，所有端点都需要在 Authorization 头中提供有效的 JWT 令牌。

**请求头格式：**
```
Authorization: Bearer <token>
```

### POST /auth/login
登录以获取 JWT 令牌。

**请求体：**
```json
{
  "email": "admin@cmax.com",
  "password": "admin123"
}
```

**响应：**
```json
{
  "_id": "...",
  "name": "管理员",
  "email": "admin@cmax.com",
  "role": "administrator",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /auth/me
获取当前用户资料。

**响应：**
```json
{
  "_id": "...",
  "name": "管理员",
  "email": "admin@cmax.com",
  "role": "administrator",
  "department": "IT部门"
}
```

### PUT /auth/profile
更新用户资料。

**请求体：**
```json
{
  "name": "更新的名字",
  "email": "new@email.com",
  "phone": "+1-555-0100",
  "password": "新密码" // 可选
}
```

## 产品管理

### GET /products
获取所有产品，支持可选过滤器。

**查询参数：**
- `category` - 按类别过滤
- `minTorque` - 最小扭矩值
- `maxTorque` - 最大扭矩值
- `minPressure` - 最小压力
- `maxPressure` - 最大压力
- `rotation` - 按旋转角度过滤 (90°, 180°, 270°)
- `mountingType` - 按安装类型过滤
- `search` - 在型号和描述中搜索
- `isActive` - true/false

**响应：**
```json
{
  "count": 5,
  "products": [
    {
      "_id": "...",
      "modelNumber": "SF-100",
      "series": "SF系列",
      "description": "紧凑型气动执行器",
      "category": "紧凑型",
      "specifications": {
        "torque": {
          "value": 100,
          "min": 90,
          "max": 110
        },
        "pressure": {
          "operating": 6,
          "min": 4,
          "max": 8
        },
        "rotation": "90°"
      },
      "pricing": {
        "basePrice": 450,
        "currency": "USD"
      }
    }
  ]
}
```

### GET /products/:id
根据 ID 获取单个产品。

### POST /products/search
基于需求的智能产品搜索（选型引擎）。

**请求体：**
```json
{
  "requiredTorque": 150,
  "operatingPressure": 6,
  "rotation": "90°",
  "minTemperature": -10,
  "maxTemperature": 70,
  "mountingType": "ISO5211",
  "preferredCategory": "标准型"
}
```

**响应：**
```json
{
  "count": 3,
  "searchCriteria": { ... },
  "results": [
    {
      "product": { ... },
      "score": 85,
      "matchDetails": {
        "torqueMatch": true,
        "pressureMatch": true,
        "rotationMatch": true,
        "temperatureMatch": true,
        "mountingMatch": true
      },
      "recommendation": "极佳匹配"
    }
  ]
}
```

### POST /products（仅管理员）
创建新产品。

**请求体：**
```json
{
  "modelNumber": "SF-300",
  "series": "SF系列",
  "description": "产品描述",
  "category": "标准型",
  "specifications": { ... },
  "pricing": { ... }
}
```

### PUT /products/:id（仅管理员）
更新产品。

### DELETE /products/:id（仅管理员）
停用产品。

## 项目管理

### GET /projects
获取所有项目（根据用户角色过滤）。

**查询参数：**
- `status` - 按状态过滤
- `priority` - 按优先级过滤
- `industry` - 按行业过滤

**响应：**
```json
{
  "count": 10,
  "projects": [
    {
      "_id": "...",
      "projectNumber": "PRJ-2025-0001",
      "projectName": "水处理厂项目",
      "client": {
        "name": "ABC公司",
        "company": "ABC集团",
        "email": "contact@abc.com"
      },
      "status": "进行中",
      "priority": "高",
      "selections": [...],
      "createdBy": {...},
      "createdAt": "2025-10-26T..."
    }
  ]
}
```

### GET /projects/:id
获取包含完整详细信息的单个项目。

### POST /projects
创建新项目。

**请求体：**
```json
{
  "projectName": "新项目",
  "client": {
    "name": "客户名称",
    "company": "公司名称",
    "email": "client@email.com",
    "phone": "+1-555-0123"
  },
  "industry": "石油天然气",
  "priority": "高",
  "description": "项目描述",
  "application": "阀门自动化"
}
```

### PUT /projects/:id
更新项目。

### DELETE /projects/:id（仅管理员）
删除项目。

### POST /projects/:id/selections
向项目添加产品选择。

**请求体：**
```json
{
  "product": "产品ID",
  "quantity": 5,
  "accessories": [
    {
      "accessory": "配件ID",
      "quantity": 5
    }
  ],
  "requirements": {
    "torque": 100,
    "pressure": 6,
    "rotation": "90°"
  },
  "notes": "特殊要求"
}
```

### PUT /projects/:id/selections/:selectionId
更新项目中的选择。

### DELETE /projects/:id/selections/:selectionId
从项目中删除选择。

### GET /projects/stats/summary
获取项目统计信息。

## 报价管理

### GET /quotes
获取所有报价。

**查询参数：**
- `status` - 按状态过滤
- `project` - 按项目 ID 过滤

### GET /quotes/:id
获取包含完整详细信息的单个报价。

### POST /quotes
从项目创建报价。

**请求体：**
```json
{
  "projectId": "项目ID",
  "taxRate": 8,
  "shippingCost": 100,
  "shippingMethod": "标准运输",
  "paymentTerms": "货到付款30天",
  "deliveryTerms": "工厂交货",
  "warranty": "交付后12个月质保",
  "externalNotes": "感谢您的业务",
  "internalNotes": "优先客户"
}
```

### PUT /quotes/:id
更新报价。

**请求体：**
```json
{
  "status": "已发送"
}
```

### DELETE /quotes/:id（仅管理员）
删除报价。

### POST /quotes/:id/revise
创建报价的新版本。

### GET /quotes/stats/summary
获取报价统计信息。

## 配件管理

### GET /accessories
获取所有配件。

**查询参数：**
- `type` - 按类型过滤
- `compatibility` - 按兼容产品过滤
- `isActive` - true/false

### GET /accessories/:id
获取单个配件。

### POST /accessories（仅管理员）
创建配件。

### PUT /accessories/:id（仅管理员）
更新配件。

### DELETE /accessories/:id（仅管理员）
停用配件。

## 管理功能

所有管理端点都需要 `administrator` 角色。

### GET /admin/stats
获取系统范围的统计信息。

**响应：**
```json
{
  "users": {
    "total": 3,
    "active": 3,
    "byRole": [...]
  },
  "products": {
    "total": 5,
    "active": 5,
    "byCategory": [...]
  },
  "accessories": {
    "total": 5,
    "active": 5,
    "byType": [...]
  },
  "projects": {
    "total": 10,
    "byStatus": [...]
  },
  "quotes": {
    "total": 8,
    "byStatus": [...],
    "totalValue": [...]
  }
}
```

### POST /admin/import/products
从 Excel 文件导入产品。

**请求：**
- Content-Type: `multipart/form-data`
- 字段名：`file`
- 文件类型：`.xlsx`, `.xls`

**响应：**
```json
{
  "message": "导入完成",
  "results": {
    "imported": 10,
    "updated": 5,
    "failed": 0,
    "errors": []
  }
}
```

### POST /admin/import/accessories
从 Excel 文件导入配件。

### GET /admin/export/products
将所有产品导出为 Excel 文件。

**响应：** Excel 文件下载

### GET /admin/template/products
下载用于产品导入的 Excel 模板。

**响应：** Excel 模板文件

## 错误响应

所有端点可能返回以下错误响应：

### 400 错误请求
```json
{
  "success": false,
  "message": "验证错误消息"
}
```

### 401 未授权
```json
{
  "message": "未授权，无令牌"
}
```

### 403 禁止访问
```json
{
  "message": "用户角色 'engineer' 无权访问此路由"
}
```

### 404 未找到
```json
{
  "success": false,
  "message": "资源未找到"
}
```

### 500 服务器错误
```json
{
  "success": false,
  "message": "服务器错误"
}
```

## API 最佳实践

1. 始终在请求头中包含有效令牌的 Authorization
2. 使用适当的 HTTP 方法（GET、POST、PUT、DELETE）
3. 在客户端应用程序中优雅地处理错误
4. 适当时缓存响应
5. 使用查询参数进行过滤和搜索
6. 在发送请求之前在客户端验证数据


