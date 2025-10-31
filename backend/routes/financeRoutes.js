const express = require('express');
const router = express.Router();
const {
  // 发票
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  issueInvoice,
  voidInvoice,
  redInvoice,
  getInvoiceStats,
  
  // 回款
  getPayments,
  getPaymentById,
  createPayment,
  confirmPayment,
  voidPayment,
  getPaymentStats,
  getPendingPayments,
  deletePayment
} = require('../controllers/financeController');
const { protect, authorize } = require('../middleware/auth');

// 所有路由都需要认证
router.use(protect);

// ==================== 发票路由 ====================
router.get('/invoices/stats/summary', authorize('Sales Manager', 'Administrator'), getInvoiceStats);
router.post('/invoices/:id/issue', authorize('Sales Manager', 'Administrator'), issueInvoice);
router.post('/invoices/:id/void', authorize('Sales Manager', 'Administrator'), voidInvoice);
router.post('/invoices/:id/red-invoice', authorize('Sales Manager', 'Administrator'), redInvoice);

router.route('/invoices')
  .get(authorize('Business Engineer', 'Sales Manager', 'Administrator'), getInvoices)
  .post(authorize('Sales Manager', 'Administrator'), createInvoice);

router.route('/invoices/:id')
  .get(authorize('Business Engineer', 'Sales Manager', 'Administrator'), getInvoiceById)
  .put(authorize('Sales Manager', 'Administrator'), updateInvoice);

// ==================== 回款路由 ====================
router.get('/payments/stats/summary', authorize('Sales Manager', 'Administrator'), getPaymentStats);
router.get('/payments/pending', authorize('Business Engineer', 'Sales Manager', 'Administrator'), getPendingPayments);
router.post('/payments/:id/confirm', authorize('Sales Manager', 'Administrator'), confirmPayment);
router.post('/payments/:id/void', authorize('Sales Manager', 'Administrator'), voidPayment);

router.route('/payments')
  .get(authorize('Business Engineer', 'Sales Manager', 'Administrator'), getPayments)
  .post(authorize('Sales Manager', 'Administrator'), createPayment);

router.route('/payments/:id')
  .get(authorize('Business Engineer', 'Sales Manager', 'Administrator'), getPaymentById)
  .delete(authorize('Administrator'), deletePayment);

module.exports = router;

