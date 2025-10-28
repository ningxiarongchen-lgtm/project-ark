# API 测试指南

## 🚀 快速开始

### 第一步：创建测试数据

在后端目录运行：

```bash
cd "/Users/hexiaoxiao/Desktop/Model Selection System/backend"
node utils/seedNewData.js
```

这将创建：
- ✅ 5个执行器（SF10到SF20，不同型号）
- ✅ 5个手动操作装置（手轮、手柄、链轮、蜗轮箱）
- ✅ 1个示例项目（包含2个选型配置）

---

## 🔐 获取认证令牌

所有API都需要认证。首先登录获取token：

### 使用 curl

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cmax.com",
    "password": "admin123"
  }'
```

### 使用 httpie (推荐)

```bash
http POST http://localhost:5001/api/auth/login \
  email=admin@cmax.com \
  password=admin123
```

**保存返回的 token，后续请求都需要使用！**

---

## 📦 执行器 API 测试

### 1. 获取所有执行器

```bash
# curl
curl -X GET http://localhost:5001/api/actuators \
  -H "Authorization: Bearer YOUR_TOKEN"

# httpie
http GET http://localhost:5001/api/actuators \
  Authorization:"Bearer YOUR_TOKEN"
```

### 2. 根据扭矩查找合适的执行器

```bash
# curl
curl -X POST http://localhost:5001/api/actuators/find-by-torque \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 500,
    "pressure": 0.4,
    "angle": 0,
    "yoke_type": "symmetric"
  }'

# httpie
http POST http://localhost:5001/api/actuators/find-by-torque \
  Authorization:"Bearer YOUR_TOKEN" \
  required_torque:=500 \
  pressure:=0.4 \
  angle:=0 \
  yoke_type=symmetric
```

**预期结果：** 应返回 SF12-250SR 和 SF14-400DA（满足 ≥500Nm 要求）

### 3. 按本体尺寸过滤

```bash
curl -X GET "http://localhost:5001/api/actuators?body_size=SF14" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. 按作用类型过滤

```bash
curl -X GET "http://localhost:5001/api/actuators?action_type=DA" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. 创建新执行器（仅管理员）

```bash
curl -X POST http://localhost:5001/api/actuators \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_base": "SF08-100DA",
    "body_size": "SF08",
    "action_type": "DA",
    "base_price": 4000,
    "torque_symmetric": {
      "0.3_0": 206,
      "0.4_0": 275,
      "0.5_0": 343
    },
    "torque_canted": {
      "0.3_0": 278,
      "0.4_0": 371,
      "0.5_0": 463
    },
    "specifications": {
      "pressure_range": { "min": 2, "max": 8 },
      "temperature_range": { "min": -20, "max": 80 },
      "rotation_angle": 90,
      "weight": 8.5,
      "port_connection": "G1/4",
      "mounting_standard": "ISO5211"
    }
  }'
```

---

## 🔧 手动操作装置 API 测试

### 1. 获取所有手动操作装置

```bash
curl -X GET http://localhost:5001/api/manual-overrides \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. 查找与SF10兼容的手动操作装置

```bash
curl -X GET http://localhost:5001/api/manual-overrides/compatible/SF10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**预期结果：** 应返回 HG 和 HL（兼容SF10）

### 3. 批量查找兼容性

```bash
curl -X POST http://localhost:5001/api/manual-overrides/compatible-multiple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "body_sizes": ["SF10", "SF14", "SF20"]
  }'
```

### 4. 按操作类型过滤

```bash
curl -X GET "http://localhost:5001/api/manual-overrides?operation_type=手轮" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📁 项目 API 测试

### 1. 获取所有项目

```bash
curl -X GET http://localhost:5001/api/new-projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. 创建新项目

```bash
curl -X POST http://localhost:5001/api/new-projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "测试项目 - 石油管道阀门",
    "client_name": "某石油公司",
    "client_contact": {
      "company": "某石油有限公司",
      "contact_person": "李经理",
      "email": "li@oil.com",
      "phone": "139-8888-6666"
    },
    "priority": "高",
    "industry": "石油天然气",
    "application": "管道阀门自动化"
  }'
```

**保存返回的项目ID，后续使用！**

### 3. 🌟 自动选型（核心功能）

```bash
# 替换 PROJECT_ID 为实际的项目ID
curl -X POST http://localhost:5001/api/new-projects/PROJECT_ID/auto-select \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tag_number": "V-201",
    "required_torque": 600,
    "working_pressure": 0.5,
    "working_angle": 0,
    "yoke_type": "symmetric",
    "needs_manual_override": true,
    "preferred_override_type": "手轮"
  }'
```

**系统会自动：**
1. 根据扭矩要求找到合适的执行器
2. 根据执行器本体尺寸找到兼容的手动操作装置
3. 计算总价
4. 添加到项目中

### 4. 查看项目详情

```bash
curl -X GET http://localhost:5001/api/new-projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. 手动添加选型配置

```bash
# 先查找合适的执行器
curl -X POST http://localhost:5001/api/actuators/find-by-torque \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 1000,
    "pressure": 0.5,
    "angle": 0,
    "yoke_type": "canted"
  }'

# 然后手动添加到项目（使用返回的执行器ID）
curl -X POST http://localhost:5001/api/new-projects/PROJECT_ID/selections \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tag_number": "V-202",
    "input_params": {
      "required_torque": 1000,
      "working_pressure": 0.5,
      "working_angle": 0,
      "yoke_type": "canted",
      "needs_manual_override": false
    },
    "selected_actuator": {
      "actuator_id": "ACTUATOR_ID",
      "model_base": "SF12-250SR",
      "body_size": "SF12",
      "action_type": "SR",
      "yoke_type": "canted",
      "actual_torque": 1158,
      "price": 6500
    },
    "total_price": 6500,
    "status": "已选型"
  }'
```

### 6. 获取项目统计

```bash
curl -X GET http://localhost:5001/api/new-projects/stats/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🧪 完整测试流程示例

### 场景：为客户选择合适的执行器配置

```bash
# 1. 登录获取token
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmax.com","password":"admin123"}' \
  | jq -r '.token')

echo "Token: $TOKEN"

# 2. 创建项目
PROJECT_RESPONSE=$(curl -s -X POST http://localhost:5001/api/new-projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "自动化测试项目",
    "client_name": "测试客户",
    "priority": "中"
  }')

PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.data._id')
echo "项目ID: $PROJECT_ID"

# 3. 自动选型 - 第一个阀门
curl -X POST http://localhost:5001/api/new-projects/$PROJECT_ID/auto-select \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tag_number": "V-301",
    "required_torque": 400,
    "working_pressure": 0.4,
    "working_angle": 0,
    "yoke_type": "symmetric",
    "needs_manual_override": true
  }'

# 4. 自动选型 - 第二个阀门
curl -X POST http://localhost:5001/api/new-projects/$PROJECT_ID/auto-select \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tag_number": "V-302",
    "required_torque": 1200,
    "working_pressure": 0.5,
    "working_angle": 0,
    "yoke_type": "canted",
    "needs_manual_override": true,
    "preferred_override_type": "蜗轮箱"
  }'

# 5. 查看完整项目配置
curl -X GET http://localhost:5001/api/new-projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo "测试完成！"
```

---

## 🎯 测试检查清单

### 执行器测试
- [ ] 获取所有执行器列表
- [ ] 根据扭矩查找执行器（应返回合适的型号）
- [ ] 测试不同的压力和角度组合
- [ ] 测试对称和倾斜轭架类型
- [ ] 验证扭矩计算正确性

### 手动操作装置测试
- [ ] 获取所有手动操作装置
- [ ] 测试兼容性查询（SF10, SF12, SF14等）
- [ ] 验证返回的装置确实兼容指定尺寸
- [ ] 测试批量兼容性查询

### 项目测试
- [ ] 创建新项目
- [ ] 使用自动选型功能
- [ ] 验证自动选择的执行器满足要求
- [ ] 验证手动操作装置与执行器兼容
- [ ] 验证价格计算正确
- [ ] 测试手动添加选型配置
- [ ] 测试更新和删除选型配置
- [ ] 查看项目统计数据

---

## 📊 预期测试结果

### 扭矩查找测试

| 要求扭矩 | 压力 | 角度 | 轭架类型 | 应返回型号 | 实际扭矩 |
|---------|------|------|---------|-----------|---------|
| 300 Nm  | 0.4  | 0    | symmetric | SF10-150DA | 412 Nm  |
| 500 Nm  | 0.4  | 0    | symmetric | SF12-250SR | 687 Nm  |
| 1000 Nm | 0.5  | 0    | symmetric | SF14-400DA | 1430 Nm |
| 2000 Nm | 0.5  | 0    | canted   | SF16-600DA | 2316 Nm |

### 兼容性测试

| 本体尺寸 | 应返回的手动操作装置 |
|---------|---------------------|
| SF10    | HG, HL              |
| SF12    | HG, HL, HC          |
| SF14    | HG, HW, HC          |
| SF16    | HW, HC, HWG         |
| SF20    | HW, HWG             |

---

## 🐛 常见错误排查

### 401 Unauthorized
**原因：** 未提供token或token过期
**解决：** 重新登录获取新token

### 404 Not Found
**原因：** 项目ID或产品ID不存在
**解决：** 检查ID是否正确，确保资源存在

### 400 Bad Request
**原因：** 请求参数不正确
**解决：** 检查JSON格式，确保所有必需字段都已提供

### 未找到满足要求的执行器
**原因：** 扭矩要求过高或压力/角度组合没有数据
**解决：** 调整查询参数，或添加更多执行器数据

---

## 🔧 使用 Postman 测试

1. **导入环境变量：**
   - BASE_URL: `http://localhost:5001`
   - TOKEN: 登录后获取的token

2. **创建Collection：**
   - 新建 "C-MAX API Tests" collection
   - 在 Authorization 标签设置为 "Bearer Token"
   - 使用 {{TOKEN}} 变量

3. **添加请求：**
   - 为每个API端点创建请求
   - 使用 Tests 标签添加自动断言
   - 保存响应示例

4. **运行测试：**
   - 使用 Collection Runner 批量执行
   - 查看测试报告

---

## 📝 测试数据说明

### 执行器数据特点
- **SF10**: 小型，适合轻型阀门
- **SF12**: 中型，通用型号
- **SF14**: 中大型，高扭矩
- **SF16**: 大型，工业应用
- **SF20**: 超大型，重型阀门

### 扭矩数据格式
- 键格式：`"{压力}_{角度}"`
- 压力单位：MPa（0.3 = 3 bar）
- 角度单位：度（0, 15, 30等）

---

## ✅ 测试完成标志

当以下所有测试通过时，API功能正常：

1. ✅ 所有执行器数据正确创建
2. ✅ 扭矩查找返回正确的型号
3. ✅ 兼容性查询返回正确的手动操作装置
4. ✅ 自动选型功能正常工作
5. ✅ 项目总价计算正确
6. ✅ 权限控制工作正常

---

**准备好了吗？开始测试吧！** 🚀


