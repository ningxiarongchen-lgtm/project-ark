/**
 * SF系列尺寸数据合并脚本
 * 
 * 功能：将共享尺寸数据和型号特定数据合并后更新到数据库
 * 
 * 使用方法：
 * node backend/scripts/mergeDimensions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Actuator = require('../models/Actuator');
const connectDB = require('../config/database');

// 导入尺寸数据
const { sharedDimensions, sf_all_dimensions_data } = require('./sf_dimension_data');

/**
 * 合并并更新数据
 */
const mergeData = async () => {
  try {
    // 连接数据库
    await connectDB();
    console.log('✅ 数据库连接成功...\n');

    let updatedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log('========== 开始合并尺寸数据 ==========\n');

    // 遍历所有需要更新尺寸的型号
    for (const dimData of sf_all_dimensions_data) {
      const { model, bodySize, dimensions: outlineData } = dimData;

      try {
        // 查找对应的共享尺寸
        const shared = sharedDimensions[bodySize];
        if (!shared) {
          console.warn(`⚠️  警告: 未找到 ${model} 的共享尺寸 (BodySize: ${bodySize})`);
          errorCount++;
          errors.push({ model, error: '未找到共享尺寸数据' });
          continue;
        }

        // 组合完整的尺寸对象
        const fullDimensions = {
          outline: outlineData.outline,
          pneumaticConnection: outlineData.pneumaticConnection,
          flange: shared.flange,
          topMounting: shared.topMounting
        };

        // 在数据库中查找并更新执行器
        // 注意：数据库模型中的字段名是 model_base
        const actuator = await Actuator.findOneAndUpdate(
          { 
            model_base: { 
              $regex: new RegExp(`^${model}`, 'i') 
            } 
          },
          { 
            $set: { dimensions: fullDimensions } 
          },
          { 
            new: true,
            runValidators: false // 跳过验证以提高性能
          }
        );

        if (actuator) {
          updatedCount++;
          console.log(`✅ 成功更新型号: ${model}`);
        } else {
          notFoundCount++;
          console.error(`❌ 未能找到型号: ${model}，更新失败`);
          errors.push({ model, error: '数据库中不存在该型号' });
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ 更新 ${model} 时出错:`, error.message);
        errors.push({ model, error: error.message });
      }
    }

    // 输出统计信息
    console.log('\n========== 数据合并完成 ==========');
    console.log(`✅ 成功更新: ${updatedCount} 个型号`);
    console.log(`⚠️  未找到型号: ${notFoundCount} 个型号`);
    console.log(`❌ 更新失败: ${errorCount} 个型号`);
    console.log(`📊 总计处理: ${sf_all_dimensions_data.length} 个型号`);
    console.log(`📈 成功率: ${((updatedCount / sf_all_dimensions_data.length) * 100).toFixed(2)}%`);

    // 如果有错误，输出详细信息
    if (errors.length > 0) {
      console.log('\n========== 错误详情 ==========');
      errors.forEach(err => {
        console.log(`- ${err.model}: ${err.error}`);
      });
    }

    // 验证更新结果
    console.log('\n========== 验证更新结果 ==========');
    await validateDimensions();

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
 * 验证尺寸数据完整性
 */
async function validateDimensions() {
  try {
    const sfActuators = await Actuator.find({ 
      series: 'SF',
      is_active: true 
    });
    
    console.log(`\n找到 ${sfActuators.length} 个 SF 系列执行器`);
    
    let validCount = 0;
    let invalidCount = 0;
    
    for (const actuator of sfActuators) {
      const dims = actuator.dimensions;
      
      // 检查是否有 dimensions 字段
      if (!dims || Object.keys(dims).length === 0) {
        console.warn(`⚠️  ${actuator.model_base}: 缺少 dimensions 数据`);
        invalidCount++;
        continue;
      }
      
      // 检查必需的子字段
      const hasOutline = dims.outline && Object.keys(dims.outline).length > 0;
      const hasFlange = dims.flange && dims.flange.standard;
      const hasTopMounting = dims.topMounting && dims.topMounting.standard;
      const hasPneumatic = dims.pneumaticConnection && dims.pneumaticConnection.size;
      
      if (hasOutline && hasFlange && hasTopMounting && hasPneumatic) {
        validCount++;
      } else {
        console.warn(`⚠️  ${actuator.model_base}: 尺寸数据不完整`);
        if (!hasOutline) console.warn(`    - 缺少 outline 数据`);
        if (!hasFlange) console.warn(`    - 缺少 flange 数据`);
        if (!hasTopMounting) console.warn(`    - 缺少 topMounting 数据`);
        if (!hasPneumatic) console.warn(`    - 缺少 pneumaticConnection 数据`);
        invalidCount++;
      }
    }
    
    console.log(`\n验证结果:`);
    console.log(`✅ 完整数据: ${validCount} 个型号`);
    console.log(`⚠️  数据不完整: ${invalidCount} 个型号`);
    
  } catch (error) {
    console.error('验证过程出错:', error.message);
  }
}

// 执行脚本
if (require.main === module) {
  mergeData()
    .then(() => {
      console.log('\n🎉 脚本执行完成！');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ 脚本执行失败:', err);
      process.exit(1);
    });
}

module.exports = { mergeData, validateDimensions };

