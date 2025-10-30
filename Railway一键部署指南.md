# 🚂 Railway.app 一键部署指南
## 15分钟完成，完全免费

---

## 📋 准备工作（5分钟）

### 第1步：确保代码已提交到Git

```bash
cd "/Users/hexiaoxiao/Desktop/Model Selection System"

# 查看Git状态
git status

# 如果有未提交的文件，先提交
git add .
git commit -m "准备部署到Railway"
```

### 第2步：推送到GitHub

#### 选项A：如果还没有GitHub仓库

```bash
# 1. 到GitHub创建新仓库
# 访问：https://github.com/new
# 仓库名：project-ark
# 设置为Private（私有）

# 2. 添加远程仓库并推送
git remote add origin https://github.com/你的用户名/project-ark.git
git branch -M main
git push -u origin main
```

#### 选项B：如果已有GitHub仓库

```bash
# 直接推送
git push origin main
```

---

## 🚀 Railway部署（10分钟）

### 第1步：注册Railway账号

1. 访问：https://railway.app
2. 点击右上角 "Login"
3. 选择 "Login with GitHub"（使用GitHub账号登录）
4. 授权Railway访问你的GitHub仓库

### 第2步：创建新项目

1. 登录后，点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 在列表中找到并选择 `project-ark`
4. Railway开始自动检测项目结构

### 第3步：部署MongoDB数据库

1. 在项目中点击 "+ New"
2. 选择 "Database"
3. 点击 "Add MongoDB"
4. Railway会自动创建一个MongoDB实例
5. 等待数据库创建完成（约30秒）

6. **复制数据库连接字符串**：
   - 点击MongoDB服务
   - 进入 "Variables" 标签
   - 找到 `MONGO_URL`
   - 点击复制（格式类似：`mongodb://mongo:xxx@containers-us-west-xxx.railway.app:7777`）

### 第4步：配置后端服务

1. **点击你的GitHub仓库服务**（应该已经自动创建）

2. **配置构建设置**：
   - 点击 "Settings"
   - Root Directory: 输入 `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **添加环境变量**：
   - 点击 "Variables" 标签
   - 点击 "New Variable"
   - 逐个添加以下变量：

```env
NODE_ENV=production

PORT=5001

# MongoDB连接（使用第3步复制的MONGO_URL）
MONGODB_URI=mongodb://mongo:xxx@containers-us-west-xxx.railway.app:7777

# JWT密钥（从 JWT密钥-生产环境专用.txt 文件复制）
JWT_SECRET=624f154889a31793e7a74857fc8699296080cd1883bce90a6ff75d831f8dc77736037dddc00e14f9c0dbfefb42916ecb0dae6eb86c8133b821ab56e494f4d6dd

JWT_REFRESH_SECRET=0bef6a83aa1e56bcf61f4f9fdce62d16e7ec90dc221e734d4ba6b21f8f9efd965786cb8bd542e127113a33711f5ef9c7e2bedf9194ef0c4d1d49e59270aa66d4

SESSION_SECRET=22bcf597c05557d9202e4690bab21bd5646fb8166890748b31d24be62f9a201ff47d0e6435a5f90efa1321fe64798941a78505943b53fe56046a5aaaeddbd9d2

# CORS（前端部署后再填写，现在先设置为*）
ALLOWED_ORIGINS=*
```

4. **生成公共URL**：
   - 点击 "Settings"
   - 找到 "Domains"
   - 点击 "Generate Domain"
   - 会生成类似：`https://project-ark-production.up.railway.app`
   - **复制这个URL，稍后需要用**

5. **触发部署**：
   - 点击 "Deploy"
   - 或等待自动部署
   - 查看部署日志，等待完成（约2-3分钟）

### 第5步：初始化数据库

Railway部署完成后，需要初始化数据库数据。

#### 方法A：本地连接Railway的MongoDB初始化（推荐）

```bash
# 在本地终端运行
cd "/Users/hexiaoxiao/Desktop/Model Selection System/backend"

# 使用Railway的MongoDB连接字符串
MONGODB_URI="mongodb://mongo:xxx@containers-us-west-xxx.railway.app:7777" npm run seed:final
```

#### 方法B：创建一次性部署任务

1. 在Railway项目中，点击后端服务
2. 点击 "Settings"
3. 在 "Deploy" 部分，临时修改 Start Command：
   ```
   npm run seed:final && npm start
   ```
4. 重新部署一次
5. 等待数据初始化完成后，改回：
   ```
   npm start
   ```

### 第6步：测试后端API

```bash
# 测试健康检查（替换成你的Railway URL）
curl https://project-ark-production.up.railway.app/api/health

# 应该返回：
# {"status":"ok","message":"API is running"}
```

---

## 🎨 部署前端到Vercel（5分钟）

### 第1步：注册Vercel账号

1. 访问：https://vercel.com
2. 点击 "Sign Up"
3. 选择 "Continue with GitHub"
4. 授权Vercel访问GitHub

### 第2步：导入项目

1. 点击 "Add New..." → "Project"
2. 找到并点击 `project-ark`
3. 点击 "Import"

### 第3步：配置项目

1. **Framework Preset**: 选择 `Vite`

2. **Root Directory**: 点击 "Edit"，输入 `frontend`

3. **Environment Variables**: 添加环境变量
   - Name: `VITE_API_URL`
   - Value: `https://project-ark-production.up.railway.app`（你的Railway后端URL）

4. 点击 "Deploy"

5. 等待构建完成（约1-2分钟）

### 第4步：获取前端URL

1. 部署完成后，Vercel会显示：
   ```
   🎉 Your project is ready!
   https://project-ark.vercel.app
   ```

2. **复制这个URL**

### 第5步：更新后端CORS配置

1. 回到Railway
2. 点击后端服务
3. 进入 "Variables"
4. 找到 `ALLOWED_ORIGINS`
5. 修改为你的Vercel URL：
   ```
   https://project-ark.vercel.app
   ```
6. 保存后会自动重新部署

---

## ✅ 测试访问

1. **打开前端URL**：
   ```
   https://project-ark.vercel.app
   ```

2. **使用测试账号登录**：
   - 销售经理：`13000000002` / `password`
   - 技术工程师：`13000000003` / `password`

3. **测试各项功能**：
   - ✅ 登录成功
   - ✅ 仪表盘显示正常
   - ✅ 项目管理功能正常
   - ✅ 产品目录加载正常

---

## 🔄 后续更新流程（修复Bug）

### 自动部署（推荐）

```bash
# 1. 本地修改代码
# 编辑文件，修复bug...

# 2. 提交到Git
git add .
git commit -m "fix: 修复XXX问题"
git push origin main

# 3. 自动部署
# Railway和Vercel会自动检测到代码更新
# 约1-2分钟后自动完成部署
# 无需任何手动操作！
```

### 查看部署状态

1. **Railway**：
   - 访问：https://railway.app
   - 进入项目
   - 查看 "Deployments" 标签
   - 可以看到实时部署日志

2. **Vercel**：
   - 访问：https://vercel.com
   - 进入项目
   - 查看 "Deployments" 标签
   - 可以看到构建状态

---

## 🎯 完成检查清单

- [ ] GitHub仓库已创建并推送代码
- [ ] Railway账号已注册
- [ ] MongoDB数据库已创建
- [ ] 后端服务已部署到Railway
- [ ] 后端环境变量已配置（JWT密钥、数据库连接）
- [ ] 后端公共URL已生成
- [ ] 数据库已初始化（种子数据）
- [ ] Vercel账号已注册
- [ ] 前端已部署到Vercel
- [ ] 前端环境变量已配置（后端API URL）
- [ ] 后端CORS已更新（允许前端域名）
- [ ] 可以通过网址访问系统
- [ ] 测试账号可以登录
- [ ] 主要功能测试通过

---

## 📊 部署信息记录

完成部署后，记录以下信息：

```
项目名称：Project Ark - CMAX系统
部署日期：2025-10-30

前端URL：https://project-ark.vercel.app
后端URL：https://project-ark-production.up.railway.app
数据库：MongoDB on Railway

测试账号：
- 管理员：13000000001 / password
- 销售经理：13000000002 / password
- 技术工程师：13000000003 / password

GitHub仓库：https://github.com/你的用户名/project-ark
Railway项目：https://railway.app/project/你的项目ID
Vercel项目：https://vercel.com/你的用户名/project-ark
```

---

## 🆘 常见问题

### Q1: 后端部署失败，显示"Module not found"

**解决**：
1. 检查 Root Directory 是否设置为 `backend`
2. 检查 Build Command 是否为 `npm install`
3. 查看部署日志，找到具体缺少的模块

### Q2: 前端可以访问，但API请求失败（CORS错误）

**解决**：
1. 确认后端 `ALLOWED_ORIGINS` 包含前端URL
2. 确认前端 `VITE_API_URL` 是正确的后端URL
3. 重新部署后端和前端

### Q3: 登录失败，显示"数据库连接错误"

**解决**：
1. 检查Railway的MongoDB是否正在运行
2. 检查 `MONGODB_URI` 是否正确
3. 确认数据已初始化（运行seed脚本）

### Q4: 数据库是空的，没有用户

**解决**：
```bash
# 重新运行种子数据脚本
cd backend
MONGODB_URI="你的Railway MongoDB连接字符串" npm run seed:final
```

### Q5: Railway显示"Out of credits"

**解决**：
- Railway每月有$5免费额度
- 如果超出，可以：
  1. 升级到Hobby计划（$5/月）
  2. 或优化应用减少资源使用
  3. 或切换到其他免费服务

---

## 🎉 恭喜！

你的系统现在已经部署到云端：
- ✅ 24/7在线，本机不开机也能访问
- ✅ 团队成员通过网址访问
- ✅ 代码推送自动部署
- ✅ 完全免费（在免费额度内）
- ✅ 自动HTTPS加密
- ✅ 全球CDN加速

**分享给团队**：
```
系统访问地址：https://project-ark.vercel.app

测试账号：
- 销售经理：13000000002 / password
- 技术工程师：13000000003 / password
```

需要修改功能或修复bug时，只需：
1. 本地修改代码
2. `git push`
3. 等待1-2分钟自动部署完成！

---

**祝部署顺利！** 🚀

如有问题随时联系！

