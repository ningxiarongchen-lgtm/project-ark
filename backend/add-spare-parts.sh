#!/bin/bash

# 为执行器添加备件维修包数据
# 使用方法: ./add-spare-parts.sh

echo "=========================================="
echo "为执行器添加备件维修包数据"
echo "=========================================="
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到Node.js"
    echo "请先安装Node.js: https://nodejs.org/"
    exit 1
fi

# 检查是否在backend目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在backend目录下运行此脚本"
    echo "运行: cd backend && ./add-spare-parts.sh"
    exit 1
fi

# 检查数据库连接配置
if [ ! -f ".env" ]; then
    echo "⚠️  警告：未找到.env文件"
    echo "将使用默认连接: mongodb://localhost:27017/cmax"
fi

# 运行脚本
echo "🚀 开始添加备件数据..."
echo ""

node add-spare-parts-data.js

echo ""
echo "✅ 完成！"
echo ""
echo "📝 提示："
echo "   - 如果要查看结果，请重启后端服务"
echo "   - 在智慧选型页面进行选型，即可看到备件信息"
echo ""

