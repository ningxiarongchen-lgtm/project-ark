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
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/valve_selection', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 连接成功');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error);
    process.exit(1);
  }
};

// 测试用户数据
const testUsers = [
  {
    username: 'admin',
    password: 'admin123',
    name: '管理员',
    email: 'admin@company.com',
    role: 'Administrator',
    department: 'Management',
    phone: '13900000001'
  },
  {
    username: 'tech_engineer',
    password: 'tech123',
    name: '技术工程师',
    email: 'tech@company.com',
    role: 'Technical Engineer',
    department: 'Engineering',
    phone: '13900000002'
  },
  {
    username: 'sales_engineer',
    password: 'sales123',
    name: '商务工程师',
    email: 'saleseng@company.com',
    role: 'Sales Engineer',
    department: 'Sales',
    phone: '13900000003'
  },
  {
    username: 'sales_manager',
    password: 'manager123',
    name: '销售经理',
    email: 'manager@company.com',
    role: 'Sales Manager',
    department: 'Sales',
    phone: '13900000004'
  },
  {
    username: 'production_planner',
    password: 'prod123',
    name: '生产计划员',
    email: 'production@company.com',
    role: 'Production Planner',
    department: 'Production',
    phone: '13900000005'
  },
  {
    username: 'procurement',
    password: 'proc123',
    name: '采购专员',
    email: 'procurement@company.com',
    role: 'Procurement Specialist',
    department: 'Procurement',
    phone: '13900000006'
  },
  {
    username: 'aftersales',
    password: 'after123',
    name: '售后工程师',
    email: 'aftersales@company.com',
    role: 'After-sales Engineer',
    department: 'Service',
    phone: '13900000007'
  }
];

// 创建测试用户
const createTestUsers = async () => {
  try {
    console.log('🚀 开始创建测试用户...\n');

    for (const userData of testUsers) {
      // 检查用户是否已存在
      const existingUser = await User.findOne({ username: userData.username });
      
      if (existingUser) {
        console.log(`⚠️  用户已存在: ${userData.username} (${userData.role})`);
        
        // 更新密码（以防密码被修改）
        const salt = await bcrypt.genSalt(10);
        existingUser.password = await bcrypt.hash(userData.password, salt);
        existingUser.name = userData.name;
        existingUser.email = userData.email;
        existingUser.role = userData.role;
        existingUser.department = userData.department;
        existingUser.phone = userData.phone;
        
        await existingUser.save();
        console.log(`   ✅ 已更新用户信息\n`);
      } else {
        // 创建新用户
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        const newUser = new User({
          ...userData,
          password: hashedPassword
        });
        
        await newUser.save();
        console.log(`✅ 创建成功: ${userData.username} (${userData.role})`);
        console.log(`   邮箱: ${userData.email}`);
        console.log(`   密码: ${userData.password}\n`);
      }
    }

    console.log('\n🎉 测试用户创建/更新完成！\n');
    console.log('📋 用户列表：');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('| 用户名              | 密码        | 角色                        |');
    console.log('|---------------------|-------------|-----------------------------|');
    
    testUsers.forEach(user => {
      console.log(`| ${user.username.padEnd(19)} | ${user.password.padEnd(11)} | ${user.role.padEnd(27)} |`);
    });
    
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('💡 使用提示：');
    console.log('   1. 这些用户专用于 Cypress E2E 测试');
    console.log('   2. 测试完成后可以保留这些用户');
    console.log('   3. 如需重新创建，再次运行此脚本即可');
    console.log('   4. 密码已加密存储在数据库中\n');

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

