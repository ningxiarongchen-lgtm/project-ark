# 后端 Scotch Yoke 算法升级报告

## 📋 升级概述

根据前端界面的重大更新，后端选型算法已完成重构，实现了**基于阀门类型的智能选型逻辑**。新算法根据用户选择的阀门类型（球阀或蝶阀），唯一确定地选择相应的轭架类型进行匹配。

---

## ✅ 核心改进

### 1. 新增 `valveType` 参数接收

**位置**: `backend/controllers/selectionController.js` - 第 9-31 行

**新增参数**:
```javascript
const {
  // 新版参数（camelCase风格）
  valveTorque,
  safetyFactor = 1.3,
  valveType,  // ✅ 新增：阀门类型

  // 兼容旧版参数（snake_case风格）
  valve_torque,
  safety_factor,
  valve_type,  // ✅ 新增：阀门类型（旧版）
  
  // 其他参数...
} = req.body;
```

**支持的阀门类型**:
- `"Ball Valve"` - 球阀
- `"Butterfly Valve"` - 蝶阀

---

### 2. 参数验证增强

**位置**: 第 50-67 行

**验证逻辑**:
```javascript
// 获取实际的阀门类型（优先使用新版参数）
const actualValveType = valveType || valve_type;

// 如果选择 Scotch Yoke，必须提供阀门类型
if (mechanism === 'Scotch Yoke' && !actualValveType) {
  return res.status(400).json({
    success: false,
    message: '请提供阀门类型（valveType）: "Ball Valve" 或 "Butterfly Valve"'
  });
}

// 验证阀门类型的有效性
if (actualValveType && !['Ball Valve', 'Butterfly Valve'].includes(actualValveType)) {
  return res.status(400).json({
    success: false,
    message: '阀门类型无效，必须是 "Ball Valve" 或 "Butterfly Valve"'
  });
}
```

**验证规则**:
- ✅ Scotch Yoke 机构类型**必须**提供阀门类型
- ✅ 阀门类型必须是 "Ball Valve" 或 "Butterfly Valve"
- ✅ Rack & Pinion 机构类型不需要阀门类型参数

---

### 3. 重构扭矩匹配逻辑 ⭐ (核心改进)

**位置**: 第 144-189 行

#### 旧逻辑（已移除）
```javascript
// ❌ 旧逻辑：基于 yoke_preference
if (yoke_preference === 'Symmetric') {
  // 只检查对称轭架
} else if (yoke_preference === 'Canted') {
  // 只检查倾斜轭架
} else if (yoke_preference === 'Auto') {
  // 同时检查两种，优先对称
}
```

#### 新逻辑（基于阀门类型）
```javascript
// ✅ 新逻辑：基于阀门类型，唯一确定轭架类型
if (actualValveType === 'Ball Valve') {
  // 球阀：只检查对称轭架扭矩
  const symmetricTorque = actuator.torque_symmetric.get(torqueKey);
  
  if (symmetricTorque && symmetricTorque >= requiredTorque) {
    shouldInclude = true;
    actualTorque = symmetricTorque;
    yokeType = 'Symmetric';
    recommendedModel = actuator.model_base; // 不带 /C
  }
  
} else if (actualValveType === 'Butterfly Valve') {
  // 蝶阀：只检查倾斜轭架扭矩
  const cantedTorque = actuator.torque_canted.get(torqueKey);
  
  if (cantedTorque && cantedTorque >= requiredTorque) {
    shouldInclude = true;
    actualTorque = cantedTorque;
    yokeType = 'Canted';
    recommendedModel = `${actuator.model_base}/C`; // 带 /C 标识
  }
}
```

---

## 🎯 智能匹配规则

### 规则 1: 球阀 (Ball Valve) → 对称轭架

**匹配逻辑**:
- ✅ **只检查** `torque_symmetric` 字段
- ✅ 如果对称扭矩 ≥ 需求扭矩，则匹配成功
- ✅ 推荐型号：**不带 "/C"** 后缀
- ✅ 轭架类型：`Symmetric`

**示例**:
```javascript
输入: {
  mechanism: "Scotch Yoke",
  valve_type: "Ball Valve",
  required_torque: 100,
  working_pressure: 0.6
}

输出: {
  model_base: "SF14-200DA",
  recommended_model: "SF14-200DA",  // 不带 /C
  yoke_type: "Symmetric",
  actual_torque: 150  // 来自 torque_symmetric
}
```

---

### 规则 2: 蝶阀 (Butterfly Valve) → 倾斜轭架

**匹配逻辑**:
- ✅ **只检查** `torque_canted` 字段
- ✅ 如果倾斜扭矩 ≥ 需求扭矩，则匹配成功
- ✅ 推荐型号：**自动添加 "/C"** 后缀
- ✅ 轭架类型：`Canted`

**示例**:
```javascript
输入: {
  mechanism: "Scotch Yoke",
  valve_type: "Butterfly Valve",
  required_torque: 100,
  working_pressure: 0.6
}

输出: {
  model_base: "SF14-200DA",
  recommended_model: "SF14-200DA/C",  // 自动添加 /C
  yoke_type: "Canted",
  actual_torque: 180  // 来自 torque_canted
}
```

---

## 📊 返回数据结构更新

### 旧数据结构（已移除）
```json
{
  "model_base": "SF14-200DA",
  "recommended_yoke": "Auto",
  "symmetric_torque": 150,
  "canted_torque": 180,
  "actual_torque": 150
}
```

### 新数据结构
```json
{
  "_id": "...",
  "model_base": "SF14-200DA",
  "recommended_model": "SF14-200DA/C",  // ✅ 新增：推荐型号（可能带 /C）
  "series": "SF",
  "mechanism": "Scotch Yoke",
  "body_size": "SF14",
  "action_type": "DA",
  "valve_type": "Butterfly Valve",  // ✅ 新增：阀门类型
  "yoke_type": "Canted",  // ✅ 新增：轭架类型
  "price": 2850,
  "actual_torque": 180,
  "torque_margin": 25.5,
  "recommend_level": "强烈推荐",
  "lead_time": "14天",
  "manual_override": null,
  "total_price": 2850,
  "compatible_overrides_count": 3
}
```

**关键字段说明**:
- `model_base`: 基础型号（不带 /C）
- `recommended_model`: **推荐型号**（球阀不带 /C，蝶阀带 /C）
- `valve_type`: 阀门类型
- `yoke_type`: 轭架类型（Symmetric 或 Canted）
- `actual_torque`: 实际扭矩（根据阀门类型选择）

---

## 📝 API 请求示例

### 示例 1: 球阀选型

**请求**:
```bash
curl -X POST http://localhost:5001/api/selection/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "mechanism": "Scotch Yoke",
    "valveType": "Ball Valve",
    "valveTorque": 100,
    "safetyFactor": 1.3,
    "working_pressure": 0.6,
    "working_angle": 90
  }'
```

**响应**:
```json
{
  "success": true,
  "message": "找到 5 个满足要求的执行器",
  "count": 5,
  "search_criteria": {
    "valve_torque": 100,
    "safety_factor": 1.3,
    "required_torque": 130,
    "working_pressure": 0.6,
    "working_angle": 90,
    "mechanism": "Scotch Yoke",
    "valve_type": "Ball Valve"
  },
  "data": [
    {
      "model_base": "SF14-200DA",
      "recommended_model": "SF14-200DA",
      "valve_type": "Ball Valve",
      "yoke_type": "Symmetric",
      "actual_torque": 150,
      "torque_margin": 15.38,
      "price": 2850
    }
  ]
}
```

---

### 示例 2: 蝶阀选型

**请求**:
```bash
curl -X POST http://localhost:5001/api/selection/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "mechanism": "Scotch Yoke",
    "valveType": "Butterfly Valve",
    "valveTorque": 100,
    "safetyFactor": 1.3,
    "working_pressure": 0.6,
    "working_angle": 90
  }'
```

**响应**:
```json
{
  "success": true,
  "message": "找到 5 个满足要求的执行器",
  "count": 5,
  "search_criteria": {
    "valve_torque": 100,
    "safety_factor": 1.3,
    "required_torque": 130,
    "working_pressure": 0.6,
    "working_angle": 90,
    "mechanism": "Scotch Yoke",
    "valve_type": "Butterfly Valve"
  },
  "data": [
    {
      "model_base": "SF14-200DA",
      "recommended_model": "SF14-200DA/C",
      "valve_type": "Butterfly Valve",
      "yoke_type": "Canted",
      "actual_torque": 180,
      "torque_margin": 38.46,
      "price": 2850
    }
  ]
}
```

---

### 示例 3: 缺少阀门类型（错误处理）

**请求**:
```bash
curl -X POST http://localhost:5001/api/selection/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "mechanism": "Scotch Yoke",
    "valveTorque": 100,
    "working_pressure": 0.6
  }'
```

**响应**:
```json
{
  "success": false,
  "message": "请提供阀门类型（valveType）: \"Ball Valve\" 或 \"Butterfly Valve\""
}
```

---

## 🔍 控制台日志增强

### 新增调试日志

```javascript
console.log(`🎯 Scotch Yoke 选型: 阀门类型 = ${actualValveType}, 压力键 = ${torqueKey}`);

// 对于每个候选执行器
console.log(`  ✓ ${actuator.model_base}: 球阀适用，对称扭矩 ${symmetricTorque} N·m >= ${requiredTorque} N·m`);
console.log(`  ✗ ${actuator.model_base}: 球阀不适用，对称扭矩 ${symmetricTorque || 'N/A'} N·m < ${requiredTorque} N·m`);
```

### 日志示例输出

```
📊 扭矩计算：阀门扭矩 100 N·m × 安全系数 1.3 = 130 N·m
🔍 查询条件: { mechanism: 'Scotch Yoke' }
📦 找到 15 个候选执行器
🎯 Scotch Yoke 选型: 阀门类型 = Ball Valve, 压力键 = 0_6_90
  ✗ SF10-150DA: 球阀不适用，对称扭矩 80 N·m < 130 N·m
  ✓ SF14-200DA: 球阀适用，对称扭矩 150 N·m >= 130 N·m
  ✓ SF16-250DA: 球阀适用，对称扭矩 180 N·m >= 130 N·m
  ✓ SF25-350DA: 球阀适用，对称扭矩 250 N·m >= 130 N·m
✅ 成功找到 5 个匹配的执行器
```

---

## 📈 对比分析

### 旧算法 vs 新算法

| 特性 | 旧算法 | 新算法 |
|------|--------|--------|
| **参数** | `yoke_preference` (Auto/Symmetric/Canted) | `valveType` (Ball Valve/Butterfly Valve) |
| **用户选择** | 手动选择轭架类型 | 选择阀门类型，系统自动确定轭架 |
| **匹配逻辑** | 复杂的多分支逻辑 | 简单的二分逻辑 |
| **推荐型号** | 总是基础型号 | 蝶阀自动添加 /C |
| **返回数据** | 同时显示两种扭矩 | 只显示匹配的扭矩 |
| **业务逻辑** | 技术导向（轭架类型） | 应用导向（阀门类型） |
| **用户体验** | 需要理解轭架概念 | 只需知道阀门类型 |

---

## 🎯 核心优势

### 1. 业务逻辑更清晰
- ✅ **旧逻辑**: 用户需要理解"对称轭架"和"倾斜轭架"的技术概念
- ✅ **新逻辑**: 用户只需知道自己使用的是球阀还是蝶阀

### 2. 选型结果更准确
- ✅ **旧逻辑**: Auto 模式可能推荐两种轭架都适用的情况
- ✅ **新逻辑**: 根据阀门类型，唯一确定推荐型号

### 3. 型号标识更规范
- ✅ **球阀**: 推荐型号 `SF14-200DA`（标准型）
- ✅ **蝶阀**: 推荐型号 `SF14-200DA/C`（倾斜轭架型）

### 4. 代码更简洁
- ✅ 移除了复杂的 `yoke_preference` 多分支逻辑
- ✅ 每种阀门类型只有一个清晰的匹配路径
- ✅ 更容易维护和扩展

---

## 📝 修改的文件清单

| 文件 | 修改内容 | 行数 |
|------|---------|------|
| `backend/controllers/selectionController.js` | 新增 `valveType` 参数接收 | 13, 19 |
| `backend/controllers/selectionController.js` | 新增阀门类型验证 | 50-67 |
| `backend/controllers/selectionController.js` | 重构 Scotch Yoke 匹配逻辑 | 144-189 |
| `backend/controllers/selectionController.js` | 更新返回数据结构 | 230-252 |
| `backend/controllers/selectionController.js` | 更新搜索条件 | 425-434, 449-460 |
| `backend/controllers/selectionController.js` | 移除 `yoke_preference` 参数 | 全文 |

---

## ✅ 验证检查清单

### 参数接收
- ✅ 接收 `valveType` 参数（新版）
- ✅ 接收 `valve_type` 参数（旧版兼容）
- ✅ 优先使用新版参数

### 参数验证
- ✅ Scotch Yoke 必须提供阀门类型
- ✅ 阀门类型必须是有效值
- ✅ Rack & Pinion 不需要阀门类型

### 匹配逻辑
- ✅ Ball Valve 只检查 symmetric 扭矩
- ✅ Butterfly Valve 只检查 canted 扭矩
- ✅ 扭矩比较正确使用 `requiredTorque`

### 型号生成
- ✅ Ball Valve 推荐型号不带 /C
- ✅ Butterfly Valve 推荐型号带 /C
- ✅ `recommended_model` 字段正确生成

### 返回数据
- ✅ 包含 `valve_type` 字段
- ✅ 包含 `yoke_type` 字段
- ✅ 包含 `recommended_model` 字段
- ✅ `search_criteria` 包含 `valve_type`

### 日志输出
- ✅ 显示阀门类型信息
- ✅ 显示匹配成功/失败原因
- ✅ 显示扭矩比较详情

### 兼容性
- ✅ 不影响 Rack & Pinion 逻辑
- ✅ 无 linter 错误
- ✅ 向后兼容 snake_case 参数

---

## 🧪 测试场景

### 场景 1: 球阀选型（对称扭矩足够）
```javascript
输入: {
  mechanism: "Scotch Yoke",
  valveType: "Ball Valve",
  valveTorque: 100,
  working_pressure: 0.6
}

预期输出:
- ✅ 找到使用对称轭架的执行器
- ✅ recommended_model 不带 /C
- ✅ yoke_type = "Symmetric"
- ✅ actual_torque 来自 torque_symmetric
```

### 场景 2: 蝶阀选型（倾斜扭矩足够）
```javascript
输入: {
  mechanism: "Scotch Yoke",
  valveType: "Butterfly Valve",
  valveTorque: 100,
  working_pressure: 0.6
}

预期输出:
- ✅ 找到使用倾斜轭架的执行器
- ✅ recommended_model 带 /C
- ✅ yoke_type = "Canted"
- ✅ actual_torque 来自 torque_canted
```

### 场景 3: 缺少阀门类型
```javascript
输入: {
  mechanism: "Scotch Yoke",
  valveTorque: 100,
  working_pressure: 0.6
}

预期输出:
- ✅ 返回 400 错误
- ✅ 错误信息："请提供阀门类型（valveType）"
```

### 场景 4: 无效的阀门类型
```javascript
输入: {
  mechanism: "Scotch Yoke",
  valveType: "Gate Valve",
  valveTorque: 100,
  working_pressure: 0.6
}

预期输出:
- ✅ 返回 400 错误
- ✅ 错误信息："阀门类型无效，必须是 Ball Valve 或 Butterfly Valve"
```

### 场景 5: 齿轮齿条式（不需要阀门类型）
```javascript
输入: {
  mechanism: "Rack & Pinion",
  valveTorque: 200,
  working_pressure: 0.6
}

预期输出:
- ✅ 正常处理（不检查 valve_type）
- ✅ 使用 Rack & Pinion 逻辑
```

---

## 🚀 后续工作建议

### 1. 前端界面适配
更新前端显示推荐型号：

```jsx
// 显示推荐型号（可能带 /C）
<Text strong>{item.recommended_model}</Text>

// 显示阀门类型和轭架类型
<Tag color={item.valve_type === 'Ball Valve' ? 'blue' : 'green'}>
  {item.valve_type}
</Tag>
<Tag>{item.yoke_type === 'Symmetric' ? '对称轭架' : '倾斜轭架'}</Tag>
```

### 2. PDF 报告生成
在生成选型报告时，包含完整信息：

```
选型结果
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
阀门类型：球阀 (Ball Valve)
推荐型号：SF14-200DA
轭架类型：对称轭架 (Symmetric)
实际扭矩：150 N·m
扭矩裕度：15.38%
```

### 3. 数据分析
基于新的阀门类型数据进行分析：
- 统计球阀 vs 蝶阀的使用比例
- 分析不同阀门类型的扭矩需求分布
- 优化库存管理（对称 vs 倾斜轭架）

---

## 🎉 升级总结

本次升级实现了以下重大改进：

1. ✅ **用户体验提升**: 从技术导向（轭架类型）转向应用导向（阀门类型）
2. ✅ **业务逻辑优化**: 根据阀门类型自动确定轭架，无需用户理解技术细节
3. ✅ **型号标识规范**: 蝶阀自动添加 /C 后缀，符合行业标准
4. ✅ **代码质量提升**: 简化匹配逻辑，提高可维护性
5. ✅ **数据完整性**: 返回数据包含完整的阀门类型和轭架类型信息
6. ✅ **向后兼容**: 同时支持新旧参数格式

---

**升级日期**: 2025-10-27  
**升级状态**: ✅ 已完成并验证  
**版本**: v3.0 (基于阀门类型的智能选型)  
**负责人**: Cursor AI Assistant

