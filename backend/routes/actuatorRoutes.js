const express = require('express');
const router = express.Router();
const {
  getActuators,
  getActuatorById,
  createActuator,
  updateActuator,
  deleteActuator,
  findByTorque,
  bulkImport,
  uploadExcel,
  downloadTemplate,
  getVersionHistory,
  createNewVersion
} = require('../controllers/actuatorController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// 所有路由都需要认证
router.use(protect);

// 根据扭矩要求查找执行器
router.post('/find-by-torque', findByTorque);

// 批量导入（仅管理员）
router.post('/bulk-import', authorize('Administrator'), bulkImport);

// Excel上传（仅管理员）
router.post('/upload', authorize('Administrator'), upload.single('file'), uploadExcel);

// 下载Excel模板（仅管理员）
router.get('/template', authorize('Administrator'), downloadTemplate);

// 版本管理
router.get('/:id/versions', getVersionHistory);
router.post('/:id/new-version', authorize('Administrator'), createNewVersion);

// CRUD 操作
router.route('/')
  .get(getActuators)
  .post(authorize('Administrator'), createActuator);

router.route('/:id')
  .get(getActuatorById)
  .put(authorize('Administrator'), updateActuator)
  .delete(authorize('Administrator'), deleteActuator);

module.exports = router;

