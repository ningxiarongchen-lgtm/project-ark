const SalesOrder = require('../models/SalesOrder');
const ProductionOrder = require('../models/ProductionOrder');
const WorkOrder = require('../models/WorkOrder');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const PurchaseOrder = require('../models/PurchaseOrder');
const Actuator = require('../models/Actuator');

// @desc    获取企业驾驶舱统计数据
// @route   GET /api/erp/dashboard
// @access  Private (Admin/Manager)
exports.getDashboardStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // 计算时间范围
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }
    
    // 并行获取所有统计数据
    const [
      salesStats,
      productionStats,
      financeStats,
      inventoryStats,
      orderTrend,
      revenueTrend
    ] = await Promise.all([
      getSalesStatistics(startDate, now),
      getProductionStatistics(startDate, now),
      getFinanceStatistics(startDate, now),
      getInventoryStatistics(),
      getOrderTrend(startDate, now),
      getRevenueTrend(startDate, now)
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        period,
        startDate,
        endDate: now,
        sales: salesStats,
        production: productionStats,
        finance: financeStats,
        inventory: inventoryStats,
        trends: {
          orders: orderTrend,
          revenue: revenueTrend
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
};

// @desc    获取销售统计
// @route   GET /api/erp/stats/sales
// @access  Private
exports.getSalesStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date ? new Date(start_date) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const endDate = end_date ? new Date(end_date) : new Date();
    
    const stats = await getSalesStatistics(startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取销售统计失败',
      error: error.message
    });
  }
};

// @desc    获取生产统计
// @route   GET /api/erp/stats/production
// @access  Private
exports.getProductionStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date ? new Date(start_date) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const endDate = end_date ? new Date(end_date) : new Date();
    
    const stats = await getProductionStatistics(startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取生产统计失败',
      error: error.message
    });
  }
};

// @desc    获取财务统计
// @route   GET /api/erp/stats/finance
// @access  Private
exports.getFinanceStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date ? new Date(start_date) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const endDate = end_date ? new Date(end_date) : new Date();
    
    const stats = await getFinanceStatistics(startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取财务统计失败',
      error: error.message
    });
  }
};

// ==================== 辅助函数 ====================

// 销售统计
async function getSalesStatistics(startDate, endDate) {
  const salesOrders = await SalesOrder.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalValue: { $sum: '$orderDetails.total_order_value' },
        avgOrderValue: { $avg: '$orderDetails.total_order_value' },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
        },
        confirmedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] }
        },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
        }
      }
    }
  ]);
  
  const stats = salesOrders.length > 0 ? salesOrders[0] : {
    totalOrders: 0,
    totalValue: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    completedOrders: 0
  };
  
  // 计算订单完成率
  stats.completionRate = stats.totalOrders > 0 
    ? Math.round((stats.completedOrders / stats.totalOrders) * 100) 
    : 0;
  
  // 计算环比增长（与上期对比）
  const prevPeriod = new Date(startDate);
  prevPeriod.setTime(prevPeriod.getTime() - (endDate - startDate));
  
  const prevStats = await SalesOrder.aggregate([
    {
      $match: {
        createdAt: { $gte: prevPeriod, $lt: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalValue: { $sum: '$orderDetails.total_order_value' }
      }
    }
  ]);
  
  const prevValue = prevStats.length > 0 ? prevStats[0].totalValue : 0;
  stats.growthRate = prevValue > 0 
    ? Math.round(((stats.totalValue - prevValue) / prevValue) * 100) 
    : 0;
  
  return stats;
}

// 生产统计
async function getProductionStatistics(startDate, endDate) {
  const productionOrders = await ProductionOrder.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalQuantity: { $sum: '$progress.total_quantity' },
        completedQuantity: { $sum: '$progress.completed_quantity' },
        avgProgress: { $avg: '$progress.overall_percentage' },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
        },
        inProductionOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'In Production'] }, 1, 0] }
        },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
        }
      }
    }
  ]);
  
  const stats = productionOrders.length > 0 ? productionOrders[0] : {
    totalOrders: 0,
    totalQuantity: 0,
    completedQuantity: 0,
    avgProgress: 0,
    pendingOrders: 0,
    inProductionOrders: 0,
    completedOrders: 0
  };
  
  // 计算生产完成率
  stats.completionRate = stats.totalQuantity > 0 
    ? Math.round((stats.completedQuantity / stats.totalQuantity) * 100) 
    : 0;
  
  // 工单统计
  const workOrderStats = await WorkOrder.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalWorkOrders: { $sum: 1 },
        completedWorkOrders: {
          $sum: { $cond: [{ $eq: ['$status', '已完成'] }, 1, 0] }
        },
        avgPassRate: { 
          $avg: {
            $cond: [
              { $eq: ['$actual.actual_quantity', 0] },
              100,
              {
                $multiply: [
                  { $divide: ['$actual.good_quantity', '$actual.actual_quantity'] },
                  100
                ]
              }
            ]
          }
        }
      }
    }
  ]);
  
  if (workOrderStats.length > 0) {
    stats.workOrders = workOrderStats[0];
    stats.workOrders.completionRate = stats.workOrders.totalWorkOrders > 0
      ? Math.round((stats.workOrders.completedWorkOrders / stats.workOrders.totalWorkOrders) * 100)
      : 0;
  }
  
  return stats;
}

// 财务统计
async function getFinanceStatistics(startDate, endDate) {
  // 发票统计
  const invoiceStats = await Invoice.getStatistics({
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString()
  });
  
  // 回款统计
  const paymentStats = await Payment.getStatistics({
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString()
  });
  
  // 应收账款
  const receivables = await Invoice.aggregate([
    {
      $match: {
        status: '已开票',
        $expr: { $lt: ['$paid_amount', '$amount_summary.total'] }
      }
    },
    {
      $group: {
        _id: null,
        totalReceivables: { $sum: '$unpaid_amount' }
      }
    }
  ]);
  
  // 逾期应收
  const overdueInvoices = await Invoice.getOverdueInvoices();
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.unpaid_amount, 0);
  
  return {
    invoices: {
      ...invoiceStats,
      overdue: overdueInvoices.length,
      overdueAmount
    },
    payments: paymentStats,
    receivables: receivables.length > 0 ? receivables[0].totalReceivables : 0,
    overdueAmount
  };
}

// 库存统计
async function getInventoryStatistics() {
  const inventory = await Actuator.aggregate([
    {
      $match: {
        is_active: true
      }
    },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalStock: { $sum: '$stock_info.available' },
        lowStockProducts: {
          $sum: {
            $cond: [
              { $lt: ['$stock_info.available', '$stock_info.minimum'] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  const stats = inventory.length > 0 ? inventory[0] : {
    totalProducts: 0,
    totalStock: 0,
    lowStockProducts: 0
  };
  
  // 按系列统计
  const bySeries = await Actuator.aggregate([
    {
      $match: {
        is_active: true
      }
    },
    {
      $group: {
        _id: '$series',
        count: { $sum: 1 },
        totalStock: { $sum: '$stock_info.available' }
      }
    },
    { $sort: { totalStock: -1 } }
  ]);
  
  stats.bySeries = bySeries;
  
  // 库存周转率（简化计算：最近30天出货量 / 平均库存）
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const shipments = await SalesOrder.aggregate([
    {
      $match: {
        status: 'Completed',
        'shipmentInfo.actualShipmentDate': { $gte: thirtyDaysAgo }
      }
    },
    {
      $unwind: '$items'
    },
    {
      $group: {
        _id: null,
        totalShipped: { $sum: '$items.quantity' }
      }
    }
  ]);
  
  const totalShipped = shipments.length > 0 ? shipments[0].totalShipped : 0;
  stats.turnoverRate = stats.totalStock > 0 
    ? Math.round((totalShipped / stats.totalStock) * 12) // 年化周转率
    : 0;
  
  return stats;
}

// 订单趋势
async function getOrderTrend(startDate, endDate) {
  const trend = await SalesOrder.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 },
        value: { $sum: '$orderDetails.total_order_value' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
  
  return trend.map(item => ({
    date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
    count: item.count,
    value: item.value
  }));
}

// 收入趋势
async function getRevenueTrend(startDate, endDate) {
  const trend = await Payment.aggregate([
    {
      $match: {
        status: '已确认',
        payment_date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$payment_date' },
          month: { $month: '$payment_date' },
          day: { $dayOfMonth: '$payment_date' }
        },
        amount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
  
  return trend.map(item => ({
    date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
    amount: item.amount,
    count: item.count
  }));
}

// Note: This file uses exports.functionName pattern
// No need for module.exports at the end

