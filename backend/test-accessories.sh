#!/bin/bash

# 测试配件API功能
# 使用方法: ./test-accessories.sh

echo "=========================================="
echo "   配件API测试脚本"
echo "=========================================="
echo ""

# 配置
BASE_URL="http://localhost:5001/api"
ADMIN_EMAIL="admin@projectark.com"
ADMIN_PASSWORD="admin123"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 登录获取token
echo "1. 登录获取管理员token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ 登录失败！${NC}"
  echo "响应: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ 登录成功${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# 测试1: 创建新配件
echo "2. 创建新配件..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/accessories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "双作用电磁阀",
    "category": "控制类",
    "price": 1200,
    "description": "高性能双作用电磁阀，适用于DA型执行器",
    "manufacturer": "ASCO",
    "model_number": "SCG353A044",
    "specifications": {
      "电压": "24V DC",
      "接口尺寸": "G1/4",
      "防护等级": "IP65"
    },
    "compatibility_rules": {
      "body_sizes": ["SF10", "SF12", "SF14"],
      "action_types": ["DA"]
    },
    "stock_info": {
      "quantity": 50,
      "available": true,
      "lead_time": "7天"
    }
  }')

ACCESSORY_ID=$(echo $CREATE_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESSORY_ID" ]; then
  echo -e "${RED}❌ 创建配件失败！${NC}"
  echo "响应: $CREATE_RESPONSE"
else
  echo -e "${GREEN}✅ 配件创建成功${NC}"
  echo "配件ID: $ACCESSORY_ID"
fi
echo ""

# 测试2: 获取所有配件
echo "3. 获取所有配件..."
GET_ALL_RESPONSE=$(curl -s -X GET "$BASE_URL/accessories" \
  -H "Authorization: Bearer $TOKEN")

COUNT=$(echo $GET_ALL_RESPONSE | grep -o '"count":[0-9]*' | cut -d':' -f2)

if [ -z "$COUNT" ]; then
  echo -e "${YELLOW}⚠️  获取配件列表失败或为空${NC}"
  echo "响应: $GET_ALL_RESPONSE"
else
  echo -e "${GREEN}✅ 获取配件列表成功${NC}"
  echo "配件数量: $COUNT"
fi
echo ""

# 测试3: 按类别过滤
echo "4. 按类别过滤配件（控制类）..."
FILTER_RESPONSE=$(curl -s -X GET "$BASE_URL/accessories?category=控制类" \
  -H "Authorization: Bearer $TOKEN")

FILTER_COUNT=$(echo $FILTER_RESPONSE | grep -o '"count":[0-9]*' | cut -d':' -f2)

if [ -z "$FILTER_COUNT" ]; then
  echo -e "${YELLOW}⚠️  类别过滤失败${NC}"
else
  echo -e "${GREEN}✅ 类别过滤成功${NC}"
  echo "控制类配件数量: $FILTER_COUNT"
fi
echo ""

# 测试4: 按价格范围过滤
echo "5. 按价格范围过滤配件（1000-2000）..."
PRICE_RESPONSE=$(curl -s -X GET "$BASE_URL/accessories?min_price=1000&max_price=2000" \
  -H "Authorization: Bearer $TOKEN")

PRICE_COUNT=$(echo $PRICE_RESPONSE | grep -o '"count":[0-9]*' | cut -d':' -f2)

if [ -z "$PRICE_COUNT" ]; then
  echo -e "${YELLOW}⚠️  价格过滤失败${NC}"
else
  echo -e "${GREEN}✅ 价格过滤成功${NC}"
  echo "价格范围内配件数量: $PRICE_COUNT"
fi
echo ""

# 测试5: 下载Excel模板
echo "6. 下载Excel模板..."
TEMPLATE_FILE="accessories_template_test.xlsx"
curl -s -X GET "$BASE_URL/accessories/template" \
  -H "Authorization: Bearer $TOKEN" \
  -o "$TEMPLATE_FILE"

if [ -f "$TEMPLATE_FILE" ]; then
  FILE_SIZE=$(stat -f%z "$TEMPLATE_FILE" 2>/dev/null || stat -c%s "$TEMPLATE_FILE" 2>/dev/null)
  if [ "$FILE_SIZE" -gt 0 ]; then
    echo -e "${GREEN}✅ Excel模板下载成功${NC}"
    echo "文件大小: $FILE_SIZE bytes"
    echo "文件保存为: $TEMPLATE_FILE"
  else
    echo -e "${RED}❌ Excel模板下载失败（文件为空）${NC}"
  fi
else
  echo -e "${RED}❌ Excel模板下载失败${NC}"
fi
echo ""

# 测试6: 创建测试Excel文件并上传
echo "7. 创建并上传测试Excel文件..."

# 如果模板文件存在，使用它作为测试文件
if [ -f "$TEMPLATE_FILE" ]; then
  TEST_EXCEL="test_accessories_upload.xlsx"
  cp "$TEMPLATE_FILE" "$TEST_EXCEL"
  
  UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/accessories/upload" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$TEST_EXCEL")
  
  UPLOAD_SUCCESS=$(echo $UPLOAD_RESPONSE | grep -o '"success":[^,}]*' | cut -d':' -f2)
  
  if [ "$UPLOAD_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ Excel文件上传成功${NC}"
    IMPORTED=$(echo $UPLOAD_RESPONSE | grep -o '"imported":[0-9]*' | cut -d':' -f2)
    echo "导入成功: $IMPORTED 条"
  else
    echo -e "${YELLOW}⚠️  Excel上传响应:${NC}"
    echo "$UPLOAD_RESPONSE" | head -c 500
  fi
  
  # 清理测试文件
  rm -f "$TEST_EXCEL"
else
  echo -e "${YELLOW}⚠️  跳过上传测试（模板文件不存在）${NC}"
fi
echo ""

# 测试7: 更新配件
if [ ! -z "$ACCESSORY_ID" ]; then
  echo "8. 更新配件信息..."
  UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/accessories/$ACCESSORY_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "price": 1350,
      "description": "高性能双作用电磁阀，适用于DA型执行器（已更新）"
    }')
  
  UPDATE_SUCCESS=$(echo $UPDATE_RESPONSE | grep -o '"success":[^,}]*' | cut -d':' -f2)
  
  if [ "$UPDATE_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ 配件更新成功${NC}"
  else
    echo -e "${RED}❌ 配件更新失败${NC}"
    echo "响应: $UPDATE_RESPONSE"
  fi
  echo ""
fi

# 测试8: 获取单个配件详情
if [ ! -z "$ACCESSORY_ID" ]; then
  echo "9. 获取单个配件详情..."
  DETAIL_RESPONSE=$(curl -s -X GET "$BASE_URL/accessories/$ACCESSORY_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  DETAIL_NAME=$(echo $DETAIL_RESPONSE | grep -o '"name":"[^"]*' | cut -d'"' -f4)
  
  if [ ! -z "$DETAIL_NAME" ]; then
    echo -e "${GREEN}✅ 获取配件详情成功${NC}"
    echo "配件名称: $DETAIL_NAME"
  else
    echo -e "${RED}❌ 获取配件详情失败${NC}"
  fi
  echo ""
fi

# 测试9: 删除配件
if [ ! -z "$ACCESSORY_ID" ]; then
  echo "10. 删除配件..."
  DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/accessories/$ACCESSORY_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  DELETE_SUCCESS=$(echo $DELETE_RESPONSE | grep -o '"success":[^,}]*' | cut -d':' -f2)
  
  if [ "$DELETE_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ 配件删除成功${NC}"
  else
    echo -e "${RED}❌ 配件删除失败${NC}"
    echo "响应: $DELETE_RESPONSE"
  fi
  echo ""
fi

echo "=========================================="
echo "   配件API测试完成"
echo "=========================================="
echo ""
echo "测试总结："
echo "  - 登录: ✅"
echo "  - 创建配件: $([ ! -z "$ACCESSORY_ID" ] && echo "✅" || echo "❌")"
echo "  - 获取配件列表: $([ ! -z "$COUNT" ] && echo "✅" || echo "❌")"
echo "  - 类别过滤: $([ ! -z "$FILTER_COUNT" ] && echo "✅" || echo "❌")"
echo "  - 价格过滤: $([ ! -z "$PRICE_COUNT" ] && echo "✅" || echo "❌")"
echo "  - 下载模板: $([ -f "$TEMPLATE_FILE" ] && [ "$FILE_SIZE" -gt 0 ] && echo "✅" || echo "❌")"
echo "  - Excel上传: $([ "$UPLOAD_SUCCESS" = "true" ] && echo "✅" || echo "⚠️")"
echo "  - 更新配件: $([ "$UPDATE_SUCCESS" = "true" ] && echo "✅" || echo "❌")"
echo "  - 获取详情: $([ ! -z "$DETAIL_NAME" ] && echo "✅" || echo "❌")"
echo "  - 删除配件: $([ "$DELETE_SUCCESS" = "true" ] && echo "✅" || echo "❌")"
echo ""

