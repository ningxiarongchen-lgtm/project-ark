import jsPDF from 'jspdf'
import 'jspdf-autotable'

// ==================== 温度代码映射表 ====================
const TEMPERATURE_CODE_MAP = {
  'No code': { description: '常温 Normal', range: '-20~80°C' },
  'T1': { description: '低温 Low T1', range: '-40~80°C' },
  'T2': { description: '低温 Low T2', range: '-50~80°C' },
  'T3': { description: '低温 Low T3', range: '-60~80°C' },
  'M': { description: '高温 High Temp', range: '-20~120°C' }
}

/**
 * 获取温度代码的详细信息
 * @param {string} code - 温度代码
 * @returns {object} - 包含 description 和 range 的对象
 */
const getTemperatureInfo = (code) => {
  return TEMPERATURE_CODE_MAP[code] || TEMPERATURE_CODE_MAP['No code']
}

export const generateQuotePDF = (quote) => {
  const doc = new jsPDF()
  
  // Company header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('C-MAX', 20, 20)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('SF-Series Pneumatic Actuator Systems', 20, 28)
  
  // Quote title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('QUOTATION', 20, 45)
  
  // Quote information
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const quoteInfo = [
    ['Quote Number:', quote.quoteNumber],
    ['Version:', `v${quote.version}`],
    ['Date Issued:', new Date(quote.issuedDate).toLocaleDateString()],
    ['Valid Until:', new Date(quote.terms.validUntil).toLocaleDateString()],
    ['Project:', `${quote.project.projectNumber} - ${quote.project.projectName}`],
  ]
  
  let yPos = 55
  quoteInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 70, yPos)
    yPos += 7
  })
  
  // Client information
  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO:', 120, 55)
  doc.setFont('helvetica', 'normal')
  
  yPos = 62
  const clientInfo = [
    quote.project.client.name,
    quote.project.client.company,
    quote.project.client.email,
    quote.project.client.phone,
  ].filter(Boolean)
  
  clientInfo.forEach((info) => {
    doc.text(info, 120, yPos)
    yPos += 7
  })
  
  // Items table
  const tableStartY = Math.max(yPos, 95) + 5
  
  const tableData = quote.items.map((item) => [
    item.description,
    item.quantity,
    `${quote.pricing.currency} ${item.unitPrice.toLocaleString()}`,
    item.discount ? `${item.discount}%` : '-',
    `${quote.pricing.currency} ${item.netPrice.toLocaleString()}`,
    `${quote.pricing.currency} ${item.lineTotal.toLocaleString()}`,
  ])
  
  doc.autoTable({
    startY: tableStartY,
    head: [['Description', 'Qty', 'Unit Price', 'Discount', 'Net Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [24, 144, 255] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
    },
  })
  
  // Pricing summary
  const finalY = doc.lastAutoTable.finalY + 10
  
  const summaryX = 120
  let summaryY = finalY
  
  const summaryItems = [
    ['Subtotal:', `${quote.pricing.currency} ${quote.pricing.subtotal.toLocaleString()}`],
    [`Tax (${quote.pricing.tax.rate}%):`, `${quote.pricing.currency} ${quote.pricing.tax.amount.toLocaleString()}`],
    ['Shipping:', `${quote.pricing.currency} ${quote.pricing.shipping.cost.toLocaleString()}`],
  ]
  
  if (quote.pricing.discount > 0) {
    summaryItems.push([
      'Discount:',
      `-${quote.pricing.currency} ${quote.pricing.discount.toLocaleString()}`,
    ])
  }
  
  summaryItems.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal')
    doc.text(label, summaryX, summaryY)
    doc.text(value, 190, summaryY, { align: 'right' })
    summaryY += 7
  })
  
  // Total
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('TOTAL:', summaryX, summaryY + 3)
  doc.text(
    `${quote.pricing.currency} ${quote.pricing.total.toLocaleString()}`,
    190,
    summaryY + 3,
    { align: 'right' }
  )
  
  // Terms and conditions
  const termsY = summaryY + 15
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('TERMS & CONDITIONS', 20, termsY)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  const terms = [
    `Payment Terms: ${quote.terms.paymentTerms}`,
    `Delivery Terms: ${quote.terms.deliveryTerms || 'As agreed'}`,
    `Warranty: ${quote.terms.warranty}`,
  ]
  
  let termsYPos = termsY + 7
  terms.forEach((term) => {
    doc.text(term, 20, termsYPos)
    termsYPos += 5
  })
  
  // External notes
  if (quote.externalNotes) {
    termsYPos += 5
    doc.setFont('helvetica', 'bold')
    doc.text('Notes:', 20, termsYPos)
    doc.setFont('helvetica', 'normal')
    
    const splitNotes = doc.splitTextToSize(quote.externalNotes, 170)
    doc.text(splitNotes, 20, termsYPos + 5)
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(
    'Thank you for your business!',
    doc.internal.pageSize.width / 2,
    pageHeight - 20,
    { align: 'center' }
  )
  
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Prepared by: ${quote.preparedBy.name} | Email: ${quote.preparedBy.email}`,
    doc.internal.pageSize.width / 2,
    pageHeight - 15,
    { align: 'center' }
  )
  
  // Save the PDF
  doc.save(`Quote-${quote.quoteNumber}.pdf`)
}

export const generateDatasheetPDF = (product) => {
  const doc = new jsPDF()
  
  // Company header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('C-MAX', 20, 20)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('SF-Series Pneumatic Actuator Systems', 20, 28)
  
  // Product title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('TECHNICAL DATASHEET', 20, 45)
  
  doc.setFontSize(14)
  doc.text(product.modelNumber, 20, 55)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(product.description, 20, 62)
  
  // Specifications table
  const specs = [
    ['Series', product.series],
    ['Category', product.category],
    ['Torque', `${product.specifications.torque.value} Nm (${product.specifications.torque.min}-${product.specifications.torque.max} Nm)`],
    ['Operating Pressure', `${product.specifications.pressure.operating} bar`],
    ['Pressure Range', `${product.specifications.pressure.min}-${product.specifications.pressure.max} bar`],
    ['Rotation', product.specifications.rotation],
    ['Temperature Range', `${product.specifications.temperature.min}°C to ${product.specifications.temperature.max}°C`],
    ['Port Size', product.specifications.portSize],
    ['Mounting Type', product.specifications.mountingType],
    ['Dimensions (L×W×H)', `${product.specifications.dimensions.length}×${product.specifications.dimensions.width}×${product.specifications.dimensions.height} mm`],
    ['Weight', `${product.specifications.dimensions.weight} kg`],
    ['Body Material', product.specifications.materials.body],
    ['Piston Material', product.specifications.materials.piston],
    ['Seal Material', product.specifications.materials.seal],
    ['Cycle Life', `${product.specifications.cycleLife.toLocaleString()} cycles`],
  ]
  
  doc.autoTable({
    startY: 75,
    head: [['Specification', 'Value']],
    body: specs,
    theme: 'grid',
    headStyles: { fillColor: [24, 144, 255] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 110 },
    },
  })
  
  // Pricing
  const finalY = doc.lastAutoTable.finalY + 10
  
  doc.setFont('helvetica', 'bold')
  doc.text('PRICING INFORMATION', 20, finalY)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Base Price: ${product.pricing.currency} ${product.pricing.basePrice.toLocaleString()}`,
    20,
    finalY + 7
  )
  
  // Availability
  doc.setFont('helvetica', 'bold')
  doc.text('AVAILABILITY', 20, finalY + 20)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Stock Status: ${product.availability.inStock ? 'In Stock' : 'Made to Order'}`,
    20,
    finalY + 27
  )
  doc.text(`Lead Time: ${product.availability.leadTime} days`, 20, finalY + 34)
  
  // Footer
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(
    `Document generated on ${new Date().toLocaleDateString()}`,
    doc.internal.pageSize.width / 2,
    pageHeight - 15,
    { align: 'center' }
  )
  
  // Save the PDF
  doc.save(`Datasheet-${product.modelNumber}.pdf`)
}

/**
 * 生成选型技术规格书 PDF
 * @param {Object} selection - 选型记录对象
 * @param {Object} project - 项目对象
 */
export const generateSelectionSpecPDF = (selection, project) => {
  const doc = new jsPDF()
  
  // ==================== 页眉 ====================
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('C-MAX', 20, 20)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('执行器选型技术规格书', 20, 28)
  doc.text('Actuator Selection Technical Specification', 20, 34)
  
  // ==================== 标题 ====================
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('TECHNICAL SPECIFICATION', 20, 50)
  
  // ==================== 项目信息 ====================
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('PROJECT INFORMATION', 20, 62)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  let yPos = 70
  const projectInfo = [
    ['Project Number:', project?.project_number || '-'],
    ['Project Name:', project?.project_name || '-'],
    ['Client:', project?.client_name || '-'],
    ['Tag Number:', selection.tag_number || '-'],
    ['Date:', new Date().toLocaleDateString()],
  ]
  
  projectInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value), 70, yPos)
    yPos += 6
  })
  
  // ==================== 阀门参数 (核心新增部分) ====================
  yPos += 5
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('VALVE PARAMETERS', 20, yPos)
  
  yPos += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const inputParams = selection.input_params || {}
  
  const valveParams = [
    ['Valve Type:', inputParams.valve_type || '-'],
    ['Valve Size:', inputParams.valve_size || '-'],
    ['Flange Size:', inputParams.flange_size || '-'],
    ['Mechanism:', inputParams.mechanism || '-'],
  ]
  
  valveParams.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value), 70, yPos)
    yPos += 6
  })
  
  // ==================== 温度信息 (如果有温度代码) ====================
  const tempCode = selection.selected_actuator?.temperature_code || inputParams.temperature_code
  if (tempCode && tempCode !== 'No code') {
    const tempInfo = getTemperatureInfo(tempCode)
    doc.setFont('helvetica', 'bold')
    doc.text('Temperature:', 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(`${tempInfo.range} (Code: ${tempCode})`, 70, yPos)
    yPos += 6
  }
  
  // ==================== 选型参数 ====================
  yPos += 5
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('SELECTION PARAMETERS', 20, yPos)
  
  yPos += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const selectionParams = [
    ['Required Torque:', `${inputParams.required_torque || inputParams.valve_torque || '-'} N·m`],
    ['Safety Factor:', inputParams.safety_factor || inputParams.safetyFactor || '1.3'],
    ['Working Pressure:', `${inputParams.working_pressure || '-'} MPa`],
    ['Working Angle:', `${inputParams.working_angle || inputParams.max_rotation_angle || '-'}°`],
    ['Manual Override:', inputParams.needs_manual_override ? 'Required' : 'Not Required'],
  ]
  
  selectionParams.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value), 70, yPos)
    yPos += 6
  })
  
  // ==================== 推荐执行器 ====================
  yPos += 5
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('RECOMMENDED ACTUATOR', 20, yPos)
  
  yPos += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const actuator = selection.selected_actuator || {}
  
  const actuatorInfo = [
    ['Model:', actuator.final_model_name || actuator.recommended_model || actuator.model_base || '-'],
    ['Series:', actuator.series || '-'],
    ['Body Size:', actuator.body_size || '-'],
    ['Action Type:', actuator.action_type || '-'],
    ['Yoke Type:', actuator.yoke_type || '-'],
    ['Actual Torque:', `${actuator.actual_torque || '-'} N·m`],
    ['Torque Margin:', actuator.torque_margin ? `${actuator.torque_margin}%` : '-'],
    ['Unit Price:', actuator.price ? `¥${actuator.price.toLocaleString()}` : '-'],
  ]
  
  actuatorInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value), 70, yPos)
    yPos += 6
  })
  
  // ==================== 手动操作装置 (如果有) ====================
  if (selection.selected_override) {
    yPos += 5
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('MANUAL OVERRIDE', 20, yPos)
    
    yPos += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    const override = selection.selected_override
    const overrideInfo = [
      ['Model:', override.model || '-'],
      ['Unit Price:', override.price ? `¥${override.price.toLocaleString()}` : '-'],
    ]
    
    overrideInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold')
      doc.text(label, 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(value), 70, yPos)
      yPos += 6
    })
  }
  
  // ==================== 配件清单 (如果有) ====================
  if (selection.selected_accessories && selection.selected_accessories.length > 0) {
    yPos += 5
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('ACCESSORY LIST / 附件清单', 20, yPos)
    
    yPos += 8
    
    const accessoryData = selection.selected_accessories.map((acc, index) => [
      index + 1,
      acc.name || '-',
      acc.category || '-',
      acc.quantity || 1,
      acc.unit_price ? `¥${acc.unit_price.toLocaleString()}` : '-',
      acc.total_price ? `¥${acc.total_price.toLocaleString()}` : '-',
    ])
    
    doc.autoTable({
      startY: yPos,
      head: [['No.', 'Name / 名称', 'Category / 类别', 'Qty', 'Unit Price / 单价', 'Total / 总价']],
      body: accessoryData,
      theme: 'grid',
      headStyles: { fillColor: [24, 144, 255], fontSize: 9, halign: 'center' },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 35 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 28, halign: 'right' },
      },
    })
    
    yPos = doc.lastAutoTable.finalY + 10
  }
  
  // ==================== 总价 ====================
  if (selection.total_price) {
    yPos += 5
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL PRICE:', 120, yPos)
    doc.text(`¥${selection.total_price.toLocaleString()}`, 190, yPos, { align: 'right' })
  }
  
  // ==================== 备注 ====================
  if (selection.notes) {
    yPos += 10
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('NOTES', 20, yPos)
    
    yPos += 7
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const splitNotes = doc.splitTextToSize(selection.notes, 170)
    doc.text(splitNotes, 20, yPos)
  }
  
  // ==================== 页脚 ====================
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    doc.internal.pageSize.width / 2,
    pageHeight - 15,
    { align: 'center' }
  )
  
  // ==================== 保存 PDF ====================
  const filename = `Selection-Spec-${selection.tag_number || Date.now()}.pdf`
  doc.save(filename)
  
  return filename
}

/**
 * 生成选型报价单 PDF
 * @param {Object} selection - 选型记录对象（可选，用于单个选型）
 * @param {Object} project - 项目对象（必需）
 * 
 * 逻辑：
 * 1. 如果项目有 optimized_bill_of_materials，优先使用优化后的 BOM
 * 2. 否则，使用传入的单个 selection 记录（向后兼容）
 */
export const generateSelectionQuotePDF = (selection, project) => {
  const doc = new jsPDF()
  
  // ==================== 检查是否使用优化后的 BOM ====================
  const useOptimizedBOM = project?.optimized_bill_of_materials && 
                          project.optimized_bill_of_materials.length > 0
  
  console.log('📄 生成报价单 PDF')
  console.log('  使用优化BOM:', useOptimizedBOM ? '是' : '否')
  console.log('  项目名称:', project?.project_name)
  
  // ==================== 页眉 ====================
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('C-MAX', 20, 20)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('执行器选型报价单', 20, 28)
  doc.text('Actuator Selection Quotation', 20, 34)
  
  // ==================== 标题 ====================
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('QUOTATION', 20, 50)
  
  // ==================== 报价信息 ====================
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  let yPos = 60
  const quoteInfo = [
    ['Quote Date:', new Date().toLocaleDateString()],
    ['Valid Until:', new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()],
    ['Project:', project?.project_name || '-'],
    ['Project No.:', project?.project_number || '-'],
  ]
  
  // 如果使用单个选型，显示位号；如果使用优化BOM，显示优化标记
  if (!useOptimizedBOM && selection?.tag_number) {
    quoteInfo.push(['Tag Number:', selection.tag_number])
  } else if (useOptimizedBOM) {
    quoteInfo.push(['Quote Type:', 'Optimized BOM / 优化清单'])
  }
  
  quoteInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value), 70, yPos)
    yPos += 7
  })
  
  // ==================== 客户信息 ====================
  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO:', 120, 60)
  doc.setFont('helvetica', 'normal')
  
  let clientY = 67
  const clientInfo = [
    project?.client_name || '-',
    project?.client_contact?.company || '',
    project?.client_contact?.contact_person || '',
    project?.client_contact?.email || '',
    project?.client_contact?.phone || '',
  ].filter(Boolean)
  
  clientInfo.forEach((info) => {
    doc.text(info, 120, clientY)
    clientY += 7
  })
  
  // ==================== 阀门参数区域（仅单个选型时显示）====================
  if (!useOptimizedBOM && selection) {
    yPos += 5
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('VALVE PARAMETERS', 20, yPos)
    
    yPos += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    const inputParams = selection.input_params || {}
    
    const valveParams = [
      ['Valve Type:', inputParams.valve_type || '-'],
      ['Valve Size:', inputParams.valve_size || '-'],
      ['Flange Size:', inputParams.flange_size || '-'],
    ]
    
    valveParams.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold')
      doc.text(label, 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(String(value), 70, yPos)
      yPos += 6
    })
    
    // 温度信息 (如果有温度代码)
    const quoteTempCode = selection.selected_actuator?.temperature_code || inputParams.temperature_code
    if (quoteTempCode && quoteTempCode !== 'No code') {
      const tempInfo = getTemperatureInfo(quoteTempCode)
      doc.setFont('helvetica', 'bold')
      doc.text('Temperature:', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(`${tempInfo.range} (Code: ${quoteTempCode})`, 70, yPos)
      yPos += 6
    }
  }
  
  // ==================== 报价明细表 ====================
  yPos += 10
  
  const items = []
  let itemNumber = 1
  let totalPrice = 0
  
  // ========== 分支逻辑：使用优化BOM 或 单个选型 ==========
  if (useOptimizedBOM) {
    // ===== 使用优化后的 BOM =====
    console.log('  📊 使用优化BOM，包含', project.optimized_bill_of_materials.length, '个型号')
    
    project.optimized_bill_of_materials.forEach((bomItem) => {
      const modelName = bomItem.actuator_model
      const quantity = bomItem.total_quantity
      const unitPrice = bomItem.unit_price
      const total = bomItem.total_price
      const coveredTags = bomItem.covered_tags || []
      
      // 构建描述（包含覆盖的位号）
      let description = 'Pneumatic Actuator / 气动执行器'
      if (coveredTags.length > 0) {
        description += `\nTags: ${coveredTags.join(', ')}`
      }
      if (bomItem.notes) {
        description += `\n${bomItem.notes}`
      }
      
      items.push([
        itemNumber++,
        modelName,
        description,
        quantity,
        `¥${unitPrice.toLocaleString()}`,
        `¥${total.toLocaleString()}`,
      ])
      
      totalPrice += total
    })
    
  } else if (selection) {
    // ===== 使用单个选型记录（原有逻辑）=====
    console.log('  📄 使用单个选型记录:', selection.tag_number)
    
    // 添加执行器
    if (selection.selected_actuator) {
      const actuator = selection.selected_actuator
      
      // 构建产品描述（包含温度信息）
      let description = `${actuator.series || ''} ${actuator.action_type || ''} ${actuator.yoke_type || ''}`.trim() || 'Pneumatic Actuator'
      
      // 如果有温度代码且不是常温，添加温度描述
      const tempCode = actuator.temperature_code
      if (tempCode && tempCode !== 'No code') {
        const tempInfo = getTemperatureInfo(tempCode)
        description += ` - ${tempInfo.description}`
      }
      
      const price = actuator.price || 0
      items.push([
        itemNumber++,
        actuator.final_model_name || actuator.recommended_model || actuator.model_base || 'Actuator',
        description,
        1,
        price ? `¥${price.toLocaleString()}` : '-',
        price ? `¥${price.toLocaleString()}` : '-',
      ])
      totalPrice += price
    }
    
    // 添加手动操作装置
    if (selection.selected_override) {
      const override = selection.selected_override
      const price = override.price || 0
      items.push([
        itemNumber++,
        override.model || 'Manual Override',
        'Manual Override Device / 手动操作装置',
        1,
        price ? `¥${price.toLocaleString()}` : '-',
        price ? `¥${price.toLocaleString()}` : '-',
      ])
      totalPrice += price
    }
    
    // 添加配件
    if (selection.selected_accessories && selection.selected_accessories.length > 0) {
      selection.selected_accessories.forEach((acc) => {
        const accTotal = acc.total_price || 0
        items.push([
          itemNumber++,
          acc.name || 'Accessory',
          `${acc.category || 'Accessory'} / 配件`,
          acc.quantity || 1,
          acc.unit_price ? `¥${acc.unit_price.toLocaleString()}` : '-',
          acc.total_price ? `¥${acc.total_price.toLocaleString()}` : '-',
        ])
        totalPrice += accTotal
      })
    }
  }
  
  doc.autoTable({
    startY: yPos,
    head: [['No.', 'Item / 项目', 'Description / 描述', 'Qty', 'Unit Price / 单价', 'Total / 总价']],
    body: items,
    theme: 'grid',
    headStyles: { fillColor: [24, 144, 255], halign: 'center' },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 58 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
  })
  
  // ==================== 总价 ====================
  const finalY = doc.lastAutoTable.finalY + 10
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', 140, finalY)
  doc.text(
    `¥${totalPrice.toLocaleString()}`,
    190,
    finalY,
    { align: 'right' }
  )
  
  console.log('  💰 总价:', `¥${totalPrice.toLocaleString()}`)
  
  // ==================== 条款 ====================
  const termsY = finalY + 15
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('TERMS & CONDITIONS', 20, termsY)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  const terms = [
    'Payment Terms: 30 days net',
    'Delivery: 2-4 weeks from order confirmation',
    'Warranty: 12 months from delivery',
    'Prices are subject to change without notice',
  ]
  
  let termsYPos = termsY + 7
  terms.forEach((term) => {
    doc.text(term, 20, termsYPos)
    termsYPos += 5
  })
  
  // ==================== 页脚 ====================
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(
    'Thank you for your business!',
    doc.internal.pageSize.width / 2,
    pageHeight - 20,
    { align: 'center' }
  )
  
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Generated on ${new Date().toLocaleDateString()}`,
    doc.internal.pageSize.width / 2,
    pageHeight - 15,
    { align: 'center' }
  )
  
  // ==================== 保存 PDF ====================
  let filename
  if (useOptimizedBOM) {
    filename = `Optimized-Quote-${project?.project_number || Date.now()}.pdf`
  } else {
    filename = `Selection-Quote-${selection?.tag_number || Date.now()}.pdf`
  }
  
  doc.save(filename)
  console.log('  ✅ PDF已生成:', filename)
  
  return filename
}


