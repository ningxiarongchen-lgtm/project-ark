#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════════════╗
# ║                   Project Ark 停止演示环境脚本                                 ║
# ║                Stop Demo Environment Script                                   ║
# ╚═══════════════════════════════════════════════════════════════════════════════╝

echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    停止 Project Ark 演示环境                                  ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 颜色定义
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

STOPPED_COUNT=0

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 方法1: 从 PID 文件停止
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}📋 尝试从 PID 文件停止进程...${NC}"

# 停止后端
if [ -f ".demo_backend_pid" ]; then
    BACKEND_PID=$(cat .demo_backend_pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "   停止后端进程 (PID: $BACKEND_PID)..."
        kill -15 $BACKEND_PID 2>/dev/null || kill -9 $BACKEND_PID 2>/dev/null
        sleep 1
        if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ 后端进程已停止${NC}"
            STOPPED_COUNT=$((STOPPED_COUNT+1))
        fi
    fi
    rm -f .demo_backend_pid
fi

# 停止前端
if [ -f ".demo_frontend_pid" ]; then
    FRONTEND_PID=$(cat .demo_frontend_pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "   停止前端进程 (PID: $FRONTEND_PID)..."
        kill -15 $FRONTEND_PID 2>/dev/null || kill -9 $FRONTEND_PID 2>/dev/null
        sleep 1
        if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo -e "${GREEN}   ✅ 前端进程已停止${NC}"
            STOPPED_COUNT=$((STOPPED_COUNT+1))
        fi
    fi
    rm -f .demo_frontend_pid
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 方法2: 通过端口强制停止
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}📋 检查端口占用并清理...${NC}"

# 停止 5001 端口（后端）
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   发现端口 5001 被占用，正在强制停止..."
    PID=$(lsof -ti:5001)
    if [ ! -z "$PID" ]; then
        kill -9 $PID 2>/dev/null
        sleep 1
        echo -e "${GREEN}   ✅ 端口 5001 已释放${NC}"
        STOPPED_COUNT=$((STOPPED_COUNT+1))
    fi
else
    echo -e "${GREEN}   ✅ 端口 5001 未被占用${NC}"
fi

# 停止 5173 端口（前端）
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   发现端口 5173 被占用，正在强制停止..."
    PID=$(lsof -ti:5173)
    if [ ! -z "$PID" ]; then
        kill -9 $PID 2>/dev/null
        sleep 1
        echo -e "${GREEN}   ✅ 端口 5173 已释放${NC}"
        STOPPED_COUNT=$((STOPPED_COUNT+1))
    fi
else
    echo -e "${GREEN}   ✅ 端口 5173 未被占用${NC}"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 清理临时文件
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}📋 清理临时文件...${NC}"

rm -f .demo_backend_pid
rm -f .demo_frontend_pid
rm -f .demo_start_time
rm -f .test_backend_pid
rm -f .test_frontend_pid

echo -e "${GREEN}   ✅ 临时文件已清理${NC}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 显示日志文件位置
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}📝 演示日志文件保留在：${NC}"
if [ -f "backend/demo_backend.log" ]; then
    LOG_SIZE=$(du -h backend/demo_backend.log | cut -f1)
    echo "   backend/demo_backend.log (大小: $LOG_SIZE)"
fi
if [ -f "frontend/demo_frontend.log" ]; then
    LOG_SIZE=$(du -h frontend/demo_frontend.log | cut -f1)
    echo "   frontend/demo_frontend.log (大小: $LOG_SIZE)"
fi
echo ""
echo -e "${YELLOW}   提示：如需清理日志，可运行：${NC}"
echo "   rm -f backend/demo_backend.log frontend/demo_frontend.log"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 最终状态
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    演示环境已停止 ✅                                          ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""

if [ $STOPPED_COUNT -gt 0 ]; then
    echo -e "${GREEN}✅ 成功停止 $STOPPED_COUNT 个进程${NC}"
else
    echo -e "${YELLOW}⚠️  未发现运行中的演示环境进程${NC}"
fi

echo ""
echo -e "${BLUE}🔄 重新启动演示环境：${NC}"
echo -e "   ${GREEN}bash 演示环境启动.sh${NC}"
echo ""

