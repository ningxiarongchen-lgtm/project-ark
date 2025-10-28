const Actuator = require('../models/Actuator');
const ManualOverride = require('../models/ManualOverride');
const { calculatePrice } = require('../utils/pricing');

// @desc    选型引擎核心计算逻辑（升级版 - 支持多种机构类型）
// @route   POST /api/selection/calculate
// @access  Private
exports.calculateSelection = async (req, res) => {
  try {
    const {
      // 新版参数（camelCase风格）
      valveTorque, // 阀门扭矩
      safetyFactor = 1.3, // 安全系数，默认1.3
      valveType, // 阀门类型：'Ball Valve' 或 'Butterfly Valve'（仅用于Scotch Yoke）
      
      // 兼容旧版参数（snake_case风格）
      valve_torque, // 阀门扭矩（旧版）
      required_torque, // 或直接提供所需扭矩（旧版）
      safety_factor, // 安全系数（旧版）
      valve_type, // 阀门类型（旧版）
      
      // 其他必需参数
      working_pressure, // 工作压力（MPa）
      working_angle = 0, // 工作角度（0 或 90）
      action_type_preference, // 作用类型偏好：'DA' 或 'SR'
      mechanism, // 机构类型：'Scotch Yoke' 或 'Rack & Pinion'
      body_size_preference, // 本体尺寸偏好
      needs_manual_override = false,
      manual_override_type,
      max_budget, // 最大预算
      special_requirements,
      
      // AT/GY 系列特有参数
      temperature_type = 'normal', // 使用温度：'normal', 'low', 'high'
      needs_handwheel = false, // 是否需要手轮
      
      // 温度代码（用于所有系列）
      temperature_code = 'No code' // 温度代码：'No code', 'T1', 'T2', 'T3', 'M'
    } = req.body;

    // ========================================
    // 步骤 1: 验证必需参数
    // ========================================
    if (!working_pressure) {
      return res.status(400).json({
        success: false,
        message: '请提供工作压力'
      });
    }

    if (!mechanism) {
      return res.status(400).json({
        success: false,
        message: '请提供机构类型（mechanism）: "Scotch Yoke" 或 "Rack & Pinion"'
      });
    }

    // 获取实际的阀门类型（优先使用新版参数）
    const actualValveType = valveType || valve_type;

    // 如果选择 Scotch Yoke，必须提供阀门类型
    if (mechanism === 'Scotch Yoke' && !actualValveType) {
      return res.status(400).json({
        success: false,
        message: '请提供阀门类型（valveType）: "Ball Valve" 或 "Butterfly Valve"'
      });
    }

    // 验证阀门类型的有效性
    if (actualValveType && !['Ball Valve', 'Butterfly Valve'].includes(actualValveType)) {
      return res.status(400).json({
        success: false,
        message: '阀门类型无效，必须是 "Ball Valve" 或 "Butterfly Valve"'
      });
    }

    // ========================================
    // 步骤 2: 计算最终需求扭矩
    // 优先使用新版参数，兼容旧版参数
    // ========================================
    let requiredTorque; // 最终需求扭矩
    let actualValveTorque; // 实际阀门扭矩
    let actualSafetyFactor; // 实际安全系数

    // 优先使用新版 camelCase 参数
    if (valveTorque !== undefined) {
      actualValveTorque = valveTorque;
      actualSafetyFactor = safetyFactor; // 默认1.3
      requiredTorque = valveTorque * safetyFactor;
      
      console.log(`📊 扭矩计算：阀门扭矩 ${valveTorque} N·m × 安全系数 ${safetyFactor} = ${requiredTorque} N·m`);
    } 
    // 兼容旧版 snake_case 参数
    else if (valve_torque !== undefined) {
      actualValveTorque = valve_torque;
      actualSafetyFactor = safety_factor || 1.3; // 默认1.3
      requiredTorque = valve_torque * actualSafetyFactor;
      
      console.log(`📊 扭矩计算（旧版）：阀门扭矩 ${valve_torque} N·m × 安全系数 ${actualSafetyFactor} = ${requiredTorque} N·m`);
    } 
    // 如果直接提供了 required_torque，则使用它
    else if (required_torque !== undefined) {
      requiredTorque = required_torque;
      actualValveTorque = null;
      actualSafetyFactor = null;
      
      console.log(`📊 直接使用需求扭矩：${requiredTorque} N·m`);
    } 
    // 都没提供，报错
    else {
      return res.status(400).json({
        success: false,
        message: '请提供阀门扭矩（valveTorque）或需求扭矩（required_torque）'
      });
    }

    // ========================================
    // 步骤 3: 构建查询条件 - 动态筛选
    // ========================================
    let query = {
      mechanism: mechanism // 根据机构类型筛选
    };
    
    if (action_type_preference) {
      query.action_type = action_type_preference.toUpperCase();
    }
    
    if (body_size_preference) {
      query.body_size = body_size_preference.toUpperCase();
    }

    console.log('🔍 查询条件:', query);

    // 从数据库获取候选执行器
    const candidateActuators = await Actuator.find(query);

    if (candidateActuators.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到符合条件的执行器',
        query_conditions: query
      });
    }

    console.log(`📦 找到 ${candidateActuators.length} 个候选执行器`);

    // ========================================
    // 步骤 4: 执行扭矩匹配逻辑（根据机构类型）
    // ========================================
    const finalResults = [];

    if (mechanism === 'Scotch Yoke') {
      // ========== Scotch Yoke 逻辑（SF 系列）- 基于阀门类型 ==========
      // 转换压力键格式（0.3 → 0_3）
      const pressureKey = String(working_pressure).replace('.', '_');
      const torqueKey = `${pressureKey}_${working_angle}`;

      console.log(`🎯 Scotch Yoke 选型: 阀门类型 = ${actualValveType}, 压力键 = ${torqueKey}`);

      for (const actuator of candidateActuators) {
        let shouldInclude = false;
        let actualTorque = null;
        let yokeType = null; // 'Symmetric' 或 'Canted'
        let recommendedModel = actuator.model_base; // 推荐的型号（可能带/C）

        // 根据阀门类型，选择相应的扭矩数据
        if (actualValveType === 'Ball Valve') {
          // 球阀：只检查对称轭架扭矩
          const symmetricTorque = actuator.torque_symmetric.get(torqueKey);
          
          if (symmetricTorque && symmetricTorque >= requiredTorque) {
            shouldInclude = true;
            actualTorque = symmetricTorque;
            yokeType = 'Symmetric';
            recommendedModel = actuator.model_base; // 不带 /C
            
            console.log(`  ✓ ${actuator.model_base}: 球阀适用，对称扭矩 ${symmetricTorque} N·m >= ${requiredTorque} N·m`);
          } else {
            console.log(`  ✗ ${actuator.model_base}: 球阀不适用，对称扭矩 ${symmetricTorque || 'N/A'} N·m < ${requiredTorque} N·m`);
          }
          
        } else if (actualValveType === 'Butterfly Valve') {
          // 蝶阀：只检查倾斜轭架扭矩
          const cantedTorque = actuator.torque_canted.get(torqueKey);
          
          if (cantedTorque && cantedTorque >= requiredTorque) {
            shouldInclude = true;
            actualTorque = cantedTorque;
            yokeType = 'Canted';
            recommendedModel = `${actuator.model_base}/C`; // 带 /C 标识
            
            console.log(`  ✓ ${actuator.model_base}/C: 蝶阀适用，倾斜扭矩 ${cantedTorque} N·m >= ${requiredTorque} N·m`);
          } else {
            console.log(`  ✗ ${actuator.model_base}/C: 蝶阀不适用，倾斜扭矩 ${cantedTorque || 'N/A'} N·m < ${requiredTorque} N·m`);
          }
        }

        if (shouldInclude) {
          // 预算过滤
          if (max_budget && actuator.base_price > max_budget) {
            continue;
          }

          // 计算扭矩裕度
          const torqueMargin = ((actualTorque - requiredTorque) / requiredTorque * 100);

          // 计算推荐等级
          let recommendLevel = '可选';
          if (torqueMargin >= 20 && torqueMargin <= 50) {
            recommendLevel = '强烈推荐';
          } else if (torqueMargin > 10 && torqueMargin < 20) {
            recommendLevel = '推荐';
          } else if (torqueMargin < 10) {
            recommendLevel = '勉强可用';
          }

          // 查找兼容的手动操作装置
          let compatibleOverrides = [];
          let recommendedOverride = null;

          if (needs_manual_override) {
            compatibleOverrides = await ManualOverride.find({
              compatible_body_sizes: actuator.body_size
            });

            if (compatibleOverrides.length > 0) {
              compatibleOverrides.sort((a, b) => a.price - b.price);
              recommendedOverride = compatibleOverrides[0];
            }
          }

          // ========== 温度代码价格调整（SF系列）==========
          // 使用新的智能定价函数计算基础价格
          // ⭐ 新方式：传入完整的产品对象，函数自动判断定价模式
          const basePrice = calculatePrice(actuator, 1);
          
          // 如果温度代码不是 'No code'，价格上浮5%
          let adjustedPrice = basePrice;
          let priceAdjustment = 0;
          
          if (temperature_code && temperature_code !== 'No code') {
            priceAdjustment = basePrice * 0.05; // 5% 上浮
            adjustedPrice = basePrice * 1.05;
            console.log(`  💰 温度代码 ${temperature_code}: 价格调整 = ¥${basePrice} × 1.05 = ¥${adjustedPrice.toFixed(2)}`);
          }
          
          // 计算总价（使用调整后的价格）
          let totalPrice = adjustedPrice;
          if (recommendedOverride) {
            totalPrice += recommendedOverride.price;
          }
          
          // ========== 生成最终型号名称 ==========
          // 规则：基础型号 + 温度代码（如果不是 'No code'）
          let finalModelName = recommendedModel;
          if (temperature_code && temperature_code !== 'No code') {
            finalModelName = `${recommendedModel}-${temperature_code.toUpperCase()}`;
          }
          
          console.log(`  📝 最终型号: ${finalModelName} (基础: ${recommendedModel}, 温度: ${temperature_code})`);

          finalResults.push({
            _id: actuator._id,
            model_base: actuator.model_base,
            recommended_model: recommendedModel, // 推荐型号（可能带 /C）
            final_model_name: finalModelName, // ⭐ 最终完整型号（含温度代码）
            series: actuator.series,
            mechanism: actuator.mechanism,
            body_size: actuator.body_size,
            action_type: actuator.action_type,
            valve_type: actualValveType, // 阀门类型
            yoke_type: yokeType, // 轭架类型：Symmetric 或 Canted
            temperature_code: temperature_code, // ⭐ 温度代码
            price: adjustedPrice, // ⭐ 调整后的价格
            base_price: actuator.base_price, // 原始基础价格
            price_adjustment: priceAdjustment, // 价格调整金额
            actual_torque: actualTorque,
            torque_margin: parseFloat(torqueMargin.toFixed(2)),
            recommend_level: recommendLevel,
            lead_time: actuator.specifications?.lead_time || '14天',
            manual_override: recommendedOverride ? {
              _id: recommendedOverride._id,
              model: recommendedOverride.model,
              price: recommendedOverride.price
            } : null,
            total_price: totalPrice, // ⭐ 总价（含温度调整和手轮）
            compatible_overrides_count: compatibleOverrides.length
          });
        }
      }

    } else if (mechanism === 'Rack & Pinion') {
      // ========== Rack & Pinion 逻辑（AT/GY 系列）==========
      
      for (const actuator of candidateActuators) {
        let shouldInclude = false;
        let actualTorque = null;

        if (actuator.action_type === 'DA') {
          // DA (双作用): 找到与工作压力最接近且不大于的扭矩值
          const torqueData = actuator.torque_data || {};
          
          // 构建可能的压力键名（0.3MPa, 0.4MPa, 0.5MPa, 0.55MPa, 0.6MPa等）
          const possibleKeys = [
            `${working_pressure}MPa`,
            `${working_pressure.toFixed(1)}MPa`,
            `${working_pressure.toFixed(2)}MPa`
          ];
          
          // 尝试精确匹配
          for (const key of possibleKeys) {
            if (torqueData[key]) {
              actualTorque = torqueData[key];
              break;
            }
          }
          
          // 如果没有精确匹配，找最接近且不大于的压力
          if (!actualTorque) {
            const availablePressures = Object.keys(torqueData)
              .filter(key => key.includes('MPa'))
              .map(key => {
                const match = key.match(/(\d+\.?\d*)MPa/);
                return match ? parseFloat(match[1]) : null;
              })
              .filter(p => p !== null && p <= working_pressure)
              .sort((a, b) => b - a); // 降序排列
            
            if (availablePressures.length > 0) {
              const closestPressure = availablePressures[0];
              const closestKey = Object.keys(torqueData).find(key => 
                key.includes(`${closestPressure}MPa`)
              );
              if (closestKey) {
                actualTorque = torqueData[closestKey];
              }
            }
          }
          
          // 检查是否满足扭矩要求
          if (actualTorque && actualTorque >= requiredTorque) {
            shouldInclude = true;
          }

        } else if (actuator.action_type === 'SR') {
          // SR (弹簧复位): 需要同时满足 spring_end 和 air_start
          const torqueData = actuator.torque_data || {};
          
          const springEndTorque = torqueData.spring_end || torqueData.spring_end;
          let airStartTorque = null;
          
          // 查找 air_start 相关的键
          const airStartKey = Object.keys(torqueData).find(key => 
            key.includes('air_start') && key.includes(working_pressure.toString())
          );
          
          if (airStartKey) {
            airStartTorque = torqueData[airStartKey];
          }
          
          // 如果找不到精确匹配，尝试找最接近的
          if (!airStartTorque) {
            const airStartKeys = Object.keys(torqueData)
              .filter(key => key.includes('air_start'));
            
            if (airStartKeys.length > 0) {
              // 使用第一个可用的 air_start 值
              airStartTorque = torqueData[airStartKeys[0]];
            }
          }
          
          // 两个条件都要满足
          if (springEndTorque >= requiredTorque && 
              airStartTorque && airStartTorque >= requiredTorque) {
            shouldInclude = true;
            actualTorque = Math.min(springEndTorque, airStartTorque);
          }
        }

        if (shouldInclude) {
          // ========== AT/GY 系列价格计算逻辑 ==========
          
          // ⭐ 使用新的智能定价函数，传入完整的产品对象
          // 函数会自动根据 pricing_model 判断使用固定价格还是阶梯价格
          const basePrice = calculatePrice(actuator, 1);
          
          // 确定价格类型说明（用于日志）
          let priceType;
          switch (temperature_type) {
            case 'low':
              priceType = '低温型';
              break;
            case 'high':
              priceType = '高温型';
              break;
            default: // 'normal'
              priceType = '常温型';
          }
          
          console.log(`  💰 ${actuator.model_base}: ${priceType}价格 = ¥${basePrice}`);
          
          // 2. 计算总价
          let totalPrice = basePrice;
          let handwheelInfo = null;
          
          // 如果需要手轮，加上手轮价格
          if (needs_handwheel && actuator.pricing && actuator.pricing.manual_override_price) {
            totalPrice += actuator.pricing.manual_override_price;
            handwheelInfo = {
              model: actuator.pricing.manual_override_model || '手轮',
              price: actuator.pricing.manual_override_price
            };
            console.log(`  🔧 加上手轮: ${handwheelInfo.model} = ¥${handwheelInfo.price}`);
            console.log(`  💵 总价: ¥${totalPrice}`);
          }
          
          // 预算过滤（使用总价）
          if (max_budget && totalPrice > max_budget) {
            console.log(`  ✗ ${actuator.model_base}: 总价 ¥${totalPrice} 超出预算 ¥${max_budget}`);
            continue;
          }

          // 计算扭矩裕度
          const torqueMargin = ((actualTorque - requiredTorque) / requiredTorque * 100);

          // 计算推荐等级
          let recommendLevel = '可选';
          if (torqueMargin >= 20 && torqueMargin <= 50) {
            recommendLevel = '强烈推荐';
          } else if (torqueMargin > 10 && torqueMargin < 20) {
            recommendLevel = '推荐';
          } else if (torqueMargin < 10) {
            recommendLevel = '勉强可用';
          }
          
          // ========== 生成最终型号名称（AT/GY系列）==========
          // 规则：基础型号 + 温度代码（如果不是 'No code'）
          let finalModelName = actuator.model_base;
          if (temperature_code && temperature_code !== 'No code') {
            finalModelName = `${actuator.model_base}-${temperature_code.toUpperCase()}`;
          }
          
          console.log(`  📝 最终型号: ${finalModelName} (基础: ${actuator.model_base}, 温度: ${temperature_code})`);

          finalResults.push({
            _id: actuator._id,
            model_base: actuator.model_base,
            final_model_name: finalModelName, // ⭐ 最终完整型号（含温度代码）
            series: actuator.series,
            mechanism: actuator.mechanism,
            body_size: actuator.body_size,
            action_type: actuator.action_type,
            spring_range: actuator.spring_range,
            
            // 价格信息（详细）
            price: basePrice, // 基础价格
            price_type: priceType, // 价格类型说明
            temperature_type: temperature_type, // 使用温度
            temperature_code: temperature_code, // ⭐ 温度代码
            pricing: actuator.pricing, // 完整的价格结构
            
            // 手轮信息
            handwheel: handwheelInfo,
            needs_handwheel: needs_handwheel,
            
            // 扭矩信息
            actual_torque: actualTorque,
            torque_margin: parseFloat(torqueMargin.toFixed(2)),
            recommend_level: recommendLevel,
            torque_data: actuator.torque_data,
            
            // 其他信息
            dimensions: actuator.dimensions,
            lead_time: actuator.stock_info?.lead_time || 14,
            
            // 总价
            total_price: totalPrice,
            
            // 价格明细
            price_breakdown: {
              base_price: basePrice,
              handwheel_price: handwheelInfo ? handwheelInfo.price : 0,
              total: totalPrice
            }
          });
        }
      }
    }

    // ========================================
    // 步骤 5: 检查是否有结果并返回
    // ========================================
    if (finalResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到满足要求的执行器',
        suggestions: [
          '尝试降低扭矩要求或减小安全系数',
          '选择更高的工作压力',
          mechanism === 'Scotch Yoke' && actualValveType === 'Ball Valve' ? '考虑使用蝶阀（倾斜轭架扭矩更大）' : '考虑更大型号的执行器',
          '增加预算限制',
          '联系技术支持获取定制方案'
        ],
        search_criteria: {
          valve_torque: actualValveTorque,
          safety_factor: actualSafetyFactor,
          required_torque: requiredTorque,
          working_pressure,
          mechanism,
          valve_type: actualValveType, // 阀门类型
          action_type_preference: action_type_preference || '不限',
          max_budget
        }
      });
    }

    // ========================================
    // 步骤 6: 按价格排序并返回结果
    // ========================================
    finalResults.sort((a, b) => a.price - b.price);

    console.log(`✅ 成功找到 ${finalResults.length} 个匹配的执行器`);

    res.json({
      success: true,
      message: `找到 ${finalResults.length} 个满足要求的执行器`,
      count: finalResults.length,
      search_criteria: {
        valve_torque: actualValveTorque, // 阀门扭矩
        safety_factor: actualSafetyFactor, // 安全系数
        required_torque: requiredTorque, // 计算后的需求扭矩
        working_pressure,
        working_angle: mechanism === 'Scotch Yoke' ? working_angle : 'N/A',
        mechanism,
        valve_type: mechanism === 'Scotch Yoke' ? actualValveType : 'N/A', // 阀门类型
        temperature_code: temperature_code || 'No code', // ⭐ 温度代码（所有系列）
        temperature_type: mechanism === 'Rack & Pinion' ? temperature_type : 'N/A', // 使用温度（AT/GY系列）
        needs_handwheel: mechanism === 'Rack & Pinion' ? needs_handwheel : 'N/A', // 是否需要手轮（AT/GY系列）
        action_type_preference: action_type_preference || '不限',
        needs_manual_override,
        max_budget: max_budget || '不限'
      },
      data: finalResults,
      best_choice: finalResults[0], // 价格最低的选项
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('选型计算错误:', error);
    res.status(500).json({
      success: false,
      message: '选型计算失败',
      error: error.message
    });
  }
};

// @desc    获取选型建议（简化版）
// @route   POST /api/selection/recommend
// @access  Private
exports.getRecommendation = async (req, res) => {
  try {
    const { valve_type, valve_size, operating_conditions } = req.body;

    // 根据阀门类型和尺寸提供初步建议
    const recommendations = {
      valve_type,
      valve_size,
      suggested_parameters: {
        torque_range: 'Based on valve size and type',
        pressure_range: 'Typical operating pressure',
        recommended_action_type: 'DA or SR based on safety requirements'
      },
      next_steps: [
        '使用精确的扭矩值进行选型计算',
        '考虑工作压力和角度',
        '选择合适的轭架类型',
        '确定是否需要手动操作装置'
      ]
    };

    res.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取建议失败',
      error: error.message
    });
  }
};

// @desc    批量选型
// @route   POST /api/selection/batch
// @access  Private
exports.batchSelection = async (req, res) => {
  try {
    const { selections } = req.body; // 数组，每个元素包含选型参数

    if (!Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供选型参数数组'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < selections.length; i++) {
      const params = selections[i];
      try {
        // 调用选型逻辑（复用calculateSelection的核心逻辑）
        const { required_torque, working_pressure, working_angle = 0, yoke_type = 'symmetric' } = params;

        if (!required_torque || !working_pressure) {
          errors.push({
            index: i,
            tag_number: params.tag_number || `Selection ${i + 1}`,
            error: '缺少必需参数'
          });
          continue;
        }

        const suitable = await Actuator.findByTorqueRequirement(
          required_torque,
          working_pressure,
          working_angle,
          yoke_type
        );

        if (suitable.length > 0) {
          const pressureKey = String(working_pressure).replace('.', '_');
          const key = `${pressureKey}_${working_angle}`;
          const bestMatch = suitable[0];
          const torqueMap = yoke_type === 'symmetric' ? bestMatch.torque_symmetric : bestMatch.torque_canted;
          const actualTorque = torqueMap.get(key);

          // ⭐ 使用新的智能定价函数计算价格
          const price = calculatePrice(bestMatch, 1);
          
          results.push({
            index: i,
            tag_number: params.tag_number || `Selection ${i + 1}`,
            success: true,
            recommended_actuator: bestMatch.model_base,
            actual_torque: actualTorque,
            price: price
          });
        } else {
          errors.push({
            index: i,
            tag_number: params.tag_number || `Selection ${i + 1}`,
            error: '未找到满足要求的执行器'
          });
        }

      } catch (error) {
        errors.push({
          index: i,
          tag_number: params.tag_number || `Selection ${i + 1}`,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `批量选型完成：${results.length} 成功，${errors.length} 失败`,
      total: selections.length,
      successful: results.length,
      failed: errors.length,
      results: results,
      errors: errors
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量选型失败',
      error: error.message
    });
  }
};

