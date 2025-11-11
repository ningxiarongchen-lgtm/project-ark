# 部署指南

## 快速部署

### 前端 (Cloudflare Pages)

1. 访问 https://dash.cloudflare.com/
2. **Pages** > **Create a project** > 连接 GitHub
3. 选择仓库: `ningxiarongchen-lgtm/project-ark`
4. 配置构建:
   ```
   Build command: cd frontend && npm install && npm run build
   Build output directory: frontend/dist
   ```
5. 环境变量:
   ```
   VITE_API_URL=https://project-ark-efy7.onrender.com/api
   ```

### 后端 (Render)

1. 访问 https://dashboard.render.com/
2. **New** > **Web Service** > 连接 GitHub
3. 选择仓库: `ningxiarongchen-lgtm/project-ark`
4. 配置:
   ```
   Name: project-ark
   Build Command: cd backend && npm install
   Start Command: cd backend && npm start
   ```
5. 环境变量:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cmax
   JWT_SECRET=your_secret_key
   CORS_ORIGIN=https://your-frontend-domain.pages.dev
   ```

### 数据库 (MongoDB Atlas)

1. 访问 https://www.mongodb.com/cloud/atlas
2. 创建免费集群
3. **Network Access** > 添加 `0.0.0.0/0`
4. **Database Access** > 创建用户
5. 获取连接字符串

## 自动部署

代码推送到 `main` 分支后，Cloudflare Pages 和 Render 会自动部署。

## 健康检查

- 后端: `https://your-backend.onrender.com/api/health`
- 前端: 访问首页检查

## 故障排查

### 后端无法访问
- 检查 Render 服务状态
- 查看日志: Render Dashboard > Logs
- 确认环境变量配置正确

### 前端无法访问
- 检查 Cloudflare Pages 部署状态
- 确认 `VITE_API_URL` 配置正确
- 清除浏览器缓存

### 数据库连接失败
- 检查 MongoDB Atlas 网络访问配置
- 确认连接字符串正确
- 检查数据库用户权限

## 环境变量说明

### 后端必需变量
- `MONGODB_URI`: MongoDB 连接字符串
- `JWT_SECRET`: JWT 加密密钥
- `CORS_ORIGIN`: 前端域名（用于 CORS）
- `NODE_ENV`: 环境标识 (production/development)
- `PORT`: 端口号 (Render 自动设置为 10000)

### 前端必需变量
- `VITE_API_URL`: 后端 API 地址

## 生产环境 URL

- **前端**: https://5ba12c42.smart-system.pages.dev
- **后端**: https://project-ark-efy7.onrender.com
- **API**: https://project-ark-efy7.onrender.com/api

## 注意事项

1. Render 免费版服务会在15分钟无活动后休眠
2. 首次访问可能需要等待30秒唤醒
3. MongoDB Atlas 免费版有512MB存储限制
4. Cloudflare Pages 每月100,000次请求限制
