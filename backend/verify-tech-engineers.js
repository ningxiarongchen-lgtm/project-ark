#!/usr/bin/env node
/**
 * 快速验证技术工程师数据
 * 用法: node verify-tech-engineers.js
 */
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cmax';
    await mongoose.connect(dbUri);
    console.log('✅ 数据库连接成功:', mongoose.connection.name);
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
};

const verify = async () => {
  try {
    console.log('\n📊 验证技术工程师数据\n');
    console.log('='.repeat(60));
    
    // 查询所有技术工程师（包括不活跃的）
    const allTech = await User.find({ role: 'Technical Engineer' })
      .select('phone full_name isActive department');
    
    console.log(`\n总共找到 ${allTech.length} 个技术工程师用户:\n`);
    
    allTech.forEach((user, index) => {
      const status = user.isActive ? '✅ 活跃' : '❌ 不活跃';
      console.log(`${index + 1}. ${user.full_name} (${user.phone})`);
      console.log(`   状态: ${status}`);
      console.log(`   部门: ${user.department || '(无)'}`);
      console.log('');
    });
    
    // 查询活跃的技术工程师（API使用的逻辑）
    const activeTech = await User.find({ 
      role: 'Technical Engineer',
      isActive: { $ne: false }
    });
    
    console.log('='.repeat(60));
    console.log(`\n✅ API会返回 ${activeTech.length} 个活跃技术工程师\n`);
    
    if (activeTech.length === 0) {
      console.log('⚠️  警告: 没有活跃的技术工程师！');
      console.log('   解决方案: 运行 node seed_final_acceptance.js 初始化数据');
    } else {
      console.log('活跃技术工程师列表:');
      activeTech.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.full_name} (${user.phone})`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 验证完成\n');
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  }
};

const main = async () => {
  await connectDB();
  await verify();
  await mongoose.connection.close();
  process.exit(0);
};

main();

