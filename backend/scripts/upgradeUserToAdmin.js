/**
 * 将指定用户升级为管理员
 * 用途：快速赋予用户管理员权限
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function upgradeToAdmin() {
  try {
    // 连接数据库
    const dbUrl = process.env.MONGODB_URI || process.env.DATABASE_URL;
    
    if (!dbUrl) {
      console.error('❌ 错误：未找到数据库连接字符串');
      console.error('请确保 .env 文件中设置了 MONGODB_URI 或 DATABASE_URL');
      process.exit(1);
    }

    console.log('🔌 正在连接数据库...');
    await mongoose.connect(dbUrl);
    console.log('✅ 数据库连接成功');

    // 查找何晓晓的账号
    const phone = '18322695661';
    console.log(`\n🔍 查找用户: ${phone}`);
    
    const user = await User.findOne({ phone });
    
    if (!user) {
      console.error(`❌ 错误：未找到手机号为 ${phone} 的用户`);
      process.exit(1);
    }

    console.log(`\n📋 找到用户:`);
    console.log(`   姓名: ${user.full_name}`);
    console.log(`   英文名: ${user.english_name}`);
    console.log(`   当前角色: ${user.role}`);
    console.log(`   部门: ${user.department}`);

    // 升级为管理员
    console.log(`\n🔄 正在升级为管理员...`);
    
    user.role = 'Administrator';
    user.department = '管理部门';
    await user.save();

    console.log(`\n✅ 升级成功！`);
    console.log(`\n📋 更新后的信息:`);
    console.log(`   姓名: ${user.full_name} (${user.english_name})`);
    console.log(`   手机号: ${user.phone}`);
    console.log(`   新角色: ${user.role} ⭐`);
    console.log(`   部门: ${user.department}`);
    console.log(`   激活状态: ${user.isActive ? '✅ 已激活' : '❌ 未激活'}`);
    
    console.log(`\n🎉 现在可以使用以下信息登录:`);
    console.log(`   手机号: ${user.phone}`);
    console.log(`   密码: [保持原密码不变]`);
    console.log(`   角色: 管理员 (Administrator)`);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 执行升级
upgradeToAdmin();


