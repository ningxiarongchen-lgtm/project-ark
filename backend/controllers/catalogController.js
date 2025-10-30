const Actuator = require('../models/Actuator');
const ManualOverride = require('../models/ManualOverride');
const Accessory = require('../models/Accessory');

/**
 * 产品目录控制器 - 为销售经理提供无价格信息的产品数据
 */

// 清理价格字段的辅助函数
const removePriceFields = (product) => {
  const { 
    price_tiers, 
    base_price_cny, 
    base_price_usd,
    cost_price,
    price,
    unit_price,
    base_price_normal,
    base_price_low,
    base_price_high,
    __v,
    ...safeProduct 
  } = product;
  
  // 正确映射库存字段：从 stock_info.quantity 到 inventory_quantity
  const inventoryQuantity = product.stock_info?.quantity || 0;
  
  // 保持原始状态或设置默认值
  const status = product.status || 'active';
  
  return {
    ...safeProduct,
    inventory_quantity: inventoryQuantity,
    status: status
  };
};

/**
 * @route   GET /api/catalog/products
 * @desc    获取产品目录（无价格信息）- 销售经理专用 - 包含所有产品类型
 * @access  Private (Sales Manager, Administrator)
 */
exports.getProductCatalog = async (req, res) => {
  try {
    // 🔹 并行读取所有产品数据库
    const [actuators, manualOverrides, accessories] = await Promise.all([
      // 1️⃣ 执行器
      Actuator.find()
        .select('-price_tiers -base_price_cny -base_price_usd -__v')
        .sort({ series: 1, model_base: 1 })
        .lean(),
      
      // 2️⃣ 手动操作装置
      ManualOverride.find()
        .select('-price_tiers -base_price_cny -base_price_usd -price -__v')
        .sort({ model: 1 })
        .lean(),
      
      // 3️⃣ 附件
      Accessory.find()
        .select('-price -unit_price -__v')
        .sort({ category: 1, name: 1 })
        .lean()
    ]);

    // 🔒 清理并标记产品类型
    const sanitizedActuators = actuators.map(p => ({
      ...removePriceFields(p),
      product_type: '执行器',
      product_category: 'actuator'
    }));

    const sanitizedManualOverrides = manualOverrides.map(p => ({
      ...removePriceFields(p),
      product_type: '手动操作装置',
      product_category: 'manual_override',
      model_base: p.model // 统一字段名
    }));

    const sanitizedAccessories = accessories.map(p => ({
      ...removePriceFields(p),
      product_type: '附件',
      product_category: 'accessory',
      model_base: p.name // 统一字段名，方便前端显示
    }));

    // 🔹 合并所有产品
    const allProducts = [
      ...sanitizedActuators,
      ...sanitizedManualOverrides,
      ...sanitizedAccessories
    ];

    res.json({
      success: true,
      count: allProducts.length,
      summary: {
        actuators: sanitizedActuators.length,
        manual_overrides: sanitizedManualOverrides.length,
        accessories: sanitizedAccessories.length,
        total: allProducts.length
      },
      data: allProducts
    });
  } catch (error) {
    console.error('获取产品目录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取产品目录失败',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/catalog/products/:id
 * @desc    获取单个产品详情（无价格信息）
 * @access  Private (Sales Manager, Administrator)
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Actuator.findById(req.params.id)
      .select('-price_tiers -base_price_cny -base_price_usd -__v')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }

    // 清理价格字段
    const { 
      price_tiers, 
      base_price_cny, 
      base_price_usd,
      cost_price,
      ...safeProduct 
    } = product;

    res.json({
      success: true,
      data: {
        ...safeProduct,
        inventory_quantity: product.inventory_quantity || 0,
        status: product.status || 'active'
      }
    });
  } catch (error) {
    console.error('获取产品详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取产品详情失败',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/catalog/search
 * @desc    搜索产品（无价格信息）
 * @access  Private (Sales Manager, Administrator)
 */
exports.searchProducts = async (req, res) => {
  try {
    const { 
      keyword, 
      series, 
      action_type, 
      yoke_type,
      min_torque,
      max_torque 
    } = req.query;

    // 构建查询条件
    let query = {};

    // 关键词搜索（型号、系列）
    if (keyword) {
      query.$or = [
        { model_base: { $regex: keyword, $options: 'i' } },
        { series: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 按系列筛选
    if (series) {
      query.series = series;
    }

    // 按作用类型筛选
    if (action_type) {
      query.action_type = action_type;
    }

    // 按轭架类型筛选
    if (yoke_type) {
      query.yoke_type = yoke_type;
    }

    // 按扭矩范围筛选
    if (min_torque || max_torque) {
      query.output_torque = {};
      if (min_torque) query.output_torque.$gte = Number(min_torque);
      if (max_torque) query.output_torque.$lte = Number(max_torque);
    }

    const products = await Actuator.find(query)
      .select('-price_tiers -base_price_cny -base_price_usd -__v')
      .sort({ series: 1, output_torque: 1 })
      .lean();

    // 清理价格字段
    const sanitizedProducts = products.map(product => {
      const { 
        price_tiers, 
        base_price_cny, 
        base_price_usd,
        cost_price,
        ...safeProduct 
      } = product;
      
      return {
        ...safeProduct,
        inventory_quantity: product.inventory_quantity || 0,
        status: product.status || 'active'
      };
    });

    res.json({
      success: true,
      count: sanitizedProducts.length,
      data: sanitizedProducts
    });
  } catch (error) {
    console.error('搜索产品失败:', error);
    res.status(500).json({
      success: false,
      message: '搜索产品失败',
      error: error.message
    });
  }
};

