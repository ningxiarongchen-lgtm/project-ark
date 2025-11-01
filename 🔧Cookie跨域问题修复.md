# 🔧 Cookie 跨域问题修复

**日期**: 2025-11-01  
**问题**: 非管理员账号登录后立即返回登录页面  
**原因**: Cookie `sameSite: 'strict'` 配置导致跨域无法传递认证信息

---

## 🎯 问题分析

### 现象
- ✅ 管理员账号可以正常登录
- ❌ 其他账号登录后立即返回登录页面
- ❌ Network 显示登录请求返回 404 错误

### 根本原因

系统使用了 **HttpOnly Cookie** 存储认证 token，配置为：

```javascript
res.cookie('accessToken', accessToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',  // ← 问题所在！
  maxAge: 8 * 60 * 60 * 1000
});
```

**问题**：
- 前端部署在 `project-ark-one.vercel.app`
- 后端部署在 `project-ark-efy7.onrender.com`
- **跨域部署** + **`sameSite: 'strict'`** = Cookie 无法跨域传递！

**结果**：
1. 登录时后端返回的 Cookie 无法在前端生效
2. 后续请求无法携带认证 Cookie
3. 系统认为用户未登录，强制跳回登录页

---

## ✅ 修复方案

### 修改 Cookie 配置

将所有 Cookie 的 `sameSite` 配置改为：

```javascript
sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
```

**说明**：
- **生产环境**（跨域）：使用 `'none'`（允许跨域）
- **开发环境**（同域）：使用 `'lax'`（更安全）
- **`secure: true`** 必须配合 `sameSite: 'none'`（HTTPS 必须）

---

## 🔧 修改的文件

### `backend/controllers/authController.js`

修改了 4 个地方的 Cookie 配置：

#### 1. 注册用户时设置 Cookie
```javascript
// 修改前
sameSite: 'strict'

// 修改后
sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
```

#### 2. 登录时设置 Cookie
```javascript
// accessToken 和 refreshToken 都修改
sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
```

#### 3. 刷新 Token 时设置 Cookie
```javascript
// 刷新 token 时也需要正确设置
sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
```

#### 4. 登出时清除 Cookie
```javascript
res.clearCookie('accessToken', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
});
```

---

## 📋 修复内容总结

| 位置 | 修改前 | 修改后 |
|------|--------|--------|
| register - accessToken | `sameSite: 'strict'` | `sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'` |
| register - refreshToken | `sameSite: 'strict'` | `sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'` |
| login - accessToken | `sameSite: 'strict'` | `sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'` |
| login - refreshToken | `sameSite: 'strict'` | `sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'` |
| refreshToken - accessToken | `sameSite: 'strict'` | `sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'` |
| refreshToken - refreshToken | `sameSite: 'strict'` | `sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'` |
| logout - clearCookie (both) | `sameSite: 'strict'` | `sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'` |

---

## 🚀 部署步骤

### 步骤 1: 推送后端代码

```bash
cd "/Users/hexiaoxiao/Desktop/Model Selection System"
git add backend/controllers/authController.js
git commit -m "fix: 修复跨域 Cookie 配置 - sameSite 改为 none"
git push origin main
```

### 步骤 2: 后端自动部署

- Render 会自动检测代码更新
- 自动重新部署后端服务
- 等待 2-3 分钟完成部署

### 步骤 3: 验证修复

1. **清除浏览器缓存**（必须！）
2. **访问登录页面**：https://project-ark-one.vercel.app/login
3. **使用非管理员账号登录**：
   ```
   销售经理: 13000000002 / password
   ```
4. **检查结果**：
   - ✅ 登录成功
   - ✅ 跳转到仪表板
   - ✅ 不再返回登录页

---

## 🔍 技术说明

### SameSite Cookie 属性

| 值 | 说明 | 适用场景 |
|---|------|----------|
| **strict** | 完全禁止跨域发送 Cookie | 同域部署（前后端同一域名） |
| **lax** | 导航时允许跨域，其他请求禁止 | 大部分场景的平衡选择 |
| **none** | 允许所有跨域请求发送 Cookie | **跨域部署**（需要 `secure: true`） |

### 为什么需要 `secure: true`？

当使用 `sameSite: 'none'` 时，浏览器**强制要求** `secure: true`：

```javascript
// 必须同时设置
{
  sameSite: 'none',
  secure: true  // ← HTTPS 必须
}
```

**原因**：
- 防止中间人攻击
- 确保 Cookie 只通过 HTTPS 传输
- 跨域 + HTTP = 安全风险

---

## ⚠️ 重要提示

### 生产环境要求

1. **前端必须使用 HTTPS**
   - ✅ Vercel 自动提供 HTTPS
   - ✅ `project-ark-one.vercel.app` ← HTTPS

2. **后端必须使用 HTTPS**
   - ✅ Render 自动提供 HTTPS
   - ✅ `project-ark-efy7.onrender.com` ← HTTPS

3. **Cookie 配置正确**
   - ✅ `secure: true`
   - ✅ `sameSite: 'none'`
   - ✅ `httpOnly: true`

### 开发环境

本地开发（同域）使用 `sameSite: 'lax'`：
- 前端：`localhost:5173`
- 后端：`localhost:5001`
- 配置会自动切换为 `lax`

---

## 📊 Cookie 配置对比

### 修改前（错误配置）

```javascript
// ❌ 跨域部署 + strict = Cookie 无法传递
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',  // ← 跨域被阻止
  maxAge: 8 * 60 * 60 * 1000
});
```

**问题**：
- 前端 Vercel，后端 Render（不同域名）
- `sameSite: 'strict'` 完全禁止跨域
- Cookie 设置失败，认证无效

### 修改后（正确配置）

```javascript
// ✅ 跨域部署 + none + secure = Cookie 正常传递
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 8 * 60 * 60 * 1000
});
```

**优点**：
- 生产环境：`sameSite: 'none'` 允许跨域
- 开发环境：`sameSite: 'lax'` 更安全
- 配合 `secure: true` 确保安全性

---

## ✅ 预期结果

修复后，所有账号都可以正常登录：

### 管理员
```
账号: 13000000001 / password
✅ 可以登录
```

### 销售经理
```
账号: 13000000002 / password
✅ 可以登录（修复前无法登录）
```

### 其他角色
```
账号: 13000000003 ~ 13000000010 / password
✅ 都可以正常登录
```

---

## 🎯 总结

### 问题
- 跨域部署 + `sameSite: 'strict'` = 认证失败

### 解决方案
- 改为 `sameSite: 'none'`（生产环境）
- 保持 `secure: true`（HTTPS）
- 本地开发用 `lax`（更安全）

### 关键点
1. ⚠️ 跨域部署必须使用 `sameSite: 'none'`
2. ⚠️ `sameSite: 'none'` 必须配合 `secure: true`
3. ⚠️ 必须使用 HTTPS（Vercel 和 Render 都支持）

---

**修复完成时间**: 2025-11-01  
**影响范围**: 所有非管理员账号的登录功能  
**预期部署时间**: 2-3 分钟（Render 自动部署）

🎉 **修复完成！推送代码后等待 Render 部署即可！**

