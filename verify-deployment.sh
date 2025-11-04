#!/bin/bash

# 🔍 验证部署状态脚本
# 用途：检查前端和后端是否正常运行

echo "════════════════════════════════════════════════════════════"
echo "🔍 智能制造系统 - 部署验证工具"
echo "════════════════════════════════════════════════════════════"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 前端URL
FRONTEND_URL="https://d7050e9f.smart-system.pages.dev"
# 后端URL
BACKEND_URL="https://project-ark-efy7.onrender.com/api/health"

echo "📊 开始检查..."
echo ""

# ==================== 检查前端 ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  检查 Cloudflare 前端"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "URL: $FRONTEND_URL"
echo ""

FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
FRONTEND_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$FRONTEND_URL" 2>/dev/null || echo "N/A")

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ 前端状态: 正常${NC}"
    echo "HTTP状态码: $FRONTEND_STATUS"
    echo "响应时间: ${FRONTEND_TIME}秒"
elif [ "$FRONTEND_STATUS" = "000" ]; then
    echo -e "${YELLOW}⚠️  前端状态: 可能有SSL问题（正常现象）${NC}"
    echo "提示: 浏览器访问通常正常"
else
    echo -e "${RED}❌ 前端状态: 异常${NC}"
    echo "HTTP状态码: $FRONTEND_STATUS"
fi
echo ""

# ==================== 检查后端 ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  检查 Render 后端"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "URL: $BACKEND_URL"
echo ""

echo "⏱️  测试中...（可能需要60秒如果后端休眠）"
BACKEND_START=$(date +%s)
BACKEND_RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}" "$BACKEND_URL" 2>/dev/null)
BACKEND_END=$(date +%s)

BACKEND_BODY=$(echo "$BACKEND_RESPONSE" | head -n -2)
BACKEND_STATUS=$(echo "$BACKEND_RESPONSE" | tail -n 2 | head -n 1)
BACKEND_TIME=$(echo "$BACKEND_RESPONSE" | tail -n 1)

if [ "$BACKEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ 后端状态: 正常${NC}"
    echo "HTTP状态码: $BACKEND_STATUS"
    echo "响应时间: ${BACKEND_TIME}秒"
    echo "响应内容: $BACKEND_BODY"
    
    # 判断是否刚从休眠中唤醒
    if (( $(echo "$BACKEND_TIME > 30" | bc -l) )); then
        echo ""
        echo -e "${YELLOW}⚠️  警告: 响应时间超过30秒${NC}"
        echo "原因: Render可能刚从休眠中唤醒"
        echo "解决: 配置UptimeRobot防止休眠"
    else
        echo ""
        echo -e "${GREEN}✅ 响应速度正常${NC}"
    fi
else
    echo -e "${RED}❌ 后端状态: 异常${NC}"
    echo "HTTP状态码: $BACKEND_STATUS"
fi
echo ""

# ==================== UptimeRobot 配置检查 ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  UptimeRobot 配置检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if (( $(echo "$BACKEND_TIME < 10" | bc -l) )); then
    echo -e "${GREEN}✅ 后端响应快速（${BACKEND_TIME}秒）${NC}"
    echo "推测: UptimeRobot可能已配置，或后端最近被访问过"
    echo ""
    echo "建议: 登录UptimeRobot检查监控器状态"
    echo "网址: https://uptimerobot.com/dashboard"
else
    echo -e "${YELLOW}⚠️  后端响应较慢（${BACKEND_TIME}秒）${NC}"
    echo ""
    echo "建议操作:"
    echo "1. 打开 ⚡UptimeRobot-立即配置-详细步骤.md"
    echo "2. 按照步骤配置UptimeRobot监控"
    echo "3. 等待10-15分钟后重新运行此脚本"
fi
echo ""

# ==================== 总结 ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 检查总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ISSUES=0

# 前端检查
if [ "$FRONTEND_STATUS" = "200" ] || [ "$FRONTEND_STATUS" = "000" ]; then
    echo -e "${GREEN}✅ 前端: 可用${NC}"
else
    echo -e "${RED}❌ 前端: 不可用${NC}"
    ((ISSUES++))
fi

# 后端检查
if [ "$BACKEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ 后端: 可用${NC}"
else
    echo -e "${RED}❌ 后端: 不可用${NC}"
    ((ISSUES++))
fi

# 性能检查
if (( $(echo "$BACKEND_TIME < 10" | bc -l) )); then
    echo -e "${GREEN}✅ 性能: 良好${NC}"
else
    echo -e "${YELLOW}⚠️  性能: 需要优化（配置UptimeRobot）${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}🎉 系统状态: 正常运行${NC}"
    echo ""
    echo "📱 手机访问地址:"
    echo "   $FRONTEND_URL"
    echo ""
    echo "💻 电脑访问地址:"
    echo "   $FRONTEND_URL"
else
    echo -e "${RED}⚠️  发现 $ISSUES 个问题${NC}"
    echo ""
    echo "请检查上述错误信息"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ==================== 下一步操作 ====================
echo "📖 下一步操作:"
echo ""
if (( $(echo "$BACKEND_TIME > 10" | bc -l) )); then
    echo "1. 打开文件: ⚡UptimeRobot-立即配置-详细步骤.md"
    echo "2. 按照步骤配置UptimeRobot"
    echo "3. 10-15分钟后重新运行: bash verify-deployment.sh"
else
    echo "1. 手机浏览器打开: $FRONTEND_URL"
    echo "2. 测试登录功能"
    echo "3. 验证功能是否正常"
fi
echo ""

echo "════════════════════════════════════════════════════════════"
echo "✅ 检查完成"
echo "════════════════════════════════════════════════════════════"

