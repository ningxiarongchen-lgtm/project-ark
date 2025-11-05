#!/bin/bash

# Cloudflare Pages 自动部署脚本
# 用途：推送代码后自动构建并部署到Cloudflare Pages

echo "🚀 开始部署到 Cloudflare Pages..."
echo ""

# 1. 进入前端目录
cd "$(dirname "$0")/frontend" || exit 1

# 2. 构建前端
echo "📦 正在构建前端..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建成功"
echo ""

# 3. 部署到 Cloudflare Pages
echo "☁️  正在部署到 Cloudflare Pages..."
wrangler pages deploy dist --project-name=smart-system --commit-message="Update: Multi-file upload optimization"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 部署成功！"
    echo ""
    echo "🌐 访问地址："
    echo "   主地址：https://smart-system.pages.dev"
    echo "   最新部署：查看上方输出的URL"
    echo ""
else
    echo "❌ 部署失败"
    exit 1
fi

