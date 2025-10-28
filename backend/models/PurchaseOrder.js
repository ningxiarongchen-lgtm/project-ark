const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true
  },
  product_code: {
    type: String,
    trim: true
  },
  specification: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity'],
    min: [1, 'Quantity must be at least 1']
  },
  unit: {
    type: String,
    default: '件',
    trim: true
  },
  unit_price: {
    type: Number,
    required: [true, 'Please provide unit price'],
    min: [0, 'Unit price cannot be negative']
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: true });

const purchaseOrderSchema = new mongoose.Schema({
  order_number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Please provide supplier']
  },
  items: {
    type: [purchaseOrderItemSchema],
    required: [true, 'Please provide at least one item'],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Purchase order must have at least one item'
    }
  },
  total_amount: {
    type: Number,
    required: [true, 'Please provide total amount'],
    min: [0, 'Total amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'confirmed', 'shipped', 'received', 'cancelled'],
    default: 'draft'
  },
  order_date: {
    type: Date,
    default: Date.now
  },
  expected_delivery_date: {
    type: Date
  },
  actual_delivery_date: {
    type: Date
  },
  payment_terms: {
    type: String,
    trim: true
  },
  shipping_address: {
    type: String,
    trim: true
  },
  contact_person: {
    type: String,
    trim: true
  },
  contact_phone: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approved_at: {
    type: Date
  }
}, {
  timestamps: true
});

// 索引
purchaseOrderSchema.index({ order_number: 1 });
purchaseOrderSchema.index({ supplier_id: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ order_date: -1 });
purchaseOrderSchema.index({ created_by: 1 });

// 生成订单编号的静态方法
purchaseOrderSchema.statics.generateOrderNumber = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const prefix = `PO${year}${month}${day}`;
  
  // 查找当天最后一个订单号
  const lastOrder = await this.findOne({
    order_number: new RegExp(`^${prefix}`)
  }).sort({ order_number: -1 });
  
  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.order_number.slice(-4));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

// 计算总金额的方法
purchaseOrderSchema.methods.calculateTotalAmount = function() {
  return this.items.reduce((total, item) => {
    return total + (item.quantity * item.unit_price);
  }, 0);
};

// 保存前自动计算小计和总金额
purchaseOrderSchema.pre('save', function(next) {
  // 计算每个项目的小计
  this.items.forEach(item => {
    item.subtotal = item.quantity * item.unit_price;
  });
  
  // 计算总金额
  this.total_amount = this.calculateTotalAmount();
  
  next();
});

// 更新供应商交易数据
purchaseOrderSchema.post('save', async function(doc) {
  if (doc.status === 'received') {
    const Supplier = mongoose.model('Supplier');
    await Supplier.findByIdAndUpdate(doc.supplier_id, {
      $inc: { total_transaction_value: doc.total_amount }
    });
  }
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);

