const EngineeringChangeOrder = require('../models/EngineeringChangeOrder');
const Actuator = require('../models/Actuator');

// @desc    获取所有ECO
// @route   GET /api/ecos
// @access  Private
exports.getEcos = async (req, res) => {
  try {
    const {
      change_type,
      priority,
      status,
      is_closed,
      page = 1,
      limit = 10
    } = req.query;

    // 构建查询条件
    const query = {};
    
    if (change_type) query.change_type = change_type;
    if (priority) query.priority = priority;
    if (status) query['approval.status'] = status;
    if (is_closed !== undefined) query['closure.is_closed'] = is_closed === 'true';

    const skip = (page - 1) * limit;

    const ecos = await EngineeringChangeOrder.find(query)
      .populate('approval.initiator', 'username email')
      .populate('approval.approvals.approver', 'username email')
      .populate('affected_products.actuator_id', 'model_base version status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EngineeringChangeOrder.countDocuments(query);

    res.status(200).json({
      success: true,
      count: ecos.length,
      total,
      pages: Math.ceil(total / limit),
      data: ecos
    });
  } catch (error) {
    console.error('Get ECOs error:', error);
    res.status(500).json({
      success: false,
      message: '获取ECO列表失败',
      error: error.message
    });
  }
};

// @desc    获取单个ECO详情
// @route   GET /api/ecos/:id
// @access  Private
exports.getEcoById = async (req, res) => {
  try {
    const eco = await EngineeringChangeOrder.findById(req.params.id)
      .populate('approval.initiator', 'username email role')
      .populate('approval.approvals.approver', 'username email role')
      .populate('affected_products.actuator_id', 'model_base version status series')
      .populate('implementation.responsible_person', 'username email')
      .populate('implementation.team_members', 'username email')
      .populate('implementation.steps.responsible', 'username email')
      .populate('validation.test_responsible', 'username email')
      .populate('documents.uploaded_by', 'username email')
      .populate('closure.closed_by', 'username email');

    if (!eco) {
      return res.status(404).json({
        success: false,
        message: 'ECO不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: eco
    });
  } catch (error) {
    console.error('Get ECO by ID error:', error);
    res.status(500).json({
      success: false,
      message: '获取ECO详情失败',
      error: error.message
    });
  }
};

// @desc    创建新ECO
// @route   POST /api/ecos
// @access  Private
exports.createEco = async (req, res) => {
  try {
    // 设置发起人为当前用户
    if (!req.body.approval) {
      req.body.approval = {};
    }
    req.body.approval.initiator = req.user._id;
    req.body.approval.status = '草稿';

    const eco = await EngineeringChangeOrder.create(req.body);

    // 更新相关产品的ECO引用
    if (eco.affected_products && eco.affected_products.length > 0) {
      for (const product of eco.affected_products) {
        await Actuator.findByIdAndUpdate(
          product.actuator_id,
          { $push: { eco_references: eco._id } }
        );
      }
    }

    const populatedEco = await EngineeringChangeOrder.findById(eco._id)
      .populate('approval.initiator', 'username email')
      .populate('affected_products.actuator_id', 'model_base version');

    res.status(201).json({
      success: true,
      message: 'ECO创建成功',
      data: populatedEco
    });
  } catch (error) {
    console.error('Create ECO error:', error);
    res.status(400).json({
      success: false,
      message: '创建ECO失败',
      error: error.message
    });
  }
};

// @desc    更新ECO
// @route   PUT /api/ecos/:id
// @access  Private
exports.updateEco = async (req, res) => {
  try {
    let eco = await EngineeringChangeOrder.findById(req.params.id);

    if (!eco) {
      return res.status(404).json({
        success: false,
        message: 'ECO不存在'
      });
    }

    // 检查是否可以编辑
    if (eco.approval.status !== '草稿' && eco.approval.status !== '已拒绝') {
      return res.status(400).json({
        success: false,
        message: '只有草稿或已拒绝状态的ECO可以编辑'
      });
    }

    eco = await EngineeringChangeOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('approval.initiator', 'username email')
     .populate('affected_products.actuator_id', 'model_base version');

    res.status(200).json({
      success: true,
      message: 'ECO更新成功',
      data: eco
    });
  } catch (error) {
    console.error('Update ECO error:', error);
    res.status(400).json({
      success: false,
      message: '更新ECO失败',
      error: error.message
    });
  }
};

// @desc    删除ECO
// @route   DELETE /api/ecos/:id
// @access  Private (Admin only)
exports.deleteEco = async (req, res) => {
  try {
    const eco = await EngineeringChangeOrder.findById(req.params.id);

    if (!eco) {
      return res.status(404).json({
        success: false,
        message: 'ECO不存在'
      });
    }

    // 从相关产品中移除ECO引用
    if (eco.affected_products && eco.affected_products.length > 0) {
      for (const product of eco.affected_products) {
        await Actuator.findByIdAndUpdate(
          product.actuator_id,
          { $pull: { eco_references: eco._id } }
        );
      }
    }

    await eco.deleteOne();

    res.status(200).json({
      success: true,
      message: 'ECO删除成功'
    });
  } catch (error) {
    console.error('Delete ECO error:', error);
    res.status(500).json({
      success: false,
      message: '删除ECO失败',
      error: error.message
    });
  }
};

// @desc    提交ECO审批
// @route   POST /api/ecos/:id/submit
// @access  Private
exports.submitForApproval = async (req, res) => {
  try {
    const eco = await EngineeringChangeOrder.findById(req.params.id);

    if (!eco) {
      return res.status(404).json({
        success: false,
        message: 'ECO不存在'
      });
    }

    // 检查权限：只有发起人可以提交
    if (eco.approval.initiator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '只有发起人可以提交审批'
      });
    }

    await eco.submitForApproval();

    const updatedEco = await EngineeringChangeOrder.findById(eco._id)
      .populate('approval.initiator', 'username email');

    res.status(200).json({
      success: true,
      message: 'ECO已提交审批',
      data: updatedEco
    });
  } catch (error) {
    console.error('Submit for approval error:', error);
    res.status(400).json({
      success: false,
      message: error.message || '提交审批失败'
    });
  }
};

// @desc    批准ECO
// @route   POST /api/ecos/:id/approve
// @access  Private (Supervisor/Admin)
exports.approveEco = async (req, res) => {
  try {
    const { role, comments, conditions } = req.body;

    if (!role || !comments) {
      return res.status(400).json({
        success: false,
        message: '请提供审批角色和审批意见'
      });
    }

    const eco = await EngineeringChangeOrder.findById(req.params.id);

    if (!eco) {
      return res.status(404).json({
        success: false,
        message: 'ECO不存在'
      });
    }

    await eco.addApproval(req.user._id, role, '已批准', comments, conditions);

    const updatedEco = await EngineeringChangeOrder.findById(eco._id)
      .populate('approval.initiator', 'username email')
      .populate('approval.approvals.approver', 'username email');

    res.status(200).json({
      success: true,
      message: 'ECO已批准',
      data: updatedEco
    });
  } catch (error) {
    console.error('Approve ECO error:', error);
    res.status(400).json({
      success: false,
      message: '批准ECO失败',
      error: error.message
    });
  }
};

// @desc    驳回ECO
// @route   POST /api/ecos/:id/reject
// @access  Private (Supervisor/Admin)
exports.rejectEco = async (req, res) => {
  try {
    const { role, comments } = req.body;

    if (!role || !comments) {
      return res.status(400).json({
        success: false,
        message: '请提供审批角色和驳回原因'
      });
    }

    const eco = await EngineeringChangeOrder.findById(req.params.id);

    if (!eco) {
      return res.status(404).json({
        success: false,
        message: 'ECO不存在'
      });
    }

    await eco.addApproval(req.user._id, role, '已拒绝', comments, null);

    const updatedEco = await EngineeringChangeOrder.findById(eco._id)
      .populate('approval.initiator', 'username email')
      .populate('approval.approvals.approver', 'username email');

    res.status(200).json({
      success: true,
      message: 'ECO已驳回',
      data: updatedEco
    });
  } catch (error) {
    console.error('Reject ECO error:', error);
    res.status(400).json({
      success: false,
      message: '驳回ECO失败',
      error: error.message
    });
  }
};

// @desc    关闭ECO
// @route   POST /api/ecos/:id/close
// @access  Private (Supervisor/Admin)
exports.closeEco = async (req, res) => {
  try {
    const { closed_reason, closed_notes } = req.body;

    if (!closed_reason) {
      return res.status(400).json({
        success: false,
        message: '请提供关闭原因'
      });
    }

    const eco = await EngineeringChangeOrder.findById(req.params.id);

    if (!eco) {
      return res.status(404).json({
        success: false,
        message: 'ECO不存在'
      });
    }

    await eco.closeEco(req.user._id, closed_reason, closed_notes);

    const updatedEco = await EngineeringChangeOrder.findById(eco._id)
      .populate('closure.closed_by', 'username email');

    res.status(200).json({
      success: true,
      message: 'ECO已关闭',
      data: updatedEco
    });
  } catch (error) {
    console.error('Close ECO error:', error);
    res.status(400).json({
      success: false,
      message: '关闭ECO失败',
      error: error.message
    });
  }
};

// @desc    获取待审批的ECO列表
// @route   GET /api/ecos/pending-approvals
// @access  Private
exports.getPendingApprovals = async (req, res) => {
  try {
    const ecos = await EngineeringChangeOrder.getPendingApprovals(req.user._id);

    res.status(200).json({
      success: true,
      count: ecos.length,
      data: ecos
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: '获取待审批ECO列表失败',
      error: error.message
    });
  }
};

// @desc    获取ECO统计信息
// @route   GET /api/ecos/stats
// @access  Private
exports.getEcoStats = async (req, res) => {
  try {
    const stats = await EngineeringChangeOrder.getStatistics();

    // 按变更类型统计
    const byType = await EngineeringChangeOrder.aggregate([
      {
        $group: {
          _id: '$change_type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 按优先级统计
    const byPriority = await EngineeringChangeOrder.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: stats,
        byType,
        byPriority
      }
    });
  } catch (error) {
    console.error('Get ECO stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取ECO统计信息失败',
      error: error.message
    });
  }
};

// @desc    获取产品相关的所有ECO
// @route   GET /api/ecos/by-product/:actuatorId
// @access  Private
exports.getEcosByProduct = async (req, res) => {
  try {
    const ecos = await EngineeringChangeOrder.find({
      'affected_products.actuator_id': req.params.actuatorId
    })
      .populate('approval.initiator', 'username email')
      .populate('approval.approvals.approver', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: ecos.length,
      data: ecos
    });
  } catch (error) {
    console.error('Get ECOs by product error:', error);
    res.status(500).json({
      success: false,
      message: '获取产品ECO列表失败',
      error: error.message
    });
  }
};

