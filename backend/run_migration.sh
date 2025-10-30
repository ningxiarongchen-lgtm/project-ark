#!/bin/bash

###########################################
# 价格字段迁移一键运行脚本
# 
# 用途：快速执行价格字段迁移
# 使用：./run_migration.sh
#
# @author Project Ark 技术团队
# @date 2025-10-27
###########################################

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 显示标题
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}  价格字段迁移脚本 - 一键运行${NC}"
echo -e "${BLUE}  Price Tiers Migration - Quick Start${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

# 检查是否在 backend 目录
if [ ! -f "migration_price_tiers.js" ]; then
    echo -e "${RED}✗ 错误：请在 backend 目录下运行此脚本${NC}"
    echo -e "${YELLOW}提示：cd backend && ./run_migration.sh${NC}"
    exit 1
fi

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ 错误：未找到 Node.js${NC}"
    echo -e "${YELLOW}请先安装 Node.js: https://nodejs.org/${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js 已安装: $(node --version)${NC}"

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ 警告：未找到 .env 文件${NC}"
    echo -e "${YELLOW}将使用默认连接: mongodb://localhost:27017/cmax-selection${NC}"
    echo ""
fi

# 检查 MongoDB 是否运行
echo -e "${CYAN}ℹ 检查 MongoDB 服务...${NC}"

if command -v mongosh &> /dev/null; then
    # 使用 mongosh (新版)
    if mongosh --eval "db.version()" --quiet > /dev/null 2>&1; then
        echo -e "${GREEN}✓ MongoDB 服务正在运行${NC}"
    else
        echo -e "${RED}✗ MongoDB 服务未运行${NC}"
        echo -e "${YELLOW}请先启动 MongoDB:${NC}"
        echo -e "${YELLOW}  macOS: brew services start mongodb-community${NC}"
        echo -e "${YELLOW}  Linux: sudo systemctl start mongod${NC}"
        exit 1
    fi
elif command -v mongo &> /dev/null; then
    # 使用 mongo (旧版)
    if mongo --eval "db.version()" --quiet > /dev/null 2>&1; then
        echo -e "${GREEN}✓ MongoDB 服务正在运行${NC}"
    else
        echo -e "${RED}✗ MongoDB 服务未运行${NC}"
        echo -e "${YELLOW}请先启动 MongoDB${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ 无法检测 MongoDB 状态（未找到 mongo/mongosh 命令）${NC}"
    echo -e "${YELLOW}请确保 MongoDB 已启动再继续${NC}"
fi

echo ""

# 询问是否备份
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠  建议在迁移前备份数据库${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
read -p "是否要先备份数据库？(y/n) [推荐 y]: " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    echo -e "${CYAN}ℹ 正在备份数据库到: $BACKUP_DIR${NC}"
    
    if command -v mongodump &> /dev/null; then
        mkdir -p "$BACKUP_DIR"
        mongodump --db cmax-selection --out "$BACKUP_DIR" 2>&1 | grep -v "writing"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ 数据库备份成功！${NC}"
            echo -e "${CYAN}  备份位置: $BACKUP_DIR${NC}"
        else
            echo -e "${RED}✗ 备份失败${NC}"
            read -p "是否继续迁移？(y/n): " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${YELLOW}已取消迁移${NC}"
                exit 0
            fi
        fi
    else
        echo -e "${YELLOW}⚠ 未找到 mongodump 命令，跳过备份${NC}"
    fi
    echo ""
fi

# 最终确认
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}准备开始迁移${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "迁移操作："
echo "  • 从旧字段读取价格 (base_price, pricing.base_price_normal 等)"
echo "  • 创建新的 price_tiers 阶梯定价结构"
echo "  • 自动生成批量折扣档位 (5%, 10%, 15%)"
echo "  • 提取手动操作装置和配件信息"
echo ""
echo -e "${GREEN}特性：${NC}"
echo "  • 幂等性 - 可重复运行，不会重复迁移"
echo "  • 安全性 - 只添加字段，不删除旧数据"
echo "  • 详细日志 - 显示每个文档的处理结果"
echo ""

read -p "确认开始迁移？(y/n): " -n 1 -r
echo ""
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}已取消迁移${NC}"
    exit 0
fi

# 执行迁移
echo -e "${GREEN}▶ 开始执行迁移...${NC}"
echo ""

node migration_price_tiers.js

EXIT_CODE=$?

echo ""

# 检查执行结果
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ 迁移成功完成！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "下一步建议："
    echo "  1. 验证迁移结果（查看上面的统计信息）"
    echo "  2. 测试 API 接口和前端功能"
    echo "  3. 查看详细文档: cat MIGRATION_GUIDE.md"
    echo ""
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ 迁移失败（退出码: $EXIT_CODE）${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "故障排除："
    echo "  1. 检查上面的错误信息"
    echo "  2. 确认数据库连接正常"
    echo "  3. 查看迁移指南: cat MIGRATION_GUIDE.md"
    echo "  4. 如有备份，可以恢复: mongorestore --db cmax-selection $BACKUP_DIR/cmax-selection"
    echo ""
    exit $EXIT_CODE
fi

