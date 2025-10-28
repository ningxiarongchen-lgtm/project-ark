# 配件API完整实现说明

## 📋 概述

为C-MAX选型系统实现了完整的配件管理API，包括CRUD操作、Excel批量导入、数据验证和兼容性查询功能。

## 🗂️ 实现的文件

### 1. 数据模型
- **文件**: `backend/models/Accessory.js`
- **说明**: 定义配件的Mongoose数据模型
- **主要字段**:
  ```javascript
  {
    name: String,              // 配件名称
    category: Enum,            // 配件类别（5种）
    specifications: Map,       // 规格参数（键值对）
    price: Number,             // 价格
    compatibility_rules: {     // 兼容性规则
      body_sizes: [String],    // 兼容的执行器机身尺寸
      action_types: [String]   // 兼容的作用类型
    },
    description: String,       // 描述
    manufacturer: String,      // 制造商
    model_number: String,      // 型号
    stock_info: {              // 库存信息
      quantity: Number,
      available: Boolean,
      lead_time: String
    },
    images: [String],          // 图片URL数组
    is_active: Boolean         // 是否激活
  }
  ```

### 2. 控制器
- **文件**: `backend/controllers/accessoryController.js`
- **实现的功能**:
  - ✅ `getAllAccessories` - 获取所有配件（支持过滤和搜索）
  - ✅ `getAccessoryById` - 获取单个配件详情
  - ✅ `createAccessory` - 创建新配件
  - ✅ `updateAccessory` - 更新配件信息
  - ✅ `deleteAccessory` - 删除配件（软删除）
  - ✅ `getAccessoriesByCategory` - 按类别获取配件
  - ✅ `getCompatibleAccessories` - 获取与特定执行器兼容的配件
  - ✅ `downloadTemplate` - 下载Excel导入模板
  - ✅ `uploadExcel` - Excel批量导入配件

### 3. 路由
- **文件**: `backend/routes/accessoryRoutes.js`
- **API端点**:

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/accessories` | 认证用户 | 获取配件列表（支持查询参数过滤） |
| GET | `/api/accessories/template` | 管理员 | 下载Excel导入模板 |
| GET | `/api/accessories/category/:category` | 认证用户 | 按类别获取配件 |
| GET | `/api/accessories/compatible/:actuatorId` | 认证用户 | 获取兼容配件 |
| GET | `/api/accessories/:id` | 认证用户 | 获取单个配件详情 |
| POST | `/api/accessories` | 管理员 | 创建新配件 |
| POST | `/api/accessories/upload` | 管理员 | Excel批量上传 |
| PUT | `/api/accessories/:id` | 管理员 | 更新配件 |
| DELETE | `/api/accessories/:id` | 管理员 | 删除配件 |

### 4. 项目模型更新
- **文件**: `backend/models/NewProject.js`
- **新增字段**: `selections.selected_accessories`
- **字段结构**:
  ```javascript
  selected_accessories: [{
    accessory_id: ObjectId,
    name: String,
    category: String,
    quantity: Number,
    unit_price: Number,
    total_price: Number,
    notes: String
  }]
  ```
- **新增方法**:
  - `calculateSelectionPrice()` - 已更新，包含配件价格计算
  - `addAccessoryToSelection(selectionId, accessoryData)` - 添加配件到选型
  - `removeAccessoryFromSelection(selectionId, accessoryId)` - 移除配件

### 5. 测试脚本
- **文件**: `backend/test-accessories.sh`
- **测试内容**:
  1. ✅ 管理员登录
  2. ✅ 创建新配件
  3. ✅ 获取所有配件
  4. ✅ 按类别过滤
  5. ✅ 按价格范围过滤
  6. ✅ 下载Excel模板
  7. ✅ Excel文件上传
  8. ✅ 更新配件信息
  9. ✅ 获取配件详情
  10. ✅ 删除配件

## 🎯 配件类别

系统支持5种配件类别：

1. **控制类** - 电磁阀、定位器、气动控制阀等
2. **连接与传动类** - 联轴器、支架、连接件等
3. **安全与保护类** - 限位开关、保护罩、安全阀等
4. **检测与反馈类** - 位置传感器、反馈装置等
5. **辅助与安装工具** - 安装工具、配件包等

## 📊 Excel导入功能

### Excel模板格式

| 列名 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 配件名称 | String | ✅ | 配件的名称 |
| 配件类别 | Enum | ✅ | 必须是5种类别之一 |
| 价格 | Number | ✅ | 配件价格（元） |
| 描述 | String | ⚪ | 配件描述信息 |
| 制造商 | String | ⚪ | 制造商名称 |
| 型号 | String | ⚪ | 配件型号 |
| 库存数量 | Number | ⚪ | 当前库存数量 |
| 是否可用 | Boolean | ⚪ | 是/否 |
| 交货期 | String | ⚪ | 预计交货时间 |
| 规格_* | String | ⚪ | 任意规格参数（如：规格_电压、规格_接口尺寸） |
| 兼容机身尺寸 | String | ⚪ | 逗号分隔（如：SF10,SF12,SF14） |
| 兼容作用类型 | String | ⚪ | 逗号分隔（如：DA,SR） |

### 数据验证规则

1. **必填字段验证**:
   - 配件名称不能为空
   - 配件类别必须是预设的5种之一
   - 价格必须是有效的非负数字

2. **类别枚举验证**:
   ```javascript
   validCategories = [
     '控制类',
     '连接与传动类',
     '安全与保护类',
     '检测与反馈类',
     '辅助与安装工具'
   ]
   ```

3. **警告提示**:
   - 缺少描述信息
   - 缺少制造商信息

4. **导入策略**:
   - 如果配件（名称+类别）已存在，则更新
   - 如果不存在，则创建新记录

### Excel上传响应格式

成功响应：
```json
{
  "success": true,
  "message": "Excel文件导入完成",
  "validation_report": {
    "total_rows": 10,
    "valid_rows": 9,
    "invalid_rows": 1,
    "warnings_count": 2
  },
  "import_results": {
    "success": 8,
    "failed": 1,
    "skipped": 0,
    "errors": [
      {
        "row": 5,
        "name": "某配件",
        "error": "错误信息"
      }
    ]
  },
  "summary": {
    "total": 10,
    "validated": 9,
    "imported": 8,
    "failed": 1,
    "skipped": 0
  }
}
```

## 🔍 查询功能

### 1. 基本查询
```bash
GET /api/accessories
```

### 2. 按类别过滤
```bash
GET /api/accessories?category=控制类
```

### 3. 按价格范围过滤
```bash
GET /api/accessories?min_price=1000&max_price=5000
```

### 4. 搜索功能
```bash
GET /api/accessories?search=电磁阀
```
搜索范围：配件名称、描述、型号

### 5. 组合查询
```bash
GET /api/accessories?category=控制类&min_price=1000&max_price=3000&search=电磁阀
```

### 6. 兼容性查询
```bash
GET /api/accessories/compatible/:actuatorId?category=控制类
```
返回与指定执行器兼容的配件（可选择性按类别过滤）

## 🔐 权限控制

### 管理员权限（Administrator）
- ✅ 创建配件
- ✅ 更新配件
- ✅ 删除配件
- ✅ Excel批量导入
- ✅ 下载Excel模板

### 普通用户权限（Engineer / Sales Manager）
- ✅ 查看配件列表
- ✅ 查看配件详情
- ✅ 搜索和过滤配件
- ✅ 查询兼容配件
- ❌ 无法修改配件数据

## 🧪 测试指南

### 1. 运行测试脚本
```bash
cd backend
chmod +x test-accessories.sh
./test-accessories.sh
```

### 2. 手动测试步骤

#### 步骤1: 确保后端运行
```bash
cd backend
npm run dev
```

#### 步骤2: 登录获取Token
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmax.com","password":"admin123"}'
```

#### 步骤3: 测试创建配件
```bash
curl -X POST http://localhost:5001/api/accessories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "双作用电磁阀",
    "category": "控制类",
    "price": 1200
  }'
```

#### 步骤4: 下载Excel模板
```bash
curl -X GET http://localhost:5001/api/accessories/template \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o accessories_template.xlsx
```

#### 步骤5: 上传Excel文件
```bash
curl -X POST http://localhost:5001/api/accessories/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@accessories_template.xlsx"
```

## 💡 使用示例

### 前端集成示例

#### 1. 获取配件列表
```javascript
import { accessoriesAPI } from '@/services/api'

// 获取所有配件
const accessories = await accessoriesAPI.getAll()

// 按类别过滤
const controlAccessories = await accessoriesAPI.getAll({
  category: '控制类'
})

// 按价格范围过滤
const affordableAccessories = await accessoriesAPI.getAll({
  min_price: 1000,
  max_price: 3000
})
```

#### 2. 创建配件
```javascript
const newAccessory = await accessoriesAPI.create({
  name: '双作用电磁阀',
  category: '控制类',
  price: 1200,
  specifications: {
    '电压': '24V DC',
    '接口尺寸': 'G1/4'
  },
  compatibility_rules: {
    body_sizes: ['SF10', 'SF12'],
    action_types: ['DA']
  }
})
```

#### 3. Excel批量导入
```javascript
const handleUpload = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const result = await accessoriesAPI.uploadExcel(formData)
  
  if (result.success) {
    message.success(`成功导入 ${result.summary.imported} 条配件`)
  } else {
    message.error(result.message)
  }
}
```

#### 4. 查询兼容配件
```javascript
// 获取与特定执行器兼容的配件
const compatibleAccessories = await accessoriesAPI.getCompatible(
  actuatorId,
  { category: '控制类' }
)
```

## 📈 后续优化建议

1. **图片上传功能**: 为配件添加图片上传功能
2. **批量操作**: 实现批量删除、批量更新功能
3. **价格历史**: 记录配件价格变动历史
4. **库存管理**: 完善库存出入库管理
5. **供应商管理**: 添加供应商信息和采购记录
6. **兼容性检查**: 在选型时自动推荐兼容配件
7. **统计分析**: 配件使用频率、热门配件排行

## 🎉 完成状态

- ✅ 数据模型设计完成
- ✅ API接口实现完成
- ✅ Excel导入功能完成
- ✅ 数据验证逻辑完成
- ✅ 权限控制实现完成
- ✅ 项目模型集成完成
- ✅ 测试脚本编写完成
- ✅ 文档编写完成

---

**创建时间**: 2025-10-27  
**版本**: v1.0  
**作者**: C-MAX开发团队

