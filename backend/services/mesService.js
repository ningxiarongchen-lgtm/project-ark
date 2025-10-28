const WorkOrder = require('../models/WorkOrder');
const ProductionOrder = require('../models/ProductionOrder');
const Routing = require('../models/Routing');
const WorkCenter = require('../models/WorkCenter');

/**
 * 核心服务：根据生产订单和工艺路线自动创建工单
 * @param {Object} productionOrder - 生产订单对象
 * @param {Object} options - 配置选项
 * @returns {Array} 生成的工单列表
 */
async function createWorkOrdersFromProductionOrder(productionOrder, options = {}) {
  try {
    const workOrders = [];
    const {
      auto_assign = false, // 是否自动分配操作工
      schedule_buffer = 30 // 工序间缓冲时间（分钟）
    } = options;
    
    // 遍历生产订单中的每个产品项
    for (const item of productionOrder.productionItems) {
      // 如果没有产品ID或工艺路线，跳过
      if (!item.product_id || !item.routing) {
        console.warn(`产品项 ${item.model_name} 缺少产品ID或工艺路线，跳过工单生成`);
        continue;
      }
      
      // 获取工艺路线
      const routing = await Routing.findById(item.routing)
        .populate('operations.work_center')
        .populate('operations.alternative_work_centers');
      
      if (!routing || routing.status !== '已发布') {
        console.warn(`产品项 ${item.model_name} 的工艺路线未发布，跳过工单生成`);
        continue;
      }
      
      // 按工序生成工单
      let currentStartTime = item.planned_start || productionOrder.schedule.plannedStartDate;
      
      for (const operation of routing.operations) {
        // 计算工单时间
        const setupTime = operation.timing.setup_time || 0;
        const unitTime = operation.timing.unit_time || 0;
        const waitTime = operation.timing.wait_time || 0;
        const moveTime = operation.timing.move_time || 0;
        
        // 总计划时间 = 准备时间 + (单件时间 × 数量) + 等待时间 + 移动时间
        const totalTime = setupTime + (unitTime * item.ordered_quantity) + waitTime + moveTime;
        const plannedEndTime = new Date(currentStartTime.getTime() + totalTime * 60000);
        
        // 选择工作中心（优先使用主工作中心）
        let selectedWorkCenter = operation.work_center;
        
        // 如果主工作中心不可用，尝试备选工作中心
        if (!selectedWorkCenter.is_active || selectedWorkCenter.equipment.status !== '正常') {
          if (operation.alternative_work_centers && operation.alternative_work_centers.length > 0) {
            selectedWorkCenter = operation.alternative_work_centers.find(
              wc => wc.is_active && wc.equipment.status === '正常'
            ) || selectedWorkCenter;
          }
        }
        
        // 创建工单数据
        const workOrderData = {
          production_order: productionOrder._id,
          sales_order: productionOrder.salesOrder,
          
          product: {
            product_id: item.product_id,
            model_base: item.model_name,
            version: routing.product.version
          },
          
          operation: {
            sequence: operation.sequence,
            operation_code: operation.operation_code,
            operation_name: operation.operation_name,
            operation_type: operation.operation_type,
            description: operation.description
          },
          
          work_center: selectedWorkCenter._id,
          
          plan: {
            planned_quantity: item.ordered_quantity,
            planned_start_time: currentStartTime,
            planned_end_time: plannedEndTime,
            planned_duration: totalTime
          },
          
          status: '待发布',
          priority: productionOrder.priority === 'Urgent' ? '紧急' : 
                    productionOrder.priority === 'High' ? '高' :
                    productionOrder.priority === 'Low' ? '低' : '正常',
          
          // 设置质检要求
          requires_quality_check: operation.is_quality_check_required || false,
          quality_check_type: operation.quality_check_type,
          
          created_by: productionOrder.created_by
        };
        
        // 如果需要自动分配操作工
        if (auto_assign && selectedWorkCenter.operators && selectedWorkCenter.operators.length > 0) {
          workOrderData.assigned_operators = selectedWorkCenter.operators.slice(0, operation.staffing?.required_operators || 1).map(op => ({
            operator: op,
            role: '操作工'
          }));
        }
        
        // 添加物料消耗信息
        if (operation.materials && operation.materials.length > 0) {
          workOrderData.material_consumption = operation.materials.map(m => ({
            material_code: m.material_code,
            material_name: m.material_name,
            planned_quantity: m.quantity * item.ordered_quantity,
            unit: m.unit
          }));
        }
        
        // 添加工具使用信息
        if (operation.tools && operation.tools.length > 0) {
          workOrderData.tool_usage = operation.tools.map(t => ({
            tool_code: t.tool_code,
            tool_name: t.tool_name
          }));
        }
        
        // 添加质量检查点
        if (operation.quality_checks && operation.quality_checks.length > 0) {
          workOrderData.quality_checks = operation.quality_checks.map(qc => ({
            check_point: qc.check_point,
            check_result: '待检'
          }));
        }
        
        // 添加工艺指导
        if (operation.work_instructions) {
          workOrderData.notes = `工艺指导:\n${operation.work_instructions}`;
          if (operation.safety_notes) {
            workOrderData.notes += `\n\n安全注意:\n${operation.safety_notes}`;
          }
        }
        
        // 创建工单
        const workOrder = await WorkOrder.create(workOrderData);
        workOrders.push(workOrder);
        
        // 更新下一工序的开始时间（当前结束时间 + 缓冲时间）
        currentStartTime = new Date(plannedEndTime.getTime() + schedule_buffer * 60000);
      }
    }
    
    // 更新生产订单，关联生成的工单
    if (workOrders.length > 0) {
      productionOrder.work_orders = workOrders.map(wo => wo._id);
      productionOrder.work_orders_generated = true;
      await productionOrder.save();
    }
    
    return workOrders;
    
  } catch (error) {
    console.error('创建工单失败:', error);
    throw new Error(`创建工单失败: ${error.message}`);
  }
}

/**
 * 根据工单更新生产订单进度
 * @param {String} productionOrderId - 生产订单ID
 */
async function updateProductionOrderProgress(productionOrderId) {
  try {
    const productionOrder = await ProductionOrder.findById(productionOrderId)
      .populate('work_orders');
    
    if (!productionOrder) {
      throw new Error('生产订单不存在');
    }
    
    // 统计工单状态
    const workOrders = productionOrder.work_orders;
    const totalWorkOrders = workOrders.length;
    const completedWorkOrders = workOrders.filter(wo => wo.status === '已完成').length;
    const inProgressWorkOrders = workOrders.filter(wo => wo.status === '进行中').length;
    
    // 更新生产订单状态
    if (completedWorkOrders === totalWorkOrders && totalWorkOrders > 0) {
      productionOrder.status = 'Completed';
      productionOrder.schedule.actualCompletedDate = new Date();
    } else if (inProgressWorkOrders > 0 || completedWorkOrders > 0) {
      productionOrder.status = 'In Production';
      if (!productionOrder.schedule.actualStartDate) {
        productionOrder.schedule.actualStartDate = new Date();
      }
    }
    
    // 更新产品项的生产数量
    for (const item of productionOrder.productionItems) {
      // 查找该产品项的所有工单
      const itemWorkOrders = workOrders.filter(
        wo => wo.product.product_id.toString() === item.product_id.toString()
      );
      
      if (itemWorkOrders.length > 0) {
        // 使用最后一道工序的数量作为产品项的数量
        const lastOperation = itemWorkOrders[itemWorkOrders.length - 1];
        item.produced_quantity = lastOperation.actual.actual_quantity || 0;
        item.qualified_quantity = lastOperation.actual.good_quantity || 0;
        item.defective_quantity = lastOperation.actual.reject_quantity || 0;
        
        // 更新产品项状态
        if (lastOperation.status === '已完成') {
          item.production_status = 'Completed';
          item.actual_end = lastOperation.actual.actual_end_time;
        } else if (lastOperation.status === '进行中') {
          item.production_status = 'In Production';
          if (!item.actual_start) {
            item.actual_start = lastOperation.actual.actual_start_time;
          }
        }
      }
    }
    
    // 重新计算进度
    productionOrder.calculateProgress();
    productionOrder.calculateQualityRate();
    
    await productionOrder.save();
    
    return productionOrder;
    
  } catch (error) {
    console.error('更新生产订单进度失败:', error);
    throw new Error(`更新生产订单进度失败: ${error.message}`);
  }
}

/**
 * 智能调度：根据工作中心负载重新分配工单
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 */
async function rescheduleWorkOrders(startDate, endDate) {
  try {
    // 获取时间范围内的待调度工单
    const workOrders = await WorkOrder.find({
      status: { $in: ['待发布', '已发布'] },
      'plan.planned_start_time': {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('work_center')
      .sort({ priority: -1, 'plan.planned_start_time': 1 });
    
    // 获取所有可用工作中心
    const workCenters = await WorkCenter.find({
      is_active: true,
      'equipment.status': '正常'
    });
    
    const rescheduled = [];
    
    // 按优先级和计划时间对工单进行调度
    for (const wo of workOrders) {
      // 查找最合适的工作中心
      const suitableWorkCenters = workCenters.filter(wc =>
        wc.canPerformOperation(wo.operation.operation_name)
      );
      
      if (suitableWorkCenters.length === 0) continue;
      
      // 选择负载最低的工作中心
      let selectedWC = suitableWorkCenters[0];
      let minLoad = await getWorkCenterLoad(selectedWC._id, wo.plan.planned_start_time);
      
      for (const wc of suitableWorkCenters.slice(1)) {
        const load = await getWorkCenterLoad(wc._id, wo.plan.planned_start_time);
        if (load < minLoad) {
          minLoad = load;
          selectedWC = wc;
        }
      }
      
      // 如果工作中心发生变化，更新工单
      if (wo.work_center._id.toString() !== selectedWC._id.toString()) {
        wo.work_center = selectedWC._id;
        await wo.save();
        rescheduled.push(wo);
      }
    }
    
    return rescheduled;
    
  } catch (error) {
    console.error('重新调度工单失败:', error);
    throw new Error(`重新调度工单失败: ${error.message}`);
  }
}

/**
 * 获取工作中心在指定时间的负载
 * @param {String} workCenterId - 工作中心ID
 * @param {Date} time - 时间点
 * @returns {Number} 负载百分比
 */
async function getWorkCenterLoad(workCenterId, time) {
  const dayStart = new Date(time);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(time);
  dayEnd.setHours(23, 59, 59, 999);
  
  // 查找该工作中心在当天的所有工单
  const workOrders = await WorkOrder.find({
    work_center: workCenterId,
    status: { $in: ['已发布', '进行中'] },
    'plan.planned_start_time': {
      $gte: dayStart,
      $lte: dayEnd
    }
  });
  
  // 计算总计划工时
  const totalPlannedTime = workOrders.reduce((sum, wo) => 
    sum + (wo.plan.planned_duration || 0), 0
  );
  
  // 获取工作中心日产能（分钟）
  const workCenter = await WorkCenter.findById(workCenterId);
  const dailyCapacity = workCenter.capacity.hours_per_shift * 
                        workCenter.capacity.shifts_per_day * 60;
  
  // 计算负载百分比
  return (totalPlannedTime / dailyCapacity) * 100;
}

/**
 * 生成工作中心产能报告
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 */
async function generateCapacityReport(startDate, endDate) {
  try {
    const workCenters = await WorkCenter.find({ is_active: true });
    const report = [];
    
    for (const wc of workCenters) {
      // 查找时间范围内的工单
      const workOrders = await WorkOrder.find({
        work_center: wc._id,
        'plan.planned_start_time': {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      // 计算统计数据
      const totalWorkOrders = workOrders.length;
      const completedWorkOrders = workOrders.filter(wo => wo.status === '已完成').length;
      const totalPlannedTime = workOrders.reduce((sum, wo) => sum + (wo.plan.planned_duration || 0), 0);
      const totalActualTime = workOrders.reduce((sum, wo) => sum + (wo.actual.actual_duration || 0), 0);
      
      // 计算日期范围内的工作日数
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const totalCapacity = wc.capacity.hours_per_shift * 
                           wc.capacity.shifts_per_day * 60 * days;
      
      report.push({
        work_center: {
          id: wc._id,
          code: wc.code,
          name: wc.name,
          type: wc.type
        },
        statistics: {
          total_work_orders: totalWorkOrders,
          completed_work_orders: completedWorkOrders,
          completion_rate: totalWorkOrders > 0 ? (completedWorkOrders / totalWorkOrders) * 100 : 0,
          total_planned_time: totalPlannedTime,
          total_actual_time: totalActualTime,
          total_capacity: totalCapacity,
          capacity_utilization: (totalPlannedTime / totalCapacity) * 100,
          efficiency: totalActualTime > 0 ? (totalPlannedTime / totalActualTime) * 100 : 0
        }
      });
    }
    
    return report;
    
  } catch (error) {
    console.error('生成产能报告失败:', error);
    throw new Error(`生成产能报告失败: ${error.message}`);
  }
}

module.exports = {
  createWorkOrdersFromProductionOrder,
  updateProductionOrderProgress,
  rescheduleWorkOrders,
  getWorkCenterLoad,
  generateCapacityReport
};

