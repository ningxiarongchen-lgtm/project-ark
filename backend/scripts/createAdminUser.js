/**
 * 创建初始管理员用户脚本
 * 运行方式: node scripts/createAdminUser.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // 连接数据库
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_ark';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB连接成功');

    // 检查admin用户是否已存在
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  管理员用户已存在');
      console.log(`   用户名: ${existingAdmin.username}`);
      console.log(`   姓名: ${existingAdmin.name}`);
      console.log(`   角色: ${existingAdmin.role}`);
      process.exit(0);
    }

    // 创建管理员用户
    const adminUser = await User.create({
      username: 'admin',
      name: '系统管理员',
      password: 'admin123', // 将被自动哈希
      role: 'Administrator',
      department: 'IT',
      isActive: true
    });

    console.log('✅ 管理员用户创建成功!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   用户名: ${adminUser.username}`);
    console.log(`   姓名: ${adminUser.name}`);
    console.log(`   初始密码: admin123`);
    console.log(`   角色: ${adminUser.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  请登录后立即修改密码！');

    process.exit(0);
  } catch (error) {
    console.error('❌ 创建管理员失败:', error.message);
    process.exit(1);
  }
};

createAdminUser();

