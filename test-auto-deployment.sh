#!/bin/bash

# 🧪 测试自动部署功能
# 配置完 GitHub Secrets 后运行此脚本验证自动部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🧪 自动部署功能测试${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查是否已配置 Secrets
echo -e "${BLUE}📋 前置条件检查...${NC}"
echo ""

echo "请确认以下 GitHub Secrets 已配置："
echo ""
echo "  ✅ CLOUDFLARE_API_TOKEN"
echo "  ✅ CLOUDFLARE_ACCOUNT_ID"
echo "  ✅ RENDER_DEPLOY_HOOK"
echo ""
echo "访问查看: https://github.com/ningxiarongchen-lgtm/project-ark/settings/secrets/actions"
echo ""

read -p "已配置完所有 Secrets？(y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}⚠️  请先配置 GitHub Secrets${NC}"
    echo ""
    echo "📖 查看配置指南:"
    echo "   cat '🔑GitHub-Secrets配置-完整指南.md'"
    echo ""
    echo "⚡ 或查看快速指南:"
    echo "   cat '⚡GitHub-Secrets-快速配置.md'"
    echo ""
    exit 0
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 开始测试自动部署${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查 Git 状态
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  检测到未提交的更改${NC}"
    echo ""
    git status --short
    echo ""
    
    read -p "是否先提交这些更改？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${BLUE}📝 请输入提交信息：${NC}"
        read -p "commit message: " COMMIT_MSG
        
        if [ -z "$COMMIT_MSG" ]; then
            COMMIT_MSG="chore: update before testing auto-deployment"
        fi
        
        echo ""
        echo -e "${BLUE}提交更改...${NC}"
        git add .
        git commit -m "$COMMIT_MSG"
        echo -e "${GREEN}✅ 提交完成${NC}"
    fi
fi

echo ""
echo -e "${BLUE}🎯 创建测试提交...${NC}"
echo ""

# 创建一个测试标记文件
TEST_FILE=".deployment-test-$(date +%s)"
echo "Auto-deployment test at $(date)" > "$TEST_FILE"

git add "$TEST_FILE"
git commit -m "test: verify GitHub Actions auto-deployment configuration"

COMMIT_HASH=$(git rev-parse --short HEAD)
echo -e "${GREEN}✅ 测试提交创建成功${NC}"
echo "   提交 ID: $COMMIT_HASH"
echo ""

echo -e "${BLUE}🚀 推送到 GitHub...${NC}"
git push origin main
echo -e "${GREEN}✅ 推送成功！${NC}"
echo ""

# 清理测试文件
git rm "$TEST_FILE" > /dev/null 2>&1 || true
git commit -m "chore: cleanup deployment test file" > /dev/null 2>&1 || true

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 自动部署已触发！${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}📊 部署进度监控${NC}"
echo ""
echo "GitHub Actions 工作流已自动启动！"
echo ""
echo "🔍 查看实时进度："
echo "   https://github.com/ningxiarongchen-lgtm/project-ark/actions"
echo ""
echo "你应该能看到 2 个工作流正在运行："
echo "   🔵 Deploy to Cloudflare Pages (前端)"
echo "   🔵 Deploy to Render (后端)"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}⏰ 预计部署时间${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  🔵 前端 (Cloudflare Pages): 2-3 分钟"
echo "  🔵 后端 (Render): 3-5 分钟"
echo ""
echo -e "${YELLOW}  ⏰ 总计: 约 5-6 分钟${NC}"
echo ""

# 询问是否等待验证
read -p "是否等待 6 分钟后自动验证部署？(y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}⏳ 等待部署完成...${NC}"
    echo ""
    echo "你可以打开浏览器访问："
    echo "  https://github.com/ningxiarongchen-lgtm/project-ark/actions"
    echo ""
    echo "查看部署进度..."
    echo ""
    
    # 倒计时
    WAIT_SECONDS=360  # 6 分钟
    for i in $(seq $WAIT_SECONDS -30 30); do
        MINS=$((i / 60))
        SECS=$((i % 60))
        printf "\r${YELLOW}⏰ 剩余时间: %02d:%02d${NC}" $MINS $SECS
        sleep 30
    done
    
    echo ""
    echo ""
    echo -e "${GREEN}🔍 开始验证部署...${NC}"
    echo ""
    
    # 验证前端
    echo -e "${BLUE}[1/2] 检查前端部署...${NC}"
    FRONTEND_URL="https://smart-system.pages.dev"
    
    if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"; then
        echo -e "${GREEN}✅ 前端部署成功${NC}"
        echo "   URL: $FRONTEND_URL"
    else
        echo -e "${YELLOW}⚠️  前端可能还在部署中${NC}"
        echo "   URL: $FRONTEND_URL"
        echo "   建议: 手动访问确认"
    fi
    echo ""
    
    # 验证后端
    echo -e "${BLUE}[2/2] 检查后端部署...${NC}"
    BACKEND_URL="https://project-ark.onrender.com/api/health"
    
    HEALTH_CHECK=$(curl -s "$BACKEND_URL" || echo '{"status":"ERROR"}')
    if echo "$HEALTH_CHECK" | grep -q "OK"; then
        echo -e "${GREEN}✅ 后端部署成功${NC}"
        echo "   URL: https://project-ark.onrender.com"
        echo "   健康检查: $HEALTH_CHECK"
    else
        echo -e "${YELLOW}⚠️  后端可能还在部署中${NC}"
        echo "   URL: $BACKEND_URL"
        echo "   响应: $HEALTH_CHECK"
        echo "   建议: 等待几分钟后再次检查"
    fi
    echo ""
    
else
    echo ""
    echo -e "${BLUE}💡 手动验证步骤：${NC}"
    echo ""
    echo "1. 等待 5-6 分钟"
    echo ""
    echo "2. 查看 GitHub Actions 状态："
    echo "   https://github.com/ningxiarongchen-lgtm/project-ark/actions"
    echo ""
    echo "3. 确认两个工作流都显示 ✅"
    echo ""
    echo "4. 访问前端验证："
    echo "   https://smart-system.pages.dev"
    echo ""
    echo "5. 访问后端 API 验证："
    echo "   https://project-ark.onrender.com/api/health"
    echo ""
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ 自动部署测试完成！${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}🎉 如果部署成功，说明自动部署已配置完成！${NC}"
echo ""
echo "以后每次推送代码都会自动触发部署："
echo ""
echo -e "${GREEN}  git add .${NC}"
echo -e "${GREEN}  git commit -m \"你的提交信息\"${NC}"
echo -e "${GREEN}  git push origin main${NC}"
echo ""
echo "  ↓ (自动)"
echo ""
echo "  🔵 GitHub Actions 检测推送"
echo "  🔵 自动构建前后端"
echo "  🔵 自动部署到 Cloudflare 和 Render"
echo "  🔵 5-6 分钟后自动上线"
echo ""
echo -e "${GREEN}✨ 一次配置，永久自动！${NC}"
echo ""

