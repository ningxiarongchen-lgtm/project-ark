const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { protect } = require('../middleware/auth');

/**
 * 合同管理路由
 * 所有路由都需要认证
 */

// 销售经理上传草签合同（Won状态）
router.post(
  '/projects/:projectId/contract/draft',
  protect,
  contractController.uploadDraftContract
);

// 商务工程师审核并上传盖章合同
router.post(
  '/projects/:projectId/contract/review',
  protect,
  contractController.reviewAndUploadSealedContract
);

// 销售经理上传最终合同（客户已签）
router.post(
  '/projects/:projectId/contract/final',
  protect,
  contractController.uploadFinalContract
);

// 获取项目合同信息
router.get(
  '/projects/:projectId/contract',
  protect,
  contractController.getContractInfo
);

// 🔒 获取合同版本历史和哈希校验记录
router.get(
  '/projects/:projectId/contract/version-history',
  protect,
  contractController.getContractVersionHistory
);

// 删除合同文件
router.delete(
  '/projects/:projectId/contract',
  protect,
  contractController.deleteContractFile
);

module.exports = router;

