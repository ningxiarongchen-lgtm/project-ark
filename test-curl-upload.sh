#!/bin/bash

echo "🧪 测试后端API - 供应商批量导入"
echo "================================"
echo ""

# 创建测试CSV文件（中文列名）
cat > test-suppliers.csv << 'CSVEOF'
供应商名称,联系人,电话,地址,经营范围,评级,认证状态,累计交易额,准时交付率,状态,备注
测试供应商A,张三,13800138000,测试地址A,测试范围A,4,Certified,10000,95,active,测试备注A
测试供应商B,李四,13900139000,测试地址B,测试范围B,5,Certified,20000,98,active,测试备注B
CSVEOF

echo "✅ 测试CSV文件已创建（使用中文列名）"
echo ""
echo "📤 发送请求到后端..."
echo ""

# 发送请求
curl -X POST \
  https://project-ark-d42c.onrender.com/api/data-management/suppliers/bulk-import \
  -F "file=@test-suppliers.csv" \
  -F "updateOnDuplicate=true" \
  -H "Content-Type: multipart/form-data" \
  -w "\n\n📊 HTTP状态码: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat

echo ""
echo "================================"

# 清理
rm -f test-suppliers.csv
echo "🧹 测试文件已清理"

