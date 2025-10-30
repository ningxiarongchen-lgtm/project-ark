/**
 * 为现有执行器添加备件维修包数据
 * 运行方式: node add-spare-parts-data.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cmax', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`✅ MongoDB 连接成功: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error);
    process.exit(1);
  }
};

// 执行器模型
const actuatorSchema = new mongoose.Schema({}, { strict: false });
const Actuator = mongoose.model('Actuator', actuatorSchema);

// 备件数据配置
const sparePartsConfig = {
  // SF系列备件
  SF: {
    seal_kit_price: 2500,
    other_parts: [
      {
        part_name: '轭架轴承',
        part_number: 'SF-BEAR-01',
        price: 800
      },
      {
        part_name: '活塞密封',
        part_number: 'SF-SEAL-01',
        price: 600
      },
      {
        part_name: '端盖密封',
        part_number: 'SF-CAP-01',
        price: 400
      }
    ]
  },
  
  // AT系列备件
  AT: {
    seal_kit_price: 2000,
    other_parts: [
      {
        part_name: '齿轮组件',
        part_number: 'AT-GEAR-01',
        price: 1200
      },
      {
        part_name: '轴承套件',
        part_number: 'AT-BEAR-01',
        price: 800
      },
      {
        part_name: '活塞密封圈',
        part_number: 'AT-SEAL-01',
        price: 600
      }
    ]
  },
  
  // GY系列备件
  GY: {
    seal_kit_price: 2200,
    other_parts: [
      {
        part_name: '齿轮组件',
        part_number: 'GY-GEAR-01',
        price: 1300
      },
      {
        part_name: '轴承套件',
        part_number: 'GY-BEAR-01',
        price: 900
      },
      {
        part_name: '活塞密封圈',
        part_number: 'GY-SEAL-01',
        price: 700
      }
    ]
  }
};

// 为单作用执行器添加弹簧组件
const addSpringParts = (spareParts, series, bodySize) => {
  const springPart = {
    part_name: '弹簧组件',
    part_number: `${series}-SPR-${bodySize}`,
    price: 1500
  };
  spareParts.other_parts.push(springPart);
  return spareParts;
};

// 主函数
const addSpareParts = async () => {
  console.log('\n========================================');
  console.log('为执行器添加备件维修包数据');
  console.log('========================================\n');
  
  try {
    await connectDB();
    
    // 获取所有执行器
    const actuators = await Actuator.find({});
    console.log(`📦 找到 ${actuators.length} 个执行器\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const actuator of actuators) {
      // 如果已有备件数据，跳过
      if (actuator.spare_parts && actuator.spare_parts.seal_kit_price) {
        console.log(`⏭️  跳过 ${actuator.model_base} - 已有备件数据`);
        skippedCount++;
        continue;
      }
      
      // 判断系列
      let series = null;
      if (actuator.model_base.startsWith('SF')) {
        series = 'SF';
      } else if (actuator.model_base.startsWith('AT')) {
        series = 'AT';
      } else if (actuator.model_base.startsWith('GY')) {
        series = 'GY';
      }
      
      if (!series) {
        console.log(`⚠️  跳过 ${actuator.model_base} - 未知系列`);
        skippedCount++;
        continue;
      }
      
      // 获取对应系列的备件配置
      let spareParts = JSON.parse(JSON.stringify(sparePartsConfig[series]));
      
      // 如果是单作用，添加弹簧组件
      if (actuator.action_type === 'SR') {
        spareParts = addSpringParts(spareParts, series, actuator.body_size);
      }
      
      // 更新执行器
      await Actuator.updateOne(
        { _id: actuator._id },
        { $set: { spare_parts: spareParts } }
      );
      
      console.log(`✅ 更新 ${actuator.model_base} - ${series}系列, ${actuator.action_type}型`);
      console.log(`   密封套件: ¥${spareParts.seal_kit_price}`);
      console.log(`   其他备件: ${spareParts.other_parts.length} 个`);
      updatedCount++;
    }
    
    console.log('\n========================================');
    console.log('✅ 备件数据添加完成！');
    console.log(`   更新: ${updatedCount} 个`);
    console.log(`   跳过: ${skippedCount} 个`);
    console.log('========================================\n');
    
  } catch (error) {
    console.error('❌ 添加备件数据失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
  }
};

// 运行脚本
addSpareParts();

