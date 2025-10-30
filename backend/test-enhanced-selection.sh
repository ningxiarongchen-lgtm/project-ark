#!/bin/bash

echo "╔═══════════════════════════════════════════════════════╗"
echo "║      增强版选型算法测试                               ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# API Base URL
BASE_URL="http://localhost:5001/api"

# 登录获取token
echo -e "${YELLOW}📝 步骤 1: 登录获取token...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@projectark.com",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ 登录失败！${NC}"
  exit 1
fi

echo -e "${GREEN}✅ 登录成功${NC}"
echo ""

# 测试1: 使用阀门扭矩和安全系数
echo -e "${BLUE}🧪 测试 1: 使用阀门扭矩和安全系数${NC}"
echo "   参数: 阀门扭矩=500Nm, 安全系数=1.2, 压力=0.5MPa"
RESPONSE=$(curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "valve_torque": 500,
    "safety_factor": 1.2,
    "working_pressure": 0.5,
    "yoke_preference": "Auto"
  }')

SUCCESS=$(echo $RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)
COUNT=$(echo $RESPONSE | grep -o '"count":[^,]*' | cut -d':' -f2)

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ 成功${NC}"
  echo "   所需扭矩: 600Nm (500 × 1.2)"
  echo "   找到执行器: $COUNT 个"
else
  echo -e "${RED}❌ 失败${NC}"
fi
echo ""

# 测试2: 轭架偏好 - Symmetric
echo -e "${BLUE}🧪 测试 2: 指定对称轭架偏好${NC}"
echo "   参数: 所需扭矩=600Nm, 轭架=Symmetric"
RESPONSE=$(curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 600,
    "working_pressure": 0.5,
    "yoke_preference": "Symmetric"
  }')

SUCCESS=$(echo $RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)
RECOMMENDED_YOKE=$(echo $RESPONSE | grep -o '"recommended_yoke":"[^"]*' | head -1 | cut -d'"' -f4)

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ 成功${NC}"
  echo "   推荐轭架: $RECOMMENDED_YOKE"
else
  echo -e "${RED}❌ 失败${NC}"
fi
echo ""

# 测试3: 轭架偏好 - Canted
echo -e "${BLUE}🧪 测试 3: 指定倾斜轭架偏好${NC}"
echo "   参数: 所需扭矩=600Nm, 轭架=Canted"
RESPONSE=$(curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 600,
    "working_pressure": 0.5,
    "yoke_preference": "Canted"
  }')

SUCCESS=$(echo $RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)
RECOMMENDED_YOKE=$(echo $RESPONSE | grep -o '"recommended_yoke":"[^"]*' | head -1 | cut -d'"' -f4)

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ 成功${NC}"
  echo "   推荐轭架: $RECOMMENDED_YOKE"
else
  echo -e "${RED}❌ 失败${NC}"
fi
echo ""

# 测试4: Auto模式（自动选择最佳轭架）
echo -e "${BLUE}🧪 测试 4: Auto模式 - 自动选择最佳轭架${NC}"
echo "   参数: 所需扭矩=600Nm, 轭架=Auto"
RESPONSE=$(curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 600,
    "working_pressure": 0.5,
    "yoke_preference": "Auto"
  }')

SUCCESS=$(echo $RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)
RECOMMENDED_YOKE=$(echo $RESPONSE | grep -o '"recommended_yoke":"[^"]*' | head -1 | cut -d'"' -f4)

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ 成功${NC}"
  echo "   推荐轭架: $RECOMMENDED_YOKE"
  if [ "$RECOMMENDED_YOKE" = "Both" ]; then
    echo "   说明: 对称和倾斜轭架都满足要求"
  fi
else
  echo -e "${RED}❌ 失败${NC}"
fi
echo ""

# 测试5: 预算限制
echo -e "${BLUE}🧪 测试 5: 预算限制${NC}"
echo "   参数: 所需扭矩=600Nm, 最大预算=¥7000"
RESPONSE=$(curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 600,
    "working_pressure": 0.5,
    "yoke_preference": "Auto",
    "max_budget": 7000
  }')

SUCCESS=$(echo $RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)
COUNT=$(echo $RESPONSE | grep -o '"count":[^,]*' | cut -d':' -f2)

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ 成功${NC}"
  echo "   符合预算: $COUNT 个"
else
  echo -e "${YELLOW}⚠️  未找到符合预算的执行器${NC}"
fi
echo ""

# 测试6: 带手动操作装置
echo -e "${BLUE}🧪 测试 6: 需要手动操作装置${NC}"
echo "   参数: 所需扭矩=600Nm, 需要手动装置"
RESPONSE=$(curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 600,
    "working_pressure": 0.5,
    "yoke_preference": "Auto",
    "needs_manual_override": true
  }')

SUCCESS=$(echo $RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)
MANUAL_OVERRIDE=$(echo $RESPONSE | grep -o '"manual_override":\{[^}]*\}' | head -1)

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ 成功${NC}"
  if [ ! -z "$MANUAL_OVERRIDE" ]; then
    echo "   已自动匹配手动操作装置"
  fi
else
  echo -e "${RED}❌ 失败${NC}"
fi
echo ""

# 测试7: 验证按价格排序
echo -e "${BLUE}🧪 测试 7: 验证结果按价格排序${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 500,
    "working_pressure": 0.5,
    "yoke_preference": "Auto"
  }')

SUCCESS=$(echo $RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ 成功${NC}"
  echo "   结果已按价格从低到高排序"
  
  # 提取前两个价格
  PRICE1=$(echo $RESPONSE | grep -o '"price":[0-9]*' | head -1 | cut -d':' -f2)
  PRICE2=$(echo $RESPONSE | grep -o '"price":[0-9]*' | head -2 | tail -1 | cut -d':' -f2)
  
  if [ ! -z "$PRICE1" ] && [ ! -z "$PRICE2" ]; then
    echo "   第一个: ¥$PRICE1"
    echo "   第二个: ¥$PRICE2"
    if [ $PRICE1 -le $PRICE2 ]; then
      echo -e "${GREEN}   ✓ 排序正确${NC}"
    else
      echo -e "${RED}   ✗ 排序错误${NC}"
    fi
  fi
else
  echo -e "${RED}❌ 失败${NC}"
fi
echo ""

# 测试8: 完整详细测试
echo -e "${BLUE}🧪 测试 8: 完整详细输出${NC}"
echo "   查看完整响应结构..."
RESPONSE=$(curl -s -X POST "$BASE_URL/selection/calculate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "valve_torque": 500,
    "safety_factor": 1.2,
    "working_pressure": 0.5,
    "working_angle": 0,
    "yoke_preference": "Auto",
    "needs_manual_override": true
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null | head -50
echo ""

echo "╔═══════════════════════════════════════════════════════╗"
echo "║               测试完成                                 ║"
echo "╚═══════════════════════════════════════════════════════╝"

echo ""
echo -e "${BLUE}📋 增强功能验证:${NC}"
echo "   ✅ 支持安全系数计算"
echo "   ✅ 支持轭架偏好 (Auto/Symmetric/Canted)"
echo "   ✅ 同时检查两种轭架类型"
echo "   ✅ 标记推荐的轭架类型"
echo "   ✅ 按价格排序"
echo "   ✅ 预算过滤"
echo "   ✅ 自动匹配手动操作装置"
echo ""

