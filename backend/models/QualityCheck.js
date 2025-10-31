// /backend/models/QualityCheck.js
const mongoose = require('mongoose');

const checkItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true }, // 检验项目, e.g., '外观检查'
  standard: { type: String, required: true }, // 检验标准, e.g., '无划痕、无锈蚀'
  result: { type: String, enum: ['Pass', 'Fail', 'N/A'], required: true }, // 结果
  notes: String, // 备注
});

const qualityCheckSchema = new mongoose.Schema({
  checkNumber: { type: String, unique: true }, // 质检单号 (e.g., QC-YYYYMM-XXXX)
  checkType: { // 检验类型
    type: String,
    enum: ['IQC', 'IPQC', 'FQC', 'OQC'],
    required: true,
  },
  sourceDocument: { // 检验任务的来源 (采购订单或生产订单)
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: { type: String, enum: ['PurchaseOrder', 'ProductionOrder'], required: true },
    number: String, // 源单据编号，用于显示
  },
  itemsToCheck: [{ // 本次要检验的物料/产品
    item: { type: mongoose.Schema.Types.ObjectId, refPath: 'itemsToCheck.itemType' },
    itemType: { type: String, enum: ['Actuator', 'Accessory'] },
    model: String,
    quantity: Number,
  }],
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending',
  },
  inspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 检验员
  checkList: [checkItemSchema], // 具体的检验项和结果
  overallResult: { // 综合判定结果
    type: String,
    enum: ['Pass', 'Fail'],
  },
  defectCount: { type: Number, default: 0 }, // 缺陷数量
  reportUrl: String, // 上传的详细检验报告URL
  images: [String], // 现场照片URL
  completedAt: Date, // 检验完成时间
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 自动生成检验单号
qualityCheckSchema.pre('save', async function(next) {
  if (!this.checkNumber) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `QC-${year}${month}-`;
    
    // 查找当月最大编号
    const lastCheck = await this.constructor.findOne({
      checkNumber: new RegExp(`^${prefix}`)
    }).sort({ checkNumber: -1 });
    
    let sequence = 1;
    if (lastCheck && lastCheck.checkNumber) {
      const lastSequence = parseInt(lastCheck.checkNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.checkNumber = `${prefix}${String(sequence).padStart(4, '0')}`;
  }
  
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('QualityCheck', qualityCheckSchema);
