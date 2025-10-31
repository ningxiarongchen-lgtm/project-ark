/**
 * ═══════════════════════════════════════════════════════════════════════
 * 数据库迁移脚本：合并售后工程师角色到技术工程师
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * 功能：将所有 "After-sales Engineer" 角色的用户更新为 "Technical Engineer"
 * 
 * 背景：根据系统重构要求，技术工程师现在承担所有售后职责
 * 
 * 使用方法：
 * node backend/migrations/migrate_aftersales_to_technical.js
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

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

async function migrateUsers() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  开始迁移：After-sales Engineer → Technical Engineer      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  try {
    // 查找所有售后工程师
    const aftersalesUsers = await User.find({ role: 'After-sales Engineer' });
    
    if (aftersalesUsers.length === 0) {
      console.log('✓ 没有找到需要迁移的 After-sales Engineer 用户');
      return;
    }
    
    console.log(`📋 找到 ${aftersalesUsers.length} 个 After-sales Engineer 用户：\n`);
    
    aftersalesUsers.forEach(user => {
      console.log(`   • ${user.full_name} (${user.phone}) - ${user.department || '未设置部门'}`);
    });
    
    console.log('\n🔄 开始更新角色...\n');
    
    // 使用 updateMany 批量更新
    const result = await User.updateMany(
      { role: 'After-sales Engineer' },
      { 
        $set: { 
          role: 'Technical Engineer',
          department: '技术部'  // 统一设置为技术部
        } 
      }
    );
    
    console.log(`✅ 成功更新 ${result.modifiedCount} 个用户的角色`);
    
    // 验证更新结果
    const remainingAftersales = await User.countDocuments({ role: 'After-sales Engineer' });
    const technicalCount = await User.countDocuments({ role: 'Technical Engineer' });
    
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  迁移完成统计                                                ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log(`║  剩余 After-sales Engineer 用户: ${remainingAftersales}                        ║`);
    console.log(`║  当前 Technical Engineer 用户总数: ${technicalCount}                      ║`);
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    if (remainingAftersales === 0) {
      console.log('🎉 所有 After-sales Engineer 用户已成功迁移为 Technical Engineer！\n');
    } else {
      console.log('⚠️  警告：仍有部分用户未成功迁移，请检查！\n');
    }
    
  } catch (error) {
    console.error('\n❌ 迁移过程中发生错误:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await connectDatabase();
    await migrateUsers();
    
    console.log('✅ 数据库迁移脚本执行完成！\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ 脚本执行失败:', error.message);
    process.exit(1);
  }
}

main();

