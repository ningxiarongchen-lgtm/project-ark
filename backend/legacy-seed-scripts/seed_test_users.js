/**
 * 测试环境用户数据填充脚本
 * 
 * 功能：
 * - 为所有角色创建测试账户
 * - 连接到测试数据库（MONGO_URI_TEST）
 * - 清理旧测试数据并重新创建
 * 
 * 使用方法：
 * NODE_ENV=test node seed_test_users.js
 * 或
 * npm run seed:test-users
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// 测试数据库连接
const connectTestDB = async () => {
  try {
    // 优先使用 MONGO_URI_TEST，如果没有则使用 MONGODB_URI 并添加 _test 后缀
    const testDbUri = process.env.MONGO_URI_TEST || 
                      process.env.MONGODB_URI?.replace(/\/([^\/]+)(\?|$)/, '/$1_test$2') ||
                      'mongodb://localhost:27017/cmax_test';
    
    await mongoose.connect(testDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ 测试数据库连接成功');
    console.log(`📍 数据库: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ 测试数据库连接失败:', error.message);
    process.exit(1);
  }
};

// 所有角色的测试用户数据（与 User 模型的 enum 角色完全匹配）
const testUsers = [
  {
    full_name: '测试管理员',
    phone: '13800000001',
    password: 'test123456',
    role: 'Administrator',
    department: '管理部门',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '测试销售经理',
    phone: '13800000002',
    password: 'test123456',
    role: 'Sales Manager',
    department: '销售部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '测试销售工程师',
    phone: '13800000003',
    password: 'test123456',
    role: 'Sales Engineer',
    department: '销售部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '测试技术工程师',
    phone: '13800000004',
    password: 'test123456',
    role: 'Technical Engineer',
    department: '技术部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '测试采购专员',
    phone: '13800000005',
    password: 'test123456',
    role: 'Procurement Specialist',
    department: '采购部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '测试生产计划员',
    phone: '13800000006',
    password: 'test123456',
    role: 'Production Planner',
    department: '生产部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '测试售后工程师',
    phone: '13800000007',
    password: 'test123456',
    role: 'After-sales Engineer',
    department: '售后服务部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '测试质检员',
    phone: '13800000008',
    password: 'test123456',
    role: 'QA Inspector',
    department: '质检部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '测试物流专员',
    phone: '13800000009',
    password: 'test123456',
    role: 'Logistics Specialist',
    department: '物流部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '测试车间工人',
    phone: '13800000010',
    password: 'test123456',
    role: 'Shop Floor Worker',
    department: '生产车间',
    isActive: true,
    passwordChangeRequired: false
  }
];

// 创建测试用户
const seedTestUsers = async () => {
  try {
    console.log('\n🚀 开始创建测试用户...\n');

    // 1. 清理旧的测试用户
    const testPhones = testUsers.map(u => u.phone);
    const deleteResult = await User.deleteMany({ 
      phone: { $in: testPhones } 
    });
    
    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️  已清理 ${deleteResult.deletedCount} 个旧测试用户\n`);
    }

    // 2. 批量创建新的测试用户
    const createdUsers = await User.create(testUsers);
    
    console.log(`✅ 成功创建 ${createdUsers.length} 个测试用户！\n`);

    // 3. 打印用户信息表格
    console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
    console.log('║                          测试用户账户列表                                 ║');
    console.log('╠═══════════════════════════════════════════════════════════════════════════╣');
    console.log('║ 姓名               │ 手机号        │ 密码         │ 角色                ║');
    console.log('╠════════════════════╪═══════════════╪══════════════╪═════════════════════╣');
    
    testUsers.forEach(user => {
      const name = user.full_name.padEnd(18);
      const phone = user.phone.padEnd(13);
      const password = user.password.padEnd(12);
      const role = user.role.padEnd(20);
      console.log(`║ ${name} │ ${phone} │ ${password} │ ${role} ║`);
    });
    
    console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

    // 4. 打印使用说明
    console.log('📝 使用说明：');
    console.log('   • 所有测试账户的密码都是: test123456');
    console.log('   • 使用手机号登录（例如：13800000001）');
    console.log('   • 这些账户仅用于自动化测试，不影响生产数据');
    console.log('   • passwordChangeRequired 已设置为 false，无需强制修改密码\n');

    console.log('🔗 下一步：');
    console.log('   1. 启动测试环境后端: npm run start:test');
    console.log('   2. 运行 Cypress E2E 测试');
    console.log('   3. 或手动登录测试各角色功能\n');

  } catch (error) {
    console.error('❌ 创建测试用户失败:', error.message);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    await connectTestDB();
    await seedTestUsers();
    
    console.log('✅ 测试用户填充完成！');
    
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭\n');
    process.exit(0);
  }
};

// 执行脚本
if (require.main === module) {
  main();
}

module.exports = { testUsers, seedTestUsers };

