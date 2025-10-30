#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════════════╗
# ║            启动测试环境 - Start Test Environment                             ║
# ╚═══════════════════════════════════════════════════════════════════════════════╝

echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    启动 C-MAX 测试环境                                        ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# 检查是否在项目根目录
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 步骤 1: 检查端口
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "📋 步骤 1/4: 检查端口占用..."

# 检查后端端口 5001
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口 5001 已被占用"
    echo "   正在尝试停止旧的后端进程..."
    PID=$(lsof -ti:5001)
    if [ ! -z "$PID" ]; then
        kill -9 $PID 2>/dev/null
        sleep 2
        echo "   ✅ 旧进程已停止"
    fi
fi

# 检查前端端口 5173
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口 5173 已被占用"
    echo "   正在尝试停止旧的前端进程..."
    PID=$(lsof -ti:5173)
    if [ ! -z "$PID" ]; then
        kill -9 $PID 2>/dev/null
        sleep 2
        echo "   ✅ 旧进程已停止"
    fi
fi

echo "✅ 端口检查完成"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 步骤 2: 启动测试环境后端
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "📋 步骤 2/4: 启动测试环境后端..."

cd backend

# 创建后端日志文件
BACKEND_LOG="test_backend.log"
rm -f $BACKEND_LOG

# 启动后端（测试环境）
NODE_ENV=test npm start > $BACKEND_LOG 2>&1 &
BACKEND_PID=$!

echo "   后端进程 PID: $BACKEND_PID"
echo "   日志文件: backend/$BACKEND_LOG"

# 等待后端启动
echo "   等待后端启动..."
sleep 5

# 检查后端是否成功启动
if curl -s http://localhost:5001/api/health >/dev/null 2>&1; then
    echo "   ✅ 后端启动成功"
    
    # 检查测试路由是否可用
    if curl -s http://localhost:5001/api/testing/status >/dev/null 2>&1; then
        echo "   ✅ 测试路由已加载"
    else
        echo "   ⚠️  测试路由未加载（可能需要等待几秒）"
    fi
else
    echo "   ❌ 后端启动失败"
    echo "   请查看日志: backend/$BACKEND_LOG"
    exit 1
fi

cd ..
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 步骤 3: 启动前端开发服务器
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "📋 步骤 3/4: 启动前端开发服务器..."

cd frontend

# 创建前端日志文件
FRONTEND_LOG="test_frontend.log"
rm -f $FRONTEND_LOG

# 启动前端
npm run dev > $FRONTEND_LOG 2>&1 &
FRONTEND_PID=$!

echo "   前端进程 PID: $FRONTEND_PID"
echo "   日志文件: frontend/$FRONTEND_LOG"

# 等待前端启动
echo "   等待前端启动..."
sleep 8

# 检查前端是否成功启动
if curl -s http://localhost:5173 >/dev/null 2>&1; then
    echo "   ✅ 前端启动成功"
else
    echo "   ⚠️  前端可能还在启动中..."
fi

cd ..
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 步骤 4: 验证测试环境
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "📋 步骤 4/4: 验证测试环境..."

# 测试后端健康检查
echo "   测试后端健康检查..."
HEALTH=$(curl -s http://localhost:5001/api/health)
if echo $HEALTH | grep -q "OK"; then
    echo "   ✅ 后端健康检查通过"
else
    echo "   ❌ 后端健康检查失败"
fi

# 测试测试API
echo "   测试测试API..."
STATUS=$(curl -s http://localhost:5001/api/testing/status)
if echo $STATUS | grep -q "success"; then
    echo "   ✅ 测试API可用"
else
    echo "   ❌ 测试API不可用"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 完成
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    测试环境启动完成！ 🎉                                      ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 环境信息："
echo "   后端: http://localhost:5001 (测试环境)"
echo "   前端: http://localhost:5173"
echo "   测试API: http://localhost:5001/api/testing"
echo ""
echo "📋 进程信息："
echo "   后端 PID: $BACKEND_PID"
echo "   前端 PID: $FRONTEND_PID"
echo ""
echo "📝 日志文件："
echo "   后端日志: backend/test_backend.log"
echo "   前端日志: frontend/test_frontend.log"
echo ""
echo "🚀 下一步："
echo "   1. 运行自动化测试："
echo "      cd frontend && npx cypress run --spec \"cypress/e2e/final_acceptance_test.cy.js\""
echo ""
echo "   2. 或打开 Cypress GUI："
echo "      cd frontend && npx cypress open"
echo ""
echo "⏹️  停止测试环境："
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "   或运行: bash STOP_TEST_ENVIRONMENT.sh"
echo ""

# 保存 PID 到文件，方便后续停止
echo "$BACKEND_PID" > .test_backend_pid
echo "$FRONTEND_PID" > .test_frontend_pid

# 保持脚本运行，显示实时日志
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "按 Ctrl+C 停止查看日志（服务将继续在后台运行）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 等待用户中断或持续显示日志
tail -f backend/$BACKEND_LOG

