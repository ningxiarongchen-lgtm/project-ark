const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Search products (selection engine)
router.post('/search', searchProducts);

// CRUD operations
router.route('/')
  .get(getProducts)
  .post(authorize('Administrator'), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(authorize('Administrator'), updateProduct)
  .delete(authorize('Administrator'), deleteProduct);

module.exports = router;


