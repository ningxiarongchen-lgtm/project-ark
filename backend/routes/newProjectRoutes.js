const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addSelection,
  updateSelection,
  removeSelection,
  autoSelect,
  getProjectStats,
  submitTechnicalList,
  rejectTechnicalList,
  respondToModification,
  confirmTechnicalVersion,
  getTechnicalVersions,
  getModificationRequests,
  generateQuotationBom,
  getQuotationBom,
  updateQuotationBomItem,
  addQuotationBomItem,
  deleteQuotationBomItem
} = require('../controllers/newProjectController');
const { protect, authorize } = require('../middleware/auth');
const { checkProjectOwnership } = require('../middleware/ownership');
const {
  addProjectFile,
  deleteProjectFile
} = require('../controllers/fileAssociationController');

// 所有路由都需要认证
router.use(protect);

// 统计信息
router.get('/stats/summary', getProjectStats);

// CRUD 操作
router.route('/')
  .get(getProjects)
  .post(authorize('Technical Engineer', 'Sales Engineer', 'Sales Manager', 'Administrator'), createProject);

router.route('/:id')
  .get(getProjectById)
  .put(authorize('Technical Engineer', 'Sales Engineer', 'Sales Manager', 'Administrator'), checkProjectOwnership, updateProject)
  .delete(authorize('Administrator'), deleteProject);

// 选型配置管理
router.post('/:id/selections', authorize('Technical Engineer', 'Sales Engineer', 'Sales Manager', 'Administrator'), checkProjectOwnership, addSelection);
router.put('/:id/selections/:selectionId', authorize('Technical Engineer', 'Sales Engineer', 'Sales Manager', 'Administrator'), checkProjectOwnership, updateSelection);
router.delete('/:id/selections/:selectionId', authorize('Sales Manager', 'Administrator'), checkProjectOwnership, removeSelection);

// 自动选型
router.post('/:id/auto-select', authorize('Technical Engineer', 'Sales Engineer', 'Sales Manager', 'Administrator'), checkProjectOwnership, autoSelect);

// 文件管理 - LeanCloud前端直传后关联
router.post('/:id/add-file', checkProjectOwnership, addProjectFile);
router.delete('/:id/files/:fileId', authorize('Technical Engineer', 'Sales Engineer', 'Sales Manager', 'Administrator'), checkProjectOwnership, deleteProjectFile);

// 🔒 技术清单版本管理
router.post('/:id/submit-technical-list', authorize('Technical Engineer', 'Administrator'), checkProjectOwnership, submitTechnicalList);
router.post('/:id/reject-technical-list', authorize('Sales Engineer', 'Administrator'), checkProjectOwnership, rejectTechnicalList);
router.post('/:id/respond-modification', authorize('Technical Engineer', 'Administrator'), checkProjectOwnership, respondToModification);
router.post('/:id/confirm-technical-version', authorize('Sales Engineer', 'Administrator'), checkProjectOwnership, confirmTechnicalVersion);
router.get('/:id/technical-versions', getTechnicalVersions);
router.get('/:id/modification-requests', getModificationRequests);

// 🔒 报价BOM版本管理
router.post('/:id/generate-quotation-bom', authorize('Sales Engineer', 'Sales Manager', 'Administrator'), checkProjectOwnership, generateQuotationBom);
router.get('/:id/quotation-bom', getQuotationBom);
router.post('/:id/quotation-bom', authorize('Sales Engineer', 'Sales Manager', 'Administrator'), checkProjectOwnership, addQuotationBomItem);
router.put('/:id/quotation-bom/:itemId', authorize('Sales Engineer', 'Sales Manager', 'Administrator'), checkProjectOwnership, updateQuotationBomItem);
router.delete('/:id/quotation-bom/:itemId', authorize('Sales Engineer', 'Sales Manager', 'Administrator'), checkProjectOwnership, deleteQuotationBomItem);

module.exports = router;


