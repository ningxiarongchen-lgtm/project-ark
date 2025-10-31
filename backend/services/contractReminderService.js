const cron = require('node-cron');
const Contract = require('../models/Contract');
const User = require('../models/User');

/**
 * 合同提醒服务
 * 定时检查并生成合同相关提醒
 */
class ContractReminderService {
  constructor() {
    this.reminders = [];
    this.isRunning = false;
  }

  /**
   * 启动提醒服务
   * 每天早上9点执行一次
   */
  start() {
    if (this.isRunning) {
      console.log('合同提醒服务已在运行中');
      return;
    }

    // 每天早上9点执行
    cron.schedule('0 9 * * *', async () => {
      console.log('🔔 开始执行合同提醒任务...');
      await this.checkReminders();
    });

    // 启动时立即执行一次
    this.checkReminders();

    this.isRunning = true;
    console.log('✅ 合同提醒服务已启动');
  }

  /**
   * 检查所有需要提醒的合同
   */
  async checkReminders() {
    try {
      this.reminders = [];

      // 1. 检查即将到期的合同（7天内）
      await this.checkExpiringContracts();

      // 2. 检查长时间未处理的合同（3天以上）
      await this.checkPendingContracts();

      // 3. 检查付款提醒
      await this.checkPaymentReminders();

      console.log(`📊 合同提醒检查完成，共生成 ${this.reminders.length} 条提醒`);
    } catch (error) {
      console.error('❌ 合同提醒检查失败:', error);
    }
  }

  /**
   * 检查即将到期的合同
   */
  async checkExpiringContracts() {
    try {
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const expiringContracts = await Contract.find({
        expiry_date: {
          $gte: now,
          $lte: sevenDaysLater
        },
        status: '已盖章'
      })
      .populate('created_by', 'full_name email')
      .populate('business_engineer', 'full_name email');

      for (const contract of expiringContracts) {
        const daysUntilExpiry = Math.ceil(
          (new Date(contract.expiry_date) - now) / (1000 * 60 * 60 * 24)
        );

        this.reminders.push({
          type: 'contract_expiring',
          priority: daysUntilExpiry <= 3 ? 'high' : 'medium',
          contract_id: contract._id,
          contract_number: contract.contract_number,
          contract_name: contract.contract_name,
          message: `合同 ${contract.contract_number} 将在 ${daysUntilExpiry} 天后到期`,
          expiry_date: contract.expiry_date,
          days_until_expiry: daysUntilExpiry,
          users: [
            contract.created_by,
            contract.business_engineer
          ].filter(Boolean)
        });
      }

      console.log(`⏰ 发现 ${expiringContracts.length} 个即将到期的合同`);
    } catch (error) {
      console.error('检查到期合同失败:', error);
    }
  }

  /**
   * 检查长时间未处理的合同
   */
  async checkPendingContracts() {
    try {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const pendingContracts = await Contract.find({
        status: '待盖章',
        submitted_at: {
          $lte: threeDaysAgo
        }
      })
      .populate('created_by', 'full_name email')
      .populate('business_engineer', 'full_name email');

      for (const contract of pendingContracts) {
        const daysPending = Math.ceil(
          (now - new Date(contract.submitted_at)) / (1000 * 60 * 60 * 24)
        );

        // 获取所有商务工程师
        const businessEngineers = await User.find({ role: 'Business Engineer' });

        this.reminders.push({
          type: 'contract_pending_long',
          priority: daysPending >= 5 ? 'high' : 'medium',
          contract_id: contract._id,
          contract_number: contract.contract_number,
          contract_name: contract.contract_name,
          message: `合同 ${contract.contract_number} 已待处理 ${daysPending} 天`,
          days_pending: daysPending,
          submitted_at: contract.submitted_at,
          users: contract.business_engineer 
            ? [contract.business_engineer]
            : businessEngineers
        });
      }

      console.log(`⚠️  发现 ${pendingContracts.length} 个长时间未处理的合同`);
    } catch (error) {
      console.error('检查待处理合同失败:', error);
    }
  }

  /**
   * 检查付款提醒
   */
  async checkPaymentReminders() {
    try {
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // 查找已盖章但未付款的合同
      const contracts = await Contract.find({
        status: '已盖章',
        'payment_terms.advance_payment_status': { $ne: '已支付' }
      })
      .populate('created_by', 'full_name email')
      .populate('business_engineer', 'full_name email');

      for (const contract of contracts) {
        // 如果合同已签订超过7天但还未付预付款
        const daysSinceSealed = Math.ceil(
          (now - new Date(contract.sealed_at)) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceSealed >= 7) {
          this.reminders.push({
            type: 'payment_overdue',
            priority: daysSinceSealed >= 14 ? 'high' : 'medium',
            contract_id: contract._id,
            contract_number: contract.contract_number,
            contract_name: contract.contract_name,
            message: `合同 ${contract.contract_number} 已签订 ${daysSinceSealed} 天，预付款未到账`,
            days_since_sealed: daysSinceSealed,
            payment_amount: contract.payment_terms.advance_payment_amount,
            users: [contract.created_by, contract.business_engineer].filter(Boolean)
          });
        }
      }

      console.log(`💰 发现 ${contracts.length} 个需要催款的合同`);
    } catch (error) {
      console.error('检查付款提醒失败:', error);
    }
  }

  /**
   * 获取当前所有提醒
   */
  getReminders() {
    return this.reminders;
  }

  /**
   * 获取指定用户的提醒
   */
  getRemindersForUser(userId) {
    return this.reminders.filter(reminder => 
      reminder.users && reminder.users.some(user => 
        user && user._id && user._id.toString() === userId.toString()
      )
    );
  }

  /**
   * 获取按优先级分组的提醒统计
   */
  getReminderStats() {
    const stats = {
      total: this.reminders.length,
      high: this.reminders.filter(r => r.priority === 'high').length,
      medium: this.reminders.filter(r => r.priority === 'medium').length,
      by_type: {}
    };

    this.reminders.forEach(reminder => {
      if (!stats.by_type[reminder.type]) {
        stats.by_type[reminder.type] = 0;
      }
      stats.by_type[reminder.type]++;
    });

    return stats;
  }

  /**
   * 清除指定提醒
   */
  dismissReminder(contractId, type) {
    this.reminders = this.reminders.filter(
      r => !(r.contract_id.toString() === contractId.toString() && r.type === type)
    );
  }

  /**
   * 停止提醒服务
   */
  stop() {
    this.isRunning = false;
    console.log('⏹️  合同提醒服务已停止');
  }
}

// 创建单例实例
const contractReminderService = new ContractReminderService();

module.exports = contractReminderService;

