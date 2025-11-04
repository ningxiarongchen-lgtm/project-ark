#!/bin/bash

# 🔍 七牛云编码问题诊断工具

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 七牛云编码问题诊断工具"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 获取用户输入
read -p "请输入你的七牛云网址（例如：http://xxxxx.bkt.clouddn.com/index.html）: " URL

if [ -z "$URL" ]; then
    echo "❌ 错误：请输入网址"
    exit 1
fi

echo ""
echo "正在检测: $URL"
echo ""

# 检查1：URL是否可访问
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 检查1: URL可访问性"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 成功：HTTP状态码 200"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ 失败：HTTP状态码 404 - 文件不存在"
    echo ""
    echo "📝 解决方案："
    echo "  1. 检查文件是否已上传到七牛云"
    echo "  2. 检查URL路径是否正确"
    echo "  3. 检查文件名大小写"
    exit 1
elif [ "$HTTP_CODE" = "403" ]; then
    echo "❌ 失败：HTTP状态码 403 - 访问被拒绝"
    echo ""
    echo "📝 解决方案："
    echo "  1. 检查存储空间是否设置为'公开'"
    echo "  2. 在七牛云控制台修改访问控制"
    exit 1
else
    echo "⚠️  警告：HTTP状态码 $HTTP_CODE"
fi

echo ""

# 检查2：Content-Type响应头
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 检查2: Content-Type响应头"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CONTENT_TYPE=$(curl -s -I "$URL" | grep -i "Content-Type" | cut -d' ' -f2- | tr -d '\r\n')

echo "当前Content-Type: $CONTENT_TYPE"

if [[ "$CONTENT_TYPE" == *"charset=utf-8"* ]]; then
    echo "✅ 正确：包含 charset=utf-8"
    HAS_CHARSET=true
else
    echo "❌ 错误：缺少 charset=utf-8"
    echo ""
    echo "这就是乱码的原因！"
    HAS_CHARSET=false
fi

# 检查文件类型
if [[ "$URL" == *.html ]] || [[ "$URL" == */ ]]; then
    EXPECTED_TYPE="text/html; charset=utf-8"
elif [[ "$URL" == *.js ]]; then
    EXPECTED_TYPE="application/javascript; charset=utf-8"
elif [[ "$URL" == *.css ]]; then
    EXPECTED_TYPE="text/css; charset=utf-8"
else
    EXPECTED_TYPE="未知"
fi

if [ "$EXPECTED_TYPE" != "未知" ]; then
    echo "期望Content-Type: $EXPECTED_TYPE"
fi

echo ""

# 检查3：Cache-Control
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 检查3: 缓存设置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CACHE_CONTROL=$(curl -s -I "$URL" | grep -i "Cache-Control" | cut -d' ' -f2- | tr -d '\r\n')

if [ -z "$CACHE_CONTROL" ]; then
    echo "⚠️  未设置Cache-Control"
else
    echo "Cache-Control: $CACHE_CONTROL"
fi

echo ""

# 检查4：完整响应头
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 检查4: 完整响应头"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

curl -s -I "$URL" | head -20

echo ""

# 总结和建议
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 诊断总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$HTTP_CODE" = "200" ] && [ "$HAS_CHARSET" = true ]; then
    echo "🎉 恭喜！配置完全正确！"
    echo ""
    echo "如果手机还是显示乱码："
    echo "  1. 清除手机浏览器缓存"
    echo "  2. 等待5分钟让CDN缓存生效"
    echo "  3. 使用无痕模式访问"
    echo ""
elif [ "$HTTP_CODE" = "200" ] && [ "$HAS_CHARSET" = false ]; then
    echo "❌ 发现问题：缺少字符编码设置"
    echo ""
    echo "📝 修复步骤："
    echo ""
    echo "方法1 - 七牛云控制台（最简单）："
    echo "  1. 访问: https://portal.qiniu.com"
    echo "  2. 对象存储 → 你的空间 → 空间设置"
    echo "  3. 自定义响应头配置 → 添加响应头"
    echo "  4. 添加："
    echo "     名称: Content-Type"
    echo "     值: $EXPECTED_TYPE"
    echo "     文件: ${URL##*/}"
    echo "  5. CDN → 刷新预热 → 刷新URL"
    echo ""
    echo "方法2 - 使用修复脚本："
    echo "  cd \"/Users/hexiaoxiao/Desktop/Model Selection System\""
    echo "  ./fix-qiniu-mime.sh"
    echo ""
    echo "详细教程："
    echo "  查看文件：⚡手机乱码-3分钟解决.md"
    echo ""
else
    echo "⚠️  发现其他问题"
    echo ""
    echo "请检查："
    echo "  1. 文件是否已上传"
    echo "  2. 存储空间是否公开"
    echo "  3. URL是否正确"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

