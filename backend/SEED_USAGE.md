# 数据导入脚本使用说明

## 📋 概述

`seed.js` 是一个完整的数据库种子数据导入工具，用于从CSV文件批量导入执行器和手动操作装置数据到MongoDB数据库。

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

确保已安装以下依赖：
- `dotenv` - 环境变量管理
- `mongoose` - MongoDB ORM
- `csv-parser` - CSV文件解析

### 2. 配置环境变量

在 `backend/.env` 文件中配置数据库连接：

```env
MONGO_URI=mongodb://localhost:27017/cmax-actuators
# 或
MONGODB_URI=mongodb://localhost:27017/cmax-actuators
```

### 3. 准备CSV文件

确保以下文件存在于 `backend/data_imports/` 目录：
- `sf_actuators_data.csv` - 执行器数据
- `manual_overrides_data.csv` - 手动操作装置数据

### 4. 运行导入

```bash
npm run seed-csv
# 或
node seed.js
```

## 📁 CSV文件格式

### 执行器数据 (`sf_actuators_data.csv`)

**必需字段**:
```csv
model_base,body_size,action_type,base_price,torque_symmetric,torque_canted
SF10-150DA,SF10,DA,1339,"{""0_3_0"":309,...}","{""0_3_0"":417,...}"
```

**可选字段**:
- `cylinder_size` - 缸径 (数字)
- `spring_range` - 弹簧范围 (字符串)
- `connect_flange` - 连接法兰 (字符串)
- `L1, L2, m1, m2, A, H1, H2, D, G` - 尺寸参数

**扭矩数据格式**:
```json
{
  "0_3_0": 309,
  "0_3_45": 185,
  "0_4_0": 412,
  "0_5_0": 515
}
```

### 手动操作装置数据 (`manual_overrides_data.csv`)

**必需字段**:
```csv
model_base,name,price,compatible_body_sizes
SF10-150,手轮装置-小型,380,SF10
```

**字段说明**:
- `model_base` 或 `model` - 型号 (字符串)
- `name` - 名称 (字符串)
- `price` - 价格 (数字)
- `compatible_body_sizes` - 兼容尺寸，逗号分隔 (如: "SF10,SF12,SF14")

**可选字段**:
- `description` - 描述
- `application` - 应用场景
- `specifications` - 规格 (JSON格式)
- `dimensions` - 尺寸 (JSON格式)
- `stock_info` - 库存信息 (JSON格式)

## 🔧 脚本功能特性

### 1. 数据库管理
- ✅ 自动连接MongoDB数据库
- ✅ 导入前清空旧数据，防止重复
- ✅ 导入完成后自动关闭连接

### 2. 数据解析
- ✅ 使用专业的 `csv-parser` 库
- ✅ 自动解析JSON格式字段 (扭矩数据、规格等)
- ✅ 智能类型转换 (字符串 → 数字)
- ✅ 数组字段自动拆分 (逗号分隔 → 数组)
- ✅ Map类型数据处理 (扭矩数据)

### 3. 错误处理
- ✅ 文件存在性检查
- ✅ 逐行解析，单行错误不影响其他数据
- ✅ 详细的错误日志
- ✅ 批量插入失败自动回滚

### 4. 进度显示
- ✅ 美观的控制台输出
- ✅ 实时显示解析进度
- ✅ 详细的统计信息
- ✅ 成功/失败计数

## 📊 导入流程

```
1. 加载环境变量
   ↓
2. 连接数据库
   ↓
3. 清空旧数据
   ├─ 删除所有执行器记录
   └─ 删除所有手动操作装置记录
   ↓
4. 导入执行器数据
   ├─ 读取 CSV 文件
   ├─ 逐行解析数据
   ├─ 转换数据类型
   └─ 批量插入数据库
   ↓
5. 导入手动操作装置数据
   ├─ 读取 CSV 文件
   ├─ 逐行解析数据
   ├─ 转换数据类型
   └─ 批量插入数据库
   ↓
6. 显示统计信息
   ↓
7. 关闭数据库连接
```

## 📝 输出示例

```
╔════════════════════════════════════════════════╗
║     Project Ark 数据库种子数据导入工具        ║
╚════════════════════════════════════════════════╝

✅ 数据库连接成功: cmax-actuators

🗑️  清空现有数据...
  ✅ 删除了 145 条执行器记录
  ✅ 删除了 23 条手动操作装置记录

📦 开始导入执行器数据...
📄 文件路径: /path/to/sf_actuators_data.csv
📊 共读取 141 行数据
✅ 成功解析 141 条执行器记录
💾 成功导入 141 条执行器数据到数据库

🔧 开始导入手动操作装置数据...
📄 文件路径: /path/to/manual_overrides_data.csv
📊 共读取 18 行数据
✅ 成功解析 18 条手动操作装置记录
💾 成功导入 18 条手动操作装置数据到数据库

╔════════════════════════════════════════════════╗
║     数据导入完成！ 🎉                         ║
╚════════════════════════════════════════════════╝

📊 导入统计:
  ✅ 执行器:         141 条
  ✅ 手动操作装置:   18 条
  ✅ 总计:           159 条

✅ 数据库连接已关闭
```

## 🔌 模块化使用

脚本也可以作为模块在其他文件中使用：

```javascript
const { seedDatabase, importActuators, importManualOverrides } = require('./seed');

// 导入所有数据
await seedDatabase();

// 只导入执行器
await connectDatabase();
await importActuators();
await mongoose.connection.close();

// 只导入手动操作装置
await connectDatabase();
await importManualOverrides();
await mongoose.connection.close();
```

## ⚠️ 注意事项

1. **数据备份**: 运行脚本前会清空现有数据，请提前备份
2. **文件路径**: CSV文件必须放在 `backend/data_imports/` 目录
3. **数据格式**: 确保CSV文件格式正确，特别是JSON字段
4. **数据库连接**: 确保MongoDB服务正在运行
5. **环境变量**: 确保 `.env` 文件配置正确

## 🐛 常见问题

### 问题1: 数据库连接失败
```
❌ 数据库连接失败: connect ECONNREFUSED
```
**解决方案**: 
- 检查MongoDB服务是否运行: `mongod --version`
- 验证连接字符串是否正确
- 确认数据库端口是否开放

### 问题2: CSV文件找不到
```
❌ 执行器数据文件不存在
```
**解决方案**:
- 确认文件在 `backend/data_imports/` 目录
- 检查文件名是否正确
- 验证文件权限

### 问题3: 扭矩数据解析失败
```
⚠️  解析扭矩数据失败: Unexpected token
```
**解决方案**:
- 检查JSON格式是否正确
- 确保使用双引号而非单引号
- 验证转义字符是否正确

### 问题4: 批量插入失败
```
❌ 批量插入执行器数据失败: Validation failed
```
**解决方案**:
- 检查必需字段是否存在
- 验证数据类型是否匹配
- 查看详细错误信息定位问题行

## 📚 相关命令

```bash
# 标准导入
npm run seed-csv

# 直接运行
node seed.js

# 查看导入结果
mongosh cmax-actuators --eval "db.actuators.countDocuments()"
mongosh cmax-actuators --eval "db.manualoverrides.countDocuments()"

# 查看样本数据
mongosh cmax-actuators --eval "db.actuators.findOne()"
mongosh cmax-actuators --eval "db.manualoverrides.findOne()"
```

## 🎯 最佳实践

1. **开发环境测试**: 先在开发环境测试导入
2. **数据验证**: 导入后验证数据完整性和准确性
3. **定期备份**: 建立数据库定期备份机制
4. **版本控制**: 保留CSV文件的历史版本
5. **日志记录**: 保存导入日志供后续审查

## 📦 依赖版本

- Node.js: >= 14.0.0
- MongoDB: >= 4.4
- mongoose: >= 6.0.0
- csv-parser: >= 3.0.0
- dotenv: >= 16.0.0

---

**创建时间**: 2025-10-27  
**版本**: v2.0  
**作者**: Project Ark 开发团队

