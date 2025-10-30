# SF系列尺寸数据导入和使用说明

## 概述
本文档说明如何导入 SF 系列执行器的完整尺寸数据，以及如何在应用中使用这些数据。

## 文件说明

### 1. 修改的模型文件
- **`/backend/models/Actuator.js`**
  - 扩展了 `dimensions` 字段结构
  - 支持存储轮廓、法兰、顶部安装和气动连接尺寸

### 2. 数据导入脚本
- **`/backend/update_sf_dimensions.js`**
  - 包含所有 SF 系列（DA 和 SR）的完整尺寸数据
  - 自动合并共享尺寸数据和型号特定数据
  - 批量更新数据库中的执行器记录

## 使用步骤

### 第一步：确认数据库连接

确保 `.env` 文件中配置了正确的数据库连接字符串：

```bash
MONGODB_URI=mongodb://localhost:27017/model_selection_system
```

或者直接在终端设置环境变量：

```bash
export MONGODB_URI="mongodb://localhost:27017/model_selection_system"
```

### 第二步：运行导入脚本

在项目根目录执行：

```bash
node backend/update_sf_dimensions.js
```

### 第三步：查看导入结果

脚本会输出详细的执行日志：

```
========== SF系列尺寸数据更新开始 ==========

✅ 已连接到数据库

✓ 更新成功: SF10-150DA
✓ 更新成功: SF10-170DA
✓ 更新成功: SF12-170DA
...
✓ 更新成功: SF60-1100SR3

========== 更新完成 ==========
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
✅ 脚本执行完成
```

## 数据结构说明

### 导入的数据包含以下四个部分：

#### 1. outline (轮廓尺寸)
```javascript
{
  L1: Number,  // 单作用总长 (仅SR型号)
  L2: Number,  // 双作用长度 / 单作用气缸长度
  m1: Number,
  m2: Number,
  A: Number,
  H1: Number,
  H2: Number,
  D: Number
}
```

#### 2. flange (法兰尺寸) - 按本体尺寸共享
```javascript
{
  standard: String,     // 'ISO 5211 F10'
  D: Number,
  A: Number,
  C: Number,
  F: Number,
  threadSpec: String,   // '4-M10'
  threadDepth: Number,
  B: Number,
  T: Number
}
```

#### 3. topMounting (顶部安装尺寸) - 按本体尺寸共享
```javascript
{
  standard: String,     // 'NAMUR VDI/VDE 3845'
  L: Number,
  h1: Number,
  H: Number
}
```

#### 4. pneumaticConnection (气动连接)
```javascript
{
  size: String,         // 'NPT1/4"'
  h2: Number
}
```

## 数据查询示例

### 查询特定型号的完整尺寸

```javascript
const Actuator = require('./models/Actuator');

// 查询单个执行器
const actuator = await Actuator.findOne({ model_base: 'SF10-150DA' });

console.log('完整尺寸数据:', actuator.dimensions);
```

### 查询输出示例

```javascript
{
  outline: {
    L2: 350,
    m1: 127,
    m2: 76,
    A: 143.5,
    H1: 40,
    H2: 82,
    D: 100
  },
  flange: {
    standard: 'ISO 5211 F10',
    D: 102,
    A: 70,
    C: 102,
    F: 10,
    threadSpec: '4-M10',
    threadDepth: 28,
    B: 31.3,
    T: 8
  },
  topMounting: {
    standard: 'NAMUR VDI/VDE 3845',
    L: 80,
    h1: 20,
    H: 20
  },
  pneumaticConnection: {
    size: 'NPT1/4"'
  }
}
```

## API 集成示例

### 在控制器中返回尺寸数据

```javascript
// actuatorController.js
exports.getActuatorDetails = async (req, res) => {
  try {
    const actuator = await Actuator.findById(req.params.id);
    
    if (!actuator) {
      return res.status(404).json({
        success: false,
        message: '未找到执行器'
      });
    }
    
    res.json({
      success: true,
      data: {
        model: actuator.model_base,
        series: actuator.series,
        bodySize: actuator.body_size,
        actionType: actuator.action_type,
        dimensions: actuator.dimensions,
        price: actuator.base_price_normal,
        // ... 其他字段
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

### 在选型结果中包含尺寸信息

修改 `selectionController.js`，在返回结果中添加尺寸数据：

```javascript
finalResults.push({
  _id: actuator._id,
  model_base: actuator.model_base,
  final_model_name: finalModelName,
  series: actuator.series,
  body_size: actuator.body_size,
  action_type: actuator.action_type,
  
  // 添加尺寸信息
  dimensions: actuator.dimensions,
  
  // 提取关键尺寸供快速显示
  key_dimensions: {
    length: actuator.action_type === 'SR' 
      ? actuator.dimensions?.outline?.L1 
      : actuator.dimensions?.outline?.L2,
    height: actuator.dimensions?.outline?.H1,
    diameter: actuator.dimensions?.outline?.D,
    flange_standard: actuator.dimensions?.flange?.standard,
    connection_size: actuator.dimensions?.pneumaticConnection?.size
  },
  
  price: adjustedPrice,
  actual_torque: actualTorque,
  // ... 其他字段
});
```

## 前端展示建议

### 1. 在执行器详情页显示完整尺寸

```jsx
// ActuatorDetails.jsx
import { Descriptions, Card } from 'antd';

const ActuatorDetails = ({ actuator }) => {
  const { dimensions } = actuator;
  
  return (
    <div>
      <Card title="轮廓尺寸" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered size="small">
          {dimensions?.outline?.L1 && (
            <Descriptions.Item label="L1 (单作用总长)">
              {dimensions.outline.L1} mm
            </Descriptions.Item>
          )}
          <Descriptions.Item label="L2 (气缸长度)">
            {dimensions?.outline?.L2} mm
          </Descriptions.Item>
          <Descriptions.Item label="H1 (高度)">
            {dimensions?.outline?.H1} mm
          </Descriptions.Item>
          <Descriptions.Item label="D (直径)">
            {dimensions?.outline?.D} mm
          </Descriptions.Item>
          <Descriptions.Item label="A">
            {dimensions?.outline?.A} mm
          </Descriptions.Item>
        </Descriptions>
      </Card>
      
      <Card title="法兰信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="标准" span={2}>
            {dimensions?.flange?.standard}
          </Descriptions.Item>
          <Descriptions.Item label="方口尺寸 (A)">
            {dimensions?.flange?.A} mm
          </Descriptions.Item>
          <Descriptions.Item label="外径 (D)">
            {dimensions?.flange?.D} mm
          </Descriptions.Item>
          <Descriptions.Item label="螺纹规格">
            {dimensions?.flange?.threadSpec}
          </Descriptions.Item>
          <Descriptions.Item label="螺纹深度">
            {dimensions?.flange?.threadDepth} mm
          </Descriptions.Item>
        </Descriptions>
      </Card>
      
      <Card title="顶部安装" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="标准" span={2}>
            {dimensions?.topMounting?.standard}
          </Descriptions.Item>
          <Descriptions.Item label="L">
            {dimensions?.topMounting?.L} mm
          </Descriptions.Item>
          <Descriptions.Item label="H">
            {dimensions?.topMounting?.H} mm
          </Descriptions.Item>
        </Descriptions>
      </Card>
      
      <Card title="气动连接">
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="接口尺寸">
            {dimensions?.pneumaticConnection?.size}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};
```

### 2. 在选型结果表格中显示关键尺寸

```jsx
// SelectionEngine.jsx
const columns = [
  // ... 其他列
  {
    title: '关键尺寸',
    key: 'key_dimensions',
    width: 200,
    render: (_, record) => {
      const dims = record.key_dimensions;
      return (
        <div style={{ fontSize: '12px' }}>
          <div>长度: {dims?.length} mm</div>
          <div>高度: {dims?.height} mm</div>
          <div>法兰: {dims?.flange_standard}</div>
          <div>接口: {dims?.connection_size}</div>
        </div>
      );
    }
  },
  // ... 其他列
];
```

## 数据验证

### 创建验证脚本

创建 `/backend/validate_sf_dimensions.js`：

```javascript
const mongoose = require('mongoose');
const Actuator = require('./models/Actuator');

async function validateDimensions() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const actuators = await Actuator.find({ 
    series: 'SF',
    is_active: true 
  });
  
  console.log(`检查 ${actuators.length} 个 SF 系列执行器...\n`);
  
  for (const actuator of actuators) {
    const dims = actuator.dimensions;
    const issues = [];
    
    // 检查必需字段
    if (!dims?.outline) issues.push('缺少轮廓尺寸');
    if (!dims?.flange) issues.push('缺少法兰尺寸');
    if (!dims?.topMounting) issues.push('缺少顶部安装尺寸');
    if (!dims?.pneumaticConnection) issues.push('缺少气动连接尺寸');
    
    // 检查作用类型特定字段
    if (actuator.action_type === 'DA' && !dims?.outline?.L2) {
      issues.push('DA型号缺少L2');
    }
    if (actuator.action_type === 'SR' && (!dims?.outline?.L1 || !dims?.outline?.L2)) {
      issues.push('SR型号缺少L1或L2');
    }
    
    if (issues.length > 0) {
      console.log(`❌ ${actuator.model_base}:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log(`✅ ${actuator.model_base}: 数据完整`);
    }
  }
  
  await mongoose.disconnect();
}

validateDimensions();
```

运行验证：

```bash
node backend/validate_sf_dimensions.js
```

## 常见问题

### Q1: 导入后发现某些型号未更新？
**A:** 检查数据库中是否存在对应的 `model_base`。脚本只会更新已存在的记录，不会创建新记录。

### Q2: 如何重新导入数据？
**A:** 直接再次运行脚本即可，脚本会覆盖现有的 `dimensions` 字段。

### Q3: 如何为其他系列（AT/GY）添加尺寸数据？
**A:** 参考 `update_sf_dimensions.js` 的结构，创建类似的脚本，并使用相同的 `dimensions` 结构。

### Q4: 尺寸数据占用多少存储空间？
**A:** 每个执行器的完整尺寸数据约占用 500-800 字节，54 个型号约占用 40KB。

## 下一步

1. ✅ **已完成**: Actuator 模型扩展
2. ✅ **已完成**: SF 系列数据导入脚本
3. 🔄 **进行中**: 前端界面展示尺寸数据
4. ⏳ **待完成**: AT/GY 系列尺寸数据导入
5. ⏳ **待完成**: 生成 PDF 技术文档（包含尺寸图）

## 技术支持

如有问题，请查看：
- `/backend/DIMENSIONS_STRUCTURE_GUIDE.md` - 详细的结构说明
- `/backend/update_sf_dimensions.js` - 导入脚本源码

---

**文档版本**: v1.0  
**更新日期**: 2025-10-30  
**作者**: AI Assistant

