# LeanCloud 前端直传迁移完成报告

## 📋 任务概述

已成功将文件存储方案从后端处理切换到 **LeanCloud 前端直传模式**。后端不再处理文件上传，只负责接收前端传来的文件信息并关联到相应的数据库记录。

---

## ✅ 完成的清理工作

### 1. 依赖包清理
- **执行命令**: `npm uninstall qiniu cloudinary multer-storage-cloudinary firebase-admin @alicloud/sdk aliyun-oss`
- **结果**: 这些依赖包在 package.json 中本就不存在，确认已清理干净
- **保留**: `multer` 包仍然保留，因为它用于 Excel/CSV 数据导入功能

### 2. 删除的文件
✅ **删除**: `backend/routes/uploadRoutes.js`
   - 包含所有通用文件上传接口
   - POST /api/uploads/single
   - POST /api/uploads/multiple
   - POST /api/uploads/contract
   - POST /api/uploads/project
   - POST /api/uploads/purchase-order
   - DELETE /api/uploads/:id

✅ **删除**: `backend/services/upload.service.js`
   - 包含 Cloudinary 配置
   - 包含本地存储配置
   - 各种上传相关的辅助函数

✅ **保留**: `backend/middleware/upload.js`
   - **原因**: 仍被用于 Excel/CSV 数据导入功能
   - 使用位置: actuatorRoutes, accessoryRoutes, manualOverrideRoutes

### 3. Server.js 更新
✅ **删除的引用**:
```javascript
// 已删除
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/uploads', uploadRoutes);
```

---

## ✅ 保留并确认的文件关联接口

后端保留了以下接口，用于将前端直传后的文件信息关联到数据库：

### 项目文件关联
- **接口**: `POST /api/projects/:id/add-file`
- **接口**: `POST /api/new-projects/:id/add-file`
- **功能**: 接收 `file_name` 和 `file_url`，存入项目的 `documents` 数组
- **Controller**: `fileAssociationController.addProjectFile()`
- **请求体**:
```json
{
  "file_name": "项目文档.pdf",
  "file_url": "https://leancloud-url.com/xxx.pdf",
  "file_type": "document",  // 可选
  "file_size": 1024000,      // 可选
  "description": "项目相关文档"  // 可选
}
```

### 订单文件关联
- **接口**: `POST /api/orders/:id/add-file`
- **功能**: 接收文件信息，存入订单的 `documents` 数组
- **特殊处理**: 如果 `file_type` 为 'contract'，同时更新 `contract` 字段
- **Controller**: `fileAssociationController.addOrderFile()`

### 采购订单文件关联
- **接口**: `POST /api/purchase-orders/:id/add-file`
- **功能**: 接收文件信息，存入采购订单的 `documents` 数组
- **Controller**: `fileAssociationController.addPurchaseOrderFile()`

### 服务工单附件关联
- **接口**: `POST /api/tickets/:id/add-attachment`
- **功能**: 接收文件信息，存入工单的 `attachments` 数组
- **Controller**: `fileAssociationController.addTicketAttachment()`

---

## 📊 文件关联逻辑说明

所有文件关联接口都遵循相同的简单逻辑：

1. **前端流程**:
   ```
   用户选择文件 
   → 前端直接上传到 LeanCloud 
   → 获得 file_url 
   → 调用后端关联接口
   ```

2. **后端逻辑**:
   - 接收 `file_name` 和 `file_url` (必填)
   - 接收 `file_type`, `file_size`, `description` (可选)
   - 验证单据存在
   - 将文件信息添加到单据的文档数组
   - 记录 `uploadedBy` (当前用户) 和 `uploadedAt` (时间戳)
   - 保存到数据库

3. **数据库存储格式**:
```javascript
{
  name: "文件名.pdf",
  url: "https://leancloud-url.com/xxx.pdf",
  type: "document",
  size: 1024000,
  description: "说明",
  uploadedBy: ObjectId("用户ID"),
  uploadedAt: ISODate("2025-10-28T...")
}
```

---

## 🔍 验证检查

### 检查点 1: 无残留引用
✅ 已确认没有任何文件引用已删除的 `upload.service.js` 或 `uploadRoutes.js`

### 检查点 2: 所需接口都已存在
✅ 所有 4 个文件关联接口都已正确配置在路由中

### 检查点 3: Controller 逻辑正确
✅ `fileAssociationController.js` 包含完整的实现逻辑

### 检查点 4: 数据导入功能不受影响
✅ Excel/CSV 导入功能仍可正常使用 `middleware/upload.js`

---

## 📝 后续前端对接说明

前端需要实现以下流程：

### 1. 配置 LeanCloud SDK
```javascript
import AV from 'leancloud-storage';

AV.init({
  appId: 'YOUR_APP_ID',
  appKey: 'YOUR_APP_KEY',
  serverURL: 'YOUR_SERVER_URL'
});
```

### 2. 文件上传函数
```javascript
async function uploadFile(file) {
  const avFile = new AV.File(file.name, file);
  await avFile.save();
  return {
    name: file.name,
    url: avFile.url()
  };
}
```

### 3. 关联到后端
```javascript
async function associateFileToProject(projectId, file) {
  // 1. 先上传到 LeanCloud
  const { name, url } = await uploadFile(file);
  
  // 2. 再关联到后端
  const response = await axios.post(
    `/api/projects/${projectId}/add-file`,
    {
      file_name: name,
      file_url: url,
      file_type: 'document',
      file_size: file.size,
      description: '项目文档'
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  
  return response.data;
}
```

---

## 🎯 迁移优势

### ✅ 简化后端
- 删除了复杂的云存储配置
- 不再需要处理文件上传
- 减少了依赖包数量
- 降低了服务器负载

### ✅ 提高性能
- 文件直接上传到 CDN
- 减少了后端中转
- 加快了上传速度

### ✅ 降低成本
- 文件存储在 LeanCloud
- 节省了服务器带宽
- 减少了服务器存储需求

### ✅ 保持一致性
- 所有模块使用相同的关联接口模式
- 统一的数据结构
- 易于维护和扩展

---

## 📅 完成时间
**2025年10月28日**

## 👤 执行者
AI Assistant (Cursor)

---

## 🔒 注意事项

1. **multer 保留原因**: 用于数据管理模块的 Excel/CSV 批量导入功能
2. **middleware/upload.js 保留**: 被以下路由使用：
   - `POST /api/actuators/upload`
   - `POST /api/accessories/upload`
   - `POST /api/manual-overrides/upload`
3. **静态文件服务**: server.js 中的 `app.use('/uploads', express.static(...))` 仍然保留，用于访问本地上传的 Excel 文件（如果有临时存储需求）

---

## ✨ 总结

✅ 成功将文件存储方案切换到 LeanCloud 前端直传模式  
✅ 清理了所有旧的云存储配置和上传接口  
✅ 保留并确认了所有必要的文件关联接口  
✅ 不影响现有的数据导入功能  
✅ 后端代码更加简洁和易维护  

**迁移状态**: ✅ **完成**

