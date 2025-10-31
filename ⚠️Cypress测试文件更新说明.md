# ⚠️ Cypress 测试文件更新说明

**更新日期：** 2025年10月31日  
**影响范围：** E2E 测试套件

---

## 📋 需要更新的测试文件

由于角色重构（移除After-sales Engineer，合并到Technical Engineer），以下Cypress测试文件需要更新：

### 1. 测试规格文件

#### `frontend/cypress/e2e/full_lifecycle_test.cy.js`

**当前问题：**
```javascript
// 第255行
cy.get('input[name="phone"]').clear().type('18800000007');  // After-sales Engineer
```

**修改建议：**
- 将测试账号改为技术工程师（如果手机号007现在是QA Inspector，则使用Technical Engineer的手机号）
- 更新测试用例的注释和断言

#### `frontend/cypress/e2e/multi_role_collaboration.cy.js`

**当前问题：**
```javascript
// 第19行注释
* 🎫 After-sales Engineer (售后工程师) - 售后服务、工单处理

// 第990行
context('🎬 Act 7: After-sales Engineer Handles Service Ticket', () => {
```

**修改建议：**
- 更新注释为：`* 🎫 Technical Engineer (技术工程师) - 技术方案、售后服务、工单处理`
- 更新测试场景名称为：`'🎬 Act 7: Technical Engineer Handles Service Ticket'`
- 使用Technical Engineer测试账号

---

### 2. 测试辅助文件

#### `frontend/cypress/support/test-helpers.js`

**当前问题：**
```javascript
'After-sales Engineer': { phone: '18800000007', password: 'Test123456!' },
```

**修改建议：**
- 删除这行
- 确保Technical Engineer的测试账号存在且配置正确

---

### 3. 测试数据文件

#### `frontend/cypress/fixtures/test_data.json`

**当前问题：**
```json
{
  "fullName": "售后-郑十",
  "role": "After-sales Engineer",
  "department": "售后服务部"
}
```

**修改建议：**
- 删除这个测试用户，或
- 修改为Technical Engineer角色

#### `frontend/cypress/fixtures/test-users.json`

**当前问题：**
```json
{
  "password": "after123",
  "role": "After-sales Engineer",
  "displayName": "售后工程师"
}
```

**修改建议：**
- 删除这个测试用户，或
- 修改为Technical Engineer角色

---

### 4. 测试文档

#### `frontend/cypress/FINAL_TEST_GUIDE.md`

**当前问题：**
测试账号表格中包含After-sales Engineer

**修改建议：**
- 更新测试账号列表
- 移除After-sales Engineer行
- 更新手机号序列（如果需要）

#### `frontend/cypress/CYPRESS_REFACTOR_COMPLETION_REPORT.md`

**当前问题：**
包含多处After-sales Engineer引用

**修改建议：**
- 更新报告中的角色列表
- 标注该报告为历史文档（如果不再使用）

#### `frontend/cypress/README.md`

**当前问题：**
角色列表和测试账号包含After-sales Engineer

**修改建议：**
- 更新角色列表
- 更新测试账号表格

---

## 🔧 快速修复方案

### 方案 1: 批量查找替换（推荐）

```bash
cd frontend/cypress

# 备份
cp -r e2e e2e.backup
cp -r fixtures fixtures.backup
cp -r support support.backup

# 批量替换（macOS/Linux）
find . -type f \( -name "*.js" -o -name "*.json" -o -name "*.md" \) -exec sed -i '' 's/After-sales Engineer/Technical Engineer/g' {} +
find . -type f \( -name "*.js" -o -name "*.json" -o -name "*.md" \) -exec sed -i '' 's/售后工程师/技术工程师/g' {} +
find . -type f \( -name "*.js" -o -name "*.json" -o -name "*.md" \) -exec sed -i '' 's/aftersales/technical/g' {} +

# 验证修改
git diff
```

### 方案 2: 手动逐个修改

按照上面列出的文件，逐个打开并修改相关内容。

### 方案 3: 暂时禁用相关测试

如果时间紧迫，可以先禁用包含After-sales Engineer的测试用例：

```javascript
// 在测试用例前添加 .skip
context.skip('🎬 Act 7: After-sales Engineer Handles Service Ticket', () => {
  // ...
});
```

---

## ✅ 修改后的测试账号映射

### 更新后的角色与测试账号

| 角色 | 手机号 | 密码 | 说明 |
|-----|--------|------|-----|
| Administrator | 18800000001 | Test123456! | 管理员 |
| Sales Manager | 18800000002 | Test123456! | 销售经理 |
| Technical Engineer | 18800000003 | Test123456! | **技术+售后** ⭐ |
| Business Engineer | 18800000004 | Test123456! | 商务工程师 |
| Procurement Specialist | 18800000005 | Test123456! | 采购专员 |
| Production Planner | 18800000006 | Test123456! | 生产计划员 |
| QA Inspector | 18800000007 | Test123456! | 质检员 |
| Logistics Specialist | 18800000008 | Test123456! | 物流专员 |
| Shop Floor Worker | 18800000009 | Test123456! | 车间工人 |

**注意：** 手机号007现在是QA Inspector，不再是After-sales Engineer

---

## 🧪 测试验证步骤

### 步骤 1: 运行测试套件

```bash
cd frontend
npm run cypress:run
```

### 步骤 2: 检查失败的测试

```bash
# 查看测试报告
cat cypress/results/output.xml

# 或打开可视化测试结果
npm run cypress:open
```

### 步骤 3: 修复失败的测试

根据错误信息，更新相应的测试用例：

- 如果是"用户不存在"错误：更新测试账号
- 如果是"权限不足"错误：更新角色权限断言
- 如果是"菜单项不存在"错误：更新菜单断言

---

## 📊 影响评估

### 高优先级（必须修复）

- ✅ `test-helpers.js` - 测试账号配置
- ✅ `test_data.json` - 测试数据
- ✅ `test-users.json` - 用户fixture

### 中优先级（建议修复）

- ⚠️ `full_lifecycle_test.cy.js` - 全流程测试
- ⚠️ `multi_role_collaboration.cy.js` - 多角色协作测试

### 低优先级（可选修复）

- 📄 `FINAL_TEST_GUIDE.md` - 测试指南文档
- 📄 `CYPRESS_REFACTOR_COMPLETION_REPORT.md` - 历史报告
- 📄 `README.md` - Cypress说明文档

---

## 🚨 重要提示

### 测试环境数据同步

修改Cypress测试后，确保：

1. **测试数据库与seed脚本同步**
   ```bash
   cd backend
   node seed_final_acceptance.js
   ```

2. **Cypress fixture数据与seed数据一致**
   - 手机号
   - 密码
   - 角色名称
   - 部门信息

3. **测试断言与实际UI一致**
   - 菜单项名称
   - 权限检查
   - 页面标题

---

## 🎯 推荐行动方案

### 立即执行（15分钟）

1. 更新 `test-helpers.js` 中的测试账号配置
2. 更新 `test_data.json` 和 `test-users.json`
3. 运行快速冒烟测试

### 短期执行（1-2天）

1. 更新所有E2E测试规格文件
2. 运行完整测试套件
3. 修复所有失败的测试用例

### 中期执行（1周内）

1. 更新所有Cypress文档
2. 创建新的测试用例覆盖技术工程师的双职责
3. 更新测试指南

---

## 📝 注意事项

### 1. 不要删除历史文档

像 `CYPRESS_REFACTOR_COMPLETION_REPORT.md` 这样的历史报告，可以保留但添加说明：

```markdown
> ⚠️ **历史文档警告：** 
> 本文档创建于2025年XX月，当时系统包含After-sales Engineer角色。
> 自2025年10月31日起，该角色已合并到Technical Engineer。
> 本文档保留作为历史参考，但内容可能已过时。
```

### 2. 保持测试数据一致性

Cypress测试使用的账号应与 `backend/seed_final_acceptance.js` 中的测试账号保持一致：

- ✅ 使用相同的手机号序列（13000000001-009）
- ✅ 使用相同的密码（password）
- ✅ 使用相同的角色枚举值

### 3. 逐步迁移测试

不要一次性修改所有测试文件，建议：

1. 先修复核心的测试辅助文件
2. 然后修复关键的E2E测试
3. 最后更新文档和历史文件

---

## ✅ 验证清单

测试文件更新后，验证以下内容：

- [ ] 所有测试辅助文件不再包含After-sales Engineer
- [ ] 测试数据fixture已更新
- [ ] 核心E2E测试可以运行
- [ ] 测试账号与seed脚本一致
- [ ] 测试文档已更新或标注为历史文档
- [ ] CI/CD管道中的测试可以通过

---

**文档版本：** v1.0  
**最后更新：** 2025-10-31  
**状态：** ⚠️ 待执行

**建议：** 在部署到生产环境前，完成测试文件的更新和验证。

