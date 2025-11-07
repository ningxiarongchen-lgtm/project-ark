#!/bin/bash

# 安全地将本地数据上传到生产环境
# 使用 --noIndexRestore 避免索引冲突
# 使用 --drop 可选参数来控制是否覆盖

set -e

echo ""
echo "🚀 数据上传到生产环境"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查本地导出目录
EXPORT_DIR="local_data_export_20251107_153153"

if [ ! -d "$EXPORT_DIR" ]; then
    echo -e "${RED}❌ 错误: 找不到导出目录 $EXPORT_DIR${NC}"
    echo "请先运行数据导出命令"
    exit 1
fi

echo -e "${GREEN}✅ 找到本地数据导出目录${NC}"
echo ""

# 显示本地数据统计
echo "📊 本地数据统计："
echo "   - 执行器(actuators): 338个"
echo "   - 用户(users): 10个"
echo "   - 供应商(suppliers): 5个"
echo "   - 配件(accessories): 10个"
echo "   - 手动覆盖规则(manualoverrides): 18个"
echo "   - 项目(projects): 4个"
echo ""

# 提示用户输入生产环境MongoDB URI
echo -e "${YELLOW}⚠️  重要提示：${NC}"
echo "   - 此操作会将数据上传到生产环境"
echo "   - 建议先备份生产环境数据"
echo "   - 默认不会覆盖已存在的数据"
echo ""

read -p "请输入生产环境MongoDB URI: " PRODUCTION_URI

if [ -z "$PRODUCTION_URI" ]; then
    echo -e "${RED}❌ 错误: 未提供生产环境URI${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}选择上传模式：${NC}"
echo "1) 安全模式 - 只添加新数据，不覆盖已存在的数据（推荐）"
echo "2) 覆盖模式 - 删除生产环境数据并替换为本地数据（危险！）"
echo ""
read -p "请选择 (1 或 2): " MODE

echo ""

case $MODE in
    1)
        echo -e "${GREEN}✅ 使用安全模式${NC}"
        RESTORE_OPTIONS="--noIndexRestore"
        ;;
    2)
        echo -e "${RED}⚠️  使用覆盖模式${NC}"
        read -p "确认要覆盖生产环境数据？(输入 CONFIRM): " CONFIRM
        if [ "$CONFIRM" != "CONFIRM" ]; then
            echo "操作已取消"
            exit 0
        fi
        RESTORE_OPTIONS="--drop --noIndexRestore"
        ;;
    *)
        echo -e "${RED}❌ 无效的选择${NC}"
        exit 1
        ;;
esac

echo ""
read -p "最终确认：继续执行？(输入 YES): " FINAL_CONFIRM

if [ "$FINAL_CONFIRM" != "YES" ]; then
    echo "操作已取消"
    exit 0
fi

echo ""
echo "🔄 开始上传数据..."
echo ""

# 上传核心数据集合
COLLECTIONS=(
    "actuators"
    "manualoverrides"
    "accessories"
    "suppliers"
)

for collection in "${COLLECTIONS[@]}"; do
    echo "📤 上传 $collection..."
    
    if mongorestore --uri="$PRODUCTION_URI" \
        --nsInclude="cmax.$collection" \
        $RESTORE_OPTIONS \
        "$EXPORT_DIR"; then
        echo -e "${GREEN}✅ $collection 上传成功${NC}"
    else
        echo -e "${RED}❌ $collection 上传失败${NC}"
    fi
    echo ""
done

echo ""
echo "🎉 数据上传完成！"
echo ""
echo "📋 后续步骤："
echo "1. 登录生产环境验证数据"
echo "2. 检查执行器数据是否正确"
echo "3. 测试选型功能"
echo ""

