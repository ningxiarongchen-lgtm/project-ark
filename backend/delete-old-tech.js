/**
 * 删除旧的技术工程师用户
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

const deleteOldTech = async () => {
  try {
    console.log('🔍 查找旧的技术工程师用户...\n');
    
    // 删除 phone 为 13000000003 的用户
    const result = await User.deleteOne({ phone: '13000000003' });
    
    if (result.deletedCount > 0) {
      console.log('✅ 已删除旧用户: Tech Engineer User (13000000003)\n');
    } else {
      console.log('⚠️  未找到该用户\n');
    }
    
    console.log('🔍 验证当前技术工程师列表...\n');
    
    const allTech = await User.find({ 
      role: 'Technical Engineer',
      isActive: true 
    })
    .select('_id phone full_name department');
    
    console.log(`当前激活的技术工程师: ${allTech.length} 个\n`);
    
    allTech.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name} (${user.phone}) - ${user.department}`);
    });
    
  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
};

const main = async () => {
  await connectDB();
  await deleteOldTech();
  await mongoose.connection.close();
  console.log('\n✅ 数据库连接已关闭');
  process.exit(0);
};

main();


