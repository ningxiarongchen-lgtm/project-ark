#!/bin/bash

# 测试合同管理API
# 使用方法: ./test-contract-api.sh

BASE_URL="http://localhost:5001/api"

echo "=========================================="
echo "  合同管理API测试脚本"
echo "=========================================="
echo ""

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 登录获取token（销售经理）
echo -e "${YELLOW}步骤 1: 销售经理登录${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800000001",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ 登录失败！${NC}"
  echo "响应: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ 登录成功${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# 2. 创建测试项目
echo -e "${YELLOW}步骤 2: 创建测试项目${NC}"
CREATE_PROJECT_RESPONSE=$(curl -s -X POST "$BASE_URL/new-projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projectName": "合同管理测试项目",
    "client": {
      "name": "测试客户",
      "company": "测试公司",
      "phone": "13900000000",
      "address": "测试地址"
    },
    "description": "用于测试合同管理功能的项目",
    "industry": "Oil & Gas",
    "budget": 100000
  }')

PROJECT_ID=$(echo $CREATE_PROJECT_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ 创建项目失败！${NC}"
  echo "响应: $CREATE_PROJECT_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ 项目创建成功${NC}"
echo "项目ID: $PROJECT_ID"
echo ""

# 3. 将项目状态更新为Won
echo -e "${YELLOW}步骤 3: 更新项目状态为Won${NC}"
UPDATE_STATUS_RESPONSE=$(curl -s -X PUT "$BASE_URL/new-projects/$PROJECT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "Won"
  }')

echo -e "${GREEN}✅ 项目状态已更新为Won${NC}"
echo ""

# 4. 测试获取合同信息
echo -e "${YELLOW}步骤 4: 获取合同信息${NC}"
CONTRACT_INFO=$(curl -s -X GET "$BASE_URL/contracts/projects/$PROJECT_ID/contract" \
  -H "Authorization: Bearer $TOKEN")

echo "合同信息:"
echo "$CONTRACT_INFO" | python3 -m json.tool 2>/dev/null || echo "$CONTRACT_INFO"
echo ""

# 5. 模拟上传草签合同
echo -e "${YELLOW}步骤 5: 销售经理上传草签合同${NC}"
DRAFT_CONTRACT_RESPONSE=$(curl -s -X POST "$BASE_URL/contracts/projects/$PROJECT_ID/contract/draft" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "file_name": "draft_contract_test.pdf",
    "file_url": "https://test-url.com/draft_contract.pdf",
    "objectId": "test_object_id_001"
  }')

echo "响应:"
echo "$DRAFT_CONTRACT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DRAFT_CONTRACT_RESPONSE"

# 检查是否成功
if echo "$DRAFT_CONTRACT_RESPONSE" | grep -q "Draft contract uploaded successfully"; then
  echo -e "${GREEN}✅ 草签合同上传成功${NC}"
else
  echo -e "${RED}❌ 草签合同上传失败${NC}"
fi
echo ""

# 6. 登录商务工程师
echo -e "${YELLOW}步骤 6: 切换到商务工程师账号${NC}"
ENGINEER_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800000002",
    "password": "password123"
  }')

ENGINEER_TOKEN=$(echo $ENGINEER_LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ENGINEER_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  商务工程师账号不存在，跳过此步骤${NC}"
  echo "您可以手动创建商务工程师账号进行测试"
else
  echo -e "${GREEN}✅ 商务工程师登录成功${NC}"
  echo ""
  
  # 7. 商务工程师审核并上传盖章合同
  echo -e "${YELLOW}步骤 7: 商务工程师审核并上传盖章合同${NC}"
  SEALED_CONTRACT_RESPONSE=$(curl -s -X POST "$BASE_URL/contracts/projects/$PROJECT_ID/contract/review" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ENGINEER_TOKEN" \
    -d '{
      "file_name": "sealed_contract_test.pdf",
      "file_url": "https://test-url.com/sealed_contract.pdf",
      "objectId": "test_object_id_002",
      "approved": true,
      "review_notes": "审核通过，已盖章"
    }')
  
  echo "响应:"
  echo "$SEALED_CONTRACT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SEALED_CONTRACT_RESPONSE"
  
  if echo "$SEALED_CONTRACT_RESPONSE" | grep -q "approved and company sealed contract uploaded successfully"; then
    echo -e "${GREEN}✅ 盖章合同上传成功${NC}"
  else
    echo -e "${RED}❌ 盖章合同上传失败${NC}"
  fi
  echo ""
  
  # 8. 销售经理上传最终合同
  echo -e "${YELLOW}步骤 8: 销售经理上传最终签署合同${NC}"
  FINAL_CONTRACT_RESPONSE=$(curl -s -X POST "$BASE_URL/contracts/projects/$PROJECT_ID/contract/final" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "file_name": "final_contract_test.pdf",
      "file_url": "https://test-url.com/final_contract.pdf",
      "objectId": "test_object_id_003"
    }')
  
  echo "响应:"
  echo "$FINAL_CONTRACT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FINAL_CONTRACT_RESPONSE"
  
  if echo "$FINAL_CONTRACT_RESPONSE" | grep -q "Final contract uploaded successfully"; then
    echo -e "${GREEN}✅ 最终合同上传成功${NC}"
  else
    echo -e "${RED}❌ 最终合同上传失败${NC}"
  fi
  echo ""
fi

# 9. 最终检查合同流程状态
echo -e "${YELLOW}步骤 9: 检查最终合同流程状态${NC}"
FINAL_CONTRACT_INFO=$(curl -s -X GET "$BASE_URL/contracts/projects/$PROJECT_ID/contract" \
  -H "Authorization: Bearer $TOKEN")

echo "最终合同信息:"
echo "$FINAL_CONTRACT_INFO" | python3 -m json.tool 2>/dev/null || echo "$FINAL_CONTRACT_INFO"
echo ""

echo -e "${GREEN}=========================================="
echo "  测试完成！"
echo "==========================================${NC}"
echo ""
echo "说明："
echo "1. 本脚本测试了完整的合同管理流程"
echo "2. 包括：上传草签合同 → 商务审核 → 上传最终合同"
echo "3. 测试项目ID: $PROJECT_ID"
echo "4. 您可以在前端查看此项目的合同流程"
echo ""

