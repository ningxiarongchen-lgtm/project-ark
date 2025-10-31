# ✅ 第三步：配置 Vercel 前端环境变量（3分钟）

**前提：**
- ✅ MongoDB Atlas 已配置完成
- ✅ Render 后端已部署成功
- ✅ 本地数据已迁移到云端

**目标：** 将 Render 后端 URL 配置到 Vercel，让前后端连接

---

## 🚀 开始配置

### 1️⃣ 进入 Vercel Dashboard

**打开浏览器**，访问：
```
https://vercel.com/dashboard
```

或者直接访问您的项目：
```
https://vercel.com/kays-projects-4ca96dbc/project-ark
```

---

### 2️⃣ 进入项目设置

在项目页面：

1. 找到您的项目：**project-ark**
2. 点击项目名称进入项目详情页
3. 点击顶部菜单的 **Settings**（设置）

---

### 3️⃣ 添加环境变量

在 Settings 页面：

1. 点击左侧菜单的 **Environment Variables**（环境变量）
2. 您会看到环境变量配置页面

---

### 4️⃣ 配置后端 API 地址

#### 检查是否已有 VITE_API_URL

**如果已经存在 `VITE_API_URL` 变量：**
1. 点击变量右侧的 **Edit**（编辑）或 **⋯** 菜单
2. 更新为新的 Render 后端地址

**如果没有这个变量：**
1. 点击页面上的 **Add New** 按钮
2. 按照下面填写

---

### 5️⃣ 填写环境变量

**Variable Name（变量名）：**
```
VITE_API_URL
```

**Value（变量值）：**
```
https://project-ark-efy7.onrender.com
```
⚠️ 这是您的 Render 后端地址，**不要在末尾加斜杠 `/`**

**Environment（应用环境）：**
```
✅ Production（生产环境）
✅ Preview（预览环境）
✅ Development（开发环境）
```
⚠️ 三个都要勾选！

---

### 6️⃣ 保存变量

1. 点击 **Save** 按钮保存
2. 确认变量已添加成功

---

### 7️⃣ 重新部署前端

⚠️ **重要：** 修改环境变量后，必须重新部署才能生效！

#### 方法 A：自动触发重新部署（推荐）
有些变量保存后会自动提示重新部署：
```
点击：Redeploy
等待 1-2 分钟
```

#### 方法 B：手动重新部署
如果没有自动提示：

1. 点击顶部菜单的 **Deployments**（部署记录）
2. 找到最新的部署记录（第一条）
3. 点击右侧的 **⋯** 菜单（三个点）
4. 选择：**Redeploy**（重新部署）
5. 在弹出框中选择：**Use existing Build Cache**（使用现有构建缓存）
6. 点击：**Redeploy** 确认
7. 等待重新部署完成（约 1-2 分钟）

---

### 8️⃣ 等待部署完成

部署过程中您会看到：
```
Building...
Running Build Command...
Deploying...
✅ Deployment Ready
```

看到 **Ready** 状态表示部署成功！

---

## 🧪 测试前后端连接

### 1️⃣ 测试后端健康检查

打开新浏览器标签页，访问：
```
https://project-ark-efy7.onrender.com/api/health
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

⚠️ 如果超时，等待 30-60 秒（Render 免费版唤醒时间），然后刷新

✅ 后端正常！

---

### 2️⃣ 测试前端访问

访问您的前端地址：
```
https://project-ark-one.vercel.app
```

**应该看到：**
- ✅ 登录页面正常显示
- ✅ 没有 API 连接错误
- ✅ 页面加载正常

---

### 3️⃣ 测试登录功能

在登录页面输入测试账号：

**管理员账号：**
```
手机号：13000000001
密码：password
```

**销售经理账号：**
```
手机号：13000000002
密码：password
```

**技术工程师账号：**
```
手机号：13000000003
密码：password
```

点击登录按钮，应该：
- ✅ 登录按钮不再无限转圈
- ✅ 成功登录并跳转到仪表盘
- ✅ 可以看到用户数据
- ✅ 可以正常操作系统

---

## 🎉 部署完成检查清单

请确认以下所有项目：

### MongoDB Atlas
- [ ] 集群已创建（香港节点）
- [ ] 数据库用户已创建
- [ ] Network Access 配置为 0.0.0.0/0
- [ ] 连接字符串已获取
- [ ] 本地数据已迁移到云端

### Render 后端
- [ ] Web Service 已创建
- [ ] Root Directory 设置为 `backend`
- [ ] 6 个环境变量已配置
- [ ] 部署状态显示 "Live"
- [ ] /api/health 接口返回正常

### Vercel 前端
- [ ] 环境变量 VITE_API_URL 已配置
- [ ] 指向正确的 Render 后端地址
- [ ] 已重新部署
- [ ] 前端可以正常访问

### 功能测试
- [ ] 可以访问登录页面
- [ ] 可以成功登录
- [ ] 仪表盘正常显示
- [ ] 数据加载正常
- [ ] 没有 CORS 错误
- [ ] 没有 API 连接错误

---

## ⚠️ 常见问题

### Q1: 前端显示 "Network Error" 或 "Failed to fetch"

**原因：**
- Render 后端可能在休眠
- CORS 配置问题
- 环境变量未生效

**解决方案：**
```
1. 等待 30-60 秒后刷新（唤醒 Render）
2. 检查 Render 的 ALLOWED_ORIGINS 是否正确
3. 确认 Vercel 已重新部署
4. 清除浏览器缓存（Ctrl+Shift+Delete）
```

### Q2: 登录失败，显示 "Invalid credentials"

**检查：**
```
1. MongoDB Atlas 数据是否迁移成功
2. Render 的 MONGODB_URI 是否正确
3. 使用正确的测试账号
```

### Q3: 页面显示旧的内容

**解决：**
```
1. 清除浏览器缓存
2. 硬刷新：Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)
3. 使用无痕模式测试
```

### Q4: Render 后端访问很慢

**原因：** Render 免费版休眠后首次访问需要唤醒

**解决方案：**
```
1. 等待 30-60 秒
2. 配置 UptimeRobot 防止休眠
3. 或升级到 Render 付费版（$7/月）
```

---

## 🎯 下一步（可选优化）

### 1. 配置 UptimeRobot 防止后端休眠

**访问：** https://uptimerobot.com

**配置：**
```
Monitor Type: HTTP(s)
URL: https://project-ark-efy7.onrender.com/api/health
Interval: Every 5 minutes
```

### 2. 配置自定义域名

**Vercel 前端：**
- Settings → Domains → Add Domain

**Render 后端：**
- Settings → Custom Domain → Add Domain

### 3. 配置 SSL 证书

- Vercel 和 Render 都会自动配置 SSL
- 确保使用 HTTPS 访问

---

## 📊 部署信息记录

请保存以下信息：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project Ark - 完整部署信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

前端 URL:
https://project-ark-one.vercel.app

后端 URL:
https://project-ark-efy7.onrender.com

MongoDB Atlas:
集群: cluster0.6uan2lt.mongodb.net
数据库: cmax
用户: ningxiarongchen_db_user

测试账号:
管理员：13000000001 / password
销售经理：13000000002 / password
技术工程师：13000000003 / password
商务工程师：13000000004 / password

部署时间: 2025-10-31
状态: ✅ 全部完成

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎊 恭喜！部署完成！

您已成功将整个系统部署到云端：
- ✅ 前端部署到 Vercel（国内 CDN 加速）
- ✅ 后端部署到 Render（新加坡节点）
- ✅ 数据库部署到 MongoDB Atlas（香港节点）
- ✅ 本地数据已迁移到云端

**现在可以在任何地方访问您的系统了！** 🚀

---

## 🆘 需要帮助？

如果遇到任何问题，请提供：
1. 具体的错误信息或截图
2. 浏览器控制台的错误（F12）
3. 出现问题的具体步骤

祝您使用愉快！🎉

