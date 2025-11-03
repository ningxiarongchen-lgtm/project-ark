const Project = require('../models/Project');
const Contract = require('../models/Contract');
const AV = require('leancloud-storage');
const { calculateFileHashFromUrl } = require('../utils/fileHash'); // 🔒 引入哈希计算工具
const notificationService = require('../services/notificationService'); // 🔔 引入通知服务

/**
 * 合同管理控制器
 * 处理合同上传、审核和签署流程
 */

// ============================================
// 合同管理中心 API
// ============================================

/**
 * 获取合同列表 - 支持多维度查询和筛选
 * GET /api/contracts
 * 查询参数:
 * - project: 项目ID
 * - contractType: Sales | Procurement
 * - status: 合同状态
 * - search: 全局文本搜索
 * - page: 页码
 * - limit: 每页数量
 */
exports.getContracts = async (req, res) => {
  try {
    const {
      project,
      contractType,
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件
    let query = {};

    // 按项目筛选
    if (project) {
      query.project = project;
    }

    // 按合同类型筛选
    if (contractType) {
      query.contractType = contractType;
    }

    // 按状态筛选
    if (status) {
      query.status = status;
    }

    // 全局文本搜索
    if (search) {
      query.$text = { $search: search };
    }

    // 权限控制 - 非管理员只能看到自己相关的合同
    if (!['Admin', 'Business Engineer'].includes(req.user.role)) {
      query.createdBy = req.user._id;
    }

    // 计算分页
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // 构建排序
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // 执行查询
    const [contracts, total] = await Promise.all([
      Contract.find(query)
        .populate('project', 'projectName projectNumber status')
        .populate('createdBy', 'name email phone role')
        .populate('updatedBy', 'name email phone role')
        .populate('files.uploadedBy', 'name role')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Contract.countDocuments(query)
    ]);

    // 为每个合同添加最新文件信息
    const contractsWithLatestFile = contracts.map(contract => {
      let latestFile = null;
      if (contract.files && contract.files.length > 0) {
        const final = contract.files.find(f => f.version === 'final');
        const sealed = contract.files.find(f => f.version === 'sealed');
        const draft = contract.files.find(f => f.version === 'draft');
        latestFile = final || sealed || draft;
      }
      
      return {
        ...contract,
        latestFile
      };
    });

    res.status(200).json({
      success: true,
      data: contractsWithLatestFile,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get contracts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * 获取单个合同详情
 * GET /api/contracts/:id
 */
exports.getContractById = async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findById(id)
      .populate('project', 'projectName projectNumber status customer')
      .populate('createdBy', 'name email phone role')
      .populate('updatedBy', 'name email phone role')
      .populate('files.uploadedBy', 'name email phone role')
      .populate('reviewHistory.reviewedBy', 'name email phone role');

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // 权限检查
    const hasAccess =
      req.user.role === 'Admin' ||
      req.user.role === 'Business Engineer' ||
      contract.createdBy._id.toString() === req.user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: contract
    });
  } catch (error) {
    console.error('Get contract by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * 创建新合同
 * POST /api/contracts
 */
exports.createContract = async (req, res) => {
  try {
    const {
      title,
      contractType,
      project,
      partyA,
      partyB,
      amount,
      signDate,
      effectiveDate,
      expiryDate,
      paymentTerms,
      deliveryTerms,
      warrantyTerms,
      description,
      tags
    } = req.body;

    // 生成合同编号
    const contractNumber = await Contract.generateContractNumber(contractType);

    // 创建合同
    const contract = new Contract({
      contractNumber,
      title,
      contractType,
      project,
      partyA,
      partyB,
      amount,
      signDate,
      effectiveDate,
      expiryDate,
      paymentTerms,
      deliveryTerms,
      warrantyTerms,
      description,
      tags,
      status: 'Draft',
      createdBy: req.user._id
    });

    await contract.save();

    // 填充关联信息
    await contract.populate('project', 'projectName projectNumber');
    await contract.populate('createdBy', 'name email phone role');

    // 🔔 如果合同状态是待审批，发送通知给商务工程师
    // 注意：Draft状态不发送通知，只有提交审批时才发送
    // 这里留作示例，实际通知会在状态更新为 'Under Review' 时发送

    res.status(201).json({
      success: true,
      message: 'Contract created successfully',
      data: contract
    });
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * 更新合同
 * PUT /api/contracts/:id
 */
exports.updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // 权限检查
    const canEdit =
      req.user.role === 'Admin' ||
      req.user.role === 'Business Engineer' ||
      contract.createdBy.toString() === req.user._id.toString();

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // 检查状态变化
    const oldStatus = contract.status;
    const newStatus = updateData.status;

    // 更新字段
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== 'createdBy' && key !== 'contractNumber') {
        contract[key] = updateData[key];
      }
    });

    contract.updatedBy = req.user._id;
    await contract.save();

    await contract.populate('project', 'projectName projectNumber');
    await contract.populate('createdBy', 'name email phone role');
    await contract.populate('updatedBy', 'name email phone role');

    // 🔔 发送通知：合同状态变化
    try {
      if (oldStatus !== newStatus && newStatus === 'Under Review') {
        // 合同提交审批 → 通知商务工程师
        if (contract.contractType === 'Procurement') {
          await notificationService.notifyPurchaseContractSubmitted(contract);
        } else if (contract.contractType === 'Sales') {
          await notificationService.notifySalesContractSubmitted(contract);
        }
      }
    } catch (notifyError) {
      console.error('⚠️ 发送合同审批通知失败:', notifyError);
      // 不中断主流程
    }

    res.status(200).json({
      success: true,
      message: 'Contract updated successfully',
      data: contract
    });
  } catch (error) {
    console.error('Update contract error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * 上传合同文件
 * POST /api/contracts/:id/upload
 */
exports.uploadContractFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { version, file_name, file_url, objectId } = req.body;

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // 计算文件哈希
    let fileHash = null;
    let fileSize = null;

    try {
      const hashResult = await calculateFileHashFromUrl(file_url);
      fileHash = hashResult.hash;
      fileSize = hashResult.size;
      console.log('✅ 合同文件哈希值计算完成:', fileHash);
    } catch (hashError) {
      console.warn('⚠️ 哈希值计算失败:', hashError.message);
    }

    // 添加文件
    await contract.addFile({
      version,
      file_name,
      file_url,
      objectId,
      file_size: fileSize,
      file_hash: fileHash
    }, req.user._id);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: contract
    });
  } catch (error) {
    console.error('Upload contract file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * 获取合同统计信息
 * GET /api/contracts/stats
 */
exports.getContractStats = async (req, res) => {
  try {
    const { project } = req.query;

    let matchQuery = {};
    if (project) {
      matchQuery.project = new mongoose.Types.ObjectId(project);
    }

    // 如果不是管理员或商务工程师，只能看自己的
    if (!['Admin', 'Business Engineer'].includes(req.user.role)) {
      matchQuery.createdBy = req.user._id;
    }

    const stats = await Contract.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            type: '$contractType',
            status: '$status'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount.total' }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count',
              totalAmount: '$totalAmount'
            }
          },
          totalCount: { $sum: '$count' },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get contract stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// 原有的项目合同管理 API（保持向后兼容）
// ============================================

// 销售经理上传草签合同（Won状态后）
exports.uploadDraftContract = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { file_name, file_url, objectId } = req.body;

    // 查找项目
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // 检查项目状态是否为Won
    if (project.status !== 'Won') {
      return res.status(400).json({ 
        message: 'Can only upload draft contract when project status is Won',
        currentStatus: project.status
      });
    }

    // 检查用户权限（销售经理或创建者）
    const isSalesManager = req.user.role === 'Sales Manager';
    const isCreator = project.createdBy.toString() === req.user._id.toString();
    
    if (!isSalesManager && !isCreator) {
      return res.status(403).json({ 
        message: 'Only Sales Manager or project creator can upload draft contract' 
      });
    }

    // 🔒 计算文件哈希值
    console.log('🔒 开始计算草签合同哈希值...');
    let fileHash = null;
    let fileSize = null;
    
    try {
      const hashResult = await calculateFileHashFromUrl(file_url);
      fileHash = hashResult.hash;
      fileSize = hashResult.size;
      console.log('✅ 草签合同哈希值计算完成:', fileHash);
    } catch (hashError) {
      console.error('⚠️ 哈希值计算失败，继续上传但不记录哈希:', hashError.message);
    }

    // 如果已有草签合同，将其标记为已替换并保存到历史
    if (project.contract_files?.draft_contract?.objectId) {
      // 将当前版本添加到历史记录（标记为已替换）
      project.contract_version_history = project.contract_version_history || [];
      project.contract_version_history.push({
        version_type: 'draft_contract',
        file_name: project.contract_files.draft_contract.file_name,
        file_url: project.contract_files.draft_contract.file_url,
        objectId: project.contract_files.draft_contract.objectId,
        file_size: project.contract_files.draft_contract.file_size,
        file_hash: project.contract_files.draft_contract.file_hash,
        uploadedAt: project.contract_files.draft_contract.uploadedAt,
        uploadedBy: project.contract_files.draft_contract.uploadedBy,
        replaced: true,
        replaced_at: new Date(),
        notes: '被新版本替换'
      });
      
      // 删除旧文件（可选）
      try {
        const oldFile = AV.Object.createWithoutData('_File', project.contract_files.draft_contract.objectId);
        await oldFile.destroy();
      } catch (error) {
        console.error('Error deleting old draft contract:', error);
      }
    }

    // 保存草签合同信息
    project.contract_files = {
      ...project.contract_files,
      draft_contract: {
        file_name,
        file_url,
        objectId,
        file_size: fileSize,
        file_hash: fileHash, // 🔒 保存哈希值
        uploadedAt: new Date(),
        uploadedBy: req.user._id
      }
    };
    
    // 🔒 将当前版本添加到历史记录
    project.contract_version_history = project.contract_version_history || [];
    project.contract_version_history.push({
      version_type: 'draft_contract',
      file_name,
      file_url,
      objectId,
      file_size: fileSize,
      file_hash: fileHash,
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
      replaced: false,
      notes: '草签合同上传'
    });

    // 更新项目状态为"待商务审核合同"
    project.status = 'Pending Contract Review';

    await project.save();

    // 填充用户信息
    await project.populate('contract_files.draft_contract.uploadedBy', 'name email phone');

    res.json({
      message: 'Draft contract uploaded successfully',
      project: {
        _id: project._id,
        projectNumber: project.projectNumber,
        projectName: project.projectName,
        status: project.status,
        contract_files: project.contract_files
      }
    });
  } catch (error) {
    console.error('Upload draft contract error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 商务工程师审核合同并上传盖章合同
exports.reviewAndUploadSealedContract = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { file_name, file_url, objectId, approved, review_notes } = req.body;

    // 查找项目
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // 检查项目状态
    if (project.status !== 'Pending Contract Review') {
      return res.status(400).json({ 
        message: 'Project is not in Pending Contract Review status',
        currentStatus: project.status
      });
    }

    // 检查用户权限（商务工程师）
    if (req.user.role !== 'Business Engineer') {
      return res.status(403).json({ 
        message: 'Only Business Engineer can review and seal contract' 
      });
    }

    // 如果不批准，返回到Won状态
    if (!approved) {
      project.status = 'Won';
      project.internalNotes = `${project.internalNotes || ''}\n[${new Date().toISOString()}] Contract review rejected by ${req.user.name}: ${review_notes || 'No notes provided'}`;
      await project.save();

      return res.json({
        message: 'Contract review rejected, project returned to Won status',
        project: {
          _id: project._id,
          projectNumber: project.projectNumber,
          status: project.status
        }
      });
    }

    // 如果批准，保存盖章合同
    // 🔒 计算文件哈希值
    console.log('🔒 开始计算公司盖章合同哈希值...');
    let fileHash = null;
    let fileSize = null;
    
    try {
      const hashResult = await calculateFileHashFromUrl(file_url);
      fileHash = hashResult.hash;
      fileSize = hashResult.size;
      console.log('✅ 公司盖章合同哈希值计算完成:', fileHash);
      
      // 🔒 与草签合同哈希值对比
      if (project.contract_files?.draft_contract?.file_hash) {
        const draftHash = project.contract_files.draft_contract.file_hash;
        if (draftHash === fileHash) {
          console.log('⚠️ 警告：公司盖章合同与草签合同哈希值相同，可能未修改');
        } else {
          console.log('✅ 公司盖章合同与草签合同内容不同（预期行为）');
        }
      }
    } catch (hashError) {
      console.error('⚠️ 哈希值计算失败，继续上传但不记录哈希:', hashError.message);
    }
    
    // 如果已有公司盖章合同，将其标记为已替换并保存到历史
    if (project.contract_files?.company_sealed_contract?.objectId) {
      project.contract_version_history = project.contract_version_history || [];
      project.contract_version_history.push({
        version_type: 'company_sealed_contract',
        file_name: project.contract_files.company_sealed_contract.file_name,
        file_url: project.contract_files.company_sealed_contract.file_url,
        objectId: project.contract_files.company_sealed_contract.objectId,
        file_size: project.contract_files.company_sealed_contract.file_size,
        file_hash: project.contract_files.company_sealed_contract.file_hash,
        uploadedAt: project.contract_files.company_sealed_contract.uploadedAt,
        uploadedBy: project.contract_files.company_sealed_contract.uploadedBy,
        replaced: true,
        replaced_at: new Date(),
        notes: '被新版本替换'
      });
      
      try {
        const oldFile = AV.Object.createWithoutData('_File', project.contract_files.company_sealed_contract.objectId);
        await oldFile.destroy();
      } catch (error) {
        console.error('Error deleting old sealed contract:', error);
      }
    }

    // 保存公司盖章合同信息
    project.contract_files = {
      ...project.contract_files,
      company_sealed_contract: {
        file_name,
        file_url,
        objectId,
        file_size: fileSize,
        file_hash: fileHash, // 🔒 保存哈希值
        uploadedAt: new Date(),
        uploadedBy: req.user._id
      }
    };
    
    // 🔒 将当前版本添加到历史记录
    project.contract_version_history = project.contract_version_history || [];
    project.contract_version_history.push({
      version_type: 'company_sealed_contract',
      file_name,
      file_url,
      objectId,
      file_size: fileSize,
      file_hash: fileHash,
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
      replaced: false,
      notes: review_notes || '公司盖章合同上传'
    });

    // 更新项目状态为"待客户盖章"
    project.status = 'Pending Client Signature';

    // 添加审核记录
    if (review_notes) {
      project.internalNotes = `${project.internalNotes || ''}\n[${new Date().toISOString()}] Contract approved and sealed by ${req.user.name}: ${review_notes}`;
    }

    await project.save();

    // 填充用户信息
    await project.populate('contract_files.company_sealed_contract.uploadedBy', 'name email phone');

    res.json({
      message: 'Contract approved and company sealed contract uploaded successfully',
      project: {
        _id: project._id,
        projectNumber: project.projectNumber,
        projectName: project.projectName,
        status: project.status,
        contract_files: project.contract_files
      }
    });
  } catch (error) {
    console.error('Review contract error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 销售经理上传最终合同（客户已签）
exports.uploadFinalContract = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { file_name, file_url, objectId } = req.body;

    // 查找项目
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // 检查项目状态
    if (project.status !== 'Pending Client Signature') {
      return res.status(400).json({ 
        message: 'Project is not in Pending Client Signature status',
        currentStatus: project.status
      });
    }

    // 检查用户权限（销售经理或创建者）
    const isSalesManager = req.user.role === 'Sales Manager';
    const isCreator = project.createdBy.toString() === req.user._id.toString();
    
    if (!isSalesManager && !isCreator) {
      return res.status(403).json({ 
        message: 'Only Sales Manager or project creator can upload final contract' 
      });
    }

    // 🔒 计算文件哈希值
    console.log('🔒 开始计算最终合同哈希值...');
    let fileHash = null;
    let fileSize = null;
    
    try {
      const hashResult = await calculateFileHashFromUrl(file_url);
      fileHash = hashResult.hash;
      fileSize = hashResult.size;
      console.log('✅ 最终合同哈希值计算完成:', fileHash);
      
      // 🔒 关键校验：与公司盖章合同哈希值对比
      if (project.contract_files?.company_sealed_contract?.file_hash) {
        const sealedHash = project.contract_files.company_sealed_contract.file_hash;
        const hashMatch = (sealedHash === fileHash);
        
        // 记录哈希校验
        project.contract_hash_verifications = project.contract_hash_verifications || [];
        project.contract_hash_verifications.push({
          verified_at: new Date(),
          verified_by: req.user._id,
          version_type: 'final_contract',
          file_hash: fileHash,
          comparison_hash: sealedHash,
          match: hashMatch,
          notes: hashMatch ? 
            '✅ 最终合同与公司盖章版本哈希值匹配，内容未被修改' : 
            '⚠️ 警告：最终合同与公司盖章版本哈希值不匹配，内容可能已被修改，请人工核对！'
        });
        
        if (!hashMatch) {
          console.warn('⚠️⚠️⚠️ 严重警告：最终合同与公司盖章合同哈希值不匹配！');
          console.warn('公司盖章版哈希:', sealedHash);
          console.warn('最终版哈希:', fileHash);
        } else {
          console.log('✅ 最终合同与公司盖章合同内容一致（哈希值匹配）');
        }
      } else {
        console.warn('⚠️ 无法找到公司盖章合同的哈希值进行对比');
      }
    } catch (hashError) {
      console.error('⚠️ 哈希值计算失败，继续上传但不记录哈希:', hashError.message);
    }
    
    // 如果已有最终合同，将其标记为已替换并保存到历史
    if (project.contract_files?.final_contract?.objectId) {
      project.contract_version_history = project.contract_version_history || [];
      project.contract_version_history.push({
        version_type: 'final_contract',
        file_name: project.contract_files.final_contract.file_name,
        file_url: project.contract_files.final_contract.file_url,
        objectId: project.contract_files.final_contract.objectId,
        file_size: project.contract_files.final_contract.file_size,
        file_hash: project.contract_files.final_contract.file_hash,
        uploadedAt: project.contract_files.final_contract.uploadedAt,
        uploadedBy: project.contract_files.final_contract.uploadedBy,
        replaced: true,
        replaced_at: new Date(),
        notes: '被新版本替换'
      });
      
      try {
        const oldFile = AV.Object.createWithoutData('_File', project.contract_files.final_contract.objectId);
        await oldFile.destroy();
      } catch (error) {
        console.error('Error deleting old final contract:', error);
      }
    }

    // 保存最终合同信息
    project.contract_files = {
      ...project.contract_files,
      final_contract: {
        file_name,
        file_url,
        objectId,
        file_size: fileSize,
        file_hash: fileHash, // 🔒 保存哈希值
        uploadedAt: new Date(),
        uploadedBy: req.user._id
      }
    };
    
    // 🔒 将当前版本添加到历史记录
    project.contract_version_history = project.contract_version_history || [];
    project.contract_version_history.push({
      version_type: 'final_contract',
      file_name,
      file_url,
      objectId,
      file_size: fileSize,
      file_hash: fileHash,
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
      replaced: false,
      notes: '最终合同上传（客户已签）'
    });

    // 更新项目状态为"合同已签署"
    project.status = 'Contract Signed';

    await project.save();

    // 🔔 发送通知：项目赢单 → 通知生产计划员创建生产订单
    try {
      await notificationService.notifyProjectWon(project);
    } catch (notifyError) {
      console.error('⚠️ 发送项目赢单通知失败:', notifyError);
      // 不中断主流程
    }

    // 填充用户信息
    await project.populate('contract_files.final_contract.uploadedBy', 'name email phone');

    res.json({
      message: 'Final contract uploaded successfully, contract process completed',
      project: {
        _id: project._id,
        projectNumber: project.projectNumber,
        projectName: project.projectName,
        status: project.status,
        contract_files: project.contract_files
      }
    });
  } catch (error) {
    console.error('Upload final contract error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 🔒 获取合同版本历史
exports.getContractVersionHistory = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate('contract_version_history.uploadedBy', 'full_name phone role')
      .populate('contract_hash_verifications.verified_by', 'full_name phone role')
      .select('projectNumber projectName contract_version_history contract_hash_verifications');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({
      success: true,
      data: {
        projectNumber: project.projectNumber,
        projectName: project.projectName,
        version_history: project.contract_version_history || [],
        hash_verifications: project.contract_hash_verifications || []
      }
    });
  } catch (error) {
    console.error('Get contract version history error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// 获取项目合同信息
exports.getContractInfo = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate('contract_files.draft_contract.uploadedBy', 'name email phone role')
      .populate('contract_files.company_sealed_contract.uploadedBy', 'name email phone role')
      .populate('contract_files.final_contract.uploadedBy', 'name email phone role')
      .populate('contract_version_history.uploadedBy', 'full_name phone role')
      .populate('contract_hash_verifications.verified_by', 'full_name phone role')
      .select('projectNumber projectName status contract_files contract_version_history contract_hash_verifications createdBy');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // 检查权限：只有项目相关人员可以查看
    const hasAccess = 
      project.createdBy.toString() === req.user._id.toString() ||
      ['Sales Manager', 'Business Engineer', 'Admin'].includes(req.user.role);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      projectId: project._id,
      projectNumber: project.projectNumber,
      projectName: project.projectName,
      status: project.status,
      contract_files: project.contract_files || {},
      contract_workflow: {
        step1_draft: {
          status: project.contract_files?.draft_contract ? 'completed' : 'pending',
          description: 'Sales Manager uploads draft contract',
          required_status: 'Won',
          file: project.contract_files?.draft_contract
        },
        step2_review: {
          status: project.contract_files?.company_sealed_contract ? 'completed' : 
                  project.status === 'Pending Contract Review' ? 'in_progress' : 'pending',
          description: 'Business Engineer reviews and uploads sealed contract',
          required_status: 'Pending Contract Review',
          file: project.contract_files?.company_sealed_contract
        },
        step3_final: {
          status: project.contract_files?.final_contract ? 'completed' : 
                  project.status === 'Pending Client Signature' ? 'in_progress' : 'pending',
          description: 'Sales Manager uploads final contract with client signature',
          required_status: 'Pending Client Signature',
          file: project.contract_files?.final_contract
        }
      }
    });
  } catch (error) {
    console.error('Get contract info error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 删除合同文件
exports.deleteContractFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { contractType } = req.body; // 'draft_contract', 'company_sealed_contract', 'final_contract'

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // 检查权限（只有管理员或上传者可以删除）
    const contractFile = project.contract_files?.[contractType];
    if (!contractFile) {
      return res.status(404).json({ message: 'Contract file not found' });
    }

    const isUploader = contractFile.uploadedBy?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isUploader && !isAdmin) {
      return res.status(403).json({ message: 'Only the uploader or admin can delete this file' });
    }

    // 从LeanCloud删除文件
    try {
      if (contractFile.objectId) {
        const file = AV.Object.createWithoutData('_File', contractFile.objectId);
        await file.destroy();
      }
    } catch (error) {
      console.error('Error deleting file from LeanCloud:', error);
    }

    // 从数据库删除文件记录
    project.contract_files[contractType] = null;

    // 根据删除的文件类型，可能需要回退状态
    if (contractType === 'draft_contract' && project.status === 'Pending Contract Review') {
      project.status = 'Won';
    } else if (contractType === 'company_sealed_contract' && project.status === 'Pending Client Signature') {
      project.status = 'Pending Contract Review';
    } else if (contractType === 'final_contract' && project.status === 'Contract Signed') {
      project.status = 'Pending Client Signature';
    }

    await project.save();

    res.json({
      message: 'Contract file deleted successfully',
      project: {
        _id: project._id,
        status: project.status,
        contract_files: project.contract_files
      }
    });
  } catch (error) {
    console.error('Delete contract file error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

