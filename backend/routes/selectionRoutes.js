const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  calculateSelection,
  getRecommendation,
  batchSelection
} = require('../controllers/selectionController');

// 所有路由都需要认证
router.use(protect);

// @route   POST /api/selection/calculate
// @desc    选型引擎核心计算逻辑
// @access  Private
router.post('/calculate', calculateSelection);

// @route   POST /api/selection/recommend
// @desc    获取选型建议
// @access  Private
router.post('/recommend', getRecommendation);

// @route   POST /api/selection/batch
// @desc    批量选型
// @access  Private
router.post('/batch', batchSelection);

module.exports = router;


