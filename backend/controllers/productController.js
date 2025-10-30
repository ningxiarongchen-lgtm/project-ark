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

// @desc    Bulk import products from Excel file
// @route   POST /api/products/import
// @access  Private/Admin/Technical Engineer
exports.bulkImportProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: '请上传Excel文件' 
      });
    }

    const XLSX = require('xlsx');
    
    // Parse Excel file from buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rows = XLSX.utils.sheet_to_json(worksheet);

    if (rows.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Excel文件中没有数据' 
      });
    }

    const results = {
      successCount: 0,
      errorCount: 0,
      errors: [],
      skipped: []
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Excel row number (accounting for header)

      try {
        // Validate required fields
        if (!row.modelNumber || !row.description || !row.torqueValue || !row.operatingPressure || !row.basePrice) {
          results.errors.push(`第${rowNumber}行: 缺少必填字段（型号、描述、扭矩、压力或价格）`);
          results.errorCount++;
          continue;
        }

        // Check if product already exists
        const existingProduct = await Product.findOne({ 
          modelNumber: row.modelNumber.toString().trim().toUpperCase() 
        });

        if (existingProduct) {
          results.skipped.push(`第${rowNumber}行: 产品 ${row.modelNumber} 已存在，已跳过`);
          continue;
        }

        // Build product object
        const productData = {
          modelNumber: row.modelNumber.toString().trim().toUpperCase(),
          series: row.series || 'SF-Series',
          description: row.description,
          specifications: {
            torque: {
              value: parseFloat(row.torqueValue),
              min: row.torqueMin ? parseFloat(row.torqueMin) : undefined,
              max: row.torqueMax ? parseFloat(row.torqueMax) : undefined
            },
            pressure: {
              operating: parseFloat(row.operatingPressure),
              min: row.pressureMin ? parseFloat(row.pressureMin) : 4,
              max: row.pressureMax ? parseFloat(row.pressureMax) : 8
            },
            rotation: row.rotation || '90°',
            temperature: {
              min: row.tempMin ? parseFloat(row.tempMin) : -20,
              max: row.tempMax ? parseFloat(row.tempMax) : 80
            },
            dimensions: {
              length: row.length ? parseFloat(row.length) : undefined,
              width: row.width ? parseFloat(row.width) : undefined,
              height: row.height ? parseFloat(row.height) : undefined,
              weight: row.weight ? parseFloat(row.weight) : undefined
            },
            portSize: row.portSize || undefined,
            mountingType: row.mountingType || undefined,
            materials: {
              body: row.materialBody || 'Aluminum Alloy',
              piston: row.materialPiston || 'Aluminum Alloy',
              seal: row.materialSeal || 'NBR'
            },
            cycleLife: row.cycleLife ? parseInt(row.cycleLife) : 1000000,
            features: row.features ? row.features.split(',').map(f => f.trim()) : []
          },
          pricing: {
            basePrice: parseFloat(row.basePrice),
            currency: row.currency || 'USD'
          },
          availability: {
            inStock: row.inStock !== undefined ? row.inStock : true,
            leadTime: row.leadTime ? parseInt(row.leadTime) : 14
          },
          category: row.category || 'Standard',
          tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
          isActive: row.isActive !== undefined ? row.isActive : true,
          notes: row.notes || ''
        };

        // Create product
        await Product.create(productData);
        results.successCount++;

      } catch (error) {
        results.errors.push(`第${rowNumber}行: ${error.message}`);
        results.errorCount++;
      }
    }

    res.json({
      success: true,
      message: '批量导入完成',
      data: {
        successCount: results.successCount,
        errorCount: results.errorCount,
        skippedCount: results.skipped.length,
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


