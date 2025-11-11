# 开发指南

## 项目结构

```
project-ark/
├── backend/                 # 后端代码
│   ├── controllers/        # 控制器
│   ├── models/            # 数据模型
│   ├── routes/            # 路由
│   ├── middleware/        # 中间件
│   ├── utils/             # 工具函数
│   └── server.js          # 入口文件
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── services/      # API 服务
│   │   ├── store/         # 状态管理
│   │   └── App.jsx        # 根组件
│   └── public/            # 静态资源
└── README.md              # 项目说明
```

## 本地开发

### 环境要求
- Node.js >= 16
- MongoDB >= 5.0
- npm 或 yarn

### 启动步骤

1. **克隆项目**
```bash
git clone https://github.com/ningxiarongchen-lgtm/project-ark.git
cd project-ark
```

2. **安装依赖**
```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

3. **配置环境变量**

后端 `backend/.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cmax
JWT_SECRET=dev_secret_key
CORS_ORIGIN=http://localhost:5173
```

前端 `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

4. **启动服务**
```bash
# 后端 (在 backend 目录)
npm run dev

# 前端 (在 frontend 目录)
npm run dev
```

## 代码规范

### 提交规范

使用语义化提交信息：

```bash
# 新功能
git commit -m "feat: 添加用户批量导出功能"

# Bug 修复
git commit -m "fix: 修复登录页面跳转问题"

# 文档更新
git commit -m "docs: 更新 README"

# 样式调整
git commit -m "style: 优化产品目录布局"

# 重构
git commit -m "refactor: 重构选型逻辑"

# 性能优化
git commit -m "perf: 优化数据库查询"

# 测试
git commit -m "test: 添加单元测试"
```

### 代码风格

- 使用 ESLint 进行代码检查
- 遵循 Airbnb JavaScript Style Guide
- 使用 2 空格缩进
- 使用单引号
- 函数式组件 + Hooks

### 命名规范

**文件命名**:
- 组件: `PascalCase.jsx` (如 `UserManagement.jsx`)
- 工具函数: `camelCase.js` (如 `formatDate.js`)
- 常量: `UPPER_SNAKE_CASE.js` (如 `API_ENDPOINTS.js`)

**变量命名**:
- 变量/函数: `camelCase` (如 `userName`, `fetchData`)
- 常量: `UPPER_SNAKE_CASE` (如 `API_URL`, `MAX_SIZE`)
- 组件: `PascalCase` (如 `UserForm`, `DataTable`)
- 私有变量: `_camelCase` (如 `_internalState`)

## API 开发

### 创建新 API

1. **定义模型** (`backend/models/`)
```javascript
const mongoose = require('mongoose');

const exampleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Example', exampleSchema);
```

2. **创建控制器** (`backend/controllers/`)
```javascript
const Example = require('../models/Example');

exports.getAll = async (req, res) => {
  try {
    const examples = await Example.find();
    res.json({ success: true, data: examples });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

3. **定义路由** (`backend/routes/`)
```javascript
const express = require('express');
const router = express.Router();
const exampleController = require('../controllers/exampleController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', exampleController.getAll);

module.exports = router;
```

4. **注册路由** (`backend/server.js`)
```javascript
app.use('/api/examples', require('./routes/exampleRoutes'));
```

## 前端开发

### 创建新页面

1. **创建页面组件** (`frontend/src/pages/`)
```jsx
import { useState, useEffect } from 'react';
import { Card, Table } from 'antd';
import api from '../services/api';

const ExamplePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/examples');
      setData(response.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="示例页面">
      <Table dataSource={data} loading={loading} />
    </Card>
  );
};

export default ExamplePage;
```

2. **添加路由** (`frontend/src/App.jsx`)
```jsx
import ExamplePage from './pages/ExamplePage';

<Route path="/examples" element={<ExamplePage />} />
```

### API 调用

使用统一的 API 服务 (`frontend/src/services/api.js`):

```javascript
import api from '../services/api';

// GET 请求
const response = await api.get('/examples');

// POST 请求
const response = await api.post('/examples', { name: 'Test' });

// PUT 请求
const response = await api.put('/examples/123', { name: 'Updated' });

// DELETE 请求
const response = await api.delete('/examples/123');
```

## 数据库操作

### 查询

```javascript
// 查找所有
const users = await User.find();

// 条件查询
const activeUsers = await User.find({ isActive: true });

// 查找一个
const user = await User.findById(id);

// 查找并排序
const users = await User.find().sort({ createdAt: -1 });

// 分页
const users = await User.find()
  .skip((page - 1) * limit)
  .limit(limit);
```

### 创建

```javascript
const user = new User({
  phone: '13800000000',
  full_name: '张三',
  role: 'Sales Manager'
});
await user.save();
```

### 更新

```javascript
// 更新一个
await User.findByIdAndUpdate(id, { full_name: '李四' });

// 更新多个
await User.updateMany({ role: 'Sales Manager' }, { department: '销售部' });
```

### 删除

```javascript
// 删除一个
await User.findByIdAndDelete(id);

// 删除多个
await User.deleteMany({ isActive: false });
```

## 测试

### 运行测试

```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test

# E2E 测试
cd frontend
npm run cypress:run
```

### 编写测试

```javascript
// 单元测试示例
describe('User Controller', () => {
  it('should get all users', async () => {
    const response = await request(app).get('/api/users');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## 调试

### 后端调试

1. 使用 `console.log()` 输出日志
2. 使用 VS Code 调试器
3. 查看 MongoDB 数据

### 前端调试

1. 使用 Chrome DevTools
2. React DevTools
3. Network 面板查看 API 请求

## 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 修复代码风格
npm run lint:fix

# 运行测试
npm test

# 查看端口占用
lsof -i :5000

# 清除 node_modules
rm -rf node_modules package-lock.json && npm install
```

## Git 工作流

1. **创建功能分支**
```bash
git checkout -b feature/user-export
```

2. **开发并提交**
```bash
git add .
git commit -m "feat: 添加用户导出功能"
```

3. **推送到远程**
```bash
git push origin feature/user-export
```

4. **合并到主分支**
```bash
git checkout main
git merge feature/user-export
git push origin main
```

## 故障排查

### 常见问题

1. **端口被占用**
```bash
# 查找占用端口的进程
lsof -i :5000
# 杀死进程
kill -9 <PID>
```

2. **MongoDB 连接失败**
- 检查 MongoDB 是否启动
- 确认连接字符串正确
- 检查网络访问权限

3. **依赖安装失败**
```bash
# 清除缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

4. **前端无法访问后端**
- 检查 CORS 配置
- 确认 API_URL 配置正确
- 检查后端是否启动

## 性能优化

### 后端优化
- 使用数据库索引
- 实现缓存机制
- 优化查询语句
- 使用分页

### 前端优化
- 代码分割
- 懒加载组件
- 图片优化
- 使用 memo 避免重复渲染

## 安全建议

- 不要在代码中硬编码密钥
- 使用环境变量存储敏感信息
- 实现请求限流
- 验证用户输入
- 使用 HTTPS
- 定期更新依赖

## 资源链接

- [React 文档](https://react.dev/)
- [Ant Design](https://ant.design/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/docs/)
- [Mongoose](https://mongoosejs.com/)
