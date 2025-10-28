# BOM后端保存接口 - 快速参考

**状态**: ✅ 已完成，可直接使用  
**更新日期**: 2025年10月28日

---

## 📋 核心要点

✅ **后端已完全支持新的BOM数据结构**  
✅ **无需额外验证代码，Mongoose自动处理**  
✅ **支持手动物料和系统物料混合存储**

---

## 🔌 API端点

### 旧版项目
```
PUT /api/projects/:id
```

### 新版项目
```
PUT /api/new-projects/:id
```

**请求格式**:
```javascript
{
  "bill_of_materials": [
    { /* BOM项目1 */ },
    { /* BOM项目2 */ }
  ],
  "bom_version_history": [ /* 可选 */ ]
}
```

---

## 📦 数据结构

### 手动物料（Manual）
```json
{
  "item_type": "Manual",
  "model_name": "临时物料名称",
  "quantity": 2,
  "unit_price": 500.00,
  "total_price": 1000.00,
  "description": "描述（可选）",
  "is_manual": true
}
```
**注意**: 不需要 `item_id` 字段

### 系统物料（Actuator/Accessory等）
```json
{
  "item_id": "507f1f77bcf86cd799439011",
  "item_type": "Actuator",
  "model_name": "AT-DA63",
  "quantity": 1,
  "unit_price": 2500.00,
  "total_price": 2500.00,
  "description": "描述（可选）",
  "is_manual": false
}
```

---

## ✅ 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `item_type` | String | `'Manual'`, `'Actuator'`, `'Accessory'`, `'Valve'`, `'Manual Override'`, `'Other'` |
| `model_name` | String | 型号名称 |
| `quantity` | Number | 数量（≥1） |
| `unit_price` | Number | 单价（≥0） |
| `total_price` | Number | 总价（≥0） |

---

## 🔧 前端调用示例

```javascript
import { projectsAPI } from '@/services/api'

// 保存混合BOM
const bomData = [
  {
    // 手动添加
    item_type: 'Manual',
    model_name: '定制阀门',
    quantity: 3,
    unit_price: 800,
    total_price: 2400,
    is_manual: true
  },
  {
    // 数据库选择
    item_id: actuatorId,
    item_type: 'Actuator',
    model_name: 'AT-DA63',
    quantity: 1,
    unit_price: 2500,
    total_price: 2500,
    is_manual: false
  }
]

try {
  const response = await projectsAPI.update(projectId, {
    optimized_bill_of_materials: bomData
  })
  
  if (response.data.success) {
    message.success('BOM保存成功！')
  }
} catch (error) {
  message.error('保存失败: ' + error.message)
}
```

---

## ⚠️ 常见错误

### 错误1: 缺少必填字段
```json
{
  "error": "bill_of_materials.0.unit_price: Path `unit_price` is required."
}
```
**解决**: 确保每个BOM项都包含所有必填字段

### 错误2: 无效的枚举值
```json
{
  "error": "bill_of_materials.0.item_type: `InvalidType` is not a valid enum value"
}
```
**解决**: 确保 `item_type` 值在允许的列表中

### 错误3: 负数价格
```json
{
  "error": "bill_of_materials.0.unit_price: Unit price cannot be negative"
}
```
**解决**: 确保价格和数量都是非负数

---

## 🔐 权限要求

### 旧版项目 (`/api/projects/:id`)
需要以下角色之一：
- Technical Engineer
- Sales Engineer
- Sales Manager
- Administrator

### 新版项目 (`/api/new-projects/:id`)
只需登录即可

---

## 🧪 快速测试

### 使用 cURL
```bash
curl -X PUT http://localhost:5000/api/new-projects/YOUR_PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bill_of_materials": [
      {
        "item_type": "Manual",
        "model_name": "测试物料",
        "quantity": 1,
        "unit_price": 100,
        "total_price": 100,
        "is_manual": true
      }
    ]
  }'
```

### 使用 Postman
1. 方法: `PUT`
2. URL: `{{baseUrl}}/new-projects/{{projectId}}`
3. Headers:
   - `Authorization: Bearer {{token}}`
   - `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "bill_of_materials": [
       {
         "item_type": "Manual",
         "model_name": "测试物料",
         "quantity": 1,
         "unit_price": 100,
         "total_price": 100,
         "is_manual": true
       }
     ]
   }
   ```

---

## 📊 响应格式

### 成功响应 (200 OK)
```json
{
  "success": true,
  "message": "项目更新成功",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "bill_of_materials": [
      {
        "item_type": "Manual",
        "model_name": "测试物料",
        "quantity": 1,
        "unit_price": 100,
        "total_price": 100,
        "is_manual": true,
        "created_at": "2025-10-28T10:00:00.000Z"
      }
    ]
  }
}
```

### 错误响应 (400 Bad Request)
```json
{
  "success": false,
  "message": "更新项目失败",
  "error": "Validation error message"
}
```

---

## 📚 更多信息

- 详细技术文档: `BOM后端保存接口升级报告.md`
- 模型定义: `backend/models/Project.js`, `backend/models/NewProject.js`
- 控制器代码: `backend/controllers/projectController.js`, `backend/controllers/newProjectController.js`

---

**关键提示**: 后端已完全准备就绪，前端可以放心使用这些接口！

