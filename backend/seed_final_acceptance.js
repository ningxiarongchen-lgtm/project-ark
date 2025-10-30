/**
 * ═══════════════════════════════════════════════════════════════════════
 * 最终验收测试 - 数据初始化脚本
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * 功能：为系统最终验收创建一个干净的、包含所有角色初始数据的测试环境
 * 
 * 用途：
 * 1. 最终验收测试
 * 2. 生产环境初始化（只运行Part A + Part B）
 * 3. 开发环境重置
 * 
 * 使用方法：
 * node seed_final_acceptance.js
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// ═══════════════════════════════════════════════════════════════════════
// 引入所有模型（按依赖顺序）
// ═══════════════════════════════════════════════════════════════════════

const User = require('./models/User');
const Supplier = require('./models/Supplier');
const Project = require('./models/Project');
const NewProject = require('./models/NewProject');
const SalesOrder = require('./models/SalesOrder');
const ProductionOrder = require('./models/ProductionOrder');
const PurchaseOrder = require('./models/PurchaseOrder');
const ServiceTicket = require('./models/ServiceTicket');
const Actuator = require('./models/Actuator');
const Accessory = require('./models/Accessory');
const ManualOverride = require('./models/ManualOverride');
const Product = require('./models/Product');
const Quote = require('./models/Quote');
const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');
const QualityCheck = require('./models/QualityCheck');
const WorkOrder = require('./models/WorkOrder');
const WorkCenter = require('./models/WorkCenter');
const Routing = require('./models/Routing');
const EngineeringChangeOrder = require('./models/EngineeringChangeOrder');
const RefreshToken = require('./models/RefreshToken');

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
// Part A: 清空数据库（按正确的顺序）
// ═══════════════════════════════════════════════════════════════════════

async function cleanDatabase() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Part A: 清空数据库                                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  try {
    let totalDeleted = 0;
    
    // 1. 删除 Token 相关（最独立的）
    console.log('🗑️  清空 Token 数据...');
    const r1 = await RefreshToken.deleteMany({});
    console.log(`   ✓ RefreshToken: ${r1.deletedCount} 条`);
    totalDeleted += r1.deletedCount;
    
    // 2. 删除售后工单（引用 SalesOrder）
    console.log('\n🗑️  清空售后工单数据...');
    const r2 = await ServiceTicket.deleteMany({});
    console.log(`   ✓ ServiceTicket: ${r2.deletedCount} 条`);
    totalDeleted += r2.deletedCount;
    
    // 3. 删除生产相关（引用 SalesOrder, ProductionOrder）
    console.log('\n🗑️  清空生产相关数据...');
    const r3 = await WorkOrder.deleteMany({});
    console.log(`   ✓ WorkOrder: ${r3.deletedCount} 条`);
    const r4 = await QualityCheck.deleteMany({});
    console.log(`   ✓ QualityCheck: ${r4.deletedCount} 条`);
    const r5 = await Routing.deleteMany({});
    console.log(`   ✓ Routing: ${r5.deletedCount} 条`);
    const r6 = await WorkCenter.deleteMany({});
    console.log(`   ✓ WorkCenter: ${r6.deletedCount} 条`);
    totalDeleted += r3.deletedCount + r4.deletedCount + r5.deletedCount + r6.deletedCount;
    
    // 4. 删除财务相关（引用 SalesOrder, PurchaseOrder）
    console.log('\n🗑️  清空财务数据...');
    const r7 = await Invoice.deleteMany({});
    console.log(`   ✓ Invoice: ${r7.deletedCount} 条`);
    const r8 = await Payment.deleteMany({});
    console.log(`   ✓ Payment: ${r8.deletedCount} 条`);
    totalDeleted += r7.deletedCount + r8.deletedCount;
    
    // 5. 删除生产订单（引用 SalesOrder）
    console.log('\n🗑️  清空生产订单...');
    const r9 = await ProductionOrder.deleteMany({});
    console.log(`   ✓ ProductionOrder: ${r9.deletedCount} 条`);
    totalDeleted += r9.deletedCount;
    
    // 6. 删除采购订单（引用 Supplier）
    console.log('\n🗑️  清空采购订单...');
    const r10 = await PurchaseOrder.deleteMany({});
    console.log(`   ✓ PurchaseOrder: ${r10.deletedCount} 条`);
    totalDeleted += r10.deletedCount;
    
    // 7. 删除销售订单（引用 Project）
    console.log('\n🗑️  清空销售订单...');
    const r11 = await SalesOrder.deleteMany({});
    console.log(`   ✓ SalesOrder: ${r11.deletedCount} 条`);
    totalDeleted += r11.deletedCount;
    
    // 8. 删除项目相关（引用 User, Product）
    console.log('\n🗑️  清空项目数据...');
    const r12 = await Quote.deleteMany({});
    console.log(`   ✓ Quote: ${r12.deletedCount} 条`);
    const r13 = await EngineeringChangeOrder.deleteMany({});
    console.log(`   ✓ EngineeringChangeOrder: ${r13.deletedCount} 条`);
    const r14 = await Project.deleteMany({});
    console.log(`   ✓ Project: ${r14.deletedCount} 条`);
    const r15 = await NewProject.deleteMany({});
    console.log(`   ✓ NewProject: ${r15.deletedCount} 条`);
    totalDeleted += r12.deletedCount + r13.deletedCount + r14.deletedCount + r15.deletedCount;
    
    // 9. 删除用户数据
    console.log('\n🗑️  清空用户数据...');
    const r16 = await User.deleteMany({});
    console.log(`   ✓ User: ${r16.deletedCount} 条`);
    totalDeleted += r16.deletedCount;
    
    // 10. 删除供应商数据
    console.log('\n🗑️  清空供应商数据...');
    const r17 = await Supplier.deleteMany({});
    console.log(`   ✓ Supplier: ${r17.deletedCount} 条`);
    totalDeleted += r17.deletedCount;
    
    // 11. 删除产品数据（最基础的）
    console.log('\n🗑️  清空产品数据...');
    const r18 = await Actuator.deleteMany({});
    console.log(`   ✓ Actuator: ${r18.deletedCount} 条`);
    const r19 = await Accessory.deleteMany({});
    console.log(`   ✓ Accessory: ${r19.deletedCount} 条`);
    const r20 = await ManualOverride.deleteMany({});
    console.log(`   ✓ ManualOverride: ${r20.deletedCount} 条`);
    const r21 = await Product.deleteMany({});
    console.log(`   ✓ Product: ${r21.deletedCount} 条`);
    totalDeleted += r18.deletedCount + r19.deletedCount + r20.deletedCount + r21.deletedCount;
    
    console.log('\n' + '═'.repeat(65));
    console.log(`✅ 数据库清空完成！共删除 ${totalDeleted} 条记录`);
    console.log('═'.repeat(65) + '\n');
    
    return totalDeleted;
  } catch (error) {
    console.error('\n❌ 清空数据库失败:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Part B: 创建测试用户（10个角色）
// ═══════════════════════════════════════════════════════════════════════

const testUsers = [
  {
    full_name: '王管理',
    phone: '13000000001',
    password: 'password',
    role: 'Administrator',
    department: '管理部门',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '李销售',
    phone: '13000000002',
    password: 'password',
    role: 'Sales Manager',
    department: '销售部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '张技术',
    phone: '13000000003',
    password: 'password',
    role: 'Technical Engineer',
    department: '技术部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '刘商务',
    phone: '13000000004',
    password: 'password',
    role: 'Sales Engineer',
    department: '商务部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '赵采购',
    phone: '13000000005',
    password: 'password',
    role: 'Procurement Specialist',
    department: '采购部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '钱计划',
    phone: '13000000006',
    password: 'password',
    role: 'Production Planner',
    department: '生产部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '孙质检',
    phone: '13000000007',
    password: 'password',
    role: 'QA Inspector',
    department: '质检部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '周物流',
    phone: '13000000008',
    password: 'password',
    role: 'Logistics Specialist',
    department: '物流部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '吴售后',
    phone: '13000000009',
    password: 'password',
    role: 'After-sales Engineer',
    department: '售后服务部',
    isActive: true,
    passwordChangeRequired: false
  },
  {
    full_name: '郑工人',
    phone: '13000000010',
    password: 'password',
    role: 'Shop Floor Worker',
    department: '生产车间',
    isActive: true,
    passwordChangeRequired: false
  }
];

async function seedUsers() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Part B: 创建测试用户账户                                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  try {
    const createdUsers = await User.create(testUsers);
    
    console.log(`--- All ${createdUsers.length} role users have been created. ---\n`);
    
    // 打印用户信息表格
    console.log('╔════════════════════════════════════════════════════════════════════════╗');
    console.log('║                        测试用户账户列表                                ║');
    console.log('╠════════════════════════════════════════════════════════════════════════╣');
    console.log('║ 姓名                │ 手机号        │ 密码            │ 角色        ║');
    console.log('╠═════════════════════╪═══════════════╪═════════════════╪═════════════╣');
    
    testUsers.forEach(user => {
      const name = user.full_name.padEnd(18);
      const phone = user.phone.padEnd(13);
      const password = user.password.padEnd(15);
      const role = user.role.padEnd(23);
      console.log(`║ ${name} │ ${phone} │ ${password} │ ${role.substring(0, 11)} ║`);
    });
    
    console.log('╚════════════════════════════════════════════════════════════════════════╝\n');
    
    return createdUsers;
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Part C: 创建供应商数据
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
    notes: '长期合作伙伴，质量稳定，AT系列主要供应商'
  },
  {
    name: '上海工业控制设备厂',
    contact_person: '李主管',
    phone: '021-66666666',
    address: '上海市浦东新区张江高科技园区',
    business_scope: '工业自动化控制系统、气动元件、GY系列执行器',
    rating: 5,
    certification_status: 'Certified',
    total_transaction_value: 1800000,
    on_time_delivery_rate: 96,
    status: '合格 (Qualified)',
    notes: 'ISO9001认证企业，GY系列供应商'
  },
  {
    name: '广州电气配件供应商',
    contact_person: '王总',
    phone: '020-55555555',
    address: '广州市天河区科技园',
    business_scope: '电气配件、控制元件、手动操作装置',
    rating: 4,
    certification_status: 'Pending',
    total_transaction_value: 500000,
    on_time_delivery_rate: 92,
    status: '考察中 (Onboarding)',
    notes: '新供应商，价格有竞争力，配件供应商'
  },
  {
    name: '天津阀门附件制造厂',
    contact_person: '刘厂长',
    phone: '022-77777777',
    address: '天津市滨海新区开发区',
    business_scope: '阀门附件、密封件、传动装置',
    rating: 4,
    certification_status: 'Certified',
    total_transaction_value: 800000,
    on_time_delivery_rate: 94,
    status: '合格 (Qualified)',
    notes: '附件专业供应商，交期稳定'
  },
  {
    name: '深圳智能控制系统有限公司',
    contact_person: '陈总',
    phone: '0755-99999999',
    address: '深圳市南山区高新技术产业园',
    business_scope: '智能控制系统、位置反馈装置、电磁阀',
    rating: 5,
    certification_status: 'Certified',
    total_transaction_value: 1200000,
    on_time_delivery_rate: 97,
    status: '合格 (Qualified)',
    notes: '高端配件供应商，技术实力强'
  }
];

async function seedSuppliers() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Part C: 创建供应商数据                                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  try {
    const createdSuppliers = await Supplier.create(testSuppliers);
    
    console.log(`✅ 成功创建 ${createdSuppliers.length} 个供应商！\n`);
    
    // 打印供应商信息
    console.log('╔═══════════════════════════════════════════════════════════════════════╗');
    console.log('║                          供应商列表                                   ║');
    console.log('╠═══════════════════════════════════════════════════════════════════════╣');
    console.log('║ 名称                      │ 联系人   │ 评级 │ 状态              ║');
    console.log('╠═══════════════════════════╪══════════╪══════╪═══════════════════╣');
    
    testSuppliers.forEach(sup => {
      const name = sup.name.padEnd(25);
      const contact = sup.contact_person.padEnd(8);
      const rating = sup.rating.toString().padEnd(4);
      const status = sup.status.padEnd(17);
      console.log(`║ ${name} │ ${contact} │ ${rating} │ ${status} ║`);
    });
    
    console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');
    
    return createdSuppliers;
  } catch (error) {
    console.error('❌ 创建供应商数据失败:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Part D: 导入执行器数据（从CSV）
// ═══════════════════════════════════════════════════════════════════════

async function seedActuators() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Part D: 导入执行器数据                                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  try {
    // 查找CSV文件
    const csvPath = path.join(__dirname, 'data_imports', 'at_gy_actuators_data_final.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('⚠️  未找到执行器CSV文件，跳过执行器数据导入');
      console.log(`   期望路径: ${csvPath}\n`);
      return [];
    }
    
    console.log('📄 读取文件:', csvPath);
    
    const actuators = [];
    let rowCount = 0;
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          rowCount++;
          
          // 解析CSV数据（根据实际CSV格式调整）
          try {
            const actuator = {
              model_base: row.model_base || row.型号,
              series: row.series || row.系列,
              body_size: row.body_size || row.机身尺寸,
              action_type: row.action_type || row.作用方式,
              base_price_normal: parseFloat(row.base_price_normal || row.常温价格 || 0),
              base_price_low: parseFloat(row.base_price_low || row.低温价格 || 0),
              base_price_high: parseFloat(row.base_price_high || row.高温价格 || 0),
              specifications: {
                mounting_standard: row.mounting_standard || row.安装标准 || 'ISO5211',
                temperature_range: {
                  min: parseFloat(row.temp_min || row.最低温度 || -20),
                  max: parseFloat(row.temp_max || row.最高温度 || 80)
                },
                rotation_angle: parseFloat(row.rotation_angle || row.旋转角度 || 90),
                weight: parseFloat(row.weight || row.重量 || 0)
              }
            };
            
            // 解析扭矩数据（如果有）
            if (row.torque_symmetric || row.对称扭矩) {
              try {
                actuator.torque_symmetric = JSON.parse(row.torque_symmetric || row.对称扭矩);
              } catch (e) {
                // 忽略解析错误
              }
            }
            
            if (row.torque_canted || row.斜角扭矩) {
              try {
                actuator.torque_canted = JSON.parse(row.torque_canted || row.斜角扭矩);
              } catch (e) {
                // 忽略解析错误
              }
            }
            
            actuators.push(actuator);
          } catch (error) {
            console.warn(`   ⚠️  行 ${rowCount} 解析失败:`, error.message);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📦 共读取 ${actuators.length} 条执行器数据`);
    
    if (actuators.length > 0) {
      // 批量插入
      const created = await Actuator.insertMany(actuators, { ordered: false });
      console.log(`✅ 成功导入 ${created.length} 个执行器型号！\n`);
      return created;
    } else {
      console.log('⚠️  没有有效的执行器数据可导入\n');
      return [];
    }
    
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  部分执行器型号已存在（跳过重复项）\n');
      return [];
    }
    console.error('❌ 导入执行器数据失败:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Part E: 创建手动操作装置数据
// ═══════════════════════════════════════════════════════════════════════

const manualOverrideData = [
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
  },
  {
    model: 'MO-250',
    name: '手动操作装置 250型',
    compatible_body_sizes: ['250'],
    price: 1080,
    application: '紧急情况下手动操作阀门',
    specifications: {
      operation_type: '手轮',
      gear_ratio: '2:1',
      output_torque: 180,
      weight: 7.5,
      mounting_position: '顶部',
      material: '球墨铸铁',
      protection_class: 'IP65'
    },
    dimensions: {
      length: 260,
      width: 180,
      height: 150
    }
  }
];

async function seedManualOverrides() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Part E: 创建手动操作装置数据                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  try {
    const created = await ManualOverride.create(manualOverrideData);
    
    console.log(`✅ 成功创建 ${created.length} 个手动操作装置型号！\n`);
    
    // 打印信息
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                  手动操作装置列表                         ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║ 型号      │ 兼容尺寸 │ 价格(元) │ 输出扭矩(Nm)    ║');
    console.log('╠═══════════╪══════════╪══════════╪═════════════════╣');
    
    manualOverrideData.forEach(mo => {
      const model = mo.model.padEnd(9);
      const sizes = mo.compatible_body_sizes.join(',').padEnd(8);
      const price = mo.price.toString().padEnd(8);
      const torque = mo.specifications.output_torque.toString().padEnd(15);
      console.log(`║ ${model} │ ${sizes} │ ${price} │ ${torque} ║`);
    });
    
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    return created;
  } catch (error) {
    console.error('❌ 创建手动操作装置数据失败:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Part F: 创建配件数据
// ═══════════════════════════════════════════════════════════════════════

const accessoriesData = [
  // 控制类配件
  {
    name: '电磁阀 - 单线圈',
    category: '控制类',
    base_price_normal: 450,
    base_price_low: 520,
    base_price_high: 480,
    specifications: new Map([
      ['电压', '24V DC'],
      ['功率', '3W'],
      ['防护等级', 'IP65'],
      ['连接方式', 'DIN接头']
    ]),
    compatibility_rules: {
      body_sizes: ['100', '150', '200', '250']
    },
    description: '标准单线圈电磁阀，用于控制气路通断'
  },
  {
    name: '电磁阀 - 双线圈',
    category: '控制类',
    base_price_normal: 680,
    base_price_low: 750,
    base_price_high: 710,
    specifications: new Map([
      ['电压', '24V DC'],
      ['功率', '6W'],
      ['防护等级', 'IP65'],
      ['连接方式', 'DIN接头']
    ]),
    compatibility_rules: {
      body_sizes: ['100', '150', '200', '250']
    },
    description: '双线圈电磁阀，适用于双作用执行器'
  },
  {
    name: '限位开关盒（机械式）',
    category: '检测与反馈类',
    base_price_normal: 580,
    base_price_low: 650,
    base_price_high: 620,
    specifications: new Map([
      ['开关数量', '2个（开/关）'],
      ['触点类型', 'SPDT'],
      ['防护等级', 'IP67'],
      ['材质', '压铸铝']
    ]),
    compatibility_rules: {
      body_sizes: ['100', '150', '200', '250']
    },
    description: '机械式限位开关，反馈阀门开关位置'
  },
  {
    name: '位置变送器（模拟量）',
    category: '检测与反馈类',
    base_price_normal: 1280,
    base_price_low: 1450,
    base_price_high: 1350,
    specifications: new Map([
      ['输出信号', '4-20mA'],
      ['精度', '±1%'],
      ['防护等级', 'IP67'],
      ['供电', '24V DC']
    ]),
    compatibility_rules: {
      body_sizes: ['100', '150', '200', '250']
    },
    description: '模拟量位置反馈装置，实时监测阀门位置'
  },
  // 连接与传动类
  {
    name: '联轴器 - ISO F07',
    category: '连接与传动类',
    base_price_normal: 180,
    specifications: new Map([
      ['标准', 'ISO 5211 F07'],
      ['材质', '不锈钢'],
      ['适用尺寸', '100-150']
    ]),
    compatibility_rules: {
      body_sizes: ['100', '150']
    },
    description: 'ISO标准联轴器，连接执行器与阀门'
  },
  {
    name: '联轴器 - ISO F10',
    category: '连接与传动类',
    base_price_normal: 280,
    specifications: new Map([
      ['标准', 'ISO 5211 F10'],
      ['材质', '不锈钢'],
      ['适用尺寸', '200-250']
    ]),
    compatibility_rules: {
      body_sizes: ['200', '250']
    },
    description: 'ISO标准联轴器，连接执行器与阀门'
  },
  // 安全与保护类
  {
    name: '气源三联件',
    category: '安全与保护类',
    base_price_normal: 380,
    specifications: new Map([
      ['功能', '过滤+减压+油雾'],
      ['接口尺寸', 'G1/4"'],
      ['最大压力', '10 bar'],
      ['过滤精度', '5μm']
    ]),
    description: '气源处理单元，确保气源质量'
  },
  {
    name: '快速排气阀',
    category: '安全与保护类',
    base_price_normal: 120,
    specifications: new Map([
      ['接口尺寸', 'G1/4"'],
      ['流量系数', 'Cv 0.8'],
      ['材质', '铝合金']
    ]),
    compatibility_rules: {
      body_sizes: ['100', '150', '200', '250']
    },
    description: '加速执行器排气，提高响应速度'
  }
];

async function seedAccessories() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Part F: 创建配件数据                                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  try {
    const created = await Accessory.create(accessoriesData);
    
    console.log(`✅ 成功创建 ${created.length} 个配件型号！\n`);
    
    // 按类别统计
    const categoryStats = {};
    accessoriesData.forEach(acc => {
      categoryStats[acc.category] = (categoryStats[acc.category] || 0) + 1;
    });
    
    console.log('📊 配件分类统计:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} 个`);
    });
    console.log('');
    
    return created;
  } catch (error) {
    console.error('❌ 创建配件数据失败:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Part G: 创建示例项目和订单（可选）
// ═══════════════════════════════════════════════════════════════════════

async function seedExampleBusinessData() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Part G: 创建示例业务数据（可选）                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  try {
    // 获取用户
    const users = await User.find({});
    const salesManager = users.find(u => u.role === 'Sales Manager');
    const techEngineer = users.find(u => u.role === 'Technical Engineer');
    const salesEngineer = users.find(u => u.role === 'Sales Engineer');
    
    if (!salesManager || !techEngineer) {
      console.log('⚠️  未找到必要的用户角色，跳过示例业务数据创建\n');
      return;
    }
    
    console.log('📦 创建示例项目（不同阶段）...\n');
    
    // 1. 创建一个"待选型"的项目
    const project1 = await Project.create({
      projectNumber: 'PRJ-2025-0001',
      projectName: '初始项目-待选型',
      client: {
        name: '华东制药有限公司',
        company: '华东制药集团',
        phone: '025-88888888',
        address: '江苏省南京市建邺区河西大街100号'
      },
      description: '制药生产线阀门自动化升级',
      industry: 'Manufacturing',
      createdBy: salesManager._id,
      owner: salesManager._id,
      technical_support: techEngineer._id,
      status: '选型中',
      priority: 'Medium',
      budget: 300000,
      timeline: {
        startDate: new Date(),
        expectedCompletionDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
      }
    });
    console.log(`   ✓ ${project1.projectNumber} - ${project1.projectName} (${project1.status})`);
    
    // 2. 创建一个"待报价"的项目（已有技术清单）
    const project2 = await Project.create({
      projectNumber: 'PRJ-2025-0002',
      projectName: '初始项目-待报价',
      client: {
        name: '中石化上海分公司',
        company: '中国石化集团',
        phone: '021-12345678',
        address: '上海市浦东新区张江路123号'
      },
      description: '对现有球阀进行气动执行器改造',
      industry: 'Oil & Gas',
      createdBy: salesManager._id,
      owner: salesManager._id,
      technical_support: techEngineer._id,
      status: '待商务报价',
      priority: 'High',
      budget: 500000,
      technical_item_list: [
        {
          tag: 'V-001',
          model_name: 'AT-150-DA',
          quantity: 5,
          description: '主管路球阀执行器',
          technical_specs: {
            torque: 600,
            pressure: 6,
            rotation: 90,
            temperature: { min: -20, max: 80 },
            valve_type: '球阀',
            valve_size: 'DN150'
          }
        },
        {
          tag: 'V-002',
          model_name: 'AT-200-DA',
          quantity: 3,
          description: '大口径调节阀执行器',
          technical_specs: {
            torque: 1200,
            pressure: 6,
            rotation: 90,
            valve_type: '调节阀',
            valve_size: 'DN200'
          }
        }
      ],
      timeline: {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前开始
        expectedCompletionDate: new Date(Date.now() + 53 * 24 * 60 * 60 * 1000)
      }
    });
    console.log(`   ✓ ${project2.projectNumber} - ${project2.projectName} (${project2.status})`);
    
    // 3. 创建一个"已报价"的项目
    const project3 = await Project.create({
      projectNumber: 'PRJ-2025-0003',
      projectName: '初始项目-已报价',
      client: {
        name: '北京自来水公司',
        company: '北京市自来水集团',
        phone: '010-66666666',
        address: '北京市朝阳区东三环北路100号'
      },
      description: '水处理厂阀门自动化项目',
      industry: 'Water Treatment',
      createdBy: salesManager._id,
      owner: salesManager._id,
      technical_support: techEngineer._id,
      status: '已报价',
      priority: 'High',
      budget: 800000,
      estimatedValue: 750000,
      technical_item_list: [
        {
          tag: 'PV-101',
          model_name: 'GY-150-DA',
          quantity: 10,
          description: '进水阀门执行器'
        },
        {
          tag: 'PV-102',
          model_name: 'GY-200-DA',
          quantity: 6,
          description: '出水阀门执行器'
        }
      ],
      bill_of_materials: [
        {
          item_type: 'Actuator',
          model_name: 'GY-150-DA',
          quantity: 10,
          unit_price: 13800,
          total_price: 138000,
          description: 'GY系列150型双作用执行器'
        },
        {
          item_type: 'Actuator',
          model_name: 'GY-200-DA',
          quantity: 6,
          unit_price: 19800,
          total_price: 118800,
          description: 'GY系列200型双作用执行器'
        },
        {
          item_type: 'Manual',
          model_name: '电磁阀套件',
          quantity: 16,
          unit_price: 680,
          total_price: 10880,
          description: '双线圈电磁阀',
          is_manual: true
        }
      ],
      timeline: {
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14天前开始
        expectedCompletionDate: new Date(Date.now() + 46 * 24 * 60 * 60 * 1000)
      }
    });
    console.log(`   ✓ ${project3.projectNumber} - ${project3.projectName} (${project3.status})`);
    
    // 4. 创建一个"赢单"的项目
    const project4 = await Project.create({
      projectNumber: 'PRJ-2025-0004',
      projectName: '初始项目-赢单',
      client: {
        name: '广州化工厂',
        company: '广州石化有限公司',
        phone: '020-88888888',
        address: '广州市黄埔区科学城开发区'
      },
      description: '化工生产线阀门改造',
      industry: 'Chemical',
      createdBy: salesManager._id,
      owner: salesManager._id,
      technical_support: techEngineer._id,
      status: '赢单',
      priority: 'Urgent',
      budget: 400000,
      estimatedValue: 380000,
      technical_item_list: [
        {
          tag: 'CV-001',
          model_name: 'AT-150-DA',
          quantity: 8,
          description: '化工阀门执行器'
        }
      ],
      bill_of_materials: [
        {
          item_type: 'Actuator',
          model_name: 'AT-150-DA',
          quantity: 8,
          unit_price: 12500,
          total_price: 100000
        }
      ],
      timeline: {
        startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21天前开始
        expectedCompletionDate: new Date(Date.now() + 39 * 24 * 60 * 60 * 1000)
      }
    });
    console.log(`   ✓ ${project4.projectNumber} - ${project4.projectName} (${project4.status})`);
    
    console.log('\n--- Seed projects at various stages have been created. ---\n');
    
    return { 
      projects: [project1, project2, project3, project4],
      projectCount: 4
    };
  } catch (error) {
    console.error('❌ 创建示例业务数据失败:', error.message);
    // 不抛出错误，因为这是可选的
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 主函数
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('                   最终验收测试 - 数据初始化脚本                       ');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('\n');
  
  const startTime = Date.now();
  const stats = {
    deletedCount: 0,
    usersCreated: 0,
    suppliersCreated: 0,
    actuatorsCreated: 0,
    manualOverridesCreated: 0,
    accessoriesCreated: 0,
    projectsCreated: 0
  };
  
  try {
    // 连接数据库
    await connectDatabase();
    
    // Part A: 清空数据库
    stats.deletedCount = await cleanDatabase();
    
    // Part B: 创建测试用户
    const users = await seedUsers();
    stats.usersCreated = users.length;
    
    // Part C: 创建供应商
    const suppliers = await seedSuppliers();
    stats.suppliersCreated = suppliers.length;
    
    // Part D: 导入执行器数据
    const actuators = await seedActuators();
    stats.actuatorsCreated = actuators.length;
    
    // Part E: 创建手动操作装置
    const manualOverrides = await seedManualOverrides();
    stats.manualOverridesCreated = manualOverrides.length;
    
    // Part F: 创建配件
    const accessories = await seedAccessories();
    stats.accessoriesCreated = accessories.length;
    
    // Part G: 创建示例业务数据（可选）
    const businessData = await seedExampleBusinessData();
    if (businessData && businessData.projectCount) {
      stats.projectsCreated = businessData.projectCount;
    }
    
    // 显示最终总结
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('                     数据初始化完成！ 🎉                               ');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('\n📊 统计信息:');
    console.log(`  🗑️  已清除记录:       ${stats.deletedCount} 条`);
    console.log(`  👥 测试用户:          ${stats.usersCreated} 个`);
    console.log(`  🏢 供应商:            ${stats.suppliersCreated} 个`);
    console.log(`  📦 执行器型号:        ${stats.actuatorsCreated} 个`);
    console.log(`  🔧 手动操作装置:      ${stats.manualOverridesCreated} 个`);
    console.log(`  🔌 配件:              ${stats.accessoriesCreated} 个`);
    console.log(`  📋 示例项目:          ${stats.projectsCreated} 个`);
    console.log(`  ⏱️  总耗时:            ${duration} 秒\n`);
    
    console.log('🔗 下一步操作：');
    console.log('   1. 启动后端服务器: npm start');
    console.log('   2. 启动前端服务器: cd ../frontend && npm run dev');
    console.log('   3. 访问系统: http://localhost:5173\n');
    
    console.log('📝 测试账户登录信息：');
    console.log('   ┌─────────────────────┬───────────────┬────────────────┐');
    console.log('   │ 角色                │ 手机号        │ 密码           │');
    console.log('   ├─────────────────────┼───────────────┼────────────────┤');
    console.log('   │ 系统管理员          │ 13000000001   │ password       │');
    console.log('   │ 销售经理            │ 13000000002   │ password       │');
    console.log('   │ 技术工程师          │ 13000000003   │ password       │');
    console.log('   │ 商务工程师          │ 13000000004   │ password       │');
    console.log('   │ 采购专员            │ 13000000005   │ password       │');
    console.log('   │ 生产计划员          │ 13000000006   │ password       │');
    console.log('   │ 质检员              │ 13000000007   │ password       │');
    console.log('   │ 物流专员            │ 13000000008   │ password       │');
    console.log('   │ 售后工程师          │ 13000000009   │ password       │');
    console.log('   │ 车间工人            │ 13000000010   │ password       │');
    console.log('   └─────────────────────┴───────────────┴────────────────┘\n');
    
    console.log('💡 提示：');
    console.log('   - 所有测试账户初始密码均为: password');
    console.log('   - 首次登录无需强制修改密码（passwordChangeRequired: false）');
    console.log('   - 系统已包含完整的产品目录（执行器、配件、手动操作装置）');
    console.log('   - 可以开始进行完整的业务流程测试\n');
    
    console.log('═══════════════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ 数据初始化过程中发生错误:', error.message);
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
  connectDatabase,
  cleanDatabase,
  seedUsers,
  seedSuppliers,
  seedActuators,
  seedManualOverrides,
  seedAccessories,
  seedExampleBusinessData
};

