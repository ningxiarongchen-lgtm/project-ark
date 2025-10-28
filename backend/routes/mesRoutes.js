const express = require('express');
const router = express.Router();
const {
  // 工作中心
  getWorkCenters,
  getWorkCenterById,
  createWorkCenter,
  updateWorkCenter,
  deleteWorkCenter,
  getWorkCenterStats,
  
  // 工艺路线
  getRoutings,
  getRoutingById,
  createRouting,
  updateRouting,
  releaseRouting,
  getRoutingsByProduct,
  
  // 工单
  getWorkOrders,
  getWorkOrderById,
  generateWorkOrders,
  startWorkOrder,
  reportWorkOrderProgress,
  completeWorkOrder,
  pauseWorkOrder,
  resumeWorkOrder,
  reportIssue,
  getMyWorkOrders,
  getWorkOrderStats,
  
  // 报表和调度
  getCapacityReport,
  reschedule
} = require('../controllers/mesController');
const { protect, authorize } = require('../middleware/auth');

// 所有路由都需要认证
router.use(protect);

// ==================== 工作中心路由 ====================
router.get('/work-centers/stats/summary', getWorkCenterStats);
router.route('/work-centers')
  .get(getWorkCenters)
  .post(authorize('Administrator', 'Production Planner'), createWorkCenter);

router.route('/work-centers/:id')
  .get(getWorkCenterById)
  .put(authorize('Administrator', 'Production Planner'), updateWorkCenter)
  .delete(authorize('Administrator'), deleteWorkCenter);

// ==================== 工艺路线路由 ====================
router.get('/routings/by-product/:productId', getRoutingsByProduct);
router.post('/routings/:id/release', authorize('Administrator', 'Production Planner'), releaseRouting);

router.route('/routings')
  .get(getRoutings)
  .post(authorize('Technical Engineer', 'Production Planner', 'Administrator'), createRouting);

router.route('/routings/:id')
  .get(getRoutingById)
  .put(authorize('Technical Engineer', 'Production Planner', 'Administrator'), updateRouting);

// ==================== 工单路由 ====================
router.get('/work-orders/my-work-orders', getMyWorkOrders);
router.get('/work-orders/stats/summary', getWorkOrderStats);
router.post('/work-orders/generate/:productionOrderId', authorize('Production Planner', 'Administrator'), generateWorkOrders);
router.post('/work-orders/reschedule', authorize('Administrator', 'Production Planner'), reschedule);

router.post('/work-orders/:id/start', authorize('Technical Engineer', 'Production Planner', 'Administrator'), startWorkOrder);
router.post('/work-orders/:id/progress', authorize('Technical Engineer', 'Production Planner', 'Administrator'), reportWorkOrderProgress);
router.post('/work-orders/:id/complete', authorize('Technical Engineer', 'Production Planner', 'Administrator'), completeWorkOrder);
router.post('/work-orders/:id/pause', authorize('Production Planner', 'Administrator'), pauseWorkOrder);
router.post('/work-orders/:id/resume', authorize('Production Planner', 'Administrator'), resumeWorkOrder);
router.post('/work-orders/:id/issue', authorize('Technical Engineer', 'Production Planner', 'Administrator'), reportIssue);

router.route('/work-orders')
  .get(getWorkOrders);

router.route('/work-orders/:id')
  .get(getWorkOrderById);

// ==================== 报表路由 ====================
router.get('/reports/capacity', getCapacityReport);

module.exports = router;

