# 智能选型逻辑说明文档

## 概述

Project ArK 智能选型系统支持 SF 系列（拨叉式）和 AT/GY 系列（齿轮齿条式）执行器的自动选型。

---

## 一、SF 系列（Scotch Yoke 拨叉式）

### 1.1 DA（双作用）选型逻辑

**原理**: 双作用执行器使用气源双向驱动，0°和90°位置都由气源控制。

**选型条件**:
- 根据阀门类型选择轭架类型：
  - **球阀 (Ball Valve)**: 使用对称轭架 (Symmetric)
  - **蝶阀 (Butterfly Valve)**: 使用倾斜轭架 (Canted)
- 扭矩匹配：`执行器扭矩 >= 需求扭矩`
- 需求扭矩 = 阀门扭矩 × 安全系数（默认1.3）

**型号命名**:
- 球阀: `SF-DA063` (不带/C)
- 蝶阀: `SF-DA063/C` (带/C表示倾斜轭架)

### 1.2 SR（单作用）选型逻辑

**原理**: 单作用执行器使用弹簧单向驱动，气源反向驱动。

**扭矩数据结构**:
```javascript
{
  springTorque: {
    SST: 弹簧复位起点扭矩,
    SET: 弹簧复位终点扭矩
  },
  airTorque: {
    "0.5MPa": {
      AST: 气源动作起点扭矩,
      AET: 气源动作终点扭矩
    }
  }
}
```

**故障关 (STC - Spring To Close)**:
- 弹簧关阀，气源开阀
- 条件1: `SET >= 关闭扭矩`
- 条件2: `AST >= 开启扭矩`
- 实际可用扭矩: `min(SET, AST)`

**故障开 (STO - Spring To Open)**:
- 弹簧开阀，气源关阀
- 条件1: `SST >= 开启扭矩`
- 条件2: `AET >= 关闭扭矩`
- 实际可用扭矩: `min(SST, AET)`

**型号命名**:
- 球阀故障关: `SF-SR52K8-STC`
- 蝶阀故障关: `SF-SR52K8/C-STC`
- 球阀故障开: `SF-SR52K8-STO`
- 蝶阀故障开: `SF-SR52K8/C-STO`

---

## 二、AT/GY 系列（Rack & Pinion 齿轮齿条式）

### 2.1 DA（双作用）选型逻辑

**原理**: 双作用执行器使用气源双向驱动。

**扭矩数据结构**:
```javascript
{
  torque_data: {
    "0.4MPa": 52,  // 0.4MPa压力下的输出扭矩
    "0.5MPa": 65,  // 0.5MPa压力下的输出扭矩
    "0.6MPa": 78   // 0.6MPa压力下的输出扭矩
  }
}
```

**选型条件**:
- 根据工作压力查找对应扭矩值
- 如果没有精确匹配，使用最接近且不大于工作压力的扭矩值
- 扭矩匹配：`执行器扭矩 >= 需求扭矩`

**型号命名**:
- `AT-DA52` (铝合金)
- `GY-DA105` (不锈钢)

### 2.2 SR（单作用）选型逻辑

**原理**: 单作用执行器使用弹簧单向驱动，气源反向驱动。

**扭矩数据结构**:
```javascript
{
  torqueData: {
    springTorque: {
      SST: 弹簧复位起点扭矩,
      SRT: 弹簧复位运行扭矩,
      SET: 弹簧复位终点扭矩
    },
    airTorque: {
      "0.5MPa": {
        AST: 气源动作起点扭矩,
        ART: 气源动作运行扭矩,
        AET: 气源动作终点扭矩
      }
    }
  }
}
```

**故障关 (STC)**:
- 条件1: `SET >= 关闭扭矩`
- 条件2: `AST >= 开启扭矩`
- 实际可用扭矩: `min(SET, AST)`

**故障开 (STO)**:
- 条件1: `SST >= 开启扭矩`
- 条件2: `AET >= 关闭扭矩`
- 实际可用扭矩: `min(SST, AET)`

**型号命名**:
- `AT-SR52K8-STC` (故障关)
- `AT-SR52K8-STO` (故障开)

---

## 三、DA vs SR 核心区别

| 特性 | DA (双作用) | SR (单作用) |
|------|------------|------------|
| **驱动方式** | 气源双向驱动 | 弹簧单向 + 气源反向 |
| **扭矩数据** | 单一扭矩值 | 弹簧扭矩 + 气源扭矩 |
| **故障位置** | 不适用 | 必须指定（STC/STO） |
| **选型条件** | 1个条件 | 2个条件（开启+关闭） |
| **应用场景** | 普通工况 | 需要故障安全保护 |
| **价格** | 相对较低 | 相对较高（含弹簧） |

---

## 四、选型效率优化

### 4.1 数据库查询优化

```javascript
// 提前过滤条件
let query = {
  mechanism: mechanism,        // 机构类型
  status: '已发布',            // 只查询已发布产品
  action_type: action_type_preference  // 作用类型（如果指定）
};

// 按body_size排序，优先推荐小型号
const actuators = await Actuator.find(query).sort({ body_size: 1 });
```

### 4.2 扭矩匹配优化

**SF-DA**: 直接从 Map 中获取扭矩值
```javascript
const torque = actuator.torque_symmetric.get(`${pressure}_${angle}`);
```

**AT/GY-DA**: 直接从 Object 中获取扭矩值
```javascript
const torque = actuator.torque_data[`${pressure}MPa`];
```

**SR**: 只检查必要的扭矩值
```javascript
// 故障关只检查 SET 和 AST
// 故障开只检查 SST 和 AET
```

### 4.3 提前终止

- 预算过滤：超出预算的执行器直接跳过
- 扭矩不足：不满足扭矩要求的执行器直接跳过
- 按价格排序：优先推荐性价比高的型号

---

## 五、选型流程图

```
用户输入参数
    ↓
验证必需参数
    ↓
构建查询条件 → 数据库查询 → 获取候选执行器
    ↓
判断机构类型
    ↓
┌─────────────┬─────────────┐
│   SF系列    │  AT/GY系列  │
└─────────────┴─────────────┘
    ↓              ↓
判断作用类型   判断作用类型
    ↓              ↓
┌────┬────┐   ┌────┬────┐
│ DA │ SR │   │ DA │ SR │
└────┴────┘   └────┴────┘
    ↓              ↓
扭矩匹配       扭矩匹配
    ↓              ↓
预算过滤       预算过滤
    ↓              ↓
计算裕度       计算裕度
    ↓              ↓
按价格排序 ← ← ← ← ←
    ↓
返回结果
```

---

## 六、关键参数说明

### 6.1 必需参数

- `mechanism`: 机构类型（Scotch Yoke / Rack & Pinion）
- `valve_type`: 阀门类型（Ball Valve / Butterfly Valve）
- `working_pressure`: 工作压力（MPa）
- `valveTorque` 或 `required_torque`: 扭矩要求

### 6.2 SR 专用参数

- `failSafePosition`: 故障安全位置（Fail Close / Fail Open）
- `requiredOpeningTorque`: 开启扭矩
- `requiredClosingTorque`: 关闭扭矩

### 6.3 可选参数

- `safetyFactor`: 安全系数（默认1.3）
- `action_type_preference`: 作用类型偏好（DA / SR）
- `temperature_code`: 温度代码（T1/T2/T3/M）
- `needs_manual_override`: 是否需要手动操作装置
- `max_budget`: 最大预算

---

## 七、常见问题

### Q1: 为什么 SR 需要两个扭矩值？
**A**: 单作用执行器在开启和关闭时使用不同的驱动源（弹簧或气源），需要分别验证两个方向的扭矩是否满足要求。

### Q2: 扭矩裕度如何计算？
**A**: `扭矩裕度 = (实际扭矩 - 需求扭矩) / 需求扭矩 × 100%`
- 20-50%: 强烈推荐
- 10-20%: 推荐
- <10%: 勉强可用

### Q3: 为什么球阀和蝶阀使用不同的轭架？
**A**: 球阀扭矩曲线对称，使用对称轭架效率更高；蝶阀扭矩曲线不对称，使用倾斜轭架更匹配。

### Q4: 如何提高选型效率？
**A**: 
1. 指定 `action_type_preference` 减少候选数量
2. 设置 `max_budget` 提前过滤
3. 指定 `body_size_preference` 精确匹配

---

## 八、版本历史

- **v1.0** (2025-11-11): 初始版本
  - 支持 SF/AT/GY 系列
  - 支持 DA/SR 作用类型
  - 优化选型逻辑和效率
  - 修复扭矩计算错误

---

**文档维护**: 技术团队  
**最后更新**: 2025-11-11
