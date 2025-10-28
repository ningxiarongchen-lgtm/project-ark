/**
 * Accessory数据管理路由
 * 提供完整的CRUD和批量导入功能
 */

const express = require('express');
const router = express.Router();
const accessoryController = require('../controllers/accessoryManagementController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// 所有路由都需要认证
router.use(protect);

// 统计信息（放在参数路由之前）
router.get('/statistics', accessoryController.getStatistics);

// CSV模板下载
router.get('/template', accessoryController.downloadTemplate);

// 批量导入
router.post(
  '/import',
  authorize('Administrator', 'Technical Engineer'),
  upload.single('file'),
  accessoryController.bulkImport
);

// 批量删除
router.post(
  '/bulk-delete',
  authorize('Administrator'),
  accessoryController.bulkDelete
);

// 按类别查询
router.get('/category/:category', accessoryController.getByCategory);

// 检查低库存
router.get('/low-stock', accessoryController.checkLowStock);

// 标准CRUD路由
router.route('/')
  .get(accessoryController.getAll)
  .post(authorize('Administrator', 'Technical Engineer'), accessoryController.create);

router.route('/:id')
  .get(accessoryController.getById)
  .put(authorize('Administrator', 'Technical Engineer'), accessoryController.update)
  .delete(authorize('Administrator'), accessoryController.delete);

module.exports = router;

