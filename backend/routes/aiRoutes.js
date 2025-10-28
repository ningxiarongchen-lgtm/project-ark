const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

/**
 * AI优化建议路由
 * 所有路由都需要认证
 */

// 所有路由都需要认证
router.use(auth.protect);

// 获取BOM优化建议
router.post('/optimize-bom', auth.authorize('Technical Engineer', 'Sales Engineer', 'Sales Manager', 'Administrator'), aiController.optimizeBOM);

// 获取AI服务状态
router.get('/status', aiController.getStatus);

module.exports = router;

