# Cypress 重构后快速测试指南

## 🚀 快速启动

### 1. 确保服务运行

```bash
# Terminal 1 - 启动后端
cd backend
npm run dev

# Terminal 2 - 启动前端  
cd frontend
npm run dev
```

### 2. 打开 Cypress

```bash
cd frontend
npx cypress open
```

### 3. 运行测试

在 Cypress UI 中选择：
- ✅ `final_acceptance_test.cy.js` - 完整验收测试
- ✅ `multi_role_collaboration.cy.js` - 多角色协同测试

---

## 🧪 手动测试登录命令

### 测试 1: 基础手机号登录

```javascript
// 在 Cypress UI 的 Console 中运行
cy.login('13800138000', 'admin123');
```

**预期结果**:
- ✅ 成功登录
- ✅ 跳转到 `/dashboard`
- ✅ 看到用户姓名和角色

---

### 测试 2: 带强制修改密码的登录

**前置条件**: 创建一个需要修改密码的新用户

```javascript
// 在 Cypress Console 中
cy.login('13800138999', 'temp123', {
  forceChangePassword: true,
  newPassword: 'NewPass123!'
});
```

**预期结果**:
- ✅ 检测到密码修改页面
- ✅ 自动填写表单
- ✅ 提交成功
- ✅ 最终跳转到 `/dashboard`

---

### 测试 3: 使用角色别名登录

```javascript
// 测试所有角色
cy.loginAs('admin');
cy.loginAs('technicalEngineer');
cy.loginAs('salesManager');
cy.loginAs('productionPlanner');
```

**预期结果**:
- ✅ 每个角色都能成功登录
- ✅ 看到对应的角色标签

---

## 🐞 故障排查

### 问题 1: 找不到输入框

**错误**: `Timed out retrying: Expected to find element: 'input[name="phone"]'`

**解决方法**:
1. 检查前端登录页是否正确加载
2. 确认输入框的 `name` 属性是 `phone`
3. 打开浏览器开发者工具检查元素

---

### 问题 2: 密码修改页检测失败

**错误**: 登录后停在密码修改页

**解决方法**:
```javascript
// 确保在登录时传递 forceChangePassword 选项
cy.login('13800138000', 'admin123', {
  forceChangePassword: true
});
```

---

### 问题 3: 测试用户不存在

**错误**: `Invalid credentials`

**解决方法**:
```bash
# 运行后端用户创建脚本
cd backend
node scripts/createAdminUser.js
```

或手动创建测试用户（在 MongoDB）

---

## ✅ 验证清单

运行测试前，请确保：

- [ ] 后端服务运行在 `http://localhost:5001`
- [ ] 前端服务运行在 `http://localhost:5173`
- [ ] MongoDB 数据库已启动
- [ ] 测试用户已创建（手机号 13800138000-13800138006）
- [ ] 测试用户的 `passwordChangeRequired` 字段为 `false`

---

## 📊 快速验证命令

### 验证后端 API

```bash
# 测试登录 API
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"admin123"}'
```

**预期响应**:
```json
{
  "_id": "...",
  "phone": "13800138000",
  "full_name": "Admin User",
  "role": "Administrator",
  "passwordChangeRequired": false
}
```

---

### 验证前端登录页

1. 打开浏览器访问 `http://localhost:5173/login`
2. 检查是否有以下元素：
   - ✅ `<input name="phone">`
   - ✅ `<input name="password">`
   - ✅ `<button type="submit">`

---

## 🎯 最小可行测试

创建一个简单测试文件验证重构：

**文件**: `cypress/e2e/login_basic.cy.js`

```javascript
describe('基础登录测试', () => {
  it('应该使用手机号成功登录', () => {
    cy.visit('/login');
    cy.get('input[name="phone"]').type('13800138000');
    cy.get('input[name="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
  
  it('应该使用 login 命令登录', () => {
    cy.login('13800138000', 'admin123');
    cy.url().should('include', '/dashboard');
  });
  
  it('应该使用 loginAs 命令登录', () => {
    cy.loginAs('admin');
    cy.url().should('include', '/dashboard');
  });
});
```

运行：
```bash
npx cypress run --spec "cypress/e2e/login_basic.cy.js"
```

---

## 📹 查看测试录像

测试完成后，录像保存在：
```
frontend/cypress/videos/
```

截图保存在：
```
frontend/cypress/screenshots/
```

---

## 💡 提示

1. **首次运行可能较慢**: Cypress 需要启动浏览器和加载资源
2. **使用无头模式加速**: `npx cypress run` (无 UI)
3. **调试模式**: 在测试中添加 `cy.pause()` 暂停执行
4. **清理数据**: 每次测试前运行 `cy.cleanupTestData()`

---

## 🆘 获取帮助

如果遇到问题：

1. 查看 Cypress 控制台日志
2. 检查浏览器开发者工具
3. 查看 `CYPRESS_REFACTOR_COMPLETION_REPORT.md`
4. 参考 Cypress 官方文档

---

**祝测试顺利！** 🎉

