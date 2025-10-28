const express = require('express');
const router = express.Router();
const {
  getManualOverrides,
  getManualOverrideById,
  createManualOverride,
  updateManualOverride,
  deleteManualOverride,
  findCompatible,
  findCompatibleForMultiple,
  bulkImport,
  uploadExcel,
  downloadTemplate
} = require('../controllers/manualOverrideController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// 所有路由都需要认证
router.use(protect);

// 查找兼容装置
router.get('/compatible/:bodySize', findCompatible);
router.post('/compatible-multiple', findCompatibleForMultiple);

// 批量导入（仅管理员）
router.post('/bulk-import', authorize('Administrator'), bulkImport);

// Excel上传（仅管理员）
router.post('/upload', authorize('Administrator'), upload.single('file'), uploadExcel);

// 下载Excel模板（仅管理员）
router.get('/template', authorize('Administrator'), downloadTemplate);

// CRUD 操作
router.route('/')
  .get(getManualOverrides)
  .post(authorize('Administrator'), createManualOverride);

router.route('/:id')
  .get(getManualOverrideById)
  .put(authorize('Administrator'), updateManualOverride)
  .delete(authorize('Administrator'), deleteManualOverride);

module.exports = router;

