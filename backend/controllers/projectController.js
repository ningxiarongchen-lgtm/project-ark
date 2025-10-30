const Project = require('../models/Project');
const Product = require('../models/Product');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    const { status, priority, industry, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    // 🔒 基于角色的数据过滤
    // 管理员可以看到所有项目
    if (req.user.role === 'Administrator') {
      // 管理员不添加过滤条件，可以看到所有项目
    }
    // 销售经理和销售工程师只能看到自己创建的项目或被指派的项目
    else if (req.user.role === 'Sales Manager' || req.user.role === 'Sales Engineer') {
      query.$or = [
        { owner: req.user._id },           // 自己负责的项目
        { createdBy: req.user._id },       // 自己创建的项目
        { assignedTo: req.user._id }       // 被指派的项目
      ];
    }
    // 技术工程师可以看到指派给自己的项目
    else if (req.user.role === 'Technical Engineer') {
      query.$or = [
        { technical_support: req.user._id }, // 指派给自己的技术支持项目
        { assignedTo: req.user._id }         // 被指派的项目
      ];
    }
    // 其他角色根据创建者或被指派来过滤
    else {
      query.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ];
    }
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (industry) query.industry = industry;

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const projects = await Project.find(query)
      .populate('createdBy', 'phone full_name role')
      .populate('owner', 'phone full_name role')
      .populate('technical_support', 'phone full_name role')
      .populate('assignedTo', 'phone full_name role')
      .populate('selections.product')
      .populate('selections.accessories.accessory')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 获取总数
    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      data: projects,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'phone full_name role')
      .populate('owner', 'phone full_name role')
      .populate('technical_support', 'phone full_name role')
      .populate('assignedTo', 'phone full_name role')
      .populate('selections.product')
      .populate('selections.accessories.accessory')
      .populate('quotes')
      .populate('documents.uploadedBy', 'phone full_name')
      .populate('project_files.uploadedBy', 'phone full_name');

    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Check access rights
    const hasAccess = 
      req.user.role === 'Administrator' ||
      (project.createdBy && project.createdBy._id.equals(req.user._id)) ||
      (project.owner && project.owner._id.equals(req.user._id)) ||
      (project.technical_support && project.technical_support._id.equals(req.user._id)) ||
      project.assignedTo.some(user => user._id.equals(req.user._id));

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to access this project' 
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    console.log('📝 创建项目请求数据:', JSON.stringify(req.body, null, 2));
    
    // Generate unique project number
    const year = new Date().getFullYear();
    const count = await Project.countDocuments();
    const projectNumber = `PRJ-${year}-${String(count + 1).padStart(4, '0')}`;
    
    const projectData = {
      ...req.body,
      projectNumber: projectNumber, // ✅ 显式设置项目编号
      createdBy: req.user._id,
      // ✅ 自动设置 owner 为当前用户（销售经理/销售工程师）
      owner: req.user._id,
      // ✅ 自动设置 status 为"待指派技术"
      status: '待指派技术'
    };

    // If project_files are included, add uploadedBy to each file
    if (projectData.project_files && Array.isArray(projectData.project_files)) {
      projectData.project_files = projectData.project_files.map(file => ({
        ...file,
        uploadedBy: req.user._id,
        uploadedAt: new Date()
      }));
    }

    console.log('📦 准备创建的项目数据:', JSON.stringify(projectData, null, 2));

    const project = await Project.create(projectData);
    
    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'phone full_name role')
      .populate('owner', 'phone full_name role')
      .populate('technical_support', 'phone full_name role')
      .populate('assignedTo', 'phone full_name role');

    res.status(201).json({
      success: true,
      message: '项目创建成功',
      data: populatedProject
    });
  } catch (error) {
    console.error('❌ 项目创建失败:', error);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        success: false,
        message: '数据验证失败',
        errors: errors
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
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

// @desc    Get all technical engineers
// @route   GET /api/projects/technical-engineers/list
// @access  Private
exports.getTechnicalEngineers = async (req, res) => {
  try {
    const User = require('../models/User');
    
    const technicalEngineers = await User.find({ 
      role: 'Technical Engineer',
      is_active: true 
    })
    .select('phone full_name email role department')
    .sort({ full_name: 1 });
    
    res.json({
      success: true,
      data: technicalEngineers
    });
  } catch (error) {
    console.error('❌ 获取技术工程师列表失败:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Assign technical engineer to project
// @route   POST /api/projects/:id/assign-technical
// @access  Private (Sales Manager / Owner)
exports.assignTechnicalEngineer = async (req, res) => {
  try {
    const { technicalEngineerId, notes } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: '项目不存在' 
      });
    }
    
    // Check permissions - only project owner or sales manager can assign
    const isOwner = project.owner && project.owner.equals(req.user._id);
    const isCreator = project.createdBy && project.createdBy.equals(req.user._id);
    const isSalesManager = req.user.role === 'Sales Manager';
    const isAdmin = req.user.role === 'Administrator';
    
    if (!isOwner && !isCreator && !isSalesManager && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: '您没有权限指派技术工程师' 
      });
    }
    
    // Verify the technical engineer exists and has the correct role
    const User = require('../models/User');
    const technicalEngineer = await User.findById(technicalEngineerId);
    
    if (!technicalEngineer) {
      return res.status(404).json({ 
        success: false,
        message: '技术工程师不存在' 
      });
    }
    
    if (technicalEngineer.role !== 'Technical Engineer') {
      return res.status(400).json({ 
        success: false,
        message: '选择的用户不是技术工程师' 
      });
    }
    
    // Update project
    project.technical_support = technicalEngineerId;
    project.status = '选型中';
    
    // Add to operation history
    if (!project.operation_history) {
      project.operation_history = [];
    }
    
    project.operation_history.push({
      operation_type: 'other',
      operator: req.user._id,
      operator_name: req.user.full_name || req.user.phone,
      operator_role: req.user.role,
      description: `指派技术工程师: ${technicalEngineer.full_name || technicalEngineer.phone}`,
      details: {
        technical_engineer: {
          id: technicalEngineerId,
          name: technicalEngineer.full_name,
          phone: technicalEngineer.phone
        },
        notes: notes || ''
      },
      notes: notes || ''
    });
    
    await project.save();
    
    // Populate and return updated project
    const updatedProject = await Project.findById(project._id)
      .populate('createdBy', 'phone full_name role')
      .populate('owner', 'phone full_name role')
      .populate('technical_support', 'phone full_name role')
      .populate('assignedTo', 'phone full_name role');
    
    console.log(`✅ 技术工程师指派成功: ${technicalEngineer.full_name || technicalEngineer.phone} -> 项目 ${project.projectNumber}`);
    
    res.json({
      success: true,
      message: '技术工程师指派成功',
      data: updatedProject
    });
    
  } catch (error) {
    console.error('❌ 指派技术工程师失败:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
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


