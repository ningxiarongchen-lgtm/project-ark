/**
 * AT和GY系列执行器价格数据更新脚本
 * 
 * 功能：批量更新 AT 和 GY 系列执行器的价格、手轮和维修套件信息
 * 
 * 使用方法：
 * node backend/scripts/updateATGYPricing.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Actuator = require('../models/Actuator');
const connectDB = require('../config/database');

// 导入价格数据
const { all_at_gy_data } = require('./at_gy_pricing_data');

/**
 * 映射作用类型
 */
function mapActionType(type) {
  if (type === 'Single Acting') return 'SR';
  if (type === 'Double Acting') return 'DA';
  return type;
}

/**
 * 更新价格数据
 */
const updatePricing = async () => {
  try {
    // 连接数据库
    await connectDB();
    console.log('✅ 数据库连接成功...\n');

    let updatedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log('========== 开始更新 AT/GY 系列价格数据 ==========\n');
    console.log(`总计需要更新: ${all_at_gy_data.length} 个型号\n`);

    // 遍历所有型号数据
    for (const data of all_at_gy_data) {
      const { model, series, type, material, pricing, handwheel, repairKit } = data;

      try {
        // 准备更新的数据
        const updateData = {
          series: series,
          action_type: mapActionType(type),
          mechanism: 'Rack & Pinion',
        };

        // 更新材质信息
        if (material) {
          updateData['specifications.materials.body'] = material;
        }

        // AT 系列：更新常温、低温、高温价格
        if (series === 'AT' && pricing) {
          if (pricing.standardTemp !== undefined) {
            updateData.base_price_normal = pricing.standardTemp;
          }
          if (pricing.lowTemp !== undefined) {
            updateData.base_price_low = pricing.lowTemp;
          }
          if (pricing.highTemp !== undefined) {
            updateData.base_price_high = pricing.highTemp;
          }
        }

        // GY 系列：只更新常温价格
        if (series === 'GY' && pricing && pricing.standardTemp !== undefined) {
          updateData.base_price_normal = pricing.standardTemp;
        }

        // 更新手轮信息（仅 AT 系列）
        if (handwheel) {
          updateData.manual_override_options = [{
            override_model: handwheel.model,
            additional_price: handwheel.surcharge,
            description: `手轮型号: ${handwheel.model}`
          }];
        }

        // 更新维修套件信息（仅 AT 系列）
        if (repairKit) {
          updateData['spare_parts.seal_kit_price'] = repairKit.price;
          if (repairKit.description) {
            updateData['spare_parts.seal_kit_description'] = repairKit.description;
          }
        }

        // 在数据库中查找并更新执行器
        const actuator = await Actuator.findOneAndUpdate(
          { 
            model_base: { 
              $regex: new RegExp(`^${model}`, 'i') 
            } 
          },
          { 
            $set: updateData 
          },
          { 
            new: true,
            runValidators: false,
            upsert: false // 不自动创建新记录
          }
        );

        if (actuator) {
          updatedCount++;
          console.log(`✅ 成功更新型号: ${model} - ¥${pricing.standardTemp || pricing.standardTemp}`);
        } else {
          notFoundCount++;
          console.warn(`⚠️  未找到型号: ${model}`);
          errors.push({ model, error: '数据库中不存在该型号' });
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ 更新 ${model} 时出错:`, error.message);
        errors.push({ model, error: error.message });
      }
    }

    // 输出统计信息
    console.log('\n========== 价格数据更新完成 ==========');
    console.log(`✅ 成功更新: ${updatedCount} 个型号`);
    console.log(`⚠️  未找到型号: ${notFoundCount} 个型号`);
    console.log(`❌ 更新失败: ${errorCount} 个型号`);
    console.log(`📊 总计处理: ${all_at_gy_data.length} 个型号`);
    console.log(`📈 成功率: ${((updatedCount / all_at_gy_data.length) * 100).toFixed(2)}%`);

    // 如果有错误，输出详细信息
    if (errors.length > 0) {
      console.log('\n========== 错误详情 ==========');
      errors.forEach(err => {
        console.log(`- ${err.model}: ${err.error}`);
      });
    }

    // 验证更新结果
    console.log('\n========== 验证更新结果 ==========');
    await validatePricing();

    // 显示价格统计
    console.log('\n========== 价格统计 ==========');
    await showPriceStatistics();

  } catch (err) {
    console.error('❌ 脚本执行出错:', err.message);
    console.error(err.stack);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('\n✅ 已断开数据库连接');
  }
};

/**
 * 验证价格数据完整性
 */
async function validatePricing() {
  try {
    // 查询 AT 系列
    const atActuators = await Actuator.find({ 
      series: 'AT',
      is_active: true 
    });
    
    console.log(`\n找到 ${atActuators.length} 个 AT 系列执行器`);
    
    let atValid = 0;
    let atInvalid = 0;
    
    for (const actuator of atActuators) {
      const hasPricing = actuator.base_price_normal && 
                        actuator.base_price_low && 
                        actuator.base_price_high;
      
      if (hasPricing) {
        atValid++;
      } else {
        console.warn(`⚠️  ${actuator.model_base}: 价格数据不完整`);
        atInvalid++;
      }
    }
    
    console.log(`AT系列验证结果: ✅ ${atValid} 个完整, ⚠️ ${atInvalid} 个不完整`);
    
    // 查询 GY 系列
    const gyActuators = await Actuator.find({ 
      series: 'GY',
      is_active: true 
    });
    
    console.log(`\n找到 ${gyActuators.length} 个 GY 系列执行器`);
    
    let gyValid = 0;
    let gyInvalid = 0;
    
    for (const actuator of gyActuators) {
      if (actuator.base_price_normal) {
        gyValid++;
      } else {
        console.warn(`⚠️  ${actuator.model_base}: 缺少价格数据`);
        gyInvalid++;
      }
    }
    
    console.log(`GY系列验证结果: ✅ ${gyValid} 个完整, ⚠️ ${gyInvalid} 个不完整`);
    
  } catch (error) {
    console.error('验证过程出错:', error.message);
  }
}

/**
 * 显示价格统计信息
 */
async function showPriceStatistics() {
  try {
    // AT 系列价格统计
    const atStats = await Actuator.aggregate([
      { $match: { series: 'AT', is_active: true, base_price_normal: { $exists: true } } },
      { $group: {
        _id: '$action_type',
        count: { $sum: 1 },
        avgPrice: { $avg: '$base_price_normal' },
        minPrice: { $min: '$base_price_normal' },
        maxPrice: { $max: '$base_price_normal' }
      }}
    ]);
    
    console.log('\nAT系列价格统计:');
    atStats.forEach(stat => {
      console.log(`  ${stat._id === 'DA' ? '双作用' : '单作用'}:`);
      console.log(`    数量: ${stat.count}`);
      console.log(`    均价: ¥${stat.avgPrice.toFixed(2)}`);
      console.log(`    最低: ¥${stat.minPrice}`);
      console.log(`    最高: ¥${stat.maxPrice}`);
    });
    
    // GY 系列价格统计
    const gyStats = await Actuator.aggregate([
      { $match: { series: 'GY', is_active: true, base_price_normal: { $exists: true } } },
      { $group: {
        _id: '$action_type',
        count: { $sum: 1 },
        avgPrice: { $avg: '$base_price_normal' },
        minPrice: { $min: '$base_price_normal' },
        maxPrice: { $max: '$base_price_normal' }
      }}
    ]);
    
    console.log('\nGY系列价格统计:');
    gyStats.forEach(stat => {
      console.log(`  ${stat._id === 'DA' ? '双作用' : '单作用'}:`);
      console.log(`    数量: ${stat.count}`);
      console.log(`    均价: ¥${stat.avgPrice.toFixed(2)}`);
      console.log(`    最低: ¥${stat.minPrice}`);
      console.log(`    最高: ¥${stat.maxPrice}`);
    });
    
  } catch (error) {
    console.error('统计过程出错:', error.message);
  }
}

// 执行脚本
if (require.main === module) {
  updatePricing()
    .then(() => {
      console.log('\n🎉 脚本执行完成！');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ 脚本执行失败:', err);
      process.exit(1);
    });
}

module.exports = { updatePricing, validatePricing, showPriceStatistics };

