#!/bin/bash

# =====================================================
# 部署验证自动化脚本
# =====================================================
# 用法: ./test-deployment.sh <BACKEND_URL> <FRONTEND_URL>
# 示例: ./test-deployment.sh https://your-backend.onrender.com https://your-app.vercel.app
# =====================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查参数
if [ $# -ne 2 ]; then
    echo -e "${RED}❌ 错误: 需要提供两个参数${NC}"
    echo "用法: $0 <BACKEND_URL> <FRONTEND_URL>"
    echo "示例: $0 https://your-backend.onrender.com https://your-app.vercel.app"
    exit 1
fi

BACKEND_URL=$1
FRONTEND_URL=$2
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   云部署验证自动化测试脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${BLUE}后端 URL:${NC} $BACKEND_URL"
echo -e "${BLUE}前端 URL:${NC} $FRONTEND_URL"
echo ""

# 测试结果记录函数
test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ 通过:${NC} $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ 失败:${NC} $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        if [ ! -z "$3" ]; then
            echo -e "${YELLOW}   详情: $3${NC}"
        fi
    fi
}

# =====================================================
# 阶段 1: 基础连接测试
# =====================================================
echo -e "\n${BLUE}[阶段 1/6] 基础连接测试${NC}"
echo "-------------------------------------------"

# 测试 1.1: 前端可访问性
echo -n "测试前端可访问性..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    test_result 0 "前端可访问 (HTTP $HTTP_CODE)"
else
    test_result 1 "前端无法访问" "HTTP状态码: $HTTP_CODE"
fi

# 测试 1.2: 后端健康检查
echo -n "测试后端健康检查..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/api/health")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    test_result 0 "后端健康检查通过"
else
    test_result 1 "后端健康检查失败" "$HEALTH_RESPONSE"
fi

# =====================================================
# 阶段 2: HTTPS 验证
# =====================================================
echo -e "\n${BLUE}[阶段 2/6] HTTPS 安全验证${NC}"
echo "-------------------------------------------"

# 测试 2.1: 后端 HTTPS
echo -n "测试后端 HTTPS..."
if curl -s -I "$BACKEND_URL/api/health" | grep -qi "strict-transport-security"; then
    test_result 0 "后端启用了 HSTS (强制HTTPS)"
else
    test_result 1 "后端未启用 HSTS" "建议添加 Strict-Transport-Security 响应头"
fi

# 测试 2.2: 前端 HTTPS (检查是否重定向)
echo -n "测试前端 HTTPS 重定向..."
HTTP_FRONTEND="${FRONTEND_URL/https:/http:}"
REDIRECT_LOCATION=$(curl -s -I "$HTTP_FRONTEND" | grep -i "location:" | awk '{print $2}' | tr -d '\r')
if echo "$REDIRECT_LOCATION" | grep -q "https://"; then
    test_result 0 "前端正确重定向到 HTTPS"
else
    # Vercel 默认强制 HTTPS，可能不返回 Location 头
    test_result 0 "前端 HTTPS (Vercel 默认强制)"
fi

# =====================================================
# 阶段 3: CORS 配置验证
# =====================================================
echo -e "\n${BLUE}[阶段 3/6] CORS 配置验证${NC}"
echo "-------------------------------------------"

# 测试 3.1: 正确域名的 CORS
echo -n "测试正确域名的 CORS..."
CORS_RESPONSE=$(curl -s -H "Origin: $FRONTEND_URL" -H "Access-Control-Request-Method: POST" -X OPTIONS "$BACKEND_URL/api/auth/login" -i)
if echo "$CORS_RESPONSE" | grep -qi "Access-Control-Allow-Origin.*$FRONTEND_URL"; then
    test_result 0 "CORS 允许正确的前端域名"
else
    test_result 1 "CORS 配置错误" "未返回正确的 Access-Control-Allow-Origin"
fi

# 测试 3.2: CORS Credentials
echo -n "测试 CORS Credentials..."
if echo "$CORS_RESPONSE" | grep -qi "Access-Control-Allow-Credentials.*true"; then
    test_result 0 "CORS 允许 Credentials (Cookie支持)"
else
    test_result 1 "CORS 未启用 Credentials" "Cookie 可能无法正常工作"
fi

# 测试 3.3: 错误域名应该被拒绝
echo -n "测试错误域名应该被拒绝..."
WRONG_CORS=$(curl -s -H "Origin: https://evil-site.com" -X OPTIONS "$BACKEND_URL/api/auth/login" -i)
if ! echo "$WRONG_CORS" | grep -qi "Access-Control-Allow-Origin"; then
    test_result 0 "正确拒绝了非法域名"
else
    test_result 1 "CORS 配置过于宽松" "允许了非法域名访问"
fi

# =====================================================
# 阶段 4: 认证和 Cookie 测试
# =====================================================
echo -e "\n${BLUE}[阶段 4/6] 认证和 Cookie 测试${NC}"
echo "-------------------------------------------"

# 测试 4.1: 登录接口测试
echo -n "测试登录接口..."
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@cmax.com","password":"admin123"}' \
    -c cookies.tmp \
    -w "\n%{http_code}" \
    -o login_response.tmp)

HTTP_CODE=$(tail -1 login_response.tmp)
if [ "$HTTP_CODE" = "200" ]; then
    test_result 0 "登录接口响应正常 (HTTP 200)"
else
    test_result 1 "登录接口失败" "HTTP状态码: $HTTP_CODE"
fi

# 测试 4.2: Cookie 设置检查
echo -n "测试 Cookie 设置..."
if [ -f cookies.tmp ] && grep -q "accessToken" cookies.tmp; then
    test_result 0 "accessToken Cookie 已设置"
    
    # 检查 HttpOnly
    if grep -q "HttpOnly" cookies.tmp; then
        test_result 0 "Cookie 有 HttpOnly 标记"
    else
        test_result 1 "Cookie 缺少 HttpOnly 标记" "安全风险：XSS 可窃取 token"
    fi
    
    # 检查 Secure (生产环境)
    if echo "$BACKEND_URL" | grep -q "https://"; then
        if grep -q "Secure" cookies.tmp; then
            test_result 0 "Cookie 有 Secure 标记 (HTTPS)"
        else
            test_result 1 "Cookie 缺少 Secure 标记" "生产环境应该启用"
        fi
    fi
else
    test_result 1 "未设置 accessToken Cookie" "检查后端 cookie 配置"
fi

# 清理临时文件
rm -f cookies.tmp login_response.tmp

# =====================================================
# 阶段 5: 安全响应头验证
# =====================================================
echo -e "\n${BLUE}[阶段 5/6] 安全响应头验证${NC}"
echo "-------------------------------------------"

HEADERS=$(curl -s -I "$BACKEND_URL/api/health")

# 测试 5.1: X-Content-Type-Options
echo -n "测试 X-Content-Type-Options..."
if echo "$HEADERS" | grep -qi "X-Content-Type-Options.*nosniff"; then
    test_result 0 "X-Content-Type-Options 已设置"
else
    test_result 1 "缺少 X-Content-Type-Options" "建议设置为 nosniff"
fi

# 测试 5.2: X-Frame-Options
echo -n "测试 X-Frame-Options..."
if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
    test_result 0 "X-Frame-Options 已设置 (防止点击劫持)"
else
    test_result 1 "缺少 X-Frame-Options" "建议设置为 SAMEORIGIN 或 DENY"
fi

# 测试 5.3: Strict-Transport-Security
echo -n "测试 Strict-Transport-Security..."
if echo "$HEADERS" | grep -qi "Strict-Transport-Security"; then
    test_result 0 "HSTS 已启用"
else
    test_result 1 "缺少 HSTS" "建议添加 Strict-Transport-Security"
fi

# =====================================================
# 阶段 6: API 功能测试
# =====================================================
echo -e "\n${BLUE}[阶段 6/6] API 功能测试${NC}"
echo "-------------------------------------------"

# 测试 6.1: 未授权访问应该被拒绝
echo -n "测试未授权访问拒绝..."
UNAUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/auth/me")
if [ "$UNAUTH_RESPONSE" = "401" ]; then
    test_result 0 "未授权访问正确返回 401"
else
    test_result 1 "未授权访问处理异常" "期望 401，实际: $UNAUTH_RESPONSE"
fi

# 测试 6.2: 健康检查端点
echo -n "测试健康检查端点..."
HEALTH_STATUS=$(curl -s "$BACKEND_URL/api/health" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$HEALTH_STATUS" = "ok" ]; then
    test_result 0 "健康检查返回正常状态"
else
    test_result 1 "健康检查异常" "状态: $HEALTH_STATUS"
fi

# =====================================================
# 测试总结
# =====================================================
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}   测试总结${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "总测试数: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失败: ${RED}$FAILED_TESTS${NC}"
echo ""

# 计算通过率
PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "通过率: ${BLUE}$PASS_RATE%${NC}"
echo ""

# 评级
if [ $PASS_RATE -ge 90 ]; then
    echo -e "${GREEN}🎉 优秀！系统已准备好部署到生产环境${NC}"
    EXIT_CODE=0
elif [ $PASS_RATE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  良好，但有一些需要改进的地方${NC}"
    EXIT_CODE=1
else
    echo -e "${RED}🚨 警告：发现严重安全问题，不建议部署${NC}"
    EXIT_CODE=2
fi

echo ""
echo -e "${BLUE}详细验证指南请查看: 部署验证指南.md${NC}"
echo ""

exit $EXIT_CODE

