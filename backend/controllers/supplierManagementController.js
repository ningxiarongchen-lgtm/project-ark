/**
 * Supplier数据管理控制器
 * 提供Supplier的完整CRUD和批量导入功能
 */

const Supplier = require('../models/Supplier');
const { createCrudController } = require('./dataManagementController');

// 自定义验证逻辑
function validateSupplier(data) {
  const errors = [];
  
  // 验证评级
  if (data.rating && (data.rating < 1 || data.rating > 5)) {
    errors.push('评级必须在1-5之间');
  }
  
  // 验证交付率
  if (data.on_time_delivery_rate && (data.on_time_delivery_rate < 0 || data.on_time_delivery_rate > 100)) {
    errors.push('准时交付率必须在0-100之间');
  }
  
  return errors.length > 0 ? errors : null;
}

// 创建Supplier CRUD控制器
const supplierController = createCrudController(Supplier, {
  populateFields: [],
  searchFields: ['name', 'contact_person', 'business_scope'],
  uniqueField: null,
  customValidation: validateSupplier
});

// 添加额外的Supplier特定方法
supplierController.getByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    const suppliers = await Supplier.find({ status })
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: suppliers,
      count: suppliers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询失败',
      error: error.message
    });
  }
};

supplierController.getTopSuppliers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const topSuppliers = await Supplier.find({ status: 'active' })
      .sort({ total_transaction_value: -1, rating: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: topSuppliers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询失败',
      error: error.message
    });
  }
};

supplierController.getStatistics = async (req, res) => {
  try {
    const totalCount = await Supplier.countDocuments();
    const byStatus = await Supplier.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const byCertification = await Supplier.aggregate([
      { $group: { _id: '$certification_status', count: { $sum: 1 } } }
    ]);
    const avgRating = await Supplier.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const avgDeliveryRate = await Supplier.aggregate([
      { $group: { _id: null, avgRate: { $avg: '$on_time_delivery_rate' } } }
    ]);
    
    res.json({
      success: true,
      statistics: {
        totalCount,
        byStatus,
        byCertification,
        avgRating: avgRating[0]?.avgRating || 0,
        avgDeliveryRate: avgDeliveryRate[0]?.avgRate || 0
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

module.exports = supplierController;

