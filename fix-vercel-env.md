# 🔧 修复 Vercel 环境变量配置

**问题**: 前端请求缺少 `/api` 前缀  
**原因**: Vercel 环境变量配置错误  
**日期**: 2025-10-31

---

## 🎯 快速修复步骤（2分钟）

### 第1步：登录 Vercel

1. 访问：https://vercel.com/dashboard
2. 找到你的项目：`project-ark`
3. 点击进入项目

---

### 第2步：修改环境变量

1. **点击** "Settings"（设置）
2. **点击** "Environment Variables"（环境变量）
3. **找到** `VITE_API_URL` 变量
4. **点击** 右侧的编辑按钮（铅笔图标）或删除重新添加

---

### 第3步：更新变量值

**关键：必须包含 `/api` 后缀！**

#### ✅ 正确配置：

```
Key: VITE_API_URL
Value: https://project-ark-efy7.onrender.com/api
```

**注意末尾的 `/api` 非常重要！**

#### ❌ 错误配置（不要使用）：

```
❌ https://project-ark-efy7.onrender.com          (缺少 /api)
❌ https://project-ark-efy7.onrender.com/         (缺少 api)
❌ https://project-ark-efy7.onrender.com/api/     (多余的斜杠)
```

---

### 第4步：选择环境

确保勾选所有环境：
- ✅ Production（生产环境）
- ✅ Preview（预览环境）  
- ✅ Development（开发环境）

---

### 第5步：保存并重新部署

1. **点击** "Save"（保存）

2. **转到** "Deployments" 标签

3. **点击** 最新部署右侧的 "..." 菜单

4. **选择** "Redeploy"（重新部署）

5. **❌ 取消勾选** "Use existing Build Cache"（不使用缓存）

6. **点击** "Redeploy" 确认

7. **等待** 1-3 分钟部署完成

---

## 🔍 验证修复

### 步骤1：等待部署完成

在 Vercel Deployments 页面：
- 看到状态变为 **"Ready"**（绿色）

### 步骤2：清除浏览器缓存

**Chrome/Edge:**
- Windows: `Ctrl + Shift + Delete`
- Mac: `Cmd + Shift + Delete`

或者使用**无痕模式**测试

### 步骤3：测试登录

1. 访问 Vercel 部署的 URL
2. 打开开发者工具（F12）
3. 切换到 **Network** 标签
4. 尝试登录

### 步骤4：检查请求 URL

在 Network 标签中，登录请求应该显示：

✅ **正确的请求 URL**：
```
POST https://project-ark-efy7.onrender.com/api/auth/login
Status: 200 OK
```

❌ **错误的请求 URL**（修复前）：
```
POST https://project-ark-efy7.onrender.com/auth/login
Status: 404 Not Found
```

---

## 💡 为什么需要 `/api` 后缀？

### 后端路由配置

在 `backend/server.js` 中，所有路由都挂载在 `/api` 前缀下：

```javascript
app.use('/api/auth', authRoutes);           // 认证路由
app.use('/api/products', productRoutes);     // 产品路由
app.use('/api/projects', projectRoutes);     // 项目路由
// ... 等等
```

### 前端 API 调用

在 `frontend/src/services/api.js` 中：

```javascript
// 创建 axios 实例
const api = axios.create({
  baseURL: API_URL,  // 这里应该是：https://xxx.com/api
  ...
})

// 调用登录接口
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials)
  //                                  ^^^^^^^^^^^
  //                                  会拼接到 baseURL 后面
  //                                  完整URL: baseURL + '/auth/login'
}
```

所以：
- 如果 `baseURL = https://xxx.com/api`
- 调用 `api.post('/auth/login')`
- 实际请求：`https://xxx.com/api/auth/login` ✅

如果没有 `/api`：
- 如果 `baseURL = https://xxx.com`
- 调用 `api.post('/auth/login')`
- 实际请求：`https://xxx.com/auth/login` ❌（404 错误）

---

## 🚨 常见错误

### 错误1：多余的斜杠

```
❌ https://project-ark-efy7.onrender.com/api/
```

虽然可能工作，但会导致双斜杠问题：
```
https://project-ark-efy7.onrender.com/api//auth/login
```

### 错误2：环境变量未保存

修改后必须：
1. 点击 "Save" 保存
2. 重新部署才能生效

### 错误3：使用了构建缓存

重新部署时必须：
- ❌ 取消勾选 "Use existing Build Cache"

---

## ✅ 成功标志

修复成功后：

1. ✅ Vercel 部署状态显示 "Ready"
2. ✅ 可以打开前端页面
3. ✅ 登录请求发送到正确的 URL（包含 `/api`）
4. ✅ 登录成功，状态码 200
5. ✅ 可以正常使用系统功能

---

## 📞 仍然有问题？

如果修复后仍然404，检查：

### 1. 后端是否正常运行

访问后端健康检查：
```
https://project-ark-efy7.onrender.com/health
```

应该返回：
```json
{
  "status": "OK",
  "timestamp": "2025-10-31T...",
  "uptime": ...,
  "database": "connected"
}
```

### 2. Vercel 构建日志

1. Deployments → 点击最新部署
2. 查看 "Build Logs"
3. 确认环境变量已加载：
   ```
   VITE_API_URL=https://project-ark-efy7.onrender.com/api
   ```

### 3. 浏览器控制台

1. 打开控制台（F12）
2. 输入：
   ```javascript
   console.log(import.meta.env.VITE_API_URL)
   ```
3. 应该显示：
   ```
   https://project-ark-efy7.onrender.com/api
   ```

---

## 🎉 修复完成

完成所有步骤后，你的系统应该可以正常工作了！

**下一步**：
- 测试登录功能
- 测试其他 API 功能
- 确认所有模块正常

---

**文档版本**: v1.0  
**创建时间**: 2025-10-31  
**最后更新**: 2025-10-31

📝 **记得保存这个文档，以后遇到类似问题可以参考！**


