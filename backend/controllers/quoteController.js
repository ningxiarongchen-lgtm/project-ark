const Quote = require('../models/Quote');
const Project = require('../models/Project');
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const { calculatePrice } = require('../utils/pricing');

// @desc    Get all quotes
// @route   GET /api/quotes
// @access  Private
exports.getQuotes = async (req, res) => {
  try {
    const { status, project } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (project) query.project = project;

    const quotes = await Quote.find(query)
      .populate('project', 'projectNumber projectName client')
      .populate('preparedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('items.product')
      .populate('items.accessory')
      .sort({ createdAt: -1 });

    res.json({
      count: quotes.length,
      quotes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single quote
// @route   GET /api/quotes/:id
// @access  Private
exports.getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('project')
      .populate('preparedBy', 'name email phone department')
      .populate('approvedBy', 'name email')
      .populate('items.product')
      .populate('items.accessory');

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    res.json(quote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new quote from project
// @route   POST /api/quotes
// @access  Private
exports.createQuote = async (req, res) => {
  try {
    const { projectId } = req.body;

    // Get project with selections
    const project = await Project.findById(projectId)
      .populate('selections.product')
      .populate('selections.accessories.accessory');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.selections.length === 0) {
      return res.status(400).json({ message: 'Project has no product selections' });
    }

    // Build quote items from project selections
    const items = [];
    let subtotal = 0;

    for (const selection of project.selections) {
      const product = selection.product;
      const quantity = selection.quantity;
      let unitPrice;
      let discount = 0;
      let netPrice;
      let lineTotal;
      
      // ⭐ 使用新的智能定价函数，传入完整的产品对象
      // 函数会自动根据 pricing_model 判断使用固定价格还是阶梯价格
      unitPrice = calculatePrice(product, quantity);
      netPrice = unitPrice; // 阶梯定价已经包含了数量折扣
      lineTotal = unitPrice * quantity;
      
      // 计算折扣率（相对于基础价格，如果是阶梯定价）
      if (product.pricing_model === 'tiered' && product.base_price && unitPrice < product.base_price) {
        discount = ((product.base_price - unitPrice) / product.base_price * 100).toFixed(2);
      }

      items.push({
        itemType: 'Product',
        product: product._id,
        description: `${product.modelNumber} - ${product.description}`,
        specifications: `Torque: ${product.specifications.torque.value}Nm, Pressure: ${product.specifications.pressure.operating}bar, Rotation: ${product.specifications.rotation}`,
        quantity,
        unitPrice,
        discount,
        netPrice,
        lineTotal,
        leadTime: product.availability?.leadTime || '14天',
        notes: selection.notes
      });

      subtotal += lineTotal;

      // Add accessories
      if (selection.accessories && selection.accessories.length > 0) {
        for (const acc of selection.accessories) {
          const accessory = acc.accessory;
          const accQuantity = acc.quantity || quantity;
          
          // ⭐ 使用新的智能定价函数，传入完整的配件对象
          // 函数会自动根据 pricing_model 判断使用固定价格还是阶梯价格
          const accUnitPrice = calculatePrice(accessory, accQuantity);
          const accLineTotal = accUnitPrice * accQuantity;

          items.push({
            itemType: 'Accessory',
            accessory: accessory._id,
            description: `${accessory.partNumber} - ${accessory.name}`,
            specifications: accessory.description,
            quantity: accQuantity,
            unitPrice: accUnitPrice,
            discount: 0,
            netPrice: accUnitPrice,
            lineTotal: accLineTotal,
            leadTime: accessory.availability?.leadTime || '7天'
          });

          subtotal += accLineTotal;
        }
      }
    }

    // Calculate tax (can be customized)
    const taxRate = req.body.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);

    // Shipping cost
    const shippingCost = req.body.shippingCost || 0;

    // Total discount (if any additional project-level discount)
    const additionalDiscount = req.body.additionalDiscount || 0;

    const total = subtotal + taxAmount + shippingCost - additionalDiscount;

    // Create quote
    const quote = await Quote.create({
      project: projectId,
      items,
      pricing: {
        subtotal,
        tax: {
          rate: taxRate,
          amount: taxAmount
        },
        shipping: {
          method: req.body.shippingMethod || 'Standard',
          cost: shippingCost
        },
        discount: additionalDiscount,
        total,
        currency: req.body.currency || 'USD'
      },
      terms: {
        paymentTerms: req.body.paymentTerms || 'Net 30',
        deliveryTerms: req.body.deliveryTerms || 'FOB Factory',
        warranty: req.body.warranty || '12 months from delivery'
      },
      preparedBy: req.user._id,
      externalNotes: req.body.externalNotes,
      internalNotes: req.body.internalNotes
    });

    // Add quote reference to project
    project.quotes.push(quote._id);
    await project.save();

    const populatedQuote = await Quote.findById(quote._id)
      .populate('project')
      .populate('preparedBy', 'name email phone')
      .populate('items.product')
      .populate('items.accessory');

    res.status(201).json(populatedQuote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update quote
// @route   PUT /api/quotes/:id
// @access  Private
exports.updateQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // If status is changing to 'Sent', record the sent date
    if (req.body.status === 'Sent' && quote.status !== 'Sent') {
      req.body.sentDate = Date.now();
    }

    // If status is changing to 'Accepted', record the accepted date
    if (req.body.status === 'Accepted' && quote.status !== 'Accepted') {
      req.body.acceptedDate = Date.now();
    }

    const updatedQuote = await Quote.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('project preparedBy approvedBy items.product items.accessory');

    res.json(updatedQuote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete quote
// @route   DELETE /api/quotes/:id
// @access  Private/Admin
exports.deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Remove quote reference from project
    await Project.findByIdAndUpdate(
      quote.project,
      { $pull: { quotes: quote._id } }
    );

    await quote.deleteOne();
    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new version of quote
// @route   POST /api/quotes/:id/revise
// @access  Private
exports.reviseQuote = async (req, res) => {
  try {
    const originalQuote = await Quote.findById(req.params.id);

    if (!originalQuote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Mark original as revised
    originalQuote.status = 'Revised';
    await originalQuote.save();

    // Create new version
    const newQuoteData = originalQuote.toObject();
    delete newQuoteData._id;
    delete newQuoteData.quoteNumber;
    newQuoteData.version = originalQuote.version + 1;
    newQuoteData.status = 'Draft';
    newQuoteData.preparedBy = req.user._id;
    newQuoteData.sentDate = undefined;
    newQuoteData.acceptedDate = undefined;

    // Apply any updates from request body
    Object.assign(newQuoteData, req.body);

    const newQuote = await Quote.create(newQuoteData);

    // Add new quote to project
    await Project.findByIdAndUpdate(
      newQuote.project,
      { $push: { quotes: newQuote._id } }
    );

    const populatedQuote = await Quote.findById(newQuote._id)
      .populate('project preparedBy items.product items.accessory');

    res.status(201).json(populatedQuote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get quote statistics
// @route   GET /api/quotes/stats/summary
// @access  Private
exports.getQuoteStats = async (req, res) => {
  try {
    const stats = await Quote.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$pricing.total' }
        }
      }
    ]);

    const totalQuotes = await Quote.countDocuments();
    
    res.json({
      totalQuotes,
      byStatus: stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


