/**
 * MongoDB Atlas 连接测试脚本
 * 用于验证MongoDB连接是否正确
 */

const mongoose = require('mongoose');

// MongoDB连接字符串
const MONGODB_URI = 'mongodb+srv://ningxiarongchen_db_user:LqedbEYN3diN44Z8@cluster0.6uan2lt.mongodb.net/cmax?retryWrites=true&w=majority';

console.log('🔄 开始测试MongoDB Atlas连接...\n');

async function testConnection() {
  try {
    console.log('📡 连接地址：', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
    console.log('⏳ 正在连接...\n');

    // 连接MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10秒超时
    });

    console.log('✅ 连接成功！\n');
    console.log('📊 连接信息：');
    console.log('   - 主机：', mongoose.connection.host);
    console.log('   - 数据库：', mongoose.connection.name);
    console.log('   - 端口：', mongoose.connection.port || 'MongoDB Atlas (云端)');
    console.log('   - 状态：', mongoose.connection.readyState === 1 ? '已连接' : '未连接');

    // 测试数据库操作
    console.log('\n🧪 测试数据库操作...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('   - 现有集合数量：', collections.length);
    if (collections.length > 0) {
      console.log('   - 集合列表：', collections.map(c => c.name).join(', '));
    } else {
      console.log('   - 集合列表：（空，这是正常的，还没有初始化数据）');
    }

    // 测试写入权限
    console.log('\n📝 测试写入权限...');
    const testCollection = mongoose.connection.db.collection('_test');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    console.log('   ✅ 写入权限正常');
    
    // 清理测试数据
    await testCollection.deleteMany({ test: true });
    console.log('   ✅ 删除权限正常');

    console.log('\n🎉 所有测试通过！MongoDB Atlas配置正确！');
    console.log('\n📋 下一步：');
    console.log('   1. 这个连接字符串可以用于Render部署');
    console.log('   2. 记得在Render环境变量中设置 MONGODB_URI');
    console.log('   3. 部署后运行 seed_final_acceptance.js 初始化数据');

  } catch (error) {
    console.error('\n❌ 连接失败！');
    console.error('错误信息：', error.message);
    console.error('\n可能的原因：');
    console.error('   1. 网络问题（检查是否能访问MongoDB Atlas）');
    console.error('   2. 连接字符串错误（检查用户名、密码是否正确）');
    console.error('   3. IP地址未加入白名单（应该已经设置为0.0.0.0/0）');
    console.error('   4. 数据库用户权限不足');
    console.error('\n详细错误：', error);
  } finally {
    // 关闭连接
    await mongoose.connection.close();
    console.log('\n🔌 连接已关闭');
    process.exit(0);
  }
}

// 执行测试
testConnection();

