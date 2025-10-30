#!/bin/bash
# ============================================
# 回滚脚本
# 用于快速回滚到之前的版本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 列出可用的备份
list_backups() {
    print_header "可用的备份列表"
    
    if [ ! -d "backups" ]; then
        print_error "备份目录不存在"
        exit 1
    fi
    
    BACKUPS=$(ls -1t backups/*.tar.gz 2>/dev/null || echo "")
    
    if [ -z "$BACKUPS" ]; then
        print_error "没有可用的备份"
        exit 1
    fi
    
    echo ""
    echo "序号  备份文件                      创建时间"
    echo "----  ---------------------------  --------------------"
    
    local index=1
    for backup in $BACKUPS; do
        FILENAME=$(basename "$backup")
        TIMESTAMP=$(echo "$FILENAME" | sed 's/backup_//' | sed 's/.tar.gz//')
        DATETIME=$(echo "$TIMESTAMP" | sed 's/_/ /' | sed 's/\(..\)\(..\)\(..\)/\1:\2:\3/')
        printf "%-4s  %-27s  %s\n" "$index" "$FILENAME" "$DATETIME"
        ((index++))
    done
    
    echo ""
}

# 选择备份
select_backup() {
    read -p "请输入要回滚的备份序号 (或按Enter取消): " choice
    
    if [ -z "$choice" ]; then
        print_info "回滚已取消"
        exit 0
    fi
    
    BACKUPS=($(ls -1t backups/*.tar.gz 2>/dev/null))
    SELECTED_INDEX=$((choice - 1))
    
    if [ $SELECTED_INDEX -lt 0 ] || [ $SELECTED_INDEX -ge ${#BACKUPS[@]} ]; then
        print_error "无效的选择"
        exit 1
    fi
    
    BACKUP_FILE="${BACKUPS[$SELECTED_INDEX]}"
    echo "$BACKUP_FILE"
}

# 停止服务
stop_services() {
    print_header "停止服务"
    
    if command -v pm2 &> /dev/null; then
        if pm2 describe cmax-backend &> /dev/null; then
            print_info "停止PM2服务..."
            pm2 stop cmax-backend
            print_success "PM2服务已停止"
        else
            print_info "PM2服务未运行"
        fi
    else
        print_info "尝试停止Node进程..."
        pkill -f "node server.js" || true
        print_success "Node进程已停止"
    fi
}

# 恢复备份
restore_backup() {
    local backup_file=$1
    
    print_header "恢复备份"
    
    print_info "备份当前状态..."
    CURRENT_BACKUP="backups/rollback_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "$CURRENT_BACKUP" \
        --exclude='node_modules' \
        --exclude='dist' \
        backend/ frontend/ 2>/dev/null || true
    print_success "当前状态已备份: $CURRENT_BACKUP"
    
    print_info "恢复备份: $(basename $backup_file)"
    tar -xzf "$backup_file"
    print_success "备份已恢复"
}

# 重新安装依赖
reinstall_dependencies() {
    print_header "重新安装依赖"
    
    print_info "安装后端依赖..."
    cd backend
    npm ci --production
    cd ..
    print_success "后端依赖已安装"
    
    print_info "安装前端依赖..."
    cd frontend
    npm ci
    cd ..
    print_success "前端依赖已安装"
}

# 重新构建前端
rebuild_frontend() {
    print_header "重新构建前端"
    
    cd frontend
    npm run build
    cd ..
    print_success "前端已重新构建"
}

# 重启服务
restart_services() {
    print_header "重启服务"
    
    if command -v pm2 &> /dev/null; then
        print_info "使用PM2重启服务..."
        pm2 restart cmax-backend --env production
        print_success "PM2服务已重启"
    else
        print_info "后台启动服务..."
        cd backend
        NODE_ENV=production nohup node server.js > ../logs/rollback.log 2>&1 &
        cd ..
        print_success "服务已后台启动"
    fi
    
    # 等待服务启动
    sleep 3
}

# 健康检查
health_check() {
    print_header "健康检查"
    
    print_info "检查后端API..."
    if curl -f http://localhost:5001/api/health &> /dev/null; then
        print_success "后端API正常"
        return 0
    else
        print_error "后端API异常"
        return 1
    fi
}

# 主函数
main() {
    clear
    echo ""
    echo "=========================================="
    echo "  Project Ark - 回滚工具"
    echo "=========================================="
    
    print_warning "⚠️  警告：回滚操作将替换当前的代码和配置"
    echo ""
    
    # 列出备份
    list_backups
    
    # 选择备份
    BACKUP_FILE=$(select_backup)
    
    # 确认
    print_warning "确定要回滚到: $(basename $BACKUP_FILE) ?"
    read -p "输入 'yes' 继续: " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "回滚已取消"
        exit 0
    fi
    
    # 执行回滚
    stop_services
    restore_backup "$BACKUP_FILE"
    reinstall_dependencies
    rebuild_frontend
    restart_services
    
    if health_check; then
        print_header "回滚成功"
        print_success "🎉 系统已成功回滚！"
        
        if command -v pm2 &> /dev/null; then
            echo ""
            print_info "查看状态: pm2 status"
            print_info "查看日志: pm2 logs cmax-backend"
        fi
    else
        print_header "回滚失败"
        print_error "服务启动异常，请检查日志"
        exit 1
    fi
}

# 执行
main

