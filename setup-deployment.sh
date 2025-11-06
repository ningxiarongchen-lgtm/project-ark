#!/bin/bash

# 🔧 部署配置助手
# 帮助收集和验证部署所需的配置信息

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🔧 部署配置助手${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}此脚本将帮助你配置自动部署所需的所有信息${NC}"
echo ""

# 配置文件
CONFIG_FILE=".deployment-config"

# 检查是否已有配置
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${YELLOW}⚠️  发现已有配置文件${NC}"
    read -p "是否使用已有配置？(y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        source "$CONFIG_FILE"
        echo -e "${GREEN}✅ 已加载配置${NC}"
        echo ""
    fi
fi

# 1. Cloudflare 配置
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📱 第1步: Cloudflare Pages 配置${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}1. 访问 Cloudflare Dashboard:${NC}"
echo "   https://dash.cloudflare.com/"
echo ""
echo -e "${YELLOW}2. 检查 'smart-system' 项目是否存在${NC}"
echo ""

read -p "项目 'smart-system' 是否已存在？(y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📝 创建 Cloudflare Pages 项目${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "1. Workers & Pages → Create → Pages → Connect to Git"
    echo "2. 选择仓库: project-ark"
    echo "3. 配置:"
    echo "   Project name: smart-system"
    echo "   Build command: cd frontend && npm install && npm run build"
    echo "   Build output: frontend/dist"
    echo "4. 环境变量:"
    echo "   NODE_ENV=production"
    echo "   VITE_API_URL=https://project-ark.onrender.com"
    echo ""
    read -p "按回车键继续..." 
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔑 获取 Cloudflare API Token${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. 右上角头像 → My Profile → API Tokens"
echo "2. Create Token → 使用 'Edit Cloudflare Workers' 模板"
echo "3. 权限: Account - Cloudflare Pages: Edit"
echo "4. Create Token → 复制 Token（只显示一次！）"
echo ""

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${GREEN}请粘贴 Cloudflare API Token:${NC}"
    read -r CLOUDFLARE_API_TOKEN
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🆔 获取 Cloudflare Account ID${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "在 Dashboard 右侧可以看到 Account ID"
echo ""

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo -e "${GREEN}请粘贴 Cloudflare Account ID:${NC}"
    read -r CLOUDFLARE_ACCOUNT_ID
fi

echo ""
echo -e "${GREEN}✅ Cloudflare 配置收集完成${NC}"

# 2. Render 配置
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🖥️  第2步: Render 配置${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}1. 访问 Render Dashboard:${NC}"
echo "   https://dashboard.render.com/"
echo ""
echo -e "${YELLOW}2. 找到 'project-ark' 服务${NC}"
echo ""

read -p "服务 'project-ark' 是否已正确配置？(y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}⚙️  配置 Render 服务${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Settings → Build & Deploy:"
    echo "  Build Command: cd backend && npm install"
    echo "  Start Command: cd backend && npm start"
    echo ""
    echo "Settings → Environment:"
    echo "  NODE_ENV=production"
    echo "  PORT=10000"
    echo "  MONGODB_URI=你的MongoDB连接字符串"
    echo "  JWT_SECRET=随机32位字符串"
    echo "  CORS_ORIGIN=https://smart-system.pages.dev"
    echo ""
    read -p "按回车键继续..."
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🪝 获取 Render Deploy Hook${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. Settings → Deploy Hook"
echo "2. Create Deploy Hook"
echo "3. 复制 Hook URL"
echo ""

if [ -z "$RENDER_DEPLOY_HOOK" ]; then
    echo -e "${GREEN}请粘贴 Render Deploy Hook URL:${NC}"
    read -r RENDER_DEPLOY_HOOK
fi

echo ""
echo -e "${GREEN}✅ Render 配置收集完成${NC}"

# 3. 保存配置
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}💾 保存配置${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 保存到配置文件
cat > "$CONFIG_FILE" << EOF
# 部署配置（不要提交到 Git！）
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN"
CLOUDFLARE_ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID"
RENDER_DEPLOY_HOOK="$RENDER_DEPLOY_HOOK"
EOF

echo -e "${GREEN}✅ 配置已保存到 $CONFIG_FILE${NC}"
echo -e "${YELLOW}⚠️  此文件包含敏感信息，不要提交到 Git${NC}"
echo ""

# 4. 添加到 GitHub Secrets
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔐 第3步: 添加 GitHub Secrets${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}访问:${NC}"
echo "https://github.com/ningxiarongchen-lgtm/project-ark/settings/secrets/actions"
echo ""
echo -e "${YELLOW}添加以下 3 个 Secrets:${NC}"
echo ""

echo -e "${BLUE}1. CLOUDFLARE_API_TOKEN${NC}"
echo "   Secret: $CLOUDFLARE_API_TOKEN"
echo ""

echo -e "${BLUE}2. CLOUDFLARE_ACCOUNT_ID${NC}"
echo "   Secret: $CLOUDFLARE_ACCOUNT_ID"
echo ""

echo -e "${BLUE}3. RENDER_DEPLOY_HOOK${NC}"
echo "   Secret: $RENDER_DEPLOY_HOOK"
echo ""

read -p "按回车键打开 GitHub Secrets 页面..."
open "https://github.com/ningxiarongchen-lgtm/project-ark/settings/secrets/actions" 2>/dev/null || echo "请手动访问上面的 URL"

echo ""
read -p "已添加所有 Secrets？(y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  请完成 GitHub Secrets 配置后再继续${NC}"
    exit 0
fi

# 5. 触发部署
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 第4步: 触发部署${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "是否现在推送代码并触发部署？(y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}正在推送代码...${NC}"
    
    git add .github/workflows/cloudflare-pages.yml "🔧配置修复指南.md"
    git commit -m "fix: update cloudflare project name to smart-system and add configuration guide"
    git push origin main
    
    echo ""
    echo -e "${GREEN}✅ 代码已推送！${NC}"
    echo ""
    echo -e "${BLUE}⏰ 部署进度：${NC}"
    echo "  • 前端 (Cloudflare Pages): 2-3 分钟"
    echo "  • 后端 (Render): 3-5 分钟"
    echo ""
    echo -e "${YELLOW}📊 查看部署状态:${NC}"
    echo "  GitHub Actions: https://github.com/ningxiarongchen-lgtm/project-ark/actions"
    echo ""
    
    read -p "是否等待 6 分钟后自动验证？(y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}⏳ 等待部署完成...${NC}"
        for i in {360..30..-30}; do
            printf "\r${YELLOW}⏰ 剩余时间: %02d:%02d${NC}" $((i/60)) $((i%60))
            sleep 30
        done
        
        echo ""
        echo ""
        echo -e "${GREEN}🔍 开始验证部署...${NC}"
        echo ""
        
        FRONTEND_URL="https://smart-system.pages.dev" \
        BACKEND_URL="https://project-ark.onrender.com" \
        ./scripts/check-deployment.sh
    else
        echo ""
        echo -e "${BLUE}💡 提示：${NC}"
        echo "   6 分钟后运行以下命令验证部署："
        echo ""
        echo -e "   ${GREEN}FRONTEND_URL=https://smart-system.pages.dev \\${NC}"
        echo -e "   ${GREEN}BACKEND_URL=https://project-ark.onrender.com \\${NC}"
        echo -e "   ${GREEN}./scripts/check-deployment.sh${NC}"
    fi
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 配置完成！${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}下次推送代码时将自动部署到：${NC}"
echo "  • 前端: https://smart-system.pages.dev"
echo "  • 后端: https://project-ark.onrender.com"
echo ""

