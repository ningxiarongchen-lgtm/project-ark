# 🔄 Vercel 强制清除缓存并重新部署

**日期**: 2025-10-31  
**问题**: Vercel 使用旧的缓存版本  
**解决方案**: 强制清除缓存并重新部署

---

## 🎯 快速操作（2分钟完成）

### 方法1：通过 Vercel Dashboard（最简单）✨

1. **登录 Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **进入你的项目**
   - 找到并点击你的项目（project-ark）

3. **进入 Deployments**
   - 点击顶部的 "Deployments" 标签

4. **重新部署最新版本**
   - 找到最新的部署记录（通常在最上面）
   - 点击右侧的 **"..."** 三点菜单
   - 选择 **"Redeploy"**
   - ✅ **勾选** "Use existing Build Cache" → **取消勾选** ❌
   - 点击 **"Redeploy"** 确认

5. **等待部署完成**
   - 通常需要 1-3 分钟
   - 看到绿色的 "Ready" 表示成功

---

## 方法2：通过 Git 推送触发（推荐）🚀

### 步骤1：创建空提交强制重新构建

```bash
# 进入项目目录
cd "/Users/hexiaoxiao/Desktop/Model Selection System"

# 创建一个空提交（不修改任何文件）
git commit --allow-empty -m "chore: force rebuild to clear Vercel cache"

# 推送到 GitHub
git push origin main
```

### 步骤2：在 Vercel 中清除缓存

在推送代码后，Vercel 会自动开始构建。如果你想确保清除缓存：

1. 访问 Vercel Dashboard
2. 进入项目 → Settings → General
3. 滚动到底部，找到 "Build & Development Settings"
4. 确认构建命令是：`npm run build`

---

## 方法3：修改前端配置触发完整重新构建 🔧

如果以上方法都不奏效，可以修改 `vercel.json` 来强制清除缓存：

### 步骤1：更新 vercel.json

在 `vercel.json` 中添加缓存控制：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

### 步骤2：提交并推送

```bash
git add frontend/vercel.json
git commit -m "fix: update cache control headers for Vercel"
git push origin main
```

---

## 🔍 验证缓存已清除

### 检查1：查看构建日志

1. 在 Vercel Dashboard → Deployments
2. 点击最新的部署
3. 查看 "Build Logs"
4. 应该看到完整的构建过程（不是从缓存加载）

关键日志标识：
```
✓ Building fresh (not from cache)
✓ Installing dependencies
✓ Building application
```

### 检查2：测试前端

1. **清除浏览器缓存**
   - Chrome: Ctrl+Shift+Delete (Windows) / Cmd+Shift+Delete (Mac)
   - 或者使用无痕模式（Incognito）

2. **访问 Vercel 部署的 URL**

3. **打开开发者工具**（F12）
   - 切换到 Network 标签
   - 勾选 "Disable cache"

4. **刷新页面**（Ctrl+R 或 Cmd+R）

5. **检查 API 配置**
   - 打开 Console 标签
   - 输入：`console.log(import.meta.env.VITE_API_URL)`
   - 应该显示正确的后端 URL

### 检查3：验证 API 请求

1. 尝试登录或执行任何 API 操作
2. 在 Network 标签中查看请求
3. 确认请求发送到正确的后端地址

---

## 🚨 常见问题排查

### 问题1：重新部署后仍然使用旧版本

**解决方案**：
```bash
# 1. 清除本地缓存
rm -rf frontend/node_modules
rm -rf frontend/dist
rm -rf frontend/.vite

# 2. 重新安装依赖
cd frontend
npm install

# 3. 本地测试构建
npm run build

# 4. 如果本地构建成功，推送到 Git
cd ..
git add .
git commit -m "fix: rebuild with clean cache"
git push origin main
```

### 问题2：环境变量没有生效

1. **检查 Vercel 环境变量**
   - Settings → Environment Variables
   - 确认 `VITE_API_URL` 存在
   - 确认值正确（包含 `/api` 后缀）

2. **确保重新部署**
   - 环境变量修改后必须重新部署才能生效

3. **验证环境变量**
   - 查看构建日志中的环境变量部分

### 问题3：构建失败

1. **查看构建日志**
   - Deployments → 点击失败的部署 → Build Logs

2. **常见错误**：
   - 依赖安装失败 → 检查 `package.json`
   - 构建命令错误 → 检查 `vercel.json` 中的 `buildCommand`
   - TypeScript 错误 → 修复代码中的类型错误

---

## 💡 防止缓存问题的最佳实践

### 1. 版本控制

在 `package.json` 中添加版本号：

```json
{
  "name": "project-ark-frontend",
  "version": "1.0.1",  // 每次更新时递增
  ...
}
```

### 2. 构建时间戳

可以在构建时添加时间戳：

```json
{
  "scripts": {
    "build": "vite build",
    "build:production": "vite build --mode production"
  }
}
```

### 3. 清晰的提交信息

使用语义化的提交信息：
```bash
git commit -m "fix: update API configuration"
git commit -m "feat: add new feature"
git commit -m "chore: force rebuild"
```

---

## ✅ 成功标志

完成后，您应该看到：

- ✅ Vercel 构建日志显示完整构建过程
- ✅ 没有 "Using cache" 的提示
- ✅ 前端可以访问
- ✅ API 请求发送到正确的后端地址
- ✅ 浏览器控制台没有错误
- ✅ 可以正常登录和使用功能

---

## 📞 还是不行？

如果以上所有方法都尝试过了，还是不行，可以尝试：

### 终极方案：删除并重新部署项目

1. **备份环境变量**
   - 在 Vercel Settings → Environment Variables
   - 复制所有环境变量的 Key 和 Value

2. **删除当前部署**（可选）
   - Settings → General → 滚动到底部
   - "Delete Project"

3. **重新连接 GitHub 仓库**
   - 在 Vercel Dashboard 点击 "New Project"
   - 选择你的 GitHub 仓库
   - 重新配置环境变量
   - 部署

---

## 🎯 快速命令参考

```bash
# 强制重新部署（推荐）
cd "/Users/hexiaoxiao/Desktop/Model Selection System"
git commit --allow-empty -m "chore: force rebuild"
git push origin main

# 清除本地缓存并重新构建
cd frontend
rm -rf node_modules dist .vite
npm install
npm run build

# 检查构建产物
ls -la dist/

# 本地预览构建结果
npm run preview
```

---

## 📝 操作记录

执行完成后，记录：

- [ ] 执行日期和时间
- [ ] 使用的方法（方法1/2/3）
- [ ] Vercel 部署 URL
- [ ] 构建是否成功
- [ ] 功能是否正常

---

**文档版本**: v1.0  
**创建时间**: 2025-10-31  
**最后更新**: 2025-10-31

🎉 **祝清除缓存成功！**


