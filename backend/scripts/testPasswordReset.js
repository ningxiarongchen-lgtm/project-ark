/**
 * 测试密码重置功能
 * 运行方式: node scripts/testPasswordReset.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const testPasswordReset = async () => {
  try {
    // 连接数据库
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cmax';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB连接成功');

    // 创建测试用户
    console.log('\n📝 创建测试用户...');
    
    // 先删除可能存在的测试用户
    await User.deleteOne({ username: 'testuser' });
    
    const testUser = await User.create({
      username: 'testuser',
      name: '测试用户',
      password: 'test123', // 将被自动哈希
      role: 'Sales Engineer',
      department: '销售部',
      isActive: true,
      passwordChangeRequired: true // 新用户需要修改密码
    });

    console.log('✅ 测试用户创建成功:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   用户名: ${testUser.username}`);
    console.log(`   姓名: ${testUser.name}`);
    console.log(`   初始密码: test123`);
    console.log(`   角色: ${testUser.role}`);
    console.log(`   需要修改密码: ${testUser.passwordChangeRequired}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n📋 测试步骤:');
    console.log('1. 使用 testuser/test123 登录');
    console.log('2. 系统应自动跳转到修改密码页面');
    console.log('3. 修改密码后应能正常访问系统');
    console.log('4. 管理员可以通过用户管理界面重置密码');

    process.exit(0);
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error.message);
    process.exit(1);
  }
};

testPasswordReset();

