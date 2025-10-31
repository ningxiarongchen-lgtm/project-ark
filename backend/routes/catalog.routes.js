const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');
const { protect } = require('../middleware/auth');

/**
 * 产品目录路由
 * 为销售经理提供无价格信息的产品查询接口
 */

// 所有路由都需要认证
router.use(protect);

// 角色限制中间件 - 仅销售经理和管理员可访问
const restrictToCatalogRoles = (req, res, next) => {
  if (!['Sales Manager', 'Administrator'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: '您没有权限访问产品目录'
    });
  }
  next();
};

router.use(restrictToCatalogRoles);

// @route   GET /api/catalog/products
// @desc    获取所有产品（无价格）
// @access  Private (Sales Manager, Administrator)
router.get('/products', catalogController.getProductCatalog);

// @route   GET /api/catalog/search
// @desc    搜索产品（无价格）
// @access  Private (Sales Manager, Administrator)
router.get('/search', catalogController.searchProducts);

// @route   GET /api/catalog/products/:id
// @desc    获取单个产品详情（无价格）
// @access  Private (Sales Manager, Administrator)
router.get('/products/:id', catalogController.getProductById);

module.exports = router;

