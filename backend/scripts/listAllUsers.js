/**
 * 列出所有用户
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function listUsers() {
  try {
    const dbUrl = process.env.MONGODB_URI || process.env.DATABASE_URL;
    
    console.log('🔌 正在连接数据库...');
    await mongoose.connect(dbUrl);
    console.log('✅ 数据库连接成功\n');

    const users = await User.find({}).select('phone full_name english_name role department isActive');
    
    console.log(`📋 系统中共有 ${users.length} 个用户:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name} (${user.english_name || 'N/A'})`);
      console.log(`   手机号: ${user.phone}`);
      console.log(`   角色: ${user.role}`);
      console.log(`   部门: ${user.department || 'N/A'}`);
      console.log(`   状态: ${user.isActive ? '✅ 激活' : '❌ 未激活'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

listUsers();


