/**
 * 执行器Excel数据处理器
 * 解析和校验包含SF、AT、GY三个系列的统一Excel模板
 */

const ExcelJS = require('exceljs');

/**
 * 解析Excel文件
 * @param {Buffer} buffer - Excel文件Buffer
 * @returns {Promise<Object>} 解析结果
 */
async function parseActuatorExcel(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  
  // 校验工作表结构
  const requiredSheets = ['SF_Data', 'AT_Data', 'GY_Data'];
  const sheetNames = workbook.worksheets.map(sheet => sheet.name);
  
  const missingSheets = requiredSheets.filter(name => !sheetNames.includes(name));
  if (missingSheets.length > 0) {
    return {
      success: false,
      error: `文件格式错误，缺少工作表：${missingSheets.join(', ')}。请下载最新模板。`,
      data: null
    };
  }
  
  // 解析各个工作表
  const result = {
    success: true,
    data: {
      SF: [],
      AT: [],
      GY: []
    },
    errors: []
  };
  
  // 解析SF系列数据
  const sfSheet = workbook.getWorksheet('SF_Data');
  result.data.SF = parseSheet(sfSheet, 'SF');
  
  // 解析AT系列数据
  const atSheet = workbook.getWorksheet('AT_Data');
  result.data.AT = parseSheet(atSheet, 'AT');
  
  // 解析GY系列数据
  const gySheet = workbook.getWorksheet('GY_Data');
  result.data.GY = parseSheet(gySheet, 'GY');
  
  return result;
}

/**
 * 解析单个工作表
 * @param {Worksheet} sheet - 工作表对象
 * @param {String} series - 系列名称
 * @returns {Array} 数据数组
 */
function parseSheet(sheet, series) {
  const data = [];
  const headers = [];
  
  // 读取表头（第1行）
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value;
  });
  
  // 读取数据（从第2行开始）
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // 跳过表头
    
    const rowData = { _row: rowNumber, _series: series };
    let hasData = false;
    
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber];
      const value = cell.value;
      
      // 检查是否有实际数据
      if (value !== null && value !== undefined && value !== '') {
        hasData = true;
      }
      
      rowData[header] = value;
    });
    
    // 只添加有数据的行
    if (hasData) {
      data.push(rowData);
    }
  });
  
  return data;
}

/**
 * 校验执行器数据
 * @param {Object} parsedData - 解析后的数据
 * @returns {Object} 校验结果
 */
function validateActuatorData(parsedData) {
  const allErrors = [];
  const validData = {
    SF: [],
    AT: [],
    GY: []
  };
  
  // 校验SF系列
  parsedData.SF.forEach(row => {
    const errors = validateSFRow(row);
    if (errors.length > 0) {
      allErrors.push({
        sheet: 'SF_Data',
        row: row._row,
        model: row.Model,
        errors: errors
      });
    } else {
      validData.SF.push(row);
    }
  });
  
  // 校验AT系列
  parsedData.AT.forEach(row => {
    const errors = validateATGYRow(row, 'AT');
    if (errors.length > 0) {
      allErrors.push({
        sheet: 'AT_Data',
        row: row._row,
        model: row.Model,
        errors: errors
      });
    } else {
      validData.AT.push(row);
    }
  });
  
  // 校验GY系列
  parsedData.GY.forEach(row => {
    const errors = validateATGYRow(row, 'GY');
    if (errors.length > 0) {
      allErrors.push({
        sheet: 'GY_Data',
        row: row._row,
        model: row.Model,
        errors: errors
      });
    } else {
      validData.GY.push(row);
    }
  });
  
  return {
    success: allErrors.length === 0,
    errors: allErrors,
    validData: validData
  };
}

/**
 * 校验SF系列单行数据
 * @param {Object} row - 行数据
 * @returns {Array} 错误信息数组
 */
function validateSFRow(row) {
  const errors = [];
  
  // 必填字段校验
  if (!row.Model || String(row.Model).trim() === '') {
    errors.push('Model（型号）不能为空');
  }
  
  if (!row.Type || String(row.Type).trim() === '') {
    errors.push('Type（动作类型）不能为空');
  } else if (!['SR', 'DA'].includes(String(row.Type).toUpperCase())) {
    errors.push('Type（动作类型）必须是SR或DA');
  }
  
  if (!row.Price && row.Price !== 0) {
    errors.push('Price（价格）不能为空');
  } else if (isNaN(parseFloat(row.Price))) {
    errors.push('Price（价格）必须是有效数字');
  } else if (parseFloat(row.Price) < 0) {
    errors.push('Price（价格）不能为负数');
  }
  
  if (!row.Air_Pressure_bar && row.Air_Pressure_bar !== 0) {
    errors.push('Air_Pressure_bar（气源压力）不能为空');
  } else if (isNaN(parseFloat(row.Air_Pressure_bar))) {
    errors.push('Air_Pressure_bar（气源压力）必须是有效数字');
  }
  
  // Type特定的校验
  const type = String(row.Type).toUpperCase();
  
  if (type === 'SR') {
    // SR类型必须填写弹簧和气缸扭矩
    const requiredFields = ['SST_Nm', 'SET_Nm', 'AST_Nm', 'AET_Nm'];
    requiredFields.forEach(field => {
      if (!row[field] && row[field] !== 0) {
        errors.push(`Type为SR时，${field}不能为空`);
      } else if (isNaN(parseFloat(row[field]))) {
        errors.push(`${field}必须是有效数字`);
      }
    });
    
    // DA扭矩字段必须为空
    const shouldBeEmpty = ['DA_Torque_0deg_Nm', 'DA_Torque_90deg_Nm'];
    shouldBeEmpty.forEach(field => {
      if (row[field] !== null && row[field] !== undefined && row[field] !== '') {
        errors.push(`Type为SR时，${field}必须为空`);
      }
    });
  } else if (type === 'DA') {
    // DA类型必须填写双作用扭矩
    const requiredFields = ['DA_Torque_0deg_Nm', 'DA_Torque_90deg_Nm'];
    requiredFields.forEach(field => {
      if (!row[field] && row[field] !== 0) {
        errors.push(`Type为DA时，${field}不能为空`);
      } else if (isNaN(parseFloat(row[field]))) {
        errors.push(`${field}必须是有效数字`);
      }
    });
    
    // 弹簧和气缸扭矩字段必须为空
    const shouldBeEmpty = ['SST_Nm', 'SET_Nm', 'AST_Nm', 'AET_Nm'];
    shouldBeEmpty.forEach(field => {
      if (row[field] !== null && row[field] !== undefined && row[field] !== '') {
        errors.push(`Type为DA时，${field}必须为空`);
      }
    });
  }
  
  return errors;
}

/**
 * 校验AT/GY系列单行数据
 * @param {Object} row - 行数据
 * @param {String} series - 系列名称
 * @returns {Array} 错误信息数组
 */
function validateATGYRow(row, series) {
  const errors = [];
  
  // 必填字段校验
  if (!row.Model || String(row.Model).trim() === '') {
    errors.push('Model（型号）不能为空');
  }
  
  if (!row.Type || String(row.Type).trim() === '') {
    errors.push('Type（动作类型）不能为空');
  } else if (!['SR', 'DA'].includes(String(row.Type).toUpperCase())) {
    errors.push('Type（动作类型）必须是SR或DA');
  }
  
  if (!row.Price && row.Price !== 0) {
    errors.push('Price（价格）不能为空');
  } else if (isNaN(parseFloat(row.Price))) {
    errors.push('Price（价格）必须是有效数字');
  } else if (parseFloat(row.Price) < 0) {
    errors.push('Price（价格）不能为负数');
  }
  
  if (!row.Output_Torque_Nm && row.Output_Torque_Nm !== 0) {
    errors.push('Output_Torque_Nm（输出扭矩）不能为空');
  } else if (isNaN(parseFloat(row.Output_Torque_Nm))) {
    errors.push('Output_Torque_Nm（输出扭矩）必须是有效数字');
  }
  
  return errors;
}

/**
 * 生成错误报告Excel文件
 * @param {Buffer} originalBuffer - 原始Excel文件Buffer
 * @param {Array} errors - 错误信息数组
 * @returns {Promise<Buffer>} 带错误说明的Excel文件Buffer
 */
async function generateErrorReport(originalBuffer, errors) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(originalBuffer);
  
  // 为每个工作表添加错误说明列
  const sheets = ['SF_Data', 'AT_Data', 'GY_Data'];
  
  sheets.forEach(sheetName => {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) return;
    
    // 获取最后一列的列号
    const lastCol = sheet.columnCount + 1;
    
    // 添加"错误说明"表头
    const headerRow = sheet.getRow(1);
    const errorCell = headerRow.getCell(lastCol);
    errorCell.value = '错误说明';
    errorCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    errorCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF0000' }
    };
    errorCell.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // 设置错误说明列宽度
    sheet.getColumn(lastCol).width = 50;
    
    // 填充错误信息
    const sheetErrors = errors.filter(err => err.sheet === sheetName);
    sheetErrors.forEach(error => {
      const row = sheet.getRow(error.row);
      const errorCell = row.getCell(lastCol);
      errorCell.value = error.errors.join('; ');
      errorCell.font = { color: { argb: 'FFFF0000' } };
      errorCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF2CC' }
      };
    });
  });
  
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * 转换数据为数据库格式
 * @param {Object} validData - 校验通过的数据
 * @returns {Array} 数据库格式的数据数组
 */
function transformToDbFormat(validData) {
  const allRecords = [];
  
  // 转换SF系列数据
  validData.SF.forEach(row => {
    const type = String(row.Type).toUpperCase();
    const record = {
      model_base: String(row.Model).trim(),
      series: 'SF',
      action_type: type,
      base_price_normal: parseFloat(row.Price),
      specifications: {
        pressure_range: {
          min: parseFloat(row.Air_Pressure_bar) || 2,
          max: parseFloat(row.Air_Pressure_bar) || 8
        }
      },
      status: '已发布',
      is_active: true
    };
    
    // 添加扭矩数据
    if (type === 'SR') {
      record.torque_data = {
        spring_start: parseFloat(row.SST_Nm),
        spring_end: parseFloat(row.SET_Nm),
        air_start: parseFloat(row.AST_Nm),
        air_end: parseFloat(row.AET_Nm)
      };
    } else if (type === 'DA') {
      record.torque_data = {
        da_0deg: parseFloat(row.DA_Torque_0deg_Nm),
        da_90deg: parseFloat(row.DA_Torque_90deg_Nm)
      };
    }
    
    allRecords.push(record);
  });
  
  // 转换AT系列数据
  validData.AT.forEach(row => {
    const record = {
      model_base: String(row.Model).trim(),
      series: 'AT',
      action_type: String(row.Type).toUpperCase(),
      base_price_normal: parseFloat(row.Price),
      torque_data: {
        output_torque: parseFloat(row.Output_Torque_Nm)
      },
      specifications: {
        materials: {
          body: '铝合金+硬质氧化'
        }
      },
      status: '已发布',
      is_active: true
    };
    
    allRecords.push(record);
  });
  
  // 转换GY系列数据
  validData.GY.forEach(row => {
    const record = {
      model_base: String(row.Model).trim(),
      series: 'GY',
      action_type: String(row.Type).toUpperCase(),
      base_price_normal: parseFloat(row.Price),
      torque_data: {
        output_torque: parseFloat(row.Output_Torque_Nm)
      },
      specifications: {
        materials: {
          body: '不锈钢'
        }
      },
      status: '已发布',
      is_active: true
    };
    
    allRecords.push(record);
  });
  
  return allRecords;
}

module.exports = {
  parseActuatorExcel,
  validateActuatorData,
  generateErrorReport,
  transformToDbFormat
};

