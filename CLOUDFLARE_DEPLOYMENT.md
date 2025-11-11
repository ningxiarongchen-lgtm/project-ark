# Cloudflare Pages 部署指南

**项目**: Project ArK 智能制造管理系统  
**更新日期**: 2025-11-11

---

## 🚀 快速部署

### 前提条件
- ✅ GitHub 仓库已连接
- ✅ Cloudflare Pages 项目已创建
- ✅ 代码已推送到 main 分支

---

## ⚙️ Cloudflare Pages 配置

### 1. 构建设置

在 Cloudflare Pages Dashboard 中配置以下设置：

#### 基本设置
```
项目名称: project-ark
生产分支: main
```

#### 构建配置
```
框架预设: Vite
构建命令: cd frontend && npm install && npm run build
构建输出目录: frontend/dist
根目录: /
Node 版本: 18
```

**重要**: 确保选择正确的 Node.js 版本（18 或更高）

---

### 2. 环境变量

在 Cloudflare Pages 设置中添加以下环境变量：

#### 生产环境变量
```
NODE_VERSION=18
VITE_API_URL=https://your-backend-api.com
```

#### 可选环境变量
```
NODE_ENV=production
NPM_CONFIG_PRODUCTION=false
```

---

## 📁 项目结构

```
project-ark/
├── frontend/                    # 前端应用（Cloudflare Pages 部署此目录）
│   ├── dist/                   # 构建输出（自动生成）
│   ├── public/                 # 静态资源
│   │   └── _redirects          # Cloudflare 路由配置
│   ├── src/                    # 源代码
│   ├── package.json            # 依赖配置
│   └── vite.config.js          # Vite 配置
├── backend/                    # 后端应用（需单独部署）
└── .cloudflare-pages.json      # Cloudflare Pages 配置
```

---

## 🔧 构建命令详解

### 完整构建流程

```bash
# 1. 进入前端目录
cd frontend

# 2. 安装依赖
npm install

# 3. 构建生产版本
npm run build

# 4. 输出目录
# frontend/dist/
```

### Vite 构建特性

- ✅ **代码分割**: 自动分割大型依赖
- ✅ **Tree Shaking**: 移除未使用的代码
- ✅ **压缩**: Terser 压缩，移除 console
- ✅ **CSS 优化**: CSS 代码分割和压缩
- ✅ **浏览器兼容**: 支持 Safari 11+, iOS 11+

---

## 🌐 路由配置

### _redirects 文件

位置: `frontend/public/_redirects`

```
/*    /index.html   200
```

**作用**: 
- 处理 React Router 的客户端路由
- 所有路径都返回 index.html
- 让前端路由接管导航

---

## 🐛 常见问题和解决方案

### 问题 1: 构建失败 - 找不到模块

**错误信息**:
```
[vite]: Rollup failed to resolve import "ant-design"
```

**原因**: 导入语句包名错误

**解决方案**:
```javascript
// ❌ 错误
import { Button } from 'ant-design'

// ✅ 正确
import { Button } from 'antd'
```

---

### 问题 2: 构建命令失败

**错误信息**:
```
npm ERR! missing script: build
```

**原因**: 构建命令路径不正确

**解决方案**:
确保构建命令包含 `cd frontend`:
```bash
cd frontend && npm install && npm run build
```

---

### 问题 3: 404 错误（刷新页面）

**原因**: 缺少 `_redirects` 文件

**解决方案**:
1. 创建 `frontend/public/_redirects`
2. 添加内容：`/*    /index.html   200`
3. 重新构建部署

---

### 问题 4: 构建输出目录错误

**错误信息**:
```
No build output found
```

**原因**: 输出目录配置不正确

**解决方案**:
- 构建输出目录应设置为: `frontend/dist`
- 不是 `dist` 或 `/dist`

---

### 问题 5: Node 版本不兼容

**错误信息**:
```
The engine "node" is incompatible with this module
```

**解决方案**:
1. 在 Cloudflare Pages 设置中添加环境变量
2. `NODE_VERSION=18`
3. 或在 `package.json` 中指定：
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

### 问题 6: 依赖安装失败

**错误信息**:
```
npm ERR! code ERESOLVE
```

**解决方案**:
使用 `--legacy-peer-deps`:
```bash
cd frontend && npm install --legacy-peer-deps && npm run build
```

---

## 📊 构建优化

### 当前优化措施

1. **代码压缩**
   - Terser 压缩
   - 移除 console.log
   - 移除注释

2. **代码分割**
   - 按路由分割
   - 按组件分割
   - 动态导入

3. **资源优化**
   - CSS 代码分割
   - 图片优化
   - 字体优化

4. **缓存策略**
   - 文件名包含 hash
   - 长期缓存

### 构建性能指标

```
构建时间: ~2-3分钟
输出大小: ~2-3MB（压缩后）
首次加载: ~500KB
```

---

## 🔍 部署验证

### 部署后检查清单

#### 1. 基本功能
- [ ] 网站可以访问
- [ ] 首页正常加载
- [ ] 样式正确显示
- [ ] 图片正常加载

#### 2. 路由功能
- [ ] 页面导航正常
- [ ] 刷新页面不出现404
- [ ] 浏览器前进/后退正常
- [ ] 直接访问子路径正常

#### 3. 核心功能
- [ ] 登录功能正常
- [ ] 数据加载正常
- [ ] 表单提交正常
- [ ] 文件上传/下载正常

#### 4. 性能检查
- [ ] 首次加载 < 3秒
- [ ] 页面切换流畅
- [ ] 无明显卡顿
- [ ] 控制台无错误

---

## 📝 部署流程

### 自动部署（推荐）

```bash
# 1. 修改代码
git add .
git commit -m "feat: 新功能"

# 2. 推送到 GitHub
git push origin main

# 3. Cloudflare 自动检测并部署
# 等待 2-3 分钟
```

### 手动部署

1. 登录 Cloudflare Dashboard
2. 进入 Pages 项目
3. 点击 "Create deployment"
4. 选择分支或上传文件
5. 等待构建完成

---

## 🔄 回滚部署

如果新部署出现问题：

1. 进入 Cloudflare Pages Dashboard
2. 点击 "Deployments" 标签
3. 找到上一个成功的部署
4. 点击 "Rollback to this deployment"
5. 确认回滚

---

## 🌍 自定义域名

### 添加自定义域名

1. 在 Cloudflare Pages 中点击 "Custom domains"
2. 点击 "Set up a custom domain"
3. 输入域名（如 `www.project-ark.com`）
4. 按照指示配置 DNS
5. 等待 SSL 证书自动配置

### DNS 配置示例

```
类型: CNAME
名称: www
内容: project-ark.pages.dev
代理: 已启用（橙色云朵）
```

---

## 📈 监控和日志

### 查看构建日志

1. 进入 Cloudflare Pages Dashboard
2. 点击具体的部署
3. 查看 "Build log"
4. 检查错误信息

### 查看访问日志

1. 进入 Cloudflare Analytics
2. 查看流量统计
3. 监控性能指标
4. 分析用户行为

---

## 🔐 安全配置

### 推荐的安全设置

1. **启用 HTTPS**
   - 自动启用
   - 强制 HTTPS 重定向

2. **配置 Headers**
   在 `_headers` 文件中：
   ```
   /*
     X-Frame-Options: DENY
     X-Content-Type-Options: nosniff
     X-XSS-Protection: 1; mode=block
     Referrer-Policy: strict-origin-when-cross-origin
   ```

3. **访问控制**
   - 配置 Cloudflare Access
   - 设置 IP 白名单
   - 启用 WAF 规则

---

## 💡 最佳实践

### 1. 分支策略

```
main (生产环境)
  ├── develop (开发环境)
  └── feature/* (功能分支)
```

### 2. 环境管理

- **生产环境**: main 分支 → project-ark.pages.dev
- **预览环境**: 其他分支 → 自动生成预览链接

### 3. 构建优化

- 使用 `.npmrc` 配置加速安装
- 启用构建缓存
- 优化依赖大小

### 4. 监控告警

- 设置构建失败通知
- 监控网站可用性
- 配置性能告警

---

## 📞 技术支持

### Cloudflare 支持

- 📖 文档: https://developers.cloudflare.com/pages
- 💬 社区: https://community.cloudflare.com
- 📧 支持: 通过 Dashboard 提交工单

### 项目支持

- 📧 Email: support@project-ark.com
- 📱 电话: +86-XXX-XXXX-XXXX
- 🌐 网站: https://project-ark.com

---

## 🎯 快速故障排除

### 构建失败？

1. ✅ 检查构建命令是否正确
2. ✅ 检查输出目录配置
3. ✅ 查看构建日志中的错误
4. ✅ 验证 package.json 依赖
5. ✅ 确认 Node 版本兼容

### 404 错误？

1. ✅ 检查 `_redirects` 文件
2. ✅ 确认文件在 `public/` 目录
3. ✅ 重新构建部署

### 样式丢失？

1. ✅ 检查 CSS 文件路径
2. ✅ 确认构建输出包含 CSS
3. ✅ 检查浏览器控制台错误

### API 调用失败？

1. ✅ 检查 CORS 配置
2. ✅ 确认 API 地址正确
3. ✅ 验证环境变量设置

---

## ✅ 部署检查清单

### 部署前

- [ ] 代码已提交到 Git
- [ ] 本地构建测试通过
- [ ] 依赖版本已锁定
- [ ] 环境变量已配置

### 部署中

- [ ] 构建命令正确
- [ ] 输出目录正确
- [ ] Node 版本正确
- [ ] 构建日志无错误

### 部署后

- [ ] 网站可以访问
- [ ] 所有页面正常
- [ ] 功能测试通过
- [ ] 性能符合预期

---

**最后更新**: 2025-11-11  
**文档版本**: v1.0  
**维护者**: Project ArK 技术团队
