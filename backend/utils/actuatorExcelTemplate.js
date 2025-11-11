const XLSX = require('xlsx');

/**
 * 创建执行器Excel导入模板
 * 包含SF、AT、GY三个系列的示例数据
 */
async function createActuatorTemplate() {
  const workbook = XLSX.utils.book_new();
  
  // SF系列模板（拨叉式）
  const sfData = [
    {
      '型号': 'SF-DA063',
      '系列': 'SF',
      '机构类型': 'Scotch Yoke',
      '阀门类型': 'Ball Valve',
      '作用类型': 'DA',
      '本体尺寸': 'SF-063',
      '气缸尺寸': 63,
      '常温标准价': 5000,
      '低温标准价': 5500,
      '高温标准价': 6000,
      '状态': '已发布'
    }
  ];
  
  // AT系列模板（齿轮齿条）
  const atData = [
    {
      '型号': 'AT-SR52K8',
      '系列': 'AT',
      '机构类型': 'Rack & Pinion',
      '阀门类型': 'Gate Valve',
      '作用类型': 'SR',
      '弹簧范围': 'K8',
      '本体尺寸': 'AT-052',
      '常温标准价': 4000,
      '低温标准价': 4500,
      '高温标准价': 5000,
      '状态': '已发布'
    }
  ];
  
  // GY系列模板（齿轮齿条）
  const gyData = [
    {
      '型号': 'GY-DA105',
      '系列': 'GY',
      '机构类型': 'Rack & Pinion',
      '阀门类型': 'Control Valve',
      '作用类型': 'DA',
      '本体尺寸': 'GY-105',
      '常温标准价': 6000,
      '低温标准价': 6500,
      '高温标准价': 7000,
      '状态': '已发布'
    }
  ];
  
  // 创建工作表
  const sfSheet = XLSX.utils.json_to_sheet(sfData);
  const atSheet = XLSX.utils.json_to_sheet(atData);
  const gySheet = XLSX.utils.json_to_sheet(gyData);
  
  // 设置列宽
  const colWidths = [
    { wch: 15 }, // 型号
    { wch: 10 }, // 系列
    { wch: 18 }, // 机构类型
    { wch: 18 }, // 阀门类型
    { wch: 12 }, // 作用类型
    { wch: 15 }, // 本体尺寸/弹簧范围/气缸尺寸
    { wch: 12 }, // 常温标准价
    { wch: 12 }, // 低温标准价
    { wch: 12 }, // 高温标准价
    { wch: 10 }  // 状态
  ];
  
  sfSheet['!cols'] = colWidths;
  atSheet['!cols'] = colWidths;
  gySheet['!cols'] = colWidths;
  
  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(workbook, sfSheet, 'SF系列');
  XLSX.utils.book_append_sheet(workbook, atSheet, 'AT系列');
  XLSX.utils.book_append_sheet(workbook, gySheet, 'GY系列');
  
  // 添加说明工作表
  const instructions = [
    { '字段名': '型号', '说明': '执行器型号，必填，唯一', '示例': 'SF-DA063' },
    { '字段名': '系列', '说明': 'SF/AT/GY，必填', '示例': 'SF' },
    { '字段名': '机构类型', '说明': 'Scotch Yoke（拨叉式）或 Rack & Pinion（齿轮齿条）', '示例': 'Scotch Yoke' },
    { '字段名': '阀门类型', '说明': 'SF系列：Ball Valve/Butterfly Valve；AT系列：Gate Valve/Globe Valve；GY系列：Control Valve', '示例': 'Ball Valve' },
    { '字段名': '作用类型', '说明': 'DA（双作用）或 SR（单作用），必填', '示例': 'DA' },
    { '字段名': '弹簧范围', '说明': 'SR类型必填，如K8/K10', '示例': 'K8' },
    { '字段名': '本体尺寸', '说明': '本体尺寸代码', '示例': 'SF-063' },
    { '字段名': '气缸尺寸', '说明': 'SF系列专用，数字', '示例': '63' },
    { '字段名': '常温标准价', '说明': '常温价格（元）', '示例': '5000' },
    { '字段名': '低温标准价', '说明': '低温价格（元）', '示例': '5500' },
    { '字段名': '高温标准价', '说明': '高温价格（元）', '示例': '6000' },
    { '字段名': '状态', '说明': '设计中/已发布/已停产', '示例': '已发布' }
  ];
  
  const instructionSheet = XLSX.utils.json_to_sheet(instructions);
  instructionSheet['!cols'] = [
    { wch: 15 },
    { wch: 50 },
    { wch: 20 }
  ];
  
  XLSX.utils.book_append_sheet(workbook, instructionSheet, '填写说明');
  
  // 生成Excel文件buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return buffer;
}

module.exports = {
  createActuatorTemplate
};
