#!/bin/bash

echo "======================================"
echo "选型API测试脚本"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 基础URL
BASE_URL="http://localhost:5001/api/selection"

echo -e "${BLUE}测试 1: Scotch Yoke (SF系列) 选型${NC}"
echo "请求参数: mechanism=Scotch Yoke, required_torque=500, working_pressure=0.5"
curl -X POST "$BASE_URL/calculate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "mechanism": "Scotch Yoke",
    "required_torque": 500,
    "working_pressure": 0.5,
    "working_angle": 0,
    "yoke_preference": "Auto",
    "action_type_preference": "DA"
  }' 2>/dev/null | python3 -m json.tool | head -50

echo ""
echo ""
echo -e "${BLUE}测试 2: Rack & Pinion (AT系列 DA) 选型${NC}"
echo "请求参数: mechanism=Rack & Pinion, required_torque=10, working_pressure=0.5, action_type=DA"
curl -X POST "$BASE_URL/calculate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "mechanism": "Rack & Pinion",
    "required_torque": 10,
    "working_pressure": 0.5,
    "action_type_preference": "DA"
  }' 2>/dev/null | python3 -m json.tool | head -50

echo ""
echo ""
echo -e "${BLUE}测试 3: Rack & Pinion (AT系列 SR) 选型${NC}"
echo "请求参数: mechanism=Rack & Pinion, required_torque=8, working_pressure=0.55, action_type=SR"
curl -X POST "$BASE_URL/calculate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "mechanism": "Rack & Pinion",
    "required_torque": 8,
    "working_pressure": 0.55,
    "action_type_preference": "SR"
  }' 2>/dev/null | python3 -m json.tool | head -50

echo ""
echo ""
echo -e "${GREEN}✅ 测试完成${NC}"

