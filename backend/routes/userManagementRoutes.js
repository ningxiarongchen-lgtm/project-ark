/**
 * User数据管理路由
 * 提供完整的CRUD和批量导入功能
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userManagementController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// 所有路由都需要认证和管理员权限
router.use(protect);
router.use(authorize('Administrator'));

// 统计信息（放在参数路由之前）
router.get('/statistics', userController.getStatistics);

// CSV模板下载
router.get('/template', userController.downloadTemplate);

// 批量导入
router.post('/import', upload.single('file'), userController.bulkImport);

// 批量删除
router.post('/bulk-delete', userController.bulkDelete);

// 获取激活用户
router.get('/active', userController.getActiveUsers);

// 按角色查询
router.get('/role/:role', userController.getByRole);

// 切换用户状态
router.patch('/:id/toggle-status', userController.toggleUserStatus);

// 重置密码 - 使用PUT方法（RESTful最佳实践）
router.put('/:id/reset-password', userController.resetPassword);

// 标准CRUD路由
router.route('/')
  .get(userController.getAll)
  .post(userController.create);

router.route('/:id')
  .get(userController.getById)
  .put(userController.update)
  .delete(userController.delete);

module.exports = router;

