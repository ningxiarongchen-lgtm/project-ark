# 💻 Project Ark 代码结构指南

## 一、项目目录结构

```
Model Selection System/
│
├── backend/                    # 后端服务 (Node.js + Express)
│   ├── config/                # 配置文件
│   ├── controllers/           # 控制器（业务逻辑）
│   ├── models/                # 数据模型（Mongoose Schema）
│   ├── routes/                # 路由定义
│   ├── middleware/            # 中间件
│   ├── services/              # 服务层
│   ├── utils/                 # 工具函数
│   ├── tests/                 # 测试文件
│   ├── uploads/               # 上传文件存储
│   ├── templates/             # Excel模板
│   ├── scripts/               # 脚本工具
│   ├── server.js              # 服务器入口 ⭐
│   ├── package.json           # 依赖配置
│   └── .env                   # 环境变量（需创建）
│
├── frontend/                  # 前端应用 (React + Vite)
│   ├── src/
│   │   ├── pages/            # 页面组件
│   │   ├── components/       # 通用组件
│   │   ├── services/         # API服务
│   │   ├── store/            # 全局状态
│   │   ├── hooks/            # 自定义Hooks
│   │   ├── utils/            # 工具函数
│   │   ├── styles/           # 全局样式
│   │   ├── config/           # 配置文件
│   │   ├── App.jsx           # 路由配置 ⭐
│   │   └── main.jsx          # 应用入口 ⭐
│   ├── cypress/              # E2E测试
│   ├── dist/                 # 构建产物
│   ├── package.json          # 依赖配置
│   └── vite.config.js        # Vite配置
│
└── [启动脚本]
```

---

## 二、后端代码结构

### 2.1 服务器入口 (server.js)

**位置**：`/backend/server.js`

**主要功能**：
```javascript
// 1. 加载环境变量
require('dotenv').config();

// 2. 初始化Express应用
const app = express();

// 3. 连接数据库
connectDB();

// 4. 配置安全中间件
app.use(helmet());
app.use(cors());
app.use(rateLimit());

// 5. 注册路由
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
// ... 其他路由

// 6. 启动服务器
httpServer.listen(PORT);

// 7. 初始化WebSocket
initializeSocket(httpServer);
```

**服务端口**：5001  
**WebSocket**：同端口

---

### 2.2 路由层 (routes/)

**位置**：`/backend/routes/`  
**数量**：28个路由文件

#### 核心路由列表

| 文件名 | API路径 | 功能说明 |
|-------|---------|---------|
| `authRoutes.js` | `/api/auth` | 用户认证（登录/注册/修改密码） |
| `actuatorRoutes.js` | `/api/actuators` | 执行器产品查询 |
| `accessoryRoutes.js` | `/api/accessories` | 配件管理 |
| `newProjectRoutes.js` | `/api/new-projects` | 项目管理（CRUD） |
| `selectionRoutes.js` | `/api/selection` | 智能选型引擎 |
| `aiRoutes.js` | `/api/ai` | AI辅助功能 |
| `quoteRoutes.js` | `/api/quotes` | 报价管理 |
| `contract.js` | `/api/contracts` | 合同管理 |
| `orderRoutes.js` | `/api/orders` | 销售订单 |
| `productionRoutes.js` | `/api/production` | 生产订单管理 |
| `purchaseOrderRoutes.js` | `/api/purchase-orders` | 采购订单 |
| `supplierRoutes.js` | `/api/suppliers` | 供应商管理 |
| `mesRoutes.js` | `/api/mes` | 制造执行系统 |
| `qualityRoutes.js` | `/api/quality` | 质量管理 |
| `ticketRoutes.js` | `/api/tickets` | 售后工单 |
| `ecoRoutes.js` | `/api/ecos` | 工程变更 |
| `financeRoutes.js` | `/api/finance` | 财务管理 |
| `erpStatsRoutes.js` | `/api/erp` | ERP统计 |
| `catalogRoutes.js` | `/api/catalog` | 产品目录（销售） |
| `adminRoutes.js` | `/api/admin` | 系统管理 |

#### 数据管理路由

| 文件名 | API路径 | 功能说明 |
|-------|---------|---------|
| `actuatorManagementRoutes.js` | `/api/data-management/actuators` | 执行器数据管理 |
| `accessoryManagementRoutes.js` | `/api/data-management/accessories` | 配件数据管理 |
| `supplierManagementRoutes.js` | `/api/data-management/suppliers` | 供应商数据管理 |
| `userManagementRoutes.js` | `/api/data-management/users` | 用户数据管理 |

#### 测试路由（仅测试环境）

| 文件名 | API路径 | 功能说明 |
|-------|---------|---------|
| `testing.routes.js` | `/api/testing` | 测试数据清理接口 |

---

### 2.3 控制器层 (controllers/)

**位置**：`/backend/controllers/`  
**数量**：28个控制器文件

#### 核心控制器

**selectionController.js** - 智能选型核心 ⭐
```javascript
// 主要功能：
exports.selectActuator = async (req, res) => {
  // 1. 接收工况参数
  const { valveType, valveSize, pressure, temperature } = req.body;
  
  // 2. 计算所需扭矩
  const requiredTorque = calculateTorque(valveType, valveSize, pressure);
  
  // 3. 匹配执行器（扭矩裕量15-25%）
  const actuators = await Actuator.find({
    torque: { $gte: requiredTorque * 1.15, $lte: requiredTorque * 1.25 }
  });
  
  // 4. 自动选配附件
  const accessories = await selectAccessories(actuators[0]);
  
  // 5. 返回推荐方案
  return res.json({ actuator, accessories, bom });
};
```

**bomController.js** - BOM展开 ⭐
```javascript
exports.explodeBOM = async (req, res) => {
  // 1. 获取项目技术需求
  const project = await NewProject.findById(projectId);
  
  // 2. 展开BOM
  const bomItems = [];
  for (let req of project.technicalRequirements) {
    // 执行器主机
    bomItems.push({
      item: req.selectedActuator,
      quantity: req.quantity
    });
    
    // 标准配件（自动关联）
    const standardAccessories = await Accessory.find({
      compatibleSeries: actuator.series,
      isStandard: true
    });
    
    bomItems.push(...standardAccessories);
  }
  
  // 3. 返回BOM清单
  return res.json({ bom: bomItems });
};
```

**productionController.js** - 生产排产 ⭐
```javascript
exports.scheduleProduction = async (req, res) => {
  // 1. 获取生产订单
  const order = await ProductionOrder.findById(orderId);
  
  // 2. 分配工作中心
  const workCenters = await WorkCenter.find({ status: 'Active' });
  
  // 3. 创建工单
  const workOrders = [];
  for (let item of order.bom) {
    const routing = await Routing.findOne({ product: item.item });
    
    for (let operation of routing.operations) {
      workOrders.push({
        productionOrder: order._id,
        product: item.item,
        workCenter: operation.workCenter,
        quantity: item.quantity
      });
    }
  }
  
  // 4. 保存工单
  await WorkOrder.insertMany(workOrders);
};
```

---

### 2.4 中间件 (middleware/)

**位置**：`/backend/middleware/`

#### auth.js - JWT认证中间件
```javascript
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;
  
  // 1. 从Cookie或Header获取token
  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // 2. 验证token
  if (!token) {
    return res.status(401).json({ message: '未授权访问' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token无效' });
  }
};
```

#### authMiddleware.js - 角色权限验证
```javascript
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: '您没有权限执行此操作' 
      });
    }
    next();
  };
};

// 使用示例
router.post('/create', protect, authorize('Sales Manager'), createProject);
```

#### validators.js - 数据验证
```javascript
const { body, validationResult } = require('express-validator');

exports.validateProject = [
  body('projectName').notEmpty().withMessage('项目名称不能为空'),
  body('customer').notEmpty().withMessage('客户名称不能为空'),
  body('budget').isNumeric().withMessage('预算必须是数字'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

#### upload.js - 文件上传
```javascript
const multer = require('multer');
const path = require('path');

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|xlsx|xls/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (extname) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
```

---

### 2.5 服务层 (services/)

**位置**：`/backend/services/`

#### aps.service.js - 高级排产服务
```javascript
class APSService {
  // 计算生产计划
  async generateSchedule(productionOrder) {
    // 1. 获取物料需求
    const materials = productionOrder.bom;
    
    // 2. 检查物料可用性
    const availability = await this.checkMaterialAvailability(materials);
    
    // 3. 计算产能
    const capacity = await this.calculateCapacity();
    
    // 4. 生成排产计划
    const schedule = this.optimizeSchedule(availability, capacity);
    
    return schedule;
  }
}
```

#### socketService.js - WebSocket服务
```javascript
const socketIO = require('socket.io');

let io;

exports.initializeSocket = (httpServer) => {
  io = socketIO(httpServer, {
    cors: { origin: process.env.FRONTEND_URL }
  });
  
  io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);
    
    // 加入用户房间
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
    });
    
    // 断开连接
    socket.on('disconnect', () => {
      console.log('用户断开:', socket.id);
    });
  });
};

// 发送通知
exports.sendNotification = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit('notification', notification);
  }
};
```

---

### 2.6 工具函数 (utils/)

**位置**：`/backend/utils/`

#### torqueCalculator.js - 扭矩计算
```javascript
// 根据阀门类型和尺寸计算所需扭矩
exports.calculateTorque = (valveType, valveSize, pressure) => {
  const coefficients = {
    'Ball Valve': 0.15,
    'Butterfly Valve': 0.12,
    'Gate Valve': 0.20
  };
  
  const coefficient = coefficients[valveType] || 0.15;
  const torque = coefficient * valveSize * pressure;
  
  return torque;
};
```

---

## 三、前端代码结构

### 3.1 应用入口

**main.jsx** - React应用入口
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

**App.jsx** - 路由配置与权限控制 ⭐
```javascript
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AttioLayout from './components/Layout/AttioLayout'

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <AttioLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<ProjectDashboard />} />
        <Route path="selection-engine" element={<SelectionEngine />} />
        {/* ... 更多路由 */}
      </Route>
    </Routes>
  )
}
```

---

### 3.2 页面组件 (pages/)

**位置**：`/frontend/src/pages/`  
**数量**：35个页面组件

#### 核心页面列表

| 文件名 | 路由路径 | 功能说明 | 权限要求 |
|-------|---------|---------|---------|
| `Login.jsx` | `/login` | 登录页 | 公开 |
| `Dashboard.jsx` | `/dashboard` | 个人工作台 | 所有角色 |
| `ProjectDashboard.jsx` | `/projects` | 项目列表 | 销售/技术/商务 |
| `ProjectDetails.jsx` | `/projects/:id` | 项目详情 | 项目参与者 |
| `SelectionEngine.jsx` | `/selection-engine` | 智能选型 | 技术工程师 |
| `ProductCatalog.jsx` | `/product-catalog` | 产品目录 | 销售经理 |
| `OrderManagement.jsx` | `/orders` | 生产订单 | 生产/商务 |
| `PurchaseOrderManagement.jsx` | `/purchase-orders` | 采购管理 | 采购专员 |
| `ProductionSchedule.jsx` | `/production-schedule` | 生产排产 | 生产计划员 |
| `ShopFloorTerminal.jsx` | `/shop-floor` | 车间终端 | 车间工人 |
| `QualityManagement.jsx` | `/quality` | 质量管理 | 质检员 |
| `ServiceCenter.jsx` | `/service-center` | 售后中心 | 售后工程师 |
| `ERPDashboard.jsx` | `/erp-dashboard` | ERP看板 | 管理层 |
| `DataManagement.jsx` | `/data-management` | 数据管理 | 管理员 |

---

### 3.3 组件库 (components/)

**位置**：`/frontend/src/components/`

#### Layout组件
- `AttioLayout.jsx` - 主布局（侧边栏+顶栏+内容区）

#### Attio组件库
- `AttioTable.jsx` - 高级表格组件
- `AttioButton.jsx` - 按钮组件
- `AttioInput.jsx` - 输入框组件
- `AttioCard.jsx` - 卡片组件
- `AttioCommandPalette.jsx` - 命令面板
- `AttioResizablePanels.jsx` - 可调整大小面板

#### 仪表盘组件（dashboards/）
- `AdminDashboard.jsx` - 管理员仪表盘
- `SalesManagerDashboard.jsx` - 销售经理仪表盘
- `TechnicalEngineerDashboard.jsx` - 技术工程师仪表盘
- `ProductionPlannerDashboard.jsx` - 生产计划员仪表盘
- ...（共10个角色仪表盘）

---

### 3.4 服务层 (services/)

**位置**：`/frontend/src/services/`

#### api.js - API封装 ⭐
```javascript
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,  // 发送Cookie
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 未授权，跳转登录
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API方法
export const projectAPI = {
  getAll: () => api.get('/new-projects'),
  getById: (id) => api.get(`/new-projects/${id}`),
  create: (data) => api.post('/new-projects', data),
  update: (id, data) => api.put(`/new-projects/${id}`, data),
  delete: (id) => api.delete(`/new-projects/${id}`)
}

export default api
```

#### socketService.js - WebSocket客户端
```javascript
import io from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
  }
  
  connect(userId) {
    this.socket = io('http://localhost:5001', {
      withCredentials: true
    })
    
    this.socket.on('connect', () => {
      console.log('WebSocket已连接')
      this.socket.emit('join', userId)
    })
    
    this.socket.on('notification', (notification) => {
      // 处理通知
      console.log('收到通知:', notification)
    })
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
    }
  }
}

export default new SocketService()
```

---

### 3.5 状态管理 (store/)

**位置**：`/frontend/src/store/`

#### authStore.js - 认证状态 ⭐
```javascript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      
      login: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, isAuthenticated: true })
      },
      
      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, isAuthenticated: false })
      },
      
      updateUser: (user) => set({ user })
    }),
    {
      name: 'auth-storage'
    }
  )
)
```

---

## 四、关键代码文件索引

### 4.1 后端核心文件

| 功能模块 | 核心文件 | 代码行数（约） |
|---------|---------|--------------|
| 服务器入口 | `server.js` | 227 |
| 数据库配置 | `config/database.js` | 36 |
| 智能选型 | `controllers/selectionController.js` | 500+ |
| BOM展开 | `controllers/bomController.js` | 300+ |
| 生产排产 | `services/aps.service.js` | 400+ |
| JWT认证 | `middleware/auth.js` | 150 |
| WebSocket | `services/socketService.js` | 200 |

### 4.2 前端核心文件

| 功能模块 | 核心文件 | 代码行数（约） |
|---------|---------|--------------|
| 路由配置 | `App.jsx` | 178 |
| API服务 | `services/api.js` | 300+ |
| 认证状态 | `store/authStore.js` | 100 |
| 项目详情 | `pages/ProjectDetails.jsx` | 1000+ |
| 智能选型 | `pages/SelectionEngine.jsx` | 800+ |
| 产品目录 | `pages/ProductCatalog.jsx` | 497 |

---

## 五、开发规范

### 5.1 命名规范

**后端**：
- 文件名：camelCase（如 `userController.js`）
- 类名：PascalCase（如 `User`）
- 函数名：camelCase（如 `createUser`）
- 常量：UPPER_SNAKE_CASE（如 `JWT_SECRET`）

**前端**：
- 组件文件：PascalCase（如 `Dashboard.jsx`）
- 工具函数：camelCase（如 `formatDate.js`）
- CSS文件：kebab-case（如 `global-styles.css`）

### 5.2 代码注释

```javascript
/**
 * 计算阀门所需扭矩
 * @param {String} valveType - 阀门类型
 * @param {Number} valveSize - 阀门尺寸（英寸）
 * @param {Number} pressure - 工作压力（MPa）
 * @returns {Number} 所需扭矩（N·m）
 */
exports.calculateTorque = (valveType, valveSize, pressure) => {
  // 实现逻辑
}
```

---

© 2025 Project Ark Team. All Rights Reserved.

