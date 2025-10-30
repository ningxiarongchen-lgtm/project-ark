/**
 * 通用输入验证规则和验证中间件
 * 使用 express-validator 进行输入清理和验证
 * 防止XSS、SQL注入等安全漏洞
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * 验证结果处理中间件
 * 检查验证链的结果，如果有错误则返回400
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// ==================== 通用验证规则 ====================

/**
 * MongoDB ObjectId 验证
 */
exports.validateObjectId = (fieldName = 'id') => {
  return param(fieldName)
    .isMongoId()
    .withMessage(`${fieldName} 必须是有效的MongoDB ObjectId`);
};

/**
 * 手机号验证（中国）
 */
exports.validatePhone = (fieldName = 'phone', required = false) => {
  const validator = body(fieldName).trim();
  
  if (required) {
    return validator
      .notEmpty()
      .withMessage('手机号不能为空')
      .isMobilePhone('zh-CN')
      .withMessage('请输入有效的手机号码');
  }
  
  return validator
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号码');
};

/**
 * 密码验证
 */
exports.validatePassword = (fieldName = 'password', minLength = 6) => {
  return body(fieldName)
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: minLength })
    .withMessage(`密码至少需要${minLength}个字符`)
    .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
    .withMessage('密码必须包含字母和数字');
};

/**
 * 名称验证（通用）
 */
exports.validateName = (fieldName = 'name', required = true, maxLength = 100) => {
  const validator = body(fieldName)
    .trim()
    .escape(); // 转义HTML特殊字符，防止XSS
  
  if (required) {
    return validator
      .notEmpty()
      .withMessage(`${fieldName} 不能为空`)
      .isLength({ max: maxLength })
      .withMessage(`${fieldName} 不能超过${maxLength}个字符`);
  }
  
  return validator
    .optional()
    .isLength({ max: maxLength })
    .withMessage(`${fieldName} 不能超过${maxLength}个字符`);
};

/**
 * URL验证
 */
exports.validateUrl = (fieldName, required = false) => {
  const validator = body(fieldName).trim();
  
  if (required) {
    return validator
      .notEmpty()
      .withMessage(`${fieldName} 不能为空`)
      .isURL()
      .withMessage(`${fieldName} 必须是有效的URL`);
  }
  
  return validator
    .optional()
    .isURL()
    .withMessage(`${fieldName} 必须是有效的URL`);
};

/**
 * 数字验证
 */
exports.validateNumber = (fieldName, options = {}) => {
  const { required = false, min, max, isInt = false } = options;
  const validator = body(fieldName);
  
  if (required) {
    validator.notEmpty().withMessage(`${fieldName} 不能为空`);
  } else {
    validator.optional();
  }
  
  if (isInt) {
    validator.isInt({ min, max }).withMessage(`${fieldName} 必须是整数${min ? `，最小值${min}` : ''}${max ? `，最大值${max}` : ''}`);
  } else {
    validator.isFloat({ min, max }).withMessage(`${fieldName} 必须是数字${min ? `，最小值${min}` : ''}${max ? `，最大值${max}` : ''}`);
  }
  
  return validator;
};

/**
 * 日期验证
 */
exports.validateDate = (fieldName, required = false) => {
  const validator = body(fieldName);
  
  if (required) {
    return validator
      .notEmpty()
      .withMessage(`${fieldName} 不能为空`)
      .isISO8601()
      .withMessage(`${fieldName} 必须是有效的日期格式`);
  }
  
  return validator
    .optional()
    .isISO8601()
    .withMessage(`${fieldName} 必须是有效的日期格式`);
};

/**
 * 枚举值验证
 */
exports.validateEnum = (fieldName, allowedValues, required = true) => {
  const validator = body(fieldName).trim();
  
  if (required) {
    return validator
      .notEmpty()
      .withMessage(`${fieldName} 不能为空`)
      .isIn(allowedValues)
      .withMessage(`${fieldName} 必须是以下值之一: ${allowedValues.join(', ')}`);
  }
  
  return validator
    .optional()
    .isIn(allowedValues)
    .withMessage(`${fieldName} 必须是以下值之一: ${allowedValues.join(', ')}`);
};

// ==================== 业务特定验证规则 ====================

/**
 * 用户注册验证
 */
exports.userRegistrationValidation = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('手机号不能为空')
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的11位中国大陆手机号'),
  
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('姓名不能为空')
    .isLength({ min: 2, max: 50 })
    .withMessage('姓名必须在2-50个字符之间')
    .escape(),
  
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6个字符'),
  
  body('role')
    .optional()
    .isIn(['Technical Engineer', 'Sales Engineer', 'Sales Manager', 'Procurement Specialist', 'Production Planner', 'After-sales Engineer', 'Administrator'])
    .withMessage('无效的用户角色'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('部门名称不能超过100个字符')
    .escape()
];

/**
 * 用户登录验证
 */
exports.userLoginValidation = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('手机号不能为空')
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的11位中国大陆手机号'),
  
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
];

/**
 * 用户更新验证
 */
exports.userUpdateValidation = [
  body('phone')
    .optional()
    .trim()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的11位中国大陆手机号'),
  
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('姓名必须在2-50个字符之间')
    .escape(),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('部门名称不能超过100个字符')
    .escape()
];

/**
 * 项目创建验证
 */
exports.projectValidation = [
  body('projectName')
    .trim()
    .notEmpty()
    .withMessage('项目名称不能为空')
    .isLength({ max: 200 })
    .withMessage('项目名称不能超过200个字符')
    .escape(),
  
  body('client.name')
    .trim()
    .notEmpty()
    .withMessage('客户名称不能为空')
    .isLength({ max: 200 })
    .withMessage('客户名称不能超过200个字符')
    .escape(),
  
  body('client.company')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('客户公司不能超过200个字符')
    .escape(),
  
  body('client.phone')
    .optional()
    .trim(),
  
  body('client.address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('客户地址不能超过500个字符'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('项目描述不能超过2000个字符'),
  
  body('application')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('应用场景不能超过500个字符'),
  
  body('technical_requirements')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('客户技术需求不能超过5000个字符'),
  
  body('industry')
    .optional()
    .isIn(['Oil & Gas', 'Water Treatment', 'Chemical', 'Power Generation', 'Manufacturing', 'Food & Beverage', 'Other'])
    .withMessage('无效的行业类型'),
  
  body('budget')
    .optional()
    .isNumeric()
    .withMessage('预算必须是数字'),
  
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Urgent'])
    .withMessage('无效的优先级'),
  
  body('status')
    .optional()
    .isIn(['待指派技术', '选型中', '待商务报价', '已报价', '赢单', '失单', '待商务审核合同', '待客户盖章', '合同已签订'])
    .withMessage('无效的项目状态')
];

/**
 * 供应商验证
 */
exports.supplierValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('供应商名称不能为空')
    .isLength({ max: 200 })
    .withMessage('供应商名称不能超过200个字符')
    .escape(),
  
  body('phone')
    .optional()
    .trim()
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号码'),
  
  body('contactPerson')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('联系人不能超过100个字符')
    .escape(),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('地址不能超过500个字符')
    .escape(),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Pending'])
    .withMessage('无效的供应商状态'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('评分必须在1-5之间')
];

/**
 * 订单验证
 */
exports.orderValidation = [
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('客户名称不能为空')
    .isLength({ max: 200 })
    .withMessage('客户名称不能超过200个字符')
    .escape(),
  
  body('totalAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('订单金额必须大于等于0'),
  
  body('status')
    .optional()
    .isIn(['Pending', 'Approved', 'In Production', 'Shipped', 'Completed', 'Cancelled'])
    .withMessage('无效的订单状态'),
  
  body('paymentStatus')
    .optional()
    .isIn(['Unpaid', 'Partial', 'Paid'])
    .withMessage('无效的付款状态')
];

/**
 * 采购订单验证
 */
exports.purchaseOrderValidation = [
  body('supplier')
    .notEmpty()
    .withMessage('供应商不能为空')
    .isMongoId()
    .withMessage('无效的供应商ID'),
  
  body('totalAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('采购金额必须大于等于0'),
  
  body('status')
    .optional()
    .isIn(['Draft', 'Sent', 'Confirmed', 'In Transit', 'Received', 'Cancelled'])
    .withMessage('无效的采购订单状态'),
  
  body('deliveryDate')
    .optional()
    .isISO8601()
    .withMessage('交付日期格式不正确')
];

/**
 * 工单验证
 */
exports.ticketValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('工单标题不能为空')
    .isLength({ max: 200 })
    .withMessage('标题不能超过200个字符')
    .escape(),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('描述不能超过2000个字符')
    .escape(),
  
  body('ticketType')
    .optional()
    .isIn(['Installation', 'Maintenance', 'Repair', 'Technical Support', 'Training', 'Complaint'])
    .withMessage('无效的工单类型'),
  
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Urgent'])
    .withMessage('无效的优先级'),
  
  body('status')
    .optional()
    .isIn(['Open', 'In Progress', 'Pending Customer', 'Resolved', 'Closed'])
    .withMessage('无效的工单状态')
];

/**
 * 查询参数分页验证
 */
exports.paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间')
];

