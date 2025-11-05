const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
exports.getProducts = async (req, res) => {
  try {
    const { 
      category, 
      minTorque, 
      maxTorque, 
      minPressure, 
      maxPressure, 
      rotation,
      mountingType,
      search,
      isActive 
    } = req.query;

    // Build query
    let query = {};

    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (rotation) query['specifications.rotation'] = rotation;
    if (mountingType) query['specifications.mountingType'] = mountingType;

    // Torque range filter
    if (minTorque || maxTorque) {
      query['specifications.torque.value'] = {};
      if (minTorque) query['specifications.torque.value'].$gte = Number(minTorque);
      if (maxTorque) query['specifications.torque.value'].$lte = Number(maxTorque);
    }

    // Pressure range filter
    if (minPressure || maxPressure) {
      query['specifications.pressure.operating'] = {};
      if (minPressure) query['specifications.pressure.operating'].$gte = Number(minPressure);
      if (maxPressure) query['specifications.pressure.operating'].$lte = Number(maxPressure);
    }

    // Search by model number or description
    if (search) {
      query.$or = [
        { modelNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('compatibleAccessories')
      .sort({ modelNumber: 1 });

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('compatibleAccessories');

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // Soft delete - mark as inactive
      product.isActive = false;
      await product.save();
      res.json({ message: 'Product deactivated successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search products by technical requirements (Selection Engine)
// @route   POST /api/products/search
// @access  Private
exports.searchProducts = async (req, res) => {
  try {
    const {
      requiredTorque,
      operatingPressure,
      rotation,
      minTemperature,
      maxTemperature,
      mountingType,
      preferredCategory
    } = req.body;

    let query = { isActive: true };
    let scoredProducts = [];

    // Get all active products
    const products = await Product.find(query).populate('compatibleAccessories');

    // Score each product based on requirements
    products.forEach(product => {
      let score = 0;
      let matchDetails = {
        torqueMatch: false,
        pressureMatch: false,
        rotationMatch: false,
        temperatureMatch: false,
        mountingMatch: false
      };

      // Torque matching (most important)
      if (requiredTorque) {
        const torqueValue = product.specifications.torque.value;
        const torqueMin = product.specifications.torque.min || torqueValue * 0.8;
        const torqueMax = product.specifications.torque.max || torqueValue * 1.2;
        
        if (requiredTorque >= torqueMin && requiredTorque <= torqueMax) {
          score += 40;
          matchDetails.torqueMatch = true;
        } else if (requiredTorque < torqueValue * 1.5 && requiredTorque > torqueValue * 0.5) {
          score += 20; // Partial match
        }
      }

      // Pressure matching
      if (operatingPressure) {
        const pressureMin = product.specifications.pressure.min;
        const pressureMax = product.specifications.pressure.max;
        
        if (operatingPressure >= pressureMin && operatingPressure <= pressureMax) {
          score += 25;
          matchDetails.pressureMatch = true;
        }
      }

      // Rotation matching
      if (rotation && product.specifications.rotation === rotation) {
        score += 15;
        matchDetails.rotationMatch = true;
      }

      // Temperature matching
      if (minTemperature !== undefined && maxTemperature !== undefined) {
        const tempMin = product.specifications.temperature.min;
        const tempMax = product.specifications.temperature.max;
        
        if (minTemperature >= tempMin && maxTemperature <= tempMax) {
          score += 10;
          matchDetails.temperatureMatch = true;
        }
      }

      // Mounting type matching
      if (mountingType && product.specifications.mountingType === mountingType) {
        score += 5;
        matchDetails.mountingMatch = true;
      }

      // Category preference
      if (preferredCategory && product.category === preferredCategory) {
        score += 5;
      }

      // Only include products with minimum score
      if (score >= 40) {
        scoredProducts.push({
          product,
          score,
          matchDetails,
          recommendation: score >= 80 ? 'Excellent Match' : score >= 60 ? 'Good Match' : 'Acceptable Match'
        });
      }
    });

    // Sort by score (highest first)
    scoredProducts.sort((a, b) => b.score - a.score);

    res.json({
      count: scoredProducts.length,
      searchCriteria: req.body,
      results: scoredProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product import template
// @route   GET /api/products/template
// @access  Private/Admin/Technical Engineer
exports.getProductTemplate = async (req, res) => {
  try {
    const XLSX = require('xlsx');
    
    // Create template with headers and sample data
    const template = [
      {
        'modelNumber': 'SF-100',
        'series': 'SF-Series',
        'description': '标准气动执行器示例',
        'category': 'Standard',
        'torqueValue': 100,
        'torqueMin': 80,
        'torqueMax': 120,
        'operatingPressure': 6,
        'pressureMin': 4,
        'pressureMax': 8,
        'rotation': '90°',
        'tempMin': -20,
        'tempMax': 80,
        'length': 150,
        'width': 100,
        'height': 120,
        'weight': 2.5,
        'portSize': 'G1/4',
        'mountingType': 'ISO5211',
        'materialBody': 'Aluminum Alloy',
        'materialPiston': 'Aluminum Alloy',
        'materialSeal': 'NBR',
        'cycleLife': 1000000,
        // 🔧 阀门连接尺寸 - 法兰尺寸
        'flangeStandard': 'ISO 5211 F07',
        'flangeD': 70,
        'flangeA': 36,
        'flangeC': 50,
        'flangeF': 30,
        'flangeThreadSpec': '4-M8',
        'flangeThreadDepth': 16,
        // 🔧 阀门连接尺寸 - 气动连接
        'pneumaticSize': 'NPT1/4"',
        'pneumaticH2': 20,
        // 🔧 阀门连接尺寸 - 顶部安装
        'topMountingStandard': 'NAMUR VDI/VDE 3845',
        'topMountingL': 50,
        'topMountingH1': 80,
        'topMountingH': 100,
        'basePrice': 450.00,
        'currency': 'USD',
        'inStock': true,
        'leadTime': 14,
        'tags': 'standard,compact',
        'notes': '示例产品数据'
      },
      {
        'modelNumber': 'SF-200',
        'series': 'SF-Series',
        'description': '高扭矩气动执行器示例',
        'category': 'High Torque',
        'torqueValue': 200,
        'torqueMin': 160,
        'torqueMax': 240,
        'operatingPressure': 6,
        'pressureMin': 4,
        'pressureMax': 8,
        'rotation': '90°',
        'tempMin': -20,
        'tempMax': 80,
        'length': 180,
        'width': 120,
        'height': 140,
        'weight': 3.8,
        'portSize': 'G3/8',
        'mountingType': 'ISO5211',
        'materialBody': 'Aluminum Alloy',
        'materialPiston': 'Aluminum Alloy',
        'materialSeal': 'NBR',
        'cycleLife': 1000000,
        // 🔧 阀门连接尺寸 - 法兰尺寸
        'flangeStandard': 'ISO 5211 F10',
        'flangeD': 100,
        'flangeA': 50,
        'flangeC': 70,
        'flangeF': 40,
        'flangeThreadSpec': '4-M10',
        'flangeThreadDepth': 18,
        // 🔧 阀门连接尺寸 - 气动连接
        'pneumaticSize': 'NPT1/4"',
        'pneumaticH2': 25,
        // 🔧 阀门连接尺寸 - 顶部安装
        'topMountingStandard': 'NAMUR VDI/VDE 3845',
        'topMountingL': 60,
        'topMountingH1': 100,
        'topMountingH': 120,
        'basePrice': 680.00,
        'currency': 'USD',
        'inStock': true,
        'leadTime': 14,
        'tags': 'high-torque,heavy-duty',
        'notes': '示例产品数据'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '产品导入模板');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=product_import_template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({ 
      success: false,
      message: '模板生成失败: ' + error.message 
    });
  }
};

// @desc    Bulk import products from Excel file
// @route   POST /api/products/import
// @access  Private/Admin/Technical Engineer
exports.bulkImportProducts = async (req, res) => {
  try {
    // 支持单文件或多文件上传
    const files = req.files || (req.file ? [req.file] : []);
    
    if (files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: '请上传Excel文件' 
      });
    }

    const XLSX = require('xlsx');
    
    const results = {
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      errors: [],
      skipped: []
    };

    // Process each file
    for (const file of files) {
      try {
        // Parse Excel file from buffer
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const rows = XLSX.utils.sheet_to_json(worksheet);

        if (rows.length === 0) {
          results.errors.push(`文件 ${file.originalname}: 没有数据`);
          results.errorCount++;
          continue;
        }

        // Process each row
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNumber = i + 2; // Excel row number (accounting for header)

          try {
            // Validate required fields - 只有型号是必填的
            if (!row.modelNumber && !row['Model Number'] && !row['型号']) {
              results.errors.push(`${file.originalname} 第${rowNumber}行: 缺少必填字段"型号"（列名可以是：modelNumber、Model Number 或 型号）`);
              results.errorCount++;
              continue;
            }

            // 获取型号（支持多种列名）
            const modelNumber = (row.modelNumber || row['Model Number'] || row['型号']).toString().trim().toUpperCase();

            // Check if product already exists
            const existingProduct = await Product.findOne({ 
              modelNumber: modelNumber
            });

            if (existingProduct) {
              results.skipped.push(`${file.originalname} 第${rowNumber}行: 产品 ${modelNumber} 已存在，已跳过`);
              results.skippedCount++;
              continue;
            }

            // Build product object - 所有字段都是可选的（除了型号）
            const productData = {
              modelNumber: modelNumber,
              series: row.series || row['Series'] || row['系列'] || 'SF-Series',
              description: row.description || row['Description'] || row['描述'] || `产品 ${modelNumber}`,
              specifications: {
                torque: {
                  value: row.torqueValue || row['Torque (Nm)'] || row['torqueValue'] || row['扭矩值'] ? 
                         parseFloat(row.torqueValue || row['Torque (Nm)'] || row['扭矩值']) : undefined,
                  min: row.torqueMin || row['Torque Min'] || row['扭矩最小值'] ? 
                       parseFloat(row.torqueMin || row['Torque Min'] || row['扭矩最小值']) : undefined,
                  max: row.torqueMax || row['Torque Max'] || row['扭矩最大值'] ? 
                       parseFloat(row.torqueMax || row['Torque Max'] || row['扭矩最大值']) : undefined
                },
                pressure: {
                  operating: row.operatingPressure || row['Pressure (bar)'] || row['工作压力'] ? 
                            parseFloat(row.operatingPressure || row['Pressure (bar)'] || row['工作压力']) : undefined,
                  min: row.pressureMin || row['Pressure Min'] || row['压力最小值'] ? 
                       parseFloat(row.pressureMin || row['Pressure Min'] || row['压力最小值']) : 4,
                  max: row.pressureMax || row['Pressure Max'] || row['压力最大值'] ? 
                       parseFloat(row.pressureMax || row['Pressure Max'] || row['压力最大值']) : 8
                },
                rotation: row.rotation || row['Rotation'] || row['旋转角度'] || '90°',
                temperature: {
                  min: row.tempMin || row['Temp Min'] || row['温度最小值'] ? 
                       parseFloat(row.tempMin || row['Temp Min'] || row['温度最小值']) : -20,
                  max: row.tempMax || row['Temp Max'] || row['温度最大值'] ? 
                       parseFloat(row.tempMax || row['Temp Max'] || row['温度最大值']) : 80
                },
                dimensions: {
                  length: row.length || row['Length (mm)'] || row['长度'] ? 
                         parseFloat(row.length || row['Length (mm)'] || row['长度']) : undefined,
                  width: row.width || row['Width (mm)'] || row['宽度'] ? 
                        parseFloat(row.width || row['Width (mm)'] || row['宽度']) : undefined,
                  height: row.height || row['Height (mm)'] || row['高度'] ? 
                         parseFloat(row.height || row['Height (mm)'] || row['高度']) : undefined,
                  weight: row.weight || row['Weight (kg)'] || row['重量'] ? 
                         parseFloat(row.weight || row['Weight (kg)'] || row['重量']) : undefined
                },
                // 🔧 阀门连接尺寸
                valveConnection: {
                  flange: {
                    standard: row.flangeStandard || row['Flange Standard'] || row['法兰标准'] || undefined,
                    D: row.flangeD || row['Flange D'] || row['法兰D'] ? 
                       parseFloat(row.flangeD || row['Flange D'] || row['法兰D']) : undefined,
                    A: row.flangeA || row['Flange A'] || row['法兰A'] ? 
                       parseFloat(row.flangeA || row['Flange A'] || row['法兰A']) : undefined,
                    C: row.flangeC || row['Flange C'] || row['法兰C'] ? 
                       parseFloat(row.flangeC || row['Flange C'] || row['法兰C']) : undefined,
                    F: row.flangeF || row['Flange F'] || row['法兰F'] ? 
                       parseFloat(row.flangeF || row['Flange F'] || row['法兰F']) : undefined,
                    threadSpec: row.flangeThreadSpec || row['Flange Thread Spec'] || row['法兰螺纹'] || undefined,
                    threadDepth: row.flangeThreadDepth || row['Flange Thread Depth'] || row['法兰螺纹深度'] ? 
                                parseFloat(row.flangeThreadDepth || row['Flange Thread Depth'] || row['法兰螺纹深度']) : undefined
                  },
                  pneumatic: {
                    size: row.pneumaticSize || row['Pneumatic Size'] || row['气动接口'] || undefined,
                    h2: row.pneumaticH2 || row['Pneumatic H2'] || row['气动高度'] ? 
                        parseFloat(row.pneumaticH2 || row['Pneumatic H2'] || row['气动高度']) : undefined
                  },
                  topMounting: {
                    standard: row.topMountingStandard || row['Top Mounting Standard'] || row['顶部安装标准'] || undefined,
                    L: row.topMountingL || row['Top Mounting L'] || row['顶部安装L'] ? 
                       parseFloat(row.topMountingL || row['Top Mounting L'] || row['顶部安装L']) : undefined,
                    h1: row.topMountingH1 || row['Top Mounting H1'] || row['顶部安装H1'] ? 
                        parseFloat(row.topMountingH1 || row['Top Mounting H1'] || row['顶部安装H1']) : undefined,
                    H: row.topMountingH || row['Top Mounting H'] || row['顶部安装H'] ? 
                       parseFloat(row.topMountingH || row['Top Mounting H'] || row['顶部安装H']) : undefined
                  }
                },
                portSize: row.portSize || row['Port Size'] || row['接口尺寸'] || undefined,
                mountingType: row.mountingType || row['Mounting Type'] || row['安装类型'] || undefined,
                materials: {
                  body: row.materialBody || row['Body Material'] || row['本体材料'] || 'Aluminum Alloy',
                  piston: row.materialPiston || row['Piston Material'] || row['活塞材料'] || 'Aluminum Alloy',
                  seal: row.materialSeal || row['Seal Material'] || row['密封材料'] || 'NBR'
                },
                cycleLife: row.cycleLife || row['Cycle Life'] || row['循环寿命'] ? 
                          parseInt(row.cycleLife || row['Cycle Life'] || row['循环寿命']) : 1000000,
                features: row.features || row['Features'] || row['特性'] ? 
                         (row.features || row['Features'] || row['特性']).toString().split(',').map(f => f.trim()) : []
              },
              pricing: {
                basePrice: row.basePrice || row['Base Price'] || row['Price'] || row['价格'] || row['基础价格'] ? 
                          parseFloat(row.basePrice || row['Base Price'] || row['Price'] || row['价格'] || row['基础价格']) : undefined,
                currency: row.currency || row['Currency'] || row['货币'] || 'USD'
              },
              availability: {
                inStock: row.inStock !== undefined ? row.inStock : 
                        (row['In Stock'] === 'Yes' || row['In Stock'] === true || row['有货'] === '是'),
                leadTime: row.leadTime || row['Lead Time (days)'] || row['交货周期'] ? 
                         parseInt(row.leadTime || row['Lead Time (days)'] || row['交货周期']) : 14
              },
              category: row.category || row['Category'] || row['类别'] || 'Standard',
              tags: row.tags || row['Tags'] || row['标签'] ? 
                   (row.tags || row['Tags'] || row['标签']).toString().split(',').map(t => t.trim()) : [],
              isActive: row.isActive !== undefined ? row.isActive : true,
              notes: row.notes || row['Notes'] || row['备注'] || ''
            };

            // Create product
            await Product.create(productData);
            results.successCount++;

          } catch (error) {
            results.errors.push(`${file.originalname} 第${rowNumber}行: ${error.message}`);
            results.errorCount++;
          }
        }
      } catch (error) {
        results.errors.push(`文件 ${file.originalname}: ${error.message}`);
        results.errorCount++;
      }
    }

    res.json({
      success: true,
      message: '批量导入完成',
      data: {
        successCount: results.successCount,
        errorCount: results.errorCount,
        skippedCount: results.skippedCount,
        errors: results.errors,
        skipped: results.skipped
      }
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ 
      success: false,
      message: '导入失败: ' + error.message 
    });
  }
};


