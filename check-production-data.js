#!/usr/bin/env node

/**
 * 检查生产环境数据库状态
 * 在上传前查看生产环境的数据统计
 */

const { MongoClient } = require('mongodb');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// 需要检查的集合
const COLLECTIONS = [
  'users',
  'actuators',
  'manualoverrides',
  'accessories',
  'suppliers',
  'projects',
  'products',
  'contracts',
  'purchaseorders',
  'productionorders',
  'qualitychecks',
  'deliverynotes',
  'servicetickets',
  'quotes',
];

async function checkProductionData() {
  console.log('\n🔍 检查生产环境数据\n');
  
  const PRODUCTION_URI = await question('请输入生产环境MongoDB URI: ');
  
  if (!PRODUCTION_URI || PRODUCTION_URI.trim() === '') {
    console.log('❌ 错误: 未提供URI');
    rl.close();
    process.exit(1);
  }

  let client;

  try {
    console.log('\n📡 连接到生产环境...');
    client = await MongoClient.connect(PRODUCTION_URI, {
      serverSelectionTimeoutMS: 10000
    });
    
    const db = client.db();
    console.log('✅ 连接成功\n');

    // 获取数据库名称
    const admin = db.admin();
    const dbInfo = await admin.listDatabases();
    console.log(`📊 数据库: ${db.databaseName}\n`);

    // 显示所有集合的统计
    console.log('📋 数据统计：\n');
    console.log('集合名称                    | 文档数量');
    console.log('---------------------------|----------');

    let totalDocuments = 0;
    const stats = {};

    for (const collectionName of COLLECTIONS) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        stats[collectionName] = count;
        totalDocuments += count;
        
        const padding = ' '.repeat(27 - collectionName.length);
        console.log(`${collectionName}${padding}| ${count}`);
      } catch (error) {
        // 集合可能不存在
        const padding = ' '.repeat(27 - collectionName.length);
        console.log(`${collectionName}${padding}| N/A`);
      }
    }

    console.log('---------------------------|----------');
    console.log(`总计                        | ${totalDocuments}\n`);

    // 显示重要数据的详细信息
    console.log('\n🔍 核心数据详情：\n');

    // 执行器
    if (stats.actuators > 0) {
      const actuatorTypes = await db.collection('actuators').distinct('series');
      console.log(`✅ 执行器 (${stats.actuators}个):`);
      console.log(`   系列: ${actuatorTypes.join(', ')}`);
      
      const sampleActuator = await db.collection('actuators').findOne({});
      if (sampleActuator) {
        console.log(`   示例: ${sampleActuator.model || sampleActuator.series} - ${sampleActuator.valveType || 'N/A'}`);
      }
    } else {
      console.log(`⚠️  执行器: 无数据`);
    }

    // 用户
    if (stats.users > 0) {
      const userRoles = await db.collection('users').distinct('role');
      console.log(`\n✅ 用户 (${stats.users}个):`);
      console.log(`   角色: ${userRoles.join(', ')}`);
      
      const adminCount = await db.collection('users').countDocuments({ role: 'admin' });
      console.log(`   管理员: ${adminCount}个`);
    } else {
      console.log(`\n⚠️  用户: 无数据`);
    }

    // 项目
    if (stats.projects > 0) {
      const projectStatuses = await db.collection('projects').distinct('status');
      console.log(`\n✅ 项目 (${stats.projects}个):`);
      console.log(`   状态: ${projectStatuses.join(', ')}`);
    } else {
      console.log(`\n⚠️  项目: 无数据`);
    }

    // 供应商
    if (stats.suppliers > 0) {
      const supplierNames = await db.collection('suppliers').distinct('name');
      console.log(`\n✅ 供应商 (${stats.suppliers}个):`);
      console.log(`   ${supplierNames.slice(0, 5).join(', ')}${supplierNames.length > 5 ? '...' : ''}`);
    } else {
      console.log(`\n⚠️  供应商: 无数据`);
    }

    console.log('\n');
    console.log('================================');
    console.log('💡 分析建议：');
    console.log('================================\n');

    if (stats.actuators === 0) {
      console.log('⚠️  执行器数据为空 - 建议上传执行器数据');
    } else if (stats.actuators < 100) {
      console.log('💡 执行器数据较少 - 可以考虑补充更多执行器型号');
    } else {
      console.log('✅ 执行器数据充足');
    }

    if (stats.users === 0) {
      console.log('⚠️  用户数据为空 - 需要创建管理员账号');
    } else {
      console.log('✅ 已有用户数据');
    }

    if (stats.projects > 0) {
      console.log('⚠️  生产环境已有项目数据 - 上传时建议不要覆盖项目数据');
    }

    if (stats.suppliers === 0) {
      console.log('💡 建议上传供应商数据');
    }

    console.log('\n✅ 检查完成！\n');

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.error('\n💡 提示: 请检查网络连接和MongoDB URI是否正确');
    } else if (error.message.includes('Authentication failed')) {
      console.error('\n💡 提示: 请检查MongoDB用户名和密码是否正确');
    }
  } finally {
    if (client) await client.close();
    rl.close();
  }
}

checkProductionData().catch(console.error);

