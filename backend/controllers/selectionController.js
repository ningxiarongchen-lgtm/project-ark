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
      requiredOpeningTorque, // 阀门开启所需扭矩
      requiredClosingTorque, // 阀门关闭所需扭矩
      
      // 兼容旧版参数（snake_case风格）
      valve_torque, // 阀门扭矩（旧版）
      required_torque, // 或直接提供所需扭矩（旧版）
      safety_factor, // 安全系数（旧版）
      valve_type, // 阀门类型（旧版）
      
      // 其他必需参数
      working_pressure, // 工作压力（MPa）
      working_angle, // 工作角度（将自动设置为90度，因为球阀和蝶阀都是旋转型阀门）
      action_type_preference, // 作用类型偏好：'DA' 或 'SR'
      mechanism, // 机构类型：'Scotch Yoke' 或 'Rack & Pinion'
      body_size_preference, // 本体尺寸偏好
      needs_manual_override = false,
      manual_override_type,
      max_budget, // 最大预算
      special_requirements,
      
      // 故障安全位置（仅用于单作用执行器）
      failSafePosition, // 'Fail Close', 'Fail Open', 或 'Not Applicable'
      
      // AT/GY 系列特有参数
      temperature_type = 'normal', // 使用温度：'normal', 'low', 'high'
      material_type, // 材质类型：'Aluminum Alloy'(铝合金/AT) 或 'Stainless Steel'(不锈钢/GY)
      
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

    // 根据执行机构类型验证阀门类型
    if (mechanism === 'Scotch Yoke') {
      // SF系列（拨叉式）：球阀、蝶阀
      if (!actualValveType) {
        return res.status(400).json({
          success: false,
          message: '请提供阀门类型（valveType）: "Ball Valve"（球阀-对称拨叉）或 "Butterfly Valve"（蝶阀-偏心拨叉）'
        });
      }
      if (!['Ball Valve', 'Butterfly Valve'].includes(actualValveType)) {
        return res.status(400).json({
          success: false,
          message: 'SF系列执行器的阀门类型必须是 "Ball Valve"（球阀-对称拨叉）或 "Butterfly Valve"（蝶阀-偏心拨叉）'
        });
      }
    } else if (mechanism === 'Rack & Pinion') {
      // AT/GY系列（齿轮齿条式）：球阀、蝶阀（旋转型阀门，行程90°）
      if (!actualValveType) {
        return res.status(400).json({
          success: false,
          message: '请提供阀门类型（valveType）: "Ball Valve"（球阀）或 "Butterfly Valve"（蝶阀）'
        });
      }
      if (!['Ball Valve', 'Butterfly Valve'].includes(actualValveType)) {
        return res.status(400).json({
          success: false,
          message: 'AT/GY系列执行器的阀门类型必须是 "Ball Valve"（球阀）或 "Butterfly Valve"（蝶阀）- 旋转型阀门'
        });
      }
    }

    // ========================================
    // 自动设置工作角度为90度（球阀和蝶阀都是旋转型阀门）
    // ========================================
    const actualWorkingAngle = 90; // 固定为90度
    console.log(`🔄 工作角度自动设置为 ${actualWorkingAngle}° (球阀/蝶阀为旋转型阀门)`);


    // 验证故障安全位置参数（单作用执行器必需）
    if (action_type_preference === 'SR' && !failSafePosition) {
      return res.status(400).json({
        success: false,
        message: '单作用执行器必须提供故障安全位置（failSafePosition）: "Fail Close" 或 "Fail Open"'
      });
    }

    // 验证故障安全位置的有效性
    if (failSafePosition && !['Fail Close', 'Fail Open', 'Not Applicable'].includes(failSafePosition)) {
      return res.status(400).json({
        success: false,
        message: '故障安全位置无效，必须是 "Fail Close", "Fail Open" 或 "Not Applicable"'
      });
    }

    // 如果选择单作用执行器，必须提供开启和关闭扭矩
    if (action_type_preference === 'SR' && (!requiredOpeningTorque || !requiredClosingTorque)) {
      return res.status(400).json({
        success: false,
        message: '单作用执行器必须提供阀门开启扭矩（requiredOpeningTorque）和关闭扭矩（requiredClosingTorque）'
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
    // 机构类型映射（支持中英文）
    const mechanismMapping = {
      'Scotch Yoke': ['Scotch Yoke', '拨叉式'],
      'Rack & Pinion': ['Rack & Pinion', '齿轮齿条']
    };
    
    const mechanismValues = mechanismMapping[mechanism] || [mechanism];
    
    let query = {
      mechanism: { $in: mechanismValues }, // 支持中英文机构类型
      status: '已发布' // 只选择已发布的产品
    };
    
    if (action_type_preference) {
      query.action_type = action_type_preference.toUpperCase();
    }
    
    if (body_size_preference) {
      query.body_size = body_size_preference.toUpperCase();
    }

    // AT/GY系列材质筛选（仅对Rack & Pinion有效）
    if (mechanism === 'Rack & Pinion' && material_type) {
      // 将英文材质名映射为中文（数据库中使用中文）
      const materialMapping = {
        'Aluminum Alloy': '铝合金',
        'Stainless Steel': '不锈钢'
      };
      query['materials.body'] = materialMapping[material_type] || material_type;
      console.log(`🔧 材质筛选: ${material_type} (${query['materials.body']}) - ${material_type === 'Aluminum Alloy' ? 'AT系列' : 'GY系列'}`);
    }

    console.log('🔍 查询条件:', query);

    // 从数据库获取候选执行器（按body_size排序，优先推荐小型号）
    const candidateActuators = await Actuator.find(query).sort({ body_size: 1 });

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
      const torqueKey = `${pressureKey}_${actualWorkingAngle}`;

      console.log(`🎯 Scotch Yoke 选型: 阀门类型 = ${actualValveType}, 工作角度 = ${actualWorkingAngle}°, 压力键 = ${torqueKey}`);

      for (const actuator of candidateActuators) {
        let shouldInclude = false;
        let actualTorque = null;
        let yokeType = null; // 'Symmetric' 或 'Canted'
        let recommendedModel = actuator.model_base; // 推荐的型号（可能带/C）

        // 检查执行器类型（DA 或 SR）
        if (actuator.action_type === 'DA') {
          // ========== 双作用执行器 (DA) ==========
          // 根据阀门类型，选择相应的扭矩数据
          if (actualValveType === 'Ball Valve') {
            // 球阀：只检查对称轭架扭矩
            // 兼容两种数据结构：torque_symmetric (Map) 或 torque_data.symmetric (Object)
            let symmetricTorque = null;
            if (actuator.torque_symmetric && actuator.torque_symmetric.get) {
              symmetricTorque = actuator.torque_symmetric.get(torqueKey);
            } else if (actuator.torque_data && actuator.torque_data.symmetric) {
              symmetricTorque = actuator.torque_data.symmetric[torqueKey];
            }
            
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
            // 兼容两种数据结构：torque_canted (Map) 或 torque_data.canted (Object)
            let cantedTorque = null;
            if (actuator.torque_canted && actuator.torque_canted.get) {
              cantedTorque = actuator.torque_canted.get(torqueKey);
            } else if (actuator.torque_data && actuator.torque_data.canted) {
              cantedTorque = actuator.torque_data.canted[torqueKey];
            }
            
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
          
        } else if (actuator.action_type === 'SR') {
          // ========== 单作用执行器 (SR) ==========
          // SF系列单作用执行器根据故障安全位置判断扭矩匹配逻辑
          const torqueData = actuator.torqueData || actuator.torque_data || {};
          
          // 根据阀门类型选择对应的扭矩数据（symmetric或canted）
          let torqueSet = null;
          if (actualValveType === 'Ball Valve') {
            torqueSet = torqueData.symmetric || {};
          } else if (actualValveType === 'Butterfly Valve') {
            torqueSet = torqueData.canted || {};
          }
          
          if (!torqueSet) {
            console.log(`  ✗ ${actuator.model_base}: 未找到${actualValveType}对应的扭矩数据`);
            continue;
          }
          
          // 提取弹簧扭矩数据（兼容大小写）
          const SST = torqueSet.SST || torqueSet.sst; // 弹簧起点扭矩
          const SET = torqueSet.SET || torqueSet.set; // 弹簧终点扭矩
          
          // 提取气源扭矩数据（根据工作压力）
          // 数据格式: ast_0.3, aet_0.3, ast_0.5, aet_0.5 等
          const pressureKey = String(working_pressure).replace('.', '_');
          const AST = torqueSet[`AST_${working_pressure}`] || torqueSet[`ast_${pressureKey}`]; // 气源起点扭矩
          const AET = torqueSet[`AET_${working_pressure}`] || torqueSet[`aet_${pressureKey}`]; // 气源终点扭矩
          
          console.log(`  🔍 SF-SR执行器 ${actuator.model_base} 扭矩数据:`, {
            springTorque: { SST, SET },
            airTorque: { AST, AET },
            failSafePosition: failSafePosition
          });
          
          // 根据故障安全位置和阀门类型判断
          if (failSafePosition === 'Fail Close') {
            // 故障关 (STC): 弹簧关阀，气源开阀
            // 条件1: 弹簧复位终点扭矩 SET >= 关闭扭矩
            // 条件2: 气源动作起点扭矩 AST >= 开启扭矩
            const condition1 = SET && SET >= requiredClosingTorque;
            const condition2 = AST && AST >= requiredOpeningTorque;
            
            if (condition1 && condition2) {
              shouldInclude = true;
              // 实际可用扭矩取两者中较小值
              actualTorque = Math.min(SET, AST);
              
              // 根据阀门类型确定轭架类型
              if (actualValveType === 'Ball Valve') {
                yokeType = 'Symmetric';
                recommendedModel = `${actuator.model_base}-STC`; // 不带 /C
              } else if (actualValveType === 'Butterfly Valve') {
                yokeType = 'Canted';
                recommendedModel = `${actuator.model_base}/C-STC`; // 带 /C 标识
              }
              
              console.log(`  ✓ ${recommendedModel}: 故障关匹配成功`);
            } else {
              console.log(`  ✗ ${actuator.model_base}-STC: 故障关不匹配`);
            }
            
          } else if (failSafePosition === 'Fail Open') {
            // 故障开 (STO): 弹簧开阀，气源关阀
            // 条件1: 弹簧复位起点扭矩 SST >= 开启扭矩
            // 条件2: 气源动作终点扭矩 AET >= 关闭扭矩
            const condition1 = SST && SST >= requiredOpeningTorque;
            const condition2 = AET && AET >= requiredClosingTorque;
            
            if (condition1 && condition2) {
              shouldInclude = true;
              // 实际可用扭矩取两者中较小值
              actualTorque = Math.min(SST, AET);
              
              // 根据阀门类型确定轭架类型
              if (actualValveType === 'Ball Valve') {
                yokeType = 'Symmetric';
                recommendedModel = `${actuator.model_base}-STO`; // 不带 /C
              } else if (actualValveType === 'Butterfly Valve') {
                yokeType = 'Canted';
                recommendedModel = `${actuator.model_base}/C-STO`; // 带 /C 标识
              }
              
              console.log(`  ✓ ${recommendedModel}: 故障开匹配成功`);
            } else {
              console.log(`  ✗ ${actuator.model_base}-STO: 故障开不匹配`);
            }
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
          // 规则：推荐型号（已包含/C和STC/STO） + 温度代码
          let finalModelName = recommendedModel;
          if (temperature_code && temperature_code !== 'No code') {
            finalModelName = `${recommendedModel}-${temperature_code.toUpperCase()}`;
          }
          
          console.log(`  📝 最终型号: ${finalModelName} (基础: ${recommendedModel}, 温度: ${temperature_code})`);

          finalResults.push({
            _id: actuator._id,
            model_base: actuator.model_base,
            recommended_model: recommendedModel, // 推荐型号（可能带 /C 和 STC/STO）
            final_model_name: finalModelName, // ⭐ 最终完整型号（含温度代码）
            series: actuator.series,
            mechanism: actuator.mechanism,
            body_size: actuator.body_size,
            action_type: actuator.action_type,
            valve_type: actualValveType, // 阀门类型
            yoke_type: yokeType, // 轭架类型：Symmetric 或 Canted
            fail_safe_position: failSafePosition, // ⭐ 故障安全位置
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
            total_price: totalPrice, // ⭐ 总价（含温度调整和手动操作装置）
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
          // SR (单作用): 根据故障安全位置判断扭矩匹配逻辑
          const torqueData = actuator.torqueData || actuator.torque_data || {};
          
          // 提取弹簧扭矩数据
          const springTorque = torqueData.springTorque || {};
          const SST = springTorque.SST; // 弹簧复位起点扭矩
          const SRT = springTorque.SRT; // 弹簧复位运行扭矩
          const SET = springTorque.SET; // 弹簧复位终点扭矩
          
          // 提取气源扭矩数据（根据工作压力）
          const airTorque = torqueData.airTorque || {};
          const pressureKey = `${working_pressure}MPa`;
          const airTorqueAtPressure = airTorque[pressureKey] || {};
          const AST = airTorqueAtPressure.AST; // 气源动作起点扭矩
          const ART = airTorqueAtPressure.ART; // 气源动作运行扭矩
          const AET = airTorqueAtPressure.AET; // 气源动作终点扭矩
          
          console.log(`  🔍 SR执行器 ${actuator.model_base} 扭矩数据:`, {
            springTorque: { SST, SRT, SET },
            airTorque: { AST, ART, AET },
            failSafePosition: failSafePosition
          });
          
          // 根据故障安全位置判断
          if (failSafePosition === 'Fail Close') {
            // 故障关 (STC): 弹簧关阀，气源开阀
            // 条件1: 弹簧复位终点扭矩 SET >= 关闭扭矩
            // 条件2: 气源动作起点扭矩 AST >= 开启扭矩
            const condition1 = SET && SET >= requiredClosingTorque;
            const condition2 = AST && AST >= requiredOpeningTorque;
            
            if (condition1 && condition2) {
              shouldInclude = true;
              // 实际可用扭矩取两者中较小值
              actualTorque = Math.min(SET, AST);
              
              console.log(`  ✓ ${actuator.model_base}-STC: 故障关匹配成功`);
              console.log(`    - SET (${SET}) >= 关闭扭矩 × ${safetyFactor} (${requiredClosingTorque * safetyFactor})`);
              console.log(`    - AST (${AST}) >= 开启扭矩 × ${safetyFactor} (${requiredOpeningTorque * safetyFactor})`);
            } else {
              console.log(`  ✗ ${actuator.model_base}-STC: 故障关不匹配`);
              if (!condition1) console.log(`    - SET (${SET}) < 关闭扭矩 × ${safetyFactor} (${requiredClosingTorque * safetyFactor})`);
              if (!condition2) console.log(`    - AST (${AST}) < 开启扭矩 × ${safetyFactor} (${requiredOpeningTorque * safetyFactor})`);
            }
            
          } else if (failSafePosition === 'Fail Open') {
            // 故障开 (STO): 弹簧开阀，气源关阀
            // 条件1: 弹簧复位起点扭矩 SST >= 开启扭矩
            // 条件2: 气源动作终点扭矩 AET >= 关闭扭矩
            const condition1 = SST && SST >= requiredOpeningTorque;
            const condition2 = AET && AET >= requiredClosingTorque;
            
            if (condition1 && condition2) {
              shouldInclude = true;
              // 实际可用扭矩取两者中较小值
              actualTorque = Math.min(SST, AET);
              
              console.log(`  ✓ ${actuator.model_base}-STO: 故障开匹配成功`);
              console.log(`    - SST (${SST}) >= 开启扭矩 (${requiredOpeningTorque})`);
              console.log(`    - AET (${AET}) >= 关闭扭矩 (${requiredClosingTorque})`);
            } else {
              console.log(`  ✗ ${actuator.model_base}-STO: 故障开不匹配`);
              if (!condition1) console.log(`    - SST (${SST}) < 开启扭矩 (${requiredOpeningTorque})`);
              if (!condition2) console.log(`    - AET (${AET}) < 关闭扭矩 (${requiredClosingTorque})`);
            }
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
          let manualOverrideInfo = null;
          
          // 如果需要手动操作装置，加上价格（AT/GY系列通常是手轮）
          if (needs_manual_override && actuator.pricing && actuator.pricing.manual_override_price) {
            totalPrice += actuator.pricing.manual_override_price;
            manualOverrideInfo = {
              model: actuator.pricing.manual_override_model || '手动操作装置',
              price: actuator.pricing.manual_override_price
            };
            console.log(`  🔧 加上手动操作装置: ${manualOverrideInfo.model} = ¥${manualOverrideInfo.price}`);
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
          // 规则：基础型号 + 故障安全位置后缀(SR) + 温度代码
          let finalModelName = actuator.model_base;
          
          // 如果是单作用执行器，添加 STC 或 STO 后缀
          if (actuator.action_type === 'SR' && failSafePosition) {
            if (failSafePosition === 'Fail Close') {
              finalModelName = `${actuator.model_base}-STC`;
            } else if (failSafePosition === 'Fail Open') {
              finalModelName = `${actuator.model_base}-STO`;
            }
          }
          
          // 添加温度代码（如果不是 'No code'）
          if (temperature_code && temperature_code !== 'No code') {
            finalModelName = `${finalModelName}-${temperature_code.toUpperCase()}`;
          }
          
          console.log(`  📝 最终型号: ${finalModelName} (基础: ${actuator.model_base}, 故障位置: ${failSafePosition || 'N/A'}, 温度: ${temperature_code})`);

          finalResults.push({
            _id: actuator._id,
            model_base: actuator.model_base,
            final_model_name: finalModelName, // ⭐ 最终完整型号（含故障安全位置后缀和温度代码）
            series: actuator.series,
            mechanism: actuator.mechanism,
            body_size: actuator.body_size,
            action_type: actuator.action_type,
            spring_range: actuator.spring_range,
            fail_safe_position: failSafePosition, // ⭐ 故障安全位置
            
            // 价格信息（详细）
            price: basePrice, // 基础价格
            price_type: priceType, // 价格类型说明
            temperature_type: temperature_type, // 使用温度
            temperature_code: temperature_code, // ⭐ 温度代码
            pricing: actuator.pricing, // 完整的价格结构
            
            // 手动操作装置信息（AT/GY系列通常是手轮）
            manual_override_info: manualOverrideInfo,
            needs_manual_override: needs_manual_override,
            
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
        required_opening_torque: requiredOpeningTorque, // 开启扭矩（单作用）
        required_closing_torque: requiredClosingTorque, // 关闭扭矩（单作用）
        working_pressure,
        working_angle: actualWorkingAngle, // 固定为90度（旋转型阀门）
        mechanism,
        valve_type: actualValveType, // 阀门类型
        fail_safe_position: failSafePosition || 'Not Applicable', // ⭐ 故障安全位置
        temperature_code: temperature_code || 'No code', // ⭐ 温度代码（所有系列）
        temperature_type: mechanism === 'Rack & Pinion' ? temperature_type : 'N/A', // 使用温度（AT/GY系列）
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

