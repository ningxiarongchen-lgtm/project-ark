/**
 * ═══════════════════════════════════════════════════════════════════════
 * 生产环境初始化脚本
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * 功能：为生产环境创建干净的初始状态
 * - 清除所有测试数据
 * - 只保留一个管理员账号
 * - 准备好让管理员创建真实用户和数据
 * 
 * ⚠️ 警告：此脚本会清空数据库！仅用于生产环境首次初始化！
 * 
 * 使用方法：
 * node backend/seed_production_init.js
 * 
 * 或在 Render Shell 中：
 * npm run init:production
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

// 引入所有模型
const User = require('./models/User');
const Product = require('./models/Product');
const Actuator = require('./models/Actuator');
const Accessory = require('./models/Accessory');
const ManualOverride = require('./models/ManualOverride');
const Supplier = require('./models/Supplier');
const Project = require('./models/Project');
const NewProject = require('./models/NewProject');
const SalesOrder = require('./models/SalesOrder');
const ProductionOrder = require('./models/ProductionOrder');
const PurchaseOrder = require('./models/PurchaseOrder');
const ServiceTicket = require('./models/ServiceTicket');
const Quote = require('./models/Quote');
const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');
const QualityCheck = require('./models/QualityCheck');
const WorkOrder = require('./models/WorkOrder');
const WorkCenter = require('./models/WorkCenter');
const Routing = require('./models/Routing');
const EngineeringChangeOrder = require('./models/EngineeringChangeOrder');
const RefreshToken = require('./models/RefreshToken');
const Contract = require('./models/Contract');
const DeliveryNote = require('./models/DeliveryNote');
const MaterialRequirement = require('./models/MaterialRequirement');

// 创建 readline 接口用于交互确认
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promise 包装的问答函数
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/cmax';
    
    console.log('\n🔌 正在连接数据库...');
    await mongoose.connect(mongoUri);
    console.log('✅ 数据库连接成功:', mongoose.connection.name);
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    throw error;
  }
}

async function clearAllData() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  清除所有数据                                                ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  const collections = [
    { name: '刷新令牌', model: RefreshToken },
    { name: '项目', model: Project },
    { name: '新项目', model: NewProject },
    { name: '销售订单', model: SalesOrder },
    { name: '生产订单', model: ProductionOrder },
    { name: '采购订单', model: PurchaseOrder },
    { name: '服务工单', model: ServiceTicket },
    { name: '报价单', model: Quote },
    { name: '发票', model: Invoice },
    { name: '付款记录', model: Payment },
    { name: '质检记录', model: QualityCheck },
    { name: '工单', model: WorkOrder },
    { name: '工作中心', model: WorkCenter },
    { name: '路由', model: Routing },
    { name: '工程变更单', model: EngineeringChangeOrder },
    { name: '合同', model: Contract },
    { name: '配送单', model: DeliveryNote },
    { name: '物料需求', model: MaterialRequirement },
    { name: '产品', model: Product },
    { name: '执行器', model: Actuator },
    { name: '配件', model: Accessory },
    { name: '手动装置', model: ManualOverride },
    { name: '供应商', model: Supplier },
    { name: '用户（非管理员）', model: User }
  ];

  for (const collection of collections) {
    try {
      if (collection.model === User) {
        // 只删除非管理员用户
        const result = await collection.model.deleteMany({ role: { $ne: 'Administrator' } });
        console.log(`✅ ${collection.name}: 删除 ${result.deletedCount} 条记录`);
      } else {
        const result = await collection.model.deleteMany({});
        console.log(`✅ ${collection.name}: 删除 ${result.deletedCount} 条记录`);
      }
    } catch (error) {
      console.log(`⚠️  ${collection.name}: ${error.message}`);
    }
  }
  
  console.log('\n✅ 数据清理完成\n');
}

async function createAdminUser() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  创建管理员账号                                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  try {
    // 检查是否已有管理员
    const existingAdmin = await User.findOne({ role: 'Administrator' });
    
    if (existingAdmin) {
      console.log('ℹ️  发现现有管理员账号：');
      console.log(`   手机号: ${existingAdmin.phone}`);
      console.log(`   姓名: ${existingAdmin.full_name}`);
      console.log(`   状态: ${existingAdmin.isActive ? '激活' : '禁用'}`);
      
      // 询问是否重置密码
      const answer = await question('\n是否重置管理员密码为 "admin123"？(y/n): ');
      
      if (answer.toLowerCase() === 'y') {
        existingAdmin.password = 'admin123';  // 会被自动加密
        existingAdmin.isActive = true;
        existingAdmin.passwordChangeRequired = true;  // 强制首次登录修改密码
        await existingAdmin.save();
        console.log('✅ 管理员密码已重置为: admin123');
        console.log('⚠️  首次登录时需要修改密码');
      }
      
      return existingAdmin;
    }
    
    // 如果没有管理员，创建新的
    console.log('📝 请输入管理员信息：\n');
    
    const phone = await question('手机号 (11位): ');
    const fullName = await question('姓名: ');
    const password = 'admin123';  // 默认密码
    
    const admin = await User.create({
      phone: phone,
      full_name: fullName,
      password: password,  // 会被自动加密
      role: 'Administrator',
      department: '管理部门',
      isActive: true,
      passwordChangeRequired: true  // 强制首次登录修改密码
    });
    
    console.log('\n✅ 管理员账号创建成功！');
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  管理员登录信息                                              ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log(`║  手机号: ${phone.padEnd(50)}║`);
    console.log(`║  密码:   admin123${' '.repeat(42)}║`);
    console.log(`║  姓名:   ${fullName.padEnd(50)}║`);
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log('║  ⚠️  首次登录时必须修改密码                                  ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    return admin;
    
  } catch (error) {
    console.error('❌ 创建管理员失败:', error.message);
    throw error;
  }
}

async function displaySummary() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  生产环境初始化完成                                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  const adminCount = await User.countDocuments({ role: 'Administrator' });
  const totalUsers = await User.countDocuments();
  
  console.log('📊 当前数据库状态：\n');
  console.log(`   管理员账号数: ${adminCount}`);
  console.log(`   用户总数: ${totalUsers}`);
  console.log(`   产品数据: 0 个（等待导入）`);
  console.log(`   供应商: 0 家（等待创建）`);
  console.log(`   项目: 0 个（等待创建）`);
  
  console.log('\n📋 下一步操作：\n');
  console.log('   1. 使用管理员账号登录系统');
  console.log('   2. 首次登录强制修改密码');
  console.log('   3. 访问"用户管理"创建员工账号');
  console.log('   4. 访问"产品批量导入"导入产品数据');
  console.log('   5. 访问"数据管理"创建供应商');
  console.log('   6. 开始正常业务流程');
  
  console.log('\n✨ 系统已准备就绪，可以开始使用！\n');
}

async function main() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log('║           智能制造综合管理系统                                ║');
    console.log('║           生产环境初始化脚本                                  ║');
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    console.log('⚠️  警告：此脚本会清空数据库并创建初始管理员账号！\n');
    console.log('   适用场景：生产环境首次部署\n');
    
    const confirm = await question('确认要继续吗？输入 YES 继续: ');
    
    if (confirm !== 'YES') {
      console.log('\n❌ 操作已取消\n');
      rl.close();
      process.exit(0);
    }
    
    // 连接数据库
    await connectDatabase();
    
    // 清除所有数据
    await clearAllData();
    
    // 创建或确认管理员账号
    await createAdminUser();
    
    // 显示总结
    await displaySummary();
    
    rl.close();
    await mongoose.connection.close();
    console.log('👋 数据库连接已关闭\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ 初始化过程出错:', error.message);
    console.error(error.stack);
    rl.close();
    process.exit(1);
  }
}

// 执行主函数
main();

