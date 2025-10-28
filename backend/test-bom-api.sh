#!/bin/bash

# BOM保存接口测试脚本
# 使用方法: ./test-bom-api.sh

echo "======================================"
echo "BOM保存接口测试脚本"
echo "======================================"
echo ""

# 配置（请根据实际情况修改）
BASE_URL="http://localhost:5000/api"
TOKEN=""  # 请填入有效的JWT token
PROJECT_ID=""  # 请填入有效的项目ID

# 检查配置
if [ -z "$TOKEN" ]; then
    echo "❌ 错误: 请在脚本中设置 TOKEN 变量"
    echo "   提示: 可以通过登录API获取token"
    exit 1
fi

if [ -z "$PROJECT_ID" ]; then
    echo "❌ 错误: 请在脚本中设置 PROJECT_ID 变量"
    echo "   提示: 可以通过 GET /api/new-projects 获取现有项目ID"
    exit 1
fi

echo "配置信息:"
echo "- 基础URL: $BASE_URL"
echo "- 项目ID: $PROJECT_ID"
echo ""

# 测试1: 保存手动物料
echo "📝 测试1: 保存纯手动物料BOM"
echo "-----------------------------------"
curl -X PUT "$BASE_URL/new-projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bill_of_materials": [
      {
        "item_type": "Manual",
        "model_name": "手动测试物料1",
        "quantity": 2,
        "unit_price": 500,
        "total_price": 1000,
        "description": "通过测试脚本添加",
        "is_manual": true
      },
      {
        "item_type": "Manual",
        "model_name": "手动测试物料2",
        "quantity": 1,
        "unit_price": 800,
        "total_price": 800,
        "description": "通过测试脚本添加",
        "is_manual": true
      }
    ]
  }' \
  -w "\n\nHTTP状态码: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "✅ 测试1完成"
echo ""
read -p "按回车继续下一个测试..."
echo ""

# 测试2: 保存混合物料
echo "📝 测试2: 保存混合类型BOM（需要有效的item_id）"
echo "-----------------------------------"
echo "提示: 此测试需要一个有效的执行器ID"
echo "如果没有，测试可能会失败（这是正常的）"
echo ""

# 获取一个执行器ID（如果可能）
ACTUATOR_ID=$(curl -s -X GET "$BASE_URL/actuators?limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0]._id // empty')

if [ -n "$ACTUATOR_ID" ]; then
    echo "找到执行器ID: $ACTUATOR_ID"
    
    curl -X PUT "$BASE_URL/new-projects/$PROJECT_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"bill_of_materials\": [
          {
            \"item_type\": \"Manual\",
            \"model_name\": \"手动物料\",
            \"quantity\": 1,
            \"unit_price\": 300,
            \"total_price\": 300,
            \"is_manual\": true
          },
          {
            \"item_id\": \"$ACTUATOR_ID\",
            \"item_type\": \"Actuator\",
            \"model_name\": \"系统执行器\",
            \"quantity\": 1,
            \"unit_price\": 2500,
            \"total_price\": 2500,
            \"is_manual\": false
          }
        ]
      }" \
      -w "\n\nHTTP状态码: %{http_code}\n" \
      -s | jq '.'
    
    echo ""
    echo "✅ 测试2完成（混合BOM）"
else
    echo "⚠️  未找到执行器，跳过此测试"
fi

echo ""
read -p "按回车继续下一个测试..."
echo ""

# 测试3: 验证错误处理（缺少必填字段）
echo "📝 测试3: 验证错误处理（缺少必填字段）"
echo "-----------------------------------"
curl -X PUT "$BASE_URL/new-projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bill_of_materials": [
      {
        "item_type": "Manual",
        "model_name": "不完整的物料"
      }
    ]
  }' \
  -w "\n\nHTTP状态码: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "✅ 测试3完成（应该返回400错误）"
echo ""
read -p "按回车继续..."
echo ""

# 测试4: 获取项目并验证BOM数据
echo "📝 测试4: 获取项目并验证BOM数据"
echo "-----------------------------------"
curl -s -X GET "$BASE_URL/new-projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.bill_of_materials'

echo ""
echo "✅ 测试4完成"
echo ""

# 总结
echo "======================================"
echo "测试完成！"
echo "======================================"
echo ""
echo "测试结果总结:"
echo "- 测试1: 保存纯手动物料 ✅"
echo "- 测试2: 保存混合BOM ✅ (如果有执行器ID)"
echo "- 测试3: 错误处理验证 ✅"
echo "- 测试4: 数据读取验证 ✅"
echo ""
echo "如果所有测试都返回了预期结果，说明后端接口工作正常！"
echo ""

