const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  modelNumber: {
    type: String,
    required: [true, 'Model number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  series: {
    type: String,
    required: [true, 'Series is required'],
    default: 'SF-Series'
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  
  // Technical Specifications
  specifications: {
    // Torque specifications
    torque: {
      value: { type: Number, required: true }, // Nm
      min: { type: Number },
      max: { type: Number }
    },
    
    // Pressure specifications
    pressure: {
      operating: { type: Number, required: true }, // bar
      min: { type: Number, default: 4 },
      max: { type: Number, default: 8 }
    },
    
    // Rotation specifications
    rotation: {
      type: String,
      enum: ['90°', '180°', '270°'],
      default: '90°'
    },
    
    // Temperature specifications
    temperature: {
      min: { type: Number, default: -20 }, // Celsius
      max: { type: Number, default: 80 }
    },
    
    // Physical dimensions
    dimensions: {
      length: { type: Number }, // mm
      width: { type: Number },
      height: { type: Number },
      weight: { type: Number } // kg
    },
    
    // 🔧 阀门连接尺寸（Valve Connection Dimensions）
    valveConnection: {
      // 法兰尺寸 (Flange Dimensions)
      flange: {
        standard: { type: String }, // 例如: 'ISO 5211 F07', 'ISO 5211 F10'
        D: { type: Number },        // 法兰直径 (mm)
        A: { type: Number },        // 方口尺寸 (mm)
        C: { type: Number },        // 中心孔直径 (mm)
        F: { type: Number },        // 定位孔间距 (mm)
        threadSpec: { type: String }, // 螺纹规格，例如: '4-M8', '4-M10'
        threadDepth: { type: Number } // 螺纹深度 (mm)
      },
      // 气动连接尺寸 (Pneumatic Connection)
      pneumatic: {
        size: { type: String },  // 例如: 'NPT1/4"', 'G1/4'
        h2: { type: Number }     // 连接高度 (mm)
      },
      // 顶部安装尺寸 (Top Mounting Dimensions)
      topMounting: {
        standard: { type: String }, // 例如: 'NAMUR VDI/VDE 3845'
        L: { type: Number },        // 安装距离 (mm)
        h1: { type: Number },       // 安装孔位置 (mm)
        H: { type: Number }         // 总高度 (mm)
      }
    },
    
    // Port specifications
    portSize: {
      type: String,
      enum: ['G1/8', 'G1/4', 'G3/8', 'G1/2', 'NPT1/8', 'NPT1/4', 'NPT3/8', 'NPT1/2']
    },
    
    // Mounting type
    mountingType: {
      type: String,
      enum: ['ISO5211', 'NAMUR', 'Direct Mount', 'Custom']
    },
    
    // Material specifications
    materials: {
      body: { type: String, default: 'Aluminum Alloy' },
      piston: { type: String, default: 'Aluminum Alloy' },
      seal: { type: String, default: 'NBR' }
    },
    
    // Performance
    cycleLife: {
      type: Number, // Number of cycles
      default: 1000000
    },
    
    // Additional features
    features: [String]
  },
  
  // Pricing information
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    discountTiers: [{
      quantity: Number,
      discountPercent: Number
    }]
  },
  
  // Accessories and options
  compatibleAccessories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Accessory'
  }],
  
  // Availability
  availability: {
    inStock: {
      type: Boolean,
      default: true
    },
    leadTime: {
      type: Number, // Days
      default: 14
    }
  },
  
  // Documentation
  documents: {
    datasheet: String,
    manual: String,
    cadDrawing: String,
    certification: [String]
  },
  
  // Category and tags for filtering
  category: {
    type: String,
    enum: ['Standard', 'High Torque', 'Compact', 'High Temperature', 'Special'],
    default: 'Standard'
  },
  
  tags: [String],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  notes: String
  
}, {
  timestamps: true
});

// Index for efficient searching
productSchema.index({ modelNumber: 1 });
productSchema.index({ 'specifications.torque.value': 1 });
productSchema.index({ 'specifications.pressure.operating': 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);


