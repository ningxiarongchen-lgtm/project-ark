const express = require('express');
const router = express.Router();
const {
  getEcos,
  getEcoById,
  createEco,
  updateEco,
  deleteEco,
  submitForApproval,
  approveEco,
  rejectEco,
  closeEco,
  getPendingApprovals,
  getEcoStats,
  getEcosByProduct
} = require('../controllers/ecoController');
const { protect, authorize } = require('../middleware/auth');

// 所有路由都需要认证
router.use(protect);

// 特殊路由
router.get('/pending-approvals', getPendingApprovals);
router.get('/stats', getEcoStats);
router.get('/by-product/:actuatorId', getEcosByProduct);

// 审批操作（需要管理员或经理权限）
router.post('/:id/submit', authorize('Technical Engineer', 'Business Engineer', 'Administrator'), submitForApproval);
router.post('/:id/approve', authorize('Sales Manager', 'Administrator'), approveEco);
router.post('/:id/reject', authorize('Sales Manager', 'Administrator'), rejectEco);
router.post('/:id/close', authorize('Sales Manager', 'Administrator'), closeEco);

// CRUD 操作
router.route('/')
  .get(getEcos)
  .post(authorize('Technical Engineer', 'Business Engineer', 'Administrator'), createEco);

router.route('/:id')
  .get(getEcoById)
  .put(authorize('Technical Engineer', 'Business Engineer', 'Administrator'), updateEco)
  .delete(authorize('Administrator'), deleteEco);

module.exports = router;

