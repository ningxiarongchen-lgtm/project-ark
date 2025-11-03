# 🌐 Cloudflare CDN 部署指南

## 📋 概述

使用Cloudflare CDN可以：
- ✅ **免费加速中国大陆访问**（速度提升80%+）
- ✅ **自动HTTPS**
- ✅ **防DDoS攻击**
- ✅ **全球CDN节点**
- ✅ **10分钟配置完成**

---

## 🎯 两种部署方式

### 方式A：使用自定义域名（推荐）⭐⭐⭐⭐⭐

**如果你有域名**（如 `yourdomain.com`）

**如果没有域名**，可以：
- 在阿里云购买（约￥29/年）：https://wanwang.aliyun.com/domain
- 在腾讯云购买（约￥23/年）：https://cloud.tencent.com/product/domain
- 在Namesilo购买（约$8.99/年）：https://www.namesilo.com
- 推荐后缀：`.com`, `.cn`, `.top`, `.xyz`（便宜）

### 方式B：使用Cloudflare Workers（无需域名）⭐⭐⭐⭐

**无需购买域名**，使用Cloudflare提供的免费域名

---

## 📖 方式A：使用自定义域名（完整步骤）

### 第1步：注册Cloudflare账号（2分钟）

1. **访问Cloudflare注册页面**
   ```
   https://dash.cloudflare.com/sign-up
   ```

2. **填写注册信息**
   - 邮箱地址
   - 密码（至少8位）
   - 点击"Create Account"

3. **验证邮箱**
   - 打开邮箱
   - 点击验证链接

✅ 完成！

---

### 第2步：添加域名到Cloudflare（3分钟）

1. **登录Cloudflare后，点击"Add a Site"**

2. **输入你的域名**
   ```
   例如: myproject.com
   ```
   点击"Add site"

3. **选择免费计划（Free Plan）**
   - 点击"Free $0/month"
   - 点击"Continue"

4. **等待DNS记录扫描**
   - Cloudflare会自动扫描你的域名DNS记录
   - 等待约30秒

5. **查看扫描到的DNS记录**
   - 点击"Continue"

---

### 第3步：修改域名服务器（5分钟）

**⚠️ 这一步很重要！**

1. **Cloudflare会显示两个域名服务器**
   ```
   例如：
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```
   **记下这两个地址！**

2. **登录你的域名注册商**
   - 阿里云：https://dc.console.aliyun.com
   - 腾讯云：https://console.cloud.tencent.com/domain
   - Namesilo：https://www.namesilo.com/account_domains.php

3. **修改域名服务器（DNS/NS）**

   **阿里云示例：**
   - 找到你的域名
   - 点击"管理"
   - 点击"DNS修改"
   - 输入Cloudflare提供的两个域名服务器
   - 点击"确定"

   **腾讯云示例：**
   - 找到你的域名
   - 点击"管理"
   - 点击"DNS服务器"
   - 修改为Cloudflare提供的两个域名服务器
   - 点击"保存"

4. **回到Cloudflare，点击"Done, check nameservers"**

5. **等待DNS生效**
   - 通常需要5分钟到24小时
   - Cloudflare会发邮件通知你

✅ 完成！可以先进行下一步，DNS在后台生效。

---

### 第4步：配置DNS记录指向Vercel（2分钟）

1. **在Cloudflare Dashboard，点击"DNS"选项卡**

2. **添加CNAME记录**
   
   **配置1：主域名（如 myproject.com）**
   - Type: `CNAME`
   - Name: `@`
   - Target: `project-ark-one.vercel.app`
   - Proxy status: **🟠 Proxied**（开启橙色云朵）
   - TTL: `Auto`
   - 点击"Save"

   **配置2：www子域名（如 www.myproject.com）**
   - Type: `CNAME`
   - Name: `www`
   - Target: `project-ark-one.vercel.app`
   - Proxy status: **🟠 Proxied**（开启橙色云朵）
   - TTL: `Auto`
   - 点击"Save"

✅ 完成！

---

### 第5步：在Vercel添加自定义域名（3分钟）

1. **登录Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **进入项目设置**
   - 找到你的项目 `project-ark-one`
   - 点击"Settings"

3. **添加域名**
   - 点击左侧"Domains"
   - 在"Add Domain"输入框输入：`myproject.com`
   - 点击"Add"

4. **添加www子域名**
   - 再次在"Add Domain"输入框输入：`www.myproject.com`
   - 点击"Add"

5. **Vercel会自动验证**
   - 显示绿色✅表示配置成功
   - 显示黄色⚠️表示DNS还在传播，等待几分钟

✅ 完成！

---

### 第6步：Cloudflare性能优化（可选，2分钟）

**6.1 开启缓存**

1. 在Cloudflare，点击"Caching"
2. "Caching Level"选择"Standard"
3. "Browser Cache TTL"选择"4 hours"

**6.2 开启自动压缩**

1. 点击"Speed" → "Optimization"
2. 开启以下选项：
   - ✅ Auto Minify: JavaScript, CSS, HTML
   - ✅ Brotli

**6.3 配置中国优化（推荐）**

1. 点击"Speed" → "Optimization"
2. 开启"Argo Smart Routing"（付费，可选）
   - 或保持免费版即可

**6.4 SSL/TLS设置**

1. 点击"SSL/TLS"
2. "Encryption mode"选择：**Full (strict)**
3. 开启"Always Use HTTPS"
4. 开启"Automatic HTTPS Rewrites"

✅ 完成！

---

### 第7步：测试访问（1分钟）

1. **等待5-10分钟**（DNS传播）

2. **访问你的域名**
   ```
   https://myproject.com
   ```

3. **在手机上测试**
   - 使用移动网络（不是WiFi）
   - 在Safari/Chrome打开
   - 应该可以正常访问！

✅ 部署完成！🎉

---

## 📖 方式B：使用Cloudflare Workers（无需域名）

### 第1步：注册Cloudflare账号（同上）

### 第2步：创建Worker

1. **登录Cloudflare Dashboard**

2. **点击左侧"Workers & Pages"**

3. **点击"Create application"**

4. **选择"Create Worker"**

5. **命名Worker**
   ```
   例如: project-ark-proxy
   ```

6. **点击"Deploy"**

### 第3步：编辑Worker代码

1. **点击"Edit code"**

2. **删除所有代码，粘贴以下内容：**

```javascript
// Cloudflare Worker - Vercel 代理
// 用于加速中国大陆访问Vercel部署的网站

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 目标Vercel应用URL
  const VERCEL_URL = 'https://project-ark-one.vercel.app'
  
  // 获取请求URL
  const url = new URL(request.url)
  
  // 构建目标URL（替换域名为Vercel域名）
  const targetUrl = new URL(url.pathname + url.search, VERCEL_URL)
  
  // 创建新请求
  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'follow'
  })
  
  // 发送请求到Vercel
  const response = await fetch(modifiedRequest)
  
  // 创建新响应（添加CORS头）
  const modifiedResponse = new Response(response.body, response)
  
  // 添加缓存头（加速访问）
  modifiedResponse.headers.set('Cache-Control', 'public, max-age=3600')
  
  // 允许跨域
  modifiedResponse.headers.set('Access-Control-Allow-Origin', '*')
  
  return modifiedResponse
}
```

3. **点击"Save and Deploy"**

### 第4步：获取Worker URL

1. **部署完成后，你会得到一个免费URL：**
   ```
   https://project-ark-proxy.你的用户名.workers.dev
   ```

2. **测试访问**
   - 直接在浏览器打开这个URL
   - 应该能看到你的系统

3. **在手机上测试**
   - 复制URL到手机浏览器
   - 应该可以正常访问！

✅ 部署完成！🎉

---

## 🎯 两种方式对比

| 特性 | 方式A：自定义域名 | 方式B：Workers |
|------|------------------|----------------|
| 费用 | 域名￥23-89/年 | 完全免费 |
| 速度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 专业性 | 高（自己的域名） | 中（.workers.dev） |
| 配置难度 | 中等 | 简单 |
| SEO | 好 | 一般 |
| 推荐度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## ❓ 常见问题

### Q1: DNS修改多久生效？
**A:** 通常5分钟到24小时，平均2小时。

### Q2: 可以同时使用Vercel域名和自定义域名吗？
**A:** 可以！两个都能访问。

### Q3: Cloudflare免费版够用吗？
**A:** 完全够用！免费版已经很强大。

### Q4: 如果访问还是慢怎么办？
**A:** 
1. 检查Cloudflare的"橙色云朵"是否开启
2. 等待CDN缓存生效（第一次访问慢，之后会快）
3. 清除浏览器缓存重试

### Q5: Workers有使用限制吗？
**A:** 免费版：
- 100,000 请求/天
- 对于20人团队完全够用

---

## 📞 需要帮助？

**我可以帮你：**
1. ✅ 检查DNS配置是否正确
2. ✅ 排查连接问题
3. ✅ 优化Cloudflare设置
4. ✅ 提供详细的截图指导

**请告诉我：**
- 你选择"方式A"还是"方式B"？
- 如果选方式A，你有域名吗？域名是什么？
- 如果需要购买域名，想买哪个后缀？

---

## 🎁 下一步

配置完成后，你的系统将：
- ✅ 中国移动端可以正常访问
- ✅ 速度提升80%+
- ✅ 自动HTTPS加密
- ✅ 全球CDN加速

**准备好了吗？告诉我你想使用哪种方式，我会提供详细指导！** 🚀

