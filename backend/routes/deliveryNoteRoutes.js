const express = require('express');
const router = express.Router();
const deliveryNoteController = require('../controllers/deliveryNoteController');
const { protect, authorize } = require('../middleware/auth');

// 所有路由都需要认证
router.use(protect);

// 创建发货通知单（生产计划员/车间主管/管理员）
router.post(
  '/',
  authorize('Production Planner', 'Workshop Supervisor', 'Admin'),
  deliveryNoteController.createDeliveryNote
);

// 获取发货单列表（支持筛选）
router.get(
  '/',
  deliveryNoteController.getDeliveryNotes
);

// 获取我的发货任务（物流专员专用）
router.get(
  '/my-tasks',
  authorize('Logistics Specialist', 'Admin'),
  deliveryNoteController.getMyTasks
);

// 获取待处理的发货单（生产计划员/管理员）
router.get(
  '/pending',
  authorize('Production Planner', 'Workshop Supervisor', 'Admin'),
  deliveryNoteController.getPendingDeliveries
);

// 获取单个发货单详情
router.get(
  '/:id',
  deliveryNoteController.getDeliveryNoteById
);

// 更新发货单信息
router.put(
  '/:id',
  authorize('Production Planner', 'Workshop Supervisor', 'Logistics Specialist', 'Admin'),
  deliveryNoteController.updateDeliveryNote
);

// 确认发货（核心功能）
router.post(
  '/:id/confirm-shipment',
  authorize('Logistics Specialist', 'Production Planner', 'Admin'),
  deliveryNoteController.confirmShipment
);

// 取消发货单
router.post(
  '/:id/cancel',
  authorize('Production Planner', 'Workshop Supervisor', 'Admin'),
  deliveryNoteController.cancelDeliveryNote
);

module.exports = router;

