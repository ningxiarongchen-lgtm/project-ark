/**
 * AI智能参数提取服务
 * 使用OpenAI GPT进行高精度参数提取
 */

const OpenAI = require('openai');

// 初始化OpenAI客户端（需要配置API Key）
let openai = null;

function initializeOpenAI(apiKey) {
  if (apiKey) {
    openai = new OpenAI({
      apiKey: apiKey
    });
  }
}

/**
 * 使用AI提取选型参数
 */
async function extractParamsWithAI(text) {
  if (!openai) {
    // 如果没有配置OpenAI，使用规则提取
    return extractParamsWithRules(text);
  }
  
  try {
    const prompt = `
你是一个专业的执行器选型工程师。请从以下技术文档中提取阀门执行器选型参数。

文档内容：
${text}

请提取以下信息（如果文档中有的话）：
1. 位号（tag_number）：如 XV-001, FV-002 等
2. 阀门类型（valve_type）：球阀(Ball Valve) 或 蝶阀(Butterfly Valve)
3. 阀门扭矩（valve_torque）：单位 N·m
4. 工作压力（working_pressure）：单位 MPa
5. 安全系数（safety_factor）：通常为 1.2-1.5
6. 工作角度（working_angle）：通常为 0°, 45°, 90°
7. 故障安全位置（fail_safe_position）：故障开(Fail Open) 或 故障关(Fail Close)

请以JSON数组格式返回，每个阀门一个对象。如果某个参数没有找到，请省略该字段。

示例格式：
[
  {
    "tag_number": "XV-001",
    "valve_type": "Ball Valve",
    "valve_torque": 500,
    "working_pressure": 0.5,
    "safety_factor": 1.3,
    "working_angle": 90
  }
]

只返回JSON数组，不要其他说明文字。
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "你是一个专业的执行器选型工程师，擅长从技术文档中提取结构化数据。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // 低温度，更确定性的输出
      max_tokens: 2000
    });
    
    const content = response.choices[0].message.content.trim();
    
    // 提取JSON部分
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0].trim();
    }
    
    const params = JSON.parse(jsonStr);
    
    return {
      success: true,
      params: params,
      count: params.length,
      method: 'AI'
    };
    
  } catch (error) {
    console.error('AI提取失败，使用规则提取:', error.message);
    // AI失败时回退到规则提取
    return extractParamsWithRules(text);
  }
}

/**
 * 使用规则提取参数（备用方案）
 */
function extractParamsWithRules(text) {
  const params = [];
  const lines = text.split('\n');
  
  let currentParam = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // 位号
    const tagMatch = trimmed.match(/([A-Z]{1,3}[-_]?\d{3,4}[A-Z]?)/i);
    if (tagMatch && !currentParam.tag_number) {
      currentParam.tag_number = tagMatch[1];
    }
    
    // 扭矩
    const torqueMatch = trimmed.match(/(\d+\.?\d*)\s*(N·m|Nm|牛米)/i);
    if (torqueMatch) {
      currentParam.valve_torque = parseFloat(torqueMatch[1]);
    }
    
    // 压力
    const pressureMatch = trimmed.match(/(\d+\.?\d*)\s*(MPa|mpa)/i);
    if (pressureMatch) {
      currentParam.working_pressure = parseFloat(pressureMatch[1]);
    }
    
    // 阀门类型
    if (trimmed.match(/(球阀|ball\s*valve)/i)) {
      currentParam.valve_type = 'Ball Valve';
    } else if (trimmed.match(/(蝶阀|butterfly\s*valve)/i)) {
      currentParam.valve_type = 'Butterfly Valve';
    }
    
    // 如果有位号和扭矩，保存当前参数
    if (currentParam.tag_number && currentParam.valve_torque) {
      // 设置默认值
      if (!currentParam.working_pressure) {
        currentParam.working_pressure = 0.5;
      }
      if (!currentParam.valve_type) {
        currentParam.valve_type = 'Ball Valve';
      }
      if (!currentParam.safety_factor) {
        currentParam.safety_factor = 1.3;
      }
      
      params.push({...currentParam});
      currentParam = {};
    }
  }
  
  return {
    success: true,
    params: params,
    count: params.length,
    method: 'Rules'
  };
}

/**
 * 智能表格识别
 * 识别文档中的表格结构
 */
function extractTableData(text) {
  const tables = [];
  const lines = text.split('\n');
  
  let inTable = false;
  let currentTable = [];
  
  for (const line of lines) {
    // 检测表格分隔符
    if (line.match(/[-─│┼┤├┬┴]+/)) {
      inTable = true;
      continue;
    }
    
    // 检测表格行（包含多个单元格）
    if (line.includes('|') || line.includes('│')) {
      const cells = line.split(/[|│]/).map(c => c.trim()).filter(c => c);
      if (cells.length > 1) {
        currentTable.push(cells);
        inTable = true;
      }
    } else if (inTable && currentTable.length > 0) {
      // 表格结束
      tables.push(currentTable);
      currentTable = [];
      inTable = false;
    }
  }
  
  // 保存最后一个表格
  if (currentTable.length > 0) {
    tables.push(currentTable);
  }
  
  return tables;
}

/**
 * 从表格中提取选型参数
 */
function extractParamsFromTable(table) {
  if (table.length < 2) return [];
  
  const headers = table[0].map(h => h.toLowerCase());
  const params = [];
  
  // 查找列索引
  const tagIndex = headers.findIndex(h => 
    h.includes('位号') || h.includes('tag') || h.includes('number')
  );
  const torqueIndex = headers.findIndex(h => 
    h.includes('扭矩') || h.includes('torque')
  );
  const pressureIndex = headers.findIndex(h => 
    h.includes('压力') || h.includes('pressure')
  );
  const typeIndex = headers.findIndex(h => 
    h.includes('类型') || h.includes('type') || h.includes('阀门')
  );
  
  // 提取数据行
  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    const param = {};
    
    if (tagIndex >= 0 && row[tagIndex]) {
      param.tag_number = row[tagIndex];
    }
    
    if (torqueIndex >= 0 && row[torqueIndex]) {
      const torqueMatch = row[torqueIndex].match(/(\d+\.?\d*)/);
      if (torqueMatch) {
        param.valve_torque = parseFloat(torqueMatch[1]);
      }
    }
    
    if (pressureIndex >= 0 && row[pressureIndex]) {
      const pressureMatch = row[pressureIndex].match(/(\d+\.?\d*)/);
      if (pressureMatch) {
        param.working_pressure = parseFloat(pressureMatch[1]);
      }
    }
    
    if (typeIndex >= 0 && row[typeIndex]) {
      if (row[typeIndex].match(/(球阀|ball)/i)) {
        param.valve_type = 'Ball Valve';
      } else if (row[typeIndex].match(/(蝶阀|butterfly)/i)) {
        param.valve_type = 'Butterfly Valve';
      }
    }
    
    // 设置默认值
    if (!param.working_pressure) param.working_pressure = 0.5;
    if (!param.valve_type) param.valve_type = 'Ball Valve';
    if (!param.safety_factor) param.safety_factor = 1.3;
    
    if (param.tag_number && param.valve_torque) {
      params.push(param);
    }
  }
  
  return params;
}

module.exports = {
  initializeOpenAI,
  extractParamsWithAI,
  extractParamsWithRules,
  extractTableData,
  extractParamsFromTable
};
