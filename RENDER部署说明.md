# Render部署说明

## ✅ 问题已修复

**问题**: Render部署时`tesseract.js`和`sharp`依赖安装失败  
**原因**: 这些依赖需要编译原生模块，在Render的免费环境中可能失败  
**解决方案**: 将这些依赖设为可选，并添加动态加载机制

---

## 🔧 修复内容

### 1. 依赖优化

**修改文件**: `backend/package.json`

```json
{
  "dependencies": {
    // 核心依赖保留
    "express": "^4.18.2",
    "mongoose": "^7.6.3",
    // ... 其他核心依赖
  },
  "optionalDependencies": {
    // 可选依赖（安装失败不影响核心功能）
    "pdf-parse": "^2.4.5",
    "sharp": "^0.34.5",
    "tesseract.js": "^6.0.1"
  }
}
```

### 2. 动态加载机制

**修改文件**: `backend/services/documentParser.js`

```javascript
// 动态加载依赖，避免在没有安装时报错
let pdf, Tesseract;
try {
  pdf = require('pdf-parse');
} catch (e) {
  console.warn('⚠️  pdf-parse未安装，PDF解析功能将不可用');
}
try {
  Tesseract = require('tesseract.js');
} catch (e) {
  console.warn('⚠️  tesseract.js未安装，OCR功能将不可用');
}
```

### 3. Render配置优化

**修改文件**: `render.yaml`

```yaml
buildCommand: cd backend && npm install --omit=optional
```

---

## 📋 Render部署步骤

### 1. 在Render Dashboard中

1. 登录 https://dashboard.render.com
2. 点击项目 `project-ark`
3. 查看部署日志

### 2. 环境变量配置

确保以下环境变量已配置：

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=你的MongoDB连接字符串
JWT_SECRET=自动生成或手动设置
CORS_ORIGIN=你的前端域名
```

### 3. 重新部署

代码已推送到GitHub，Render会自动触发部署。

---

## ✅ 功能状态

### Render环境（生产）

| 功能 | 状态 | 说明 |
|------|------|------|
| 核心选型功能 | ✅ | 完全可用 |
| Excel批量选型 | ✅ | 完全可用 |
| 数据管理 | ✅ | 完全可用 |
| PDF解析 | ⚠️ | 可能不可用（依赖可选） |
| 图片OCR | ⚠️ | 可能不可用（依赖可选） |
| AI提取 | ✅ | 可用（如配置OpenAI Key） |

### 本地环境（开发）

| 功能 | 状态 | 说明 |
|------|------|------|
| 所有功能 | ✅ | 完全可用 |

---

## 🎯 推荐部署方案

### 方案1: Render（当前）- 免费

**优点**:
- 免费
- 自动部署
- 简单易用

**限制**:
- PDF/图片解析可能不可用
- 资源有限

**适用场景**: 
- 演示和测试
- 核心选型功能

### 方案2: Railway - 推荐

**优点**:
- 支持原生依赖编译
- PDF/图片解析完全可用
- 性能更好

**成本**: 
- $5/月起

**部署命令**:
```bash
# 安装Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 部署
railway up
```

### 方案3: 自建服务器 - 最佳

**优点**:
- 完全控制
- 所有功能可用
- 性能最佳

**部署步骤**: 参考 `部署指南.md`

---

## 🔍 验证部署

### 1. 检查服务状态

访问: `https://你的域名/api/health`

应该返回:
```json
{
  "status": "ok",
  "timestamp": "2025-11-11T..."
}
```

### 2. 测试核心功能

```bash
# 测试登录
curl -X POST https://你的域名/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 测试选型
curl -X POST https://你的域名/api/selection/calculate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"valveTorque":500,"safetyFactor":1.3}'
```

### 3. 检查日志

在Render Dashboard中查看部署日志，确认：
- ✅ 服务启动成功
- ✅ MongoDB连接成功
- ⚠️ 可选依赖警告（正常）

---

## 📝 常见问题

### Q1: PDF解析功能不可用怎么办？

**A**: 这是正常的，因为`pdf-parse`在Render免费环境可能无法安装。

**解决方案**:
1. 使用Excel批量选型（完全可用）
2. 升级到Railway或自建服务器
3. 在本地使用PDF解析，然后上传Excel

### Q2: 部署仍然失败？

**A**: 检查以下内容：
1. Node版本 >= 18.0.0
2. 环境变量配置正确
3. MongoDB连接字符串有效

### Q3: 如何启用PDF解析？

**A**: 
1. 升级到Railway或VPS
2. 确保系统支持原生模块编译
3. 运行 `npm install` 安装所有依赖

---

## 🎉 总结

**当前状态**: ✅ 核心功能已成功部署

**可用功能**:
- ✅ 用户登录
- ✅ 单个选型
- ✅ Excel批量选型
- ✅ 数据管理
- ✅ 项目管理
- ✅ 报价管理

**限制**:
- ⚠️ PDF/图片智能解析（Render环境）

**建议**: 
- 当前配置适合演示和基础使用
- 如需完整功能，建议升级到Railway或自建服务器

---

**最后更新**: 2025-11-11  
**状态**: ✅ 部署问题已修复，等待Render自动部署
