const mongoose = require('mongoose');

const deliveryNoteSchema = new mongoose.Schema({
  // 发货单号 (自动生成，例如: DN-202510-0001)
  noteNumber: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // 关联的项目
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewProject',
    required: [true, 'Project reference is required']
  },
  
  // 关联的生产订单
  productionOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionOrder',
    required: [true, 'Production order reference is required']
  },
  
  // 项目信息快照（用于快速显示）
  projectSnapshot: {
    projectNumber: String,
    projectName: String,
    clientName: String,
    clientContact: String,
    clientPhone: String
  },
  
  // 发货单状态
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Shipped', 'Cancelled'],
    default: 'Pending'
  },
  
  // 发货明细（本次发货的产品清单）
  items: [{
    // 物料类型
    item_type: {
      type: String,
      required: true,
      enum: ['Actuator', 'Manual Override', 'Accessory', 'Valve', 'Other']
    },
    
    // 产品ID（关联到具体产品）
    product: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'items.item_type'
    },
    
    // 型号名称
    model: {
      type: String,
      required: true
    },
    
    // 发货数量
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    
    // 单位
    unit: {
      type: String,
      default: '台'
    },
    
    // 备注
    notes: String
  }],
  
  // 收货地址
  shippingAddress: {
    // 详细地址
    address: {
      type: String,
      required: true
    },
    
    // 收货人
    recipient: String,
    
    // 联系电话
    phone: String,
    
    // 省份
    province: String,
    
    // 城市
    city: String,
    
    // 邮政编码
    postalCode: String
  },
  
  // 物流信息
  logistics: {
    // 物流公司
    company: {
      type: String,
      trim: true
    },
    
    // 运单号/跟踪号
    trackingNumber: {
      type: String,
      trim: true
    },
    
    // 车牌号
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    
    // 司机姓名
    driverName: {
      type: String,
      trim: true
    },
    
    // 司机联系电话
    driverPhone: {
      type: String,
      trim: true
    },
    
    // 预计到达时间
    estimatedArrival: Date,
    
    // 物流备注
    notes: String
  },
  
  // 发货单创建人（通常是生产计划员或车间主管）
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  
  // 执行人/负责人（通常是物流专员）
  handler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 实际发货时间
  shippedAt: {
    type: Date
  },
  
  // 发货确认人
  shippedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 取消原因（如果状态为 Cancelled）
  cancellationReason: {
    type: String,
    trim: true
  },
  
  // 取消时间
  cancelledAt: {
    type: Date
  },
  
  // 取消人
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 发货备注
  notes: {
    type: String,
    trim: true
  },
  
  // 附件（装箱单、发货清单等）
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
  
}, {
  timestamps: true
});

// 自动生成发货单号
deliveryNoteSchema.pre('save', async function(next) {
  if (!this.noteNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('DeliveryNote').countDocuments({
      createdAt: {
        $gte: new Date(year, new Date().getMonth(), 1),
        $lt: new Date(year, new Date().getMonth() + 1, 1)
      }
    });
    this.noteNumber = `DN-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// 索引优化查询性能
deliveryNoteSchema.index({ noteNumber: 1 });
deliveryNoteSchema.index({ project: 1 });
deliveryNoteSchema.index({ productionOrder: 1 });
deliveryNoteSchema.index({ status: 1 });
deliveryNoteSchema.index({ handler: 1 });
deliveryNoteSchema.index({ createdAt: -1 });

// 实例方法：确认发货
deliveryNoteSchema.methods.confirmShipment = function(userId, logisticsData) {
  this.status = 'Shipped';
  this.shippedAt = new Date();
  this.shippedBy = userId;
  
  if (logisticsData) {
    this.logistics = {
      ...this.logistics,
      ...logisticsData
    };
  }
  
  return this.save();
};

// 实例方法：取消发货单
deliveryNoteSchema.methods.cancel = function(userId, reason) {
  this.status = 'Cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = userId;
  this.cancellationReason = reason;
  
  return this.save();
};

// 静态方法：获取待处理的发货单
deliveryNoteSchema.statics.getPendingDeliveries = async function() {
  return await this.find({
    status: { $in: ['Pending', 'In Progress'] }
  })
  .populate('project', 'project_name project_number client_name')
  .populate('productionOrder', 'productionOrderNumber')
  .populate('handler', 'name email')
  .populate('createdBy', 'name email')
  .sort({ createdAt: -1 });
};

// 静态方法：获取指定物流专员的任务
deliveryNoteSchema.statics.getTasksByHandler = async function(handlerId, status = null) {
  const query = { handler: handlerId };
  if (status) {
    query.status = status;
  }
  
  return await this.find(query)
    .populate('project', 'project_name project_number client_name')
    .populate('productionOrder', 'productionOrderNumber')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('DeliveryNote', deliveryNoteSchema);

