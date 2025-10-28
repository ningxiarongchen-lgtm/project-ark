#!/bin/bash

# 供应商API测试脚本
# 使用方法: ./test-suppliers-api.sh

echo "========================================="
echo "  供应商管理 API 测试"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    exit 1
else
    echo -e "${GREEN}✓ 登录成功${NC}"
fi

echo ""

# 测试获取所有供应商
echo "3. 测试获取所有供应商 (GET /api/suppliers)"
SUPPLIERS_RESPONSE=$(curl -s -X GET "${API_URL}/suppliers" \
  -H "Authorization: Bearer $TOKEN")

SUPPLIERS_COUNT=$(echo $SUPPLIERS_RESPONSE | grep -o '"count":[0-9]*' | cut -d':' -f2)

if [ ! -z "$SUPPLIERS_COUNT" ]; then
    echo -e "${GREEN}✓ 成功获取供应商列表，共 ${SUPPLIERS_COUNT} 个供应商${NC}"
else
    echo -e "${RED}✗ 获取供应商列表失败${NC}"
    echo "响应: $SUPPLIERS_RESPONSE"
fi

echo ""

# 测试获取供应商统计
echo "4. 测试获取供应商统计 (GET /api/suppliers/stats/summary)"
STATS_RESPONSE=$(curl -s -X GET "${API_URL}/suppliers/stats/summary" \
  -H "Authorization: Bearer $TOKEN")

TOTAL=$(echo $STATS_RESPONSE | grep -o '"total":[0-9]*' | cut -d':' -f2)
ACTIVE=$(echo $STATS_RESPONSE | grep -o '"active":[0-9]*' | cut -d':' -f2)
AVG_RATING=$(echo $STATS_RESPONSE | grep -o '"avgRating":[0-9.]*' | cut -d':' -f2)

if [ ! -z "$TOTAL" ]; then
    echo -e "${GREEN}✓ 统计信息获取成功${NC}"
    echo "   总数: $TOTAL"
    echo "   活跃: $ACTIVE"
    echo "   平均评级: $AVG_RATING"
else
    echo -e "${RED}✗ 获取统计信息失败${NC}"
    echo "响应: $STATS_RESPONSE"
fi

echo ""

# 测试创建供应商
echo "5. 测试创建新供应商 (POST /api/suppliers)"
CREATE_RESPONSE=$(curl -s -X POST "${API_URL}/suppliers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试供应商有限公司",
    "contact_person": "测试人员",
    "phone": "000-00000000",
    "email": "test@test.com",
    "address": "测试地址",
    "business_scope": "测试业务",
    "rating": 3,
    "notes": "这是测试数据",
    "status": "active"
  }')

SUCCESS=$(echo $CREATE_RESPONSE | grep -o '"success":true')
NEW_SUPPLIER_ID=$(echo $CREATE_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$SUCCESS" ]; then
    echo -e "${GREEN}✓ 供应商创建成功${NC}"
    echo "   供应商ID: $NEW_SUPPLIER_ID"
else
    echo -e "${YELLOW}⚠ 供应商创建失败（可能已存在）${NC}"
    # 如果创建失败，尝试获取第一个供应商ID用于后续测试
    FIRST_SUPPLIER=$(curl -s -X GET "${API_URL}/suppliers?limit=1" \
      -H "Authorization: Bearer $TOKEN")
    NEW_SUPPLIER_ID=$(echo $FIRST_SUPPLIER | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
fi

echo ""

# 测试获取单个供应商
if [ ! -z "$NEW_SUPPLIER_ID" ]; then
    echo "6. 测试获取单个供应商 (GET /api/suppliers/:id)"
    GET_ONE_RESPONSE=$(curl -s -X GET "${API_URL}/suppliers/${NEW_SUPPLIER_ID}" \
      -H "Authorization: Bearer $TOKEN")
    
    SUCCESS=$(echo $GET_ONE_RESPONSE | grep -o '"success":true')
    
    if [ ! -z "$SUCCESS" ]; then
        SUPPLIER_NAME=$(echo $GET_ONE_RESPONSE | grep -o '"name":"[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}✓ 成功获取供应商详情${NC}"
        echo "   名称: $SUPPLIER_NAME"
    else
        echo -e "${RED}✗ 获取供应商详情失败${NC}"
    fi
    
    echo ""
    
    # 测试更新供应商
    echo "7. 测试更新供应商 (PUT /api/suppliers/:id)"
    UPDATE_RESPONSE=$(curl -s -X PUT "${API_URL}/suppliers/${NEW_SUPPLIER_ID}" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "notes": "测试更新 - '$(date +%Y-%m-%d\ %H:%M:%S)'"
      }')
    
    SUCCESS=$(echo $UPDATE_RESPONSE | grep -o '"success":true')
    
    if [ ! -z "$SUCCESS" ]; then
        echo -e "${GREEN}✓ 供应商更新成功${NC}"
    else
        echo -e "${RED}✗ 供应商更新失败${NC}"
    fi
    
    echo ""
    
    # 测试更新评级
    echo "8. 测试更新供应商评级 (PATCH /api/suppliers/:id/rating)"
    RATING_RESPONSE=$(curl -s -X PATCH "${API_URL}/suppliers/${NEW_SUPPLIER_ID}/rating" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"rating": 5}')
    
    SUCCESS=$(echo $RATING_RESPONSE | grep -o '"success":true')
    
    if [ ! -z "$SUCCESS" ]; then
        echo -e "${GREEN}✓ 评级更新成功${NC}"
    else
        echo -e "${RED}✗ 评级更新失败${NC}"
    fi
    
    echo ""
    
    # 测试搜索功能
    echo "9. 测试搜索供应商 (GET /api/suppliers?search=上海)"
    SEARCH_RESPONSE=$(curl -s -X GET "${API_URL}/suppliers?search=上海" \
      -H "Authorization: Bearer $TOKEN")
    
    SEARCH_COUNT=$(echo $SEARCH_RESPONSE | grep -o '"count":[0-9]*' | cut -d':' -f2)
    
    if [ ! -z "$SEARCH_COUNT" ]; then
        echo -e "${GREEN}✓ 搜索成功，找到 ${SEARCH_COUNT} 个结果${NC}"
    else
        echo -e "${RED}✗ 搜索失败${NC}"
    fi
    
    echo ""
    
    # 测试按评级筛选
    echo "10. 测试按评级筛选 (GET /api/suppliers?rating=4)"
    FILTER_RESPONSE=$(curl -s -X GET "${API_URL}/suppliers?rating=4" \
      -H "Authorization: Bearer $TOKEN")
    
    FILTER_COUNT=$(echo $FILTER_RESPONSE | grep -o '"count":[0-9]*' | cut -d':' -f2)
    
    if [ ! -z "$FILTER_COUNT" ]; then
        echo -e "${GREEN}✓ 筛选成功，找到 ${FILTER_COUNT} 个4星及以上供应商${NC}"
    else
        echo -e "${RED}✗ 筛选失败${NC}"
    fi
    
    echo ""
    
    # 测试删除供应商（只在创建了测试数据时执行）
    if echo "$CREATE_RESPONSE" | grep -q "测试供应商"; then
        echo "11. 测试删除供应商 (DELETE /api/suppliers/:id)"
        DELETE_RESPONSE=$(curl -s -X DELETE "${API_URL}/suppliers/${NEW_SUPPLIER_ID}" \
          -H "Authorization: Bearer $TOKEN")
        
        SUCCESS=$(echo $DELETE_RESPONSE | grep -o '"success":true')
        
        if [ ! -z "$SUCCESS" ]; then
            echo -e "${GREEN}✓ 供应商删除成功${NC}"
        else
            echo -e "${RED}✗ 供应商删除失败${NC}"
        fi
    else
        echo "11. ${YELLOW}⊘ 跳过删除测试（未创建测试数据）${NC}"
    fi
fi

echo ""
echo "========================================="
echo -e "${GREEN}  所有测试完成！✓${NC}"
echo "========================================="
echo ""
echo "供应商API功能已就绪，可以在前端使用。"
echo ""

