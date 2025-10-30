const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Actuator = require('./models/Actuator');

// MongoDB连接
const MONGO_URI = 'mongodb://localhost:27017/cmax';

// 综合执行器数据导入脚本
async function importAllActuators() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB连接成功\n');

    // 清空现有的所有执行器数据
    const deleteResult = await Actuator.deleteMany({});
    console.log(`🗑️  删除了 ${deleteResult.deletedCount} 条现有执行器数据\n`);

    let allActuators = [];
    
    // ========== 1. 导入 AT/GY 系列（齿轮齿条执行机构） ==========
    console.log('📥 开始导入 AT/GY 系列（齿轮齿条执行机构）...');
    await new Promise((resolve, reject) => {
      const atGyActuators = [];
      fs.createReadStream('./data_imports/at_gy_actuators_data_final.csv')
        .pipe(csv())
        .on('data', (row) => {
          try {
            const basePrice = row.unit_price_10_plus ? parseFloat(row.unit_price_10_plus) : 1000;
            
            const actuator = {
              model_base: row.model_base,
              series: row.series,
              mechanism: '齿轮齿条', // AT/GY都是齿轮齿条
              body_size: row.body_size,
              action_type: row.action_type,
              spring_range: row.spring_range || '',
              output_torque: row.output_torque ? parseFloat(row.output_torque) : 100,
              rotation_angle: row.rotation_angle ? parseFloat(row.rotation_angle) : 90,
              operating_pressure: row.operating_pressure ? parseFloat(row.operating_pressure) : 6,
              weight: row.weight ? parseFloat(row.weight) : 5,
              base_price_normal: basePrice,
              price_tiers: [
                { min_quantity: 1, max_quantity: 9, unit_price: basePrice },
                { min_quantity: 10, max_quantity: 49, unit_price: basePrice * 0.95 },
                { min_quantity: 50, max_quantity: 99, unit_price: basePrice * 0.90 },
                { min_quantity: 100, max_quantity: null, unit_price: basePrice * 0.85 }
              ],
              inventory_quantity: Math.floor(Math.random() * 100),
              status: '已发布', // 可售卖状态
              description: `${row.series}系列 齿轮齿条执行机构 - ${row.action_type}`,
              notes: row.notes || ''
            };
            
            atGyActuators.push(actuator);
          } catch (error) {
            console.error(`❌ 处理AT/GY数据失败: ${row.model_base}`, error.message);
          }
        })
        .on('end', () => {
          allActuators = allActuators.concat(atGyActuators);
          console.log(`   ✅ AT/GY系列数据准备完成: ${atGyActuators.length} 条`);
          resolve();
        })
        .on('error', reject);
    });

    // ========== 2. 导入 SF 系列（拨叉式执行机构） ==========
    console.log('\n📥 开始导入 SF 系列（拨叉式执行机构）...');
    await new Promise((resolve, reject) => {
      const sfActuators = [];
      fs.createReadStream('./data_imports/sf_actuators_data.csv')
        .pipe(csv())
        .on('data', (row) => {
          try {
            // 解析扭矩数据
            let torqueSymmetric = {};
            try {
              torqueSymmetric = row.torque_symmetric ? JSON.parse(row.torque_symmetric) : {};
            } catch (e) {}

            // 计算最大扭矩
            const torqueValues = Object.values(torqueSymmetric).filter(v => !isNaN(v));
            const maxTorque = torqueValues.length > 0 ? Math.max(...torqueValues) : 100;
            const basePrice = row.base_price ? parseFloat(row.base_price) : 1000;

            const modelBase = row.model_base || '';
            const actionType = row.action_type || 'DA';
            const springRange = row.spring_range || '';

            // 🔹 为每个SF型号创建两个版本：球阀（不带C）和 蝶阀（带C）
            
            // 1️⃣ 球阀版本（不带C） - 原始型号
            const ballValveActuator = {
              model_base: modelBase,
              series: 'SF',
              mechanism: '拨叉式',
              valve_type: '球阀',
              body_size: row.body_size,
              action_type: actionType,
              spring_range: springRange,
              output_torque: maxTorque,
              rotation_angle: 90,
              operating_pressure: 6,
              weight: 5,
              base_price_normal: basePrice,
              price_tiers: [
                { min_quantity: 1, max_quantity: 9, unit_price: basePrice },
                { min_quantity: 10, max_quantity: 49, unit_price: basePrice * 0.95 },
                { min_quantity: 50, max_quantity: 99, unit_price: basePrice * 0.90 },
                { min_quantity: 100, max_quantity: null, unit_price: basePrice * 0.85 }
              ],
              inventory_quantity: Math.floor(Math.random() * 100),
              status: '已发布',
              description: `SF系列 拨叉式执行机构 - 球阀 - ${actionType}`,
              notes: JSON.stringify({
                dimensions: {
                  L1: row.L1, L2: row.L2, m1: row.m1, m2: row.m2,
                  A: row.A, H1: row.H1, H2: row.H2, D: row.D, G: row.G
                },
                connect_flange: row.connect_flange,
                torque_data: torqueSymmetric,
                valve_type: '球阀'
              })
            };
            
            // 2️⃣ 蝶阀版本（带C） - 格式：SF10/C-150DA
            // 在SF和本体尺寸之间插入/C
            // SF10-150DA -> SF10/C-150DA
            // SF10-150SR4 -> SF10/C-150SR4
            let butterflyModelBase = modelBase;
            if (modelBase.startsWith('SF')) {
              // 找到body_size的位置（SF后面的数字）
              const match = modelBase.match(/^(SF\d+)-(.+)$/);
              if (match) {
                const bodyPart = match[1];  // SF10
                const restPart = match[2];  // 150DA 或 150SR4
                butterflyModelBase = `${bodyPart}/C-${restPart}`;
              }
            }
            
            const butterflyValveActuator = {
              model_base: butterflyModelBase,
              series: 'SF',
              mechanism: '拨叉式',
              valve_type: '蝶阀',
              body_size: row.body_size,
              action_type: actionType,
              spring_range: springRange,
              output_torque: maxTorque,
              rotation_angle: 90,
              operating_pressure: 6,
              weight: 5,
              base_price_normal: basePrice * 1.1, // 蝶阀版本价格稍高10%
              price_tiers: [
                { min_quantity: 1, max_quantity: 9, unit_price: basePrice * 1.1 },
                { min_quantity: 10, max_quantity: 49, unit_price: basePrice * 1.1 * 0.95 },
                { min_quantity: 50, max_quantity: 99, unit_price: basePrice * 1.1 * 0.90 },
                { min_quantity: 100, max_quantity: null, unit_price: basePrice * 1.1 * 0.85 }
              ],
              inventory_quantity: Math.floor(Math.random() * 100),
              status: '已发布',
              description: `SF系列 拨叉式执行机构 - 蝶阀（带C） - ${actionType}`,
              notes: JSON.stringify({
                dimensions: {
                  L1: row.L1, L2: row.L2, m1: row.m1, m2: row.m2,
                  A: row.A, H1: row.H1, H2: row.H2, D: row.D, G: row.G
                },
                connect_flange: row.connect_flange,
                torque_data: torqueSymmetric,
                valve_type: '蝶阀'
              })
            };
            
            sfActuators.push(ballValveActuator);
            sfActuators.push(butterflyValveActuator);
            
          } catch (error) {
            console.error(`❌ 处理SF数据失败: ${row.model_base}`, error.message);
          }
        })
        .on('end', () => {
          allActuators = allActuators.concat(sfActuators);
          console.log(`   ✅ SF系列数据准备完成: ${sfActuators.length} 条`);
          
          // 统计SF系列中的球阀和蝶阀数量
          const ballValves = sfActuators.filter(a => a.valve_type === '球阀').length;
          const butterflyValves = sfActuators.filter(a => a.valve_type === '蝶阀').length;
          console.log(`      - 球阀（不带C）: ${ballValves} 条`);
          console.log(`      - 蝶阀（带C）: ${butterflyValves} 条`);
          
          resolve();
        })
        .on('error', reject);
    });

    // ========== 3. 批量插入所有数据 ==========
    console.log(`\n📊 准备导入总计 ${allActuators.length} 条执行器数据...`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const actuator of allActuators) {
      try {
        await Actuator.create(actuator);
        successCount++;
        if (successCount % 50 === 0) {
          console.log(`   已导入 ${successCount} 条...`);
        }
      } catch (error) {
        failCount++;
        console.error(`❌ 导入失败 [${actuator.model_base}]:`, error.message);
      }
    }
    
    console.log(`\n✅ 成功导入 ${successCount} 条执行器数据`);
    if (failCount > 0) {
      console.log(`⚠️  失败 ${failCount} 条`);
    }

    // ========== 4. 显示最终统计信息 ==========
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║          数据库最终统计报告                            ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    const totalCount = await Actuator.countDocuments();
    const seriesStats = await Actuator.aggregate([
      { $group: { _id: '$series', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const mechanismStats = await Actuator.aggregate([
      { $group: { _id: '$mechanism', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const valveTypeStats = await Actuator.aggregate([
      { $group: { _id: '$valve_type', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('📊 按系列统计:');
    seriesStats.forEach(s => console.log(`   - ${s._id} 系列: ${s.count} 条`));
    
    console.log('\n🔧 按机构类型统计:');
    mechanismStats.forEach(m => console.log(`   - ${m._id || '未设置'}: ${m.count} 条`));
    
    console.log('\n🚰 按阀门类型统计:');
    valveTypeStats.forEach(v => console.log(`   - ${v._id || '未设置'}: ${v.count} 条`));
    
    console.log(`\n📈 执行器总数: ${totalCount} 条\n`);

    mongoose.connection.close();
    console.log('✅ 所有数据导入完成！\n');

  } catch (error) {
    console.error('❌ 导入失败:', error);
    process.exit(1);
  }
}

// 执行导入
importAllActuators();

