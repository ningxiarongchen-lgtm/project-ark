const ServiceTicket = require('../models/ServiceTicket');
const SalesOrder = require('../models/SalesOrder');
const Project = require('../models/Project');
const User = require('../models/User');

/**
 * 创建服务工单（支持新模型结构）
 */
exports.createTicket = async (req, res) => {
  try {
    const {
      related_order_id,
      client_name,
      client_info,
      service_type,
      priority,
      title,
      description,
      issue_category,
      severity,
      attachments,
      assigned_engineer_id
    } = req.body;

    console.log('📝 创建售后工单请求:', req.body);

    // 获取当前用户信息（创建人）
    const creator = await User.findById(req.user.id);
    if (!creator) {
      return res.status(400).json({
        success: false,
        message: '无法找到当前用户信息'
      });
    }

    // 构建创建人信息
    const created_by = {
      id: creator._id,
      name: creator.full_name || creator.name,
      role: creator.role === 'Sales Engineer' ? '销售' :
            creator.role === 'Technical Engineer' ? '技术工程师' :
            creator.role === 'Technical Support' ? '技术主管' :
            creator.role === 'Customer Service' ? '客服' : '管理员'
    };

    // 构建工单数据
    const ticketData = {
      related_order_id: related_order_id || undefined,
      client_name,
      client_info: client_info || {},
      created_by,
      service_type,
      priority: priority || '正常',
      status: '待技术受理',  // 默认状态
      title,
      description,
      issue_category,
      severity,
      attachments: attachments || []
    };

    // 如果指定了技术工程师，则构建assigned_to对象
    if (assigned_engineer_id) {
      const engineer = await User.findById(assigned_engineer_id);
      if (engineer) {
        ticketData.assigned_to = {
          id: engineer._id,
          name: engineer.full_name || engineer.name,
          role: engineer.role === 'Technical Engineer' ? '技术工程师' : 
                engineer.role === 'Technical Support' ? '技术主管' : '技术工程师',
          assigned_at: new Date()
        };
        // 如果已分配工程师，可以考虑直接设置为"技术处理中"状态
        // ticketData.status = '技术处理中';
      }
    }

    // 创建工单
    const ticket = new ServiceTicket(ticketData);

    // 添加创建历史记录
    ticket.addHistory(
      '创建工单',
      created_by,
      `售后工单创建成功，服务类型：${service_type}，问题：${title}`,
      {
        to_status: '待技术受理',
        visibility: '全部'
      }
    );

    // 如果已分配工程师，添加分配历史
    if (assigned_engineer_id && ticketData.assigned_to) {
      ticket.addHistory(
        '分配工程师',
        created_by,
        `工单已分配给技术工程师：${ticketData.assigned_to.name}`,
        {
          to_status: ticket.status,
          visibility: '全部',
          metadata: { engineer_id: assigned_engineer_id }
        }
      );
      
      // 计算响应时间
      ticket.calculateResponseTime();
    }

    await ticket.save();

    console.log('✅ 售后工单创建成功:', ticket.ticket_number);

    // 填充关联数据（用于返回）
    if (ticket.related_order_id) {
      await ticket.populate('related_order_id', 'orderNumber projectSnapshot');
    }
    if (ticket.assigned_to?.id) {
      await ticket.populate('assigned_to.id', 'name email department');
    }

    res.status(201).json({
      success: true,
      message: '售后工单创建成功',
      data: ticket
    });

  } catch (error) {
    console.error('❌ 创建售后工单失败:', error);
    res.status(500).json({
      success: false,
      message: '创建售后工单失败',
      error: error.message
    });
  }
};

/**
 * 获取所有服务工单（支持新模型结构）
 */
exports.getAllTickets = async (req, res) => {
  try {
    const {
      status,
      priority,
      service_type,
      assignedEngineer,
      salesOrder,
      related_order_id,
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
    if (service_type) query.service_type = service_type;
    if (assignedEngineer) query['assigned_to.id'] = assignedEngineer;
    
    // 兼容旧参数和新参数
    if (salesOrder || related_order_id) {
      query.related_order_id = salesOrder || related_order_id;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 查询工单
    const tickets = await ServiceTicket.find(query)
      .populate('created_by.id', 'name email full_name')
      .populate('assigned_to.id', 'name email full_name department')
      .populate('related_order_id', 'orderNumber projectSnapshot')
      .populate('closed_by.id', 'name email full_name')
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
      success: false,
      message: 'Failed to fetch service tickets',
      error: error.message
    });
  }
};

/**
 * 获取单个服务工单详情（支持新模型结构）
 */
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await ServiceTicket.findById(id)
      .populate('created_by.id', 'name email full_name role department')
      .populate('assigned_to.id', 'name email full_name role department')
      .populate('closed_by.id', 'name email full_name role')
      .populate('related_order_id', 'orderNumber projectSnapshot orderDate financial')
      .populate('solution_draft.submitted_by', 'name email full_name')
      .populate('solution_draft.approved_by.id', 'name email full_name')
      .populate('final_report.generated_by', 'name email full_name')
      .populate('history.performed_by.id', 'name email full_name');

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: 'Service ticket not found' 
      });
    }

    res.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    console.error('Error fetching service ticket:', error);
    res.status(500).json({
      success: false,
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

/**
 * 接受任务（技术工程师接受待受理的工单）
 */
exports.acceptTicket = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('✅ 技术工程师接受任务:', id);

    // 获取工单
    const ticket = await ServiceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Service ticket not found'
      });
    }

    // 检查工单状态是否为"待技术受理"
    if (ticket.status !== '待技术受理' && ticket.status !== 'Pending Acceptance') {
      return res.status(400).json({
        success: false,
        message: '只有状态为"待技术受理"的工单才能接受',
        currentStatus: ticket.status
      });
    }

    // 检查工单是否已分配给当前用户
    if (ticket.assigned_to && ticket.assigned_to.id) {
      const assignedId = ticket.assigned_to.id.toString();
      const currentUserId = req.user.id.toString();
      
      if (assignedId !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: '该工单未分配给您，无法接受'
        });
      }
    }

    // 获取当前用户信息
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(400).json({
        success: false,
        message: '无法找到当前用户信息'
      });
    }

    const engineer = {
      _id: currentUser._id,
      name: currentUser.full_name || currentUser.name,
      role: currentUser.role === 'Technical Engineer' ? '技术工程师' : '技术支持'
    };

    // 使用模型方法接受工单
    ticket.acceptTicket(engineer);

    await ticket.save();

    console.log('✅ 工单已接受，状态更新为"技术处理中":', ticket.ticket_number);

    res.json({
      success: true,
      message: '任务已接受，开始处理',
      data: ticket
    });

  } catch (error) {
    console.error('❌ 接受任务失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept ticket',
      error: error.message
    });
  }
};

/**
 * 保存解决报告（技术工程师编写报告）
 */
exports.saveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { final_report } = req.body;

    console.log('📝 技术工程师保存解决报告:', id);

    // 获取工单
    const ticket = await ServiceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Service ticket not found'
      });
    }

    // 获取当前用户信息
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(400).json({
        success: false,
        message: '无法找到当前用户信息'
      });
    }

    // 更新解决报告
    ticket.final_report = {
      content: final_report.content,
      root_cause: final_report.root_cause,
      actions_taken: final_report.actions_taken,
      preventive_measures: final_report.preventive_measures,
      generated_at: new Date(),
      generated_by: currentUser._id
    };

    // 添加历史记录
    const engineerInfo = {
      id: currentUser._id,
      name: currentUser.full_name || currentUser.name,
      role: currentUser.role === 'Technical Engineer' ? '技术工程师' : '技术支持'
    };

    ticket.addHistory(
      '提交报告',
      engineerInfo,
      '技术工程师已编写并保存解决报告',
      {
        to_status: ticket.status,
        visibility: '全部'
      }
    );

    await ticket.save();

    console.log('✅ 解决报告已保存:', ticket.ticket_number);

    res.json({
      success: true,
      message: '解决报告已保存',
      data: ticket
    });

  } catch (error) {
    console.error('❌ 保存报告失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save report',
      error: error.message
    });
  }
};

/**
 * 标记为已解决（技术工程师完成工作，交给销售确认）
 */
exports.markAsResolved = async (req, res) => {
  try {
    const { id } = req.params;
    const { summary } = req.body;

    console.log('✅ 技术工程师标记问题已解决:', id);

    // 获取工单
    const ticket = await ServiceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Service ticket not found'
      });
    }

    // 检查是否已生成解决报告
    if (!ticket.final_report || !ticket.final_report.content) {
      return res.status(400).json({
        success: false,
        message: '请先生成解决报告再标记为已解决'
      });
    }

    // 获取当前用户信息
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(400).json({
        success: false,
        message: '无法找到当前用户信息'
      });
    }

    const engineerInfo = {
      _id: currentUser._id,
      name: currentUser.full_name || currentUser.name,
      role: currentUser.role === 'Technical Engineer' ? '技术工程师' : '技术支持'
    };

    // 使用模型方法标记为已解决
    const reportData = {
      ...ticket.final_report.toObject(),
      summary: summary // 添加解决总结
    };

    ticket.markAsResolved(engineerInfo, reportData);

    await ticket.save();

    console.log('✅ 工单已标记为"问题已解决-待确认":', ticket.ticket_number);

    // TODO: 发送通知给销售经理
    // 可以在这里添加通知逻辑

    res.json({
      success: true,
      message: '工单已标记为"问题已解决-待确认"，已通知销售经理确认',
      data: ticket
    });

  } catch (error) {
    console.error('❌ 标记已解决失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as resolved',
      error: error.message
    });
  }
};

/**
 * 关闭工单（销售经理确认问题已解决）
 */
exports.closeTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { close_reason, customer_feedback } = req.body;

    console.log('🔒 销售经理正在关闭工单:', id);

    // 获取工单
    const ticket = await ServiceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Service ticket not found'
      });
    }

    // 检查工单状态是否为"问题已解决-待确认"
    if (ticket.status !== '问题已解决-待确认' && ticket.status !== 'Resolved') {
      return res.status(400).json({
        success: false,
        message: '只有状态为"问题已解决-待确认"的工单才能关闭',
        currentStatus: ticket.status
      });
    }

    // 获取当前用户信息
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(400).json({
        success: false,
        message: '无法找到当前用户信息'
      });
    }

    // 使用模型方法关闭工单
    const closedByUser = {
      _id: currentUser._id,
      name: currentUser.full_name || currentUser.name,
      role: currentUser.role === 'Sales Manager' ? '销售经理' :
            currentUser.role === 'Sales Engineer' ? '销售' : '管理员'
    };

    ticket.closeTicket(closedByUser, close_reason || '问题已解决', customer_feedback);

    // 如果提供了客户反馈，更新客户反馈信息
    if (customer_feedback && customer_feedback.rating) {
      ticket.customer_feedback = {
        rating: customer_feedback.rating,
        comments: customer_feedback.comments || '',
        would_recommend: customer_feedback.rating >= 4,
        feedback_date: new Date(),
        feedback_by: ticket.client_name
      };
    }

    await ticket.save();

    console.log('✅ 工单已关闭:', ticket.ticket_number);

    res.json({
      success: true,
      message: '工单已成功关闭',
      data: ticket
    });

  } catch (error) {
    console.error('❌ 关闭工单失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close ticket',
      error: error.message
    });
  }
};

/**
 * 重新打开工单（销售经理认为问题未解决）
 */
exports.reopenTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, comments } = req.body;

    console.log('🔄 销售经理正在重新打开工单:', id);

    // 验证必填参数
    if (!reason || !comments) {
      return res.status(400).json({
        success: false,
        message: '请提供重新打开的原因和详细说明'
      });
    }

    // 获取工单
    const ticket = await ServiceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Service ticket not found'
      });
    }

    // 检查工单状态是否为"问题已解决-待确认"
    if (ticket.status !== '问题已解决-待确认' && ticket.status !== 'Resolved') {
      return res.status(400).json({
        success: false,
        message: '只有状态为"问题已解决-待确认"的工单才能重新打开',
        currentStatus: ticket.status
      });
    }

    // 获取当前用户信息
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(400).json({
        success: false,
        message: '无法找到当前用户信息'
      });
    }

    const reopenedByUser = {
      id: currentUser._id,
      name: currentUser.full_name || currentUser.name,
      role: currentUser.role === 'Sales Manager' ? '销售经理' :
            currentUser.role === 'Sales Engineer' ? '销售' : '管理员'
    };

    // 记录旧状态
    const oldStatus = ticket.status;

    // 更新工单状态为"技术处理中"
    ticket.status = '技术处理中';

    // 添加重新打开的历史记录
    ticket.addHistory(
      '重新打开',
      reopenedByUser,
      `销售经理重新打开工单。原因：${reason}。详细说明：${comments}`,
      {
        from_status: oldStatus,
        to_status: '技术处理中',
        visibility: '全部',
        metadata: {
          reason,
          comments,
          reopened_by_role: reopenedByUser.role
        }
      }
    );

    await ticket.save();

    console.log('✅ 工单已重新打开:', ticket.ticket_number);

    // TODO: 发送通知给技术工程师
    // 可以在这里添加通知逻辑，通知技术工程师工单已被重新打开

    res.json({
      success: true,
      message: '工单已重新打开，已退回技术工程师处理',
      data: ticket
    });

  } catch (error) {
    console.error('❌ 重新打开工单失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reopen ticket',
      error: error.message
    });
  }
};

