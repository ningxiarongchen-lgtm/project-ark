#!/bin/bash

###############################################################################
# 云端部署测试脚本
# 用途：测试 Render 后端、MongoDB 连接和数据完整性
# 使用：bash test-deployment.sh
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "          云端部署完整测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 配置
BACKEND_URL="https://project-ark-efy7.onrender.com"
FRONTEND_URL="https://project-ark-one.vercel.app"

echo "📋 测试配置:"
echo "  后端: $BACKEND_URL"
echo "  前端: $FRONTEND_URL"
echo ""

# 测试 1: 后端健康检查
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 测试 1: Render 后端连接"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏱️  正在测试后端健康检查..."
echo "   URL: $BACKEND_URL/api/health"
echo ""

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/health" -m 60)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 后端健康检查成功！"
    echo ""
    echo "响应内容:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    echo ""
else
    echo "❌ 后端健康检查失败！"
    echo "   HTTP 状态码: $HTTP_CODE"
    echo "   响应: $RESPONSE_BODY"
    echo ""
    echo "可能原因："
    echo "  1. Render 服务正在唤醒（等待 30-60 秒后重试）"
    echo "  2. 后端部署失败"
    echo "  3. 网络连接问题"
    exit 1
fi

# 测试 2: 数据库连接和数据统计
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 测试 2: 验证云端数据"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 测试用户数据
echo "📊 检查用户数据..."
USER_COUNT=$(curl -s "$BACKEND_URL/api/auth/test-connection" | jq '.userCount' 2>/dev/null)

if [ ! -z "$USER_COUNT" ] && [ "$USER_COUNT" != "null" ]; then
    echo "✅ 用户数据: $USER_COUNT 个用户"
else
    echo "⚠️  无法获取用户统计"
fi

# 测试产品数据
echo "📊 检查产品数据..."
PRODUCT_RESPONSE=$(curl -s "$BACKEND_URL/api/products?page=1&limit=1")
PRODUCT_TOTAL=$(echo "$PRODUCT_RESPONSE" | jq '.total' 2>/dev/null)

if [ ! -z "$PRODUCT_TOTAL" ] && [ "$PRODUCT_TOTAL" != "null" ]; then
    echo "✅ 产品数据: $PRODUCT_TOTAL 个产品"
else
    echo "⚠️  无法获取产品统计"
fi

echo ""

# 测试 3: 登录功能
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 测试 3: 登录功能"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 测试管理员账号登录
echo "🔐 测试管理员账号登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13000000001","password":"password"}')

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken' 2>/dev/null)

if [ ! -z "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
    echo "✅ 管理员登录成功！"
    
    # 获取用户信息
    USER_INFO=$(echo "$LOGIN_RESPONSE" | jq -r '.user.name' 2>/dev/null)
    USER_ROLE=$(echo "$LOGIN_RESPONSE" | jq -r '.user.role' 2>/dev/null)
    
    echo "   姓名: $USER_INFO"
    echo "   角色: $USER_ROLE"
    echo ""
else
    echo "❌ 管理员登录失败！"
    echo "   响应: $LOGIN_RESPONSE"
    echo ""
fi

# 测试销售经理账号
echo "🔐 测试销售经理账号登录..."
SALES_LOGIN=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"13000000002","password":"password"}')

SALES_TOKEN=$(echo "$SALES_LOGIN" | jq -r '.accessToken' 2>/dev/null)

if [ ! -z "$SALES_TOKEN" ] && [ "$SALES_TOKEN" != "null" ]; then
    echo "✅ 销售经理登录成功！"
    
    SALES_NAME=$(echo "$SALES_LOGIN" | jq -r '.user.name' 2>/dev/null)
    echo "   姓名: $SALES_NAME"
    echo ""
else
    echo "❌ 销售经理登录失败！"
    echo ""
fi

# 测试 4: 前端可访问性
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 测试 4: 前端可访问性"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🌐 测试前端访问..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" -m 10)

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ 前端可正常访问！"
    echo "   URL: $FRONTEND_URL"
    echo ""
else
    echo "⚠️  前端访问异常"
    echo "   HTTP 状态码: $FRONTEND_STATUS"
    echo ""
fi

# 测试总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 测试总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "测试结果:"
echo "  ✅ 后端健康检查: 正常"

if [ ! -z "$USER_COUNT" ] && [ "$USER_COUNT" != "null" ]; then
    echo "  ✅ 数据库连接: 正常"
    echo "  ✅ 数据完整性: 已验证（$USER_COUNT 用户，$PRODUCT_TOTAL 产品）"
else
    echo "  ⚠️  数据库连接: 需要检查"
fi

if [ ! -z "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
    echo "  ✅ 登录功能: 正常"
else
    echo "  ⚠️  登录功能: 需要检查"
fi

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "  ✅ 前端访问: 正常"
else
    echo "  ⚠️  前端访问: 需要检查"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 下一步操作"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 浏览器访问前端："
echo "   $FRONTEND_URL"
echo ""
echo "2. 使用测试账号登录："
echo "   管理员：13000000001 / password"
echo "   销售经理：13000000002 / password"
echo "   技术工程师：13000000003 / password"
echo ""
echo "3. 验证功能："
echo "   - 登录成功"
echo "   - 仪表盘正常显示"
echo "   - 数据加载正常"
echo "   - 可以正常操作"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 测试完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

