# ⚡ 快速部署指南 - Cloudflare Pages + Render

> **目标**: 5分钟内完成前后端自动部署配置！

## 📋 前置准备

确保你已有：
- ✅ GitHub 账号
- ✅ Cloudflare 账号（免费）
- ✅ Render 账号（免费）
- ✅ MongoDB Atlas 数据库（免费）

---

## 🚀 第一步：后端部署（Render）

### 1. 登录 Render
访问：https://dashboard.render.com/

### 2. 创建 Web Service
1. 点击 **New +** → **Web Service**
2. 连接 GitHub 仓库
3. 选择仓库：`Model Selection System`

### 3. 配置服务
```
Name: model-selection-backend
Region: Singapore
Branch: main
Runtime: Node
Build Command: cd backend && npm install
Start Command: cd backend && npm start
Instance Type: Free
```

### 4. 添加环境变量
点击 **Environment** 标签，添加：

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=你的MongoDB连接字符串
JWT_SECRET=随机生成32位以上字符串
CORS_ORIGIN=https://model-selection-frontend.pages.dev
```

**生成 JWT_SECRET**：
```bash
# 在终端运行
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. 创建数据库（MongoDB Atlas）

如果还没有数据库：

1. 访问：https://www.mongodb.com/cloud/atlas
2. 创建免费集群（选择最近的区域）
3. 创建数据库用户（记住用户名和密码）
4. 添加 IP 白名单：`0.0.0.0/0`（允许所有IP）
5. 获取连接字符串（替换 `<password>` 为你的密码）

### 6. 部署并获取 Deploy Hook

1. 点击 **Create Web Service**
2. 等待首次部署完成（约3-5分钟）
3. 进入 **Settings** → **Deploy Hook**
4. 点击 **Create Deploy Hook**
5. **复制 Hook URL**（格式：`https://api.render.com/deploy/srv-xxxxx?key=yyyyy`）

✅ **后端 URL**：`https://model-selection-backend.onrender.com`

---

## 🎨 第二步：前端部署（Cloudflare Pages）

### 1. 登录 Cloudflare
访问：https://dash.cloudflare.com/

### 2. 创建 Pages 项目
1. 左侧菜单 → **Workers & Pages**
2. **Create application** → **Pages** → **Connect to Git**
3. 授权 GitHub
4. 选择仓库：`Model Selection System`

### 3. 配置构建
```
Project name: model-selection-frontend
Production branch: main
Framework preset: Vite
Build command: cd frontend && npm install && npm run build
Build output directory: frontend/dist
Root directory: /
```

### 4. 添加环境变量
在项目设置中添加：

```bash
NODE_ENV=production
VITE_API_URL=https://model-selection-backend.onrender.com
```

**注意**：将后端URL替换为你在第一步获得的实际URL

### 5. 部署
1. 点击 **Save and Deploy**
2. 等待部署完成（约2-3分钟）

✅ **前端 URL**：`https://model-selection-frontend.pages.dev`

---

## 🔐 第三步：配置 GitHub Secrets

### 1. 获取 Cloudflare 凭证

**获取 API Token**：
1. 访问：https://dash.cloudflare.com/profile/api-tokens
2. **Create Token** → 使用 **Edit Cloudflare Workers** 模板
3. 配置权限：Account - Cloudflare Pages: Edit
4. **Create Token** → **复制 Token**（只显示一次！）

**获取 Account ID**：
1. 在 Cloudflare Dashboard 右侧
2. 找到并复制 **Account ID**

### 2. 添加 GitHub Secrets

访问：`https://github.com/你的用户名/Model-Selection-System/settings/secrets/actions`

添加以下 Secrets：

| Secret Name | Value | 从哪里获取 |
|------------|-------|-----------|
| `CLOUDFLARE_API_TOKEN` | cfp_xxx... | Cloudflare API Tokens 页面 |
| `CLOUDFLARE_ACCOUNT_ID` | abc123... | Cloudflare Dashboard 右侧 |
| `RENDER_DEPLOY_HOOK` | https://api.render.com/deploy/... | Render Settings → Deploy Hook |

**添加方法**：
1. 点击 **New repository secret**
2. Name：输入 Secret 名称
3. Secret：粘贴对应值
4. 点击 **Add secret**

---

## ✅ 第四步：测试自动部署

### 测试前端自动部署

```bash
# 在项目根目录
cd "/Users/hexiaoxiao/Desktop/Model Selection System"

# 修改一个前端文件
echo "/* Test deployment */" >> frontend/src/App.jsx

# 提交并推送
git add frontend/src/App.jsx
git commit -m "test: trigger frontend auto-deployment"
git push origin main
```

### 测试后端自动部署

```bash
# 修改一个后端文件
echo "// Test deployment" >> backend/server.js

# 提交并推送
git add backend/server.js
git commit -m "test: trigger backend auto-deployment"
git push origin main
```

### 查看部署状态

1. **GitHub Actions**：
   - 访问：`https://github.com/你的用户名/Model-Selection-System/actions`
   - 查看工作流运行状态

2. **Cloudflare Pages**：
   - Dashboard → Workers & Pages → model-selection-frontend
   - 查看 Deployments 历史

3. **Render**：
   - Dashboard → model-selection-backend
   - 查看 Events 标签页

---

## 🎯 第五步：初始化生产数据

部署完成后，需要初始化数据库：

### 方法 1：使用 Render Shell

1. 进入 Render Dashboard → 你的服务
2. 点击右上角 **Shell** 标签
3. 运行初始化命令：

```bash
cd backend
npm run init:production
```

### 方法 2：创建 API 端点（推荐）

后端已经有初始化脚本，你可以：
1. 创建一个一次性的初始化端点
2. 或者通过 Render Shell 运行

---

## 📊 验证部署

### 检查前端
访问：`https://model-selection-frontend.pages.dev`
- ✅ 页面正常加载
- ✅ 样式显示正确
- ✅ 可以访问登录页面

### 检查后端
访问：`https://model-selection-backend.onrender.com/api/health`
应该返回：
```json
{
  "status": "OK",
  "message": "Project Ark Platform API is running",
  "timestamp": "2025-11-06T..."
}
```

### 检查前后端连接
1. 在前端页面打开浏览器控制台（F12）
2. 尝试登录
3. 检查 Network 标签，确保 API 请求成功

---

## 🔧 常见问题速查

### 问题 1：后端休眠（Free Plan）

**现象**：首次访问响应慢（15秒+）

**解决方案**：使用 UptimeRobot 保持唤醒
1. 注册：https://uptimerobot.com/
2. 添加监控：`https://model-selection-backend.onrender.com/api/health`
3. 间隔：5分钟

### 问题 2：前端无法连接后端

**检查清单**：
- ✅ 后端 `CORS_ORIGIN` 包含前端域名
- ✅ 前端 `VITE_API_URL` 设置正确
- ✅ 后端服务正在运行
- ✅ MongoDB 连接成功

**快速修复**：
1. 更新 Render 环境变量中的 `CORS_ORIGIN`
2. 重新构建前端（Cloudflare Pages 设置中点 Retry deployment）

### 问题 3：GitHub Actions 失败

**Cloudflare 部署失败**：
- 检查 `CLOUDFLARE_API_TOKEN` 是否正确
- 确认 Token 权限包含 Cloudflare Pages Edit

**Render 部署失败**：
- 检查 `RENDER_DEPLOY_HOOK` URL 是否完整
- 确认 Hook 未过期

### 问题 4：MongoDB 连接失败

**检查**：
- ✅ IP 白名单包含 `0.0.0.0/0`
- ✅ 数据库用户密码正确
- ✅ 连接字符串格式正确
- ✅ 数据库集群正在运行

---

## 📱 配置自定义域名（可选）

### Cloudflare Pages 自定义域名

1. 进入项目 → **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名（如：`app.yourdomain.com`）
4. 按照提示添加 DNS 记录
5. 等待 SSL 证书自动配置（几分钟）

### Render 自定义域名

1. 进入服务 → **Settings** → **Custom Domain**
2. 点击 **Add Custom Domain**
3. 输入域名（如：`api.yourdomain.com`）
4. 添加 CNAME 记录指向 Render 提供的地址
5. 等待 SSL 证书自动配置

---

## 🎉 完成！

现在你的系统已经配置了自动部署：

✅ **前端**：推送 `frontend/` 目录代码 → Cloudflare Pages 自动部署  
✅ **后端**：推送 `backend/` 目录代码 → Render 自动部署  
✅ **健康监控**：GitHub Actions 每小时自动检查  

### 下次部署只需：

```bash
# 修改代码
git add .
git commit -m "feat: your changes"
git push origin main

# 就这样！自动部署会自动触发
```

---

## 📞 需要帮助？

查看详细配置指南：`自动部署配置指南.md`

或查看以下文件：
- `.github/workflows/cloudflare-pages.yml` - 前端部署配置
- `.github/workflows/render-backend.yml` - 后端部署配置
- `render.yaml` - Render 服务配置

---

**预计总时间**：15-20分钟  
**月费用**：$0（全部使用免费套餐）  
**性能**：
- 前端响应：< 100ms（Cloudflare 全球 CDN）
- 后端响应：< 500ms（首次唤醒可能需要 15 秒）
- 数据库：免费 512MB 存储

