const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // 根据环境选择数据库连接字符串
    let dbUri;
    
    if (process.env.NODE_ENV === 'test') {
      // 测试环境：优先使用 MONGO_URI_TEST
      dbUri = process.env.MONGO_URI_TEST || 
              process.env.MONGODB_URI?.replace(/\/([^\/]+)(\?|$)/, '/$1_test$2') ||
              'mongodb://localhost:27017/project_ark_test';
      console.log('🧪 运行在测试环境');
    } else {
      // 生产/开发环境
      dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cmax';
    }

    const conn = await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📍 Database: ${conn.connection.name}`);
    
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;


