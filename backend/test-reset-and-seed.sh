#!/bin/bash

# 测试 reset-and-seed 接口
# 使用方法：
# 1. 确保后端运行在测试环境：NODE_ENV=test npm start
# 2. 运行此脚本：bash test-reset-and-seed.sh

BASE_URL="http://localhost:5001"
API_ENDPOINT="${BASE_URL}/api/testing/reset-and-seed"

echo "========================================"
echo "  测试 POST /api/testing/reset-and-seed"
echo "========================================"
echo ""

# 检查服务器是否运行
echo "1️⃣  检查服务器状态..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" ${BASE_URL}/api/health)

if [ "$HEALTH_CHECK" != "200" ]; then
  echo "❌ 错误：服务器未运行或无法访问"
  echo "   请先启动测试环境服务器："
  echo "   NODE_ENV=test npm start"
  exit 1
fi

echo "✅ 服务器运行正常"
echo ""

# 测试基础重置和播种（使用默认数据）
echo "2️⃣  测试基础重置和播种（默认数据）..."
echo ""

RESPONSE=$(curl -s -X POST ${API_ENDPOINT} \
  -H "Content-Type: application/json" \
  -d '{
    "clearAll": true
  }')

# 检查响应
SUCCESS=$(echo $RESPONSE | grep -o '"success":true' | wc -l)

if [ "$SUCCESS" -gt 0 ]; then
  echo "✅ 接口调用成功！"
  echo ""
  echo "📊 响应数据："
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  echo ""
  
  # 提取关键信息
  MESSAGE=$(echo $RESPONSE | grep -o '"message":"[^"]*"' | head -1)
  USERS=$(echo $RESPONSE | grep -o '"users":[0-9]*' | grep -o '[0-9]*')
  SUPPLIERS=$(echo $RESPONSE | grep -o '"suppliers":[0-9]*' | grep -o '[0-9]*')
  ACTUATORS=$(echo $RESPONSE | grep -o '"actuators":[0-9]*' | grep -o '[0-9]*')
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📝 摘要："
  echo "   消息: $MESSAGE"
  echo "   用户: ${USERS:-0} 个"
  echo "   供应商: ${SUPPLIERS:-0} 个"
  echo "   产品: ${ACTUATORS:-0} 个"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "🎉 测试通过！数据库已重置并播种完成。"
  echo ""
  echo "📝 测试用户凭证（示例）："
  echo "   管理员: 18800000001 / Test123456!"
  echo "   销售经理: 18800000002 / Test123456!"
  echo "   技术工程师: 18800000004 / Test123456!"
  echo ""
  
else
  echo "❌ 接口调用失败！"
  echo ""
  echo "错误响应："
  echo "$RESPONSE"
  exit 1
fi

echo "========================================"
echo "  所有测试完成 ✅"
echo "========================================"

