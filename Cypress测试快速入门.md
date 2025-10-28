# Cypress E2E 测试快速入门指南

## 🚀 5分钟快速开始

### 第一步：安装 Cypress

```bash
cd frontend
npm install --save-dev cypress
```

### 第二步：创建测试用户

```bash
cd backend
node scripts/create-test-users.js
```

你将看到：

```
✅ 创建成功: admin (Administrator)
✅ 创建成功: tech_engineer (Technical Engineer)
✅ 创建成功: sales_engineer (Sales Engineer)
...
```

### 第三步：启动服务

**终端 1** - 启动后端：
```bash
cd backend
npm start
```

**终端 2** - 启动前端：
```bash
cd frontend
npm run dev
```

### 第四步：运行测试

**交互式模式**（推荐）：
```bash
cd frontend
npm run cypress:open
```

**无头模式**：
```bash
cd frontend
npm run cypress:run
```

---

## 📋 测试用户凭证

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `admin123` |
| 技术工程师 | `tech_engineer` | `tech123` |
| 商务工程师 | `sales_engineer` | `sales123` |
| 销售经理 | `sales_manager` | `manager123` |
| 生产计划员 | `production_planner` | `prod123` |
| 采购专员 | `procurement` | `proc123` |
| 售后工程师 | `aftersales` | `after123` |

---

## 🎯 测试场景

### 多角色协同工作流测试

测试文件：`cypress/e2e/multi_role_collaboration.cy.js`

**测试流程**：

```
1. 技术工程师创建项目
   ↓
2. 技术工程师添加选型
   ↓
3. 商务工程师生成 BOM
   ↓
4. 商务工程师生成报价
   ↓
5. 销售经理审批报价
   ↓
6. 销售经理标记赢单
   ↓
7. 销售经理创建订单
   ↓
8. 生产计划员创建生产订单
   ↓
9. 生产计划员开始生产
   ↓
10. 售后工程师创建工单
   ↓
11. 管理员全局监控
```

**测试覆盖**：
- ✅ 7个角色的登录和登出
- ✅ 完整的项目生命周期
- ✅ 权限控制验证
- ✅ 跨角色协同工作流

---

## 🎮 运行测试的三种方式

### 方式1：交互式测试（开发推荐）

```bash
npm run cypress:open
```

**优点**：
- 可视化界面，直观易用
- 实时查看测试执行过程
- 方便调试和截图
- 支持时间旅行调试

**适用场景**：
- 编写新测试
- 调试失败的测试
- 学习和探索

### 方式2：无头模式（CI/CD推荐）

```bash
npm run cypress:run
```

**优点**：
- 快速执行
- 自动录制视频
- 适合自动化流程
- 生成详细报告

**适用场景**：
- CI/CD 流程
- 批量测试
- 定期自动化测试

### 方式3：指定浏览器

```bash
npm run cypress:run:chrome
npm run cypress:run:firefox
```

**优点**：
- 跨浏览器测试
- 验证兼容性

---

## 📁 项目结构

```
frontend/
├── cypress/
│   ├── e2e/
│   │   └── multi_role_collaboration.cy.js  # 🎯 主测试文件
│   ├── fixtures/
│   │   ├── test-users.json                  # 测试用户
│   │   └── test-project.json                # 测试数据
│   ├── support/
│   │   ├── commands.js                      # 🔧 自定义命令
│   │   └── e2e.js                           # 全局配置
│   ├── videos/                              # 📹 测试视频
│   ├── screenshots/                         # 📸 测试截图
│   └── README.md                            # 详细文档
├── cypress.config.js                        # ⚙️ Cypress 配置
└── package.json
```

---

## 🛠️ 自定义命令示例

### 登录登出

```javascript
// 以管理员身份登录
cy.loginAs('admin')

// 登出
cy.logout()
```

### 项目管理

```javascript
// 创建项目
cy.createProject({
  name: '测试项目',
  client: '测试客户',
  contact: '张三',
  phone: '13800138000'
})

// 添加选型
cy.addSelectionToProject('测试项目', {
  actuatorType: 'AT',
  valveSize: '150'
})

// 生成 BOM
cy.generateBOM()

// 生成报价
cy.generateQuote('测试项目')
```

### 权限验证

```javascript
// 检查页面访问权限
cy.checkPageAccess(true)   // 应该有权限
cy.checkPageAccess(false)  // 不应该有权限

// 检查按钮是否存在
cy.checkButtonExists('编辑', true)
cy.checkButtonExists('删除', false)
```

---

## 📊 查看测试结果

### 终端输出

测试运行时，终端会显示：
```
  Multi-Role Collaboration Workflow
    Stage 1: Technical Engineer
      ✓ 1.1 - 技术工程师登录系统 (1234ms)
      ✓ 1.2 - 创建新项目 (2345ms)
      ✓ 1.3 - 添加阀门选型 (1567ms)
    ...
```

### 视频录制

测试完成后查看：
```bash
open cypress/videos/multi_role_collaboration.cy.js.mp4
```

### 截图

如果测试失败，查看：
```bash
open cypress/screenshots/multi_role_collaboration.cy.js/
```

---

## 🐛 常见问题速查

### ❌ 问题：Cannot find module 'cypress'

**解决**：
```bash
npm install --save-dev cypress
```

### ❌ 问题：测试用户登录失败

**解决**：
```bash
# 重新创建测试用户
cd backend
node scripts/create-test-users.js
```

### ❌ 问题：Cannot connect to localhost:5173

**解决**：
```bash
# 确保前端服务正在运行
cd frontend
npm run dev
```

### ❌ 问题：API requests timeout

**解决**：
```bash
# 确保后端服务正在运行
cd backend
npm start
```

### ❌ 问题：元素未找到

**解决**：
在测试中增加等待时间：
```javascript
cy.get('.my-element', { timeout: 10000 })
cy.wait(1000)
```

---

## 💡 测试技巧

### 1. 使用 cy.pause() 调试

```javascript
it('调试测试', () => {
  cy.loginAs('admin')
  cy.pause()  // 测试在这里暂停，可以手动操作
  cy.visit('/projects')
})
```

### 2. 查看网络请求

```javascript
cy.intercept('POST', '/api/projects').as('createProject')
cy.wait('@createProject').then((interception) => {
  console.log('请求:', interception.request.body)
  console.log('响应:', interception.response.body)
})
```

### 3. 使用截图

```javascript
cy.screenshot('项目创建后')
```

### 4. 添加清晰的日志

```javascript
cy.log('🔐 正在以管理员身份登录...')
cy.log('📋 正在创建新项目...')
cy.log('✅ 项目创建成功')
```

---

## 📚 下一步

### 学习更多

- 📖 查看 `cypress/README.md` 了解详细文档
- 🔧 学习自定义命令：`cypress/support/commands.js`
- 🎯 研究测试代码：`cypress/e2e/multi_role_collaboration.cy.js`

### 编写新测试

```javascript
// 在 cypress/e2e/ 创建新测试文件
describe('My New Test', () => {
  it('应该能够...', () => {
    cy.loginAs('admin')
    // 你的测试代码
  })
})
```

### 扩展测试

- 添加更多角色场景
- 测试错误处理
- 测试边界情况
- 添加性能测试

---

## 🎯 快速命令参考

```bash
# 安装
npm install --save-dev cypress

# 创建测试用户
node backend/scripts/create-test-users.js

# 启动服务
npm run dev                 # 前端
npm start                   # 后端

# 运行测试
npm run cypress:open        # 交互式
npm run cypress:run         # 无头模式
npm run cypress:run:chrome  # Chrome 浏览器
npm run cypress:run:firefox # Firefox 浏览器

# 查看结果
open cypress/videos/        # 视频
open cypress/screenshots/   # 截图
```

---

## 📞 获取帮助

- 📖 查看 `cypress/README.md` 详细文档
- 🌐 访问 [Cypress 官方文档](https://docs.cypress.io/)
- 💬 联系开发团队

---

**祝测试顺利！** 🎉

**最后更新**: 2025-10-28

