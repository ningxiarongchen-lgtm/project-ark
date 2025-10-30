const Supplier = require('../models/Supplier');

/**
 * @desc    获取所有供应商
 * @route   GET /api/suppliers
 * @access  Private
 */
exports.getSuppliers = async (req, res) => {
  try {
    const { status, rating, search, sort = '-createdAt', page = 1, limit = 10 } = req.query;
    
    // 构建查询条件
    let query = {};
    
    // 状态筛选
    if (status) {
      query.status = status;
    }
    
    // 评级筛选
    if (rating) {
      query.rating = { $gte: parseInt(rating) };
    }
    
    // 搜索（名称、联系人、业务范围）
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact_person: { $regex: search, $options: 'i' } },
        { business_scope: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 执行查询
    const suppliers = await Supplier.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // 获取总数
    const total = await Supplier.countDocuments(query);
    
    res.json({
      success: true,
      data: suppliers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取供应商列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取供应商列表失败',
      error: error.message
    });
  }
};

/**
 * @desc    获取单个供应商
 * @route   GET /api/suppliers/:id
 * @access  Private
 */
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: '供应商不存在'
      });
    }
    
    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('获取供应商详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取供应商详情失败',
      error: error.message
    });
  }
};

/**
 * @desc    创建供应商
 * @route   POST /api/suppliers
 * @access  Private (Admin only)
 */
exports.createSupplier = async (req, res) => {
  try {
    const {
      name,
      contact_person,
      phone,
      email,
      address,
      business_scope,
      rating,
      notes,
      status
    } = req.body;
    
    // 验证必需字段
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '供应商名称不能为空'
      });
    }
    
    // 检查是否已存在同名供应商
    const existingSupplier = await Supplier.findOne({ name });
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: '该供应商名称已存在'
      });
    }
    
    // 创建供应商
    const supplier = await Supplier.create({
      name,
      contact_person,
      phone,
      email,
      address,
      business_scope,
      rating,
      notes,
      status
    });
    
    res.status(201).json({
      success: true,
      message: '供应商创建成功',
      data: supplier
    });
  } catch (error) {
    console.error('创建供应商失败:', error);
    res.status(500).json({
      success: false,
      message: '创建供应商失败',
      error: error.message
    });
  }
};

/**
 * @desc    更新供应商
 * @route   PUT /api/suppliers/:id
 * @access  Private (Admin only)
 */
exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: '供应商不存在'
      });
    }
    
    // 如果更改名称，检查是否与其他供应商重名
    if (req.body.name && req.body.name !== supplier.name) {
      const existingSupplier = await Supplier.findOne({ 
        name: req.body.name,
        _id: { $ne: req.params.id }
      });
      
      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          message: '该供应商名称已存在'
        });
      }
    }
    
    // 更新供应商
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.json({
      success: true,
      message: '供应商更新成功',
      data: updatedSupplier
    });
  } catch (error) {
    console.error('更新供应商失败:', error);
    res.status(500).json({
      success: false,
      message: '更新供应商失败',
      error: error.message
    });
  }
};

/**
 * @desc    删除供应商
 * @route   DELETE /api/suppliers/:id
 * @access  Private (Admin only)
 */
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: '供应商不存在'
      });
    }
    
    await Supplier.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: '供应商删除成功',
      data: {}
    });
  } catch (error) {
    console.error('删除供应商失败:', error);
    res.status(500).json({
      success: false,
      message: '删除供应商失败',
      error: error.message
    });
  }
};

/**
 * @desc    更新供应商状态
 * @route   PATCH /api/suppliers/:id/status
 * @access  Private (Admin only)
 */
exports.updateSupplierStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'blacklisted'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }
    
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: '供应商不存在'
      });
    }
    
    res.json({
      success: true,
      message: '供应商状态更新成功',
      data: supplier
    });
  } catch (error) {
    console.error('更新供应商状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新供应商状态失败',
      error: error.message
    });
  }
};

/**
 * @desc    更新供应商评级
 * @route   PATCH /api/suppliers/:id/rating
 * @access  Private
 */
exports.updateSupplierRating = async (req, res) => {
  try {
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '评级必须在1-5之间'
      });
    }
    
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { rating },
      { new: true }
    );
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: '供应商不存在'
      });
    }
    
    res.json({
      success: true,
      message: '供应商评级更新成功',
      data: supplier
    });
  } catch (error) {
    console.error('更新供应商评级失败:', error);
    res.status(500).json({
      success: false,
      message: '更新供应商评级失败',
      error: error.message
    });
  }
};

/**
 * @desc    获取供应商统计
 * @route   GET /api/suppliers/stats/summary
 * @access  Private
 */
exports.getSupplierStats = async (req, res) => {
  try {
    const total = await Supplier.countDocuments();
    const active = await Supplier.countDocuments({ status: 'active' });
    const inactive = await Supplier.countDocuments({ status: 'inactive' });
    const blacklisted = await Supplier.countDocuments({ status: 'blacklisted' });
    
    // 按评级统计
    const ratingStats = await Supplier.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    
    // 平均评级
    const avgRatingResult = await Supplier.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' }
        }
      }
    ]);
    
    const avgRating = avgRatingResult.length > 0 
      ? avgRatingResult[0].avgRating.toFixed(2) 
      : 0;
    
    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        blacklisted,
        avgRating: parseFloat(avgRating),
        ratingDistribution: ratingStats
      }
    });
  } catch (error) {
    console.error('获取供应商统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取供应商统计失败',
      error: error.message
    });
  }
};

