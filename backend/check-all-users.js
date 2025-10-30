/**
 * 检查数据库中所有用户
 */
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
  try {
    const dbUri = 'mongodb://localhost:27017/cmax-actuators';
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

const checkAllUsers = async () => {
  try {
    console.log('🔍 查询所有用户...\n');
    
    const allUsers = await User.find({})
      .select('_id phone full_name role department isActive')
      .sort({ createdAt: -1 });
    
    console.log(`总共找到 ${allUsers.length} 个用户:\n`);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. _id: ${user._id}`);
      console.log(`   full_name: "${user.full_name}"`);
      console.log(`   phone: ${user.phone}`);
      console.log(`   role: ${user.role}`);
      console.log(`   department: ${user.department || '(无)'}`);
      console.log(`   isActive: ${user.isActive}`);
      console.log('');
    });
    
    console.log('🔍 查找 "Tech Engineer User"...\n');
    
    const oldUser = await User.findOne({ full_name: 'Tech Engineer User' });
    
    if (oldUser) {
      console.log('❌ 找到旧用户:');
      console.log(`   _id: ${oldUser._id}`);
      console.log(`   phone: ${oldUser.phone}`);
      console.log(`   删除中...`);
      
      await User.deleteOne({ _id: oldUser._id });
      console.log('   ✅ 已删除\n');
    } else {
      console.log('✅ 没有找到 "Tech Engineer User"\n');
    }
    
    console.log('🔍 再次验证技术工程师列表...\n');
    
    const techEngineers = await User.find({ 
      role: 'Technical Engineer',
      isActive: true 
    })
    .select('_id phone full_name department');
    
    console.log(`技术工程师: ${techEngineers.length} 个\n`);
    
    techEngineers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name} (${user.phone}) - ${user.department}`);
      console.log(`   _id: ${user._id}`);
    });
    
  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
};

const main = async () => {
  await connectDB();
  await checkAllUsers();
  await mongoose.connection.close();
  console.log('\n✅ 数据库连接已关闭');
  process.exit(0);
};

main();


