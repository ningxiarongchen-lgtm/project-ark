# AT/GY 系列测试验证指南 🧪

**版本**: v2.0  
**创建时间**: 2025-10-27

---

## 🚀 快速测试流程

### 步骤 1: 数据导入测试

```bash
# 1. 进入后端目录
cd backend

# 2. 确保MongoDB运行
# macOS: brew services start mongodb-community
# 或直接: mongod

# 3. 运行导入脚本
npm run seed:atgy:final
```

**预期输出**:
```
╔═══════════════════════════════════════════════════════╗
║   AT/GY 系列执行器数据导入工具（最终版）             ║
║   包含完整价格结构和手动操作装置信息                 ║
╚═══════════════════════════════════════════════════════╝

✅ 数据库连接成功: cmax_selection

🗑️  删除旧的 AT/GY 系列数据...
  ✅ 删除了 XX 条旧的 AT/GY 系列记录
  ℹ️  SF 系列数据已保留

📦 开始读取 AT/GY 系列执行器数据（最终版）...
📄 文件路径: .../at_gy_actuators_data_final.csv

📊 CSV 读取完成: 共读取 55 行数据

💾 开始导入 55 条数据到数据库...
✅ 成功导入 55 条 AT/GY 系列执行器数据！

📈 导入统计:
  ┌─────────────────────────────────────┐
  │ AT-SR (弹簧复位):      16 条    │
  │ AT-DA (双作用):        16 条    │
  │ GY-SR (弹簧复位):      12 条    │
  │ GY-DA (双作用):        11 条    │
  ├─────────────────────────────────────┤
  │ 配手动操作装置:        32 条    │
  │ 含密封套件价格:        32 条    │
  └─────────────────────────────────────┘

💰 价格范围:
  最低价格: ¥64
  最高价格: ¥73,450

🔍 验证导入结果...
  ✅ AT 系列: 32 条
  ✅ GY 系列: 23 条
  ✅ 总计（含SF系列）: XXX 条

✅ AT/GY 系列数据导入完成！
```

**验证清单**:
- [ ] AT 系列数量 = 32
- [ ] GY 系列数量 = 23
- [ ] 配手动操作装置数量 = 32
- [ ] 价格范围正确
- [ ] 无错误信息

---

### 步骤 2: 数据库验证

```bash
# 连接MongoDB
mongo

# 使用数据库
use cmax_selection

# 1. 验证AT系列数量
db.actuators.find({ series: "AT" }).count()
# 预期: 32

# 2. 验证GY系列数量
db.actuators.find({ series: "GY" }).count()
# 预期: 23

# 3. 查看示例数据
db.actuators.findOne({ model_base: "AT-SR52K8" })
```

**预期数据结构**:
```javascript
{
  _id: ObjectId("..."),
  model_base: "AT-SR52K8",
  series: "AT",
  mechanism: "Rack & Pinion",
  body_size: "52",
  action_type: "SR",
  spring_range: "K8",
  base_price: 75,                    // ✅ 基础价格
  
  pricing: {                          // ✅ 详细价格结构
    base_price_normal: 75,
    base_price_low: 77,
    base_price_high: 86,
    manual_override_model: "SD-1",
    manual_override_price: 127,
    seal_kit_price: 1.5
  },
  
  torque_data: {
    spring_end: 7.7,
    air_start_0_55MPa: 9.9,
    air_end_0_55MPa: 6.7
  },
  
  dimensions: {
    A: 147,
    B: 65,
    H: 92
  }
}
```

**验证清单**:
- [ ] `pricing` 对象存在
- [ ] `base_price_normal`, `base_price_low`, `base_price_high` 都有值
- [ ] `manual_override_model` 和 `manual_override_price` 正确（AT系列）
- [ ] `torque_data` 格式正确
- [ ] `dimensions` 格式正确

---

### 步骤 3: 前端界面测试

```bash
# 1. 启动后端（如果还没启动）
cd backend
npm start

# 2. 启动前端（新终端）
cd frontend
npm run dev

# 3. 访问
# http://localhost:5173
```

#### 测试 3.1: 表单显示

**操作步骤**:
1. 登录系统
2. 进入选型引擎
3. 默认显示"拨叉式 (SF系列)"

**验证清单**:
- [ ] 默认不显示"使用温度"字段
- [ ] 默认不显示"手轮"字段
- [ ] 显示"阀门类型"字段

#### 测试 3.2: 切换到AT/GY系列

**操作步骤**:
1. 点击"齿轮齿条式 (AT/GY系列)"

**验证清单**:
- [ ] ✅ "使用温度"字段显示
- [ ] ✅ 默认选中"常温 (Normal)"
- [ ] ✅ "手轮"复选框显示
- [ ] ✅ 默认不勾选
- [ ] ❌ "阀门类型"字段隐藏

#### 测试 3.3: 温度选择

**操作步骤**:
1. 点击"低温 (Low Temp)"
2. 点击"高温 (High Temp)"
3. 回到"常温 (Normal)"

**验证清单**:
- [ ] 选项正确切换
- [ ] 表单值正确更新
- [ ] UI响应流畅

#### 测试 3.4: 手轮选择

**操作步骤**:
1. 勾选"需要手轮"
2. 取消勾选

**验证清单**:
- [ ] 勾选状态正确
- [ ] 表单值正确更新

---

### 步骤 4: 后端选型测试

#### 测试 4.1: 常温 + 不需要手轮

**请求**:
```bash
curl -X POST http://localhost:5001/api/selection/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "mechanism": "Rack & Pinion",
    "temperature_type": "normal",
    "needs_handwheel": false,
    "required_torque": 20,
    "working_pressure": 0.55
  }'
```

**验证响应**:
```javascript
{
  success: true,
  count: > 0,
  data: [
    {
      model_base: "AT-DA63",
      price: 90,                    // ✅ base_price_normal
      price_type: "常温型",         // ✅
      temperature_type: "normal",
      handwheel: null,              // ✅ 没有手轮
      needs_handwheel: false,
      total_price: 90,              // ✅ = price
      price_breakdown: {
        base_price: 90,
        handwheel_price: 0,
        total: 90
      }
    }
  ]
}
```

**验证清单**:
- [ ] 返回成功
- [ ] `price` = `base_price_normal`
- [ ] `price_type` = "常温型"
- [ ] `handwheel` = null
- [ ] `total_price` = `price`

#### 测试 4.2: 低温 + 需要手轮

**请求**:
```bash
curl -X POST http://localhost:5001/api/selection/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "mechanism": "Rack & Pinion",
    "temperature_type": "low",
    "needs_handwheel": true,
    "required_torque": 20,
    "working_pressure": 0.55
  }'
```

**验证响应**:
```javascript
{
  data: [
    {
      model_base: "AT-DA63",
      price: 93,                    // ✅ base_price_low
      price_type: "低温型",         // ✅
      handwheel: {                  // ✅ 有手轮
        model: "SD-1",
        price: 127
      },
      total_price: 220,             // ✅ = 93 + 127
      price_breakdown: {
        base_price: 93,
        handwheel_price: 127,
        total: 220
      }
    }
  ]
}
```

**验证清单**:
- [ ] `price` = `base_price_low`
- [ ] `price_type` = "低温型"
- [ ] `handwheel.model` 存在
- [ ] `handwheel.price` 存在
- [ ] `total_price` = `price` + `handwheel.price`
- [ ] `price_breakdown` 正确

#### 测试 4.3: 高温 + 需要手轮

**请求**:
```bash
curl -X POST http://localhost:5001/api/selection/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "mechanism": "Rack & Pinion",
    "temperature_type": "high",
    "needs_handwheel": true,
    "required_torque": 20,
    "working_pressure": 0.55
  }'
```

**验证响应**:
```javascript
{
  data: [
    {
      price: 110,                   // ✅ base_price_high
      price_type: "高温型",         // ✅
      handwheel: { model: "SD-1", price: 127 },
      total_price: 237              // ✅ = 110 + 127
    }
  ]
}
```

**验证清单**:
- [ ] `price` = `base_price_high`
- [ ] `price_type` = "高温型"
- [ ] `total_price` 正确计算

#### 测试 4.4: 向后兼容（SF系列）

**请求**:
```bash
curl -X POST http://localhost:5001/api/selection/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "mechanism": "Scotch Yoke",
    "valve_type": "Ball Valve",
    "required_torque": 500,
    "working_pressure": 0.6,
    "working_angle": 90,
    "yoke_type": "symmetric"
  }'
```

**验证响应**:
```javascript
{
  success: true,
  data: [
    {
      model_base: "SF10-DA-SY",
      price: 8500,
      valve_type: "Ball Valve",
      yoke_type: "Symmetric"
      // ✅ 没有 temperature_type
      // ✅ 没有 handwheel
      // ✅ 正常工作
    }
  ]
}
```

**验证清单**:
- [ ] SF系列正常工作
- [ ] 不受新参数影响
- [ ] 使用 `base_price`

---

### 步骤 5: 完整流程测试

#### 场景: 用户完整选型流程

**操作步骤**:

1. **登录系统**
   - 访问 http://localhost:5173
   - 使用管理员账号登录

2. **创建/选择项目**
   - 进入"项目管理"
   - 创建新项目或选择现有项目

3. **进入选型引擎**
   - 点击"选型引擎"

4. **填写参数**
   - 执行机构类型: 齿轮齿条式 (AT/GY系列)
   - 使用温度: 低温 (Low Temp)
   - 是否需要手轮: ✅ 勾选
   - 阀门口径: DN100
   - 法兰尺寸: F07/F10
   - 需求扭矩: 50 Nm
   - 工作压力: 0.55 MPa

5. **查看结果**
   - 点击"查找匹配执行器"
   - 验证推荐结果列表

6. **选择执行器**
   - 点击"选择此型号"

7. **保存到项目**
   - 确认配置
   - 点击"保存"

**验证清单**:
- [ ] 每一步操作正常
- [ ] 价格显示正确（低温价格）
- [ ] 手轮价格显示
- [ ] 总价计算正确
- [ ] 保存成功

---

## 📊 性能测试

### 导入性能

```bash
time npm run seed:atgy:final
```

**预期**:
- ✅ 完成时间 < 3秒
- ✅ 内存占用 < 100MB

### 选型性能

**测试**:
```bash
# 使用 Apache Bench 测试
ab -n 100 -c 10 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -p request.json \
  http://localhost:5001/api/selection/calculate
```

**预期**:
- ✅ 平均响应时间 < 200ms
- ✅ 99%请求 < 500ms

---

## 🐛 常见问题排查

### 问题 1: 导入脚本失败

**症状**: `npm run seed:atgy:final` 报错

**检查清单**:
1. MongoDB是否运行？
   ```bash
   # 检查MongoDB状态
   brew services list | grep mongodb
   # 或
   ps aux | grep mongod
   ```

2. .env文件是否配置？
   ```bash
   cat backend/.env
   # 应包含: MONGO_URI=mongodb://localhost:27017/cmax_selection
   ```

3. CSV文件是否存在？
   ```bash
   ls -la backend/data_imports/at_gy_actuators_data_final.csv
   ```

### 问题 2: 前端不显示新字段

**症状**: 选择AT/GY系列后，不显示温度和手轮字段

**检查清单**:
1. 浏览器是否刷新？
2. 控制台是否有错误？
3. 检查代码是否正确部署

### 问题 3: 后端返回错误价格

**症状**: 价格计算不正确

**检查清单**:
1. 查看后端日志
   ```bash
   # 应显示类似:
   # 💰 AT-DA63: 低温型价格 = ¥93
   # 🔧 加上手轮: SD-1 = ¥127
   # 💵 总价: ¥220
   ```

2. 验证数据库数据
   ```bash
   mongo
   use cmax_selection
   db.actuators.findOne({ model_base: "AT-DA63" }, { pricing: 1 })
   ```

---

## ✅ 测试完成清单

### 数据层
- [ ] 数据成功导入（55条）
- [ ] AT系列数量正确（32条）
- [ ] GY系列数量正确（23条）
- [ ] 价格字段完整
- [ ] 手轮信息正确

### 前端
- [ ] SF系列隐藏新字段
- [ ] AT/GY系列显示新字段
- [ ] 温度选择正常
- [ ] 手轮选择正常
- [ ] 表单验证正常

### 后端
- [ ] 常温价格正确
- [ ] 低温价格正确
- [ ] 高温价格正确
- [ ] 手轮价格正确加算
- [ ] 总价计算正确
- [ ] SF系列兼容

### 完整流程
- [ ] 端到端流程正常
- [ ] 数据保存正确
- [ ] PDF生成正常

---

## 📝 测试报告模板

```markdown
## AT/GY系列功能测试报告

**测试时间**: YYYY-MM-DD HH:mm
**测试人员**: XXX
**测试环境**: 
- 后端: http://localhost:5001
- 前端: http://localhost:5173
- 数据库: MongoDB 5.x

### 测试结果

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 数据导入 | ✅ / ❌ | |
| 数据验证 | ✅ / ❌ | |
| 前端表单 | ✅ / ❌ | |
| 后端选型 | ✅ / ❌ | |
| 价格计算 | ✅ / ❌ | |
| 向后兼容 | ✅ / ❌ | |
| 完整流程 | ✅ / ❌ | |

### 发现的问题
1. 
2. 
3. 

### 改进建议
1. 
2. 
3. 
```

---

**祝测试顺利！** 🎉

如有任何问题，请参考相关文档：
- [AT_GY系列完整升级总结.md](./AT_GY系列完整升级总结.md)
- [AT_GY_FINAL_QUICK_START.md](./AT_GY_FINAL_QUICK_START.md)

