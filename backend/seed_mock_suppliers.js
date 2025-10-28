require('dotenv').config();
const mongoose = require('mongoose');
const Supplier = require('./models/Supplier');

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cmax-actuator');
    console.log('✅ MongoDB连接成功');
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message);
    process.exit(1);
  }
};

// 模拟供应商数据
const mockSuppliers = [
  {
    name: '上海阀门配件一厂',
    contact_person: '张三',
    phone: '021-12345678',
    email: 'zhangsan@shvalve.com',
    address: '上海市浦东新区张江高科技园区',
    business_scope: '阀门配件、执行器配件、密封件',
    rating: 5,
    notes: '长期合作伙伴，产品质量优秀，交货及时',
    status: 'active'
  },
  {
    name: '北京工业自动化设备公司',
    contact_person: '李四',
    phone: '010-87654321',
    email: 'lisi@bjautomation.com',
    address: '北京市海淀区中关村科技园',
    business_scope: '执行器、控制阀、自动化配件',
    rating: 4,
    notes: '技术实力强，适合高端项目，价格偏高',
    status: 'active'
  },
  {
    name: '广州南方气动元件厂',
    contact_person: '王五',
    phone: '020-98765432',
    email: 'wangwu@gzpneumatic.com',
    address: '广州市天河区科学城',
    business_scope: '气动执行器、电磁阀、气缸',
    rating: 4,
    notes: '专注气动领域，产品丰富，性价比高',
    status: 'active'
  },
  {
    name: '天津渤海机械配件有限公司',
    contact_person: '赵六',
    phone: '022-11223344',
    email: 'zhaoliu@tjbohai.com',
    address: '天津市滨海新区经济开发区',
    business_scope: '机械配件、标准件、紧固件',
    rating: 3,
    notes: '价格实惠，交货快，适合批量采购标准件',
    status: 'active'
  }
];

// 执行数据插入
const seedSuppliers = async () => {
  try {
    // 清空现有供应商数据
    console.log('🗑️  清空现有供应商数据...');
    await Supplier.deleteMany({});
    console.log('✅ 现有数据已清空');

    // 插入模拟数据
    console.log('📝 插入模拟供应商数据...');
    const result = await Supplier.insertMany(mockSuppliers);
    
    console.log('✅ 成功插入 ' + result.length + ' 条供应商数据:');
    console.log('');
    
    result.forEach((supplier, index) => {
      console.log(`${index + 1}. ${supplier.name}`);
      console.log(`   联系人: ${supplier.contact_person}`);
      console.log(`   电话: ${supplier.phone}`);
      console.log(`   评级: ${'⭐'.repeat(supplier.rating)}`);
      console.log(`   状态: ${supplier.status}`);
      console.log('');
    });

    console.log('🎉 供应商数据导入完成！');
    
  } catch (error) {
    console.error('❌ 导入失败:', error.message);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   供应商模拟数据导入脚本                   ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');

    await connectDB();
    await seedSuppliers();

    console.log('✅ 所有操作完成！');
    console.log('');
    
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('👋 数据库连接已关闭');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  }
};

// 运行脚本
main();

