# LeanCloud文件上传完整指南

**模式**: 前端直传  
**完成时间**: 2025年10月28日  
**状态**: ✅ 后端已完成

---

## 📋 架构说明

### 前端直传模式

```
┌─────────┐                    ┌─────────────┐
│  前端   │ ─────直传────────> │  LeanCloud  │
│  应用   │                    │  云存储     │
└────┬────┘                    └──────┬──────┘
     │                                │
     │ 获取文件URL                    │
     │                                │
     └────────┐                       │
              │                       │
              ▼                       │
      ┌────────────┐                 │
      │  后端API   │<────────────────┘
      │  仅关联    │   文件已上传
      └────────────┘
```

### 优势
✅ **减轻服务器负担** - 文件不经过后端服务器  
✅ **加快上传速度** - 直接上传到云端  
✅ **节省带宽** - 减少服务器流量消耗  
✅ **简化后端** - 无需复杂的上传逻辑  
✅ **可扩展** - 易于应对大流量  

---

## 🏗️ 后端已完成的工作

### 1. 创建文件关联控制器

**文件**: `backend/controllers/fileAssociationController.js`

包含8个方法：
- `addProjectFile` - 为项目添加文件
- `addOrderFile` - 为订单添加文件
- `addPurchaseOrderFile` - 为采购订单添加文件
- `addTicketAttachment` - 为工单添加附件
- `deleteProjectFile` - 删除项目文件
- `deleteOrderFile` - 删除订单文件
- `deletePurchaseOrderFile` - 删除采购订单文件
- `deleteTicketAttachment` - 删除工单附件

### 2. 更新路由配置

已为4个模块添加文件关联接口：

#### Projects（新版项目）
- `POST /api/new-projects/:id/add-file` - 添加文件
- `DELETE /api/new-projects/:id/files/:fileId` - 删除文件

#### Orders（销售订单）
- `POST /api/orders/:id/add-file` - 添加文件
- `DELETE /api/orders/:id/files/:fileId` - 删除文件

#### Purchase Orders（采购订单）
- `POST /api/purchase-orders/:id/add-file` - 添加文件
- `DELETE /api/purchase-orders/:id/files/:fileId` - 删除文件

#### Tickets（服务工单）
- `POST /api/tickets/:id/add-attachment` - 添加附件
- `DELETE /api/tickets/:id/attachments/:attachmentId` - 删除附件

---

## 📚 API接口详情

### 通用请求格式

所有添加文件的接口都接受相同的请求体：

```json
{
  "file_name": "合同.pdf",
  "file_url": "https://lc-xxx.example.com/files/contract.pdf",
  "file_type": "contract",
  "file_size": 245678,
  "description": "项目合同文件"
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file_name | String | ✅ | 文件名 |
| file_url | String | ✅ | 文件URL（LeanCloud返回） |
| file_type | String | ❌ | 文件类型（contract/invoice/other等） |
| file_size | Number | ❌ | 文件大小（字节） |
| description | String | ❌ | 文件描述 |

---

## 🎯 使用示例

### 示例1：为项目添加文件

```javascript
// 前端代码

// 步骤1：上传文件到LeanCloud（前端直传）
const uploadToLeanCloud = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('https://lc-xxx.leancloud.cn/1.1/files', {
    method: 'POST',
    headers: {
      'X-LC-Id': 'your-app-id',
      'X-LC-Key': 'your-app-key'
    },
    body: formData
  });
  
  const result = await response.json();
  return {
    file_url: result.url,
    file_name: result.name
  };
};

// 步骤2：将文件信息关联到项目
const associateFileToProject = async (projectId, fileInfo) => {
  const response = await fetch(
    `http://localhost:5001/api/new-projects/${projectId}/add-file`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_name: fileInfo.file_name,
        file_url: fileInfo.file_url,
        file_type: 'project_document',
        file_size: file.size,
        description: '项目相关文档'
      })
    }
  );
  
  return await response.json();
};

// 完整流程
async function handleFileUpload(file, projectId) {
  try {
    // 1. 上传到LeanCloud
    const fileInfo = await uploadToLeanCloud(file);
    
    // 2. 关联到项目
    const result = await associateFileToProject(projectId, fileInfo);
    
    console.log('文件添加成功', result);
  } catch (error) {
    console.error('文件上传失败', error);
  }
}
```

### 示例2：为订单添加合同

```javascript
// 上传合同文件
async function uploadContract(file, orderId) {
  // 1. 上传到LeanCloud
  const fileInfo = await uploadToLeanCloud(file);
  
  // 2. 关联到订单
  const response = await fetch(
    `http://localhost:5001/api/orders/${orderId}/add-file`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_name: fileInfo.file_name,
        file_url: fileInfo.file_url,
        file_type: 'contract',  // 合同类型
        file_size: file.size
      })
    }
  );
  
  return await response.json();
}
```

### 示例3：为工单添加附件

```javascript
// 上传工单附件（支持多个文件）
async function uploadTicketAttachments(files, ticketId) {
  const results = [];
  
  for (const file of files) {
    // 1. 上传到LeanCloud
    const fileInfo = await uploadToLeanCloud(file);
    
    // 2. 关联到工单
    const response = await fetch(
      `http://localhost:5001/api/tickets/${ticketId}/add-attachment`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_name: fileInfo.file_name,
          file_url: fileInfo.file_url,
          file_type: 'attachment',
          file_size: file.size
        })
      }
    );
    
    results.push(await response.json());
  }
  
  return results;
}
```

### 示例4：React完整组件

```jsx
import React, { useState } from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const LeanCloudUploader = ({ entityId, entityType }) => {
  const [uploading, setUploading] = useState(false);
  
  // LeanCloud配置
  const LEANCLOUD_APP_ID = 'your-app-id';
  const LEANCLOUD_APP_KEY = 'your-app-key';
  const LEANCLOUD_API_URL = 'https://lc-xxx.leancloud.cn/1.1/files';
  
  // 上传到LeanCloud
  const uploadToLeanCloud = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(LEANCLOUD_API_URL, formData, {
      headers: {
        'X-LC-Id': LEANCLOUD_APP_ID,
        'X-LC-Key': LEANCLOUD_APP_KEY
      }
    });
    
    return response.data;
  };
  
  // 关联到实体
  const associateFile = async (fileInfo) => {
    const endpoints = {
      project: `/api/new-projects/${entityId}/add-file`,
      order: `/api/orders/${entityId}/add-file`,
      purchaseOrder: `/api/purchase-orders/${entityId}/add-file`,
      ticket: `/api/tickets/${entityId}/add-attachment`
    };
    
    const response = await axios.post(
      endpoints[entityType],
      {
        file_name: fileInfo.name,
        file_url: fileInfo.url,
        file_size: fileInfo.size
      },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    return response.data;
  };
  
  // 处理上传
  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    
    setUploading(true);
    try {
      // 1. 上传到LeanCloud
      const leanCloudFile = await uploadToLeanCloud(file);
      
      // 2. 关联到实体
      await associateFile(leanCloudFile);
      
      message.success('文件上传成功');
      onSuccess(leanCloudFile);
    } catch (error) {
      message.error('文件上传失败');
      onError(error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Upload
      customRequest={handleUpload}
      showUploadList={true}
    >
      <Button icon={<UploadOutlined />} loading={uploading}>
        上传文件
      </Button>
    </Upload>
  );
};

export default LeanCloudUploader;
```

---

## 🔧 LeanCloud配置步骤

### 1. 注册LeanCloud账号

访问: https://www.leancloud.cn/
- 注册账号
- 创建应用
- 进入应用管理后台

### 2. 获取配置信息

在"设置 → 应用凭证"中获取：
- **App ID**: 应用ID
- **App Key**: 应用密钥
- **REST API服务器地址**: 如 `https://lc-xxx.leancloud.cn`

### 3. 配置文件存储

在"数据存储 → 文件"中：
- 查看存储设置
- 配置CDN加速（可选）
- 设置文件访问权限

### 4. 前端配置

```javascript
// config.js
export const LEANCLOUD_CONFIG = {
  appId: 'your-app-id',
  appKey: 'your-app-key',
  serverUrl: 'https://lc-xxx.leancloud.cn'
};
```

---

## 📊 数据库字段说明

### Projects（新版）

```javascript
documents: [{
  name: String,           // 文件名
  url: String,            // LeanCloud URL
  type: String,           // 文件类型
  size: Number,           // 文件大小
  description: String,    // 描述
  uploadedBy: ObjectId,   // 上传人
  uploadedAt: Date        // 上传时间
}]
```

### Orders（销售订单）

```javascript
documents: [{
  name: String,
  url: String,
  type: String,
  size: Number,
  description: String,
  uploadedBy: ObjectId,
  uploadedAt: Date
}],
contract: {              // 合同（特殊字段）
  file_url: String,
  file_name: String,
  uploaded_at: Date
}
```

### Purchase Orders（采购订单）

```javascript
documents: [{
  name: String,
  url: String,
  type: String,
  size: Number,
  description: String,
  uploadedBy: ObjectId,
  uploadedAt: Date
}]
```

### Tickets（服务工单）

```javascript
attachments: [{
  file_name: String,
  file_url: String,
  file_type: String,
  file_size: Number,
  description: String,
  uploaded_by: ObjectId,
  uploaded_at: Date
}]
```

---

## ✅ 后端清单

### 已完成
- [x] 创建文件关联控制器
- [x] 为Projects添加文件接口
- [x] 为Orders添加文件接口
- [x] 为PurchaseOrders添加文件接口
- [x] 为Tickets添加附件接口
- [x] 添加文件删除接口
- [x] 无需云存储SDK

### 无需配置
- [x] 不需要安装云存储包
- [x] 不需要环境变量配置
- [x] 后端不参与文件上传

---

## 🚀 测试指南

### 测试1：添加项目文件

```bash
curl -X POST "http://localhost:5001/api/new-projects/PROJECT_ID/add-file" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "file_name": "test.pdf",
    "file_url": "https://lc-xxx.leancloud.cn/files/test.pdf",
    "file_type": "document",
    "file_size": 123456
  }'
```

### 测试2：添加订单文件

```bash
curl -X POST "http://localhost:5001/api/orders/ORDER_ID/add-file" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "file_name": "contract.pdf",
    "file_url": "https://lc-xxx.leancloud.cn/files/contract.pdf",
    "file_type": "contract"
  }'
```

### 测试3：添加工单附件

```bash
curl -X POST "http://localhost:5001/api/tickets/TICKET_ID/add-attachment" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "file_name": "photo.jpg",
    "file_url": "https://lc-xxx.leancloud.cn/files/photo.jpg",
    "file_type": "image"
  }'
```

---

## 💡 最佳实践

### 1. 错误处理

```javascript
try {
  // 上传到LeanCloud
  const fileInfo = await uploadToLeanCloud(file);
  
  try {
    // 关联到后端
    await associateFile(fileInfo);
  } catch (error) {
    // 如果关联失败，删除LeanCloud上的文件
    await deleteLeanCloudFile(fileInfo.objectId);
    throw error;
  }
} catch (error) {
  message.error('文件上传失败');
}
```

### 2. 进度显示

```javascript
const uploadWithProgress = (file, onProgress) => {
  const xhr = new XMLHttpRequest();
  
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      onProgress(percent);
    }
  });
  
  // ... 执行上传
};
```

### 3. 文件验证

```javascript
const validateFile = (file) => {
  // 大小限制（10MB）
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('文件大小不能超过10MB');
  }
  
  // 类型限制
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的文件类型');
  }
  
  return true;
};
```

---

## 🔒 安全建议

1. **文件访问控制**
   - LeanCloud设置适当的ACL权限
   - 敏感文件使用临时URL

2. **文件大小限制**
   - 前端验证文件大小
   - LeanCloud设置上传限制

3. **文件类型检查**
   - 前端验证文件类型
   - 后端记录文件类型

4. **防止恶意上传**
   - 实施速率限制
   - 监控异常上传行为

---

## 📞 下一步

### 前端需要做的：

1. **注册LeanCloud账号**
   - 访问 https://www.leancloud.cn/
   - 创建应用
   - 获取App ID和App Key

2. **集成LeanCloud SDK**
   ```bash
   npm install leancloud-storage
   ```

3. **实现文件上传组件**
   - 参考上面的React组件示例
   - 实现上传到LeanCloud
   - 调用后端关联接口

4. **测试完整流程**
   - 上传文件
   - 验证文件关联
   - 测试文件删除

---

**后端已准备就绪！随时可以开始前端集成！** 🎉

---

**文档版本**: v1.0  
**最后更新**: 2025年10月28日  
**作者**: Cursor AI Assistant

