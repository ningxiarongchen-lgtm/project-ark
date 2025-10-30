// 1. 引入必要的库和模型
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const csv = require('csv-parser');

// 引入 Actuator 模型
const Actuator = require('./models/Actuator');

// 2. 数据库连接函数
async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('请在 .env 文件中配置 MONGO_URI 环境变量');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ 数据库连接成功:', mongoose.connection.name);
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    throw error;
  }
}

// 3. 主函数：seedATGY
async function seedATGY() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   AT/GY 齿轮齿条式执行机构数据导入工具        ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  try {
    // 在函数开头，建立数据库连接
    await connectDatabase();
    
    // 只删除旧的 AT 和 GY 系列数据，保留 SF 系列
    console.log('\n🗑️  删除旧的 AT/GY 系列数据...');
    const deleteResult = await Actuator.deleteMany({ 
      series: { $in: ['AT', 'GY'] } 
    });
    console.log(`  ✅ 删除了 ${deleteResult.deletedCount} 条旧的 AT/GY 系列记录`);
    console.log('  ℹ️  SF 系列数据已保留\n');
    
    // 读取并处理 CSV
    const filePath = path.join(__dirname, 'data_imports', 'at_gy_actuators_data.csv');
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`CSV 文件不存在: ${filePath}`);
    }
    
    console.log('📦 开始读取 AT/GY 系列执行器数据...');
    console.log('📄 文件路径:', filePath);
    
    // 用于收集所有处理好的数据
    const newData = [];
    let rowCount = 0;
    
    // 使用 Promise 包装 CSV 读取过程
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowCount++;
          
          try {
            // 处理扭矩数据
            let torqueData;
            try {
              torqueData = JSON.parse(row['torque_data']);
            } catch (e) {
              console.warn(`  ⚠️  第 ${rowCount} 行: 扭矩数据解析失败，使用空对象`);
              torqueData = {};
            }
            
            // 处理尺寸数据
            let dimensions;
            if (row['dimensions'] && row['dimensions'].trim() !== '') {
              try {
                dimensions = JSON.parse(row['dimensions']);
              } catch (e) {
                console.warn(`  ⚠️  第 ${rowCount} 行: 尺寸数据解析失败，使用空对象`);
                dimensions = {};
              }
            } else {
              dimensions = {};
            }
            
            // 构建符合 Actuator 模型的对象
            const actuatorData = {
              model_base: row['model_base'],
              series: row['series'],
              mechanism: row['mechanism'],
              action_type: row['action_type'],
              spring_range: row['spring_range'] || null,
              torque_data: torqueData,
              dimensions: dimensions
            };
            
            // ========== 定价模式智能判断 ==========
            // 检查 Excel 中是否提供了阶梯价格（多个价格列）
            const hasTieredPricing = (
              row.price_tier_1 || row.price_tier_2 || row.price_tier_3 ||
              row.price_1 || row.price_2 || row.price_3 ||
              row.qty_1 || row.qty_2 || row.qty_3
            );
            
            if (hasTieredPricing) {
              // 如果有阶梯价格，使用 tiered 模式
              actuatorData.pricing_model = 'tiered';
              actuatorData.price_tiers = [];
              
              // 解析阶梯价格（假设格式：qty_1, price_1, qty_2, price_2 等）
              for (let i = 1; i <= 5; i++) {
                const qtyField = `qty_${i}` in row ? `qty_${i}` : `min_quantity_${i}`;
                const priceField = `price_${i}` in row ? `price_${i}` : `unit_price_${i}`;
                
                if (row[qtyField] && row[priceField]) {
                  actuatorData.price_tiers.push({
                    min_quantity: Number(row[qtyField]),
                    unit_price: Number(row[priceField]),
                    price_type: row[`price_type_${i}`] || 'normal',
                    notes: row[`notes_${i}`] || ''
                  });
                }
              }
              
              // 如果没有成功解析到 price_tiers，回退到固定价格
              if (actuatorData.price_tiers.length === 0) {
                actuatorData.pricing_model = 'fixed';
                actuatorData.base_price = Number(row['base_price']) || 0;
                delete actuatorData.price_tiers;
              }
            } else {
              // 如果只有单一价格，使用 fixed 模式
              actuatorData.pricing_model = 'fixed';
              actuatorData.base_price = Number(row['base_price']) || 0;
            }
            
            // 添加到数组
            newData.push(actuatorData);
            
          } catch (error) {
            console.error(`  ❌ 第 ${rowCount} 行处理失败:`, error.message);
          }
        })
        .on('end', () => {
          console.log(`\n📊 CSV 读取完成，共读取 ${rowCount} 行数据`);
          console.log(`✅ 成功解析 ${newData.length} 条记录\n`);
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ CSV 文件读取失败:', error.message);
          reject(error);
        });
    });
    
    // 批量插入数据库
    if (newData.length > 0) {
      console.log('💾 开始批量插入数据到数据库...');
      const result = await Actuator.insertMany(newData);
      console.log(`✅ 成功导入 ${result.length} 条 AT/GY 执行器数据\n`);
      
      // 显示几条示例数据
      console.log('📋 导入的数据示例:');
      result.slice(0, 3).forEach(item => {
        console.log(`  - ${item.model_base} | ${item.series} | ${item.action_type} | ${item.spring_range || 'N/A'} | ¥${item.base_price}`);
      });
    } else {
      console.log('⚠️  没有数据需要导入');
    }
    
    // 显示统计信息
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║     AT/GY 数据导入完成！ 🎉                   ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    console.log('📊 数据库统计:');
    const sfCount = await Actuator.countDocuments({ model_base: /^SF/ });
    const atCount = await Actuator.countDocuments({ series: 'AT' });
    const gyCount = await Actuator.countDocuments({ series: 'GY' });
    const totalCount = await Actuator.countDocuments();
    
    console.log(`  📦 SF 系列:        ${sfCount} 条`);
    console.log(`  📦 AT 系列:        ${atCount} 条`);
    console.log(`  📦 GY 系列:        ${gyCount} 条`);
    console.log(`  📦 数据库总计:     ${totalCount} 条\n`);
    
    // 成功后关闭数据库连接
    await mongoose.connection.close();
    console.log('✅ 数据库连接已关闭\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ 数据导入过程中发生错误:', error.message);
    console.error(error.stack);
    
    // 确保关闭数据库连接
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  seedATGY();
}

// 导出函数供其他模块使用
module.exports = {
  seedATGY
};
