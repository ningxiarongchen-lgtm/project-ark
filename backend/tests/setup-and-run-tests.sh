#!/bin/bash

# 认证单元测试 - 快速启动脚本
# 
# 用法:
#   chmod +x setup-and-run-tests.sh
#   ./setup-and-run-tests.sh

echo "╔════════════════════════════════════════════════════════╗"
echo "║     认证单元测试 - 快速启动                           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 1. 检查 Node.js
echo "📦 检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi
echo "✅ Node.js 版本: $(node -v)"
echo ""

# 2. 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm"
    exit 1
fi
echo "✅ npm 版本: $(npm -v)"
echo ""

# 3. 检查 MongoDB
echo "🗄️  检查 MongoDB 服务..."
if ! command -v mongod &> /dev/null; then
    echo "⚠️  警告: 未找到 MongoDB，请确保 MongoDB 正在运行"
    echo "   提示: 可以使用 Docker 运行 MongoDB:"
    echo "   docker run -d -p 27017:27017 --name mongodb-test mongo"
else
    echo "✅ MongoDB 已安装"
fi
echo ""

# 4. 安装依赖
echo "📥 安装测试依赖..."
npm install --save-dev supertest

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi
echo "✅ 依赖安装完成"
echo ""

# 5. 检查 .env.test 文件
echo "⚙️  检查测试环境配置..."
if [ ! -f ../.env.test ]; then
    echo "⚠️  未找到 .env.test 文件，正在创建..."
    cat > ../.env.test << EOF
NODE_ENV=test
MONGODB_URI_TEST=mongodb://localhost:27017/cmax-test
JWT_SECRET=test-jwt-secret-key-for-unit-tests-only
REFRESH_TOKEN_SECRET=test-refresh-token-secret-for-unit-tests
JWT_EXPIRE=8h
REFRESH_TOKEN_EXPIRE=7d
EOF
    echo "✅ 已创建 .env.test 文件"
else
    echo "✅ .env.test 文件已存在"
fi
echo ""

# 6. 运行测试
echo "╔════════════════════════════════════════════════════════╗"
echo "║     开始运行测试                                       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 设置测试环境变量
export NODE_ENV=test

# 运行认证测试
npm test -- auth.test.js

# 保存退出状态
TEST_EXIT_CODE=$?

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║     测试完成                                           ║"
echo "╚════════════════════════════════════════════════════════╝"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ 所有测试通过！"
    echo ""
    echo "📊 查看详细覆盖率报告:"
    echo "   npm run test:coverage"
    echo ""
    echo "🔍 持续监听模式:"
    echo "   npm run test:watch"
else
    echo "❌ 部分测试失败，请检查上方日志"
    echo ""
    echo "💡 提示:"
    echo "   1. 确保 MongoDB 正在运行"
    echo "   2. 检查 .env.test 配置"
    echo "   3. 查看详细错误信息"
fi

exit $TEST_EXIT_CODE

