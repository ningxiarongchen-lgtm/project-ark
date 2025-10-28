/**
 * APS (Advanced Planning and Scheduling) Service
 * 高级排程系统核心算法
 * 
 * 功能：
 * 1. BOM展开 - 获取所有物料需求
 * 2. ATP检查 - 库存可用性检查
 * 3. 采购时间计算 - 获取供应商和采购周期
 * 4. 产能检查 - 工作中心负载分析
 * 5. 智能排程 - 启发式算法优化
 * 6. 工单时间更新
 */

const ProductionOrder = require('../models/ProductionOrder');
const WorkOrder = require('../models/WorkOrder');
const Routing = require('../models/Routing');
const WorkCenter = require('../models/WorkCenter');
const Actuator = require('../models/Actuator');
const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');

/**
 * 主排程函数 - 为生产订单进行智能排程
 * @param {String} productionOrderId - 生产订单ID
 * @param {Object} options - 排程选项
 * @returns {Object} 排程结果
 */
async function scheduleProductionOrder(productionOrderId, options = {}) {
  try {
    console.log(`[APS] 开始排程生产订单: ${productionOrderId}`);
    
    // 获取生产订单及其工单
    const productionOrder = await ProductionOrder.findById(productionOrderId)
      .populate('productionItems.product_id')
      .populate('productionItems.routing')
      .populate('work_orders');
    
    if (!productionOrder) {
      throw new Error('生产订单不存在');
    }
    
    if (!productionOrder.work_orders || productionOrder.work_orders.length === 0) {
      throw new Error('生产订单尚未生成工单，请先生成工单');
    }
    
    // 排程结果
    const result = {
      productionOrder: productionOrder._id,
      status: 'success',
      scheduledWorkOrders: [],
      materialShortages: [],
      capacityIssues: [],
      warnings: [],
      summary: {
        totalWorkOrders: productionOrder.work_orders.length,
        scheduledCount: 0,
        earliestStart: null,
        latestEnd: null,
        totalDuration: 0
      }
    };
    
    // Step 1: BOM展开 - 获取所有物料需求
    console.log('[APS] Step 1: BOM展开');
    const materialRequirements = await expandBOM(productionOrder);
    console.log(`[APS] 物料需求: ${materialRequirements.length} 项`);
    
    // Step 2: ATP检查 - 库存可用性检查
    console.log('[APS] Step 2: ATP库存检查');
    const atpResults = await checkATP(materialRequirements);
    result.materialShortages = atpResults.shortages;
    console.log(`[APS] 库存短缺: ${atpResults.shortages.length} 项`);
    
    // Step 3: 采购时间计算
    console.log('[APS] Step 3: 计算采购时间');
    const procurementTimes = await calculateProcurementTime(atpResults.shortages);
    console.log(`[APS] 采购周期: 最长 ${procurementTimes.maxLeadTime} 天`);
    
    // Step 4: 产能检查 - 获取工作中心负载
    console.log('[APS] Step 4: 产能检查');
    const capacityData = await checkCapacity(productionOrder.work_orders);
    result.capacityIssues = capacityData.issues;
    console.log(`[APS] 产能问题: ${capacityData.issues.length} 项`);
    
    // Step 5: 智能排程 - 启发式算法
    console.log('[APS] Step 5: 智能排程算法');
    const scheduleResult = await intelligentScheduling({
      productionOrder,
      workOrders: productionOrder.work_orders,
      materialAvailability: atpResults,
      procurementTimes,
      capacityData,
      options
    });
    
    result.scheduledWorkOrders = scheduleResult.scheduledWorkOrders;
    result.warnings = scheduleResult.warnings;
    
    // Step 6: 更新工单时间
    console.log('[APS] Step 6: 更新工单时间');
    await updateWorkOrderSchedule(scheduleResult.scheduledWorkOrders);
    
    // 更新汇总信息
    if (scheduleResult.scheduledWorkOrders.length > 0) {
      result.summary.scheduledCount = scheduleResult.scheduledWorkOrders.length;
      result.summary.earliestStart = scheduleResult.scheduledWorkOrders[0].plannedStartTime;
      result.summary.latestEnd = scheduleResult.scheduledWorkOrders[scheduleResult.scheduledWorkOrders.length - 1].plannedEndTime;
      result.summary.totalDuration = Math.round(
        (result.summary.latestEnd - result.summary.earliestStart) / (1000 * 60)
      );
    }
    
    console.log('[APS] 排程完成');
    console.log(`[APS] 总工单数: ${result.summary.totalWorkOrders}`);
    console.log(`[APS] 已排程: ${result.summary.scheduledCount}`);
    console.log(`[APS] 总时长: ${result.summary.totalDuration} 分钟`);
    
    return result;
    
  } catch (error) {
    console.error('[APS] 排程失败:', error);
    throw new Error(`排程失败: ${error.message}`);
  }
}

/**
 * Step 1: BOM展开 - 获取所有物料需求
 * @param {Object} productionOrder - 生产订单
 * @returns {Array} 物料需求列表
 */
async function expandBOM(productionOrder) {
  const materialRequirements = [];
  
  for (const item of productionOrder.productionItems) {
    // 如果有工艺路线，从工艺路线获取物料需求
    if (item.routing) {
      const routing = await Routing.findById(item.routing);
      
      if (routing && routing.operations) {
        for (const operation of routing.operations) {
          if (operation.materials && operation.materials.length > 0) {
            for (const material of operation.materials) {
              materialRequirements.push({
                material_code: material.material_code,
                material_name: material.material_name,
                required_quantity: material.quantity * item.ordered_quantity,
                unit: material.unit,
                operation_sequence: operation.sequence,
                production_item: item._id
              });
            }
          }
        }
      }
    }
    
    // 如果有BOM信息
    if (productionOrder.bom_items && productionOrder.bom_items.length > 0) {
      for (const bomItem of productionOrder.bom_items) {
        materialRequirements.push({
          material_code: bomItem.material_code,
          material_name: bomItem.material_name,
          required_quantity: bomItem.required_quantity,
          unit: bomItem.unit,
          production_item: item._id
        });
      }
    }
  }
  
  // 合并相同物料的需求
  const mergedRequirements = {};
  for (const req of materialRequirements) {
    const key = req.material_code;
    if (mergedRequirements[key]) {
      mergedRequirements[key].required_quantity += req.required_quantity;
    } else {
      mergedRequirements[key] = { ...req };
    }
  }
  
  return Object.values(mergedRequirements);
}

/**
 * Step 2: ATP检查 - 库存可用性检查
 * @param {Array} materialRequirements - 物料需求
 * @returns {Object} ATP检查结果
 */
async function checkATP(materialRequirements) {
  const atpResults = {
    available: [],
    shortages: []
  };
  
  for (const requirement of materialRequirements) {
    // 简化实现：从执行器库存中查找
    // 实际应用中应该有独立的物料库存系统
    const inventory = await Actuator.findOne({
      model_base: new RegExp(requirement.material_code, 'i')
    });
    
    let availableQuantity = 0;
    if (inventory && inventory.stock_info) {
      availableQuantity = inventory.stock_info.available || 0;
    }
    
    const shortage = requirement.required_quantity - availableQuantity;
    
    if (shortage > 0) {
      atpResults.shortages.push({
        ...requirement,
        available_quantity: availableQuantity,
        shortage_quantity: shortage,
        atp_date: null // 预计可用日期
      });
    } else {
      atpResults.available.push({
        ...requirement,
        available_quantity: availableQuantity,
        surplus_quantity: -shortage
      });
    }
  }
  
  return atpResults;
}

/**
 * Step 3: 计算采购时间
 * @param {Array} shortages - 短缺物料列表
 * @returns {Object} 采购时间信息
 */
async function calculateProcurementTime(shortages) {
  let maxLeadTime = 0;
  const procurementDetails = [];
  
  for (const shortage of shortages) {
    // 查找最近的采购订单，获取供应商信息
    const recentPO = await PurchaseOrder.findOne({
      'items.item_name': new RegExp(shortage.material_name, 'i')
    }).sort({ createdAt: -1 })
      .populate('supplier');
    
    let leadTime = 7; // 默认采购周期7天
    let supplier = null;
    
    if (recentPO && recentPO.supplier) {
      supplier = recentPO.supplier;
      leadTime = recentPO.supplier.lead_time || 7;
    } else {
      // 如果没有历史采购记录，查找默认供应商
      const defaultSupplier = await Supplier.findOne({
        status: 'Active'
      }).sort({ rating: -1 });
      
      if (defaultSupplier) {
        supplier = defaultSupplier;
        leadTime = defaultSupplier.lead_time || 7;
      }
    }
    
    maxLeadTime = Math.max(maxLeadTime, leadTime);
    
    procurementDetails.push({
      material_code: shortage.material_code,
      material_name: shortage.material_name,
      shortage_quantity: shortage.shortage_quantity,
      supplier: supplier ? {
        id: supplier._id,
        name: supplier.name,
        lead_time: leadTime
      } : null,
      estimated_arrival_date: new Date(Date.now() + leadTime * 24 * 60 * 60 * 1000)
    });
    
    // 更新短缺信息的ATP日期
    shortage.atp_date = new Date(Date.now() + leadTime * 24 * 60 * 60 * 1000);
  }
  
  return {
    maxLeadTime,
    details: procurementDetails
  };
}

/**
 * Step 4: 产能检查
 * @param {Array} workOrders - 工单列表
 * @returns {Object} 产能分析结果
 */
async function checkCapacity(workOrders) {
  const capacityData = {
    workCenters: {},
    issues: []
  };
  
  // 获取所有涉及的工作中心
  const workCenterIds = [...new Set(workOrders.map(wo => wo.work_center.toString()))];
  
  for (const wcId of workCenterIds) {
    const workCenter = await WorkCenter.findById(wcId);
    
    if (!workCenter) continue;
    
    // 计算日产能（分钟）
    const dailyCapacity = workCenter.capacity.hours_per_shift * 
                         workCenter.capacity.shifts_per_day * 60;
    
    // 获取该工作中心已有的工单负载
    const existingWorkOrders = await WorkOrder.find({
      work_center: wcId,
      status: { $in: ['已发布', '进行中'] }
    });
    
    const currentLoad = existingWorkOrders.reduce((sum, wo) => 
      sum + (wo.plan.planned_duration || 0), 0
    );
    
    // 新工单负载
    const newLoad = workOrders
      .filter(wo => wo.work_center.toString() === wcId)
      .reduce((sum, wo) => sum + (wo.plan.planned_duration || 0), 0);
    
    const totalLoad = currentLoad + newLoad;
    const utilizationRate = (totalLoad / dailyCapacity) * 100;
    
    capacityData.workCenters[wcId] = {
      id: wcId,
      code: workCenter.code,
      name: workCenter.name,
      dailyCapacity,
      currentLoad,
      newLoad,
      totalLoad,
      utilizationRate,
      availableCapacity: dailyCapacity - totalLoad
    };
    
    // 如果利用率超过90%，标记为产能问题
    if (utilizationRate > 90) {
      capacityData.issues.push({
        work_center: {
          id: wcId,
          code: workCenter.code,
          name: workCenter.name
        },
        issue: '产能过载',
        utilizationRate,
        overload: totalLoad - dailyCapacity
      });
    }
  }
  
  return capacityData;
}

/**
 * Step 5: 智能排程算法（启发式方法）
 * @param {Object} params - 排程参数
 * @returns {Object} 排程结果
 */
async function intelligentScheduling(params) {
  const {
    productionOrder,
    workOrders,
    materialAvailability,
    procurementTimes,
    capacityData,
    options
  } = params;
  
  const scheduledWorkOrders = [];
  const warnings = [];
  
  // 计算最早开始时间
  let earliestStart = new Date();
  
  // 如果有物料短缺，需要等待采购
  if (materialAvailability.shortages.length > 0 && procurementTimes.maxLeadTime > 0) {
    earliestStart = new Date(Date.now() + procurementTimes.maxLeadTime * 24 * 60 * 60 * 1000);
    warnings.push({
      type: 'material_shortage',
      message: `物料短缺，需等待采购 ${procurementTimes.maxLeadTime} 天`,
      impact: `开始时间延迟至 ${earliestStart.toISOString()}`
    });
  }
  
  // 考虑生产订单的计划开始日期
  if (productionOrder.schedule.plannedStartDate > earliestStart) {
    earliestStart = productionOrder.schedule.plannedStartDate;
  }
  
  // 按产品项和工序序号对工单进行分组和排序
  const groupedWorkOrders = groupWorkOrdersByProductAndSequence(workOrders);
  
  // 工作中心时间线（记录每个工作中心的当前时间）
  const workCenterTimeline = {};
  
  // 遍历每个产品项
  for (const productItem of groupedWorkOrders) {
    let currentTime = new Date(earliestStart);
    
    // 按工序序号排序
    const sortedOperations = productItem.workOrders.sort((a, b) => 
      a.operation.sequence - b.operation.sequence
    );
    
    for (const wo of sortedOperations) {
      const workCenterId = wo.work_center.toString();
      
      // 初始化工作中心时间线
      if (!workCenterTimeline[workCenterId]) {
        workCenterTimeline[workCenterId] = new Date(earliestStart);
      }
      
      // 计算该工单的最早开始时间
      // 考虑：
      // 1. 前置工序完成时间（currentTime）
      // 2. 工作中心可用时间（workCenterTimeline[workCenterId]）
      const workCenterAvailableTime = workCenterTimeline[workCenterId];
      const actualStartTime = new Date(Math.max(currentTime.getTime(), workCenterAvailableTime.getTime()));
      
      // 调整到工作时间（假设每天8:00开始工作）
      const adjustedStartTime = adjustToWorkingHours(actualStartTime);
      
      // 计算工时（分钟）
      const duration = wo.plan.planned_duration || 0;
      
      // 计算结束时间（考虑工作日历）
      const endTime = calculateEndTime(adjustedStartTime, duration);
      
      // 记录排程结果
      scheduledWorkOrders.push({
        workOrderId: wo._id,
        workOrderNumber: wo.work_order_number,
        productItem: productItem.productId,
        operation: {
          sequence: wo.operation.sequence,
          name: wo.operation.operation_name
        },
        workCenter: {
          id: workCenterId,
          code: capacityData.workCenters[workCenterId]?.code,
          name: capacityData.workCenters[workCenterId]?.name
        },
        plannedStartTime: adjustedStartTime,
        plannedEndTime: endTime,
        duration: duration,
        constraints: {
          materialReady: materialAvailability.shortages.length === 0,
          capacityAvailable: !capacityData.issues.some(issue => 
            issue.work_center.id === workCenterId
          )
        }
      });
      
      // 更新时间
      currentTime = new Date(endTime);
      workCenterTimeline[workCenterId] = new Date(endTime);
      
      // 添加工序间缓冲时间（30分钟）
      currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
    }
  }
  
  // 检查是否超出计划完成日期
  if (productionOrder.schedule.plannedEndDate) {
    const latestEnd = scheduledWorkOrders[scheduledWorkOrders.length - 1]?.plannedEndTime;
    if (latestEnd > productionOrder.schedule.plannedEndDate) {
      const delayDays = Math.ceil((latestEnd - productionOrder.schedule.plannedEndDate) / (1000 * 60 * 60 * 24));
      warnings.push({
        type: 'schedule_delay',
        message: `计划延期 ${delayDays} 天`,
        plannedEndDate: productionOrder.schedule.plannedEndDate,
        actualEndDate: latestEnd
      });
    }
  }
  
  return {
    scheduledWorkOrders,
    warnings
  };
}

/**
 * 按产品和工序对工单分组
 * @param {Array} workOrders - 工单列表
 * @returns {Array} 分组后的工单
 */
function groupWorkOrdersByProductAndSequence(workOrders) {
  const grouped = {};
  
  for (const wo of workOrders) {
    const productId = wo.product.product_id.toString();
    
    if (!grouped[productId]) {
      grouped[productId] = {
        productId,
        workOrders: []
      };
    }
    
    grouped[productId].workOrders.push(wo);
  }
  
  return Object.values(grouped);
}

/**
 * 调整到工作时间
 * @param {Date} time - 原始时间
 * @returns {Date} 调整后的时间
 */
function adjustToWorkingHours(time) {
  const adjusted = new Date(time);
  const hours = adjusted.getHours();
  
  // 如果在工作时间之前（8:00），调整到8:00
  if (hours < 8) {
    adjusted.setHours(8, 0, 0, 0);
  }
  
  // 如果在工作时间之后（18:00），调整到下一天8:00
  if (hours >= 18) {
    adjusted.setDate(adjusted.getDate() + 1);
    adjusted.setHours(8, 0, 0, 0);
  }
  
  // 如果是周末，调整到下周一
  const day = adjusted.getDay();
  if (day === 0) { // 周日
    adjusted.setDate(adjusted.getDate() + 1);
    adjusted.setHours(8, 0, 0, 0);
  } else if (day === 6) { // 周六
    adjusted.setDate(adjusted.getDate() + 2);
    adjusted.setHours(8, 0, 0, 0);
  }
  
  return adjusted;
}

/**
 * 计算结束时间（考虑工作日历）
 * @param {Date} startTime - 开始时间
 * @param {Number} durationMinutes - 工时（分钟）
 * @returns {Date} 结束时间
 */
function calculateEndTime(startTime, durationMinutes) {
  const endTime = new Date(startTime);
  let remainingMinutes = durationMinutes;
  
  // 每天工作时间：8:00 - 12:00, 13:00 - 18:00 (9小时 = 540分钟)
  const dailyWorkMinutes = 540;
  const morningEnd = 12 * 60; // 12:00
  const afternoonStart = 13 * 60; // 13:00
  const dayEnd = 18 * 60; // 18:00
  
  while (remainingMinutes > 0) {
    const currentHour = endTime.getHours();
    const currentMinute = endTime.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    
    // 如果在午休时间，跳到13:00
    if (currentTotalMinutes >= morningEnd && currentTotalMinutes < afternoonStart) {
      endTime.setHours(13, 0, 0, 0);
      continue;
    }
    
    // 如果超过下班时间，跳到下一天8:00
    if (currentTotalMinutes >= dayEnd) {
      endTime.setDate(endTime.getDate() + 1);
      endTime.setHours(8, 0, 0, 0);
      continue;
    }
    
    // 计算当前时间段剩余工作时间
    let availableMinutes;
    if (currentTotalMinutes < morningEnd) {
      // 上午时间段
      availableMinutes = morningEnd - currentTotalMinutes;
    } else {
      // 下午时间段
      availableMinutes = dayEnd - currentTotalMinutes;
    }
    
    if (remainingMinutes <= availableMinutes) {
      // 可以在当前时间段完成
      endTime.setTime(endTime.getTime() + remainingMinutes * 60 * 1000);
      remainingMinutes = 0;
    } else {
      // 需要跨时间段
      endTime.setTime(endTime.getTime() + availableMinutes * 60 * 1000);
      remainingMinutes -= availableMinutes;
    }
  }
  
  return endTime;
}

/**
 * Step 6: 更新工单排程
 * @param {Array} scheduledWorkOrders - 已排程工单
 */
async function updateWorkOrderSchedule(scheduledWorkOrders) {
  for (const scheduled of scheduledWorkOrders) {
    await WorkOrder.findByIdAndUpdate(
      scheduled.workOrderId,
      {
        $set: {
          'plan.planned_start_time': scheduled.plannedStartTime,
          'plan.planned_end_time': scheduled.plannedEndTime,
          'plan.planned_duration': scheduled.duration
        }
      }
    );
  }
}

/**
 * 重新排程（调整优先级后）
 * @param {Array} workOrderIds - 工单ID列表
 * @param {String} priority - 新优先级
 */
async function rescheduleWorkOrders(workOrderIds, priority) {
  // 更新优先级
  await WorkOrder.updateMany(
    { _id: { $in: workOrderIds } },
    { $set: { priority } }
  );
  
  // 获取所有受影响的生产订单
  const workOrders = await WorkOrder.find({ _id: { $in: workOrderIds } });
  const productionOrderIds = [...new Set(workOrders.map(wo => wo.production_order.toString()))];
  
  // 重新排程每个生产订单
  const results = [];
  for (const poId of productionOrderIds) {
    const result = await scheduleProductionOrder(poId);
    results.push(result);
  }
  
  return results;
}

module.exports = {
  scheduleProductionOrder,
  rescheduleWorkOrders,
  expandBOM,
  checkATP,
  calculateProcurementTime,
  checkCapacity,
  intelligentScheduling
};

