const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getSalesStats,
  getProductionStats,
  getFinanceStats
} = require('../controllers/erpStatsController');
const { protect, authorize } = require('../middleware/auth');

// 所有路由都需要认证，且仅限管理员/经理
router.use(protect);
router.use(authorize('Sales Manager', 'Production Planner', 'Administrator'));

// ERP统计路由
router.get('/dashboard', getDashboardStats);
router.get('/sales', getSalesStats);
router.get('/production', getProductionStats);
router.get('/finance', getFinanceStats);

module.exports = router;

