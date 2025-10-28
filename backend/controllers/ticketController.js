const ServiceTicket = require('../models/ServiceTicket');
const SalesOrder = require('../models/SalesOrder');
const Project = require('../models/Project');

/**
 * 创建服务工单
 */
exports.createTicket = async (req, res) => {
  try {
    const ticketData = {
      ...req.body,
      createdBy: req.user.id
    };

    const ticket = new ServiceTicket(ticketData);

    // 计算初始响应时间
    ticket.calculateResponseTime();

    await ticket.save();

    await ticket.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'service.assignedEngineer', select: 'name email' },
      { path: 'relatedProject', select: 'projectNumber projectName' },
      { path: 'relatedOrder', select: 'orderNumber' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Service ticket created successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Error creating service ticket:', error);
    res.status(500).json({
      message: 'Failed to create service ticket',
      error: error.message
    });
  }
};

/**
 * 获取所有服务工单
 */
exports.getAllTickets = async (req, res) => {
  try {
    const {
      status,
      priority,
      ticketType,
      assignedEngineer,
      salesOrder,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = '-createdAt'
    } = req.query;

    // 构建查询条件
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (ticketType) query.ticketType = ticketType;
    if (assignedEngineer) query['service.assignedEngineer'] = assignedEngineer;
    if (salesOrder) query.salesOrder = salesOrder;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 查询工单
    const tickets = await ServiceTicket.find(query)
      .populate('createdBy', 'name email')
      .populate('service.assignedEngineer', 'name email')
      .populate('service.serviceTeam', 'name email')
      .populate('resolution.resolvedBy', 'name email')
      .populate('relatedProject', 'projectNumber projectName')
      .populate('relatedOrder', 'orderNumber')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    // 获取总数
    const total = await ServiceTicket.countDocuments(query);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching service tickets:', error);
    res.status(500).json({
      message: 'Failed to fetch service tickets',
      error: error.message
    });
  }
};

/**
 * 获取单个服务工单详情
 */
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await ServiceTicket.findById(id)
      .populate('createdBy', 'name email')
      .populate('service.assignedEngineer', 'name email')
      .populate('service.serviceTeam', 'name email')
      .populate('resolution.resolvedBy', 'name email')
      .populate('closedBy', 'name email')
      .populate('relatedProject')
      .populate('relatedOrder')
      .populate('followUps.user', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Service ticket not found' });
    }

    res.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    console.error('Error fetching service ticket:', error);
    res.status(500).json({
      message: 'Failed to fetch service ticket',
      error: error.message
    });
  }
};

/**
 * 更新服务工单
 */
exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const ticket = await ServiceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Service ticket not found' });
    }

    // 更新允许的字段
    const allowedUpdates = [
      'ticketType',
      'priority',
      'customer',
      'products',
      'issue',
      'service',
      'resolution',
      'costs',
      'sla',
      'internalNotes',
      'customerNotes'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        ticket[field] = updates[field];
      }
    });

    // 重新计算费用
    ticket.calculateTotalCost();

    // 如果分配了工程师，计算响应时间
    if (updates.service?.assignedEngineer) {
      ticket.calculateResponseTime();
    }

    // 如果已解决，计算解决时间
    if (updates.resolution?.resolvedDate) {
      ticket.calculateResolutionTime();
    }

    await ticket.save();

    await ticket.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'service.assignedEngineer', select: 'name email' },
      { path: 'service.serviceTeam', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Service ticket updated successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Error updating service ticket:', error);
    res.status(500).json({
      message: 'Failed to update service ticket',
      error: error.message
    });
  }
};

/**
 * 更新工单状态
 */
exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ticket = await ServiceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Service ticket not found' });
    }

    ticket.status = status;

    // 如果状态变更为已解决，记录解决日期和解决人
    if (status === 'Resolved' && !ticket.resolution.resolvedDate) {
      ticket.resolution.resolvedDate = new Date();
      ticket.resolution.resolvedBy = req.user.id;
      ticket.calculateResolutionTime();
    }

    // 如果状态变更为已关闭，记录关闭日期和关闭人
    if (status === 'Closed' && !ticket.closedDate) {
      ticket.closedDate = new Date();
      ticket.closedBy = req.user.id;
    }

    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({
      message: 'Failed to update ticket status',
      error: error.message
    });
  }
};

/**
 * 分配工程师
 */
exports.assignEngineer = async (req, res) => {
  try {
    const { id } = req.params;
    const { engineerId, serviceTeam, scheduledDate, serviceAddress } = req.body;

    const ticket = await ServiceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Service ticket not found' });
    }

    ticket.service.assignedEngineer = engineerId;
    if (serviceTeam) ticket.service.serviceTeam = serviceTeam;
    if (scheduledDate) ticket.service.scheduledDate = scheduledDate;
    if (serviceAddress) ticket.service.serviceAddress = serviceAddress;

    // 更新状态为已分配
    if (ticket.status === 'Open') {
      ticket.status = 'Assigned';
    }

    // 计算响应时间
    ticket.calculateResponseTime();

    await ticket.save();

    await ticket.populate([
      { path: 'service.assignedEngineer', select: 'name email' },
      { path: 'service.serviceTeam', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Engineer assigned successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Error assigning engineer:', error);
    res.status(500).json({
      message: 'Failed to assign engineer',
      error: error.message
    });
  }
};

/**
 * 添加跟进记录
 */
exports.addFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, content } = req.body;

    const ticket = await ServiceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Service ticket not found' });
    }

    ticket.addFollowUp(type, content, req.user.id);

    await ticket.save();

    await ticket.populate('followUps.user', 'name email');

    res.json({
      success: true,
      message: 'Follow-up added successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Error adding follow-up:', error);
    res.status(500).json({
      message: 'Failed to add follow-up',
      error: error.message
    });
  }
};

/**
 * 提交客户反馈
 */
exports.submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comments } = req.body;

    const ticket = await ServiceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Service ticket not found' });
    }

    ticket.feedback = {
      rating,
      comments,
      feedbackDate: new Date()
    };

    await ticket.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
};

/**
 * 删除服务工单
 */
exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await ServiceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Service ticket not found' });
    }

    // 只允许删除"Open"或"Cancelled"状态的工单
    if (!['Open', 'Cancelled'].includes(ticket.status)) {
      return res.status(400).json({
        message: 'Only open or cancelled tickets can be deleted',
        currentStatus: ticket.status
      });
    }

    await ticket.deleteOne();

    res.json({
      success: true,
      message: 'Service ticket deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting service ticket:', error);
    res.status(500).json({
      message: 'Failed to delete service ticket',
      error: error.message
    });
  }
};

/**
 * 获取服务工单统计信息
 */
exports.getTicketStatistics = async (req, res) => {
  try {
    const totalTickets = await ServiceTicket.countDocuments();
    const openTickets = await ServiceTicket.countDocuments({ status: 'Open' });
    const assignedTickets = await ServiceTicket.countDocuments({ status: 'Assigned' });
    const inProgressTickets = await ServiceTicket.countDocuments({ status: 'In Progress' });
    const resolvedTickets = await ServiceTicket.countDocuments({ status: 'Resolved' });
    const closedTickets = await ServiceTicket.countDocuments({ status: 'Closed' });

    // 计算平均满意度
    const feedbackResult = await ServiceTicket.aggregate([
      { $match: { 'feedback.rating': { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$feedback.rating' } } }
    ]);
    const avgRating = feedbackResult.length > 0 ? feedbackResult[0].avgRating.toFixed(2) : 0;

    // 计算SLA违反数量
    const slaViolated = await ServiceTicket.countDocuments({ 'sla.slaViolated': true });

    // 按类型统计
    const ticketsByType = await ServiceTicket.aggregate([
      { $group: { _id: '$ticketType', count: { $sum: 1 } } }
    ]);

    // 按优先级统计
    const ticketsByPriority = await ServiceTicket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalTickets,
        ticketsByStatus: {
          open: openTickets,
          assigned: assignedTickets,
          inProgress: inProgressTickets,
          resolved: resolvedTickets,
          closed: closedTickets
        },
        performance: {
          avgRating: parseFloat(avgRating),
          slaViolated
        },
        ticketsByType: ticketsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        ticketsByPriority: ticketsByPriority.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Error fetching ticket statistics:', error);
    res.status(500).json({
      message: 'Failed to fetch ticket statistics',
      error: error.message
    });
  }
};

/**
 * 获取我的工单（当前用户分配的工单）
 */
exports.getMyTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await ServiceTicket.find({
      'service.assignedEngineer': req.user.id
    })
      .populate('createdBy', 'name email')
      .populate('relatedProject', 'projectNumber projectName')
      .populate('relatedOrder', 'orderNumber')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ServiceTicket.countDocuments({
      'service.assignedEngineer': req.user.id
    });

    res.json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching my tickets:', error);
    res.status(500).json({
      message: 'Failed to fetch my tickets',
      error: error.message
    });
  }
};

