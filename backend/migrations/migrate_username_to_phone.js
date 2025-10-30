/**
 * 数据迁移脚本：将用户登录凭证从 username 升级为 phone
 * 
 * 功能：
 * 1. 将 username 字段重命名为 phone
 * 2. 将 name 字段重命名为 full_name
 * 3. 为没有手机号的用户生成临时手机号（需手动更新）
 * 
 * 运行方法：
 * node migrations/migrate_username_to_phone.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

async function migrateUsernameToPhone() {
  try {
    // 连接数据库
    await connectDB();
    console.log('✅ 数据库连接成功');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // 首先删除旧的 username 唯一索引
    try {
      await usersCollection.dropIndex('username_1');
      console.log('✅ 已删除旧的 username 索引');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  username 索引不存在，跳过删除');
      } else {
        console.log('⚠️  删除索引时出错:', error.message);
      }
    }
    
    // 检查是否有需要迁移的数据
    const usersWithUsername = await usersCollection.countDocuments({ username: { $exists: true } });
    console.log(`\n📊 发现 ${usersWithUsername} 个用户需要迁移`);
    
    if (usersWithUsername === 0) {
      console.log('✅ 没有需要迁移的数据');
      process.exit(0);
    }
    
    // 获取所有用户
    const users = await usersCollection.find({ username: { $exists: true } }).toArray();
    
    let migratedCount = 0;
    let tempPhoneCounter = 10000000000; // 临时手机号起始值
    
    for (const user of users) {
      const updates = {};
      
      // 1. 迁移 username -> phone
      if (user.username) {
        // 如果已有 phone 字段，保留它
        if (user.phone && /^1[3-9]\d{9}$/.test(user.phone)) {
          // 已有有效手机号，保留
          updates.phone = user.phone;
        } else {
          // 生成临时手机号（11位，以190开头）
          tempPhoneCounter++;
          updates.phone = String(tempPhoneCounter);
          console.log(`⚠️  用户 "${user.username}" 没有有效手机号，使用临时号码: ${updates.phone}`);
        }
        
        // 删除旧的 username 字段
        updates.$unset = { username: "" };
      }
      
      // 2. 迁移 name -> full_name
      if (user.name && !user.full_name) {
        updates.full_name = user.name;
        if (!updates.$unset) updates.$unset = {};
        updates.$unset.name = "";
      }
      
      // 执行更新
      if (Object.keys(updates).length > 0) {
        const $set = { ...updates };
        delete $set.$unset;
        
        const updateDoc = {};
        if (Object.keys($set).length > 0) {
          updateDoc.$set = $set;
        }
        if (updates.$unset) {
          updateDoc.$unset = updates.$unset;
        }
        
        await usersCollection.updateOne(
          { _id: user._id },
          updateDoc
        );
        
        migratedCount++;
      }
    }
    
    console.log(`\n✅ 成功迁移 ${migratedCount} 个用户`);
    
    // 创建新的 phone 唯一索引
    try {
      await usersCollection.createIndex({ phone: 1 }, { unique: true });
      console.log('✅ 已创建新的 phone 唯一索引');
    } catch (error) {
      console.log('⚠️  创建索引时出错:', error.message);
    }
    
    console.log('\n⚠️  重要提示：');
    console.log('   1. 请为使用临时手机号的用户更新为真实手机号');
    console.log('   2. 临时手机号格式：190XXXXXXXX (以190开头的11位数字)');
    console.log('   3. 更新后，用户将使用手机号登录系统');
    console.log('   4. 前端登录界面需要相应更新');
    
    // 显示使用临时手机号的用户列表
    const usersWithTempPhone = await usersCollection.find({
      phone: { $regex: /^19000/ }
    }).toArray();
    
    if (usersWithTempPhone.length > 0) {
      console.log('\n📋 以下用户使用了临时手机号，需要更新：');
      usersWithTempPhone.forEach(u => {
        console.log(`   - ${u.full_name || u.name} (${u.phone}) - 角色: ${u.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ 数据库连接已关闭');
    process.exit(0);
  }
}

// 运行迁移
console.log('🚀 开始用户数据迁移...\n');
migrateUsernameToPhone();

