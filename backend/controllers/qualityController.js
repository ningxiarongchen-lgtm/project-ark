const QualityCheck = require('../models/QualityCheck');
const WorkOrder = require('../models/WorkOrder');
const { updateProductionOrderProgress } = require('../services/mesService');

// @desc    获取所有质检任务
// @route   GET /api/quality/checks
// @access  Private
exports.getQualityChecks = async (req, res) => {
  try {
    const {
      status,
      result,
      inspection_type,
      inspector,
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (result) query.result = result;
    if (inspection_type) query.inspection_type = inspection_type;
    if (inspector) query.inspector = inspector;
    
    if (start_date || end_date) {
      query.createdAt = {};
      if (start_date) query.createdAt.$gte = new Date(start_date);
      if (end_date) query.createdAt.$lte = new Date(end_date);
    }
    
    const skip = (page - 1) * limit;
    
    const qualityChecks = await QualityCheck.find(query)
      .populate('work_order', 'work_order_number status')
      .populate('production_order', 'productionOrderNumber')
      .populate('product.product_id', 'model_base version')
      .populate('inspector', 'full_name phone')
      .populate('created_by', 'full_name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await QualityCheck.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: qualityChecks.length,
      total,
      pages: Math.ceil(total / limit),
      data: qualityChecks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取质检任务列表失败',
      error: error.message
    });
  }
};

// @desc    获取单个质检任务
// @route   GET /api/quality/checks/:id
// @access  Private
exports.getQualityCheckById = async (req, res) => {
  try {
    const qualityCheck = await QualityCheck.findById(req.params.id)
      .populate('work_order', 'work_order_number status operation actual')
      .populate('production_order', 'productionOrderNumber orderSnapshot')
      .populate('product.product_id', 'model_base version series')
      .populate('inspector', 'full_name phone role')
      .populate('review.reviewer', 'full_name phone role')
      .populate('corrective_actions.responsible', 'full_name phone')
      .populate('created_by', 'full_name phone');
    
    if (!qualityCheck) {
      return res.status(404).json({
        success: false,
        message: '质检任务不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: qualityCheck
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取质检任务详情失败',
      error: error.message
    });
  }
};

// @desc    获取待检列表
// @route   GET /api/quality/checks/pending
// @access  Private
exports.getPendingChecks = async (req, res) => {
  try {
    const { inspector, inspection_type } = req.query;
    
    const filters = {};
    if (inspector) filters.inspector = inspector;
    if (inspection_type) filters.inspection_type = inspection_type;
    
    const pendingChecks = await QualityCheck.getPendingInspections(filters);
    
    res.status(200).json({
      success: true,
      count: pendingChecks.length,
      data: pendingChecks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取待检列表失败',
      error: error.message
    });
  }
};

// @desc    获取我的质检任务
// @route   GET /api/quality/checks/my-tasks
// @access  Private
exports.getMyQualityChecks = async (req, res) => {
  try {
    const { status } = req.query;
    
    const qualityChecks = await QualityCheck.findByInspector(req.user._id, status);
    
    res.status(200).json({
      success: true,
      count: qualityChecks.length,
      data: qualityChecks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取我的质检任务失败',
      error: error.message
    });
  }
};

// @desc    创建质检任务（手动创建）
// @route   POST /api/quality/checks
// @access  Private
exports.createQualityCheck = async (req, res) => {
  try {
    req.body.created_by = req.user._id;
    
    const qualityCheck = await QualityCheck.create(req.body);
    
    const populatedQC = await QualityCheck.findById(qualityCheck._id)
      .populate('work_order', 'work_order_number')
      .populate('product.product_id', 'model_base version')
      .populate('created_by', 'full_name phone');
    
    res.status(201).json({
      success: true,
      message: '质检任务创建成功',
      data: populatedQC
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建质检任务失败',
      error: error.message
    });
  }
};

// @desc    开始检验
// @route   POST /api/quality/checks/:id/start
// @access  Private
exports.startInspection = async (req, res) => {
  try {
    const qualityCheck = await QualityCheck.findById(req.params.id);
    
    if (!qualityCheck) {
      return res.status(404).json({
        success: false,
        message: '质检任务不存在'
      });
    }
    
    await qualityCheck.startInspection(req.user._id);
    
    res.status(200).json({
      success: true,
      message: '检验已开始',
      data: qualityCheck
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '开始检验失败'
    });
  }
};

// @desc    录入检验结果
// @route   POST /api/quality/checks/:id/complete
// @access  Private
exports.completeInspection = async (req, res) => {
  try {
    const qualityCheck = await QualityCheck.findById(req.params.id)
      .populate('work_order')
      .populate('production_order');
    
    if (!qualityCheck) {
      return res.status(404).json({
        success: false,
        message: '质检任务不存在'
      });
    }
    
    // 更新检验项目
    if (req.body.inspection_items) {
      qualityCheck.inspection_items = req.body.inspection_items;
    }
    
    // 更新不合格项
    if (req.body.defects && req.body.defects.length > 0) {
      qualityCheck.defects = req.body.defects;
    }
    
    // 更新检验设备
    if (req.body.equipment_used) {
      qualityCheck.equipment_used = req.body.equipment_used;
    }
    
    // 更新检验环境
    if (req.body.environment) {
      qualityCheck.environment = req.body.environment;
    }
    
    // 更新备注
    if (req.body.notes) {
      qualityCheck.notes = req.body.notes;
    }
    
    // 完成检验
    await qualityCheck.completeInspection(req.body);
    
    // 更新工单状态
    const workOrder = qualityCheck.work_order;
    if (workOrder && workOrder.status === '待质检') {
      // 根据质检结果更新工单
      if (qualityCheck.result === '合格' || qualityCheck.result === '让步接收') {
        // 质检合格，工单完成
        workOrder.status = '已完成';
        
        // 更新合格数量
        if (qualityCheck.result === '合格') {
          workOrder.actual.good_quantity = qualityCheck.quantity.accepted_quantity;
        }
        
        await workOrder.save();
        
        // 更新生产订单进度
        await updateProductionOrderProgress(workOrder.production_order);
      } else {
        // 质检不合格，根据处理方式更新工单
        // 暂时保持待质检状态，等待处理决定
        workOrder.actual.reject_quantity = qualityCheck.quantity.rejected_quantity;
        await workOrder.save();
      }
    }
    
    const populatedQC = await QualityCheck.findById(qualityCheck._id)
      .populate('work_order', 'work_order_number status')
      .populate('inspector', 'full_name phone');
    
    res.status(200).json({
      success: true,
      message: '检验已完成',
      data: populatedQC
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '完成检验失败'
    });
  }
};

// @desc    质检通过，更新生产订单为质检通过状态
// @route   POST /api/quality/production-order/:id/pass
// @access  Private
exports.markProductionOrderQCPassed = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const ProductionOrder = require('../models/ProductionOrder');
    const SalesOrder = require('../models/SalesOrder');
    
    const productionOrder = await ProductionOrder.findById(id)
      .populate('salesOrder');

    if (!productionOrder) {
      return res.status(404).json({
        success: false,
        message: '生产订单不存在'
      });
    }

    // 检查当前状态
    if (productionOrder.status !== 'Awaiting QC') {
      return res.status(400).json({
        success: false,
        message: '只有待质检状态的订单才能标记为质检通过',
        currentStatus: productionOrder.status
      });
    }

    // 更新生产订单状态
    productionOrder.status = 'QC Passed';
    productionOrder.addLog(
      'QC Passed',
      notes || '质检通过',
      req.user._id
    );

    await productionOrder.save();

    // 同时更新销售订单状态
    if (productionOrder.salesOrder) {
      const salesOrder = await SalesOrder.findById(productionOrder.salesOrder);
      if (salesOrder) {
        salesOrder.status = 'QC Passed';
        await salesOrder.save();
      }
    }

    res.status(200).json({
      success: true,
      message: '生产订单已标记为质检通过',
      data: productionOrder
    });

  } catch (error) {
    console.error('Error marking production order as QC passed:', error);
    res.status(500).json({
      success: false,
      message: '更新状态失败',
      error: error.message
    });
  }
};

// @desc    添加不合格项
// @route   POST /api/quality/checks/:id/defects
// @access  Private
exports.addDefect = async (req, res) => {
  try {
    const qualityCheck = await QualityCheck.findById(req.params.id);
    
    if (!qualityCheck) {
      return res.status(404).json({
        success: false,
        message: '质检任务不存在'
      });
    }
    
    await qualityCheck.addDefect(req.body);
    
    res.status(200).json({
      success: true,
      message: '不合格项已添加',
      data: qualityCheck
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '添加不合格项失败',
      error: error.message
    });
  }
};

// @desc    添加纠正措施
// @route   POST /api/quality/checks/:id/corrective-actions
// @access  Private
exports.addCorrectiveAction = async (req, res) => {
  try {
    const qualityCheck = await QualityCheck.findById(req.params.id);
    
    if (!qualityCheck) {
      return res.status(404).json({
        success: false,
        message: '质检任务不存在'
      });
    }
    
    await qualityCheck.addCorrectiveAction(req.body);
    
    res.status(200).json({
      success: true,
      message: '纠正措施已添加',
      data: qualityCheck
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '添加纠正措施失败',
      error: error.message
    });
  }
};

// @desc    审核质检结果
// @route   POST /api/quality/checks/:id/review
// @access  Private (Admin/QA Manager)
exports.reviewQualityCheck = async (req, res) => {
  try {
    const qualityCheck = await QualityCheck.findById(req.params.id);
    
    if (!qualityCheck) {
      return res.status(404).json({
        success: false,
        message: '质检任务不存在'
      });
    }
    
    const { status, comments } = req.body;
    
    qualityCheck.review.reviewer = req.user._id;
    qualityCheck.review.status = status;
    qualityCheck.review.review_date = new Date();
    qualityCheck.review.comments = comments;
    
    await qualityCheck.save();
    
    res.status(200).json({
      success: true,
      message: '审核已完成',
      data: qualityCheck
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '审核失败',
      error: error.message
    });
  }
};

// @desc    获取质检统计
// @route   GET /api/quality/stats
// @access  Private
exports.getQualityStats = async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.start_date) filters.start_date = req.query.start_date;
    if (req.query.end_date) filters.end_date = req.query.end_date;
    if (req.query.inspector) filters.inspector = req.query.inspector;
    
    const stats = await QualityCheck.getStatistics(filters);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
};

// @desc    获取不良原因分析
// @route   GET /api/quality/defect-analysis
// @access  Private
exports.getDefectAnalysis = async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.start_date) filters.start_date = req.query.start_date;
    if (req.query.end_date) filters.end_date = req.query.end_date;
    
    const analysis = await QualityCheck.getDefectAnalysis(filters);
    
    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取不良原因分析失败',
      error: error.message
    });
  }
};

// @desc    删除质检任务
// @route   DELETE /api/quality/checks/:id
// @access  Private (Admin)
exports.deleteQualityCheck = async (req, res) => {
  try {
    const qualityCheck = await QualityCheck.findById(req.params.id);
    
    if (!qualityCheck) {
      return res.status(404).json({
        success: false,
        message: '质检任务不存在'
      });
    }
    
    // 只能删除待检状态的质检任务
    if (qualityCheck.status !== '待检') {
      return res.status(400).json({
        success: false,
        message: '只能删除待检状态的质检任务'
      });
    }
    
    await qualityCheck.deleteOne();
    
    res.status(200).json({
      success: true,
      message: '质检任务已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除质检任务失败',
      error: error.message
    });
  }
};

