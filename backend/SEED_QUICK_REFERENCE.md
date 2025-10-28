# 🚀 数据导入快速参考

## 一键导入

```bash
cd backend
npm run seed-csv
```

## CSV文件位置

```
backend/data_imports/
├── sf_actuators_data.csv        # 执行器数据
└── manual_overrides_data.csv    # 手动操作装置数据
```

## CSV格式速查

### 执行器 (sf_actuators_data.csv)
```csv
model_base,body_size,action_type,base_price,torque_symmetric,torque_canted
SF10-150DA,SF10,DA,1339,"{""0_3_0"":309}","{""0_3_0"":417}"
```

### 手动操作装置 (manual_overrides_data.csv)
```csv
model_base,name,price,compatible_body_sizes
SF10-150,手轮装置-小型,380,SF10
```

## 常用命令

```bash
# 导入数据
npm run seed-csv

# 查看数据
mongosh cmax-actuators --eval "db.actuators.countDocuments()"
mongosh cmax-actuators --eval "db.manualoverrides.countDocuments()"

# 查看样本
mongosh cmax-actuators --eval "db.actuators.findOne()"
mongosh cmax-actuators --eval "db.manualoverrides.findOne()"
```

## 环境变量

```env
# .env 文件
MONGO_URI=mongodb://localhost:27017/cmax-actuators
```

## 导入结果

✅ **成功**: 执行器 141 条 + 手动操作装置 18 条 = **159 条数据**

## 故障排查

| 问题 | 解决方案 |
|------|----------|
| 数据库连接失败 | 检查MongoDB是否运行 |
| 文件找不到 | 确认文件在data_imports目录 |
| 解析失败 | 检查CSV格式是否正确 |

## 详细文档

📖 完整使用指南: `SEED_USAGE.md`  
📊 完成报告: `../数据导入系统完成报告.md`

---
**版本**: v2.0 | **更新**: 2025-10-27

