# Cloudflare Pages 快速参考

**项目**: Project ArK  
**更新**: 2025-11-11

---

## 🚀 一键配置

### Cloudflare Pages Dashboard 设置

```
框架预设:        Vite
构建命令:        cd frontend && npm install && npm run build
构建输出目录:    frontend/dist
根目录:          /
Node 版本:       18
生产分支:        main
```

---

## 📋 快速检查清单

### ✅ 已修复的问题

- [x] 修复 TechnicianWorkbench 导入错误
  - `'ant-design'` → `'antd'`
  - Commit: `ee63198fd`

- [x] 添加 Cloudflare 配置文件
  - `.cloudflare-pages.json`
  - `frontend/public/_redirects`
  - Commit: `e25e337b4`

---

## 🔍 故障排查

### 问题: 构建失败 - 找不到模块

**检查**: 
```bash
# 查看错误日志中的包名
[vite]: Rollup failed to resolve import "xxx"
```

**解决**:
1. 确认包名正确（如 `antd` 不是 `ant-design`）
2. 检查 `package.json` 中是否有该依赖
3. 确认导入路径正确

---

### 问题: 404 错误

**检查**:
- `frontend/public/_redirects` 文件是否存在
- 内容: `/*    /index.html   200`

**解决**:
```bash
# 创建 _redirects 文件
echo "/*    /index.html   200" > frontend/public/_redirects
```

---

### 问题: 构建输出目录错误

**检查**:
- 构建输出目录设置为 `frontend/dist`
- 不是 `dist` 或 `/dist`

---

## 📊 当前部署状态

### Git 提交历史

```bash
e25e337b4 - docs: 添加Cloudflare Pages部署配置和详细指南
ee63198fd - fix: 修复TechnicianWorkbench导入错误
655f10c6c - docs: 添加完整文档索引和导航指南
```

### 文件清单

```
✅ .cloudflare-pages.json         # Cloudflare 配置
✅ frontend/public/_redirects     # 路由重定向
✅ CLOUDFLARE_DEPLOYMENT.md       # 详细部署指南
✅ CLOUDFLARE_QUICK_REFERENCE.md  # 快速参考（本文档）
```

---

## 🎯 下一步

### 1. 等待 Cloudflare 自动部署

- ⏱️ 预计时间: 2-3分钟
- 📍 位置: Cloudflare Pages Dashboard
- 🔍 查看: Build log

### 2. 验证部署

访问以下页面确认：
- [ ] 首页: `/`
- [ ] 工作台: `/technician-workbench`
- [ ] 批量选型: `/batch-selection`
- [ ] 选型引擎: `/selection-engine`

### 3. 检查功能

- [ ] 页面正常加载
- [ ] 样式正确显示
- [ ] 路由导航正常
- [ ] 刷新无404错误

---

## 💡 常用命令

### 本地测试构建

```bash
cd frontend
npm install
npm run build
npm run preview
```

### 查看构建输出

```bash
ls -lh frontend/dist/
```

### 清理并重新构建

```bash
cd frontend
rm -rf dist node_modules
npm install
npm run build
```

---

## 📞 需要帮助？

### 查看完整文档
```bash
cat CLOUDFLARE_DEPLOYMENT.md
```

### 查看构建日志
1. 登录 Cloudflare Dashboard
2. 进入 Pages 项目
3. 点击最新部署
4. 查看 "Build log"

### 联系支持
- 📧 support@project-ark.com
- 📖 CLOUDFLARE_DEPLOYMENT.md

---

## ✅ 成功标志

部署成功后，您应该看到：

```
✓ Cloning git repository
✓ Building application
✓ Deploying to Cloudflare's global network
✓ Success! Your site is live
```

**部署URL**: `https://project-ark.pages.dev`

---

**快速参考版本**: v1.0  
**最后更新**: 2025-11-11
