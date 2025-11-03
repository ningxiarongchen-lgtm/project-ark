# ⚡ Cloudflare CDN - 5分钟快速开始

## 🎯 选择你的方式

### 方式1️⃣：我有域名（推荐）

**适合：** 已有域名或愿意购买域名（￥23-89/年）

**步骤：**
1. 注册Cloudflare → https://dash.cloudflare.com/sign-up
2. 添加域名
3. 修改域名服务器
4. 配置DNS记录
5. 在Vercel添加域名

**时间：** 10分钟
**速度：** ⭐⭐⭐⭐⭐
**专业度：** ⭐⭐⭐⭐⭐

---

### 方式2️⃣：我没有域名（免费）

**适合：** 不想购买域名，使用免费方案

**步骤：**
1. 注册Cloudflare → https://dash.cloudflare.com/sign-up
2. 创建Worker
3. 复制代码
4. 部署

**时间：** 5分钟
**速度：** ⭐⭐⭐⭐
**专业度：** ⭐⭐⭐⭐

---

## 🚀 方式1：有域名 - 超快速配置

### 1. 注册Cloudflare（1分钟）
```
访问: https://dash.cloudflare.com/sign-up
填写邮箱和密码
验证邮箱
```

### 2. 添加域名（1分钟）
```
点击 "Add a Site"
输入你的域名（例如: yourdomain.com）
选择 "Free $0/month" 计划
```

### 3. 配置DNS（2分钟）
```
在Cloudflare DNS设置中添加：

记录1:
- Type: CNAME
- Name: @
- Target: project-ark-one.vercel.app
- Proxy: 🟠 Proxied (开启)

记录2:
- Type: CNAME
- Name: www
- Target: project-ark-one.vercel.app
- Proxy: 🟠 Proxied (开启)
```

### 4. 修改域名服务器（3分钟）
```
Cloudflare会显示两个域名服务器，例如：
ns1.cloudflare.com
ns2.cloudflare.com

登录你的域名注册商（阿里云/腾讯云/Namesilo）
修改域名服务器为上面两个
```

### 5. Vercel添加域名（2分钟）
```
访问: https://vercel.com/dashboard
进入项目 Settings → Domains
添加: yourdomain.com
添加: www.yourdomain.com
```

### 6. 等待生效（5-30分钟）
```
DNS传播需要时间
Cloudflare会发邮件通知
然后就可以访问了！
```

✅ 完成！访问 https://yourdomain.com

---

## 🚀 方式2：无域名 - 超快速配置（推荐新手）

### 1. 注册Cloudflare（1分钟）
```
访问: https://dash.cloudflare.com/sign-up
填写邮箱和密码
验证邮箱
```

### 2. 创建Worker（1分钟）
```
登录后，点击 "Workers & Pages"
点击 "Create application"
点击 "Create Worker"
命名: project-ark-proxy
点击 "Deploy"
```

### 3. 编辑代码（2分钟）
```
点击 "Edit code"
删除所有代码
复制下面的代码粘贴进去
点击 "Save and Deploy"
```

**Worker代码（直接复制）：**

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const VERCEL_URL = 'https://project-ark-one.vercel.app'
  const url = new URL(request.url)
  const targetUrl = new URL(url.pathname + url.search, VERCEL_URL)
  
  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'follow'
  })
  
  const response = await fetch(modifiedRequest)
  const modifiedResponse = new Response(response.body, response)
  
  modifiedResponse.headers.set('Cache-Control', 'public, max-age=3600')
  modifiedResponse.headers.set('Access-Control-Allow-Origin', '*')
  
  return modifiedResponse
}
```

### 4. 获取访问地址（立即可用）
```
部署完成后，你会得到：
https://project-ark-proxy.你的用户名.workers.dev

立即可以访问！
```

✅ 完成！在手机上打开这个地址试试！

---

## 📱 测试访问

### 电脑测试
1. 打开浏览器
2. 访问你的域名或Worker地址
3. 应该能看到系统登录页面

### 手机测试（重要！）
1. 使用移动网络（不是WiFi）
2. 打开Safari/Chrome
3. 访问地址
4. 应该能正常访问！

---

## ⚠️ 常见问题

### Q: 我该选哪个方式？
**A:** 
- 有域名 → 方式1（更专业）
- 没域名 → 方式2（更快）
- 不确定 → 先用方式2试试，以后可以换

### Q: 方式2的地址太长，能改短吗？
**A:** 
- Workers地址固定格式
- 如果想要短域名，建议购买域名使用方式1

### Q: 我已经有域名了，在哪里？
**A:** 常见域名注册商：
- 阿里云：https://dc.console.aliyun.com
- 腾讯云：https://console.cloud.tencent.com/domain
- GoDaddy：https://www.godaddy.com

### Q: 配置完还是打不开怎么办？
**A:** 
1. 等待5-10分钟（DNS传播）
2. 清除浏览器缓存
3. 尝试用手机移动网络访问
4. 告诉我具体错误信息

---

## 🎯 现在就开始！

### 如果你有域名：
1. 打开 https://dash.cloudflare.com/sign-up
2. 按照上面"方式1"步骤操作
3. 10分钟完成！

### 如果你没有域名：
1. 打开 https://dash.cloudflare.com/sign-up
2. 按照上面"方式2"步骤操作
3. 5分钟完成！

---

## 💡 需要帮助？

**告诉我：**
- "我有域名，域名是 xxx.com" → 我会提供详细步骤
- "我没有域名，用方式2" → 我会协助你完成
- "我卡在某一步了" → 告诉我哪一步，我来帮你

**准备好了吗？开始吧！** 🚀

