const mongoose = require('mongoose');
const Actuator = require('./models/Actuator');
const Accessory = require('./models/Accessory');
const ManualOverride = require('./models/ManualOverride');

// MongoDB 连接
const connectDB = async () => {
  try {
    const dbUri = 'mongodb://localhost:27017/cmax-actuators';
    await mongoose.connect(dbUri);
    console.log('✅ MongoDB 连接成功');
    console.log('📍 数据库:', mongoose.connection.name);
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error);
    process.exit(1);
  }
};

// 生成随机库存数量 (10-20)
const getRandomStock = () => {
  return Math.floor(Math.random() * 11) + 10;
};

// 更新所有产品的库存和状态
const updateAllProducts = async () => {
  try {
    console.log('\n🚀 开始更新所有产品的库存和状态...\n');

    // 1. 更新执行器 (Actuators)
    console.log('📦 更新执行器 (Actuators)...');
    const actuators = await Actuator.find({});
    let actuatorUpdated = 0;
    
    for (const actuator of actuators) {
      const randomStock = getRandomStock();
      
      // 确保stock_info对象存在
      if (!actuator.stock_info) {
        actuator.stock_info = {};
      }
      
      actuator.status = '已发布';
      actuator.stock_info.available = true;
      actuator.stock_info.quantity = randomStock;
      actuator.is_active = true;
      
      await actuator.save();
      actuatorUpdated++;
      
      if (actuatorUpdated % 50 === 0) {
        console.log(`   进度: ${actuatorUpdated}/${actuators.length}`);
      }
    }
    console.log(`   ✅ 已更新 ${actuatorUpdated} 个执行器`);

    // 2. 更新附件 (Accessories) - 只更新库存
    console.log('📦 更新附件 (Accessories)...');
    const accessories = await Accessory.find({});
    let accessoryUpdated = 0;
    
    for (const accessory of accessories) {
      const randomStock = getRandomStock();
      
      // 确保stock_info对象存在
      if (!accessory.stock_info) {
        accessory.stock_info = {};
      }
      
      accessory.stock_info.available = true;
      accessory.stock_info.quantity = randomStock;
      
      await accessory.save();
      accessoryUpdated++;
    }
    console.log(`   ✅ 已更新 ${accessoryUpdated} 个附件`);

    // 3. 更新手动添加产品 (Manual Overrides)
    console.log('📦 更新手动添加产品 (Manual Overrides)...');
    const manualOverrides = await ManualOverride.find({});
    let manualOverrideUpdated = 0;
    
    for (const override of manualOverrides) {
      const randomStock = getRandomStock();
      
      // 确保stock_info对象存在
      if (!override.stock_info) {
        override.stock_info = {};
      }
      
      override.status = '已发布';
      override.stock_info.available = true;
      override.stock_info.quantity = randomStock;
      override.is_active = true;
      
      await override.save();
      manualOverrideUpdated++;
    }
    console.log(`   ✅ 已更新 ${manualOverrideUpdated} 个手动添加产品`);

    // 验证更新结果
    console.log('\n🔍 验证更新结果...');
    
    const actuatorSample = await Actuator.findOne({});
    console.log('\n执行器样本:');
    console.log(`  型号: ${actuatorSample.model_base}`);
    console.log(`  状态: ${actuatorSample.status}`);
    console.log(`  库存: ${actuatorSample.stock_info?.quantity}`);
    console.log(`  可用: ${actuatorSample.stock_info?.available}`);
    
    const accessorySample = await Accessory.findOne({});
    if (accessorySample) {
      console.log('\n附件样本:');
      console.log(`  名称: ${accessorySample.name}`);
      console.log(`  库存: ${accessorySample.stock_info?.quantity}`);
      console.log(`  可用: ${accessorySample.stock_info?.available}`);
    }

    console.log('\n📊 更新统计:');
    console.log(`   - 执行器: ${actuatorUpdated}`);
    console.log(`   - 附件: ${accessoryUpdated}`);
    console.log(`   - 手动添加产品: ${manualOverrideUpdated}`);
    console.log(`   - 总计: ${actuatorUpdated + accessoryUpdated + manualOverrideUpdated}`);
    console.log('\n✅ 所有产品更新完成！');

  } catch (error) {
    console.error('\n❌ 更新失败:', error);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    await connectDB();
    await updateAllProducts();
    console.log('\n🎉 脚本执行成功！');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 脚本执行失败:', error);
    process.exit(1);
  }
};

// 运行脚本
main();

