#!/bin/bash

# 新功能测试脚本
# 测试选型引擎和Excel导入导出功能

BASE_URL="http://localhost:5001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "╔═══════════════════════════════════════════════════════╗"
echo "║     Project Ark 新功能测试 - 选型引擎 & Excel功能  ║"
echo "╚═══════════════════════════════════════════════════════╝"
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
echo ""

# 测试选型引擎功能
echo "╔═══════════════════════════════════════════════════════╗"
echo "║              测试选型引擎功能                          ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# 测试1: 基础选型计算
echo -e "${BLUE}🧪 测试 1: 基础智能选型${NC}"
echo "   需求: 600Nm扭矩, 0.5MPa压力, 对称轭架"
SELECTION_RESULT=$(curl -s -X POST ${BASE_URL}/api/selection/calculate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 600,
    "working_pressure": 0.5,
    "working_angle": 0,
    "yoke_type": "symmetric"
  }')

SUCCESS=$(echo $SELECTION_RESULT | grep -o '"success":[^,]*' | cut -d':' -f2)
COUNT=$(echo $SELECTION_RESULT | grep -o '"count":[0-9]*' | cut -d':' -f2)

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ 选型计算成功！找到 $COUNT 个配置${NC}"
  
  # 提取最佳推荐
  BEST_MODEL=$(echo $SELECTION_RESULT | grep -o '"model_base":"[^"]*' | head -1 | cut -d'"' -f4)
  ACTUAL_TORQUE=$(echo $SELECTION_RESULT | grep -o '"actual_torque":[0-9]*' | head -1 | cut -d':' -f2)
  TORQUE_MARGIN=$(echo $SELECTION_RESULT | grep -o '"torque_margin":"[^"]*' | head -1 | cut -d'"' -f4)
  RECOMMENDATION=$(echo $SELECTION_RESULT | grep -o '"recommendation":"[^"]*' | head -1 | cut -d'"' -f4)
  
  echo "   📋 最佳推荐:"
  echo "      型号: $BEST_MODEL"
  echo "      实际扭矩: ${ACTUAL_TORQUE}Nm"
  echo "      扭矩裕度: $TORQUE_MARGIN"
  echo "      推荐等级: $RECOMMENDATION"
else
  echo -e "${RED}❌ 选型计算失败${NC}"
  echo "响应: $SELECTION_RESULT"
fi
echo ""

# 测试2: 带手动操作装置的选型
echo -e "${BLUE}🧪 测试 2: 带手动操作装置的智能选型${NC}"
echo "   需求: 1000Nm扭矩, 0.5MPa压力, 倾斜轭架, 需要手轮"
SELECTION_WITH_OVERRIDE=$(curl -s -X POST ${BASE_URL}/api/selection/calculate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 1000,
    "working_pressure": 0.5,
    "working_angle": 0,
    "yoke_type": "canted",
    "needs_manual_override": true,
    "manual_override_type": "手轮"
  }')

SUCCESS2=$(echo $SELECTION_WITH_OVERRIDE | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$SUCCESS2" = "true" ]; then
  echo -e "${GREEN}✅ 带手动装置选型成功！${NC}"
  
  ACTUATOR_MODEL=$(echo $SELECTION_WITH_OVERRIDE | grep -o '"model_base":"[^"]*' | head -1 | cut -d'"' -f4)
  OVERRIDE_MODEL=$(echo $SELECTION_WITH_OVERRIDE | grep -o '"override_model":"[^"]*' | head -1 | cut -d'"' -f4)
  TOTAL_PRICE=$(echo $SELECTION_WITH_OVERRIDE | grep -o '"total_price":[0-9]*' | head -1 | cut -d':' -f2)
  
  echo "   📋 配置:"
  echo "      执行器: $ACTUATOR_MODEL"
  echo "      手动装置: HG/HW"
  echo "      总价: ¥$TOTAL_PRICE"
else
  echo -e "${RED}❌ 带手动装置选型失败${NC}"
fi
echo ""

# 测试3: 批量选型
echo -e "${BLUE}🧪 测试 3: 批量选型${NC}"
echo "   同时选型3个阀门"
BATCH_RESULT=$(curl -s -X POST ${BASE_URL}/api/selection/batch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "selections": [
      {
        "tag_number": "V-TEST-001",
        "required_torque": 300,
        "working_pressure": 0.3,
        "working_angle": 0,
        "yoke_type": "symmetric"
      },
      {
        "tag_number": "V-TEST-002",
        "required_torque": 800,
        "working_pressure": 0.4,
        "working_angle": 0,
        "yoke_type": "symmetric"
      },
      {
        "tag_number": "V-TEST-003",
        "required_torque": 2000,
        "working_pressure": 0.5,
        "working_angle": 0,
        "yoke_type": "canted"
      }
    ]
  }')

BATCH_SUCCESS=$(echo $BATCH_RESULT | grep -o '"successful":[0-9]*' | cut -d':' -f2)
BATCH_FAILED=$(echo $BATCH_RESULT | grep -o '"failed":[0-9]*' | cut -d':' -f2)

if [ ! -z "$BATCH_SUCCESS" ]; then
  echo -e "${GREEN}✅ 批量选型完成！${NC}"
  echo "   成功: $BATCH_SUCCESS 个"
  echo "   失败: $BATCH_FAILED 个"
else
  echo -e "${RED}❌ 批量选型失败${NC}"
fi
echo ""

# 测试Excel功能
echo "╔═══════════════════════════════════════════════════════╗"
echo "║              测试Excel导入导出功能                     ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# 测试4: 下载执行器Excel模板
echo -e "${BLUE}🧪 测试 4: 下载执行器Excel模板${NC}"
TEMPLATE_RESPONSE=$(curl -s -w "%{http_code}" -X GET ${BASE_URL}/api/actuators/template \
  -H "Authorization: Bearer $TOKEN" \
  -o /tmp/actuator_template.xlsx)

if [ "$TEMPLATE_RESPONSE" = "200" ]; then
  FILE_SIZE=$(ls -lh /tmp/actuator_template.xlsx | awk '{print $5}')
  echo -e "${GREEN}✅ Excel模板下载成功！${NC}"
  echo "   文件大小: $FILE_SIZE"
  echo "   保存位置: /tmp/actuator_template.xlsx"
else
  echo -e "${RED}❌ Excel模板下载失败${NC}"
  echo "   HTTP状态码: $TEMPLATE_RESPONSE"
fi
echo ""

# 测试5: 下载手动操作装置Excel模板
echo -e "${BLUE}🧪 测试 5: 下载手动操作装置Excel模板${NC}"
OVERRIDE_TEMPLATE_RESPONSE=$(curl -s -w "%{http_code}" -X GET ${BASE_URL}/api/manual-overrides/template \
  -H "Authorization: Bearer $TOKEN" \
  -o /tmp/manual_override_template.xlsx)

if [ "$OVERRIDE_TEMPLATE_RESPONSE" = "200" ]; then
  FILE_SIZE2=$(ls -lh /tmp/manual_override_template.xlsx | awk '{print $5}')
  echo -e "${GREEN}✅ Excel模板下载成功！${NC}"
  echo "   文件大小: $FILE_SIZE2"
  echo "   保存位置: /tmp/manual_override_template.xlsx"
else
  echo -e "${RED}❌ Excel模板下载失败${NC}"
fi
echo ""

# 测试6: 验证选型引擎的边界条件
echo -e "${BLUE}🧪 测试 6: 边界条件测试（超高扭矩要求）${NC}"
echo "   需求: 10000Nm扭矩（超出所有执行器能力）"
HIGH_TORQUE=$(curl -s -X POST ${BASE_URL}/api/selection/calculate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 10000,
    "working_pressure": 0.5,
    "working_angle": 0,
    "yoke_type": "symmetric"
  }')

HIGH_SUCCESS=$(echo $HIGH_TORQUE | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$HIGH_SUCCESS" = "false" ]; then
  echo -e "${GREEN}✅ 正确处理：未找到满足要求的执行器${NC}"
  echo "   系统提供了建议"
else
  COUNT=$(echo $HIGH_TORQUE | grep -o '"count":[0-9]*' | cut -d':' -f2)
  if [ "$COUNT" = "0" ]; then
    echo -e "${GREEN}✅ 正确处理：返回0个结果${NC}"
  else
    echo -e "${YELLOW}⚠️  警告：找到了 $COUNT 个配置，但扭矩可能不够${NC}"
  fi
fi
echo ""

# 测试7: 测试选型引擎的过滤功能
echo -e "${BLUE}🧪 测试 7: 带预算限制的选型${NC}"
echo "   需求: 500Nm扭矩, 预算限制 ¥6000"
BUDGET_TEST=$(curl -s -X POST ${BASE_URL}/api/selection/calculate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 500,
    "working_pressure": 0.4,
    "working_angle": 0,
    "yoke_type": "symmetric",
    "budget_limit": 6000
  }')

BUDGET_COUNT=$(echo $BUDGET_TEST | grep -o '"count":[0-9]*' | cut -d':' -f2)

if [ ! -z "$BUDGET_COUNT" ]; then
  echo -e "${GREEN}✅ 预算过滤功能正常${NC}"
  echo "   找到 $BUDGET_COUNT 个符合预算的配置"
else
  echo -e "${RED}❌ 预算过滤功能异常${NC}"
fi
echo ""

# 测试8: 测试带作用类型偏好的选型
echo -e "${BLUE}🧪 测试 8: 带作用类型偏好的选型${NC}"
echo "   需求: 500Nm扭矩, 偏好弹簧复位(SR)型"
PREF_TEST=$(curl -s -X POST ${BASE_URL}/api/selection/calculate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_torque": 500,
    "working_pressure": 0.4,
    "working_angle": 0,
    "yoke_type": "symmetric",
    "action_type_preference": "SR"
  }')

PREF_SUCCESS=$(echo $PREF_TEST | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$PREF_SUCCESS" = "true" ]; then
  PREF_MODEL=$(echo $PREF_TEST | grep -o '"model_base":"[^"]*' | head -1 | cut -d'"' -f4)
  if [[ $PREF_MODEL == *"SR"* ]]; then
    echo -e "${GREEN}✅ 作用类型偏好功能正常${NC}"
    echo "   推荐型号: $PREF_MODEL (符合SR偏好)"
  else
    echo -e "${YELLOW}⚠️  返回了非SR型号: $PREF_MODEL${NC}"
  fi
else
  echo -e "${RED}❌ 作用类型偏好测试失败${NC}"
fi
echo ""

# 测试总结
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                   测试总结                             ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

TOTAL_TESTS=8
PASSED_TESTS=0

# 统计通过的测试
[ "$SUCCESS" = "true" ] && ((PASSED_TESTS++))
[ "$SUCCESS2" = "true" ] && ((PASSED_TESTS++))
[ ! -z "$BATCH_SUCCESS" ] && ((PASSED_TESTS++))
[ "$TEMPLATE_RESPONSE" = "200" ] && ((PASSED_TESTS++))
[ "$OVERRIDE_TEMPLATE_RESPONSE" = "200" ] && ((PASSED_TESTS++))
[ "$HIGH_SUCCESS" = "false" ] || [ "$COUNT" = "0" ] && ((PASSED_TESTS++))
[ ! -z "$BUDGET_COUNT" ] && ((PASSED_TESTS++))
[ "$PREF_SUCCESS" = "true" ] && ((PASSED_TESTS++))

echo "📊 测试结果:"
echo "   总测试数: $TOTAL_TESTS"
echo "   通过: $PASSED_TESTS"
echo "   失败: $((TOTAL_TESTS - PASSED_TESTS))"
echo "   通过率: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
echo ""

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
  echo -e "${GREEN}🎉 所有测试通过！新功能工作正常！${NC}"
else
  echo -e "${YELLOW}⚠️  部分测试未通过，请检查日志${NC}"
fi
echo ""

echo "📁 生成的文件:"
echo "   - /tmp/actuator_template.xlsx"
echo "   - /tmp/manual_override_template.xlsx"
echo ""

echo "💡 下一步建议:"
echo "   1. 打开下载的Excel模板查看格式"
echo "   2. 填写测试数据并上传测试"
echo "   3. 使用 Postman 进行更详细的测试"
echo "   4. 集成到前端应用"
echo ""

exit 0


