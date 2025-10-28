const ManualOverride = require('../models/ManualOverride');
const xlsx = require('xlsx');
const fs = require('fs');
const { validateManualOverrideData, validateBatch, generateValidationReport } = require('../services/validationService');

// @desc    获取所有手动操作装置
// @route   GET /api/manual-overrides
// @access  Private
exports.getManualOverrides = async (req, res) => {
  try {
    const { operation_type, is_active, compatible_with } = req.query;
    
    let query = {};
    
    if (operation_type) {
      query['specifications.operation_type'] = operation_type;
    }
    
    if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }
    
    // 查找兼容指定本体尺寸的装置
    if (compatible_with) {
      query.compatible_body_sizes = compatible_with.toUpperCase();
    }
    
    const overrides = await ManualOverride.find(query).sort({ model: 1 });
    
    res.json({
      success: true,
      count: overrides.length,
      data: overrides
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取手动操作装置列表失败',
      error: error.message
    });
  }
};

// @desc    根据ID获取单个手动操作装置
// @route   GET /api/manual-overrides/:id
// @access  Private
exports.getManualOverrideById = async (req, res) => {
  try {
    const override = await ManualOverride.findById(req.params.id);
    
    if (!override) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的手动操作装置'
      });
    }
    
    res.json({
      success: true,
      data: override
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取手动操作装置详情失败',
      error: error.message
    });
  }
};

// @desc    创建新手动操作装置
// @route   POST /api/manual-overrides
// @access  Private/Admin
exports.createManualOverride = async (req, res) => {
  try {
    const override = await ManualOverride.create(req.body);
    
    res.status(201).json({
      success: true,
      message: '手动操作装置创建成功',
      data: override
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建手动操作装置失败',
      error: error.message
    });
  }
};

// @desc    更新手动操作装置
// @route   PUT /api/manual-overrides/:id
// @access  Private/Admin
exports.updateManualOverride = async (req, res) => {
  try {
    const override = await ManualOverride.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!override) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的手动操作装置'
      });
    }
    
    res.json({
      success: true,
      message: '手动操作装置更新成功',
      data: override
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新手动操作装置失败',
      error: error.message
    });
  }
};

// @desc    删除手动操作装置（软删除）
// @route   DELETE /api/manual-overrides/:id
// @access  Private/Admin
exports.deleteManualOverride = async (req, res) => {
  try {
    const override = await ManualOverride.findById(req.params.id);
    
    if (!override) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的手动操作装置'
      });
    }
    
    override.is_active = false;
    await override.save();
    
    res.json({
      success: true,
      message: '手动操作装置已停用'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除手动操作装置失败',
      error: error.message
    });
  }
};

// @desc    查找兼容指定本体尺寸的手动操作装置
// @route   GET /api/manual-overrides/compatible/:bodySize
// @access  Private
exports.findCompatible = async (req, res) => {
  try {
    const { bodySize } = req.params;
    
    const compatible = await ManualOverride.findCompatible(bodySize);
    
    res.json({
      success: true,
      body_size: bodySize.toUpperCase(),
      count: compatible.length,
      data: compatible
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查找兼容装置失败',
      error: error.message
    });
  }
};

// @desc    批量查找兼容多个本体尺寸的手动操作装置
// @route   POST /api/manual-overrides/compatible-multiple
// @access  Private
exports.findCompatibleForMultiple = async (req, res) => {
  try {
    const { body_sizes } = req.body;
    
    if (!Array.isArray(body_sizes) || body_sizes.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供本体尺寸数组'
      });
    }
    
    const compatible = await ManualOverride.findCompatibleForMultiple(body_sizes);
    
    // 按本体尺寸分组结果
    const groupedResults = {};
    body_sizes.forEach(size => {
      groupedResults[size.toUpperCase()] = compatible.filter(override => 
        override.compatible_body_sizes.includes(size.toUpperCase())
      );
    });
    
    res.json({
      success: true,
      body_sizes: body_sizes.map(s => s.toUpperCase()),
      total_found: compatible.length,
      grouped_results: groupedResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量查找兼容装置失败',
      error: error.message
    });
  }
};

// @desc    批量导入手动操作装置
// @route   POST /api/manual-overrides/bulk-import
// @access  Private/Admin
exports.bulkImport = async (req, res) => {
  try {
    const { overrides } = req.body;
    
    if (!Array.isArray(overrides) || overrides.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供手动操作装置数据数组'
      });
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < overrides.length; i++) {
      try {
        await ManualOverride.create(overrides[i]);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          index: i,
          data: overrides[i].model,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: '批量导入完成',
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量导入失败',
      error: error.message
    });
  }
};

// @desc    Excel文件上传和解析
// @route   POST /api/manual-overrides/upload
// @access  Private/Admin
exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传Excel文件'
      });
    }

    const filePath = req.file.path;
    
    // 读取Excel文件
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 将Excel数据转换为JSON
    const rawData = xlsx.utils.sheet_to_json(worksheet);
    
    if (rawData.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'Excel文件为空'
      });
    }

    // 转换Excel数据为模型格式
    const formattedData = rawData.map(row => {
      const overrideData = {
        model: row.model || row['型号'],
        name: row.name || row['名称'],
        price: parseFloat(row.price || row['价格']),
        compatible_body_sizes: [],
        description: row.description || row['描述'] || '',
        application: row.application || row['应用'] || '',
        is_active: row.is_active !== undefined ? row.is_active : true
      };

      // 处理兼容尺寸（可以是逗号分隔的字符串或数组）
      if (row.compatible_body_sizes || row['兼容尺寸']) {
        const sizes = row.compatible_body_sizes || row['兼容尺寸'];
        if (typeof sizes === 'string') {
          overrideData.compatible_body_sizes = sizes.split(',').map(s => s.trim());
        } else if (Array.isArray(sizes)) {
          overrideData.compatible_body_sizes = sizes;
        }
      }

      // 处理规格数据
      if (row.specifications || row['规格']) {
        try {
          const specs = row.specifications || row['规格'];
          overrideData.specifications = typeof specs === 'string' ? JSON.parse(specs) : specs;
        } catch (e) {
          overrideData.specifications = {};
        }
      }

      // 处理尺寸数据
      if (row.dimensions || row['尺寸']) {
        try {
          const dims = row.dimensions || row['尺寸'];
          overrideData.dimensions = typeof dims === 'string' ? JSON.parse(dims) : dims;
        } catch (e) {
          overrideData.dimensions = {};
        }
      }

      // 处理库存信息
      if (row.stock_info || row['库存信息']) {
        try {
          const stock = row.stock_info || row['库存信息'];
          overrideData.stock_info = typeof stock === 'string' ? JSON.parse(stock) : stock;
        } catch (e) {
          overrideData.stock_info = {};
        }
      }

      return overrideData;
    });

    // 验证所有数据
    const validationResults = validateBatch(formattedData, validateManualOverrideData);
    const report = generateValidationReport(validationResults);

    // 如果有无效数据，返回验证报告但不导入
    if (validationResults.invalid.length > 0) {
      fs.unlinkSync(filePath);
      
      return res.status(400).json({
        success: false,
        message: `数据验证失败：${validationResults.invalid.length} 行数据有误`,
        validation_report: report
      });
    }

    // 全部验证通过，开始导入
    const importResults = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    for (const item of validationResults.valid) {
      try {
        const overrideData = item.data;
        
        // 检查是否已存在
        const existing = await ManualOverride.findOne({ model: overrideData.model });
        
        if (existing) {
          if (req.query.update_existing === 'true') {
            await ManualOverride.findByIdAndUpdate(existing._id, overrideData);
            importResults.success++;
          } else {
            importResults.skipped++;
          }
        } else {
          await ManualOverride.create(overrideData);
          importResults.success++;
        }
      } catch (error) {
        importResults.failed++;
        importResults.errors.push({
          row: item.rowIndex,
          model: item.data.model,
          error: error.message
        });
      }
    }

    // 删除上传的文件
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Excel文件导入完成',
      validation_report: report,
      import_results: importResults,
      summary: {
        total_rows: rawData.length,
        validated: validationResults.valid.length,
        imported: importResults.success,
        skipped: importResults.skipped,
        failed: importResults.failed
      }
    });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Excel文件上传失败',
      error: error.message
    });
  }
};

// @desc    下载Excel模板
// @route   GET /api/manual-overrides/template
// @access  Private/Admin
exports.downloadTemplate = (req, res) => {
  try {
    const templateData = [
      {
        model: 'HG',
        name: '手轮装置（标准型）',
        price: 800,
        compatible_body_sizes: 'SF10,SF12,SF14',
        specifications: '{"operation_type":"手轮","gear_ratio":"1:1","output_torque":100,"weight":2.5}',
        dimensions: '{"length":200,"width":200,"height":150}',
        description: '适用于需要手动操作的场合',
        application: '提供紧急手动控制',
        is_active: true
      }
    ];

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(templateData);
    
    ws['!cols'] = [
      { wch: 10 },  // model
      { wch: 25 },  // name
      { wch: 10 },  // price
      { wch: 20 },  // compatible_body_sizes
      { wch: 60 },  // specifications
      { wch: 40 },  // dimensions
      { wch: 30 },  // description
      { wch: 25 },  // application
      { wch: 10 }   // is_active
    ];
    
    xlsx.utils.book_append_sheet(wb, ws, '手动操作装置数据');
    
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename="manual_override_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '模板下载失败',
      error: error.message
    });
  }
};

