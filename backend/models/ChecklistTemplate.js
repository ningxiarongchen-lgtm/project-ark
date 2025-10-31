// /backend/models/ChecklistTemplate.js
const mongoose = require('mongoose');

const checklistTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 'AT系列执行器FQC模板'
  productSeries: String, // e.g., 'AT', 'GT'
  checkType: { 
    type: String, 
    enum: ['IQC', 'IPQC', 'FQC', 'OQC'],
    required: true 
  }, // 'IQC', 'FQC'
  items: [{
    itemName: { type: String, required: true },
    standard: { type: String, required: true },
    displayOrder: { type: Number, default: 0 }
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

checklistTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ChecklistTemplate', checklistTemplateSchema);

