# E2E 测试可重复运行快速指南

## 🎯 概述

本指南介绍如何运行可重复执行的 Cypress E2E 测试。我们通过**测试数据自动清理**机制，确保每次测试都在干净的环境中运行。

## ✅ 已完成的工作

### 1. 后端测试清理接口
- ✅ 创建 `backend/routes/testing.routes.js`
- ✅ 实现 `POST /api/testing/cleanup` 接口
- ✅ 实现 `GET /api/testing/status` 接口
- ✅ 实现 `DELETE /api/testing/cleanup-all` 接口
- ✅ 在 `server.js` 中条件性加载（仅测试环境）

### 2. 前端测试工具
- ✅ 更新 `frontend/cypress/support/commands.js`
- ✅ 添加 `cy.cleanupTestData()` 命令
- ✅ 添加 `cy.getTestingStatus()` 命令
- ✅ 添加 `cy.cleanupAllTestData()` 命令

### 3. E2E 测试脚本
- ✅ 创建 `frontend/cypress/e2e/final_acceptance_test.cy.js`
- ✅ 集成测试数据清理逻辑
- ✅ 使用动态时间戳生成唯一测试数据

## 🚀 快速开始

### 第一步：启动后端（测试模式）

```bash
cd backend

# 方式 1：直接设置环境变量
NODE_ENV=test npm start

# 方式 2：使用 package.json 脚本（如果已配置）
npm run start:test

# 你应该看到以下日志：
# ⚠️  测试路由已启用 - 仅应在测试环境使用
# ✅ 测试清理接口已注册: /api/testing
```

### 第二步：启动前端开发服务器

```bash
cd frontend
npm run dev

# 前端应该运行在: http://localhost:5173
```

### 第三步：运行 Cypress 测试

```bash
cd frontend

# 方式 1：打开 Cypress 测试界面
npx cypress open

# 然后在界面中选择 final_acceptance_test.cy.js 运行

# 方式 2：无头模式运行测试
npx cypress run --spec "cypress/e2e/final_acceptance_test.cy.js"
```

## 📋 测试流程说明

### 测试生命周期

```
1. before() 钩子
   ├─ cy.cleanupTestData('Test-Project-')  // 清理之前的测试数据
   └─ (可选) 准备测试所需的基础数据
   
2. it() 测试用例
   ├─ 创建动态命名的测试项目 (Test-Project-{timestamp})
   ├─ 执行完整的业务流程测试
   └─ 验证各个环节的正确性
   
3. (可选) after() 钩子
   └─ cy.cleanupTestData()  // 测试后清理（可选）
```

### 关键特性

1. **动态数据生成**
   ```javascript
   const testData = {
     projectName: `Test-Project-${Date.now()}`,
     supplierName: `Test-Supplier-${Date.now()}`
   };
   ```

2. **自动清理**
   ```javascript
   before(() => {
     cy.cleanupTestData('Test-Project-');
   });
   ```

3. **级联删除**
   - 自动删除相关的销售订单、生产订单、售后工单

## 🛠️ 自定义命令使用

### 基础清理命令

```javascript
// 使用默认前缀 'Test-Project-'
cy.cleanupTestData();

// 使用自定义前缀
cy.cleanupTestData('MyTest-');
```

### 获取环境状态

```javascript
cy.getTestingStatus().then((status) => {
  cy.log(`当前有 ${status.database.projects} 个项目`);
});
```

### 清空所有数据（谨慎使用）

```javascript
cy.cleanupAllTestData();
```

## 📝 编写可重复测试的最佳实践

### ✅ 推荐做法

```javascript
describe('My Feature Test', () => {
  const testPrefix = `FeatureTest-${Date.now()}-`;
  
  before(() => {
    // 1. 清理同类测试的历史数据
    cy.cleanupTestData('FeatureTest-');
  });

  it('should test the feature', () => {
    // 2. 使用唯一的测试数据
    const projectName = `${testPrefix}Project-1`;
    
    // 3. 执行测试...
  });
});
```

### ❌ 避免的做法

```javascript
// ❌ 不要使用硬编码的项目名称
const projectName = 'Test Project';

// ❌ 不要在测试中途清理数据
it('my test', () => {
  cy.cleanupTestData(); // 可能导致数据不一致
  // ... 测试代码 ...
});

// ❌ 不要在生产环境运行
// 始终确保 NODE_ENV=test
```

## 🔍 验证测试环境

### 检查后端是否在测试模式运行

```bash
# 方法 1：查看启动日志
# 应该包含：⚠️  测试路由已启用

# 方法 2：调用状态接口
curl http://localhost:5000/api/testing/status

# 响应应该包含：
# {
#   "success": true,
#   "status": {
#     "environment": "test",
#     ...
#   }
# }
```

### 手动测试清理接口

```bash
# 清理测试数据
curl -X POST http://localhost:5000/api/testing/cleanup \
  -H "Content-Type: application/json" \
  -d '{"projectNamePrefix": "Test-Project-"}'

# 查看结果
curl http://localhost:5000/api/testing/status
```

## 📊 监控测试执行

### Cypress 控制台输出示例

```
🧹 清理测试数据（前缀: Test-Project-）
✅ 测试数据清理成功！总计删除 15 条记录
   - 项目: 5
   - 新项目: 3
   - 销售订单: 4
   - 生产订单: 2
   - 售后工单: 1

🔐 Logging in as Sales Manager
✅ Successfully logged in as Sales Manager
...
```

### 后端日志示例

```
[测试清理] 开始清理前缀为 "Test-Project-" 的测试数据...
[测试清理] 找到 5 个老项目需要清理
[测试清理] 删除了 4 个销售订单
[测试清理] 删除了 2 个生产订单
[测试清理] 删除了 1 个售后工单
[测试清理] 删除了 5 个老项目
[测试清理] 找到 3 个新项目需要清理
[测试清理] 删除了 3 个新项目
[测试清理] 清理完成！总计删除 15 条记录
```

## 🐛 常见问题

### Q1: 清理接口返回 404

**原因**: 后端未在测试模式启动

**解决**:
```bash
# 确保使用测试模式启动
NODE_ENV=test npm start
```

### Q2: 测试数据未被清理

**原因**: 项目名称前缀不匹配

**解决**:
```javascript
// 确保前缀一致
const projectName = `Test-Project-${Date.now()}`; // ✅ 正确
cy.cleanupTestData('Test-Project-'); // ✅ 匹配

const projectName = `MyProject-${Date.now()}`; // ❌ 不匹配
cy.cleanupTestData('Test-Project-'); // ❌ 无法清理
```

### Q3: 测试之间相互干扰

**原因**: 多个测试使用了相同的数据前缀

**解决**:
```javascript
// 为每个测试套件使用唯一前缀
const testPrefix = `Test-${Cypress.spec.name}-${Date.now()}-`;
```

### Q4: 在生产环境误启用测试接口

**保护措施**:
- 测试路由仅在 `NODE_ENV === 'test'` 时加载
- `cleanup-all` 接口会再次检查环境变量
- 即使误调用也会返回 403 错误

## 📦 相关文件清单

### 后端文件
```
backend/
├── routes/
│   └── testing.routes.js          ← 测试清理接口
├── server.js                       ← 已更新，条件性加载测试路由
└── models/
    ├── Project.js                  ← 老项目模型
    ├── NewProject.js               ← 新项目模型
    ├── SalesOrder.js               ← 销售订单模型
    ├── ProductionOrder.js          ← 生产订单模型
    └── ServiceTicket.js            ← 售后工单模型
```

### 前端文件
```
frontend/
└── cypress/
    ├── e2e/
    │   └── final_acceptance_test.cy.js  ← 全生命周期测试脚本
    └── support/
        └── commands.js                   ← 已更新，添加清理命令
```

### 文档文件
```
根目录/
├── 测试数据清理API使用指南.md      ← 详细API文档
└── E2E测试可重复运行快速指南.md     ← 本文档
```

## 🎓 进阶使用

### 并行测试隔离

```javascript
// cypress.config.js
module.exports = {
  e2e: {
    setupNodeEvents(on, config) {
      on('before:spec', (spec) => {
        // 每个测试文件使用独立的前缀
        config.env.testPrefix = `Test-${spec.name}-${Date.now()}-`;
        return config;
      });
    },
  },
};

// 在测试中使用
const prefix = Cypress.env('testPrefix');
cy.cleanupTestData(prefix);
```

### 条件性清理

```javascript
before(() => {
  // 仅在 CI 环境清理
  if (Cypress.env('CI')) {
    cy.cleanupTestData();
  }
});
```

### 自定义清理逻辑

```javascript
before(() => {
  // 先清理
  cy.cleanupTestData('Test-Project-');
  
  // 再准备测试数据
  cy.request('POST', '/api/suppliers', {
    name: `Test-Supplier-${Date.now()}`,
    contact: 'test@example.com'
  });
});
```

## ✅ 测试检查清单

运行测试前确认：

- [ ] 后端以测试模式启动 (`NODE_ENV=test`)
- [ ] 前端开发服务器正在运行
- [ ] 测试路由已成功注册（检查后端日志）
- [ ] Cypress 配置指向正确的后端地址
- [ ] 测试数据使用动态生成的唯一名称
- [ ] `before` 钩子包含清理逻辑

## 🎉 下一步

1. **运行现有测试**
   ```bash
   cd frontend
   npx cypress run
   ```

2. **编写新的测试用例**
   - 复制 `final_acceptance_test.cy.js` 作为模板
   - 修改测试逻辑以适应你的场景
   - 使用 `cy.cleanupTestData()` 确保可重复性

3. **集成到 CI/CD**
   ```yaml
   # .github/workflows/e2e-tests.yml
   - name: Run E2E Tests
     run: |
       NODE_ENV=test npm start &
       npm run test:e2e
   ```

## 📚 更多资源

- [测试数据清理 API 使用指南](./测试数据清理API使用指南.md)
- [Cypress 测试快速入门](./Cypress测试快速入门.md)
- [API 接口文档](./API接口文档.md)

---

**最后更新**: 2025-10-28  
**版本**: 1.0.0  
**维护者**: C-MAX 开发团队

祝测试顺利！🚀

