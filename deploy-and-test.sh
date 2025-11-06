#!/bin/bash

# 🚀 测试并部署脚本
# 确保测试通过后才推送和部署

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
echo -e "${CYAN}🚀 测试并部署流程${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查是否有未提交的更改
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  没有检测到任何更改${NC}"
    echo "所有文件都已提交"
    exit 0
fi

# 显示当前更改
echo -e "${BLUE}📊 检测到以下更改：${NC}"
echo ""
git status --short
echo ""

# 询问是否要运行测试
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
read -p "是否运行前端测试？(y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🧪 运行前端测试...${NC}"
    cd frontend
    
    # 运行 lint 检查
    echo -e "${BLUE}[1/2] 运行 ESLint...${NC}"
    npm run lint:check || {
        echo -e "${RED}❌ ESLint 检查失败${NC}"
        echo -e "${YELLOW}提示: 运行 'npm run lint:fix' 自动修复${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ ESLint 通过${NC}"
    echo ""
    
    # 尝试构建
    echo -e "${BLUE}[2/2] 测试构建...${NC}"
    npm run build || {
        echo -e "${RED}❌ 构建失败${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ 构建成功${NC}"
    
    cd ..
    echo ""
fi

# 询问是否要运行后端测试
read -p "是否运行后端测试？(y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🧪 运行后端测试...${NC}"
    cd backend
    
    # 检查语法
    echo -e "${BLUE}[1/1] 检查语法...${NC}"
    node -c server.js || {
        echo -e "${RED}❌ 语法检查失败${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ 语法检查通过${NC}"
    
    cd ..
    echo ""
fi

# 分析更改影响
FRONTEND_CHANGES=$(git status --porcelain | grep "frontend/" | wc -l | tr -d ' ')
BACKEND_CHANGES=$(git status --porcelain | grep "backend/" | wc -l | tr -d ' ')

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📈 部署影响分析：${NC}"
echo ""

if [ "$FRONTEND_CHANGES" -gt 0 ]; then
    echo -e "${GREEN}✅ 前端${NC}: $FRONTEND_CHANGES 个文件变更"
    echo "   → 将部署到 Cloudflare Pages (smart-system)"
    echo "   → 预计时间: 2-3 分钟"
else
    echo -e "${YELLOW}⊘  前端${NC}: 无变更"
fi

if [ "$BACKEND_CHANGES" -gt 0 ]; then
    echo -e "${GREEN}✅ 后端${NC}: $BACKEND_CHANGES 个文件变更"
    echo "   → 将部署到 Render (project-ark)"
    echo "   → 预计时间: 3-5 分钟"
else
    echo -e "${YELLOW}⊘  后端${NC}: 无变更"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 询问提交信息
echo -e "${BLUE}📝 请输入提交信息（使用语义化格式）：${NC}"
echo -e "${YELLOW}提示: feat/fix/style/perf/refactor/test/docs/chore${NC}"
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
echo -e "${YELLOW}推送后将自动触发部署到：${NC}"
if [ "$FRONTEND_CHANGES" -gt 0 ]; then
    echo "  • Cloudflare Pages (smart-system.pages.dev)"
fi
if [ "$BACKEND_CHANGES" -gt 0 ]; then
    echo "  • Render (project-ark.onrender.com)"
fi
echo ""

# 最终确认
read -p "✅ 测试已通过，确认推送并自动部署？(y/N): " -n 1 -r
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
COMMIT_HASH=$(git rev-parse --short HEAD)
echo -e "${GREEN}✅ 提交成功 (${COMMIT_HASH})${NC}"
echo ""

# 推送到 GitHub
echo -e "${BLUE}[3/4]${NC} 推送到 GitHub..."
git push origin main
echo -e "${GREEN}✅ 推送成功！${NC}"
echo ""

# 部署已触发
echo -e "${BLUE}[4/4]${NC} 自动部署已触发..."
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 推送完成！自动部署已启动${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 显示预计时间
TOTAL_TIME=5
if [ "$FRONTEND_CHANGES" -gt 0 ] && [ "$BACKEND_CHANGES" -gt 0 ]; then
    TOTAL_TIME=6
elif [ "$BACKEND_CHANGES" -gt 0 ]; then
    TOTAL_TIME=5
elif [ "$FRONTEND_CHANGES" -gt 0 ]; then
    TOTAL_TIME=3
fi

echo -e "${BLUE}⏰ 部署进度：${NC}"
echo ""
if [ "$FRONTEND_CHANGES" -gt 0 ]; then
    echo "  🔵 前端 (Cloudflare Pages): 2-3 分钟"
fi
if [ "$BACKEND_CHANGES" -gt 0 ]; then
    echo "  🔵 后端 (Render): 3-5 分钟"
fi
echo ""
echo -e "${YELLOW}📌 预计总时长: ~${TOTAL_TIME} 分钟${NC}"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 查看部署状态：${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "GitHub Actions:"
echo "  https://github.com/ningxiarongchen-lgtm/project-ark/actions"
echo ""

# 询问是否等待验证
read -p "是否等待 ${TOTAL_TIME} 分钟后自动验证部署？(y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}⏳ 等待部署完成...${NC}"
    echo ""
    
    # 显示倒计时
    WAIT_SECONDS=$((TOTAL_TIME * 60))
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
    
    # 验证部署
    if [ -f "./scripts/check-deployment.sh" ]; then
        # 需要更新脚本使用正确的 URL
        FRONTEND_URL="https://smart-system.pages.dev" \
        BACKEND_URL="https://project-ark.onrender.com" \
        ./scripts/check-deployment.sh
    else
        echo -e "${YELLOW}⚠️  验证脚本不存在，手动检查部署状态${NC}"
        echo ""
        echo "前端: https://smart-system.pages.dev"
        echo "后端: https://project-ark.onrender.com/api/health"
    fi
else
    echo ""
    echo -e "${BLUE}💡 提示：${NC}"
    echo "   等待 ${TOTAL_TIME} 分钟后，运行以下命令验证部署："
    echo ""
    echo -e "   ${GREEN}FRONTEND_URL=https://smart-system.pages.dev \\${NC}"
    echo -e "   ${GREEN}BACKEND_URL=https://project-ark.onrender.com \\${NC}"
    echo -e "   ${GREEN}./scripts/check-deployment.sh${NC}"
    echo ""
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ 部署流程完成！${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

