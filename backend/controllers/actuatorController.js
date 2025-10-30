const Actuator = require('../models/Actuator');
const xlsx = require('xlsx');
const fs = require('fs');
const { validateActuatorData, validateBatch, generateValidationReport } = require('../services/validationService');

// @desc    获取所有执行器
// @route   GET /api/actuators
// @access  Private
exports.getActuators = async (req, res) => {
  try {
    const { body_size, action_type, is_active, min_price, max_price, page = 1, limit = 10 } = req.query;
    
    // 构建查询条件
    let query = {};
    
    if (body_size) query.body_size = body_size.toUpperCase();
    if (action_type) query.action_type = action_type.toUpperCase();
    if (is_active !== undefined) query.is_active = is_active === 'true';
    
    // 价格范围过滤
    if (min_price || max_price) {
      query.base_price = {};
      if (min_price) query.base_price.$gte = Number(min_price);
      if (max_price) query.base_price.$lte = Number(max_price);
    }
    
    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const actuators = await Actuator.find(query)
      .sort({ body_size: 1, action_type: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // 获取总数
    const total = await Actuator.countDocuments(query);
    
    res.json({
      success: true,
      data: actuators,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取执行器列表失败',
      error: error.message
    });
  }
};

// @desc    根据ID获取单个执行器
// @route   GET /api/actuators/:id
// @access  Private
exports.getActuatorById = async (req, res) => {
  try {
    const actuator = await Actuator.findById(req.params.id);
    
    if (!actuator) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的执行器'
      });
    }
    
    res.json({
      success: true,
      data: actuator
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取执行器详情失败',
      error: error.message
    });
  }
};

// @desc    创建新执行器
// @route   POST /api/actuators
// @access  Private/Admin
exports.createActuator = async (req, res) => {
  try {
    // 将扭矩数据转换为 Map
    if (req.body.torque_symmetric && typeof req.body.torque_symmetric === 'object') {
      req.body.torque_symmetric = new Map(Object.entries(req.body.torque_symmetric));
    }
    if (req.body.torque_canted && typeof req.body.torque_canted === 'object') {
      req.body.torque_canted = new Map(Object.entries(req.body.torque_canted));
    }
    
    const actuator = await Actuator.create(req.body);
    
    res.status(201).json({
      success: true,
      message: '执行器创建成功',
      data: actuator
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建执行器失败',
      error: error.message
    });
  }
};

// @desc    更新执行器
// @route   PUT /api/actuators/:id
// @access  Private/Admin
exports.updateActuator = async (req, res) => {
  try {
    // 将扭矩数据转换为 Map
    if (req.body.torque_symmetric && typeof req.body.torque_symmetric === 'object') {
      req.body.torque_symmetric = new Map(Object.entries(req.body.torque_symmetric));
    }
    if (req.body.torque_canted && typeof req.body.torque_canted === 'object') {
      req.body.torque_canted = new Map(Object.entries(req.body.torque_canted));
    }
    
    const actuator = await Actuator.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!actuator) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的执行器'
      });
    }
    
    res.json({
      success: true,
      message: '执行器更新成功',
      data: actuator
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新执行器失败',
      error: error.message
    });
  }
};

// @desc    删除执行器（软删除）
// @route   DELETE /api/actuators/:id
// @access  Private/Admin
exports.deleteActuator = async (req, res) => {
  try {
    const actuator = await Actuator.findById(req.params.id);
    
    if (!actuator) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的执行器'
      });
    }
    
    // 软删除：将 is_active 设置为 false
    actuator.is_active = false;
    await actuator.save();
    
    res.json({
      success: true,
      message: '执行器已停用'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除执行器失败',
      error: error.message
    });
  }
};

// @desc    根据扭矩要求查找合适的执行器
// @route   POST /api/actuators/find-by-torque
// @access  Private
exports.findByTorque = async (req, res) => {
  try {
    const { required_torque, pressure, angle, yoke_type = 'symmetric' } = req.body;
    
    // 验证必需参数
    if (!required_torque || !pressure || angle === undefined) {
      return res.status(400).json({
        success: false,
        message: '请提供所需扭矩、压力和角度'
      });
    }
    
    const suitable = await Actuator.findByTorqueRequirement(
      required_torque,
      pressure,
      angle,
      yoke_type
    );
    
    // 为每个结果添加实际扭矩值
    const results = suitable.map(actuator => {
      // 转换键格式：0.3 -> 0_3 (去掉小数点，用下划线替换)
      const pressureKey = String(pressure).replace('.', '_');
      const key = `${pressureKey}_${angle}`;
      const torqueMap = yoke_type === 'symmetric' ? actuator.torque_symmetric : actuator.torque_canted;
      const actualTorque = torqueMap.get(key);
      
      return {
        actuator: actuator.toJSON(),
        actual_torque: actualTorque,
        margin: actualTorque ? ((actualTorque - required_torque) / required_torque * 100).toFixed(2) : 0,
        recommendation: actualTorque && actualTorque < required_torque * 1.5 ? '推荐' : '可选'
      };
    });
    
    res.json({
      success: true,
      count: results.length,
      search_criteria: {
        required_torque,
        pressure,
        angle,
        yoke_type
      },
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查找执行器失败',
      error: error.message
    });
  }
};

// @desc    批量导入执行器
// @route   POST /api/actuators/bulk-import
// @access  Private/Admin
exports.bulkImport = async (req, res) => {
  try {
    const { actuators } = req.body;
    
    if (!Array.isArray(actuators) || actuators.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供执行器数据数组'
      });
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < actuators.length; i++) {
      try {
        const actuatorData = actuators[i];
        
        // 转换扭矩数据
        if (actuatorData.torque_symmetric) {
          actuatorData.torque_symmetric = new Map(Object.entries(actuatorData.torque_symmetric));
        }
        if (actuatorData.torque_canted) {
          actuatorData.torque_canted = new Map(Object.entries(actuatorData.torque_canted));
        }
        
        await Actuator.create(actuatorData);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          index: i,
          data: actuators[i].model_base,
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
// @route   POST /api/actuators/upload
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
      // 删除上传的文件
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'Excel文件为空'
      });
    }

    // 转换Excel数据为模型格式
    const formattedData = rawData.map(row => {
      const actuatorData = {
        model_base: row.model_base || row['型号基础'] || row['型号'],
        body_size: row.body_size || row['本体尺寸'],
        action_type: row.action_type || row['作用类型'],
        base_price: parseFloat(row.base_price || row['基础价格'] || row['价格']),
        description: row.description || row['描述'] || '',
        is_active: row.is_active !== undefined ? row.is_active : true
      };

      // 处理扭矩数据（可以是JSON字符串或对象）
      if (row.torque_symmetric) {
        try {
          actuatorData.torque_symmetric = typeof row.torque_symmetric === 'string' 
            ? JSON.parse(row.torque_symmetric) 
            : row.torque_symmetric;
        } catch (e) {
          actuatorData.torque_symmetric = {};
        }
      }

      if (row.torque_canted) {
        try {
          actuatorData.torque_canted = typeof row.torque_canted === 'string' 
            ? JSON.parse(row.torque_canted) 
            : row.torque_canted;
        } catch (e) {
          actuatorData.torque_canted = {};
        }
      }

      // 处理规格数据
      if (row.specifications || row['规格']) {
        try {
          const specs = row.specifications || row['规格'];
          actuatorData.specifications = typeof specs === 'string' ? JSON.parse(specs) : specs;
        } catch (e) {
          actuatorData.specifications = {};
        }
      }

      // 处理库存信息
      if (row.stock_info || row['库存信息']) {
        try {
          const stock = row.stock_info || row['库存信息'];
          actuatorData.stock_info = typeof stock === 'string' ? JSON.parse(stock) : stock;
        } catch (e) {
          actuatorData.stock_info = {};
        }
      }

      return actuatorData;
    });

    // 验证所有数据
    const validationResults = validateBatch(formattedData, validateActuatorData);
    const report = generateValidationReport(validationResults);

    // 如果有无效数据，返回验证报告但不导入
    if (validationResults.invalid.length > 0) {
      // 删除上传的文件
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
        const actuatorData = item.data;
        
        // 检查是否已存在
        const existing = await Actuator.findOne({ model_base: actuatorData.model_base });
        
        if (existing) {
          // 可以选择跳过或更新
          if (req.query.update_existing === 'true') {
            // 转换扭矩数据为Map
            if (actuatorData.torque_symmetric) {
              actuatorData.torque_symmetric = new Map(Object.entries(actuatorData.torque_symmetric));
            }
            if (actuatorData.torque_canted) {
              actuatorData.torque_canted = new Map(Object.entries(actuatorData.torque_canted));
            }
            
            await Actuator.findByIdAndUpdate(existing._id, actuatorData);
            importResults.success++;
          } else {
            importResults.skipped++;
          }
        } else {
          // 转换扭矩数据为Map
          if (actuatorData.torque_symmetric) {
            actuatorData.torque_symmetric = new Map(Object.entries(actuatorData.torque_symmetric));
          }
          if (actuatorData.torque_canted) {
            actuatorData.torque_canted = new Map(Object.entries(actuatorData.torque_canted));
          }
          
          await Actuator.create(actuatorData);
          importResults.success++;
        }
      } catch (error) {
        importResults.failed++;
        importResults.errors.push({
          row: item.rowIndex,
          model: item.data.model_base,
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
    // 清理上传的文件
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
// @route   GET /api/actuators/template
// @access  Private/Admin
exports.downloadTemplate = (req, res) => {
  try {
    // 创建示例数据
    const templateData = [
      {
        model_base: 'SF10-150DA',
        body_size: 'SF10',
        action_type: 'DA',
        base_price: 5000,
        torque_symmetric: '{"0_3_0":309,"0_4_0":412,"0_5_0":515}',
        torque_canted: '{"0_3_0":417,"0_4_0":556,"0_5_0":695}',
        specifications: '{"pressure_range":{"min":2,"max":8},"temperature_range":{"min":-20,"max":80},"rotation_angle":90,"weight":12.5}',
        description: 'SF10 双作用气动执行器',
        is_active: true
      }
    ];

    // 创建工作簿
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(templateData);
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 15 }, // model_base
      { wch: 12 }, // body_size
      { wch: 12 }, // action_type
      { wch: 12 }, // base_price
      { wch: 40 }, // torque_symmetric
      { wch: 40 }, // torque_canted
      { wch: 60 }, // specifications
      { wch: 30 }, // description
      { wch: 10 }  // is_active
    ];
    
    xlsx.utils.book_append_sheet(wb, ws, '执行器数据');
    
    // 生成Buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename="actuator_template.xlsx"');
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

// @desc    获取产品版本历史
// @route   GET /api/actuators/:id/versions
// @access  Private
exports.getVersionHistory = async (req, res) => {
  try {
    const versions = [];
    let currentActuator = await Actuator.findById(req.params.id);
    
    if (!currentActuator) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }
    
    // 向前追溯版本历史（从当前到最早）
    while (currentActuator) {
      versions.push(currentActuator);
      if (!currentActuator.parent_id) break;
      currentActuator = await Actuator.findById(currentActuator.parent_id);
    }
    
    // 反转数组，使最早版本在前
    versions.reverse();
    
    res.status(200).json({
      success: true,
      count: versions.length,
      data: versions
    });
  } catch (error) {
    console.error('Get version history error:', error);
    res.status(500).json({
      success: false,
      message: '获取版本历史失败',
      error: error.message
    });
  }
};

// @desc    创建新版本
// @route   POST /api/actuators/:id/new-version
// @access  Private/Admin
exports.createNewVersion = async (req, res) => {
  try {
    const parentActuator = await Actuator.findById(req.params.id);
    
    if (!parentActuator) {
      return res.status(404).json({
        success: false,
        message: '父版本产品不存在'
      });
    }
    
    // 复制父版本的数据
    const newActuatorData = {
      ...parentActuator.toObject(),
      _id: undefined,
      parent_id: parentActuator._id,
      version: req.body.version || '2.0',
      version_notes: req.body.version_notes,
      status: '设计中',
      release_date: null,
      discontinue_date: null,
      eco_references: [],
      createdAt: undefined,
      updatedAt: undefined
    };
    
    // 如果提供了新数据，覆盖
    if (req.body.updates) {
      Object.assign(newActuatorData, req.body.updates);
    }
    
    const newActuator = await Actuator.create(newActuatorData);
    
    res.status(201).json({
      success: true,
      message: '新版本创建成功',
      data: newActuator
    });
  } catch (error) {
    console.error('Create new version error:', error);
    res.status(400).json({
      success: false,
      message: '创建新版本失败',
      error: error.message
    });
  }
};

