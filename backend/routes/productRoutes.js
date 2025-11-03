const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  bulkImportProducts,
  getProductTemplate
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { dataUpload } = require('../middleware/upload');

// All routes are protected
router.use(protect);

// Search products (selection engine)
router.post('/search', searchProducts);

// Get product import template
router.get(
  '/template',
  authorize('Administrator', 'Technical Engineer'),
  getProductTemplate
);

// Bulk import products (支持多文件上传)
router.post(
  '/import',
  authorize('Administrator', 'Technical Engineer'),
  dataUpload.array('productFiles', 10), // 允许最多10个文件
  bulkImportProducts
);

// CRUD operations
router.route('/')
  .get(getProducts)
  .post(authorize('Administrator'), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(authorize('Administrator'), updateProduct)
  .delete(authorize('Administrator'), deleteProduct);

module.exports = router;


