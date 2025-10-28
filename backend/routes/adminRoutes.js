const express = require('express');
const router = express.Router();
const {
  importProducts,
  importAccessories,
  exportProducts,
  getProductTemplate,
  getSystemStats
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All admin routes require admin authorization
router.use(protect);
router.use(authorize('Administrator'));

// Statistics
router.get('/stats', getSystemStats);

// Excel import/export
router.post('/import/products', upload.single('file'), importProducts);
router.post('/import/accessories', upload.single('file'), importAccessories);
router.get('/export/products', exportProducts);
router.get('/template/products', getProductTemplate);

module.exports = router;


