const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, '请提供手机号'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^1[3-9]\d{9}$/.test(v);
      },
      message: props => `${props.value} 不是有效的手机号码！请输入11位中国大陆手机号。`
    }
  },
  full_name: {
    type: String,
    required: [true, '请提供姓名'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: [
      'Administrator',
      'Sales Manager',
      'Technical Engineer',
      'Sales Engineer',
      'Procurement Specialist',
      'Production Planner',
      'QA Inspector',
      'Logistics Specialist',
      'After-sales Engineer',
      'Shop Floor Worker'
    ],
    required: [true, '请提供用户角色'],
    default: 'Technical Engineer'
  },
  department: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  passwordChangeRequired: {
    type: Boolean,
    default: true,
    comment: '是否需要强制修改密码（新用户或管理员重置密码后为true）'
  },
  lastLogin: {
    type: Date
  },
  passwordResetRequested: {
    type: Boolean,
    default: false
  },
  passwordResetRequestedAt: {
    type: Date
  },
  passwordResetCode: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 性能优化：为经常查询的字段添加索引
userSchema.index({ phone: 1 }); // 手机号查询（登录）
userSchema.index({ role: 1 }); // 按角色筛选
userSchema.index({ createdAt: -1 }); // 按创建时间排序

module.exports = mongoose.model('User', userSchema);


