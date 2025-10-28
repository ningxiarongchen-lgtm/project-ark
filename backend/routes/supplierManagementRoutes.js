/**
 * Supplier数据管理路由
 * 提供完整的CRUD和批量导入功能
 */

const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierManagementController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// 所有路由都需要认证
router.use(protect);

// 统计信息（放在参数路由之前）
router.get('/statistics', supplierController.getStatistics);

// CSV模板下载
router.get('/template', supplierController.downloadTemplate);

// 批量导入
router.post(
  '/import',
  authorize('Administrator', 'Procurement Specialist'),
  upload.single('file'),
  supplierController.bulkImport
);

// 批量删除
router.post(
  '/bulk-delete',
  authorize('Administrator'),
  supplierController.bulkDelete
);

// 获取优质供应商
router.get('/top', supplierController.getTopSuppliers);

// 按状态查询
router.get('/status/:status', supplierController.getByStatus);

// 标准CRUD路由
router.route('/')
  .get(supplierController.getAll)
  .post(authorize('Administrator', 'Procurement Specialist'), supplierController.create);

router.route('/:id')
  .get(supplierController.getById)
  .put(authorize('Administrator', 'Procurement Specialist'), supplierController.update)
  .delete(authorize('Administrator'), supplierController.delete);

module.exports = router;

