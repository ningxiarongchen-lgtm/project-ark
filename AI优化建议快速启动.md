# AI优化建议功能 - 快速启动指南

## 🚀 5分钟快速配置

### 步骤1️⃣: 获取OpenAI API密钥

1. 访问 https://platform.openai.com/api-keys
2. 登录或注册OpenAI账号
3. 点击 "Create new secret key" 创建新密钥
4. 复制生成的密钥（格式：`sk-...`）

### 步骤2️⃣: 配置后端

在 `backend` 目录创建 `.env` 文件（如果没有的话）：

```bash
cd backend
cp .env.example .env  # 如果存在.env.example的话
```

在 `.env` 文件中添加（或修改）以下配置：

```bash
# OpenAI API配置
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

> 💡 **提示**: `gpt-4o-mini` 是推荐的模型，成本低、速度快、质量高

### 步骤3️⃣: 重启后端服务

```bash
cd backend
npm run dev
```

看到以下输出说明配置成功：

```
╔════════════════════════════════════════════════════════╗
║   C-MAX Actuator Selection System - Backend API       ║
║   Server running on port 5001                          ║
╚════════════════════════════════════════════════════════╝
```

### 步骤4️⃣: 测试功能（可选）

```bash
cd backend
./test-ai-api.sh
```

如果看到 "所有测试通过！✓" 说明配置成功。

### 步骤5️⃣: 前端使用

1. 启动前端（如果未启动）：
```bash
cd frontend
npm run dev
```

2. 访问 http://localhost:5173
3. 登录系统
4. 进入任意项目详情页
5. 切换到 "BOM清单" 标签
6. 点击 **"AI优化建议"** 按钮（紫色渐变）
7. 等待5-15秒，查看AI分析结果

## ✅ 完成！

现在您可以使用AI功能分析BOM清单，获取优化建议了！

---

## 🆘 遇到问题？

### 问题1: "OpenAI API密钥未配置"

**解决方案**: 
- 检查 `backend/.env` 文件是否存在
- 确认 `OPENAI_API_KEY` 是否正确填写
- 重启后端服务

### 问题2: "OpenAI API密钥无效"

**解决方案**:
- 检查API密钥是否完整复制（以 `sk-` 开头）
- 前往OpenAI平台重新生成密钥
- 确认账户状态正常

### 问题3: "配额不足"

**解决方案**:
- 访问 https://platform.openai.com/account/billing
- 充值OpenAI账户
- 或降级使用 `gpt-3.5-turbo` 模型（更便宜）

### 问题4: "请求超时"

**解决方案**:
- 检查网络连接
- 稍后重试
- 考虑使用VPN（如果在中国大陆）

---

## 💰 费用说明

使用 **gpt-4o-mini** 模型：

- **单次分析成本**: ≈ ¥0.01元（约$0.0015）
- **每天10次**: ≈ ¥0.10元
- **每月300次**: ≈ ¥3元

非常经济实惠！💡

---

## 📞 获取帮助

查看详细文档: `AI优化建议功能说明.md`

