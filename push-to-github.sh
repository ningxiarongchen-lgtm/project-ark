#!/bin/bash

# 🚀 一键推送代码到 GitHub 脚本
# 使用方法：./push-to-github.sh "提交说明"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 进入项目目录
cd "/Users/hexiaoxiao/Desktop/Model Selection System"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 开始推送代码到 GitHub${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查是否提供了提交信息
if [ -z "$1" ]; then
    echo -e "${YELLOW}请提供提交说明，例如：${NC}"
    echo -e "${YELLOW}  ./push-to-github.sh \"修复了登录问题\"${NC}"
    echo ""
    read -p "请输入提交说明: " COMMIT_MSG
else
    COMMIT_MSG="$1"
fi

# 检查是否有修改
echo -e "${BLUE}📋 检查修改的文件...${NC}"
if [[ -z $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  没有检测到任何修改${NC}"
    echo ""
    echo -e "${GREEN}✅ 代码已经是最新的！${NC}"
    exit 0
fi

# 显示修改的文件
echo -e "${GREEN}检测到以下修改：${NC}"
git status -s
echo ""

# 添加所有修改
echo -e "${BLUE}📦 添加所有修改到暂存区...${NC}"
git add .

# 提交
echo -e "${BLUE}💾 提交修改...${NC}"
git commit -m "$COMMIT_MSG"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 提交失败${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 提交成功${NC}"
echo ""

# 推送到 GitHub
echo -e "${BLUE}🌐 推送到 GitHub...${NC}"
echo -e "${YELLOW}使用 GitHub Desktop 的认证信息...${NC}"
echo ""

# 使用 osxkeychain 中存储的凭证推送
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 推送成功！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}📍 查看代码：${NC}"
    echo -e "   https://github.com/ningxiarongchen-lgtm/project-ark"
    echo ""
    echo -e "${GREEN}✅ 提交信息：${NC}$COMMIT_MSG"
    echo ""
else
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ 推送失败${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}💡 建议：${NC}"
    echo -e "   1. 检查网络连接"
    echo -e "   2. 使用 GitHub Desktop 推送"
    echo -e "   3. 稍后重试"
    echo ""
    exit 1
fi

