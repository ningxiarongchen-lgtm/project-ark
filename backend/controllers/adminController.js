const xlsx = require('xlsx');
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const fs = require('fs');

// @desc    Upload and import products from Excel
// @route   POST /api/admin/import/products
// @access  Private/Admin
exports.importProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read the Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const results = {
      imported: 0,
      updated: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Map Excel columns to Product schema
        const productData = {
          modelNumber: row['Model Number'] || row['ModelNumber'],
          series: row['Series'] || 'SF-Series',
          description: row['Description'],
          category: row['Category'] || 'Standard',
          specifications: {
            torque: {
              value: parseFloat(row['Torque (Nm)'] || row['Torque']),
              min: parseFloat(row['Torque Min'] || row['Torque (Nm)'] * 0.9),
              max: parseFloat(row['Torque Max'] || row['Torque (Nm)'] * 1.1)
            },
            pressure: {
              operating: parseFloat(row['Pressure (bar)'] || row['Pressure']),
              min: parseFloat(row['Pressure Min'] || 4),
              max: parseFloat(row['Pressure Max'] || 8)
            },
            rotation: row['Rotation'] || '90°',
            temperature: {
              min: parseFloat(row['Temp Min'] || -20),
              max: parseFloat(row['Temp Max'] || 80)
            },
            dimensions: {
              length: parseFloat(row['Length (mm)'] || 0),
              width: parseFloat(row['Width (mm)'] || 0),
              height: parseFloat(row['Height (mm)'] || 0),
              weight: parseFloat(row['Weight (kg)'] || 0)
            },
            portSize: row['Port Size'],
            mountingType: row['Mounting Type'] || 'ISO5211',
            materials: {
              body: row['Body Material'] || 'Aluminum Alloy',
              piston: row['Piston Material'] || 'Aluminum Alloy',
              seal: row['Seal Material'] || 'NBR'
            },
            cycleLife: parseInt(row['Cycle Life'] || 1000000)
          },
          pricing: {
            basePrice: parseFloat(row['Base Price'] || row['Price']),
            currency: row['Currency'] || 'USD'
          },
          availability: {
            inStock: row['In Stock'] === 'Yes' || row['In Stock'] === true || row['InStock'] === 'Yes',
            leadTime: parseInt(row['Lead Time (days)'] || row['Lead Time'] || 14)
          },
          tags: row['Tags'] ? row['Tags'].split(',').map(t => t.trim()) : [],
          notes: row['Notes']
        };

        // Check if product already exists
        const existingProduct = await Product.findOne({ 
          modelNumber: productData.modelNumber 
        });

        if (existingProduct) {
          // Update existing product
          await Product.findByIdAndUpdate(existingProduct._id, productData);
          results.updated++;
        } else {
          // Create new product
          await Product.create(productData);
          results.imported++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 2, // Excel row number (accounting for header)
          error: error.message,
          data: row
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Import completed',
      results
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload and import accessories from Excel
// @route   POST /api/admin/import/accessories
// @access  Private/Admin
exports.importAccessories = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const results = {
      imported: 0,
      updated: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        const accessoryData = {
          partNumber: row['Part Number'] || row['PartNumber'],
          name: row['Name'],
          description: row['Description'],
          type: row['Type'],
          pricing: {
            basePrice: parseFloat(row['Base Price'] || row['Price']),
            currency: row['Currency'] || 'USD'
          },
          availability: {
            inStock: row['In Stock'] === 'Yes' || row['In Stock'] === true,
            leadTime: parseInt(row['Lead Time (days)'] || 7)
          },
          compatibility: row['Compatibility'] ? row['Compatibility'].split(',').map(c => c.trim()) : []
        };

        const existingAccessory = await Accessory.findOne({ 
          partNumber: accessoryData.partNumber 
        });

        if (existingAccessory) {
          await Accessory.findByIdAndUpdate(existingAccessory._id, accessoryData);
          results.updated++;
        } else {
          await Accessory.create(accessoryData);
          results.imported++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 2,
          error: error.message,
          data: row
        });
      }
    }

    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Import completed',
      results
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export products to Excel template
// @route   GET /api/admin/export/products
// @access  Private/Admin
exports.exportProducts = async (req, res) => {
  try {
    const products = await Product.find({});

    // Prepare data for Excel
    const data = products.map(p => ({
      'Model Number': p.modelNumber,
      'Series': p.series,
      'Description': p.description,
      'Category': p.category,
      'Torque (Nm)': p.specifications.torque.value,
      'Torque Min': p.specifications.torque.min,
      'Torque Max': p.specifications.torque.max,
      'Pressure (bar)': p.specifications.pressure.operating,
      'Pressure Min': p.specifications.pressure.min,
      'Pressure Max': p.specifications.pressure.max,
      'Rotation': p.specifications.rotation,
      'Temp Min': p.specifications.temperature.min,
      'Temp Max': p.specifications.temperature.max,
      'Length (mm)': p.specifications.dimensions.length,
      'Width (mm)': p.specifications.dimensions.width,
      'Height (mm)': p.specifications.dimensions.height,
      'Weight (kg)': p.specifications.dimensions.weight,
      'Port Size': p.specifications.portSize,
      'Mounting Type': p.specifications.mountingType,
      'Body Material': p.specifications.materials.body,
      'Piston Material': p.specifications.materials.piston,
      'Seal Material': p.specifications.materials.seal,
      'Cycle Life': p.specifications.cycleLife,
      'Base Price': p.pricing.basePrice,
      'Currency': p.pricing.currency,
      'In Stock': p.availability.inStock ? 'Yes' : 'No',
      'Lead Time (days)': p.availability.leadTime,
      'Tags': p.tags.join(', '),
      'Notes': p.notes
    }));

    // Create workbook and worksheet
    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Products');

    // Generate buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=products-export.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Excel template for products
// @route   GET /api/admin/template/products
// @access  Private/Admin
exports.getProductTemplate = async (req, res) => {
  try {
    // Create template with headers and sample data
    const template = [{
      'Model Number': 'SF-100',
      'Series': 'SF-Series',
      'Description': 'Sample pneumatic actuator',
      'Category': 'Standard',
      'Torque (Nm)': 100,
      'Torque Min': 90,
      'Torque Max': 110,
      'Pressure (bar)': 6,
      'Pressure Min': 4,
      'Pressure Max': 8,
      'Rotation': '90°',
      'Temp Min': -20,
      'Temp Max': 80,
      'Length (mm)': 150,
      'Width (mm)': 100,
      'Height (mm)': 120,
      'Weight (kg)': 2.5,
      'Port Size': 'G1/4',
      'Mounting Type': 'ISO5211',
      'Body Material': 'Aluminum Alloy',
      'Piston Material': 'Aluminum Alloy',
      'Seal Material': 'NBR',
      'Cycle Life': 1000000,
      'Base Price': 450.00,
      'Currency': 'USD',
      'In Stock': 'Yes',
      'Lead Time (days)': 14,
      'Tags': 'standard, compact',
      'Notes': 'Sample product entry'
    }];

    const ws = xlsx.utils.json_to_sheet(template);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Products Template');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=products-template.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get system statistics for admin dashboard
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getSystemStats = async (req, res) => {
  try {
    const User = require('../models/User');
    const Project = require('../models/Project');
    const Quote = require('../models/Quote');

    const stats = {
      users: {
        total: await User.countDocuments(),
        active: await User.countDocuments({ isActive: true }),
        byRole: await User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ])
      },
      products: {
        total: await Product.countDocuments(),
        active: await Product.countDocuments({ isActive: true }),
        byCategory: await Product.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ])
      },
      accessories: {
        total: await Accessory.countDocuments(),
        active: await Accessory.countDocuments({ isActive: true }),
        byType: await Accessory.aggregate([
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ])
      },
      projects: {
        total: await Project.countDocuments(),
        byStatus: await Project.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ])
      },
      quotes: {
        total: await Quote.countDocuments(),
        byStatus: await Quote.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        totalValue: await Quote.aggregate([
          { $group: { _id: null, total: { $sum: '$pricing.total' } } }
        ])
      }
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fix SR torque data (torque_data -> torqueData)
// @route   POST /api/admin/fix-sr-torque
// @access  Private/Admin
exports.fixSRTorqueData = async (req, res) => {
  try {
    const Actuator = require('../models/Actuator');
    
    // 键名映射
    const KEY_MAPPING = {
      'sst': 'SST',
      'srt': 'SRT',
      'set': 'SET',
      'ast_0.3': 'AST_0_3',
      'art_0.3': 'ART_0_3',
      'aet_0.3': 'AET_0_3',
      'ast_0.4': 'AST_0_4',
      'art_0.4': 'ART_0_4',
      'aet_0.4': 'AET_0_4',
      'ast_0.5': 'AST_0_5',
      'art_0.5': 'ART_0_5',
      'aet_0.5': 'AET_0_5',
      'ast_0.6': 'AST_0_6',
      'art_0.6': 'ART_0_6',
      'aet_0.6': 'AET_0_6'
    };

    function transformKeys(obj) {
      if (!obj) return null;
      const transformed = {};
      for (const [oldKey, value] of Object.entries(obj)) {
        const newKey = KEY_MAPPING[oldKey] || oldKey.toUpperCase();
        transformed[newKey] = value;
      }
      return transformed;
    }

    // 查找需要修复的SR执行器
    const allSR = await Actuator.find({ 
      series: 'SF', 
      action_type: 'SR',
      torque_data: { $exists: true }
    });

    let success = 0;
    let failed = 0;
    let skipped = 0;
    const errors = [];

    for (const sr of allSR) {
      try {
        // 检查是否已经有正确的torqueData
        if (sr.torqueData && (sr.torqueData.symmetric || sr.torqueData.canted)) {
          skipped++;
          continue;
        }

        // 获取旧数据
        const oldData = sr.torque_data;
        if (!oldData) {
          skipped++;
          continue;
        }

        // 转换数据
        const newTorqueData = {};
        
        if (oldData.symmetric) {
          newTorqueData.symmetric = transformKeys(oldData.symmetric);
        }
        
        if (oldData.canted) {
          newTorqueData.canted = transformKeys(oldData.canted);
        }

        // 更新数据
        sr.torqueData = newTorqueData;
        await sr.save();
        
        success++;
        
      } catch (error) {
        failed++;
        errors.push({
          model: sr.model_base,
          error: error.message
        });
      }
    }

    // 验证修复结果
    const withTorqueData = await Actuator.countDocuments({
      series: 'SF',
      action_type: 'SR',
      $or: [
        { 'torqueData.symmetric': { $exists: true } },
        { 'torqueData.canted': { $exists: true } }
      ]
    });

    res.json({
      success: true,
      message: 'SR扭矩数据修复完成',
      results: {
        total: allSR.length,
        success,
        failed,
        skipped,
        verified: withTorqueData
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('修复SR数据错误:', error);
    res.status(500).json({ 
      success: false,
      message: '修复失败',
      error: error.message 
    });
  }
};


