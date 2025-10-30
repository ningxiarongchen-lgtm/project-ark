# 测试环境配置指南

本指南将帮助您快速配置和启动测试环境，以便运行 E2E 自动化测试。

---

## 📋 **第一步：配置测试数据库**

### 1.1 编辑 `.env` 文件

在后端根目录的 `.env` 文件中添加测试数据库连接字符串：

```bash
# 生产/开发数据库（保持不变）
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/project_ark?retryWrites=true&w=majority

# 测试数据库（新增此行）
MONGO_URI_TEST=mongodb+srv://your-username:your-password@cluster.mongodb.net/project_ark_test?retryWrites=true&w=majority
```

> **💡 提示：** 
> - 测试数据库应该是一个**完全独立**的数据库，避免影响生产数据
> - 如果您使用本地 MongoDB，可以使用：`MONGO_URI_TEST=mongodb://localhost:27017/project_ark_test`
> - 如果未配置 `MONGO_URI_TEST`，系统会自动在生产数据库名后添加 `_test` 后缀

### 1.2 验证配置

确保 `.env` 文件已正确加载：

```bash
# 在后端目录执行
cat .env | grep MONGO_URI
```

---

## 🚀 **第二步：创建测试用户**

运行以下命令创建所有角色的测试账户：

```bash
npm run seed:test-users
```

**预期输出：**
```
✅ 测试数据库连接成功
📍 数据库: project_ark_test
🚀 开始创建测试用户...
✅ 成功创建 10 个测试用户！

╔═══════════════════════════════════════════════════════════════════════════╗
║                          测试用户账户列表                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ 姓名               │ 手机号        │ 密码         │ 角色                ║
╠════════════════════╪═══════════════╪══════════════╪═════════════════════╣
║ 测试管理员         │ 13800000001   │ test123456   │ Administrator       ║
║ 测试销售经理       │ 13800000002   │ test123456   │ Sales Manager       ║
║ 测试销售工程师     │ 13800000003   │ test123456   │ Sales Engineer      ║
║ 测试技术工程师     │ 13800000004   │ test123456   │ Technical Engineer  ║
║ 测试采购专员       │ 13800000005   │ test123456   │ Procurement...      ║
║ 测试生产计划员     │ 13800000006   │ test123456   │ Production Planner  ║
║ 测试售后工程师     │ 13800000007   │ test123456   │ After-sales...      ║
║ ...                │ ...           │ ...          │ ...                 ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 🏃 **第三步：启动测试环境后端**

在一个**新的终端窗口**中启动连接到测试数据库的后端服务：

```bash
npm run start:test
```

**预期输出：**
```
🧪 运行在测试环境
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
📍 Database: project_ark_test
🔌 Socket.IO initialized

╔════════════════════════════════════════════════════════╗
║               🚀 PROJECT ARK BACKEND                   ║
║   Environment: test                                    ║
║   Server running on port 5001                          ║
║   API: http://localhost:5001                          ║
║   WebSocket: ws://localhost:5001                      ║
╚════════════════════════════════════════════════════════╝
```

> **⚠️ 重要：** 
> - 保持此终端窗口运行，不要关闭
> - 后端将监听文件变化，自动重启（nodemon）
> - 所有 API 请求将访问测试数据库，不会影响生产数据

---

## 🧪 **第四步：运行 E2E 测试**

### 选项 A：使用 Cypress 交互式界面

```bash
cd ../frontend
npm run cypress:open
```

### 选项 B：使用命令行运行测试

```bash
cd ../frontend
npm run cypress:run
```

### 选项 C：手动测试

1. 启动前端开发服务器：
   ```bash
   cd ../frontend
   npm run dev
   ```

2. 在浏览器中访问：`http://localhost:5173`

3. 使用测试账户登录：
   - **手机号**: `13800000001`（管理员）
   - **密码**: `test123456`

---

## 📊 **测试账户列表**

| 角色 | 手机号 | 密码 | 用途 |
|------|--------|------|------|
| Administrator | 13800000001 | test123456 | 全局管理、用户管理 |
| Sales Manager | 13800000002 | test123456 | 项目管理、合同签订 |
| Sales Engineer | 13800000003 | test123456 | 客户沟通、报价 |
| Technical Engineer | 13800000004 | test123456 | 技术选型、BOM |
| Procurement Specialist | 13800000005 | test123456 | 供应商管理、采购 |
| Production Planner | 13800000006 | test123456 | 生产排期、APS |
| After-sales Engineer | 13800000007 | test123456 | 售后工单、维修 |
| Commercial Engineer | 13800000008 | test123456 | 商务审核 |
| Quality Inspector | 13800000009 | test123456 | 质量检验 |
| Logistics Specialist | 13800000010 | test123456 | 物流管理 |

---

## 🔄 **重置测试环境**

如果需要清空测试数据并重新开始：

```bash
# 1. 停止测试后端（Ctrl+C）

# 2. 重新创建测试用户
npm run seed:test-users

# 3. （可选）填充测试数据
NODE_ENV=test node seed.js

# 4. 重启测试后端
npm run start:test
```

---

## 🛠️ **可用的 NPM 脚本**

```bash
# 启动测试环境后端
npm run start:test

# 创建测试用户
npm run seed:test-users

# 运行 Jest 单元测试（测试环境）
npm run test
npm run test:watch
npm run test:coverage

# 普通开发环境（使用生产数据库）
npm run dev
npm start
```

---

## ❓ **常见问题**

### Q1: 测试数据会影响生产数据吗？
**A**: 不会。测试环境使用完全独立的数据库（`project_ark_test`），与生产数据库完全隔离。

### Q2: 如何切换回生产环境？
**A**: 停止测试后端，运行 `npm run dev` 或 `npm start` 即可。

### Q3: 测试用户的密码可以修改吗？
**A**: 可以。编辑 `seed_test_users.js` 文件中的 `testUsers` 数组，修改 `password` 字段，然后重新运行 `npm run seed:test-users`。

### Q4: 可以添加更多测试用户吗？
**A**: 可以。在 `seed_test_users.js` 的 `testUsers` 数组中添加新用户对象，确保手机号唯一即可。

---

## 📞 **获取帮助**

如果遇到问题：
1. 检查 `.env` 文件是否正确配置
2. 确认 MongoDB 数据库连接正常
3. 查看后端控制台的错误信息
4. 检查测试数据库中是否成功创建了用户

---

**祝测试顺利！🎉**

