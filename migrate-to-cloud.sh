#!/bin/bash

###############################################################################
# 数据迁移脚本 - 本地到云端 MongoDB Atlas
# 用途：将本地 MongoDB 数据迁移到 MongoDB Atlas
# 使用：bash migrate-to-cloud.sh
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "          数据迁移工具 - 本地到云端"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 配置
DB_NAME="cmax"
BACKUP_DIR="./database_backups"

# MongoDB Atlas 连接字符串
CLOUD_URI="mongodb+srv://ningxiarongchen_db_user:LqedbEYN3diN44Z8@cluster0.6uan2lt.mongodb.net/cmax?retryWrites=true&w=majority"

echo "📋 步骤 1: 检查本地备份"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查是否有备份
if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
    echo "❌ 没有找到本地备份"
    echo ""
    echo "请先创建本地数据备份："
    echo "  bash backup-database.sh"
    exit 1
fi

# 列出所有备份
echo ""
echo "可用的备份:"
echo ""
ls -lt "$BACKUP_DIR" | grep "^d" | awk '{print "  " NR ". " $9}' 
echo ""

# 选择最新的备份
LATEST_BACKUP=$(ls -t "$BACKUP_DIR" | head -n 1)
echo "✅ 使用最新备份: $LATEST_BACKUP"

BACKUP_PATH="$BACKUP_DIR/$LATEST_BACKUP/$DB_NAME"

# 检查备份是否存在
if [ ! -d "$BACKUP_PATH" ]; then
    echo "❌ 备份路径不存在: $BACKUP_PATH"
    exit 1
fi

# 统计集合数量
COLLECTION_COUNT=$(ls -1 "$BACKUP_PATH"/*.bson 2>/dev/null | wc -l | tr -d ' ')
BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)

echo "  集合数: $COLLECTION_COUNT"
echo "  大小: $BACKUP_SIZE"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 步骤 2: 准备迁移到云端"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "目标数据库: MongoDB Atlas"
echo "数据库名: $DB_NAME"
echo "集群: cluster0.6uan2lt.mongodb.net"
echo ""

# 确认操作
read -p "⚠️  确认开始迁移？(yes/no): " CONFIRM
echo ""

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ 操作已取消"
    exit 0
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 步骤 3: 开始数据迁移"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 正在迁移数据到云端..."
echo "   这可能需要几分钟时间，请耐心等待..."
echo ""

# 执行迁移（使用 mongorestore 导入到 MongoDB Atlas）
mongorestore \
  --uri="$CLOUD_URI" \
  --drop \
  "$BACKUP_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ 数据迁移成功！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📊 迁移信息:"
    echo "  源: 本地 MongoDB"
    echo "  目标: MongoDB Atlas (香港节点)"
    echo "  数据库: $DB_NAME"
    echo "  集合数: $COLLECTION_COUNT"
    echo "  数据大小: $BACKUP_SIZE"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 步骤 4: 验证云端数据"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "现在可以："
    echo "  1. 访问 MongoDB Atlas 查看数据"
    echo "  2. 测试 Render 后端连接"
    echo "  3. 测试前端登录"
    echo ""
    echo "测试账号："
    echo "  管理员：13000000001 / password"
    echo "  销售经理：13000000002 / password"
    echo "  技术工程师：13000000003 / password"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 迁移完成！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ 数据迁移失败！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "可能的原因："
    echo "  1. MongoDB Atlas 连接失败"
    echo "  2. 网络连接问题"
    echo "  3. 权限配置问题"
    echo ""
    echo "解决方案："
    echo "  1. 检查 MongoDB Atlas Network Access (0.0.0.0/0)"
    echo "  2. 确认数据库用户权限"
    echo "  3. 检查连接字符串是否正确"
    exit 1
fi

echo ""

