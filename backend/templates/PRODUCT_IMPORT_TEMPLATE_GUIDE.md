# 产品批量导入模板使用说明

## 模板文件
- CSV 模板: `product_import_template.csv`
- 支持格式: CSV, XLSX, XLS

## 字段说明

### 必填字段 (Required Fields)
| 字段名 | 说明 | 示例 |
|--------|------|------|
| modelNumber | 产品型号（唯一） | SF-100 |
| description | 产品描述 | 标准气动执行器 |
| torqueValue | 扭矩值 (Nm) | 100 |
| operatingPressure | 工作压力 (bar) | 6 |
| basePrice | 基础价格 | 1500 |

### 可选字段 (Optional Fields)

#### 基本信息
- **series**: 产品系列 (默认: SF-Series)
- **category**: 产品类别
  - 可选值: Standard, High Torque, Compact, High Temperature, Special
  - 默认: Standard
- **notes**: 备注信息

#### 扭矩规格
- **torqueMin**: 最小扭矩 (Nm)
- **torqueMax**: 最大扭矩 (Nm)

#### 压力规格
- **pressureMin**: 最小压力 (bar, 默认: 4)
- **pressureMax**: 最大压力 (bar, 默认: 8)

#### 温度规格
- **rotation**: 旋转角度
  - 可选值: 90°, 180°, 270°
  - 默认: 90°
- **tempMin**: 最低工作温度 (°C, 默认: -20)
- **tempMax**: 最高工作温度 (°C, 默认: 80)

#### 尺寸规格
- **length**: 长度 (mm)
- **width**: 宽度 (mm)
- **height**: 高度 (mm)
- **weight**: 重量 (kg)

#### 连接规格
- **portSize**: 接口尺寸
  - 可选值: G1/8, G1/4, G3/8, G1/2, NPT1/8, NPT1/4, NPT3/8, NPT1/2
- **mountingType**: 安装类型
  - 可选值: ISO5211, NAMUR, Direct Mount, Custom

#### 材料规格
- **materialBody**: 本体材料 (默认: Aluminum Alloy)
- **materialPiston**: 活塞材料 (默认: Aluminum Alloy)
- **materialSeal**: 密封材料 (默认: NBR)

#### 性能参数
- **cycleLife**: 循环寿命 (次数, 默认: 1000000)
- **features**: 特性 (多个特性用逗号分隔)
  - 示例: "耐用,高效,防腐"

#### 定价信息
- **currency**: 货币代码 (默认: USD)

#### 库存信息
- **inStock**: 是否有货 (true/false, 默认: true)
- **leadTime**: 交货周期 (天, 默认: 14)

#### 标签和分类
- **tags**: 标签 (多个标签用逗号分隔)
  - 示例: "气动,执行器,高扭矩"
- **isActive**: 是否激活 (true/false, 默认: true)

## 导入规则

### 验证规则
1. **型号唯一性**: 如果型号已存在，该行将被跳过
2. **必填字段**: 必须提供所有必填字段
3. **数据格式**: 数值字段必须是有效的数字
4. **枚举值**: 某些字段只接受特定的值（如 rotation, category 等）

### 错误处理
- 导入过程中的错误会被记录
- 成功和失败的记录会分别统计
- 已存在的产品会被跳过并记录

### 导入结果
导入完成后，系统会返回:
- 成功导入数量
- 失败数量及原因
- 跳过数量及原因

## 使用步骤

1. 下载模板文件 `product_import_template.csv`
2. 使用 Excel 或文本编辑器打开
3. 按照字段说明填写数据
4. 保存为 CSV 或 XLSX 格式
5. 在系统中选择文件并上传
6. 查看导入结果报告

## 示例数据

模板中包含两行示例数据:

**示例 1: 标准气动执行器**
- 型号: SF-100
- 扭矩: 100 Nm (80-120)
- 价格: $1,500

**示例 2: 高扭矩气动执行器**
- 型号: SF-200
- 扭矩: 200 Nm (160-240)
- 价格: $2,800

## 注意事项

1. **Excel 兼容性**: 如果使用 Excel 编辑，请确保保存为 XLSX 或 CSV 格式
2. **字符编码**: CSV 文件建议使用 UTF-8 编码
3. **数据清理**: 导入前请检查数据的完整性和准确性
4. **批量大小**: 建议每次导入不超过 1000 条记录
5. **备份**: 导入大量数据前建议先备份现有数据

## 权限要求

只有以下角色可以执行批量导入:
- Administrator (管理员)
- Technical Engineer (技术工程师)

## 技术支持

如有问题，请联系系统管理员或技术支持团队。

