const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const Project = require('../models/Project');
const PurchaseOrder = require('../models/PurchaseOrder');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// 应用身份验证中间件
router.use(protect);

/**
 * @route   GET /api/contracts
 * @desc    获取合同列表（支持筛选）
 * @access  销售经理、采购专员、商务工程师、管理员
 */
router.get('/', authorize('Administrator', 'Sales Manager', 'Business Engineer', 'Procurement Specialist'), async (req, res) => {
  try {
    const {
      contract_type,
      status,
      priority,
      created_by,
      business_engineer,
      project,
      purchase_order,
      start_date,
      end_date,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // 构建查询条件
    const query = {};

    if (contract_type) query.contract_type = contract_type;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (created_by) query.created_by = created_by;
    if (business_engineer) query.business_engineer = business_engineer;
    if (project) query.project = project;
    if (purchase_order) query.purchase_order = purchase_order;

    // 日期范围筛选
    if (start_date || end_date) {
      query.submitted_at = {};
      if (start_date) query.submitted_at.$gte = new Date(start_date);
      if (end_date) query.submitted_at.$lte = new Date(end_date);
    }

    // 搜索（合同编号、合同名称）
    if (search) {
      query.$or = [
        { contract_number: { $regex: search, $options: 'i' } },
        { contract_name: { $regex: search, $options: 'i' } },
        { 'counterparty.name': { $regex: search, $options: 'i' } },
        { 'counterparty.company': { $regex: search, $options: 'i' } }
      ];
    }

    // 角色权限过滤
    if (req.user.role === 'Sales Manager') {
      // 销售经理只能看自己创建的销售合同
      query.created_by = req.user._id;
      query.contract_type = '销售合同';
    }

    if (req.user.role === 'Procurement Specialist') {
      // 采购专员只能看自己创建的采购合同
      query.created_by = req.user._id;
      query.contract_type = '采购合同';
    }

    // 商务工程师可以看到所有合同
    // 管理员可以看到所有合同

    const skip = (page - 1) * limit;

    const contracts = await Contract.find(query)
      .populate('project', 'projectNumber projectName client')
      .populate('purchase_order', 'order_number supplier')
      .populate('created_by', 'full_name phone email role')
      .populate('business_engineer', 'full_name phone email')
      .populate({
        path: 'follow_ups.user',
        select: 'full_name role'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Contract.countDocuments(query);

    res.status(200).json({
      success: true,
      data: contracts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取合同列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取合同列表失败',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/contracts/stats
 * @desc    获取合同统计信息
 * @access  商务工程师、管理员
 */
router.get('/stats', authorize('Administrator', 'Business Engineer'), async (req, res) => {
  try {
    const stats = {
      total: await Contract.countDocuments(),
      sales_contracts: await Contract.countDocuments({ contract_type: '销售合同' }),
      purchase_contracts: await Contract.countDocuments({ contract_type: '采购合同' }),
      pending: await Contract.countDocuments({ status: '待盖章' }),
      sealed: await Contract.countDocuments({ status: '已盖章' }),
      rejected: await Contract.countDocuments({ status: '已驳回' }),
      
      // 按类型和状态分组统计
      by_type_and_status: {
        sales: {
          pending: await Contract.countDocuments({ contract_type: '销售合同', status: '待盖章' }),
          sealed: await Contract.countDocuments({ contract_type: '销售合同', status: '已盖章' }),
          rejected: await Contract.countDocuments({ contract_type: '销售合同', status: '已驳回' })
        },
        purchase: {
          pending: await Contract.countDocuments({ contract_type: '采购合同', status: '待盖章' }),
          sealed: await Contract.countDocuments({ contract_type: '采购合同', status: '已盖章' }),
          rejected: await Contract.countDocuments({ contract_type: '采购合同', status: '已驳回' })
        }
      },
      
      // 本月新增
      this_month: await Contract.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }),
      
      // 待处理的合同（商务工程师视角）
      my_pending: await Contract.countDocuments({
        status: '待盖章',
        business_engineer: req.user._id
      }),
      
      // 未分配的待盖章合同
      unassigned_pending: await Contract.countDocuments({
        status: '待盖章',
        business_engineer: null
      })
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取合同统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取合同统计失败',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/contracts/:id
 * @desc    获取单个合同详情
 * @access  相关人员
 */
router.get('/:id', async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('project', 'projectNumber projectName client owner')
      .populate('purchase_order', 'order_number supplier total_amount')
      .populate('created_by', 'full_name phone email role')
      .populate('business_engineer', 'full_name phone email')
      .populate({
        path: 'follow_ups.user',
        select: 'full_name role'
      })
      .populate({
        path: 'operation_history.operator',
        select: 'full_name role'
      });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: '合同不存在'
      });
    }

    // 权限检查
    const isCreator = contract.created_by._id.toString() === req.user._id.toString();
    const isBusinessEngineer = contract.business_engineer && contract.business_engineer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Administrator';
    const isBusinessEngineerRole = req.user.role === 'Business Engineer';

    if (!isCreator && !isBusinessEngineer && !isAdmin && !isBusinessEngineerRole) {
      return res.status(403).json({
        success: false,
        message: '无权访问此合同'
      });
    }

    res.status(200).json({
      success: true,
      data: contract
    });
  } catch (error) {
    console.error('获取合同详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取合同详情失败',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/contracts/sales
 * @desc    创建销售合同（销售经理从项目创建）
 * @access  销售经理、管理员
 */
router.post('/sales', authorize('Administrator', 'Sales Manager'), async (req, res) => {
  try {
    const {
      project_id,
      contract_name,
      contract_amount,
      currency,
      signing_date,
      effective_date,
      expiry_date,
      counterparty,
      payment_terms,
      delivery_info,
      description,
      notes,
      priority,
      draft_file
    } = req.body;

    // 验证项目
    const project = await Project.findById(project_id).populate('client');
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 创建项目快照
    const project_snapshot = {
      project_number: project.projectNumber,
      project_name: project.projectName,
      client_name: project.client.name,
      client_company: project.client.company
    };

    // 创建销售合同
    const contract = new Contract({
      contract_type: '销售合同',
      project: project_id,
      project_snapshot,
      contract_name,
      contract_amount,
      currency,
      signing_date,
      effective_date,
      expiry_date,
      counterparty,
      payment_terms,
      delivery_info,
      description,
      notes,
      priority: priority || 'Normal',
      created_by: req.user._id,
      submitted_at: new Date()
    });

    // 如果有草稿文件
    if (draft_file) {
      contract.uploadDraftFile(draft_file, req.user._id);
    }

    // 添加创建记录
    contract.addOperationHistory('created', req.user._id, '销售经理创建销售合同', {
      project_number: project.projectNumber,
      project_name: project.projectName
    });

    await contract.save();

    res.status(201).json({
      success: true,
      message: '销售合同创建成功',
      data: contract
    });
  } catch (error) {
    console.error('创建销售合同失败:', error);
    res.status(500).json({
      success: false,
      message: '创建销售合同失败',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/contracts/purchase
 * @desc    创建采购合同（采购专员从采购订单创建）
 * @access  采购专员、管理员
 */
router.post('/purchase', authorize('Administrator', 'Procurement Specialist'), async (req, res) => {
  try {
    const {
      purchase_order_id,
      contract_name,
      contract_amount,
      currency,
      signing_date,
      effective_date,
      expiry_date,
      counterparty,
      payment_terms,
      delivery_info,
      description,
      notes,
      priority,
      draft_file
    } = req.body;

    // 验证采购订单
    const purchaseOrder = await PurchaseOrder.findById(purchase_order_id)
      .populate('supplier');
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }

    // 创建采购订单快照
    const purchase_order_snapshot = {
      order_number: purchaseOrder.order_number,
      supplier_name: purchaseOrder.supplier ? purchaseOrder.supplier.name : counterparty.name,
      total_amount: purchaseOrder.total_amount
    };

    // 创建采购合同
    const contract = new Contract({
      contract_type: '采购合同',
      purchase_order: purchase_order_id,
      purchase_order_snapshot,
      contract_name,
      contract_amount,
      currency,
      signing_date,
      effective_date,
      expiry_date,
      counterparty,
      payment_terms,
      delivery_info,
      description,
      notes,
      priority: priority || 'Normal',
      created_by: req.user._id,
      submitted_at: new Date()
    });

    // 如果有草稿文件
    if (draft_file) {
      contract.uploadDraftFile(draft_file, req.user._id);
    }

    // 添加创建记录
    contract.addOperationHistory('created', req.user._id, '采购专员创建采购合同', {
      order_number: purchaseOrder.order_number,
      supplier_name: purchase_order_snapshot.supplier_name
    });

    await contract.save();

    res.status(201).json({
      success: true,
      message: '采购合同创建成功',
      data: contract
    });
  } catch (error) {
    console.error('创建采购合同失败:', error);
    res.status(500).json({
      success: false,
      message: '创建采购合同失败',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/contracts/:id/accept
 * @desc    商务工程师接单处理合同
 * @access  商务工程师、管理员
 */
router.put('/:id/accept', authorize('Administrator', 'Business Engineer'), async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: '合同不存在'
      });
    }

    if (contract.status !== '待盖章') {
      return res.status(400).json({
        success: false,
        message: '只能接单待盖章的合同'
      });
    }

    contract.acceptByBusinessEngineer(req.user._id);
    
    // 添加跟进记录
    contract.addFollowUp(
      '商务工程师已接单，开始处理合同盖章',
      '状态更新',
      req.user._id,
      req.user.full_name,
      req.user.role
    );

    await contract.save();

    res.status(200).json({
      success: true,
      message: '接单成功',
      data: contract
    });
  } catch (error) {
    console.error('接单失败:', error);
    res.status(500).json({
      success: false,
      message: '接单失败',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/contracts/:id/seal
 * @desc    上传盖章版合同并标记为已盖章
 * @access  商务工程师、管理员
 */
router.put('/:id/seal', authorize('Administrator', 'Business Engineer'), async (req, res) => {
  try {
    const { sealed_file, comments } = req.body;

    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: '合同不存在'
      });
    }

    if (contract.status !== '待盖章') {
      return res.status(400).json({
        success: false,
        message: '只能处理待盖章的合同'
      });
    }

    if (!sealed_file) {
      return res.status(400).json({
        success: false,
        message: '请上传盖章版合同文件'
      });
    }

    // 上传盖章版文件
    contract.uploadSealedFile(sealed_file, req.user._id);

    // 完成盖章
    contract.completeSealing(req.user._id);

    // 添加审批意见
    if (comments) {
      contract.approval_comments = comments;
    }

    // 添加跟进记录
    contract.addFollowUp(
      '合同盖章完成，合同已生效',
      '状态更新',
      req.user._id,
      req.user.full_name,
      req.user.role
    );

    await contract.save();

    // TODO: 发送通知给发起人

    res.status(200).json({
      success: true,
      message: '合同盖章完成',
      data: contract
    });
  } catch (error) {
    console.error('盖章失败:', error);
    res.status(500).json({
      success: false,
      message: '盖章失败',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/contracts/:id/reject
 * @desc    驳回合同
 * @access  商务工程师、管理员
 */
router.put('/:id/reject', authorize('Administrator', 'Business Engineer'), async (req, res) => {
  try {
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        message: '请提供驳回原因'
      });
    }

    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: '合同不存在'
      });
    }

    if (contract.status !== '待盖章') {
      return res.status(400).json({
        success: false,
        message: '只能驳回待盖章的合同'
      });
    }

    // 驳回合同
    contract.reject(req.user._id, rejection_reason);

    // 添加跟进记录
    contract.addFollowUp(
      `合同被驳回：${rejection_reason}`,
      '审批意见',
      req.user._id,
      req.user.full_name,
      req.user.role
    );

    await contract.save();

    // TODO: 发送通知给发起人

    res.status(200).json({
      success: true,
      message: '合同已驳回',
      data: contract
    });
  } catch (error) {
    console.error('驳回失败:', error);
    res.status(500).json({
      success: false,
      message: '驳回失败',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/contracts/:id
 * @desc    更新合同信息
 * @access  创建人、商务工程师、管理员
 */
router.put('/:id', async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: '合同不存在'
      });
    }

    // 权限检查
    const isCreator = contract.created_by.toString() === req.user._id.toString();
    const isBusinessEngineer = contract.business_engineer && contract.business_engineer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Administrator';

    if (!isCreator && !isBusinessEngineer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权修改此合同'
      });
    }

    // 只有待盖章状态的合同可以被发起人修改
    if (contract.status !== '待盖章' && isCreator && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: '只能修改待盖章状态的合同'
      });
    }

    const allowedUpdates = [
      'contract_name',
      'contract_amount',
      'currency',
      'signing_date',
      'effective_date',
      'expiry_date',
      'counterparty',
      'payment_terms',
      'delivery_info',
      'description',
      'notes',
      'priority'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(contract, updates);

    // 添加操作记录
    contract.addOperationHistory('status_changed', req.user._id, '更新合同信息', updates);

    await contract.save();

    res.status(200).json({
      success: true,
      message: '合同更新成功',
      data: contract
    });
  } catch (error) {
    console.error('更新合同失败:', error);
    res.status(500).json({
      success: false,
      message: '更新合同失败',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/contracts/:id/follow-up
 * @desc    添加跟进记录
 * @access  相关人员
 */
router.post('/:id/follow-up', async (req, res) => {
  try {
    const { content, follow_up_type } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '请提供跟进内容'
      });
    }

    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: '合同不存在'
      });
    }

    contract.addFollowUp(
      content,
      follow_up_type || '其他',
      req.user._id,
      req.user.full_name,
      req.user.role
    );

    await contract.save();

    res.status(200).json({
      success: true,
      message: '跟进记录添加成功',
      data: contract
    });
  } catch (error) {
    console.error('添加跟进记录失败:', error);
    res.status(500).json({
      success: false,
      message: '添加跟进记录失败',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/contracts/:id
 * @desc    删除合同（仅草稿状态）
 * @access  创建人、管理员
 */
router.delete('/:id', async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: '合同不存在'
      });
    }

    // 权限检查
    const isCreator = contract.created_by.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Administrator';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权删除此合同'
      });
    }

    // 只有待盖章状态可以删除
    if (contract.status !== '待盖章') {
      return res.status(400).json({
        success: false,
        message: '只能删除待盖章状态的合同'
      });
    }

    await contract.deleteOne();

    res.status(200).json({
      success: true,
      message: '合同删除成功'
    });
  } catch (error) {
    console.error('删除合同失败:', error);
    res.status(500).json({
      success: false,
      message: '删除合同失败',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/contracts/project/:project_id
 * @desc    获取项目的所有合同
 * @access  相关人员
 */
router.get('/project/:project_id', async (req, res) => {
  try {
    const contracts = await Contract.find({
      project: req.params.project_id,
      contract_type: '销售合同'
    })
      .populate('created_by', 'full_name role')
      .populate('business_engineer', 'full_name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: contracts
    });
  } catch (error) {
    console.error('获取项目合同失败:', error);
    res.status(500).json({
      success: false,
      message: '获取项目合同失败',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/contracts/purchase-order/:purchase_order_id
 * @desc    获取采购订单的所有合同
 * @access  相关人员
 */
router.get('/purchase-order/:purchase_order_id', async (req, res) => {
  try {
    const contracts = await Contract.find({
      purchase_order: req.params.purchase_order_id,
      contract_type: '采购合同'
    })
      .populate('created_by', 'full_name role')
      .populate('business_engineer', 'full_name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: contracts
    });
  } catch (error) {
    console.error('获取采购订单合同失败:', error);
    res.status(500).json({
      success: false,
      message: '获取采购订单合同失败',
      error: error.message
    });
  }
});

module.exports = router;

