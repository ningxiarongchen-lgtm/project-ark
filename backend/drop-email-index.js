/**
 * 删除email唯一索引
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cmax';
    const conn = await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 连接成功');
    console.log(`📍 Database: ${conn.connection.name}\n`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error);
    process.exit(1);
  }
};

const dropIndex = async () => {
  try {
    const conn = await connectDB();
    const collection = conn.connection.db.collection('users');
    
    console.log('🔍 查看现有索引...\n');
    const indexes = await collection.indexes();
    console.log('现有索引:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, idx.key);
    });
    console.log('');
    
    console.log('🗑️  删除 email_1 索引...\n');
    try {
      await collection.dropIndex('email_1');
      console.log('✅ email_1 索引已删除\n');
    } catch (error) {
      if (error.code === 27) {
        console.log('⚠️  email_1 索引不存在\n');
      } else {
        throw error;
      }
    }
    
    console.log('🔍 删除后的索引:\n');
    const indexesAfter = await collection.indexes();
    indexesAfter.forEach(idx => {
      console.log(`  - ${idx.name}:`, idx.key);
    });
    
    await conn.connection.close();
    console.log('\n✅ 数据库连接已关闭');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 操作失败:', error);
    process.exit(1);
  }
};

dropIndex();


