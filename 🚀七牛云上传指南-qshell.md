# 🚀 七牛云上传指南 - 使用qshell工具

## ✅ 当前进度

- ✅ qshell工具已下载并安装（v2.12.0）
- ✅ DNS解析已生效
- ✅ 域名配置成功（cdn.project-ark.com.cn）
- ⏳ 下一步：上传文件到七牛云

---

## 📋 第1步：获取七牛云密钥（2分钟）

### 操作步骤：

1. **访问七牛云控制台：** https://portal.qiniu.com

2. **点击右上角头像 → 密钥管理**
   
   或直接访问：https://portal.qiniu.com/user/key

3. **复制密钥信息：**
   ```
   AccessKey（AK）：类似 abc123def456...（40字符左右）
   SecretKey（SK）：类似 xyz789uvw012...（40字符左右）
   ```

⚠️ **重要提示：**
- SecretKey只显示一次，请妥善保存
- 不要泄露给他人
- 建议保存到安全的地方

---

## 📋 第2步：配置qshell（1分钟）

拿到AK和SK后，在终端执行以下命令：

```bash
# 进入项目目录
cd "/Users/hexiaoxiao/Desktop/Model Selection System"

# 配置七牛云账号
./qshell account <您的AccessKey> <您的SecretKey> qiniu-account

# 示例（请替换成您自己的密钥）：
# ./qshell account abc123def456 xyz789uvw012 qiniu-account
```

---

## 📋 第3步：上传文件到七牛云（2分钟）

配置好账号后，执行上传命令：

```bash
# 确保在项目目录
cd "/Users/hexiaoxiao/Desktop/Model Selection System"

# 上传整个dist目录到七牛云
./qshell qupload2 \
  --bucket=smart-system-overseas2 \
  --src-dir=./frontend/dist \
  --overwrite=true \
  --check-exists=true \
  --check-hash=true \
  --rescan-local=true
```

上传过程会显示：
```
上传进度：[=====>    ] 50%
已上传：30个文件
剩余：32个文件
```

---

## 📋 第4步：测试访问（立即）

上传完成后，访问：
```
http://cdn.project-ark.com.cn/index.html
```

✅ **应该能看到您的智能制造系统登录页面！**

---

## 🎯 完整命令速查（复制粘贴）

### 一次性完成所有操作：

```bash
# 1. 进入项目目录
cd "/Users/hexiaoxiao/Desktop/Model Selection System"

# 2. 配置账号（替换成您的密钥）
./qshell account <您的AccessKey> <您的SecretKey> qiniu-account

# 3. 上传文件
./qshell qupload2 \
  --bucket=smart-system-overseas2 \
  --src-dir=./frontend/dist \
  --overwrite=true \
  --check-exists=true \
  --check-hash=true \
  --rescan-local=true

# 4. 测试访问
echo "上传完成！请访问：http://cdn.project-ark.com.cn/index.html"
```

---

## 📱 手机测试

上传完成后，用手机浏览器访问：
```
http://cdn.project-ark.com.cn/index.html
```

应该：
- ✅ 加载速度快
- ✅ 页面显示正常
- ✅ 没有乱码
- ✅ 可以登录

---

## ❓ 常见问题

### Q1: 提示"bucket not exist"？
**A:** 检查bucket名称是否正确：`smart-system-overseas2`

### Q2: 提示"access denied"？
**A:** 
1. 检查AccessKey和SecretKey是否正确
2. 确认密钥对应的账号有权限访问该bucket

### Q3: 上传很慢？
**A:** 
- 正常现象，约62个文件需要1-2分钟
- 耐心等待即可

### Q4: 上传后访问404？
**A:** 
1. 等待1-2分钟，CDN需要时间同步
2. 检查文件是否真的上传成功
3. 刷新CDN缓存

---

## 🔄 如何刷新CDN缓存？

上传完成后，建议刷新CDN缓存：

```bash
# 刷新首页
./qshell cdnrefresh http://cdn.project-ark.com.cn/index.html

# 刷新整个目录（推荐）
./qshell cdnrefresh -d cdn.project-ark.com.cn
```

---

## 📊 检查上传文件

查看七牛云bucket中的文件：

```bash
./qshell listbucket smart-system-overseas2
```

应该看到：
```
index.html
assets/index-xxx.js
assets/index-xxx.css
...
```

---

## ⏰ 预计时间

- 获取密钥：2分钟
- 配置qshell：1分钟
- 上传文件：2分钟
- 测试访问：立即
- **总计：约5分钟**

---

## 🎉 完成后

您将拥有：
- ✅ CDN加速的前端网站
- ✅ 自定义域名访问
- ✅ 全国快速访问
- ✅ 移动端完美支持
- ✅ 完全免费（免费额度内）

---

## 📞 下一步

完成上传后，告诉我结果：
- ✅ 上传成功 - 我帮您测试访问
- ❌ 遇到问题 - 告诉我错误信息，我立即帮您解决

**现在开始吧！** 🚀

