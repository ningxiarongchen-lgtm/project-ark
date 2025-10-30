# 执行器与阀门类型匹配规则

## 📋 目录
1. [SF系列（拨叉式）规则](#sf系列拨叉式规则)
2. [AT/GY系列（齿轮齿条式）规则](#atgy系列齿轮齿条式规则)
3. [型号命名规则](#型号命名规则)
4. [实施清单](#实施清单)

---

## 🔧 SF系列（拨叉式）规则

### 执行机构类型：Scotch Yoke

### 适用阀门类型
SF系列（拨叉式）执行器适用于**旋转类阀门**：

#### 1. 球阀 (Ball Valve)
- **拨叉类型**：对称拨叉 (Symmetric Yoke)
- **型号标识**：不带 `/C`
- **示例型号**：`SF050-DA`, `SF075-SR-K8`
- **扭矩数据源**：`torque_symmetric`

#### 2. 蝶阀 (Butterfly Valve)  
- **拨叉类型**：偏心拨叉 (Canted Yoke)
- **型号标识**：**带 `/C` 后缀**
- **示例型号**：`SF050/C-DA`, `SF075/C-SR-K8`
- **扭矩数据源**：`torque_canted`

### 型号命名规则
```
球阀：SF{尺寸}-{作用类型}[-{弹簧范围}]
     例如：SF050-DA, SF075-SR-K8

蝶阀：SF{尺寸}/C-{作用类型}[-{弹簧范围}]
     例如：SF050/C-DA, SF075/C-SR-K8
```

---

## ⚙️ AT/GY系列（齿轮齿条式）规则

### 执行机构类型：Rack & Pinion

### 适用阀门类型
AT/GY系列（齿轮齿条式）执行器适用于**直行程阀门**：

#### 1. 闸阀 (Gate Valve)
- 用于完全开启或完全关闭的场合
- 适用于管道切断服务

#### 2. 截止阀 (Globe Valve)
- 用于流量调节和切断
- 适用于频繁操作

#### 3. 直行程调节阀 (Linear Control Valve)
- 用于精确流量控制
- 适用于过程控制应用

### 重要说明
⚠️ **AT/GY系列不适用于旋转类阀门（球阀、蝶阀）**

---

## 📝 型号命名规则

### SF系列命名结构
```
基础型号：SF + 尺寸 + 作用类型 + 可选后缀

组成部分：
- SF: 系列标识（Scotch Yoke / Spring）
- 尺寸: 050, 070, 100, 150等
- 作用类型: DA（双作用）或 SR（单作用）
- 弹簧范围: K8, K10, K12等（仅SR类型）
- /C: 偏心拨叉标识（仅蝶阀）

示例：
- SF050-DA         （球阀，双作用，对称拨叉）
- SF050/C-DA       （蝶阀，双作用，偏心拨叉）
- SF075-SR-K8      （球阀，单作用，对称拨叉）
- SF075/C-SR-K8    （蝶阀，单作用，偏心拨叉）
```

### 单作用故障安全标识
```
单作用SF系列还需要标识故障安全位置：
- STC (Spring To Close): 故障关闭
- STO (Spring To Open): 故障开启

完整示例：
- SF075-SR-K8-STC      （球阀，单作用，故障关）
- SF075/C-SR-K8-STC    （蝶阀，单作用，故障关）
- SF075-SR-K8-STO      （球阀，单作用，故障开）
- SF075/C-SR-K8-STO    （蝶阀，单作用，故障开）
```

### AT/GY系列命名结构
```
基础型号：AT/GY + 尺寸 + 作用类型

组成部分：
- AT或GY: 系列标识
- 尺寸: 051, 063, 075, 083等
- 作用类型: DA（双作用）或 SR（单作用）
- 温度标识: T1, T2, T3（低温）, M（高温）
- 手轮标识: H（需要手轮）

示例：
- AT063-DA         （标准双作用）
- AT075-SR         （单作用）
- GY083-DA-T1      （双作用，低温T1）
- AT063-DA-M-H     （双作用，高温，带手轮）
```

---

## ✅ 实施清单

### 前端修改
- [x] `SelectionEngine.jsx` - 添加作用类型选择器
- [x] `SelectionEngine.jsx` - 添加故障安全位置选择器
- [x] `SelectionEngine.jsx` - SF系列阀门类型选项（球阀、蝶阀）
- [x] `SelectionEngine.jsx` - AT/GY系列阀门类型选项（闸阀、截止阀、调节阀）
- [x] `SelectionEngine.jsx` - 智能扭矩输入（单/双作用）
- [x] 添加tooltip说明拨叉类型

### 后端修改
- [x] `selectionController.js` - 更新阀门类型验证逻辑
- [x] `selectionController.js` - 已有球阀/蝶阀拨叉类型处理
- [x] `Actuator.js` - 更新valve_type枚举值

### 数据库规则
- [x] `Actuator.valve_type` 支持所有阀门类型
- [x] 球阀数据使用 `torque_symmetric`
- [x] 蝶阀数据使用 `torque_canted`
- [x] 推荐型号自动添加 `/C` 标识（蝶阀）

### 业务逻辑
- [x] SF系列 + 球阀 = 对称拨叉（不带/C）
- [x] SF系列 + 蝶阀 = 偏心拨叉（带/C）
- [x] AT/GY系列 + 旋转阀门 = 验证错误
- [x] AT/GY系列 + 直行程阀门 = 正常选型

---

## 🔍 验证方法

### 1. 前端验证
```javascript
// SF系列选择蝶阀
mechanism: 'Scotch Yoke'
valve_type: 'Butterfly Valve'
// 预期结果：型号带 /C 后缀

// AT/GY系列选择球阀
mechanism: 'Rack & Pinion'
valve_type: 'Ball Valve'
// 预期结果：验证错误
```

### 2. 后端验证
```bash
# 测试SF系列蝶阀选型
POST /api/selection/calculate
{
  "mechanism": "Scotch Yoke",
  "valve_type": "Butterfly Valve",
  "required_torque": 100,
  "working_pressure": 0.6
}
# 预期：返回型号带 /C

# 测试AT/GY系列非法阀门类型
POST /api/selection/calculate
{
  "mechanism": "Rack & Pinion",
  "valve_type": "Ball Valve",
  "required_torque": 100,
  "working_pressure": 0.6
}
# 预期：返回400错误
```

---

## 📊 数据一致性检查

### 检查清单
1. ✅ 所有SF系列执行器包含 `torque_symmetric` 和 `torque_canted` 数据
2. ✅ 蝶阀选型使用 `torque_canted` 数据
3. ✅ 球阀选型使用 `torque_symmetric` 数据
4. ✅ 推荐型号正确添加 `/C` 标识
5. ✅ AT/GY系列不匹配旋转类阀门

---

## 📞 联系信息

如有疑问，请联系技术团队。

最后更新：2025-10-30
版本：1.0

