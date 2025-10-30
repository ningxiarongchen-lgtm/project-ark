# 故障安全位置功能实现说明

## 概述
本文档说明了在后端选型控制器中新增的"故障安全位置"(failSafePosition)功能的实现细节。

## 修改文件
- `/backend/controllers/selectionController.js`

## 新增参数

### 1. 请求参数
在 `calculateSelection` 函数中新增以下参数：

```javascript
{
  failSafePosition: String,         // 'Fail Close', 'Fail Open', 或 'Not Applicable'
  requiredOpeningTorque: Number,    // 阀门开启所需扭矩（单作用执行器必需）
  requiredClosingTorque: Number     // 阀门关闭所需扭矩（单作用执行器必需）
}
```

### 2. 参数验证
- 当 `action_type_preference === 'SR'` 时，必须提供 `failSafePosition`
- `failSafePosition` 必须是以下值之一：'Fail Close', 'Fail Open', 'Not Applicable'
- 单作用执行器必须同时提供 `requiredOpeningTorque` 和 `requiredClosingTorque`

## 核心逻辑

### 故障关 (Fail Close / STC)
弹簧的作用是**关闭**阀门，气源的作用是**打开**阀门。

**匹配条件：**
```javascript
SET >= requiredClosingTorque × safetyFactor
AST >= requiredOpeningTorque × safetyFactor
```

**说明：**
- `SET` (Spring End Torque): 弹簧复位终点扭矩
- `AST` (Air Start Torque): 气源动作起点扭矩

### 故障开 (Fail Open / STO)
弹簧的作用是**打开**阀门，气源的作用是**关闭**阀门。

**匹配条件：**
```javascript
SST >= requiredOpeningTorque × safetyFactor
AET >= requiredClosingTorque × safetyFactor
```

**说明：**
- `SST` (Spring Start Torque): 弹簧复位起点扭矩
- `AET` (Air End Torque): 气源动作终点扭矩

## 支持的执行器系列

### 1. Rack & Pinion (AT/GY系列)
- 支持单作用(SR)执行器的故障安全位置判断
- 型号命名规则：`基础型号-STC/STO-温度代码`
- 示例：`AT50-SR-STC-T1`, `GY75-SR-STO`

### 2. Scotch Yoke (SF系列)
- 支持单作用(SR)执行器的故障安全位置判断
- 同时考虑轭架类型（对称/偏心）
- 型号命名规则：
  - 对称轭架：`基础型号-STC/STO-温度代码`
  - 偏心轭架：`基础型号/C-STC/STO-温度代码`
- 示例：`SF10-150SR-STC`, `SF20-300SR/C-STO-T2`

## API 返回结果变化

### 1. 单个执行器结果
每个执行器结果中新增字段：
```javascript
{
  final_model_name: String,      // 完整型号（含STC/STO后缀和温度代码）
  fail_safe_position: String,    // 故障安全位置
  // ... 其他字段
}
```

### 2. 搜索条件
返回结果的 `search_criteria` 中新增：
```javascript
{
  fail_safe_position: String,           // 故障安全位置
  required_opening_torque: Number,      // 开启扭矩
  required_closing_torque: Number,      // 关闭扭矩
  // ... 其他字段
}
```

## 使用示例

### 请求示例 1: Rack & Pinion 单作用执行器（故障关）
```json
{
  "mechanism": "Rack & Pinion",
  "action_type_preference": "SR",
  "working_pressure": 0.5,
  "requiredOpeningTorque": 500,
  "requiredClosingTorque": 600,
  "failSafePosition": "Fail Close",
  "safetyFactor": 1.3
}
```

### 请求示例 2: Scotch Yoke 单作用执行器（故障开）
```json
{
  "mechanism": "Scotch Yoke",
  "action_type_preference": "SR",
  "valveType": "Ball Valve",
  "working_pressure": 0.6,
  "requiredOpeningTorque": 800,
  "requiredClosingTorque": 900,
  "failSafePosition": "Fail Open",
  "safetyFactor": 1.3
}
```

### 响应示例
```json
{
  "success": true,
  "count": 5,
  "search_criteria": {
    "fail_safe_position": "Fail Close",
    "required_opening_torque": 500,
    "required_closing_torque": 600,
    "working_pressure": 0.5,
    "mechanism": "Rack & Pinion",
    "action_type_preference": "SR"
  },
  "data": [
    {
      "model_base": "AT50-SR",
      "final_model_name": "AT50-SR-STC",
      "fail_safe_position": "Fail Close",
      "actual_torque": 650,
      "price": 12500,
      "recommend_level": "强烈推荐"
    }
  ]
}
```

## 日志输出
系统会输出详细的匹配日志，便于调试：

```
🔍 SR执行器 AT50-SR 扭矩数据: {
  springTorque: { SST: 700, SRT: 650, SET: 780 },
  airTorque: { AST: 850, ART: 800, AET: 920 },
  failSafePosition: 'Fail Close'
}
✓ AT50-SR-STC: 故障关匹配成功
  - SET (780) >= 关闭扭矩 × 1.3 (780)
  - AST (850) >= 开启扭矩 × 1.3 (650)
```

## 数据结构要求

### Actuator 模型中的扭矩数据结构
单作用(SR)执行器必须包含以下扭矩数据：

```javascript
{
  torqueData: {
    springTorque: {
      SST: Number,  // 弹簧复位起点扭矩
      SRT: Number,  // 弹簧复位运行扭矩
      SET: Number   // 弹簧复位终点扭矩
    },
    airTorque: {
      "0.3MPa": {
        AST: Number,  // 气源动作起点扭矩
        ART: Number,  // 气源动作运行扭矩
        AET: Number   // 气源动作终点扭矩
      },
      "0.4MPa": { ... },
      "0.5MPa": { ... },
      "0.6MPa": { ... }
    }
  }
}
```

## 后续前端实现建议

### 1. 表单输入组件
在选型页面添加以下输入项：
- 故障安全位置选择（单选框）：故障关 / 故障开 / 不适用
- 阀门开启扭矩输入框
- 阀门关闭扭矩输入框

### 2. 结果展示
在结果表格中显示：
- 完整型号（包含STC/STO后缀）
- 故障安全位置标识
- 相应的扭矩裕度信息

### 3. 用户提示
当用户选择单作用执行器时：
- 自动显示故障安全位置选择器
- 提示用户输入开启和关闭扭矩
- 提供工况说明和选择建议

## 测试建议

### 测试用例
1. **Fail Close 测试**
   - 提供满足条件的开启和关闭扭矩
   - 验证返回的型号包含 `-STC` 后缀
   
2. **Fail Open 测试**
   - 提供满足条件的开启和关闭扭矩
   - 验证返回的型号包含 `-STO` 后缀

3. **参数验证测试**
   - 测试缺少必需参数时的错误提示
   - 测试无效的 failSafePosition 值

4. **扭矩匹配测试**
   - 测试不满足扭矩条件时无结果返回
   - 测试边界条件（刚好满足/不满足）

## 版本信息
- 实现日期：2025-10-30
- 版本：v1.0
- 修改人：AI Assistant

