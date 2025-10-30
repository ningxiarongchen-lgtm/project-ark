const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');
const { checkTicketOwnership } = require('../middleware/ownership');
const { ticketValidation, validate } = require('../middleware/validators');
const {
  addTicketAttachment,
  deleteTicketAttachment
} = require('../controllers/fileAssociationController');

// 所有路由都需要认证
router.use(protect);

/**
 * @route   POST /api/tickets
 * @desc    创建服务工单
 * @access  Private
 */
router.post('/', authorize('After-sales Engineer', 'Sales Engineer', 'Technical Engineer', 'Administrator'), ticketValidation, validate, ticketController.createTicket);

/**
 * @route   GET /api/tickets
 * @desc    获取所有服务工单（支持筛选和分页）
 * @access  Private
 * @query   status, priority, ticketType, assignedEngineer, startDate, endDate, page, limit, sortBy
 */
router.get('/', ticketController.getAllTickets);

/**
 * @route   GET /api/tickets/statistics
 * @desc    获取服务工单统计信息
 * @access  Private
 */
router.get('/statistics', ticketController.getTicketStatistics);

/**
 * @route   GET /api/tickets/my-tickets
 * @desc    获取我的工单（当前用户分配的工单）
 * @access  Private
 */
router.get('/my-tickets', ticketController.getMyTickets);

/**
 * @route   GET /api/tickets/:id
 * @desc    获取单个服务工单详情
 * @access  Private
 */
router.get('/:id', ticketController.getTicketById);

/**
 * @route   PUT /api/tickets/:id
 * @desc    更新服务工单
 * @access  Private
 */
router.put('/:id', authorize('After-sales Engineer', 'Technical Engineer', 'Administrator'), checkTicketOwnership, ticketValidation, validate, ticketController.updateTicket);

/**
 * @route   PATCH /api/tickets/:id/status
 * @desc    更新工单状态
 * @access  Private
 */
router.patch('/:id/status', authorize('After-sales Engineer', 'Technical Engineer', 'Administrator'), checkTicketOwnership, ticketController.updateTicketStatus);

/**
 * @route   POST /api/tickets/:id/assign
 * @desc    分配工程师
 * @access  Private
 */
router.post('/:id/assign', authorize('After-sales Engineer', 'Sales Manager', 'Administrator'), ticketController.assignEngineer);

/**
 * @route   POST /api/tickets/:id/follow-up
 * @desc    添加跟进记录
 * @access  Private
 */
router.post('/:id/follow-up', authorize('After-sales Engineer', 'Technical Engineer', 'Administrator'), checkTicketOwnership, ticketController.addFollowUp);

/**
 * @route   POST /api/tickets/:id/feedback
 * @desc    提交客户反馈
 * @access  Private
 */
router.post('/:id/feedback', authorize('After-sales Engineer', 'Sales Engineer', 'Administrator'), checkTicketOwnership, ticketController.submitFeedback);

/**
 * @route   PATCH /api/tickets/:id/accept
 * @desc    接受任务（技术工程师接受待受理的工单）
 * @access  Private - Technical Engineer, Administrator
 */
router.patch('/:id/accept', authorize('Technical Engineer', 'Technical Support', 'Administrator'), ticketController.acceptTicket);

/**
 * @route   PATCH /api/tickets/:id/save-report
 * @desc    保存解决报告（技术工程师编写报告）
 * @access  Private - Technical Engineer, Administrator
 */
router.patch('/:id/save-report', authorize('Technical Engineer', 'Technical Support', 'Administrator'), ticketController.saveReport);

/**
 * @route   PATCH /api/tickets/:id/mark-resolved
 * @desc    标记为已解决（技术工程师完成工作，交给销售确认）
 * @access  Private - Technical Engineer, Administrator
 */
router.patch('/:id/mark-resolved', authorize('Technical Engineer', 'Technical Support', 'Administrator'), ticketController.markAsResolved);

/**
 * @route   PATCH /api/tickets/:id/close
 * @desc    关闭工单（销售经理确认问题已解决）
 * @access  Private - Sales Manager, Administrator
 */
router.patch('/:id/close', authorize('Sales Manager', 'Administrator'), ticketController.closeTicket);

/**
 * @route   PATCH /api/tickets/:id/reopen
 * @desc    重新打开工单（销售经理认为问题未解决）
 * @access  Private - Sales Manager, Administrator
 */
router.patch('/:id/reopen', authorize('Sales Manager', 'Administrator'), ticketController.reopenTicket);

/**
 * @route   DELETE /api/tickets/:id
 * @desc    删除服务工单
 * @access  Private
 */
router.delete('/:id', authorize('Administrator'), ticketController.deleteTicket);

/**
 * @route   POST /api/tickets/:id/add-attachment
 * @desc    添加附件（LeanCloud前端直传后关联）
 * @access  Private
 */
router.post('/:id/add-attachment', checkTicketOwnership, addTicketAttachment);

/**
 * @route   DELETE /api/tickets/:id/attachments/:attachmentId
 * @desc    删除附件
 * @access  Private
 */
router.delete('/:id/attachments/:attachmentId', authorize('After-sales Engineer', 'Technical Engineer', 'Administrator'), checkTicketOwnership, deleteTicketAttachment);

module.exports = router;
