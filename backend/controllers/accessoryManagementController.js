/**
 * Accessory数据管理控制器
 * 提供Accessory的完整CRUD和批量导入功能
 */

const Accessory = require('../models/Accessory');
const { createCrudController } = require('./dataManagementController');

// 自定义验证逻辑
function validateAccessory(data) {
  const errors = [];
  
  // 验证定价模式和价格
  if (data.pricing_model === 'fixed' && !data.base_price && !data.price) {
    errors.push('固定定价模式下，base_price 或 price 是必填项');
  }
  
  if (data.pricing_model === 'tiered' && (!data.price_tiers || data.price_tiers.length === 0)) {
    errors.push('阶梯定价模式下，price_tiers 是必填项');
  }
  
  return errors.length > 0 ? errors : null;
}

// 创建Accessory CRUD控制器
const accessoryController = createCrudController(Accessory, {
  populateFields: [],
  searchFields: ['name', 'category', 'manufacturer', 'model_number'],
  uniqueField: null,
  customValidation: validateAccessory
});

// 添加额外的Accessory特定方法
accessoryController.getByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const accessories = await Accessory.find({ category })
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: accessories,
      count: accessories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询失败',
      error: error.message
    });
  }
};

accessoryController.checkLowStock = async (req, res) => {
  try {
    const lowStockItems = await Accessory.find({
      $expr: { $lte: ['$stock_quantity', '$reorder_level'] }
    }).sort({ stock_quantity: 1 });
    
    res.json({
      success: true,
      data: lowStockItems,
      count: lowStockItems.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询失败',
      error: error.message
    });
  }
};

accessoryController.getStatistics = async (req, res) => {
  try {
    const totalCount = await Accessory.countDocuments();
    
    // 统计有价格的配件数量（常温、低温或高温任一价格存在即可）
    const withPrice = await Accessory.countDocuments({
      $or: [
        { base_price_normal: { $exists: true, $ne: null, $gt: 0 } },
        { base_price_low: { $exists: true, $ne: null, $gt: 0 } },
        { base_price_high: { $exists: true, $ne: null, $gt: 0 } }
      ]
    });
    const withoutPrice = totalCount - withPrice;
    
    const byCategory = await Accessory.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // 计算库存总价值（使用常温价格）
    const totalStockValue = await Accessory.aggregate([
      {
        $project: {
          stockValue: {
            $multiply: [
              { $ifNull: ['$stock_info.quantity', 0] },
              { $ifNull: ['$base_price_normal', 0] }
            ]
          }
        }
      },
      { $group: { _id: null, totalValue: { $sum: '$stockValue' } } }
    ]);
    
    res.json({
      success: true,
      statistics: {
        totalCount,
        withPrice,
        withoutPrice,
        byCategory,
        totalStockValue: totalStockValue[0]?.totalValue || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
};

module.exports = accessoryController;

