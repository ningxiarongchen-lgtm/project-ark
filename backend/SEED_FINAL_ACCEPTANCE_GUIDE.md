# 最终验收数据初始化脚本 - 使用指南

## 📋 概述

`seed_final_acceptance.js` 是一个完整的数据初始化脚本，用于：
- ✅ 最终验收测试
- ✅ 生产环境初始化
- ✅ 开发环境重置
- ✅ 演示环境搭建

## 🎯 功能特点

### Part A: 清空数据库（按正确顺序）
脚本会按照数据依赖关系的**正确顺序**清空所有集合：

1. **Token数据** - RefreshToken
2. **售后工单** - ServiceTicket
3. **生产相关** - WorkOrder, QualityCheck, Routing, WorkCenter
4. **财务数据** - Invoice, Payment
5. **订单数据** - ProductionOrder, PurchaseOrder, SalesOrder
6. **项目数据** - Quote, EngineeringChangeOrder, Project, NewProject
7. **用户数据** - User
8. **供应商** - Supplier
9. **产品数据** - Actuator, Accessory, ManualOverride, Product

### Part B: 创建10个角色的测试用户

| 角色 | 手机号 | 密码 | 部门 |
|------|--------|------|------|
| 系统管理员 | 13000000001 | password | 管理部门 |
| 销售经理 | 13000000002 | password | 销售部 |
| 技术工程师 | 13000000003 | password | 技术部 |
| 商务工程师 | 13000000004 | password | 商务部 |
| 采购专员 | 13000000005 | password | 采购部 |
| 生产计划员 | 13000000006 | password | 生产部 |
| 质检员 | 13000000007 | password | 质检部 |
| 物流专员 | 13000000008 | password | 物流部 |
| 车间工人 | 13000000009 | password | 生产车间 |

**注意**：
- 所有账户 `passwordChangeRequired: false`，首次登录无需强制修改密码
- 手机号符合中国手机号验证规则（以13开头的11位号码）
- 密码为简单的 `password`（测试环境专用）

### Part C: 创建供应商数据

创建5个供应商，覆盖不同业务范围：
- 北京精密机械有限公司（AT系列供应商）
- 上海工业控制设备厂（GY系列供应商）
- 广州电气配件供应商（配件供应商）
- 天津阀门附件制造厂（附件供应商）
- 深圳智能控制系统有限公司（高端配件）

### Part D: 导入执行器数据

从CSV文件 `data_imports/at_gy_actuators_data_final.csv` 导入：
- ✅ AT系列执行器（双作用、弹簧复位）
- ✅ GY系列执行器（双作用、弹簧复位）
- ✅ 完整的价格数据（常温、低温、高温）
- ✅ 扭矩数据（对称、斜角）
- ✅ 规格参数

**本次运行成功导入：55个执行器型号**

### Part E: 创建手动操作装置数据

创建4个型号的手动操作装置：
- MO-100（100型，580元）
- MO-150（150型，680元）
- MO-200（200型，880元）
- MO-250（250型，1080元）

### Part F: 创建配件数据

创建8个配件，覆盖4大类别：
1. **控制类**：电磁阀（单线圈、双线圈）
2. **检测与反馈类**：限位开关、位置变送器
3. **连接与传动类**：联轴器（ISO F07、F10）
4. **安全与保护类**：气源三联件、快速排气阀

### Part G: 创建示例业务数据（可选）

创建1个示例项目：
- 项目编号：PRJ-2025-0001
- 项目名称：石化厂阀门自动化改造项目
- 客户：中石化上海分公司
- 预算：¥500,000

## 🚀 使用方法

### 基本用法

```bash
# 在backend目录下运行
cd backend
node seed_final_acceptance.js
```

### 运行结果

```
═══════════════════════════════════════════════════════════════════════
                     数据初始化完成！ 🎉                               
═══════════════════════════════════════════════════════════════════════

📊 统计信息:
  🗑️  已清除记录:       64 条
  👥 测试用户:          10 个
  🏢 供应商:            5 个
  📦 执行器型号:        55 个
  🔧 手动操作装置:      4 个
  🔌 配件:              8 个
  ⏱️  总耗时:            1.69 秒
```

## ⚙️ 环境要求

### 必需配置

在 `.env` 文件中配置数据库连接：

```env
MONGO_URI=mongodb://localhost:27017/project_ark
# 或
MONGODB_URI=mongodb://localhost:27017/project_ark
```

### 必需文件

确保以下文件存在：
- `backend/data_imports/at_gy_actuators_data_final.csv`

如果CSV文件不存在，脚本会跳过执行器数据导入，但其他部分仍会正常运行。

## 🔄 不同场景的使用

### 场景1：最终验收测试（完整运行）

```bash
node seed_final_acceptance.js
```

适用于：
- 系统最终验收
- 完整功能测试
- 性能测试准备

### 场景2：生产环境初始化（仅基础数据）

如果只需要基础数据，可以修改脚本注释掉 Part G：

```javascript
// Part G: 创建示例业务数据（可选）
// await seedExampleBusinessData();  // 注释掉这行
```

适用于：
- 生产环境首次部署
- 只需产品目录和用户账户

### 场景3：开发环境快速重置

```bash
# 快速重置开发环境
node seed_final_acceptance.js
```

适用于：
- 开发测试后需要重置环境
- 需要干净的测试数据

## 📊 数据验证

运行脚本后，可以验证数据是否正确：

### 1. 检查用户数量

```bash
# MongoDB Shell
use cmax
db.users.count()  // 应该是 10
```

### 2. 检查产品数量

```bash
db.actuators.count()        // 应该是 55
db.manualoverrides.count()  // 应该是 4
db.accessories.count()      // 应该是 8
```

### 3. 检查供应商

```bash
db.suppliers.count()  // 应该是 5
```

### 4. 登录测试

访问前端系统，使用任一测试账户登录：
- 手机号：13000000002（销售经理）
- 密码：password

## ⚠️ 重要提示

### 数据安全

1. **生产环境使用警告**：
   - ⚠️ 此脚本会**完全清空**数据库！
   - ⚠️ 在生产环境使用前务必备份数据
   - ⚠️ 建议仅在初始化全新环境时使用

2. **备份建议**：
   ```bash
   # 备份当前数据库
   mongodump --db cmax --out ./backup_$(date +%Y%m%d_%H%M%S)
   ```

### 密码安全

- 测试环境密码为：`password`（简单密码，仅用于测试）
- ⚠️ **生产环境部署前必须修改为强密码**
- 生产环境建议首次登录后强制用户修改密码
- 可以在脚本中将 `passwordChangeRequired` 设置为 `true`

### CSV文件路径

如果CSV文件路径不同，修改脚本中的路径：

```javascript
const csvPath = path.join(__dirname, 'data_imports', 'at_gy_actuators_data_final.csv');
```

## 🛠️ 故障排查

### 问题1：数据库连接失败

**错误信息**：
```
❌ 数据库连接失败: MongoServerSelectionError
```

**解决方案**：
1. 检查MongoDB服务是否运行
2. 检查 `.env` 文件中的 `MONGO_URI` 配置
3. 确认数据库服务器地址和端口正确

### 问题2：CSV文件未找到

**错误信息**：
```
⚠️  未找到执行器CSV文件，跳过执行器数据导入
```

**解决方案**：
1. 确认文件存在于 `backend/data_imports/` 目录
2. 检查文件名是否为 `at_gy_actuators_data_final.csv`
3. 如果没有CSV文件，脚本会继续运行其他部分

### 问题3：重复数据错误

**错误信息**：
```
MongoServerError: E11000 duplicate key error
```

**解决方案**：
- 这通常在执行器导入时发生
- 脚本已配置 `{ ordered: false }` 跳过重复项
- 查看输出了解有多少数据成功导入

### 问题4：权限错误

**错误信息**：
```
MongoServerError: not authorized
```

**解决方案**：
1. 检查数据库用户权限
2. 确保用户有读写权限
3. 更新 `MONGO_URI` 包含正确的用户名和密码

## 📈 性能优化

### 大量数据导入优化

如果需要导入大量数据，可以优化：

1. **批量插入**：
   ```javascript
   // 已使用 insertMany 进行批量操作
   await Actuator.insertMany(actuators, { ordered: false });
   ```

2. **并行处理**（高级）：
   ```javascript
   // 可以并行运行不依赖的部分
   await Promise.all([
     seedSuppliers(),
     seedManualOverrides(),
     seedAccessories()
   ]);
   ```

## 🔧 自定义扩展

### 添加更多测试用户

在 `testUsers` 数组中添加：

```javascript
{
  full_name: '新角色名称',
  phone: '18800000010',  // 确保唯一
  password: 'Password123!',
  role: 'Administrator',  // 选择合适的角色
  department: '部门名称',
  isActive: true,
  passwordChangeRequired: false
}
```

### 添加更多供应商

在 `testSuppliers` 数组中添加供应商数据。

### 修改示例项目

在 `seedExampleBusinessData()` 函数中自定义项目数据。

## 📝 日志和调试

### 查看详细输出

脚本已包含详细的控制台输出，显示每一步的进度。

### 启用调试模式（可选）

如需更详细的MongoDB操作日志：

```javascript
// 在 connectDatabase() 函数中添加
mongoose.set('debug', true);
```

## 🎓 最佳实践

1. **定期运行**：在重要测试前运行脚本确保环境干净
2. **版本控制**：将脚本纳入版本控制，随项目演进更新
3. **文档更新**：如果修改了脚本，同步更新本文档
4. **备份习惯**：在生产环境运行前务必备份
5. **测试验证**：运行后验证关键数据是否正确

## 🚀 持续改进

未来可以增强的功能：
- [ ] 添加命令行参数（选择性运行某些部分）
- [ ] 支持从多个CSV文件导入
- [ ] 添加数据验证和完整性检查
- [ ] 生成数据导入报告（JSON/Excel）
- [ ] 支持增量更新（而非完全清空）

## 📞 支持

如有问题或建议，请联系开发团队。

---

**版本**：1.0.0  
**最后更新**：2025-10-29  
**维护者**：开发团队

