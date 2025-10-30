/**
 * 更新临时手机号为真实手机号
 * 
 * 运行方法：
 * node migrations/update_temp_phones.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

// 用户角色到手机号的映射
const roleToPhone = {
  'Administrator': '13800138000',
  'Technical Engineer': '13800138001',
  'Sales Engineer': '13800138003',
  'Sales Manager': '13800138002',
  'Procurement Specialist': '13800138004',
  'Production Planner': '13800138005',
  'After-sales Engineer': '13800138006'
};

async function updateTempPhones() {
  try {
    // 连接数据库
    await connectDB();
    console.log('✅ 数据库连接成功');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // 查找所有使用临时手机号的用户
    const usersWithTempPhone = await usersCollection.find({
      phone: { $regex: /^100000/ }
    }).toArray();
    
    console.log(`\n📊 发现 ${usersWithTempPhone.length} 个用户使用临时手机号`);
    
    if (usersWithTempPhone.length === 0) {
      console.log('✅ 没有需要更新的用户');
      process.exit(0);
    }
    
    let updatedCount = 0;
    
    for (const user of usersWithTempPhone) {
      const newPhone = roleToPhone[user.role];
      
      if (!newPhone) {
        console.log(`⚠️  用户 "${user.full_name || user.name}" 的角色 "${user.role}" 没有对应的手机号映射`);
        continue;
      }
      
      // 检查新手机号是否已被使用
      const existingUser = await usersCollection.findOne({ 
        phone: newPhone,
        _id: { $ne: user._id }
      });
      
      if (existingUser) {
        console.log(`⚠️  手机号 ${newPhone} 已被用户 "${existingUser.full_name || existingUser.name}" 使用，跳过更新 "${user.full_name || user.name}"`);
        continue;
      }
      
      // 更新手机号
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { phone: newPhone } }
      );
      
      console.log(`✅ 已更新用户 "${user.full_name || user.name}" (${user.role})`);
      console.log(`   旧手机号: ${user.phone} → 新手机号: ${newPhone}`);
      updatedCount++;
    }
    
    console.log(`\n✅ 成功更新 ${updatedCount} 个用户的手机号`);
    
    // 显示最终的用户列表
    console.log('\n📋 更新后的用户列表：');
    const allUsers = await usersCollection.find({}).toArray();
    
    console.log('┌────────────────────────────────────────────────────────────┐');
    allUsers.forEach(user => {
      const name = (user.full_name || user.name || '未知').padEnd(20, ' ');
      const phone = (user.phone || '无').padEnd(15, ' ');
      const role = (user.role || '未知').padEnd(25, ' ');
      console.log(`│ ${name} ${phone} ${role}│`);
    });
    console.log('└────────────────────────────────────────────────────────────┘');
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ 数据库连接已关闭');
    process.exit(0);
  }
}

// 运行更新
console.log('🚀 开始更新临时手机号...\n');
updateTempPhones();

