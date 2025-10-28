# LeanCloud 文件关联 API 快速参考

## 📌 概述

后端已切换到 **LeanCloud 前端直传模式**。前端需要：
1. 直接将文件上传到 LeanCloud
2. 获取文件 URL 后调用后端关联接口
3. 后端将文件信息存储到对应单据的数据库记录中

---

## 🔌 API 接口列表

### 1. 项目文件关联

#### 接口 A: 新项目系统
```
POST /api/new-projects/:id/add-file
```

#### 接口 B: 旧项目系统
```
POST /api/projects/:id/add-file
```

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "file_name": "项目设计图.pdf",
  "file_url": "https://leancloud-xxx.com/files/xxx.pdf",
  "file_type": "document",    // 可选: document, image, drawing, other
  "file_size": 1024000,        // 可选: 字节
  "description": "项目设计图纸"  // 可选: 文件说明
}
```

**响应**:
```json
{
  "success": true,
  "message": "文件添加成功",
  "file": {
    "name": "项目设计图.pdf",
    "url": "https://leancloud-xxx.com/files/xxx.pdf",
    "type": "document",
    "size": 1024000,
    "description": "项目设计图纸",
    "uploadedBy": "60d5ec49f1b2c8a1234567",
    "uploadedAt": "2025-10-28T10:30:00.000Z"
  }
}
```

**删除文件**:
```
DELETE /api/projects/:id/files/:fileId
DELETE /api/new-projects/:id/files/:fileId
```

---

### 2. 订单文件关联

```
POST /api/orders/:id/add-file
```

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "file_name": "销售合同.pdf",
  "file_url": "https://leancloud-xxx.com/files/xxx.pdf",
  "file_type": "contract",     // contract, invoice, document, other
  "file_size": 2048000,
  "description": "客户签订的销售合同"
}
```

**特殊说明**: 当 `file_type` 为 `"contract"` 时，会同时更新订单的 `contract` 字段。

**响应**:
```json
{
  "success": true,
  "message": "文件添加成功",
  "file": {
    "name": "销售合同.pdf",
    "url": "https://leancloud-xxx.com/files/xxx.pdf",
    "type": "contract",
    "size": 2048000,
    "description": "客户签订的销售合同",
    "uploadedBy": "60d5ec49f1b2c8a1234567",
    "uploadedAt": "2025-10-28T10:30:00.000Z"
  }
}
```

**删除文件**:
```
DELETE /api/orders/:id/files/:fileId
```

---

### 3. 采购订单文件关联

```
POST /api/purchase-orders/:id/add-file
```

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**权限**: 需要 `Administrator` 或 `Procurement Specialist` 角色

**请求体**:
```json
{
  "file_name": "采购合同.pdf",
  "file_url": "https://leancloud-xxx.com/files/xxx.pdf",
  "file_type": "contract",
  "file_size": 1536000,
  "description": "供应商合同"
}
```

**响应**:
```json
{
  "success": true,
  "message": "文件添加成功",
  "file": {
    "name": "采购合同.pdf",
    "url": "https://leancloud-xxx.com/files/xxx.pdf",
    "type": "contract",
    "size": 1536000,
    "description": "供应商合同",
    "uploadedBy": "60d5ec49f1b2c8a1234567",
    "uploadedAt": "2025-10-28T10:30:00.000Z"
  }
}
```

**删除文件**:
```
DELETE /api/purchase-orders/:id/files/:fileId
```

---

### 4. 服务工单附件关联

```
POST /api/tickets/:id/add-attachment
```

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "file_name": "故障现场照片.jpg",
  "file_url": "https://leancloud-xxx.com/files/xxx.jpg",
  "file_type": "image",        // image, document, video, other
  "file_size": 512000,
  "description": "设备故障现场拍摄"
}
```

**响应**:
```json
{
  "success": true,
  "message": "附件添加成功",
  "attachment": {
    "file_name": "故障现场照片.jpg",
    "file_url": "https://leancloud-xxx.com/files/xxx.jpg",
    "file_type": "image",
    "file_size": 512000,
    "description": "设备故障现场拍摄",
    "uploaded_by": "60d5ec49f1b2c8a1234567",
    "uploaded_at": "2025-10-28T10:30:00.000Z"
  }
}
```

**删除附件**:
```
DELETE /api/tickets/:id/attachments/:attachmentId
```

---

## 💻 前端实现示例

### 1. 安装 LeanCloud SDK

```bash
npm install leancloud-storage
```

### 2. 初始化 LeanCloud

```javascript
// src/config/leancloud.js
import AV from 'leancloud-storage';

AV.init({
  appId: import.meta.env.VITE_LEANCLOUD_APP_ID,
  appKey: import.meta.env.VITE_LEANCLOUD_APP_KEY,
  serverURL: import.meta.env.VITE_LEANCLOUD_SERVER_URL
});

export default AV;
```

### 3. 创建文件上传 Hook

```javascript
// src/hooks/useFileUpload.js
import { useState } from 'react';
import AV from '../config/leancloud';
import axios from 'axios';

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * 上传文件并关联到后端
   * @param {File} file - 文件对象
   * @param {string} entityType - 实体类型: 'project', 'order', 'purchase-order', 'ticket'
   * @param {string} entityId - 实体ID
   * @param {object} options - 额外选项
   */
  const uploadAndAssociate = async (file, entityType, entityId, options = {}) => {
    try {
      setUploading(true);
      setProgress(10);

      // 1. 上传到 LeanCloud
      const avFile = new AV.File(file.name, file);
      
      await avFile.save({
        onprogress: (e) => {
          const percent = Math.round((e.loaded / e.total) * 80) + 10;
          setProgress(percent);
        }
      });

      setProgress(90);

      // 2. 关联到后端
      const endpoint = getEndpoint(entityType, entityId);
      const response = await axios.post(
        endpoint,
        {
          file_name: file.name,
          file_url: avFile.url(),
          file_type: options.fileType || 'document',
          file_size: file.size,
          description: options.description || ''
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setProgress(100);
      setUploading(false);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      setUploading(false);
      setProgress(0);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  };

  /**
   * 批量上传文件
   */
  const uploadMultiple = async (files, entityType, entityId, options = {}) => {
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadAndAssociate(file, entityType, entityId, {
        ...options,
        description: options.descriptions?.[i] || ''
      });
      results.push(result);
    }
    
    return results;
  };

  return {
    uploading,
    progress,
    uploadAndAssociate,
    uploadMultiple
  };
}

/**
 * 获取关联接口的端点
 */
function getEndpoint(entityType, entityId) {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  const endpoints = {
    'project': `${baseUrl}/projects/${entityId}/add-file`,
    'new-project': `${baseUrl}/new-projects/${entityId}/add-file`,
    'order': `${baseUrl}/orders/${entityId}/add-file`,
    'purchase-order': `${baseUrl}/purchase-orders/${entityId}/add-file`,
    'ticket': `${baseUrl}/tickets/${entityId}/add-attachment`
  };
  
  return endpoints[entityType];
}
```

### 4. 在组件中使用

```jsx
// src/components/FileUpload.jsx
import React, { useState } from 'react';
import { useFileUpload } from '../hooks/useFileUpload';

export default function FileUpload({ entityType, entityId, onSuccess }) {
  const { uploading, progress, uploadAndAssociate } = useFileUpload();
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState('document');

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('请选择文件');
      return;
    }

    const result = await uploadAndAssociate(
      selectedFile,
      entityType,
      entityId,
      { description, fileType }
    );

    if (result.success) {
      alert('上传成功！');
      setSelectedFile(null);
      setDescription('');
      onSuccess?.(result.data);
    } else {
      alert(`上传失败: ${result.error}`);
    }
  };

  return (
    <div className="file-upload">
      <input
        type="file"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      
      <select
        value={fileType}
        onChange={(e) => setFileType(e.target.value)}
        disabled={uploading}
      >
        <option value="document">文档</option>
        <option value="image">图片</option>
        <option value="contract">合同</option>
        <option value="drawing">图纸</option>
        <option value="other">其他</option>
      </select>
      
      <input
        type="text"
        placeholder="文件描述（可选）"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={uploading}
      />
      
      <button
        onClick={handleUpload}
        disabled={uploading || !selectedFile}
      >
        {uploading ? `上传中 ${progress}%` : '上传'}
      </button>
      
      {uploading && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

### 5. 使用示例

```jsx
// 在项目详情页面使用
<FileUpload
  entityType="project"
  entityId={projectId}
  onSuccess={(data) => {
    console.log('文件已关联:', data);
    // 刷新文件列表
    fetchProjectFiles();
  }}
/>

// 在订单页面使用
<FileUpload
  entityType="order"
  entityId={orderId}
  onSuccess={(data) => {
    console.log('文件已关联:', data);
  }}
/>

// 在采购订单页面使用
<FileUpload
  entityType="purchase-order"
  entityId={purchaseOrderId}
  onSuccess={(data) => {
    console.log('文件已关联:', data);
  }}
/>

// 在服务工单页面使用
<FileUpload
  entityType="ticket"
  entityId={ticketId}
  onSuccess={(data) => {
    console.log('附件已关联:', data);
  }}
/>
```

---

## 🔧 环境变量配置

在 `.env` 文件中添加：

```bash
# LeanCloud 配置
VITE_LEANCLOUD_APP_ID=your_app_id
VITE_LEANCLOUD_APP_KEY=your_app_key
VITE_LEANCLOUD_SERVER_URL=https://your-server.leancloud.app

# 后端 API
VITE_API_URL=http://localhost:5000/api
```

---

## 📋 文件类型说明

### 通用文件类型
- `document` - 文档（PDF, Word, Excel等）
- `image` - 图片（JPG, PNG, GIF等）
- `drawing` - 图纸（CAD, DWG等）
- `video` - 视频
- `other` - 其他类型

### 订单特殊类型
- `contract` - 合同（会同时更新订单的 contract 字段）
- `invoice` - 发票

---

## ⚠️ 注意事项

1. **文件大小限制**: 根据 LeanCloud 套餐设置，建议单文件不超过 10MB
2. **文件格式**: LeanCloud 支持所有文件格式
3. **权限控制**: 所有接口都需要认证（Bearer Token）
4. **采购订单**: 需要 Administrator 或 Procurement Specialist 角色
5. **错误处理**: 前端需要处理网络错误、上传失败等情况
6. **进度显示**: 建议实现上传进度条提升用户体验

---

## 🚀 优势

- ✅ **快速**: 文件直接上传到 CDN，无需经过后端中转
- ✅ **可靠**: LeanCloud 提供稳定的文件存储服务
- ✅ **简单**: 后端只需存储文件 URL，逻辑简单
- ✅ **灵活**: 支持各种文件类型和自定义元数据
- ✅ **经济**: 节省后端带宽和存储成本

---

## 📞 支持

如有问题，请参考：
- LeanCloud 文档: https://docs.leancloud.app/
- 后端迁移完成报告: `LeanCloud前端直传迁移完成报告.md`

