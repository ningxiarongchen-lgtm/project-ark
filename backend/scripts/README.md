# SF系列尺寸数据导入脚本

## 📁 文件结构

```
backend/scripts/
├── README.md                  # 本文档
├── sf_dimension_data.js       # SF系列尺寸数据（数据源）
└── mergeDimensions.js         # 数据合并脚本
```

## 📋 文件说明

### 1. sf_dimension_data.js - 数据源文件

包含两部分数据：

#### `sharedDimensions` - 共享尺寸数据
按本体尺寸（bodySize）组织的法兰和顶部安装尺寸：
- SF10, SF12, SF14, SF16
- SF25, SF30, SF35, SF40
- SF48, SF60

#### `sf_all_dimensions_data` - 完整型号数据
包含所有54个SF系列型号的：
- 轮廓尺寸（outline）
- 气动连接尺寸（pneumaticConnection）

### 2. mergeDimensions.js - 合并脚本

功能：
- 自动合并共享数据和型号特定数据
- 批量更新数据库中的执行器记录
- 内置数据验证功能
- 详细的执行日志和错误报告

## 🚀 使用方法

### 第一步：确认环境配置

确保 `.env` 文件中配置了数据库连接：

```bash
MONGODB_URI=mongodb://localhost:27017/model_selection_system
```

### 第二步：运行合并脚本

在项目根目录执行：

```bash
node backend/scripts/mergeDimensions.js
```

### 第三步：查看执行结果

脚本会输出详细的执行日志：

```
✅ 数据库连接成功...

========== 开始合并尺寸数据 ==========

✅ 成功更新型号: SF10-150DA
✅ 成功更新型号: SF10-170DA
✅ 成功更新型号: SF12-170DA
...
✅ 成功更新型号: SF60-1100SR3

========== 数据合并完成 ==========
✅ 成功更新: 54 个型号
⚠️  未找到型号: 0 个型号
❌ 更新失败: 0 个型号
📊 总计处理: 54 个型号
📈 成功率: 100.00%

========== 验证更新结果 ==========
找到 54 个 SF 系列执行器

验证结果:
✅ 完整数据: 54 个型号
⚠️  数据不完整: 0 个型号

✅ 已断开数据库连接
🎉 脚本执行完成！
```

## 📊 数据结构

### 合并后的完整尺寸数据

```javascript
{
  dimensions: {
    // 轮廓尺寸（型号特定）
    outline: {
      L1: Number,  // 单作用总长（仅SR型号）
      L2: Number,  // 气缸长度
      m1: Number,
      m2: Number,
      A: Number,
      H1: Number,
      H2: Number,
      D: Number
    },
    
    // 气动连接（型号特定）
    pneumaticConnection: {
      size: String,  // 'NPT1/4"', 'NPT3/8"', etc.
      h2: Number
    },
    
    // 法兰尺寸（按本体尺寸共享）
    flange: {
      standard: String,     // 'ISO 5211 F10'
      D: Number,
      A: Number,
      C: Number,
      F: Number,
      threadSpec: String,   // '4-M10'
      threadDepth: Number,
      B: Number,
      T: Number
    },
    
    // 顶部安装（按本体尺寸共享）
    topMounting: {
      standard: String,     // 'NAMUR VDI/VDE 3845'
      L: Number,
      h1: Number,
      H: Number
    }
  }
}
```

## 🔧 数据维护

### 添加新型号

1. 在 `sf_dimension_data.js` 中的 `sf_all_dimensions_data` 数组添加新型号：

```javascript
{
  model: 'SF10-200DA',
  bodySize: 'SF10',
  dimensions: {
    outline: {
      L2: 350,
      m1: 127,
      m2: 76,
      A: 160.5,
      H1: 40,
      H2: 82,
      D: 100
    },
    pneumaticConnection: {
      size: 'NPT1/2"'
    }
  }
}
```

2. 运行合并脚本更新数据库

### 修改共享尺寸

1. 在 `sf_dimension_data.js` 中修改对应的 `sharedDimensions` 条目
2. 运行合并脚本，该本体尺寸的所有型号将自动更新

## ✅ 验证数据

### 使用内置验证

合并脚本会自动验证数据完整性

### 使用查询工具

```bash
# 查询所有SF系列
node backend/query_sf_dimensions.js

# 查询特定型号
node backend/query_sf_dimensions.js SF10-150DA
```

## ⚠️ 注意事项

1. **数据库字段名称**
   - 数据库中使用 `model_base` 而不是 `model`
   - 脚本已自动处理此差异

2. **型号匹配**
   - 使用正则表达式进行模糊匹配
   - 支持匹配基础型号（不含温度代码等后缀）

3. **数据备份**
   - 运行脚本前建议备份数据库
   - 脚本不会删除数据，只会覆盖 `dimensions` 字段

4. **共享数据影响**
   - 修改共享尺寸会影响所有使用该本体尺寸的型号
   - 修改前请仔细确认

## 🐛 故障排查

### 问题：未找到型号

**原因：** 数据库中不存在该型号

**解决：**
1. 检查 `model_base` 字段是否与数据文件中的 `model` 一致
2. 确认该型号已在数据库中创建
3. 检查型号名称大小写

### 问题：更新失败

**原因：** 数据库连接或权限问题

**解决：**
1. 确认 `MONGODB_URI` 配置正确
2. 检查数据库服务是否运行
3. 确认用户有写入权限

### 问题：数据不完整

**原因：** 共享数据或型号数据缺失

**解决：**
1. 检查 `sharedDimensions` 中是否有对应的本体尺寸
2. 检查型号数据中的 `outline` 和 `pneumaticConnection` 是否完整
3. 运行验证功能查看具体缺失的字段

## 📚 相关文档

- `/backend/DIMENSIONS_STRUCTURE_GUIDE.md` - 尺寸结构详细说明
- `/backend/SF_DIMENSIONS_USAGE.md` - 使用指南
- `/backend/update_sf_dimensions.js` - 另一个版本的导入脚本（数据内嵌）
- `/backend/query_sf_dimensions.js` - 数据查询验证工具

## 🔄 脚本对比

### mergeDimensions.js（本脚本）

**优点：**
- 数据和逻辑分离
- 易于维护和更新数据
- 适合团队协作

**使用场景：**
- 需要频繁更新数据
- 多人维护数据
- 数据需要版本控制

### update_sf_dimensions.js（替代方案）

**优点：**
- 单文件包含所有内容
- 独立运行，无依赖
- 适合一次性导入

**使用场景：**
- 初次导入数据
- 一次性批量更新
- 独立部署环境

## 💡 最佳实践

1. **数据更新流程**
   ```bash
   # 1. 修改数据文件
   nano backend/scripts/sf_dimension_data.js
   
   # 2. 运行合并脚本
   node backend/scripts/mergeDimensions.js
   
   # 3. 验证结果
   node backend/query_sf_dimensions.js
   ```

2. **版本控制**
   - 将 `sf_dimension_data.js` 加入 Git 版本控制
   - 每次修改添加清晰的 commit 信息
   - 建议使用分支进行数据更新

3. **测试环境**
   - 在测试环境先运行脚本
   - 验证数据正确性后再在生产环境运行
   - 保留测试日志以便排查问题

---

**文档版本**: v1.0  
**创建日期**: 2025-10-30  
**作者**: AI Assistant

