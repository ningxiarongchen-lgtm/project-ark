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


