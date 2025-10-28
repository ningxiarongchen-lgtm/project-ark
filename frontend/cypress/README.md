# Cypress E2E 测试文档

## 📋 概述

本项目使用 Cypress 进行端到端（E2E）测试，模拟多角色协同工作流，验证系统的完整性和权限控制。

## 🎯 测试目标

### 核心测试场景

**多角色协同工作流** (`multi_role_collaboration.cy.js`)

模拟一个项目从创建到生产的完整生命周期，涉及 7 个角色：

1. **Technical Engineer** (技术工程师) - 创建项目、进行选型
2. **Sales Engineer** (商务工程师) - 生成 BOM、生成报价
3. **Sales Manager** (销售经理) - 审批报价、标记赢单、创建订单
4. **Production Planner** (生产计划员) - 创建生产订单、管理生产进度
5. **Procurement Specialist** (采购专员) - 管理供应商
6. **After-sales Engineer** (售后工程师) - 创建和处理售后工单
7. **Administrator** (管理员) - 全局管理和监控

### 测试覆盖

- ✅ 多角色登录和登出
- ✅ 权限控制验证（页面级、功能级、按钮级）
- ✅ 项目创建和管理
- ✅ 选型引擎和 BOM 生成
- ✅ 报价生成和审批流程
- ✅ 订单创建和管理
- ✅ 生产排期和进度跟踪
- ✅ 售后工单管理
- ✅ 供应商管理
- ✅ 跨角色协同工作流

---

## 🚀 快速开始

### 前置条件

1. **Node.js** >= 16.x
2. **后端服务** 运行在 `http://localhost:5000`
3. **前端应用** 运行在 `http://localhost:5173`
4. **测试用户** 已在数据库中创建

### 安装 Cypress

```bash
cd frontend
npm install --save-dev cypress
```

### 目录结构

```
frontend/
├── cypress/
│   ├── e2e/
│   │   └── multi_role_collaboration.cy.js  # 主测试文件
│   ├── fixtures/
│   │   ├── test-users.json                  # 测试用户数据
│   │   └── test-project.json                # 测试项目数据
│   ├── support/
│   │   ├── commands.js                      # 自定义命令
│   │   └── e2e.js                           # 全局配置
│   └── README.md                            # 本文档
├── cypress.config.js                        # Cypress 配置
└── package.json
```

---

## 🎮 运行测试

### 方法 1: 交互式模式（推荐用于开发）

```bash
npm run cypress:open
```

1. Cypress Test Runner 将打开
2. 点击 "E2E Testing"
3. 选择浏览器（推荐 Chrome）
4. 点击 `multi_role_collaboration.cy.js` 运行测试

### 方法 2: 无头模式（推荐用于 CI/CD）

```bash
npm run cypress:run
```

### 方法 3: 运行特定测试

```bash
npx cypress run --spec "cypress/e2e/multi_role_collaboration.cy.js"
```

### 方法 4: 指定浏览器

```bash
npx cypress run --browser chrome
npx cypress run --browser firefox
npx cypress run --browser edge
```

---

## ⚙️ 配置

### 环境变量

在 `cypress.config.js` 中配置：

```javascript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',  // 前端 URL
    env: {
      apiUrl: 'http://localhost:5000/api',  // 后端 API URL
      testUsers: {
        // 测试用户配置
      }
    }
  }
})
```

### 测试用户配置

确保以下测试用户已在数据库中创建：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| `admin` | `admin123` | Administrator |
| `tech_engineer` | `tech123` | Technical Engineer |
| `sales_engineer` | `sales123` | Sales Engineer |
| `sales_manager` | `manager123` | Sales Manager |
| `production_planner` | `prod123` | Production Planner |
| `procurement` | `proc123` | Procurement Specialist |
| `aftersales` | `after123` | After-sales Engineer |

### 创建测试用户脚本

运行以下脚本创建测试用户（在后端目录）：

```bash
cd backend
node scripts/create-test-users.js
```

---

## 📝 自定义命令

我们创建了一系列自定义命令来简化测试编写：

### 认证命令

```javascript
// 以特定角色登录
cy.loginAs('admin')
cy.loginAs('technicalEngineer')
cy.loginAs('salesManager')

// 登出
cy.logout()
```

### 项目管理命令

```javascript
// 创建项目
cy.createProject({
  name: '测试项目',
  client: '测试客户',
  contact: '张三',
  phone: '13800138000'
})

// 添加选型
cy.addSelectionToProject('项目名称', {
  actuatorType: 'AT',
  valveSize: '150',
  pressure: '16',
  temperature: '120',
  torque: '800'
})

// 生成 BOM
cy.generateBOM()

// 生成报价
cy.generateQuote('项目名称')

// 审批报价
cy.approveQuote('项目名称')

// 标记赢单
cy.markAsWon('项目名称')
```

### 订单管理命令

```javascript
// 创建销售订单
cy.createSalesOrder('项目名称')

// 创建生产订单
cy.createProductionOrder('订单号')

// 更新生产状态
cy.updateProductionStatus('生产订单号', 'In Production')
```

### 售后服务命令

```javascript
// 创建售后工单
cy.createServiceTicket({
  type: 'Maintenance',
  priority: 'High',
  customer: '客户名称',
  phone: '13800138000',
  title: '问题标题',
  description: '问题描述'
})
```

### 权限验证命令

```javascript
// 检查页面访问权限
cy.checkPageAccess(true)   // 应该有权限
cy.checkPageAccess(false)  // 不应该有权限

// 检查按钮是否存在
cy.checkButtonExists('编辑', true)   // 应该存在
cy.checkButtonExists('删除', false)  // 不应该存在
```

---

## 🧪 测试流程详解

### 阶段 1: 技术工程师（Technical Engineer）

```javascript
describe('Stage 1: Technical Engineer', () => {
  it('登录系统', () => {
    cy.loginAs('technicalEngineer')
  })
  
  it('创建新项目', () => {
    cy.createProject(projectData)
  })
  
  it('添加阀门选型', () => {
    cy.addSelectionToProject(projectName, selectionData)
  })
  
  it('提交技术方案', () => {
    // 提交方案给商务工程师
  })
  
  it('登出', () => {
    cy.logout()
  })
})
```

### 阶段 2: 商务工程师（Sales Engineer）

```javascript
describe('Stage 2: Sales Engineer', () => {
  it('登录系统', () => {
    cy.loginAs('salesEngineer')
  })
  
  it('生成 BOM 清单', () => {
    cy.generateBOM()
  })
  
  it('生成项目报价', () => {
    cy.generateQuote(projectName)
  })
  
  it('完成报价，通知销售经理', () => {
    // 提交报价给销售经理审批
  })
  
  it('登出', () => {
    cy.logout()
  })
})
```

### 阶段 3: 销售经理（Sales Manager）

```javascript
describe('Stage 3: Sales Manager', () => {
  it('登录系统', () => {
    cy.loginAs('salesManager')
  })
  
  it('审批项目报价', () => {
    cy.approveQuote(projectName)
  })
  
  it('标记项目为赢单', () => {
    cy.markAsWon(projectName)
  })
  
  it('生成销售订单', () => {
    cy.createSalesOrder(projectName)
  })
  
  it('登出', () => {
    cy.logout()
  })
})
```

### 阶段 4: 生产计划员（Production Planner）

```javascript
describe('Stage 4: Production Planner', () => {
  it('登录系统', () => {
    cy.loginAs('productionPlanner')
  })
  
  it('创建生产订单', () => {
    cy.createProductionOrder(orderNumber)
  })
  
  it('开始生产', () => {
    cy.updateProductionStatus(productionOrderNumber, 'In Production')
  })
  
  it('登出', () => {
    cy.logout()
  })
})
```

### 阶段 5-7: 其他角色

类似地实现采购专员、售后工程师和管理员的测试流程。

---

## 📊 测试报告

### 查看测试结果

测试完成后，Cypress 会生成以下报告：

1. **终端输出** - 实时测试结果
2. **视频录制** - `cypress/videos/` 目录
3. **截图** - `cypress/screenshots/` 目录（仅失败时）
4. **Mochawesome 报告**（需配置）

### 生成 HTML 报告

安装 Mochawesome：

```bash
npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator
```

更新 `cypress.config.js`：

```javascript
reporter: 'mochawesome',
reporterOptions: {
  reportDir: 'cypress/reports',
  overwrite: false,
  html: true,
  json: true
}
```

运行测试并生成报告：

```bash
npm run cypress:run
npx mochawesome-merge cypress/reports/*.json -o cypress/reports/report.json
npx marge cypress/reports/report.json -o cypress/reports
```

---

## 🐛 调试技巧

### 1. 使用 `cy.pause()`

在测试中暂停执行：

```javascript
it('调试测试', () => {
  cy.loginAs('admin')
  cy.pause()  // 测试会在这里暂停
  cy.visit('/projects')
})
```

### 2. 使用 `cy.debug()`

打印调试信息：

```javascript
cy.get('.project-name').debug()
```

### 3. 查看网络请求

```javascript
cy.intercept('POST', '/api/projects').as('createProject')
cy.wait('@createProject').then((interception) => {
  console.log(interception.request.body)
  console.log(interception.response.body)
})
```

### 4. 截图

```javascript
cy.screenshot('my-screenshot')
```

### 5. Cypress Studio

在交互式模式下，使用 Cypress Studio 录制测试步骤。

---

## ⚠️ 常见问题

### Q1: 测试失败 - 元素未找到

**原因**: 元素选择器可能不正确或页面加载慢。

**解决方案**:
```javascript
// 增加超时时间
cy.get('.my-element', { timeout: 10000 })

// 等待元素出现
cy.contains('文本内容').should('be.visible')

// 使用 cy.wait()
cy.wait(1000)
```

### Q2: 登录失败

**原因**: 测试用户不存在或密码错误。

**解决方案**:
1. 确认测试用户已在数据库中创建
2. 检查 `cypress.config.js` 中的用户凭证
3. 手动尝试登录验证凭证

### Q3: API 请求超时

**原因**: 后端服务未运行或响应慢。

**解决方案**:
```javascript
// 增加请求超时时间
cy.visit('/projects', { timeout: 30000 })

// 在 cypress.config.js 中设置全局超时
requestTimeout: 10000,
responseTimeout: 10000
```

### Q4: 权限测试失败

**原因**: 权限配置未正确实施。

**解决方案**:
1. 检查前端 `RoleBasedAccess` 组件
2. 检查后端 `authorize` 中间件
3. 验证用户的角色字段正确

### Q5: 视频录制太大

**解决方案**:
```javascript
// 在 cypress.config.js 中禁用视频
video: false

// 或只在失败时录制
video: true,
videoCompression: 32
```

---

## 🔒 测试最佳实践

### 1. 独立性

每个测试应该独立运行，不依赖其他测试的结果。

❌ **不好**:
```javascript
let projectId  // 依赖全局变量

it('创建项目', () => {
  projectId = createProject()
})

it('更新项目', () => {
  updateProject(projectId)  // 依赖上一个测试
})
```

✅ **好**:
```javascript
it('更新项目', () => {
  const projectId = createProject()  // 每个测试自己创建依赖
  updateProject(projectId)
})
```

### 2. 清理数据

在 `after` 或 `afterEach` 中清理测试数据。

```javascript
after(() => {
  cy.loginAs('admin')
  cy.deleteTestData()
  cy.logout()
})
```

### 3. 明确的断言

使用清晰的断言验证预期结果。

```javascript
cy.contains('项目创建成功').should('be.visible')
cy.url().should('include', '/projects/')
cy.get('.project-status').should('have.text', '进行中')
```

### 4. 有意义的日志

使用 `cy.log()` 添加测试步骤说明。

```javascript
cy.log('🔐 Logging in as Technical Engineer')
cy.log('📋 Creating new project')
cy.log('✅ Project created successfully')
```

### 5. 使用自定义命令

将重复的操作封装为自定义命令。

```javascript
// 不好 - 重复代码
cy.get('input[name="username"]').type('admin')
cy.get('input[name="password"]').type('admin123')
cy.get('button[type="submit"]').click()

// 好 - 使用自定义命令
cy.loginAs('admin')
```

---

## 📚 参考资源

- [Cypress 官方文档](https://docs.cypress.io/)
- [Cypress 最佳实践](https://docs.cypress.io/guides/references/best-practices)
- [Cypress 示例](https://github.com/cypress-io/cypress-example-recipes)
- [Ant Design 测试指南](https://ant.design/docs/react/testing)

---

## 🆘 获取帮助

如果遇到问题，请：

1. 查看本文档的"常见问题"部分
2. 检查 Cypress 官方文档
3. 查看测试视频和截图了解失败原因
4. 联系开发团队

---

**最后更新**: 2025-10-28  
**维护者**: 开发团队

