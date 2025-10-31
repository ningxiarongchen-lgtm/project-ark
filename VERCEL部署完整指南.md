# 🚀 Vercel 部署完整指南

## ✅ 问题已修复

### 修复内容
- **问题**: `cmdk` 包版本 `^1.11.1` 不存在导致部署失败
- **解决**: 已修改为 `^0.2.0` 稳定版本
- **状态**: ✅ 已推送到GitHub，Vercel将自动重新部署

---

## 📋 Vercel 前端部署配置

### 第1步：项目配置

在Vercel项目设置中配置以下内容：

#### Framework Preset
```
Vite
```

#### Root Directory
```
frontend
```

#### Build Command
```
npm run build
```

#### Output Directory
```
dist
```

### 第2步：环境变量配置

在Vercel项目的 **Settings > Environment Variables** 中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_API_URL` | `https://your-backend.railway.app/api` | 后端API地址 |

**重要提示**：
- 如果后端部署在Railway，URL格式为：`https://your-service-name.up.railway.app/api`
- 如果后端部署在Render，URL格式为：`https://your-service.onrender.com/api`
- 注意URL末尾要加 `/api`

### 第3步：部署

1. **推送代码**（已完成）✅
   ```bash
   git push origin main
   ```

2. **Vercel自动部署**
   - Vercel检测到GitHub更新
   - 自动开始构建
   - 约1-2分钟完成

3. **查看部署状态**
   - 访问：https://vercel.com/dashboard
   - 选择您的项目
   - 查看 Deployments 标签

---

## 🔧 后端部署（Railway推荐）

如果您还没有部署后端，请按以下步骤操作：

### 第1步：部署到Railway

1. **访问 Railway**
   ```
   https://railway.app
   ```

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择 `project-ark` 仓库

3. **配置后端服务**
   - Root Directory: `backend`
   - Start Command: `npm start`

4. **添加MongoDB数据库**
   - 点击 "+ New"
   - 选择 "Database"
   - 选择 "Add MongoDB"

### 第2步：配置环境变量

在Railway后端服务的 **Variables** 标签中添加：

```env
NODE_ENV=production
PORT=5001
MONGODB_URI=${{MongoDB.MONGO_URL}}

# JWT密钥（从项目根目录的 JWT密钥-生产环境专用.txt 文件复制）
JWT_SECRET=624f154889a31793e7a74857fc8699296080cd1883bce90a6ff75d831f8dc77736037dddc00e14f9c0dbfefb42916ecb0dae6eb86c8133b821ab56e494f4d6dd
JWT_REFRESH_SECRET=0bef6a83aa1e56bcf61f4f9fdce62d16e7ec90dc221e734d4ba6b21f8f9efd965786cb8bd542e127113a33711f5ef9c7e2bedf9194ef0c4d1d49e59270aa66d4
SESSION_SECRET=22bcf597c05557d9202e4690bab21bd5646fb8166890748b31d24be62f9a201ff47d0e6435a5f90efa1321fe64798941a78505943b53fe56046a5aaaeddbd9d2

# CORS配置
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

**注意**：
- `${{MongoDB.MONGO_URL}}` 会自动替换为MongoDB连接字符串
- `ALLOWED_ORIGINS` 要设置为Vercel前端的URL

### 第3步：生成公共域名

在Railway服务中：
1. 点击 "Settings"
2. 找到 "Networking" 部分
3. 点击 "Generate Domain"
4. 复制生成的URL（例如：`https://project-ark-production.up.railway.app`）

### 第4步：初始化数据库

在本地终端运行：

```bash
cd backend
MONGODB_URI="你的Railway MongoDB连接字符串" npm run seed:final
```

或者使用Railway的Shell：
1. 在Railway后端服务中点击 "Shell"
2. 运行：`npm run seed:final`

---

## 🔄 更新Vercel环境变量

现在您已经有了后端URL，需要在Vercel中配置：

1. **访问Vercel项目**
   ```
   https://vercel.com/dashboard
   ```

2. **进入项目设置**
   - 选择您的项目
   - 点击 "Settings"
   - 点击 "Environment Variables"

3. **添加/更新变量**
   ```
   VITE_API_URL = https://your-backend.railway.app/api
   ```

4. **重新部署**
   - 点击 "Deployments"
   - 找到最新的部署
   - 点击右侧的 "..." 菜单
   - 选择 "Redeploy"

---

## 🔙 更新Railway CORS配置

确保后端允许前端访问：

1. **获取Vercel前端URL**
   - 例如：`https://project-ark.vercel.app`

2. **更新Railway环境变量**
   - 在Railway后端服务的 Variables 中
   - 将 `ALLOWED_ORIGINS` 设置为：
     ```
     https://project-ark.vercel.app
     ```
   - 或者允许所有来源（仅测试用）：
     ```
     ALLOWED_ORIGINS=*
     ```

3. **Railway会自动重新部署**

---

## ✅ 部署完成检查清单

完成部署后，请检查以下项目：

### 后端检查
- [ ] Railway MongoDB运行正常
- [ ] Railway后端服务运行正常
- [ ] 数据库已初始化（seed脚本已运行）
- [ ] 环境变量全部配置正确
- [ ] 公共URL可以访问
- [ ] API端点响应正常：`https://your-backend.railway.app/api/health`

### 前端检查
- [ ] Vercel构建成功（绿色✓）
- [ ] `VITE_API_URL` 环境变量已配置
- [ ] 前端可以访问
- [ ] 可以成功登录
- [ ] API请求正常工作
- [ ] 没有CORS错误

### 测试账号
```
管理员：13000000001 / password
销售经理：13000000002 / password
技术工程师：13000000003 / password
商务工程师：13000000004 / password
生产计划员：13000000005 / password
采购专员：13000000006 / password
车间工人：13000000007 / password
质检员：13000000008 / password
```

---

## 🐛 常见问题解决

### 问题1：前端无法连接后端

**症状**：登录失败，API请求404

**解决**：
1. 检查Vercel的 `VITE_API_URL` 是否正确
2. 确认URL末尾有 `/api`
3. 检查Railway后端是否运行中
4. 在浏览器开发者工具查看Network请求

### 问题2：CORS错误

**症状**：控制台显示 CORS policy blocked

**解决**：
1. 在Railway后端添加/更新 `ALLOWED_ORIGINS`
2. 设置为Vercel前端的完整URL
3. 等待Railway自动重新部署（约1分钟）

### 问题3：登录后数据为空

**症状**：可以登录但没有数据

**解决**：
1. 确认数据库已初始化
2. 运行：`npm run seed:final`
3. 检查MongoDB连接是否正常

### 问题4：Vercel构建失败

**症状**：Build Logs显示错误

**解决**：
1. 检查是否所有依赖都在 `package.json` 中
2. 确认 `cmdk` 版本为 `^0.2.0`（已修复）
3. 查看详细错误日志
4. 检查 `vite.config.js` 配置

---

## 📊 监控和维护

### 查看日志

**Vercel日志**：
```
https://vercel.com/your-project/deployments
```

**Railway日志**：
```
在Railway项目中点击 "View Logs"
```

### 性能监控

**Vercel Analytics**（可选）：
1. 在Vercel项目中启用 Analytics
2. 查看访问量、性能指标

**Railway Metrics**：
1. 在Railway项目查看 CPU、内存使用
2. 监控数据库连接数

### 自动部署

**前端自动部署**：
```bash
# 任何推送到main分支的代码都会自动部署
git push origin main
```

**后端自动部署**：
```bash
# Railway也会自动检测GitHub更新
git push origin main
```

---

## 🎉 部署成功！

如果一切正常，您的系统现在已经：

✅ 前端部署在Vercel
✅ 后端部署在Railway
✅ 数据库运行在Railway MongoDB
✅ 全球CDN加速
✅ 自动HTTPS
✅ 自动部署
✅ 24/7在线

**访问地址**：
```
https://your-project.vercel.app
```

**分享给团队**：
```
项目已上线！
访问：https://your-project.vercel.app

测试账号：
管理员：13000000001 / password
销售经理：13000000002 / password
```

---

## 📞 需要帮助？

如果遇到问题，请检查：
1. ✅ 本文档的常见问题部分
2. ✅ Vercel和Railway的部署日志
3. ✅ 浏览器开发者工具的Console和Network标签

**祝部署顺利！** 🚀

---

**文档版本**: v1.0  
**最后更新**: 2025-10-31  
**维护团队**: Project Ark

