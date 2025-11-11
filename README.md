# 智能制造管理系统 (C-MAX)

> 一个完整的智能制造管理系统，包含执行器选型、项目管理、合同管理、质检、生产计划等功能。

## 📋 目录

- [系统概述](#系统概述)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [部署指南](#部署指南)
- [系统功能](#系统功能)
- [角色权限](#角色权限)
- [数据管理](#数据管理)

---

## 系统概述

C-MAX 智能制造管理系统是一个为执行器制造企业设计的全流程管理平台，覆盖从销售、选型、生产到质检的完整业务流程。

### 核心特性

- ✅ **智能选型系统** - 基于扭矩、压力等参数自动推荐执行器型号
- ✅ **项目全生命周期管理** - 从询价到交付的完整跟踪
- ✅ **合同管理** - 合同创建、审批、执行状态跟踪
- ✅ **质检系统** - 多阶段质检流程，支持不合格品处理
- ✅ **生产计划** - 生产任务分配与进度跟踪
- ✅ **数据批量导入** - 支持 Excel 批量导入执行器、用户等数据
- ✅ **实时通知** - WebSocket 实时消息推送

---

## 技术栈

### 前端
- **框架**: React 18
- **UI 库**: Ant Design 5
- **构建工具**: Vite 5
- **状态管理**: Zustand
- **路由**: React Router v6
- **HTTP 客户端**: Axios

### 后端
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MongoDB (Mongoose ODM)
- **认证**: JWT
- **实时通信**: Socket.io
- **文件处理**: XLSX, Multer

### 部署
- **前端**: Cloudflare Pages
- **后端**: Render
- **数据库**: MongoDB Atlas

---

## 快速开始

### 环境要求

- Node.js >= 16
- MongoDB >= 5.0
- npm 或 yarn

### 本地开发

#### 1. 克隆项目

```bash
git clone https://github.com/ningxiarongchen-lgtm/project-ark.git
cd project-ark
```

#### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

#### 3. 配置环境变量

**后端 `.env` 文件** (`backend/.env`):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cmax
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=http://localhost:5173
```

**前端环境变量** (`frontend/.env`):

```env
VITE_API_URL=http://localhost:5000/api
```

#### 4. 启动服务

```bash
# 启动后端 (在 backend 目录)
npm run dev

# 启动前端 (在 frontend 目录)
npm run dev
```

访问 http://localhost:5173 查看应用。

### 默认管理员账号

- **手机号**: `13800000000`
- **密码**: `admin123`

---

## 部署指南

### 前端部署 (Cloudflare Pages)

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** > **Create a project**
3. 连接 GitHub 仓库
4. 配置构建设置：
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/dist`
5. 添加环境变量：
   - `VITE_API_URL`: 后端 API 地址

### 后端部署 (Render)

1. 登录 [Render Dashboard](https://dashboard.render.com/)
2. 创建新的 **Web Service**
3. 连接 GitHub 仓库
4. 配置：
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Node
5. 添加环境变量：
   - `MONGODB_URI`: MongoDB 连接字符串
   - `JWT_SECRET`: JWT 密钥
   - `CORS_ORIGIN`: 前端域名
   - `NODE_ENV`: `production`

### 数据库 (MongoDB Atlas)

1. 注册 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 创建免费集群
3. 配置网络访问（允许所有 IP: `0.0.0.0/0`）
4. 创建数据库用户
5. 获取连接字符串并配置到后端环境变量

---

## 系统功能

### 1. 智能选型系统

- **自动选型**: 输入工况参数，系统自动推荐合适的执行器型号
- **手动选型**: 支持手动选择执行器型号
- **批量选型**: 通过 Excel 批量导入选型需求
- **选型历史**: 查看历史选型记录

### 2. 项目管理

- **项目创建**: 销售经理创建项目
- **项目分配**: 分配技术工程师和商务工程师
- **项目跟踪**: 实时查看项目进度
- **项目统计**: 项目数量、金额统计

### 3. 合同管理

- **合同创建**: 商务工程师创建合同
- **合同审批**: 管理员审批合同
- **合同执行**: 跟踪合同执行状态
- **合同归档**: 完成后自动归档

### 4. 质检系统

- **多阶段质检**: 支持来料检验、过程检验、成品检验
- **质检任务**: 自动生成质检任务
- **不合格处理**: 不合格品返工、报废流程
- **质检报告**: 生成质检报告

### 5. 生产计划

- **生产任务**: 创建生产任务
- **任务分配**: 分配给车间工人
- **进度跟踪**: 实时更新生产进度
- **完工确认**: 工人完工后提交确认

### 6. 数据管理

- **批量导入**: 支持 Excel 批量导入数据
- **数据导出**: 导出数据为 Excel
- **模板下载**: 下载标准导入模板
- **数据验证**: 导入时自动验证数据

---

## 角色权限

### Administrator (管理员)
- 完整系统访问权限
- 用户管理
- 数据管理
- 系统配置

### Sales Manager (销售经理)
- 创建项目
- 查看产品目录
- 项目跟踪
- 客户管理

### Technical Engineer (技术工程师)
- 执行器选型
- 技术方案设计
- 项目技术支持
- 选型历史查询

### Business Engineer (商务工程师)
- 合同管理
- 报价管理
- 项目商务跟踪
- 合同统计

### Production Planner (生产计划员)
- 生产计划制定
- 生产任务分配
- 进度跟踪
- 资源调度

### Quality Inspector (质检员)
- 质检任务执行
- 质检报告填写
- 不合格品处理
- 质检统计

### Workshop Worker (车间工人)
- 查看生产任务
- 更新任务进度
- 完工确认
- 工时记录

### Procurement Specialist (采购专员)
- 采购需求管理
- 供应商管理
- 采购订单
- 库存查询

---

## 数据管理

### 执行器数据导入

系统支持三个系列的执行器：
- **SF 系列** (拨叉式) - 适用于球阀、蝶阀
- **AT 系列** (齿轮齿条) - 适用于闸阀、截止阀
- **GY 系列** (齿轮齿条) - 适用于直行程调节阀

#### 导入步骤

1. 登录管理员账号
2. 进入 **数据管理** > **执行器管理**
3. 点击 **下载模板** 选择对应系列
4. 填写 Excel 模板
5. 点击 **选择文件** 上传
6. 点击 **开始导入**

#### 模板字段说明

**基础信息**:
- 型号 (model_base) - 必填
- 系列 (series) - SF/AT/GY
- 机构类型 (mechanism) - Rack & Pinion / Scotch Yoke
- 阀门类型 (valve_type) - Ball Valve / Butterfly Valve / Gate Valve 等
- 作用类型 (action_type) - DA / SR

**技术参数**:
- 本体尺寸 (body_size)
- 扭矩数据 (torque_data)
- 尺寸数据 (dimensions)

**价格信息**:
- 常温标准价 (base_price_normal)
- 低温标准价 (base_price_low)
- 高温标准价 (base_price_high)

### 用户数据导入

1. 下载用户导入模板
2. 填写用户信息：
   - 手机号 (必填，11位)
   - 姓名
   - 角色
   - 部门
3. 上传并导入

### 批量导出

- 勾选需要导出的记录
- 点击 **下载选中** 按钮
- 系统生成 Excel 文件并下载

---

## 常见问题

### 1. 登录失败

**问题**: 提示"用户名或密码错误"

**解决**:
- 确认手机号和密码正确
- 检查账号是否已激活
- 联系管理员重置密码

### 2. 选型失败

**问题**: 选型时提示"未找到合适的执行器"

**解决**:
- 检查输入的工况参数是否合理
- 确认数据库中有对应系列的执行器数据
- 尝试调整安全系数

### 3. 导入失败

**问题**: Excel 导入时报错

**解决**:
- 确认使用最新的模板
- 检查必填字段是否完整
- 确认数据格式正确（如手机号11位）
- 查看错误提示，修正后重新导入

### 4. 部署问题

**问题**: 部署后无法访问

**解决**:
- 检查环境变量配置
- 确认数据库连接正常
- 查看服务器日志
- 检查 CORS 配置

---

## 开发指南

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循 Airbnb JavaScript Style Guide
- 组件使用函数式组件 + Hooks
- 使用 async/await 处理异步操作

### 提交规范

```bash
# 功能开发
git commit -m "feat: 添加用户批量导出功能"

# Bug 修复
git commit -m "fix: 修复登录页面跳转问题"

# 文档更新
git commit -m "docs: 更新 README 部署说明"

# 样式调整
git commit -m "style: 优化产品目录页面布局"
```

### 分支管理

- `main` - 生产环境分支
- `develop` - 开发分支
- `feature/*` - 功能开发分支
- `hotfix/*` - 紧急修复分支

---

## 许可证

本项目采用 MIT 许可证。

---

## 联系方式

如有问题或建议，请联系：
- **项目负责人**: 何晓晓
- **GitHub**: https://github.com/ningxiarongchen-lgtm/project-ark

---

**最后更新**: 2025-11-11
