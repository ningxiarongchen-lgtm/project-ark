/**
 * 统一通知服务
 * 用于跨角色、跨模块的通知管理
 * 与 socketService 联动实现实时推送
 */

const Notification = require('../models/Notification');
const User = require('../models/User');
const { notifyUser, notifyRole } = require('./socketService');

class NotificationService {
  /**
   * 向指定角色的所有用户发送通知
   * @param {string} role - 要通知的角色 (例如, 'Commercial Engineer')
   * @param {object} notificationData - 通知的具体内容
   * @param {string} notificationData.title - 标题
   * @param {string} notificationData.message - 补充信息
   * @param {string} notificationData.link - 动作链接
   * @param {string} notificationData.type - 通知类型
   * @param {string} notificationData.priority - 优先级
   * @param {object} notificationData.relatedEntity - 关联实体
   */
  async notifyRole(role, { title, message, link, type = 'info', priority = 'medium', relatedEntity = null }) {
    try {
      // 1. 查找所有拥有该角色的活跃用户
      const usersToNotify = await User.find({ 
        role: role, 
        isActive: { $ne: false } // 兼容没有 isActive 字段的旧数据
      }).select('_id');

      if (usersToNotify.length === 0) {
        console.warn(`⚠️  工作流警告: 找不到角色为 '${role}' 的活跃用户进行通知。`);
        return [];
      }

      // 2. 在数据库中批量创建通知记录
      const notifications = usersToNotify.map(user => ({
        recipient: user._id,
        title,
        message,
        link,
        type,
        priority,
        relatedEntity,
      }));
      
      const createdNotifications = await Notification.insertMany(notifications);

      // 3. 通过 WebSocket 实时推送到前端
      for (const notification of createdNotifications) {
        // 向特定用户的房间发送实时通知
        notifyUser(notification.recipient.toString(), {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          link: notification.link,
          type: notification.type,
          priority: notification.priority,
          status: notification.status,
          createdAt: notification.createdAt,
        });
      }

      console.log(`✅ 已向 ${createdNotifications.length} 位 '${role}' 角色的用户发送了通知: ${title}`);
      return createdNotifications;
    } catch (error) {
      console.error('❌ NotificationService.notifyRole 出错:', error);
      throw error;
    }
  }

  /**
   * 向单个用户发送通知
   * @param {string} userId - 用户ID
   * @param {object} notificationData - 通知内容
   */
  async notifySingleUser(userId, { title, message, link, type = 'info', priority = 'medium', relatedEntity = null }) {
    try {
      // 1. 验证用户是否存在
      const user = await User.findById(userId);
      if (!user) {
        console.warn(`⚠️  警告: 用户 ID ${userId} 不存在，无法发送通知。`);
        return null;
      }

      // 2. 创建通知记录
      const notification = await Notification.create({
        recipient: userId,
        title,
        message,
        link,
        type,
        priority,
        relatedEntity,
      });

      // 3. 实时推送
      notifyUser(userId, {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        type: notification.type,
        priority: notification.priority,
        status: notification.status,
        createdAt: notification.createdAt,
      });

      console.log(`✅ 已向用户 ${userId} 发送通知: ${title}`);
      return notification;
    } catch (error) {
      console.error('❌ NotificationService.notifySingleUser 出错:', error);
      throw error;
    }
  }

  /**
   * 批量向多个用户发送相同通知
   * @param {Array<string>} userIds - 用户ID数组
   * @param {object} notificationData - 通知内容
   */
  async notifyMultipleUsers(userIds, { title, message, link, type = 'info', priority = 'medium', relatedEntity = null }) {
    try {
      if (!userIds || userIds.length === 0) {
        console.warn('⚠️  警告: 没有指定要通知的用户。');
        return [];
      }

      // 1. 验证用户是否存在
      const users = await User.find({ _id: { $in: userIds } }).select('_id');
      const validUserIds = users.map(u => u._id);

      if (validUserIds.length === 0) {
        console.warn('⚠️  警告: 没有找到有效的用户进行通知。');
        return [];
      }

      // 2. 批量创建通知
      const notifications = validUserIds.map(userId => ({
        recipient: userId,
        title,
        message,
        link,
        type,
        priority,
        relatedEntity,
      }));

      const createdNotifications = await Notification.insertMany(notifications);

      // 3. 实时推送
      for (const notification of createdNotifications) {
        notifyUser(notification.recipient.toString(), {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          link: notification.link,
          type: notification.type,
          priority: notification.priority,
          status: notification.status,
          createdAt: notification.createdAt,
        });
      }

      console.log(`✅ 已向 ${createdNotifications.length} 位用户发送了通知: ${title}`);
      return createdNotifications;
    } catch (error) {
      console.error('❌ NotificationService.notifyMultipleUsers 出错:', error);
      throw error;
    }
  }

  /**
   * 预定义的业务场景通知方法
   */
  
  // 项目赢单 → 通知生产计划员
  async notifyProjectWon(projectData) {
    return await this.notifyRole('Production Planner', {
      title: '新项目赢单，待创建生产订单',
      message: `项目 '${projectData.projectName || projectData.name}' 已赢单，请及时跟进生产计划。`,
      link: `/production/tasks`,
      type: 'project_won',
      priority: 'high',
      relatedEntity: {
        entityType: projectData.projectName ? 'Project' : 'NewProject',
        entityId: projectData._id,
      }
    });
  }

  // 技术方案完成 → 通知商务工程师报价
  async notifySelectionCompleted(projectData) {
    return await this.notifyRole('Business Engineer', {
      title: '新项目待报价',
      message: `项目 '${projectData.projectName || projectData.name}' 的技术方案已完成，请进行报价。`,
      link: `/projects/${projectData._id}/quote`,
      type: 'quote_needed',
      priority: 'high',
      relatedEntity: {
        entityType: projectData.projectName ? 'Project' : 'NewProject',
        entityId: projectData._id,
      }
    });
  }

  // BOM 展开发现物料短缺 → 通知采购专员
  async notifyMaterialShortage(bomData, shortageItems) {
    const itemsList = shortageItems.slice(0, 3).map(item => item.name || item.itemName).join(', ');
    const moreText = shortageItems.length > 3 ? ` 等${shortageItems.length}项` : '';
    
    return await this.notifyRole('Procurement Specialist', {
      title: 'BOM物料短缺，需采购',
      message: `生产订单 '${bomData.productionOrderNumber || bomData.orderNumber}' 发现物料短缺: ${itemsList}${moreText}`,
      link: `/procurement/shortage`,
      type: 'purchase_needed',
      priority: 'high',
      relatedEntity: {
        entityType: 'ProductionOrder',
        entityId: bomData._id,
      }
    });
  }

  // 采购合同提交审批 → 通知商务工程师
  async notifyPurchaseContractSubmitted(contractData) {
    return await this.notifyRole('Business Engineer', {
      title: '采购合同待审批',
      message: `采购合同 '${contractData.contractNumber}' 已提交，请审批。`,
      link: `/contracts/${contractData._id}`,
      type: 'contract_submitted',
      priority: 'high',
      relatedEntity: {
        entityType: 'Contract',
        entityId: contractData._id,
      }
    });
  }

  // 销售合同提交审批 → 通知商务工程师
  async notifySalesContractSubmitted(contractData) {
    return await this.notifyRole('Business Engineer', {
      title: '销售合同待审批',
      message: `销售合同 '${contractData.contractNumber}' 已提交，请审批。`,
      link: `/contracts/${contractData._id}`,
      type: 'contract_submitted',
      priority: 'high',
      relatedEntity: {
        entityType: 'Contract',
        entityId: contractData._id,
      }
    });
  }

  // 生产完成 → 通知质检员
  async notifyProductionCompleted(productionData) {
    return await this.notifyRole('Quality Inspector', {
      title: '生产完成，待质检',
      message: `生产订单 '${productionData.productionOrderNumber}' 已完成生产，请进行质量检验。`,
      link: `/quality/tasks`,
      type: 'quality_check_needed',
      priority: 'high',
      relatedEntity: {
        entityType: 'ProductionOrder',
        entityId: productionData._id,
      }
    });
  }

  // 质检通过 → 通知物流/发货人员
  async notifyQualityCheckPassed(qcData, productionData) {
    return await this.notifyRole('Logistics Specialist', {
      title: '质检通过，可安排发货',
      message: `生产订单 '${productionData.productionOrderNumber}' 已通过质检，请安排发货。`,
      link: `/logistics/shipments`,
      type: 'quality_check_passed',
      priority: 'high',
      relatedEntity: {
        entityType: 'QualityCheck',
        entityId: qcData._id,
      }
    });
  }

  // 质检失败 → 通知生产负责人
  async notifyQualityCheckFailed(qcData, productionData) {
    return await this.notifyRole('Production Planner', {
      title: '质检未通过，需返工',
      message: `生产订单 '${productionData.productionOrderNumber}' 质检未通过: ${qcData.notes || '请查看详情'}`,
      link: `/production/${productionData._id}`,
      type: 'quality_check_failed',
      priority: 'urgent',
      relatedEntity: {
        entityType: 'QualityCheck',
        entityId: qcData._id,
      }
    });
  }

  // 服务工单分配 → 通知技术工程师
  async notifyTicketAssigned(ticketData, engineerId) {
    return await this.notifySingleUser(engineerId, {
      title: '新服务工单分配',
      message: `服务工单 '${ticketData.ticketNumber}' 已分配给您: ${ticketData.title || ticketData.issueDescription}`,
      link: `/service-center/${ticketData._id}`,
      type: 'ticket_assigned',
      priority: ticketData.priority === 'Urgent' ? 'urgent' : 'high',
      relatedEntity: {
        entityType: 'ServiceTicket',
        entityId: ticketData._id,
      }
    });
  }

  // 合同即将到期提醒
  async notifyContractExpiring(contractData, daysRemaining) {
    const recipients = [];
    if (contractData.createdBy) recipients.push(contractData.createdBy);
    if (contractData.approvedBy) recipients.push(contractData.approvedBy);

    if (recipients.length === 0) {
      // 如果没有具体负责人，通知商务工程师角色
      return await this.notifyRole('Business Engineer', {
        title: '合同即将到期',
        message: `合同 '${contractData.contractNumber}' 将在 ${daysRemaining} 天后到期`,
        link: `/contracts/${contractData._id}`,
        type: 'urgent',
        priority: 'high',
        relatedEntity: {
          entityType: 'Contract',
          entityId: contractData._id,
        }
      });
    }

    return await this.notifyMultipleUsers(recipients, {
      title: '合同即将到期',
      message: `合同 '${contractData.contractNumber}' 将在 ${daysRemaining} 天后到期`,
      link: `/contracts/${contractData._id}`,
      type: 'urgent',
      priority: 'high',
      relatedEntity: {
        entityType: 'Contract',
        entityId: contractData._id,
      }
    });
  }
}

module.exports = new NotificationService();

