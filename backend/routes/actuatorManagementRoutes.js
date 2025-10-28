/**
 * Actuator数据管理路由
 * 提供完整的CRUD和批量导入功能
 */

const express = require('express');
const router = express.Router();
const actuatorController = require('../controllers/actuatorManagementController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// 所有路由都需要认证
router.use(protect);

// 统计信息（放在参数路由之前）
router.get('/statistics', actuatorController.getStatistics);

// CSV模板下载
router.get('/template', actuatorController.downloadTemplate);

// 批量导入
router.post(
  '/import',
  authorize('Administrator', 'Technical Engineer'),
  upload.single('file'),
  actuatorController.bulkImport
);

// 批量删除
router.post(
  '/bulk-delete',
  authorize('Administrator'),
  actuatorController.bulkDelete
);

// 按扭矩需求查询
router.get('/by-torque', actuatorController.getByTorqueRequirement);

// 按系列查询
router.get('/series/:series', actuatorController.getBySeries);

// 标准CRUD路由
router.route('/')
  .get(actuatorController.getAll)
  .post(authorize('Administrator', 'Technical Engineer'), actuatorController.create);

router.route('/:id')
  .get(actuatorController.getById)
  .put(authorize('Administrator', 'Technical Engineer'), actuatorController.update)
  .delete(authorize('Administrator'), actuatorController.delete);

module.exports = router;

