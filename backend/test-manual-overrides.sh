#!/bin/bash

# 测试手动操作装置数据

echo "======================================"
echo "手动操作装置数据验证"
echo "======================================"
echo ""

echo "📋 查询前5条记录:"
mongosh cmax-actuators --eval "db.manualoverrides.find({}, {model: 1, name: 1, price: 1, compatible_body_sizes: 1, _id: 0}).sort({model: 1}).limit(5).toArray()" --quiet

echo ""
echo "📊 统计信息:"
mongosh cmax-actuators --eval "print('总记录数:', db.manualoverrides.countDocuments())" --quiet
mongosh cmax-actuators --eval "print('有名称的记录数:', db.manualoverrides.countDocuments({name: {'\$exists': true, '\$ne': ''}}))" --quiet

echo ""
echo "✅ 数据验证完成！"

