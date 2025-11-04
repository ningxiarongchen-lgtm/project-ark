/**
 * 执行器CSV数据处理器
 * 专门处理AT/GY和SF系列执行器的CSV导入
 */

/**
 * 解析JSON字符串字段
 * @param {string} jsonString - JSON字符串
 * @returns {Object|null} 解析后的对象
 */
function parseJsonField(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return null;
  }
  
  try {
    // 处理可能的引号问题
    const cleaned = jsonString.replace(/'/g, '"');
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON解析失败:', jsonString, error);
    return null;
  }
}

/**
 * 处理AT/GY系列执行器数据
 * @param {Object} row - CSV行数据
 * @returns {Object} 转换后的数据
 */
function processAtGyActuator(row) {
  const torqueData = parseJsonField(row.torque_data);
  const dimensions = parseJsonField(row.dimensions);
  
  // 确定作用类型
  const actionType = row.action_type || 'DA';
  
  // 构建执行器数据对象
  const actuatorData = {
    model_base: row.model_base,
    series: row.series || 'AT',
    mechanism: row.mechanism || 'Rack & Pinion',
    action_type: actionType,
    spring_range: row.spring_range || null,
    
    // 定价信息
    base_price_normal: parseFloat(row.base_price_normal) || null,
    base_price_low: parseFloat(row.base_price_low) || null,
    base_price_high: parseFloat(row.base_price_high) || null,
    
    // 手动装置信息
    manual_override_model: row.manual_override_model || null,
    manual_override_price: parseFloat(row.manual_override_price) || null,
    seal_kit_price: parseFloat(row.seal_kit_price) || null,
    
    // 扭矩数据
    torque_data: torqueData,
    
    // 尺寸数据
    dimensions: dimensions,
    
    // 默认状态
    status: 'active',
    
    // 元数据
    notes: `导入自CSV: ${row.model_base}`
  };
  
  return actuatorData;
}

/**
 * 处理SF系列执行器数据
 * @param {Object} row - CSV行数据
 * @returns {Object} 转换后的数据
 */
function processSfActuator(row) {
  // SF系列可能有对称和偏置扭矩数据
  const torqueSymmetric = parseJsonField(row.torque_symmetric);
  const torqueCanted = parseJsonField(row.torque_canted);
  
  // 确定作用类型（从model_base中提取，如SF10-150DA中的DA或SR）
  const modelBase = row.model_base || '';
  let actionType = 'DA'; // 默认双作用
  let springRange = null;
  
  if (modelBase.includes('SR')) {
    actionType = 'SR';
    // 从model_base中提取弹簧范围，如SF10-150SR3中的SR3
    const srMatch = modelBase.match(/SR(\d+)/);
    if (srMatch) {
      springRange = `SR${srMatch[1]}`;
    }
  }
  
  // 构建执行器数据对象
  const actuatorData = {
    model_base: modelBase,
    series: row.series || 'SF',
    body_size: row.body_size || null,
    cylinder_size: row.cylinder_size || null,
    mechanism: 'Rack & Pinion',
    action_type: actionType,
    spring_range: springRange,
    
    // 定价信息（SF系列通常只有base_price）
    base_price_normal: parseFloat(row.base_price) || null,
    base_price_low: null,
    base_price_high: null,
    
    // 连接法兰
    connect_flange: row.connect_flange || null,
    
    // 尺寸数据（SF系列有多个尺寸字段）
    dimensions: {
      L1: parseFloat(row.l1) || null,
      L2: parseFloat(row.l2) || null,
      m1: parseFloat(row.m1) || null,
      m2: parseFloat(row.m2) || null,
      A: parseFloat(row.a) || null,
      H1: parseFloat(row.h1) || null,
      H2: parseFloat(row.h2) || null,
      D: parseFloat(row.d) || null,
      G: row.g || null
    },
    
    // 扭矩数据（合并对称和偏置）
    torque_data: {
      symmetric: torqueSymmetric,
      canted: torqueCanted
    },
    
    // 默认状态
    status: 'active',
    
    // 元数据
    notes: `导入自CSV: ${modelBase} - SF系列`
  };
  
  return actuatorData;
}

/**
 * 自动检测并处理执行器数据
 * @param {Object} row - CSV行数据
 * @returns {Object} 转换后的数据
 */
function processActuatorRow(row) {
  // 检测系列类型
  const series = row.series || '';
  
  if (series === 'AT' || series === 'GY') {
    return processAtGyActuator(row);
  } else if (series === 'SF') {
    return processSfActuator(row);
  } else {
    // 尝试从model_base推断
    const modelBase = row.model_base || '';
    if (modelBase.startsWith('AT-') || modelBase.startsWith('GY-')) {
      return processAtGyActuator(row);
    } else if (modelBase.startsWith('SF')) {
      return processSfActuator(row);
    }
  }
  
  // 无法识别，返回原始数据（尽力而为）
  console.warn('无法识别执行器系列:', row);
  return row;
}

/**
 * 批量处理CSV数据
 * @param {Array} rows - CSV行数据数组
 * @returns {Object} 处理结果
 */
function processActuatorCsv(rows) {
  const processed = [];
  const errors = [];
  
  rows.forEach((row, index) => {
    try {
      const processedRow = processActuatorRow(row);
      processed.push(processedRow);
    } catch (error) {
      errors.push({
        row: index + 1,
        error: error.message,
        data: row
      });
    }
  });
  
  return {
    success: true,
    processed,
    errors,
    summary: {
      total: rows.length,
      succeeded: processed.length,
      failed: errors.length
    }
  };
}

/**
 * 验证执行器数据
 * @param {Object} data - 执行器数据
 * @returns {Array|null} 错误数组，无错误返回null
 */
function validateActuatorData(data) {
  const errors = [];
  
  // 必填字段验证
  if (!data.model_base) {
    errors.push('model_base是必填字段');
  }
  
  if (!data.series) {
    errors.push('series是必填字段');
  }
  
  // 价格验证（至少有一个价格）
  const hasPrice = data.base_price_normal || data.base_price_low || data.base_price_high;
  if (!hasPrice) {
    errors.push('至少需要一个价格字段（base_price_normal/low/high）');
  }
  
  // 作用类型验证
  if (data.action_type && !['DA', 'SR'].includes(data.action_type)) {
    errors.push('action_type必须是DA（双作用）或SR（弹簧复位）');
  }
  
  // 弹簧复位类型必须有spring_range
  if (data.action_type === 'SR' && !data.spring_range) {
    errors.push('弹簧复位类型（SR）必须提供spring_range');
  }
  
  return errors.length > 0 ? errors : null;
}

module.exports = {
  parseJsonField,
  processAtGyActuator,
  processSfActuator,
  processActuatorRow,
  processActuatorCsv,
  validateActuatorData
};

