#!/bin/bash

echo "🔄 正在重启前端开发服务器..."
echo ""

# 停止演示环境
echo "📛 停止当前服务..."
./STOP_TEST_ENVIRONMENT.sh

# 等待进程完全停止
sleep 2

# 清理缓存
echo "🧹 清理缓存..."
cd frontend
rm -rf .vite 2>/dev/null
cd ..

# 重新启动
echo "🚀 重新启动服务..."
./演示环境启动.sh

echo ""
echo "✅ 完成！"
echo ""
echo "📌 请在浏览器中："
echo "   1. 访问 http://localhost:5173"
echo "   2. 使用销售经理账号登录："
echo "      用户名: 13000000002"
echo "      密码: password"
echo "   3. 按 Cmd+Shift+R 强制刷新页面"
echo ""

