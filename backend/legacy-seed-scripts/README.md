# Legacy Seed Scripts Archive

## 📦 归档说明

本文件夹包含已被 `seed_final_acceptance.js` 取代的旧数据初始化脚本。

**归档日期**: 2025-10-30

---

## 🔄 脚本迁移说明

### ⭐ 新的统一脚本

现在只需使用一个脚本：

```bash
npm run seed:final
```

对应文件：`seed_final_acceptance.js`

---

### 已归档的旧脚本

| 旧脚本 | 原用途 | 问题 |
|--------|--------|------|
| `seed.js` | 基础数据初始化 | 数据不完整，缺少演示场景 |
| `seed_at_gy_final.js` | AT/GY 系列数据 | 只包含部分产品系列 |
| `seed_at_gy.js` | AT/GY 系列（旧版） | 数据格式过时 |
| `seed_all_actuators_final.js` | 所有执行器数据 | 缺少尺寸数据和演示项目 |
| `seed_comprehensive_test.js` | 综合测试数据 | 测试数据不适合演示 |
| `seed_mock_suppliers.js` | 供应商数据 | 功能已整合到主脚本 |
| `seed_test_ticket.js` | 测试工单数据 | 功能已整合到主脚本 |
| `seed_test_users.js` | 测试用户数据 | 功能已整合到主脚本 |
| `seed_final_test_data.js` | 最终测试数据 | 已被新脚本替代 |

---

## ✅ 新脚本的优势

`seed_final_acceptance.js` 提供了：

1. ✅ **完整的产品数据** - 包含所有系列（AT、GY、SF）
2. ✅ **完整的尺寸数据** - 支持技术文档生成
3. ✅ **精心设计的演示项目** - 支持标准演示剧本
4. ✅ **10 个角色用户** - 覆盖所有业务场景
5. ✅ **一键重置** - 确保演示环境一致性

---

## 📝 Package.json 更新

旧的脚本命令已从 `package.json` 中移除或保留为兼容性引用。

### 推荐使用

```json
{
  "scripts": {
    "seed:final": "node seed_final_acceptance.js"  // ⭐ 唯一推荐
  }
}
```

---

## ⚠️ 重要提示

1. **不要使用这些旧脚本** - 它们可能导致数据不一致
2. **所有数据初始化应使用 `npm run seed:final`**
3. **本文件夹仅供历史参考和代码考古**

---

## 🗑️ 何时可以删除

当以下条件满足时，可以考虑删除本文件夹：

- ✅ `seed_final_acceptance.js` 已稳定运行 6 个月以上
- ✅ 确认没有遗漏的重要逻辑
- ✅ 所有团队成员都已习惯新脚本

---

© 2025 Project Ark Team. All Rights Reserved.

