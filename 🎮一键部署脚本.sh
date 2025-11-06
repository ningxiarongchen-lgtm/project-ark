#!/bin/bash

# 🎮 一键部署脚本
# 简化提交和推送流程

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🎮 一键部署脚本${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查是否有未提交的更改
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  没有检测到任何更改${NC}"
    echo "所有文件都已提交，无需部署"
    exit 0
fi

# 显示当前更改
echo -e "${BLUE}📊 检测到以下更改：${NC}"
echo ""
git status --short
echo ""

# 分析更改类型
FRONTEND_CHANGES=$(git status --porcelain | grep "frontend/" | wc -l | tr -d ' ')
BACKEND_CHANGES=$(git status --porcelain | grep "backend/" | wc -l | tr -d ' ')

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📈 影响分析：${NC}"
echo ""

if [ "$FRONTEND_CHANGES" -gt 0 ]; then
    echo -e "${GREEN}✅ 前端${NC}: $FRONTEND_CHANGES 个文件变更 → 将触发 Cloudflare Pages 部署"
else
    echo -e "${YELLOW}⊘  前端${NC}: 无变更 → 不会触发部署"
fi

if [ "$BACKEND_CHANGES" -gt 0 ]; then
    echo -e "${GREEN}✅ 后端${NC}: $BACKEND_CHANGES 个文件变更 → 将触发 Render 部署"
else
    echo -e "${YELLOW}⊘  后端${NC}: 无变更 → 不会触发部署"
fi

echo ""

# 如果前后端都没变化
if [ "$FRONTEND_CHANGES" -eq 0 ] && [ "$BACKEND_CHANGES" -eq 0 ]; then
    echo -e "${BLUE}ℹ️  只有文档或配置文件变更，不会触发自动部署${NC}"
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 询问提交信息
echo -e "${BLUE}📝 请输入提交信息：${NC}"
read -p "commit message: " COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
    echo -e "${RED}❌ 提交信息不能为空${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠️  准备推送到生产环境${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "提交信息: ${GREEN}$COMMIT_MSG${NC}"
echo ""

# 最终确认
read -p "确认推送并自动部署？(y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ 已取消部署${NC}"
    exit 0
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 开始部署流程...${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 添加所有更改
echo -e "${BLUE}[1/4]${NC} 添加文件到暂存区..."
git add .
echo -e "${GREEN}✅ 完成${NC}"
echo ""

# 提交
echo -e "${BLUE}[2/4]${NC} 提交更改..."
git commit -m "$COMMIT_MSG"
echo -e "${GREEN}✅ 完成${NC}"
echo ""

# 推送到 GitHub
echo -e "${BLUE}[3/4]${NC} 推送到 GitHub..."
git push origin main
echo -e "${GREEN}✅ 推送成功！${NC}"
echo ""

# 显示后续步骤
echo -e "${BLUE}[4/4]${NC} 自动部署已触发..."
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 推送完成！自动部署已启动${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 估算部署时间
TOTAL_TIME=0
if [ "$FRONTEND_CHANGES" -gt 0 ]; then
    echo -e "${BLUE}⏰ 前端部署${NC}: 预计 2-3 分钟"
    TOTAL_TIME=3
fi

if [ "$BACKEND_CHANGES" -gt 0 ]; then
    echo -e "${BLUE}⏰ 后端部署${NC}: 预计 3-5 分钟"
    TOTAL_TIME=5
fi

if [ "$TOTAL_TIME" -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}📌 预计总时长: ~${TOTAL_TIME} 分钟${NC}"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 查看部署状态：${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1️⃣  GitHub Actions:"
echo "   https://github.com/你的用户名/Model-Selection-System/actions"
echo ""
echo "2️⃣  Cloudflare Pages:"
echo "   https://dash.cloudflare.com/"
echo ""
echo "3️⃣  Render:"
echo "   https://dashboard.render.com/"
echo ""

# 询问是否等待并验证部署
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
read -p "是否等待 ${TOTAL_TIME} 分钟后自动验证部署？(y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}⏳ 等待部署完成...${NC}"
    echo ""
    
    # 倒计时
    WAIT_SECONDS=$((TOTAL_TIME * 60))
    for i in $(seq $WAIT_SECONDS -30 1); do
        MINS=$((i / 60))
        SECS=$((i % 60))
        printf "\r${YELLOW}⏰ 剩余时间: %02d:%02d${NC}" $MINS $SECS
        sleep 30
    done
    
    echo ""
    echo ""
    echo -e "${GREEN}🔍 开始验证部署...${NC}"
    echo ""
    
    # 运行验证脚本
    if [ -f "./scripts/check-deployment.sh" ]; then
        ./scripts/check-deployment.sh
    else
        echo -e "${YELLOW}⚠️  验证脚本不存在，请手动检查部署状态${NC}"
    fi
else
    echo ""
    echo -e "${BLUE}💡 提示：${NC}"
    echo "   等待 ${TOTAL_TIME} 分钟后，运行以下命令验证部署："
    echo ""
    echo -e "   ${GREEN}./scripts/check-deployment.sh${NC}"
    echo ""
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ 部署流程完成！${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

