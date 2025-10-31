// /backend/controllers/qualityCheckController.js
const QualityCheck = require('../models/QualityCheck');
const ChecklistTemplate = require('../models/ChecklistTemplate');
const PurchaseOrder = require('../models/PurchaseOrder');
const ProductionOrder = require('../models/ProductionOrder');
// const { logActivity } = require('./activityController'); // 暂时注释掉

// 临时替代函数
const logActivity = async () => { 
  // 活动日志功能暂未实现
  return Promise.resolve();
};

// 获取所有质检任务（带筛选）
exports.getAllQualityChecks = async (req, res) => {
  try {
    const { status, checkType, startDate, endDate } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (checkType) {
      query.checkType = checkType;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const qualityChecks = await QualityCheck.find(query)
      .populate('inspector', 'username fullName')
      .sort({ createdAt: -1 });
    
    res.json(qualityChecks);
  } catch (error) {
    console.error('获取质检任务失败:', error);
    res.status(500).json({ message: '获取质检任务失败', error: error.message });
  }
};

// 获取单个质检任务详情
exports.getQualityCheckById = async (req, res) => {
  try {
    const qualityCheck = await QualityCheck.findById(req.params.id)
      .populate('inspector', 'username fullName');
    
    if (!qualityCheck) {
      return res.status(404).json({ message: '质检任务不存在' });
    }
    
    res.json(qualityCheck);
  } catch (error) {
    console.error('获取质检任务详情失败:', error);
    res.status(500).json({ message: '获取质检任务详情失败', error: error.message });
  }
};

// 开始质检任务
exports.startQualityCheck = async (req, res) => {
  try {
    const qualityCheck = await QualityCheck.findById(req.params.id);
    
    if (!qualityCheck) {
      return res.status(404).json({ message: '质检任务不存在' });
    }
    
    if (qualityCheck.status !== 'Pending') {
      return res.status(400).json({ message: '该任务已经开始或已完成' });
    }
    
    qualityCheck.status = 'In Progress';
    qualityCheck.inspector = req.user._id;
    await qualityCheck.save();
    
    // 记录活动日志
    await logActivity(
      req.user._id,
      'quality_check_started',
      'QualityCheck',
      qualityCheck._id,
      `开始执行${qualityCheck.checkType}检验: ${qualityCheck.checkNumber}`
    );
    
    res.json(qualityCheck);
  } catch (error) {
    console.error('开始质检任务失败:', error);
    res.status(500).json({ message: '开始质检任务失败', error: error.message });
  }
};

// 完成质检任务
exports.completeQualityCheck = async (req, res) => {
  try {
    const { checkList, overallResult, images, reportUrl, notes } = req.body;
    
    const qualityCheck = await QualityCheck.findById(req.params.id);
    
    if (!qualityCheck) {
      return res.status(404).json({ message: '质检任务不存在' });
    }
    
    if (qualityCheck.status === 'Completed') {
      return res.status(400).json({ message: '该任务已完成' });
    }
    
    // 更新质检结果
    qualityCheck.checkList = checkList;
    qualityCheck.overallResult = overallResult;
    qualityCheck.images = images || [];
    qualityCheck.reportUrl = reportUrl || '';
    qualityCheck.status = 'Completed';
    qualityCheck.completedAt = new Date();
    
    // 计算缺陷数量
    qualityCheck.defectCount = checkList.filter(item => item.result === 'Fail').length;
    
    await qualityCheck.save();
    
    // 根据检验类型和结果，更新源单据状态
    if (qualityCheck.checkType === 'IQC') {
      // 来料检验
      const purchaseOrder = await PurchaseOrder.findById(qualityCheck.sourceDocument.id);
      if (purchaseOrder) {
        if (overallResult === 'Pass') {
          purchaseOrder.status = 'IQC Passed';
          // TODO: 更新库存状态为可用
        } else {
          purchaseOrder.status = 'IQC Failed';
          purchaseOrder.rejectionReason = `质检不合格，缺陷数：${qualityCheck.defectCount}`;
        }
        await purchaseOrder.save();
        
        // 记录活动
        await logActivity(
          req.user._id,
          'iqc_completed',
          'PurchaseOrder',
          purchaseOrder._id,
          `来料检验${overallResult === 'Pass' ? '合格' : '不合格'}: ${purchaseOrder.orderNumber}`
        );
      }
    } else if (qualityCheck.checkType === 'FQC') {
      // 成品检验
      const productionOrder = await ProductionOrder.findById(qualityCheck.sourceDocument.id)
        .populate('salesOrder', 'project_name project_number');
      
      if (productionOrder) {
        if (overallResult === 'Pass') {
          // ✅ 质检合格，进入"等待尾款"状态（款到发货流程的起点）
          productionOrder.status = 'QC Passed, Awaiting Payment';
          
          // 🔔 通知所有商务工程师
          const { createNotification } = require('../services/notificationService');
          const User = require('../models/User');
          
          // 查找所有商务工程师
          const businessEngineers = await User.find({
            role: { $in: ['Business Engineer', 'Admin', 'Administrator'] }
          });
          
          // 获取项目信息
          const projectName = productionOrder.salesOrder?.project_name || productionOrder.orderSnapshot?.projectName || '未知项目';
          const projectNumber = productionOrder.salesOrder?.project_number || productionOrder.orderSnapshot?.projectNumber || '';
          
          // 为每个商务工程师创建通知
          const notificationPromises = businessEngineers.map(engineer => 
            createNotification({
              recipient: engineer._id,
              type: 'fqc_passed_awaiting_payment',
              title: '成品已检验合格，请确认尾款',
              message: `项目 ${projectName}（${projectNumber}）的成品已检验合格，请确认客户尾款是否到账，以便安排发货。`,
              relatedModel: 'ProductionOrder',
              relatedId: productionOrder._id,
              priority: 'high'
            })
          );
          
          await Promise.all(notificationPromises);
          
          console.log(`✅ FQC合格通知已发送给 ${businessEngineers.length} 位商务工程师`);
        } else {
          productionOrder.status = 'FQC Failed';
          productionOrder.rejectionReason = `质检不合格，缺陷数：${qualityCheck.defectCount}`;
        }
        await productionOrder.save();
        
        // 记录活动
        await logActivity(
          req.user._id,
          'fqc_completed',
          'ProductionOrder',
          productionOrder._id,
          `成品检验${overallResult === 'Pass' ? '合格' : '不合格'}: ${productionOrder.productionOrderNumber || productionOrder.orderNumber}`
        );
      }
    }
    
    // 记录质检完成活动
    await logActivity(
      req.user._id,
      'quality_check_completed',
      'QualityCheck',
      qualityCheck._id,
      `完成${qualityCheck.checkType}检验: ${qualityCheck.checkNumber}，结果: ${overallResult}`
    );
    
    res.json(qualityCheck);
  } catch (error) {
    console.error('完成质检任务失败:', error);
    res.status(500).json({ message: '完成质检任务失败', error: error.message });
  }
};

// 创建质检任务（由系统自动调用）
exports.createQualityCheck = async (checkType, sourceDocument, itemsToCheck) => {
  try {
    const qualityCheck = new QualityCheck({
      checkType,
      sourceDocument,
      itemsToCheck,
      status: 'Pending',
    });
    
    await qualityCheck.save();
    
    console.log(`✅ 自动创建${checkType}检验任务: ${qualityCheck.checkNumber}`);
    
    return qualityCheck;
  } catch (error) {
    console.error('创建质检任务失败:', error);
    throw error;
  }
};

// ========== 检验模板管理 ==========

// 获取所有检验模板
exports.getAllTemplates = async (req, res) => {
  try {
    const { checkType, productSeries } = req.query;
    
    let query = { isActive: true };
    
    if (checkType) {
      query.checkType = checkType;
    }
    
    if (productSeries) {
      query.productSeries = productSeries;
    }
    
    const templates = await ChecklistTemplate.find(query).sort({ checkType: 1, productSeries: 1 });
    
    res.json(templates);
  } catch (error) {
    console.error('获取检验模板失败:', error);
    res.status(500).json({ message: '获取检验模板失败', error: error.message });
  }
};

// 获取单个检验模板
exports.getTemplateById = async (req, res) => {
  try {
    const template = await ChecklistTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: '检验模板不存在' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('获取检验模板失败:', error);
    res.status(500).json({ message: '获取检验模板失败', error: error.message });
  }
};

// 根据产品系列和检验类型获取模板
exports.getTemplateByTypeAndSeries = async (req, res) => {
  try {
    const { checkType, productSeries } = req.params;
    
    const template = await ChecklistTemplate.findOne({
      checkType,
      productSeries,
      isActive: true
    });
    
    if (!template) {
      return res.status(404).json({ 
        message: '未找到匹配的检验模板',
        checkType,
        productSeries
      });
    }
    
    res.json(template);
  } catch (error) {
    console.error('获取检验模板失败:', error);
    res.status(500).json({ message: '获取检验模板失败', error: error.message });
  }
};

// 创建检验模板
exports.createTemplate = async (req, res) => {
  try {
    const { name, productSeries, checkType, items } = req.body;
    
    const template = new ChecklistTemplate({
      name,
      productSeries,
      checkType,
      items
    });
    
    await template.save();
    
    // 记录活动
    await logActivity(
      req.user._id,
      'template_created',
      'ChecklistTemplate',
      template._id,
      `创建检验模板: ${name}`
    );
    
    res.status(201).json(template);
  } catch (error) {
    console.error('创建检验模板失败:', error);
    res.status(500).json({ message: '创建检验模板失败', error: error.message });
  }
};

// 更新检验模板
exports.updateTemplate = async (req, res) => {
  try {
    const { name, productSeries, checkType, items, isActive } = req.body;
    
    const template = await ChecklistTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: '检验模板不存在' });
    }
    
    if (name) template.name = name;
    if (productSeries !== undefined) template.productSeries = productSeries;
    if (checkType) template.checkType = checkType;
    if (items) template.items = items;
    if (isActive !== undefined) template.isActive = isActive;
    
    await template.save();
    
    // 记录活动
    await logActivity(
      req.user._id,
      'template_updated',
      'ChecklistTemplate',
      template._id,
      `更新检验模板: ${template.name}`
    );
    
    res.json(template);
  } catch (error) {
    console.error('更新检验模板失败:', error);
    res.status(500).json({ message: '更新检验模板失败', error: error.message });
  }
};

// 删除检验模板（软删除）
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await ChecklistTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: '检验模板不存在' });
    }
    
    template.isActive = false;
    await template.save();
    
    // 记录活动
    await logActivity(
      req.user._id,
      'template_deleted',
      'ChecklistTemplate',
      template._id,
      `删除检验模板: ${template.name}`
    );
    
    res.json({ message: '检验模板已删除' });
  } catch (error) {
    console.error('删除检验模板失败:', error);
    res.status(500).json({ message: '删除检验模板失败', error: error.message });
  }
};

// 获取质检统计数据
exports.getQualityStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }
    
    // 统计各类型检验数量
    const stats = await QualityCheck.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$checkType',
          total: { $sum: 1 },
          passed: {
            $sum: { $cond: [{ $eq: ['$overallResult', 'Pass'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$overallResult', 'Fail'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
          }
        }
      }
    ]);
    
    // 计算合格率
    const statsWithRate = stats.map(stat => ({
      ...stat,
      passRate: stat.total > 0 ? ((stat.passed / (stat.passed + stat.failed)) * 100).toFixed(2) : 0
    }));
    
    res.json(statsWithRate);
  } catch (error) {
    console.error('获取质检统计数据失败:', error);
    res.status(500).json({ message: '获取质检统计数据失败', error: error.message });
  }
};

