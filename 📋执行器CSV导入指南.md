# 执行器CSV批量导入指南

## ✅ 功能已完成

系统现在支持直接导入AT/GY和SF系列执行器CSV文件，无需修改格式！

---

## 🎯 支持的CSV格式

### 1. AT/GY系列格式
```csv
model_base,series,mechanism,action_type,spring_range,base_price_normal,base_price_low,base_price_high,manual_override_model,manual_override_price,seal_kit_price,torque_data,dimensions
AT-SR52K8,AT,Rack & Pinion,SR,K8,75,77,86,SD-1,127,1.5,"{""spring_end"":7.7,...}","{""A"":147,...}"
```

**关键字段：**
- `model_base`: 执行器型号（必填）
- `series`: 系列名称 AT/GY（必填）
- `action_type`: DA（双作用）或SR（弹簧复位）（必填）
- `base_price_normal/low/high`: 价格（至少一个）
- `torque_data`: JSON格式扭矩数据（自动解析）
- `dimensions`: JSON格式尺寸数据（自动解析）

### 2. SF系列格式
```csv
model_base,body_size,cylinder_size,action_type,spring_range,base_price,torque_symmetric,torque_canted,connect_flange,L1,L2,m1,m2,A,H1,H2,D,G
SF10-150DA,SF10,150,DA,,1339,"{""0.3_0"":309,...}","{""0.3_0"":417,...}","ISO 5211 F10",350,127,76,143.5,40,82,100,207,"NPT1/4"
```

**关键字段：**
- `model_base`: 执行器型号（必填）
- `series`: 系列名称 SF（通常包含在model_base中）
- `body_size`: 本体尺寸
- `cylinder_size`: 气缸尺寸
- `base_price`: 基础价格（必填）
- `torque_symmetric`: JSON格式对称扭矩（自动解析）
- `torque_canted`: JSON格式偏置扭矩（自动解析）
- 其他尺寸字段：L1, L2, m1, m2, A, H1, H2, D, G

---

## 📖 使用步骤

### 1. 打开批量导入页面
- 导航至：**产品批量导入** 页面
- 选择导入类型：**执行器数据（AT/GY/SF系列）**

### 2. 准备CSV文件
- ✅ 您的CSV文件（`at_gy_actuators_data_final.csv` 和 `sf_actuators_data.csv`）已经是正确格式
- ❌ 无需下载模板
- ❌ 无需修改字段名
- ❌ 无需手动解析JSON

### 3. 上传并导入
1. 点击"选择文件（CSV/Excel）"
2. 选择您的CSV文件
3. **可选**：勾选"更新重复数据"（如果想更新已存在的执行器）
4. 点击"开始导入"

### 4. 查看结果
系统会显示：
- ✅ 成功导入数量
- ⚠️ 跳过数量（重复的记录）
- ❌ 失败数量（含详细错误信息）

---

## 🔧 技术实现

### 自动处理功能
1. **系列识别**：自动识别AT、GY或SF系列
2. **JSON解析**：自动解析`torque_data`、`dimensions`等JSON字段
3. **字段映射**：自动映射CSV字段到数据库字段
4. **数据清理**：自动清理空值和格式问题
5. **重复检测**：基于`model_base`检测重复数据

### API端点
- **后端接口**：`POST /api/actuator-management/import-csv`
- **文件字段名**：`file`
- **额外参数**：`updateOnDuplicate`（true/false）

---

## 📊 CSV文件信息

### 您的文件
1. **at_gy_actuators_data_final.csv**
   - 包含：56条AT/GY系列执行器数据
   - 系列：AT（双作用和弹簧复位）、GY（双作用和弹簧复位）

2. **sf_actuators_data.csv**
   - 包含：141条SF系列执行器数据
   - 类型：双作用（DA）和弹簧复位（SR）

### 导入预期
- **AT/GY文件**：应成功导入 56 条数据
- **SF文件**：应成功导入 141 条数据
- **总计**：197 条执行器数据

---

## ⚙️ 配置选项

### 更新重复数据
- ✅ **勾选**：更新已存在的执行器数据
- ❌ **不勾选**：跳过重复数据（默认）

### 重复判定规则
系统基于 `model_base` 字段判定重复：
- `AT-SR52K8` = 已存在 → 跳过或更新
- `SF10-150DA` = 已存在 → 跳过或更新

---

## 🐛 故障排除

### 常见问题

**Q1: 上传后显示"CSV文件为空"**
- 检查CSV文件是否有标题行
- 确保文件编码为UTF-8
- 确认文件不是空文件

**Q2: 部分数据导入失败**
- 查看导入结果中的错误详情
- 常见原因：缺少必填字段（model_base、series、价格）

**Q3: JSON字段解析失败**
- 系统会自动尝试解析JSON
- 如果解析失败，该字段将为空，但不会导致整行失败

**Q4: 导入速度慢**
- 系统会逐条验证和导入
- 200条数据预计需要30-60秒
- 请耐心等待，不要关闭页面

---

## ✨ 功能亮点

### 1. 零配置导入
- ✅ 直接使用原始CSV文件
- ✅ 自动识别系列类型
- ✅ 自动处理JSON字段

### 2. 智能数据处理
- ✅ 自动清理空值
- ✅ 自动类型转换
- ✅ 自动字段映射

### 3. 详细反馈
- ✅ 实时导入进度
- ✅ 详细错误信息
- ✅ 跳过记录列表

---

## 📝 下一步

### 立即开始
1. 打开浏览器访问系统
2. 登录管理员账号
3. 进入"产品批量导入"页面
4. 选择"执行器数据"
5. 上传您的CSV文件
6. 等待导入完成

### 验证数据
导入完成后，可以：
- 进入**数据管理 > 执行器管理**查看导入的数据
- 使用搜索功能查找特定型号
- 查看统计信息确认数量

---

## 🎉 完成！

您现在可以轻松导入所有执行器CSV数据，系统会自动处理所有复杂的格式和验证工作！

**支持的文件：**
- ✅ at_gy_actuators_data_final.csv
- ✅ sf_actuators_data.csv
- ✅ 任何类似格式的执行器CSV文件

**文档创建时间：** 2025-11-03
**功能状态：** ✅ 已完成并可用

