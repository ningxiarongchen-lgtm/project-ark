#!/bin/bash

# 测试BOM展开功能
# 使用方法: ./test-bom-explosion.sh

BASE_URL="http://localhost:5001/api"

echo "=========================================="
echo "  BOM展开功能测试"
echo "=========================================="
echo ""

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. 生产计划员登录
echo -e "${YELLOW}步骤 1: 生产计划员登录${NC}"
# 注意：可能需要先创建Production Planner角色的用户
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800000003",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}⚠️  生产计划员账号不存在，尝试使用管理员账号${NC}"
  
  # 使用管理员账号
  ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"phone": "admin", "password": "admin123"}')
  
  TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ 登录失败${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✅ 登录成功${NC}"
echo ""

# 2. 获取生产订单列表
echo -e "${YELLOW}步骤 2: 获取生产订单列表${NC}"
PRODUCTION_ORDERS=$(curl -s -X GET "$BASE_URL/production?status=Pending" \
  -H "Authorization: Bearer $TOKEN")

PRODUCTION_ORDER_ID=$(echo $PRODUCTION_ORDERS | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PRODUCTION_ORDER_ID" ]; then
  echo -e "${YELLOW}⚠️  没有找到待排产的生产订单${NC}"
  echo ""
  echo -e "${BLUE}提示：请先创建一个生产订单，流程如下：${NC}"
  echo "  1. 创建项目并添加报价BOM"
  echo "  2. 签订合同"
  echo "  3. 确认收款并创建生产订单"
  echo ""
  echo "或者运行："
  echo "  ./test-contract-to-production.sh"
  echo ""
  exit 1
fi

echo -e "${GREEN}✅ 找到生产订单: $PRODUCTION_ORDER_ID${NC}"
echo ""

# 3. 展开BOM
echo -e "${YELLOW}步骤 3: 展开生产订单BOM${NC}"
EXPLODE_RESPONSE=$(curl -s -X POST "$BASE_URL/production/$PRODUCTION_ORDER_ID/explode-bom" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "响应:"
echo "$EXPLODE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$EXPLODE_RESPONSE"
echo ""

# 检查结果
if echo "$EXPLODE_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ BOM展开成功${NC}"
  
  # 提取统计信息
  TOTAL_PARTS=$(echo "$EXPLODE_RESPONSE" | grep -o '"total_parts":[0-9]*' | grep -o '[0-9]*')
  SHORTAGE_ITEMS=$(echo "$EXPLODE_RESPONSE" | grep -o '"total_shortage_items":[0-9]*' | grep -o '[0-9]*')
  MISSING_BOM=$(echo "$EXPLODE_RESPONSE" | grep -o '"products_missing_bom":[0-9]*' | grep -o '[0-9]*')
  
  echo ""
  echo -e "${GREEN}=========================================="
  echo "  BOM展开统计"
  echo "==========================================${NC}"
  echo "物料种类: $TOTAL_PARTS 种"
  echo "缺口物料: $SHORTAGE_ITEMS 种"
  echo "缺失BOM产品: $MISSING_BOM 个"
  echo ""
  
  # 4. 如果有缺失BOM，演示如何补充
  if [ "$MISSING_BOM" -gt 0 ]; then
    echo -e "${YELLOW}步骤 4: 检测到缺失BOM的产品${NC}"
    echo ""
    echo -e "${BLUE}提示：在前端页面中：${NC}"
    echo "  1. 会弹出警告提示哪些产品缺失BOM"
    echo "  2. 点击'立即补充BOM'按钮"
    echo "  3. 在弹出的表单中添加零部件信息"
    echo "  4. 保存后会调用 PUT /api/data-management/actuators/:id/bom-structure"
    echo "  5. 保存成功后可以重新展开BOM"
    echo ""
    
    # 模拟补充BOM（需要先获取actuator ID）
    echo -e "${YELLOW}模拟补充BOM...${NC}"
    
    # 查找第一个执行器
    ACTUATORS=$(curl -s -X GET "$BASE_URL/data-management/actuators?limit=1" \
      -H "Authorization: Bearer $TOKEN")
    
    ACTUATOR_ID=$(echo $ACTUATORS | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ ! -z "$ACTUATOR_ID" ]; then
      echo "更新执行器BOM: $ACTUATOR_ID"
      
      UPDATE_BOM=$(curl -s -X PUT "$BASE_URL/data-management/actuators/$ACTUATOR_ID/bom-structure" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{
          "bom_structure": [
            {
              "part_number": "PART-001",
              "part_name": "气缸体",
              "quantity": 1
            },
            {
              "part_number": "PART-002",
              "part_name": "活塞",
              "quantity": 2
            },
            {
              "part_number": "PART-003",
              "part_name": "密封圈",
              "quantity": 4
            }
          ]
        }')
      
      if echo "$UPDATE_BOM" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ BOM补充成功${NC}"
      else
        echo -e "${RED}❌ BOM补充失败${NC}"
      fi
    fi
  fi
  
  # 5. 如果有缺口物料，演示生成采购需求
  if [ "$SHORTAGE_ITEMS" -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}步骤 5: 生成采购需求${NC}"
    
    PROCUREMENT_REQUEST=$(curl -s -X POST "$BASE_URL/production/$PRODUCTION_ORDER_ID/generate-procurement" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "shortage_items": [
          {
            "part_number": "PART-001",
            "part_name": "气缸体",
            "shortage": 10,
            "total_required_quantity": 10,
            "estimated_unit_price": 500
          }
        ],
        "notes": "紧急需求，请尽快处理",
        "priority": "High"
      }')
    
    echo "采购需求响应:"
    echo "$PROCUREMENT_REQUEST" | python3 -m json.tool 2>/dev/null || echo "$PROCUREMENT_REQUEST"
    
    if echo "$PROCUREMENT_REQUEST" | grep -q '"success":true'; then
      echo -e "${GREEN}✅ 采购需求生成成功${NC}"
      
      PR_NUMBER=$(echo "$PROCUREMENT_REQUEST" | grep -o '"request_number":"[^"]*' | cut -d'"' -f4)
      echo "采购需求单号: $PR_NUMBER"
    else
      echo -e "${RED}❌ 采购需求生成失败${NC}"
    fi
  fi
  
else
  echo -e "${RED}❌ BOM展开失败${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "  测试完成！"
echo "==========================================${NC}"
echo ""
echo "功能说明："
echo "1. ✅ BOM展开 - 从产品主数据查找BOM结构"
echo "2. ✅ 缺失BOM检测 - 自动识别没有BOM的产品"
echo "3. ✅ BOM补充 - 生产计划员可以补充缺失的BOM"
echo "4. ✅ 物料需求计算 - 自动计算所有零部件的总需求量"
echo "5. ✅ 缺口分析 - 显示库存和缺口（需WMS集成）"
echo "6. ✅ 采购需求生成 - 将缺口物料打包成采购请求"
echo ""
echo "前端功能："
echo "- 点击'展开生产BOM'按钮即可使用"
echo "- 自动提示缺失BOM的产品"
echo "- 可在界面上直接补充BOM"
echo "- 一键生成采购需求"
echo ""

