const express = require('express');
const router = express.Router();
const actuatorManagementController = require('../controllers/actuatorManagementController');
const bomController = require('../controllers/bomController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// 所有路由都需要认证和管理员权限
router.use(protect);
router.use(authorize('Administrator'));

// 获取所有执行器（支持分页、搜索、排序）
router.get('/', actuatorManagementController.getAll);

// 获取统计信息
router.get('/statistics', actuatorManagementController.getStatistics);

// 按扭矩范围查询
router.get('/by-torque', actuatorManagementController.getByTorqueRequirement);

// 按系列查询
router.get('/series/:series', actuatorManagementController.getBySeries);

// 下载CSV模板（旧版，保留兼容性）
router.get('/template', actuatorManagementController.downloadTemplate);

// 下载统一的Excel模板（新版，推荐使用）
router.get('/template/unified', actuatorManagementController.downloadUnifiedTemplate);

// 批量导入（通用导入）
router.post('/import', upload.single('file'), actuatorManagementController.bulkImport);

// 批量导入CSV（专门的执行器CSV格式：AT/GY和SF，旧版）
router.post('/import-csv', upload.single('file'), actuatorManagementController.bulkImportCsv);

// 批量导入统一Excel（新版，全量替换模式）
router.post('/import/unified', upload.single('file'), actuatorManagementController.bulkImportUnifiedExcel);

// 批量删除
router.post('/bulk-delete', actuatorManagementController.bulkDelete);

// 获取单个执行器
router.get('/:id', actuatorManagementController.getById);

// 创建新执行器
router.post('/', actuatorManagementController.create);

// 更新执行器
router.put('/:id', actuatorManagementController.update);

// 更新执行器的BOM结构
router.put('/:id/bom-structure', bomController.updateActuatorBOM);

// 删除执行器
router.delete('/:id', actuatorManagementController.delete);

module.exports = router;
