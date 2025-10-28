/**
 * 供应商批量导入脚本
 * 从CSV文件批量导入供应商数据
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const Supplier = require('./models/Supplier');

// 数据库连接
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/valve_selection', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 已连接');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    process.exit(1);
  }
}

// 验证供应商数据
function validateSupplier(data) {
  const errors = [];
  
  // 必填字段验证
  if (!data.name || data.name.trim() === '') {
    errors.push('供应商名称为必填项');
  }
  
  // 评级验证
  if (data.rating) {
    const rating = parseInt(data.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      errors.push('评级必须是1-5之间的整数');
    }
  }
  
  // 状态验证
  if (data.status && !['active', 'inactive', 'blacklisted'].includes(data.status)) {
    errors.push('状态必须是 active, inactive 或 blacklisted');
  }
  
  // 邮箱格式验证（简单验证）
  if (data.email && data.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('邮箱格式不正确');
    }
  }
  
  return errors;
}

// 处理CSV数据
function processSupplierData(row) {
  return {
    name: row.name ? row.name.trim() : '',
    contact_person: row.contact_person ? row.contact_person.trim() : '',
    phone: row.phone ? row.phone.trim() : '',
    email: row.email ? row.email.trim().toLowerCase() : '',
    address: row.address ? row.address.trim() : '',
    business_scope: row.business_scope ? row.business_scope.trim() : '',
    rating: row.rating ? parseInt(row.rating) : 3,
    status: row.status ? row.status.trim() : 'active',
    notes: row.notes ? row.notes.trim() : ''
  };
}

// 导入供应商数据
async function importSuppliers(csvFilePath, options = {}) {
  const {
    skipDuplicates = true,
    updateExisting = false,
    clearExisting = false
  } = options;

  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║         供应商数据批量导入工具               ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  try {
    await connectDB();

    // 是否清除现有数据
    if (clearExisting) {
      console.log('🗑️  清除现有供应商数据...');
      const deleteResult = await Supplier.deleteMany({});
      console.log(`  ✅ 删除了 ${deleteResult.deletedCount} 条记录\n`);
    }

    // 检查文件是否存在
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV 文件不存在: ${csvFilePath}`);
    }

    console.log(`📄 读取文件: ${csvFilePath}\n`);

    const suppliers = [];
    const errors = [];
    let lineNumber = 1; // CSV标题行

    // 读取CSV文件
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          lineNumber++;
          const supplierData = processSupplierData(row);
          const validationErrors = validateSupplier(supplierData);
          
          if (validationErrors.length > 0) {
            errors.push({
              line: lineNumber,
              name: supplierData.name,
              errors: validationErrors
            });
          } else {
            suppliers.push(supplierData);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📊 读取完成: 共 ${suppliers.length} 条有效数据\n`);

    // 显示验证错误
    if (errors.length > 0) {
      console.log('⚠️  发现以下验证错误:\n');
      errors.forEach(error => {
        console.log(`  行 ${error.line} (${error.name}):`);
        error.errors.forEach(err => console.log(`    ❌ ${err}`));
        console.log('');
      });
      console.log(`共 ${errors.length} 条数据有错误，将被跳过\n`);
    }

    if (suppliers.length === 0) {
      console.log('❌ 没有有效的数据可以导入');
      return;
    }

    // 导入数据
    console.log('💾 开始导入数据...\n');
    let successCount = 0;
    let skipCount = 0;
    let updateCount = 0;
    let failCount = 0;

    for (const supplierData of suppliers) {
      try {
        // 检查是否存在同名供应商
        const existing = await Supplier.findOne({ name: supplierData.name });
        
        if (existing) {
          if (updateExisting) {
            await Supplier.findByIdAndUpdate(existing._id, supplierData);
            updateCount++;
            console.log(`  ✏️  更新: ${supplierData.name}`);
          } else if (skipDuplicates) {
            skipCount++;
            console.log(`  ⏭️  跳过: ${supplierData.name} (已存在)`);
          }
        } else {
          await Supplier.create(supplierData);
          successCount++;
          console.log(`  ✅ 新增: ${supplierData.name}`);
        }
      } catch (error) {
        failCount++;
        console.log(`  ❌ 失败: ${supplierData.name} - ${error.message}`);
      }
    }

    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║              导入结果统计                    ║');
    console.log('╠═══════════════════════════════════════════════╣');
    console.log(`║  总读取数据: ${String(suppliers.length).padEnd(31)}║`);
    console.log(`║  成功新增: ${String(successCount).padEnd(33)}║`);
    if (updateCount > 0) {
      console.log(`║  成功更新: ${String(updateCount).padEnd(33)}║`);
    }
    if (skipCount > 0) {
      console.log(`║  跳过重复: ${String(skipCount).padEnd(33)}║`);
    }
    if (failCount > 0) {
      console.log(`║  导入失败: ${String(failCount).padEnd(33)}║`);
    }
    if (errors.length > 0) {
      console.log(`║  验证错误: ${String(errors.length).padEnd(33)}║`);
    }
    console.log('╚═══════════════════════════════════════════════╝\n');

    // 显示数据库统计
    const totalCount = await Supplier.countDocuments();
    const activeCount = await Supplier.countDocuments({ status: 'active' });
    const inactiveCount = await Supplier.countDocuments({ status: 'inactive' });

    console.log('📊 数据库统计:');
    console.log(`  总供应商数: ${totalCount}`);
    console.log(`  活跃供应商: ${activeCount}`);
    console.log(`  停用供应商: ${inactiveCount}\n`);

    console.log('✅ 导入完成！\n');

  } catch (error) {
    console.error('\n❌ 导入失败:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 数据库连接已关闭\n');
  }
}

// 解析命令行参数
const args = process.argv.slice(2);
const csvFilePath = args[0] || path.join(__dirname, 'templates', 'suppliers_import_template.csv');

const options = {
  skipDuplicates: !args.includes('--no-skip'),
  updateExisting: args.includes('--update'),
  clearExisting: args.includes('--clear')
};

// 显示帮助信息
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
供应商批量导入工具

用法:
  node import_suppliers.js [CSV文件路径] [选项]

选项:
  --update       更新已存在的供应商（默认跳过）
  --clear        导入前清空所有供应商数据
  --no-skip      不跳过重复数据（会报错）
  --help, -h     显示帮助信息

示例:
  node import_suppliers.js                                    # 使用默认模板
  node import_suppliers.js data/suppliers.csv                 # 指定文件
  node import_suppliers.js data/suppliers.csv --update        # 更新已存在数据
  node import_suppliers.js data/suppliers.csv --clear         # 清空后导入
  `);
  process.exit(0);
}

// 执行导入
importSuppliers(csvFilePath, options);


