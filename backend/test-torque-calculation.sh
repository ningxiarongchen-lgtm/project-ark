#!/bin/bash

# 选型算法扭矩计算测试脚本
# 测试优化后的 valveTorque 和 safetyFactor 逻辑

BASE_URL="http://localhost:5001/api"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "  选型算法扭矩计算测试"
echo "========================================="
echo ""

# 测试 1: 使用新版参数 (camelCase) - 默认安全系数 1.3
echo -e "${BLUE}测试 1: 新版参数 (valveTorque + 默认 safetyFactor 1.3)${NC}"
echo "请求: valveTorque=100, working_pressure=0.6, mechanism=Scotch Yoke"
echo "预期: requiredTorque = 100 × 1.3 = 130 N·m"
echo ""

curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "valveTorque": 100,
    "working_pressure": 0.6,
    "mechanism": "Scotch Yoke",
    "yoke_preference": "Auto"
  }' | python3 -m json.tool

echo ""
echo "========================================="
echo ""

# 测试 2: 使用新版参数 + 自定义安全系数
echo -e "${BLUE}测试 2: 新版参数 (valveTorque + 自定义 safetyFactor 1.5)${NC}"
echo "请求: valveTorque=100, safetyFactor=1.5, working_pressure=0.6"
echo "预期: requiredTorque = 100 × 1.5 = 150 N·m"
echo ""

curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "valveTorque": 100,
    "safetyFactor": 1.5,
    "working_pressure": 0.6,
    "mechanism": "Scotch Yoke",
    "yoke_preference": "Auto"
  }' | python3 -m json.tool

echo ""
echo "========================================="
echo ""

# 测试 3: 使用旧版参数 (snake_case) - 向后兼容
echo -e "${BLUE}测试 3: 旧版参数 (valve_torque + safety_factor)${NC}"
echo "请求: valve_torque=100, safety_factor=1.2, working_pressure=0.6"
echo "预期: requiredTorque = 100 × 1.2 = 120 N·m"
echo ""

curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "valve_torque": 100,
    "safety_factor": 1.2,
    "working_pressure": 0.6,
    "mechanism": "Scotch Yoke",
    "yoke_preference": "Auto"
  }' | python3 -m json.tool

echo ""
echo "========================================="
echo ""

# 测试 4: 直接提供 required_torque（跳过计算）
echo -e "${BLUE}测试 4: 直接提供 required_torque${NC}"
echo "请求: required_torque=130, working_pressure=0.6"
echo "预期: 直接使用 130 N·m（不进行计算）"
echo ""

curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "required_torque": 130,
    "working_pressure": 0.6,
    "mechanism": "Scotch Yoke",
    "yoke_preference": "Auto"
  }' | python3 -m json.tool

echo ""
echo "========================================="
echo ""

# 测试 5: 测试 Rack & Pinion (AT/GY系列)
echo -e "${BLUE}测试 5: Rack & Pinion 机构 (valveTorque + safetyFactor)${NC}"
echo "请求: valveTorque=200, safetyFactor=1.3, mechanism=Rack & Pinion"
echo "预期: requiredTorque = 200 × 1.3 = 260 N·m"
echo ""

curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "valveTorque": 200,
    "safetyFactor": 1.3,
    "working_pressure": 0.6,
    "mechanism": "Rack & Pinion",
    "action_type_preference": "DA"
  }' | python3 -m json.tool

echo ""
echo "========================================="
echo ""

# 测试 6: 缺少必需参数（错误处理）
echo -e "${BLUE}测试 6: 缺少必需参数（错误处理）${NC}"
echo "请求: 只提供 working_pressure，缺少扭矩参数"
echo "预期: 返回错误信息"
echo ""

curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "working_pressure": 0.6,
    "mechanism": "Scotch Yoke"
  }' | python3 -m json.tool

echo ""
echo "========================================="
echo ""

echo -e "${GREEN}✅ 测试完成！${NC}"
echo ""
echo "请检查："
echo "  1. search_criteria 中是否包含 valve_torque, safety_factor, required_torque"
echo "  2. 扭矩计算是否正确（valveTorque × safetyFactor）"
echo "  3. 默认 safetyFactor 是否为 1.3"
echo "  4. 向后兼容性是否正常"
echo ""
echo "查看后端控制台日志，确认以下输出："
echo "  📊 扭矩计算：阀门扭矩 XXX N·m × 安全系数 X.X = XXX N·m"
echo "  🔍 查询条件: ..."
echo "  📦 找到 X 个候选执行器"
echo "  ✅ 成功找到 X 个匹配的执行器"
echo ""

