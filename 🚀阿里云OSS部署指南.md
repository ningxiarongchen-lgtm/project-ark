# 🚀 阿里云OSS部署指南

## 📋 概述

部署到阿里云OSS，实现：
- ✅ 中国大陆访问极快
- ✅ 移动端完美支持
- ✅ 稳定可靠
- ✅ 费用低廉（约￥0.1-5/月）

---

## 💰 费用说明

### OSS存储费用
- 标准存储：￥0.12/GB/月
- 你的项目约50MB，每月约￥0.006

### CDN流量费用
- 中国大陆：￥0.24/GB起
- 20人团队，每月约5GB流量
- 预计：￥1-5/月

### 总费用预估
```
OSS存储：￥0.01/月
CDN流量：￥1-5/月
域名（可选）：￥29/年
─────────────────
总计：约￥2-6/月
```

**新用户福利：**
- 阿里云新用户有代金券
- OSS有免费额度试用

---

## 📖 完整部署步骤

### 第1步：注册阿里云账号（5分钟）

1. **访问阿里云官网**
   ```
   https://www.aliyun.com
   ```

2. **点击"免费注册"**
   - 使用手机号注册
   - 设置密码
   - 短信验证

3. **实名认证**
   - 个人认证：身份证
   - 企业认证：营业执照
   - 审核时间：1-24小时

✅ 完成！

---

### 第2步：开通OSS服务（2分钟）

1. **登录阿里云控制台**
   ```
   https://oss.console.aliyun.com
   ```

2. **首次使用会提示开通OSS**
   - 点击"立即开通"
   - 选择"按量付费"（推荐）
   - 勾选同意协议
   - 点击"立即开通"

3. **开通成功**
   - 进入OSS管理控制台

✅ 完成！

---

### 第3步：创建Bucket（3分钟）

1. **在OSS控制台，点击"创建Bucket"**

2. **填写Bucket配置**
   ```
   Bucket名称: smart-system-frontend
   （必须全局唯一，可以加上日期或随机数）
   
   地域: 华东1（杭州）或你所在地区
   
   存储类型: 标准存储
   
   读写权限: 公共读
   （重要！必须选择"公共读"才能访问）
   
   服务端加密: 无
   
   实时日志查询: 不开启
   ```

3. **点击"确定"创建**

✅ Bucket创建成功！

---

### 第4步：构建前端项目（5分钟）

**在你的电脑上操作：**

1. **打开终端**

2. **进入项目目录**
   ```bash
   cd "/Users/hexiaoxiao/Desktop/Model Selection System"
   ```

3. **进入前端目录**
   ```bash
   cd frontend
   ```

4. **安装依赖（如果还没安装）**
   ```bash
   npm install
   ```

5. **构建生产版本**
   ```bash
   npm run build
   ```

6. **等待构建完成**
   - 约1-3分钟
   - 完成后会生成 `dist` 目录

✅ 前端构建完成！

---

### 第5步：上传文件到OSS（2种方式）

#### 方式A：使用网页上传（简单）

1. **在OSS控制台，点击你的Bucket名称**

2. **点击"文件管理"**

3. **点击"上传文件"**

4. **选择文件**
   - 进入 `frontend/dist` 目录
   - 全选所有文件和文件夹
   - 拖拽上传

5. **等待上传完成**
   - 显示100%即可

---

#### 方式B：使用ossutil工具（推荐，更快）

1. **下载ossutil**
   ```
   Mac: https://gosspublic.alicdn.com/ossutil/1.7.15/ossutilmac64
   Windows: https://gosspublic.alicdn.com/ossutil/1.7.15/ossutil64.exe
   ```

2. **配置ossutil**
   ```bash
   # Mac/Linux
   chmod +x ossutilmac64
   ./ossutilmac64 config
   ```
   
   填写配置：
   - Endpoint: `oss-cn-hangzhou.aliyuncs.com`（根据你的地域）
   - AccessKeyId: 在阿里云控制台获取
   - AccessKeySecret: 在阿里云控制台获取

3. **上传dist目录**
   ```bash
   ./ossutilmac64 cp -r frontend/dist/ oss://smart-system-frontend/ -u
   ```

✅ 文件上传完成！

---

### 第6步：配置静态网站托管（2分钟）

1. **在Bucket管理页面，找到"基础设置"**

2. **点击"静态页面"**

3. **点击"设置"**

4. **填写配置**
   ```
   默认首页: index.html
   默认404页: index.html
   （重要！SPA应用两个都填index.html）
   ```

5. **点击"保存"**

✅ 静态网站配置完成！

---

### 第7步：获取访问地址（1分钟）

1. **在Bucket概览页面**

2. **找到"Bucket域名"**
   ```
   外网访问: 
   http://smart-system-frontend.oss-cn-hangzhou.aliyuncs.com
   ```

3. **复制这个地址**

✅ 可以访问了！

---

### 第8步：配置CDN加速（可选，推荐，10分钟）

**为了更快的访问速度，强烈推荐配置CDN！**

1. **开通CDN服务**
   ```
   https://cdn.console.aliyun.com
   ```

2. **添加加速域名**
   - 需要一个域名（如果没有，可以暂时跳过）
   - 或使用阿里云提供的测试域名

3. **配置源站**
   - 源站类型：OSS域名
   - 选择你的Bucket

4. **等待CDN配置生效**
   - 约10分钟

✅ CDN配置完成！

---

### 第9步：配置前端API地址（重要！）

**前端需要连接后端API，需要确保API地址正确。**

1. **检查后端API地址**
   ```
   https://project-ark-backend.onrender.com
   ```

2. **前端已经配置好了**
   - 在 `frontend/.env.production` 中
   - `VITE_API_URL=https://project-ark-backend.onrender.com`

3. **如果需要修改**
   - 修改 `.env.production` 文件
   - 重新构建：`npm run build`
   - 重新上传到OSS

✅ API配置完成！

---

### 第10步：测试访问（1分钟）

1. **手机测试**
   - 打开手机浏览器
   - 访问你的OSS地址或CDN地址
   - 应该能看到系统登录页面

2. **电脑测试**
   - 在浏览器访问
   - 测试登录功能

3. **测试账号**
   - 手机号：`13800000000`
   - 密码：`admin123`

✅ 部署成功！🎉

---

## 🔧 获取AccessKey（方式B上传需要）

### 创建AccessKey

1. **登录阿里云控制台**
   ```
   https://ram.console.aliyun.com/manage/ak
   ```

2. **点击"创建AccessKey"**

3. **记录AccessKey信息**
   ```
   AccessKeyId: LTAI5t...
   AccessKeySecret: abc123...
   ```
   
   ⚠️ **重要：AccessKeySecret只显示一次，请立即保存！**

4. **妥善保管**
   - 不要泄露
   - 不要提交到Git

✅ AccessKey创建完成！

---

## 📱 设置HTTPS（可选但推荐）

### 使用阿里云CDN配置HTTPS

1. **在CDN控制台**

2. **选择你的域名**

3. **点击"HTTPS配置"**

4. **申请免费证书**
   - 阿里云提供免费DV证书
   - 自动配置

5. **开启"强制HTTPS"**

✅ HTTPS配置完成！

---

## 🎯 完整命令速查

### 构建前端
```bash
cd "/Users/hexiaoxiao/Desktop/Model Selection System/frontend"
npm run build
```

### 上传到OSS（使用ossutil）
```bash
./ossutilmac64 cp -r dist/ oss://smart-system-frontend/ -u
```

### 更新部署（修改代码后）
```bash
npm run build
./ossutilmac64 cp -r dist/ oss://smart-system-frontend/ -u
```

---

## ❓ 常见问题

### Q1: 上传后访问404？
**A:** 检查静态网站托管配置
- 默认首页：`index.html`
- 默认404页：`index.html`

### Q2: 页面样式丢失？
**A:** 检查文件权限
- Bucket读写权限必须是"公共读"
- 检查文件是否全部上传

### Q3: API请求失败？
**A:** 检查跨域配置
- 在OSS Bucket设置中配置CORS
- 允许的来源：`*`
- 允许的方法：`GET, POST, PUT, DELETE`

### Q4: 费用会很高吗？
**A:** 不会
- 20人团队每月约￥2-5
- 可以设置费用预警

### Q5: 需要备案吗？
**A:** 
- 使用OSS域名：不需要
- 使用自定义域名：需要（如果域名在中国）

---

## 🎁 部署成功后

你将拥有：
- ✅ 极快的访问速度（阿里云中国节点）
- ✅ 稳定可靠（99.9%可用性）
- ✅ 支持移动端
- ✅ 自动HTTPS
- ✅ CDN加速

---

## 📞 需要帮助？

**如果遇到问题：**
- 构建失败
- 上传失败
- 访问404
- API连接失败

**随时告诉我！** 🚀

