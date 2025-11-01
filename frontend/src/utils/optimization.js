/**
 * 项目选型优化工具
 * 
 * 核心功能：将项目中的多个选型条目优化整合，生成精简的物料清单
 * 
 * @module optimization
 */

/**
 * 优化项目选型，生成优化后的物料清单
 * 
 * 算法逻辑：
 * 1. 收集所有需求（扭矩、位号、其他参数）
 * 2. 按需求扭矩从大到小排序
 * 3. 贪心算法分组：
 *    - 从最大需求开始
 *    - 找到价格最低且能满足扭矩的型号
 *    - 将该型号能满足的所有需求归并
 *    - 记录所有位号
 *    - 重复处理剩余需求
 * 4. 生成 optimized_bill_of_materials 格式
 * 
 * @param {Array} selections - 项目的所有选型条目数组
 * @returns {Object} 优化结果
 * @returns {Array} .optimized_bill_of_materials - 优化后的物料清单
 * @returns {Object} .statistics - 优化统计信息
 */
export const optimizeProjectSelection = (selections) => {
  // ==================== 步骤 1: 数据验证 ====================
  if (!Array.isArray(selections) || selections.length === 0) {
    return {
      optimized_bill_of_materials: [],
      statistics: {
        original_count: 0,
        optimized_count: 0,
        total_quantity: 0,
        total_price: 0,
        consolidation_rate: '0%',
        message: '没有可优化的选型数据'
      }
    };
  }

  // ==================== 步骤 2: 收集所有需求 ====================
  const requirements = [];
  
  selections.forEach((selection, index) => {
    // 提取必要信息
    const actuator = selection.selected_actuator;
    if (!actuator) {
      console.warn(`选型 ${index}: 缺少 selected_actuator 数据`);
      return;
    }

    const requirement = {
      // 基本信息
      tag_number: selection.tag_number || `UNKNOWN-${index}`,
      
      // 扭矩需求（用于优化）
      required_torque: selection.input_params?.required_torque || 
                       selection.input_params?.valve_torque || 
                       0,
      
      // 执行器信息
      actuator_model: actuator.final_model_name || 
                      actuator.recommended_model || 
                      actuator.model_base,
      
      series: actuator.series,
      action_type: actuator.action_type,
      mechanism: selection.input_params?.mechanism,
      
      // 价格信息
      unit_price: actuator.price || actuator.total_price || 0,
      
      // 实际扭矩（执行器能提供的）
      actual_torque: actuator.actual_torque || 0,
      
      // 其他关键参数（用于兼容性检查）
      temperature_code: actuator.temperature_code,
      valve_type: selection.input_params?.valve_type,
      yoke_type: actuator.yoke_type,
      
      // 完整的选型数据（备用）
      original_selection: selection
    };
    
    requirements.push(requirement);
  });


  // ==================== 步骤 3: 按需求扭矩从大到小排序 ====================
  requirements.sort((a, b) => b.required_torque - a.required_torque);
  

  // ==================== 步骤 4: 贪心算法分组 ====================
  const optimizedGroups = new Map(); // key: 型号, value: 分组数据
  const processedIndices = new Set(); // 已处理的需求索引

  for (let i = 0; i < requirements.length; i++) {
    // 跳过已处理的需求
    if (processedIndices.has(i)) {
      continue;
    }

    const currentReq = requirements[i];
    

    // 为当前需求选择型号
    const selectedModel = currentReq.actuator_model;
    const selectedPrice = currentReq.unit_price;
    

    // 收集能被此型号满足的所有需求
    const coveredRequirements = [currentReq];
    const coveredTags = [currentReq.tag_number];
    processedIndices.add(i);

    // 检查剩余需求
    for (let j = i + 1; j < requirements.length; j++) {
      if (processedIndices.has(j)) {
        continue;
      }

      const otherReq = requirements[j];

      // ========== 兼容性检查 ==========
      // 检查是否可以使用同一型号
      const isCompatible = checkCompatibility(currentReq, otherReq);

      if (isCompatible) {
        // 扭矩检查：当前型号能否满足其他需求
        if (currentReq.actual_torque >= otherReq.required_torque) {
          coveredRequirements.push(otherReq);
          coveredTags.push(otherReq.tag_number);
          processedIndices.add(j);
          
        } else {
        }
      } else {
      }
    }

    // 如果该型号已存在（可能是完全相同的型号和价格），则合并
    if (optimizedGroups.has(selectedModel)) {
      const existingGroup = optimizedGroups.get(selectedModel);
      
      // 检查价格是否一致
      if (existingGroup.unit_price === selectedPrice) {
        existingGroup.total_quantity += coveredRequirements.length;
        existingGroup.total_price = existingGroup.unit_price * existingGroup.total_quantity;
        existingGroup.covered_tags.push(...coveredTags);
        
      } else {
        // 价格不同，可能是不同配置，创建新的条目（添加后缀区分）
        const uniqueKey = `${selectedModel}_${selectedPrice}`;
        optimizedGroups.set(uniqueKey, {
          actuator_model: selectedModel,
          total_quantity: coveredRequirements.length,
          unit_price: selectedPrice,
          total_price: selectedPrice * coveredRequirements.length,
          covered_tags: coveredTags,
          notes: `价格: ¥${selectedPrice}`
        });
        
      }
    } else {
      // 创建新的分组
      optimizedGroups.set(selectedModel, {
        actuator_model: selectedModel,
        total_quantity: coveredRequirements.length,
        unit_price: selectedPrice,
        total_price: selectedPrice * coveredRequirements.length,
        covered_tags: coveredTags,
        notes: coveredRequirements.length > 1 
          ? `优化归并 ${coveredRequirements.length} 个位号` 
          : ''
      });
      
    }
  }

  // ==================== 步骤 5: 生成最终 BOM ====================
  const optimized_bill_of_materials = Array.from(optimizedGroups.values());

  // 按总价从高到低排序（重要的项目放在前面）
  optimized_bill_of_materials.sort((a, b) => b.total_price - a.total_price);

  // ==================== 步骤 6: 计算统计信息 ====================
  const total_quantity = optimized_bill_of_materials.reduce(
    (sum, item) => sum + item.total_quantity, 0
  );
  
  const total_price = optimized_bill_of_materials.reduce(
    (sum, item) => sum + item.total_price, 0
  );

  const consolidation_rate = requirements.length > 0
    ? ((requirements.length - optimized_bill_of_materials.length) / requirements.length * 100).toFixed(2)
    : '0';

  const statistics = {
    original_count: requirements.length,
    optimized_count: optimized_bill_of_materials.length,
    total_quantity,
    total_price,
    consolidation_rate: `${consolidation_rate}%`,
    message: `成功优化：${requirements.length} 个选型 → ${optimized_bill_of_materials.length} 个型号`
  };


  return {
    optimized_bill_of_materials,
    statistics
  };
};

/**
 * 检查两个需求是否兼容（可以使用同一型号）
 * 
 * @param {Object} req1 - 第一个需求
 * @param {Object} req2 - 第二个需求
 * @returns {boolean} 是否兼容
 */
const checkCompatibility = (req1, req2) => {
  // 如果是完全相同的型号，直接兼容
  if (req1.actuator_model === req2.actuator_model) {
    return true;
  }

  // ========== 关键参数检查 ==========
  
  // 1. 系列必须相同（SF, AT, GY）
  if (req1.series !== req2.series) {
    return false;
  }

  // 2. 作用类型必须相同（DA, SR）
  if (req1.action_type !== req2.action_type) {
    return false;
  }

  // 3. 机构类型必须相同（Scotch Yoke, Rack & Pinion）
  if (req1.mechanism && req2.mechanism && req1.mechanism !== req2.mechanism) {
    return false;
  }

  // 4. 温度代码应该相同（可选检查）
  if (req1.temperature_code && req2.temperature_code && 
      req1.temperature_code !== req2.temperature_code) {
    // 温度代码不同，可能可以归并（取更严格的），但为了简化，这里认为不兼容
    return false;
  }

  // 5. 阀门类型应该相同（SF系列）
  if (req1.valve_type && req2.valve_type && req1.valve_type !== req2.valve_type) {
    return false;
  }

  // 6. 轭架类型应该相同（SF系列）
  if (req1.yoke_type && req2.yoke_type && req1.yoke_type !== req2.yoke_type) {
    return false;
  }

  // 所有检查通过，认为兼容
  return true;
};

/**
 * 智能优化：考虑价格和扭矩的最优组合
 * 
 * 这是一个更高级的优化算法，可以在未来替换基础算法
 * 
 * @param {Array} selections - 项目的所有选型条目数组
 * @returns {Object} 优化结果
 */
export const smartOptimizeProjectSelection = (selections) => {
  // TODO: 实现更智能的优化算法
  // 考虑因素：
  // - 批量采购折扣
  // - 型号标准化（减少型号种类）
  // - 备件管理（优先选择常用型号）
  // - 交货周期（优先选择现货）
  
  // 目前使用基础算法
  return optimizeProjectSelection(selections);
};

/**
 * 导出优化结果为可下载格式
 * 
 * @param {Object} optimizationResult - 优化结果对象
 * @param {string} projectName - 项目名称
 * @returns {string} CSV 格式的字符串
 */
export const exportOptimizedBOM = (optimizationResult, projectName = 'Project') => {
  const { optimized_bill_of_materials, statistics } = optimizationResult;
  
  let csv = '优化物料清单 / Optimized Bill of Materials\n';
  csv += `项目名称 / Project Name: ${projectName}\n`;
  csv += `生成时间 / Generated: ${new Date().toLocaleString()}\n\n`;
  
  csv += `统计信息 / Statistics:\n`;
  csv += `原始选型数 / Original Selections: ${statistics.original_count}\n`;
  csv += `优化后型号数 / Optimized Models: ${statistics.optimized_count}\n`;
  csv += `总数量 / Total Quantity: ${statistics.total_quantity}\n`;
  csv += `总价 / Total Price: ¥${statistics.total_price.toLocaleString()}\n`;
  csv += `合并率 / Consolidation Rate: ${statistics.consolidation_rate}\n\n`;
  
  csv += '序号,型号,数量,单价,总价,覆盖位号,备注\n';
  csv += 'No.,Model,Qty,Unit Price,Total,Covered Tags,Notes\n';
  
  optimized_bill_of_materials.forEach((item, index) => {
    csv += `${index + 1},`;
    csv += `${item.actuator_model},`;
    csv += `${item.total_quantity},`;
    csv += `${item.unit_price},`;
    csv += `${item.total_price},`;
    csv += `"${item.covered_tags.join(', ')}",`;
    csv += `"${item.notes || ''}"\n`;
  });
  
  return csv;
};

export default {
  optimizeProjectSelection,
  smartOptimizeProjectSelection,
  exportOptimizedBOM
};

