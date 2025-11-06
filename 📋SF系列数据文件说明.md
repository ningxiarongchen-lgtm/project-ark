# 📋 SF系列数据文件说明

**日期**: 2025-11-06

---

## 📂 文件位置

### 1. 模板文件（供用户下载）
**位置**: `/SF系列执行器导入模板.csv`

**状态**: ✅ **已更新**，包含所有新字段

**用途**: 
- 管理员通过系统下载的Excel模板
- 用户填写并上传的标准模板
- **这是主要使用的模板**

### 2. 后端数据文件（系统内部）
**位置**: `/backend/data_imports/sf_actuators_data.csv`

**状态**: ⚠️ **未更新**（保持原格式）

**用途**:
- 系统开发/测试时的批量数据导入
- 初始化数据库的参考数据
- **不影响用户操作**

---

## 🔄 向后兼容性说明

### 后端导入逻辑支持两种格式

由于后端代码（`actuatorController.js`）使用了**可选字段读取**：

```javascript
const actuatorData = {
  model_base: row.model_base || row['型号基础'] || row['型号'],
  series: row.series || row['系列'],              // ← 可选
  mechanism: row.mechanism || row['机构类型'],     // ← 可选
  valve_type: row.valve_type || row['阀门类型'],  // ← 可选
  body_size: row.body_size || row['本体尺寸'],
  ...
};
```

因此：
- ✅ **旧格式**（无 series/mechanism/valve_type）→ 可以导入
- ✅ **新格式**（有 series/mechanism/valve_type）→ 可以导入，数据更完整

---

## 📋 文件对比

### 旧格式表头（后端数据文件）
```csv
model_base,body_size,cylinder_size,action_type,spring_range,base_price,torque_symmetric,torque_canted,connect_flange,L1,L2,m1,m2,A,H1,H2,D,G
```

**字段数**: 18个

### 新格式表头（用户模板文件）
```csv
model_base,series,mechanism,valve_type,body_size,cylinder_size,action_type,spring_range,base_price,base_price_normal,base_price_low,base_price_high,torque_symmetric,torque_canted,connect_flange,L1,L2,m1,m2,A,H1,H2,D,G,description
```

**字段数**: 25个

**新增字段**:
1. `series` - 系列标识
2. `mechanism` - 机构类型
3. `valve_type` - 阀门类型
4. `base_price_normal` - 常温价格（标准命名）
5. `base_price_low` - 低温价格
6. `base_price_high` - 高温价格
7. `description` - 产品描述

---

## 🎯 推荐做法

### 对于管理员
✅ **使用新模板**（从系统下载）
- 包含所有必需字段
- 数据更完整、规范
- 便于后续查询和统计

### 对于开发/测试
⚠️ **后端数据文件可保持原样**
- 仅用于开发测试
- 字段缺失不影响导入
- 如需更新，可使用脚本批量处理

---

## 🔧 如何更新后端数据文件（可选）

如果需要将后端数据文件更新为新格式，可以：

### 方法1：手动添加字段（推荐）

在表头后添加新字段，数据行可留空或填默认值：

```csv
model_base,series,mechanism,valve_type,body_size,...
SF10-150DA,SF,Scotch Yoke,Ball Valve,SF10,...
```

### 方法2：使用脚本批量转换

创建一个Node.js脚本自动转换：

```javascript
const fs = require('fs');
const csv = require('csv-parser');

// 读取旧格式，输出新格式
// 为每行自动添加 series=SF, mechanism=Scotch Yoke 等
```

### 方法3：从数据库导出

如果数据已导入数据库：
1. 在数据库中更新现有记录
2. 使用MongoDB导出功能
3. 转换为新格式CSV

---

## ⚠️ 重要提醒

### 用户使用的模板
✅ **必须使用新格式**
- 从系统"下载模板"功能获取
- 包含所有新增字段
- 确保数据完整性

### 后端测试数据
⚠️ **可选更新**
- 不影响用户操作
- 系统可正常处理旧格式
- 更新可提升测试数据质量

---

## 📞 技术支持

如需批量更新后端数据文件，请参考：
- 📖 [批量导入功能完整指南](/✅批量导入功能-完整指南.md)
- 📋 [执行器CSV导入指南](/📋执行器CSV导入指南.md)

---

**总结**: 用户使用的模板已完整更新✅，后端数据文件可保持原样⚠️（不影响功能）

