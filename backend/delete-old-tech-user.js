/**
 * 删除旧的 Tech Engineer User
 */
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
  try {
    const dbUri = 'mongodb://localhost:27017/cmax';
    const conn = await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 连接成功');
    console.log(`📍 Database: ${conn.connection.name}\n`);
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error);
    process.exit(1);
  }
};

const deleteOldUser = async () => {
  try {
    console.log('🗑️  删除 "Tech Engineer User"...\n');
    
    // 删除 full_name 为 "Tech Engineer User" 的用户
    const result = await User.deleteOne({ 
      full_name: 'Tech Engineer User'
    });
    
    if (result.deletedCount > 0) {
      console.log('✅ 已成功删除 "Tech Engineer User"\n');
    } else {
      console.log('⚠️  未找到该用户\n');
    }
    
    console.log('🔍 验证当前技术工程师列表...\n');
    
    const techEngineers = await User.find({ 
      role: 'Technical Engineer',
      isActive: true 
    })
    .select('_id phone full_name department');
    
    console.log(`当前技术工程师: ${techEngineers.length} 个\n`);
    
    techEngineers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name} (${user.phone})`);
      console.log(`   部门: ${user.department}`);
      console.log(`   _id: ${user._id}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
};

const main = async () => {
  await connectDB();
  await deleteOldUser();
  await mongoose.connection.close();
  console.log('✅ 数据库连接已关闭');
  process.exit(0);
};

main();


