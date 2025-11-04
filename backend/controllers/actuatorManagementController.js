/**
 * Actuator数据管理控制器
 * 提供Actuator的完整CRUD和批量导入功能
 */

const Actuator = require('../models/Actuator');
const { createCrudController } = require('./dataManagementController');
const { processActuatorCsv, validateActuatorData } = require('../utils/actuatorCsvProcessor');
const { parseFile } = require('../utils/dataImporter');

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
    
    // 统计有价格的产品数量（常温、低温或高温任一价格存在即可）
    const withPrice = await Actuator.countDocuments({ 
      $or: [
        { base_price_normal: { $exists: true, $ne: null, $gt: 0 } },
        { base_price_low: { $exists: true, $ne: null, $gt: 0 } },
        { base_price_high: { $exists: true, $ne: null, $gt: 0 } }
      ]
    });
    const withoutPrice = totalCount - withPrice;
    
    const bySeries = await Actuator.aggregate([
      { $group: { _id: '$series', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const byActionType = await Actuator.aggregate([
      { $group: { _id: '$action_type', count: { $sum: 1 } } }
    ]);
    const byStatus = await Actuator.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      statistics: {
        totalCount,
        withPrice,
        withoutPrice,
        bySeries,
        byActionType,
        byStatus
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

// 专门的执行器CSV导入方法（支持AT/GY和SF格式）
actuatorController.bulkImportCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传CSV文件'
      });
    }
    
    // 1. 解析CSV文件
    const rawData = await parseFile(req.file.buffer, req.file.originalname);
    
    if (!rawData || rawData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV文件为空或无法解析'
      });
    }
    
    // 2. 使用专门的处理器处理AT/GY和SF格式
    const processingResult = processActuatorCsv(rawData);
    
    if (!processingResult.success) {
      return res.status(400).json(processingResult);
    }
    
    // 3. 导入到数据库
    const results = {
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      errors: [],
      skipped: []
    };
    
    const updateOnDuplicate = req.body.updateOnDuplicate === 'true';
    
    for (let i = 0; i < processingResult.processed.length; i++) {
      const actuatorData = processingResult.processed[i];
      const rowNumber = i + 2; // Excel/CSV行号（考虑标题行）
      
      try {
        // 验证数据
        const validationErrors = validateActuatorData(actuatorData);
        if (validationErrors && validationErrors.length > 0) {
          results.errors.push(`第${rowNumber}行 (${actuatorData.model_base}): ${validationErrors.join(', ')}`);
          results.errorCount++;
          continue;
        }
        
        // 检查是否已存在
        const existing = await Actuator.findOne({ model_base: actuatorData.model_base });
        
        if (existing) {
          if (updateOnDuplicate) {
            // 更新现有记录
            Object.assign(existing, actuatorData);
            existing.updated_at = new Date();
            await existing.save();
            results.successCount++;
          } else {
            // 跳过重复记录
            results.skipped.push(`第${rowNumber}行: 执行器 ${actuatorData.model_base} 已存在`);
            results.skippedCount++;
          }
        } else {
          // 创建新记录
          await Actuator.create(actuatorData);
          results.successCount++;
        }
      } catch (error) {
        results.errors.push(`第${rowNumber}行 (${actuatorData.model_base}): ${error.message}`);
        results.errorCount++;
      }
    }
    
    // 4. 返回结果
    res.json({
      success: true,
      message: '导入完成',
      data: results,
      summary: {
        totalRows: rawData.length,
        processed: processingResult.processed.length,
        processingErrors: processingResult.errors.length,
        imported: results.successCount,
        failed: results.errorCount,
        skipped: results.skippedCount
      }
    });
  } catch (error) {
    console.error('CSV导入失败:', error);
    res.status(500).json({
      success: false,
      message: '导入失败',
      error: error.message
    });
  }
};

module.exports = actuatorController;

