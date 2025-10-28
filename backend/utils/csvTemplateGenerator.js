/**
 * CSV模板生成工具
 * 根据Mongoose模型自动生成CSV模板文件
 */

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs').promises;

/**
 * 根据Mongoose Schema生成CSV列定义
 * @param {mongoose.Schema} schema - Mongoose模型的Schema
 * @param {Object} customConfig - 自定义配置（字段映射、示例数据等）
 * @returns {Array} CSV列配置数组
 */
function generateCsvHeadersFromSchema(schema, customConfig = {}) {
  const headers = [];
  const paths = schema.paths;
  const excludeFields = customConfig.excludeFields || ['_id', '__v', 'password', 'createdAt', 'updatedAt', 'timestamps'];
  const fieldLabels = customConfig.fieldLabels || {};
  
  for (const [fieldName, pathConfig] of Object.entries(paths)) {
    // 跳过系统字段和排除字段
    if (excludeFields.includes(fieldName)) continue;
    
    // 跳过复杂嵌套对象（Map, Mixed）
    if (pathConfig.instance === 'Map' || pathConfig.instance === 'Mixed') continue;
    
    // 跳过嵌套数组对象（如 price_tiers）
    if (pathConfig.instance === 'Array' && pathConfig.schema) continue;
    
    const header = {
      id: fieldName,
      title: fieldLabels[fieldName] || fieldName.replace(/_/g, ' ').toUpperCase()
    };
    
    headers.push(header);
  }
  
  return headers;
}

/**
 * 生成示例数据行
 * @param {mongoose.Schema} schema - Mongoose模型的Schema
 * @param {Object} customConfig - 自定义配置
 * @returns {Object} 示例数据对象
 */
function generateExampleRow(schema, customConfig = {}) {
  const exampleData = customConfig.exampleData || {};
  const paths = schema.paths;
  const row = {};
  
  for (const [fieldName, pathConfig] of Object.entries(paths)) {
    if (customConfig.excludeFields && customConfig.excludeFields.includes(fieldName)) continue;
    
    // 如果提供了示例数据，使用它
    if (exampleData[fieldName]) {
      row[fieldName] = exampleData[fieldName];
      continue;
    }
    
    // 否则根据类型生成默认示例
    switch (pathConfig.instance) {
      case 'String':
        if (pathConfig.enumValues && pathConfig.enumValues.length > 0) {
          row[fieldName] = pathConfig.enumValues[0];
        } else {
          row[fieldName] = `示例${fieldName}`;
        }
        break;
      case 'Number':
        row[fieldName] = pathConfig.options.min || 0;
        break;
      case 'Boolean':
        row[fieldName] = true;
        break;
      case 'Date':
        row[fieldName] = new Date().toISOString().split('T')[0];
        break;
      default:
        row[fieldName] = '';
    }
  }
  
  return row;
}

/**
 * 生成CSV模板文件
 * @param {mongoose.Model} model - Mongoose模型
 * @param {Object} customConfig - 自定义配置
 * @returns {Promise<Object>} 包含文件路径和标题的对象
 */
async function generateCsvTemplate(model, customConfig = {}) {
  const schema = model.schema;
  const modelName = model.modelName;
  
  // 生成CSV标题
  const headers = generateCsvHeadersFromSchema(schema, customConfig);
  
  // 生成示例数据
  const exampleRows = [];
  const numExamples = customConfig.numExamples || 2;
  
  for (let i = 0; i < numExamples; i++) {
    exampleRows.push(generateExampleRow(schema, customConfig));
  }
  
  // 创建临时目录
  const tempDir = path.join(__dirname, '../temp');
  try {
    await fs.access(tempDir);
  } catch {
    await fs.mkdir(tempDir, { recursive: true });
  }
  
  // 生成文件路径
  const fileName = `${modelName}_template_${Date.now()}.csv`;
  const filePath = path.join(tempDir, fileName);
  
  // 写入CSV文件
  const csvWriter = createCsvWriter({
    path: filePath,
    header: headers
  });
  
  await csvWriter.writeRecords(exampleRows);
  
  return {
    filePath,
    fileName,
    headers: headers.map(h => h.title)
  };
}

/**
 * 为特定模型生成CSV模板（带预定义配置）
 */
const templateConfigs = {
  Actuator: {
    excludeFields: ['_id', '__v', 'createdAt', 'updatedAt', 'torque_symmetric', 'torque_canted', 'price_tiers'],
    fieldLabels: {
      model_base: '基础型号 *',
      series: '系列 (SF/AT/GY)',
      mechanism: '机构类型',
      body_size: '本体尺寸',
      action_type: '作用类型 (DA/SR) *',
      spring_range: '弹簧范围',
      pricing_model: '定价模式 (fixed/tiered)',
      base_price: '固定价格',
      supplier_id: '供应商ID',
      availability: '可用状态 (In Stock/Out of Stock/Discontinued)'
    },
    exampleData: {
      model_base: 'SF10',
      series: 'SF',
      mechanism: 'Scotch Yoke',
      body_size: 'C',
      action_type: 'DA',
      pricing_model: 'fixed',
      base_price: 5000,
      availability: 'In Stock'
    },
    numExamples: 3
  },
  
  Accessory: {
    excludeFields: ['_id', '__v', 'createdAt', 'updatedAt', 'price_tiers', 'specifications', 'compatibility_rules'],
    fieldLabels: {
      name: '配件名称 *',
      category: '类别 *',
      pricing_model: '定价模式 (fixed/tiered)',
      base_price: '固定价格',
      description: '描述',
      manufacturer: '制造商',
      model_number: '型号',
      stock_quantity: '库存数量',
      reorder_level: '再订货点',
      lead_time_days: '交货周期(天)'
    },
    exampleData: {
      name: '电磁阀',
      category: '控制类',
      pricing_model: 'fixed',
      base_price: 500,
      description: '24V DC电磁阀',
      manufacturer: '示例厂商',
      model_number: 'SOL-001',
      stock_quantity: 100,
      reorder_level: 20,
      lead_time_days: 7
    },
    numExamples: 3
  },
  
  Supplier: {
    excludeFields: ['_id', '__v', 'createdAt', 'updatedAt'],
    fieldLabels: {
      name: '供应商名称 *',
      contact_person: '联系人',
      phone: '电话',
      email: '邮箱',
      address: '地址',
      business_scope: '经营范围',
      rating: '评级 (1-5)',
      certification_status: '认证状态 (Certified/Pending/Not Certified)',
      status: '状态 (active/inactive/blacklisted)',
      total_transaction_value: '累计交易额',
      on_time_delivery_rate: '准时交付率(%)'
    },
    exampleData: {
      name: '示例供应商公司',
      contact_person: '张三',
      phone: '13800138000',
      email: 'contact@example.com',
      address: '上海市浦东新区XX路XX号',
      business_scope: '阀门配件生产与销售',
      rating: 4,
      certification_status: 'Certified',
      status: 'active',
      total_transaction_value: 0,
      on_time_delivery_rate: 100
    },
    numExamples: 3
  },
  
  User: {
    excludeFields: ['_id', '__v', 'password', 'createdAt', 'updatedAt', 'lastLogin'],
    fieldLabels: {
      name: '姓名 *',
      email: '邮箱 *',
      role: '角色 *',
      department: '部门',
      phone: '电话',
      isActive: '是否激活 (true/false)'
    },
    exampleData: {
      name: '张三',
      email: 'zhangsan@example.com',
      role: 'Technical Engineer',
      department: '技术部',
      phone: '13800138000',
      isActive: true
    },
    numExamples: 3
  }
};

/**
 * 获取预配置的模板生成器
 * @param {mongoose.Model} model - Mongoose模型
 * @returns {Promise<Object>} 模板文件信息
 */
async function generateTemplateForModel(model) {
  const modelName = model.modelName;
  const config = templateConfigs[modelName] || {};
  
  return await generateCsvTemplate(model, config);
}

module.exports = {
  generateCsvTemplate,
  generateTemplateForModel,
  generateCsvHeadersFromSchema,
  generateExampleRow,
  templateConfigs
};

