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
        series: row.series || row['系列'],
        mechanism: row.mechanism || row['机构类型'],
        valve_type: row.valve_type || row['阀门类型'],
        body_size: row.body_size || row['本体尺寸'],
        cylinder_size: row.cylinder_size ? parseFloat(row.cylinder_size) : undefined,
        action_type: row.action_type || row['作用类型'],
        spring_range: row.spring_range || row['弹簧范围'],
        description: row.description || row['描述'] || '',
        is_active: row.is_active !== undefined ? row.is_active : true
      };
      
      // 价格字段（支持SF和AT/GY系列）
      if (row.base_price_normal || row['常温价格']) {
        actuatorData.base_price_normal = parseFloat(row.base_price_normal || row['常温价格']);
      } else if (row.base_price || row['基础价格'] || row['价格']) {
        actuatorData.base_price_normal = parseFloat(row.base_price || row['基础价格'] || row['价格']);
      }
      
      if (row.base_price_low || row['低温价格']) {
        actuatorData.base_price_low = parseFloat(row.base_price_low || row['低温价格']);
      }
      
      if (row.base_price_high || row['高温价格']) {
        actuatorData.base_price_high = parseFloat(row.base_price_high || row['高温价格']);
      }
      
      // AT/GY系列特有字段
      if (row.manual_override_model || row['手轮型号']) {
        actuatorData.manual_override_model = row.manual_override_model || row['手轮型号'];
      }
      if (row.manual_override_price || row['手轮价格']) {
        actuatorData.manual_override_price = parseFloat(row.manual_override_price || row['手轮价格']);
      }
      if (row.spare_parts_model || row['维修包型号']) {
        actuatorData.spare_parts_model = row.spare_parts_model || row['维修包型号'];
      }
      if (row.spare_parts_price || row['维修包价格']) {
        actuatorData.spare_parts_price = parseFloat(row.spare_parts_price || row['维修包价格']);
      }
      
      // SF系列轮廓尺寸字段
      if (row.L1 || row.L2 || row.m1 || row.m2 || row.A || row.H1 || row.H2 || row.D) {
        actuatorData.dimensions = actuatorData.dimensions || {};
        actuatorData.dimensions.outline = {
          L1: row.L1 ? parseFloat(row.L1) : undefined,
          L2: row.L2 ? parseFloat(row.L2) : undefined,
          m1: row.m1 ? parseFloat(row.m1) : undefined,
          m2: row.m2 ? parseFloat(row.m2) : undefined,
          A: row.A ? parseFloat(row.A) : undefined,
          H1: row.H1 ? parseFloat(row.H1) : undefined,
          H2: row.H2 ? parseFloat(row.H2) : undefined,
          D: row.D ? parseFloat(row.D) : undefined
        };
      }
      
      // SF系列连接法兰字段
      if (row.connect_flange || row['连接法兰']) {
        actuatorData.dimensions = actuatorData.dimensions || {};
        actuatorData.dimensions.flange = actuatorData.dimensions.flange || {};
        actuatorData.dimensions.flange.standard = row.connect_flange || row['连接法兰'];
      }
      
      // AT/GY系列法兰尺寸字段
      if (row.flange_standard || row.flange_D || row.flange_A) {
        actuatorData.dimensions = actuatorData.dimensions || {};
        actuatorData.dimensions.flange = actuatorData.dimensions.flange || {};
        actuatorData.dimensions.flange.standard = actuatorData.dimensions.flange.standard || row.flange_standard || row['法兰标准'];
        actuatorData.dimensions.flange.D = row.flange_D ? parseFloat(row.flange_D) : actuatorData.dimensions.flange.D;
        actuatorData.dimensions.flange.A = row.flange_A ? parseFloat(row.flange_A) : actuatorData.dimensions.flange.A;
        actuatorData.dimensions.flange.C = row.flange_C ? parseFloat(row.flange_C) : actuatorData.dimensions.flange.C;
        actuatorData.dimensions.flange.threadSpec = row.flange_thread || row['法兰螺纹'] || actuatorData.dimensions.flange.threadSpec;
      }
      
      // 气动接口字段（SF系列：G字段，AT/GY系列：pneumatic_size）
      if (row.G || row.pneumatic_size || row['气动接口']) {
        actuatorData.dimensions = actuatorData.dimensions || {};
        actuatorData.dimensions.pneumaticConnection = {
          size: row.G || row.pneumatic_size || row['气动接口']
        };
      }

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
    const { type } = req.query; // 支持通过参数指定模板类型: 'SF' 或 'AT'
    
    let templateData, sheetName, filename;
    
    if (type === 'AT') {
      // AT系列（齿轮齿条式）完整模板
      // 特点：完整的三种温度价格、手轮信息、扭矩数据、法兰尺寸、弹簧范围
      templateData = [
        {
          model_base: 'AT-SR52K8',
          series: 'AT',
          mechanism: 'Rack & Pinion',
          valve_type: 'Ball Valve',
          action_type: 'SR',
          spring_range: 'K8',
          body_size: 'AT-052',
          base_price_normal: 75,
          base_price_low: 77,
          base_price_high: 86,
          manual_override_model: 'SD-1',
          manual_override_price: 127,
          spare_parts_model: '1.5包',
          spare_parts_price: 1.5,
          flange_standard: 'F05/φ50/4-M6',
          flange_D: 50,
          flange_A: 36,
          flange_C: 30,
          flange_thread: '4-M6',
          pneumatic_size: 'G1/4"',
          description: '单作用铝合金齿轮齿条式 AT-052'
        },
        {
          model_base: 'AT-DA52',
          series: 'AT',
          mechanism: 'Rack & Pinion',
          valve_type: 'Ball Valve',
          action_type: 'DA',
          spring_range: '',
          body_size: 'AT-052',
          base_price_normal: 64,
          base_price_low: 66,
          base_price_high: 76,
          manual_override_model: 'SD-1',
          manual_override_price: 127,
          spare_parts_model: '1.5包',
          spare_parts_price: 1.5,
          flange_standard: 'F05/φ50/4-M6',
          flange_D: 50,
          flange_A: 36,
          flange_C: 30,
          flange_thread: '4-M6',
          pneumatic_size: 'G1/4"',
          description: '双作用铝合金齿轮齿条式 AT-052'
        }
      ];
      sheetName = 'AT系列执行器';
      filename = 'actuator_template_AT.xlsx';
    } else if (type === 'GY') {
      // GY系列（齿轮齿条式）简化模板
      // 特点：只有基本价格，无低温/高温价格，无扭矩数据
      templateData = [
        {
          model_base: 'GY-52SR',
          series: 'GY',
          mechanism: 'Rack & Pinion',
          valve_type: 'Ball Valve',
          action_type: 'SR',
          body_size: 'GY-052',
          base_price_normal: 770,
          flange_standard: 'F05/φ50/4-M6',
          flange_D: 50,
          flange_A: 36,
          flange_C: 30,
          flange_thread: '4-M6',
          pneumatic_size: 'G1/4"',
          description: '单作用正作用用&反作用/齿轮齿条式/行程90°'
        },
        {
          model_base: 'GY-52',
          series: 'GY',
          mechanism: 'Rack & Pinion',
          valve_type: 'Ball Valve',
          action_type: 'DA',
          body_size: 'GY-052',
          base_price_normal: 740,
          flange_standard: 'F05/φ50/4-M6',
          flange_D: 50,
          flange_A: 36,
          flange_C: 30,
          flange_thread: '4-M6',
          pneumatic_size: 'G1/4"',
          description: '双作用/齿轮齿条式/行程90°'
        }
      ];
      sheetName = 'GY系列执行器';
      filename = 'actuator_template_GY.xlsx';
    } else {
      // SF系列（拨叉式）默认模板 - 包含温度价格计算说明
      templateData = [
        {
          model_base: 'SF10-150DA',
          series: 'SF',
          mechanism: 'Scotch Yoke',
          valve_type: 'Ball Valve',
          body_size: 'SF10',
          cylinder_size: 150,
          action_type: 'DA',
          spring_range: '',
          base_price: 1339,
          base_price_normal: 1339,
          base_price_low: '可选，不填则自动计算为常温价格×1.05',
          base_price_high: '可选，不填则自动计算为常温价格×1.05',
          torque_symmetric: '{"0.3_0":309,"0.3_45":185,"0.3_90":309,"0.4_0":412,"0.4_45":247,"0.4_90":412,"0.5_0":515,"0.5_45":309,"0.5_90":515,"0.6_0":618,"0.6_45":371,"0.6_90":618}',
          torque_canted: '{"0.3_0":417,"0.3_45":200,"0.3_90":282,"0.4_0":556,"0.4_45":267,"0.4_90":376,"0.5_0":695,"0.5_45":333,"0.5_90":470,"0.6_0":834,"0.6_45":400,"0.6_90":564}',
          connect_flange: 'ISO 5211 F10',
          L1: 350,
          L2: 127,
          m1: 76,
          m2: 143.5,
          A: 40,
          H1: 82,
          H2: 100,
          D: 207,
          G: 'NPT1/4"',
          description: 'SF系列拨叉式/双作用/球阀对称拨叉'
        },
        {
          model_base: 'SF10-150SR3',
          series: 'SF',
          mechanism: 'Scotch Yoke',
          valve_type: 'Ball Valve',
          body_size: 'SF10',
          cylinder_size: 150,
          action_type: 'SR',
          spring_range: 'SR3',
          base_price: 1716,
          base_price_normal: 1716,
          base_price_low: 1802,
          base_price_high: 1802,
          torque_symmetric: '{"sst":187,"srt":91,"set":118,"ast_0.3":183,"art_0.3":89,"aet_0.3":115,"ast_0.4":293,"art_0.4":155,"aet_0.4":225,"ast_0.5":396,"art_0.5":217,"aet_0.5":328}',
          torque_canted: '{"sst":162,"srt":100,"set":152,"ast_0.3":260,"art_0.3":100,"aet_0.3":113,"ast_0.4":399,"art_0.4":167,"aet_0.4":207,"ast_0.5":538,"art_0.5":234,"aet_0.5":301}',
          connect_flange: 'ISO 5211 F10',
          L1: 350,
          L2: 467,
          m1: 76,
          m2: 143.5,
          A: 40,
          H1: 82,
          H2: 100,
          D: 207,
          G: 'NPT1/4"',
          description: 'SF系列拨叉式/单作用/球阀对称拨叉'
        }
      ];
      sheetName = 'SF系列执行器';
      filename = 'actuator_template_SF.xlsx';
    }

    // 创建工作簿
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(templateData);
    
    // 根据模板类型设置不同的列宽
    if (type === 'AT') {
      // AT系列：完整字段（包含三种价格、手轮、维修包、弹簧范围）
      ws['!cols'] = [
        { wch: 15 }, // model_base
        { wch: 10 }, // series
        { wch: 15 }, // mechanism
        { wch: 15 }, // valve_type
        { wch: 12 }, // action_type
        { wch: 15 }, // spring_range
        { wch: 12 }, // body_size
        { wch: 15 }, // base_price_normal
        { wch: 15 }, // base_price_low
        { wch: 15 }, // base_price_high
        { wch: 20 }, // manual_override_model
        { wch: 20 }, // manual_override_price
        { wch: 18 }, // spare_parts_model
        { wch: 18 }, // spare_parts_price
        { wch: 20 }, // flange_standard
        { wch: 12 }, // flange_D
        { wch: 12 }, // flange_A
        { wch: 12 }, // flange_C
        { wch: 15 }, // flange_thread
        { wch: 15 }, // pneumatic_size
        { wch: 35 }  // description
      ];
    } else if (type === 'GY') {
      // GY系列：简化字段（只有基本价格，无手轮、维修包）
      ws['!cols'] = [
        { wch: 15 }, // model_base
        { wch: 10 }, // series
        { wch: 15 }, // mechanism
        { wch: 15 }, // valve_type
        { wch: 12 }, // action_type
        { wch: 12 }, // body_size
        { wch: 15 }, // base_price_normal
        { wch: 20 }, // flange_standard
        { wch: 12 }, // flange_D
        { wch: 12 }, // flange_A
        { wch: 12 }, // flange_C
        { wch: 15 }, // flange_thread
        { wch: 15 }, // pneumatic_size
        { wch: 40 }  // description
      ];
    } else {
      ws['!cols'] = [
        { wch: 18 }, // model_base
        { wch: 10 }, // series
        { wch: 15 }, // mechanism
        { wch: 15 }, // valve_type
        { wch: 12 }, // body_size
        { wch: 15 }, // cylinder_size
        { wch: 12 }, // action_type
        { wch: 15 }, // spring_range
        { wch: 12 }, // base_price
        { wch: 15 }, // base_price_normal
        { wch: 40 }, // base_price_low
        { wch: 40 }, // base_price_high
        { wch: 80 }, // torque_symmetric
        { wch: 80 }, // torque_canted
        { wch: 18 }, // connect_flange
        { wch: 8 },  // L1
        { wch: 8 },  // L2
        { wch: 8 },  // m1
        { wch: 8 },  // m2
        { wch: 8 },  // A
        { wch: 8 },  // H1
        { wch: 8 },  // H2
        { wch: 8 },  // D
        { wch: 12 }, // G
        { wch: 40 }  // description
      ];
    }
    
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
    
    // 生成Buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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

