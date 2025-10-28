# Cloudinary配置指南

**目标**: 为文件上传服务配置云存储

---

## 📝 第一步：注册Cloudinary账户

### 1. 访问官网
```
https://cloudinary.com/
```

### 2. 点击注册（Sign Up）
- 使用邮箱注册，或
- 使用Google/GitHub账号快速注册

### 3. 填写注册信息

| 字段 | 说明 | 示例 |
|------|------|------|
| **Email** | 您的邮箱地址 | your-email@example.com |
| **Password** | 设置安全密码 | 至少8个字符 |
| **Cloud Name** | 云名称（重要！不可更改） | cmax-system 或 your-project-name |

⚠️ **重要提示**: 
- Cloud Name一旦设置就不能更改
- 建议使用项目相关的名称
- 只能包含字母、数字和连字符

### 4. 验证邮箱
- 检查收件箱
- 点击验证链接
- 完成注册

---

## 🔑 第二步：获取配置信息

### 登录Dashboard
访问: https://console.cloudinary.com/

### 在Dashboard首页找到 "Product Environment Credentials" 面板

您会看到类似这样的信息：

```
Cloud name:    your-cloud-name
API Key:       123456789012345
API Secret:    abcdefghijklmnopqrstuvwxyz1234
```

### 📋 需要复制的三个值：

#### 1. Cloud Name
```
示例: cmax-actuator-system
位置: Dashboard首页顶部
```

#### 2. API Key
```
示例: 123456789012345
位置: Product Environment Credentials面板
```

#### 3. API Secret
```
示例: abcdefghijklmnopqrstuvwxyz1234
位置: Product Environment Credentials面板
⚠️ 保密！不要分享给他人
```

---

## 🔒 第三步：保存配置信息（待我协助）

### 配置模板

准备好这三个值后，我将帮您配置到系统中：

```env
# Cloudinary配置
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=你的Cloud Name
CLOUDINARY_API_KEY=你的API Key
CLOUDINARY_API_SECRET=你的API Secret
```

---

## ✅ 检查清单

完成注册后，请确认：

- [ ] 已成功注册Cloudinary账户
- [ ] 已验证邮箱
- [ ] 已登录Dashboard
- [ ] 已找到 "Product Environment Credentials" 面板
- [ ] 已复制 **Cloud Name**
- [ ] 已复制 **API Key**
- [ ] 已复制 **API Secret**
- [ ] 三个值都已安全保存

---

## 📸 参考截图说明

### Dashboard位置示意：

```
┌─────────────────────────────────────────────┐
│ Cloudinary Dashboard                         │
├─────────────────────────────────────────────┤
│                                              │
│  Product Environment Credentials             │
│  ┌──────────────────────────────────────┐  │
│  │ Cloud name:    your-cloud-name       │  │
│  │ API Key:       123456789012345       │  │
│  │ API Secret:    [Show] [Copy]         │  │
│  │                                       │  │
│  │ [Copy all credentials]                │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  Usage Statistics                            │
│  Storage: 0 MB / 25 GB                      │
│  Transformations: 0 / 25,000                │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 🎁 免费套餐说明

Cloudinary免费套餐包含：

✅ **存储空间**: 25 GB  
✅ **带宽**: 25 GB/月  
✅ **图片转换**: 25,000次/月  
✅ **视频转换**: 1,000次/月  
✅ **CDN**: 全球加速  

对于中小型项目完全够用！

---

## 🔗 有用的链接

- **官网**: https://cloudinary.com/
- **控制台**: https://console.cloudinary.com/
- **文档**: https://cloudinary.com/documentation
- **定价**: https://cloudinary.com/pricing

---

## 💡 配置完成后

当您准备好这三个值后，请告诉我：

```
我已经准备好Cloudinary配置了：
Cloud Name: [您的值]
API Key: [您的值]
API Secret: [您的值]
```

然后我会立即帮您：
1. ✅ 更新 `.env` 配置文件
2. ✅ 安装必需的npm包
3. ✅ 测试云存储功能
4. ✅ 验证文件上传

---

## ⚠️ 安全提示

1. **不要泄露API Secret**
   - 这是您的私钥
   - 不要提交到Git
   - 不要分享给他人

2. **使用环境变量**
   - 配置存储在 `.env` 文件
   - `.env` 文件已在 `.gitignore` 中

3. **定期检查用量**
   - 登录Dashboard查看使用情况
   - 避免超出免费额度

---

## 🆘 遇到问题？

### 问题1: 找不到API凭证
**解决**: 
- 确保已登录
- 访问: https://console.cloudinary.com/
- 查看Dashboard首页

### 问题2: Cloud Name显示不正确
**解决**: 
- 这是注册时设置的名称
- 无法更改，确认是否记错

### 问题3: API Secret被隐藏
**解决**: 
- 点击 "Show" 按钮显示
- 或点击 "Copy" 直接复制

---

**准备好后，请告诉我您的配置信息，我将继续下一步！** 🚀

