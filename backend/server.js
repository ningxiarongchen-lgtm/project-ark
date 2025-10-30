require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const accessoryRoutes = require('./routes/accessoryRoutes');
const projectRoutes = require('./routes/projectRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const adminRoutes = require('./routes/adminRoutes');
// 新的路由
const actuatorRoutes = require('./routes/actuatorRoutes');
const manualOverrideRoutes = require('./routes/manualOverrideRoutes');
const newProjectRoutes = require('./routes/newProjectRoutes');
const selectionRoutes = require('./routes/selectionRoutes');
const aiRoutes = require('./routes/aiRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productionRoutes = require('./routes/productionRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const ecoRoutes = require('./routes/ecoRoutes');
const mesRoutes = require('./routes/mesRoutes');
const qualityRoutes = require('./routes/qualityRoutes');
const financeRoutes = require('./routes/financeRoutes');
const erpStatsRoutes = require('./routes/erpStatsRoutes');
// 数据管理路由
const actuatorManagementRoutes = require('./routes/actuatorManagementRoutes');
const accessoryManagementRoutes = require('./routes/accessoryManagementRoutes');
const supplierManagementRoutes = require('./routes/supplierManagementRoutes');
const userManagementRoutes = require('./routes/userManagementRoutes');
// 合同管理路由
const contractRoutes = require('./routes/contract');
// 产品目录路由（销售经理专用）
const catalogRoutes = require('./routes/catalog.routes');

// 测试环境专用路由（仅在测试环境加载）
let testingRoutes = null;
if (process.env.NODE_ENV === 'test') {
  testingRoutes = require('./routes/testing.routes');
  console.log('⚠️  测试路由已启用 - 仅应在测试环境使用');
}

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Security Middleware - Helmet (设置安全的HTTP头)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // 允许跨域资源嵌入（如图片）
}));

// CORS配置
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// 🔒 Cookie解析中间件（用于读取HttpOnly Cookie中的token）
app.use(cookieParser());

// 🔒 全局 Rate Limiting（防止暴力攻击和 DoS）
// 在开发和测试环境中放宽限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟窗口
  max: process.env.NODE_ENV === 'production' ? 200 : 10000, // 开发/测试环境放宽到10000次
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 跳过成功的健康检查请求
  skip: (req) => req.path === '/api/health'
});

// 应用到所有 /api 路由（生产环境启用，开发环境也启用但限制很宽松）
app.use('/api/', apiLimiter);

// Body解析中间件（限制请求体大小，防止DoS攻击）
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 用于访问本地上传的文件
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/templates', express.static(path.join(__dirname, 'templates')));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/accessories', accessoryRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/admin', adminRoutes);
// 新的API路由
app.use('/api/actuators', actuatorRoutes);
app.use('/api/manual-overrides', manualOverrideRoutes);
app.use('/api/new-projects', newProjectRoutes);
app.use('/api/selection', selectionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/ecos', ecoRoutes);
app.use('/api/mes', mesRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/erp', erpStatsRoutes);
// 数据管理API路由
app.use('/api/data-management/actuators', actuatorManagementRoutes);
app.use('/api/data-management/accessories', accessoryManagementRoutes);
app.use('/api/data-management/suppliers', supplierManagementRoutes);
app.use('/api/data-management/users', userManagementRoutes);
// 合同管理API路由
app.use('/api/contracts', contractRoutes);
// 产品目录API路由（销售经理专用，无价格信息）
app.use('/api/catalog', catalogRoutes);

// 测试环境专用API路由（仅在测试环境可用）
if (testingRoutes) {
  app.use('/api/testing', testingRoutes);
  console.log('✅ 测试清理接口已注册: /api/testing');
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Project Ark Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Project Ark Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      accessories: '/api/accessories',
      projects: '/api/projects',
      quotes: '/api/quotes',
      admin: '/api/admin',
      actuators: '/api/actuators',
      suppliers: '/api/suppliers',
      purchaseOrders: '/api/purchase-orders',
      orders: '/api/orders',
      production: '/api/production',
      tickets: '/api/tickets',
      ecos: '/api/ecos'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Export app for testing
module.exports = app;

// Start server (only skip if running in automated test suite with SKIP_SERVER_START=true)
if (process.env.SKIP_SERVER_START !== 'true') {
  const PORT = process.env.PORT || 5001;
  const http = require('http');
  const { initializeSocket } = require('./services/socketService');

  // Create HTTP server
  const httpServer = http.createServer(app);

  // Initialize Socket.IO
  initializeSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║        Project Ark Platform API                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}                             ║
║   Server running on port ${PORT}                        ║
║   API: http://localhost:${PORT}                        ║
║   WebSocket: ws://localhost:${PORT}                    ║
╚════════════════════════════════════════════════════════╝
    `);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! Shutting down...');
    console.log(err.name, err.message);
    httpServer.close(() => {
      process.exit(1);
    });
  });
}

