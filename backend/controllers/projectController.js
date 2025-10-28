const Project = require('../models/Project');
const Product = require('../models/Product');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    const { status, priority, industry } = req.query;
    
    let query = {};
    
    // Filter based on user role
    if (req.user.role !== 'administrator') {
      query.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ];
    }
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (industry) query.industry = industry;

    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('selections.product')
      .populate('selections.accessories.accessory')
      .sort({ createdAt: -1 });

    res.json({
      count: projects.length,
      projects
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('selections.product')
      .populate('selections.accessories.accessory')
      .populate('quotes')
      .populate('documents.uploadedBy', 'name');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access rights
    if (req.user.role !== 'administrator' &&
        !project.createdBy._id.equals(req.user._id) &&
        !project.assignedTo.some(user => user._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      createdBy: req.user._id
    };

    const project = await Project.create(projectData);
    
    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check permissions
    if (req.user.role !== 'administrator' &&
        !project.createdBy.equals(req.user._id) &&
        !project.assignedTo.some(user => user.equals(req.user._id))) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy assignedTo selections.product selections.accessories.accessory');

    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await project.deleteOne();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add product selection to project
// @route   POST /api/projects/:id/selections
// @access  Private
exports.addSelection = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify product exists
    const product = await Product.findById(req.body.product);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Add selection
    project.selections.push(req.body);
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('selections.product')
      .populate('selections.accessories.accessory');

    res.status(201).json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update selection in project
// @route   PUT /api/projects/:id/selections/:selectionId
// @access  Private
exports.updateSelection = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const selection = project.selections.id(req.params.selectionId);
    if (!selection) {
      return res.status(404).json({ message: 'Selection not found' });
    }

    // Update selection
    Object.assign(selection, req.body);
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('selections.product')
      .populate('selections.accessories.accessory');

    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Remove selection from project
// @route   DELETE /api/projects/:id/selections/:selectionId
// @access  Private
exports.removeSelection = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.selections.pull(req.params.selectionId);
    await project.save();

    res.json({ message: 'Selection removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get project statistics
// @route   GET /api/projects/stats/summary
// @access  Private
exports.getProjectStats = async (req, res) => {
  try {
    const stats = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$estimatedValue' }
        }
      }
    ]);

    const totalProjects = await Project.countDocuments();
    
    res.json({
      totalProjects,
      byStatus: stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


