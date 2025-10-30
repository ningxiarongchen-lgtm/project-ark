/**
 * ═══════════════════════════════════════════════════════════════════════
 * 数据完整性验证脚本
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * 功能：验证数据库中所有核心产品数据是否完整导入
 * 用途：确保不会出现"测试时没数据，上线后又要改"的问题
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Actuator = require('./models/Actuator');
const ManualOverride = require('./models/ManualOverride');
const Accessory = require('./models/Accessory');

// 预期的数据量（基于CSV文件）
const EXPECTED_DATA = {
  'AT/GY系列执行器': 54,  // at_gy_actuators_data_final.csv (55行-1标题行)
  'SF系列执行器': 140,      // sf_actuators_data.csv (141行-1标题行)
  '手动操作装置': 18,        // manual_overrides_data.csv (19行-1标题行)
  '配件': 10                 // 程序中定义的配件数量
};

async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/cmax';
    await mongoose.connect(mongoUri);
    console.log('✅ 数据库连接成功:', mongoose.connection.name);
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    throw error;
  }
}

async function verifyActuators() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  1. 验证执行器数据                                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  const results = {
    passed: true,
    details: []
  };
  
  try {
    // 1.1 AT/GY系列
    const atGyCount = await Actuator.countDocuments({ series: { $in: ['AT', 'GY'] } });
    const atGyExpected = EXPECTED_DATA['AT/GY系列执行器'];
    const atGyStatus = atGyCount >= atGyExpected ? '✅' : '❌';
    
    console.log(`${atGyStatus} AT/GY系列执行器:`);
    console.log(`   实际: ${atGyCount} 个`);
    console.log(`   预期: ${atGyExpected} 个`);
    
    if (atGyCount < atGyExpected) {
      results.passed = false;
      results.details.push({
        category: 'AT/GY系列执行器',
        expected: atGyExpected,
        actual: atGyCount,
        status: 'MISSING'
      });
    }
    
    // 获取AT/GY系列样本数据
    const atGySamples = await Actuator.find({ series: { $in: ['AT', 'GY'] } })
      .select('series model_base action_type max_torque status')
      .limit(3);
    
    console.log('   样本数据:');
    atGySamples.forEach(a => {
      console.log(`   - ${a.series}-${a.model_base} (${a.action_type}), 扭矩: ${a.max_torque}Nm, 状态: ${a.status}`);
    });
    
    // 1.2 SF系列
    console.log('\n');
    const sfCount = await Actuator.countDocuments({ series: 'SF' });
    const sfExpected = EXPECTED_DATA['SF系列执行器'];
    const sfStatus = sfCount >= sfExpected ? '✅' : '❌';
    
    console.log(`${sfStatus} SF系列执行器:`);
    console.log(`   实际: ${sfCount} 个`);
    console.log(`   预期: ${sfExpected} 个`);
    
    if (sfCount < sfExpected) {
      results.passed = false;
      results.details.push({
        category: 'SF系列执行器',
        expected: sfExpected,
        actual: sfCount,
        status: 'MISSING'
      });
    }
    
    // 获取SF系列样本数据（验证关键字段）
    const sfSamples = await Actuator.find({ series: 'SF' })
      .select('series model_base action_type torque_data dimensions specifications status')
      .limit(3);
    
    console.log('   样本数据:');
    sfSamples.forEach(a => {
      const hasSymmetric = a.torque_data?.symmetric?.length > 0;
      const hasCanted = a.torque_data?.canted?.length > 0;
      const hasDimensions = a.dimensions?.outline?.L1 > 0;
      
      console.log(`   - ${a.series}-${a.model_base} (${a.action_type})`);
      console.log(`     对称拨叉数据: ${hasSymmetric ? '✅' : '❌'} ${hasSymmetric ? a.torque_data.symmetric.length + '条' : ''}`);
      console.log(`     偏心拨叉数据: ${hasCanted ? '✅' : '❌'} ${hasCanted ? a.torque_data.canted.length + '条' : ''}`);
      console.log(`     尺寸数据: ${hasDimensions ? '✅' : '❌'} L1=${a.dimensions?.outline?.L1 || 0}`);
      console.log(`     状态: ${a.status}`);
    });
    
    // 1.3 验证SF系列关键数据完整性
    console.log('\n');
    const sfMissingTorque = await Actuator.countDocuments({
      series: 'SF',
      $or: [
        { 'torque_data.symmetric': { $exists: false } },
        { 'torque_data.symmetric': { $size: 0 } }
      ]
    });
    
    const sfMissingDimensions = await Actuator.countDocuments({
      series: 'SF',
      $or: [
        { 'dimensions.outline.L1': { $exists: false } },
        { 'dimensions.outline.L1': 0 }
      ]
    });
    
    if (sfMissingTorque > 0) {
      console.log(`⚠️  警告: ${sfMissingTorque} 个SF系列型号缺少扭矩数据`);
      results.details.push({
        category: 'SF系列扭矩数据',
        expected: sfCount,
        actual: sfCount - sfMissingTorque,
        status: 'INCOMPLETE'
      });
    }
    
    if (sfMissingDimensions > 0) {
      console.log(`⚠️  警告: ${sfMissingDimensions} 个SF系列型号缺少尺寸数据`);
      results.details.push({
        category: 'SF系列尺寸数据',
        expected: sfCount,
        actual: sfCount - sfMissingDimensions,
        status: 'INCOMPLETE'
      });
    }
    
    // 1.4 总计
    const totalActuators = atGyCount + sfCount;
    const totalExpected = atGyExpected + sfExpected;
    
    console.log('\n');
    console.log(`📊 执行器总计: ${totalActuators}/${totalExpected} (${((totalActuators/totalExpected)*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('❌ 执行器数据验证失败:', error.message);
    results.passed = false;
    results.details.push({
      category: '执行器验证',
      error: error.message,
      status: 'ERROR'
    });
  }
  
  return results;
}

async function verifyManualOverrides() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  2. 验证手动操作装置数据                                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  const results = {
    passed: true,
    details: []
  };
  
  try {
    const count = await ManualOverride.countDocuments();
    const expected = EXPECTED_DATA['手动操作装置'];
    const status = count >= expected ? '✅' : '❌';
    
    console.log(`${status} 手动操作装置:`);
    console.log(`   实际: ${count} 个`);
    console.log(`   预期: ${expected} 个`);
    
    if (count < expected) {
      results.passed = false;
      results.details.push({
        category: '手动操作装置',
        expected: expected,
        actual: count,
        status: 'MISSING'
      });
    }
    
    // 获取样本数据
    const samples = await ManualOverride.find()
      .select('series model_number handle_type max_torque status')
      .limit(3);
    
    console.log('   样本数据:');
    samples.forEach(m => {
      console.log(`   - ${m.series}-${m.model_number}, 类型: ${m.handle_type}, 扭矩: ${m.max_torque}Nm, 状态: ${m.status}`);
    });
    
    // 验证按类型分组
    const byType = await ManualOverride.aggregate([
      { $group: { _id: '$handle_type', count: { $sum: 1 } } }
    ]);
    
    console.log('\n   按类型统计:');
    byType.forEach(t => {
      console.log(`   - ${t._id}: ${t.count} 个`);
    });
    
  } catch (error) {
    console.error('❌ 手动操作装置验证失败:', error.message);
    results.passed = false;
    results.details.push({
      category: '手动操作装置验证',
      error: error.message,
      status: 'ERROR'
    });
  }
  
  return results;
}

async function verifyAccessories() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  3. 验证配件数据                                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  const results = {
    passed: true,
    details: []
  };
  
  try {
    const count = await Accessory.countDocuments();
    const expected = EXPECTED_DATA['配件'];
    const status = count >= expected ? '✅' : '❌';
    
    console.log(`${status} 配件:`);
    console.log(`   实际: ${count} 个`);
    console.log(`   预期: ${expected} 个`);
    
    if (count < expected) {
      results.passed = false;
      results.details.push({
        category: '配件',
        expected: expected,
        actual: count,
        status: 'MISSING'
      });
    }
    
    // 按类型分组
    const byType = await Accessory.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    console.log('   按类型统计:');
    byType.forEach(t => {
      console.log(`   - ${t._id}: ${t.count} 个`);
    });
    
  } catch (error) {
    console.error('❌ 配件验证失败:', error.message);
    results.passed = false;
    results.details.push({
      category: '配件验证',
      error: error.message,
      status: 'ERROR'
    });
  }
  
  return results;
}

async function generateReport(actuatorResults, manualOverrideResults, accessoryResults) {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('                          数据完整性验证报告                            ');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('\n');
  
  const allPassed = actuatorResults.passed && manualOverrideResults.passed && accessoryResults.passed;
  
  if (allPassed) {
    console.log('🎉 恭喜！所有核心数据已完整导入！\n');
    console.log('✅ AT/GY系列执行器: 完整');
    console.log('✅ SF系列执行器: 完整（包括对称/偏心拨叉数据和尺寸）');
    console.log('✅ 手动操作装置: 完整');
    console.log('✅ 配件: 完整');
    console.log('\n');
    console.log('📝 下次测试或上线，只需运行: npm run seed:final');
    console.log('   所有数据将自动完整导入，无需手动干预！');
  } else {
    console.log('⚠️  发现数据缺失或不完整！\n');
    
    const allIssues = [
      ...actuatorResults.details,
      ...manualOverrideResults.details,
      ...accessoryResults.details
    ];
    
    if (allIssues.length > 0) {
      console.log('问题清单:');
      allIssues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.category}`);
        if (issue.status === 'MISSING') {
          console.log(`   预期: ${issue.expected} 个`);
          console.log(`   实际: ${issue.actual} 个`);
          console.log(`   缺失: ${issue.expected - issue.actual} 个`);
        } else if (issue.status === 'INCOMPLETE') {
          console.log(`   预期: ${issue.expected} 个完整记录`);
          console.log(`   实际: ${issue.actual} 个完整记录`);
          console.log(`   不完整: ${issue.expected - issue.actual} 个`);
        } else if (issue.status === 'ERROR') {
          console.log(`   错误: ${issue.error}`);
        }
      });
      
      console.log('\n');
      console.log('🔧 修复建议:');
      console.log('   1. 检查 backend/seed_final_acceptance.js 脚本');
      console.log('   2. 确认所有 CSV 文件完整且格式正确');
      console.log('   3. 重新运行: npm run seed:final');
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════════\n');
  
  return allPassed;
}

async function main() {
  try {
    await connectDatabase();
    
    const actuatorResults = await verifyActuators();
    const manualOverrideResults = await verifyManualOverrides();
    const accessoryResults = await verifyAccessories();
    
    const allPassed = await generateReport(actuatorResults, manualOverrideResults, accessoryResults);
    
    await mongoose.connection.close();
    console.log('✅ 数据库连接已关闭\n');
    
    // 返回退出码（0=成功，1=失败）
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ 验证过程出错:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// 运行主程序
main();

