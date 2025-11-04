#!/bin/bash
echo "🔍 测试手机访问速度..."
echo ""
echo "📱 新前端地址:"
echo "   https://d7050e9f.smart-system.pages.dev"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试后端响应速度..."
echo ""

START=$(date +%s.%N)
RESPONSE=$(curl -s "https://project-ark-efy7.onrender.com/api/health")
END=$(date +%s.%N)
TIME=$(echo "$END - $START" | bc)

echo "后端响应时间: ${TIME} 秒"
echo ""

if (( $(echo "$TIME < 5" | bc -l) )); then
    echo "✅ 响应速度: 优秀（后端保持清醒）"
    echo "✅ UptimeRobot: 正常工作"
    echo ""
    echo "现在用手机访问应该很快！"
elif (( $(echo "$TIME < 30" | bc -l) )); then
    echo "⚠️  响应速度: 一般（后端可能刚唤醒）"
    echo "建议: 等待5-10分钟，让UptimeRobot工作几个周期"
else
    echo "❌ 响应速度: 慢（后端休眠或UptimeRobot未配置）"
    echo "请检查: UptimeRobot是否已配置"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
