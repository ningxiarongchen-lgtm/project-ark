const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  quoteNumber: {
    type: String,
    required: [true, 'Quote number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // Associated project
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  
  // Quote version (for tracking revisions)
  version: {
    type: Number,
    default: 1
  },
  
  // Line items
  items: [{
    itemType: {
      type: String,
      enum: ['Product', 'Accessory', 'Service', 'Other'],
      required: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    accessory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Accessory'
    },
    description: {
      type: String,
      required: true
    },
    specifications: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    netPrice: {
      type: Number,
      required: true
    },
    lineTotal: {
      type: Number,
      required: true
    },
    leadTime: {
      type: Number, // Days
      default: 14
    },
    notes: String
  }],
  
  // Pricing summary
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    tax: {
      rate: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    shipping: {
      method: String,
      cost: { type: Number, default: 0 }
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Terms and conditions
  terms: {
    paymentTerms: {
      type: String,
      default: 'Net 30'
    },
    deliveryTerms: String,
    warranty: {
      type: String,
      default: '12 months from delivery'
    },
    validUntil: {
      type: Date,
      required: true
    }
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Reviewed', 'Accepted', 'Rejected', 'Expired', 'Revised'],
    default: 'Draft'
  },
  
  // Stakeholders
  preparedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Client feedback
  clientFeedback: {
    comments: String,
    date: Date
  },
  
  // Dates
  issuedDate: {
    type: Date,
    default: Date.now
  },
  sentDate: Date,
  acceptedDate: Date,
  
  // Notes
  internalNotes: String,
  externalNotes: String, // Visible to client
  
  // PDF generation
  pdfUrl: String
  
}, {
  timestamps: true
});

// Auto-generate quote number if not provided
quoteSchema.pre('save', async function(next) {
  if (!this.quoteNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Quote').countDocuments();
    this.quoteNumber = `QT-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Set validUntil to 30 days from issuedDate if not set
  if (!this.terms.validUntil) {
    const validUntil = new Date(this.issuedDate);
    validUntil.setDate(validUntil.getDate() + 30);
    this.terms.validUntil = validUntil;
  }
  
  next();
});

// Index for efficient searching
quoteSchema.index({ quoteNumber: 1 });
quoteSchema.index({ project: 1 });
quoteSchema.index({ status: 1 });
quoteSchema.index({ preparedBy: 1 });

module.exports = mongoose.model('Quote', quoteSchema);


