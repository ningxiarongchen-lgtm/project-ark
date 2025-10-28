const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addSelection,
  updateSelection,
  removeSelection,
  getProjectStats
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');
const { checkProjectOwnership } = require('../middleware/ownership');
const { projectValidation, validate } = require('../middleware/validators');
const {
  addProjectFile,
  deleteProjectFile
} = require('../controllers/fileAssociationController');

// All routes are protected
router.use(protect);

// Statistics
router.get('/stats/summary', getProjectStats);

// CRUD operations
router.route('/')
  .get(getProjects)
  .post(authorize('Technical Engineer', 'Sales Engineer', 'Sales Manager', 'Administrator'), projectValidation, validate, createProject);

router.route('/:id')
  .get(getProjectById)
  .put(authorize('Technical Engineer', 'Sales Engineer', 'Sales Manager', 'Administrator'), checkProjectOwnership, projectValidation, validate, updateProject)
  .delete(authorize('Administrator'), deleteProject);

// Product selections management
router.post('/:id/selections', authorize('Technical Engineer', 'Sales Engineer', 'Sales Manager', 'Administrator'), checkProjectOwnership, addSelection);
router.put('/:id/selections/:selectionId', authorize('Technical Engineer', 'Sales Engineer', 'Sales Manager', 'Administrator'), checkProjectOwnership, updateSelection);
router.delete('/:id/selections/:selectionId', authorize('Sales Manager', 'Administrator'), checkProjectOwnership, removeSelection);

// File management - LeanCloud前端直传后关联
router.post('/:id/add-file', checkProjectOwnership, addProjectFile);
router.delete('/:id/files/:fileId', checkProjectOwnership, deleteProjectFile);

module.exports = router;


