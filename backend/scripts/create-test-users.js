/**
 * 创建 Cypress E2E 测试用户脚本
 * 
 * 用法：
 * node scripts/create-test-users.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// 数据库连接
const connectDB = async () => {
  try {
    // 使用与服务器相同的数据库
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cmax';
    const conn = await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 连接成功');
    console.log(`📍 Database: ${conn.connection.name}`);
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
    role: 'Sales Engineer',
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
  },
  {
    phone: '13900000007',
    password: 'after123',
    full_name: '售后工程师',
    email: 'aftersales@test.com',
    role: 'After-sales Engineer',
    department: 'Service'
  }
];

// 创建测试用户
const createTestUsers = async () => {
  try {
    console.log('🚀 开始创建测试用户...\n');

    for (const userData of testUsers) {
      // 检查用户是否已存在
      const existingUser = await User.findOne({ phone: userData.phone });
      
      if (existingUser) {
        console.log(`⚠️  用户已存在: ${userData.phone} (${userData.full_name} - ${userData.role})`);
        
        // 更新密码（以防密码被修改）
        const salt = await bcrypt.genSalt(10);
        existingUser.password = await bcrypt.hash(userData.password, salt);
        existingUser.full_name = userData.full_name;
        existingUser.email = userData.email;
        existingUser.role = userData.role;
        existingUser.department = userData.department;
        existingUser.passwordChangeRequired = false;
        
        await existingUser.save();
        console.log(`   ✅ 已更新用户信息\n`);
      } else {
        // 创建新用户
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
        console.log(`   姓名: ${userData.full_name}`);
        console.log(`   密码: ${userData.password}\n`);
      }
    }

    console.log('\n🎉 测试用户创建/更新完成！\n');
    console.log('📋 用户列表：');
    console.log('═════════════════════════════════════════════════════════════════════════════');
    console.log('| 手机号          | 姓名        | 密码        | 角色                        |');
    console.log('|-----------------|-------------|-------------|-----------------------------|');
    
    testUsers.forEach(user => {
      console.log(`| ${user.phone.padEnd(15)} | ${user.full_name.padEnd(11)} | ${user.password.padEnd(11)} | ${user.role.padEnd(27)} |`);
    });
    
    console.log('═════════════════════════════════════════════════════════════════════════════\n');
    
    console.log('💡 使用提示：');
    console.log('   1. 这些用户可用于系统测试');
    console.log('   2. 登录时使用手机号和密码');
    console.log('   3. 如需重新创建，再次运行此脚本即可');
    console.log('   4. 密码已加密存储在数据库中');
    console.log('   5. 测试账号已禁用强制修改密码\n');

  } catch (error) {
    console.error('❌ 创建测试用户失败:', error);
  }
};

// 主函数
const main = async () => {
  await connectDB();
  await createTestUsers();
  await mongoose.connection.close();
  console.log('✅ 数据库连接已关闭');
  process.exit(0);
};

// 运行脚本
main();

