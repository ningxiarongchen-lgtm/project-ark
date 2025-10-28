const express = require('express');
const router = express.Router();
const {
  getQualityChecks,
  getQualityCheckById,
  getPendingChecks,
  getMyQualityChecks,
  createQualityCheck,
  startInspection,
  completeInspection,
  addDefect,
  addCorrectiveAction,
  reviewQualityCheck,
  getQualityStats,
  getDefectAnalysis,
  deleteQualityCheck
} = require('../controllers/qualityController');
const { protect, authorize } = require('../middleware/auth');

// 所有路由都需要认证
router.use(protect);

// 统计和分析
router.get('/stats', getQualityStats);
router.get('/defect-analysis', getDefectAnalysis);

// 待检列表
router.get('/checks/pending', getPendingChecks);

// 我的质检任务
router.get('/checks/my-tasks', getMyQualityChecks);

// 基础CRUD
router.route('/checks')
  .get(getQualityChecks)
  .post(authorize('Technical Engineer', 'Production Planner', 'Administrator'), createQualityCheck);

router.route('/checks/:id')
  .get(getQualityCheckById)
  .delete(authorize('Administrator'), deleteQualityCheck);

// 检验操作
router.post('/checks/:id/start', authorize('Technical Engineer', 'Administrator'), startInspection);
router.post('/checks/:id/complete', authorize('Technical Engineer', 'Administrator'), completeInspection);
router.post('/checks/:id/defects', authorize('Technical Engineer', 'Administrator'), addDefect);
router.post('/checks/:id/corrective-actions', authorize('Technical Engineer', 'Administrator'), addCorrectiveAction);

// 审核
router.post('/checks/:id/review', authorize('Administrator'), reviewQualityCheck);

module.exports = router;

