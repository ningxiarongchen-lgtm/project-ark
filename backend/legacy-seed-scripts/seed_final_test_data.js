/**
 * 【最终验收测试】数据准备脚本
 * 
 * 用途：创建所有角色的测试账户和初始业务数据
 * 运行方式：node backend/seed_final_test_data.js
 * 
 * 注意：
 * - 所有测试账户密码统一为：Password1!
 * - 手机号以 110000000XX 格式统一识别
 * - 脚本会先清理旧的测试数据，再创建新数据
 * - 所有数据在测试完成后会保留在数据库中
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 导入模型
const User = require('./models/User');
const Supplier = require('./models/Supplier');
const Actuator = require('./models/Actuator');
const Accessory = require('./models/Accessory');

// ========== 数据库连接 ==========
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cmax', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 连接成功');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error);
    process.exit(1);
  }
};

// ========== 第一幕：测试账户数据 ==========
const testUsers = [
  { 
    phone: '13800000001', 
    password: 'Password1!', 
    full_name: 'Admin User', 
    role: 'Administrator',
    department: 'Management'
  },
  { 
    phone: '13800000002', 
    password: 'Password1!', 
    full_name: 'Sally Sales', 
    role: 'Sales Manager',
    department: 'Sales'
  },
  { 
    phone: '13800000003', 
    password: 'Password1!', 
    full_name: 'Tom Tech', 
    role: 'Technical Engineer',
    department: 'Engineering'
  },
  { 
    phone: '13800000004', 
    password: 'Password1!', 
    full_name: 'Charlie Commercial', 
    role: 'Sales Engineer',
    department: 'Sales'
  },
  { 
    phone: '13800000005', 
    password: 'Password1!', 
    full_name: 'Pat Procurement', 
    role: 'Procurement Specialist',
    department: 'Procurement'
  },
  { 
    phone: '13800000006', 
    password: 'Password1!', 
    full_name: 'Peter Planner', 
    role: 'Production Planner',
    department: 'Production'
  },
  { 
    phone: '13800000007', 
    password: 'Password1!', 
    full_name: 'Quincy QA', 
    role: 'QA Inspector',
    department: 'Quality'
  },
  { 
    phone: '13800000008', 
    password: 'Password1!', 
    full_name: 'Larry Logistics', 
    role: 'Logistics Specialist',
    department: 'Logistics'
  },
  { 
    phone: '13800000009', 
    password: 'Password1!', 
    full_name: 'Andy Aftersales', 
    role: 'After-sales Engineer',
    department: 'After-sales Service'
  },
  { 
    phone: '13800000010', 
    password: 'Password1!', 
    full_name: 'Wendy Worker', 
    role: 'Shop Floor Worker',
    department: 'Manufacturing'
  }
];

// ========== 清理现有测试数据 ==========
const cleanTestData = async () => {
  try {
    console.log('\n🧹 清理现有测试数据...');
    
    // 删除所有测试用户（手机号以 138000000 开头）
    const deleteResult = await User.deleteMany({ 
      phone: { $regex: /^138000000/ } 
    });
    
    console.log(`   ✅ 已删除 ${deleteResult.deletedCount} 个测试用户`);
    
    // 注意：其他业务数据（项目、订单等）会在后续测试中动态创建
    console.log('   ℹ️  业务数据将在测试过程中动态创建');
    
  } catch (error) {
    console.error('❌ 清理测试数据失败:', error);
    throw error;
  }
};

// ========== 第二幕：测试供应商数据 ==========
const testSuppliers = [
  { 
    name: '上海核心配件厂', 
    contact_person: '王总',
    phone: '13912345001',
    address: '上海市浦东新区张江高科技园区',
    business_scope: '执行器配件、阀门附件',
    status: '合格 (Qualified)',
    rating: 5,
    certification_status: 'Certified',
    on_time_delivery_rate: 98.5,
    total_transaction_value: 1500000,
    notes: '长期合作伙伴，质量稳定'
  },
  { 
    name: '宁波精密铸造', 
    contact_person: '李工',
    phone: '13987654002',
    address: '浙江省宁波市北仑区工业园',
    business_scope: '阀体铸造、精密加工',
    status: '考察中 (Onboarding)',
    rating: 4,
    certification_status: 'Pending',
    on_time_delivery_rate: 95.0,
    total_transaction_value: 500000,
    notes: '新供应商，正在考察中'
  },
  { 
    name: '天津自动化设备有限公司', 
    contact_person: '张经理',
    phone: '13611223344',
    address: '天津市西青区开发区',
    business_scope: '气动执行器、自动化控制系统',
    status: '合格 (Qualified)',
    rating: 5,
    certification_status: 'Certified',
    on_time_delivery_rate: 99.2,
    total_transaction_value: 2800000,
    notes: '优质供应商，交付及时'
  }
];

// ========== 创建测试用户 ==========
const createTestUsers = async () => {
  try {
    console.log('\n👥 创建测试用户账户...\n');
    
    // 使用 insertMany 批量插入，避免 pre-save hook
    const usersToInsert = [];
    
    for (const userData of testUsers) {
      // 手动加密密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      usersToInsert.push({
        phone: userData.phone,
        password: hashedPassword,
        full_name: userData.full_name,
        role: userData.role,
        department: userData.department,
        isActive: true,
        passwordChangeRequired: false  // 🔑 关键：允许直接登录，无需首次修改密码
      });
    }
    
    // 批量插入用户
    const createdUsers = await User.insertMany(usersToInsert);
    
    // 输出创建结果
    testUsers.forEach(userData => {
      console.log(`✅ ${userData.role.padEnd(25)} | ${userData.full_name.padEnd(20)} | ${userData.phone}`);
    });
    
    console.log(`\n   ✅ 共创建 ${createdUsers.length} 个测试用户`);
    
    return createdUsers;
    
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error);
    throw error;
  }
};

// ========== 创建测试供应商 ==========
const createTestSuppliers = async () => {
  try {
    console.log('\n🏭 创建测试供应商...\n');
    
    // 先删除可能存在的测试供应商
    await Supplier.deleteMany({ 
      name: { $in: testSuppliers.map(s => s.name) } 
    });
    
    // 批量插入供应商
    const createdSuppliers = await Supplier.insertMany(testSuppliers);
    
    // 输出创建结果
    testSuppliers.forEach(supplier => {
      console.log(`✅ ${supplier.name.padEnd(30)} | ${supplier.status.padEnd(25)} | ${supplier.contact_person}`);
    });
    
    console.log(`\n   ✅ 共创建 ${createdSuppliers.length} 个测试供应商`);
    
    return createdSuppliers;
    
  } catch (error) {
    console.error('❌ 创建测试供应商失败:', error);
    throw error;
  }
};

// ========== 验证数据完整性 ==========
const verifyData = async () => {
  try {
    console.log('\n🔍 验证数据完整性...\n');
    
    // 1. 验证用户数量
    const userCount = await User.countDocuments({ phone: { $regex: /^138000000/ } });
    console.log(`   ✅ 测试用户数量: ${userCount} / 10`);
    
    // 2. 验证所有角色是否都有用户
    const roles = [
      'Administrator',
      'Sales Manager',
      'Technical Engineer',
      'Sales Engineer',
      'Procurement Specialist',
      'Production Planner',
      'QA Inspector',
      'Logistics Specialist',
      'After-sales Engineer',
      'Shop Floor Worker'
    ];
    
    for (const role of roles) {
      const user = await User.findOne({ role, phone: { $regex: /^138000000/ } });
      if (user) {
        console.log(`   ✅ ${role.padEnd(30)} : ${user.full_name}`);
      } else {
        console.log(`   ❌ ${role.padEnd(30)} : 缺失！`);
      }
    }
    
    // 3. 验证密码是否可用
    const testUser = await User.findOne({ phone: '13800000001' }).select('+password');
    const isPasswordValid = await bcrypt.compare('Password1!', testUser.password);
    console.log(`\n   ${isPasswordValid ? '✅' : '❌'} 密码验证: ${isPasswordValid ? '通过' : '失败'}`);
    
    // 4. 检查是否需要修改密码
    console.log(`   ${testUser.passwordChangeRequired ? '⚠️' : '✅'} 密码修改要求: ${testUser.passwordChangeRequired ? '需要' : '不需要'}`);
    
    // 5. 验证供应商数量
    const supplierCount = await Supplier.countDocuments({ 
      name: { $in: testSuppliers.map(s => s.name) } 
    });
    console.log(`\n   ✅ 测试供应商数量: ${supplierCount} / ${testSuppliers.length}`);
    
  } catch (error) {
    console.error('❌ 数据验证失败:', error);
    throw error;
  }
};

// ========== 输出测试账户信息 ==========
const printTestAccounts = () => {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                     【最终验收测试】账户信息表                              ║');
  console.log('╠════════════════════════════════════════════════════════════════════════════╣');
  console.log('║                                                                            ║');
  console.log('║  统一密码: Password1!                                                      ║');
  console.log('║  登录方式: 使用手机号 + 密码登录                                            ║');
  console.log('║                                                                            ║');
  console.log('╠═══════════════╦═════════════════════════╦═════════════════════════════════╣');
  console.log('║   手机号      ║       姓名              ║           角色                  ║');
  console.log('╠═══════════════╬═════════════════════════╬═════════════════════════════════╣');
  
  testUsers.forEach(user => {
    console.log(`║ ${user.phone} ║ ${user.full_name.padEnd(23)} ║ ${user.role.padEnd(31)} ║`);
  });
  
  console.log('╚═══════════════╩═════════════════════════╩═════════════════════════════════╝');
  console.log('\n');
  console.log('📋 角色职责说明：');
  console.log('   1. Administrator         - 系统管理员，拥有所有权限');
  console.log('   2. Sales Manager         - 销售经理，审核报价和合同');
  console.log('   3. Technical Engineer    - 技术工程师，执行选型计算');
  console.log('   4. Sales Engineer        - 商务工程师，创建项目和报价');
  console.log('   5. Procurement Specialist- 采购专员，处理采购订单');
  console.log('   6. Production Planner    - 生产计划员，制定生产计划');
  console.log('   7. QA Inspector          - 质检员，执行质量检查');
  console.log('   8. Logistics Specialist  - 物流专员，管理发货');
  console.log('   9. After-sales Engineer  - 售后工程师，处理售后工单');
  console.log('   10. Shop Floor Worker    - 车间工人，执行生产任务');
  console.log('\n');
  console.log('💡 下一步操作：');
  console.log('   1. 启动后端服务: npm start (在 backend 目录)');
  console.log('   2. 启动前端服务: npm run dev (在 frontend 目录)');
  console.log('   3. 使用上述账户登录系统进行测试');
  console.log('   4. 所有数据会保留在数据库中，可随时登录验证');
  console.log('\n');
};

// ========== 主函数 ==========
const main = async () => {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                   【最终验收测试】数据准备脚本                              ║');
  console.log('║                     Final Acceptance Test Data Seeder                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  
  try {
    // 1. 连接数据库
    await connectDB();
    
    // 2. 清理现有测试数据
    await cleanTestData();
    
    // 3. 创建测试用户
    await createTestUsers();
    
    // 4. 创建测试供应商
    await createTestSuppliers();
    
    // 5. 验证数据完整性
    await verifyData();
    
    // 6. 输出测试账户信息
    printTestAccounts();
    
    console.log('✅ 数据准备完成！所有测试账户和基础数据已创建。\n');
    
  } catch (error) {
    console.error('\n❌ 数据准备失败:', error.message);
    console.error(error);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭\n');
    process.exit(0);
  }
};

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { testUsers };

