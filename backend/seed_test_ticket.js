/**
 * 创建测试售后工单
 * 用于测试订单详情页中的售后记录功能
 */

const mongoose = require('mongoose');
require('dotenv').config();

// 数据库连接
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/valve_selection', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 已连接');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    process.exit(1);
  }
};

// 售后工单Schema（简化版，用于测试）
const ServiceTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
  },
  salesOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
  },
  customer: {
    name: String,
    company: String,
    email: String,
    phone: String,
    address: String
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  ticketType: {
    type: String,
    enum: ['Installation', 'Maintenance', 'Repair', 'Inspection', 'Training', 'Consultation', 'Complaint', 'Other'],
    default: 'Maintenance',
  },
  issue: {
    title: String,
    description: String,
    category: String,
    severity: String
  },
  status: {
    type: String,
    enum: ['Open', 'Assigned', 'In Progress', 'Pending Parts', 'On Hold', 'Resolved', 'Closed', 'Cancelled'],
    default: 'Open',
  },
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent', 'Critical'],
    default: 'Normal',
  },
  service: {
    assignedEngineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// 检查模型是否已存在
const ServiceTicket = mongoose.models.ServiceTicket || mongoose.model('ServiceTicket', ServiceTicketSchema);
const SalesOrder = mongoose.models.SalesOrder || mongoose.model('SalesOrder', new mongoose.Schema({}, { strict: false }));
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));

async function createTestTicket() {
  try {
    await connectDB();

    console.log('\n📋 开始创建测试售后工单...\n');

    // 1. 查找第一个销售订单
    const order = await SalesOrder.findOne().sort({ createdAt: -1 });
    if (!order) {
      console.error('❌ 未找到销售订单，请先创建销售订单');
      process.exit(1);
    }
    console.log(`✅ 找到销售订单: ${order.orderNumber} (ID: ${order._id})`);

    // 2. 查找第一个用户
    const user = await User.findOne();
    if (!user) {
      console.error('❌ 未找到用户，请先创建用户');
      process.exit(1);
    }
    console.log(`✅ 找到用户: ${user.name} (${user.email})`);

    // 3. 检查是否已存在关联的工单
    const existingTicket = await ServiceTicket.findOne({ salesOrder: order._id });
    if (existingTicket) {
      console.log(`\n⚠️  该订单已有关联的售后工单: ${existingTicket.ticketNumber}`);
      console.log('   如需重新创建，请先删除现有工单');
      
      console.log('\n📊 现有工单信息:');
      console.log(`   工单号: ${existingTicket.ticketNumber}`);
      console.log(`   类型: ${existingTicket.ticketType}`);
      console.log(`   状态: ${existingTicket.status}`);
      console.log(`   优先级: ${existingTicket.priority}`);
      console.log(`   问题标题: ${existingTicket.issue?.title}`);
      console.log(`   创建时间: ${existingTicket.createdAt.toISOString().substring(0, 16).replace('T', ' ')}`);
      
      process.exit(0);
    }

    // 4. 生成工单编号
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await ServiceTicket.countDocuments({
      ticketNumber: new RegExp(`^TK-${yearMonth}-`)
    });
    const ticketNumber = `TK-${yearMonth}-${String(count + 1).padStart(4, '0')}`;

    // 5. 创建测试工单数据
    const testTickets = [
      {
        ticketNumber: ticketNumber,
        salesOrder: order._id,
        customer: {
          name: order.client?.name || '测试客户',
          company: order.client?.company || '测试公司',
          email: order.client?.email || 'test@example.com',
          phone: order.client?.phone || '13800138000',
          address: order.delivery?.shipping_address || '测试地址'
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
          assignedEngineer: user._id
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3天前创建
      }
    ];

    // 6. 插入工单
    console.log('\n💾 正在创建测试工单...');
    const createdTickets = await ServiceTicket.insertMany(testTickets);
    
    console.log(`\n✅ 成功创建 ${createdTickets.length} 个测试售后工单！\n`);

    // 7. 显示创建的工单信息
    for (const ticket of createdTickets) {
      console.log('📝 工单详情:');
      console.log(`   工单号: ${ticket.ticketNumber}`);
      console.log(`   关联订单: ${order.orderNumber}`);
      console.log(`   客户: ${ticket.customer.name} (${ticket.customer.company})`);
      console.log(`   联系方式: ${ticket.customer.phone}`);
      console.log(`   工单类型: ${ticket.ticketType}`);
      console.log(`   问题标题: ${ticket.issue.title}`);
      console.log(`   问题描述: ${ticket.issue.description}`);
      console.log(`   问题类别: ${ticket.issue.category}`);
      console.log(`   严重程度: ${ticket.issue.severity}`);
      console.log(`   状态: ${ticket.status}`);
      console.log(`   优先级: ${ticket.priority}`);
      console.log(`   创建时间: ${ticket.createdAt.toISOString().substring(0, 16).replace('T', ' ')}`);
      console.log('');
    }

    console.log('🎯 测试说明:');
    console.log(`   1. 访问订单详情页: http://localhost:5173/orders/${order._id}`);
    console.log(`   2. 在"售后记录"区域应该能看到刚创建的工单`);
    console.log(`   3. 点击工单号可跳转到工单详情页`);
    console.log(`   4. 点击"快速创建售后工单"可以创建新工单`);
    console.log('');

  } catch (error) {
    console.error('❌ 创建测试工单失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 数据库连接已关闭');
  }
}

// 运行脚本
createTestTicket();

