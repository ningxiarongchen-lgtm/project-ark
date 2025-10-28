#!/bin/bash

echo "================================================"
echo "  C-MAX 执行器选型系统 - 环境安装脚本"
echo "================================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否已安装 Homebrew
echo -e "${BLUE}[1/4] 检查 Homebrew...${NC}"
if command -v brew &> /dev/null; then
    echo -e "${GREEN}✓ Homebrew 已安装${NC}"
    brew --version
else
    echo -e "${YELLOW}⚠ Homebrew 未安装，开始安装...${NC}"
    echo -e "${YELLOW}⚠ 安装过程中会要求输入您的 macOS 密码${NC}"
    echo ""
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # 配置 Homebrew 环境变量
    if [[ $(uname -m) == 'arm64' ]]; then
        # Apple Silicon
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
        eval "$(/opt/homebrew/bin/brew shellenv)"
    else
        # Intel
        echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zshrc
        eval "$(/usr/local/bin/brew shellenv)"
    fi
    
    echo -e "${GREEN}✓ Homebrew 安装完成${NC}"
fi

echo ""
echo -e "${BLUE}[2/4] 添加 MongoDB 官方源...${NC}"
brew tap mongodb/brew
echo -e "${GREEN}✓ MongoDB 源添加完成${NC}"

echo ""
echo -e "${BLUE}[3/4] 安装 MongoDB Community Edition...${NC}"
echo -e "${YELLOW}⚠ 这可能需要几分钟时间，请耐心等待...${NC}"
brew install mongodb-community

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ MongoDB 安装完成${NC}"
else
    echo -e "${RED}✗ MongoDB 安装失败${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}[4/4] 启动 MongoDB 服务...${NC}"
brew services start mongodb-community

# 等待服务启动
sleep 3

echo ""
echo "================================================"
echo -e "${GREEN}  ✓ 安装完成！${NC}"
echo "================================================"
echo ""

# 显示安装信息
echo -e "${BLUE}安装的软件版本：${NC}"
echo "-------------------"
echo -n "Node.js:  "
node --version
echo -n "npm:      "
npm --version
echo -n "MongoDB:  "
mongod --version | head -n 1
echo ""

echo -e "${BLUE}MongoDB 服务状态：${NC}"
echo "-------------------"
brew services list | grep mongodb
echo ""

echo -e "${GREEN}========== 下一步操作 ==========${NC}"
echo "1. 安装项目依赖："
echo "   cd backend && npm install"
echo "   cd ../frontend && npm install"
echo ""
echo "2. 配置环境变量："
echo "   cd backend && cp .env.example .env"
echo ""
echo "3. 初始化数据库："
echo "   cd backend && npm run seed"
echo ""
echo "4. 启动应用："
echo "   cd backend && npm run dev"
echo "   # 新终端窗口"
echo "   cd frontend && npm run dev"
echo ""
echo -e "${BLUE}访问系统：${NC} http://localhost:5173"
echo ""

# 询问是否继续安装项目依赖
echo -e "${YELLOW}是否现在安装项目依赖？(y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo -e "${BLUE}开始安装项目依赖...${NC}"
    
    # 安装后端依赖
    echo -e "${BLUE}安装后端依赖...${NC}"
    cd "/Users/hexiaoxiao/Desktop/Model Selection System/backend"
    npm install
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 后端依赖安装完成${NC}"
    else
        echo -e "${RED}✗ 后端依赖安装失败${NC}"
    fi
    
    # 安装前端依赖
    echo ""
    echo -e "${BLUE}安装前端依赖...${NC}"
    cd "/Users/hexiaoxiao/Desktop/Model Selection System/frontend"
    npm install
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 前端依赖安装完成${NC}"
    else
        echo -e "${RED}✗ 前端依赖安装失败${NC}"
    fi
    
    # 配置环境变量
    echo ""
    echo -e "${BLUE}配置环境变量...${NC}"
    cd "/Users/hexiaoxiao/Desktop/Model Selection System/backend"
    if [ ! -f .env ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ 环境变量配置完成${NC}"
        echo -e "${YELLOW}⚠ 请编辑 backend/.env 文件，修改 JWT_SECRET${NC}"
    else
        echo -e "${YELLOW}⚠ .env 文件已存在，跳过${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}========== 全部完成！ ==========${NC}"
    echo -e "${BLUE}现在可以初始化数据库并启动应用了：${NC}"
    echo ""
    echo "cd \"/Users/hexiaoxiao/Desktop/Model Selection System/backend\""
    echo "npm run seed      # 初始化数据库"
    echo "npm run dev       # 启动后端"
    echo ""
    echo "# 在新的终端窗口中："
    echo "cd \"/Users/hexiaoxiao/Desktop/Model Selection System/frontend\""
    echo "npm run dev       # 启动前端"
fi

echo ""
echo "脚本执行完毕！"


