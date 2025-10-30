#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════════════╗
# ║                   Project Ark 演示环境启动脚本                                 ║
# ║                Demo Environment Setup Script                                  ║
# ╚═══════════════════════════════════════════════════════════════════════════════╝

set -e  # 遇到错误立即退出

echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    Project Ark 演示环境启动                                   ║"
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

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 步骤 0: 环境检查
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}📋 步骤 0/7: 环境检查...${NC}"

# 检查是否在项目根目录
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ 错误：请在项目根目录运行此脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}   提示：可以运行 'bash 演示前验证.sh' 进行完整检查${NC}"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误：未安装 Node.js${NC}"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}   ✅ Node.js 版本: $(node -v)${NC}"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ 错误：未安装 npm${NC}"
    exit 1
fi
echo -e "${GREEN}   ✅ npm 版本: $(npm -v)${NC}"

# 检查 MongoDB
if ! command -v mongod &> /dev/null; then
    echo -e "${YELLOW}⚠️  警告：未检测到 MongoDB${NC}"
    echo "   尝试启动 MongoDB 服务..."
fi

# 启动 MongoDB（如果未运行）
if ! pgrep -x "mongod" > /dev/null; then
    echo "   启动 MongoDB..."
    brew services start mongodb-community 2>/dev/null || {
        echo -e "${YELLOW}   ⚠️  无法通过 brew 启动 MongoDB${NC}"
        echo "   请手动启动 MongoDB 或运行: ./安装MongoDB.sh"
    }
    sleep 3
fi

# 验证 MongoDB 连接
if nc -z localhost 27017 2>/dev/null; then
    echo -e "${GREEN}   ✅ MongoDB 运行在 27017 端口${NC}"
else
    echo -e "${RED}❌ 错误：无法连接到 MongoDB (localhost:27017)${NC}"
    echo "请确保 MongoDB 已启动"
    exit 1
fi

# 检查后端依赖
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  警告：后端依赖未安装${NC}"
    echo "   正在安装后端依赖..."
    cd backend
    npm install
    cd ..
fi
echo -e "${GREEN}   ✅ 后端依赖已安装${NC}"

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  警告：前端依赖未安装${NC}"
    echo "   正在安装前端依赖..."
    cd frontend
    npm install
    cd ..
fi
echo -e "${GREEN}   ✅ 前端依赖已安装${NC}"

echo ""

# 检查关键文件
echo ""
echo -e "${BLUE}检查关键文件...${NC}"
if [ ! -f "backend/templates/product_import_template.csv" ]; then
    echo -e "${YELLOW}   ⚠️  产品导入模板文件不存在，部分功能可能不可用${NC}"
fi

if [ -f "frontend/src/pages/ProductImport.jsx" ]; then
    echo -e "${GREEN}   ✅ 产品导入页面组件已就绪${NC}"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 步骤 1: 清理旧进程和端口
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}📋 步骤 1/7: 清理旧进程和端口...${NC}"

# 停止旧的后端进程（5001端口）
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}   ⚠️  端口 5001 已被占用，正在停止旧进程...${NC}"
    PID=$(lsof -ti:5001)
    if [ ! -z "$PID" ]; then
        kill -9 $PID 2>/dev/null
        sleep 2
        echo -e "${GREEN}   ✅ 已停止端口 5001 的进程${NC}"
    fi
fi

# 停止旧的前端进程（5173端口）
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}   ⚠️  端口 5173 已被占用，正在停止旧进程...${NC}"
    PID=$(lsof -ti:5173)
    if [ ! -z "$PID" ]; then
        kill -9 $PID 2>/dev/null
        sleep 2
        echo -e "${GREEN}   ✅ 已停止端口 5173 的进程${NC}"
    fi
fi

# 清理旧的日志文件
rm -f backend/test_backend.log
rm -f frontend/test_frontend.log
rm -f .test_backend_pid
rm -f .test_frontend_pid

echo -e "${GREEN}✅ 端口清理完成${NC}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 步骤 2: 初始化演示数据
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}📋 步骤 2/7: 初始化演示数据...${NC}"
echo -e "${YELLOW}   这将清空现有数据并创建测试数据...${NC}"

cd backend

# 运行数据初始化脚本
if npm run seed:final; then
    echo -e "${GREEN}   ✅ 演示数据初始化成功${NC}"
else
    echo -e "${RED}   ❌ 数据初始化失败${NC}"
    echo "   请检查 MongoDB 连接和日志"
    cd ..
    exit 1
fi

cd ..
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 步骤 3: 启动后端服务器
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}📋 步骤 3/7: 启动后端服务器...${NC}"

cd backend

# 创建后端日志文件
BACKEND_LOG="demo_backend.log"
rm -f $BACKEND_LOG

# 设置环境变量并启动后端
MONGODB_URI=mongodb://localhost:27017/cmax NODE_ENV=development npm start > $BACKEND_LOG 2>&1 &
BACKEND_PID=$!

echo -e "${GREEN}   后端进程 PID: $BACKEND_PID${NC}"
echo "   日志文件: backend/$BACKEND_LOG"

# 等待后端启动
echo "   等待后端启动..."
RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:5001/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}   ✅ 后端启动成功 (耗时: ${RETRY_COUNT}秒)${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    sleep 1
    echo -n "."
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}   ❌ 后端启动超时${NC}"
    echo "   请查看日志: backend/$BACKEND_LOG"
    cd ..
    exit 1
fi

cd ..
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 步骤 4: 启动前端服务器
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}📋 步骤 4/7: 启动前端服务器...${NC}"

cd frontend

# 创建前端日志文件
FRONTEND_LOG="demo_frontend.log"
rm -f $FRONTEND_LOG

# 启动前端
npm run dev > $FRONTEND_LOG 2>&1 &
FRONTEND_PID=$!

echo -e "${GREEN}   前端进程 PID: $FRONTEND_PID${NC}"
echo "   日志文件: frontend/$FRONTEND_LOG"

# 等待前端启动
echo "   等待前端启动..."
RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        echo -e "${GREEN}   ✅ 前端启动成功 (耗时: ${RETRY_COUNT}秒)${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    sleep 1
    echo -n "."
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${YELLOW}   ⚠️  前端启动可能需要更多时间，请手动检查${NC}"
fi

cd ..
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 步骤 5: 验证系统状态
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}📋 步骤 5/7: 验证系统状态...${NC}"

# 测试后端健康检查
echo "   测试后端健康检查..."
HEALTH=$(curl -s http://localhost:5001/api/health)
if echo $HEALTH | grep -q "OK"; then
    echo -e "${GREEN}   ✅ 后端健康检查通过${NC}"
else
    echo -e "${RED}   ❌ 后端健康检查失败${NC}"
fi

# 测试数据库连接
echo "   验证测试用户..."
USER_COUNT=$(curl -s "http://localhost:5001/api/auth/check-users" | grep -o "count" | wc -l)
if [ $USER_COUNT -gt 0 ]; then
    echo -e "${GREEN}   ✅ 测试用户已就绪${NC}"
else
    echo -e "${YELLOW}   ⚠️  无法验证测试用户（可能是接口不存在）${NC}"
fi

# 测试前端页面
echo "   测试前端页面..."
if curl -s http://localhost:5173 | grep -q "<!doctype html>"; then
    echo -e "${GREEN}   ✅ 前端页面响应正常${NC}"
else
    echo -e "${YELLOW}   ⚠️  前端页面可能还在加载${NC}"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 步骤 6: 验证新功能
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}📋 步骤 6/7: 验证新功能...${NC}"

# 检查产品导入模板文件可访问性
echo "   验证产品导入模板..."
if curl -s http://localhost:5001/templates/product_import_template.csv | head -n 1 | grep -q "modelNumber"; then
    echo -e "${GREEN}   ✅ 产品导入模板文件可访问${NC}"
else
    echo -e "${YELLOW}   ⚠️  无法访问产品导入模板文件${NC}"
fi

# 检查产品导入API端点
echo "   验证产品导入API端点..."
IMPORT_ROUTE=$(curl -s http://localhost:5001/api/products/import 2>&1)
if echo "$IMPORT_ROUTE" | grep -q "Unauthorized\|No token provided\|请上传"; then
    echo -e "${GREEN}   ✅ 产品导入API端点已就绪${NC}"
else
    echo -e "${YELLOW}   ⚠️  产品导入API端点可能未配置${NC}"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 步骤 7: 显示演示信息
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    演示环境启动完成！ 🎉                                      ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}📊 系统访问地址：${NC}"
echo -e "   ${GREEN}前端界面: http://localhost:5173${NC}"
echo -e "   ${GREEN}后端API:  http://localhost:5001${NC}"
echo -e "   ${GREEN}API文档:  http://localhost:5001/api/health${NC}"
echo ""
echo -e "${BLUE}📋 进程信息：${NC}"
echo "   后端 PID: $BACKEND_PID"
echo "   前端 PID: $FRONTEND_PID"
echo ""
echo -e "${BLUE}📝 日志文件：${NC}"
echo "   后端日志: backend/demo_backend.log"
echo "   前端日志: frontend/demo_frontend.log"
echo ""
echo -e "${BLUE}👥 测试账号：${NC}"
echo "   ┌─────────────────┬──────────────┬──────────┬──────────────────┐"
echo "   │ 角色            │ 手机号       │ 密码     │ 用途             │"
echo "   ├─────────────────┼──────────────┼──────────┼──────────────────┤"
echo "   │ 系统管理员      │ 13000000001  │ password │ 系统管理         │"
echo "   │ 销售经理        │ 13000000002  │ password │ 项目创建、赢单   │"
echo "   │ 技术工程师      │ 13000000003  │ password │ 技术选型         │"
echo "   │ 商务工程师      │ 13000000004  │ password │ 报价、合同       │"
echo "   │ 采购专员        │ 13000000005  │ password │ 采购管理         │"
echo "   │ 生产计划员      │ 13000000006  │ password │ 生产排产         │"
echo "   │ 质检员          │ 13000000007  │ password │ 质量检验         │"
echo "   │ 物流专员        │ 13000000008  │ password │ 发货管理         │"
echo "   │ 售后工程师      │ 13000000009  │ password │ 售后服务         │"
echo "   │ 车间工人        │ 13000000010  │ password │ 生产作业         │"
echo "   └─────────────────┴──────────────┴──────────┴──────────────────┘"
echo ""
echo -e "${BLUE}🎬 演示流程建议：${NC}"
echo ""
echo -e "${GREEN}【场景1：售前流程】${NC}"
echo "   1. 销售经理（13000000002）创建新项目"
echo "   2. 技术工程师（13000000003）完成技术选型"
echo "   3. 商务工程师（13000000004）生成BOM和报价"
echo "   4. 销售经理查看报价单"
echo ""
echo -e "${GREEN}【场景2：售中流程】${NC}"
echo "   5. 销售经理标记项目为赢单"
echo "   6. 商务工程师创建合同和生产订单"
echo ""
echo -e "${GREEN}【场景3：生产流程】${NC}"
echo "   7. 生产计划员（13000000006）展开BOM并生成采购需求"
echo "   8. 采购专员（13000000005）创建采购订单"
echo "   9. 车间工人（13000000010）完成生产作业"
echo "   10. 质检员（13000000007）进行质量检验"
echo "   11. 物流专员（13000000008）安排发货"
echo ""
echo -e "${GREEN}【场景4：售后流程】${NC}"
echo "   12. 销售经理创建售后工单"
echo "   13. 售后工程师（13000000009）处理并关闭工单"
echo ""
echo -e "${GREEN}【场景5：数据管理（新功能）】${NC}"
echo "   14. 技术工程师或管理员（13000000003/13000000001）访问产品批量导入"
echo "   15. 下载导入模板并查看字段说明"
echo "   16. 上传产品数据文件进行批量导入"
echo "   17. 查看导入结果（成功/失败/跳过统计）"
echo ""
echo -e "${YELLOW}📖 详细测试步骤请参考：演示操作手册.md${NC}"
echo ""
echo -e "${BLUE}⏹️  停止演示环境：${NC}"
echo "   方法1: 运行停止脚本"
echo -e "   ${GREEN}bash 停止演示环境.sh${NC}"
echo ""
echo "   方法2: 手动停止进程"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo -e "${BLUE}🔄 重新初始化数据（不重启服务）：${NC}"
echo "   cd backend && npm run seed:final"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✨ 演示环境已就绪，请在浏览器中打开 http://localhost:5173 开始演示！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 保存 PID 到文件，方便后续停止
echo "$BACKEND_PID" > .demo_backend_pid
echo "$FRONTEND_PID" > .demo_frontend_pid

# 保存启动时间
date > .demo_start_time

echo -e "${YELLOW}提示：此窗口可以关闭，服务将继续在后台运行${NC}"
echo ""

