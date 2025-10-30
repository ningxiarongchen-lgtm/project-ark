# 🚀 Cypress E2E 测试快速运行指南

## 📋 测试概览

| 测试文件 | 测试内容 | 涉及角色 | 预计时间 |
|---------|---------|---------|---------|
| `1_pre_sales_workflow.cy.js` | 售前协同流程 | 销售、技术、商务 | ~2-3分钟 |
| `2_in_sales_workflow.cy.js` | 销售中协同流程 | 销售、商务、生产、采购 | ~3-4分钟 |
| `3_admin_functions.cy.js` | 管理员核心功能 | 管理员、新员工 | ~2-3分钟 |

**总计**：3个测试套件，覆盖7个核心角色，约8-10分钟

---

## ⚡ 快速开始（3步）

### 1️⃣ 启动后端（测试环境）

```bash
cd backend
NODE_ENV=test npm start
```

**⚠️ 重要**：必须使用 `NODE_ENV=test` 才能启用测试路由！

### 2️⃣ 启动前端

在新终端中：

```bash
cd frontend
npm run dev
```

### 3️⃣ 运行测试

在新终端中：

```bash
cd frontend

# 方式A：使用 Cypress UI（推荐）
npx cypress open

# 方式B：命令行运行所有测试
npx cypress run

# 方式C：运行单个测试
npx cypress run --spec "cypress/e2e/1_pre_sales_workflow.cy.js"
```

---

## 📝 详细运行命令

### 运行所有测试（无头模式）

```bash
npx cypress run --spec "cypress/e2e/*.cy.js"
```

### 运行指定测试

```bash
# 阶段一：售前协同流程
npx cypress run --spec "cypress/e2e/1_pre_sales_workflow.cy.js"

# 阶段二：销售中协同流程
npx cypress run --spec "cypress/e2e/2_in_sales_workflow.cy.js"

# 阶段三：管理员功能
npx cypress run --spec "cypress/e2e/3_admin_functions.cy.js"
```

### 使用特定浏览器

```bash
# Chrome
npx cypress run --browser chrome

# Firefox
npx cypress run --browser firefox

# Edge
npx cypress run --browser edge
```

### 生成详细报告

```bash
npx cypress run --reporter spec
```

---

## 🎬 测试执行流程

### 阶段一：售前协同流程

```
1. 初始化测试环境
   ↓
2. 销售经理创建项目
   ↓
3. 技术工程师添加选型（2个方案）
   ↓
4. 商务工程师生成BOM和报价
   ↓
5. 销售经理验证报价状态
   ↓
6. 数据完整性验证
```

**验证点**：
- ✅ 项目创建成功
- ✅ 选型数据保存
- ✅ BOM自动生成
- ✅ 报价创建成功
- ✅ 权限控制正确

### 阶段二：销售中协同流程

```
1. 创建已报价项目（前置步骤）
   ↓
2. 销售经理标记赢单 + 创建订单
   ↓
3. 商务工程师确认收款 + 触发生产
   ↓
4. 生产计划员展开BOM + 生成采购需求
   ↓
5. 采购专员查看采购需求
```

**验证点**：
- ✅ 项目状态更新为赢单
- ✅ 合同订单创建
- ✅ 生产订单创建
- ✅ 采购需求生成
- ✅ 数据流转正确

### 阶段三：管理员功能

```
1. 管理员创建新用户
   ↓
2. 新用户首次登录（强制修改密码）
   ↓
3. 管理员重置用户密码
   ↓
4. 用户使用新密码登录
   ↓
5. 额外测试：
   - 管理员查看所有用户
   - 非管理员权限验证
```

**验证点**：
- ✅ 用户创建成功
- ✅ 密码修改强制执行
- ✅ 密码重置成功
- ✅ 新密码可登录
- ✅ 权限控制正确

---

## 📊 测试结果查看

### 命令行模式

测试结果会直接显示在终端中：

```
  Pre-sales Collaboration Workflow
    ✓ should flow seamlessly from Sales, to Tech, to Sales Engineer (45123ms)

  In-sales Collaboration Workflow
    ✓ should flow from deal won, to order creation, to production and procurement (52341ms)

  Administrator Core Functions
    ✓ should allow admin to create a new user and reset password (31245ms)
    ✓ should allow admin to view and manage all users (8234ms)
    ✓ should prevent non-admin users from accessing user management (6789ms)

  5 passing (2m 24s)
```

### 视频和截图

失败的测试会自动保存：
- **视频**：`frontend/cypress/videos/`
- **截图**：`frontend/cypress/screenshots/`

### Cypress UI 模式

使用 `npx cypress open` 可以：
- 实时查看测试执行
- 查看每个步骤的DOM快照
- 查看网络请求
- 时间旅行调试

---

## 🔧 故障排查

### 问题1：测试用户创建失败

**症状**：`⚠️ 测试用户创建接口不可用`

**解决方案**：
```bash
# 确保后端使用测试环境启动
cd backend
NODE_ENV=test npm start
```

### 问题2：找不到元素

**症状**：`AssertionError: Timed out retrying: Expected to find element`

**解决方案**：
1. 检查前端是否正常运行：`http://localhost:5173`
2. 查看 Cypress 截图了解实际页面状态
3. 增加等待时间或检查选择器

### 问题3：登录失败

**症状**：登录后停留在登录页

**可能原因**：
1. 测试用户未创建
2. 密码不匹配
3. 后端未运行

**解决方案**：
```bash
# 手动创建测试用户
cd backend
NODE_ENV=test node seed_test_users.js

# 或在 Cypress 中运行
cy.seedTestUsers()
```

### 问题4：端口冲突

**症状**：`EADDRINUSE: address already in use`

**解决方案**：
```bash
# 查找并关闭占用端口的进程
# MacOS/Linux
lsof -ti:5001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

---

## 🎯 测试策略

### 独立运行

每个测试都是独立的，包含：
1. 清理旧数据
2. 创建测试用户
3. 执行测试场景
4. 验证结果

### 顺序执行

虽然测试是独立的，但建议按顺序运行：

1. **阶段一** → 验证基础售前流程
2. **阶段二** → 验证销售到生产流程
3. **阶段三** → 验证管理员功能

### 并行执行

如果需要加速测试，可以并行运行：

```bash
# 使用 Cypress 并行功能（需要 Cypress Cloud）
npx cypress run --record --parallel
```

---

## 📈 持续集成（CI/CD）

### GitHub Actions 示例

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  cypress:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend && npm install
          cd ../frontend && npm install
      
      - name: Start backend
        run: cd backend && NODE_ENV=test npm start &
        
      - name: Start frontend
        run: cd frontend && npm run dev &
      
      - name: Wait for servers
        run: npx wait-on http://localhost:5001 http://localhost:5173
      
      - name: Run Cypress tests
        run: cd frontend && npx cypress run
      
      - name: Upload artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-videos
          path: frontend/cypress/videos
```

---

## 🔐 安全提示

**⚠️ 重要**：
- 测试环境仅用于开发和测试
- 不要在生产环境运行测试脚本
- 测试数据包含敏感信息（密码等），仅用于测试
- 定期清理测试数据

---

## 📞 获取帮助

遇到问题？
1. 查看 `E2E_TEST_GUIDE.md` 详细文档
2. 检查 Cypress 日志和截图
3. 查看后端日志：`backend/server.log`
4. 查看浏览器控制台

---

**最后更新**：2025-10-29  
**维护者**：Project Ark 团队  
**文档版本**：1.0

