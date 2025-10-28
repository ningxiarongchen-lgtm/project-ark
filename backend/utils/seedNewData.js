require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Actuator = require('../models/Actuator');
const ManualOverride = require('../models/ManualOverride');
const NewProject = require('../models/NewProject');
const User = require('../models/User');

// 执行器测试数据
const actuators = [
  {
    model_base: 'SF10-150DA',
    body_size: 'SF10',
    action_type: 'DA',
    base_price: 5000,
    torque_symmetric: {
      '0_3_0': 309,
      '0_4_0': 412,
      '0_5_0': 515,
      '0_6_0': 618,
      '0_3_15': 299,
      '0_4_15': 398,
      '0_5_15': 498
    },
    torque_canted: {
      '0_3_0': 417,
      '0_4_0': 556,
      '0_5_0': 695,
      '0_6_0': 834,
      '0_3_15': 403,
      '0_4_15': 537,
      '0_5_15': 671
    },
    specifications: {
      pressure_range: { min: 2, max: 8 },
      temperature_range: { min: -20, max: 80 },
      rotation_angle: 90,
      weight: 12.5,
      port_connection: 'G1/4',
      mounting_standard: 'ISO5211',
      materials: {
        body: '铝合金',
        piston: '铝合金',
        seal: 'NBR'
      }
    },
    description: 'SF10 双作用气动执行器，适用于中小型阀门',
    stock_info: {
      available: true,
      lead_time: 14
    }
  },
  {
    model_base: 'SF12-250SR',
    body_size: 'SF12',
    action_type: 'SR',
    base_price: 6500,
    torque_symmetric: {
      '0_3_0': 515,
      '0_4_0': 687,
      '0_5_0': 858,
      '0_6_0': 1030,
      '0_3_15': 498,
      '0_4_15': 664,
      '0_5_15': 830
    },
    torque_canted: {
      '0_3_0': 695,
      '0_4_0': 927,
      '0_5_0': 1158,
      '0_6_0': 1390,
      '0_3_15': 671,
      '0_4_15': 895,
      '0_5_15': 1119
    },
    specifications: {
      pressure_range: { min: 2, max: 8 },
      temperature_range: { min: -20, max: 80 },
      rotation_angle: 90,
      weight: 18.0,
      port_connection: 'G1/4',
      mounting_standard: 'ISO5211',
      materials: {
        body: '铝合金',
        piston: '铝合金',
        seal: 'NBR'
      }
    },
    description: 'SF12 弹簧复位气动执行器，安全失效保护',
    stock_info: {
      available: true,
      lead_time: 14
    }
  },
  {
    model_base: 'SF14-400DA',
    body_size: 'SF14',
    action_type: 'DA',
    base_price: 8500,
    torque_symmetric: {
      '0_3_0': 858,
      '0_4_0': 1144,
      '0_5_0': 1430,
      '0_6_0': 1716,
      '0_3_15': 830,
      '0_4_15': 1106,
      '0_5_15': 1383
    },
    torque_canted: {
      '0_3_0': 1158,
      '0_4_0': 1544,
      '0_5_0': 1930,
      '0_6_0': 2316,
      '0_3_15': 1119,
      '0_4_15': 1492,
      '0_5_15': 1865
    },
    specifications: {
      pressure_range: { min: 2, max: 8 },
      temperature_range: { min: -20, max: 80 },
      rotation_angle: 90,
      weight: 28.5,
      port_connection: 'G3/8',
      mounting_standard: 'ISO5211',
      materials: {
        body: '铝合金',
        piston: '铝合金',
        seal: 'NBR'
      }
    },
    description: 'SF14 双作用气动执行器，高扭矩输出',
    stock_info: {
      available: true,
      lead_time: 21
    }
  },
  {
    model_base: 'SF16-600DA',
    body_size: 'SF16',
    action_type: 'DA',
    base_price: 12000,
    torque_symmetric: {
      '0_3_0': 1287,
      '0_4_0': 1716,
      '0_5_0': 2145,
      '0_6_0': 2574,
      '0_3_15': 1244,
      '0_4_15': 1659,
      '0_5_15': 2074
    },
    torque_canted: {
      '0_3_0': 1737,
      '0_4_0': 2316,
      '0_5_0': 2895,
      '0_6_0': 3474,
      '0_3_15': 1678,
      '0_4_15': 2238,
      '0_5_15': 2797
    },
    specifications: {
      pressure_range: { min: 2, max: 8 },
      temperature_range: { min: -20, max: 80 },
      rotation_angle: 90,
      weight: 42.0,
      port_connection: 'G1/2',
      mounting_standard: 'ISO5211',
      materials: {
        body: '铝合金',
        piston: '铝合金',
        seal: 'NBR'
      }
    },
    description: 'SF16 双作用气动执行器，大扭矩应用',
    stock_info: {
      available: true,
      lead_time: 21
    }
  },
  {
    model_base: 'SF20-1000DA',
    body_size: 'SF20',
    action_type: 'DA',
    base_price: 18000,
    torque_symmetric: {
      '0_3_0': 2145,
      '0_4_0': 2860,
      '0_5_0': 3575,
      '0_6_0': 4290,
      '0_3_15': 2074,
      '0_4_15': 2765,
      '0_5_15': 3457
    },
    torque_canted: {
      '0_3_0': 2895,
      '0_4_0': 3860,
      '0_5_0': 4825,
      '0_6_0': 5790,
      '0_3_15': 2797,
      '0_4_15': 3730,
      '0_5_15': 4662
    },
    specifications: {
      pressure_range: { min: 2, max: 8 },
      temperature_range: { min: -20, max: 80 },
      rotation_angle: 90,
      weight: 68.0,
      port_connection: 'G3/4',
      mounting_standard: 'ISO5211',
      materials: {
        body: '铝合金',
        piston: '铝合金',
        seal: 'NBR'
      }
    },
    description: 'SF20 双作用气动执行器，超大扭矩工业应用',
    stock_info: {
      available: true,
      lead_time: 28
    }
  }
];

// 手动操作装置测试数据
const manualOverrides = [
  {
    model: 'HG',
    name: '手轮装置（标准型）',
    price: 800,
    compatible_body_sizes: ['SF10', 'SF12', 'SF14'],
    specifications: {
      operation_type: '手轮',
      gear_ratio: '1:1',
      output_torque: 100,
      weight: 2.5,
      mounting_position: '顶部',
      material: '铸铁',
      protection_class: 'IP65'
    },
    dimensions: {
      length: 200,
      width: 200,
      height: 150
    },
    application: '适用于需要手动操作的场合，提供紧急手动控制',
    stock_info: {
      available: true,
      lead_time: 7
    }
  },
  {
    model: 'HW',
    name: '手轮装置（加长型）',
    price: 1200,
    compatible_body_sizes: ['SF14', 'SF16', 'SF20'],
    specifications: {
      operation_type: '手轮',
      gear_ratio: '2:1',
      output_torque: 200,
      weight: 4.0,
      mounting_position: '顶部',
      material: '铸铁',
      protection_class: 'IP65'
    },
    dimensions: {
      length: 250,
      width: 250,
      height: 180
    },
    application: '适用于大扭矩执行器的手动操作',
    stock_info: {
      available: true,
      lead_time: 10
    }
  },
  {
    model: 'HL',
    name: '手柄装置',
    price: 600,
    compatible_body_sizes: ['SF10', 'SF12'],
    specifications: {
      operation_type: '手柄',
      gear_ratio: '1:1',
      output_torque: 80,
      weight: 1.8,
      mounting_position: '侧面',
      material: '铝合金',
      protection_class: 'IP65'
    },
    dimensions: {
      length: 180,
      width: 150,
      height: 120
    },
    application: '紧凑型手动操作装置，节省空间',
    stock_info: {
      available: true,
      lead_time: 7
    }
  },
  {
    model: 'HC',
    name: '链轮装置',
    price: 1500,
    compatible_body_sizes: ['SF12', 'SF14', 'SF16'],
    specifications: {
      operation_type: '链轮',
      gear_ratio: '3:1',
      output_torque: 300,
      weight: 5.5,
      mounting_position: '侧面',
      material: '铸钢',
      protection_class: 'IP67'
    },
    dimensions: {
      length: 300,
      width: 280,
      height: 200
    },
    application: '适用于高位安装或需要远程手动操作的场合',
    stock_info: {
      available: true,
      lead_time: 14
    }
  },
  {
    model: 'HWG',
    name: '蜗轮箱',
    price: 2500,
    compatible_body_sizes: ['SF16', 'SF20'],
    specifications: {
      operation_type: '蜗轮箱',
      gear_ratio: '60:1',
      output_torque: 2000,
      weight: 15.0,
      mounting_position: '顶部',
      material: '铸铁',
      protection_class: 'IP67'
    },
    dimensions: {
      length: 400,
      width: 350,
      height: 300
    },
    application: '大扭矩减速传动，适用于重型阀门',
    stock_info: {
      available: true,
      lead_time: 21
    }
  }
];

const seedNewData = async () => {
  try {
    // 连接数据库
    await connectDB();

    console.log('🗑️  清除现有数据...');
    
    // 清除现有数据
    await Actuator.deleteMany({});
    await ManualOverride.deleteMany({});
    await NewProject.deleteMany({});

    console.log('✅ 现有数据已清除\n');

    // 创建执行器
    console.log('📦 创建执行器数据...');
    const createdActuators = await Actuator.create(actuators);
    console.log(`✅ 已创建 ${createdActuators.length} 个执行器\n`);

    // 创建手动操作装置
    console.log('🔧 创建手动操作装置数据...');
    const createdOverrides = await ManualOverride.create(manualOverrides);
    console.log(`✅ 已创建 ${createdOverrides.length} 个手动操作装置\n`);

    // 获取第一个用户作为项目创建者
    const adminUser = await User.findOne({ role: 'administrator' });
    
    if (adminUser) {
      // 创建示例项目
      console.log('📁 创建示例项目...');
      
      const sampleProject = {
        project_name: '某化工厂阀门自动化改造项目',
        client_name: 'XX化工有限公司',
        client_contact: {
          company: 'XX化工有限公司',
          contact_person: '张工',
          email: 'zhang@chemical.com',
          phone: '138-1234-5678',
          address: '上海市浦东新区XXX路123号'
        },
        created_by: adminUser._id,
        project_status: '进行中',
        priority: '高',
        industry: '化工',
        application: '球阀和蝶阀的气动自动化控制',
        timeline: {
          start_date: new Date('2025-01-15'),
          expected_completion: new Date('2025-06-30')
        },
        budget: {
          estimated: 200000,
          currency: 'CNY'
        },
        selections: [
          {
            tag_number: 'V-101',
            input_params: {
              required_torque: 400,
              working_pressure: 0.4,
              working_angle: 0,
              yoke_type: 'symmetric',
              needs_manual_override: true,
              special_requirements: '需要防爆型'
            },
            selected_actuator: {
              actuator_id: createdActuators[1]._id,
              model_base: createdActuators[1].model_base,
              body_size: createdActuators[1].body_size,
              action_type: createdActuators[1].action_type,
              yoke_type: 'symmetric',
              actual_torque: 687,
              price: createdActuators[1].base_price
            },
            selected_override: {
              override_id: createdOverrides[0]._id,
              model: createdOverrides[0].model,
              price: createdOverrides[0].price
            },
            total_price: createdActuators[1].base_price + createdOverrides[0].price,
            status: '已选型',
            notes: '主管道球阀'
          },
          {
            tag_number: 'V-102',
            input_params: {
              required_torque: 800,
              working_pressure: 0.5,
              working_angle: 0,
              yoke_type: 'canted',
              needs_manual_override: true,
              special_requirements: '耐高温'
            },
            selected_actuator: {
              actuator_id: createdActuators[2]._id,
              model_base: createdActuators[2].model_base,
              body_size: createdActuators[2].body_size,
              action_type: createdActuators[2].action_type,
              yoke_type: 'canted',
              actual_torque: 1544,
              price: createdActuators[2].base_price
            },
            selected_override: {
              override_id: createdOverrides[1]._id,
              model: createdOverrides[1].model,
              price: createdOverrides[1].price
            },
            total_price: createdActuators[2].base_price + createdOverrides[1].price,
            status: '已选型',
            notes: '高温蒸汽管道阀门'
          }
        ],
        notes: '重要客户项目，优先处理'
      };

      const project = await NewProject.create(sampleProject);
      console.log(`✅ 已创建示例项目：${project.project_number}\n`);
    }

    console.log('╔════════════════════════════════════════════════╗');
    console.log('║     测试数据创建完成！ 🎉                      ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    console.log('📊 数据统计：');
    console.log(`   执行器：     ${createdActuators.length} 个`);
    console.log(`   手动装置：   ${createdOverrides.length} 个`);
    console.log(`   示例项目：   ${adminUser ? 1 : 0} 个`);
    console.log('');
    
    console.log('🔗 可用的API端点：');
    console.log('   GET  /api/actuators');
    console.log('   POST /api/actuators/find-by-torque');
    console.log('   GET  /api/manual-overrides');
    console.log('   GET  /api/manual-overrides/compatible/SF10');
    console.log('   GET  /api/new-projects');
    console.log('   POST /api/new-projects/:id/auto-select');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ 创建测试数据时出错:', error);
    process.exit(1);
  }
};

// 运行种子数据脚本
seedNewData();

