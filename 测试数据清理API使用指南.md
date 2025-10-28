# 测试数据清理 API 使用指南

## 📋 概述

为了支持 E2E 测试的可重复运行，我们创建了专门的测试数据清理接口。这些接口**仅在测试环境**（`NODE_ENV === 'test'`）中可用，确保生产环境的数据安全。

## 🔒 安全机制

1. **环境隔离**：仅在 `NODE_ENV === 'test'` 时加载路由
2. **启动提示**：测试路由启用时会在控制台显示警告
3. **双重保护**：危险操作（如清空所有数据）会再次检查环境变量

## 🛠️ 可用接口

### 1. POST /api/testing/cleanup

按项目名称前缀清理测试数据（推荐使用）

**请求示例：**
```bash
curl -X POST http://localhost:5000/api/testing/cleanup \
  -H "Content-Type: application/json" \
  -d '{"projectNamePrefix": "Test-Project-"}'
```

**请求体：**
```json
{
  "projectNamePrefix": "Test-Project-"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "测试数据清理成功！总计删除 15 条记录",
  "deleted": {
    "projects": 5,
    "newProjects": 3,
    "salesOrders": 4,
    "productionOrders": 2,
    "serviceTickets": 1
  },
  "details": {
    "projectNamePrefix": "Test-Project-",
    "timestamp": "2025-10-28T10:30:00.000Z"
  }
}
```

**清理逻辑：**
- ✅ 删除所有名称以指定前缀开头的项目（Project 和 NewProject）
- ✅ 级联删除相关的销售订单（SalesOrder）
- ✅ 级联删除相关的生产订单（ProductionOrder）
- ✅ 级联删除相关的售后工单（ServiceTicket）
- ✅ 清理孤立的测试数据

---

### 2. GET /api/testing/status

获取测试环境状态信息

**请求示例：**
```bash
curl http://localhost:5000/api/testing/status
```

**响应示例：**
```json
{
  "success": true,
  "status": {
    "environment": "test",
    "database": {
      "projects": 12,
      "newProjects": 8,
      "salesOrders": 5,
      "productionOrders": 3,
      "serviceTickets": 2
    },
    "timestamp": "2025-10-28T10:35:00.000Z"
  }
}
```

---

### 3. DELETE /api/testing/cleanup-all

⚠️ **危险操作**：清空所有测试数据

**请求示例：**
```bash
curl -X DELETE http://localhost:5000/api/testing/cleanup-all
```

**警告：**
- 此操作会删除数据库中的所有项目、订单、生产任务和工单
- 仅在需要完全重置测试环境时使用
- 在生产环境中此接口被禁用（即使误调用也会返回 403 错误）

**响应示例：**
```json
{
  "success": true,
  "message": "所有测试数据已清空！总计删除 30 条记录",
  "deleted": {
    "projects": 12,
    "newProjects": 8,
    "salesOrders": 5,
    "productionOrders": 3,
    "serviceTickets": 2
  }
}
```

---

## 🧪 在 Cypress 测试中使用

### 方法 1：在测试开始前清理（推荐）

```javascript
describe('My Test Suite', () => {
  before(() => {
    // 清理所有以 'Test-Project-' 开头的测试数据
    cy.request('POST', '/api/testing/cleanup', {
      projectNamePrefix: 'Test-Project-'
    }).then(response => {
      expect(response.status).to.eq(200);
      cy.log(`清理完成：删除了 ${response.body.deleted.projects} 个项目`);
    });
  });

  it('should create a new project', () => {
    const projectName = `Test-Project-${Date.now()}`;
    // ... 测试代码 ...
  });
});
```

### 方法 2：在 Cypress 自定义命令中使用

在 `cypress/support/commands.js` 中添加：

```javascript
Cypress.Commands.add('cleanupTestData', (prefix = 'Test-Project-') => {
  cy.request('POST', '/api/testing/cleanup', {
    projectNamePrefix: prefix
  }).then(response => {
    expect(response.status).to.eq(200);
    cy.log(`测试数据清理成功：${response.body.message}`);
  });
});
```

然后在测试中使用：

```javascript
describe('My Test Suite', () => {
  before(() => {
    cy.cleanupTestData();
  });

  // ... 测试用例 ...
});
```

### 方法 3：在每个测试后清理

```javascript
describe('My Test Suite', () => {
  afterEach(() => {
    // 每个测试后清理（谨慎使用，可能影响性能）
    cy.cleanupTestData();
  });

  // ... 测试用例 ...
});
```

---

## 📝 最佳实践

### ✅ 推荐做法

1. **使用动态前缀**：在测试中使用时间戳生成唯一的项目名称
   ```javascript
   const projectName = `Test-Project-${Date.now()}`;
   ```

2. **统一前缀管理**：在测试配置文件中定义统一的前缀
   ```javascript
   // cypress.config.js
   const TEST_DATA_PREFIX = 'CypressTest-';
   ```

3. **测试隔离**：每个测试套件使用不同的前缀，避免相互干扰
   ```javascript
   const prefix = `Test-${Cypress.spec.name}-${Date.now()}-`;
   ```

4. **在 before 钩子中清理**：确保测试开始前环境干净
   ```javascript
   before(() => {
     cy.cleanupTestData('MyTestSuite-');
   });
   ```

### ❌ 避免的做法

1. **不要在生产环境启用**：确保 `NODE_ENV !== 'production'`
2. **不要频繁调用 cleanup-all**：这会影响性能和其他并行测试
3. **不要在测试中途清理**：可能导致测试数据不一致
4. **不要硬编码项目名称**：使用动态生成以避免冲突

---

## 🔧 环境配置

### 启用测试路由

在启动后端服务器时，设置环境变量：

```bash
# 方式 1：命令行设置
NODE_ENV=test npm start

# 方式 2：在 package.json 中添加脚本
{
  "scripts": {
    "start:test": "NODE_ENV=test node server.js",
    "test:e2e": "NODE_ENV=test npm run start & cypress run"
  }
}

# 方式 3：使用 .env.test 文件
NODE_ENV=test
PORT=5000
```

### 验证测试路由已启用

启动服务器时，应该看到以下日志：

```
⚠️  测试路由已启用 - 仅应在测试环境使用
✅ 测试清理接口已注册: /api/testing
```

---

## 🐛 故障排除

### 问题 1：接口返回 404

**可能原因**：
- 服务器未在测试环境启动
- `NODE_ENV` 未设置为 `test`

**解决方案**：
```bash
# 检查环境变量
echo $NODE_ENV

# 重新启动服务器
NODE_ENV=test npm start
```

### 问题 2：数据未被清理

**可能原因**：
- 项目名称前缀不匹配
- 使用了不同的模型（Project vs NewProject）

**解决方案**：
1. 检查项目名称是否真的以指定前缀开头
2. 使用 `/api/testing/status` 检查数据库状态
3. 查看服务器日志以了解清理详情

### 问题 3：在生产环境误启用

**保护措施**：
- 即使在生产环境加载，`cleanup-all` 也会被拒绝
- 建议在生产环境的启动脚本中明确设置 `NODE_ENV=production`

---

## 📊 技术实现细节

### 级联删除逻辑

```
1. 查找匹配的 Projects (老项目)
   ↓
2. 查找关联的 SalesOrders
   ↓
3. 查找关联的 ProductionOrders
   ↓
4. 查找关联的 ServiceTickets
   ↓
5. 按顺序删除：ServiceTickets → ProductionOrders → SalesOrders → Projects
   
6. 查找匹配的 NewProjects (新项目)
   ↓
7. 删除 NewProjects

8. 清理孤立数据（通过 projectSnapshot 查找）
```

### 数据关系图

```
Project (老项目)
  ├─→ SalesOrder (销售订单)
  │     ├─→ ProductionOrder (生产订单)
  │     └─→ ServiceTicket (售后工单，通过 relatedOrder)
  └─→ ServiceTicket (售后工单，通过 relatedProject)

NewProject (新项目)
  └─→ (通常不直接关联订单，独立清理)
```

---

## ✅ 测试检查清单

在运行 E2E 测试前，确保：

- [ ] 后端服务器以测试模式启动 (`NODE_ENV=test`)
- [ ] 测试路由已成功注册（检查启动日志）
- [ ] Cypress 配置中指向正确的后端地址
- [ ] 测试数据使用统一的前缀命名规则
- [ ] `before` 钩子中包含清理逻辑
- [ ] 测试用例使用动态生成的唯一名称

---

## 🎯 快速开始示例

完整的测试文件示例：

```javascript
// cypress/e2e/example.cy.js
describe('Complete E2E Test with Cleanup', () => {
  const testPrefix = `CypressTest-${Date.now()}-`;
  
  before(() => {
    // 清理之前的测试数据
    cy.request('POST', '/api/testing/cleanup', {
      projectNamePrefix: 'CypressTest-'
    });
  });

  it('should create and manage a project lifecycle', () => {
    const projectName = `${testPrefix}Project-1`;
    
    // 创建项目
    cy.visit('/projects');
    cy.contains('新建项目').click();
    cy.get('input[name="project_name"]').type(projectName);
    cy.contains('确定').click();
    
    // 验证项目创建成功
    cy.contains(projectName).should('be.visible');
    
    // ... 更多测试步骤 ...
  });

  after(() => {
    // 测试完成后清理（可选）
    cy.request('POST', '/api/testing/cleanup', {
      projectNamePrefix: testPrefix
    });
  });
});
```

---

## 📚 相关文档

- [Cypress 测试快速入门](./Cypress测试快速入门.md)
- [API 接口文档](./API接口文档.md)
- [最终测试报告](./最终测试报告.md)

---

## 🆘 需要帮助？

如果遇到问题，请：
1. 检查服务器日志中的 `[测试清理]` 标记
2. 使用 `/api/testing/status` 检查当前数据库状态
3. 查看 Cypress 控制台的网络请求
4. 确认 `NODE_ENV=test` 已正确设置

---

**创建日期**：2025-10-28  
**版本**：1.0.0  
**维护者**：C-MAX 开发团队

