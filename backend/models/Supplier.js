const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide supplier name'],
    trim: true
  },
  contact_person: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  business_scope: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  certification_status: {
    type: String,
    enum: ['Certified', 'Pending', 'Not Certified']
  },
  total_transaction_value: {
    type: Number,
    default: 0
  },
  on_time_delivery_rate: {
    type: Number,
    default: 100
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blacklisted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// 索引
supplierSchema.index({ name: 1 });
supplierSchema.index({ status: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);

