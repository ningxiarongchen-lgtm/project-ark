#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════════════╗
# ║            停止测试环境 - Stop Test Environment                              ║
# ╚═══════════════════════════════════════════════════════════════════════════════╝

echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    停止 C-MAX 测试环境                                        ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# 读取保存的 PID
if [ -f ".test_backend_pid" ]; then
    BACKEND_PID=$(cat .test_backend_pid)
    echo "📍 停止后端进程 (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    rm -f .test_backend_pid
    echo "   ✅ 后端已停止"
fi

if [ -f ".test_frontend_pid" ]; then
    FRONTEND_PID=$(cat .test_frontend_pid)
    echo "📍 停止前端进程 (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null
    rm -f .test_frontend_pid
    echo "   ✅ 前端已停止"
fi

# 额外检查端口占用
echo ""
echo "📋 检查端口占用..."

if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口 5001 仍被占用，强制停止..."
    kill -9 $(lsof -ti:5001) 2>/dev/null
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口 5173 仍被占用，强制停止..."
    kill -9 $(lsof -ti:5173) 2>/dev/null
fi

echo ""
echo "✅ 测试环境已完全停止"
echo ""

