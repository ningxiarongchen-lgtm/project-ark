const NewProject = require('../models/NewProject');
const Actuator = require('../models/Actuator');
const ManualOverride = require('../models/ManualOverride');
const Accessory = require('../models/Accessory');
const { calculatePrice } = require('../utils/pricing');

// @desc    获取所有项目
// @route   GET /api/new-projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    const { status, priority, client_name } = req.query;
    
    let query = {};
    
    // 根据用户角色过滤项目
    if (req.user.role !== 'administrator') {
      query.$or = [
        { created_by: req.user._id },
        { assigned_to: req.user._id }
      ];
    }
    
    if (status) query.project_status = status;
    if (priority) query.priority = priority;
    if (client_name) query.client_name = { $regex: client_name, $options: 'i' };
    
    const projects = await NewProject.find(query)
      .populate('created_by', 'username role')
      .populate('assigned_to', 'username role')
      .populate('selections.selected_actuator.actuator_id')
      .populate('selections.selected_override.override_id')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取项目列表失败',
      error: error.message
    });
  }
};

// @desc    根据ID获取单个项目
// @route   GET /api/new-projects/:id
// @access  Private
exports.getProjectById = async (req, res) => {
  try {
    const project = await NewProject.findById(req.params.id)
      .populate('created_by', 'username role')
      .populate('assigned_to', 'username role')
      .populate('selections.selected_actuator.actuator_id')
      .populate('selections.selected_override.override_id')
      .populate('quotes');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的项目'
      });
    }
    
    // 检查访问权限
    if (req.user.role !== 'administrator' &&
        !project.created_by._id.equals(req.user._id) &&
        !project.assigned_to.some(user => user._id.equals(req.user._id))) {
      return res.status(403).json({
        success: false,
        message: '无权访问此项目'
      });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取项目详情失败',
      error: error.message
    });
  }
};

// @desc    创建新项目
// @route   POST /api/new-projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      created_by: req.user._id
    };
    
    const project = await NewProject.create(projectData);
    
    const populatedProject = await NewProject.findById(project._id)
      .populate('created_by', 'username role')
      .populate('assigned_to', 'username role');
    
    res.status(201).json({
      success: true,
      message: '项目创建成功',
      data: populatedProject
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建项目失败',
      error: error.message
    });
  }
};

// @desc    更新项目
// @route   PUT /api/new-projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  try {
    const project = await NewProject.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的项目'
      });
    }
    
    // 检查权限
    if (req.user.role !== 'administrator' &&
        !project.created_by.equals(req.user._id) &&
        !project.assigned_to.some(user => user.equals(req.user._id))) {
      return res.status(403).json({
        success: false,
        message: '无权修改此项目'
      });
    }
    
    const updatedProject = await NewProject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('created_by assigned_to');
    
    res.json({
      success: true,
      message: '项目更新成功',
      data: updatedProject
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新项目失败',
      error: error.message
    });
  }
};

// @desc    删除项目
// @route   DELETE /api/new-projects/:id
// @access  Private/Admin
exports.deleteProject = async (req, res) => {
  try {
    const project = await NewProject.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的项目'
      });
    }
    
    await project.deleteOne();
    
    res.json({
      success: true,
      message: '项目已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除项目失败',
      error: error.message
    });
  }
};

// @desc    添加选型配置到项目
// @route   POST /api/new-projects/:id/selections
// @access  Private
exports.addSelection = async (req, res) => {
  try {
    const project = await NewProject.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的项目'
      });
    }
    
    await project.addSelection(req.body);
    
    const updatedProject = await NewProject.findById(project._id)
      .populate('selections.selected_actuator.actuator_id')
      .populate('selections.selected_override.override_id');
    
    res.status(201).json({
      success: true,
      message: '选型配置添加成功',
      data: updatedProject
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '添加选型配置失败',
      error: error.message
    });
  }
};

// @desc    更新项目中的选型配置
// @route   PUT /api/new-projects/:id/selections/:selectionId
// @access  Private
exports.updateSelection = async (req, res) => {
  try {
    const project = await NewProject.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的项目'
      });
    }
    
    await project.updateSelection(req.params.selectionId, req.body);
    
    const updatedProject = await NewProject.findById(project._id)
      .populate('selections.selected_actuator.actuator_id')
      .populate('selections.selected_override.override_id');
    
    res.json({
      success: true,
      message: '选型配置更新成功',
      data: updatedProject
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新选型配置失败',
      error: error.message
    });
  }
};

// @desc    删除项目中的选型配置
// @route   DELETE /api/new-projects/:id/selections/:selectionId
// @access  Private
exports.removeSelection = async (req, res) => {
  try {
    const project = await NewProject.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的项目'
      });
    }
    
    await project.removeSelection(req.params.selectionId);
    
    res.json({
      success: true,
      message: '选型配置已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除选型配置失败',
      error: error.message
    });
  }
};

// @desc    自动选型（根据参数自动选择合适的执行器和手动装置）
// @route   POST /api/new-projects/:id/auto-select
// @access  Private
exports.autoSelect = async (req, res) => {
  try {
    const project = await NewProject.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的项目'
      });
    }
    
    const {
      tag_number,
      input_params,
      selected_actuator,
      selected_override,
      selected_accessories = []
    } = req.body;
    
    // 兼容旧版API格式
    const {
      required_torque,
      working_pressure,
      working_angle,
      yoke_type = 'symmetric',
      needs_manual_override = false,
      preferred_override_type
    } = input_params || req.body;
    
    // 构建选型数据
    let selectionData = {
      tag_number,
      input_params: input_params || {
        required_torque,
        working_pressure,
        working_angle,
        yoke_type,
        needs_manual_override,
        preferred_override_type
      },
      status: '已选型'
    };
    
    // 如果前端已经选择了执行器（新版流程），直接使用
    if (selected_actuator) {
      selectionData.selected_actuator = {
        actuator_id: selected_actuator._id || selected_actuator.actuator_id,
        model_base: selected_actuator.model_base,
        body_size: selected_actuator.body_size,
        action_type: selected_actuator.action_type,
        yoke_type: selected_actuator.yoke_type,
        actual_torque: selected_actuator.actual_torque,
        price: selected_actuator.price, // ⭐ 已包含温度调整后的价格
        base_price: selected_actuator.base_price, // 原始价格（如果有）
        price_adjustment: selected_actuator.price_adjustment, // 价格调整金额（如果有）
        series: selected_actuator.series,
        recommended_model: selected_actuator.recommended_model || selected_actuator.model_base,
        final_model_name: selected_actuator.final_model_name || selected_actuator.recommended_model || selected_actuator.model_base, // ⭐ 最终型号
        temperature_code: selected_actuator.temperature_code, // ⭐ 温度代码
        torque_margin: selected_actuator.torque_margin,
        // AT/GY 系列特有字段
        temperature_type: selected_actuator.temperature_type, // 温度类型（normal/low/high）
        handwheel: selected_actuator.handwheel, // 手轮信息
        price_breakdown: selected_actuator.price_breakdown // 价格明细
      };
    } else if (required_torque && working_pressure) {
      // 旧版自动选型流程
      const suitable = await Actuator.findByTorqueRequirement(
        required_torque,
        working_pressure,
        working_angle,
        yoke_type
      );
      
      if (suitable.length === 0) {
        return res.status(404).json({
          success: false,
          message: '未找到满足要求的执行器'
        });
      }
      
      // 选择最合适的（第一个，因为已按扭矩排序）
      const selectedActuator = suitable[0];
      // 转换键格式：0.3 -> 0_3 (去掉小数点，用下划线替换)
      const pressureKey = String(working_pressure).replace('.', '_');
      const key = `${pressureKey}_${working_angle}`;
      const torqueMap = yoke_type === 'symmetric' ? selectedActuator.torque_symmetric : selectedActuator.torque_canted;
      const actualTorque = torqueMap.get(key);
      
      // ⭐ 使用新的智能定价函数计算价格
      const price = calculatePrice(selectedActuator, 1);
      
      selectionData.selected_actuator = {
        actuator_id: selectedActuator._id,
        model_base: selectedActuator.model_base,
        body_size: selectedActuator.body_size,
        action_type: selectedActuator.action_type,
        yoke_type,
        actual_torque: actualTorque,
        price: price
      };
    }
    
    // 处理手动操作装置
    if (selected_override) {
      // 前端已选择手动操作装置
      selectionData.selected_override = {
        override_id: selected_override._id || selected_override.override_id,
        model: selected_override.model,
        price: selected_override.price
      };
    } else if (needs_manual_override && selectionData.selected_actuator) {
      // 自动查找兼容的手动操作装置
      const compatibleOverrides = await ManualOverride.findCompatible(
        selectionData.selected_actuator.body_size
      );
      
      if (compatibleOverrides.length > 0) {
        let selectedOverride = compatibleOverrides[0];
        
        if (preferred_override_type) {
          const preferred = compatibleOverrides.find(o => 
            o.specifications.operation_type === preferred_override_type
          );
          if (preferred) selectedOverride = preferred;
        }
        
        selectionData.selected_override = {
          override_id: selectedOverride._id,
          model: selectedOverride.model,
          price: selectedOverride.price
        };
      }
    }
    
    // 处理配件（核心新增功能）
    if (selected_accessories && Array.isArray(selected_accessories) && selected_accessories.length > 0) {
      selectionData.selected_accessories = selected_accessories.map(acc => {
        const quantity = acc.quantity || 1;
        
        // ⭐ 使用新的智能定价函数，传入完整的配件对象
        // 函数会自动根据 pricing_model 判断使用固定价格还是阶梯价格
        const unitPrice = calculatePrice(acc, quantity);
        const totalPrice = unitPrice * quantity;
        
        return {
          accessory_id: acc._id || acc.accessory_id,
          name: acc.name,
          category: acc.category,
          quantity: quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          notes: acc.notes
        };
      });
    }
    
    // 计算总价（执行器 + 手动操作装置 + 所有配件）
    let totalPrice = 0;
    
    if (selectionData.selected_actuator && selectionData.selected_actuator.price) {
      totalPrice += selectionData.selected_actuator.price;
    }
    
    if (selectionData.selected_override && selectionData.selected_override.price) {
      totalPrice += selectionData.selected_override.price;
    }
    
    if (selectionData.selected_accessories && selectionData.selected_accessories.length > 0) {
      selectionData.selected_accessories.forEach(acc => {
        if (acc.total_price) {
          totalPrice += acc.total_price;
        }
      });
    }
    
    selectionData.total_price = totalPrice;
    
    // 添加到项目
    await project.addSelection(selectionData);
    
    const updatedProject = await NewProject.findById(project._id)
      .populate('selections.selected_actuator.actuator_id')
      .populate('selections.selected_override.override_id');
    
    res.json({
      success: true,
      message: '自动选型完成',
      data: updatedProject,
      selection_details: {
        actuator: selectedActuator,
        override: selectionData.selected_override,
        total_price: selectionData.total_price
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '自动选型失败',
      error: error.message
    });
  }
};

// @desc    获取项目统计信息
// @route   GET /api/new-projects/stats/summary
// @access  Private
exports.getProjectStats = async (req, res) => {
  try {
    const stats = await NewProject.getStatsByStatus();
    const totalProjects = await NewProject.countDocuments();
    
    res.json({
      success: true,
      total_projects: totalProjects,
      by_status: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
};

