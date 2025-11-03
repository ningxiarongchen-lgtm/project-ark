/**
 * 添加何晓晓(Kay)为管理员
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function addKayAdmin() {
  try {
    const dbUrl = process.env.MONGODB_URI || process.env.DATABASE_URL;
    
    console.log('🔌 正在连接数据库...');
    await mongoose.connect(dbUrl);
    console.log('✅ 数据库连接成功\n');

    const phone = '18322695661';
    
    // 检查是否已存在
    const existing = await User.findOne({ phone });
    
    if (existing) {
      console.log('📋 找到现有用户，正在升级为管理员...');
      existing.role = 'Administrator';
      existing.department = '管理部门';
      existing.isActive = true;
      await existing.save();
      
      console.log('\n✅ 升级成功！');
      console.log(`   姓名: ${existing.full_name}`);
      console.log(`   手机号: ${existing.phone}`);
      console.log(`   角色: ${existing.role} ⭐`);
    } else {
      console.log('📋 用户不存在，正在创建新管理员...');
      
      const newAdmin = await User.create({
        phone: '18322695661',
        full_name: '何晓晓',
        english_name: 'Kay',
        signature: '事缓则圆',
        password: 'Kay@2024',  // 初始密码
        role: 'Administrator',
        department: '管理部门',
        isActive: true,
        passwordChangeRequired: false
      });
      
      console.log('\n✅ 创建成功！');
      console.log('\n🎉 新管理员信息:');
      console.log(`   姓名: ${newAdmin.full_name} (${newAdmin.english_name})`);
      console.log(`   手机号: ${newAdmin.phone}`);
      console.log(`   初始密码: Kay@2024`);
      console.log(`   角色: ${newAdmin.role} ⭐`);
      console.log(`   部门: ${newAdmin.department}`);
    }
    
    console.log('\n🚀 现在可以使用以下信息登录:');
    console.log(`   手机号: 18322695661`);
    console.log(`   密码: Kay@2024 (或您设置的原密码)`);
    console.log(`   角色: 管理员`);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

addKayAdmin();


