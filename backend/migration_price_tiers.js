/**
 * 一次性数据迁移脚本：为现有数据添加 pricing_model 字段
 * 
 * 用途：为所有执行器和配件添加 pricing_model 字段，标记为固定价格模式
 *       保留原有的 base_price 字段
 * 执行：node migration_price_tiers.js
 * 
 * @author C-MAX 技术团队
 * @date 2025-10-28
 * @version 2.0.0
 */

const mongoose = require('mongoose');
require('dotenv').config();

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n`)
};

// 统计计数器
const stats = {
  actuators: {
    total: 0,           // 总执行器文档数
    migrated: 0,        // 成功迁移数
    skipped: 0,         // 跳过数（已有 pricing_model）
    failed: 0,          // 失败数
    noPrice: 0          // 无价格字段数
  },
  accessories: {
    total: 0,           // 总配件文档数
    migrated: 0,        // 成功迁移数
    skipped: 0,         // 跳过数（已有 pricing_model）
    failed: 0,          // 失败数
    noPrice: 0          // 无价格字段数
  }
};

/**
 * 连接数据库
 */
async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cmax-selection';
    
    log.info(`正在连接数据库: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    log.success('数据库连接成功！');
    return true;
  } catch (error) {
    log.error(`数据库连接失败: ${error.message}`);
    return false;
  }
}

/**
 * 提取价格值（支持多种可能的字段名）
 */
function extractOldPrice(doc) {
  // 尝试从不同的字段读取价格
  if (doc.base_price !== undefined && doc.base_price !== null) {
    return doc.base_price;
  }
  
  if (doc.pricing?.base_price_normal !== undefined && doc.pricing?.base_price_normal !== null) {
    return doc.pricing.base_price_normal;
  }
  
  if (doc.pricing?.base_price !== undefined && doc.pricing?.base_price !== null) {
    return doc.pricing.base_price;
  }
  
  if (doc.price !== undefined && doc.price !== null) {
    return doc.price;
  }
  
  return null;
}

/**
 * 提取手动操作装置信息
 */
function extractManualOverride(doc) {
  if (doc.pricing?.manual_override_model || doc.pricing?.manual_override_price) {
    return {
      model: doc.pricing.manual_override_model || null,
      price: doc.pricing.manual_override_price || null
    };
  }
  
  if (doc.manual_override_model || doc.manual_override_price) {
    return {
      model: doc.manual_override_model || null,
      price: doc.manual_override_price || null
    };
  }
  
  return null;
}

/**
 * 提取配件价格信息
 */
function extractAccessoriesPricing(doc) {
  if (doc.pricing?.seal_kit_price) {
    return {
      seal_kit_price: doc.pricing.seal_kit_price
    };
  }
  
  if (doc.seal_kit_price) {
    return {
      seal_kit_price: doc.seal_kit_price
    };
  }
  
  return null;
}

/**
 * 确定定价模式
 * 如果只有单一价格，使用固定价格模式
 * 如果有多个价格档位，使用阶梯价格模式
 */
function determinePricingModel(doc) {
  // 检查是否已有 price_tiers 且包含多个档位
  if (doc.price_tiers && Array.isArray(doc.price_tiers) && doc.price_tiers.length > 0) {
    // 如果已经有多个价格档位，说明是阶梯定价
    return 'tiered';
  }
  
  // 检查是否有多个价格字段（low/high），暗示可能需要阶梯定价
  if (doc.pricing?.base_price_low || doc.pricing?.base_price_high) {
    return 'tiered';
  }
  
  // 默认为固定价格模式
  return 'fixed';
}

/**
 * 迁移单个文档 - 添加 pricing_model 字段
 */
async function migrateDocument(doc, collection, collectionType) {
  try {
    const modelName = doc.model_base || doc.model || doc.name || doc._id;
    const currentStats = stats[collectionType];
    
    // 检查是否已有 pricing_model 字段
    if (doc.pricing_model) {
      log.warning(`跳过 ${modelName}: 已存在 pricing_model (${doc.pricing_model})`);
      currentStats.skipped++;
      return { success: true, skipped: true };
    }
    
    // 提取价格（base_price 或 price）
    const basePrice = extractOldPrice(doc);
    
    if (!basePrice) {
      log.warning(`跳过 ${modelName}: 未找到价格字段`);
      currentStats.noPrice++;
      return { success: true, noPrice: true };
    }
    
    // 确定定价模式
    const pricingModel = determinePricingModel(doc);
    
    // 构建更新数据
    const updateData = {
      pricing_model: pricingModel
    };
    
    // 如果是固定价格模式，确保有 base_price
    if (pricingModel === 'fixed') {
      // 如果还没有 base_price，设置它
      if (!doc.base_price) {
        updateData.base_price = basePrice;
      }
      
      // 对于配件，同步 price 和 base_price
      if (collectionType === 'accessories' && doc.price && !doc.base_price) {
        updateData.base_price = doc.price;
      }
    }
    
    // 执行更新
    await collection.updateOne(
      { _id: doc._id },
      { $set: updateData }
    );
    
    log.success(`迁移成功: ${modelName} (模式: ${pricingModel}, 基础价: ¥${basePrice})`);
    currentStats.migrated++;
    
    return { success: true, migrated: true, pricingModel };
    
  } catch (error) {
    log.error(`迁移失败 ${doc.model_base || doc.name || doc._id}: ${error.message}`);
    stats[collectionType].failed++;
    return { success: false, error: error.message };
  }
}

/**
 * 迁移单个集合
 */
async function migrateCollection(collectionName, collectionType) {
  try {
    log.title(`📦 迁移 ${collectionName} 集合`);
    
    const db = mongoose.connection.db;
    const collection = db.collection(collectionName);
    
    // 查询所有文档
    log.info(`正在读取所有 ${collectionName} 文档...`);
    const documents = await collection.find({}).toArray();
    stats[collectionType].total = documents.length;
    
    log.info(`找到 ${stats[collectionType].total} 个 ${collectionName} 文档`);
    
    if (stats[collectionType].total === 0) {
      log.warning(`${collectionName} 集合为空，跳过`);
      return;
    }
    
    // 开始迁移
    log.info(`开始迁移 ${collectionName}...\n`);
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const progress = `[${i + 1}/${stats[collectionType].total}]`;
      
      process.stdout.write(`${colors.cyan}${progress}${colors.reset} 处理中... `);
      await migrateDocument(doc, collection, collectionType);
    }
    
    console.log('');
    log.success(`${collectionName} 集合迁移完成`);
    
  } catch (error) {
    log.error(`迁移 ${collectionName} 集合时出错: ${error.message}`);
    throw error;
  }
}

/**
 * 执行迁移
 */
async function runMigration() {
  try {
    log.title('🚀 开始执行定价模式字段迁移');
    
    // 确认是否继续
    log.info('迁移内容：');
    log.info('  ✓ 为所有执行器添加 pricing_model 字段（默认: fixed）');
    log.info('  ✓ 为所有配件添加 pricing_model 字段（默认: fixed）');
    log.info('  ✓ 保留原有的 base_price/price 字段');
    log.info('  ✓ 如果文档已有 price_tiers，设置为 tiered 模式');
    console.log('');
    
    // 迁移执行器集合
    await migrateCollection('actuators', 'actuators');
    
    // 迁移配件集合
    await migrateCollection('accessories', 'accessories');
    
    // 显示统计结果
    log.title('📊 迁移完成统计');
    
    // 执行器统计
    console.log('\n【执行器 Actuators】');
    console.log('┌─────────────────────────────────────┐');
    console.log(`│ 总文档数:        ${String(stats.actuators.total).padStart(6)} 个      │`);
    console.log(`│ ${colors.green}✓${colors.reset} 成功迁移:      ${String(stats.actuators.migrated).padStart(6)} 个      │`);
    console.log(`│ ${colors.yellow}⊘${colors.reset} 已有定价模式:  ${String(stats.actuators.skipped).padStart(6)} 个      │`);
    console.log(`│ ${colors.yellow}?${colors.reset} 无价格字段:    ${String(stats.actuators.noPrice).padStart(6)} 个      │`);
    console.log(`│ ${colors.red}✗${colors.reset} 失败:          ${String(stats.actuators.failed).padStart(6)} 个      │`);
    console.log('└─────────────────────────────────────┘');
    
    // 配件统计
    console.log('\n【配件 Accessories】');
    console.log('┌─────────────────────────────────────┐');
    console.log(`│ 总文档数:        ${String(stats.accessories.total).padStart(6)} 个      │`);
    console.log(`│ ${colors.green}✓${colors.reset} 成功迁移:      ${String(stats.accessories.migrated).padStart(6)} 个      │`);
    console.log(`│ ${colors.yellow}⊘${colors.reset} 已有定价模式:  ${String(stats.accessories.skipped).padStart(6)} 个      │`);
    console.log(`│ ${colors.yellow}?${colors.reset} 无价格字段:    ${String(stats.accessories.noPrice).padStart(6)} 个      │`);
    console.log(`│ ${colors.red}✗${colors.reset} 失败:          ${String(stats.accessories.failed).padStart(6)} 个      │`);
    console.log('└─────────────────────────────────────┘');
    
    // 总体成功率
    const totalMigrated = stats.actuators.migrated + stats.accessories.migrated;
    const totalDocs = stats.actuators.total + stats.accessories.total;
    const successRate = totalDocs > 0 
      ? ((totalMigrated / totalDocs) * 100).toFixed(1) 
      : 0;
    
    console.log('');
    if (totalMigrated > 0) {
      log.success(`总体迁移成功率: ${successRate}% ✨`);
    } else {
      log.info('没有执行任何迁移（所有文档已迁移或无价格数据）');
    }
    
    // 验证结果
    log.title('🔍 验证迁移结果...');
    
    const db = mongoose.connection.db;
    
    // 验证执行器
    const actuatorsWithFixed = await db.collection('actuators').countDocuments({
      pricing_model: 'fixed'
    });
    const actuatorsWithTiered = await db.collection('actuators').countDocuments({
      pricing_model: 'tiered'
    });
    
    log.info(`执行器 - 固定价格模式: ${actuatorsWithFixed} 个`);
    log.info(`执行器 - 阶梯价格模式: ${actuatorsWithTiered} 个`);
    
    // 验证配件
    const accessoriesWithFixed = await db.collection('accessories').countDocuments({
      pricing_model: 'fixed'
    });
    const accessoriesWithTiered = await db.collection('accessories').countDocuments({
      pricing_model: 'tiered'
    });
    
    log.info(`配件 - 固定价格模式: ${accessoriesWithFixed} 个`);
    log.info(`配件 - 阶梯价格模式: ${accessoriesWithTiered} 个`);
    
    // 显示示例
    if (totalMigrated > 0) {
      log.title('📋 迁移示例');
      
      const actuatorSample = await db.collection('actuators').findOne({
        pricing_model: { $exists: true }
      });
      
      if (actuatorSample) {
        console.log('\n【执行器示例】');
        console.log('型号:', actuatorSample.model_base || actuatorSample.model);
        console.log('定价模式:', actuatorSample.pricing_model);
        console.log('基础价格:', actuatorSample.base_price);
        if (actuatorSample.price_tiers && actuatorSample.price_tiers.length > 0) {
          console.log('价格档位数:', actuatorSample.price_tiers.length);
        }
      }
      
      const accessorySample = await db.collection('accessories').findOne({
        pricing_model: { $exists: true }
      });
      
      if (accessorySample) {
        console.log('\n【配件示例】');
        console.log('名称:', accessorySample.name);
        console.log('定价模式:', accessorySample.pricing_model);
        console.log('基础价格:', accessorySample.base_price || accessorySample.price);
        if (accessorySample.price_tiers && accessorySample.price_tiers.length > 0) {
          console.log('价格档位数:', accessorySample.price_tiers.length);
        }
      }
    }
    
  } catch (error) {
    log.error(`迁移过程出错: ${error.message}`);
    console.error(error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('');
    log.title('═══════════════════════════════════════════════');
    log.title('  定价模式字段迁移脚本 v2.0.0');
    log.title('  Pricing Model Migration Script');
    log.title('═══════════════════════════════════════════════');
    
    // 连接数据库
    const connected = await connectDatabase();
    if (!connected) {
      process.exit(1);
    }
    
    // 执行迁移
    await runMigration();
    
    // 关闭连接
    log.info('\n正在关闭数据库连接...');
    await mongoose.connection.close();
    
    log.success('数据库连接已关闭');
    log.title('\n✨ 迁移脚本执行完成！\n');
    
    process.exit(0);
    
  } catch (error) {
    log.error(`\n脚本执行失败: ${error.message}`);
    console.error(error);
    
    // 尝试关闭数据库连接
    try {
      await mongoose.connection.close();
    } catch (e) {
      // 忽略关闭错误
    }
    
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('unhandledRejection', (error) => {
  log.error('未处理的 Promise 拒绝:');
  console.error(error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log.error('未捕获的异常:');
  console.error(error);
  process.exit(1);
});

// 执行主函数
main();

