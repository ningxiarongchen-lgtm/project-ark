/**
 * 文档上传和智能解析控制器
 */

const { parseDocument } = require('../services/documentParser');
const { extractParamsWithAI, extractTableData, extractParamsFromTable } = require('../services/aiExtractor');
const path = require('path');
const fs = require('fs');

// @desc    上传并解析文档
// @route   POST /api/document/upload
// @access  Private
exports.uploadAndParse = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传文件'
      });
    }
    
    const file = req.file;
    const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
    const filePath = file.path;
    
    console.log(`📄 开始解析文件: ${file.originalname} (${fileExt})`);
    
    // 解析文档
    const parseResult = await parseDocument(filePath, fileExt);
    
    if (!parseResult.success) {
      // 删除临时文件
      fs.unlinkSync(filePath);
      
      return res.status(400).json({
        success: false,
        message: '文档解析失败',
        error: parseResult.error
      });
    }
    
    console.log(`✅ 文档解析成功，提取到 ${parseResult.count} 条参数`);
    
    // 尝试使用AI提取（如果配置了）
    let finalParams = parseResult.params;
    let extractMethod = 'Rules';
    
    if (process.env.OPENAI_API_KEY) {
      console.log('🤖 使用AI提取参数...');
      const aiResult = await extractParamsWithAI(parseResult.text);
      if (aiResult.success && aiResult.params.length > 0) {
        finalParams = aiResult.params;
        extractMethod = 'AI';
        console.log(`✅ AI提取成功，获得 ${aiResult.count} 条参数`);
      }
    }
    
    // 尝试表格识别
    const tables = extractTableData(parseResult.text);
    if (tables.length > 0) {
      console.log(`📊 识别到 ${tables.length} 个表格`);
      for (const table of tables) {
        const tableParams = extractParamsFromTable(table);
        if (tableParams.length > finalParams.length) {
          finalParams = tableParams;
          extractMethod = 'Table';
          console.log(`✅ 从表格提取到 ${tableParams.length} 条参数`);
        }
      }
    }
    
    // 删除临时文件
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: `成功提取 ${finalParams.length} 条选型参数`,
      data: {
        fileName: file.originalname,
        fileType: fileExt,
        extractMethod: extractMethod,
        text: parseResult.text.substring(0, 500) + '...', // 只返回前500字符
        params: finalParams,
        count: finalParams.length
      }
    });
    
  } catch (error) {
    console.error('文档上传解析失败:', error);
    
    // 清理临时文件
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // 忽略删除错误
      }
    }
    
    res.status(500).json({
      success: false,
      message: '文档处理失败',
      error: error.message
    });
  }
};

// @desc    批量选型（从解析的参数）
// @route   POST /api/document/batch-select
// @access  Private
exports.batchSelectFromParams = async (req, res) => {
  try {
    const { params } = req.body;
    
    if (!Array.isArray(params) || params.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供选型参数'
      });
    }
    
    const Actuator = require('../models/Actuator');
    const results = [];
    const errors = [];
    
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      
      try {
        // 计算需求扭矩
        const safetyFactor = param.safety_factor || 1.3;
        const requiredTorque = param.valve_torque * safetyFactor;
        const workingPressure = param.working_pressure || 0.5;
        const valveType = param.valve_type || 'Ball Valve';
        const workingAngle = param.working_angle || 90;
        
        // 确定机构类型和轭架类型
        let mechanism = 'Scotch Yoke'; // 默认拨叉式
        let yokeType = valveType === 'Ball Valve' ? 'symmetric' : 'canted';
        
        // 构建查询
        const mechanismValues = ['Scotch Yoke', '拨叉式'];
        const valveTypeValues = valveType === 'Ball Valve' ? 
          ['Ball Valve', '球阀'] : ['Butterfly Valve', '蝶阀'];
        
        let query = {
          mechanism: { $in: mechanismValues },
          valve_type: { $in: valveTypeValues },
          status: '已发布'
        };
        
        const candidates = await Actuator.find(query).lean();
        
        // 选型逻辑
        const pressureKey = String(workingPressure).replace('.', '_');
        const torqueKey = `${pressureKey}_${workingAngle}`;
        
        let bestMatch = null;
        let bestTorque = 0;
        
        for (const actuator of candidates) {
          const torqueData = actuator.torque_data?.[yokeType] || 
                           actuator.torque_data?.[yokeType === 'symmetric' ? 'symmetric' : 'canted'];
          
          if (!torqueData) continue;
          
          const actualTorque = torqueData[torqueKey];
          
          if (actualTorque && actualTorque >= requiredTorque) {
            if (!bestMatch || actualTorque < bestTorque) {
              bestMatch = actuator;
              bestTorque = actualTorque;
            }
          }
        }
        
        if (bestMatch) {
          results.push({
            index: i,
            tag_number: param.tag_number || `Item ${i + 1}`,
            success: true,
            input: {
              valve_torque: param.valve_torque,
              valve_type: valveType,
              working_pressure: workingPressure,
              safety_factor: safetyFactor
            },
            output: {
              model: bestMatch.model_base,
              series: bestMatch.series,
              actual_torque: bestTorque,
              price: bestMatch.base_price_normal
            }
          });
        } else {
          errors.push({
            index: i,
            tag_number: param.tag_number || `Item ${i + 1}`,
            error: '未找到满足要求的执行器',
            required_torque: requiredTorque
          });
        }
        
      } catch (error) {
        errors.push({
          index: i,
          tag_number: param.tag_number || `Item ${i + 1}`,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `批量选型完成，成功 ${results.length} 个，失败 ${errors.length} 个`,
      data: {
        results: results,
        errors: errors,
        summary: {
          total: params.length,
          success: results.length,
          failed: errors.length
        }
      }
    });
    
  } catch (error) {
    console.error('批量选型失败:', error);
    res.status(500).json({
      success: false,
      message: '批量选型失败',
      error: error.message
    });
  }
};

module.exports = exports;
