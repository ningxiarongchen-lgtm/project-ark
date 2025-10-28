#!/bin/bash

# AI API 测试脚本
# 使用方法: ./test-ai-api.sh

echo "========================================="
echo "  AI优化建议 API 测试"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 服务器地址
API_URL="http://localhost:5001/api"

# 检查服务器是否运行
echo "1. 检查服务器状态..."
if curl -s "${API_URL}/health" > /dev/null; then
    echo -e "${GREEN}✓ 服务器运行正常${NC}"
else
    echo -e "${RED}✗ 服务器未运行，请先启动: npm run dev${NC}"
    exit 1
fi

echo ""

# 登录获取token
echo "2. 登录获取token..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cmax.com",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ 登录失败${NC}"
    echo "响应: $LOGIN_RESPONSE"
    echo ""
    echo -e "${YELLOW}提示: 请确保已创建管理员账户${NC}"
    echo "可以运行: node utils/createAdmin.js"
    exit 1
else
    echo -e "${GREEN}✓ 登录成功${NC}"
fi

echo ""

# 检查AI服务状态
echo "3. 检查AI服务配置..."
AI_STATUS=$(curl -s -X GET "${API_URL}/ai/status" \
  -H "Authorization: Bearer $TOKEN")

echo "AI状态: $AI_STATUS"

CONFIGURED=$(echo $AI_STATUS | grep -o '"configured":[^,]*' | cut -d':' -f2)

if [ "$CONFIGURED" = "true" ]; then
    echo -e "${GREEN}✓ OpenAI API已配置${NC}"
else
    echo -e "${RED}✗ OpenAI API未配置${NC}"
    echo ""
    echo -e "${YELLOW}配置步骤:${NC}"
    echo "1. 在 backend 目录创建 .env 文件（或复制 .env.example）"
    echo "2. 添加: OPENAI_API_KEY=sk-your-api-key-here"
    echo "3. 重启服务器"
    exit 1
fi

echo ""

# 测试AI优化建议
echo "4. 测试AI优化建议（这可能需要5-15秒）..."
echo -e "${YELLOW}正在调用OpenAI API...${NC}"

AI_RESPONSE=$(curl -s -X POST "${API_URL}/ai/optimize-bom" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bomData": [
      {
        "actuator_model": "SF050-DA",
        "total_quantity": 5,
        "unit_price": 2500,
        "total_price": 12500,
        "covered_tags": ["V001", "V002", "V003", "V004", "V005"],
        "notes": "标准配置"
      },
      {
        "actuator_model": "SF075-DA",
        "total_quantity": 3,
        "unit_price": 3200,
        "total_price": 9600,
        "covered_tags": ["V006", "V007", "V008"],
        "notes": "高温应用"
      },
      {
        "actuator_model": "AT080-GY",
        "total_quantity": 2,
        "unit_price": 5800,
        "total_price": 11600,
        "covered_tags": ["V009", "V010"],
        "notes": "防爆区域"
      }
    ],
    "projectInfo": {
      "projectNumber": "TEST-001",
      "projectName": "测试项目",
      "client": {
        "name": "测试客户"
      },
      "industry": "石油化工",
      "application": "阀门自动化控制"
    }
  }')

SUCCESS=$(echo $AI_RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$SUCCESS" = "true" ]; then
    echo -e "${GREEN}✓ AI优化建议获取成功${NC}"
    echo ""
    
    # 提取建议内容（前200字符）
    SUGGESTION=$(echo $AI_RESPONSE | grep -o '"suggestion":"[^"]*' | cut -d'"' -f4 | head -c 300)
    echo -e "${GREEN}建议摘要:${NC}"
    echo "$SUGGESTION..."
    echo ""
    
    # 提取token使用信息
    TOTAL_TOKENS=$(echo $AI_RESPONSE | grep -o '"total_tokens":[0-9]*' | cut -d':' -f2)
    MODEL=$(echo $AI_RESPONSE | grep -o '"model":"[^"]*' | cut -d'"' -f4)
    
    echo -e "${GREEN}使用统计:${NC}"
    echo "- 模型: $MODEL"
    echo "- Token消耗: $TOTAL_TOKENS"
    echo ""
    
else
    echo -e "${RED}✗ AI优化建议获取失败${NC}"
    echo "响应: $AI_RESPONSE"
    echo ""
    
    # 检查常见错误
    if echo "$AI_RESPONSE" | grep -q "invalid_api_key"; then
        echo -e "${YELLOW}错误原因: OpenAI API密钥无效${NC}"
        echo "解决方案: 检查 .env 文件中的 OPENAI_API_KEY 是否正确"
    elif echo "$AI_RESPONSE" | grep -q "insufficient_quota"; then
        echo -e "${YELLOW}错误原因: OpenAI API配额不足${NC}"
        echo "解决方案: 充值OpenAI账户或更换API密钥"
    elif echo "$AI_RESPONSE" | grep -q "rate_limit"; then
        echo -e "${YELLOW}错误原因: API请求速率限制${NC}"
        echo "解决方案: 等待片刻后重试"
    fi
    
    exit 1
fi

echo ""
echo "========================================="
echo -e "${GREEN}  所有测试通过！✓${NC}"
echo "========================================="
echo ""
echo "AI优化建议功能已就绪，可以在前端使用。"
echo ""

