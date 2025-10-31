// /backend/routes/qualityCheckRoutes.js
const express = require('express');
const router = express.Router();
const qualityCheckController = require('../controllers/qualityCheckController');
const { protect, authorize } = require('../middleware/auth');

// 所有质检路由都需要身份验证
router.use(protect);

// 质检任务相关路由
router.get(
  '/',
  authorize('QA Inspector', 'Administrator'),
  qualityCheckController.getAllQualityChecks
);

router.get(
  '/stats',
  authorize('QA Inspector', 'Administrator', 'Production Planner'),
  qualityCheckController.getQualityStats
);

router.get(
  '/:id',
  authorize('QA Inspector', 'Administrator'),
  qualityCheckController.getQualityCheckById
);

router.post(
  '/:id/start',
  authorize('QA Inspector'),
  qualityCheckController.startQualityCheck
);

router.post(
  '/:id/complete',
  authorize('QA Inspector'),
  qualityCheckController.completeQualityCheck
);

// 检验模板相关路由
router.get(
  '/templates',
  authorize('QA Inspector', 'Administrator'),
  qualityCheckController.getAllTemplates
);

router.get(
  '/templates/:checkType/:productSeries',
  authorize('QA Inspector', 'Administrator'),
  qualityCheckController.getTemplateByTypeAndSeries
);

router.get(
  '/template/:id',
  authorize('QA Inspector', 'Administrator'),
  qualityCheckController.getTemplateById
);

router.post(
  '/templates',
  authorize('Administrator'),
  qualityCheckController.createTemplate
);

router.put(
  '/templates/:id',
  authorize('Administrator'),
  qualityCheckController.updateTemplate
);

router.delete(
  '/templates/:id',
  authorize('Administrator'),
  qualityCheckController.deleteTemplate
);

module.exports = router;

