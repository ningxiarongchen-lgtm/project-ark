#!/bin/bash

# 🔍 检查 GitHub Secrets 配置状态
# 帮助你确认自动部署配置是否完整

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
echo -e "${CYAN}🔍 GitHub Secrets 配置状态检查${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查工作流文件
echo -e "${BLUE}📋 检查工作流文件...${NC}"
echo ""

CLOUDFLARE_WORKFLOW=".github/workflows/cloudflare-pages.yml"
RENDER_WORKFLOW=".github/workflows/render-backend.yml"

if [ -f "$CLOUDFLARE_WORKFLOW" ]; then
    echo -e "${GREEN}✅ Cloudflare Pages 工作流存在${NC}"
    echo "   文件: $CLOUDFLARE_WORKFLOW"
else
    echo -e "${RED}❌ Cloudflare Pages 工作流缺失${NC}"
    echo "   期望: $CLOUDFLARE_WORKFLOW"
fi

if [ -f "$RENDER_WORKFLOW" ]; then
    echo -e "${GREEN}✅ Render 工作流存在${NC}"
    echo "   文件: $RENDER_WORKFLOW"
else
    echo -e "${RED}❌ Render 工作流缺失${NC}"
    echo "   期望: $RENDER_WORKFLOW"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔑 检查需要的 Secrets...${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查 Cloudflare 工作流中需要的 secrets
echo -e "${YELLOW}Cloudflare Pages 部署需要:${NC}"
echo ""
echo "  1️⃣  CLOUDFLARE_API_TOKEN"
echo "     📍 获取: https://dash.cloudflare.com/profile/api-tokens"
echo "     📝 权限: Account - Cloudflare Pages: Edit"
echo ""
echo "  2️⃣  CLOUDFLARE_ACCOUNT_ID"  
echo "     📍 获取: https://dash.cloudflare.com/ (右侧栏)"
echo ""

# 检查 Render 工作流中需要的 secrets
echo -e "${YELLOW}Render 部署需要:${NC}"
echo ""
echo "  3️⃣  RENDER_DEPLOY_HOOK"
echo "     📍 获取: https://dashboard.render.com/"
echo "     📝 路径: project-ark → Settings → Deploy Hook"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📍 添加 Secrets 位置${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "🌐 访问以下网址添加 Secrets:"
echo ""
echo "   https://github.com/ningxiarongchen-lgtm/project-ark/settings/secrets/actions"
echo ""
echo "或者："
echo "   1. 打开 GitHub 仓库"
echo "   2. Settings → Secrets and variables → Actions"
echo "   3. 点击 New repository secret"
echo "   4. 添加上面列出的 3 个 Secrets"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}✅ 配置完成后如何验证${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. 确认 3 个 Secrets 都已添加"
echo ""
echo "2. 触发一次部署测试:"
echo ""
echo -e "${GREEN}   git commit --allow-empty -m \"chore: test auto-deployment\"${NC}"
echo -e "${GREEN}   git push origin main${NC}"
echo ""
echo "3. 查看部署状态:"
echo ""
echo "   https://github.com/ningxiarongchen-lgtm/project-ark/actions"
echo ""
echo "4. 等待 5-6 分钟后验证:"
echo ""
echo "   前端: https://smart-system.pages.dev"
echo "   后端: https://project-ark.onrender.com/api/health"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🎯 下一步行动${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}还没配置 Secrets?${NC}"
echo ""
echo "📖 查看详细指南:"
echo "   cat '🔑GitHub-Secrets配置-完整指南.md'"
echo ""
echo "⚡ 查看快速指南:"
echo "   cat '⚡GitHub-Secrets-快速配置.md'"
echo ""
echo -e "${YELLOW}已经配置好了?${NC}"
echo ""
echo "🚀 触发测试部署:"
echo ""
echo -e "   ${GREEN}git commit --allow-empty -m \"chore: test deployment\"${NC}"
echo -e "   ${GREEN}git push origin main${NC}"
echo ""
echo "🔍 然后访问查看部署进度:"
echo "   https://github.com/ningxiarongchen-lgtm/project-ark/actions"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}💡 提示${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "配置一次 GitHub Secrets，以后每次推送代码都会自动部署！"
echo ""
echo "预计配置时间: 10-15 分钟"
echo "以后每次部署: 自动完成 (5-6 分钟)"
echo ""
echo -e "${GREEN}✨ 一次配置，永久自动！${NC}"
echo ""

