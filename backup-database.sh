#!/bin/bash

###############################################################################
# 数据库备份脚本
# 用途：备份 cmax 数据库到本地文件
# 使用：bash backup-database.sh
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "               数据库备份工具"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 配置
DB_NAME="cmax"
BACKUP_DIR="./database_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/cmax_backup_${TIMESTAMP}"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份数据库
echo "📦 开始备份数据库: $DB_NAME"
echo "📂 备份位置: $BACKUP_FILE"
echo ""

mongodump --db="$DB_NAME" --out="$BACKUP_FILE" --quiet

if [ $? -eq 0 ]; then
    echo "✅ 数据库备份成功！"
    echo ""
    echo "备份信息:"
    echo "  数据库: $DB_NAME"
    echo "  时间戳: $TIMESTAMP"
    echo "  位置: $BACKUP_FILE"
    
    # 统计备份大小
    BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
    echo "  大小: $BACKUP_SIZE"
    
    # 统计集合数量
    COLLECTION_COUNT=$(ls -1 "$BACKUP_FILE/$DB_NAME" | wc -l | tr -d ' ')
    echo "  集合数: $COLLECTION_COUNT"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "恢复命令:"
    echo "  mongorestore --db=$DB_NAME --drop $BACKUP_FILE/$DB_NAME"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 保留最近的5个备份
    echo ""
    echo "🗑️  清理旧备份（保留最近5个）..."
    cd "$BACKUP_DIR"
    ls -t | tail -n +6 | xargs -I {} rm -rf {}
    
    REMAINING_BACKUPS=$(ls -1 | wc -l | tr -d ' ')
    echo "✅ 当前保留 $REMAINING_BACKUPS 个备份"
    
else
    echo "❌ 数据库备份失败！"
    echo "请检查 MongoDB 是否正在运行"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "               备份完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

