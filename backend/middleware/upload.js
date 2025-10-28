/**
 * 文件上传中间件配置（安全加固版本）
 * 使用multer处理文件上传
 * 
 * 安全措施:
 * 1. 严格的文件类型白名单（MIME type + 文件扩展名双重验证）
 * 2. 文件大小限制（防止DoS攻击）
 * 3. 禁止可执行文件和脚本文件
 * 4. 文件名清理（防止路径遍历攻击）
 */

const multer = require('multer');
const path = require('path');

// 使用内存存储（适合小文件，避免磁盘IO）
const storage = multer.memoryStorage();

/**
 * 安全的文件名清理
 * 移除特殊字符，防止路径遍历攻击
 */
const sanitizeFilename = (filename) => {
  // 移除路径分隔符和特殊字符
  return filename
    .replace(/[\/\\]/g, '')  // 移除路径分隔符
    .replace(/\.\./g, '')     // 移除..（防止目录遍历）
    .replace(/[<>:"|?*]/g, ''); // 移除Windows不允许的字符
};

/**
 * 危险文件扩展名黑名单
 * 绝对禁止的文件类型
 */
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.html', '.htm', '.mhtml', '.svg', '.xml', '.xsl', '.xslt',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.pl', '.rb', '.sh', '.bash',
  '.dll', '.so', '.dylib', '.app', '.deb', '.rpm',
  '.ade', '.adp', '.app', '.application', '.appx', '.appxbundle'
];

/**
 * 安全的文件类型白名单
 * 只允许业务必需的安全文件类型
 */
const SAFE_FILE_TYPES = {
  // 数据文件
  'data': {
    extensions: ['.csv', '.xlsx', '.xls'],
    mimeTypes: [
      'text/csv',
      'application/csv',
      'text/comma-separated-values',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },
  // 文档文件
  'document': {
    extensions: ['.pdf', '.doc', '.docx'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  },
  // 图片文件
  'image': {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ]
  }
};

/**
 * 文件类型验证器
 * 双重验证：MIME type + 文件扩展名
 */
const fileFilter = (req, file, cb) => {
  try {
    // 清理文件名
    file.originalname = sanitizeFilename(file.originalname);
    
    // 获取文件扩展名（转为小写）
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    // 1. 黑名单检查 - 绝对禁止危险文件
    if (DANGEROUS_EXTENSIONS.includes(fileExt)) {
      return cb(new Error(`安全限制：禁止上传 ${fileExt} 文件类型`), false);
    }
    
    // 2. 白名单检查 - 只允许安全的文件类型
    let isAllowed = false;
    
    for (const category in SAFE_FILE_TYPES) {
      const { extensions, mimeTypes } = SAFE_FILE_TYPES[category];
      
      // 同时检查扩展名和MIME类型
      if (extensions.includes(fileExt) && mimeTypes.includes(file.mimetype)) {
        isAllowed = true;
        break;
      }
    }
    
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型。允许的文件类型：PDF, Word, Excel, CSV, 图片（JPG, PNG等）`), false);
    }
  } catch (error) {
    cb(error, false);
  }
};

/**
 * 仅数据文件上传（CSV/Excel）
 * 用于数据导入功能
 */
const dataFileFilter = (req, file, cb) => {
  try {
    file.originalname = sanitizeFilename(file.originalname);
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    const { extensions, mimeTypes } = SAFE_FILE_TYPES.data;
    
    if (DANGEROUS_EXTENSIONS.includes(fileExt)) {
      return cb(new Error(`安全限制：禁止上传 ${fileExt} 文件类型`), false);
    }
    
    if (extensions.includes(fileExt) && mimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持CSV和Excel文件（.csv, .xlsx, .xls）'), false);
    }
  } catch (error) {
    cb(error, false);
  }
};

/**
 * 仅图片文件上传
 * 用于头像、产品图片等
 */
const imageFileFilter = (req, file, cb) => {
  try {
    file.originalname = sanitizeFilename(file.originalname);
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    const { extensions, mimeTypes } = SAFE_FILE_TYPES.image;
    
    if (extensions.includes(fileExt) && mimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件（JPG, PNG, GIF等）'), false);
    }
  } catch (error) {
    cb(error, false);
  }
};

// 配置multer（默认 - 通用文件上传）
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,  // 限制文件大小为10MB
    files: 5,                     // 限制单次最多上传5个文件
    fieldSize: 1024 * 1024        // 限制字段大小为1MB
  }
});

// 数据文件上传（CSV/Excel） - 用于数据导入
const dataUpload = multer({
  storage: storage,
  fileFilter: dataFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,  // 10MB
    files: 1                      // 只允许单文件上传
  }
});

// 图片文件上传 - 用于图片上传
const imageUpload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,   // 图片限制5MB
    files: 10                     // 最多10张图片
  }
});

// 导出不同的上传中间件
module.exports = upload;
module.exports.dataUpload = dataUpload;
module.exports.imageUpload = imageUpload;
module.exports.sanitizeFilename = sanitizeFilename;
