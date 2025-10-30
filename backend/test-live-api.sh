#!/bin/bash

echo "📡 测试技术工程师API..."
echo ""

# 首先登录获取token
echo "1️⃣ 登录销售经理账号..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13900000004","password":"manager123"}')

echo "登录响应: $LOGIN_RESPONSE"
echo ""

# 提取token (假设返回格式是 {"success":true,"data":{"token":"xxx"}})
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 无法获取token，尝试从cookie获取..."
  # 如果是cookie模式，我们需要保存cookie
  TOKEN="test"
fi

echo "Token: $TOKEN"
echo ""

# 测试获取技术工程师列表
echo "2️⃣ 获取技术工程师列表..."
ENGINEERS_RESPONSE=$(curl -s -X GET http://localhost:5001/api/projects/technical-engineers/list \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -b cookies.txt)

echo "API响应:"
echo "$ENGINEERS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ENGINEERS_RESPONSE"
echo ""


