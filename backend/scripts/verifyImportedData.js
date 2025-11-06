/**
 * 验证导入数据脚本
 * 查看SF、AT、GY三个系列的导入数据详情
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Actuator = require('../models/Actuator');

async function connectDB() {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cmax';
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ 已连接到MongoDB: ${mongoose.connection.name}\n`);
  } catch (error) {
    console.error(`❌ MongoDB连接错误: ${error.message}`);
    process.exit(1);
  }
}

async function verifySeries(seriesName) {
  console.log(`${'='.repeat(60)}`);
  console.log(`📊 ${seriesName}系列数据验证`);
  console.log(`${'='.repeat(60)}\n`);
  
  const actuators = await Actuator.find({ series: seriesName })
    .sort({ model_base: 1 })
    .lean();
  
  console.log(`总计: ${actuators.length} 条记录\n`);
  
  // 显示前5条数据
  console.log(`前5条数据示例:\n`);
  actuators.slice(0, 5).forEach((act, index) => {
    console.log(`${index + 1}. ${act.model_base}`);
    console.log(`   系列: ${act.series}`);
    console.log(`   机构: ${act.mechanism}`);
    console.log(`   作用类型: ${act.action_type}${act.spring_range ? ' (' + act.spring_range + ')' : ''}`);
    console.log(`   价格: 常温=${act.base_price_normal}, 低温=${act.base_price_low}, 高温=${act.base_price_high}`);
    console.log(`   状态: ${act.status}`);
    console.log(`   本体尺寸: ${act.body_size || 'N/A'}`);
    if (act.cylinder_size) {
      console.log(`   气缸尺寸: ${act.cylinder_size}`);
    }
    console.log();
  });
  
  // 统计信息
  const daCount = actuators.filter(a => a.action_type === 'DA').length;
  const srCount = actuators.filter(a => a.action_type === 'SR').length;
  const avgPrice = actuators.reduce((sum, a) => sum + (a.base_price_normal || 0), 0) / actuators.length;
  
  console.log(`统计信息:`);
  console.log(`   双作用(DA): ${daCount} 条`);
  console.log(`   单作用(SR): ${srCount} 条`);
  console.log(`   平均常温价格: ¥${avgPrice.toFixed(2)}`);
  console.log();
}

async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🔍 三系列执行器数据验证工具`);
  console.log(`${'═'.repeat(60)}\n`);
  
  try {
    await connectDB();
    
    // 验证三个系列
    await verifySeries('SF');
    await verifySeries('AT');
    await verifySeries('GY');
    
    // 总体统计
    console.log(`${'═'.repeat(60)}`);
    console.log(`📈 总体统计`);
    console.log(`${'═'.repeat(60)}\n`);
    
    const totalCount = await Actuator.countDocuments();
    const sfCount = await Actuator.countDocuments({ series: 'SF' });
    const atCount = await Actuator.countDocuments({ series: 'AT' });
    const gyCount = await Actuator.countDocuments({ series: 'GY' });
    
    console.log(`数据库中执行器总数: ${totalCount}`);
    console.log(`   SF系列: ${sfCount} 条 (${(sfCount/totalCount*100).toFixed(1)}%)`);
    console.log(`   AT系列: ${atCount} 条 (${(atCount/totalCount*100).toFixed(1)}%)`);
    console.log(`   GY系列: ${gyCount} 条 (${(gyCount/totalCount*100).toFixed(1)}%)`);
    console.log(`   其他: ${totalCount - sfCount - atCount - gyCount} 条\n`);
    
    console.log(`✅ 验证完成！\n`);
    
  } catch (error) {
    console.error(`❌ 验证出错:`, error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log(`✅ 数据库连接已关闭`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { verifySeries, main };

