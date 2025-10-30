/**
 * 创建测试订单和售后工单
 */

const mongoose = require('mongoose');
require('dotenv').config();

// 数据库连接
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cmax', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 已连接');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    process.exit(1);
  }
};

// Schema定义
const SalesOrderSchema = new mongoose.Schema({}, { strict: false });
const ServiceTicketSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });

const SalesOrder = mongoose.models.SalesOrder || mongoose.model('SalesOrder', SalesOrderSchema);
const ServiceTicket = mongoose.models.ServiceTicket || mongoose.model('ServiceTicket', ServiceTicketSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createTestData() {
  try {
    await connectDB();

    console.log('\n📋 开始创建测试数据...\n');

    // 1. 查找或创建用户
    let user = await User.findOne();
    if (!user) {
      console.log('创建测试用户...');
      user = await User.create({
        name: '测试用户',
        email: 'test@example.com',
        password: '$2a$10$YourHashedPasswordHere',
        role: 'Sales Manager'
      });
      console.log(`✅ 创建用户: ${user.name}`);
    } else {
      console.log(`✅ 找到用户: ${user.name}`);
    }

    // 2. 创建测试订单
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const orderCount = await SalesOrder.countDocuments({
      orderNumber: new RegExp(`^SO-${yearMonth}-`)
    });
    const orderNumber = `SO-${yearMonth}-${String(orderCount + 1).padStart(4, '0')}`;

    const order = await SalesOrder.create({
      orderNumber: orderNumber,
      orderDate: now,
      client: {
        name: '张三',
        company: 'ABC科技有限公司',
        email: 'zhangsan@abc.com',
        phone: '13800138000'
      },
      orderItems: [
        {
          item_type: 'Actuator',
          model_name: 'AT-GY-400',
          quantity: 2,
          unit_price: 15000,
          total_price: 30000,
          production_status: 'Completed'
        }
      ],
      financial: {
        subtotal: 30000,
        tax: 1800,
        discount: 0,
        total_amount: 31800
      },
      payment: {
        payment_status: 'Paid',
        paid_amount: 31800,
        payment_terms: '款到发货',
        payment_records: [
          {
            amount: 31800,
            date: now,
            method: 'Bank Transfer',
            reference: 'TRX001',
            notes: '全款已付'
          }
        ]
      },
      delivery: {
        shipping_method: '物流配送',
        shipping_address: '北京市朝阳区某某路123号',
        delivery_terms: 'DAP - 送货到指定地点',
        tracking_number: 'TRK123456789'
      },
      status: 'Shipped',
      createdBy: user._id,
      notes: '测试订单，用于演示售后功能'
    });

    console.log(`✅ 创建测试订单: ${order.orderNumber} (ID: ${order._id})\n`);

    // 3. 创建售后工单
    const ticketYearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const ticketCount = await ServiceTicket.countDocuments({
      ticketNumber: new RegExp(`^TK-${ticketYearMonth}-`)
    });
    const ticketNumber = `TK-${ticketYearMonth}-${String(ticketCount + 1).padStart(4, '0')}`;

    const ticket = await ServiceTicket.create({
      ticketNumber: ticketNumber,
      salesOrder: order._id,
      customer: {
        name: order.client.name,
        company: order.client.company,
        email: order.client.email,
        phone: order.client.phone,
        address: order.delivery.shipping_address
      },
      reportedBy: user._id,
      ticketType: 'Repair',
      issue: {
        title: '执行器运行异常',
        description: '执行器在运行过程中出现卡顿现象，响应速度变慢，需要检修',
        category: 'Hardware Failure',
        severity: 'Major'
      },
      status: 'In Progress',
      priority: 'High',
      service: {
        assignedEngineer: user._id,
        serviceType: 'On-site',
        scheduledDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        estimatedHours: 4
      },
      sla: {
        responseTimeTarget: 24,
        actualResponseTime: 2,
        resolutionTimeTarget: 72,
        actualResolutionTime: 48,
        slaViolated: false
      },
      followUps: [
        {
          date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          type: 'Call',
          content: '联系客户确认问题，约定上门检修时间',
          user: user._id
        }
      ],
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    });

    console.log('✅ 创建测试售后工单！\n');
    console.log('📝 工单详情:');
    console.log(`   工单号: ${ticket.ticketNumber}`);
    console.log(`   关联订单: ${order.orderNumber}`);
    console.log(`   客户: ${ticket.customer.name} (${ticket.customer.company})`);
    console.log(`   联系方式: ${ticket.customer.phone}`);
    console.log(`   工单类型: ${ticket.ticketType}`);
    console.log(`   问题标题: ${ticket.issue.title}`);
    console.log(`   问题描述: ${ticket.issue.description}`);
    console.log(`   状态: ${ticket.status}`);
    console.log(`   优先级: ${ticket.priority}`);
    console.log('');

    console.log('🎯 测试说明:');
    console.log(`   1. 访问订单详情页: http://localhost:5173/orders/${order._id}`);
    console.log(`   2. 在"售后记录"区域应该能看到刚创建的工单`);
    console.log(`   3. 点击工单号 ${ticket.ticketNumber} 可跳转到工单详情页`);
    console.log(`   4. 点击"快速创建售后工单"可以创建新工单`);
    console.log('');
    console.log(`💡 订单ID (复制此ID用于测试): ${order._id}`);
    console.log('');

  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 数据库连接已关闭');
  }
}

// 运行脚本
createTestData();


