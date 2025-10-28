# Cloudinary配置清单

**请按顺序完成以下步骤** ✅

---

## 📋 第一阶段：注册账户

### Step 1: 访问官网
- [ ] 打开浏览器
- [ ] 访问: https://cloudinary.com/
- [ ] 页面加载成功

### Step 2: 开始注册
- [ ] 点击 "Sign Up" 或 "Get Started Free" 按钮
- [ ] 选择注册方式：
  - [ ] 使用Email注册（推荐）
  - [ ] 使用Google账号
  - [ ] 使用GitHub账号

### Step 3: 填写信息
- [ ] 输入邮箱地址
- [ ] 设置密码（至少8个字符）
- [ ] 输入Cloud Name（重要！）
  - 建议: `cmax-system` 或 `actuator-system`
  - ⚠️ 此名称不可更改
- [ ] 同意服务条款
- [ ] 点击 "Sign Up"

### Step 4: 验证邮箱
- [ ] 检查邮箱（包括垃圾邮件文件夹）
- [ ] 点击验证链接
- [ ] 返回Cloudinary并登录

---

## 🔑 第二阶段：获取配置信息

### Step 5: 进入控制台
- [ ] 访问: https://console.cloudinary.com/
- [ ] 确认已成功登录
- [ ] 看到Dashboard页面

### Step 6: 找到凭证面板
- [ ] 在Dashboard首页找到 "Product Environment Credentials"
- [ ] 看到三行配置信息

### Step 7: 复制配置信息

#### 复制 Cloud Name
- [ ] 找到 "Cloud name:" 那一行
- [ ] 复制其值
- [ ] 粘贴到记事本（临时保存）

**您的Cloud Name**: 
```
_________________________ （请填写）
```

#### 复制 API Key
- [ ] 找到 "API Key:" 那一行
- [ ] 复制其值（纯数字）
- [ ] 粘贴到记事本

**您的API Key**: 
```
_________________________ （请填写）
```

#### 复制 API Secret
- [ ] 找到 "API Secret:" 那一行
- [ ] 点击 "Show" 按钮（如果被隐藏）
- [ ] 或直接点击 "Copy" 按钮
- [ ] 粘贴到记事本

**您的API Secret**: 
```
_________________________ （请填写，保密！）
```

---

## ✅ 完成确认

### 请确认以下所有项目：

- [ ] ✅ 已成功注册Cloudinary账户
- [ ] ✅ 已验证邮箱
- [ ] ✅ 已成功登录Dashboard
- [ ] ✅ 已找到并打开 "Product Environment Credentials" 面板
- [ ] ✅ 已成功复制 Cloud Name
- [ ] ✅ 已成功复制 API Key  
- [ ] ✅ 已成功复制 API Secret
- [ ] ✅ 三个值都已保存到安全的地方

---

## 📝 配置信息汇总

请将您的配置信息填写在这里（仅供您自己参考）：

```
Cloud Name:    _________________________________

API Key:       _________________________________

API Secret:    _________________________________
```

---

## 🚀 准备好了？

当您完成以上所有步骤后，请告诉我：

**"我已经准备好Cloudinary配置了"**

然后提供您的三个配置值，我将立即为您：

1. ✅ 安装必需的npm包
   ```bash
   npm install cloudinary multer-storage-cloudinary
   ```

2. ✅ 更新 `.env` 配置文件
   ```env
   USE_CLOUDINARY=true
   CLOUDINARY_CLOUD_NAME=您的值
   CLOUDINARY_API_KEY=您的值
   CLOUDINARY_API_SECRET=您的值
   ```

3. ✅ 测试文件上传功能

4. ✅ 验证云存储是否正常工作

---

## 💡 快速提示

### 如何快速找到Dashboard
1. 直接访问: https://console.cloudinary.com/
2. 或登录后点击右上角头像 → Dashboard

### 如果找不到凭证面板
- 确保在Dashboard首页
- 向下滚动页面
- 查找 "Product Environment Credentials" 标题

### 如果API Secret被隐藏
- 点击旁边的 "Show" 按钮
- 或直接点击 "Copy" 复制

---

## ⚠️ 重要提醒

1. **Cloud Name不可更改**
   - 注册时请认真选择
   - 建议使用项目相关名称

2. **API Secret要保密**
   - 不要分享给他人
   - 不要提交到Git
   - 不要截图发布

3. **免费额度充足**
   - 25GB存储空间
   - 25GB月流量
   - 对大多数项目足够使用

---

## 📞 需要帮助？

如果遇到任何问题，请随时告诉我：
- 注册过程中的问题
- 找不到配置信息
- 不确定哪个是正确的值
- 任何其他疑问

我会立即帮助您解决！

---

**当您准备好配置信息后，我们就可以继续配置系统了！** 🎉

