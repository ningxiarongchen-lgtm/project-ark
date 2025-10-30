#!/bin/bash

# 测试执行器阀门类型验证
# 用于验证SF系列和AT/GY系列的阀门类型规则

echo "=========================================="
echo "执行器阀门类型验证测试"
echo "=========================================="
echo ""

# 设置API端点
API_URL="http://localhost:5001/api/selection/calculate"

# 获取JWT Token（需要先登录）
echo "📝 请确保后端服务运行在 localhost:5001"
echo "📝 测试前请先登录获取token"
echo ""

# 从用户获取token（或使用环境变量）
if [ -z "$JWT_TOKEN" ]; then
    echo "请设置 JWT_TOKEN 环境变量："
    echo "export JWT_TOKEN='your-jwt-token-here'"
    echo ""
    echo "或者运行以下命令登录："
    echo "curl -X POST http://localhost:5001/api/auth/login \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"phone\":\"13800000001\", \"password\":\"123456\"}'"
    exit 1
fi

echo "=========================================="
echo "测试 1: SF系列 + 球阀（对称拨叉，不带C）"
echo "=========================================="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "mechanism": "Scotch Yoke",
    "valve_type": "Ball Valve",
    "action_type_preference": "DA",
    "required_torque": 100,
    "working_pressure": 0.6,
    "working_angle": 0
  }' | jq '.'

echo ""
echo ""

echo "=========================================="
echo "测试 2: SF系列 + 蝶阀（偏心拨叉，带/C）"
echo "=========================================="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "mechanism": "Scotch Yoke",
    "valve_type": "Butterfly Valve",
    "action_type_preference": "DA",
    "required_torque": 100,
    "working_pressure": 0.6,
    "working_angle": 0
  }' | jq '.'

echo ""
echo ""

echo "=========================================="
echo "测试 3: AT/GY系列 + 闸阀（应该成功）"
echo "=========================================="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "mechanism": "Rack & Pinion",
    "valve_type": "Gate Valve",
    "action_type_preference": "DA",
    "required_torque": 100,
    "working_pressure": 0.6,
    "temperature_type": "normal"
  }' | jq '.'

echo ""
echo ""

echo "=========================================="
echo "测试 4: AT/GY系列 + 截止阀（应该成功）"
echo "=========================================="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "mechanism": "Rack & Pinion",
    "valve_type": "Globe Valve",
    "action_type_preference": "DA",
    "required_torque": 100,
    "working_pressure": 0.6,
    "temperature_type": "normal"
  }' | jq '.'

echo ""
echo ""

echo "=========================================="
echo "测试 5: AT/GY系列 + 直行程调节阀（应该成功）"
echo "=========================================="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "mechanism": "Rack & Pinion",
    "valve_type": "Control Valve",
    "action_type_preference": "DA",
    "required_torque": 100,
    "working_pressure": 0.6,
    "temperature_type": "normal"
  }' | jq '.'

echo ""
echo ""

echo "=========================================="
echo "测试 6: AT/GY系列 + 球阀（应该失败）"
echo "=========================================="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "mechanism": "Rack & Pinion",
    "valve_type": "Ball Valve",
    "action_type_preference": "DA",
    "required_torque": 100,
    "working_pressure": 0.6,
    "temperature_type": "normal"
  }' | jq '.'

echo ""
echo ""

echo "=========================================="
echo "测试 7: AT/GY系列 + 蝶阀（应该失败）"
echo "=========================================="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "mechanism": "Rack & Pinion",
    "valve_type": "Butterfly Valve",
    "action_type_preference": "DA",
    "required_torque": 100,
    "working_pressure": 0.6,
    "temperature_type": "normal"
  }' | jq '.'

echo ""
echo ""

echo "=========================================="
echo "测试 8: SF系列单作用 + 球阀 + 故障关"
echo "=========================================="
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "mechanism": "Scotch Yoke",
    "valve_type": "Ball Valve",
    "action_type_preference": "SR",
    "failSafePosition": "Fail Close",
    "requiredOpeningTorque": 80,
    "requiredClosingTorque": 100,
    "working_pressure": 0.6,
    "working_angle": 0
  }' | jq '.'

echo ""
echo ""

echo "=========================================="
echo "测试完成！"
echo "=========================================="
echo ""
echo "预期结果："
echo "✅ 测试 1-5: 应该返回匹配的执行器列表"
echo "❌ 测试 6-7: 应该返回400错误（阀门类型不匹配）"
echo "✅ 测试 8: 应该返回单作用执行器（型号不带/C）"
echo ""
echo "注意事项："
echo "1. SF系列球阀型号不带 /C"
echo "2. SF系列蝶阀型号带 /C"
echo "3. AT/GY系列只支持：闸阀、截止阀、直行程调节阀"
echo "4. AT/GY系列不支持：球阀、蝶阀"

