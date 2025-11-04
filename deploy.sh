#!/bin/bash

# 🚀 一键部署脚本 - Git提交 + Cloudflare Pages部署
# 用法: ./deploy.sh "提交说明"
# 示例: ./deploy.sh "修复Dashboard统计问题"

# 获取提交说明
COMMIT_MSG="${1:-"update: 更新代码"}"

echo "🚀 开始一键部署流程..."
echo "📝 提交说明: $COMMIT_MSG"
echo ""

# 1. Git提交
echo "📦 Step 1/3: 提交代码到Git..."
git add .

if [ -n "$(git status --porcelain)" ]; then
    git commit -m "$COMMIT_MSG"
    if [ $? -ne 0 ]; then
        echo "❌ Git提交失败"
        exit 1
    fi
    echo "✅ 代码已提交"
else
    echo "ℹ️  没有新的更改需要提交"
fi

echo ""

# 2. Git推送
echo "☁️  Step 2/3: 推送到GitHub..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ 推送失败"
    exit 1
fi

echo "✅ 已推送到GitHub"
echo ""

# 3. 构建并部署到Cloudflare Pages
echo "🏗️  Step 3/3: 构建并部署到Cloudflare Pages..."
cd frontend || exit 1

echo "   📦 正在构建前端..."
npm run build > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    npm run build
    exit 1
fi

echo "   ✅ 构建完成"
echo ""
echo "   ☁️  正在部署到Cloudflare Pages..."

wrangler pages deploy dist --project-name=smart-system --commit-dirty=true

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ 部署成功！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🌐 访问地址："
    echo "   主地址: https://smart-system.pages.dev"
    echo "   预览地址: 查看上方输出的URL"
    echo ""
    echo "💡 提示: 等待2-3分钟后强制刷新浏览器 (Cmd+Shift+R)"
    echo ""
else
    echo "❌ 部署失败"
    exit 1
fi

