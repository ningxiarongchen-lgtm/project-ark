/**
 * 三系列执行器数据导入脚本
 * 导入SF、AT、GY系列执行器数据到生产环境
 * 
 * 使用方法：
 * node backend/scripts/importThreeSeries.js
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 导入模型
const Actuator = require('../models/Actuator');

// 导入CSV处理器
const {
  processActuatorRow,
  validateActuatorData
} = require('../utils/actuatorCsvProcessor');

// 数据库连接
async function connectDB() {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cmax';
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ 已连接到MongoDB: ${mongoose.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB连接错误: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 读取CSV文件
 */
function readCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`文件不存在: ${filePath}`));
    }
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

/**
 * 导入单个系列的数据
 */
async function importSeries(seriesName, csvFile, options = {}) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 开始导入 ${seriesName} 系列数据`);
  console.log(`${'='.repeat(60)}\n`);
  
  const projectRoot = path.join(__dirname, '../..');
  const filePath = path.join(projectRoot, csvFile);
  
  console.log(`📄 文件路径: ${filePath}`);
  
  try {
    // 1. 读取CSV文件
    console.log(`\n🔍 正在读取CSV文件...`);
    const rawData = await readCsvFile(filePath);
    console.log(`✅ 成功读取 ${rawData.length} 条原始记录`);
    
    if (rawData.length === 0) {
      console.log(`⚠️  文件为空，跳过导入`);
      return { success: 0, failed: 0, skipped: 0 };
    }
    
    // 显示前3条原始数据的字段
    console.log(`\n📋 CSV字段列表:`);
    if (rawData[0]) {
      Object.keys(rawData[0]).forEach((key, index) => {
        console.log(`   ${index + 1}. ${key}`);
      });
    }
    
    // 2. 处理和验证数据
    console.log(`\n⚙️  正在处理数据...`);
    const processedData = [];
    const errors = [];
    
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      try {
        // 处理数据
        const processed = processActuatorRow(row);
        
        // 验证数据
        const validationErrors = validateActuatorData(processed);
        
        if (validationErrors) {
          errors.push({
            row: i + 1,
            model: row.model_base || '未知型号',
            errors: validationErrors
          });
        } else {
          processedData.push(processed);
        }
      } catch (error) {
        errors.push({
          row: i + 1,
          model: row.model_base || '未知型号',
          errors: [error.message]
        });
      }
    }
    
    console.log(`✅ 成功处理 ${processedData.length} 条记录`);
    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} 条记录验证失败:`);
      errors.slice(0, 5).forEach(err => {
        console.log(`   行 ${err.row} (${err.model}): ${err.errors.join(', ')}`);
      });
      if (errors.length > 5) {
        console.log(`   ... 还有 ${errors.length - 5} 条错误`);
      }
    }
    
    // 3. 导入数据到数据库
    console.log(`\n💾 正在导入到数据库...`);
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      details: []
    };
    
    for (const data of processedData) {
      try {
        // 检查是否已存在
        const existing = await Actuator.findOne({ model_base: data.model_base });
        
        if (existing) {
          if (options.updateExisting) {
            // 更新模式
            Object.assign(existing, data);
            existing.updated_at = new Date();
            await existing.save();
            results.success++;
            console.log(`   ✏️  更新: ${data.model_base}`);
          } else {
            // 跳过模式
            results.skipped++;
            console.log(`   ⏭️  跳过（已存在）: ${data.model_base}`);
          }
        } else {
          // 创建新记录
          const newActuator = new Actuator(data);
          await newActuator.save();
          results.success++;
          console.log(`   ✅ 创建: ${data.model_base}`);
        }
      } catch (error) {
        results.failed++;
        results.details.push({
          model: data.model_base,
          error: error.message
        });
        console.log(`   ❌ 失败: ${data.model_base} - ${error.message}`);
      }
    }
    
    // 4. 显示导入总结
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📊 ${seriesName}系列导入总结:`);
    console.log(`   ✅ 成功: ${results.success} 条`);
    console.log(`   ❌ 失败: ${results.failed} 条`);
    console.log(`   ⏭️  跳过: ${results.skipped} 条`);
    console.log(`   ⚠️  验证错误: ${errors.length} 条`);
    console.log(`${'─'.repeat(60)}`);
    
    return results;
    
  } catch (error) {
    console.error(`❌ 导入${seriesName}系列时发生错误:`, error.message);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🚀 三系列执行器数据导入工具`);
  console.log(`${'═'.repeat(60)}\n`);
  
  try {
    // 连接数据库
    await connectDB();
    
    // 检查是否需要更新已存在的数据
    const updateExisting = process.argv.includes('--update');
    
    if (updateExisting) {
      console.log(`⚠️  更新模式：已存在的数据将被更新`);
    } else {
      console.log(`ℹ️  创建模式：已存在的数据将被跳过（使用 --update 参数启用更新模式）`);
    }
    
    const totalResults = {
      success: 0,
      failed: 0,
      skipped: 0
    };
    
    // 导入三个系列
    const series = [
      { name: 'SF', file: 'SF系列执行器导入模板.csv' },
      { name: 'AT', file: 'AT系列执行器完整导入模板.csv' },
      { name: 'GY', file: 'GY系列执行器导入模板.csv' }
    ];
    
    for (const { name, file } of series) {
      try {
        const result = await importSeries(name, file, { updateExisting });
        totalResults.success += result.success;
        totalResults.failed += result.failed;
        totalResults.skipped += result.skipped;
      } catch (error) {
        console.error(`❌ ${name}系列导入失败，继续下一个系列...`);
      }
    }
    
    // 显示最终总结
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🎉 所有系列导入完成！`);
    console.log(`${'═'.repeat(60)}\n`);
    console.log(`📈 总计导入统计:`);
    console.log(`   ✅ 成功导入: ${totalResults.success} 条`);
    console.log(`   ❌ 导入失败: ${totalResults.failed} 条`);
    console.log(`   ⏭️  跳过重复: ${totalResults.skipped} 条`);
    console.log(`   📊 总处理数: ${totalResults.success + totalResults.failed + totalResults.skipped} 条`);
    console.log(`\n${'═'.repeat(60)}\n`);
    
    // 查询数据库中各系列的数量
    console.log(`📊 数据库中各系列执行器数量:`);
    const sfCount = await Actuator.countDocuments({ series: 'SF' });
    const atCount = await Actuator.countDocuments({ series: 'AT' });
    const gyCount = await Actuator.countDocuments({ series: 'GY' });
    console.log(`   SF系列: ${sfCount} 条`);
    console.log(`   AT系列: ${atCount} 条`);
    console.log(`   GY系列: ${gyCount} 条`);
    console.log(`   总计: ${sfCount + atCount + gyCount} 条\n`);
    
  } catch (error) {
    console.error(`\n❌ 程序执行出错:`, error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log(`\n✅ 数据库连接已关闭`);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { importSeries, main };

