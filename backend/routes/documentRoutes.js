const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const {
  uploadAndParse,
  batchSelectFromParams
} = require('../controllers/documentUploadController');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/documents/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/bmp',
    'image/tiff',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型。支持: PDF, JPG, PNG, BMP, TIFF, Excel'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  }
});

// 所有路由都需要认证
router.use(protect);

// @route   POST /api/document/upload
// @desc    上传并智能解析文档
// @access  Private
router.post('/upload', upload.single('document'), uploadAndParse);

// @route   POST /api/document/batch-select
// @desc    从解析的参数批量选型
// @access  Private
router.post('/batch-select', batchSelectFromParams);

module.exports = router;
