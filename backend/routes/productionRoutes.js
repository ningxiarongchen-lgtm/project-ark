const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const bomController = require('../controllers/bomController');
const { protect, authorize } = require('../middleware/auth');
const { checkProductionOrderOwnership } = require('../middleware/ownership');

// 所有路由都需要认证
router.use(protect);

/**
 * @route   POST /api/production/from-project/:projectId
 * @desc    从项目创建销售订单和生产订单（确认收款后）
 * @access  Private (Sales Engineer only)
 */
router.post('/from-project/:projectId', authorize('Sales Engineer', 'Administrator'), productionController.createProductionOrderFromProject);

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

/**
 * @route   POST /api/production/:id/explode-bom
 * @desc    展开生产订单的BOM
 * @access  Private (Production Planner)
 */
router.post('/:id/explode-bom', authorize('Production Planner', 'Administrator'), bomController.explodeBOM);

/**
 * @route   POST /api/production/:id/generate-procurement
 * @desc    生成采购需求
 * @access  Private (Production Planner)
 */
router.post('/:id/generate-procurement', authorize('Production Planner', 'Administrator'), bomController.generateProcurementRequest);

/**
 * @route   POST /api/production/:id/mark-awaiting-qc
 * @desc    生产完成，标记为待质检
 * @access  Private (Production Planner)
 */
router.post('/:id/mark-awaiting-qc', authorize('Production Planner', 'Administrator'), productionController.markAsAwaitingQC);

module.exports = router;


