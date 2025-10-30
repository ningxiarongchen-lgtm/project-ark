# Project Ark E2E 测试指南

## 📋 概述

本指南介绍如何运行 Project Ark 平台的端到端（E2E）测试。测试分为多个阶段，逐步验证各个核心业务流程。

## 🎯 测试阶段

### ✅ 阶段一：售前核心协同流程（已完成）
**文件**：`cypress/e2e/1_pre_sales_workflow.cy.js`

**覆盖流程**：
1. 销售经理 → 创建项目并发起需求
2. 技术工程师 → 进行技术选型和方案设计
3. 商务工程师 → 生成BOM、核算成本、制作报价
4. 销售经理 → 验证报价状态

**涉及角色**：
- 👔 销售经理 (Sales Manager)
- 🔧 技术工程师 (Technical Engineer)
- 💼 商务工程师 (Sales Engineer)

### ✅ 阶段二：销售中协同流程（已完成）
**文件**：`cypress/e2e/2_in_sales_workflow.cy.js`

**覆盖流程**：
1. 销售经理 → 确认赢单并创建订单
2. 商务工程师 → 确认收款并触发生产
3. 生产计划员 → 展开BOM并生成采购需求
4. 采购专员 → 查看采购需求

**涉及角色**：
- 👔 销售经理 (Sales Manager)
- 💼 商务工程师 (Sales Engineer)
- 🏭 生产计划员 (Production Planner)
- 📦 采购专员 (Procurement Specialist)

### ✅ 阶段三：管理员核心功能（已完成）
**文件**：`cypress/e2e/3_admin_functions.cy.js`

**覆盖流程**：
1. 管理员 → 创建新用户
2. 新用户 → 首次登录（强制修改密码）
3. 管理员 → 重置用户密码
4. 用户 → 使用新密码登录

**额外测试**：
- 管理员查看和管理所有用户
- 验证非管理员无法访问用户管理

**涉及角色**：
- 👑 系统管理员 (Administrator)
- 👤 新员工 (Shop Floor Worker)
- 👔 非管理员用户（权限验证）

### 🔄 阶段四：生产和售后流程（待创建）
**覆盖流程**：
- 质检员 → 质量检查
- 物流专员 → 发货管理
- 售后工程师 → 创建和处理服务工单
- 车间工人 → 生产执行

## 🚀 快速开始

### 1. 启动测试环境后端

```bash
cd backend
NODE_ENV=test npm start
```

**重要**：必须使用 `NODE_ENV=test` 才能启用测试路由！

### 2. 启动前端开发服务器

```bash
cd frontend
npm run dev
```

### 3. 运行 Cypress 测试

#### 方式 A：使用 Cypress UI（推荐，可视化）

```bash
cd frontend
npx cypress open
```

然后选择 E2E Testing → 选择浏览器 → 运行 `phase1_presales_workflow.cy.js`

#### 方式 B：命令行运行（无头模式）

```bash
cd frontend
npx cypress run --spec "cypress/e2e/phase1_presales_workflow.cy.js"
```

## 📦 测试数据结构

### 测试数据文件：`cypress/fixtures/test_data.json`

```json
{
  "users": {
    "admin": { "phone": "18800000000", "password": "Password123!", ... },
    "salesManager": { "phone": "18800000001", ... },
    "techEngineer": { "phone": "18800000002", ... },
    ...
  },
  "projectTemplate": { ... },
  "selectionTemplate": { ... },
  "orderTemplate": { ... },
  "productionTemplate": { ... },
  "serviceTicketTemplate": { ... }
}
```

### 测试用户账户

| 角色 | 姓名 | 手机号 | 密码 |
|------|------|---------|------|
| 系统管理员 | 系统管理员 | 18800000000 | Password123! |
| 销售经理 | 销售-张三 | 18800000001 | Password123! |
| 技术工程师 | 技术-李四 | 18800000002 | Password123! |
| 商务工程师 | 商务-王五 | 18800000003 | Password123! |
| 采购专员 | 采购-赵六 | 18800000004 | Password123! |
| 生产计划员 | 生产-孙七 | 18800000005 | Password123! |
| 质检员 | 质检-周八 | 18800000006 | Password123! |
| 物流专员 | 物流-吴九 | 18800000007 | Password123! |
| 售后工程师 | 售后-郑十 | 18800000008 | Password123! |
| 车间工人 | 工人-陈十一 | 18800000009 | Password123! |

## 🔧 自定义 Cypress 命令

### 测试环境初始化

```javascript
// 初始化测试环境（创建用户 + 清理旧数据）
cy.initTestEnvironment()

// 或者只创建测试用户
cy.seedTestUsers()
```

### 用户登录

```javascript
// 使用角色登录（自动从 test_data.json 读取）
cy.loginAs('salesManager')
cy.loginAs('techEngineer')
cy.loginAs('salesEngineer')
cy.loginAs('admin')
```

### 数据清理

```javascript
// 清理特定前缀的测试数据
cy.cleanupTestData('Test-Project-')

// 清空所有测试数据（危险操作）
cy.cleanupAllTestData()
```

### 获取测试环境状态

```javascript
cy.getTestingStatus().then((status) => {
  cy.log(`当前有 ${status.database.projects} 个项目`)
})
```

### 创建已报价项目（快捷命令）

```javascript
// 快速创建一个已报价的项目（包含完整售前流程）
cy.createQuotedProject('Test-Project-123').then((projectId) => {
  cy.log(`已创建项目: ${projectId}`)
  // 继续后续测试...
})

// 或使用别名
cy.createQuotedProject('Test-Project-456')
cy.get('@quotedProjectId').then((projectId) => {
  cy.visit(`/projects/${projectId}`)
})
```

这个命令会自动执行：
1. 销售经理创建项目
2. 技术工程师添加选型
3. 商务工程师生成BOM和报价

非常适合用于需要已报价项目的测试场景（如阶段二测试）。

## 🔑 关键测试 API

### 后端测试接口（仅在 NODE_ENV=test 时可用）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/testing/seed-users` | POST | 创建测试用户 |
| `/api/testing/cleanup` | POST | 清理特定前缀的测试数据 |
| `/api/testing/cleanup-all` | DELETE | 清空所有测试数据 |
| `/api/testing/status` | GET | 获取测试环境状态 |

### 示例：手动创建测试用户

```bash
curl -X POST http://localhost:5001/api/testing/seed-users \
  -H "Content-Type: application/json" \
  -d @frontend/cypress/fixtures/test_data.json
```

## 📊 测试报告

### 运行后查看结果

- **UI 模式**：实时查看测试执行过程
- **无头模式**：
  - 视频录制：`frontend/cypress/videos/`
  - 失败截图：`frontend/cypress/screenshots/`

### CI/CD 集成

```yaml
# .github/workflows/e2e-test.yml
- name: Run E2E Tests
  run: |
    cd backend && NODE_ENV=test npm start &
    cd frontend && npm run dev &
    npx cypress run
```

## 🛡️ 测试最佳实践

### 1. 测试隔离
每个测试使用唯一的项目名称（带时间戳）：
```javascript
const projectName = `Test-Project-${Date.now()}`
```

### 2. 测试清理
在 `before()` 钩子中初始化环境：
```javascript
before(() => {
  cy.initTestEnvironment()
})
```

### 3. 数据验证
在测试结束时验证数据完整性：
```javascript
after(() => {
  // 验证项目、订单、BOM等数据都已正确创建
})
```

### 4. 权限验证
每个角色都应该验证其权限边界：
```javascript
// 验证销售经理看不到"提交选型方案"按钮
cy.get('body').should('not.contain', '提交选型方案')
```

## 🐛 故障排查

### 问题 1：测试用户创建失败

**症状**：`⚠️ 测试用户创建接口不可用`

**解决方案**：
```bash
# 确保后端使用测试环境启动
cd backend
NODE_ENV=test npm start
```

### 问题 2：找不到测试数据

**症状**：`Error: Unknown user type: salesManager`

**解决方案**：
1. 检查 `frontend/cypress/fixtures/test_data.json` 是否存在
2. 确认文件格式正确（有效的 JSON）

### 问题 3：登录失败

**症状**：登录后停留在登录页

**可能原因**：
1. 密码不匹配（检查 test_data.json）
2. 用户未创建（运行 `cy.seedTestUsers()`）
3. 后端未运行

## 📝 添加新测试

### 创建新的测试阶段

```javascript
describe('阶段二：生产协同流程', () => {
  before(() => {
    cy.fixture('test_data.json').then((data) => {
      testData = data
    })
    cy.initTestEnvironment()
  })

  context('场景1：生产计划员安排生产', () => {
    it('登录并创建生产订单', () => {
      cy.loginAs('planner')
      // ... 测试逻辑
    })
  })
})
```

## 🎯 下一步

1. ✅ **阶段一测试**已完成 - 售前核心协同流程
2. 🔄 **待创建**：阶段二测试 - 生产协同流程
3. 🔄 **待创建**：阶段三测试 - 售后服务流程
4. 🔄 **待创建**：完整端到端测试 - 覆盖所有角色

## 💡 提示

- 使用 `cy.log()` 添加详细日志，便于调试
- 测试应该是**幂等的**（可重复运行）
- 使用有意义的测试名称和描述
- 每个测试应该验证一个明确的行为或功能
- 保持测试独立，不依赖其他测试的执行顺序

## 📞 支持

如有问题，请检查：
1. 后端日志：查看 `[测试用户]` 和 `[测试清理]` 相关日志
2. Cypress 控制台：查看详细的错误信息
3. 网络请求：在 Cypress UI 中查看 API 调用

---

**最后更新**：2025-10-29
**维护者**：Project Ark 团队

