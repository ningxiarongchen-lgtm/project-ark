const mongoose = require('mongoose');

const workCenterSchema = new mongoose.Schema({
  // 工作中心编码
  code: {
    type: String,
    required: [true, '请提供工作中心编码'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // 工作中心名称
  name: {
    type: String,
    required: [true, '请提供工作中心名称'],
    trim: true
  },
  
  // 工作中心类型
  type: {
    type: String,
    enum: {
      values: ['装配', '机加工', '测试', '包装', '检验', '其他'],
      message: '无效的工作中心类型'
    },
    required: [true, '请提供工作中心类型']
  },
  
  // 描述
  description: {
    type: String,
    trim: true
  },
  
  // 所在车间/区域
  workshop: {
    type: String,
    trim: true
  },
  
  // 位置
  location: {
    type: String,
    trim: true
  },
  
  // 产能信息
  capacity: {
    // 标准产能（每小时）
    standard_capacity: {
      type: Number,
      min: 0,
      default: 1
    },
    
    // 产能单位
    capacity_unit: {
      type: String,
      default: '件/小时'
    },
    
    // 工作班次数
    shifts_per_day: {
      type: Number,
      min: 1,
      max: 3,
      default: 1
    },
    
    // 每班次工作小时数
    hours_per_shift: {
      type: Number,
      min: 1,
      max: 12,
      default: 8
    }
  },
  
  // 设备信息
  equipment: {
    // 主要设备清单
    main_equipment: [{
      name: String,
      model: String,
      quantity: Number
    }],
    
    // 设备状态
    status: {
      type: String,
      enum: ['正常', '维护中', '故障', '停用'],
      default: '正常'
    }
  },
  
  // 人员配置
  staffing: {
    // 所需操作工数量
    required_operators: {
      type: Number,
      min: 0,
      default: 1
    },
    
    // 当前操作工数量
    current_operators: {
      type: Number,
      min: 0,
      default: 0
    },
    
    // 技能要求
    skill_requirements: [{
      type: String,
      trim: true
    }]
  },
  
  // 负责人
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 关联的操作工
  operators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // 可处理的工序类型
  capable_operations: [{
    operation_name: {
      type: String,
      required: true,
      trim: true
    },
    
    // 标准工时（分钟）
    standard_time: {
      type: Number,
      min: 0
    },
    
    // 准备时间（分钟）
    setup_time: {
      type: Number,
      min: 0,
      default: 0
    }
  }],
  
  // 工作日历
  calendar: {
    // 工作日（0=周日, 1=周一, ..., 6=周六）
    working_days: {
      type: [Number],
      default: [1, 2, 3, 4, 5] // 默认周一到周五
    },
    
    // 节假日
    holidays: [{
      date: Date,
      name: String
    }]
  },
  
  // 质量指标
  quality_metrics: {
    // 合格率目标
    target_pass_rate: {
      type: Number,
      min: 0,
      max: 100,
      default: 98
    },
    
    // 当前合格率
    current_pass_rate: {
      type: Number,
      min: 0,
      max: 100
    },
    
    // 返工率
    rework_rate: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  // 成本信息
  cost: {
    // 小时费率
    hourly_rate: {
      type: Number,
      min: 0
    },
    
    // 单件成本
    unit_cost: {
      type: Number,
      min: 0
    }
  },
  
  // 状态
  is_active: {
    type: Boolean,
    default: true
  },
  
  // 备注
  notes: {
    type: String,
    trim: true
  }
  
}, {
  timestamps: true
});

// 索引
workCenterSchema.index({ code: 1 });
workCenterSchema.index({ type: 1 });
workCenterSchema.index({ workshop: 1 });
workCenterSchema.index({ is_active: 1 });
workCenterSchema.index({ supervisor: 1 });

// 虚拟字段：利用率
workCenterSchema.virtual('utilization_rate').get(function() {
  if (this.staffing.required_operators === 0) return 0;
  return (this.staffing.current_operators / this.staffing.required_operators) * 100;
});

// 虚拟字段：每日产能
workCenterSchema.virtual('daily_capacity').get(function() {
  return this.capacity.standard_capacity * 
         this.capacity.hours_per_shift * 
         this.capacity.shifts_per_day;
});

// 实例方法：检查是否可以执行某个工序
workCenterSchema.methods.canPerformOperation = function(operationName) {
  return this.capable_operations.some(
    op => op.operation_name === operationName
  );
};

// 实例方法：获取工序标准工时
workCenterSchema.methods.getOperationTime = function(operationName) {
  const operation = this.capable_operations.find(
    op => op.operation_name === operationName
  );
  return operation ? operation.standard_time : null;
};

// 实例方法：检查是否在工作日
workCenterSchema.methods.isWorkingDay = function(date) {
  const dayOfWeek = date.getDay();
  
  // 检查是否是工作日
  if (!this.calendar.working_days.includes(dayOfWeek)) {
    return false;
  }
  
  // 检查是否是节假日
  const dateStr = date.toISOString().split('T')[0];
  const isHoliday = this.calendar.holidays.some(
    holiday => holiday.date.toISOString().split('T')[0] === dateStr
  );
  
  return !isHoliday;
};

// 静态方法：获取可执行某工序的工作中心
workCenterSchema.statics.findByOperation = async function(operationName) {
  return await this.find({
    is_active: true,
    'capable_operations.operation_name': operationName
  }).populate('supervisor', 'username email')
    .populate('operators', 'username email');
};

// 静态方法：获取工作中心统计
workCenterSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $match: { is_active: true }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byType: {
          $push: {
            type: '$type',
            count: 1
          }
        },
        totalCapacity: {
          $sum: {
            $multiply: [
              '$capacity.standard_capacity',
              '$capacity.hours_per_shift',
              '$capacity.shifts_per_day'
            ]
          }
        },
        avgUtilization: {
          $avg: {
            $cond: [
              { $eq: ['$staffing.required_operators', 0] },
              0,
              {
                $multiply: [
                  {
                    $divide: [
                      '$staffing.current_operators',
                      '$staffing.required_operators'
                    ]
                  },
                  100
                ]
              }
            ]
          }
        }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    total: 0,
    byType: [],
    totalCapacity: 0,
    avgUtilization: 0
  };
};

module.exports = mongoose.model('WorkCenter', workCenterSchema);

