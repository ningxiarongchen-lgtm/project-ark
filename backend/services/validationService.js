// 数据验证服务

/**
 * 验证执行器数据
 */
exports.validateActuatorData = (data, rowIndex) => {
  const errors = [];
  const warnings = [];

  // 必需字段验证
  if (!data.model_base || typeof data.model_base !== 'string') {
    errors.push(`第 ${rowIndex} 行：缺少或无效的 model_base 字段`);
  }

  if (!data.body_size || typeof data.body_size !== 'string') {
    errors.push(`第 ${rowIndex} 行：缺少或无效的 body_size 字段`);
  }

  if (!data.action_type || !['DA', 'SR'].includes(data.action_type.toUpperCase())) {
    errors.push(`第 ${rowIndex} 行：action_type 必须是 DA 或 SR`);
  }

  if (!data.base_price || typeof data.base_price !== 'number' || data.base_price < 0) {
    errors.push(`第 ${rowIndex} 行：base_price 必须是正数`);
  }

  // 扭矩数据验证
  if (data.torque_symmetric) {
    if (typeof data.torque_symmetric !== 'object') {
      errors.push(`第 ${rowIndex} 行：torque_symmetric 必须是对象`);
    } else {
      // 验证扭矩键格式
      for (const key in data.torque_symmetric) {
        if (!key.match(/^\d_\d+_\d+$/)) {
          warnings.push(`第 ${rowIndex} 行：扭矩键 "${key}" 格式不标准，应为 "压力_角度" 格式（如 "0_4_0"）`);
        }
        if (typeof data.torque_symmetric[key] !== 'number' || data.torque_symmetric[key] < 0) {
          errors.push(`第 ${rowIndex} 行：扭矩值必须是正数`);
        }
      }
    }
  }

  if (data.torque_canted) {
    if (typeof data.torque_canted !== 'object') {
      errors.push(`第 ${rowIndex} 行：torque_canted 必须是对象`);
    } else {
      // 验证扭矩键格式
      for (const key in data.torque_canted) {
        if (!key.match(/^\d_\d+_\d+$/)) {
          warnings.push(`第 ${rowIndex} 行：扭矩键 "${key}" 格式不标准`);
        }
        if (typeof data.torque_canted[key] !== 'number' || data.torque_canted[key] < 0) {
          errors.push(`第 ${rowIndex} 行：扭矩值必须是正数`);
        }
      }
    }
  }

  // 规格验证
  if (data.specifications) {
    const specs = data.specifications;
    
    if (specs.pressure_range) {
      if (!specs.pressure_range.min || !specs.pressure_range.max) {
        warnings.push(`第 ${rowIndex} 行：压力范围不完整`);
      } else if (specs.pressure_range.min >= specs.pressure_range.max) {
        errors.push(`第 ${rowIndex} 行：最小压力必须小于最大压力`);
      }
    }

    if (specs.temperature_range) {
      if (!specs.temperature_range.min || !specs.temperature_range.max) {
        warnings.push(`第 ${rowIndex} 行：温度范围不完整`);
      } else if (specs.temperature_range.min >= specs.temperature_range.max) {
        errors.push(`第 ${rowIndex} 行：最小温度必须小于最大温度`);
      }
    }

    if (specs.rotation_angle && ![90, 120, 180].includes(specs.rotation_angle)) {
      warnings.push(`第 ${rowIndex} 行：旋转角度应为 90、120 或 180 度`);
    }

    if (specs.weight && (typeof specs.weight !== 'number' || specs.weight < 0)) {
      errors.push(`第 ${rowIndex} 行：重量必须是正数`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * 验证手动操作装置数据
 */
exports.validateManualOverrideData = (data, rowIndex) => {
  const errors = [];
  const warnings = [];

  // 必需字段验证
  if (!data.model || typeof data.model !== 'string') {
    errors.push(`第 ${rowIndex} 行：缺少或无效的 model 字段`);
  }

  if (!data.price || typeof data.price !== 'number' || data.price < 0) {
    errors.push(`第 ${rowIndex} 行：price 必须是正数`);
  }

  if (!data.compatible_body_sizes || !Array.isArray(data.compatible_body_sizes)) {
    errors.push(`第 ${rowIndex} 行：compatible_body_sizes 必须是数组`);
  } else if (data.compatible_body_sizes.length === 0) {
    warnings.push(`第 ${rowIndex} 行：compatible_body_sizes 为空，该装置将不兼容任何执行器`);
  }

  // 规格验证
  if (data.specifications) {
    const specs = data.specifications;
    
    if (specs.output_torque && (typeof specs.output_torque !== 'number' || specs.output_torque < 0)) {
      errors.push(`第 ${rowIndex} 行：输出扭矩必须是正数`);
    }

    if (specs.weight && (typeof specs.weight !== 'number' || specs.weight < 0)) {
      errors.push(`第 ${rowIndex} 行：重量必须是正数`);
    }

    if (specs.gear_ratio && typeof specs.gear_ratio !== 'string') {
      warnings.push(`第 ${rowIndex} 行：传动比格式可能不正确`);
    }
  }

  // 尺寸验证
  if (data.dimensions) {
    const dims = data.dimensions;
    if (dims.length && (typeof dims.length !== 'number' || dims.length < 0)) {
      errors.push(`第 ${rowIndex} 行：尺寸长度必须是正数`);
    }
    if (dims.width && (typeof dims.width !== 'number' || dims.width < 0)) {
      errors.push(`第 ${rowIndex} 行：尺寸宽度必须是正数`);
    }
    if (dims.height && (typeof dims.height !== 'number' || dims.height < 0)) {
      errors.push(`第 ${rowIndex} 行：尺寸高度必须是正数`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * 批量验证数据
 */
exports.validateBatch = (dataArray, validatorFunc) => {
  const results = {
    valid: [],
    invalid: [],
    totalErrors: 0,
    totalWarnings: 0
  };

  dataArray.forEach((data, index) => {
    const validation = validatorFunc(data, index + 2); // Excel行号从2开始（1是表头）
    
    if (validation.isValid) {
      results.valid.push({
        rowIndex: index + 2,
        data: data,
        warnings: validation.warnings
      });
    } else {
      results.invalid.push({
        rowIndex: index + 2,
        data: data,
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    results.totalErrors += validation.errors.length;
    results.totalWarnings += validation.warnings.length;
  });

  return results;
};

/**
 * 生成验证报告
 */
exports.generateValidationReport = (validationResults) => {
  const report = {
    summary: {
      total_rows: validationResults.valid.length + validationResults.invalid.length,
      valid_rows: validationResults.valid.length,
      invalid_rows: validationResults.invalid.length,
      total_errors: validationResults.totalErrors,
      total_warnings: validationResults.totalWarnings,
      success_rate: ((validationResults.valid.length / (validationResults.valid.length + validationResults.invalid.length)) * 100).toFixed(2) + '%'
    },
    valid_data: validationResults.valid.map(item => ({
      row: item.rowIndex,
      warnings: item.warnings
    })),
    invalid_data: validationResults.invalid.map(item => ({
      row: item.rowIndex,
      errors: item.errors,
      warnings: item.warnings
    })),
    recommendations: []
  };

  // 添加建议
  if (validationResults.invalid.length > 0) {
    report.recommendations.push('请修正错误的数据行后重新上传');
  }
  if (validationResults.totalWarnings > 0) {
    report.recommendations.push('建议检查警告项，确保数据格式符合标准');
  }
  if (validationResults.valid.length > 0) {
    report.recommendations.push(`${validationResults.valid.length} 行数据验证通过，可以导入`);
  }

  return report;
};


