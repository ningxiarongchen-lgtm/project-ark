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
    phone: String,
    address: String
  },
  
  // Project details
  description: String,
  application: String, // Type of application for the actuators
  technical_requirements: String, // Customer's technical requirements (text description when no documents provided)
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
  // 项目负责人（销售）
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // 技术支持
  technical_support: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Project status
  status: {
    type: String,
    enum: [
      // 1. 销售阶段
      '待指派技术',          // 销售创建项目，等待指派技术工程师
      '选型中',              // 技术工程师正在进行技术选型
      '待商务报价',          // 技术选型完成，等待商务报价
      '已报价-询价中',       // 商务报价完成，销售可下载报价单给客户（未签约）
      '失单',                // 客户未接受报价，项目结束
      
      // 2. 合同阶段
      '待上传合同',          // 客户接受报价，销售需上传销售合同
      '待商务审核合同',      // 销售已上传合同，等待商务审核盖章
      '待客户盖章',          // 商务盖章完成，等待客户盖章
      '合同已签订-赢单',     // 客户盖章完成，正式赢单
      
      // 3. 生产阶段
      '待预付款',            // 等待客户支付预付款
      '生产准备中',          // 预付款到账，生产员准备BOM和排期
      '采购中',              // 缺料部分正在采购
      '生产中',              // 工厂正在生产
      
      // 4. 完成阶段
      '已完成',              // 项目完成
      
      // 兼容旧状态
      '赢单',
      'Won',
      'Pending Contract Review',
      'Pending Client Signature',
      'Contract Signed',
      'In Production'
    ],
    default: '待指派技术'
  },
  
  // 🔒 技术清单版本管理（新版本化结构）
  technical_versions: [{
    // 版本号
    version: {
      type: String,
      required: true,
      trim: true
      // 例如: 'V1', 'V2', 'V3'
    },
    
    // 版本状态
    status: {
      type: String,
      enum: ['草稿', '已提交', '已驳回', '已确认'],
      default: '草稿'
    },
    
    // 创建时间
    created_at: {
      type: Date,
      default: Date.now,
      required: true
    },
    
    // 创建者（技术工程师）
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // 该版本的技术清单项目
    items: [{
      // 位号/标签
      tag: {
        type: String,
        trim: true,
        uppercase: true
      },
      // 型号名称
      model_name: {
        type: String,
        required: true,
        trim: true
      },
      // 数量
      quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
      },
      // 描述/技术要求
      description: {
        type: String,
        trim: true
      },
      // 技术参数
      technical_specs: {
        torque: Number,
        pressure: Number,
        rotation: Number,
        temperature: {
          min: Number,
          max: Number
        },
        valve_type: String,
        valve_size: String
      },
      // 备注
      notes: String,
      // 添加时间
      added_at: {
        type: Date,
        default: Date.now
      }
    }],
    
    // 版本说明
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // 🔒 当前活动的技术清单版本号
  current_technical_version: {
    type: String,
    trim: true
    // 例如: 'V2'
  },
  
  // 🔒 技术清单是否已锁定（提交审核后锁定）
  technical_list_locked: {
    type: Boolean,
    default: false
  },
  
  // 技术需求清单（技术工程师填写）- 保留用于向后兼容
  technical_item_list: [{
    // 位号/标签
    tag: {
      type: String,
      trim: true,
      uppercase: true
    },
    // 型号名称
    model_name: {
      type: String,
      required: true,
      trim: true
    },
    // 数量
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    // 描述/技术要求
    description: {
      type: String,
      trim: true
    },
    // 技术参数
    technical_specs: {
      torque: Number,
      pressure: Number,
      rotation: Number,
      temperature: {
        min: Number,
        max: Number
      },
      valve_type: String,
      valve_size: String
    },
    // 备注
    notes: String,
    // 添加时间
    added_at: {
      type: Date,
      default: Date.now
    }
  }],
  
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
  
  // 🔒 基于的技术清单版本号（用于追溯报价来源）
  quotation_based_on_version: {
    type: String,
    trim: true
    // 例如: 'V1', 'V2', 记录此报价基于哪个技术清单版本
  },
  
  // 🔒 项目锁定状态（转化为合同订单后锁定，防止修改报价）
  is_locked: {
    type: Boolean,
    default: false
  },
  
  // 🔒 锁定时间
  locked_at: {
    type: Date
  },
  
  // 🔒 锁定原因
  locked_reason: {
    type: String,
    trim: true
    // 例如: '已转化为合同订单', '已签订合同'
  },
  
  // Quotation BOM - Commercial team's working copy with pricing rules
  quotation_bom: [{
    // Reference to system item (Actuator/Accessory) - OPTIONAL for manual items
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'quotation_bom.item_type',
    },
    
    // Type of item
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
    
    // Standard/Base price (from system)
    base_price: {
      type: Number,
      required: true,
      min: [0, 'Base price cannot be negative']
    },
    
    // Cost price (for profit calculation, only visible to authorized roles)
    cost_price: {
      type: Number,
      min: [0, 'Cost price cannot be negative']
    },
    
    // Temporary pricing rules for this quotation
    pricing_rules: {
      // Pricing type: 'tiered' | 'manual_override' | 'standard'
      type: {
        type: String,
        enum: ['standard', 'tiered', 'manual_override'],
        default: 'standard'
      },
      
      // Tiered pricing rules
      tiers: [{
        min_quantity: {
          type: Number,
          required: true,
          min: 1
        },
        unit_price: {
          type: Number,
          required: true,
          min: 0
        }
      }],
      
      // Manual override price
      manual_price: {
        type: Number,
        min: 0
      },
      
      // Discount percentage (for display)
      discount_percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      
      // Notes for pricing decision
      notes: String
    },
    
    // Calculated unit price (based on pricing rules and quantity)
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
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative']
  },
  
  // Project files uploaded during creation (technical specifications, etc.)
  project_files: [{
    file_name: {
      type: String,
      required: true,
      trim: true
    },
    file_url: {
      type: String,
      required: true,
      trim: true
    },
    objectId: String, // LeanCloud object ID for file deletion
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Contract files - Multi-step contract processing
  contract_files: {
    // Draft contract uploaded by Sales Manager
    draft_contract: {
      file_name: String,
      file_url: String,
      objectId: String,
      file_size: Number, // 🔒 文件大小（字节）
      file_hash: String, // 🔒 SHA-256哈希值
      uploadedAt: Date,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    
    // Company sealed contract uploaded by Business Engineer
    company_sealed_contract: {
      file_name: String,
      file_url: String,
      objectId: String,
      file_size: Number, // 🔒 文件大小（字节）
      file_hash: String, // 🔒 SHA-256哈希值
      uploadedAt: Date,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    
    // Final contract with both signatures
    final_contract: {
      file_name: String,
      file_url: String,
      objectId: String,
      file_size: Number, // 🔒 文件大小（字节）
      file_hash: String, // 🔒 SHA-256哈希值
      uploadedAt: Date,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  
  // 🔒 合同文件版本历史（用于审计追踪）
  contract_version_history: [{
    version_type: {
      type: String,
      enum: ['draft_contract', 'company_sealed_contract', 'final_contract'],
      required: true
    },
    file_name: String,
    file_url: String,
    objectId: String,
    file_size: Number,
    file_hash: String, // SHA-256哈希值
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String, // 上传说明
    replaced: {
      type: Boolean,
      default: false
    }, // 是否已被新版本替换
    replaced_at: Date
  }],
  
  // 🔒 合同哈希校验记录
  contract_hash_verifications: [{
    verified_at: {
      type: Date,
      default: Date.now
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    version_type: String, // 校验的合同类型
    file_hash: String, // 当时的哈希值
    comparison_hash: String, // 对比的哈希值
    match: Boolean, // 是否匹配
    notes: String // 校验说明
  }],
  
  // Priority
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  
  // 🔒 关键操作历史记录（用于审计和追溯）
  operation_history: [{
    operation_type: {
      type: String,
      required: true,
      enum: [
        'payment_confirmed',           // 确认收到预付款
        'production_order_created',    // 创建生产订单
        'contract_signed',             // 合同签署
        'contract_approved',           // 合同审批通过
        'contract_rejected',           // 合同驳回
        'project_status_changed',      // 项目状态变更
        'other'                        // 其他操作
      ]
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    operator_name: String,        // 冗余存储，防止用户删除
    operator_role: String,        // 操作人角色
    operation_time: {
      type: Date,
      default: Date.now,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed  // 存储操作的详细信息
    },
    ip_address: String,           // 操作人IP地址
    confirmation_text: String,    // 确认文本（用于责任声明）
    notes: String                 // 备注
  }]
  
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

// 性能优化：为经常查询和排序的字段添加索引
projectSchema.index({ projectNumber: 1 });
projectSchema.index({ status: 1 }); // 按状态筛选（最常用）
projectSchema.index({ createdBy: 1 });
projectSchema.index({ owner: 1 }); // 按负责人查询
projectSchema.index({ technical_support: 1 }); // 按技术支持查询
projectSchema.index({ 'client.name': 1 });
projectSchema.index({ priority: 1 }); // 按优先级筛选
projectSchema.index({ createdAt: -1 }); // 按创建时间排序
projectSchema.index({ updatedAt: -1 }); // 按更新时间排序
projectSchema.index({ status: 1, priority: 1 }); // 组合索引：状态+优先级

module.exports = mongoose.model('Project', projectSchema);


