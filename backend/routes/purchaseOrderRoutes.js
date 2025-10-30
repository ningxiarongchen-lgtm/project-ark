const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { protect, authorize } = require('../middleware/auth');
const { checkPurchaseOrderOwnership } = require('../middleware/ownership');
const { purchaseOrderValidation, validate } = require('../middleware/validators');
const {
  addPurchaseOrderFile,
  deletePurchaseOrderFile
} = require('../controllers/fileAssociationController');

/**
 * 采购订单管理路由
 * 所有路由都需要认证，并且只有管理员和采购专员可以访问
 */

// 统计信息（放在最前面，避免被/:id匹配）
router.get(
  '/stats/summary', 
  protect, 
  authorize('Administrator', 'Procurement Specialist'), 
  purchaseOrderController.getPurchaseOrderStats
);

// 获取待管理员审批的订单列表（放在前面，避免被/:id匹配）
router.get(
  '/pending-admin-approval',
  protect,
  authorize('Administrator'),
  purchaseOrderController.getPendingAdminApprovalOrders
);

// 获取指定供应商的采购订单
router.get(
  '/supplier/:supplier_id',
  protect,
  authorize('Administrator', 'Procurement Specialist'),
  purchaseOrderController.getPurchaseOrdersBySupplier
);

// CRUD 路由 - 查询操作允许管理员和采购专员
router.get(
  '/', 
  protect, 
  authorize('Administrator', 'Procurement Specialist'), 
  purchaseOrderController.getPurchaseOrders
);

router.get(
  '/:id', 
  protect, 
  authorize('Administrator', 'Procurement Specialist', 'Commercial Engineer'), 
  purchaseOrderController.getPurchaseOrderById
);

// 创建和修改操作 - 只允许管理员和采购专员
router.post(
  '/', 
  protect, 
  authorize('Administrator', 'Procurement Specialist'),
  purchaseOrderValidation,
  validate, 
  purchaseOrderController.createPurchaseOrder
);

router.put(
  '/:id', 
  protect, 
  authorize('Administrator', 'Procurement Specialist', 'Commercial Engineer'),
  purchaseOrderValidation,
  validate, 
  purchaseOrderController.updatePurchaseOrder
);

// 删除操作 - 只允许管理员
router.delete(
  '/:id', 
  protect, 
  authorize('Administrator'), 
  purchaseOrderController.deletePurchaseOrder
);

// 状态更新 - 只允许管理员和采购专员
router.patch(
  '/:id/status', 
  protect, 
  authorize('Administrator', 'Procurement Specialist'),
  checkPurchaseOrderOwnership, 
  purchaseOrderController.updatePurchaseOrderStatus
);

// 文件管理 - LeanCloud前端直传后关联
router.post(
  '/:id/add-file',
  protect,
  authorize('Administrator', 'Procurement Specialist', 'Commercial Engineer'),
  addPurchaseOrderFile
);

router.delete(
  '/:id/files/:fileId',
  protect,
  authorize('Administrator', 'Procurement Specialist', 'Commercial Engineer'),
  deletePurchaseOrderFile
);

// 付款管理
router.post(
  '/:id/payments',
  protect,
  authorize('Administrator', 'Procurement Specialist', 'Commercial Engineer'),
  purchaseOrderController.addPaymentRecord
);

// 物流管理
router.post(
  '/:id/shipments',
  protect,
  authorize('Administrator', 'Procurement Specialist'),
  purchaseOrderController.addShipment
);

router.patch(
  '/:id/shipments/:shipmentId',
  protect,
  authorize('Administrator', 'Procurement Specialist'),
  purchaseOrderController.updateShipmentStatus
);

// 收货确认
router.post(
  '/:id/receive',
  protect,
  authorize('Administrator', 'Procurement Specialist', 'Warehouse Staff'),
  purchaseOrderController.confirmReceiving
);

// 质检管理
router.patch(
  '/:id/quality-check',
  protect,
  authorize('Administrator', 'Quality Inspector', 'Procurement Specialist'),
  purchaseOrderController.updateQualityCheck
);

// 跟进记录管理
router.post(
  '/:id/follow-ups',
  protect,
  authorize('Administrator', 'Procurement Specialist'),
  purchaseOrderController.addFollowUp
);

// 管理员审批流程
router.post(
  '/:id/admin-approve',
  protect,
  authorize('Administrator'),
  purchaseOrderController.adminApprovePurchaseOrder
);

router.post(
  '/:id/admin-reject',
  protect,
  authorize('Administrator'),
  purchaseOrderController.adminRejectPurchaseOrder
);

module.exports = router;

