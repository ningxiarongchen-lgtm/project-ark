# 测试前检查清单 - 保证测试=生产

> **目的**: 确保每次测试环境和生产环境完全一致，避免"测试时好的，上线后又坏了"的情况  
> **执行时机**: 每次UAT测试前、每次生产部署前  
> **执行人**: 技术工程师 + 测试人员

---

## ⚠️ 重要原则

**测试环境 = 生产环境**

所有在测试环境验证通过的功能和数据，在生产环境必须完全一致！

---

## 📋 第一步：Git代码检查

### 1.1 确认所有修改已提交

```bash
cd /Users/hexiaoxiao/Desktop/Model\ Selection\ System

# 检查是否有未提交的修改
git status

# 如果有修改，查看具体内容
git diff

# 查看最近的提交
git log --oneline -10
```

**预期结果**: ✅ 工作目录干净，或只有临时文件

**关键文件检查**:
- [ ] `backend/seed_final_acceptance.js` - 数据导入脚本
- [ ] `backend/package.json` - NPM脚本
- [ ] `frontend/src/pages/ProductCatalog.jsx` - 产品目录页面
- [ ] `backend/verify_data_completeness.js` - 数据验证脚本
- [ ] `backend/verify_mechanism_types.js` - 机构类型验证脚本

---

## 📋 第二步：数据库初始化

### 2.1 清空现有数据

```bash
cd backend

# 连接MongoDB并清空数据
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/cmax').then(async () => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('清空以下集合:');
  for (const collection of collections) {
    const result = await mongoose.connection.db.collection(collection.name).deleteMany({});
    console.log(\`  ✓ \${collection.name}: \${result.deletedCount} 条\`);
  }
  await mongoose.connection.close();
  console.log('\n✅ 数据库已清空');
});
"
```

### 2.2 导入完整数据

```bash
npm run seed:final
```

**预期输出**:
```
✅ 成功导入 55 个执行器型号！       (AT/GY系列)
✅ 成功导入 282 个SF系列型号！      (SF系列: 141球阀 + 141蝶阀)
✅ 成功导入 18 个手动操作装置型号！
✅ 成功导入 10 个配件型号！
```

**检查点**:
- [ ] AT/GY系列: 55个
- [ ] SF系列: 282个 (141球阀 + 141蝶阀)
- [ ] 手动操作装置: 18个
- [ ] 配件: 10个
- [ ] 测试用户: 10个
- [ ] 供应商: 5个

---

## 📋 第三步：数据完整性验证

### 3.1 运行完整验证

```bash
npm run verify:all
```

**预期结果**: 
```
🎉 所有核心数据已完整导入！
✅ AT/GY系列执行器: 完整 (55个)
✅ SF系列执行器: 完整 (282个)
   ✅ 球阀（不带C）: 141个
   ✅ 蝶阀（带C）: 141个
✅ AT系列机构类型: 齿轮齿条
✅ GY系列机构类型: 齿轮齿条
✅ SF系列机构类型: 拨叉式
✅ 手动操作装置: 完整 (18个)
✅ 配件: 完整 (10个)
```

### 3.2 手动抽查关键数据

```bash
# 检查SF系列球阀和蝶阀
node -e "
const mongoose = require('mongoose');
const Actuator = require('./models/Actuator');
mongoose.connect('mongodb://localhost:27017/cmax').then(async () => {
  console.log('=== 抽查SF系列数据 ===\n');
  
  const ball = await Actuator.findOne({ series: 'SF', valve_type: '球阀' });
  console.log('✅ 球阀样本:', ball.model_base, '(不带C)');
  
  const butterfly = await Actuator.findOne({ series: 'SF', valve_type: '蝶阀' });
  console.log('✅ 蝶阀样本:', butterfly.model_base, '(带C)');
  
  console.log('\n✅ 数据格式正确！');
  await mongoose.connection.close();
});
"
```

**检查点**:
- [ ] 球阀型号不带C（如: SF10-150DA）
- [ ] 蝶阀型号带C（如: SF10-150DAC）
- [ ] 机构类型都是"拨叉式"
- [ ] 阀门类型字段正确设置

---

## 📋 第四步：前端功能验证

### 4.1 启动前后端服务

**终端1 - 后端**:
```bash
cd backend
npm start
```

**终端2 - 前端**:
```bash
cd frontend
npm run dev
```

### 4.2 浏览器测试

访问: `http://localhost:5173`

**测试登录**: 
- 用户: 13000000002 (销售经理)
- 密码: password

### 4.3 产品目录页面检查清单

导航到: **产品目录**

**界面检查**:
- [ ] 页面能正常加载
- [ ] 没有401错误
- [ ] 没有控制台错误

**数据显示检查**:
- [ ] 产品总数显示: **337个** (55 + 282)
- [ ] 执行器统计正确
- [ ] 手动操作装置统计正确
- [ ] 配件统计正确

**表格列检查**:
- [ ] 显示"序号"列
- [ ] 显示"型号"列
- [ ] 显示"系列"列
- [ ] 显示"机构类型"列 ⭐
- [ ] 显示"阀门类型"列 ⭐
- [ ] 显示"作用类型"列
- [ ] ❌ 没有"产品类型"列
- [ ] ❌ 没有"轭架类型"列
- [ ] ❌ 没有"描述"列

**筛选器检查**:
- [ ] 系列筛选器: AT, GY, SF
- [ ] 机构类型筛选器: 齿轮齿条, 拨叉式
- [ ] 阀门类型筛选器: 球阀, 蝶阀 ⭐
- [ ] 作用类型筛选器: DA, SR

**筛选功能测试**:
1. 选择"SF系列" + "球阀":
   - [ ] 显示141个产品
   - [ ] 所有型号不带C
   - [ ] 机构类型都是"拨叉式"

2. 选择"SF系列" + "蝶阀":
   - [ ] 显示141个产品
   - [ ] 所有型号带C（结尾是C）
   - [ ] 机构类型都是"拨叉式"

3. 选择"AT系列":
   - [ ] 机构类型都是"齿轮齿条"
   - [ ] 阀门类型显示"-"

4. 选择"机构类型 = 拨叉式":
   - [ ] 只显示SF系列
   - [ ] 有球阀和蝶阀两种

---

## 📋 第五步：UAT关键场景测试

### 5.1 创建项目测试

按照 `docs/8_UAT_ACCEPTANCE_SCRIPT.md` 执行：

**第一幕：项目立项**
- [ ] 能正常创建项目
- [ ] 能添加选型清单
- [ ] 产品搜索正常
- [ ] 数据显示完整

### 5.2 选型功能测试

**测试场景**: 选择一个SF系列球阀执行器

- [ ] 能找到SF系列产品
- [ ] 能筛选球阀
- [ ] 型号显示正确（不带C）
- [ ] 技术参数完整

**测试场景**: 选择一个SF系列蝶阀执行器

- [ ] 能找到SF系列产品
- [ ] 能筛选蝶阀
- [ ] 型号显示正确（带C）
- [ ] 技术参数完整

---

## 📋 第六步：生产部署前最终检查

### 6.1 代码检查

```bash
# 确认所有文件已保存
git status

# 查看将要部署的内容
git diff HEAD
```

**关键文件最终确认**:
- [ ] `seed_final_acceptance.js` - 包含SF球阀+蝶阀生成逻辑
- [ ] `ProductCatalog.jsx` - 使用api实例，显示阀门类型列
- [ ] `verify_data_completeness.js` - 验证脚本完整
- [ ] `package.json` - 包含verify:all命令

### 6.2 数据验证脚本检查

```bash
# 最后一次运行验证
npm run verify:all

# 检查退出码
echo $?
```

**预期**: 退出码 = 0 (成功)

---

## 📋 第七步：文档检查

### 7.1 确认文档完整性

- [ ] `docs/9_DATA_INVENTORY.md` - 数据清单文档存在
- [ ] `DATA_INTEGRITY_REPORT.md` - 数据完整性报告存在
- [ ] `AXIOS_MIGRATION_PLAN.md` - axios迁移文档存在
- [ ] `PERMANENT_FIXES_GUARANTEE.md` - 永久修复保证书存在
- [ ] `PRE_TEST_CHECKLIST.md` (本文件) - 测试检查清单存在

### 7.2 UAT脚本更新

- [ ] `docs/8_UAT_ACCEPTANCE_SCRIPT.md` 已更新
- [ ] 包含数据验证步骤
- [ ] 包含预期数据量说明

---

## 🎯 最终确认清单

### 数据层面
- [ ] ✅ AT/GY系列: 55个，机构类型=齿轮齿条
- [ ] ✅ SF系列: 282个 (141球阀 + 141蝶阀)
- [ ] ✅ 球阀型号不带C
- [ ] ✅ 蝶阀型号带C
- [ ] ✅ SF系列机构类型=拨叉式
- [ ] ✅ 手动操作装置: 18个
- [ ] ✅ 配件: 10个

### 代码层面
- [ ] ✅ ProductCatalog使用api实例（认证正确）
- [ ] ✅ 显示阀门类型列和筛选器
- [ ] ✅ 显示机构类型列和筛选器
- [ ] ✅ 删除了不必要的列
- [ ] ✅ 所有修改已提交到Git

### 脚本层面
- [ ] ✅ `npm run seed:final` 工作正常
- [ ] ✅ `npm run verify:all` 工作正常
- [ ] ✅ 验证脚本能检测所有问题

### 文档层面
- [ ] ✅ 数据清单文档完整
- [ ] ✅ 修复报告详细
- [ ] ✅ 测试检查清单完整
- [ ] ✅ UAT脚本已更新

---

## ⚠️ 如果任何检查失败

### 立即停止！不要继续测试或部署！

1. **记录失败的检查项**
2. **查看相关文档找到解决方案**:
   - 数据问题 → `docs/9_DATA_INVENTORY.md`
   - 认证问题 → `AXIOS_MIGRATION_PLAN.md`
   - 其他问题 → `DATA_INTEGRITY_REPORT.md`

3. **修复问题后，从第一步重新开始**

---

## ✅ 所有检查通过后

可以开始正式UAT测试或生产部署！

**记录检查结果**:
- 检查日期: _________________
- 检查人: _________________
- 环境: □ 测试环境  □ 生产环境
- 结果: □ 通过  □ 失败
- 备注: _________________

---

## 📝 历史记录

| 日期 | 检查人 | 环境 | 结果 | 备注 |
|------|--------|------|------|------|
| 2025-10-30 | Team | 测试 | ✅ 通过 | 初始版本 |

---

**维护**: Project Ark Team  
**版本**: v1.0  
**最后更新**: 2025-10-30

