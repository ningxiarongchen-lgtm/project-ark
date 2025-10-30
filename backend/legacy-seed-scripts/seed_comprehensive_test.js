/**
 * ═══════════════════════════════════════════════════════════════════════
 * 综合验收测试数据种子脚本
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * 功能：为端到端验收测试创建完整的测试数据
 * 
 * 包含内容：
 * 1. 10个角色的测试用户账户
 * 2. 执行器型号数据
 * 3. 供应商数据
 * 4. 手动操作装置数据
 * 
 * 使用方法：
 * node seed_comprehensive_test.js
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Actuator = require('./models/Actuator');
const ManualOverride = require('./models/ManualOverride');
const Supplier = require('./models/Supplier');

// ═══════════════════════════════════════════════════════════════════════
// 数据库连接
// ═══════════════════════════════════════════════════════════════════════

async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/cmax';
    
    await mongoose.connect(mongoUri);
    console.log('✅ 数据库连接成功:', mongoose.connection.name);
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 测试用户数据（与 test_data.json 保持一致）
// ═══════════════════════════════════════════════════════════════════════

const testUsers = [
  {
    full_name: '系统管理员',
    phone: '18800000000',
    password: 'Password123!',
    role: 'Administrator',
    department: '管理部门',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '销售-张三',
    phone: '18800000001',
    password: 'Password123!',
    role: 'Sales Manager',
    department: '销售部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '技术-李四',
    phone: '18800000002',
    password: 'Password123!',
    role: 'Technical Engineer',
    department: '技术部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '商务-王五',
    phone: '18800000003',
    password: 'Password123!',
    role: 'Sales Engineer',
    department: '商务部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '采购-赵六',
    phone: '18800000004',
    password: 'Password123!',
    role: 'Procurement Specialist',
    department: '采购部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '生产-孙七',
    phone: '18800000005',
    password: 'Password123!',
    role: 'Production Planner',
    department: '生产部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '质检-周八',
    phone: '18800000006',
    password: 'Password123!',
    role: 'QA Inspector',
    department: '质检部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '物流-吴九',
    phone: '18800000007',
    password: 'Password123!',
    role: 'Logistics Specialist',
    department: '物流部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '售后-郑十',
    phone: '18800000008',
    password: 'Password123!',
    role: 'After-sales Engineer',
    department: '售后服务部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '工人-陈十一',
    phone: '18800000009',
    password: 'Password123!',
    role: 'Shop Floor Worker',
    department: '生产车间',
    isActive: true,
    passwordChangeRequired: false
  }
];

// ═══════════════════════════════════════════════════════════════════════
// 执行器测试数据
// ═══════════════════════════════════════════════════════════════════════

const testActuators = [
  // AT系列执行器
  {
    model_base: 'AT-100-DA',
    series: 'AT',
    body_size: '100',
    action_type: 'DA',
    base_price_normal: 8500,
    base_price_low: 9000,
    base_price_high: 9500,
    torque_symmetric: new Map([
      ['1_5', 200],
      ['2_0', 250],
      ['2_5', 300]
    ]),
    torque_canted: new Map([
      ['1_5', 180],
      ['2_0', 220],
      ['2_5', 270]
    ]),
    dimensions: {
      L1: 320,
      L2: 280,
      H1: 350,
      H2: 310,
      D: 160
    },
    specifications: {
      mounting_standard: 'ISO5211',
      pressure_range: { min: 2, max: 8 },
      temperature_range: { min: -20, max: 80 },
      rotation_angle: 90,
      weight: 12.5
    }
  },
  {
    model_base: 'AT-150-DA',
    series: 'AT',
    body_size: '150',
    action_type: 'DA',
    base_price_normal: 12500,
    base_price_low: 13200,
    base_price_high: 13800,
    torque_symmetric: new Map([
      ['2_0', 500],
      ['2_5', 600],
      ['3_0', 700]
    ]),
    torque_canted: new Map([
      ['2_0', 450],
      ['2_5', 550],
      ['3_0', 650]
    ]),
    dimensions: {
      L1: 420,
      L2: 380,
      H1: 450,
      H2: 410,
      D: 200
    },
    specifications: {
      mounting_standard: 'ISO5211',
      pressure_range: { min: 2, max: 8 },
      temperature_range: { min: -20, max: 80 },
      rotation_angle: 90,
      weight: 18.5
    }
  },
  {
    model_base: 'AT-200-DA',
    series: 'AT',
    body_size: '200',
    action_type: 'DA',
    base_price_normal: 18500,
    base_price_low: 19500,
    base_price_high: 20500,
    torque_symmetric: new Map([
      ['2_5', 1000],
      ['3_0', 1200],
      ['3_5', 1400]
    ]),
    torque_canted: new Map([
      ['2_5', 900],
      ['3_0', 1100],
      ['3_5', 1300]
    ]),
    dimensions: {
      L1: 520,
      L2: 480,
      H1: 550,
      H2: 510,
      D: 250
    },
    specifications: {
      mounting_standard: 'ISO5211',
      pressure_range: { min: 2, max: 8 },
      temperature_range: { min: -20, max: 80 },
      rotation_angle: 90,
      weight: 28.5
    }
  },
  // GY系列执行器
  {
    model_base: 'GY-100-DA',
    series: 'GY',
    body_size: '100',
    action_type: 'DA',
    base_price_normal: 9200,
    base_price_low: 9700,
    base_price_high: 10200,
    torque_symmetric: new Map([
      ['1_5', 220],
      ['2_0', 280],
      ['2_5', 330]
    ]),
    torque_canted: new Map([
      ['1_5', 200],
      ['2_0', 250],
      ['2_5', 300]
    ]),
    dimensions: {
      L1: 330,
      L2: 290,
      H1: 360,
      H2: 320,
      D: 165
    },
    specifications: {
      mounting_standard: 'ISO5211',
      pressure_range: { min: 2, max: 8 },
      temperature_range: { min: -20, max: 80 },
      rotation_angle: 90,
      weight: 13.2
    }
  },
  {
    model_base: 'GY-150-DA',
    series: 'GY',
    body_size: '150',
    action_type: 'DA',
    base_price_normal: 13800,
    base_price_low: 14500,
    base_price_high: 15200,
    torque_symmetric: new Map([
      ['2_0', 550],
      ['2_5', 660],
      ['3_0', 770]
    ]),
    torque_canted: new Map([
      ['2_0', 500],
      ['2_5', 600],
      ['3_0', 700]
    ]),
    dimensions: {
      L1: 430,
      L2: 390,
      H1: 460,
      H2: 420,
      D: 205
    },
    specifications: {
      mounting_standard: 'ISO5211',
      pressure_range: { min: 2, max: 8 },
      temperature_range: { min: -20, max: 80 },
      rotation_angle: 90,
      weight: 19.8
    }
  },
  {
    model_base: 'GY-200-DA',
    series: 'GY',
    body_size: '200',
    action_type: 'DA',
    base_price_normal: 19800,
    base_price_low: 20800,
    base_price_high: 21800,
    torque_symmetric: new Map([
      ['2_5', 1100],
      ['3_0', 1320],
      ['3_5', 1540]
    ]),
    torque_canted: new Map([
      ['2_5', 1000],
      ['3_0', 1200],
      ['3_5', 1400]
    ]),
    dimensions: {
      L1: 530,
      L2: 490,
      H1: 560,
      H2: 520,
      D: 255
    },
    specifications: {
      mounting_standard: 'ISO5211',
      pressure_range: { min: 2, max: 8 },
      temperature_range: { min: -20, max: 80 },
      rotation_angle: 90,
      weight: 30.5
    }
  }
];

// ═══════════════════════════════════════════════════════════════════════
// 手动操作装置测试数据
// ═══════════════════════════════════════════════════════════════════════

const testManualOverrides = [
  {
    model: 'MO-100',
    name: '手动操作装置 100型',
    compatible_body_sizes: ['100'],
    price: 580,
    application: '紧急情况下手动操作阀门',
    specifications: {
      operation_type: '手轮',
      gear_ratio: '1:1',
      output_torque: 50,
      weight: 2.5,
      mounting_position: '顶部',
      material: '铸铁',
      protection_class: 'IP65'
    },
    dimensions: {
      length: 150,
      width: 100,
      height: 80
    }
  },
  {
    model: 'MO-150',
    name: '手动操作装置 150型',
    compatible_body_sizes: ['150'],
    price: 680,
    application: '紧急情况下手动操作阀门',
    specifications: {
      operation_type: '手轮',
      gear_ratio: '1:1',
      output_torque: 80,
      weight: 3.8,
      mounting_position: '顶部',
      material: '铸铁',
      protection_class: 'IP65'
    },
    dimensions: {
      length: 180,
      width: 120,
      height: 100
    }
  },
  {
    model: 'MO-200',
    name: '手动操作装置 200型',
    compatible_body_sizes: ['200'],
    price: 880,
    application: '紧急情况下手动操作阀门',
    specifications: {
      operation_type: '手轮',
      gear_ratio: '2:1',
      output_torque: 120,
      weight: 5.2,
      mounting_position: '顶部',
      material: '铸铁',
      protection_class: 'IP65'
    },
    dimensions: {
      length: 220,
      width: 150,
      height: 120
    }
  }
];

// ═══════════════════════════════════════════════════════════════════════
// 供应商测试数据
// ═══════════════════════════════════════════════════════════════════════

const testSuppliers = [
  {
    name: '北京精密机械有限公司',
    contact_person: '张经理',
    phone: '010-88888888',
    address: '北京市海淀区中关村大街1号',
    business_scope: '气动元件、阀门执行器制造与销售',
    rating: 5,
    certification_status: 'Certified',
    total_transaction_value: 2500000,
    on_time_delivery_rate: 98,
    status: '合格 (Qualified)',
    notes: '长期合作伙伴，质量稳定'
  },
  {
    name: '上海工业控制设备厂',
    contact_person: '李主管',
    phone: '021-66666666',
    address: '上海市浦东新区张江高科技园区',
    business_scope: '工业自动化控制系统、气动元件',
    rating: 5,
    certification_status: 'Certified',
    total_transaction_value: 1800000,
    on_time_delivery_rate: 96,
    status: '合格 (Qualified)',
    notes: 'ISO9001认证企业'
  },
  {
    name: '广州电气配件供应商',
    contact_person: '王总',
    phone: '020-55555555',
    address: '广州市天河区科技园',
    business_scope: '电气配件、控制元件',
    rating: 4,
    certification_status: 'Pending',
    total_transaction_value: 500000,
    on_time_delivery_rate: 92,
    status: '考察中 (Onboarding)',
    notes: '新供应商，价格有竞争力'
  }
];

// ═══════════════════════════════════════════════════════════════════════
// 创建测试用户
// ═══════════════════════════════════════════════════════════════════════

async function seedUsers() {
  try {
    console.log('\n👥 创建测试用户账户...\n');

    // 清理旧的测试用户
    const testPhones = testUsers.map(u => u.phone);
    const deleteResult = await User.deleteMany({ 
      phone: { $in: testPhones } 
    });
    
    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️  已清理 ${deleteResult.deletedCount} 个旧测试用户\n`);
    }

    // 批量创建新的测试用户
    const createdUsers = await User.create(testUsers);
    
    console.log(`✅ 成功创建 ${createdUsers.length} 个测试用户！\n`);

    // 打印用户信息表格
    console.log('╔════════════════════════════════════════════════════════════════════════╗');
    console.log('║                        测试用户账户列表                                ║');
    console.log('╠════════════════════════════════════════════════════════════════════════╣');
    console.log('║ 姓名             │ 手机号        │ 密码            │ 角色           ║');
    console.log('╠══════════════════╪═══════════════╪═════════════════╪════════════════╣');
    
    testUsers.forEach(user => {
      const name = user.full_name.padEnd(16);
      const phone = user.phone.padEnd(13);
      const password = user.password.padEnd(15);
      const role = user.role.padEnd(23);
      console.log(`║ ${name} │ ${phone} │ ${password} │ ${role.substring(0, 14)} ║`);
    });
    
    console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

    return createdUsers.length;
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 创建执行器数据
// ═══════════════════════════════════════════════════════════════════════

async function seedActuators() {
  try {
    console.log('\n📦 创建执行器测试数据...\n');

    // 清理旧数据
    const deleteResult = await Actuator.deleteMany({});
    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️  已清理 ${deleteResult.deletedCount} 个旧执行器记录\n`);
    }

    // 批量创建执行器
    const createdActuators = await Actuator.create(testActuators);
    
    console.log(`✅ 成功创建 ${createdActuators.length} 个执行器型号！\n`);
    
    // 打印执行器信息
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    执行器型号列表                             ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log('║ 型号   │ 机身尺寸 │ 作用方式        │ 价格(元)        ║');
    console.log('╠════════╪══════════╪═════════════════╪═════════════════╣');
    
    testActuators.forEach(act => {
      const model = act.series.padEnd(6);
      const size = act.body_size.padEnd(8);
      const action = act.action_type.padEnd(15);
      const price = act.base_price_normal.toString().padEnd(15);
      console.log(`║ ${model} │ ${size} │ ${action} │ ${price} ║`);
    });
    
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    return createdActuators.length;
  } catch (error) {
    console.error('❌ 创建执行器数据失败:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 创建手动操作装置数据
// ═══════════════════════════════════════════════════════════════════════

async function seedManualOverrides() {
  try {
    console.log('\n🔧 创建手动操作装置测试数据...\n');

    // 清理旧数据
    const deleteResult = await ManualOverride.deleteMany({});
    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️  已清理 ${deleteResult.deletedCount} 个旧手动操作装置记录\n`);
    }

    // 批量创建
    const createdOverrides = await ManualOverride.create(testManualOverrides);
    
    console.log(`✅ 成功创建 ${createdOverrides.length} 个手动操作装置型号！\n`);
    
    // 打印信息
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                  手动操作装置列表                         ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║ 型号      │ 兼容尺寸 │ 价格(元)                      ║');
    console.log('╠═══════════╪══════════╪═══════════════════════════════╣');
    
    testManualOverrides.forEach(mo => {
      const model = mo.model.padEnd(9);
      const sizes = mo.compatible_body_sizes.join(',').padEnd(8);
      const price = mo.price.toString().padEnd(30);
      console.log(`║ ${model} │ ${sizes} │ ${price} ║`);
    });
    
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    return createdOverrides.length;
  } catch (error) {
    console.error('❌ 创建手动操作装置数据失败:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 创建供应商数据
// ═══════════════════════════════════════════════════════════════════════

async function seedSuppliers() {
  try {
    console.log('\n🏢 创建供应商测试数据...\n');

    // 清理旧数据
    const deleteResult = await Supplier.deleteMany({});
    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️  已清理 ${deleteResult.deletedCount} 个旧供应商记录\n`);
    }

    // 批量创建
    const createdSuppliers = await Supplier.create(testSuppliers);
    
    console.log(`✅ 成功创建 ${createdSuppliers.length} 个供应商！\n`);
    
    // 打印信息
    console.log('╔═══════════════════════════════════════════════════════════════════════╗');
    console.log('║                          供应商列表                                   ║');
    console.log('╠═══════════════════════════════════════════════════════════════════════╣');
    console.log('║ 名称                 │ 联系人   │ 评级 │ 状态                  ║');
    console.log('╠══════════════════════╪══════════╪══════╪═══════════════════════╣');
    
    testSuppliers.forEach(sup => {
      const name = sup.name.padEnd(20);
      const contact = sup.contact_person.padEnd(8);
      const rating = sup.rating.toString().padEnd(4);
      const status = sup.status.padEnd(22);
      console.log(`║ ${name} │ ${contact} │ ${rating} │ ${status} ║`);
    });
    
    console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

    return createdSuppliers.length;
  } catch (error) {
    console.error('❌ 创建供应商数据失败:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 主函数
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('                  综合验收测试数据种子脚本                             ');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('\n');
  
  try {
    // 1. 连接数据库
    await connectDatabase();
    
    // 2. 创建测试用户
    const userCount = await seedUsers();
    
    // 3. 创建执行器数据
    const actuatorCount = await seedActuators();
    
    // 4. 创建手动操作装置数据
    const overrideCount = await seedManualOverrides();
    
    // 5. 创建供应商数据
    const supplierCount = await seedSuppliers();
    
    // 6. 显示总结
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('                     数据填充完成！ 🎉                                 ');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('\n📊 导入统计:');
    console.log(`  ✅ 测试用户:         ${userCount} 个`);
    console.log(`  ✅ 执行器型号:       ${actuatorCount} 个`);
    console.log(`  ✅ 手动操作装置:     ${overrideCount} 个`);
    console.log(`  ✅ 供应商:           ${supplierCount} 个`);
    console.log(`  ✅ 总计:             ${userCount + actuatorCount + overrideCount + supplierCount} 条记录\n`);
    
    console.log('🔗 下一步：');
    console.log('   1. 启动后端服务器: npm start');
    console.log('   2. 启动前端服务器: cd frontend && npm run dev');
    console.log('   3. 运行 Cypress E2E 测试: cd frontend && npx cypress open\n');
    
    console.log('📝 测试账户登录信息：');
    console.log('   销售经理: 18800000001 / Password123!');
    console.log('   技术工程师: 18800000002 / Password123!');
    console.log('   商务工程师: 18800000003 / Password123!');
    console.log('   采购专员: 18800000004 / Password123!');
    console.log('   生产计划员: 18800000005 / Password123!');
    console.log('   质检员: 18800000006 / Password123!');
    console.log('   物流专员: 18800000007 / Password123!');
    console.log('   售后工程师: 18800000008 / Password123!');
    console.log('   车间工人: 18800000009 / Password123!');
    console.log('   系统管理员: 18800000000 / Password123!\n');
    
    console.log('═══════════════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ 数据填充过程中发生错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭\n');
    process.exit(0);
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = {
  testUsers,
  testActuators,
  testManualOverrides,
  testSuppliers,
  seedUsers,
  seedActuators,
  seedManualOverrides,
  seedSuppliers
};

