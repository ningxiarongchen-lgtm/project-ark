# 采购订单管理 API 文档

## 概述

采购订单管理系统提供完整的CRUD功能，用于管理与供应商的采购订单。所有API都需要身份认证，并且仅限管理员（Administrator）和采购专员（Procurement Specialist）访问。

## 基础信息

- **Base URL**: `/api/purchase-orders`
- **认证**: 所有请求需要在Header中携带JWT Token
- **权限**: Administrator 或 Procurement Specialist

---

## API 端点

### 1. 获取所有采购订单

**GET** `/api/purchase-orders`

获取采购订单列表，支持多种筛选条件。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | String | 否 | 订单状态筛选 (draft, pending, confirmed, shipped, received, cancelled) |
| supplier_id | String | 否 | 供应商ID筛选 |
| search | String | 否 | 搜索订单号或备注 |
| start_date | Date | 否 | 开始日期 (YYYY-MM-DD) |
| end_date | Date | 否 | 结束日期 (YYYY-MM-DD) |
| sort | String | 否 | 排序字段，默认 "-createdAt" |

#### 响应示例

```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "order_number": "PO20251028001",
      "supplier_id": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "上海阀门配件一厂",
        "contact_person": "张三",
        "phone": "021-12345678",
        "email": "contact@supplier.com"
      },
      "items": [
        {
          "product_name": "阀门执行器",
          "product_code": "AT-001",
          "specification": "10NM",
          "quantity": 10,
          "unit": "件",
          "unit_price": 1000,
          "subtotal": 10000,
          "notes": "优质产品"
        }
      ],
      "total_amount": 10000,
      "status": "confirmed",
      "order_date": "2025-10-28T00:00:00.000Z",
      "expected_delivery_date": "2025-11-28T00:00:00.000Z",
      "payment_terms": "货到付款",
      "shipping_address": "上海市浦东新区",
      "contact_person": "李四",
      "contact_phone": "13800138000",
      "notes": "紧急订单",
      "created_by": {
        "_id": "507f1f77bcf86cd799439013",
        "username": "admin",
        "email": "admin@example.com"
      },
      "approved_by": {
        "_id": "507f1f77bcf86cd799439013",
        "username": "admin",
        "email": "admin@example.com"
      },
      "approved_at": "2025-10-28T10:00:00.000Z",
      "createdAt": "2025-10-28T08:00:00.000Z",
      "updatedAt": "2025-10-28T10:00:00.000Z"
    }
  ]
}
```

---

### 2. 获取单个采购订单

**GET** `/api/purchase-orders/:id`

获取指定ID的采购订单详细信息。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String | 是 | 采购订单ID |

#### 响应示例

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "order_number": "PO20251028001",
    "supplier_id": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "上海阀门配件一厂",
      "contact_person": "张三",
      "phone": "021-12345678",
      "email": "contact@supplier.com",
      "address": "上海市浦东新区张江高科技园区"
    },
    "items": [...],
    "total_amount": 10000,
    "status": "confirmed",
    ...
  }
}
```

---

### 3. 创建采购订单

**POST** `/api/purchase-orders`

创建新的采购订单，订单号自动生成。

#### 请求体

```json
{
  "supplier_id": "507f1f77bcf86cd799439012",
  "items": [
    {
      "product_name": "阀门执行器",
      "product_code": "AT-001",
      "specification": "10NM",
      "quantity": 10,
      "unit": "件",
      "unit_price": 1000,
      "notes": "优质产品"
    }
  ],
  "expected_delivery_date": "2025-11-28",
  "payment_terms": "货到付款",
  "shipping_address": "上海市浦东新区",
  "contact_person": "李四",
  "contact_phone": "13800138000",
  "notes": "紧急订单",
  "status": "draft"
}
```

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| supplier_id | String | 是 | 供应商ID |
| items | Array | 是 | 订单项数组（至少一项） |
| items[].product_name | String | 是 | 产品名称 |
| items[].product_code | String | 否 | 产品编码 |
| items[].specification | String | 否 | 规格说明 |
| items[].quantity | Number | 是 | 数量（最小为1） |
| items[].unit | String | 否 | 单位（默认"件"） |
| items[].unit_price | Number | 是 | 单价（不能为负数） |
| items[].notes | String | 否 | 备注 |
| expected_delivery_date | Date | 否 | 预计交货日期 |
| payment_terms | String | 否 | 付款条款 |
| shipping_address | String | 否 | 收货地址 |
| contact_person | String | 否 | 联系人 |
| contact_phone | String | 否 | 联系电话 |
| notes | String | 否 | 订单备注 |
| status | String | 否 | 初始状态（默认draft） |

#### 响应示例

```json
{
  "success": true,
  "message": "采购订单创建成功",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "order_number": "PO20251028001",
    ...
  }
}
```

#### 注意事项

- 订单号自动生成，格式：PO + YYYYMMDD + 4位序号（如：PO202510280001）
- 小计（subtotal）和总金额（total_amount）自动计算
- 黑名单供应商无法创建订单
- created_by 字段自动设置为当前登录用户

---

### 4. 更新采购订单

**PUT** `/api/purchase-orders/:id`

更新指定ID的采购订单。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String | 是 | 采购订单ID |

#### 请求体

可以包含任何需要更新的字段，格式与创建订单相同。

#### 响应示例

```json
{
  "success": true,
  "message": "采购订单更新成功",
  "data": {
    ...
  }
}
```

#### 注意事项

- 已取消（cancelled）或已完成（received）的订单不允许修改
- 更改供应商时会验证新供应商状态
- 修改items时会重新计算总金额

---

### 5. 删除采购订单

**DELETE** `/api/purchase-orders/:id`

删除指定ID的采购订单。

**仅限管理员（Administrator）**

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String | 是 | 采购订单ID |

#### 响应示例

```json
{
  "success": true,
  "message": "采购订单删除成功",
  "data": {}
}
```

#### 注意事项

- 只能删除草稿状态（draft）的订单
- 其他状态的订单请使用取消功能

---

### 6. 更新采购订单状态

**PATCH** `/api/purchase-orders/:id/status`

更新采购订单的状态。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | String | 是 | 采购订单ID |

#### 请求体

```json
{
  "status": "confirmed"
}
```

#### 状态说明

| 状态 | 说明 | 自动操作 |
|------|------|----------|
| draft | 草稿 | - |
| pending | 待审核 | - |
| confirmed | 已确认 | 记录审批人和审批时间 |
| shipped | 已发货 | - |
| received | 已收货 | 记录实际交货日期，更新供应商交易总额 |
| cancelled | 已取消 | - |

#### 响应示例

```json
{
  "success": true,
  "message": "采购订单状态更新成功",
  "data": {
    ...
  }
}
```

---

### 7. 获取采购订单统计

**GET** `/api/purchase-orders/stats/summary`

获取采购订单的统计信息。

#### 响应示例

```json
{
  "success": true,
  "data": {
    "total": 100,
    "statusCounts": {
      "draft": 10,
      "pending": 15,
      "confirmed": 20,
      "shipped": 25,
      "received": 25,
      "cancelled": 5
    },
    "totalAmount": 1000000,
    "monthlyStats": [
      {
        "_id": {
          "year": 2025,
          "month": 10
        },
        "count": 20,
        "amount": 200000
      }
    ],
    "topSuppliers": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "supplier_name": "上海阀门配件一厂",
        "orderCount": 15,
        "totalAmount": 150000
      }
    ]
  }
}
```

---

### 8. 获取供应商的采购订单

**GET** `/api/purchase-orders/supplier/:supplier_id`

获取指定供应商的所有采购订单。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| supplier_id | String | 是 | 供应商ID |

#### 响应示例

```json
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

---

## 数据模型

### PurchaseOrder Schema

```javascript
{
  order_number: String,           // 订单号（唯一，自动生成）
  supplier_id: ObjectId,          // 供应商ID（关联Supplier）
  items: [{
    product_name: String,         // 产品名称
    product_code: String,         // 产品编码
    specification: String,        // 规格
    quantity: Number,             // 数量
    unit: String,                 // 单位
    unit_price: Number,           // 单价
    subtotal: Number,             // 小计（自动计算）
    notes: String                 // 备注
  }],
  total_amount: Number,           // 总金额（自动计算）
  status: String,                 // 状态
  order_date: Date,               // 订单日期
  expected_delivery_date: Date,   // 预计交货日期
  actual_delivery_date: Date,     // 实际交货日期
  payment_terms: String,          // 付款条款
  shipping_address: String,       // 收货地址
  contact_person: String,         // 联系人
  contact_phone: String,          // 联系电话
  notes: String,                  // 订单备注
  created_by: ObjectId,           // 创建人（关联User）
  approved_by: ObjectId,          // 审批人（关联User）
  approved_at: Date,              // 审批时间
  createdAt: Date,                // 创建时间（自动）
  updatedAt: Date                 // 更新时间（自动）
}
```

---

## 错误响应

所有错误响应遵循统一格式：

```json
{
  "success": false,
  "message": "错误信息",
  "error": "详细错误信息（可选）"
}
```

### 常见错误码

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误或业务逻辑错误 |
| 401 | 未认证或Token无效 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 使用示例

### 示例 1: 创建采购订单

```javascript
// 使用axios
const response = await axios.post('/api/purchase-orders', {
  supplier_id: '507f1f77bcf86cd799439012',
  items: [
    {
      product_name: 'AT执行器',
      product_code: 'AT-10',
      quantity: 5,
      unit_price: 2000
    }
  ],
  expected_delivery_date: '2025-11-30',
  shipping_address: '上海市浦东新区张江路123号',
  contact_person: '李工',
  contact_phone: '13800138000',
  notes: '请按时交货'
}, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

### 示例 2: 更新订单状态

```javascript
// 确认订单
await axios.patch('/api/purchase-orders/507f1f77bcf86cd799439011/status', 
  { status: 'confirmed' },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### 示例 3: 获取统计信息

```javascript
const stats = await axios.get('/api/purchase-orders/stats/summary', {
  headers: { Authorization: `Bearer ${token}` }
});

console.log(`总订单数: ${stats.data.data.total}`);
console.log(`总金额: ${stats.data.data.totalAmount}`);
```

---

## 业务逻辑说明

### 1. 订单号生成规则

- 格式：PO + YYYYMMDD + 4位序号
- 示例：PO202510280001
- 每天从0001开始递增

### 2. 金额计算

- 小计 = 数量 × 单价（自动计算）
- 总金额 = 所有项目小计之和（自动计算）

### 3. 状态流转

```
draft → pending → confirmed → shipped → received
  ↓                                        ↓
cancelled ←――――――――――――――――――――――――――――――――
```

### 4. 供应商交易统计

- 当订单状态变为 `received` 时，自动更新供应商的 `total_transaction_value`
- 用于供应商绩效评估

### 5. 权限控制

- **查询操作**: Administrator、Procurement Specialist
- **创建/更新**: Administrator、Procurement Specialist
- **删除**: 仅 Administrator
- **状态更新**: Administrator、Procurement Specialist

---

## 注意事项

1. **黑名单供应商**: 无法为黑名单供应商创建采购订单
2. **订单锁定**: 已取消或已完成的订单无法修改，只能查看
3. **删除限制**: 只能删除草稿状态的订单
4. **审批记录**: 订单确认时自动记录审批人和审批时间
5. **交货追踪**: 订单收货时自动记录实际交货日期
6. **数据完整性**: 删除供应商前应检查是否有关联的采购订单

---

## 更新日志

### 2025-10-28
- ✅ 创建采购订单模型（PurchaseOrder.js）
- ✅ 创建采购订单控制器（purchaseOrderController.js）
- ✅ 创建采购订单路由（purchaseOrderRoutes.js）
- ✅ 集成到主服务器（server.js）
- ✅ 完整的CRUD功能实现
- ✅ 订单状态管理
- ✅ 统计分析功能
- ✅ 供应商关联查询

