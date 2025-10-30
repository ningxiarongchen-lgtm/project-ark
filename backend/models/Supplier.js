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
    enum: ['合格 (Qualified)', '考察中 (Onboarding)', '不合格 (Disqualified)'],
    default: '考察中 (Onboarding)'
  }
}, {
  timestamps: true
});

// 性能优化：为经常查询的字段添加索引
supplierSchema.index({ name: 1 });
supplierSchema.index({ status: 1 }); // 按状态筛选
supplierSchema.index({ rating: -1 }); // 按评级排序
supplierSchema.index({ createdAt: -1 }); // 按创建时间排序

module.exports = mongoose.model('Supplier', supplierSchema);

