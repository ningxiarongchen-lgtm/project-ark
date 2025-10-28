require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

const cleanupIndexes = async () => {
  try {
    await connectDB();
    
    console.log('🔧 清理旧的数据库索引...\n');
    
    // 删除 accessories 集合
    console.log('删除 accessories 集合...');
    await mongoose.connection.db.collection('accessories').drop().catch(() => {
      console.log('  (集合不存在，跳过)');
    });
    console.log('✅ accessories 集合已删除\n');
    
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║     索引清理完成！ 🎉                         ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    console.log('现在可以运行: npm run seed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 清理索引时出错:', error);
    process.exit(1);
  }
};

cleanupIndexes();

