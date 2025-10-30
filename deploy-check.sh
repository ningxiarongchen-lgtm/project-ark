#!/bin/bash
# ============================================
# 部署前检查脚本
# 在部署到生产环境前运行此脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 计数器
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

print_check() {
    local status=$1
    local message=$2
    
    if [ "$status" == "pass" ]; then
        echo -e "${GREEN}✅ $message${NC}"
        ((CHECKS_PASSED++))
    elif [ "$status" == "fail" ]; then
        echo -e "${RED}❌ $message${NC}"
        ((CHECKS_FAILED++))
    else
        echo -e "${YELLOW}⚠️  $message${NC}"
        ((CHECKS_WARNING++))
    fi
}

print_header() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# 检查系统环境
check_system() {
    print_header "1. 系统环境检查"
    
    # Node.js版本
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 16 ]; then
            print_check "pass" "Node.js版本: $(node -v)"
        else
            print_check "fail" "Node.js版本过低，需要 v16+，当前: $(node -v)"
        fi
    else
        print_check "fail" "Node.js未安装"
    fi
    
    # npm
    if command -v npm &> /dev/null; then
        print_check "pass" "npm已安装: $(npm -v)"
    else
        print_check "fail" "npm未安装"
    fi
    
    # MongoDB
    if command -v mongod &> /dev/null; then
        print_check "pass" "MongoDB已安装"
    else
        print_check "warn" "MongoDB未检测到"
    fi
    
    # PM2
    if command -v pm2 &> /dev/null; then
        print_check "pass" "PM2已安装: $(pm2 -v)"
    else
        print_check "warn" "PM2未安装（推荐安装）"
    fi
    
    # Nginx
    if command -v nginx &> /dev/null; then
        print_check "pass" "Nginx已安装: $(nginx -v 2>&1 | cut -d'/' -f2)"
    else
        print_check "warn" "Nginx未安装（生产环境推荐）"
    fi
}

# 检查代码完整性
check_code() {
    print_header "2. 代码完整性检查"
    
    # 关键文件检查
    local required_files=(
        "backend/server.js"
        "backend/package.json"
        "frontend/package.json"
        "frontend/index.html"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_check "pass" "文件存在: $file"
        else
            print_check "fail" "文件缺失: $file"
        fi
    done
    
    # 检查Git状态
    if command -v git &> /dev/null; then
        if [ -d ".git" ]; then
            UNCOMMITTED=$(git status --porcelain | wc -l)
            if [ "$UNCOMMITTED" -eq 0 ]; then
                print_check "pass" "所有代码已提交到Git"
            else
                print_check "warn" "有 $UNCOMMITTED 个文件未提交"
            fi
            
            # 检查Git标签
            if git tag | grep -q "v1.0.0"; then
                print_check "pass" "版本标签已创建: v1.0.0"
            else
                print_check "warn" "未找到版本标签"
            fi
        else
            print_check "warn" "不是Git仓库"
        fi
    fi
}

# 检查配置文件
check_config() {
    print_header "3. 配置文件检查"
    
    # 生产环境配置
    if [ -f "backend/.env.production" ]; then
        print_check "pass" "生产环境配置文件存在"
        
        # 检查JWT密钥
        if grep -q "YOUR_JWT_SECRET_HERE" backend/.env.production; then
            print_check "fail" "JWT_SECRET尚未配置"
        else
            print_check "pass" "JWT_SECRET已配置"
        fi
        
        # 检查数据库URI
        if grep -q "MONGODB_URI=" backend/.env.production; then
            print_check "pass" "数据库连接已配置"
        else
            print_check "fail" "数据库连接未配置"
        fi
    else
        print_check "fail" "生产环境配置文件不存在: backend/.env.production"
    fi
    
    # .gitignore检查
    if [ -f ".gitignore" ]; then
        if grep -q ".env" .gitignore; then
            print_check "pass" ".env文件已加入忽略列表"
        else
            print_check "warn" ".env文件未在.gitignore中"
        fi
    fi
}

# 检查依赖
check_dependencies() {
    print_header "4. 依赖包检查"
    
    # 后端依赖
    if [ -f "backend/package.json" ]; then
        if [ -d "backend/node_modules" ]; then
            print_check "pass" "后端依赖已安装"
        else
            print_check "warn" "后端依赖未安装"
        fi
    fi
    
    # 前端依赖
    if [ -f "frontend/package.json" ]; then
        if [ -d "frontend/node_modules" ]; then
            print_check "pass" "前端依赖已安装"
        else
            print_check "warn" "前端依赖未安装"
        fi
    fi
    
    # 检查关键依赖
    if [ -f "backend/package.json" ]; then
        if grep -q "\"express\":" backend/package.json; then
            print_check "pass" "Express框架已配置"
        fi
        if grep -q "\"mongoose\":" backend/package.json; then
            print_check "pass" "Mongoose已配置"
        fi
        if grep -q "\"jsonwebtoken\":" backend/package.json; then
            print_check "pass" "JWT已配置"
        fi
    fi
}

# 检查数据库
check_database() {
    print_header "5. 数据库检查"
    
    # MongoDB进程
    if pgrep mongod &> /dev/null; then
        print_check "pass" "MongoDB进程正在运行"
    else
        print_check "fail" "MongoDB进程未运行"
    fi
    
    # 数据库备份
    if [ -d "database_backups" ]; then
        BACKUP_COUNT=$(ls -1 database_backups | wc -l)
        if [ "$BACKUP_COUNT" -gt 0 ]; then
            print_check "pass" "数据库备份存在: $BACKUP_COUNT 个"
        else
            print_check "warn" "无数据库备份"
        fi
    else
        print_check "warn" "备份目录不存在"
    fi
}

# 检查端口
check_ports() {
    print_header "6. 端口检查"
    
    # 检查5001端口（后端）
    if lsof -Pi :5001 -sTCP:LISTEN -t &> /dev/null; then
        print_check "warn" "端口5001已被占用"
    else
        print_check "pass" "端口5001可用"
    fi
    
    # 检查27017端口（MongoDB）
    if lsof -Pi :27017 -sTCP:LISTEN -t &> /dev/null; then
        print_check "pass" "MongoDB端口27017正在监听"
    else
        print_check "warn" "MongoDB端口27017未监听"
    fi
}

# 检查磁盘空间
check_disk() {
    print_header "7. 磁盘空间检查"
    
    AVAILABLE=$(df -h . | tail -1 | awk '{print $4}' | sed 's/G//')
    
    if command -v bc &> /dev/null; then
        if (( $(echo "$AVAILABLE > 5" | bc -l) )); then
            print_check "pass" "磁盘空间充足: ${AVAILABLE}G 可用"
        else
            print_check "warn" "磁盘空间不足: ${AVAILABLE}G 可用"
        fi
    else
        print_check "pass" "磁盘空间: ${AVAILABLE}G 可用"
    fi
}

# 检查安全配置
check_security() {
    print_header "8. 安全配置检查"
    
    # 防火墙
    if command -v ufw &> /dev/null; then
        if sudo ufw status | grep -q "active"; then
            print_check "pass" "防火墙已启用"
        else
            print_check "warn" "防火墙未启用"
        fi
    else
        print_check "warn" "UFW防火墙未安装"
    fi
    
    # SSL证书检查（如果使用Certbot）
    if command -v certbot &> /dev/null; then
        print_check "pass" "Certbot已安装"
    else
        print_check "warn" "Certbot未安装（HTTPS需要）"
    fi
}

# 显示总结
show_summary() {
    print_header "检查总结"
    
    echo ""
    echo -e "${GREEN}通过: $CHECKS_PASSED${NC}"
    echo -e "${YELLOW}警告: $CHECKS_WARNING${NC}"
    echo -e "${RED}失败: $CHECKS_FAILED${NC}"
    echo ""
    
    if [ $CHECKS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 所有关键检查已通过，可以部署！${NC}"
        echo ""
        echo "建议执行："
        echo "  bash deploy-production.sh"
        return 0
    else
        echo -e "${RED}⚠️  有 $CHECKS_FAILED 项检查失败，请修复后再部署${NC}"
        return 1
    fi
}

# 主函数
main() {
    clear
    echo ""
    echo "=========================================="
    echo "  Project Ark - 部署前检查"
    echo "=========================================="
    
    check_system
    check_code
    check_config
    check_dependencies
    check_database
    check_ports
    check_disk
    check_security
    show_summary
}

# 执行
main

