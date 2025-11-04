#!/bin/bash

# 🔧 七牛云MIME类型修复脚本
# 解决手机浏览器显示乱码问题

echo "========================================="
echo "🔧 七牛云MIME类型修复工具"
echo "========================================="
echo ""

# 配置信息
BUCKET="smart-system"

# 检查qshell是否安装
if ! command -v qshell &> /dev/null; then
    echo "❌ 错误：qshell未安装"
    echo ""
    echo "请先安装qshell："
    echo ""
    echo "Mac用户："
    echo "  wget http://devtools.qiniu.com/qshell-darwin-amd64"
    echo "  mv qshell-darwin-amd64 qshell"
    echo "  chmod +x qshell"
    echo "  sudo mv qshell /usr/local/bin/"
    echo ""
    echo "或使用Homebrew："
    echo "  brew install qshell"
    echo ""
    exit 1
fi

echo "✅ qshell已安装"
echo ""

# 提示输入AccessKey和SecretKey
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 步骤1: 配置七牛云账号"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "获取密钥："
echo "  1. 访问: https://portal.qiniu.com"
echo "  2. 点击右上角头像 → 密钥管理"
echo "  3. 复制 AccessKey 和 SecretKey"
echo ""

read -p "请输入AccessKey: " ACCESS_KEY
read -p "请输入SecretKey: " SECRET_KEY

# 配置账号
echo ""
echo "正在配置账号..."
qshell account "$ACCESS_KEY" "$SECRET_KEY" qiniu

if [ $? -ne 0 ]; then
    echo "❌ 账号配置失败，请检查AccessKey和SecretKey是否正确"
    exit 1
fi

echo "✅ 账号配置成功"
echo ""

# 修复MIME类型
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 步骤2: 修复文件MIME类型"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 创建临时文件列表
TEMP_FILE="/tmp/qiniu_files_$$.txt"
qshell listbucket "$BUCKET" "" "" "" > "$TEMP_FILE"

# 修复index.html
echo "修复: index.html"
qshell chgm "$BUCKET" "index.html" "text/html; charset=utf-8" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "  ✅ 成功"
else
    echo "  ⚠️  文件可能不存在或已修复"
fi

# 修复所有HTML文件
echo ""
echo "正在修复HTML文件..."
grep "\.html$" "$TEMP_FILE" | while read file; do
    if [ "$file" != "index.html" ]; then
        echo "  修复: $file"
        qshell chgm "$BUCKET" "$file" "text/html; charset=utf-8" 2>/dev/null
    fi
done

# 修复所有JS文件
echo ""
echo "正在修复JavaScript文件..."
grep "\.js$" "$TEMP_FILE" | head -5 | while read file; do
    echo "  修复: $file"
    qshell chgm "$BUCKET" "$file" "application/javascript; charset=utf-8" 2>/dev/null
done

# 修复所有CSS文件
echo ""
echo "正在修复CSS文件..."
grep "\.css$" "$TEMP_FILE" | head -5 | while read file; do
    echo "  修复: $file"
    qshell chgm "$BUCKET" "$file" "text/css; charset=utf-8" 2>/dev/null
done

# 清理临时文件
rm -f "$TEMP_FILE"

echo ""
echo "✅ MIME类型修复完成！"
echo ""

# 刷新CDN缓存
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 步骤3: 刷新CDN缓存"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "请输入你的七牛云域名（例如：http://xxxxx.bkt.clouddn.com）: " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "⚠️  未输入域名，跳过CDN刷新"
    echo "   请手动在七牛云控制台刷新CDN缓存"
else
    # 创建刷新URL列表
    echo "$DOMAIN/" > /tmp/cdn_urls.txt
    echo "$DOMAIN/index.html" >> /tmp/cdn_urls.txt
    
    echo "正在刷新CDN缓存..."
    qshell cdnrefresh -i /tmp/cdn_urls.txt
    
    if [ $? -eq 0 ]; then
        echo "✅ CDN缓存刷新成功"
    else
        echo "⚠️  CDN刷新失败，请手动在控制台刷新"
    fi
    
    rm -f /tmp/cdn_urls.txt
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 修复完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 测试步骤："
echo "  1. 等待30秒让CDN缓存生效"
echo "  2. 清除手机浏览器缓存"
echo "  3. 访问: $DOMAIN/index.html"
echo ""
echo "✨ 如果还有乱码，请执行："
echo "  1. 清除手机浏览器缓存和Cookie"
echo "  2. 等待5分钟"
echo "  3. 重新访问"
echo ""
echo "📞 需要帮助？查看详细文档："
echo "  🔧七牛云乱码问题-终极解决方案.md"
echo ""

