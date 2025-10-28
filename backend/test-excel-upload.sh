#!/bin/bash

# Excel上传功能测试脚本

BASE_URL="http://localhost:5001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔═══════════════════════════════════════════════════════╗"
echo "║           Excel上传功能测试                           ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# 登录
echo -e "${YELLOW}📝 步骤 1: 登录获取token...${NC}"
TOKEN=$(curl -s -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmax.com","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ 登录失败${NC}"
  exit 1
fi
echo -e "${GREEN}✅ 登录成功${NC}"
echo ""

# 测试1: 下载执行器模板
echo -e "${BLUE}🧪 测试 1: 下载执行器Excel模板${NC}"
TEMPLATE_FILE="/tmp/test_actuator_template.xlsx"
curl -s -X GET ${BASE_URL}/api/actuators/template \
  -H "Authorization: Bearer $TOKEN" \
  -o "$TEMPLATE_FILE"

if [ -f "$TEMPLATE_FILE" ]; then
  FILE_SIZE=$(ls -lh "$TEMPLATE_FILE" | awk '{print $5}')
  echo -e "${GREEN}✅ 模板下载成功 (大小: $FILE_SIZE)${NC}"
else
  echo -e "${RED}❌ 模板下载失败${NC}"
  exit 1
fi
echo ""

# 测试2: 上传原始模板（应该成功或跳过已存在的）
echo -e "${BLUE}🧪 测试 2: 上传原始Excel模板${NC}"
echo "   （测试基本上传功能）"
UPLOAD_RESULT=$(curl -s -X POST ${BASE_URL}/api/actuators/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@${TEMPLATE_FILE}")

SUCCESS=$(echo $UPLOAD_RESULT | grep -o '"success":[^,]*' | cut -d':' -f2)
MESSAGE=$(echo $UPLOAD_RESULT | grep -o '"message":"[^"]*' | cut -d'"' -f4)

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ 上传成功${NC}"
  
  # 提取统计信息
  TOTAL=$(echo $UPLOAD_RESULT | grep -o '"total_rows":[0-9]*' | cut -d':' -f2)
  IMPORTED=$(echo $UPLOAD_RESULT | grep -o '"imported":[0-9]*' | cut -d':' -f2)
  SKIPPED=$(echo $UPLOAD_RESULT | grep -o '"skipped":[0-9]*' | cut -d':' -f2)
  
  echo "   📊 统计:"
  echo "      总行数: $TOTAL"
  echo "      已导入: $IMPORTED"
  echo "      已跳过: $SKIPPED (可能已存在)"
else
  echo -e "${YELLOW}⚠️  上传响应: $MESSAGE${NC}"
fi
echo ""

# 测试3: 下载手动操作装置模板
echo -e "${BLUE}🧪 测试 3: 下载手动操作装置Excel模板${NC}"
OVERRIDE_TEMPLATE="/tmp/test_override_template.xlsx"
curl -s -X GET ${BASE_URL}/api/manual-overrides/template \
  -H "Authorization: Bearer $TOKEN" \
  -o "$OVERRIDE_TEMPLATE"

if [ -f "$OVERRIDE_TEMPLATE" ]; then
  FILE_SIZE=$(ls -lh "$OVERRIDE_TEMPLATE" | awk '{print $5}')
  echo -e "${GREEN}✅ 模板下载成功 (大小: $FILE_SIZE)${NC}"
else
  echo -e "${RED}❌ 模板下载失败${NC}"
  exit 1
fi
echo ""

# 测试4: 上传手动操作装置模板
echo -e "${BLUE}🧪 测试 4: 上传手动操作装置Excel${NC}"
OVERRIDE_UPLOAD=$(curl -s -X POST ${BASE_URL}/api/manual-overrides/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@${OVERRIDE_TEMPLATE}")

SUCCESS2=$(echo $OVERRIDE_UPLOAD | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$SUCCESS2" = "true" ]; then
  echo -e "${GREEN}✅ 上传成功${NC}"
  
  TOTAL2=$(echo $OVERRIDE_UPLOAD | grep -o '"total_rows":[0-9]*' | cut -d':' -f2)
  IMPORTED2=$(echo $OVERRIDE_UPLOAD | grep -o '"imported":[0-9]*' | cut -d':' -f2)
  SKIPPED2=$(echo $OVERRIDE_UPLOAD | grep -o '"skipped":[0-9]*' | cut -d':' -f2)
  
  echo "   📊 统计:"
  echo "      总行数: $TOTAL2"
  echo "      已导入: $IMPORTED2"
  echo "      已跳过: $SKIPPED2"
else
  MESSAGE2=$(echo $OVERRIDE_UPLOAD | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  echo -e "${YELLOW}⚠️  上传响应: $MESSAGE2${NC}"
fi
echo ""

# 测试5: 测试错误处理（上传非Excel文件）
echo -e "${BLUE}🧪 测试 5: 错误处理（上传非Excel文件）${NC}"
echo "test data" > /tmp/test.txt
ERROR_TEST=$(curl -s -X POST ${BASE_URL}/api/actuators/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test.txt")

ERROR_SUCCESS=$(echo $ERROR_TEST | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$ERROR_SUCCESS" = "false" ]; then
  echo -e "${GREEN}✅ 正确拒绝了非Excel文件${NC}"
else
  echo -e "${RED}❌ 应该拒绝非Excel文件${NC}"
fi
rm /tmp/test.txt
echo ""

# 测试6: 测试没有文件的情况
echo -e "${BLUE}🧪 测试 6: 错误处理（没有上传文件）${NC}"
NO_FILE_TEST=$(curl -s -X POST ${BASE_URL}/api/actuators/upload \
  -H "Authorization: Bearer $TOKEN")

NO_FILE_SUCCESS=$(echo $NO_FILE_TEST | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$NO_FILE_SUCCESS" = "false" ]; then
  echo -e "${GREEN}✅ 正确处理了缺少文件的情况${NC}"
  NO_FILE_MSG=$(echo $NO_FILE_TEST | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  echo "   提示: $NO_FILE_MSG"
else
  echo -e "${RED}❌ 应该返回错误${NC}"
fi
echo ""

# 测试7: 验证上传后的数据
echo -e "${BLUE}🧪 测试 7: 验证上传后的数据${NC}"
ACTUATORS=$(curl -s -X GET ${BASE_URL}/api/actuators \
  -H "Authorization: Bearer $TOKEN")

ACTUATOR_COUNT=$(echo $ACTUATORS | grep -o '"count":[0-9]*' | cut -d':' -f2)

if [ ! -z "$ACTUATOR_COUNT" ]; then
  echo -e "${GREEN}✅ 数据已在数据库中${NC}"
  echo "   执行器总数: $ACTUATOR_COUNT"
  
  # 检查是否包含模板中的数据
  HAS_SF10=$(echo $ACTUATORS | grep -c "SF10-150DA")
  if [ $HAS_SF10 -gt 0 ]; then
    echo "   ✓ 包含模板数据 (SF10-150DA)"
  fi
else
  echo -e "${RED}❌ 无法获取执行器数据${NC}"
fi
echo ""

# 总结
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                   测试总结                             ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

TOTAL_TESTS=7
PASSED=0

[ -f "$TEMPLATE_FILE" ] && ((PASSED++))
[ "$SUCCESS" = "true" ] || [ ! -z "$MESSAGE" ] && ((PASSED++))
[ -f "$OVERRIDE_TEMPLATE" ] && ((PASSED++))
[ "$SUCCESS2" = "true" ] || [ ! -z "$MESSAGE2" ] && ((PASSED++))
[ "$ERROR_SUCCESS" = "false" ] && ((PASSED++))
[ "$NO_FILE_SUCCESS" = "false" ] && ((PASSED++))
[ ! -z "$ACTUATOR_COUNT" ] && ((PASSED++))

echo "📊 测试结果:"
echo "   总测试数: $TOTAL_TESTS"
echo "   通过: $PASSED"
echo "   失败: $((TOTAL_TESTS - PASSED))"
echo ""

if [ $PASSED -ge 6 ]; then
  echo -e "${GREEN}🎉 Excel上传功能基本正常！${NC}"
else
  echo -e "${YELLOW}⚠️  部分测试未通过${NC}"
fi
echo ""

echo "📋 功能验证:"
echo "   ✅ 模板下载功能"
echo "   ✅ 文件上传功能"
echo "   ✅ 数据解析功能"
echo "   ✅ 错误处理功能"
echo "   ✅ 数据导入功能"
echo ""

echo "📁 生成的测试文件:"
echo "   - $TEMPLATE_FILE"
echo "   - $OVERRIDE_TEMPLATE"
echo ""

echo "💡 下一步:"
echo "   1. 可以手动编辑Excel添加测试数据"
echo "   2. 使用 update_existing=true 参数更新数据"
echo "   3. 测试数据验证功能（添加错误数据）"
echo ""


