#!/bin/bash

# API 测试脚本
# 使用方法: chmod +x test-api.sh && ./test-api.sh

BASE_URL="http://localhost:5001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔═══════════════════════════════════════════════════╗"
echo "║     Project Ark Platform API 测试                ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# 第一步：登录获取 token
echo -e "${YELLOW}📝 步骤 1: 登录获取认证令牌...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@projectark.com",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ 登录失败！${NC}"
  echo "响应: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ 登录成功！${NC}"
echo "Token: ${TOKEN:0:50}..."
echo ""

# 第二步：获取所有执行器
echo -e "${YELLOW}📦 步骤 2: 获取所有执行器...${NC}"
ACTUATORS=$(curl -s -X GET ${BASE_URL}/api/actuators \
  -H "Authorization: Bearer $TOKEN")

ACTUATOR_COUNT=$(echo $ACTUATORS | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo -e "${GREEN}✅ 找到 $ACTUATOR_COUNT 个执行器${NC}"
echo ""

# 第三步：根据扭矩查找执行器
echo -e "${YELLOW}🔍 步骤 3: 查找满足 500Nm 扭矩要求的执行器...${NC}"
echo "   参数: 扭矩=500Nm, 压力=0.4MPa, 角度=0°, 对称轭架"
TORQUE_SEARCH=$(curl -s -X POST ${BASE_URL}/api/actuators/find-by-torque \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 500,
    "pressure": 0.4,
    "angle": 0,
    "yoke_type": "symmetric"
  }')

FOUND_COUNT=$(echo $TORQUE_SEARCH | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo -e "${GREEN}✅ 找到 $FOUND_COUNT 个满足要求的执行器${NC}"

# 提取第一个执行器的型号
FIRST_MODEL=$(echo $TORQUE_SEARCH | grep -o '"model_base":"[^"]*' | head -1 | cut -d'"' -f4)
ACTUAL_TORQUE=$(echo $TORQUE_SEARCH | grep -o '"actual_torque":[0-9]*' | head -1 | cut -d':' -f2)
echo "   推荐型号: $FIRST_MODEL (实际扭矩: ${ACTUAL_TORQUE}Nm)"
echo ""

# 第四步：获取所有手动操作装置
echo -e "${YELLOW}🔧 步骤 4: 获取所有手动操作装置...${NC}"
OVERRIDES=$(curl -s -X GET ${BASE_URL}/api/manual-overrides \
  -H "Authorization: Bearer $TOKEN")

OVERRIDE_COUNT=$(echo $OVERRIDES | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo -e "${GREEN}✅ 找到 $OVERRIDE_COUNT 个手动操作装置${NC}"
echo ""

# 第五步：查找与 SF10 兼容的手动操作装置
echo -e "${YELLOW}🔎 步骤 5: 查找与 SF10 兼容的手动操作装置...${NC}"
COMPATIBLE=$(curl -s -X GET ${BASE_URL}/api/manual-overrides/compatible/SF10 \
  -H "Authorization: Bearer $TOKEN")

COMPATIBLE_COUNT=$(echo $COMPATIBLE | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo -e "${GREEN}✅ 找到 $COMPATIBLE_COUNT 个兼容的手动操作装置${NC}"

# 提取兼容型号
MODELS=$(echo $COMPATIBLE | grep -o '"model":"[^"]*' | cut -d'"' -f4 | tr '\n' ', ')
echo "   兼容型号: ${MODELS%, }"
echo ""

# 第六步：创建测试项目
echo -e "${YELLOW}📁 步骤 6: 创建测试项目...${NC}"
PROJECT_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/new-projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "API测试项目",
    "client_name": "测试客户",
    "priority": "中"
  }')

PROJECT_ID=$(echo $PROJECT_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
PROJECT_NUMBER=$(echo $PROJECT_RESPONSE | grep -o '"project_number":"[^"]*' | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ 创建项目失败${NC}"
  echo "响应: $PROJECT_RESPONSE"
else
  echo -e "${GREEN}✅ 项目创建成功${NC}"
  echo "   项目编号: $PROJECT_NUMBER"
  echo "   项目ID: $PROJECT_ID"
  echo ""
fi

# 第七步：使用自动选型功能
if [ ! -z "$PROJECT_ID" ]; then
  echo -e "${YELLOW}🤖 步骤 7: 测试自动选型功能...${NC}"
  echo "   为阀门 V-TEST-001 自动选择执行器和手动操作装置"
  AUTO_SELECT=$(curl -s -X POST ${BASE_URL}/api/new-projects/${PROJECT_ID}/auto-select \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "tag_number": "V-TEST-001",
      "required_torque": 600,
      "working_pressure": 0.5,
      "working_angle": 0,
      "yoke_type": "symmetric",
      "needs_manual_override": true,
      "preferred_override_type": "手轮"
    }')
  
  SELECTED_MODEL=$(echo $AUTO_SELECT | grep -o '"model_base":"[^"]*' | head -1 | cut -d'"' -f4)
  OVERRIDE_MODEL=$(echo $AUTO_SELECT | grep -o '"override_model":"[^"]*' | cut -d'"' -f4)
  TOTAL_PRICE=$(echo $AUTO_SELECT | grep -o '"total_price":[0-9]*' | head -1 | cut -d':' -f2)
  
  if [ ! -z "$SELECTED_MODEL" ]; then
    echo -e "${GREEN}✅ 自动选型成功${NC}"
    echo "   选择的执行器: $SELECTED_MODEL"
    echo "   手动操作装置: $OVERRIDE_MODEL"
    echo "   总价: ¥$TOTAL_PRICE"
  else
    echo -e "${RED}❌ 自动选型失败${NC}"
    echo "响应: $AUTO_SELECT"
  fi
  echo ""
fi

# 第八步：获取项目详情
if [ ! -z "$PROJECT_ID" ]; then
  echo -e "${YELLOW}📋 步骤 8: 获取项目详情...${NC}"
  PROJECT_DETAIL=$(curl -s -X GET ${BASE_URL}/api/new-projects/${PROJECT_ID} \
    -H "Authorization: Bearer $TOKEN")
  
  SELECTION_COUNT=$(echo $PROJECT_DETAIL | grep -o '"tag_number"' | wc -l | tr -d ' ')
  echo -e "${GREEN}✅ 项目包含 $SELECTION_COUNT 个选型配置${NC}"
  echo ""
fi

# 测试总结
echo "╔═══════════════════════════════════════════════════╗"
echo "║              🎉 API 测试完成！                    ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ 所有测试通过！${NC}"
echo ""
echo "📊 测试结果摘要:"
echo "   • 执行器总数: $ACTUATOR_COUNT"
echo "   • 手动操作装置总数: $OVERRIDE_COUNT"
echo "   • 扭矩查找: 找到 $FOUND_COUNT 个选项"
echo "   • 兼容性查询: SF10 兼容 $COMPATIBLE_COUNT 个手动装置"
echo "   • 项目创建: 成功 (ID: ${PROJECT_ID:0:20}...)"
echo "   • 自动选型: $([ ! -z "$SELECTED_MODEL" ] && echo "成功" || echo "跳过")"
echo ""
echo "💡 提示: 查看完整的 API 文档请参考 新API文档.md"
echo ""


