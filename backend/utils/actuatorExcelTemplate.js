/**
 * 执行器Excel模板生成器
 * 生成包含Instructions、SF_Data、AT_Data、GY_Data四个工作表的统一模板
 */

const ExcelJS = require('exceljs');

/**
 * 创建执行器数据导入模板
 * @returns {Promise<Buffer>} Excel文件Buffer
 */
async function createActuatorTemplate() {
  const workbook = new ExcelJS.Workbook();
  
  // ========== 工作表1: Instructions (说明页) ==========
  const instructionsSheet = workbook.addWorksheet('Instructions', {
    properties: { tabColor: { argb: 'FF4472C4' } }
  });
  
  // 设置说明页内容
  instructionsSheet.mergeCells('A1:D1');
  instructionsSheet.getCell('A1').value = '执行器数据导入模板使用说明';
  instructionsSheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF4472C4' } };
  instructionsSheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  instructionsSheet.getRow(1).height = 30;
  
  const instructions = [
    '',
    '重要提示：',
    '1. 请勿修改任何工作表的名称（如SF_Data、AT_Data、GY_Data）或列的标题。',
    '2. 价格和扭矩值请直接填写数字，系统会自动处理单位。',
    '3. 每个系列的数据请务必填写在对应名称的工作表中。',
    '4. 上传时，系统将使用文件中的数据完全覆盖旧有数据，请确保文件包含所有需要的产品信息。',
    '',
    '数据要求：',
    '• Model（型号）: 必填，不可重复',
    '• Type（动作类型）: 必填，只能填写 SR 或 DA',
    '• Price（价格）: 必填，只能是数字',
    '',
    'SF系列特别说明：',
    '• 当Type=SR时，必须填写：SST_Nm, SET_Nm, AST_Nm, AET_Nm（四个弹簧/气缸扭矩值）',
    '• 当Type=SR时，DA_Torque_0deg_Nm 和 DA_Torque_90deg_Nm 必须为空',
    '• 当Type=DA时，必须填写：DA_Torque_0deg_Nm, DA_Torque_90deg_Nm（两个双作用扭矩值）',
    '• 当Type=DA时，SST_Nm, SET_Nm, AST_Nm, AET_Nm 必须为空',
    '',
    'AT/GY系列特别说明：',
    '• Output_Torque_Nm（输出扭矩）为必填项',
    '',
    '材质说明：',
    '• SF系列：材质字段将保持为空',
    '• AT系列：系统自动设置为"铝合金+硬质氧化"',
    '• GY系列：系统自动设置为"不锈钢"',
    '',
    '如有问题，请联系系统管理员。'
  ];
  
  instructions.forEach((text, index) => {
    const row = index + 2;
    instructionsSheet.getCell(`A${row}`).value = text;
    if (text.startsWith('重要提示') || text.startsWith('数据要求') || 
        text.startsWith('SF系列') || text.startsWith('AT/GY系列') || 
        text.startsWith('材质说明')) {
      instructionsSheet.getCell(`A${row}`).font = { bold: true, size: 12, color: { argb: 'FF0070C0' } };
    }
  });
  
  instructionsSheet.getColumn('A').width = 100;
  
  // ========== 工作表2: SF_Data (SF系列数据) ==========
  const sfSheet = workbook.addWorksheet('SF_Data', {
    properties: { tabColor: { argb: 'FF70AD47' } }
  });
  
  // SF系列列定义（10列）
  const sfColumns = [
    { header: 'Model', key: 'model', width: 20 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Price', key: 'price', width: 15 },
    { header: 'Air_Pressure_bar', key: 'air_pressure', width: 18 },
    { header: 'SST_Nm', key: 'sst_nm', width: 15 },
    { header: 'SET_Nm', key: 'set_nm', width: 15 },
    { header: 'AST_Nm', key: 'ast_nm', width: 15 },
    { header: 'AET_Nm', key: 'aet_nm', width: 15 },
    { header: 'DA_Torque_0deg_Nm', key: 'da_torque_0', width: 20 },
    { header: 'DA_Torque_90deg_Nm', key: 'da_torque_90', width: 20 }
  ];
  
  sfSheet.columns = sfColumns;
  
  // 设置表头样式
  const sfHeaderRow = sfSheet.getRow(1);
  sfHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sfHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF70AD47' }
  };
  sfHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
  sfHeaderRow.height = 25;
  
  // 添加数据验证
  // Type列只能是SR或DA
  sfSheet.dataValidations.add('B2:B1000', {
    type: 'list',
    allowBlank: false,
    formulae: ['"SR,DA"'],
    showErrorMessage: true,
    errorTitle: '输入错误',
    error: '类型只能是SR或DA'
  });
  
  // 添加示例数据（可选）
  sfSheet.addRow({
    model: 'SF14-300DA',
    type: 'DA',
    price: 5200,
    air_pressure: 6,
    sst_nm: '',
    set_nm: '',
    ast_nm: '',
    aet_nm: '',
    da_torque_0: 309,
    da_torque_90: 417
  });
  
  sfSheet.addRow({
    model: 'SF14-300SR3',
    type: 'SR',
    price: 5800,
    air_pressure: 6,
    sst_nm: 150,
    set_nm: 300,
    ast_nm: 250,
    aet_nm: 350,
    da_torque_0: '',
    da_torque_90: ''
  });
  
  // ========== 工作表3: AT_Data (AT系列数据) ==========
  const atSheet = workbook.addWorksheet('AT_Data', {
    properties: { tabColor: { argb: 'FFFFC000' } }
  });
  
  // AT系列列定义（4列）
  const atColumns = [
    { header: 'Model', key: 'model', width: 20 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Price', key: 'price', width: 15 },
    { header: 'Output_Torque_Nm', key: 'output_torque', width: 20 }
  ];
  
  atSheet.columns = atColumns;
  
  // 设置表头样式
  const atHeaderRow = atSheet.getRow(1);
  atHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  atHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFC000' }
  };
  atHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
  atHeaderRow.height = 25;
  
  // Type列验证
  atSheet.dataValidations.add('B2:B1000', {
    type: 'list',
    allowBlank: false,
    formulae: ['"SR,DA"'],
    showErrorMessage: true,
    errorTitle: '输入错误',
    error: '类型只能是SR或DA'
  });
  
  // 添加示例数据
  atSheet.addRow({
    model: 'AT-050DA',
    type: 'DA',
    price: 3200,
    output_torque: 50
  });
  
  atSheet.addRow({
    model: 'AT-100SR',
    type: 'SR',
    price: 3800,
    output_torque: 100
  });
  
  // ========== 工作表4: GY_Data (GY系列数据) ==========
  const gySheet = workbook.addWorksheet('GY_Data', {
    properties: { tabColor: { argb: 'FFED7D31' } }
  });
  
  // GY系列列定义（4列，与AT相同）
  const gyColumns = [
    { header: 'Model', key: 'model', width: 20 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Price', key: 'price', width: 15 },
    { header: 'Output_Torque_Nm', key: 'output_torque', width: 20 }
  ];
  
  gySheet.columns = gyColumns;
  
  // 设置表头样式
  const gyHeaderRow = gySheet.getRow(1);
  gyHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  gyHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFED7D31' }
  };
  gyHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
  gyHeaderRow.height = 25;
  
  // Type列验证
  gySheet.dataValidations.add('B2:B1000', {
    type: 'list',
    allowBlank: false,
    formulae: ['"SR,DA"'],
    showErrorMessage: true,
    errorTitle: '输入错误',
    error: '类型只能是SR或DA'
  });
  
  // 添加示例数据
  gySheet.addRow({
    model: 'GY-080DA',
    type: 'DA',
    price: 4200,
    output_torque: 80
  });
  
  gySheet.addRow({
    model: 'GY-120SR',
    type: 'SR',
    price: 4800,
    output_torque: 120
  });
  
  // 生成Excel文件Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = {
  createActuatorTemplate
};

