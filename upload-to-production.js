#!/usr/bin/env node

/**
 * 将本地数据库数据上传到生产环境
 * 此脚本会安全地将数据追加到生产环境，不会删除现有数据
 */

const { MongoClient } = require('mongodb');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 询问问题的辅助函数
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// 本地数据库URI
const LOCAL_URI = 'mongodb://localhost:27017/cmax';

// 需要上传的集合列表（排除敏感数据）
const COLLECTIONS_TO_UPLOAD = [
  'actuators',           // 执行器数据（最重要）
  'manualoverrides',     // 手动覆盖规则
  'accessories',         // 配件数据
  'suppliers',           // 供应商数据
  // 'users',            // 用户数据（需要谨慎处理，避免冲突）
  // 'projects',         // 项目数据（生产环境可能已有）
  // 'refreshtokens',    // 不上传token
];

async function uploadData() {
  console.log('\n🚀 数据上传到生产环境\n');
  console.log('⚠️  重要提示：');
  console.log('   - 此操作会将本地数据追加到生产环境');
  console.log('   - 不会删除生产环境的现有数据');
  console.log('   - 建议先在生产环境备份数据\n');

  // 获取生产环境MongoDB URI
  const PRODUCTION_URI = await question('请输入生产环境MongoDB URI: ');
  
  if (!PRODUCTION_URI || PRODUCTION_URI.trim() === '') {
    console.log('❌ 错误: 未提供生产环境URI');
    rl.close();
    process.exit(1);
  }

  // 确认操作
  const confirm = await question('\n⚠️  确认要继续吗？ (输入 YES 继续): ');
  if (confirm !== 'YES') {
    console.log('❌ 操作已取消');
    rl.close();
    process.exit(0);
  }

  let localClient, prodClient;

  try {
    console.log('\n📡 连接到本地数据库...');
    localClient = await MongoClient.connect(LOCAL_URI);
    const localDb = localClient.db('cmax');
    console.log('✅ 本地数据库连接成功');

    console.log('\n📡 连接到生产环境数据库...');
    prodClient = await MongoClient.connect(PRODUCTION_URI);
    const prodDb = prodClient.db();
    console.log('✅ 生产环境数据库连接成功');

    // 显示统计信息
    console.log('\n📊 本地数据统计：');
    const localStats = {};
    for (const collectionName of COLLECTIONS_TO_UPLOAD) {
      const count = await localDb.collection(collectionName).countDocuments();
      localStats[collectionName] = count;
      console.log(`   - ${collectionName}: ${count} 个文档`);
    }

    console.log('\n📊 生产环境数据统计（上传前）：');
    const prodStatsBefore = {};
    for (const collectionName of COLLECTIONS_TO_UPLOAD) {
      const count = await prodDb.collection(collectionName).countDocuments();
      prodStatsBefore[collectionName] = count;
      console.log(`   - ${collectionName}: ${count} 个文档`);
    }

    // 最终确认
    const finalConfirm = await question('\n⚠️  确认开始上传数据？ (输入 UPLOAD 继续): ');
    if (finalConfirm !== 'UPLOAD') {
      console.log('❌ 上传已取消');
      rl.close();
      await localClient.close();
      await prodClient.close();
      process.exit(0);
    }

    console.log('\n🔄 开始上传数据...\n');

    // 上传每个集合
    for (const collectionName of COLLECTIONS_TO_UPLOAD) {
      console.log(`📤 上传 ${collectionName}...`);
      
      const localCollection = localDb.collection(collectionName);
      const prodCollection = prodDb.collection(collectionName);
      
      // 获取本地数据
      const documents = await localCollection.find({}).toArray();
      
      if (documents.length === 0) {
        console.log(`   ⏭️  跳过（没有数据）`);
        continue;
      }

      // 处理每个文档
      let inserted = 0;
      let updated = 0;
      let skipped = 0;

      for (const doc of documents) {
        try {
          // 检查是否已存在（基于_id）
          const existing = await prodCollection.findOne({ _id: doc._id });
          
          if (existing) {
            // 如果已存在，更新（可选）
            // await prodCollection.updateOne({ _id: doc._id }, { $set: doc });
            // updated++;
            skipped++;
          } else {
            // 如果不存在，插入
            await prodCollection.insertOne(doc);
            inserted++;
          }
        } catch (error) {
          console.error(`   ⚠️  处理文档失败: ${error.message}`);
          skipped++;
        }
      }

      console.log(`   ✅ 完成: ${inserted} 个新增, ${updated} 个更新, ${skipped} 个跳过`);
    }

    console.log('\n📊 生产环境数据统计（上传后）：');
    for (const collectionName of COLLECTIONS_TO_UPLOAD) {
      const count = await prodDb.collection(collectionName).countDocuments();
      const increase = count - prodStatsBefore[collectionName];
      console.log(`   - ${collectionName}: ${count} 个文档 (+${increase})`);
    }

    console.log('\n🎉 数据上传完成！\n');

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    if (localClient) await localClient.close();
    if (prodClient) await prodClient.close();
    rl.close();
  }
}

// 运行上传
uploadData().catch(console.error);

