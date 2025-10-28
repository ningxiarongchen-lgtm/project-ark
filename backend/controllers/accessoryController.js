const Accessory = require('../models/Accessory');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// @desc    获取所有配件
// @route   GET /api/accessories
// @access  Private
exports.getAllAccessories = async (req, res) => {
  try {
    const { category, min_price, max_price, search } = req.query;
    
    let query = { is_active: true };
    
    // 按类别过滤
    if (category) {
      query.category = category;
    }
    
    // 按价格范围过滤
    if (min_price || max_price) {
      query.price = {};
      if (min_price) query.price.$gte = Number(min_price);
      if (max_price) query.price.$lte = Number(max_price);
    }
    
    // 搜索
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { model_number: { $regex: search, $options: 'i' } }
      ];
    }
    
    const accessories = await Accessory.find(query).sort({ category: 1, price: 1 });
    
    res.json({
      success: true,
      count: accessories.length,
      data: accessories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取配件列表失败',
      error: error.message
    });
  }
};

// @desc    获取单个配件
// @route   GET /api/accessories/:id
// @access  Private
exports.getAccessoryById = async (req, res) => {
  try {
    const accessory = await Accessory.findById(req.params.id);
    
    if (!accessory) {
      return res.status(404).json({
        success: false,
        message: '未找到该配件'
      });
    }
    
    res.json({
      success: true,
      data: accessory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取配件详情失败',
      error: error.message
    });
  }
};

// @desc    创建配件
// @route   POST /api/accessories
// @access  Private (Administrator only)
exports.createAccessory = async (req, res) => {
  try {
    const accessory = await Accessory.create(req.body);
    
    res.status(201).json({
      success: true,
      message: '配件创建成功',
      data: accessory
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建配件失败',
      error: error.message
    });
  }
};

// @desc    更新配件
// @route   PUT /api/accessories/:id
// @access  Private (Administrator only)
exports.updateAccessory = async (req, res) => {
  try {
    const accessory = await Accessory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!accessory) {
      return res.status(404).json({
        success: false,
        message: '未找到该配件'
      });
    }
    
    res.json({
      success: true,
      message: '配件更新成功',
      data: accessory
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新配件失败',
      error: error.message
    });
  }
};

// @desc    删除配件
// @route   DELETE /api/accessories/:id
// @access  Private (Administrator only)
exports.deleteAccessory = async (req, res) => {
  try {
    const accessory = await Accessory.findById(req.params.id);
    
    if (!accessory) {
      return res.status(404).json({
        success: false,
        message: '未找到该配件'
      });
    }
    
    // 软删除：只标记为不活跃
    accessory.is_active = false;
    await accessory.save();
    
    res.json({
      success: true,
      message: '配件删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除配件失败',
      error: error.message
    });
  }
};

// @desc    按类别获取配件
// @route   GET /api/accessories/category/:category
// @access  Private
exports.getAccessoriesByCategory = async (req, res) => {
  try {
    const accessories = await Accessory.findByCategory(req.params.category);
    
    res.json({
      success: true,
      count: accessories.length,
      data: accessories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取配件列表失败',
      error: error.message
    });
  }
};

// @desc    获取兼容的配件
// @route   GET /api/accessories/compatible/:actuatorId
// @access  Private
exports.getCompatibleAccessories = async (req, res) => {
  try {
    const Actuator = require('../models/Actuator');
    const actuator = await Actuator.findById(req.params.actuatorId);
    
    if (!actuator) {
      return res.status(404).json({
        success: false,
        message: '未找到该执行器'
      });
    }
    
    const category = req.query.category;
    const compatibleAccessories = await Accessory.findCompatibleAccessories(actuator, category);
    
    res.json({
      success: true,
      count: compatibleAccessories.length,
      data: compatibleAccessories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取兼容配件失败',
      error: error.message
    });
  }
};

// @desc    下载Excel模板
// @route   GET /api/accessories/template
// @access  Private (Administrator only)
exports.downloadTemplate = async (req, res) => {
  try {
    // 创建模板数据
    const templateData = [
      {
        '配件名称': '双作用电磁阀',
        '配件类别': '控制类',
        '价格': 1200,
        '描述': '高性能双作用电磁阀',
        '制造商': 'ASCO',
        '型号': 'SCG353A044',
        '库存数量': 50,
        '是否可用': '是',
        '交货期': '7天',
        '规格_电压': '24V DC',
        '规格_接口尺寸': 'G1/4',
        '规格_防护等级': 'IP65',
        '兼容机身尺寸': 'SF10,SF12,SF14',
        '兼容作用类型': 'DA,SR'
      }
    ];
    
    // 创建工作簿
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(templateData);
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 30 },
      { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 25 }, { wch: 20 }
    ];
    
    xlsx.utils.book_append_sheet(wb, ws, '配件导入模板');
    
    // 生成Excel文件
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=accessories_template.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '模板下载失败',
      error: error.message
    });
  }
};

// 验证配件数据
const validateAccessoryData = (data, rowIndex) => {
  const errors = [];
  const warnings = [];
  
  // 有效的配件类别
  const validCategories = ['控制类', '连接与传动类', '安全与保护类', '检测与反馈类', '辅助与安装工具'];
  
  // 必需字段验证
  if (!data['配件名称'] || data['配件名称'].toString().trim() === '') {
    errors.push('配件名称不能为空');
  }
  
  if (!data['配件类别'] || data['配件类别'].toString().trim() === '') {
    errors.push('配件类别不能为空');
  } else if (!validCategories.includes(data['配件类别'].toString().trim())) {
    errors.push(`配件类别必须是以下之一: ${validCategories.join(', ')}`);
  }
  
  if (!data['价格'] || isNaN(Number(data['价格']))) {
    errors.push('价格必须是有效的数字');
  } else if (Number(data['价格']) < 0) {
    errors.push('价格不能为负数');
  }
  
  // 警告
  if (!data['描述']) {
    warnings.push('建议添加配件描述');
  }
  
  if (!data['制造商']) {
    warnings.push('建议添加制造商信息');
  }
  
  return { errors, warnings };
};

// 解析Excel数据为配件对象
const parseAccessoryData = (row) => {
  const accessoryData = {
    name: row['配件名称']?.toString().trim(),
    category: row['配件类别']?.toString().trim(),
    price: Number(row['价格']),
    description: row['描述']?.toString().trim() || '',
    manufacturer: row['制造商']?.toString().trim() || '',
    model_number: row['型号']?.toString().trim() || '',
    specifications: new Map(),
    compatibility_rules: {}
  };
  
  // 解析库存信息
  if (row['库存数量'] || row['是否可用'] || row['交货期']) {
    accessoryData.stock_info = {
      quantity: Number(row['库存数量']) || 0,
      available: row['是否可用']?.toString().trim() === '是',
      lead_time: row['交货期']?.toString().trim() || '7-14天'
    };
  }
  
  // 解析规格（所有以"规格_"开头的列）
  Object.keys(row).forEach(key => {
    if (key.startsWith('规格_') && row[key]) {
      const specName = key.replace('规格_', '');
      accessoryData.specifications.set(specName, row[key].toString().trim());
    }
  });
  
  // 解析兼容性规则
  if (row['兼容机身尺寸']) {
    const sizes = row['兼容机身尺寸'].toString().split(',').map(s => s.trim()).filter(s => s);
    if (sizes.length > 0) {
      accessoryData.compatibility_rules.body_sizes = sizes;
    }
  }
  
  if (row['兼容作用类型']) {
    const types = row['兼容作用类型'].toString().split(',').map(t => t.trim()).filter(t => t);
    if (types.length > 0) {
      accessoryData.compatibility_rules.action_types = types;
    }
  }
  
  return accessoryData;
};

// @desc    Excel批量上传配件
// @route   POST /api/accessories/upload
// @access  Private (Administrator only)
exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传Excel文件'
      });
    }
    
    // 读取Excel文件
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    // 删除上传的临时文件
    fs.unlinkSync(req.file.path);
    
    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel文件为空或格式不正确'
      });
    }
    
    // 验证数据
    const validationResults = {
      total_rows: data.length,
      valid_rows: 0,
      invalid_rows: 0,
      valid_data: [],
      invalid_data: [],
      warnings: []
    };
    
    data.forEach((row, index) => {
      const validation = validateAccessoryData(row, index + 2); // +2 因为Excel从1开始，且有标题行
      
      if (validation.errors.length > 0) {
        validationResults.invalid_rows++;
        validationResults.invalid_data.push({
          row: index + 2,
          data: row,
          errors: validation.errors
        });
      } else {
        validationResults.valid_rows++;
        const accessoryData = parseAccessoryData(row);
        validationResults.valid_data.push({
          row: index + 2,
          data: accessoryData,
          warnings: validation.warnings
        });
        
        if (validation.warnings.length > 0) {
          validationResults.warnings.push({
            row: index + 2,
            warnings: validation.warnings
          });
        }
      }
    });
    
    // 如果有无效数据，返回验证报告
    if (validationResults.invalid_rows > 0) {
      return res.status(400).json({
        success: false,
        message: `数据验证失败：${validationResults.invalid_rows} 行数据有错误`,
        validation_report: validationResults
      });
    }
    
    // 导入数据到数据库
    const importResults = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    
    for (const item of validationResults.valid_data) {
      try {
        // 检查是否已存在（根据名称和类别）
        const existing = await Accessory.findOne({
          name: item.data.name,
          category: item.data.category
        });
        
        if (existing) {
          // 更新现有配件
          await Accessory.findByIdAndUpdate(existing._id, item.data, {
            new: true,
            runValidators: true
          });
          importResults.success++;
        } else {
          // 创建新配件
          await Accessory.create(item.data);
          importResults.success++;
        }
      } catch (error) {
        importResults.failed++;
        importResults.errors.push({
          row: item.row,
          name: item.data.name,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Excel文件导入完成',
      validation_report: {
        total_rows: validationResults.total_rows,
        valid_rows: validationResults.valid_rows,
        invalid_rows: validationResults.invalid_rows,
        warnings_count: validationResults.warnings.length
      },
      import_results: importResults,
      summary: {
        total: data.length,
        validated: validationResults.valid_rows,
        imported: importResults.success,
        failed: importResults.failed,
        skipped: importResults.skipped
      }
    });
    
  } catch (error) {
    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Excel文件处理失败',
      error: error.message
    });
  }
};
