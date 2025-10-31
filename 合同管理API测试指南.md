# 🧪 合同管理API测试指南

## 📋 测试前准备

### 1. 获取认证Token

```bash
# 登录获取token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "商务工程师邮箱",
    "password": "密码"
  }'
```

**响应示例：**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "role": "Sales Engineer",
    ...
  }
}
```

**重要：** 将返回的token保存，后续请求需要使用

---

## 🔬 API测试用例

### 测试 1：获取所有合同

**目的：** 测试基本的合同列表查询

```bash
curl -X GET "http://localhost:3000/api/contracts" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期结果：**
- 返回合同列表
- 包含分页信息
- 状态码：200

---

### 测试 2：按项目查询合同

**目的：** 测试项目筛选功能

```bash
# 首先获取一个项目ID
curl -X GET "http://localhost:3000/api/projects" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 使用项目ID查询合同
curl -X GET "http://localhost:3000/api/contracts?project=PROJECT_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期结果：**
- 只返回该项目的合同
- 状态码：200

---

### 测试 3：按合同类型筛选

**目的：** 测试合同类型筛选

**销售合同：**
```bash
curl -X GET "http://localhost:3000/api/contracts?contractType=Sales" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**采购合同：**
```bash
curl -X GET "http://localhost:3000/api/contracts?contractType=Procurement" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期结果：**
- 只返回对应类型的合同
- 状态码：200

---

### 测试 4：按状态筛选

**目的：** 测试状态筛选功能

```bash
# 查询待盖章的合同
curl -X GET "http://localhost:3000/api/contracts?status=Pending%20Seal" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 查询已签署的合同
curl -X GET "http://localhost:3000/api/contracts?status=Signed" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期结果：**
- 只返回对应状态的合同
- 状态码：200

---

### 测试 5：全局文本搜索

**目的：** 测试文本搜索功能

```bash
curl -X GET "http://localhost:3000/api/contracts?search=华能" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期结果：**
- 返回标题、编号或乙方名称包含"华能"的合同
- 状态码：200

**注意：** 需要先创建文本索引（首次启动后端时会自动创建）

---

### 测试 6：组合筛选

**目的：** 测试多个筛选条件组合

```bash
curl -X GET "http://localhost:3000/api/contracts?contractType=Sales&status=Signed&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期结果：**
- 返回已签署的销售合同
- 每页10条
- 状态码：200

---

### 测试 7：分页功能

**目的：** 测试分页参数

```bash
# 第一页，每页20条
curl -X GET "http://localhost:3000/api/contracts?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 第二页，每页50条
curl -X GET "http://localhost:3000/api/contracts?page=2&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期结果：**
- 返回对应页码的数据
- pagination对象包含正确的信息
- 状态码：200

---

### 测试 8：排序功能

**目的：** 测试排序参数

```bash
# 按创建时间升序
curl -X GET "http://localhost:3000/api/contracts?sortBy=createdAt&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 按金额降序
curl -X GET "http://localhost:3000/api/contracts?sortBy=amount.total&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期结果：**
- 数据按指定字段排序
- 状态码：200

---

### 测试 9：获取合同统计

**目的：** 测试统计API

```bash
# 获取全部统计
curl -X GET "http://localhost:3000/api/contracts/stats" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 获取特定项目的统计
curl -X GET "http://localhost:3000/api/contracts/stats?project=PROJECT_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期结果：**
- 返回按类型和状态分组的统计信息
- 包含数量和金额
- 状态码：200

---

### 测试 10：获取单个合同详情

**目的：** 测试合同详情查询

```bash
curl -X GET "http://localhost:3000/api/contracts/CONTRACT_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期结果：**
- 返回完整的合同信息
- 包含所有关联数据
- 状态码：200

---

### 测试 11：创建新合同

**目的：** 测试合同创建功能

```bash
curl -X POST "http://localhost:3000/api/contracts" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试销售合同",
    "contractType": "Sales",
    "project": "PROJECT_ID_HERE",
    "partyA": {
      "name": "我方公司名称",
      "address": "公司地址"
    },
    "partyB": {
      "name": "客户公司名称",
      "address": "客户地址"
    },
    "amount": {
      "total": 1000000,
      "currency": "CNY",
      "taxRate": 0.13
    },
    "description": "这是一个测试合同"
  }'
```

**预期结果：**
- 创建成功
- 自动生成合同编号
- 状态码：201

---

### 测试 12：更新合同

**目的：** 测试合同更新功能

```bash
curl -X PUT "http://localhost:3000/api/contracts/CONTRACT_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Pending Review",
    "description": "更新后的描述"
  }'
```

**预期结果：**
- 更新成功
- 返回更新后的合同信息
- 状态码：200

---

### 测试 13：权限测试

**目的：** 测试权限控制

**使用非商务工程师账号测试：**
```bash
# 使用技术工程师或其他角色的token
curl -X GET "http://localhost:3000/api/contracts" \
  -H "Authorization: Bearer OTHER_ROLE_TOKEN_HERE"
```

**预期结果：**
- 商务工程师和管理员：可以查看所有合同
- 其他角色：只能看到自己创建的合同
- 状态码：200（但数据范围不同）

---

## 🐛 错误场景测试

### 测试 14：无认证访问

```bash
curl -X GET "http://localhost:3000/api/contracts"
```

**预期结果：**
- 返回认证错误
- 状态码：401

---

### 测试 15：无效的项目ID

```bash
curl -X GET "http://localhost:3000/api/contracts?project=invalid_id" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期结果：**
- 返回空列表或错误
- 状态码：200 或 400

---

### 测试 16：获取不存在的合同

```bash
curl -X GET "http://localhost:3000/api/contracts/000000000000000000000000" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**预期结果：**
- 返回404错误
- 状态码：404

---

## 📊 性能测试

### 测试 17：大量数据查询

```bash
# 请求大量数据
curl -X GET "http://localhost:3000/api/contracts?limit=1000" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**监控指标：**
- 响应时间 < 2秒
- 内存使用合理
- CPU占用正常

---

### 测试 18：并发请求

```bash
# 使用工具如Apache Bench进行并发测试
ab -n 100 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/contracts
```

**监控指标：**
- 所有请求成功完成
- 平均响应时间 < 500ms
- 无内存泄漏

---

## 🔍 数据库索引验证

### 验证文本索引

```javascript
// 在MongoDB shell中执行
use your_database_name;

// 查看Contract集合的索引
db.contracts.getIndexes();

// 应该看到类似这样的文本索引：
{
  "v": 2,
  "key": {
    "_fts": "text",
    "_ftsx": 1
  },
  "name": "title_text_contractNumber_text_partyB.name_text_description_text",
  ...
}
```

---

## 📝 测试数据准备

### 创建测试数据脚本

```javascript
// scripts/createTestContracts.js
const mongoose = require('mongoose');
const Contract = require('../backend/models/Contract');

async function createTestContracts() {
  // 连接数据库
  await mongoose.connect(process.env.MONGODB_URI);
  
  const testContracts = [
    {
      title: '华能风电项目销售合同',
      contractType: 'Sales',
      project: 'PROJECT_ID_1',
      partyB: { name: '华能新能源股份有限公司' },
      amount: { total: 5000000, currency: 'CNY' },
      status: 'Signed'
    },
    {
      title: '某供应商采购合同',
      contractType: 'Procurement',
      project: 'PROJECT_ID_1',
      partyB: { name: '北京XX科技有限公司' },
      amount: { total: 200000, currency: 'CNY' },
      status: 'Executing'
    },
    // 添加更多测试数据...
  ];
  
  for (const data of testContracts) {
    const contractNumber = await Contract.generateContractNumber(data.contractType);
    await Contract.create({
      ...data,
      contractNumber,
      createdBy: 'USER_ID_HERE'
    });
  }
  
  console.log('Test contracts created successfully!');
  process.exit(0);
}

createTestContracts().catch(console.error);
```

**运行脚本：**
```bash
node scripts/createTestContracts.js
```

---

## ✅ 测试检查清单

**基本功能：**
- [ ] 获取合同列表
- [ ] 按项目筛选
- [ ] 按类型筛选
- [ ] 按状态筛选
- [ ] 全局搜索
- [ ] 分页功能
- [ ] 排序功能

**高级功能：**
- [ ] 组合筛选
- [ ] 统计查询
- [ ] 合同详情
- [ ] 创建合同
- [ ] 更新合同
- [ ] 上传文件

**权限和安全：**
- [ ] 认证检查
- [ ] 角色权限
- [ ] 数据隔离

**性能：**
- [ ] 响应时间
- [ ] 并发处理
- [ ] 内存使用

**数据完整性：**
- [ ] 数据验证
- [ ] 错误处理
- [ ] 索引效率

---

## 🔧 调试技巧

### 查看详细错误信息

```bash
# 添加 -v 参数查看详细信息
curl -v -X GET "http://localhost:3000/api/contracts" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 格式化JSON输出

```bash
# 使用 jq 工具格式化输出
curl -X GET "http://localhost:3000/api/contracts" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq
```

### 保存响应到文件

```bash
curl -X GET "http://localhost:3000/api/contracts" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -o response.json
```

---

## 📈 监控建议

### 关键指标

1. **响应时间**
   - 列表查询: < 500ms
   - 详情查询: < 200ms
   - 创建/更新: < 1s

2. **错误率**
   - 目标: < 0.1%
   - 监控4xx和5xx错误

3. **数据库性能**
   - 查询时间 < 100ms
   - 索引命中率 > 95%

### 日志监控

```javascript
// 在 contractController.js 中添加日志
console.log('Contract query:', {
  filters: req.query,
  user: req.user.role,
  timestamp: new Date()
});
```

---

## 🎓 使用Postman测试

### 导入到Postman

1. 创建新的Collection: "Contract Management API"
2. 添加环境变量：
   - `base_url`: http://localhost:3000
   - `token`: 登录后获取的token
3. 创建请求并保存

### Postman Collection示例

```json
{
  "info": {
    "name": "Contract Management API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Contracts",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/contracts",
          "host": ["{{base_url}}"],
          "path": ["api", "contracts"]
        }
      }
    }
    // 添加更多请求...
  ]
}
```

---

## 🚀 自动化测试

### Jest测试示例

```javascript
// tests/contract.test.js
const request = require('supertest');
const app = require('../backend/server');

describe('Contract API', () => {
  let token;
  
  beforeAll(async () => {
    // 登录获取token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    token = response.body.token;
  });
  
  test('GET /api/contracts - should return contracts list', async () => {
    const response = await request(app)
      .get('/api/contracts')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
  
  test('GET /api/contracts?contractType=Sales - should filter by type', async () => {
    const response = await request(app)
      .get('/api/contracts?contractType=Sales')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    response.body.data.forEach(contract => {
      expect(contract.contractType).toBe('Sales');
    });
  });
  
  // 添加更多测试...
});
```

---

## 📞 问题反馈

**遇到测试问题？**
1. 检查后端服务是否正常运行
2. 验证token是否有效
3. 查看后端日志
4. 检查数据库连接

**报告bug：**
- 提供请求URL和参数
- 包含错误响应
- 附上后端日志
- 说明预期行为

---

## ✨ 测试完成

完成所有测试后，您应该能够确认：
- ✅ 所有API端点正常工作
- ✅ 筛选和搜索功能正确
- ✅ 权限控制有效
- ✅ 性能满足要求
- ✅ 错误处理妥当

**准备好投入生产了！** 🎉

---

**文档版本：** v1.0.0  
**最后更新：** 2025-10-31  
**适用对象：** 开发人员、测试人员

