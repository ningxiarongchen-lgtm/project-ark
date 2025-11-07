#!/bin/bash

# 数据上传启动器 - 交互式菜单

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║         🚀 数据上传到生产环境 - 启动器                    ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

echo -e "${GREEN}📊 本地数据统计：${NC}"
echo "   - 执行器: 338个"
echo "   - 手动覆盖规则: 18个"
echo "   - 配件: 10个"
echo "   - 供应商: 5个"
echo ""

echo -e "${YELLOW}请选择操作：${NC}"
echo ""
echo "  1️⃣  检查生产环境数据状态（推荐先执行）"
echo "  2️⃣  上传数据到生产环境（Shell方式 - 快速）"
echo "  3️⃣  上传数据到生产环境（Node.js方式 - 精细）"
echo "  4️⃣  查看详细使用指南"
echo "  5️⃣  查看快速参考"
echo "  0️⃣  退出"
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""

read -p "请输入选项 (0-5): " choice

echo ""

case $choice in
    1)
        echo -e "${BLUE}🔍 启动生产环境数据检查工具...${NC}"
        echo ""
        node check-production-data.js
        ;;
    2)
        echo -e "${GREEN}🚀 启动Shell上传工具（推荐）...${NC}"
        echo ""
        ./upload-data-safe.sh
        ;;
    3)
        echo -e "${GREEN}🔧 启动Node.js上传工具（精细控制）...${NC}"
        echo ""
        node upload-to-production.js
        ;;
    4)
        echo -e "${BLUE}📖 打开详细指南...${NC}"
        echo ""
        if command -v open &> /dev/null; then
            open "📖上传数据到生产环境-完整指南.md"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "📖上传数据到生产环境-完整指南.md"
        else
            cat "📖上传数据到生产环境-完整指南.md"
        fi
        ;;
    5)
        echo -e "${BLUE}⚡ 显示快速参考...${NC}"
        echo ""
        cat "⚡快速上传数据到生产环境.md"
        echo ""
        read -p "按回车继续..."
        ;;
    0)
        echo -e "${YELLOW}👋 再见！${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ 无效的选项${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ 操作完成！${NC}"
echo ""

