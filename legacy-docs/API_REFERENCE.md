# 📡 Project Ark API 参考文档

## 一、API 基础信息

**基础URL**：`http://localhost:5001/api`  
**认证方式**：JWT Token (Bearer Token 或 HttpOnly Cookie)  
**数据格式**：JSON  
**字符编码**：UTF-8

---

## 二、认证 API

### 2.1 用户认证

#### POST `/api/auth/register`
注册新用户（通常由管理员操作）

**请求体**：
```json
{
  "username": "张三",
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "password": "SecurePassword123!",
  "role": "Sales Manager",
  "department": "销售部"
}
```

**响应**：
```json
{
  "success": true,
  "message": "用户注册成功",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "张三",
    "phone": "13800138000",
    "role": "Sales Manager"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### POST `/api/auth/login`
用户登录

**请求体**：
```json
{
  "phone": "13800138000",
  "password": "SecurePassword123!"
}
```

**响应**：
```json
{
  "success": true,
  "message": "登录成功",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "张三",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "role": "Sales Manager",
    "department": "销售部"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### POST `/api/auth/logout`
用户登出

**请求头**：
```
Authorization: Bearer <token>
```

**响应**：
```json
{
  "success": true,
  "message": "登出成功"
}
```

---

#### POST `/api/auth/change-password`
修改密码

**请求头**：
```
Authorization: Bearer <token>
```

**请求体**：
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**响应**：
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

---

## 三、项目管理 API

### 3.1 项目 CRUD

#### GET `/api/new-projects`
获取项目列表

**请求参数**：
```
?status=In Progress
&page=1
&limit=10
&sort=-createdAt
```

**响应**：
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "projectNumber": "PRJ-202510-0001",
      "projectName": "上海石化阀门自动化项目",
      "customer": "上海石化集团",
      "industry": "Petrochemical",
      "budget": 500000,
      "status": "In Progress",
      "salesManager": {
        "_id": "...",
        "username": "销售经理"
      },
      "createdAt": "2025-10-29T08:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "pages": 3
  }
}
```

---

#### GET `/api/new-projects/:id`
获取项目详情

**响应**：
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "projectNumber": "PRJ-202510-0001",
    "projectName": "上海石化阀门自动化项目",
    "customer": "上海石化集团",
    "technicalRequirements": [
      {
        "tagNumber": "V-101",
        "valveType": "Ball Valve",
        "valveSize": 4,
        "quantity": 10,
        "selectedActuator": {
          "_id": "...",
          "model": "AT-150-DA"
        }
      }
    ],
    "quote": {
      "totalAmount": 485000,
      "validUntil": "2025-11-30"
    }
  }
}
```

---

#### POST `/api/new-projects`
创建新项目

**权限**：Sales Manager

**请求体**：
```json
{
  "projectName": "天津钢铁厂阀门自动化项目",
  "customer": "天津钢铁集团",
  "industry": "Manufacturing",
  "budget": 600000,
  "technicalEngineer": "507f1f77bcf86cd799439012"
}
```

**响应**：
```json
{
  "success": true,
  "message": "项目创建成功",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "projectNumber": "PRJ-202510-0002",
    "status": "Lead"
  }
}
```

---

#### PUT `/api/new-projects/:id`
更新项目

**请求体**：
```json
{
  "status": "Quoted",
  "technicalRequirements": [...]
}
```

---

#### DELETE `/api/new-projects/:id`
删除项目

**权限**：Administrator 或 项目创建者

---

## 四、智能选型 API

### 4.1 执行器选型

#### POST `/api/selection/select-actuator`
智能选型引擎

**请求体**：
```json
{
  "valveType": "Ball Valve",
  "valveSize": 4,
  "pressure": 1.6,
  "temperature": 80,
  "medium": "Water",
  "budget": 5000
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "actuator": {
          "_id": "...",
          "model": "AT-150-DA",
          "series": "AT",
          "torque": 150,
          "price": 3800
        },
        "matchScore": 95,
        "requiredTorque": 120,
        "safetyFactor": 1.25,
        "accessories": [
          {
            "name": "电磁阀",
            "code": "SOV-01",
            "price": 450
          }
        ],
        "totalPrice": 4250
      }
    ],
    "calculation": {
      "requiredTorque": 120,
      "formula": "0.15 × 4 × 1.6 × 12.5"
    }
  }
}
```

---

#### GET `/api/actuators`
获取执行器列表

**请求参数**：
```
?series=AT
&minTorque=100
&maxTorque=200
&page=1
&limit=20
```

**响应**：
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "model": "AT-150-DA",
      "series": "AT",
      "type": "Double Acting",
      "torque": 150,
      "workingPressure": {
        "min": 0.4,
        "max": 0.7
      },
      "price": 3800,
      "supplier": {
        "name": "北京精密机械"
      },
      "stock": 25
    }
  ]
}
```

---

### 4.2 配件管理

#### GET `/api/accessories`
获取配件列表

**请求参数**：
```
?category=Solenoid Valve
&compatibleSeries=AT
```

---

## 五、报价与合同 API

### 5.1 报价管理

#### POST `/api/quotes`
创建报价单

**权限**：Commercial Engineer

**请求体**：
```json
{
  "project": "507f1f77bcf86cd799439011",
  "customer": "上海石化集团",
  "items": [
    {
      "product": "507f...",
      "quantity": 10,
      "unitPrice": 3800
    }
  ],
  "validUntil": "2025-12-31"
}
```

---

#### GET `/api/quotes/:id`
获取报价单详情

---

#### PUT `/api/quotes/:id/approve`
审核报价单

---

### 5.2 合同管理

#### POST `/api/contracts`
创建合同

**请求体**：
```json
{
  "project": "507f1f77bcf86cd799439011",
  "contractNumber": "HT-202510-001",
  "signedDate": "2025-10-29",
  "deliveryDate": "2025-12-15",
  "paymentTerms": "30% 预付，70% 验收后",
  "totalAmount": 485000
}
```

---

#### GET `/api/contracts`
获取合同列表

---

#### PUT `/api/contracts/:id/approve`
审核合同

**权限**：Commercial Engineer

---

## 六、生产管理 API

### 6.1 生产订单

#### POST `/api/production`
创建生产订单

**权限**：Production Planner

**请求体**：
```json
{
  "salesOrder": "507f...",
  "project": "507f...",
  "plannedStartDate": "2025-11-01",
  "plannedEndDate": "2025-12-15",
  "priority": "High"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "orderNumber": "PO-202510-0001",
    "status": "Planning",
    "bom": [
      {
        "item": "...",
        "itemType": "Actuator",
        "quantity": 10
      }
    ]
  }
}
```

---

#### GET `/api/production/:id/bom`
获取生产订单 BOM

**响应**：
```json
{
  "success": true,
  "data": {
    "bom": [
      {
        "item": {
          "model": "AT-150-DA",
          "name": "AT系列双作用执行器"
        },
        "itemType": "Actuator",
        "requiredQuantity": 10,
        "allocatedQuantity": 5,
        "purchaseStatus": "In Progress"
      }
    ]
  }
}
```

---

#### POST `/api/production/:id/schedule`
生成排产计划

**响应**：
```json
{
  "success": true,
  "data": {
    "workOrders": [
      {
        "workOrderNumber": "WO-202510-0001",
        "product": "AT-150-DA",
        "quantity": 10,
        "workCenter": "装配车间",
        "plannedStartTime": "2025-11-01T08:00:00Z"
      }
    ]
  }
}
```

---

### 6.2 工单管理

#### GET `/api/mes/work-orders`
获取工单列表

**权限**：Workshop Worker, Production Planner

---

#### PUT `/api/mes/work-orders/:id/start`
开始工单

---

#### PUT `/api/mes/work-orders/:id/complete`
完成工单

**请求体**：
```json
{
  "completedQuantity": 10,
  "scrapQuantity": 0,
  "notes": "按时完成"
}
```

---

## 七、采购管理 API

### 7.1 采购订单

#### POST `/api/purchase-orders`
创建采购订单

**权限**：Procurement Specialist

**请求体**：
```json
{
  "supplier": "507f...",
  "productionOrder": "507f...",
  "items": [
    {
      "item": "507f...",
      "itemType": "Actuator",
      "quantity": 10,
      "unitPrice": 3500
    }
  ],
  "expectedDeliveryDate": "2025-11-15",
  "paymentTerms": "货到付款"
}
```

---

#### GET `/api/purchase-orders`
获取采购订单列表

---

#### PUT `/api/purchase-orders/:id/receive`
确认收货

**请求体**：
```json
{
  "itemId": "507f...",
  "receivedQuantity": 10,
  "actualDeliveryDate": "2025-11-14"
}
```

---

### 7.2 供应商管理

#### GET `/api/suppliers`
获取供应商列表

---

#### POST `/api/suppliers`
创建供应商

**权限**：Administrator, Procurement Specialist

---

## 八、质量管理 API

### 8.1 质检

#### POST `/api/quality/checks`
创建质检记录

**权限**：Quality Inspector

**请求体**：
```json
{
  "checkType": "FQC",
  "productionOrder": "507f...",
  "product": "507f...",
  "sampleSize": 10,
  "checkItems": [
    {
      "itemName": "外观检查",
      "standard": "无划痕、无锈蚀",
      "actualValue": "合格",
      "result": "Pass"
    }
  ],
  "overallResult": "Pass"
}
```

---

#### GET `/api/quality/checks`
获取质检记录列表

---

## 九、售后服务 API

### 9.1 工单管理

#### POST `/api/tickets`
创建售后工单

**请求体**：
```json
{
  "type": "Repair",
  "priority": "High",
  "customer": "上海石化集团",
  "title": "执行器异常噪音",
  "description": "V-101位号执行器运行时有异常噪音",
  "assignedTo": "507f..."
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "ticketNumber": "TK-202510-0001",
    "status": "Open"
  }
}
```

---

#### GET `/api/tickets`
获取工单列表

**请求参数**：
```
?status=Open
&assignedTo=507f...
```

---

#### PUT `/api/tickets/:id/assign`
分配工单

---

#### PUT `/api/tickets/:id/resolve`
标记为已解决

**请求体**：
```json
{
  "resolution": "更换密封圈，问题已解决"
}
```

---

#### PUT `/api/tickets/:id/close`
关闭工单

---

## 十、数据管理 API

### 10.1 执行器数据管理

#### GET `/api/data-management/actuators`
获取执行器数据（管理视图）

**权限**：Administrator, Technical Engineer

---

#### POST `/api/data-management/actuators`
创建执行器

**请求体**：
```json
{
  "model": "AT-150-DA",
  "series": "AT",
  "type": "Double Acting",
  "torque": 150,
  "price": 3800,
  "supplier": "507f..."
}
```

---

#### PUT `/api/data-management/actuators/:id`
更新执行器

---

#### DELETE `/api/data-management/actuators/:id`
删除执行器

---

### 10.2 用户管理

#### GET `/api/data-management/users`
获取用户列表

**权限**：Administrator

---

#### POST `/api/data-management/users`
创建用户

---

#### PUT `/api/data-management/users/:id`
更新用户

---

## 十一、统计与报表 API

### 11.1 ERP 统计

#### GET `/api/erp/stats`
获取 ERP 统计数据

**响应**：
```json
{
  "success": true,
  "data": {
    "projects": {
      "total": 125,
      "active": 45,
      "won": 78,
      "winRate": 0.62
    },
    "production": {
      "ordersInProgress": 23,
      "completedThisMonth": 15
    },
    "inventory": {
      "actuators": 350,
      "accessories": 1250
    },
    "finance": {
      "revenue": 2500000,
      "profit": 450000
    }
  }
}
```

---

#### GET `/api/erp/reports/sales`
销售报表

---

#### GET `/api/erp/reports/production`
生产报表

---

## 十二、测试 API（仅测试环境）

### 12.1 测试数据管理

#### POST `/api/testing/reset-and-seed`
重置数据库并填充测试数据

**请求体**：
```json
{
  "clearAll": true
}
```

**响应**：
```json
{
  "success": true,
  "message": "数据库重置成功",
  "stats": {
    "users": 10,
    "suppliers": 3,
    "actuators": 6
  }
}
```

---

#### POST `/api/testing/cleanup`
清理测试数据

**请求体**：
```json
{
  "prefix": "E2E-Test-"
}
```

---

#### GET `/api/testing/status`
获取测试环境状态

---

## 十三、错误响应格式

### 标准错误响应

```json
{
  "success": false,
  "message": "错误描述",
  "error": {
    "code": "ERROR_CODE",
    "details": "详细错误信息"
  }
}
```

### 常见错误代码

| 状态码 | 错误代码 | 说明 |
|-------|---------|------|
| 400 | BAD_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未授权访问 |
| 403 | FORBIDDEN | 权限不足 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 资源冲突 |
| 422 | VALIDATION_ERROR | 数据验证失败 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

---

## 十四、Rate Limiting

### 限流规则

- **时间窗口**：15分钟
- **请求限制**：
  - 生产环境：200次/15分钟
  - 开发/测试环境：10000次/15分钟

### 限流响应

```json
{
  "success": false,
  "message": "请求过于频繁，请稍后再试"
}
```

**响应头**：
```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 150
X-RateLimit-Reset: 1698566400
```

---

## 十五、分页规范

### 请求参数

```
?page=1          # 页码（从1开始）
&limit=20        # 每页数量
&sort=-createdAt # 排序（-表示降序）
```

### 响应格式

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 125,
    "page": 1,
    "pages": 7,
    "limit": 20
  }
}
```

---

## 十六、使用示例

### 完整流程示例：创建项目并选型

```javascript
// 1. 登录
const loginRes = await fetch('http://localhost:5001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '13000000002',
    password: 'password'
  })
});
const { token } = await loginRes.json();

// 2. 创建项目
const projectRes = await fetch('http://localhost:5001/api/new-projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    projectName: '天津钢铁厂阀门自动化项目',
    customer: '天津钢铁集团',
    industry: 'Manufacturing',
    budget: 600000
  })
});
const { data: project } = await projectRes.json();

// 3. 智能选型
const selectionRes = await fetch('http://localhost:5001/api/selection/select-actuator', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    valveType: 'Ball Valve',
    valveSize: 4,
    pressure: 1.6
  })
});
const { data: recommendations } = await selectionRes.json();

// 4. 更新项目技术需求
await fetch(`http://localhost:5001/api/new-projects/${project._id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    technicalRequirements: [
      {
        tagNumber: 'V-101',
        valveType: 'Ball Valve',
        valveSize: 4,
        quantity: 10,
        selectedActuator: recommendations[0].actuator._id
      }
    ]
  })
});
```

---

## 十七、相关文档

- **系统概述**：`SYSTEM_OVERVIEW.md`
- **数据库架构**：`DATABASE_GUIDE.md`
- **代码结构**：`CODE_STRUCTURE.md`
- **验收测试**：`FINAL_ACCEPTANCE_GUIDE.md`
- **执行器导入**：`backend/SEED_AT_GY_USAGE.md`
- **测试快速参考**：`backend/QUICK_REFERENCE.txt`

---

**版本**：v1.0  
**最后更新**：2025-10-29  
**维护者**：Project Ark Team

© 2025 Project Ark Team. All Rights Reserved.

