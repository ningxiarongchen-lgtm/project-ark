# 产品批量导入功能文档

## 功能概述

产品批量导入功能允许管理员和技术工程师通过上传 Excel 文件批量导入产品数据，大大提高了数据录入效率。

## 技术架构

### 后端 (Backend)

#### 1. 控制器 (Controller)
**文件**: `/backend/controllers/productController.js`

新增 `bulkImportProducts` 函数：
- 接收上传的 Excel 文件
- 使用 `xlsx` 库解析文件
- 验证必填字段
- 检查产品型号唯一性
- 批量创建产品记录
- 返回详细的导入结果

#### 2. 路由 (Routes)
**文件**: `/backend/routes/productRoutes.js`

新增路由：
```javascript
POST /api/products/import
```

权限要求：
- Administrator（管理员）
- Technical Engineer（技术工程师）

#### 3. 中间件
使用 `dataUpload` 中间件（来自 `/backend/middleware/upload.js`）：
- 支持文件格式：CSV, XLSX, XLS
- 文件大小限制：10MB
- 安全验证：文件类型和 MIME type 双重验证

#### 4. 模板文件
**位置**: `/backend/templates/`
- `product_import_template.csv` - 导入模板文件
- `PRODUCT_IMPORT_TEMPLATE_GUIDE.md` - 详细使用说明

#### 5. 静态文件服务
在 `server.js` 中配置：
```javascript
app.use('/templates', express.static(path.join(__dirname, 'templates')));
```

### 前端 (Frontend)

#### 1. 页面组件
**文件**: `/frontend/src/pages/ProductImport.jsx`

功能特性：
- 文件上传（支持 CSV, XLSX, XLS）
- 模板下载
- 导入结果显示（成功、失败、跳过统计）
- 错误详情列表
- 字段说明指引
- 响应式设计

#### 2. 样式文件
**文件**: `/frontend/src/styles/ProductImport.css`

提供美观的 UI 样式和响应式布局。

#### 3. 路由配置
**文件**: `/frontend/src/App.jsx`

新增路由：
```javascript
/product-import
```

权限限制：
- Administrator
- Technical Engineer

#### 4. 导航菜单
**文件**: `/frontend/src/components/Layout/AttioLayout.jsx`

在左侧导航栏添加"产品批量导入"菜单项。

## 数据字段说明

### 必填字段
| 字段名 | 说明 | 数据类型 | 示例 |
|--------|------|----------|------|
| modelNumber | 产品型号（唯一） | String | SF-100 |
| description | 产品描述 | String | 标准气动执行器 |
| torqueValue | 扭矩值 (Nm) | Number | 100 |
| operatingPressure | 工作压力 (bar) | Number | 6 |
| basePrice | 基础价格 | Number | 1500 |

### 可选字段

#### 基本信息
- **series**: 产品系列（默认: SF-Series）
- **category**: 产品类别（Standard, High Torque, Compact, High Temperature, Special）
- **notes**: 备注信息

#### 扭矩规格
- **torqueMin**: 最小扭矩 (Nm)
- **torqueMax**: 最大扭矩 (Nm)

#### 压力规格
- **pressureMin**: 最小压力 (bar，默认: 4)
- **pressureMax**: 最大压力 (bar，默认: 8)

#### 温度和旋转
- **rotation**: 旋转角度（90°, 180°, 270°，默认: 90°）
- **tempMin**: 最低温度 (°C，默认: -20)
- **tempMax**: 最高温度 (°C，默认: 80)

#### 尺寸
- **length**: 长度 (mm)
- **width**: 宽度 (mm)
- **height**: 高度 (mm)
- **weight**: 重量 (kg)

#### 连接规格
- **portSize**: 接口尺寸（G1/8, G1/4, G3/8, G1/2, NPT1/8, NPT1/4, NPT3/8, NPT1/2）
- **mountingType**: 安装类型（ISO5211, NAMUR, Direct Mount, Custom）

#### 材料
- **materialBody**: 本体材料（默认: Aluminum Alloy）
- **materialPiston**: 活塞材料（默认: Aluminum Alloy）
- **materialSeal**: 密封材料（默认: NBR）

#### 性能和特性
- **cycleLife**: 循环寿命（次数，默认: 1000000）
- **features**: 特性列表（用逗号分隔，如: "耐用,高效,防腐"）

#### 定价和库存
- **currency**: 货币代码（默认: USD）
- **inStock**: 是否有货（true/false，默认: true）
- **leadTime**: 交货周期（天，默认: 14）

#### 分类和标签
- **tags**: 标签（用逗号分隔，如: "气动,执行器"）
- **isActive**: 是否激活（true/false，默认: true）

## 使用流程

### 管理员/技术工程师操作

1. **访问功能页面**
   - 登录系统
   - 在左侧导航栏点击"产品批量导入"

2. **下载模板**
   - 点击"下载产品导入模板"按钮
   - 获取 CSV 模板文件

3. **准备数据**
   - 使用 Excel 或文本编辑器打开模板
   - 按照字段说明填写产品数据
   - 确保必填字段完整
   - 保存为 CSV 或 XLSX 格式

4. **上传文件**
   - 点击"选择 Excel 文件"按钮
   - 选择准备好的数据文件
   - 点击"开始导入"按钮

5. **查看结果**
   - 系统自动处理并显示结果
   - 查看成功、失败、跳过的统计
   - 检查错误详情（如有）
   - 必要时修正数据并重新导入

## 数据验证规则

### 1. 必填字段验证
系统会检查以下必填字段是否存在：
- modelNumber
- description
- torqueValue
- operatingPressure
- basePrice

### 2. 唯一性验证
- **modelNumber** 必须在系统中唯一
- 如果型号已存在，该记录会被跳过

### 3. 数据类型验证
- 数值字段必须是有效的数字
- 布尔字段接受 true/false
- 枚举字段只接受预定义的值

### 4. 数据格式验证
- 多值字段（features, tags）使用逗号分隔
- 数值范围需在合理区间内

## 错误处理

### 导入结果分类

1. **成功 (Success)**
   - 数据有效且成功创建的记录数

2. **失败 (Error)**
   - 验证失败或创建失败的记录数
   - 显示具体错误信息和行号

3. **跳过 (Skipped)**
   - 因型号已存在而跳过的记录数
   - 显示跳过原因和行号

### 常见错误及解决方案

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| 缺少必填字段 | Excel 中必填列为空 | 补充完整数据 |
| 产品已存在 | modelNumber 重复 | 修改型号或删除重复行 |
| 数据类型错误 | 数值字段填入非数字 | 确保数值字段为数字格式 |
| 文件格式错误 | 非 Excel/CSV 文件 | 使用支持的文件格式 |
| 文件过大 | 超过 10MB | 分批导入或压缩数据 |

## 安全特性

### 1. 权限控制
- 只有 Administrator 和 Technical Engineer 可以访问
- 后端路由使用 `authorize` 中间件验证

### 2. 文件验证
- MIME type 检查
- 文件扩展名验证
- 文件大小限制（10MB）
- 危险文件类型黑名单

### 3. 数据验证
- 输入数据清理和验证
- SQL 注入防护（通过 Mongoose）
- XSS 防护

## 性能优化

### 1. 批量处理
- 使用循环逐行处理
- 避免数据库批量写入锁定

### 2. 错误容错
- 单条记录失败不影响其他记录
- 详细记录错误信息供后续修正

### 3. 内存管理
- 使用 multer 的内存存储
- 适合中小型文件（< 10MB）

## 测试指南

### 1. 功能测试

**测试用例 1：正常导入**
- 准备包含 2-3 条有效数据的文件
- 上传并验证全部成功导入

**测试用例 2：重复数据**
- 准备包含已存在型号的数据
- 验证系统正确跳过重复记录

**测试用例 3：缺少必填字段**
- 准备缺少必填字段的数据
- 验证系统返回错误信息

**测试用例 4：文件格式**
- 测试 CSV、XLSX、XLS 格式
- 验证都能正常解析

**测试用例 5：大文件**
- 测试 100+ 条记录的文件
- 验证性能和稳定性

### 2. 权限测试

**测试用例 6：权限验证**
- 使用非授权角色账号访问
- 验证被正确拒绝

### 3. 错误处理测试

**测试用例 7：无效文件类型**
- 上传非 Excel 文件（如 .txt, .pdf）
- 验证被正确拒绝

**测试用例 8：空文件**
- 上传空 Excel 文件
- 验证返回适当错误信息

## API 参考

### 导入产品

**端点**: `POST /api/products/import`

**权限**: Administrator, Technical Engineer

**请求**:
```
Content-Type: multipart/form-data

productFile: [Excel 文件]
```

**响应**:
```json
{
  "success": true,
  "message": "批量导入完成",
  "data": {
    "successCount": 10,
    "errorCount": 2,
    "skippedCount": 1,
    "errors": [
      "第3行: 缺少必填字段（型号、描述、扭矩、压力或价格）",
      "第5行: ValidationError: ..."
    ],
    "skipped": [
      "第7行: 产品 SF-100 已存在，已跳过"
    ]
  }
}
```

## 依赖项

### 后端依赖
- `xlsx`: ^0.18.5 - Excel 文件解析
- `multer`: ^2.0.2 - 文件上传处理

### 前端依赖
- `antd`: UI 组件库
- `axios`: HTTP 客户端

## 未来改进

### 计划中的功能
1. **批量更新**: 支持更新已存在的产品
2. **导入预览**: 上传后先预览再确认导入
3. **模板定制**: 允许自定义导入字段
4. **批量操作**: 支持批量删除、激活/禁用
5. **导入历史**: 记录所有导入操作的历史
6. **异步处理**: 大文件使用后台任务处理
7. **进度显示**: 实时显示导入进度
8. **数据转换**: 支持单位自动转换

### 性能优化计划
1. 使用批量插入操作（`insertMany`）
2. 实现文件流式处理
3. 添加导入队列系统
4. 优化大文件处理性能

## 故障排除

### 问题 1：模板下载失败
**原因**: 静态文件服务未正确配置  
**解决**: 检查 `server.js` 中是否有 `app.use('/templates', ...)`

### 问题 2：上传后无响应
**原因**: 后端路由或中间件配置错误  
**解决**: 检查路由顺序、中间件加载、控制器函数导出

### 问题 3：文件解析错误
**原因**: Excel 文件格式不标准  
**解决**: 使用标准 Excel 或 CSV 格式，避免复杂格式

### 问题 4：权限被拒绝
**原因**: 用户角色不在允许列表中  
**解决**: 确认用户角色为 Administrator 或 Technical Engineer

## 支持与反馈

如有问题或建议，请联系：
- 技术支持邮箱：tech-support@example.com
- 系统管理员

## 更新日志

### v1.0.0 (2025-10-30)
- ✅ 初始版本发布
- ✅ 支持 CSV, XLSX, XLS 格式
- ✅ 完整的字段验证
- ✅ 详细的导入结果报告
- ✅ 美观的 UI 界面
- ✅ 权限控制
- ✅ 安全文件上传

