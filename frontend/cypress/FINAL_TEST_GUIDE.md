# 🎯 终极验收测试使用指南

## 📋 概述

`final_acceptance_test.cy.js` 已经过**彻底重构**，现在采用最佳实践：

✅ **每个测试前自动重置数据库** - 使用 `beforeEach` hook  
✅ **完全独立的测试用例** - 无状态依赖  
✅ **清晰的测试场景组织** - 5个主要场景  
✅ **自动清理测试数据** - 使用 `afterEach` hook  

---

## 🔄 核心机制：beforeEach Hook

### 工作原理

```javascript
beforeEach(() => {
  // 在每个 it() 测试用例运行前执行
  cy.request({
    method: 'POST',
    url: 'http://localhost:5001/api/testing/reset-and-seed',
    body: { clearAll: true }
  });
});
```

### 确保的事项

1. ✅ **每个测试从相同的初始状态开始**
2. ✅ **测试之间完全隔离，无副作用**
3. ✅ **测试顺序无关紧要，可以单独运行**
4. ✅ **数据一致性，结果可预测**

---

## 📊 测试结构

### 5大测试场景

```
终极验收测试套件
├── 场景 1：用户认证与登录 (3个测试)
│   ├── 管理员登录
│   ├── 销售经理登录
│   └── 错误凭证拒绝
│
├── 场景 2：售前协同 - 项目创建 (2个测试)
│   ├── 创建新项目
│   └── 查看项目列表
│
├── 场景 3：技术选型 - 执行器选型 (2个测试)
│   ├── 访问产品库
│   └── 验证测试产品
│
├── 场景 4：数据一致性验证 (2个测试)
│   ├── 验证初始状态
│   └── 访问用户管理
│
└── 场景 5：完整业务流程 (1个测试)
    └── 端到端完整流程
```

**总计**: 10个独立测试用例

---

## 🚀 如何运行

### 前提条件

1. **启动测试环境后端**
   ```bash
   cd backend
   NODE_ENV=test npm start
   ```

2. **启动前端开发服务器**
   ```bash
   cd frontend
   npm run dev
   ```

### 运行测试

#### 方式 1: Cypress GUI（推荐）

```bash
cd frontend
npx cypress open
```

然后在 Cypress 界面中选择 `final_acceptance_test.cy.js`

#### 方式 2: 无头模式

```bash
cd frontend
npx cypress run --spec "cypress/e2e/final_acceptance_test.cy.js"
```

#### 方式 3: 运行特定场景

```bash
# 只运行登录测试
npx cypress run --spec "cypress/e2e/final_acceptance_test.cy.js" \
  --grep "场景 1"

# 只运行项目创建测试
npx cypress run --spec "cypress/e2e/final_acceptance_test.cy.js" \
  --grep "场景 2"
```

---

## 📝 测试详情

### 场景 1: 用户认证与登录

**测试数量**: 3个

#### 测试 1.1: 管理员登录
```javascript
手机号: 18800000001
密码: Test123456!
预期: 登录成功，跳转到非登录页面
```

#### 测试 1.2: 销售经理登录
```javascript
手机号: 18800000002
密码: Test123456!
预期: 登录成功，跳转到非登录页面
```

#### 测试 1.3: 错误凭证
```javascript
手机号: 18800000001
密码: WrongPassword123!
预期: 登录失败，显示错误消息
```

---

### 场景 2: 售前协同 - 项目创建

**测试数量**: 2个  
**登录角色**: 销售经理 (18800000002)

#### 测试 2.1: 创建新项目
1. 访问 `/projects`
2. 点击"新建"按钮
3. 填写项目名称: `E2E-Test-Project-{timestamp}`
4. 提交表单
5. 验证项目出现在列表中

#### 测试 2.2: 查看项目列表
1. 访问 `/projects`
2. 验证页面包含"项目"相关内容

---

### 场景 3: 技术选型 - 执行器选型

**测试数量**: 2个  
**登录角色**: 技术工程师 (18800000004)

#### 测试 3.1: 访问产品库
- 尝试访问 `/actuators` 或 `/products`
- 验证页面成功加载

#### 测试 3.2: 验证测试产品
- 检查页面是否包含测试产品型号
- 例如: SF10-DA, SF16-DA, AT100-DA

---

### 场景 4: 数据一致性验证

**测试数量**: 2个  
**登录角色**: 管理员 (18800000001)

#### 测试 4.1: 验证初始状态
- 调用 `/api/testing/status`
- 验证数据库中至少有10个用户
- 验证数据一致性

#### 测试 4.2: 用户管理页面
- 访问 `/admin/users`
- 验证只有管理员可访问

---

### 场景 5: 完整业务流程

**测试数量**: 1个  
**登录角色**: 销售经理 (18800000002)

完整的端到端流程：

```
步骤 1: 登录
   ↓
步骤 2: 访问项目管理页面
   ↓
步骤 3: 创建新项目
   ↓
步骤 4: 验证创建成功
```

---

## 🔧 自定义和扩展

### 添加新测试用例

```javascript
describe('场景 6：你的新场景', () => {
  
  beforeEach(() => {
    // 场景专用的 beforeEach（可选）
    cy.log('🔐 登录...');
    cy.visit('/login');
    cy.get('input[name="phone"]').type('18800000001');
    cy.get('input[name="password"]').type('Test123456!');
    cy.get('button[type="submit"]').click();
  });

  it('应该完成你的测试', () => {
    // 你的测试逻辑
    cy.visit('/your-page');
    // ...
  });
});
```

### 使用测试辅助函数

如果你导入了 `test-helpers.js`，可以使用：

```javascript
describe('场景 X', () => {
  
  beforeEach(() => {
    cy.resetDatabase();  // 可选：额外重置
    cy.loginAsRole('Administrator');  // 快捷登录
  });

  it('测试用例', () => {
    // 使用辅助函数
    cy.getTestData().then(data => {
      cy.log(`有 ${data.users.length} 个测试用户`);
    });
  });
});
```

---

## 📊 测试数据

### 默认测试用户

| 手机号 | 角色 | 密码 |
|--------|------|------|
| 18800000001 | Administrator | Test123456! |
| 18800000002 | Sales Manager | Test123456! |
| 18800000003 | Sales Engineer | Test123456! |
| 18800000004 | Technical Engineer | Test123456! |
| 18800000005 | Procurement Specialist | Test123456! |
| 18800000006 | Production Planner | Test123456! |
| 18800000007 | After-sales Engineer | Test123456! |
| 18800000008 | QA Inspector | Test123456! |
| 18800000009 | Logistics Specialist | Test123456! |
| 18800000010 | Shop Floor Worker | Test123456! |

### 默认供应商

- **苏阀自控** (SF) - 合作供应商
- **奥托尼克斯** (AT) - 合作供应商
- **临时供应商A** (TEMP-A) - 临时供应商

### 默认产品

- SF10-DA, SF16-DA (SF系列双作用)
- SF10-SR-K8, SF14-SR-K10 (SF系列弹簧复位)
- AT100-DA, AT200-SR-K8 (AT系列)

---

## 🧹 数据清理

### 自动清理

`afterEach` hook 会自动清理测试创建的数据：

```javascript
afterEach(() => {
  // 清理以 E2E-Test- 开头的项目
  cy.request({
    method: 'POST',
    url: 'http://localhost:5001/api/testing/cleanup',
    body: { projectNamePrefix: 'E2E-Test-' }
  });
});
```

### 手动清理

如果需要手动清理所有数据：

```bash
curl -X DELETE http://localhost:5001/api/testing/cleanup-all
```

---

## ⚡ 性能优化

### 当前策略

- ✅ 每个测试前重置数据库（确保一致性）
- ✅ 并行运行测试（Cypress 默认）
- ✅ 测试后清理特定数据（减少数据积累）

### 未来优化（可选）

如果测试变慢，可以考虑：

1. **数据库快照恢复** - 比完整重置更快
2. **共享 describe 的 beforeEach** - 减少重置次数
3. **选择性重置** - 只重置必要的集合

---

## 🐛 故障排查

### 问题 1: "数据库重置失败"

**症状**: beforeEach 中的 reset-and-seed 返回错误

**解决**:
```bash
# 1. 确认后端运行在测试环境
NODE_ENV=test npm start

# 2. 检查端口是否正确（5001）
curl http://localhost:5001/api/health

# 3. 手动测试重置接口
bash backend/test-reset-and-seed.sh
```

### 问题 2: "登录失败"

**症状**: 无法登录或密码错误

**解决**:
1. 确认测试数据已正确填充
2. 检查密码是否为 `Test123456!`（注意大小写和感叹号）
3. 查看 `reset-and-seed` 响应确认用户已创建

### 问题 3: "测试超时"

**症状**: 测试在某些步骤超时

**解决**:
```javascript
// 增加全局超时
Cypress.config('defaultCommandTimeout', 10000);

// 或为特定命令增加超时
cy.get('.selector', { timeout: 15000 });
```

### 问题 4: "找不到元素"

**症状**: 选择器无法找到页面元素

**解决**:
1. 使用 Cypress GUI 检查页面结构
2. 添加 `data-testid` 属性到关键元素
3. 使用更灵活的选择器策略（已在测试中实现）

---

## 📚 相关文档

- 📖 [测试 API 完整指南](../../../backend/TESTING_API_GUIDE.js)
- 📋 [Cypress 辅助函数](../support/test-helpers.js)
- 📜 [实施总结](../../../TESTING_IMPLEMENTATION_SUMMARY.md)
- 🔖 [快速参考](../../../backend/QUICK_REFERENCE.txt)

---

## ✅ 检查清单

在运行测试前，确保：

- [ ] 后端在测试环境运行 (`NODE_ENV=test`)
- [ ] 前端开发服务器运行
- [ ] 测试 API 可访问 (`curl http://localhost:5001/api/testing/status`)
- [ ] MongoDB 数据库运行
- [ ] 端口 5001 (后端) 和 5173 (前端) 可用

---

## 🎉 成功运行测试的标志

测试成功运行时，你应该看到：

```
✅ 终极验收测试套件 - Complete E2E Workflow
   ✅ 场景 1：用户认证与登录
      ✅ 应该能以管理员身份成功登录
      ✅ 应该能以销售经理身份成功登录
      ✅ 应该拒绝错误的登录凭证
   ✅ 场景 2：售前协同 - 项目创建与管理
      ✅ 应该能创建新项目
      ✅ 应该能查看项目列表
   ✅ 场景 3：技术选型 - 执行器选型
      ✅ 应该能访问执行器产品库
      ✅ 应该能看到测试数据中的产品
   ✅ 场景 4：数据一致性验证
      ✅ 每次测试应该从相同的初始状态开始
      ✅ 应该能访问用户管理页面并看到所有测试用户
   ✅ 场景 5：完整业务流程
      ✅ 应该完成完整的售前协同流程

10 passing (2m 30s)
```

---

🎊 **恭喜！你的测试套件已经准备就绪！**

