const ProductionOrder = require('../models/ProductionOrder');
const Actuator = require('../models/Actuator');
const PurchaseOrder = require('../models/PurchaseOrder');

/**
 * BOM展开 - 根据生产订单展开完整的物料清单
 * @route POST /api/production/:id/explode-bom
 * @access Private (Production Planner)
 */
exports.explodeBOM = async (req, res) => {
  try {
    const { id } = req.params;

    // 查找生产订单
    const productionOrder = await ProductionOrder.findById(id)
      .populate('salesOrder', 'orderNumber projectSnapshot');

    if (!productionOrder) {
      return res.status(404).json({ 
        success: false,
        message: 'Production order not found' 
      });
    }

    // 存储展开的BOM
    const explodedBOM = [];
    const missingBOM = []; // 缺失BOM的产品
    const errors = [];

    // 遍历生产订单中的每个产品
    for (const item of productionOrder.productionItems) {
      try {
        // 只处理Actuator类型的产品
        if (item.item_type === 'Actuator') {
          // 根据型号查找产品主数据
          const actuator = await Actuator.findOne({ model_base: item.model_name });

          if (!actuator) {
            errors.push({
              model_name: item.model_name,
              error: 'Product not found in master data'
            });
            continue;
          }

          // 检查是否有BOM结构
          if (!actuator.bom_structure || actuator.bom_structure.length === 0) {
            missingBOM.push({
              model_name: item.model_name,
              actuator_id: actuator._id,
              ordered_quantity: item.ordered_quantity,
              message: `Product ${item.model_name} has no BOM structure defined`
            });
            continue;
          }

          // 展开BOM - 计算每个零件的总需求量
          for (const bomItem of actuator.bom_structure) {
            const totalQuantity = bomItem.quantity * item.ordered_quantity;

            // 查找是否已经在展开的BOM中
            const existingIndex = explodedBOM.findIndex(
              eb => eb.part_number === bomItem.part_number
            );

            if (existingIndex >= 0) {
              // 累加数量
              explodedBOM[existingIndex].total_required_quantity += totalQuantity;
              explodedBOM[existingIndex].sources.push({
                product_model: item.model_name,
                product_quantity: item.ordered_quantity,
                part_quantity_per_product: bomItem.quantity
              });
            } else {
              // 新增
              explodedBOM.push({
                part_number: bomItem.part_number,
                part_name: bomItem.part_name,
                unit_quantity: bomItem.quantity, // 单位产品需要的数量
                total_required_quantity: totalQuantity, // 总需求量
                available_stock: 0, // 可用库存（需要WMS集成）
                shortage: totalQuantity, // 缺口（需要WMS集成后动态计算）
                sources: [{ // 来源产品
                  product_model: item.model_name,
                  product_quantity: item.ordered_quantity,
                  part_quantity_per_product: bomItem.quantity
                }],
                procurement_status: 'pending', // 采购状态
                estimated_arrival_date: null // 预计到货日期
              });
            }
          }
        } else {
          // 其他类型的物料直接加入
          explodedBOM.push({
            part_number: item.model_name,
            part_name: item.model_name,
            unit_quantity: 1,
            total_required_quantity: item.ordered_quantity,
            available_stock: 0,
            shortage: item.ordered_quantity,
            sources: [{
              product_model: item.model_name,
              product_quantity: item.ordered_quantity,
              part_quantity_per_product: 1
            }],
            procurement_status: 'pending',
            estimated_arrival_date: null,
            is_finished_product: true // 标记为成品
          });
        }
      } catch (error) {
        errors.push({
          model_name: item.model_name,
          error: error.message
        });
      }
    }

    // 🔗 数据联动：填充采购订单的预计到货日期
    // 遍历生产订单的bom_items，查找已关联的采购订单
    if (productionOrder.bom_items && productionOrder.bom_items.length > 0) {
      for (const bomItem of productionOrder.bom_items) {
        // 如果有关联的采购订单ID
        if (bomItem.purchase_order_id) {
          try {
            // 查找采购订单，只获取必要字段
            const purchaseOrder = await PurchaseOrder.findById(bomItem.purchase_order_id)
              .select('order_number expected_delivery_date actual_delivery_date status')
              .lean();

            if (purchaseOrder) {
              // 在explodedBOM中查找匹配的物料（通过material_code）
              const matchingItem = explodedBOM.find(
                item => item.part_number === bomItem.material_code
              );

              if (matchingItem) {
                // 填充采购订单信息
                matchingItem.purchase_order_id = purchaseOrder._id;
                matchingItem.purchase_order_number = purchaseOrder.order_number;
                matchingItem.estimated_delivery_date = purchaseOrder.expected_delivery_date;
                matchingItem.actual_delivery_date = purchaseOrder.actual_delivery_date;
                
                // 根据采购订单状态更新采购状态
                matchingItem.procurement_status = bomItem.procurement_status || 'pending';
                
                // 如果实际已到货，更新库存（实际应该从WMS系统查询）
                if (purchaseOrder.actual_delivery_date) {
                  matchingItem.procurement_status = '已到货';
                }
              }
            }
          } catch (poError) {
            console.warn(`Failed to fetch purchase order ${bomItem.purchase_order_id}:`, poError.message);
            // 继续处理其他物料，不中断流程
          }
        }
      }
    }

    // 返回结果
    res.json({
      success: true,
      data: {
        production_order_id: productionOrder._id,
        production_order_number: productionOrder.productionOrderNumber,
        exploded_bom: explodedBOM,
        missing_bom: missingBOM,
        errors: errors,
        statistics: {
          total_parts: explodedBOM.length,
          total_shortage_items: explodedBOM.filter(item => item.shortage > 0).length,
          products_missing_bom: missingBOM.length,
          items_with_purchase_orders: explodedBOM.filter(item => item.purchase_order_id).length,
          delayed_items: explodedBOM.filter(item => {
            if (!item.estimated_delivery_date || !productionOrder.schedule?.plannedStartDate) return false;
            return new Date(item.estimated_delivery_date) > new Date(productionOrder.schedule.plannedStartDate);
          }).length
        }
      },
      message: missingBOM.length > 0 
        ? `BOM exploded with ${missingBOM.length} product(s) missing BOM structure` 
        : 'BOM exploded successfully'
    });

  } catch (error) {
    console.error('Explode BOM error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

/**
 * 更新产品的BOM结构
 * @route PUT /api/actuators/:id/bom-structure
 * @access Private (Production Planner)
 */
exports.updateActuatorBOM = async (req, res) => {
  try {
    const { id } = req.params;
    const { bom_structure } = req.body;

    if (!bom_structure || !Array.isArray(bom_structure)) {
      return res.status(400).json({ 
        success: false,
        message: 'BOM structure is required and must be an array' 
      });
    }

    // 验证BOM结构
    for (const item of bom_structure) {
      if (!item.part_number || !item.part_name) {
        return res.status(400).json({ 
          success: false,
          message: 'Each BOM item must have part_number and part_name' 
        });
      }
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({ 
          success: false,
          message: 'Each BOM item must have quantity >= 1' 
        });
      }
    }

    // 更新执行器的BOM结构
    const actuator = await Actuator.findByIdAndUpdate(
      id,
      { 
        bom_structure,
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!actuator) {
      return res.status(404).json({ 
        success: false,
        message: 'Actuator not found' 
      });
    }

    res.json({
      success: true,
      message: 'BOM structure updated successfully',
      data: {
        actuator_id: actuator._id,
        model_base: actuator.model_base,
        bom_structure: actuator.bom_structure
      }
    });

  } catch (error) {
    console.error('Update actuator BOM error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

/**
 * 生成采购需求
 * @route POST /api/production/:id/generate-procurement
 * @access Private (Production Planner)
 */
exports.generateProcurementRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { shortage_items, notes, priority, required_date } = req.body;

    if (!shortage_items || shortage_items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No shortage items provided' 
      });
    }

    // 查找生产订单
    const productionOrder = await ProductionOrder.findById(id);
    if (!productionOrder) {
      return res.status(404).json({ 
        success: false,
        message: 'Production order not found' 
      });
    }

    // 创建采购需求记录（简化版，实际需要专门的采购需求模型）
    const procurementRequest = {
      request_number: `PR-${Date.now()}`, // 简化的编号生成
      production_order: id,
      production_order_number: productionOrder.productionOrderNumber,
      requested_by: req.user._id,
      requested_date: new Date(),
      required_date: required_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 默认30天后
      priority: priority || 'Normal',
      status: 'Pending',
      items: shortage_items.map(item => ({
        part_number: item.part_number,
        part_name: item.part_name,
        required_quantity: item.shortage || item.total_required_quantity,
        unit: item.unit || 'PCS',
        estimated_unit_price: item.estimated_unit_price || 0,
        notes: item.notes || ''
      })),
      notes: notes || '',
      total_estimated_cost: shortage_items.reduce((sum, item) => 
        sum + ((item.estimated_unit_price || 0) * (item.shortage || item.total_required_quantity)), 0
      )
    };

    // TODO: 实际应该保存到采购需求表，并通知采购专员
    // 这里先返回模拟结果
    
    res.json({
      success: true,
      message: 'Procurement request generated successfully',
      data: procurementRequest,
      notification: {
        type: 'procurement_request',
        message: `New procurement request ${procurementRequest.request_number} created`,
        assignees: ['Procurement Specialist'] // 需要通知的角色
      }
    });

  } catch (error) {
    console.error('Generate procurement request error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

