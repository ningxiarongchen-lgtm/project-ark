/**
 * SF系列尺寸数据查询脚本
 * 
 * 功能：快速查询和验证 SF 系列执行器的尺寸数据
 * 
 * 使用方法：
 * node backend/query_sf_dimensions.js [型号]
 * 
 * 示例：
 * node backend/query_sf_dimensions.js SF10-150DA
 * node backend/query_sf_dimensions.js  (查询所有SF系列)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Actuator = require('./models/Actuator');

// 数据库连接字符串
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/model_selection_system';

/**
 * 格式化输出尺寸数据
 */
function displayDimensions(actuator) {
  const { model_base, body_size, action_type, dimensions } = actuator;
  
  console.log('\n========================================');
  console.log(`型号: ${model_base}`);
  console.log(`本体尺寸: ${body_size}`);
  console.log(`作用类型: ${action_type === 'DA' ? '双作用' : '单作用'}`);
  console.log('========================================\n');
  
  if (!dimensions || Object.keys(dimensions).length === 0) {
    console.log('❌ 无尺寸数据\n');
    return;
  }
  
  // 轮廓尺寸
  if (dimensions.outline) {
    console.log('📏 轮廓尺寸:');
    if (dimensions.outline.L1) console.log(`   L1 (单作用总长): ${dimensions.outline.L1} mm`);
    if (dimensions.outline.L2) console.log(`   L2 (气缸长度): ${dimensions.outline.L2} mm`);
    if (dimensions.outline.m1) console.log(`   m1: ${dimensions.outline.m1} mm`);
    if (dimensions.outline.m2) console.log(`   m2: ${dimensions.outline.m2} mm`);
    if (dimensions.outline.A) console.log(`   A: ${dimensions.outline.A} mm`);
    if (dimensions.outline.H1) console.log(`   H1: ${dimensions.outline.H1} mm`);
    if (dimensions.outline.H2) console.log(`   H2: ${dimensions.outline.H2} mm`);
    if (dimensions.outline.D) console.log(`   D (直径): ${dimensions.outline.D} mm`);
    console.log('');
  }
  
  // 法兰尺寸
  if (dimensions.flange) {
    console.log('🔩 法兰尺寸:');
    if (dimensions.flange.standard) console.log(`   标准: ${dimensions.flange.standard}`);
    if (dimensions.flange.A) console.log(`   A (方口尺寸): ${dimensions.flange.A} mm`);
    if (dimensions.flange.D) console.log(`   D (外径): ${dimensions.flange.D} mm`);
    if (dimensions.flange.C) console.log(`   C: ${dimensions.flange.C} mm`);
    if (dimensions.flange.F) console.log(`   F: ${dimensions.flange.F} mm`);
    if (dimensions.flange.threadSpec) console.log(`   螺纹规格: ${dimensions.flange.threadSpec}`);
    if (dimensions.flange.threadDepth) console.log(`   螺纹深度: ${dimensions.flange.threadDepth} mm`);
    if (dimensions.flange.B) console.log(`   B: ${dimensions.flange.B} mm`);
    if (dimensions.flange.T) console.log(`   T (厚度): ${dimensions.flange.T} mm`);
    console.log('');
  }
  
  // 顶部安装
  if (dimensions.topMounting) {
    console.log('🔝 顶部安装:');
    if (dimensions.topMounting.standard) console.log(`   标准: ${dimensions.topMounting.standard}`);
    if (dimensions.topMounting.L) console.log(`   L: ${dimensions.topMounting.L} mm`);
    if (dimensions.topMounting.h1) console.log(`   h1: ${dimensions.topMounting.h1} mm`);
    if (dimensions.topMounting.H) console.log(`   H: ${dimensions.topMounting.H} mm`);
    console.log('');
  }
  
  // 气动连接
  if (dimensions.pneumaticConnection) {
    console.log('🔌 气动连接:');
    if (dimensions.pneumaticConnection.size) console.log(`   接口尺寸: ${dimensions.pneumaticConnection.size}`);
    if (dimensions.pneumaticConnection.h2) console.log(`   h2: ${dimensions.pneumaticConnection.h2} mm`);
    console.log('');
  }
}

/**
 * 主查询函数
 */
async function queryDimensions() {
  const modelArg = process.argv[2]; // 从命令行参数获取型号
  
  try {
    // 连接数据库
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ 已连接到数据库');
    
    if (modelArg) {
      // 查询特定型号
      console.log(`\n🔍 查询型号: ${modelArg}`);
      
      const actuator = await Actuator.findOne({ 
        model_base: modelArg.toUpperCase() 
      });
      
      if (!actuator) {
        console.log(`\n❌ 未找到型号: ${modelArg}`);
        return;
      }
      
      displayDimensions(actuator);
      
    } else {
      // 查询所有 SF 系列
      console.log('\n🔍 查询所有 SF 系列执行器\n');
      
      const actuators = await Actuator.find({ 
        series: 'SF',
        is_active: true 
      }).sort({ model_base: 1 });
      
      console.log(`找到 ${actuators.length} 个 SF 系列执行器\n`);
      
      let withDimensionsCount = 0;
      let withoutDimensionsCount = 0;
      
      // 统计概览
      console.log('========== 数据完整性概览 ==========\n');
      
      for (const actuator of actuators) {
        const hasDimensions = actuator.dimensions && 
                             Object.keys(actuator.dimensions).length > 0;
        
        if (hasDimensions) {
          const hasAllFields = actuator.dimensions.outline &&
                              actuator.dimensions.flange &&
                              actuator.dimensions.topMounting &&
                              actuator.dimensions.pneumaticConnection;
          
          if (hasAllFields) {
            console.log(`✅ ${actuator.model_base}: 完整`);
            withDimensionsCount++;
          } else {
            console.log(`⚠️  ${actuator.model_base}: 不完整`);
            withoutDimensionsCount++;
          }
        } else {
          console.log(`❌ ${actuator.model_base}: 无数据`);
          withoutDimensionsCount++;
        }
      }
      
      console.log('\n========== 统计结果 ==========');
      console.log(`✅ 数据完整: ${withDimensionsCount} 个型号`);
      console.log(`⚠️  数据缺失: ${withoutDimensionsCount} 个型号`);
      console.log(`📊 总计: ${actuators.length} 个型号`);
      console.log(`📈 完整率: ${((withDimensionsCount / actuators.length) * 100).toFixed(2)}%`);
      
      // 询问是否显示详细信息
      if (actuators.length > 0 && actuators.length <= 10) {
        console.log('\n========== 详细信息 ==========');
        actuators.forEach(displayDimensions);
      } else if (actuators.length > 10) {
        console.log('\n💡 提示: 数据过多，使用 "node backend/query_sf_dimensions.js [型号]" 查询特定型号');
      }
    }
    
  } catch (error) {
    console.error('❌ 查询错误:', error.message);
    console.error(error.stack);
  } finally {
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('\n✅ 已断开数据库连接\n');
  }
}

// 显示使用说明
function showUsage() {
  console.log('\n========== SF系列尺寸数据查询工具 ==========\n');
  console.log('用法:');
  console.log('  node backend/query_sf_dimensions.js              查询所有SF系列');
  console.log('  node backend/query_sf_dimensions.js [型号]       查询特定型号\n');
  console.log('示例:');
  console.log('  node backend/query_sf_dimensions.js SF10-150DA');
  console.log('  node backend/query_sf_dimensions.js SF60-900SR3\n');
}

// 运行查询
if (require.main === module) {
  // 检查是否请求帮助
  if (process.argv.includes('-h') || process.argv.includes('--help')) {
    showUsage();
    process.exit(0);
  }
  
  queryDimensions()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { queryDimensions, displayDimensions };

