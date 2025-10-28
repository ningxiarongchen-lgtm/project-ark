/**
 * Actuator数据管理控制器
 * 提供Actuator的完整CRUD和批量导入功能
 */

const Actuator = require('../models/Actuator');
const { createCrudController } = require('./dataManagementController');

// 自定义验证逻辑
function validateActuator(data) {
  const errors = [];
  
  // 验证定价模式和价格
  if (data.pricing_model === 'fixed' && !data.base_price) {
    errors.push('固定定价模式下，base_price 是必填项');
  }
  
  if (data.pricing_model === 'tiered' && (!data.price_tiers || data.price_tiers.length === 0)) {
    errors.push('阶梯定价模式下，price_tiers 是必填项');
  }
  
  // 验证作用类型和弹簧范围
  if (data.action_type === 'SR' && !data.spring_range) {
    errors.push('弹簧复位(SR)类型必须提供spring_range');
  }
  
  return errors.length > 0 ? errors : null;
}

// 创建Actuator CRUD控制器
const actuatorController = createCrudController(Actuator, {
  populateFields: ['supplier_id'],
  searchFields: ['model_base', 'series', 'body_size'],
  uniqueField: 'model_base',
  customValidation: validateActuator
});

// 添加额外的Actuator特定方法
actuatorController.getByTorqueRequirement = async (req, res) => {
  try {
    const {
      required_torque,
      working_pressure,
      working_angle = 90,
      yoke_type = 'symmetric'
    } = req.query;
    
    if (!required_torque) {
      return res.status(400).json({
        success: false,
        message: '请提供required_torque参数'
      });
    }
    
    // 调用模型的静态方法
    const suitableActuators = await Actuator.findByTorqueRequirement(
      parseFloat(required_torque),
      parseFloat(working_pressure),
      parseInt(working_angle),
      yoke_type
    );
    
    res.json({
      success: true,
      data: suitableActuators,
      count: suitableActuators.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询失败',
      error: error.message
    });
  }
};

actuatorController.getBySeries = async (req, res) => {
  try {
    const { series } = req.params;
    
    const actuators = await Actuator.find({ series: series.toUpperCase() })
      .populate('supplier_id')
      .sort({ body_size: 1 });
    
    res.json({
      success: true,
      data: actuators,
      count: actuators.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询失败',
      error: error.message
    });
  }
};

actuatorController.getStatistics = async (req, res) => {
  try {
    const totalCount = await Actuator.countDocuments();
    const bySeries = await Actuator.aggregate([
      { $group: { _id: '$series', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const byActionType = await Actuator.aggregate([
      { $group: { _id: '$action_type', count: { $sum: 1 } } }
    ]);
    const byPricingModel = await Actuator.aggregate([
      { $group: { _id: '$pricing_model', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      statistics: {
        totalCount,
        bySeries,
        byActionType,
        byPricingModel
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

module.exports = actuatorController;

