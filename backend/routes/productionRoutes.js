const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const { protect, authorize } = require('../middleware/auth');
const { checkProductionOrderOwnership } = require('../middleware/ownership');

// 所有路由都需要认证
router.use(protect);

/**
 * @route   POST /api/production/from-order/:salesOrderId
 * @desc    从销售订单创建生产订单
 * @access  Private
 */
router.post('/from-order/:salesOrderId', authorize('Production Planner', 'Sales Manager', 'Administrator'), productionController.createProductionOrderFromSalesOrder);

/**
 * @route   GET /api/production
 * @desc    获取所有生产订单（支持筛选和分页）
 * @access  Private
 * @query   status, priority, startDate, endDate, page, limit, sortBy
 */
router.get('/', productionController.getAllProductionOrders);

/**
 * @route   GET /api/production/statistics
 * @desc    获取生产统计信息
 * @access  Private
 */
router.get('/statistics', productionController.getProductionStatistics);

/**
 * @route   GET /api/production/:id
 * @desc    获取单个生产订单详情
 * @access  Private
 */
router.get('/:id', productionController.getProductionOrderById);

/**
 * @route   PUT /api/production/:id
 * @desc    更新生产订单
 * @access  Private
 */
router.put('/:id', authorize('Production Planner', 'Administrator'), checkProductionOrderOwnership, productionController.updateProductionOrder);

/**
 * @route   PATCH /api/production/:id/status
 * @desc    更新生产订单状态
 * @access  Private
 */
router.patch('/:id/status', authorize('Production Planner', 'Administrator'), productionController.updateProductionOrderStatus);

/**
 * @route   PATCH /api/production/:id/progress
 * @desc    更新生产进度
 * @access  Private
 */
router.patch('/:id/progress', authorize('Production Planner', 'Technical Engineer', 'Administrator'), productionController.updateProductionProgress);

/**
 * @route   POST /api/production/:id/assign-resources
 * @desc    分配生产资源
 * @access  Private
 */
router.post('/:id/assign-resources', authorize('Production Planner', 'Administrator'), checkProductionOrderOwnership, productionController.assignResources);

/**
 * @route   DELETE /api/production/:id
 * @desc    删除生产订单
 * @access  Private
 */
router.delete('/:id', authorize('Administrator'), productionController.deleteProductionOrder);

module.exports = router;


