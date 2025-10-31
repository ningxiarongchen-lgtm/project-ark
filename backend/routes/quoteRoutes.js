const express = require('express');
const router = express.Router();
const {
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  deleteQuote,
  reviseQuote,
  getQuoteStats
} = require('../controllers/quoteController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Statistics
router.get('/stats/summary', getQuoteStats);

// CRUD operations
router.route('/')
  .get(getQuotes)
  .post(authorize('Business Engineer', 'Sales Manager', 'Administrator'), createQuote);

router.route('/:id')
  .get(getQuoteById)
  .put(authorize('Business Engineer', 'Sales Manager', 'Administrator'), updateQuote)
  .delete(authorize('Administrator'), deleteQuote);

// Create new version
router.post('/:id/revise', authorize('Business Engineer', 'Sales Manager', 'Administrator'), reviseQuote);

module.exports = router;


