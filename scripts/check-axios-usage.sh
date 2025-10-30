#!/bin/bash
# Axios使用检查脚本
# 用于检测前端代码中直接使用axios的情况

echo "═══════════════════════════════════════════════════════════════"
echo "  🔍 检查直接使用 axios 的文件"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 统计总数
total_files=$(grep -r "import axios from 'axios'" frontend/src --exclude="api.js" 2>/dev/null | grep -v node_modules | wc -l)

if [ "$total_files" -eq 0 ]; then
  echo "✅ 太好了！没有发现直接使用 axios 的文件"
  echo ""
  exit 0
fi

echo "❌ 发现 $total_files 个文件直接使用 axios:"
echo ""

# 列出文件
grep -r "import axios from 'axios'" frontend/src --exclude="api.js" 2>/dev/null | grep -v node_modules | cut -d: -f1 | sort | uniq | while read file; do
  count=$(grep "axios\." "$file" 2>/dev/null | wc -l)
  echo "   📄 $file ($count 处调用)"
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ⚠️  这些文件可能存在认证问题！"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🔧 修复方法:"
echo "   1. 改为: import api from '../services/api'"
echo "   2. 改为: api.get() / api.post() / api.put() 等"
echo "   3. 移除URL中的 /api 前缀"
echo ""
echo "📖 详细说明: 查看 AXIOS_MIGRATION_PLAN.md"
echo ""

exit 1

