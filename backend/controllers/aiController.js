const axios = require('axios');

/**
 * @desc    调用OpenAI API获取BOM优化建议
 * @route   POST /api/ai/optimize-bom
 * @access  Private
 */
exports.optimizeBOM = async (req, res) => {
  try {
    const { bomData, projectInfo } = req.body;

    // 验证必需参数
    if (!bomData || !Array.isArray(bomData) || bomData.length === 0) {
      return res.status(400).json({ 
        message: 'BOM数据不能为空' 
      });
    }

    // 检查OpenAI API密钥
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        message: 'OpenAI API密钥未配置，请在.env文件中设置OPENAI_API_KEY' 
      });
    }

    // 准备发送给OpenAI的内容
    const bomSummary = bomData.map((item, index) => 
      `${index + 1}. ${item.actuator_model} - 数量: ${item.total_quantity}, 单价: ¥${item.unit_price}, 总价: ¥${item.total_price}${item.notes ? `, 备注: ${item.notes}` : ''}`
    ).join('\n');

    const totalQuantity = bomData.reduce((sum, item) => sum + (item.total_quantity || 0), 0);
    const totalPrice = bomData.reduce((sum, item) => sum + (item.total_price || 0), 0);

    // 构建提示词
    const systemPrompt = `你是一位专业的工业自动化设备采购顾问，擅长执行器选型和BOM优化。你需要分析客户的BOM清单，并提供专业的优化建议。`;

    const userPrompt = `请分析以下BOM清单，并提供优化建议：

项目信息：
- 项目编号: ${projectInfo?.projectNumber || '未提供'}
- 项目名称: ${projectInfo?.projectName || '未提供'}
- 客户: ${projectInfo?.client?.name || '未提供'}
- 行业: ${projectInfo?.industry || '未提供'}
- 应用场景: ${projectInfo?.application || '未提供'}

BOM清单（共 ${bomData.length} 个型号，总计 ${totalQuantity} 台，总价 ¥${totalPrice.toLocaleString()}）：
${bomSummary}

请从以下几个方面提供优化建议：
1. **成本优化**: 是否有可以降低成本的替代方案或批量采购建议？
2. **型号整合**: 是否有相似型号可以合并，减少库存管理复杂度？
3. **技术风险**: 是否存在过度设计或欠缺配置的情况？
4. **供应链优化**: 是否可以优化供应商选择或交货期？
5. **维护建议**: 长期维护和备件管理的建议

请以清晰的结构化格式返回建议，包括具体的行动建议和预估的优化效果。`;

    console.log('🤖 正在调用OpenAI API...');
    
    // 调用OpenAI API
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini', // 使用gpt-4o-mini作为默认模型（成本更低）
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 60000 // 60秒超时
      }
    );

    // 提取AI响应
    const aiSuggestion = openaiResponse.data.choices[0].message.content;
    const usage = openaiResponse.data.usage;

    console.log('✅ OpenAI API调用成功');
    console.log(`📊 Token使用: ${usage.total_tokens} (输入: ${usage.prompt_tokens}, 输出: ${usage.completion_tokens})`);

    // 返回结果
    res.json({
      success: true,
      data: {
        suggestion: aiSuggestion,
        usage: usage,
        model: openaiResponse.data.model,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ AI优化建议失败:', error);

    // 处理OpenAI API特定错误
    if (error.response?.data) {
      const errorData = error.response.data;
      
      // API密钥错误
      if (errorData.error?.type === 'invalid_request_error' && errorData.error?.code === 'invalid_api_key') {
        return res.status(401).json({ 
          message: 'OpenAI API密钥无效，请检查配置',
          error: errorData.error.message 
        });
      }
      
      // 配额不足
      if (errorData.error?.type === 'insufficient_quota') {
        return res.status(429).json({ 
          message: 'OpenAI API配额不足，请充值或更换API密钥',
          error: errorData.error.message 
        });
      }
      
      // 速率限制
      if (errorData.error?.type === 'rate_limit_exceeded') {
        return res.status(429).json({ 
          message: 'OpenAI API请求过于频繁，请稍后重试',
          error: errorData.error.message 
        });
      }
      
      // 其他API错误
      return res.status(error.response.status || 500).json({ 
        message: 'OpenAI API调用失败',
        error: errorData.error?.message || '未知错误'
      });
    }

    // 网络超时
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        message: 'OpenAI API请求超时，请检查网络连接或稍后重试'
      });
    }

    // 其他错误
    res.status(500).json({ 
      message: 'AI优化建议失败',
      error: error.message 
    });
  }
};

/**
 * @desc    获取AI服务状态
 * @route   GET /api/ai/status
 * @access  Private
 */
exports.getStatus = async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    res.json({
      configured: !!apiKey,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      ready: !!apiKey
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get AI status',
      error: error.message 
    });
  }
};

