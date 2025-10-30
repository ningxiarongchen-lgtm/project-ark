# Axios 迁移计划 - 修复认证问题

> **优先级**: P0 - 关键  
> **状态**: 🔴 进行中  
> **发现日期**: 2025-10-30

---

## 📋 问题描述

### 根本原因
多个页面组件直接使用 `axios` 而不是配置好的 `api` 实例，导致：
1. ❌ 请求不携带认证token
2. ❌ 401错误无法自动处理
3. ❌ 没有自动重定向到登录页
4. ❌ 缺少统一的错误处理

### 影响范围
- **ProductCatalog.jsx** - ✅ 已修复
- **ProjectDetails.jsx** - ❌ 需要修复（2处）
- **TicketDetails.jsx** - ❌ 需要修复（5处）
- **OrderDetails.jsx** - ❌ 需要修复（2处）
- **PurchaseOrderDetails.jsx** - ❌ 需要修复（8处）

---

## 🔧 标准修复模式

### 步骤1: 修改导入
```javascript
// ❌ 错误
import axios from 'axios'

// ✅ 正确
import api from '../services/api'
```

### 步骤2: 修改API调用
```javascript
// ❌ 错误
await axios.post('/api/tickets/123/close', data)

// ✅ 正确
await api.post('/tickets/123/close', data)
```

**注意**: 
- 移除URL中的 `/api` 前缀
- `api` 实例会自动添加 `/api` base URL

---

## 📊 修复清单

### ✅ 已修复

- [x] **ProductCatalog.jsx**
  - 修改: `axios.get('/api/catalog/products')` → `api.get('/catalog/products')`
  - 日期: 2025-10-30
  - 测试: ✅ 通过

### ❌ 待修复

#### 1. ProjectDetails.jsx (2处)
- [ ] Line 1205: `axios.post('/api/new-projects/.../generate-quotation-bom')`
- [ ] Line 4639: `axios.post('/api/projects/.../add-file')`

#### 2. TicketDetails.jsx (5处)
- [ ] Line 139: `axios.patch('/api/tickets/.../close')`
- [ ] Line 159: `axios.patch('/api/tickets/.../reopen')`
- [ ] Line 193: `axios.patch('/api/tickets/.../save-report')`
- [ ] Line 217: `axios.patch('/api/tickets/.../mark-resolved')`
- [ ] Line 1098: `axios.post('/api/tickets/.../add-attachment')`

#### 3. OrderDetails.jsx (2处)
- [ ] Line 63: `axios.get('/api/data-management/users/role/...')`
- [ ] Line 1028: `axios.post('/api/orders/.../add-file')`

#### 4. PurchaseOrderDetails.jsx (8处)
- [ ] Line 89: `axios.post('/api/purchase-orders/.../add-file')`
- [ ] Line 140: `axios.post('/api/purchase-orders/.../payments')`
- [ ] Line 153: `axios.post('/api/purchase-orders/.../shipments')`
- [ ] Line 167: `axios.post('/api/purchase-orders/.../receive')`
- [ ] Line 181: `axios.patch('/api/purchase-orders/.../quality-check')`
- [ ] Line 216: `axios.post('/api/purchase-orders/.../follow-ups')`
- [ ] Line 240: `axios.post('/api/purchase-orders/.../admin-approve')`
- [ ] Line 256: `axios.post('/api/purchase-orders/.../admin-reject')`

---

## 🔍 自动检查脚本

创建 `scripts/check-axios-usage.sh`:

```bash
#!/bin/bash
echo "🔍 检查直接使用 axios 的文件..."
echo ""

# 在frontend/src下搜索（排除api.js本身）
grep -r "import axios from 'axios'" frontend/src --exclude="api.js" | grep -v node_modules

echo ""
echo "❌ 以上文件需要修改为使用 api 实例"
echo ""
echo "✅ 修复方法:"
echo "   1. 改为: import api from '../services/api'"
echo "   2. 改为: api.get() / api.post() 等"
echo "   3. 移除URL中的 /api 前缀"
```

---

## ⚡ 批量修复策略

### 优先级
1. **P0 - 立即修复**: ProductCatalog.jsx ✅
2. **P1 - 本次修复**: 
   - ProjectDetails.jsx（核心业务流程）
   - OrderDetails.jsx（核心业务流程）
3. **P2 - 后续修复**:
   - TicketDetails.jsx（售后流程）
   - PurchaseOrderDetails.jsx（采购流程）

---

## 🛡️ 预防措施

### 1. 代码审查规则
在 `.eslintrc.js` 添加规则（可选）:
```javascript
rules: {
  'no-restricted-imports': ['error', {
    patterns: [
      {
        group: ['axios'],
        message: '请使用 ../services/api 而不是直接导入 axios'
      }
    ]
  }]
}
```

### 2. Git Pre-commit Hook
创建 `.husky/pre-commit`:
```bash
#!/bin/sh
# 检查是否有直接使用axios的新代码
if git diff --cached --name-only | grep -q "frontend/src/"; then
  ./scripts/check-axios-usage.sh
fi
```

### 3. 文档规范
在开发文档中明确：
- ✅ **正确**: `import api from '../services/api'`
- ❌ **错误**: `import axios from 'axios'`

---

## ✅ 验证清单

修复后需要测试：
- [ ] 登录后能正常访问
- [ ] 401错误自动跳转到登录页
- [ ] Token过期自动刷新或退出
- [ ] 所有功能正常工作

---

## 📝 相关文档

- [API服务配置](frontend/src/services/api.js)
- [认证中间件](backend/middleware/authMiddleware.js)
- [质量保证体系](docs/6_QUALITY_ASSURANCE_SYSTEM.md)

---

**维护人**: Project Ark Team  
**最后更新**: 2025-10-30  
**下次审查**: 修复完成后

