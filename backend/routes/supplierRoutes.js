const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/auth');
const { supplierValidation, validate } = require('../middleware/validators');

/**
 * 供应商管理路由
 * 所有路由都需要认证，并且只有管理员和采购专员可以访问
 */

// 统计信息（放在最前面，避免被/:id匹配）
router.get('/stats/summary', protect, authorize('Administrator', 'Procurement Specialist'), supplierController.getSupplierStats);

// CRUD 路由 - 查询操作允许管理员和采购专员
router.get('/', protect, authorize('Administrator', 'Procurement Specialist'), supplierController.getSuppliers);
router.get('/:id', protect, authorize('Administrator', 'Procurement Specialist'), supplierController.getSupplierById);

// 创建和修改操作 - 只允许管理员和采购专员
router.post('/', protect, authorize('Administrator', 'Procurement Specialist'), supplierValidation, validate, supplierController.createSupplier);
router.put('/:id', protect, authorize('Administrator', 'Procurement Specialist'), supplierValidation, validate, supplierController.updateSupplier);

// 删除操作 - 只允许管理员
router.delete('/:id', protect, authorize('Administrator'), supplierController.deleteSupplier);

// 状态和评级更新 - 只允许管理员和采购专员
router.patch('/:id/status', protect, authorize('Administrator', 'Procurement Specialist'), supplierController.updateSupplierStatus);
router.patch('/:id/rating', protect, authorize('Administrator', 'Procurement Specialist'), supplierController.updateSupplierRating);

module.exports = router;

