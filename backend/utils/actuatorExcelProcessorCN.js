/**
 * 执行器Excel数据处理器（中文字段版本）
 * 支持员工使用中文字段填写的Excel模板
 */

const XLSX = require('xlsx');

/**
 * 中文字段到数据库字段的映射
 */
const FIELD_MAPPING = {
  '型号': 'model_base',
  '系列': 'series',
  '机构类型': 'mechanism',
  '阀门类型': 'valve_type',
  '作用类型': 'action_type',
  '弹簧范围': 'spring_range',
  '本体尺寸': 'body_size',
  '气缸尺寸': 'cylinder_size',
  '扭矩@4bar': 'torque_4bar',
  '扭矩@5bar': 'torque_5bar',
  '扭矩@6bar': 'torque_6bar',
  '扭矩@7bar': 'torque_7bar',
  '气源压力范围': 'air_pressure_range',
  '工作角度': 'working_angle',
  '高度H': 'height',
  '宽度W': 'width',
  '长度L': 'length',
  '重量(kg)': 'weight',
  '进气口': 'air_inlet',
  '法兰尺寸ISO5211': 'flange_size',
  '手轮': 'handwheel',
  '常温标准价': 'base_price_normal',
  '低温标准价': 'base_price_low',
  '高温标准价': 'base_price_high',
  '状态': 'status'
};

/**
 * 解析Excel文件（支持中文字段）
 */
async function parseActuatorExcelCN(buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    const result = {
      success: true,
      data: {
        SF: [],
        AT: [],
        GY: []
      }
    };
    
    // 解析SF系列
    if (workbook.SheetNames.includes('SF系列')) {
      result.data.SF = parseSheetCN(workbook.Sheets['SF系列'], 'SF');
    }
    
    // 解析AT系列
    if (workbook.SheetNames.includes('AT系列')) {
      result.data.AT = parseSheetCN(workbook.Sheets['AT系列'], 'AT');
    }
    
    // 解析GY系列
    if (workbook.SheetNames.includes('GY系列')) {
      result.data.GY = parseSheetCN(workbook.Sheets['GY系列'], 'GY');
    }
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: `Excel解析失败: ${error.message}`
    };
  }
}

/**
 * 解析单个工作表（中文字段）
 */
function parseSheetCN(sheet, series) {
  const data = [];
  const jsonData = XLSX.utils.sheet_to_json(sheet);
  
  jsonData.forEach((row, index) => {
    // 跳过空行
    if (!row['型号']) return;
    
    const record = {
      _row: index + 2, // Excel行号（从2开始，因为第1行是表头）
      _series: series
    };
    
    // 映射中文字段到英文字段
    Object.keys(row).forEach(cnField => {
      const enField = FIELD_MAPPING[cnField];
      if (enField) {
        record[enField] = row[cnField];
      } else {
        // 保留未映射的字段
        record[cnField] = row[cnField];
      }
    });
    
    data.push(record);
  });
  
  return data;
}

/**
 * 验证数据
 */
function validateExcelDataCN(data) {
  const errors = [];
  const validData = {
    SF: [],
    AT: [],
    GY: []
  };
  
  // 验证SF系列
  data.SF.forEach(row => {
    const rowErrors = validateRow(row, 'SF');
    if (rowErrors.length > 0) {
      errors.push({
        sheet: 'SF系列',
        row: row._row,
        model: row.model_base,
        errors: rowErrors
      });
    } else {
      validData.SF.push(row);
    }
  });
  
  // 验证AT系列
  data.AT.forEach(row => {
    const rowErrors = validateRow(row, 'AT');
    if (rowErrors.length > 0) {
      errors.push({
        sheet: 'AT系列',
        row: row._row,
        model: row.model_base,
        errors: rowErrors
      });
    } else {
      validData.AT.push(row);
    }
  });
  
  // 验证GY系列
  data.GY.forEach(row => {
    const rowErrors = validateRow(row, 'GY');
    if (rowErrors.length > 0) {
      errors.push({
        sheet: 'GY系列',
        row: row._row,
        model: row.model_base,
        errors: rowErrors
      });
    } else {
      validData.GY.push(row);
    }
  });
  
  return {
    success: errors.length === 0,
    validData,
    errors
  };
}

/**
 * 验证单行数据
 */
function validateRow(row, series) {
  const errors = [];
  
  // 必填字段验证
  if (!row.model_base) {
    errors.push('型号不能为空');
  }
  
  if (!row.series) {
    errors.push('系列不能为空');
  } else if (row.series !== series) {
    errors.push(`系列应为${series}`);
  }
  
  if (!row.action_type) {
    errors.push('作用类型不能为空');
  } else if (!['DA', 'SR'].includes(row.action_type)) {
    errors.push('作用类型必须是DA或SR');
  }
  
  // SR类型必须有弹簧范围
  if (row.action_type === 'SR' && !row.spring_range) {
    errors.push('单作用(SR)类型必须填写弹簧范围');
  }
  
  // 价格验证
  if (row.base_price_normal !== undefined && row.base_price_normal !== null) {
    if (isNaN(parseFloat(row.base_price_normal)) || parseFloat(row.base_price_normal) < 0) {
      errors.push('常温标准价必须是非负数字');
    }
  }
  
  // 扭矩值验证
  const torqueFields = ['torque_4bar', 'torque_5bar', 'torque_6bar', 'torque_7bar'];
  torqueFields.forEach(field => {
    if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
      if (isNaN(parseFloat(row[field])) || parseFloat(row[field]) < 0) {
        errors.push(`${field}必须是非负数字`);
      }
    }
  });
  
  return errors;
}

/**
 * 转换为数据库格式
 */
function transformToDbFormatCN(validData) {
  const allRecords = [];
  
  // 处理所有系列
  ['SF', 'AT', 'GY'].forEach(series => {
    validData[series].forEach(row => {
      const record = {
        model_base: row.model_base,
        series: row.series,
        mechanism: row.mechanism,
        valve_type: row.valve_type,
        action_type: row.action_type,
        body_size: row.body_size,
        status: row.status || '已发布',
        
        // 价格信息
        base_price_normal: parseFloat(row.base_price_normal) || 0,
        base_price_low: parseFloat(row.base_price_low) || 0,
        base_price_high: parseFloat(row.base_price_high) || 0,
        
        // 扭矩数据（存储为JSON对象）
        torque_data: {
          '4bar': parseFloat(row.torque_4bar) || 0,
          '5bar': parseFloat(row.torque_5bar) || 0,
          '6bar': parseFloat(row.torque_6bar) || 0,
          '7bar': parseFloat(row.torque_7bar) || 0
        },
        
        // 尺寸数据
        dimensions: {
          height: parseFloat(row.height) || 0,
          width: parseFloat(row.width) || 0,
          length: parseFloat(row.length) || 0,
          weight: parseFloat(row.weight) || 0
        },
        
        // 其他技术参数
        specifications: {
          air_pressure_range: row.air_pressure_range,
          working_angle: parseInt(row.working_angle) || 90,
          air_inlet: row.air_inlet,
          flange_size: row.flange_size,
          handwheel: row.handwheel
        }
      };
      
      // SF系列特有字段
      if (series === 'SF' && row.cylinder_size) {
        record.specifications.cylinder_size = parseInt(row.cylinder_size);
      }
      
      // SR类型特有字段
      if (row.action_type === 'SR' && row.spring_range) {
        record.spring_range = row.spring_range;
      }
      
      allRecords.push(record);
    });
  });
  
  return allRecords;
}

/**
 * 生成错误报告
 */
async function generateErrorReportCN(originalBuffer, errors) {
  try {
    const workbook = XLSX.read(originalBuffer, { type: 'buffer' });
    
    // 为每个工作表添加错误信息
    errors.forEach(error => {
      const sheet = workbook.Sheets[error.sheet];
      if (!sheet) return;
      
      // 在对应行添加错误说明列
      const cellAddress = XLSX.utils.encode_cell({ r: error.row - 1, c: 25 }); // 第26列
      if (!sheet[cellAddress]) {
        sheet[cellAddress] = { t: 's', v: '' };
      }
      sheet[cellAddress].v = error.errors.join('; ');
    });
    
    // 生成新的Excel文件
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  } catch (error) {
    throw new Error(`生成错误报告失败: ${error.message}`);
  }
}

module.exports = {
  parseActuatorExcelCN,
  validateExcelDataCN,
  transformToDbFormatCN,
  generateErrorReportCN,
  FIELD_MAPPING
};
