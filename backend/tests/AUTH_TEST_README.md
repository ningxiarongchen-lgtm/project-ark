# 认证单元测试说明

## 📋 概述

本测试套件覆盖了后端认证系统的所有核心功能，包括：

- ✅ 手机号登录
- ✅ 用户注册
- ✅ 强制修改密码流程
- ✅ Token 验证
- ✅ 用户登出
- ✅ 边界情况和安全测试

## 🔧 安装依赖

在运行测试之前，请确保已安装必要的测试依赖：

```bash
cd backend
npm install --save-dev supertest
```

### 当前依赖列表

- **jest** - 测试框架
- **supertest** - HTTP 断言库
- **mongodb-memory-server** (可选) - 内存数据库，用于独立测试

## 🚀 运行测试

### 运行所有测试

```bash
npm test
```

### 只运行认证测试

```bash
npm test -- auth.test.js
```

### 监听模式（开发时使用）

```bash
npm run test:watch
```

### 生成覆盖率报告

```bash
npm run test:coverage
```

## 📝 环境配置

### 1. 创建测试环境变量文件

在 `backend/` 目录下创建 `.env.test` 文件（如果尚未存在）：

```env
NODE_ENV=test
MONGODB_URI_TEST=mongodb://localhost:27017/cmax-test
JWT_SECRET=your-test-jwt-secret-key-here
REFRESH_TOKEN_SECRET=your-test-refresh-token-secret
JWT_EXPIRE=8h
REFRESH_TOKEN_EXPIRE=7d
```

### 2. 确保测试数据库独立

⚠️ **重要**: 测试会自动清理数据库，请确保使用独立的测试数据库，避免影响开发或生产数据。

## 📊 测试覆盖范围

### 1. 用户注册 (`POST /api/auth/register`)

- ✅ 成功注册新用户（使用手机号）
- ✅ 拒绝无效的手机号格式
- ✅ 拒绝重复的手机号
- ✅ 要求提供必填字段
- ✅ 验证 Cookie 中的 Token

### 2. 用户登录 (`POST /api/auth/login`)

- ✅ 使用正确的手机号和密码成功登录
- ✅ 拒绝错误的密码
- ✅ 拒绝不存在的手机号
- ✅ 拒绝无效的手机号格式
- ✅ 拒绝未激活的用户
- ✅ 要求提供手机号和密码
- ✅ 更新 lastLogin 字段
- ✅ 返回 `passwordChangeRequired` 标志

### 3. 强制修改密码流程

#### 测试场景

**场景 1**: 新用户登录检测
- ✅ 登录后检测到 `passwordChangeRequired` 为 `true`

**场景 2**: 修改密码
- ✅ 成功修改密码
- ✅ 修改后 `passwordChangeRequired` 变为 `false`

**场景 3**: 验证新密码
- ✅ 使用新密码成功登录
- ✅ 旧密码不再有效

**场景 4**: 错误处理
- ✅ 拒绝错误的当前密码
- ✅ 拒绝过短的新密码（< 6 个字符）
- ✅ 未登录用户无法修改密码
- ✅ 要求提供当前密码和新密码

**场景 5**: 完整流程测试
- ✅ 端到端测试从登录到修改密码的完整流程

### 4. Token 验证 (`GET /api/auth/me`)

- ✅ 返回当前登录用户的信息
- ✅ 未登录用户返回 401
- ✅ 无效 Token 返回 401

### 5. 用户登出 (`POST /api/auth/logout`)

- ✅ 成功登出并清除 Cookies
- ✅ 登出后 Token 无法使用

### 6. 边界情况和安全测试

- ✅ 密码不应在任何响应中返回
- ✅ 正确处理特殊字符的密码
- ✅ 正确处理中文姓名

## 🔍 测试用例详解

### 示例：强制修改密码完整流程

```javascript
test('完整的强制修改密码流程', async () => {
  // 步骤1: 新用户登录
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      phone: '13800138030',
      password: 'temp123456'
    })
    .expect(200);
  
  expect(loginResponse.body.passwordChangeRequired).toBe(true);
  
  // 步骤2: 修改密码
  const changeResponse = await request(app)
    .post('/api/auth/change-password')
    .set('Cookie', [`accessToken=${accessToken}`])
    .send({
      currentPassword: 'temp123456',
      newPassword: 'mynewpassword123'
    })
    .expect(200);
  
  expect(changeResponse.body.passwordChangeRequired).toBe(false);
  
  // 步骤3: 使用新密码登录
  const reLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      phone: '13800138030',
      password: 'mynewpassword123'
    })
    .expect(200);
  
  expect(reLoginResponse.body.passwordChangeRequired).toBe(false);
  
  // 步骤4: 验证旧密码无效
  await request(app)
    .post('/api/auth/login')
    .send({
      phone: '13800138030',
      password: 'temp123456'
    })
    .expect(401);
});
```

## 📈 查看测试报告

### 控制台输出

运行测试后，控制台会显示详细的测试结果：

```
PASS  tests/auth.test.js
  认证 API 测试
    POST /api/auth/register - 用户注册
      ✓ 应该成功注册新用户（使用手机号） (150ms)
      ✓ 应该拒绝无效的手机号格式 (250ms)
      ✓ 应该拒绝重复的手机号 (120ms)
      ✓ 应该要求提供必填字段 (80ms)
    POST /api/auth/login - 用户登录
      ✓ 应该使用正确的手机号和密码成功登录 (200ms)
      ...
    强制修改密码流程
      ✓ 登录后应该检测到 passwordChangeRequired 为 true (100ms)
      ✓ 应该成功修改密码 (150ms)
      ✓ 完整的强制修改密码流程 (400ms)
      ...

Test Suites: 1 passed, 1 total
Tests:       35 passed, 35 total
Snapshots:   0 total
Time:        5.234s
```

### HTML 覆盖率报告

运行 `npm run test:coverage` 后，在 `backend/coverage/index.html` 查看详细的覆盖率报告。

## 🐛 常见问题

### 1. MongoDB 连接错误

**问题**: `MongoNetworkError: connect ECONNREFUSED`

**解决方案**:
```bash
# 启动 MongoDB 服务
sudo systemctl start mongod

# 或使用 Docker
docker run -d -p 27017:27017 --name mongodb-test mongo
```

### 2. 测试超时

**问题**: `Test timeout exceeded`

**解决方案**: 在 `jest.config.js` 中增加超时时间
```javascript
testTimeout: 30000 // 30秒
```

### 3. 端口占用

**问题**: 测试时端口已被占用

**解决方案**: 测试不会启动实际的服务器（通过 `supertest`），无需担心端口冲突。

## 📚 更多资源

- [Jest 官方文档](https://jestjs.io/)
- [Supertest 文档](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

## 🎯 下一步

1. **扩展测试覆盖**:
   - 添加更多边界情况测试
   - 测试并发登录场景
   - 测试 Token 刷新机制

2. **集成 CI/CD**:
   - 在 GitHub Actions 中自动运行测试
   - 设置覆盖率门槛

3. **性能测试**:
   - 添加负载测试
   - 测试 API 响应时间

## ✅ 测试清单

运行测试前，请确保：

- [ ] MongoDB 服务正在运行
- [ ] 已安装所有依赖 (`npm install`)
- [ ] 已安装 `supertest` (`npm install --save-dev supertest`)
- [ ] 已配置 `.env.test` 文件
- [ ] 测试数据库与开发/生产数据库隔离

---

**作者**: Project Ark Team  
**最后更新**: 2025-10-28  
**版本**: 1.0.0

