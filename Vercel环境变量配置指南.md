# 🔧 Vercel 环境变量配置完整指南

**日期**: 2025-10-31  
**目标**: 配置前端环境变量，让前端能够连接后端API

---

## 📋 配置步骤（5分钟完成）

### 第1步：确认后端是否已部署

**情况A：后端已部署**

如果您已经部署了后端（Railway/Render），请记录后端URL：
- Railway格式：`https://xxx.up.railway.app`
- Render格式：`https://xxx.onrender.com`

**情况B：后端未部署**

如果还没有部署后端，需要先部署后端（见下方说明）。

---

### 第2步：配置Vercel环境变量

#### 2.1 访问Vercel项目

1. **打开浏览器**，访问：
   ```
   https://vercel.com/dashboard
   ```

2. **登录账号**（如果未登录）

3. **找到您的项目**
   - 在项目列表中找到 `project-ark` 或 `kay's projects`
   - 点击进入项目

#### 2.2 进入环境变量设置

1. **点击 "Settings"**（设置）
   - 在项目页面顶部导航栏

2. **点击 "Environment Variables"**（环境变量）
   - 在左侧菜单或页面中找到

#### 2.3 添加环境变量

1. **点击 "Add New"** 或 **"Add"** 按钮

2. **填写环境变量**：
   ```
   Key（变量名）: VITE_API_URL
   Value（变量值）: https://你的后端地址/api
   ```

   **示例**：
   - 如果后端在Railway：`https://project-ark-production.up.railway.app/api`
   - 如果后端在Render：`https://project-ark-backend.onrender.com/api`
   - ⚠️ **重要**：URL末尾必须包含 `/api`

3. **选择环境**（Environment）：
   - ✅ Production（生产环境）
   - ✅ Preview（预览环境）
   - ✅ Development（开发环境）
   
   **建议**：三个都勾选

4. **点击 "Save"**（保存）

#### 2.4 验证配置

配置完成后，您应该看到：
```
VITE_API_URL  https://xxx.railway.app/api  Production, Preview, Development
```

---

### 第3步：重新部署前端

环境变量配置后，需要重新部署才能生效：

#### 方法1：手动重新部署（推荐）

1. **点击 "Deployments"**（部署）标签
2. **找到最新的部署记录**
3. **点击右侧的 "..."**（三个点）菜单
4. **选择 "Redeploy"**（重新部署）
5. **确认重新部署**
6. **等待1-2分钟**完成

#### 方法2：触发自动部署

推送一个新提交到GitHub：
```bash
git commit --allow-empty -m "trigger: 重新部署以应用环境变量"
git push origin main
```

---

## 🔍 检查配置是否成功

### 方法1：查看构建日志

1. 在Vercel项目页面，点击 "Deployments"
2. 查看最新的部署日志
3. 应该看到：
   ```
   ✓ Build completed successfully
   ```

### 方法2：测试前端功能

1. **访问前端URL**（Vercel提供的地址）
2. **打开浏览器开发者工具**（F12）
3. **切换到 Console 标签**
4. **尝试登录**
5. **检查是否有API请求**

如果看到：
- ✅ API请求发送到正确的后端地址
- ✅ 没有 "Failed to fetch" 错误
- ✅ 可以成功登录

说明配置成功！

---

## 🚨 常见问题

### Q1: 找不到 Environment Variables 选项

**解决**：
- 确保您有项目的管理员权限
- 在 Settings 页面查找，可能在 "General" 或 "Environment Variables" 部分

### Q2: 环境变量已配置，但前端仍然无法连接后端

**解决**：
1. 确认已重新部署（环境变量修改后必须重新部署）
2. 检查后端URL是否正确（末尾要有 `/api`）
3. 检查后端是否正在运行
4. 查看浏览器控制台的错误信息

### Q3: 后端URL格式不正确

**正确格式**：
```
✅ https://xxx.railway.app/api
✅ https://xxx.onrender.com/api
❌ https://xxx.railway.app  （缺少 /api）
❌ http://localhost:5001/api  （本地地址不能用于生产环境）
```

### Q4: 如何查看Vercel的详细日志

1. 进入项目 → Deployments
2. 点击具体的部署记录
3. 查看 "Build Logs" 和 "Function Logs"

---

## 📝 配置模板

### 如果后端在Railway

```
Key: VITE_API_URL
Value: https://your-service-name.up.railway.app/api
```

### 如果后端在Render

```
Key: VITE_API_URL
Value: https://your-service-name.onrender.com/api
```

### 如果后端在其他平台

```
Key: VITE_API_URL
Value: https://your-backend-domain.com/api
```

---

## ✅ 配置完成检查清单

完成配置后，请确认：

- [ ] Vercel项目可以访问
- [ ] 已进入 Settings → Environment Variables
- [ ] 已添加 `VITE_API_URL` 变量
- [ ] 变量值包含 `/api` 后缀
- [ ] 已选择 Production、Preview、Development 环境
- [ ] 已保存环境变量
- [ ] 已重新部署前端
- [ ] 前端可以正常访问
- [ ] 浏览器控制台没有API连接错误
- [ ] 可以成功登录系统

---

## 🎯 如果后端还没有部署

如果您还没有部署后端，请按以下步骤操作：

### 选项1：部署到Railway（推荐）

1. **访问**: https://railway.app
2. **创建项目**: New Project → Deploy from GitHub
3. **选择仓库**: `project-ark`
4. **配置**:
   - Root Directory: `backend`
   - Start Command: `npm start`
5. **添加MongoDB**: + New → Database → MongoDB
6. **配置环境变量**（见 `🚀开始部署-看这里.md`）
7. **生成域名**: Settings → Networking → Generate Domain
8. **初始化数据库**: 运行 `npm run seed:final`

详细步骤见：`Railway一键部署指南.md`

### 选项2：部署到Render

1. **访问**: https://render.com
2. **创建Web Service**: New → Web Service
3. **连接GitHub仓库**
4. **配置**: Root Directory = `backend`
5. **添加MongoDB**: New → MongoDB
6. **配置环境变量**
7. **部署**

详细步骤见：`免费云部署方案.md`

---

## 📞 需要帮助？

如果遇到问题：

1. **查看Vercel日志**：Deployments → 点击部署 → Build Logs
2. **查看浏览器控制台**：F12 → Console标签
3. **检查后端状态**：访问 `https://your-backend.com/api/health`
4. **参考文档**：
   - `VERCEL部署完整指南.md`
   - `🚀开始部署-看这里.md`
   - `Railway一键部署指南.md`

---

## 🎉 配置完成后

配置成功并重新部署后，您的系统应该：

✅ 前端可以正常访问  
✅ 可以连接到后端API  
✅ 可以成功登录  
✅ 所有功能正常工作  

**祝配置顺利！** 🚀

---

**文档版本**: v1.0  
**最后更新**: 2025-10-31  
**维护团队**: Project Ark

