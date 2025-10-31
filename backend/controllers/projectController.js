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
    // 销售经理和商务工程师只能看到自己创建的项目或被指派的项目
    else if (req.user.role === 'Sales Manager' || req.user.role === 'Business Engineer') {
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
      // ✅ 自动设置 owner 为当前用户（销售经理/商务工程师）
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
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // 🔒 状态流转权限校验（v2.0）
    if (req.body.status && req.body.status !== project.status) {
      const currentStatus = project.status;
      const newStatus = req.body.status;
      const userRole = req.user.role;
      
      console.log(`🔄 状态流转请求: ${currentStatus} → ${newStatus}, 操作人: ${userRole}`);
      
      // 定义状态流转规则和权限
      const statusTransitionRules = {
        // 选型中 → 待商务报价（只有技术工程师）
        '选型中': {
          '待商务报价': {
            allowedRoles: ['Technical Engineer', 'Administrator'],
            description: '提交技术选型'
          }
        },
        // 待商务报价 → 已报价-询价中（只有商务专员）
        '待商务报价': {
          '已报价-询价中': {
            allowedRoles: ['Business Engineer', 'Administrator'],
            description: '完成商务报价'
          }
        },
        // 已报价-询价中 → 待上传合同/失单（销售经理）
        '已报价-询价中': {
          '待上传合同': {
            allowedRoles: ['Sales Manager', 'Administrator'],
            description: '客户接受报价'
          },
          '失单': {
            allowedRoles: ['Sales Manager', 'Administrator'],
            description: '客户拒绝报价'
          }
        },
        // 待上传合同 → 待商务审核合同（销售经理上传合同后自动流转）
        '待上传合同': {
          '待商务审核合同': {
            allowedRoles: ['Sales Manager', 'Administrator'],
            description: '上传销售合同'
          }
        },
        // 待商务审核合同 → 待客户盖章（商务专员上传盖章合同后自动流转）
        '待商务审核合同': {
          '待客户盖章': {
            allowedRoles: ['Business Engineer', 'Administrator'],
            description: '审核并上传公司盖章合同'
          }
        },
        // 待客户盖章 → 待预付款（销售经理上传客户盖章合同后自动流转，正式赢单）
        '待客户盖章': {
          '待预付款': {
            allowedRoles: ['Sales Manager', 'Administrator'],
            description: '上传客户盖章合同，正式赢单'
          },
          '合同已签订-赢单': {
            allowedRoles: ['Sales Manager', 'Administrator'],
            description: '上传客户盖章合同，正式赢单（兼容）'
          }
        },
        // 待预付款/合同已签订-赢单 → 生产准备中（商务专员确认预付款）
        '待预付款': {
          '生产准备中': {
            allowedRoles: ['Business Engineer', 'Administrator'],
            description: '确认预付款到账'
          }
        },
        '合同已签订-赢单': {
          '生产准备中': {
            allowedRoles: ['Business Engineer', 'Administrator'],
            description: '确认预付款到账'
          }
        },
        // 生产准备中 → 采购中/生产中（生产员）
        '生产准备中': {
          '采购中': {
            allowedRoles: ['Production Planner', 'Administrator'],
            description: '开始采购'
          },
          '生产中': {
            allowedRoles: ['Production Planner', 'Administrator'],
            description: '开始生产'
          }
        },
        // 采购中 → 生产中（生产员）
        '采购中': {
          '生产中': {
            allowedRoles: ['Production Planner', 'Administrator'],
            description: '采购完成，开始生产'
          }
        },
        // 生产中 → 已完成（生产员）
        '生产中': {
          '已完成': {
            allowedRoles: ['Production Planner', 'Administrator'],
            description: '生产完成'
          }
        }
      };
      
      // 检查状态流转是否合法
      const allowedTransitions = statusTransitionRules[currentStatus];
      if (!allowedTransitions) {
        return res.status(400).json({ 
          success: false,
          message: `当前状态"${currentStatus}"不允许流转到其他状态` 
        });
      }
      
      const transitionRule = allowedTransitions[newStatus];
      if (!transitionRule) {
        const allowedStatuses = Object.keys(allowedTransitions).join('、');
        return res.status(400).json({ 
          success: false,
          message: `状态"${currentStatus}"只能流转到：${allowedStatuses}` 
        });
      }
      
      // 检查用户角色权限
      if (!transitionRule.allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          success: false,
          message: `只有${transitionRule.allowedRoles.join('或')}可以${transitionRule.description}` 
        });
      }
      
      console.log(`✅ 状态流转校验通过: ${currentStatus} → ${newStatus}`);
      
      // 记录状态流转到操作历史
      if (!project.operation_history) {
        project.operation_history = [];
      }
      
      project.operation_history.push({
        operation_type: 'project_status_changed',
        operator: req.user._id,
        operator_name: req.user.full_name || req.user.phone,
        operator_role: userRole,
        operation_time: new Date(),
        description: `状态流转: ${currentStatus} → ${newStatus}`,
        details: {
          old_status: currentStatus,
          new_status: newStatus,
          action: transitionRule.description
        }
      });
    }

    // Check basic permissions
    const hasAccess = 
      req.user.role === 'Administrator' ||
      (project.createdBy && project.createdBy.equals(req.user._id)) ||
      (project.owner && project.owner.equals(req.user._id)) ||
      (project.technical_support && project.technical_support.equals(req.user._id)) ||
      (project.assignedTo && project.assignedTo.some(user => user.equals(req.user._id)));
      
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this project' 
      });
    }

    // 更新项目
    Object.assign(project, req.body);
    await project.save();

    // 重新查询并populate
    const updatedProject = await Project.findById(req.params.id)
      .populate('createdBy', 'phone full_name role')
      .populate('owner', 'phone full_name role')
      .populate('technical_support', 'phone full_name role')
      .populate('assignedTo', 'phone full_name role')
      .populate('selections.product')
      .populate('selections.accessories.accessory');

    res.json({
      success: true,
      message: req.body.status ? '项目状态已更新' : '项目已更新',
      data: updatedProject
    });
  } catch (error) {
    console.error('❌ 项目更新失败:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
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
      isActive: { $ne: false }  // ✅ 修复：使用正确的字段名 isActive（驼峰命名）
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

// @desc    Get sales engineer dashboard stats
// @route   GET /api/projects/stats/sales-engineer
// @access  Private (Business Engineer only)
exports.getSalesEngineerStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 基础查询条件 - 只看自己负责的项目
    let baseQuery = {
      $or: [
        { owner: userId },
        { createdBy: userId },
        { assignedTo: userId }
      ]
    };
    
    // 管理员可以看所有项目
    if (req.user.role === 'Administrator') {
      baseQuery = {};
    }
    
    // 1. 总项目数
    const totalProjects = await Project.countDocuments(baseQuery);
    
    // 2. 待完成报价
    const pendingQuotation = await Project.countDocuments({
      ...baseQuery,
      status: '待商务报价'
    });
    
    // 3. 待催30%预付款（合同签订后等待预付款）
    const pendingDownPayment = await Project.countDocuments({
      ...baseQuery,
      status: '待预付款'
    });
    
    // 4. 待下生产订单（预付款已到账，需要下生产订单）
    const pendingProductionOrder = await Project.countDocuments({
      ...baseQuery,
      status: '生产准备中'
    });
    
    // 5. 待催70%尾款（质检通过待发货，需要催收尾款）
    // 暂时使用"生产中"状态作为待催尾款的标识
    // TODO: 后续可以添加新状态"质检通过待发货"或"待尾款"
    const pendingFinalPayment = await Project.countDocuments({
      ...baseQuery,
      status: '生产中'
    });
    
    // 6. 计算本月成交金额
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const wonProjects = await Project.find({
      ...baseQuery,
      $or: [
        { status: '合同已签订-赢单' },
        { status: '赢单' }
      ],
      updatedAt: {
        $gte: currentMonth,
        $lt: nextMonth
      }
    });
    
    // 计算本月成交金额
    let monthlyRevenue = 0;
    wonProjects.forEach(project => {
      if (project.bill_of_materials && Array.isArray(project.bill_of_materials)) {
        const projectTotal = project.bill_of_materials.reduce((sum, item) => {
          return sum + (item.total_price || 0);
        }, 0);
        monthlyRevenue += projectTotal;
      }
    });
    
    res.json({
      success: true,
      data: {
        totalProjects,
        pendingQuotation,
        pendingDownPayment,      // 待催30%预付款
        pendingFinalPayment,     // 待催70%尾款
        pendingProductionOrder,  // 待下生产订单
        monthlyRevenue           // 本月成交金额
      }
    });
  } catch (error) {
    console.error('获取商务工程师统计数据失败:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};


