const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  bulkImportProducts
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { dataUpload } = require('../middleware/upload');

// All routes are protected
router.use(protect);

// Search products (selection engine)
router.post('/search', searchProducts);

// Bulk import products
router.post(
  '/import',
  authorize('Administrator', 'Technical Engineer'),
  dataUpload.single('productFile'),
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


