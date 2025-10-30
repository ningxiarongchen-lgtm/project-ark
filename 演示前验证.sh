#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════════════╗
# ║                   演示前完整性验证脚本                                         ║
# ║                Pre-Demo Validation Script                                     ║
# ╚═══════════════════════════════════════════════════════════════════════════════╝

echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    演示前完整性验证                                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# 检查函数
check_item() {
    local description=$1
    local command=$2
    local is_critical=$3  # true/false
    
    TOTAL_CHECKS=$((TOTAL_CHECKS+1))
    echo -n "检查 $TOTAL_CHECKS: $description ... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS+1))
        return 0
    else
        if [ "$is_critical" = "true" ]; then
            echo -e "${RED}❌ 失败（关键）${NC}"
            FAILED_CHECKS=$((FAILED_CHECKS+1))
            return 1
        else
            echo -e "${YELLOW}⚠️  警告（非关键）${NC}"
            WARNING_CHECKS=$((WARNING_CHECKS+1))
            return 2
        fi
    fi
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 第一部分：环境检查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. 检查 Node.js
check_item "Node.js 已安装" "command -v node" true
if [ $? -eq 0 ]; then
    echo "   版本: $(node -v)"
fi

# 2. 检查 npm
check_item "npm 已安装" "command -v npm" true
if [ $? -eq 0 ]; then
    echo "   版本: $(npm -v)"
fi

# 3. 检查 MongoDB
check_item "MongoDB 已安装" "command -v mongod" true

# 4. 检查 MongoDB 运行状态
check_item "MongoDB 服务运行中" "pgrep -x mongod" true

# 5. 检查 MongoDB 端口
check_item "MongoDB 端口 27017 可访问" "nc -z localhost 27017" true

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📂 第二部分：项目结构检查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 6. 检查项目目录
check_item "backend 目录存在" "[ -d 'backend' ]" true
check_item "frontend 目录存在" "[ -d 'frontend' ]" true

# 7. 检查后端依赖
check_item "后端 node_modules 已安装" "[ -d 'backend/node_modules' ]" true
check_item "后端 package.json 存在" "[ -f 'backend/package.json' ]" true

# 8. 检查前端依赖
check_item "前端 node_modules 已安装" "[ -d 'frontend/node_modules' ]" true
check_item "前端 package.json 存在" "[ -f 'frontend/package.json' ]" true

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📦 第三部分：关键文件检查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 9. 检查后端关键文件
check_item "server.js 存在" "[ -f 'backend/server.js' ]" true
check_item "数据库配置文件存在" "[ -f 'backend/config/database.js' ]" true
check_item "种子数据脚本存在" "[ -f 'backend/seed_final_acceptance.js' ]" true

# 10. 检查前端关键文件
check_item "index.html 存在" "[ -f 'frontend/index.html' ]" true
check_item "App.jsx 存在" "[ -f 'frontend/src/App.jsx' ]" true
check_item "vite.config.js 存在" "[ -f 'frontend/vite.config.js' ]" true

# 11. 检查模板文件（新增）
check_item "产品导入模板存在" "[ -f 'backend/templates/product_import_template.csv' ]" true
check_item "供应商导入模板存在" "[ -f 'backend/templates/suppliers_import_template.csv' ]" false

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🎨 第四部分：前端组件检查（新功能）${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 12. 检查新增页面组件
check_item "产品导入页面存在" "[ -f 'frontend/src/pages/ProductImport.jsx' ]" true
check_item "产品导入样式存在" "[ -f 'frontend/src/styles/ProductImport.css' ]" true

# 13. 检查路由配置
check_item "App.jsx 包含产品导入路由" "grep -q 'ProductImport' frontend/src/App.jsx" true
check_item "导航菜单包含产品导入" "grep -q 'product-import' frontend/src/components/Layout/AttioLayout.jsx" true

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔌 第五部分：后端 API 检查（新功能）${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 14. 检查控制器
check_item "产品控制器包含批量导入功能" "grep -q 'bulkImportProducts' backend/controllers/productController.js" true

# 15. 检查路由
check_item "产品路由包含导入端点" "grep -q '/import' backend/routes/productRoutes.js" true

# 16. 检查中间件
check_item "上传中间件存在" "[ -f 'backend/middleware/upload.js' ]" true
check_item "上传中间件包含 dataUpload" "grep -q 'dataUpload' backend/middleware/upload.js" true

# 17. 检查依赖包
check_item "后端包含 xlsx 依赖" "grep -q '\"xlsx\"' backend/package.json" true
check_item "后端包含 multer 依赖" "grep -q '\"multer\"' backend/package.json" true

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔒 第六部分：安全和权限检查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 18. 检查认证中间件
check_item "认证中间件存在" "[ -f 'backend/middleware/auth.js' ]" true
check_item "授权中间件功能完整" "grep -q 'authorize' backend/middleware/auth.js" true

# 19. 检查环境变量
check_item ".env 文件存在（后端）" "[ -f 'backend/.env' ]" false
if [ ! -f 'backend/.env' ]; then
    echo -e "${YELLOW}   提示：将使用默认配置${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🌐 第七部分：端口可用性检查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 20. 检查端口占用
check_item "端口 5001 未被占用" "! lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1" false
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    PID=$(lsof -ti:5001)
    echo -e "${YELLOW}   端口 5001 被进程 $PID 占用${NC}"
fi

check_item "端口 5173 未被占用" "! lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1" false
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    PID=$(lsof -ti:5173)
    echo -e "${YELLOW}   端口 5173 被进程 $PID 占用${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📖 第八部分：文档完整性检查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 21. 检查演示文档
check_item "演示操作手册存在" "[ -f '演示操作手册.md' ]" true
check_item "演示快速参考存在" "[ -f '演示快速参考.md' ]" true
check_item "演示快速开始存在" "[ -f '演示-快速开始.md' ]" true
check_item "产品导入功能文档存在" "[ -f 'PRODUCT_IMPORT_FEATURE.md' ]" false

# 22. 检查启动脚本
check_item "演示环境启动脚本存在" "[ -f '演示环境启动.sh' ]" true
check_item "停止演示环境脚本存在" "[ -f '停止演示环境.sh' ]" true
check_item "启动脚本可执行" "[ -x '演示环境启动.sh' ]" false
check_item "停止脚本可执行" "[ -x '停止演示环境.sh' ]" false

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    验证结果汇总                                               ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}总检查项: $TOTAL_CHECKS${NC}"
echo -e "${GREEN}✅ 通过: $PASSED_CHECKS${NC}"
echo -e "${YELLOW}⚠️  警告: $WARNING_CHECKS${NC}"
echo -e "${RED}❌ 失败: $FAILED_CHECKS${NC}"
echo ""

# 计算通过率
PASS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo -e "通过率: ${PASS_RATE}%"
echo ""

# 判断是否可以开始演示
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ 所有关键检查通过！系统可以开始演示${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}🚀 启动演示环境：${NC}"
    echo "   bash 演示环境启动.sh"
    echo ""
    
    if [ $WARNING_CHECKS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  注意: 有 $WARNING_CHECKS 个警告项，建议在正式演示前修复${NC}"
        echo ""
    fi
    
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ 发现 $FAILED_CHECKS 个关键问题，请先修复后再开始演示${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}建议操作：${NC}"
    echo "1. 检查 MongoDB 是否正常运行"
    echo "2. 运行 npm install 安装依赖"
    echo "3. 检查上述失败的项目并修复"
    echo ""
    exit 1
fi

