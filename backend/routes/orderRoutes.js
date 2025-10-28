const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { checkOrderOwnership } = require('../middleware/ownership');
const { orderValidation, validate } = require('../middleware/validators');
const {
  addOrderFile,
  deleteOrderFile
} = require('../controllers/fileAssociationController');

// 所有路由都需要认证
router.use(protect);

/**
 * @route   POST /api/orders/from-project/:projectId
 * @desc    从项目创建销售订单
 * @access  Private
 */
router.post('/from-project/:projectId', authorize('Sales Engineer', 'Sales Manager', 'Administrator'), orderController.createOrderFromProject);

/**
 * @route   GET /api/orders
 * @desc    获取所有订单（支持筛选和分页）
 * @access  Private
 * @query   status, paymentStatus, startDate, endDate, page, limit, sortBy
 */
router.get('/', orderController.getAllOrders);

/**
 * @route   GET /api/orders/statistics
 * @desc    获取订单统计信息
 * @access  Private
 */
router.get('/statistics', orderController.getOrderStatistics);

/**
 * @route   GET /api/orders/:id
 * @desc    获取单个订单详情
 * @access  Private
 */
router.get('/:id', orderController.getOrderById);

/**
 * @route   PUT /api/orders/:id
 * @desc    更新订单
 * @access  Private
 */
router.put('/:id', authorize('Sales Engineer', 'Sales Manager', 'Administrator'), checkOrderOwnership, orderController.updateOrder);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    更新订单状态
 * @access  Private
 */
router.patch('/:id/status', authorize('Sales Engineer', 'Sales Manager', 'Procurement Specialist', 'Administrator'), orderController.updateOrderStatus);

/**
 * @route   POST /api/orders/:id/approve
 * @desc    审批订单
 * @access  Private
 */
router.post('/:id/approve', authorize('Sales Manager', 'Administrator'), orderController.approveOrder);

/**
 * @route   POST /api/orders/:id/payment
 * @desc    添加付款记录
 * @access  Private
 */
router.post('/:id/payment', authorize('Sales Manager', 'Procurement Specialist', 'Administrator'), orderController.addPaymentRecord);

/**
 * @route   DELETE /api/orders/:id
 * @desc    删除订单
 * @access  Private
 */
router.delete('/:id', authorize('Administrator'), orderController.deleteOrder);

/**
 * @route   POST /api/orders/:id/add-file
 * @desc    添加文件（LeanCloud前端直传后关联）
 * @access  Private
 */
router.post('/:id/add-file', checkOrderOwnership, addOrderFile);

/**
 * @route   DELETE /api/orders/:id/files/:fileId
 * @desc    删除文件
 * @access  Private
 */
router.delete('/:id/files/:fileId', authorize('Sales Engineer', 'Sales Manager', 'Administrator'), checkOrderOwnership, deleteOrderFile);

module.exports = router;


