/**
 * 文档智能解析服务
 * 支持PDF、图片、Excel等多种格式
 */

const fs = require('fs');
const path = require('path');

// 动态加载依赖，避免在没有安装时报错
let pdf, Tesseract;
try {
  pdf = require('pdf-parse');
} catch (e) {
  console.warn('⚠️  pdf-parse未安装，PDF解析功能将不可用');
}
try {
  Tesseract = require('tesseract.js');
} catch (e) {
  console.warn('⚠️  tesseract.js未安装，OCR功能将不可用');
}

/**
 * 从PDF中提取文本
 */
async function extractTextFromPDF(filePath) {
  if (!pdf) {
    return {
      success: false,
      error: 'PDF解析功能未启用，请安装pdf-parse依赖'
    };
  }
  
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    return {
      success: true,
      text: data.text,
      pages: data.numpages,
      info: data.info
    };
  } catch (error) {
    console.error('PDF解析失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 从图片中提取文本（OCR）
 */
async function extractTextFromImage(filePath) {
  if (!Tesseract) {
    return {
      success: false,
      error: 'OCR功能未启用，请安装tesseract.js依赖'
    };
  }
  
  try {
    const result = await Tesseract.recognize(
      filePath,
      'chi_sim+eng', // 支持中英文
      {
        logger: m => console.log(m) // 进度日志
      }
    );
    
    return {
      success: true,
      text: result.data.text,
      confidence: result.data.confidence
    };
  } catch (error) {
    console.error('图片OCR失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 智能提取选型参数
 * 使用正则表达式和规则匹配
 */
function extractSelectionParams(text) {
  const params = [];
  
  // 按行分割文本
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // 尝试提取参数
    const param = extractParamFromLine(line);
    if (param) {
      params.push(param);
    }
  }
  
  return params;
}

/**
 * 从单行文本中提取参数
 */
function extractParamFromLine(line) {
  // 位号匹配模式
  const tagPatterns = [
    /([A-Z]{1,3}[-_]?\d{3,4}[A-Z]?)/i,  // XV-001, FV001, etc.
    /(阀门|位号)[：:]\s*([A-Z0-9-_]+)/i
  ];
  
  // 扭矩匹配模式
  const torquePatterns = [
    /(\d+\.?\d*)\s*(N·m|Nm|牛米|扭矩)/i,
    /(扭矩|torque)[：:]\s*(\d+\.?\d*)/i
  ];
  
  // 压力匹配模式
  const pressurePatterns = [
    /(\d+\.?\d*)\s*(MPa|mpa|兆帕)/i,
    /(压力|pressure)[：:]\s*(\d+\.?\d*)/i
  ];
  
  // 阀门类型匹配
  const valveTypePatterns = [
    /(球阀|ball\s*valve)/i,
    /(蝶阀|butterfly\s*valve)/i
  ];
  
  let tag = null;
  let torque = null;
  let pressure = null;
  let valveType = null;
  
  // 提取位号
  for (const pattern of tagPatterns) {
    const match = line.match(pattern);
    if (match) {
      tag = match[1] || match[2];
      break;
    }
  }
  
  // 提取扭矩
  for (const pattern of torquePatterns) {
    const match = line.match(pattern);
    if (match) {
      torque = parseFloat(match[1] || match[2]);
      break;
    }
  }
  
  // 提取压力
  for (const pattern of pressurePatterns) {
    const match = line.match(pattern);
    if (match) {
      pressure = parseFloat(match[1] || match[2]);
      break;
    }
  }
  
  // 提取阀门类型
  for (const pattern of valveTypePatterns) {
    const match = line.match(pattern);
    if (match) {
      if (match[0].includes('球') || match[0].toLowerCase().includes('ball')) {
        valveType = 'Ball Valve';
      } else if (match[0].includes('蝶') || match[0].toLowerCase().includes('butterfly')) {
        valveType = 'Butterfly Valve';
      }
      break;
    }
  }
  
  // 如果至少有位号和扭矩，则返回参数
  if (tag && torque) {
    return {
      tag_number: tag,
      valve_torque: torque,
      working_pressure: pressure || 0.5, // 默认0.5MPa
      valve_type: valveType || 'Ball Valve', // 默认球阀
      safety_factor: 1.3 // 默认安全系数
    };
  }
  
  return null;
}

/**
 * 主解析函数
 */
async function parseDocument(filePath, fileType) {
  let extractResult;
  
  // 根据文件类型选择解析方法
  if (fileType === 'pdf') {
    extractResult = await extractTextFromPDF(filePath);
  } else if (['jpg', 'jpeg', 'png', 'bmp', 'tiff'].includes(fileType)) {
    extractResult = await extractTextFromImage(filePath);
  } else {
    return {
      success: false,
      error: '不支持的文件类型'
    };
  }
  
  if (!extractResult.success) {
    return extractResult;
  }
  
  // 提取选型参数
  const params = extractSelectionParams(extractResult.text);
  
  return {
    success: true,
    text: extractResult.text,
    params: params,
    count: params.length
  };
}

module.exports = {
  parseDocument,
  extractTextFromPDF,
  extractTextFromImage,
  extractSelectionParams
};
