# 🚀 立即部署 - Render 后端（10分钟完成）

**问题**: 前端无法登录，因为后端还没有部署  
**解决**: 按以下步骤部署后端到 Render  

---

## 第一步：部署 MongoDB Atlas 香港节点（5分钟）

### 1. 注册 MongoDB Atlas

**打开浏览器新标签页**，访问：
```
https://www.mongodb.com/cloud/atlas/register
```

- 点击：**Sign up with Google**（最快）
- 使用您的 Google 账号登录
- 完成注册

### 2. 创建免费集群（重要）

登录后会看到创建集群页面：

**Step 1 - 选择套餐**
```
选择：Shared (FREE) ← 点击这个
```

**Step 2 - 选择云服务商和区域（关键步骤）**
```
Provider（云服务商）: AWS
Region（区域）: ⭐ Hong Kong (ap-east-1)
```

⚠️ **非常重要**：必须选择 **Hong Kong (ap-east-1)**，不要选其他区域！

**Step 3 - 集群名称**
```
Cluster Name: project-ark-hk
```

**Step 4 - 创建**
```
点击：Create
等待 3-5 分钟
```

### 3. 创建数据库用户

集群创建完成后：

```
左侧菜单 → Security → Database Access
点击：+ ADD NEW DATABASE USER

Username: arkadmin
Authentication Method: Password
Password: 点击 "Autogenerate Secure Password"

【重要】复制并保存这个密码：
密码：_________________（写在这里）

Database User Privileges: Atlas admin
点击：Add User
```

### 4. 配置网络访问

```
左侧菜单 → Security → Network Access
点击：+ ADD IP ADDRESS

选择：ALLOW ACCESS FROM ANYWHERE
会自动填入：0.0.0.0/0
点击：Confirm
```

### 5. 获取连接字符串（关键）

```
左侧菜单 → Database
找到你的集群：project-ark-hk
点击：Connect

选择：Connect your application

Driver: Node.js
Version: 4.1 or later

复制连接字符串（类似这样）：
mongodb+srv://arkadmin:<password>@project-ark-hk.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

⚠️ **重要操作**：
1. 把 `<password>` 替换成刚才保存的密码
2. 在末尾 `mongodb.net/` 后面加上 `cmax`
3. 最终格式应该是：
   ```
   mongodb+srv://arkadmin:你的密码@project-ark-hk.xxxxx.mongodb.net/cmax?retryWrites=true&w=majority
   ```

**保存这个完整的连接字符串，下一步要用！**

✅ **MongoDB Atlas 完成！**

---

## 第二步：部署后端到 Render（10分钟）

### 1. 注册 Render

**打开新标签页**，访问：
```
https://render.com
```

- 点击：**Get Started**
- 选择：**Sign Up with GitHub**
- 授权 Render 访问您的 GitHub

### 2. 创建 Web Service

```
在 Dashboard 页面：
点击：New + （右上角）
选择：Web Service
```

### 3. 连接 GitHub 仓库

```
找到仓库：ningxiarongchen-lgtm/project-ark
点击：Connect
```

### 4. 配置服务（重要，请仔细填写）

**Name（服务名称）**
```
project-ark-backend
```

**Region（区域）**
```
Singapore (Southeast Asia) ← 选这个（离香港最近）
```

**Branch（分支）**
```
main
```

**Root Directory（根目录）** ⭐
```
backend
```

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
Free
```

### 5. 配置环境变量（关键步骤）

往下滚动，找到 **Environment Variables** 部分，点击 **Advanced**

依次添加以下 6 个环境变量：

#### 变量 1: NODE_ENV
```
Key: NODE_ENV
Value: production
```

#### 变量 2: PORT
```
Key: PORT
Value: 5001
```

#### 变量 3: MONGODB_URI ⭐（使用第一步的连接字符串）
```
Key: MONGODB_URI
Value: mongodb+srv://arkadmin:你的密码@project-ark-hk.xxxxx.mongodb.net/cmax?retryWrites=true&w=majority
```
⚠️ 这里填写第一步保存的完整 MongoDB 连接字符串

#### 变量 4: JWT_SECRET
```
Key: JWT_SECRET
Value: 624f154889a31793e7a74857fc8699296080cd1883bce90a6ff75d831f8dc77736037dddc00e14f9c0dbfefb42916ecb0dae6eb86c8133b821ab56e494f4d6dd
```

#### 变量 5: JWT_REFRESH_SECRET
```
Key: JWT_REFRESH_SECRET
Value: 0bef6a83aa1e56bcf61f4f9fdce62d16e7ec90dc221e734d4ba6b21f8f9efd965786cb8bd542e127113a33711f5ef9c7e2bedf9194ef0c4d1d49e59270aa66d4
```

#### 变量 6: ALLOWED_ORIGINS ⭐
```
Key: ALLOWED_ORIGINS
Value: https://project-ark-one.vercel.app
```
⚠️ 这是您的 Vercel 前端地址

### 6. 创建服务

```
点击：Create Web Service（最下方）
```

### 7. 等待部署完成

部署需要 5-10 分钟，您会看到：
```
==> Build started
==> Installing dependencies
==> Build completed successfully
==> Starting service
==> Service is live
```

部署完成后，页面顶部会显示您的后端 URL：
```
https://project-ark-backend.onrender.com
或
https://project-ark-backend-xxxx.onrender.com
```

**保存这个 URL，马上要用！**

### 8. 初始化数据库

部署成功后：

```
在 Render 页面找到 "Shell" 标签
点击进入在线终端

执行命令：
npm run seed:final

等待 30 秒，看到：
✅ 数据初始化完成
✅ 创建了 9 个测试用户
✅ 创建了 337 个产品
```

✅ **Render 后端完成！**

---

## 第三步：配置 Vercel 环境变量（2分钟）

### 1. 进入 Vercel 项目

```
访问：https://vercel.com/dashboard
找到项目：project-ark 或 kay's projects
点击进入
```

### 2. 进入设置

```
点击顶部：Settings
点击左侧：Environment Variables
```

### 3. 添加环境变量

```
点击：Add New

Key（变量名）:
VITE_API_URL

Value（变量值）:
https://project-ark-backend.onrender.com
（填写刚才 Render 的后端 URL）

Environment（环境）:
✅ Production
✅ Preview
✅ Development

点击：Save
```

### 4. 重新部署

```
点击顶部：Deployments
找到最新的部署记录
点击右侧的 ... 菜单
选择：Redeploy
确认重新部署
等待 1-2 分钟
```

✅ **Vercel 配置完成！**

---

## 第四步：测试系统（3分钟）

### 1. 测试后端

浏览器访问：
```
https://project-ark-backend.onrender.com/api/health
```

应该看到：
```json
{
  "status": "OK",
  "message": "Project Ark Platform API is running",
  "timestamp": "2025-10-31T..."
}
```

✅ 后端正常

### 2. 测试前端

访问：
```
https://project-ark-one.vercel.app
```

应该看到登录页面

### 3. 测试登录

输入测试账号：
```
手机号：13000000002
密码：password
```

点击登录，应该：
- ✅ 登录按钮不再一直转圈
- ✅ 成功登录并跳转到仪表盘
- ✅ 可以看到数据

🎉 **部署全部完成！**

---

## 📝 部署信息记录

请记录以下信息：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project Ark - 部署信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

前端 URL:
https://project-ark-one.vercel.app

后端 URL:
https://_________________.onrender.com

MongoDB 连接字符串:
mongodb+srv://arkadmin:_______@project-ark-hk._____.mongodb.net/cmax?retryWrites=true&w=majority

数据库用户名: arkadmin
数据库密码: _________________

测试账号:
管理员：13000000001 / password
销售经理：13000000002 / password
技术工程师：13000000003 / password
商务工程师：13000000004 / password

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⚠️ 常见问题

### Q1: Render 部署失败，显示 "Build failed"

**解决**：
1. 检查 Root Directory 是否填写 `backend`
2. 检查 Build Command 是否为 `npm install`
3. 查看部署日志找到具体错误

### Q2: 后端部署成功，但访问超时

**原因**: Render 免费版 15 分钟无访问会休眠，第一次访问需要等待 30 秒唤醒

**解决**: 等待 30 秒后刷新，或配置 UptimeRobot 防休眠

### Q3: 登录仍然失败

**检查**：
1. Vercel 的 `VITE_API_URL` 是否正确
2. Render 的 `ALLOWED_ORIGINS` 是否包含 Vercel 地址
3. Render 的 `MONGODB_URI` 是否正确
4. 是否运行了 `npm run seed:final`

### Q4: MongoDB 连接失败

**检查**：
1. 密码中的特殊字符是否需要 URL 编码
2. 连接字符串末尾是否有 `/cmax`
3. Network Access 是否配置了 0.0.0.0/0

---

## 🎯 下一步（可选）

### 配置 UptimeRobot 防止 Render 休眠

1. **注册**: https://uptimerobot.com
2. **创建监控**:
   ```
   Monitor Type: HTTP(s)
   URL: https://your-backend.onrender.com/api/health
   Interval: Every 5 minutes
   ```
3. **保存**: 这样 Render 就不会休眠了

---

## 🆘 需要帮助？

如果遇到问题，请告诉我：
1. 在哪一步遇到了问题
2. 具体的错误信息
3. 截图（如果有）

我会帮您解决！

---

**现在开始第一步：创建 MongoDB Atlas 香港节点** 🚀

打开浏览器访问：https://www.mongodb.com/cloud/atlas/register

