// ============================================
// AT/GY 系列执行器数据导入脚本（最终版）
// 包含完整的价格结构和手动操作装置信息
// ============================================

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

// 3. 辅助函数：安全解析数字
function parseNumber(value) {
  if (!value || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

// 4. 辅助函数：安全解析JSON
function parseJSON(jsonString, defaultValue = {}) {
  if (!jsonString || jsonString.trim() === '' || jsonString === '""') {
    return defaultValue;
  }
  
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn(`  ⚠️  JSON 解析失败: ${jsonString.substring(0, 50)}...`);
    return defaultValue;
  }
}

// 5. 主函数：seedATGYFinal
async function seedATGYFinal() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║   AT/GY 系列执行器数据导入工具（最终版）             ║');
  console.log('║   包含完整价格结构和手动操作装置信息                 ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  try {
    // 连接数据库
    await connectDatabase();
    
    // 只删除旧的 AT 和 GY 系列数据，保留 SF 系列
    console.log('\n🗑️  删除旧的 AT/GY 系列数据...');
    const deleteResult = await Actuator.deleteMany({ 
      series: { $in: ['AT', 'GY'] } 
    });
    console.log(`  ✅ 删除了 ${deleteResult.deletedCount} 条旧的 AT/GY 系列记录`);
    console.log('  ℹ️  SF 系列数据已保留\n');
    
    // 读取 CSV 文件
    const filePath = path.join(__dirname, 'data_imports', 'at_gy_actuators_data_final.csv');
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`CSV 文件不存在: ${filePath}`);
    }
    
    console.log('📦 开始读取 AT/GY 系列执行器数据（最终版）...');
    console.log('📄 文件路径:', filePath);
    
    // 用于收集所有处理好的数据
    const newData = [];
    let rowCount = 0;
    let errorCount = 0;
    
    // 统计信息
    const stats = {
      AT_SR: 0,
      AT_DA: 0,
      GY_SR: 0,
      GY_DA: 0,
      with_manual_override: 0,
      with_seal_kit: 0
    };
    
    // 使用 Promise 包装 CSV 读取过程
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rowCount++;
          
          try {
            // 解析扭矩数据
            const torqueData = parseJSON(row['torque_data'], {});
            
            // 解析尺寸数据
            const dimensions = parseJSON(row['dimensions'], {});
            
            // 解析价格字段
            const basePriceNormal = parseNumber(row['base_price_normal']);
            const basePriceLow = parseNumber(row['base_price_low']);
            const basePriceHigh = parseNumber(row['base_price_high']);
            const manualOverridePrice = parseNumber(row['manual_override_price']);
            const sealKitPrice = parseNumber(row['seal_kit_price']);
            
            // 提取本体尺寸（从 model_base 中提取，例如 "AT-SR52K8" -> "52"）
            let bodySize = '';
            const modelBase = row['model_base'];
            if (modelBase) {
              // 对于 AT 系列
              if (modelBase.startsWith('AT-')) {
                const match = modelBase.match(/AT-(SR|DA)(\d+)/);
                if (match) {
                  bodySize = match[2]; // 提取数字部分，如 "52", "63" 等
                }
              }
              // 对于 GY 系列
              else if (modelBase.startsWith('GY-')) {
                const match = modelBase.match(/GY-(\d+)/);
                if (match) {
                  bodySize = match[1];
                }
              }
            }
            
            // ========== 构建符合 Actuator 模型的对象 ==========
            const actuatorData = {
              model_base: row['model_base'],
              series: row['series'],
              mechanism: row['mechanism'],
              body_size: bodySize,
              action_type: row['action_type'],
              spring_range: row['spring_range'] || null,
              
              // 扭矩数据
              torque_data: torqueData,
              
              // 尺寸数据
              dimensions: dimensions,
              
              // 默认技术参数（AT/GY 系列通用）
              specifications: {
                pressure_range: {
                  min: 2,
                  max: 8
                },
                temperature_range: {
                  min: -20,
                  max: 80
                },
                rotation_angle: 90,
                port_connection: 'G1/4',
                mounting_standard: 'ISO5211',
                materials: {
                  body: '铝合金',
                  piston: '铝合金',
                  seal: 'NBR'
                }
              },
              
              // 库存信息
              stock_info: {
                available: true,
                lead_time: 14
              },
              
              // 描述
              description: `${row['series']} 系列 ${row['mechanism']} ${row['action_type'] === 'DA' ? '双作用' : '弹簧复位'}执行器`,
              
              // 激活状态
              is_active: true
            };
            
            // ========== 定价模式智能判断 ==========
            // 检查是否有阶梯价格或多个价格档位
            const hasTieredPricing = (
              row.price_tier_1 || row.price_tier_2 || row.price_tier_3 ||
              row.price_1 || row.price_2 || row.price_3 ||
              row.qty_1 || row.qty_2 || row.qty_3 ||
              (basePriceLow && basePriceHigh) // 如果有低价和高价，也算阶梯定价
            );
            
            if (hasTieredPricing) {
              // 阶梯定价模式
              actuatorData.pricing_model = 'tiered';
              actuatorData.price_tiers = [];
              
              // 先尝试从 qty_X 和 price_X 字段解析
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
              
              // 如果没有解析到阶梯价格，但有 low/normal/high 价格，构建默认阶梯
              if (actuatorData.price_tiers.length === 0 && basePriceNormal) {
                if (basePriceLow) {
                  actuatorData.price_tiers.push({
                    min_quantity: 10,
                    unit_price: basePriceLow,
                    price_type: 'low',
                    notes: '大批量优惠价'
                  });
                }
                actuatorData.price_tiers.push({
                  min_quantity: 1,
                  unit_price: basePriceNormal,
                  price_type: 'normal',
                  notes: '标准价格'
                });
                if (basePriceHigh) {
                  actuatorData.price_tiers.push({
                    min_quantity: 1,
                    unit_price: basePriceHigh,
                    price_type: 'high',
                    notes: '小批量价格'
                  });
                }
              }
              
              // 如果还是没有成功解析到 price_tiers，回退到固定价格
              if (actuatorData.price_tiers.length === 0) {
                actuatorData.pricing_model = 'fixed';
                actuatorData.base_price = basePriceNormal || 0;
                delete actuatorData.price_tiers;
              } else {
                // 如果有阶梯价格，同时保留 base_price（使用标准价格）
                actuatorData.base_price = basePriceNormal || actuatorData.price_tiers[0].unit_price || 0;
              }
            } else {
              // 固定价格模式（只有一个价格）
              actuatorData.pricing_model = 'fixed';
              actuatorData.base_price = basePriceNormal || Number(row['base_price']) || 0;
            }
            
            // 保存额外的价格信息到 pricing 对象（用于向后兼容）
            actuatorData.pricing = {
              base_price_normal: basePriceNormal,
              base_price_low: basePriceLow,
              base_price_high: basePriceHigh,
              manual_override_model: row['manual_override_model'] || null,
              manual_override_price: manualOverridePrice,
              seal_kit_price: sealKitPrice
            };
            
            // 添加到数据集合
            newData.push(actuatorData);
            
            // 更新统计
            const key = `${row['series']}_${row['action_type']}`;
            if (stats[key] !== undefined) {
              stats[key]++;
            }
            if (row['manual_override_model']) {
              stats.with_manual_override++;
            }
            if (sealKitPrice) {
              stats.with_seal_kit++;
            }
            
          } catch (error) {
            errorCount++;
            console.error(`  ❌ 第 ${rowCount} 行处理失败:`, error.message);
            console.error('     原始数据:', row);
          }
        })
        .on('end', () => {
          console.log(`\n📊 CSV 读取完成: 共读取 ${rowCount} 行数据`);
          if (errorCount > 0) {
            console.log(`⚠️  其中 ${errorCount} 行处理失败`);
          }
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });
    
    // 批量插入数据库
    if (newData.length > 0) {
      console.log(`\n💾 开始导入 ${newData.length} 条数据到数据库...`);
      
      const insertResult = await Actuator.insertMany(newData, { 
        ordered: false // 允许部分失败继续插入
      });
      
      console.log(`✅ 成功导入 ${insertResult.length} 条 AT/GY 系列执行器数据！`);
      
      // 显示详细统计
      console.log('\n📈 导入统计:');
      console.log('  ┌─────────────────────────────────────┐');
      console.log(`  │ AT-SR (弹簧复位):     ${String(stats.AT_SR).padStart(3)} 条    │`);
      console.log(`  │ AT-DA (双作用):       ${String(stats.AT_DA).padStart(3)} 条    │`);
      console.log(`  │ GY-SR (弹簧复位):     ${String(stats.GY_SR).padStart(3)} 条    │`);
      console.log(`  │ GY-DA (双作用):       ${String(stats.GY_DA).padStart(3)} 条    │`);
      console.log('  ├─────────────────────────────────────┤');
      console.log(`  │ 配手动操作装置:       ${String(stats.with_manual_override).padStart(3)} 条    │`);
      console.log(`  │ 含密封套件价格:       ${String(stats.with_seal_kit).padStart(3)} 条    │`);
      console.log('  └─────────────────────────────────────┘');
      
      // 显示价格范围
      console.log('\n💰 价格范围:');
      const prices = newData
        .filter(d => d.pricing.base_price_normal)
        .map(d => d.pricing.base_price_normal);
      
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        console.log(`  最低价格: ¥${minPrice.toLocaleString()}`);
        console.log(`  最高价格: ¥${maxPrice.toLocaleString()}`);
      }
      
    } else {
      console.log('⚠️  没有有效数据可导入');
    }
    
    // 验证导入结果
    console.log('\n🔍 验证导入结果...');
    const atCount = await Actuator.countDocuments({ series: 'AT' });
    const gyCount = await Actuator.countDocuments({ series: 'GY' });
    const totalCount = await Actuator.countDocuments();
    
    console.log(`  ✅ AT 系列: ${atCount} 条`);
    console.log(`  ✅ GY 系列: ${gyCount} 条`);
    console.log(`  ✅ 总计（含SF系列）: ${totalCount} 条`);
    
    // 显示示例数据
    console.log('\n📋 示例数据（前3条）:');
    const samples = await Actuator.find({ 
      series: { $in: ['AT', 'GY'] } 
    }).limit(3);
    
    samples.forEach((item, index) => {
      console.log(`\n  ${index + 1}. ${item.model_base}`);
      console.log(`     系列: ${item.series} | 机构: ${item.mechanism}`);
      console.log(`     作用类型: ${item.action_type} | 本体尺寸: ${item.body_size || 'N/A'}`);
      console.log(`     标准价格: ¥${item.pricing?.base_price_normal?.toLocaleString() || 'N/A'}`);
      console.log(`     价格范围: ¥${item.pricing?.base_price_low?.toLocaleString() || 'N/A'} - ¥${item.pricing?.base_price_high?.toLocaleString() || 'N/A'}`);
      if (item.pricing?.manual_override_model) {
        console.log(`     手动装置: ${item.pricing.manual_override_model} (¥${item.pricing.manual_override_price?.toLocaleString() || 'N/A'})`);
      }
      if (item.pricing?.seal_kit_price) {
        console.log(`     密封套件: ¥${item.pricing.seal_kit_price.toLocaleString()}`);
      }
      console.log(`     扭矩数据: ${JSON.stringify(item.torque_data)}`);
    });
    
    console.log('\n✅ AT/GY 系列数据导入完成！');
    console.log('\n使用说明:');
    console.log('  1. 所有价格数据已包含三个级别（标准/低价/高价）');
    console.log('  2. 手动操作装置信息已关联');
    console.log('  3. 密封套件价格已录入');
    console.log('  4. 可通过 pricing 对象访问详细价格信息');
    
  } catch (error) {
    console.error('\n❌ 导入过程出错:', error);
    throw error;
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 6. 执行脚本
if (require.main === module) {
  seedATGYFinal()
    .then(() => {
      console.log('\n✨ 脚本执行完成\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { seedATGYFinal };

