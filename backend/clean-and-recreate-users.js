/**
 * 清除并重新创建测试用户
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// 数据库连接
const connectDB = async () => {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cmax';
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

// 测试用户数据
const testUsers = [
  {
    phone: '13900000001',
    password: 'admin123',
    full_name: '管理员',
    email: 'admin@test.com',
    role: 'Administrator',
    department: 'Management'
  },
  {
    phone: '13900000002',
    password: 'tech123',
    full_name: '张技术',
    email: 'tech@test.com',
    role: 'Technical Engineer',
    department: 'Engineering'
  },
  {
    phone: '13900000003',
    password: 'sales123',
    full_name: '李商务',
    email: 'saleseng@test.com',
    role: 'Business Engineer',
    department: 'Sales'
  },
  {
    phone: '13900000004',
    password: 'manager123',
    full_name: '王经理',
    email: 'manager@test.com',
    role: 'Sales Manager',
    department: 'Sales'
  },
  {
    phone: '13900000005',
    password: 'prod123',
    full_name: '生产计划员',
    email: 'prod@test.com',
    role: 'Production Planner',
    department: 'Production'
  },
  {
    phone: '13900000006',
    password: 'proc123',
    full_name: '采购专员',
    email: 'proc@test.com',
    role: 'Procurement Specialist',
    department: 'Procurement'
  }
];

const cleanAndRecreate = async () => {
  try {
    console.log('🗑️  删除所有现有测试用户...\n');
    
    // 删除所有测试用户（通过手机号识别）
    const testPhones = testUsers.map(u => u.phone);
    const deleteResult = await User.deleteMany({ phone: { $in: testPhones } });
    console.log(`   删除了 ${deleteResult.deletedCount} 个用户\n`);
    
    console.log('🚀 重新创建测试用户...\n');
    
    for (const userData of testUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const newUser = new User({
        phone: userData.phone,
        full_name: userData.full_name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        department: userData.department,
        passwordChangeRequired: false  // 测试账号不要求修改密码
      });
      
      await newUser.save();
      console.log(`✅ 创建成功: ${userData.phone} (${userData.full_name} - ${userData.role})`);
    }
    
    console.log('\n🎉 所有测试用户创建完成！\n');
    console.log('📋 用户列表：');
    console.log('═════════════════════════════════════════════════════════════════════════════');
    console.log('| 手机号          | 姓名        | 密码        | 角色                        |');
    console.log('|-----------------|-------------|-------------|-----------------------------|');
    
    testUsers.forEach(user => {
      console.log(`| ${user.phone.padEnd(15)} | ${user.full_name.padEnd(11)} | ${user.password.padEnd(11)} | ${user.role.padEnd(27)} |`);
    });
    
    console.log('═════════════════════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
};

const main = async () => {
  await connectDB();
  await cleanAndRecreate();
  await mongoose.connection.close();
  console.log('✅ 数据库连接已关闭');
  process.exit(0);
};

main();


