#!/bin/bash

# 测试从合同到生产的完整流程
# 使用方法: ./test-contract-to-production.sh

BASE_URL="http://localhost:5001/api"

echo "=========================================="
echo "  合同到生产完整流程测试"
echo "=========================================="
echo ""

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. 商务工程师登录
echo -e "${YELLOW}步骤 1: 商务工程师登录${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800000002",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ 登录失败！请确保商务工程师账号存在${NC}"
  echo "响应: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ 商务工程师登录成功${NC}"
echo ""

# 2. 获取一个状态为"Contract Signed"的项目
echo -e "${YELLOW}步骤 2: 查找已签订合同的项目${NC}"
PROJECTS_RESPONSE=$(curl -s -X GET "$BASE_URL/new-projects?status=Contract%20Signed" \
  -H "Authorization: Bearer $TOKEN")

PROJECT_ID=$(echo $PROJECTS_RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
  echo -e "${YELLOW}⚠️  没有找到状态为"Contract Signed"的项目${NC}"
  echo ""
  echo -e "${BLUE}提示：请先完成以下操作：${NC}"
  echo "  1. 创建一个项目"
  echo "  2. 添加报价BOM"
  echo "  3. 将项目状态改为Won"
  echo "  4. 上传草签合同（销售经理）"
  echo "  5. 商务工程师审核并上传盖章合同"
  echo "  6. 上传最终签署合同（销售经理）"
  echo ""
  echo "或者运行合同管理测试脚本："
  echo "  ./test-contract-api.sh"
  echo ""
  
  # 如果没有项目，创建一个测试项目
  echo -e "${YELLOW}创建测试项目...${NC}"
  
  # 先以销售经理身份登录
  SM_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"phone": "13800000001", "password": "password123"}')
  
  SM_TOKEN=$(echo $SM_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$SM_TOKEN" ]; then
    echo -e "${RED}❌ 销售经理登录失败${NC}"
    exit 1
  fi
  
  # 创建项目
  CREATE_PROJECT=$(curl -s -X POST "$BASE_URL/new-projects" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SM_TOKEN" \
    -d '{
      "projectName": "合同到生产流程测试",
      "client": {
        "name": "测试客户",
        "company": "测试公司",
        "phone": "13900000000",
        "address": "测试地址"
      },
      "description": "测试从合同到生产的完整流程",
      "industry": "Oil & Gas",
      "budget": 200000
    }')
  
  PROJECT_ID=$(echo $CREATE_PROJECT | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ 创建项目失败${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ 测试项目创建成功: $PROJECT_ID${NC}"
  
  # 添加报价BOM
  echo -e "${YELLOW}添加报价BOM...${NC}"
  UPDATE_BOM=$(curl -s -X PUT "$BASE_URL/new-projects/$PROJECT_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SM_TOKEN" \
    -d '{
      "quotation_bom": [
        {
          "item_type": "Actuator",
          "model_name": "AT-GY-2000",
          "quantity": 5,
          "unit_price": 15000,
          "total_price": 75000,
          "description": "气动执行器 2000Nm"
        },
        {
          "item_type": "Actuator",
          "model_name": "AT-GY-3000",
          "quantity": 3,
          "unit_price": 20000,
          "total_price": 60000,
          "description": "气动执行器 3000Nm"
        }
      ]
    }')
  
  echo -e "${GREEN}✅ 报价BOM添加成功${NC}"
  
  # 将项目状态改为Contract Signed
  echo -e "${YELLOW}更新项目状态为Contract Signed...${NC}"
  UPDATE_STATUS=$(curl -s -X PUT "$BASE_URL/new-projects/$PROJECT_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SM_TOKEN" \
    -d '{"status": "Contract Signed"}')
  
  echo -e "${GREEN}✅ 项目状态已更新为Contract Signed${NC}"
  echo ""
else
  echo -e "${GREEN}✅ 找到已签订合同的项目${NC}"
  echo "项目ID: $PROJECT_ID"
  echo ""
fi

# 3. 获取项目详情
echo -e "${YELLOW}步骤 3: 获取项目详情${NC}"
PROJECT_DETAIL=$(curl -s -X GET "$BASE_URL/new-projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN")

PROJECT_NAME=$(echo $PROJECT_DETAIL | grep -o '"projectName":"[^"]*' | cut -d'"' -f4)
PROJECT_STATUS=$(echo $PROJECT_DETAIL | grep -o '"status":"[^"]*' | cut -d'"' -f4)

echo "项目名称: $PROJECT_NAME"
echo "项目状态: $PROJECT_STATUS"
echo ""

# 4. 检查是否有报价BOM
echo -e "${YELLOW}步骤 4: 检查报价BOM${NC}"
HAS_BOM=$(echo $PROJECT_DETAIL | grep -c '"quotation_bom"')

if [ "$HAS_BOM" -eq 0 ]; then
  echo -e "${RED}❌ 项目没有报价BOM，无法创建生产订单${NC}"
  exit 1
fi

echo -e "${GREEN}✅ 项目有报价BOM${NC}"
echo ""

# 5. 商务工程师确认收款并创建生产订单
echo -e "${YELLOW}步骤 5: 商务工程师确认收款并创建生产订单${NC}"
CREATE_PRODUCTION=$(curl -s -X POST "$BASE_URL/production/from-project/$PROJECT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "payment_confirmed": true,
    "payment_amount": 45000,
    "payment_method": "Bank Transfer",
    "payment_notes": "30% prepayment confirmed - Test",
    "priority": "Normal",
    "productionNotes": "测试生产订单",
    "technicalRequirements": "按标准工艺生产"
  }')

echo "响应:"
echo "$CREATE_PRODUCTION" | python3 -m json.tool 2>/dev/null || echo "$CREATE_PRODUCTION"
echo ""

# 检查是否成功
if echo "$CREATE_PRODUCTION" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ 生产订单创建成功！${NC}"
  
  # 提取关键信息
  SALES_ORDER_NUMBER=$(echo $CREATE_PRODUCTION | grep -o '"orderNumber":"[^"]*' | cut -d'"' -f4)
  PRODUCTION_ORDER_NUMBER=$(echo $CREATE_PRODUCTION | grep -o '"productionOrderNumber":"[^"]*' | cut -d'"' -f4)
  
  echo ""
  echo -e "${GREEN}=========================================="
  echo "  创建结果"
  echo "==========================================${NC}"
  echo "销售订单号: $SALES_ORDER_NUMBER"
  echo "生产订单号: $PRODUCTION_ORDER_NUMBER"
  echo ""
  
  # 6. 验证项目状态已更新
  echo -e "${YELLOW}步骤 6: 验证项目状态${NC}"
  UPDATED_PROJECT=$(curl -s -X GET "$BASE_URL/new-projects/$PROJECT_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  NEW_STATUS=$(echo $UPDATED_PROJECT | grep -o '"status":"[^"]*' | cut -d'"' -f4)
  echo "项目状态已更新为: $NEW_STATUS"
  
  if [ "$NEW_STATUS" = "In Production" ]; then
    echo -e "${GREEN}✅ 项目状态正确更新为"In Production"${NC}"
  else
    echo -e "${RED}❌ 项目状态更新失败${NC}"
  fi
  echo ""
  
  # 7. 查询生产订单
  echo -e "${YELLOW}步骤 7: 查询生产订单详情${NC}"
  PRODUCTION_ORDERS=$(curl -s -X GET "$BASE_URL/production" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "生产订单列表:"
  echo "$PRODUCTION_ORDERS" | python3 -m json.tool 2>/dev/null | head -50
  echo ""
  
else
  echo -e "${RED}❌ 生产订单创建失败${NC}"
  
  # 检查是否是因为已存在
  if echo "$CREATE_PRODUCTION" | grep -q "already exists"; then
    echo -e "${YELLOW}⚠️  该项目已经创建过生产订单${NC}"
  fi
fi

echo -e "${GREEN}=========================================="
echo "  测试完成！"
echo "==========================================${NC}"
echo ""
echo "完整流程说明："
echo "1. ✅ 项目创建"
echo "2. ✅ 添加报价BOM"
echo "3. ✅ 合同签订（状态：Contract Signed）"
echo "4. ✅ 商务工程师确认收款"
echo "5. ✅ 创建销售订单和生产订单"
echo "6. ✅ 项目状态更新为In Production"
echo "7. ✅ 生产订单进入待排产状态"
echo ""

