#!/bin/bash

###############################################################################
# 数据库恢复脚本
# 用途：从备份文件恢复 cmax 数据库
# 使用：bash restore-database.sh [备份目录]
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "               数据库恢复工具"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

DB_NAME="cmax"
BACKUP_DIR="./database_backups"

# 如果提供了参数，使用参数作为备份目录
if [ ! -z "$1" ]; then
    RESTORE_PATH="$1"
else
    # 列出所有备份
    echo "📋 可用的备份:"
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        echo "❌ 没有找到备份文件"
        echo "请先运行 bash backup-database.sh 创建备份"
        exit 1
    fi
    
    ls -lt "$BACKUP_DIR" | grep "^d" | awk '{print "  " $9}' | nl
    
    echo ""
    echo "请选择要恢复的备份编号（或按 Ctrl+C 取消）:"
    read -p "编号: " BACKUP_NUM
    
    BACKUP_NAME=$(ls -t "$BACKUP_DIR" | sed -n "${BACKUP_NUM}p")
    
    if [ -z "$BACKUP_NAME" ]; then
        echo "❌ 无效的备份编号"
        exit 1
    fi
    
    RESTORE_PATH="$BACKUP_DIR/$BACKUP_NAME"
fi

# 确认恢复操作
echo ""
echo "⚠️  警告：此操作将覆盖当前数据库！"
echo "恢复路径: $RESTORE_PATH"
echo ""
read -p "确认恢复？(yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ 操作已取消"
    exit 0
fi

# 执行恢复
echo ""
echo "📦 开始恢复数据库..."
echo ""

mongorestore --db="$DB_NAME" --drop "$RESTORE_PATH/$DB_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 数据库恢复成功！"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "               恢复完成"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo ""
    echo "❌ 数据库恢复失败！"
    echo "请检查备份文件是否完整"
    exit 1
fi

