#!/bin/bash

# 代码推送前自动检查脚本
# 用法：./scripts/pre-push-check.sh

set -e  # 遇到错误立即退出

echo "🔍 开始代码推送前检查..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. 检查中文标点符号
echo "📝 检查1：中文标点符号检查"
if grep -rn '[""'']' frontend/src/ --include="*.jsx" --include="*.tsx" 2>/dev/null; then
    echo -e "${RED}❌ 发现中文引号！这会导致Vercel构建失败${NC}"
    echo "   请将中文引号改为英文引号或移除"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ 通过：未发现中文标点符号问题${NC}"
fi
echo ""

# 2. 检查调试代码
echo "📝 检查2：调试代码检查"
if grep -rn "console.log\|debugger" frontend/src/ --include="*.jsx" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "console.warn\|console.error" | head -10; then
    echo -e "${YELLOW}⚠️  警告：发现调试代码 (console.log/debugger)${NC}"
    echo "   建议在推送前移除调试代码"
    echo ""
else
    echo -e "${GREEN}✅ 通过：未发现调试代码${NC}"
fi
echo ""

# 3. ESLint检查（如果已安装）
echo "📝 检查3：ESLint代码质量检查"
cd frontend
if [ -f "node_modules/.bin/eslint" ]; then
    if npm run lint:check 2>&1 | tail -20; then
        echo -e "${GREEN}✅ 通过：ESLint检查通过${NC}"
    else
        echo -e "${RED}❌ ESLint检查失败${NC}"
        echo "   运行 'npm run lint:fix' 自动修复部分问题"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  ESLint未安装，跳过检查${NC}"
    echo "   运行 'npm install' 安装依赖"
fi
cd ..
echo ""

# 4. 检查Git状态
echo "📝 检查4：Git状态检查"
if git status --porcelain | grep -q '^??'; then
    echo -e "${YELLOW}⚠️  警告：发现未追踪的文件${NC}"
    git status --porcelain | grep '^??'
    echo "   确认这些文件不需要提交"
    echo ""
else
    echo -e "${GREEN}✅ 通过：无未追踪文件${NC}"
fi
echo ""

# 5. 检查大文件
echo "📝 检查5：大文件检查"
LARGE_FILES=$(find . -type f -size +1M ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" 2>/dev/null)
if [ -n "$LARGE_FILES" ]; then
    echo -e "${YELLOW}⚠️  警告：发现大文件 (>1MB)${NC}"
    echo "$LARGE_FILES"
    echo "   确认这些文件需要提交到Git"
    echo ""
else
    echo -e "${GREEN}✅ 通过：无大文件${NC}"
fi
echo ""

# 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ 所有关键检查通过！可以安全推送${NC}"
    echo ""
    echo "推荐推送命令："
    echo "  git add ."
    echo "  git commit -m \"您的提交信息\""
    echo "  git push origin main"
    exit 0
else
    echo -e "${RED}❌ 发现 $ERRORS 个错误，请修复后再推送${NC}"
    echo ""
    echo "修复建议："
    echo "  1. 修复上述标记为 ❌ 的问题"
    echo "  2. 运行 'npm run lint:fix' 自动修复ESLint问题"
    echo "  3. 再次运行此脚本确认"
    exit 1
fi

