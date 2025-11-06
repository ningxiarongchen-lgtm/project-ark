#!/bin/bash

# 🔍 部署检查脚本
# 用于验证前后端部署状态

set -e

echo "🔍 开始检查部署状态..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
FRONTEND_URL="${FRONTEND_URL:-https://model-selection-frontend.pages.dev}"
BACKEND_URL="${BACKEND_URL:-https://model-selection-backend.onrender.com}"

# 检查前端
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 检查前端部署状态..."
echo "URL: $FRONTEND_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" || echo "000")

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ 前端部署成功 (HTTP $FRONTEND_STATUS)${NC}"
    
    # 检查前端内容
    FRONTEND_CONTENT=$(curl -s "$FRONTEND_URL")
    if echo "$FRONTEND_CONTENT" | grep -q "vite"; then
        echo -e "${GREEN}✅ 前端使用 Vite 构建${NC}"
    fi
    
elif [ "$FRONTEND_STATUS" = "000" ]; then
    echo -e "${RED}❌ 前端无法访问（连接失败）${NC}"
    exit 1
else
    echo -e "${YELLOW}⚠️  前端返回异常状态码: $FRONTEND_STATUS${NC}"
    exit 1
fi

echo ""

# 检查后端
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🖥️  检查后端部署状态..."
echo "URL: $BACKEND_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 尝试最多5次（因为 Render 免费版可能需要冷启动）
MAX_RETRIES=5
RETRY_COUNT=0
BACKEND_HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "尝试 $RETRY_COUNT/$MAX_RETRIES..."
    
    BACKEND_RESPONSE=$(curl -s "$BACKEND_URL/api/health" || echo "")
    BACKEND_STATUS=$(echo "$BACKEND_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "")
    
    if [ "$BACKEND_STATUS" = "OK" ]; then
        BACKEND_HEALTHY=true
        break
    else
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo -e "${YELLOW}⏳ 后端未响应，等待15秒后重试...${NC}"
            sleep 15
        fi
    fi
done

if [ "$BACKEND_HEALTHY" = true ]; then
    echo -e "${GREEN}✅ 后端部署成功${NC}"
    echo "响应内容: $BACKEND_RESPONSE"
    
    # 提取时间戳
    TIMESTAMP=$(echo "$BACKEND_RESPONSE" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$TIMESTAMP" ]; then
        echo -e "${GREEN}✅ 服务时间: $TIMESTAMP${NC}"
    fi
else
    echo -e "${RED}❌ 后端健康检查失败${NC}"
    echo "响应内容: $BACKEND_RESPONSE"
    exit 1
fi

echo ""

# 检查后端 CORS 配置
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 检查 CORS 配置..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CORS_HEADERS=$(curl -s -I -H "Origin: $FRONTEND_URL" "$BACKEND_URL/api/health" | grep -i "access-control-allow-origin" || echo "")

if [ -n "$CORS_HEADERS" ]; then
    echo -e "${GREEN}✅ CORS 已配置${NC}"
    echo "$CORS_HEADERS"
else
    echo -e "${YELLOW}⚠️  未检测到 CORS 头，可能导致前端无法访问后端${NC}"
fi

echo ""

# 检查安全头
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 检查安全头配置..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SECURITY_HEADERS=$(curl -s -I "$BACKEND_URL/api/health")

if echo "$SECURITY_HEADERS" | grep -qi "strict-transport-security"; then
    echo -e "${GREEN}✅ HSTS 已配置${NC}"
else
    echo -e "${YELLOW}⚠️  未检测到 HSTS${NC}"
fi

if echo "$SECURITY_HEADERS" | grep -qi "x-content-type-options"; then
    echo -e "${GREEN}✅ X-Content-Type-Options 已配置${NC}"
else
    echo -e "${YELLOW}⚠️  未检测到 X-Content-Type-Options${NC}"
fi

if echo "$SECURITY_HEADERS" | grep -qi "x-frame-options"; then
    echo -e "${GREEN}✅ X-Frame-Options 已配置${NC}"
else
    echo -e "${YELLOW}⚠️  未检测到 X-Frame-Options${NC}"
fi

echo ""

# 测试前后端连接
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 测试前后端连接..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查前端是否包含正确的 API URL
FRONTEND_HTML=$(curl -s "$FRONTEND_URL")
if echo "$FRONTEND_HTML" | grep -q "$BACKEND_URL"; then
    echo -e "${GREEN}✅ 前端包含后端 URL 引用${NC}"
else
    echo -e "${YELLOW}⚠️  前端可能未正确配置后端 URL${NC}"
    echo "请检查 Cloudflare Pages 环境变量 VITE_API_URL"
fi

echo ""

# 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 部署状态总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ 前端状态:${NC} 正常 ($FRONTEND_URL)"
echo -e "${GREEN}✅ 后端状态:${NC} 正常 ($BACKEND_URL)"
echo ""
echo "🎉 部署验证完成！"
echo ""
echo "下一步："
echo "1. 访问前端: $FRONTEND_URL"
echo "2. 测试登录功能"
echo "3. 检查前后端 API 调用"
echo ""
echo "如需查看实时日志："
echo "- Cloudflare Pages: https://dash.cloudflare.com/"
echo "- Render: https://dashboard.render.com/"
echo ""

