#!/bin/bash
# ============================================
# 生产环境部署脚本
# Project Ark - CMAX系统
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# 检查必要的命令是否存在
check_requirements() {
    print_header "检查系统要求"
    
    local missing_deps=0
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装"
        missing_deps=1
    else
        NODE_VERSION=$(node -v)
        print_success "Node.js 已安装: $NODE_VERSION"
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装"
        missing_deps=1
    else
        NPM_VERSION=$(npm -v)
        print_success "npm 已安装: $NPM_VERSION"
    fi
    
    # 检查MongoDB
    if ! command -v mongod &> /dev/null; then
        print_warning "MongoDB 未安装或未在PATH中"
        print_info "请确保MongoDB已安装并正在运行"
    else
        MONGO_VERSION=$(mongod --version | head -n 1)
        print_success "MongoDB 已安装: $MONGO_VERSION"
    fi
    
    # 检查PM2（可选）
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 未安装（推荐安装）"
        print_info "运行: npm install -g pm2"
    else
        PM2_VERSION=$(pm2 -v)
        print_success "PM2 已安装: $PM2_VERSION"
    fi
    
    if [ $missing_deps -eq 1 ]; then
        print_error "缺少必要的依赖，请先安装"
        exit 1
    fi
}

# 备份当前版本
backup_current() {
    print_header "备份当前版本"
    
    BACKUP_DIR="./backups"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_NAME="backup_${TIMESTAMP}"
    
    mkdir -p "$BACKUP_DIR"
    
    print_info "创建备份: $BACKUP_NAME"
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
        --exclude='node_modules' \
        --exclude='dist' \
        --exclude='.git' \
        --exclude='backups' \
        --exclude='database_backups' \
        backend/ frontend/ 2>/dev/null || true
    
    print_success "备份完成: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
}

# 检查环境配置
check_env_config() {
    print_header "检查环境配置"
    
    if [ ! -f "backend/.env.production" ]; then
        print_error "生产环境配置文件不存在: backend/.env.production"
        print_info "请先复制模板并配置："
        print_info "  cp backend/env.production.template backend/.env.production"
        print_info "  然后编辑 backend/.env.production 填入实际配置"
        exit 1
    fi
    
    print_success "环境配置文件存在"
    
    # 检查关键配置项
    if grep -q "YOUR_JWT_SECRET_HERE" backend/.env.production; then
        print_error "JWT_SECRET 尚未配置！"
        print_info "请编辑 backend/.env.production 并更换JWT密钥"
        print_info "参考文件: JWT密钥-生产环境专用.txt"
        exit 1
    fi
    
    print_success "JWT密钥已配置"
}

# 安装依赖
install_dependencies() {
    print_header "安装依赖包"
    
    # 后端依赖
    print_info "安装后端依赖..."
    cd backend
    npm ci --production
    print_success "后端依赖安装完成"
    
    # 前端依赖
    print_info "安装前端依赖..."
    cd ../frontend
    npm ci
    print_success "前端依赖安装完成"
    
    cd ..
}

# 构建前端
build_frontend() {
    print_header "构建前端应用"
    
    cd frontend
    print_info "开始构建..."
    npm run build
    print_success "前端构建完成"
    cd ..
    
    # 显示构建结果
    if [ -d "frontend/dist" ]; then
        DIST_SIZE=$(du -sh frontend/dist | cut -f1)
        print_success "构建产物大小: $DIST_SIZE"
    fi
}

# 数据库备份
backup_database() {
    print_header "备份数据库"
    
    print_info "备份MongoDB数据库..."
    bash backup-database.sh
    print_success "数据库备份完成"
}

# 部署前端到Nginx（可选）
deploy_frontend_nginx() {
    print_header "部署前端静态文件"
    
    NGINX_ROOT="/var/www/cmax/frontend"
    
    if [ ! -d "$NGINX_ROOT" ]; then
        print_warning "Nginx目录不存在: $NGINX_ROOT"
        print_info "跳过前端部署到Nginx"
        print_info "您可以手动部署或配置Nginx"
        return
    fi
    
    print_info "部署到: $NGINX_ROOT"
    sudo rm -rf "${NGINX_ROOT}/dist"
    sudo cp -r frontend/dist "$NGINX_ROOT/"
    print_success "前端静态文件已部署"
}

# 启动/重启后端服务
start_backend() {
    print_header "启动后端服务"
    
    cd backend
    
    if command -v pm2 &> /dev/null; then
        print_info "使用PM2管理进程..."
        
        # 检查是否已有运行的实例
        if pm2 describe cmax-backend &> /dev/null; then
            print_info "重启现有实例..."
            pm2 restart cmax-backend --env production
        else
            print_info "启动新实例..."
            pm2 start server.js --name cmax-backend --env production -i 2
        fi
        
        # 保存PM2配置
        pm2 save
        
        print_success "后端服务已启动（PM2）"
        
        # 显示状态
        pm2 status cmax-backend
        
    else
        print_warning "PM2未安装，使用普通模式启动"
        print_info "后台启动服务..."
        NODE_ENV=production nohup node server.js > ../logs/app.log 2>&1 &
        print_success "后端服务已后台启动"
        print_info "日志文件: logs/app.log"
    fi
    
    cd ..
}

# 健康检查
health_check() {
    print_header "服务健康检查"
    
    print_info "等待服务启动..."
    sleep 3
    
    # 检查后端API
    print_info "检查后端API..."
    if curl -f http://localhost:5001/api/health &> /dev/null; then
        print_success "后端API正常响应"
    else
        print_error "后端API无响应"
        print_info "请检查日志: pm2 logs cmax-backend"
        return 1
    fi
    
    # 检查前端（如果配置了Nginx）
    if command -v nginx &> /dev/null; then
        print_info "检查前端页面..."
        if curl -f http://localhost &> /dev/null; then
            print_success "前端页面正常访问"
        else
            print_warning "前端页面无法访问（可能Nginx未配置）"
        fi
    fi
}

# 显示部署信息
show_deployment_info() {
    print_header "部署完成"
    
    echo ""
    print_success "🎉 系统已成功部署到生产环境！"
    echo ""
    
    print_info "服务信息："
    echo "  后端API: http://localhost:5001"
    
    if command -v nginx &> /dev/null && [ -d "/var/www/cmax/frontend/dist" ]; then
        echo "  前端页面: http://localhost (Nginx)"
    else
        echo "  前端页面: 需要配置Nginx"
    fi
    
    echo ""
    print_info "管理命令："
    
    if command -v pm2 &> /dev/null; then
        echo "  查看状态: pm2 status cmax-backend"
        echo "  查看日志: pm2 logs cmax-backend"
        echo "  重启服务: pm2 restart cmax-backend"
        echo "  停止服务: pm2 stop cmax-backend"
    else
        echo "  查看日志: tail -f logs/app.log"
        echo "  停止服务: pkill -f 'node server.js'"
    fi
    
    echo ""
    print_info "测试账号："
    echo "  管理员: 13000000001 / password"
    echo "  销售经理: 13000000002 / password"
    echo "  技术工程师: 13000000003 / password"
    
    echo ""
    print_warning "⚠️  重要提醒："
    echo "  1. 请修改默认密码"
    echo "  2. 配置SSL证书（HTTPS）"
    echo "  3. 配置防火墙规则"
    echo "  4. 设置定期数据库备份"
    echo "  5. 监控系统运行状态"
    
    echo ""
}

# 主函数
main() {
    clear
    echo ""
    echo "=========================================="
    echo "  Project Ark - CMAX 生产环境部署脚本"
    echo "=========================================="
    echo ""
    
    # 确认部署
    print_warning "即将部署到生产环境，是否继续？"
    read -p "输入 'yes' 继续: " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "部署已取消"
        exit 0
    fi
    
    # 执行部署步骤
    check_requirements
    check_env_config
    backup_current
    backup_database
    install_dependencies
    build_frontend
    deploy_frontend_nginx
    start_backend
    health_check
    show_deployment_info
    
    print_success "部署流程全部完成！"
}

# 执行主函数
main

