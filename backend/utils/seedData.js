require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');

// Sample data
const users = [
  {
    username: 'admin',
    name: 'Admin User',
    email: 'admin@cmax.com',
    password: 'admin123',
    role: 'Administrator',
    department: 'IT',
    phone: '+1-555-0100'
  },
  {
    username: 'tech_engineer',
    name: 'John Engineer',
    email: 'john@cmax.com',
    password: 'tech123',
    role: 'Technical Engineer',
    department: 'Engineering',
    phone: '+1-555-0101'
  },
  {
    username: 'sales_manager',
    name: 'Sarah Sales',
    email: 'sarah@cmax.com',
    password: 'manager123',
    role: 'Sales Manager',
    department: 'Sales',
    phone: '+1-555-0102'
  },
  {
    username: 'sales_engineer',
    name: 'Mike Commerce',
    email: 'mike@cmax.com',
    password: 'sales123',
    role: 'Sales Engineer',
    department: 'Sales',
    phone: '+1-555-0103'
  },
  {
    username: 'procurement',
    name: 'Lisa Buyer',
    email: 'lisa@cmax.com',
    password: 'proc123',
    role: 'Procurement Specialist',
    department: 'Procurement',
    phone: '+1-555-0104'
  },
  {
    username: 'production_planner',
    name: 'Tom Scheduler',
    email: 'tom@cmax.com',
    password: 'prod123',
    role: 'Production Planner',
    department: 'Production',
    phone: '+1-555-0105'
  },
  {
    username: 'aftersales',
    name: 'Anna Support',
    email: 'anna@cmax.com',
    password: 'after123',
    role: 'After-sales Engineer',
    department: 'After Sales',
    phone: '+1-555-0106'
  }
];

const products = [
  {
    modelNumber: 'SF-100',
    series: 'SF-Series',
    description: 'Compact pneumatic actuator for small valves',
    category: 'Compact',
    specifications: {
      torque: { value: 100, min: 90, max: 110 },
      pressure: { operating: 6, min: 4, max: 8 },
      rotation: '90°',
      temperature: { min: -20, max: 80 },
      dimensions: { length: 150, width: 100, height: 120, weight: 2.5 },
      portSize: 'G1/4',
      mountingType: 'ISO5211',
      materials: { body: 'Aluminum Alloy', piston: 'Aluminum Alloy', seal: 'NBR' },
      cycleLife: 1000000
    },
    pricing: { basePrice: 450.00, currency: 'USD' },
    availability: { inStock: true, leadTime: 14 },
    tags: ['compact', 'standard'],
    category: 'Compact'
  },
  {
    modelNumber: 'SF-250',
    series: 'SF-Series',
    description: 'Standard pneumatic actuator for medium valves',
    category: 'Standard',
    specifications: {
      torque: { value: 250, min: 225, max: 275 },
      pressure: { operating: 6, min: 4, max: 8 },
      rotation: '90°',
      temperature: { min: -20, max: 80 },
      dimensions: { length: 200, width: 150, height: 160, weight: 5.2 },
      portSize: 'G1/4',
      mountingType: 'ISO5211',
      materials: { body: 'Aluminum Alloy', piston: 'Aluminum Alloy', seal: 'NBR' },
      cycleLife: 1000000
    },
    pricing: { basePrice: 680.00, currency: 'USD', discountTiers: [{ quantity: 10, discountPercent: 5 }] },
    availability: { inStock: true, leadTime: 14 },
    tags: ['standard', 'popular'],
    category: 'Standard'
  },
  {
    modelNumber: 'SF-500',
    series: 'SF-Series',
    description: 'High torque pneumatic actuator for large valves',
    category: 'High Torque',
    specifications: {
      torque: { value: 500, min: 450, max: 550 },
      pressure: { operating: 6, min: 4, max: 8 },
      rotation: '90°',
      temperature: { min: -20, max: 80 },
      dimensions: { length: 250, width: 200, height: 200, weight: 10.5 },
      portSize: 'G1/2',
      mountingType: 'ISO5211',
      materials: { body: 'Aluminum Alloy', piston: 'Aluminum Alloy', seal: 'NBR' },
      cycleLife: 1000000
    },
    pricing: { basePrice: 1250.00, currency: 'USD', discountTiers: [{ quantity: 5, discountPercent: 8 }] },
    availability: { inStock: true, leadTime: 21 },
    tags: ['high-torque', 'heavy-duty'],
    category: 'High Torque'
  },
  {
    modelNumber: 'SF-1000',
    series: 'SF-Series',
    description: 'Extra high torque pneumatic actuator for industrial applications',
    category: 'High Torque',
    specifications: {
      torque: { value: 1000, min: 900, max: 1100 },
      pressure: { operating: 6, min: 4, max: 8 },
      rotation: '90°',
      temperature: { min: -20, max: 80 },
      dimensions: { length: 320, width: 250, height: 250, weight: 18.0 },
      portSize: 'G1/2',
      mountingType: 'ISO5211',
      materials: { body: 'Aluminum Alloy', piston: 'Aluminum Alloy', seal: 'NBR' },
      cycleLife: 1000000
    },
    pricing: { basePrice: 2100.00, currency: 'USD', discountTiers: [{ quantity: 5, discountPercent: 10 }] },
    availability: { inStock: true, leadTime: 28 },
    tags: ['high-torque', 'industrial', 'heavy-duty'],
    category: 'High Torque'
  },
  {
    modelNumber: 'SF-150HT',
    series: 'SF-Series',
    description: 'High temperature resistant pneumatic actuator',
    category: 'High Temperature',
    specifications: {
      torque: { value: 150, min: 135, max: 165 },
      pressure: { operating: 6, min: 4, max: 8 },
      rotation: '90°',
      temperature: { min: -40, max: 150 },
      dimensions: { length: 180, width: 120, height: 140, weight: 4.0 },
      portSize: 'G1/4',
      mountingType: 'ISO5211',
      materials: { body: 'Stainless Steel', piston: 'Stainless Steel', seal: 'Viton' },
      cycleLife: 800000
    },
    pricing: { basePrice: 1450.00, currency: 'USD' },
    availability: { inStock: true, leadTime: 21 },
    tags: ['high-temperature', 'stainless-steel', 'special'],
    category: 'High Temperature'
  }
];

const accessories = [
  {
    name: '双作用电磁阀',
    category: '控制类',
    price: 1200,
    description: '5/2方向双作用电磁阀，适用于气动控制',
    manufacturer: 'ASCO',
    model_number: 'SCG353A044',
    specifications: new Map([
      ['电压', '24V DC'],
      ['接口尺寸', 'G1/4'],
      ['防护等级', 'IP65']
    ]),
    compatibility_rules: {
      body_sizes: ['SF10', 'SF12', 'SF14', 'SF16'],
      action_types: ['DA']
    },
    stock_info: {
      quantity: 50,
      available: true,
      lead_time: '7天'
    }
  },
  {
    name: '机械限位开关',
    category: '安全与保护类',
    price: 800,
    description: '机械式限位开关，用于位置反馈',
    manufacturer: 'NAMUR',
    model_number: 'LS-001',
    specifications: new Map([
      ['触点类型', 'SPDT'],
      ['电气额定值', '250VAC/5A'],
      ['防护等级', 'IP67']
    ]),
    compatibility_rules: {
      body_sizes: ['SF10', 'SF12', 'SF14', 'SF16', 'SF20'],
      action_types: ['DA', 'SR']
    },
    stock_info: {
      quantity: 30,
      available: true,
      lead_time: '7天'
    }
  },
  {
    name: '智能定位器',
    category: '检测与反馈类',
    price: 5600,
    description: '智能数字定位器，支持HART协议',
    manufacturer: 'Fisher',
    model_number: 'DVC6200',
    specifications: new Map([
      ['通信协议', 'HART/4-20mA'],
      ['精度', '±0.5%'],
      ['环境温度', '-40°C至+85°C']
    ]),
    compatibility_rules: {
      body_sizes: ['SF12', 'SF14', 'SF16', 'SF20'],
      action_types: ['DA', 'SR']
    },
    stock_info: {
      quantity: 15,
      available: true,
      lead_time: '14天'
    }
  },
  {
    name: 'ISO5211安装套件',
    category: '连接与传动类',
    price: 300,
    description: 'ISO5211标准安装套件',
    manufacturer: 'C-MAX',
    model_number: 'MK-ISO5211',
    specifications: new Map([
      ['标准', 'ISO5211'],
      ['材质', '碳钢镀锌'],
      ['包含', '螺栓、垫片、连接件']
    ]),
    compatibility_rules: {
      body_sizes: ['SF10', 'SF12', 'SF14', 'SF16', 'SF20'],
      action_types: ['DA', 'SR']
    },
    stock_info: {
      quantity: 100,
      available: true,
      lead_time: '3天'
    }
  },
  {
    name: 'NBR密封件套装',
    category: '辅助与安装工具',
    price: 450,
    description: '更换用NBR密封件套装',
    manufacturer: 'C-MAX',
    model_number: 'SK-NBR',
    specifications: new Map([
      ['材质', 'NBR（丁腈橡胶）'],
      ['温度范围', '-20°C至+80°C'],
      ['包含', 'O型圈、密封圈、防尘圈']
    ]),
    compatibility_rules: {
      body_sizes: ['SF10', 'SF12', 'SF14', 'SF16'],
      action_types: ['DA', 'SR']
    },
    stock_info: {
      quantity: 60,
      available: true,
      lead_time: '7天'
    }
  }
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Accessory.deleteMany({});

    console.log('✅ Existing data cleared');

    console.log('👥 Creating users...');
    const createdUsers = await User.create(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    console.log('📦 Creating products...');
    const createdProducts = await Product.create(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    console.log('🔧 Creating accessories...');
    const createdAccessories = await Accessory.create(accessories);
    console.log(`✅ Created ${createdAccessories.length} accessories`);

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║     Database seeded successfully! 🎉          ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    console.log('📋 Sample Login Credentials:');
    console.log('┌────────────────────────────────────────────────┐');
    console.log('│ Administrator:                                 │');
    console.log('│   Username: admin                              │');
    console.log('│   Password: admin123                           │');
    console.log('├────────────────────────────────────────────────┤');
    console.log('│ Technical Engineer:                            │');
    console.log('│   Username: tech_engineer                      │');
    console.log('│   Password: tech123                            │');
    console.log('├────────────────────────────────────────────────┤');
    console.log('│ Sales Manager:                                 │');
    console.log('│   Username: sales_manager                      │');
    console.log('│   Password: manager123                         │');
    console.log('├────────────────────────────────────────────────┤');
    console.log('│ Sales Engineer:                                │');
    console.log('│   Username: sales_engineer                     │');
    console.log('│   Password: sales123                           │');
    console.log('└────────────────────────────────────────────────┘\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();


