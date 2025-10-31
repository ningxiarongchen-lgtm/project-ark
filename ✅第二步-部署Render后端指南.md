# ✅ 第二步：部署 Render 后端（10分钟完成）

**前提：** ✅ MongoDB Atlas 香港节点已配置完成  
**目标：** 将后端部署到 Render，让前端可以连接

---

## 🚀 开始部署

### 1️⃣ 注册 Render 账号

**打开新的浏览器标签页**，访问：
```
https://render.com
```

操作步骤：
1. 点击右上角：**Get Started** 或 **Sign Up**
2. 选择：**Sign Up with GitHub** ⭐（推荐，最快）
3. 授权 Render 访问您的 GitHub 账号
4. 完成注册

✅ **账号创建完成！**

---

### 2️⃣ 创建 Web Service

进入 Render Dashboard 后：

```
1. 点击右上角：New +
2. 在下拉菜单中选择：Web Service
```

---

### 3️⃣ 连接 GitHub 仓库

在 "Create a new Web Service" 页面：

#### 方法 A：如果看到仓库列表
```
1. 找到您的仓库（可能显示为）：
   - project-ark
   - Model Selection System
   - ningxiarongchen-lgtm/project-ark
   
2. 点击仓库右侧的：Connect
```

#### 方法 B：如果没有看到仓库
```
1. 点击：Configure account（配置账号）
2. 授权 Render 访问所有仓库 或 选择特定仓库
3. 返回后刷新页面
4. 找到仓库并点击：Connect
```

---

### 4️⃣ 配置服务（重要 - 请仔细填写）

在配置页面，按以下内容填写：

#### 基本配置

**Name（服务名称）**
```
project-ark-backend
```

**Region（区域）** ⭐ 重要
```
选择：Singapore (Southeast Asia)
```
💡 新加坡离香港最近，延迟最低

**Branch（分支）**
```
main
```

**Root Directory（根目录）** ⭐⭐⭐ 非常重要
```
backend
```
⚠️ 必须填写 `backend`，否则部署会失败

**Runtime（运行环境）**
```
Node
```

**Build Command（构建命令）**
```
npm install
```

**Start Command（启动命令）**
```
node server.js
```

**Instance Type（实例类型）**
```
选择：Free
```

---

### 5️⃣ 配置环境变量（关键步骤）

往下滚动，找到 **Environment Variables** 部分：

1. 点击：**Advanced** （展开高级选项）
2. 依次添加以下 6 个环境变量

#### 变量 1: NODE_ENV
```
Key:   NODE_ENV
Value: production
```

#### 变量 2: PORT
```
Key:   PORT
Value: 5001
```

#### 变量 3: MONGODB_URI ⭐⭐⭐ 最重要
```
Key:   MONGODB_URI
Value: [粘贴您的 MongoDB 连接字符串]
```

**示例格式：**
```
mongodb+srv://arkadmin:你的密码@project-ark-hk.xxxxx.mongodb.net/cmax?retryWrites=true&w=majority
```

⚠️ **重要提醒：**
- 确保 `<password>` 已替换为实际密码
- 确保末尾有 `/cmax?retryWrites=true&w=majority`
- 不要有多余的空格

#### 变量 4: JWT_SECRET
```
Key:   JWT_SECRET
Value: 624f154889a31793e7a74857fc8699296080cd1883bce90a6ff75d831f8dc77736037dddc00e14f9c0dbfefb42916ecb0dae6eb86c8133b821ab56e494f4d6dd
```

#### 变量 5: JWT_REFRESH_SECRET
```
Key:   JWT_REFRESH_SECRET
Value: 0bef6a83aa1e56bcf61f4f9fdce62d16e7ec90dc221e734d4ba6b21f8f9efd965786cb8bd542e127113a33711f5ef9c7e2bedf9194ef0c4d1d49e59270aa66d4
```

#### 变量 6: ALLOWED_ORIGINS ⭐ 前后端连接关键
```
Key:   ALLOWED_ORIGINS
Value: https://project-ark-one.vercel.app
```

💡 这是您的 Vercel 前端地址，允许前端访问后端

---

### 6️⃣ 创建并部署

检查所有配置无误后：

```
1. 滚动到页面最底部
2. 点击蓝色按钮：Create Web Service
3. 等待部署开始
```

---

### 7️⃣ 等待部署完成（5-10分钟）

部署过程会显示实时日志，您会看到：

```
==> Cloning from GitHub...
==> Downloading cache...
==> Build started
==> Running build command: npm install
==> Installing dependencies...
==> Build completed successfully ✅
==> Starting service...
==> Service is live ✅
```

**部署成功标志：**
- 页面顶部显示绿色 "Live"
- 显示您的后端 URL

**您的后端 URL 格式：**
```
https://project-ark-backend.onrender.com
或
https://project-ark-backend-xxxx.onrender.com
```

📝 **请保存这个 URL，下一步配置 Vercel 时需要用！**

---

### 8️⃣ 初始化数据库（重要）

部署成功后，需要初始化数据库数据：

#### 进入 Shell 终端
```
1. 在 Render 服务页面，点击顶部的 "Shell" 标签
2. 等待终端加载（可能需要 10-20 秒）
3. 看到命令行提示符后继续
```

#### 执行初始化命令
```bash
npm run seed:final
```

#### 等待完成（约30-60秒）
应该看到类似输出：
```
🔄 开始数据初始化...
✅ 数据库连接成功
✅ 清理旧数据...
✅ 创建管理员账号
✅ 创建 9 个测试用户
✅ 导入 337 个产品数据
✅ 数据初始化完成！

测试账号：
管理员：13000000001 / password
销售经理：13000000002 / password
技术工程师：13000000003 / password
```

✅ **数据库初始化完成！**

---

### 9️⃣ 测试后端健康检查

#### 方法 1：浏览器测试
打开新标签页，访问：
```
https://你的后端URL/api/health
```

例如：
```
https://project-ark-backend.onrender.com/api/health
```

**应该看到：**
```json
{
  "status": "OK",
  "message": "Project Ark Platform API is running",
  "environment": "production",
  "timestamp": "2025-10-31T..."
}
```

#### 方法 2：在 Render Shell 中测试
```bash
curl http://localhost:5001/api/health
```

✅ **后端部署成功！**

---

## 📝 记录部署信息

请将以下信息记录下来：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Render 后端部署信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

后端 URL:
https://_________________.onrender.com

服务名称: project-ark-backend
区域: Singapore (Southeast Asia)
实例类型: Free

部署时间: 2025-10-31
状态: ✅ Live

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⚠️ 常见问题与解决方案

### Q1: 部署失败，显示 "Build failed"

**可能原因：**
- Root Directory 未填写 `backend`
- GitHub 仓库连接问题
- package.json 文件问题

**解决方案：**
```
1. 检查 Root Directory 是否正确填写 "backend"
2. 查看部署日志（Logs 标签）找到具体错误
3. 确认 GitHub 仓库中 backend 文件夹存在
4. 如果需要，删除服务重新创建
```

### Q2: 部署成功但访问 /api/health 超时

**原因：** Render 免费版会在 15 分钟无访问后休眠

**解决方案：**
```
1. 首次访问需要等待 30-60 秒唤醒服务
2. 刷新页面重试
3. 可选：配置 UptimeRobot 防休眠（见下文）
```

### Q3: 数据库初始化失败

**检查清单：**
```
✓ MONGODB_URI 环境变量是否正确
✓ 密码是否正确替换（没有 <password>）
✓ 连接字符串末尾是否有 /cmax
✓ MongoDB Atlas Network Access 是否配置 0.0.0.0/0
✓ MongoDB 用户权限是否为 Atlas admin
```

### Q4: Shell 无法打开

**解决方案：**
```
1. 等待服务完全启动（状态显示 Live）
2. 刷新浏览器页面
3. 使用 Chrome/Edge 浏览器
4. 检查浏览器控制台是否有错误
```

### Q5: 环境变量修改后不生效

**重要：** 修改环境变量后需要重新部署

**操作步骤：**
```
1. Settings → Environment Variables → 修改变量
2. 点击 Save
3. 回到 Overview 页面
4. 点击右上角 Manual Deploy → Deploy latest commit
5. 等待重新部署完成
```

---

## 🎯 下一步操作

✅ **Render 后端部署完成后，继续第三步：**

```
第三步：配置 Vercel 前端环境变量
- 将 Render 后端 URL 添加到 Vercel
- 重新部署前端
- 测试前后端连接
```

---

## 🔧 可选：配置 UptimeRobot 防休眠

**目的：** 防止 Render 免费版 15 分钟后休眠

### 1. 注册 UptimeRobot
```
访问：https://uptimerobot.com
点击：Sign Up
使用邮箱注册（免费）
```

### 2. 添加监控
```
Dashboard → Add New Monitor

Monitor Type: HTTP(s)
Friendly Name: Project Ark Backend
URL: https://你的后端URL/api/health
Monitoring Interval: Every 5 minutes

点击：Create Monitor
```

### 3. 验证
```
监控创建后，UptimeRobot 会每 5 分钟访问一次您的后端
这样 Render 就不会休眠了
```

✅ **防休眠配置完成！**

---

## 📊 性能优化建议

### 冷启动时间优化
```
Render 免费版休眠后，首次访问需要 30-60 秒
建议：
1. 配置 UptimeRobot 保持活跃
2. 升级到付费版（$7/月）可以避免休眠
```

### 数据库连接优化
```
已配置：
✅ 连接池管理
✅ 自动重连机制
✅ 超时处理

如果遇到连接问题：
- 检查 MongoDB Atlas 状态
- 查看 Render Logs 标签
```

---

## 🆘 需要帮助？

如果遇到问题，请提供：

```
1. 具体在哪一步遇到问题
2. 错误信息（截图或文字）
3. Render 部署日志（Logs 标签内容）
4. 后端 URL
```

---

## ✅ 部署检查清单

完成后请确认：

- [ ] Render 账号已创建
- [ ] Web Service 已创建（名称：project-ark-backend）
- [ ] Root Directory 设置为 `backend`
- [ ] 6 个环境变量全部配置正确
- [ ] 部署状态显示 "Live"（绿色）
- [ ] 已运行 `npm run seed:final`
- [ ] `/api/health` 接口返回正常
- [ ] 后端 URL 已记录
- [ ] （可选）UptimeRobot 已配置

---

**准备好了吗？开始部署！** 🚀

访问：https://render.com

完成后告诉我您的后端 URL，我会帮您配置第三步！
