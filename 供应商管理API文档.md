# 供应商管理 API 文档

## 📋 概述

供应商管理模块提供完整的CRUD API，支持供应商信息的创建、查询、更新和删除，以及评级管理和统计功能。

## 🔐 认证

所有API都需要JWT认证。请在请求头中包含：

```
Authorization: Bearer <your_jwt_token>
```

## 📍 API端点

### 基础URL

```
http://localhost:5001/api/suppliers
```

---

## 📚 API列表

### 1. 获取所有供应商

**GET** `/api/suppliers`

**查询参数**:
- `status` - 筛选状态 (active/inactive/blacklisted)
- `rating` - 最低评级 (1-5)
- `search` - 搜索关键词（名称、联系人、业务范围）
- `sort` - 排序字段 (默认: -createdAt)

**示例请求**:
```bash
curl -X GET "http://localhost:5001/api/suppliers?status=active&rating=4" \
  -H "Authorization: Bearer <token>"
```

**成功响应** (200):
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "_id": "68ff5e38f1fc5a577fcb5a71",
      "name": "上海阀门配件一厂",
      "contact_person": "张三",
      "phone": "021-12345678",
      "email": "zhangsan@shvalve.com",
      "address": "上海市浦东新区张江高科技园区",
      "business_scope": "阀门配件、执行器配件、密封件",
      "rating": 5,
      "notes": "长期合作伙伴，产品质量优秀，交货及时",
      "status": "active",
      "createdAt": "2024-10-27T12:00:00.000Z",
      "updatedAt": "2024-10-27T12:00:00.000Z"
    }
  ]
}
```

---

### 2. 获取单个供应商

**GET** `/api/suppliers/:id`

**路径参数**:
- `id` - 供应商ID

**示例请求**:
```bash
curl -X GET "http://localhost:5001/api/suppliers/68ff5e38f1fc5a577fcb5a71" \
  -H "Authorization: Bearer <token>"
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "_id": "68ff5e38f1fc5a577fcb5a71",
    "name": "上海阀门配件一厂",
    "contact_person": "张三",
    "phone": "021-12345678",
    "email": "zhangsan@shvalve.com",
    "address": "上海市浦东新区张江高科技园区",
    "business_scope": "阀门配件、执行器配件、密封件",
    "rating": 5,
    "notes": "长期合作伙伴，产品质量优秀，交货及时",
    "status": "active",
    "createdAt": "2024-10-27T12:00:00.000Z",
    "updatedAt": "2024-10-27T12:00:00.000Z"
  }
}
```

**错误响应** (404):
```json
{
  "success": false,
  "message": "供应商不存在"
}
```

---

### 3. 创建供应商

**POST** `/api/suppliers`

**请求体**:
```json
{
  "name": "供应商名称",           // 必需
  "contact_person": "联系人",
  "phone": "电话",
  "email": "邮箱",
  "address": "地址",
  "business_scope": "业务范围",
  "rating": 3,                   // 1-5，默认3
  "notes": "备注",
  "status": "active"             // active/inactive/blacklisted
}
```

**示例请求**:
```bash
curl -X POST "http://localhost:5001/api/suppliers" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "深圳创新科技有限公司",
    "contact_person": "陈工",
    "phone": "0755-12345678",
    "email": "chen@shenzhen.com",
    "address": "深圳市南山区科技园",
    "business_scope": "智能执行器、传感器",
    "rating": 4,
    "notes": "新供应商，待评估",
    "status": "active"
  }'
```

**成功响应** (201):
```json
{
  "success": true,
  "message": "供应商创建成功",
  "data": {
    "_id": "68ff5e38f1fc5a577fcb5a75",
    "name": "深圳创新科技有限公司",
    "contact_person": "陈工",
    "phone": "0755-12345678",
    "email": "chen@shenzhen.com",
    "address": "深圳市南山区科技园",
    "business_scope": "智能执行器、传感器",
    "rating": 4,
    "notes": "新供应商，待评估",
    "status": "active",
    "createdAt": "2024-10-27T13:00:00.000Z",
    "updatedAt": "2024-10-27T13:00:00.000Z"
  }
}
```

**错误响应** (400):
```json
{
  "success": false,
  "message": "该供应商名称已存在"
}
```

---

### 4. 更新供应商

**PUT** `/api/suppliers/:id`

**路径参数**:
- `id` - 供应商ID

**请求体**: (所有字段都是可选的)
```json
{
  "name": "新名称",
  "contact_person": "新联系人",
  "phone": "新电话",
  "email": "新邮箱",
  "address": "新地址",
  "business_scope": "新业务范围",
  "rating": 4,
  "notes": "新备注",
  "status": "active"
}
```

**示例请求**:
```bash
curl -X PUT "http://localhost:5001/api/suppliers/68ff5e38f1fc5a577fcb5a71" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "notes": "评级提升，服务优秀"
  }'
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "供应商更新成功",
  "data": {
    "_id": "68ff5e38f1fc5a577fcb5a71",
    "name": "上海阀门配件一厂",
    "rating": 5,
    "notes": "评级提升，服务优秀",
    ...
  }
}
```

---

### 5. 删除供应商

**DELETE** `/api/suppliers/:id`

**路径参数**:
- `id` - 供应商ID

**示例请求**:
```bash
curl -X DELETE "http://localhost:5001/api/suppliers/68ff5e38f1fc5a577fcb5a71" \
  -H "Authorization: Bearer <token>"
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "供应商删除成功",
  "data": {}
}
```

---

### 6. 更新供应商状态

**PATCH** `/api/suppliers/:id/status`

**路径参数**:
- `id` - 供应商ID

**请求体**:
```json
{
  "status": "inactive"  // active/inactive/blacklisted
}
```

**示例请求**:
```bash
curl -X PATCH "http://localhost:5001/api/suppliers/68ff5e38f1fc5a577fcb5a71/status" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "blacklisted"}'
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "供应商状态更新成功",
  "data": {
    "_id": "68ff5e38f1fc5a577fcb5a71",
    "name": "上海阀门配件一厂",
    "status": "blacklisted",
    ...
  }
}
```

---

### 7. 更新供应商评级

**PATCH** `/api/suppliers/:id/rating`

**路径参数**:
- `id` - 供应商ID

**请求体**:
```json
{
  "rating": 5  // 1-5
}
```

**示例请求**:
```bash
curl -X PATCH "http://localhost:5001/api/suppliers/68ff5e38f1fc5a577fcb5a71/rating" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "供应商评级更新成功",
  "data": {
    "_id": "68ff5e38f1fc5a577fcb5a71",
    "name": "上海阀门配件一厂",
    "rating": 5,
    ...
  }
}
```

**错误响应** (400):
```json
{
  "success": false,
  "message": "评级必须在1-5之间"
}
```

---

### 8. 获取供应商统计

**GET** `/api/suppliers/stats/summary`

**示例请求**:
```bash
curl -X GET "http://localhost:5001/api/suppliers/stats/summary" \
  -H "Authorization: Bearer <token>"
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "total": 4,
    "active": 4,
    "inactive": 0,
    "blacklisted": 0,
    "avgRating": 4.25,
    "ratingDistribution": [
      {
        "_id": 5,
        "count": 1
      },
      {
        "_id": 4,
        "count": 2
      },
      {
        "_id": 3,
        "count": 1
      }
    ]
  }
}
```

---

## 📊 数据模型

### Supplier Schema

| 字段 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `_id` | ObjectId | 自动 | - | 供应商ID |
| `name` | String | 是 | - | 供应商名称 |
| `contact_person` | String | 否 | - | 联系人 |
| `phone` | String | 否 | - | 电话 |
| `email` | String | 否 | - | 邮箱 |
| `address` | String | 否 | - | 地址 |
| `business_scope` | String | 否 | - | 业务范围 |
| `rating` | Number | 否 | 3 | 评级 (1-5) |
| `notes` | String | 否 | - | 备注 |
| `status` | String | 否 | active | 状态 |
| `createdAt` | Date | 自动 | - | 创建时间 |
| `updatedAt` | Date | 自动 | - | 更新时间 |

### 状态枚举

- `active` - 活跃
- `inactive` - 停用
- `blacklisted` - 黑名单

---

## 🔍 查询示例

### 1. 搜索供应商
```bash
GET /api/suppliers?search=上海
```

### 2. 筛选活跃供应商
```bash
GET /api/suppliers?status=active
```

### 3. 筛选高评级供应商
```bash
GET /api/suppliers?rating=4
```

### 4. 组合查询
```bash
GET /api/suppliers?status=active&rating=4&sort=-rating
```

### 5. 按名称升序排序
```bash
GET /api/suppliers?sort=name
```

---

## ⚠️ 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 🧪 测试

运行自动化测试脚本：

```bash
cd backend
./test-suppliers-api.sh
```

测试内容包括：
- ✅ 获取所有供应商
- ✅ 获取单个供应商
- ✅ 创建供应商
- ✅ 更新供应商
- ✅ 删除供应商
- ✅ 更新状态
- ✅ 更新评级
- ✅ 搜索功能
- ✅ 筛选功能
- ✅ 统计信息

---

## 💡 使用建议

### 1. 供应商评级标准

| 评级 | 说明 |
|------|------|
| ⭐⭐⭐⭐⭐ (5星) | 优秀 - 长期合作伙伴 |
| ⭐⭐⭐⭐ (4星) | 良好 - 推荐合作 |
| ⭐⭐⭐ (3星) | 一般 - 可以合作 |
| ⭐⭐ (2星) | 较差 - 慎重考虑 |
| ⭐ (1星) | 很差 - 不推荐 |

### 2. 状态管理建议

- **active**: 正常合作的供应商
- **inactive**: 暂停合作但可能恢复
- **blacklisted**: 有严重问题，不再合作

### 3. 搜索技巧

搜索功能支持模糊匹配：
- 按名称搜索: `?search=上海`
- 按联系人搜索: `?search=张三`
- 按业务范围搜索: `?search=执行器`

---

## 📝 更新日志

### v1.0.0 (2024-10-27)
- ✅ 初始版本发布
- ✅ 完整CRUD功能
- ✅ 评级管理
- ✅ 状态管理
- ✅ 搜索和筛选
- ✅ 统计功能

---

**📅 最后更新**: 2024-10-27  
**📖 版本**: v1.0.0

