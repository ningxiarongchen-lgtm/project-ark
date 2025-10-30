# 🗄️ Project Ark 数据库架构指南

## 一、数据库基本信息

**数据库类型**：MongoDB (NoSQL 文档数据库)  
**版本要求**：>= v5.0  
**默认端口**：27017  
**数据库名称**：project_ark（生产）/ project_ark_test（测试）

---

## 二、数据库配置

### 2.1 配置文件位置

```
/backend/config/database.js
```

### 2.2 连接配置

**环境变量配置**（`.env` 文件）：
```bash
# 生产/开发环境
MONGODB_URI=mongodb://localhost:27017/project_ark

# 测试环境
MONGO_URI_TEST=mongodb://localhost:27017/project_ark_test
```

**连接逻辑**：
```javascript
// 测试环境
if (process.env.NODE_ENV === 'test') {
  dbUri = process.env.MONGO_URI_TEST || 
          'mongodb://localhost:27017/project_ark_test';
}
// 生产/开发环境
else {
  dbUri = process.env.MONGODB_URI;
}
```

---

## 三、数据模型详解

### 数据模型文件位置

```
/backend/models/
```

共21个数据模型（Schema），以下是详细说明：

---

### 3.1 用户与认证

#### User.js - 用户模型

**集合名称**：`users`

**字段结构**：
```javascript
{
  username: String,           // 用户名
  phone: String,              // 手机号（唯一，用于登录）
  email: String,              // 电子邮件
  password: String,           // 加密密码（bcrypt）
  role: String,               // 角色（10种角色之一）
  department: String,         // 部门
  position: String,           // 职位
  avatar: String,             // 头像URL
  isActive: Boolean,          // 是否激活
  passwordChangeRequired: Boolean, // 是否需要修改密码
  lastLogin: Date,            // 最后登录时间
  createdAt: Date,           // 创建时间
  updatedAt: Date            // 更新时间
}
```

**索引**：
- `phone`: unique（唯一索引）
- `email`: unique（唯一索引）

**角色枚举**：
```javascript
[
  'Administrator',
  'Sales Manager',
  'Technical Engineer',
  'Commercial Engineer',
  'Procurement Specialist',
  'Production Planner',
  'Quality Inspector',
  'Logistics Specialist',
  'After-sales Engineer',
  'Workshop Worker'
]
```

#### RefreshToken.js - 刷新令牌模型

**集合名称**：`refreshtokens`

**字段结构**：
```javascript
{
  user: ObjectId,            // 关联用户ID
  token: String,             // JWT刷新令牌
  expiresAt: Date,          // 过期时间
  createdAt: Date           // 创建时间
}
```

---

### 3.2 产品与选型

#### Actuator.js - 执行器模型

**集合名称**：`actuators`

**字段结构**：
```javascript
{
  series: String,            // 系列（AT/GY/SF）
  model: String,             // 型号（如 AT-150-DA）
  type: String,              // 类型（单作用/双作用）
  torque: Number,            // 扭矩（N·m）
  workingPressure: Object,   // 工作压力范围
  applicableValveSize: Object, // 适用阀门尺寸范围
  weight: Number,            // 重量（kg）
  dimensions: Object,        // 尺寸（长宽高）
  operatingTemperature: Object, // 工作温度范围
  material: Object,          // 材质信息
  specifications: Object,    // 详细规格
  features: [String],        // 特性列表
  applications: [String],    // 应用场景
  price: Number,             // 价格
  supplier: ObjectId,        // 供应商ID
  leadTime: Number,          // 交货期（天）
  stock: Number,             // 库存数量
  imageUrl: String,          // 产品图片
  pdfUrl: String,            // PDF说明书
  isActive: Boolean,         // 是否在售
  createdAt: Date,
  updatedAt: Date
}
```

**索引**：
- `model`: unique
- `series`: 1
- `type`: 1

#### Accessory.js - 配件模型

**集合名称**：`accessories`

**字段结构**：
```javascript
{
  name: String,              // 配件名称
  code: String,              // 配件编码（唯一）
  category: String,          // 类别（电磁阀/限位开关等）
  compatibleSeries: [String], // 兼容系列
  specifications: Object,    // 规格参数
  price: Number,             // 单价
  supplier: ObjectId,        // 供应商ID
  leadTime: Number,          // 交货期
  stock: Number,             // 库存
  isStandard: Boolean,       // 是否标准配件
  imageUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Product.js - 通用产品模型

**集合名称**：`products`

**字段结构**：
```javascript
{
  name: String,              // 产品名称
  category: String,          // 产品类别
  model: String,             // 型号
  description: String,       // 描述
  specifications: Object,    // 规格
  price: Number,             // 价格
  images: [String],          // 图片URL数组
  createdAt: Date,
  updatedAt: Date
}
```

#### ManualOverride.js - 手动覆盖模型

**集合名称**：`manualoverrides`

**字段结构**：
```javascript
{
  actuatorModel: String,     // 执行器型号
  overrideType: String,      // 覆盖类型
  valveType: String,         // 阀门类型
  valveSize: Number,         // 阀门尺寸
  customTorque: Number,      // 自定义扭矩
  reason: String,            // 覆盖原因
  createdBy: ObjectId,       // 创建人
  createdAt: Date,
  updatedAt: Date
}
```

---

### 3.3 项目与订单

#### NewProject.js - 项目模型

**集合名称**：`newprojects`

**字段结构**：
```javascript
{
  projectNumber: String,     // 项目编号（自动生成）
  projectName: String,       // 项目名称
  customer: String,          // 客户名称
  industry: String,          // 行业
  budget: Number,            // 预算
  status: String,            // 状态
  salesManager: ObjectId,    // 销售经理ID
  technicalEngineer: ObjectId, // 技术工程师ID
  commercialEngineer: ObjectId, // 商务工程师ID
  
  // 技术需求
  technicalRequirements: [{
    tagNumber: String,       // 位号
    valveType: String,       // 阀门类型
    valveSize: Number,       // 阀门尺寸
    pressure: Number,        // 压力
    temperature: Number,     // 温度
    quantity: Number,        // 数量
    selectedActuator: ObjectId, // 选定执行器
    accessories: [ObjectId]  // 配件列表
  }],
  
  // 报价信息
  quote: {
    items: [{
      product: ObjectId,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number
    }],
    totalAmount: Number,
    validUntil: Date,
    generatedBy: ObjectId,
    generatedAt: Date
  },
  
  // 合同信息
  contract: {
    contractNumber: String,
    signedDate: Date,
    deliveryDate: Date,
    paymentTerms: String,
    documents: [String]      // 文档URL
  },
  
  // 生产订单
  productionOrder: ObjectId, // 关联生产订单ID
  
  createdAt: Date,
  updatedAt: Date
}
```

**状态枚举**：
```javascript
['Lead', 'In Progress', 'Quoted', 'Won', 'Lost', 
 'Contract', 'Production', 'Completed']
```

#### Quote.js - 报价单模型

**集合名称**：`quotes`

**字段结构**：
```javascript
{
  quoteNumber: String,       // 报价单号
  project: ObjectId,         // 关联项目
  customer: String,
  items: [{
    product: ObjectId,
    description: String,
    quantity: Number,
    unitPrice: Number,
    discount: Number,
    totalPrice: Number
  }],
  subtotal: Number,
  tax: Number,
  totalAmount: Number,
  validUntil: Date,
  status: String,            // Draft/Sent/Accepted/Rejected
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### SalesOrder.js - 销售订单模型

**集合名称**：`salesorders`

**字段结构**：
```javascript
{
  orderNumber: String,       // 订单号（SO-YYYYMM-XXXX）
  project: ObjectId,         // 关联项目
  customer: String,
  items: [{
    product: ObjectId,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }],
  totalAmount: Number,
  status: String,            // Pending/Confirmed/Production/Shipped/Completed
  contractDate: Date,
  deliveryDate: Date,
  paymentStatus: String,     // Unpaid/Partial/Paid
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 3.4 生产与制造

#### ProductionOrder.js - 生产订单模型

**集合名称**：`productionorders`

**字段结构**：
```javascript
{
  orderNumber: String,       // 生产订单号（PO-YYYYMM-XXXX）
  salesOrder: ObjectId,      // 关联销售订单
  project: ObjectId,         // 关联项目
  
  // BOM清单
  bom: [{
    item: ObjectId,          // 物料ID（执行器/配件）
    itemType: String,        // 类型（Actuator/Accessory）
    quantity: Number,
    requiredQuantity: Number,
    allocatedQuantity: Number,
    purchaseStatus: String   // 采购状态
  }],
  
  // 工单列表
  workOrders: [ObjectId],    // 关联工单ID
  
  status: String,            // Planning/Material/Production/QC/Completed
  priority: String,          // Low/Medium/High/Urgent
  plannedStartDate: Date,
  plannedEndDate: Date,
  actualStartDate: Date,
  actualEndDate: Date,
  progress: Number,          // 进度百分比
  
  planner: ObjectId,         // 生产计划员
  createdAt: Date,
  updatedAt: Date
}
```

#### WorkOrder.js - 工单模型

**集合名称**：`workorders`

**字段结构**：
```javascript
{
  workOrderNumber: String,   // 工单号（WO-YYYYMM-XXXX）
  productionOrder: ObjectId, // 关联生产订单
  product: ObjectId,         // 产品
  quantity: Number,
  workCenter: ObjectId,      // 工作中心
  routing: ObjectId,         // 工艺路线
  
  status: String,            // Pending/In Progress/Completed/Cancelled
  assignedTo: ObjectId,      // 分配给（车间工人）
  
  plannedStartTime: Date,
  plannedEndTime: Date,
  actualStartTime: Date,
  actualEndTime: Date,
  
  completedQuantity: Number,
  scrapQuantity: Number,
  
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### WorkCenter.js - 工作中心模型

**集合名称**：`workcenters`

**字段结构**：
```javascript
{
  code: String,              // 工作中心编码
  name: String,              // 名称
  type: String,              // 类型（装配/测试/包装）
  capacity: Number,          // 产能（件/天）
  efficiency: Number,        // 效率百分比
  status: String,            // Active/Inactive/Maintenance
  createdAt: Date,
  updatedAt: Date
}
```

#### Routing.js - 工艺路线模型

**集合名称**：`routings`

**字段结构**：
```javascript
{
  product: ObjectId,         // 产品
  operations: [{
    sequence: Number,        // 工序顺序
    workCenter: ObjectId,    // 工作中心
    operationName: String,   // 工序名称
    setupTime: Number,       // 准备时间（分钟）
    runTime: Number,         // 运行时间（分钟）
    description: String
  }],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 3.5 采购与供应商

#### PurchaseOrder.js - 采购订单模型

**集合名称**：`purchaseorders`

**字段结构**：
```javascript
{
  poNumber: String,          // 采购订单号（PUR-YYYYMM-XXXX）
  supplier: ObjectId,        // 供应商
  productionOrder: ObjectId, // 关联生产订单
  
  items: [{
    item: ObjectId,
    itemType: String,        // Actuator/Accessory
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number,
    receivedQuantity: Number
  }],
  
  totalAmount: Number,
  status: String,            // Draft/Sent/Confirmed/Partial/Received/Cancelled
  
  orderDate: Date,
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  
  paymentTerms: String,
  notes: String,
  
  createdBy: ObjectId,       // 采购专员
  createdAt: Date,
  updatedAt: Date
}
```

#### Supplier.js - 供应商模型

**集合名称**：`suppliers`

**字段结构**：
```javascript
{
  code: String,              // 供应商编码（唯一）
  name: String,              // 供应商名称
  category: String,          // 类别（执行器/配件）
  contact: {
    person: String,          // 联系人
    phone: String,
    email: String,
    address: String
  },
  rating: Number,            // 评级（1-5星）
  paymentTerms: String,      // 付款条款
  leadTime: Number,          // 默认交货期（天）
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 3.6 质量管理

#### QualityCheck.js - 质检模型

**集合名称**：`qualitychecks`

**字段结构**：
```javascript
{
  checkNumber: String,       // 质检单号（QC-YYYYMM-XXXX）
  checkType: String,         // IQC/IPQC/FQC/OQC
  productionOrder: ObjectId, // 关联生产订单
  product: ObjectId,         // 产品
  
  sampleSize: Number,        // 抽样数量
  defectCount: Number,       // 缺陷数量
  
  checkItems: [{
    itemName: String,        // 检验项
    standard: String,        // 标准
    actualValue: String,     // 实测值
    result: String,          // Pass/Fail
    notes: String
  }],
  
  overallResult: String,     // Pass/Fail
  inspector: ObjectId,       // 质检员
  checkDate: Date,
  
  images: [String],          // 检验照片
  documents: [String],       // 检验报告
  
  createdAt: Date,
  updatedAt: Date
}
```

---

### 3.7 售后服务

#### ServiceTicket.js - 售后工单模型

**集合名称**：`servicetickets`

**字段结构**：
```javascript
{
  ticketNumber: String,      // 工单号（TK-YYYYMM-XXXX）
  type: String,              // 类型（维修/咨询/培训）
  priority: String,          // Low/Medium/High/Critical
  
  customer: String,
  project: ObjectId,         // 关联项目（可选）
  product: ObjectId,         // 关联产品
  
  title: String,             // 问题标题
  description: String,       // 问题描述
  
  status: String,            // Open/In Progress/Resolved/Closed
  
  assignedTo: ObjectId,      // 售后工程师
  reportedBy: ObjectId,      // 报告人
  
  resolution: String,        // 解决方案
  
  activities: [{
    user: ObjectId,
    action: String,
    notes: String,
    timestamp: Date
  }],
  
  attachments: [String],     // 附件
  
  createdAt: Date,
  updatedAt: Date,
  resolvedAt: Date,
  closedAt: Date
}
```

---

### 3.8 财务管理

#### Invoice.js - 发票模型

**集合名称**：`invoices`

**字段结构**：
```javascript
{
  invoiceNumber: String,     // 发票号
  salesOrder: ObjectId,      // 关联销售订单
  customer: String,
  amount: Number,
  taxAmount: Number,
  totalAmount: Number,
  status: String,            // Draft/Sent/Paid/Overdue
  issueDate: Date,
  dueDate: Date,
  paidDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Payment.js - 付款模型

**集合名称**：`payments`

**字段结构**：
```javascript
{
  paymentNumber: String,     // 付款单号
  invoice: ObjectId,         // 关联发票
  amount: Number,
  paymentMethod: String,     // 付款方式
  paymentDate: Date,
  reference: String,         // 参考号
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 3.9 工程变更

#### EngineeringChangeOrder.js - ECO模型

**集合名称**：`engineeringchangeorders`

**字段结构**：
```javascript
{
  ecoNumber: String,         // ECO编号
  title: String,             // 变更标题
  description: String,       // 变更描述
  reason: String,            // 变更原因
  affectedProducts: [ObjectId], // 影响的产品
  status: String,            // Draft/Review/Approved/Rejected/Implemented
  priority: String,
  requestedBy: ObjectId,
  approvedBy: ObjectId,
  requestDate: Date,
  approvalDate: Date,
  implementationDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 四、数据关系图

```
User (用户)
  ├── NewProject (项目) - salesManager, technicalEngineer
  ├── Quote (报价) - createdBy
  ├── ProductionOrder (生产订单) - planner
  ├── WorkOrder (工单) - assignedTo
  ├── PurchaseOrder (采购订单) - createdBy
  └── ServiceTicket (售后工单) - assignedTo, reportedBy

NewProject (项目)
  ├── Quote (报价)
  ├── SalesOrder (销售订单)
  └── ProductionOrder (生产订单)

ProductionOrder (生产订单)
  ├── WorkOrder (工单) - 一对多
  ├── PurchaseOrder (采购订单) - 一对多
  └── QualityCheck (质检) - 一对多

Actuator (执行器)
  ├── Supplier (供应商) - 多对一
  └── NewProject.technicalRequirements - 多对多

Accessory (配件)
  └── Supplier (供应商) - 多对一

Supplier (供应商)
  └── PurchaseOrder (采购订单) - 一对多
```

---

## 五、数据初始化

### 5.1 种子数据脚本

**位置**：`/backend/`

**主要脚本**：
```
seed_final_acceptance.js     # 完整测试数据（推荐）
seed_at_gy_final.js          # AT/GY系列执行器
seed_all_actuators_final.js  # 所有执行器型号
```

### 5.2 初始化命令

```bash
cd backend

# 初始化完整测试数据（包括用户、产品、项目）
npm run seed:final

# 仅初始化AT/GY执行器
npm run seed:atgy:final
```

### 5.3 初始化数据内容

**seed:final 包含**：
- 10个测试用户（覆盖所有角色）
- 5个供应商
- 55个执行器型号（AT/GY/SF系列）
- 8个配件
- 4个手动操作装置
- 4个示例项目

---

## 六、数据备份与恢复

### 6.1 备份数据库

```bash
# 备份整个数据库
mongodump --db project_ark --out ./backup/$(date +%Y%m%d)

# 备份指定集合
mongodump --db project_ark --collection users --out ./backup
```

### 6.2 恢复数据库

```bash
# 恢复整个数据库
mongorestore --db project_ark ./backup/20251029/project_ark

# 恢复指定集合
mongorestore --db project_ark --collection users ./backup/project_ark/users.bson
```

### 6.3 导出为JSON

```bash
# 导出集合为JSON
mongoexport --db project_ark --collection users --out users.json --pretty

# 导入JSON
mongoimport --db project_ark --collection users --file users.json
```

---

## 七、数据库监控

### 7.1 查看数据库状态

```javascript
// 连接MongoDB
mongo

// 切换数据库
use project_ark

// 查看集合列表
show collections

// 查看集合文档数量
db.users.count()
db.actuators.count()
db.newprojects.count()

// 查看数据库统计
db.stats()
```

### 7.2 性能监控

```javascript
// 查看慢查询
db.getProfilingStatus()

// 启用性能分析
db.setProfilingLevel(1, 100)  // 记录>100ms的查询

// 查看当前操作
db.currentOp()

// 查看索引使用情况
db.users.getIndexes()
```

---

## 八、最佳实践

### 8.1 索引优化

- 为常用查询字段创建索引
- 使用复合索引优化多字段查询
- 定期分析慢查询并优化

### 8.2 数据安全

- 启用MongoDB认证
- 限制网络访问
- 定期备份数据
- 使用环境变量存储敏感信息

### 8.3 数据清理

```javascript
// 清理测试数据
db.users.deleteMany({ phone: /^130/ })
db.newprojects.deleteMany({ projectName: /测试/ })

// 清理过期令牌
db.refreshtokens.deleteMany({ expiresAt: { $lt: new Date() } })
```

---

© 2025 Project Ark Team. All Rights Reserved.

