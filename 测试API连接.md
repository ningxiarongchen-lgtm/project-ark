# 测试API连接

## 1. 测试后端健康检查

打开浏览器访问：
```
https://project-ark-ely7.onrender.com/api/health
```

**预期结果**：
```json
{
  "status": "ok",
  "timestamp": "2025-11-11T..."
}
```

如果返回404或错误，说明后端服务有问题。

---

## 2. 检查Render部署状态

1. 访问：https://dashboard.render.com/web/srv-d42c4995pdvs73f58kq0
2. 查看状态是否为 **"Live"**
3. 查看日志是否有错误

---

## 3. 测试登录API

使用curl测试：
```bash
curl -X POST https://project-ark-ely7.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**预期结果**：
```json
{
  "success": true,
  "token": "...",
  "user": {...}
}
```

---

## 4. 可能的问题

### 问题1: Render服务未启动
**症状**: 所有API都返回404或超时  
**解决**: 等待部署完成，或手动重启服务

### 问题2: MongoDB连接失败
**症状**: 服务启动但数据库操作失败  
**解决**: 检查MONGODB_URI环境变量

### 问题3: 路由未注册
**症状**: 特定API返回404  
**解决**: 检查server.js中的路由注册

---

## 5. 快速诊断命令

```bash
# 测试健康检查
curl https://project-ark-ely7.onrender.com/api/health

# 测试登录
curl -X POST https://project-ark-ely7.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 测试选型（需要token）
curl -X POST https://project-ark-ely7.onrender.com/api/selection/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"valveTorque":1000,"safetyFactor":1.3,"mechanism":"Scotch Yoke"}'
```

---

## 6. 当前问题分析

从截图看到的404错误，可能原因：

1. **Render服务正在重启**（最可能）
   - 刚推送了新代码
   - Render正在重新部署
   - 需要等待2-5分钟

2. **环境变量未配置**
   - MONGODB_URI
   - JWT_SECRET
   - 等

3. **路由问题**
   - selectionRoutes未正确注册
   - 中间件问题

---

## ✅ 建议操作

1. **等待5分钟**，让Render完成部署
2. **访问健康检查端点**确认服务状态
3. **查看Render日志**了解具体错误
4. **清除浏览器缓存**重新登录

如果5分钟后仍然404，请提供Render的部署日志。
