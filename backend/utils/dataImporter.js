/**
 * 数据导入工具
 * 支持CSV和Excel文件的批量导入
 */

const csvParser = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const { Readable } = require('stream');

/**
 * 解析CSV文件
 * @param {string|Buffer} fileInput - 文件路径或Buffer
 * @returns {Promise<Array>} 解析后的数据数组
 */
function parseCsvFile(fileInput) {
  return new Promise((resolve, reject) => {
    const results = [];
    let stream;
    
    if (Buffer.isBuffer(fileInput)) {
      stream = Readable.from(fileInput.toString());
    } else {
      stream = fs.createReadStream(fileInput);
    }
    
    stream
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

/**
 * 解析Excel文件
 * @param {string|Buffer} fileInput - 文件路径或Buffer
 * @returns {Array} 解析后的数据数组
 */
function parseExcelFile(fileInput) {
  let workbook;
  
  if (Buffer.isBuffer(fileInput)) {
    workbook = XLSX.read(fileInput, { type: 'buffer' });
  } else {
    workbook = XLSX.readFile(fileInput);
  }
  
  // 读取第一个工作表
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // 转换为JSON
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  return data;
}

/**
 * 根据文件类型自动选择解析器
 * @param {Buffer} fileBuffer - 文件Buffer
 * @param {string} fileName - 文件名
 * @returns {Promise<Array>} 解析后的数据数组
 */
async function parseFile(fileBuffer, fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  
  if (ext === 'csv') {
    return await parseCsvFile(fileBuffer);
  } else if (['xlsx', 'xls'].includes(ext)) {
    return parseExcelFile(fileBuffer);
  } else {
    throw new Error('不支持的文件格式。请上传CSV或Excel文件。');
  }
}

/**
 * 清理和规范化数据
 * @param {Array} rawData - 原始数据数组
 * @param {Object} fieldMapping - 字段映射配置
 * @returns {Array} 清理后的数据数组
 */
function cleanAndNormalizeData(rawData, fieldMapping = {}) {
  return rawData.map(row => {
    const cleanedRow = {};
    
    for (const [key, value] of Object.entries(row)) {
      // 跳过空列
      if (!key || key.trim() === '') continue;
      
      // 应用字段映射
      let fieldName = fieldMapping[key] || key;
      
      // 清理字段名（移除空格、转小写、替换特殊字符）
      fieldName = fieldName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      
      // 清理值
      let cleanedValue = value;
      
      if (typeof value === 'string') {
        cleanedValue = value.trim();
        
        // 清空明显的空值（在转换之前检查）
        if (cleanedValue === '' || cleanedValue.toLowerCase() === 'n/a' || cleanedValue.toLowerCase() === 'null') {
          cleanedValue = null;
        }
        // 转换布尔值
        else if (cleanedValue.toLowerCase() === 'true') {
          cleanedValue = true;
        }
        else if (cleanedValue.toLowerCase() === 'false') {
          cleanedValue = false;
        }
        // 转换数字
        else if (!isNaN(cleanedValue) && cleanedValue !== '') {
          cleanedValue = Number(cleanedValue);
        }
      }
      
      cleanedRow[fieldName] = cleanedValue;
    }
    
    return cleanedRow;
  });
}

/**
 * 验证导入数据
 * @param {Array} data - 要验证的数据数组
 * @param {mongoose.Model} model - Mongoose模型
 * @param {Object} customValidation - 自定义验证规则
 * @returns {Object} 验证结果 {valid: Array, invalid: Array}
 */
function validateImportData(data, model, customValidation = {}) {
  const validRecords = [];
  const invalidRecords = [];
  
  data.forEach((record, index) => {
    const errors = [];
    const schema = model.schema;
    
    // 基本Mongoose Schema验证
    for (const [fieldName, pathConfig] of Object.entries(schema.paths)) {
      const value = record[fieldName];
      
      // 检查必填字段
      if (pathConfig.isRequired && (value === null || value === undefined || value === '')) {
        errors.push(`字段 "${fieldName}" 是必填项`);
      }
      
      // 检查枚举值
      if (pathConfig.enumValues && pathConfig.enumValues.length > 0) {
        if (value && !pathConfig.enumValues.includes(value)) {
          errors.push(`字段 "${fieldName}" 的值必须是: ${pathConfig.enumValues.join(', ')}`);
        }
      }
      
      // 检查数字范围
      if (pathConfig.instance === 'Number' && value !== null && value !== undefined) {
        if (pathConfig.options.min !== undefined && value < pathConfig.options.min) {
          errors.push(`字段 "${fieldName}" 的值不能小于 ${pathConfig.options.min}`);
        }
        if (pathConfig.options.max !== undefined && value > pathConfig.options.max) {
          errors.push(`字段 "${fieldName}" 的值不能大于 ${pathConfig.options.max}`);
        }
      }
    }
    
    // 应用自定义验证
    if (customValidation.validate && typeof customValidation.validate === 'function') {
      const customErrors = customValidation.validate(record);
      if (customErrors && customErrors.length > 0) {
        errors.push(...customErrors);
      }
    }
    
    if (errors.length > 0) {
      invalidRecords.push({
        row: index + 1,
        data: record,
        errors
      });
    } else {
      validRecords.push(record);
    }
  });
  
  return {
    valid: validRecords,
    invalid: invalidRecords,
    summary: {
      total: data.length,
      validCount: validRecords.length,
      invalidCount: invalidRecords.length
    }
  };
}

/**
 * 批量导入数据到数据库
 * @param {Array} validData - 已验证的数据数组
 * @param {mongoose.Model} model - Mongoose模型
 * @param {Object} options - 导入选项
 * @returns {Promise<Object>} 导入结果
 */
async function bulkImportData(validData, model, options = {}) {
  const results = {
    success: [],
    failed: [],
    skipped: []
  };
  
  const {
    updateOnDuplicate = false,
    uniqueField = null,
    batchSize = 100
  } = options;
  
  // 分批处理
  for (let i = 0; i < validData.length; i += batchSize) {
    const batch = validData.slice(i, i + batchSize);
    
    for (const record of batch) {
      try {
        if (updateOnDuplicate && uniqueField && record[uniqueField]) {
          // 更新模式：如果存在则更新，不存在则创建
          const query = { [uniqueField]: record[uniqueField] };
          const existing = await model.findOne(query);
          
          if (existing) {
            // 更新现有记录
            Object.assign(existing, record);
            await existing.save();
            results.success.push({
              action: 'updated',
              data: existing
            });
          } else {
            // 创建新记录
            const newDoc = await model.create(record);
            results.success.push({
              action: 'created',
              data: newDoc
            });
          }
        } else {
          // 仅创建模式
          const newDoc = await model.create(record);
          results.success.push({
            action: 'created',
            data: newDoc
          });
        }
      } catch (error) {
        results.failed.push({
          data: record,
          error: error.message
        });
      }
    }
  }
  
  return {
    ...results,
    summary: {
      successCount: results.success.length,
      failedCount: results.failed.length,
      skippedCount: results.skipped.length
    }
  };
}

/**
 * 完整的导入流程（解析 -> 验证 -> 导入）
 * @param {Buffer} fileBuffer - 文件Buffer
 * @param {string} fileName - 文件名
 * @param {mongoose.Model} model - Mongoose模型
 * @param {Object} options - 导入选项
 * @returns {Promise<Object>} 导入结果
 */
async function importDataFromFile(fileBuffer, fileName, model, options = {}) {
  try {
    // 1. 解析文件
    const rawData = await parseFile(fileBuffer, fileName);
    
    if (!rawData || rawData.length === 0) {
      throw new Error('文件为空或无法解析');
    }
    
    // 2. 清理和规范化数据
    const cleanedData = cleanAndNormalizeData(rawData, options.fieldMapping);
    
    // 3. 验证数据
    const validationResult = validateImportData(
      cleanedData,
      model,
      options.customValidation
    );
    
    // 4. 如果有有效数据，进行导入
    let importResult = null;
    if (validationResult.valid.length > 0) {
      importResult = await bulkImportData(
        validationResult.valid,
        model,
        options
      );
    }
    
    return {
      success: true,
      validation: validationResult,
      import: importResult,
      summary: {
        totalRows: rawData.length,
        validRows: validationResult.summary.validCount,
        invalidRows: validationResult.summary.invalidCount,
        imported: importResult ? importResult.summary.successCount : 0,
        failed: importResult ? importResult.summary.failedCount : 0
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  parseCsvFile,
  parseExcelFile,
  parseFile,
  cleanAndNormalizeData,
  validateImportData,
  bulkImportData,
  importDataFromFile
};

