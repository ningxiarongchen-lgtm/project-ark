#!/bin/bash

echo "================================================"
echo "  C-MAX 系统 - 快速安装（使用国内镜像）"
echo "================================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查是否已安装 Homebrew
echo -e "${BLUE}[1/5] 检查 Homebrew...${NC}"
if command -v brew &> /dev/null; then
    echo -e "${GREEN}✓ Homebrew 已安装${NC}"
    brew --version
else
    echo -e "${YELLOW}⚠ 使用国内镜像安装 Homebrew（速度更快）...${NC}"
    echo ""
    
    # 使用中科大镜像安装 Homebrew
    export HOMEBREW_BREW_GIT_REMOTE="https://mirrors.ustc.edu.cn/brew.git"
    export HOMEBREW_CORE_GIT_REMOTE="https://mirrors.ustc.edu.cn/homebrew-core.git"
    export HOMEBREW_BOTTLE_DOMAIN="https://mirrors.ustc.edu.cn/homebrew-bottles"
    
    /bin/bash -c "$(curl -fsSL https://cdn.jsdelivr.net/gh/ineo6/homebrew-install/install.sh)"
    
    # 配置环境变量
    if [[ $(uname -m) == 'arm64' ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
        eval "$(/opt/homebrew/bin/brew shellenv)"
    else
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zshrc
        eval "$(/usr/local/bin/brew shellenv)"
    fi
    
    # 配置 Homebrew 使用国内源
    echo 'export HOMEBREW_BREW_GIT_REMOTE="https://mirrors.ustc.edu.cn/brew.git"' >> ~/.zshrc
    echo 'export HOMEBREW_CORE_GIT_REMOTE="https://mirrors.ustc.edu.cn/homebrew-core.git"' >> ~/.zshrc
    echo 'export HOMEBREW_BOTTLE_DOMAIN="https://mirrors.ustc.edu.cn/homebrew-bottles"' >> ~/.zshrc
    
    echo -e "${GREEN}✓ Homebrew 安装完成${NC}"
fi

echo ""
echo -e "${BLUE}[2/5] 添加 MongoDB 官方源...${NC}"
brew tap mongodb/brew
echo -e "${GREEN}✓ 完成${NC}"

echo ""
echo -e "${BLUE}[3/5] 安装 MongoDB...${NC}"
echo -e "${YELLOW}⚠ 正在下载和安装 MongoDB，请稍候...${NC}"
brew install mongodb-community

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ MongoDB 安装完成${NC}"
else
    echo -e "${RED}✗ MongoDB 安装失败${NC}"
    echo ""
    echo -e "${YELLOW}尝试备用方案...${NC}"
    brew install mongodb-community --verbose
fi

echo ""
echo -e "${BLUE}[4/5] 启动 MongoDB 服务...${NC}"
brew services start mongodb-community
sleep 3
echo -e "${GREEN}✓ MongoDB 服务已启动${NC}"

echo ""
echo -e "${BLUE}[5/5] 安装项目依赖...${NC}"

# 后端依赖
echo -e "${BLUE}安装后端依赖...${NC}"
cd "/Users/hexiaoxiao/Desktop/Model Selection System/backend"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 后端依赖安装完成${NC}"
fi

# 前端依赖
echo ""
echo -e "${BLUE}安装前端依赖...${NC}"
cd "/Users/hexiaoxiao/Desktop/Model Selection System/frontend"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 前端依赖安装完成${NC}"
fi

# 配置环境变量
echo ""
echo -e "${BLUE}配置环境变量...${NC}"
cd "/Users/hexiaoxiao/Desktop/Model Selection System/backend"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ 环境变量配置完成${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}  ✓✓✓ 安装全部完成！ ✓✓✓${NC}"
echo "================================================"
echo ""

# 显示版本信息
echo -e "${BLUE}已安装软件：${NC}"
echo "  Node.js:   $(node --version)"
echo "  npm:       $(npm --version)"
echo "  MongoDB:   $(mongod --version | head -n 1)"
echo "  Homebrew:  $(brew --version | head -n 1)"
echo ""

echo -e "${BLUE}MongoDB 服务状态：${NC}"
brew services list | grep mongodb
echo ""

echo -e "${GREEN}========== 下一步 ==========${NC}"
echo "1. 初始化数据库："
echo "   cd \"/Users/hexiaoxiao/Desktop/Model Selection System/backend\""
echo "   npm run seed"
echo ""
echo "2. 启动后端（终端1）："
echo "   cd \"/Users/hexiaoxiao/Desktop/Model Selection System/backend\""
echo "   npm run dev"
echo ""
echo "3. 启动前端（新终端2）："
echo "   cd \"/Users/hexiaoxiao/Desktop/Model Selection System/frontend\""
echo "   npm run dev"
echo ""
echo "4. 浏览器访问："
echo "   http://localhost:5173"
echo ""
echo -e "${YELLOW}登录账号：${NC}"
echo "  管理员：admin@cmax.com / admin123"
echo "  工程师：john@cmax.com / engineer123"
echo "  销售：  sarah@cmax.com / sales123"
echo ""
echo "🎉 祝使用愉快！"


