#!/bin/bash

# Scotch Yoke 阀门类型选型测试脚本
# 测试基于阀门类型的智能选型算法

BASE_URL="http://localhost:5001/api"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "========================================="
echo "  Scotch Yoke 阀门类型选型测试"
echo "========================================="
echo ""

# 测试 1: 球阀选型
echo -e "${BLUE}测试 1: 球阀 (Ball Valve) 选型${NC}"
echo "预期: 使用对称轭架扭矩，推荐型号不带 /C"
echo ""

curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "mechanism": "Scotch Yoke",
    "valveType": "Ball Valve",
    "valveTorque": 100,
    "safetyFactor": 1.3,
    "working_pressure": 0.6,
    "working_angle": 90
  }' | python3 -m json.tool

echo ""
echo "========================================="
echo ""

# 测试 2: 蝶阀选型
echo -e "${BLUE}测试 2: 蝶阀 (Butterfly Valve) 选型${NC}"
echo "预期: 使用倾斜轭架扭矩，推荐型号带 /C"
echo ""

curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "mechanism": "Scotch Yoke",
    "valveType": "Butterfly Valve",
    "valveTorque": 100,
    "safetyFactor": 1.3,
    "working_pressure": 0.6,
    "working_angle": 90
  }' | python3 -m json.tool

echo ""
echo "========================================="
echo ""

# 测试 3: 缺少阀门类型（错误处理）
echo -e "${BLUE}测试 3: 缺少阀门类型（错误处理）${NC}"
echo "预期: 返回 400 错误，提示需要提供阀门类型"
echo ""

curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "mechanism": "Scotch Yoke",
    "valveTorque": 100,
    "working_pressure": 0.6
  }' | python3 -m json.tool

echo ""
echo "========================================="
echo ""

# 测试 4: 无效的阀门类型（错误处理）
echo -e "${BLUE}测试 4: 无效的阀门类型（错误处理）${NC}"
echo "预期: 返回 400 错误，提示阀门类型无效"
echo ""

curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "mechanism": "Scotch Yoke",
    "valveType": "Gate Valve",
    "valveTorque": 100,
    "working_pressure": 0.6
  }' | python3 -m json.tool

echo ""
echo "========================================="
echo ""

# 测试 5: 旧版参数兼容性（snake_case）
echo -e "${BLUE}测试 5: 旧版参数兼容性 (valve_type)${NC}"
echo "预期: 正常处理，支持旧版 snake_case 参数"
echo ""

curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "mechanism": "Scotch Yoke",
    "valve_type": "Ball Valve",
    "valve_torque": 100,
    "safety_factor": 1.3,
    "working_pressure": 0.6,
    "working_angle": 90
  }' | python3 -m json.tool

echo ""
echo "========================================="
echo ""

# 测试 6: 齿轮齿条式（不需要阀门类型）
echo -e "${BLUE}测试 6: 齿轮齿条式（不需要阀门类型）${NC}"
echo "预期: 正常处理，不需要 valve_type 参数"
echo ""

curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "mechanism": "Rack & Pinion",
    "valveTorque": 200,
    "working_pressure": 0.6,
    "action_type_preference": "DA"
  }' | python3 -m json.tool

echo ""
echo "========================================="
echo ""

echo -e "${GREEN}✅ 测试完成！${NC}"
echo ""
echo "请检查以下关键点："
echo ""
echo -e "${YELLOW}球阀测试 (测试 1):${NC}"
echo "  ✓ search_criteria.valve_type = 'Ball Valve'"
echo "  ✓ data[].yoke_type = 'Symmetric'"
echo "  ✓ data[].recommended_model 不带 /C 后缀"
echo "  ✓ data[].actual_torque 来自对称轭架扭矩"
echo ""
echo -e "${YELLOW}蝶阀测试 (测试 2):${NC}"
echo "  ✓ search_criteria.valve_type = 'Butterfly Valve'"
echo "  ✓ data[].yoke_type = 'Canted'"
echo "  ✓ data[].recommended_model 带 /C 后缀"
echo "  ✓ data[].actual_torque 来自倾斜轭架扭矩"
echo ""
echo -e "${YELLOW}错误处理 (测试 3-4):${NC}"
echo "  ✓ 缺少阀门类型：返回 400 错误"
echo "  ✓ 无效阀门类型：返回 400 错误"
echo ""
echo -e "${YELLOW}兼容性 (测试 5-6):${NC}"
echo "  ✓ 支持旧版 snake_case 参数"
echo "  ✓ Rack & Pinion 不需要阀门类型"
echo ""
echo "查看后端控制台日志，确认以下输出："
echo "  🎯 Scotch Yoke 选型: 阀门类型 = Ball Valve, 压力键 = 0_6_90"
echo "  ✓ SF14-200DA: 球阀适用，对称扭矩 XXX N·m >= XXX N·m"
echo "  ✓ SF14-200DA/C: 蝶阀适用，倾斜扭矩 XXX N·m >= XXX N·m"
echo ""

