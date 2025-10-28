const express = require('express');
const router = express.Router();
const {
  getAllAccessories,
  getAccessoryById,
  createAccessory,
  updateAccessory,
  deleteAccessory,
  getAccessoriesByCategory,
  getCompatibleAccessories,
  downloadTemplate,
  uploadExcel
} = require('../controllers/accessoryController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// 所有路由都需要身份验证
router.use(protect);

// 获取所有配件（支持查询参数过滤）
// GET /api/accessories?category=控制类&min_price=100&max_price=5000&search=电磁阀
router.get('/', getAllAccessories);

// 下载Excel导入模板（仅管理员）
router.get('/template', authorize('Administrator'), downloadTemplate);

// 按类别获取配件
// GET /api/accessories/category/控制类
router.get('/category/:category', getAccessoriesByCategory);

// 获取与特定执行器兼容的配件
// GET /api/accessories/compatible/:actuatorId?category=控制类
router.get('/compatible/:actuatorId', getCompatibleAccessories);

// 获取单个配件详情
router.get('/:id', getAccessoryById);

// 创建新配件（仅管理员）
router.post('/', authorize('Administrator'), createAccessory);

// Excel批量上传配件（仅管理员）
router.post('/upload', authorize('Administrator'), upload.single('file'), uploadExcel);

// 更新配件（仅管理员）
router.put('/:id', authorize('Administrator'), updateAccessory);

// 删除配件（仅管理员）
router.delete('/:id', authorize('Administrator'), deleteAccessory);

module.exports = router;

