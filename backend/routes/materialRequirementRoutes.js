const express = require('express');
const router = express.Router();
const MaterialRequirement = require('../models/MaterialRequirement');
const ProductionOrder = require('../models/ProductionOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// 应用身份验证中间件
router.use(protect);

/**
 * @route   GET /api/material-requirements
 * @desc    获取物料需求列表（支持筛选）
 * @access  生产计划员、采购专员、管理员
 */
router.get('/', authorize('Administrator', 'Production Planner', 'Procurement Specialist'), async (req, res) => {
  try {
    const {
      status,
      priority,
      created_by,
      assigned_to,
      production_order,
      start_date,
      end_date,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // 构建查询条件
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (created_by) query.created_by = created_by;
    if (assigned_to) query.assigned_to = assigned_to;
    if (production_order) query.production_order = production_order;

    // 日期范围筛选
    if (start_date || end_date) {
      query.required_delivery_date = {};
      if (start_date) query.required_delivery_date.$gte = new Date(start_date);
      if (end_date) query.required_delivery_date.$lte = new Date(end_date);
    }

    // 搜索（需求编号、物料名称）
    if (search) {
      query.$or = [
        { requirement_number: { $regex: search, $options: 'i' } },
        { 'items.material_name': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // 如果是生产计划员，只能看到自己创建的
    if (req.user.role === 'Production Planner') {
      query.created_by = req.user._id;
    }

    // 如果是采购专员，可以看到所有已提交的
    if (req.user.role === 'Procurement Specialist') {
      query.status = { $in: ['已提交', '采购中', '部分完成', '已完成'] };
    }

    const skip = (page - 1) * limit;

    const requirements = await MaterialRequirement.find(query)
      .populate('production_order', 'productionOrderNumber orderSnapshot')
      .populate('created_by', 'full_name phone')
      .populate('assigned_to', 'full_name phone')
      .populate({
        path: 'items.suggested_supplier',
        select: 'name contact_person contact_phone'
      })
      .populate({
        path: 'items.purchase_order',
        select: 'order_number status expected_delivery_date'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MaterialRequirement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: requirements,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取物料需求列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取物料需求列表失败',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/material-requirements/stats
 * @desc    获取物料需求统计信息
 * @access  生产计划员、采购专员、管理员
 */
router.get('/stats', authorize('Administrator', 'Production Planner', 'Procurement Specialist'), async (req, res) => {
  try {
    const query = {};

    // 如果是生产计划员，只统计自己的
    if (req.user.role === 'Production Planner') {
      query.created_by = req.user._id;
    }

    const total = await MaterialRequirement.countDocuments(query);
    
    const statusCounts = await MaterialRequirement.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const priorityCounts = await MaterialRequirement.aggregate([
      { $match: query },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // 待处理需求（给采购专员）
    const pendingForProcurement = await MaterialRequirement.countDocuments({
      ...query,
      status: '已提交'
    });

    // 我负责的需求（给采购专员）
    let myRequirements = 0;
    if (req.user.role === 'Procurement Specialist') {
      myRequirements = await MaterialRequirement.countDocuments({
        assigned_to: req.user._id,
        status: { $in: ['采购中', '部分完成'] }
      });
    }

    // 紧急需求
    const urgentRequirements = await MaterialRequirement.countDocuments({
      ...query,
      priority: 'Urgent',
      status: { $nin: ['已完成', '已取消'] }
    });

    // 即将到期的需求（7天内需要到货）
    const upcomingDeadline = new Date();
    upcomingDeadline.setDate(upcomingDeadline.getDate() + 7);
    
    const upcomingRequirements = await MaterialRequirement.countDocuments({
      ...query,
      status: { $nin: ['已完成', '已取消'] },
      required_delivery_date: { $lte: upcomingDeadline, $gte: new Date() }
    });

    // 总预估金额
    const totalEstimatedAmount = await MaterialRequirement.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$statistics.total_estimated_amount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        priorityCounts: priorityCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        pendingForProcurement,
        myRequirements,
        urgentRequirements,
        upcomingRequirements,
        totalEstimatedAmount: totalEstimatedAmount[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/material-requirements/:id
 * @desc    获取单个物料需求详情
 * @access  生产计划员、采购专员、管理员
 */
router.get('/:id', authorize('Administrator', 'Production Planner', 'Procurement Specialist'), async (req, res) => {
  try {
    const requirement = await MaterialRequirement.findById(req.params.id)
      .populate('production_order')
      .populate('created_by', 'full_name phone department')
      .populate('assigned_to', 'full_name phone department')
      .populate('items.suggested_supplier')
      .populate('items.purchase_order')
      .populate('purchase_orders')
      .populate('follow_ups.user', 'full_name');

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: '物料需求不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: requirement
    });
  } catch (error) {
    console.error('获取物料需求详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取物料需求详情失败',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/material-requirements
 * @desc    创建物料需求
 * @access  生产计划员、管理员
 */
router.post('/', authorize('Administrator', 'Production Planner'), async (req, res) => {
  try {
    const requirementData = {
      ...req.body,
      created_by: req.user._id
    };

    // 如果有生产订单，获取快照信息
    if (requirementData.production_order) {
      const productionOrder = await ProductionOrder.findById(requirementData.production_order);
      if (productionOrder) {
        requirementData.production_order_snapshot = {
          order_number: productionOrder.productionOrderNumber,
          sales_order_number: productionOrder.orderSnapshot?.orderNumber,
          client_name: productionOrder.orderSnapshot?.clientName,
          project_name: productionOrder.orderSnapshot?.projectName,
          priority: productionOrder.priority
        };
        // 继承生产订单的优先级
        if (!requirementData.priority) {
          requirementData.priority = productionOrder.priority;
        }
      }
    }

    const requirement = await MaterialRequirement.create(requirementData);

    res.status(201).json({
      success: true,
      message: '物料需求创建成功',
      data: requirement
    });
  } catch (error) {
    console.error('创建物料需求失败:', error);
    res.status(500).json({
      success: false,
      message: '创建物料需求失败',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/material-requirements/:id
 * @desc    更新物料需求
 * @access  生产计划员、采购专员、管理员
 */
router.put('/:id', authorize('Administrator', 'Production Planner', 'Procurement Specialist'), async (req, res) => {
  try {
    const requirement = await MaterialRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: '物料需求不存在'
      });
    }

    // 权限检查：生产计划员只能修改自己创建的草稿
    if (req.user.role === 'Production Planner') {
      if (requirement.created_by.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: '您只能修改自己创建的物料需求'
        });
      }
      if (requirement.status !== '草稿') {
        return res.status(403).json({
          success: false,
          message: '只能修改草稿状态的物料需求'
        });
      }
    }

    // 更新数据
    Object.assign(requirement, req.body);
    await requirement.save();

    res.status(200).json({
      success: true,
      message: '物料需求更新成功',
      data: requirement
    });
  } catch (error) {
    console.error('更新物料需求失败:', error);
    res.status(500).json({
      success: false,
      message: '更新物料需求失败',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/material-requirements/:id/submit
 * @desc    提交物料需求给采购部门
 * @access  生产计划员、管理员
 */
router.post('/:id/submit', authorize('Administrator', 'Production Planner'), async (req, res) => {
  try {
    const requirement = await MaterialRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: '物料需求不存在'
      });
    }

    if (requirement.status !== '草稿') {
      return res.status(400).json({
        success: false,
        message: '只能提交草稿状态的物料需求'
      });
    }

    requirement.submitToProcurement();
    requirement.addFollowUp('物料需求已提交给采购部门', '状态更新', req.user._id);
    await requirement.save();

    res.status(200).json({
      success: true,
      message: '物料需求已成功提交给采购部门',
      data: requirement
    });
  } catch (error) {
    console.error('提交物料需求失败:', error);
    res.status(500).json({
      success: false,
      message: '提交物料需求失败',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/material-requirements/:id/accept
 * @desc    采购专员接单
 * @access  采购专员、管理员
 */
router.post('/:id/accept', authorize('Administrator', 'Procurement Specialist'), async (req, res) => {
  try {
    const requirement = await MaterialRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: '物料需求不存在'
      });
    }

    if (requirement.status !== '已提交') {
      return res.status(400).json({
        success: false,
        message: '只能接单已提交状态的物料需求'
      });
    }

    requirement.acceptByProcurement(req.user._id);
    requirement.addFollowUp(`采购专员 ${req.user.full_name} 已接单`, '状态更新', req.user._id);
    await requirement.save();

    res.status(200).json({
      success: true,
      message: '已成功接单',
      data: requirement
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
 * @route   POST /api/material-requirements/:id/follow-up
 * @desc    添加跟进记录
 * @access  生产计划员、采购专员、管理员
 */
router.post('/:id/follow-up', authorize('Administrator', 'Production Planner', 'Procurement Specialist'), async (req, res) => {
  try {
    const { content, follow_up_type } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '请提供跟进内容'
      });
    }

    const requirement = await MaterialRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: '物料需求不存在'
      });
    }

    requirement.addFollowUp(content, follow_up_type || '状态更新', req.user._id);
    await requirement.save();

    res.status(200).json({
      success: true,
      message: '跟进记录添加成功',
      data: requirement
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
 * @route   POST /api/material-requirements/:id/update-item-status
 * @desc    更新物料项目状态
 * @access  采购专员、管理员
 */
router.post('/:id/update-item-status', authorize('Administrator', 'Procurement Specialist'), async (req, res) => {
  try {
    const { item_id, procurement_status, purchase_order } = req.body;

    const requirement = await MaterialRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: '物料需求不存在'
      });
    }

    const item = requirement.items.id(item_id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '物料项目不存在'
      });
    }

    if (procurement_status) {
      item.procurement_status = procurement_status;
    }
    if (purchase_order) {
      item.purchase_order = purchase_order;
      // 将采购订单添加到关联列表
      if (!requirement.purchase_orders.includes(purchase_order)) {
        requirement.purchase_orders.push(purchase_order);
      }
    }

    await requirement.save();

    res.status(200).json({
      success: true,
      message: '物料状态更新成功',
      data: requirement
    });
  } catch (error) {
    console.error('更新物料状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新物料状态失败',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/material-requirements/:id
 * @desc    删除物料需求
 * @access  管理员、生产计划员（仅草稿）
 */
router.delete('/:id', authorize('Administrator', 'Production Planner'), async (req, res) => {
  try {
    const requirement = await MaterialRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: '物料需求不存在'
      });
    }

    // 生产计划员只能删除自己创建的草稿
    if (req.user.role === 'Production Planner') {
      if (requirement.created_by.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: '您只能删除自己创建的物料需求'
        });
      }
      if (requirement.status !== '草稿') {
        return res.status(403).json({
          success: false,
          message: '只能删除草稿状态的物料需求'
        });
      }
    }

    await MaterialRequirement.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: '物料需求删除成功'
    });
  } catch (error) {
    console.error('删除物料需求失败:', error);
    res.status(500).json({
      success: false,
      message: '删除物料需求失败',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/material-requirements/:id/create-purchase-order
 * @desc    从物料需求创建采购订单
 * @access  采购专员、管理员
 */
router.post('/:id/create-purchase-order', authorize('Administrator', 'Procurement Specialist'), async (req, res) => {
  try {
    const { supplier_id, item_ids, expected_delivery_date, payment_terms, notes } = req.body;

    const requirement = await MaterialRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: '物料需求不存在'
      });
    }

    // 筛选选中的物料项目
    const selectedItems = requirement.items.filter(item => 
      item_ids.includes(item._id.toString())
    );

    if (selectedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择至少一个物料项目'
      });
    }

    // 构建采购订单数据
    const purchaseOrderData = {
      supplier_id,
      items: selectedItems.map(item => ({
        product_name: item.material_name,
        product_code: item.material_code,
        specification: item.specification,
        quantity: item.purchase_quantity,
        unit: item.unit,
        unit_price: item.estimated_unit_price || 0,
        subtotal: (item.purchase_quantity || 0) * (item.estimated_unit_price || 0),
        notes: item.notes
      })),
      expected_delivery_date,
      payment_terms,
      notes: notes || `物料需求单号: ${requirement.requirement_number}`,
      created_by: req.user._id,
      status: '草稿 (Draft)'
    };

    // 创建采购订单
    const purchaseOrder = await PurchaseOrder.create(purchaseOrderData);

    // 更新物料需求中的关联
    for (const itemId of item_ids) {
      const item = requirement.items.id(itemId);
      if (item) {
        item.purchase_order = purchaseOrder._id;
        item.procurement_status = '已下单';
      }
    }

    // 添加采购订单到关联列表
    requirement.purchase_orders.push(purchaseOrder._id);
    requirement.addFollowUp(
      `已创建采购订单 ${purchaseOrder.order_number}，包含 ${selectedItems.length} 个物料项目`,
      '状态更新',
      req.user._id
    );
    await requirement.save();

    res.status(201).json({
      success: true,
      message: '采购订单创建成功',
      data: {
        purchase_order: purchaseOrder,
        requirement
      }
    });
  } catch (error) {
    console.error('创建采购订单失败:', error);
    res.status(500).json({
      success: false,
      message: '创建采购订单失败',
      error: error.message
    });
  }
});

module.exports = router;

