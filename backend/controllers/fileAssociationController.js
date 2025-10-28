/**
 * 文件关联控制器
 * 用于前端直传后，将文件信息关联到各个模块
 */

const NewProject = require('../models/NewProject');
const SalesOrder = require('../models/SalesOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const ServiceTicket = require('../models/ServiceTicket');

/**
 * 为项目添加文件
 * @route POST /api/projects/:id/add-file
 */
exports.addProjectFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { file_name, file_url, file_type, file_size, description } = req.body;
    
    if (!file_name || !file_url) {
      return res.status(400).json({
        success: false,
        message: '文件名和文件URL是必填项'
      });
    }
    
    const project = await NewProject.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }
    
    // 添加文件到项目文档数组
    const fileInfo = {
      name: file_name,
      url: file_url,
      type: file_type || 'other',
      size: file_size,
      description: description,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };
    
    if (!project.documents) {
      project.documents = [];
    }
    
    project.documents.push(fileInfo);
    await project.save();
    
    res.json({
      success: true,
      message: '文件添加成功',
      file: fileInfo
    });
  } catch (error) {
    console.error('添加项目文件失败:', error);
    res.status(500).json({
      success: false,
      message: '添加文件失败',
      error: error.message
    });
  }
};

/**
 * 为订单添加文件
 * @route POST /api/orders/:id/add-file
 */
exports.addOrderFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { file_name, file_url, file_type, file_size, description } = req.body;
    
    if (!file_name || !file_url) {
      return res.status(400).json({
        success: false,
        message: '文件名和文件URL是必填项'
      });
    }
    
    const order = await SalesOrder.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    // 添加文件到订单
    const fileInfo = {
      name: file_name,
      url: file_url,
      type: file_type || 'other',
      size: file_size,
      description: description,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };
    
    // 检查订单模型是否有documents字段
    if (!order.documents) {
      order.documents = [];
    }
    
    order.documents.push(fileInfo);
    
    // 如果是合同文件，同时更新contract字段
    if (file_type === 'contract') {
      order.contract = {
        file_url: file_url,
        file_name: file_name,
        uploaded_at: new Date()
      };
    }
    
    await order.save();
    
    res.json({
      success: true,
      message: '文件添加成功',
      file: fileInfo
    });
  } catch (error) {
    console.error('添加订单文件失败:', error);
    res.status(500).json({
      success: false,
      message: '添加文件失败',
      error: error.message
    });
  }
};

/**
 * 为采购订单添加文件
 * @route POST /api/purchase-orders/:id/add-file
 */
exports.addPurchaseOrderFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { file_name, file_url, file_type, file_size, description } = req.body;
    
    if (!file_name || !file_url) {
      return res.status(400).json({
        success: false,
        message: '文件名和文件URL是必填项'
      });
    }
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }
    
    // 添加文件到采购订单
    const fileInfo = {
      name: file_name,
      url: file_url,
      type: file_type || 'other',
      size: file_size,
      description: description,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };
    
    if (!purchaseOrder.documents) {
      purchaseOrder.documents = [];
    }
    
    purchaseOrder.documents.push(fileInfo);
    await purchaseOrder.save();
    
    res.json({
      success: true,
      message: '文件添加成功',
      file: fileInfo
    });
  } catch (error) {
    console.error('添加采购订单文件失败:', error);
    res.status(500).json({
      success: false,
      message: '添加文件失败',
      error: error.message
    });
  }
};

/**
 * 为服务工单添加附件
 * @route POST /api/tickets/:id/add-attachment
 */
exports.addTicketAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const { file_name, file_url, file_type, file_size, description } = req.body;
    
    if (!file_name || !file_url) {
      return res.status(400).json({
        success: false,
        message: '文件名和文件URL是必填项'
      });
    }
    
    const ticket = await ServiceTicket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: '服务工单不存在'
      });
    }
    
    // 添加附件到工单
    const attachmentInfo = {
      file_name: file_name,
      file_url: file_url,
      file_type: file_type || 'other',
      file_size: file_size,
      description: description,
      uploaded_by: req.user._id,
      uploaded_at: new Date()
    };
    
    if (!ticket.attachments) {
      ticket.attachments = [];
    }
    
    ticket.attachments.push(attachmentInfo);
    await ticket.save();
    
    res.json({
      success: true,
      message: '附件添加成功',
      attachment: attachmentInfo
    });
  } catch (error) {
    console.error('添加工单附件失败:', error);
    res.status(500).json({
      success: false,
      message: '添加附件失败',
      error: error.message
    });
  }
};

/**
 * 删除项目文件
 * @route DELETE /api/projects/:id/files/:fileId
 */
exports.deleteProjectFile = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    
    const project = await NewProject.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }
    
    // 从数组中移除文件
    project.documents = project.documents.filter(
      doc => doc._id.toString() !== fileId
    );
    
    await project.save();
    
    res.json({
      success: true,
      message: '文件删除成功'
    });
  } catch (error) {
    console.error('删除项目文件失败:', error);
    res.status(500).json({
      success: false,
      message: '删除文件失败',
      error: error.message
    });
  }
};

/**
 * 删除订单文件
 * @route DELETE /api/orders/:id/files/:fileId
 */
exports.deleteOrderFile = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    
    const order = await SalesOrder.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    order.documents = order.documents.filter(
      doc => doc._id.toString() !== fileId
    );
    
    await order.save();
    
    res.json({
      success: true,
      message: '文件删除成功'
    });
  } catch (error) {
    console.error('删除订单文件失败:', error);
    res.status(500).json({
      success: false,
      message: '删除文件失败',
      error: error.message
    });
  }
};

/**
 * 删除采购订单文件
 * @route DELETE /api/purchase-orders/:id/files/:fileId
 */
exports.deletePurchaseOrderFile = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在'
      });
    }
    
    purchaseOrder.documents = purchaseOrder.documents.filter(
      doc => doc._id.toString() !== fileId
    );
    
    await purchaseOrder.save();
    
    res.json({
      success: true,
      message: '文件删除成功'
    });
  } catch (error) {
    console.error('删除采购订单文件失败:', error);
    res.status(500).json({
      success: false,
      message: '删除文件失败',
      error: error.message
    });
  }
};

/**
 * 删除工单附件
 * @route DELETE /api/tickets/:id/attachments/:attachmentId
 */
exports.deleteTicketAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    
    const ticket = await ServiceTicket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: '服务工单不存在'
      });
    }
    
    ticket.attachments = ticket.attachments.filter(
      att => att._id.toString() !== attachmentId
    );
    
    await ticket.save();
    
    res.json({
      success: true,
      message: '附件删除成功'
    });
  } catch (error) {
    console.error('删除工单附件失败:', error);
    res.status(500).json({
      success: false,
      message: '删除附件失败',
      error: error.message
    });
  }
};

