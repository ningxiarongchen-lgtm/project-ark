# C-MAX SF系列气动执行器选型系统 - 前端

## 🚀 快速开始

### 前提条件
- Node.js >= 18.0.0
- npm >= 9.0.0
- 后端API运行在 http://localhost:5001

### 安装
```bash
cd frontend
npm install
```

### 开发
```bash
npm run dev
```
访问: http://localhost:5173

### 构建
```bash
npm run build
```

### 预览
```bash
npm run preview
```

---

## 📁 项目结构

```
src/
├── components/         # 可复用组件
│   └── Layout/        # 布局组件
├── pages/             # 页面组件
├── services/          # API服务
├── store/             # 状态管理
├── utils/             # 工具函数
└── App.jsx            # 路由配置
```

---

## 🔐 默认登录

**管理员账号**:
- 邮箱: `admin@cmax.com`
- 密码: `admin123`

---

## 🛠 技术栈

- **React 18**: UI框架
- **Vite 5**: 构建工具
- **Ant Design 5**: UI组件库
- **React Router 6**: 路由管理
- **Zustand 4**: 状态管理
- **Axios**: HTTP客户端

---

## 📚 文档

详细文档请查看: [前端开发文档.md](./前端开发文档.md)

---

## 🎯 核心功能

### 已完成 ✅
- ✅ 用户认证与授权
- ✅ 基于角色的访问控制
- ✅ 响应式布局（可折叠侧边栏）
- ✅ 路由保护
- ✅ API服务封装（27个端点）
- ✅ 中文界面

### 待开发 ⏳
- ⏳ 登录页面UI
- ⏳ 控制台页面
- ⏳ 智能选型页面
- ⏳ 项目管理页面
- ⏳ 报价管理页面
- ⏳ 产品管理页面
- ⏳ 系统管理页面

---

## 📡 API集成

所有API已集成并测试通过：

### 认证
- POST `/api/auth/login`

### 智能选型引擎
- POST `/api/selection/calculate`
- POST `/api/selection/recommend`
- POST `/api/selection/batch`

### 执行器管理
- GET `/api/actuators`
- POST `/api/actuators`
- PUT `/api/actuators/:id`
- DELETE `/api/actuators/:id`
- POST `/api/actuators/upload`
- GET `/api/actuators/template`

### 手动操作装置
- GET `/api/manual-overrides`
- POST `/api/manual-overrides`
- POST `/api/manual-overrides/upload`
- GET `/api/manual-overrides/template`

### 项目管理
- GET `/api/new-projects`
- POST `/api/new-projects`
- POST `/api/new-projects/:id/auto-select`

[完整API文档](../完整API文档.md)

---

## 🎨 组件示例

### 使用API
```jsx
import { actuatorsAPI } from './services/api'
import { message } from 'antd'

const fetchData = async () => {
  try {
    const response = await actuatorsAPI.getAll()
    console.log(response.data)
    message.success('加载成功')
  } catch (error) {
    message.error('加载失败')
  }
}
```

### 使用认证状态
```jsx
import { useAuthStore } from './store/authStore'

const MyComponent = () => {
  const { user, isAdmin, logout } = useAuthStore()
  
  return (
    <div>
      <p>用户: {user.username}</p>
      {isAdmin() && <button>管理员功能</button>}
      <button onClick={logout}>退出</button>
    </div>
  )
}
```

### 使用路由保护
```jsx
import { ProtectedRoute } from './App'

<Route path="/admin" element={
  <ProtectedRoute requiredRole="Administrator">
    <AdminPanel />
  </ProtectedRoute>
} />
```

---

## 🐛 故障排除

### 端口被占用
```bash
# 修改 vite.config.js 中的端口
server: {
  port: 5174
}
```

### API连接失败
1. 确认后端服务运行: `http://localhost:5001`
2. 检查 `.env` 文件中的 `VITE_API_URL`

### 依赖安装失败
```bash
# 清除缓存并重新安装
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 开发规范

### 代码风格
- 使用函数式组件
- 使用 Hooks 管理状态
- 遵循 ESLint 规则

### 提交规范
- `feat:` 新功能
- `fix:` Bug修复
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 代码重构

---

## 📞 联系方式

如有问题，请查看 [前端开发文档.md](./前端开发文档.md) 或联系开发团队。

---

**版本**: 2.0.0  
**状态**: ✅ 基础架构完成，页面组件开发中  
**最后更新**: 2025-10-27

