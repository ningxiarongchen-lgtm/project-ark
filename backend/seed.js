// 导入必要的库
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const csv = require('csv-parser');

// 导入模型
const Actuator = require('./models/Actuator');
const ManualOverride = require('./models/ManualOverride');

// 数据库连接函数
async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/project_ark';
    
    await mongoose.connect(mongoUri);
    console.log('✅ 数据库连接成功:', mongoose.connection.name);
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    throw error;
  }
}

// 解析扭矩数据 (将 Map 格式转换为对象)
function parseTorqueData(torqueString) {
  if (!torqueString || torqueString.trim() === '') {
    return new Map();
  }
  
  try {
    // 清理字符串
    let cleaned = torqueString.trim();
    
    // 移除可能的外层引号
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    
    // 替换转义的双引号
    cleaned = cleaned.replace(/""/g, '"');
    
    // 解析 JSON
    const obj = JSON.parse(cleaned);
    const map = new Map();
    
    // 转换为 Map，将键名中的点替换为下划线 (Mongoose 限制)
    for (const [key, value] of Object.entries(obj)) {
      const safeKey = key.replace(/\./g, '_');
      map.set(safeKey, value);
    }
    
    return map;
  } catch (error) {
    console.warn(`⚠️  解析扭矩数据失败: ${error.message}`);
    return new Map();
  }
}

// 读取并导入执行器数据
async function importActuators() {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, 'data_imports', 'sf_actuators_data.csv');
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error('❌ 执行器数据文件不存在:', filePath);
      reject(new Error('执行器数据文件不存在'));
      return;
    }
    
    console.log('\n📦 开始导入执行器数据...');
    console.log('📄 文件路径:', filePath);
    
    const actuators = [];
    let rowCount = 0;
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        
        try {
          // 解析扭矩数据
          const torqueSymmetric = parseTorqueData(row.torque_symmetric);
          const torqueCanted = parseTorqueData(row.torque_canted);
          
          // ========== 构建执行器对象 ==========
          const actuatorData = {
            model_base: row.model_base,
            body_size: row.body_size,
            action_type: row.action_type,
            torque_symmetric: torqueSymmetric,
            torque_canted: torqueCanted
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
              actuatorData.base_price = Number(row.base_price) || Number(row.price) || 0;
              delete actuatorData.price_tiers;
            }
          } else {
            // 如果只有单一价格，使用 fixed 模式
            actuatorData.pricing_model = 'fixed';
            actuatorData.base_price = Number(row.base_price) || Number(row.price) || 0;
          }
          
          // 可选字段
          if (row.cylinder_size) {
            actuatorData.cylinder_size = Number(row.cylinder_size);
          }
          
          if (row.spring_range) {
            actuatorData.spring_range = row.spring_range;
          }
          
          // 技术规格
          actuatorData.technical_specs = {
            connect_flange: row.connect_flange || '',
            dimensions: {}
          };
          
          // 尺寸参数
          const dimensionFields = ['L1', 'L2', 'm1', 'm2', 'A', 'H1', 'H2', 'D', 'G'];
          dimensionFields.forEach(field => {
            if (row[field]) {
              // 如果是数字字段，转换为Number
              if (field !== 'G') {
                actuatorData.technical_specs.dimensions[field] = Number(row[field]);
              } else {
                actuatorData.technical_specs.dimensions[field] = row[field];
              }
            }
          });
          
          actuators.push(actuatorData);
        } catch (error) {
          console.error(`  ❌ 解析第 ${rowCount} 行失败:`, error.message);
        }
      })
      .on('end', async () => {
        try {
          console.log(`📊 共读取 ${rowCount} 行数据`);
          console.log(`✅ 成功解析 ${actuators.length} 条执行器记录`);
          
          if (actuators.length > 0) {
            // 批量插入数据
            const result = await Actuator.insertMany(actuators, { ordered: false });
            console.log(`💾 成功导入 ${result.length} 条执行器数据到数据库`);
          } else {
            console.log('⚠️  没有数据需要导入');
          }
          
          resolve(actuators.length);
        } catch (error) {
          console.error('❌ 批量插入执行器数据失败:', error.message);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('❌ 读取执行器CSV文件失败:', error.message);
        reject(error);
      });
  });
}

// 读取并导入手动操作装置数据
async function importManualOverrides() {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, 'data_imports', 'manual_overrides_data.csv');
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error('❌ 手动操作装置数据文件不存在:', filePath);
      reject(new Error('手动操作装置数据文件不存在'));
      return;
    }
    
    console.log('\n🔧 开始导入手动操作装置数据...');
    console.log('📄 文件路径:', filePath);
    
    const overrides = [];
    let rowCount = 0;
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        
        try {
          // 解析兼容机身尺寸
          let compatibleSizes = [];
          if (row.compatible_body_sizes) {
            // 如果是逗号分隔的字符串，拆分成数组
            compatibleSizes = row.compatible_body_sizes
              .split(',')
              .map(s => s.trim())
              .filter(s => s);
          }
          
          // ========== 构建手动操作装置对象 ==========
          const overrideData = {
            model: row.model_base || row.model,
            compatible_body_sizes: compatibleSizes
          };
          
          // ========== 定价模式智能判断 ==========
          // 检查是否有阶梯价格
          const hasTieredPricing = (
            row.price_tier_1 || row.price_tier_2 || row.price_tier_3 ||
            row.qty_1 || row.qty_2 || row.qty_3
          );
          
          if (hasTieredPricing) {
            // 阶梯价格模式
            overrideData.pricing_model = 'tiered';
            overrideData.price_tiers = [];
            
            for (let i = 1; i <= 5; i++) {
              const qtyField = `qty_${i}` in row ? `qty_${i}` : `min_quantity_${i}`;
              const priceField = `price_${i}` in row ? `price_${i}` : `unit_price_${i}`;
              
              if (row[qtyField] && row[priceField]) {
                overrideData.price_tiers.push({
                  min_quantity: Number(row[qtyField]),
                  unit_price: Number(row[priceField]),
                  price_type: row[`price_type_${i}`] || 'normal',
                  notes: row[`notes_${i}`] || ''
                });
              }
            }
            
            if (overrideData.price_tiers.length === 0) {
              overrideData.pricing_model = 'fixed';
              overrideData.base_price = Number(row.price) || Number(row.base_price) || 0;
              delete overrideData.price_tiers;
            }
          } else {
            // 固定价格模式
            overrideData.pricing_model = 'fixed';
            overrideData.base_price = Number(row.price) || Number(row.base_price) || 0;
          }
          
          // 可选字段
          if (row.name) {
            overrideData.name = row.name;
          }
          
          if (row.description) {
            overrideData.description = row.description;
          }
          
          if (row.application) {
            overrideData.application = row.application;
          }
          
          // 如果有规格数据（JSON格式）
          if (row.specifications) {
            try {
              overrideData.specifications = JSON.parse(row.specifications);
            } catch (e) {
              console.warn(`⚠️  第 ${rowCount} 行: 规格数据解析失败`);
            }
          }
          
          // 如果有尺寸数据（JSON格式）
          if (row.dimensions) {
            try {
              overrideData.dimensions = JSON.parse(row.dimensions);
            } catch (e) {
              console.warn(`⚠️  第 ${rowCount} 行: 尺寸数据解析失败`);
            }
          }
          
          // 如果有库存信息（JSON格式）
          if (row.stock_info) {
            try {
              overrideData.stock_info = JSON.parse(row.stock_info);
            } catch (e) {
              console.warn(`⚠️  第 ${rowCount} 行: 库存信息解析失败`);
            }
          }
          
          overrides.push(overrideData);
        } catch (error) {
          console.error(`  ❌ 解析第 ${rowCount} 行失败:`, error.message);
        }
      })
      .on('end', async () => {
        try {
          console.log(`📊 共读取 ${rowCount} 行数据`);
          console.log(`✅ 成功解析 ${overrides.length} 条手动操作装置记录`);
          
          if (overrides.length > 0) {
            // 批量插入数据
            const result = await ManualOverride.insertMany(overrides, { ordered: false });
            console.log(`💾 成功导入 ${result.length} 条手动操作装置数据到数据库`);
          } else {
            console.log('⚠️  没有数据需要导入');
          }
          
          resolve(overrides.length);
        } catch (error) {
          console.error('❌ 批量插入手动操作装置数据失败:', error.message);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('❌ 读取手动操作装置CSV文件失败:', error.message);
        reject(error);
      });
  });
}

// 主函数：种子数据库
async function seedDatabase() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║     C-MAX 数据库种子数据导入工具              ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  try {
    // 1. 连接数据库
    await connectDatabase();
    
    // 2. 清空旧数据
    console.log('\n🗑️  清空现有数据...');
    const deletedActuators = await Actuator.deleteMany({});
    console.log(`  ✅ 删除了 ${deletedActuators.deletedCount} 条执行器记录`);
    
    const deletedOverrides = await ManualOverride.deleteMany({});
    console.log(`  ✅ 删除了 ${deletedOverrides.deletedCount} 条手动操作装置记录`);
    
    // 3. 导入执行器数据
    const actuatorCount = await importActuators();
    
    // 4. 导入手动操作装置数据
    const overrideCount = await importManualOverrides();
    
    // 5. 显示总结
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║     数据导入完成！ 🎉                         ║');
    console.log('╚════════════════════════════════════════════════╝');
    
    console.log('\n📊 导入统计:');
    console.log(`  ✅ 执行器:         ${actuatorCount} 条`);
    console.log(`  ✅ 手动操作装置:   ${overrideCount} 条`);
    console.log(`  ✅ 总计:           ${actuatorCount + overrideCount} 条\n`);
    
    // 6. 关闭数据库连接
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
  seedDatabase();
}

// 导出函数供其他模块使用
module.exports = {
  seedDatabase,
  importActuators,
  importManualOverrides,
  connectDatabase
};
