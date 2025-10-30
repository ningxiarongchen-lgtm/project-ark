# Actuator Dimensions 结构扩展说明

## 概述
本文档说明了 Actuator 模型中 `dimensions` 字段的新结构，以及如何使用该结构存储和访问完整的尺寸数据。

## 修改文件
- `/backend/models/Actuator.js`

## 新的 Dimensions 结构

### 1. 字段结构定义

```javascript
dimensions: {
  // 轮廓尺寸
  outline: {
    L1: Number,  // 单作用总长
    L2: Number,  // 双作用/单作用气缸长度
    m1: Number,
    m2: Number,
    A: Number,
    H1: Number,
    H2: Number,
    D: Number
  },
  
  // 法兰尺寸
  flange: {
    standard: String,     // 例如: 'ISO 5211 F10'
    D: Number,
    A: Number,           // 方口尺寸
    C: Number,
    F: Number,
    threadSpec: String,  // 例如: '4-M10'
    threadDepth: Number,
    B: Number,
    T: Number
  },
  
  // 顶部安装尺寸
  topMounting: {
    standard: String,    // 例如: 'NAMUR VDI/VDE 3845'
    L: Number,
    h1: Number,
    H: Number
  },
  
  // 气动连接尺寸
  pneumaticConnection: {
    size: String,        // 例如: 'NPT1/4"'
    h2: Number
  }
}
```

### 2. 字段说明

#### outline (轮廓尺寸)
| 字段 | 类型 | 说明 |
|------|------|------|
| `L1` | Number | 单作用执行器总长 |
| `L2` | Number | 双作用执行器长度 / 单作用气缸长度 |
| `m1` | Number | 尺寸参数 m1 |
| `m2` | Number | 尺寸参数 m2 |
| `A` | Number | 尺寸参数 A |
| `H1` | Number | 高度参数 H1 |
| `H2` | Number | 高度参数 H2 |
| `D` | Number | 直径参数 D |

#### flange (法兰尺寸)
| 字段 | 类型 | 说明 |
|------|------|------|
| `standard` | String | 法兰标准，如 'ISO 5211 F10' |
| `D` | Number | 法兰外径 |
| `A` | Number | 方口尺寸 |
| `C` | Number | 中心孔径 |
| `F` | Number | 尺寸参数 F |
| `threadSpec` | String | 螺纹规格，如 '4-M10' |
| `threadDepth` | Number | 螺纹深度 |
| `B` | Number | 尺寸参数 B |
| `T` | Number | 厚度 |

#### topMounting (顶部安装尺寸)
| 字段 | 类型 | 说明 |
|------|------|------|
| `standard` | String | 安装标准，如 'NAMUR VDI/VDE 3845' |
| `L` | Number | 长度参数 L |
| `h1` | Number | 高度参数 h1 |
| `H` | Number | 总高度 H |

#### pneumaticConnection (气动连接尺寸)
| 字段 | 类型 | 说明 |
|------|------|------|
| `size` | String | 接口尺寸，如 'NPT1/4"' |
| `h2` | Number | 高度参数 h2 |

## SF系列完整尺寸数据导入

### 1. 共享尺寸数据（按本体尺寸）

SF系列的法兰和顶部安装尺寸按本体尺寸（body_size）共享：

```javascript
const sharedDimensions = {
  'SF10': {
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
    }
  },
  'SF12': {
    flange: { 
      standard: 'ISO 5211 F12', 
      D: 125, 
      A: 85, 
      C: 125, 
      F: 10, 
      threadSpec: '4-M12', 
      threadDepth: 36, 
      B: 39.3, 
      T: 10 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 80, 
      h1: 20, 
      H: 20 
    }
  },
  'SF14': {
    flange: { 
      standard: 'ISO 5211 F14', 
      D: 140, 
      A: 100, 
      C: 140, 
      F: 10, 
      threadSpec: '4-M12', 
      threadDepth: 48, 
      B: 51.8, 
      T: 14 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 80, 
      h1: 20, 
      H: 20 
    }
  },
  'SF16': {
    flange: { 
      standard: 'ISO 5211 F16', 
      D: 165, 
      A: 130, 
      C: 165, 
      F: 18, 
      threadSpec: '4-M16', 
      threadDepth: 60, 
      B: 64.4, 
      T: 18 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 80, 
      h1: 20, 
      H: 20 
    }
  },
  'SF25': {
    flange: { 
      standard: 'ISO 5211 F25', 
      D: 254, 
      A: 185, 
      C: 254, 
      F: 18, 
      threadSpec: '8-M16', 
      threadDepth: 98, 
      B: 104.4, 
      T: 28 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 130, 
      h1: 30, 
      H: 30 
    }
  },
  'SF30': {
    flange: { 
      standard: 'ISO 5211 F30', 
      D: 298, 
      A: 230, 
      C: 298, 
      F: 28, 
      threadSpec: '8-M20', 
      threadDepth: 128, 
      B: 144.4, 
      T: 40 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 130, 
      h1: 30, 
      H: 30 
    }
  },
  'SF35': {
    flange: { 
      standard: 'ISO 5211 F35', 
      D: 356, 
      A: 260, 
      C: 356, 
      F: 40, 
      threadSpec: '8-M30', 
      threadDepth: 150, 
      B: 169.4, 
      T: 40 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 130, 
      h1: 30, 
      H: 30 
    }
  },
  'SF40': {
    flange: { 
      standard: 'ISO 5211 F40', 
      D: 406, 
      A: 300, 
      C: 406, 
      F: 40, 
      threadSpec: '8-M36', 
      threadDepth: 180, 
      B: 212.4, 
      T: 45 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 130, 
      h1: 30, 
      H: 30 
    }
  },
  'SF48': {
    flange: { 
      standard: 'ISO 5211 F48', 
      D: 483, 
      A: 350, 
      C: 483, 
      F: 45, 
      threadSpec: '12-M36', 
      threadDepth: 220, 
      B: 259.4, 
      T: 55 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 130, 
      h1: 30, 
      H: 30 
    }
  },
  'SF60': {
    flange: { 
      standard: 'ISO 5211 F60', 
      D: 603, 
      A: 470, 
      C: 603, 
      F: 63, 
      threadSpec: '20-M36', 
      threadDepth: 250, 
      B: 330.4, 
      T: 63 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 130, 
      h1: 30, 
      H: 30 
    }
  }
};
```

### 2. 完整尺寸数据数组

包含所有 SF 系列型号（DA 和 SR）的轮廓尺寸和气动连接数据。这些数据需要与相应本体尺寸的共享尺寸数据合并。

**数据结构示例：**

```javascript
const sf_all_dimensions_data = [
  // 双作用 (DA) 型号
  { 
    model: 'SF10-150DA', 
    bodySize: 'SF10', 
    dimensions: { 
      outline: { 
        L2: 350, 
        m1: 127, 
        m2: 76, 
        A: 143.5, 
        H1: 40, 
        H2: 82, 
        D: 100 
      }, 
      pneumaticConnection: { 
        size: 'NPT1/4"' 
      } 
    } 
  },
  
  // 单作用 (SR) 型号
  { 
    model: 'SF10-150SR3', 
    bodySize: 'SF10', 
    dimensions: { 
      outline: { 
        L1: 350, 
        L2: 467, 
        m1: 76, 
        m2: 143.5, 
        A: 40, 
        H1: 82, 
        H2: 100, 
        D: 207 
      }, 
      pneumaticConnection: { 
        size: 'NPT1/4"' 
      } 
    } 
  },
  // ... 更多型号
];
```

### 3. 数据导入脚本示例

创建一个脚本来导入完整的尺寸数据：

```javascript
// update_sf_dimensions.js
const mongoose = require('mongoose');
const Actuator = require('./models/Actuator');

// 共享尺寸数据（见上文）
const sharedDimensions = { /* ... */ };

// 完整尺寸数据数组（见上文）
const sf_all_dimensions_data = [ /* ... */ ];

async function updateSFDimensions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 已连接到数据库');
    
    let updateCount = 0;
    let errorCount = 0;
    
    for (const item of sf_all_dimensions_data) {
      try {
        const { model, bodySize, dimensions } = item;
        
        // 获取共享尺寸数据
        const shared = sharedDimensions[bodySize];
        
        if (!shared) {
          console.warn(`⚠️  未找到 ${bodySize} 的共享尺寸数据`);
          errorCount++;
          continue;
        }
        
        // 合并尺寸数据
        const completeDimensions = {
          outline: dimensions.outline || {},
          flange: shared.flange,
          topMounting: shared.topMounting,
          pneumaticConnection: dimensions.pneumaticConnection || {}
        };
        
        // 更新数据库中的执行器
        const result = await Actuator.findOneAndUpdate(
          { model_base: model },
          { 
            $set: { 
              dimensions: completeDimensions 
            } 
          },
          { 
            new: true,
            runValidators: true 
          }
        );
        
        if (result) {
          console.log(`✓ 更新成功: ${model}`);
          updateCount++;
        } else {
          console.warn(`⚠️  未找到型号: ${model}`);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`✗ 更新失败 ${item.model}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n========== 更新完成 ==========');
    console.log(`成功更新: ${updateCount} 个型号`);
    console.log(`失败: ${errorCount} 个型号`);
    console.log(`总计: ${sf_all_dimensions_data.length} 个型号`);
    
  } catch (error) {
    console.error('❌ 数据库连接错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('已断开数据库连接');
  }
}

// 运行更新
updateSFDimensions();
```

### 4. 运行导入脚本

```bash
# 设置环境变量
export MONGODB_URI="mongodb://localhost:27017/your_database_name"

# 运行脚本
node backend/update_sf_dimensions.js
```

## 数据访问示例

### 1. 查询特定型号的完整尺寸

```javascript
const actuator = await Actuator.findOne({ model_base: 'SF10-150DA' });

if (actuator && actuator.dimensions) {
  console.log('轮廓尺寸:', actuator.dimensions.outline);
  console.log('法兰尺寸:', actuator.dimensions.flange);
  console.log('顶部安装:', actuator.dimensions.topMounting);
  console.log('气动连接:', actuator.dimensions.pneumaticConnection);
}
```

### 2. 获取法兰标准

```javascript
const flangeStandard = actuator.dimensions.flange.standard;
console.log(`法兰标准: ${flangeStandard}`); // 输出: 'ISO 5211 F10'
```

### 3. 获取气动连接尺寸

```javascript
const connectionSize = actuator.dimensions.pneumaticConnection.size;
console.log(`气动接口: ${connectionSize}`); // 输出: 'NPT1/4"'
```

### 4. 在 API 中返回尺寸信息

```javascript
// 在 actuatorController.js 中
exports.getActuatorDetails = async (req, res) => {
  try {
    const actuator = await Actuator.findById(req.params.id);
    
    res.json({
      success: true,
      data: {
        model: actuator.model_base,
        dimensions: {
          outline: actuator.dimensions.outline,
          flange: actuator.dimensions.flange,
          topMounting: actuator.dimensions.topMounting,
          pneumaticConnection: actuator.dimensions.pneumaticConnection
        },
        // ... 其他字段
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

## 前端展示建议

### 1. 尺寸数据表格展示

```jsx
// React 组件示例
const DimensionsTable = ({ dimensions }) => {
  return (
    <div>
      <h3>轮廓尺寸</h3>
      <Table>
        <tbody>
          {dimensions.outline.L1 && (
            <tr>
              <td>L1 (单作用总长)</td>
              <td>{dimensions.outline.L1} mm</td>
            </tr>
          )}
          <tr>
            <td>L2 (气缸长度)</td>
            <td>{dimensions.outline.L2} mm</td>
          </tr>
          <tr>
            <td>H1</td>
            <td>{dimensions.outline.H1} mm</td>
          </tr>
          <tr>
            <td>D (直径)</td>
            <td>{dimensions.outline.D} mm</td>
          </tr>
        </tbody>
      </Table>
      
      <h3>法兰信息</h3>
      <Table>
        <tbody>
          <tr>
            <td>标准</td>
            <td>{dimensions.flange.standard}</td>
          </tr>
          <tr>
            <td>方口尺寸 (A)</td>
            <td>{dimensions.flange.A} mm</td>
          </tr>
          <tr>
            <td>螺纹规格</td>
            <td>{dimensions.flange.threadSpec}</td>
          </tr>
        </tbody>
      </Table>
      
      <h3>气动连接</h3>
      <Table>
        <tbody>
          <tr>
            <td>接口尺寸</td>
            <td>{dimensions.pneumaticConnection.size}</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
};
```

### 2. 尺寸图展示

结合尺寸数据和 CAD 图纸，在前端动态标注尺寸参数。

## 注意事项

1. **数据完整性验证**
   - 导入前确保所有必需的字段都已填写
   - 特别注意 DA 型号只有 L2，SR 型号有 L1 和 L2

2. **单位统一**
   - 所有尺寸数据单位为毫米 (mm)
   - 导入前确保数据单位一致

3. **型号匹配**
   - 确保 `model` 字段与数据库中的 `model_base` 字段完全匹配
   - 大小写敏感

4. **共享数据管理**
   - 法兰和顶部安装尺寸按本体尺寸共享
   - 修改共享数据时需同步更新所有相关型号

5. **向后兼容**
   - 新结构对现有数据保持兼容
   - 可以逐步迁移数据到新结构

## 数据验证

### 验证脚本示例

```javascript
// validate_dimensions.js
async function validateDimensions() {
  const actuators = await Actuator.find({ series: 'SF' });
  
  for (const actuator of actuators) {
    const dims = actuator.dimensions;
    
    // 检查必需字段
    if (!dims.outline || !dims.flange || !dims.pneumaticConnection) {
      console.warn(`⚠️  ${actuator.model_base}: 缺少必需的尺寸字段`);
    }
    
    // 检查 DA/SR 特定字段
    if (actuator.action_type === 'DA' && !dims.outline.L2) {
      console.error(`❌ ${actuator.model_base}: DA型号缺少 L2 字段`);
    }
    
    if (actuator.action_type === 'SR' && (!dims.outline.L1 || !dims.outline.L2)) {
      console.error(`❌ ${actuator.model_base}: SR型号缺少 L1 或 L2 字段`);
    }
    
    // 检查法兰标准
    if (!dims.flange.standard) {
      console.warn(`⚠️  ${actuator.model_base}: 缺少法兰标准`);
    }
  }
}
```

## 总结

新的 dimensions 结构提供了：
- ✅ 更清晰的数据组织
- ✅ 完整的尺寸信息存储
- ✅ 便于前端展示和使用
- ✅ 支持技术文档生成
- ✅ 向后兼容现有数据

下一步可以创建数据导入脚本，将提供的完整尺寸数据批量导入到数据库中。

---

**实现日期:** 2025-10-30  
**版本:** v1.0  
**修改人:** AI Assistant

