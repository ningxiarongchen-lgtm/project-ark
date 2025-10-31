#!/bin/bash

# ========================================
# Vercel 强制清除缓存并重新部署脚本
# ========================================
# 日期: 2025-10-31
# 用途: 强制 Vercel 清除缓存并重新构建部署
# ========================================

set -e  # 遇到错误立即退出

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔄 Vercel 强制清除缓存并重新部署${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查是否在正确的目录
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo -e "${RED}❌ 错误：请在项目根目录运行此脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 当前操作：${NC}"
echo "  1. 检查 Git 状态"
echo "  2. 创建空提交强制重新构建"
echo "  3. 推送到 GitHub"
echo "  4. 触发 Vercel 自动部署"
echo ""

# 步骤1：检查 Git 状态
echo -e "${BLUE}[1/4] 检查 Git 状态...${NC}"
if ! git status &> /dev/null; then
    echo -e "${RED}❌ 错误：当前目录不是 Git 仓库${NC}"
    exit 1
fi

git status
echo ""

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  警告：检测到未提交的更改${NC}"
    echo ""
    echo "请选择操作："
    echo "  1) 提交所有更改并继续"
    echo "  2) 只创建空提交（不提交现有更改）"
    echo "  3) 取消操作"
    echo ""
    read -p "请输入选择 (1/2/3): " choice
    
    case $choice in
        1)
            echo -e "${BLUE}正在提交所有更改...${NC}"
            git add .
            git commit -m "chore: commit changes before force rebuild"
            ;;
        2)
            echo -e "${YELLOW}跳过现有更改，只创建空提交${NC}"
            ;;
        3)
            echo -e "${RED}操作已取消${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}无效的选择，操作已取消${NC}"
            exit 1
            ;;
    esac
fi

# 步骤2：创建空提交
echo -e "${BLUE}[2/4] 创建空提交以触发重新构建...${NC}"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit --allow-empty -m "chore: force Vercel rebuild - clear cache [$TIMESTAMP]"
echo -e "${GREEN}✅ 空提交创建成功${NC}"
echo ""

# 步骤3：推送到 GitHub
echo -e "${BLUE}[3/4] 推送到 GitHub...${NC}"
echo "当前分支: $(git branch --show-current)"
echo ""

if ! git push origin main; then
    echo -e "${RED}❌ 推送失败${NC}"
    echo ""
    echo "可能的原因："
    echo "  1. 网络连接问题"
    echo "  2. 没有推送权限"
    echo "  3. 分支名称不是 'main'"
    echo ""
    echo "请手动推送："
    echo "  git push origin \$(git branch --show-current)"
    exit 1
fi

echo -e "${GREEN}✅ 推送成功${NC}"
echo ""

# 步骤4：提示 Vercel 部署
echo -e "${BLUE}[4/4] Vercel 自动部署已触发${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 操作完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📝 接下来的步骤：${NC}"
echo ""
echo "1. 访问 Vercel Dashboard："
echo "   https://vercel.com/dashboard"
echo ""
echo "2. 进入你的项目 → Deployments"
echo ""
echo "3. 等待部署完成（通常 1-3 分钟）"
echo "   - 查看构建日志确认没有使用缓存"
echo "   - 看到绿色 'Ready' 表示部署成功"
echo ""
echo "4. 测试部署："
echo "   - 清除浏览器缓存（Ctrl+Shift+Delete）"
echo "   - 访问 Vercel 部署的 URL"
echo "   - 打开控制台检查 API 配置"
echo ""
echo "5. 如果问题仍然存在："
echo "   - 在 Vercel 中手动 Redeploy（取消勾选 'Use existing Build Cache'）"
echo "   - 查看详细文档：🔄Vercel强制清除缓存-重新部署.md"
echo ""

# 显示当前提交信息
echo -e "${BLUE}📋 最新提交：${NC}"
git log -1 --oneline
echo ""

# 可选：打开 Vercel Dashboard
echo -e "${YELLOW}是否要打开 Vercel Dashboard？(y/n)${NC}"
read -p "> " open_dashboard

if [ "$open_dashboard" = "y" ] || [ "$open_dashboard" = "Y" ]; then
    echo -e "${BLUE}正在打开 Vercel Dashboard...${NC}"
    if command -v open &> /dev/null; then
        open "https://vercel.com/dashboard"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "https://vercel.com/dashboard"
    else
        echo "请手动访问：https://vercel.com/dashboard"
    fi
fi

echo ""
echo -e "${GREEN}🎉 脚本执行完成！${NC}"
echo ""

# 显示下一步操作提示
echo -e "${BLUE}💡 提示：${NC}"
echo "  - 如果 Vercel 部署失败，查看构建日志了解原因"
echo "  - 确保环境变量 VITE_API_URL 已正确配置"
echo "  - 部署成功后，清除浏览器缓存再测试"
echo ""


