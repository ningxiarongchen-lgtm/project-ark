const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectNumber: {
    type: String,
    required: [true, 'Project number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  
  // Client information
  client: {
    name: {
      type: String,
      required: [true, 'Client name is required']
    },
    company: String,
    email: String,
    phone: String,
    address: String
  },
  
  // Project details
  description: String,
  application: String, // Type of application for the actuators
  industry: {
    type: String,
    enum: ['Oil & Gas', 'Water Treatment', 'Chemical', 'Power Generation', 'Manufacturing', 'Food & Beverage', 'Other']
  },
  
  // Project team
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Project status
  status: {
    type: String,
    enum: ['Draft', 'In Progress', 'Under Review', 'Quoted', 'Approved', 'Rejected', 'Won', 'Lost', 'Completed'],
    default: 'Draft'
  },
  
  // Selected actuators for this project
  selections: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    accessories: [{
      accessory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Accessory'
      },
      quantity: Number
    }],
    requirements: {
      torque: Number,
      pressure: Number,
      rotation: String,
      temperature: {
        min: Number,
        max: Number
      },
      specialRequirements: String
    },
    notes: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Bill of Materials (BOM) - Current active BOM
  bill_of_materials: [{
    // Reference to system item (Actuator/Accessory) - OPTIONAL for manual items
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'bill_of_materials.item_type',
      // Not required - manual items won't have item_id
    },
    
    // Type of item (Actuator, Accessory, Manual, etc.)
    item_type: {
      type: String,
      required: true,
      enum: ['Actuator', 'Accessory', 'Manual', 'Valve', 'Other'],
      trim: true
    },
    
    // Model name/number
    model_name: {
      type: String,
      required: true,
      trim: true
    },
    
    // Quantity
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    
    // Unit price (required for both system and manual items)
    unit_price: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative']
    },
    
    // Total price (quantity × unit_price)
    total_price: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative']
    },
    
    // Optional: Description
    description: {
      type: String,
      trim: true
    },
    
    // Optional: Specification details
    specifications: {
      type: mongoose.Schema.Types.Mixed
    },
    
    // Optional: Notes
    notes: {
      type: String,
      trim: true
    },
    
    // Optional: Covered tags (for optimized BOM)
    covered_tags: [{
      type: String,
      trim: true,
      uppercase: true
    }],
    
    // Flag to indicate if this is a manual entry
    is_manual: {
      type: Boolean,
      default: false
    },
    
    // Created timestamp
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // BOM History - Track all versions of BOM
  bom_history: [{
    // Version name/identifier
    version_name: {
      type: String,
      required: true,
      trim: true
      // e.g., 'v1.0', 'Initial', 'Optimized v2', etc.
    },
    
    // When this version was created
    created_at: {
      type: Date,
      default: Date.now,
      required: true
    },
    
    // Who created this version
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Total amount for this BOM version
    total_amount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative']
    },
    
    // Items in this BOM version
    items: [{
      // Reference to system item (Actuator/Accessory) - OPTIONAL for manual items
      item_id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'bom_history.items.item_type'
        // Not required - manual items won't have item_id
      },
      item_type: {
        type: String,
        required: true,
        enum: ['Actuator', 'Accessory', 'Manual', 'Valve', 'Other'],
        trim: true
      },
      model_name: {
        type: String,
        required: true,
        trim: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      unit_price: {
        type: Number,
        required: true,
        min: 0
      },
      total_price: {
        type: Number,
        required: true,
        min: 0
      },
      description: {
        type: String,
        trim: true
      },
      specifications: {
        type: mongoose.Schema.Types.Mixed
      },
      notes: {
        type: String,
        trim: true
      },
      covered_tags: [{
        type: String,
        trim: true,
        uppercase: true
      }],
      // Flag to indicate if this is a manual entry
      is_manual: {
        type: Boolean,
        default: false
      }
    }],
    
    // Optional: Description of changes in this version
    change_description: {
      type: String,
      trim: true
    },
    
    // Optional: Notes for this version
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // Project timeline
  timeline: {
    startDate: Date,
    expectedCompletionDate: Date,
    actualCompletionDate: Date
  },
  
  // Quotes associated with this project
  quotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote'
  }],
  
  // Project documents
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Notes and comments
  notes: String,
  internalNotes: String, // Not visible in client-facing documents
  
  // Financial
  estimatedValue: Number,
  
  // Priority
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  }
  
}, {
  timestamps: true
});

// Auto-generate project number if not provided
projectSchema.pre('save', async function(next) {
  if (!this.projectNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Project').countDocuments();
    this.projectNumber = `PRJ-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Index for efficient searching
projectSchema.index({ projectNumber: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ 'client.name': 1 });

module.exports = mongoose.model('Project', projectSchema);


