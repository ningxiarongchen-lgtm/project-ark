# 📦 部署指南

## ⚡ 超简单部署（推荐）

### 一个命令搞定所有！

改完代码后，只需运行：

```bash
./deploy.sh "你的修改说明"
```

**示例：**
```bash
./deploy.sh "修复Dashboard统计问题"
./deploy.sh "添加新功能"
./deploy.sh "优化性能"
```

这个命令会自动完成：
1. ✅ Git add（添加所有更改）
2. ✅ Git commit（提交代码）
3. ✅ Git push（推送到GitHub）
4. ✅ npm run build（构建前端）
5. ✅ 部署到Cloudflare Pages
6. ✅ 显示访问地址

**就是这么简单！** 🎉

---

## 🚀 其他部署方式

### 方法1：只部署Cloudflare Pages（不提交Git）

```bash
# 在项目根目录运行
./deploy-cloudflare.sh
```

这个脚本会自动完成：
1. ✅ 构建前端（`npm run build`）
2. ✅ 部署到 Cloudflare Pages
3. ✅ 显示部署后的访问地址

### 方法2：手动部署

```bash
# 1. 进入前端目录
cd frontend

# 2. 构建前端
npm run build

# 3. 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=smart-system --commit-dirty=true
```

---

## 🌐 访问地址

### 主地址
```
https://smart-system.pages.dev
```

### 历史部署
每次部署都会生成一个新的预览地址，格式如：
```
https://[commit-hash].smart-system.pages.dev
```

---

## 📋 部署流程

### 开发流程
1. **本地开发** - 修改代码
2. **提交代码** - `git add` + `git commit`
3. **推送代码** - `git push origin main`
4. **部署** - 运行 `./deploy-cloudflare.sh`

### 完整示例
```bash
# 1. 修改代码后提交
git add .
git commit -m "feat: 添加新功能"
git push origin main

# 2. 部署到 Cloudflare Pages
./deploy-cloudflare.sh
```

---

## ⚙️ Cloudflare Pages 配置

### 项目信息
- **项目名称**: `smart-system`
- **构建命令**: `npm run build`
- **输出目录**: `dist`
- **框架**: React + Vite

### 环境变量
如需配置环境变量，请在 Cloudflare Pages 控制台设置：
```
https://dash.cloudflare.com/pages
→ smart-system
→ Settings
→ Environment variables
```

---

## 🔍 查看部署状态

### 使用命令行
```bash
# 查看项目列表
wrangler pages project list

# 查看部署历史
wrangler pages deployment list --project-name=smart-system
```

### 使用Web控制台
访问：https://dash.cloudflare.com/pages

---

## 🐛 故障排查

### 部署失败
1. 检查 `wrangler` 是否已安装：`wrangler --version`
2. 检查是否已登录：`wrangler whoami`
3. 重新登录：`wrangler login`

### 构建失败
1. 清除依赖：`cd frontend && rm -rf node_modules && npm install`
2. 重新构建：`npm run build`

### 访问问题
1. 清除浏览器缓存：`Cmd + Shift + R` (Mac) 或 `Ctrl + Shift + R` (Windows)
2. 等待2-3分钟让CDN更新
3. 尝试访问最新部署的URL

---

## 📊 性能优化

### 构建优化
- ✅ 代码分割（Code Splitting）
- ✅ 懒加载（Lazy Loading）
- ✅ Tree Shaking
- ✅ 压缩混淆

### CDN优化
- ✅ 全球200+节点
- ✅ 自动HTTPS
- ✅ 自动压缩（Gzip/Brotli）
- ✅ 边缘缓存

---

## 💡 提示

### 快速部署
添加到你的 shell 配置文件（如 `.zshrc` 或 `.bashrc`）：
```bash
alias deploy-cf='cd "/Users/hexiaoxiao/Desktop/Model Selection System" && ./deploy-cloudflare.sh'
```

然后在任何目录下都可以运行：
```bash
deploy-cf
```

### 部署前检查
建议在部署前：
1. ✅ 运行测试：`npm test`
2. ✅ 检查语法：`npm run lint`
3. ✅ 本地预览：`npm run build && npm run preview`

---

## 🔗 相关链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler)
- [项目控制台](https://dash.cloudflare.com/pages)
- [访问网站](https://smart-system.pages.dev)

---

## 📝 注意事项

⚠️ **重要**：
- 不要删除 `.wrangler` 目录
- 不要泄露 Cloudflare API Token
- 部署前确保代码已提交到 Git
- 每次部署会生成新的预览URL

✅ **最佳实践**：
- 定期清理旧的部署
- 使用环境变量管理配置
- 监控部署状态和错误日志
- 保持 `wrangler` 版本最新

---

**最后更新**: 2025年11月4日

