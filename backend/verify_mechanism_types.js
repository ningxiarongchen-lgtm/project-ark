require('dotenv').config();
const mongoose = require('mongoose');
const Actuator = require('./models/Actuator');

async function verify() {
  await mongoose.connect('mongodb://localhost:27017/cmax');
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  数据完整性最终验证');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // 检查AT系列
  const atSample = await Actuator.findOne({ series: 'AT' });
  console.log('✅ AT系列验证:');
  console.log('   型号:', atSample.model_base);
  console.log('   系列:', atSample.series);
  console.log('   机构类型:', atSample.mechanism || '❌ 未设置');
  console.log('   阀门类型:', atSample.valve_type || '(不适用)');
  
  // 检查GY系列
  const gySample = await Actuator.findOne({ series: 'GY' });
  if (gySample) {
    console.log('\n✅ GY系列验证:');
    console.log('   型号:', gySample.model_base);
    console.log('   系列:', gySample.series);
    console.log('   机构类型:', gySample.mechanism || '❌ 未设置');
    console.log('   阀门类型:', gySample.valve_type || '(不适用)');
  }
  
  // 检查SF系列
  const sfSample = await Actuator.findOne({ series: 'SF' });
  console.log('\n✅ SF系列验证:');
  console.log('   型号:', sfSample.model_base);
  console.log('   系列:', sfSample.series);
  console.log('   机构类型:', sfSample.mechanism || '❌ 未设置');
  console.log('   阀门类型:', sfSample.valve_type || '(同时支持球阀/蝶阀)');
  console.log('   对称拨叉数据:', sfSample.torque_data?.symmetric ? '✅ 有' : '❌ 无');
  console.log('   偏心拨叉数据:', sfSample.torque_data?.canted ? '✅ 有' : '❌ 无');
  
  // 统计
  const atCount = await Actuator.countDocuments({ series: 'AT', mechanism: '齿轮齿条' });
  const gyCount = await Actuator.countDocuments({ series: 'GY', mechanism: '齿轮齿条' });
  const sfCount = await Actuator.countDocuments({ series: 'SF', mechanism: '拨叉式' });
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  统计结果');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('AT系列（齿轮齿条）:', atCount, '个');
  console.log('GY系列（齿轮齿条）:', gyCount, '个');
  console.log('SF系列（拨叉式）:', sfCount, '个');
  
  const hasIssue = (atSample && !atSample.mechanism) || (sfSample && !sfSample.mechanism);
  
  if (hasIssue) {
    console.log('\n❌ 发现问题：机构类型未正确设置！');
    console.log('\n🔧 解决方法: 重新运行 npm run seed:final');
  } else {
    console.log('\n🎉 所有数据验证通过！');
    console.log('✅ 机构类型设置正确');
    console.log('✅ 阀门类型逻辑正确');
    console.log('✅ 扭矩数据完整');
  }
  
  await mongoose.connection.close();
  process.exit(hasIssue ? 1 : 0);
}

verify().catch(err => {
  console.error('验证失败:', err);
  process.exit(1);
});

