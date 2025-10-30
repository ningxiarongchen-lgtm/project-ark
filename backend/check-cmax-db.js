/**
 * 检查cmax数据库中的用户
 */
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
  try {
    // 连接到服务器实际使用的数据库
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

const checkUsers = async () => {
  try {
    console.log('🔍 查询cmax数据库中的技术工程师...\n');
    
    const techEngineers = await User.find({ 
      role: 'Technical Engineer'
    })
    .select('_id phone full_name department isActive');
    
    console.log(`找到 ${techEngineers.length} 个技术工程师:\n`);
    
    techEngineers.forEach((user, index) => {
      console.log(`${index + 1}. full_name: "${user.full_name}"`);
      console.log(`   phone: ${user.phone}`);
      console.log(`   department: ${user.department || '(无)'}`);
      console.log(`   _id: ${user._id}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  }
};

const main = async () => {
  await connectDB();
  await checkUsers();
  await mongoose.connection.close();
  console.log('✅ 数据库连接已关闭');
  process.exit(0);
};

main();


