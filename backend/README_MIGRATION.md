# 价格字段迁移 - README

> 将 `base_price` 迁移到 `price_tiers` 阶梯定价结构

---

## 🚀 快速开始

### 选项 1: 一键运行（推荐）

**Linux/macOS**:
```bash
cd backend
./run_migration.sh
```

**Windows**:
```cmd
cd backend
run_migration.bat
```

### 选项 2: 直接运行 Node.js 脚本

```bash
cd backend
node migration_price_tiers.js
```

---

## 📋 文件说明

| 文件 | 说明 |
|------|------|
| `migration_price_tiers.js` | 主迁移脚本（Node.js） |
| `run_migration.sh` | 一键运行脚本（Linux/macOS） |
| `run_migration.bat` | 一键运行脚本（Windows） |
| `MIGRATION_GUIDE.md` | 详细迁移指南和故障排除 |

---

## ✅ 前置条件

1. ✅ Node.js 已安装
2. ✅ MongoDB 服务已启动
3. ✅ `.env` 文件已配置（或使用默认连接）
4. ⚠️ **建议**：备份数据库

---

## 📊 迁移效果

### 迁移前

```javascript
{
  model_base: "AT-SR52K8",
  base_price: 5280
}
```

### 迁移后

```javascript
{
  model_base: "AT-SR52K8",
  price_tiers: [
    { min_quantity: 1,  unit_price: 5280, notes: "基础价格" },
    { min_quantity: 5,  unit_price: 5016, notes: "批量折扣5%" },
    { min_quantity: 10, unit_price: 4752, notes: "批量折扣10%" },
    { min_quantity: 20, unit_price: 4488, notes: "批量折扣15%" }
  ]
}
```

---

## 🔍 验证迁移

### MongoDB Shell

```javascript
// 查看迁移后的数据
db.actuators.findOne({ model_base: "AT-SR52K8" })

// 统计迁移数量
db.actuators.countDocuments({ "price_tiers.0": { $exists: true } })
```

### API 测试

```bash
# 获取执行器信息
curl http://localhost:5001/api/actuators/[ID]

# 测试价格计算（10件）
curl "http://localhost:5001/api/actuators/[ID]/price?quantity=10"
```

---

## ⚠️ 重要提示

- ✅ 脚本是**幂等的** - 可以多次运行
- ✅ 脚本是**安全的** - 只添加字段，不删除旧数据
- ⚠️ 建议先在测试环境验证
- ⚠️ 生产环境请先备份数据库

---

## 📞 需要帮助？

- 📖 查看 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- 📖 查看 [阶梯定价升级说明](../阶梯定价升级说明.md)
- 📖 查看 [阶梯定价快速参考](../阶梯定价快速参考.md)

---

**版本**: v1.0.0 | **日期**: 2025-10-27
