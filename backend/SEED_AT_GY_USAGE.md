# AT/GY 系列数据导入使用说明

## 📋 概述

`seed_at_gy.js` 是专门用于导入 AT 和 GY 系列齿轮齿条式执行机构数据的脚本。该脚本采用**智能更新策略**，不会删除现有的 SF 系列数据。

## 🚀 快速开始

### 1. 准备 CSV 文件

确保文件存在于 `backend/data_imports/` 目录：
- `at_gy_actuators_data.csv` - AT/GY 系列执行器数据

### 2. 运行导入

```bash
cd backend
npm run seed-at-gy
```

## 📁 CSV 文件格式

### AT/GY 系列数据格式

**必需字段**:
```csv
model_base,series,mechanism,action_type,spring_range,base_price,torque_data,dimensions
AT-SR52K8,AT,Rack & Pinion,SR,K8,75,"{""spring_end"":7.7,...}","{""A"":147,...}"
```

**字段说明**:
- `model_base` - 完整型号 (如: AT-SR52K8, AT-DA52)
- `series` - 系列名称 (AT 或 GY)
- `mechanism` - 机构类型 (Rack & Pinion - 齿轮齿条)
- `action_type` - 作用类型 (SR=弹簧复位, DA=双作用)
- `spring_range` - 弹簧范围 (如: K8, K10，仅SR型号有)
- `base_price` - 基础价格 (数字)
- `torque_data` - 扭矩数据 (JSON格式)
- `dimensions` - 尺寸数据 (JSON格式，可选)

### 扭矩数据格式

**弹簧复位型 (SR)**:
```json
{
  "spring_end": 7.7,
  "air_start_0.55MPa": 9.9,
  "air_end_0.55MPa": 6.7
}
```

**双作用型 (DA)**:
```json
{
  "0.3MPa": 6,
  "0.4MPa": 8,
  "0.5MPa": 10,
  "0.55MPa": 11,
  "0.6MPa": 12,
  "0.7MPa": 14,
  "0.8MPa": 16
}
```

### 尺寸数据格式

```json
{
  "A": 147,
  "B": 65,
  "H": 92
}
```

## 🔧 脚本特性

### 1. 智能导入策略
- ✅ **不删除现有数据** - 保留 SF 系列数据
- ✅ **更新或插入** - 已存在的型号会更新，新型号会插入
- ✅ **逐条处理** - 单条失败不影响其他数据

### 2. 数据处理
- ✅ JSON 扭矩数据自动解析
- ✅ 尺寸数据自动解析
- ✅ 自动提取 body_size
- ✅ 智能类型转换
- ✅ 扭矩数据键名安全处理（点 → 下划线）

### 3. 错误处理
- ✅ 文件存在性检查
- ✅ 逐行错误捕获
- ✅ 详细的错误日志
- ✅ 失败统计报告

### 4. 数据映射

**AT/GY 系列特点**:
- 机构类型：齿轮齿条 (Rack & Pinion)
- 扭矩数据存储在 `torque_symmetric` 字段
- `torque_canted` 字段为空（AT/GY 系列不使用倾斜轭架）
- 自动生成描述信息

## 📊 导入结果示例

```
╔════════════════════════════════════════════════╗
║   AT/GY 齿轮齿条式执行机构数据导入工具        ║
╚════════════════════════════════════════════════╝

✅ 数据库连接成功: cmax-actuators

📝 导入策略: 更新已有数据或插入新数据（不删除现有 SF 系列数据）

📦 开始导入 AT/GY 系列执行器数据...
📄 文件路径: .../at_gy_actuators_data.csv
📊 共读取 36 行数据
✅ 成功解析 36 条 AT/GY 执行器记录
  ✅ 创建: AT-SR52K8
  ✅ 创建: AT-SR52K10
  ...
  ✅ 创建: AT-DA270

💾 导入统计:
  ✅ 成功: 36 条
  ❌ 失败: 0 条

╔════════════════════════════════════════════════╗
║     AT/GY 数据导入完成！ 🎉                   ║
╚════════════════════════════════════════════════╝

📊 导入统计:
  ✅ AT/GY 执行器:   36 条
  📦 数据库总计:     177 条执行器

✅ 数据库连接已关闭
```

## 🔍 数据验证

### 验证命令

```bash
# 查看 AT/GY 数量
mongosh cmax-actuators --eval "db.actuators.countDocuments({model_base: /^AT-/})"

# 查看样本数据
mongosh cmax-actuators --eval "db.actuators.find({model_base: /^AT-/}).limit(3)"

# 查看扭矩数据
mongosh cmax-actuators --eval "db.actuators.findOne({model_base: 'AT-SR52K8'})"
```

### 数据统计

成功导入后：
- **AT 系列 (SR - 弹簧复位)**: 23 条
- **AT 系列 (DA - 双作用)**: 13 条
- **总计**: 36 条

数据库总览：
- **SF 系列**: 141 条
- **AT/GY 系列**: 36 条
- **总执行器数量**: 177 条

## 🔄 重复导入

脚本支持多次运行：
- 已存在的型号会被更新
- 新型号会被添加
- 不会产生重复数据

```bash
# 安全运行，不会删除现有数据
npm run seed-at-gy
```

## 📝 与 SF 系列导入的区别

| 特性 | SF 系列 (seed.js) | AT/GY 系列 (seed_at_gy.js) |
|------|-------------------|----------------------------|
| 导入前操作 | 清空所有数据 | 保留现有数据 |
| 扭矩数据 | symmetric + canted | 仅 symmetric |
| 机构类型 | 气动叶片式 | 齿轮齿条式 |
| 轭架类型 | 对称/倾斜 | 不适用 |
| 工作角度 | 多种压力×多种角度 | 不同压力 |

## 🎯 最佳实践

1. **首次导入**: 先运行 `npm run seed` 导入 SF 系列基础数据
2. **添加 AT/GY**: 再运行 `npm run seed-at-gy` 添加 AT/GY 系列
3. **更新数据**: 修改 CSV 后可直接重新运行，不影响其他数据
4. **验证结果**: 导入后验证数据完整性和准确性

## 📚 相关命令

```bash
# 导入 SF 系列（会清空所有数据）
npm run seed

# 导入 AT/GY 系列（不会清空数据）
npm run seed-at-gy

# 查看所有执行器
mongosh cmax-actuators --eval "db.actuators.find()"

# 按系列统计
mongosh cmax-actuators --eval "
  db.actuators.aggregate([
    {$group: {_id: {$substr: ['$model_base', 0, 2]}, count: {$sum: 1}}},
    {$sort: {_id: 1}}
  ])
"
```

## 🐛 常见问题

### 问题1: 数据库连接失败
**解决方案**: 检查 MongoDB 服务和 `.env` 配置

### 问题2: CSV 文件找不到
**解决方案**: 确认文件在 `backend/data_imports/at_gy_actuators_data.csv`

### 问题3: 扭矩数据解析失败
**解决方案**: 检查 JSON 格式，确保使用双引号

### 问题4: 型号重复
**解决方案**: 脚本会自动更新现有型号，这是正常行为

## 🔌 模块化使用

```javascript
const { seedATGYDatabase, importATGYActuators } = require('./seed_at_gy');

// 完整导入
await seedATGYDatabase();

// 仅导入 AT/GY（需要手动连接数据库）
await connectDatabase();
await importATGYActuators();
await mongoose.connection.close();
```

## 📦 依赖

- Node.js >= 14.0.0
- MongoDB >= 4.4
- mongoose >= 6.0.0
- csv-parser >= 3.0.0
- dotenv >= 16.0.0

## ✨ 数据示例

导入后的数据结构：

```javascript
{
  model_base: "AT-SR52K8",
  body_size: "AT52",
  action_type: "SR",
  base_price: 75,
  spring_range: "K8",
  torque_symmetric: Map {
    "spring_end" => 7.7,
    "air_start_0_55MPa" => 9.9,
    "air_end_0_55MPa" => 6.7
  },
  torque_canted: Map {},
  technical_specs: {
    dimensions: {
      A: 147,
      B: 65,
      H: 92
    }
  },
  description: "AT系列 Rack & Pinion 齿轮齿条式执行机构"
}
```

---

**创建时间**: 2025-10-27  
**版本**: v1.0  
**作者**: Project Ark 开发团队

