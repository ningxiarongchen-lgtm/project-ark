import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { 
  Card, Button, Upload, Table, Space, message, Alert, 
  Modal, Typography, Tag, Statistic, Row, Col, Steps,
  Tooltip, Progress, Spin, InputNumber, Divider
} from 'antd'
import { 
  ThunderboltOutlined, UploadOutlined, CheckCircleOutlined,
  FileExcelOutlined, FilePdfOutlined, SendOutlined,
  DownloadOutlined, EyeOutlined, DeleteOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { projectsAPI, selectionAPI } from '../services/api'

const { Title, Text, Paragraph } = Typography
const { Step } = Steps

const BatchSelection = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const projectId = searchParams.get('projectId')
  
  const [currentProject, setCurrentProject] = useState(null)
  const [currentStep, setCurrentStep] = useState(0) // 0: 上传, 1: 选型中, 2: 审核结果
  const [uploadedData, setUploadedData] = useState([]) // 解析后的Excel数据
  const [selectionResults, setSelectionResults] = useState([]) // 选型结果
  const [loading, setLoading] = useState(false)
  const [selectionProgress, setSelectionProgress] = useState(0) // 选型进度
  const [safetyFactor, setSafetyFactor] = useState(1.3) // 安全系数，默认1.3
  
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
    }
  }, [projectId])
  
  // 从技术需求文本中提取安全系数
  const extractSafetyFactorFromText = (text) => {
    if (!text) return null
    
    // 匹配各种安全系数表达方式
    const patterns = [
      /安全系数[：:]*\s*(\d+\.?\d*)/i,           // 安全系数：1.5
      /(\d+\.?\d*)\s*倍安全系数/i,                // 1.5倍安全系数
      /safety\s+factor[：:]*\s*(\d+\.?\d*)/i,   // safety factor: 1.5
      /factor\s+of\s+(\d+\.?\d*)/i,             // factor of 1.5
      /(\d+\.?\d*)\s*x\s*safety/i,              // 1.5x safety
      /系数[：:]*\s*(\d+\.?\d*)/i                // 系数：1.5
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        const factor = parseFloat(match[1])
        if (factor >= 1.0 && factor <= 2.0) {
          return factor
        }
      }
    }
    
    return null
  }
  
  const fetchProject = async (id) => {
    try {
      const response = await projectsAPI.getById(id)
      const project = response.data
      setCurrentProject(project)
      
      // 尝试从技术需求中提取安全系数
      if (project.technical_requirements) {
        const extractedFactor = extractSafetyFactorFromText(project.technical_requirements)
        if (extractedFactor) {
          setSafetyFactor(extractedFactor)
          // 只在识别到安全系数时才显示提示
          console.log(`✅ 已从技术需求中识别安全系数: ${extractedFactor}倍`)
        }
      }
    } catch (error) {
      console.error('获取项目信息失败:', error)
      message.error('获取项目信息失败')
    }
  }
  
  // 解析Excel文件
  const handleFileUpload = (file) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        // 解析数据
        const parsedData = parseExcelData(jsonData)
        
        if (parsedData.length === 0) {
          message.error('未能从Excel中提取有效数据，请检查表格格式')
          return
        }
        
        setUploadedData(parsedData)
        setCurrentStep(1)
        message.success(`成功解析 ${parsedData.length} 条数据`)
        
        // 自动开始批量选型
        startBatchSelection(parsedData)
      } catch (error) {
        console.error('Excel解析失败:', error)
        message.error('Excel解析失败，请检查文件格式')
      }
    }
    
    reader.readAsArrayBuffer(file)
    return false // 阻止自动上传
  }
  
  // 解析Excel数据的智能逻辑
  const parseExcelData = (jsonData) => {
    if (jsonData.length < 2) return []
    
    // 第一行是表头
    const headers = jsonData[0].map(h => String(h).toLowerCase().trim())
    const rows = jsonData.slice(1)
    
    // 查找列索引的辅助函数
    const findColumnIndex = (keywords) => {
      return headers.findIndex(h => 
        keywords.some(keyword => h.includes(keyword.toLowerCase()))
      )
    }
    
    // 识别关键列
    const tagIndex = findColumnIndex(['tag', '位号', 'item'])
    const torqueIndex = findColumnIndex(['torque', '扭矩', 'nm'])
    const sizeIndex = findColumnIndex(['size', '尺寸', 'dn'])
    const valveTypeIndex = findColumnIndex(['valve', 'type', '阀门', '类型', 'model'])
    const quantityIndex = findColumnIndex(['quantity', '数量', 'qty'])
    const serviceIndex = findColumnIndex(['service', '工艺', '介质'])
    const safetyFactorIndex = findColumnIndex(['safety', 'factor', '安全系数', '系数'])
    
    console.log('列索引:', { tagIndex, torqueIndex, sizeIndex, valveTypeIndex, quantityIndex })
    
    const parsed = []
    
    rows.forEach((row, index) => {
      if (!row || row.length === 0) return
      
      // 提取扭矩（必需）
      let torque = null
      if (torqueIndex >= 0 && row[torqueIndex]) {
        torque = parseFloat(String(row[torqueIndex]).replace(/[^0-9.]/g, ''))
      }
      
      // 如果没有找到扭矩，跳过这行
      if (!torque || isNaN(torque)) {
        console.log(`跳过第 ${index + 2} 行: 没有有效扭矩值`)
        return
      }
      
      // 提取其他信息
      const tag = tagIndex >= 0 && row[tagIndex] ? String(row[tagIndex]) : `AUTO-${index + 1}`
      const size = sizeIndex >= 0 && row[sizeIndex] ? extractDNSize(String(row[sizeIndex])) : null
      const valveType = valveTypeIndex >= 0 && row[valveTypeIndex] ? detectValveType(String(row[valveTypeIndex])) : 'Ball Valve'
      const quantity = quantityIndex >= 0 && row[quantityIndex] ? parseInt(row[quantityIndex]) : 1
      const service = serviceIndex >= 0 && row[serviceIndex] ? String(row[serviceIndex]) : ''
      
      // 安全系数：优先使用Excel中的值，否则使用全局默认值
      let itemSafetyFactor = safetyFactor // 使用全局默认值
      if (safetyFactorIndex >= 0 && row[safetyFactorIndex]) {
        const excelFactor = parseFloat(String(row[safetyFactorIndex]).replace(/[^0-9.]/g, ''))
        if (!isNaN(excelFactor) && excelFactor > 0) {
          itemSafetyFactor = excelFactor
        }
      }
      
      parsed.push({
        key: index,
        tag,
        torque,
        safetyFactor: itemSafetyFactor, // 保存实际使用的安全系数
        safetyTorque: Math.round(torque * itemSafetyFactor), // 计算安全扭矩
        size,
        valveType,
        quantity: isNaN(quantity) ? 1 : quantity,
        service,
        status: 'pending' // pending, selecting, success, failed
      })
    })
    
    return parsed
  }
  
  // 提取DN尺寸
  const extractDNSize = (text) => {
    const match = text.match(/DN\s*(\d+)/i) || text.match(/(\d+)\s*mm/i) || text.match(/\d+/)
    return match ? parseInt(match[1] || match[0]) : null
  }
  
  // 识别阀门类型
  const detectValveType = (text) => {
    const lower = text.toLowerCase()
    if (lower.includes('ball') || lower.includes('球阀') || lower.includes('b8')) {
      return 'Ball Valve'
    }
    if (lower.includes('butterfly') || lower.includes('蝶阀')) {
      return 'Butterfly Valve'
    }
    if (lower.includes('gate') || lower.includes('闸阀')) {
      return 'Gate Valve'
    }
    return 'Ball Valve' // 默认球阀
  }
  
  // 批量自动选型
  const startBatchSelection = async (data) => {
    setLoading(true)
    setSelectionProgress(0)
    
    const results = []
    const total = data.length
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      
      try {
        // 调用选型API
        const selectionParams = {
          mechanism: 'Scotch Yoke', // 默认使用苏格兰轭式
          required_torque: item.safetyTorque, // 使用1.5倍安全系数后的扭矩
          working_pressure: 0.6, // 默认工作压力
          valve_type: item.valveType,
          valve_size: item.size ? `DN${item.size}` : undefined,
          working_angle: 90
        }
        
        console.log(`选型参数 [${item.tag}]:`, selectionParams)
        
        const response = await selectionAPI.calculate(selectionParams)
        
        if (response.data.success && response.data.data && response.data.data.length > 0) {
          // 取第一个推荐结果
          const recommended = response.data.data[0]
          
          results.push({
            ...item,
            status: 'success',
            recommendedActuator: recommended,
            actuatorModel: recommended.model_base,
            actuatorTorque: recommended.torque_output,
            actuatorPrice: recommended.price
          })
        } else {
          results.push({
            ...item,
            status: 'failed',
            error: '未找到匹配的执行器'
          })
        }
      } catch (error) {
        console.error(`选型失败 [${item.tag}]:`, error)
        results.push({
          ...item,
          status: 'failed',
          error: error.response?.data?.message || '选型失败'
        })
      }
      
      // 更新进度
      setSelectionProgress(Math.round(((i + 1) / total) * 100))
    }
    
    setSelectionResults(results)
    setCurrentStep(2)
    setLoading(false)
    
    const successCount = results.filter(r => r.status === 'success').length
    message.success(`批量选型完成！成功 ${successCount}/${total} 条`)
  }
  
  // 生成技术清单
  const handleGenerateTechnicalList = async () => {
    try {
      if (!currentProject) {
        message.error('项目信息缺失')
        return
      }
      
      setLoading(true)
      
      const successResults = selectionResults.filter(r => r.status === 'success')
      
      if (successResults.length === 0) {
        message.warning('没有成功的选型结果')
        return
      }
      
      // 构建技术清单数据
      const technicalItems = successResults.map(result => ({
        tag: result.tag,
        model_name: result.actuatorModel,
        quantity: result.quantity,
        description: result.service || `${result.valveType} ${result.size ? `DN${result.size}` : ''}`,
        technical_specs: {
          torque: result.torque,
          safety_torque: result.safetyTorque,
          valve_type: result.valveType,
          valve_size: result.size ? `DN${result.size}` : undefined
        },
        notes: `自动选型 - 原始扭矩${result.torque}Nm × ${result.safetyFactor} = ${result.safetyTorque}Nm`
      }))
      
      // 调用API批量添加到技术清单
      await projectsAPI.batchAddTechnicalItems(currentProject._id, technicalItems)
      
      message.success(`成功生成技术清单！已添加 ${technicalItems.length} 个项目`)
      
      // 显示成功对话框
      Modal.success({
        title: '技术清单生成成功！',
        content: (
          <div>
            <p>✅ 已将 {technicalItems.length} 个选型结果添加到技术清单</p>
            <p>• 成功率: {Math.round((successResults.length / selectionResults.length) * 100)}%</p>
            <p>• 总扭矩需求: {successResults.reduce((sum, r) => sum + r.safetyTorque, 0)} Nm</p>
          </div>
        ),
        okText: '返回项目详情',
        onOk: () => {
          navigate(`/projects/${currentProject._id}?tab=technical-items`)
        }
      })
    } catch (error) {
      console.error('生成技术清单失败:', error)
      message.error('生成技术清单失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }
  
  // 结果表格列定义
  const resultColumns = [
    {
      title: 'TAG/位号',
      dataIndex: 'tag',
      key: 'tag',
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '阀门信息',
      key: 'valve',
      width: 200,
      render: (_, record) => (
        <div>
          <div><Text strong>{record.valveType}</Text></div>
          {record.size && <div><Text type="secondary">DN{record.size}</Text></div>}
        </div>
      )
    },
    {
      title: '扭矩需求',
      key: 'torque',
      width: 180,
      render: (_, record) => (
        <div>
          <div><Text>原始: {record.torque} Nm</Text></div>
          <div>
            <Text type="danger" strong>
              × {record.safetyFactor} = {record.safetyTorque} Nm
            </Text>
          </div>
          <div><Text type="secondary" style={{ fontSize: 11 }}>
            ({record.safetyFactor === 1.3 ? '标准' : record.safetyFactor === 1.5 ? '高安全' : '自定义'}系数)
          </Text></div>
        </div>
      )
    },
    {
      title: '推荐执行器',
      dataIndex: 'actuatorModel',
      key: 'actuatorModel',
      width: 150,
      render: (text, record) => (
        record.status === 'success' ? (
          <Text strong style={{ color: '#52c41a' }}>{text}</Text>
        ) : (
          <Text type="danger">未找到</Text>
        )
      )
    },
    {
      title: '执行器扭矩',
      dataIndex: 'actuatorTorque',
      key: 'actuatorTorque',
      width: 120,
      render: (text, record) => (
        record.status === 'success' ? (
          <Text>{text} Nm</Text>
        ) : '-'
      )
    },
    {
      title: '价格',
      dataIndex: 'actuatorPrice',
      key: 'actuatorPrice',
      width: 100,
      render: (text, record) => (
        record.status === 'success' ? (
          <Text strong>¥{text?.toLocaleString()}</Text>
        ) : '-'
      )
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => {
        if (status === 'success') {
          return <Tag color="success">成功</Tag>
        }
        if (status === 'failed') {
          return (
            <Tooltip title={record.error}>
              <Tag color="error">失败</Tag>
            </Tooltip>
          )
        }
        return <Tag>待选型</Tag>
      }
    }
  ]
  
  // 下载Excel模板
  const handleDownloadTemplate = () => {
    const template = [
      ['TAG/位号', '阀门类型', '阀门尺寸', '扭矩(Nm)', '安全系数', '数量', '工艺介质'],
      ['FV-001', '球阀', 'DN100', '500', '1.3', '1', '气动液端滑水闸阀'],
      ['FV-002', 'Ball Valve', 'DN150', '800', '1.5', '2', '水处理系统（高安全要求）'],
      ['FV-003', 'B822', 'DN50', '190', '', '1', '（留空则使用默认1.3）']
    ]
    
    const ws = XLSX.utils.aoa_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '批量选型模板')
    XLSX.writeFile(wb, '批量选型模板.xlsx')
    message.success('模板下载成功')
  }
  
  // 导出选型结果为Excel
  const handleExportExcel = () => {
    try {
      const successResults = selectionResults.filter(r => r.status === 'success')
      
      if (successResults.length === 0) {
        message.warning('没有成功的选型结果可以导出')
        return
      }
      
      // 准备导出数据
      const exportData = [
        // 表头
        ['TAG/位号', '阀门类型', '阀门尺寸', '要求扭矩(Nm)', '安全系数', '安全扭矩(Nm)', '推荐执行器', '执行器扭矩(Nm)', '数量', '单价(元)', '小计(元)', '工艺介质'],
        // 数据行
        ...successResults.map(item => [
          item.tag || '-',
          item.valveType || '-',
          item.size || '-',
          item.torque || '-',
          item.safetyFactor || safetyFactor,
          item.safetyTorque || '-',
          item.recommendedActuator?.model_name || '-',
          item.recommendedActuator?.rated_torque || '-',
          item.quantity || 1,
          item.recommendedActuator?.price || 0,
          (item.recommendedActuator?.price || 0) * (item.quantity || 1),
          item.service || '-'
        ])
      ]
      
      // 添加统计行
      const totalQuantity = successResults.reduce((sum, item) => sum + (item.quantity || 1), 0)
      const totalAmount = successResults.reduce((sum, item) => sum + ((item.recommendedActuator?.price || 0) * (item.quantity || 1)), 0)
      exportData.push([])
      exportData.push(['统计', '', '', '', '', '', '', '', totalQuantity, '', totalAmount.toFixed(2), ''])
      
      const ws = XLSX.utils.aoa_to_sheet(exportData)
      
      // 设置列宽
      ws['!cols'] = [
        { wch: 15 }, // TAG
        { wch: 15 }, // 阀门类型
        { wch: 12 }, // 尺寸
        { wch: 12 }, // 要求扭矩
        { wch: 10 }, // 安全系数
        { wch: 12 }, // 安全扭矩
        { wch: 20 }, // 推荐执行器
        { wch: 12 }, // 执行器扭矩
        { wch: 8 },  // 数量
        { wch: 12 }, // 单价
        { wch: 12 }, // 小计
        { wch: 20 }  // 工艺介质
      ]
      
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '批量选型结果')
      
      const fileName = `${currentProject?.projectName || '项目'}_批量选型结果_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`
      XLSX.writeFile(wb, fileName)
      message.success('Excel导出成功')
    } catch (error) {
      console.error('Excel导出失败:', error)
      message.error('Excel导出失败')
    }
  }
  
  // 导出选型结果为PDF
  const handleExportPDF = () => {
    try {
      const successResults = selectionResults.filter(r => r.status === 'success')
      
      if (successResults.length === 0) {
        message.warning('没有成功的选型结果可以导出')
        return
      }
      
      const doc = new jsPDF()
      
      // 添加中文字体支持（使用默认字体）
      doc.setFont('helvetica')
      
      // 标题
      doc.setFontSize(18)
      doc.text('Batch Selection Results', 105, 20, { align: 'center' })
      
      // 项目信息
      doc.setFontSize(10)
      let yPos = 35
      if (currentProject) {
        doc.text(`Project: ${currentProject.projectName || '-'}`, 15, yPos)
        yPos += 6
        doc.text(`Project No.: ${currentProject.projectNumber || '-'}`, 15, yPos)
        yPos += 6
        doc.text(`Client: ${currentProject.client?.name || '-'}`, 15, yPos)
        yPos += 6
      }
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, yPos)
      yPos += 6
      doc.text(`Safety Factor: ${safetyFactor}x`, 15, yPos)
      yPos += 10
      
      // 表格数据
      const tableData = successResults.map(item => [
        item.tag || '-',
        item.valveType || '-',
        item.size || '-',
        item.torque || '-',
        item.safetyFactor || safetyFactor,
        item.safetyTorque || '-',
        item.recommendedActuator?.model_name || '-',
        item.recommendedActuator?.rated_torque || '-',
        item.quantity || 1,
        `¥${(item.recommendedActuator?.price || 0).toFixed(2)}`
      ])
      
      // 使用autoTable插件
      doc.autoTable({
        startY: yPos,
        head: [['TAG', 'Valve Type', 'Size', 'Torque', 'SF', 'Safe Torque', 'Actuator', 'Act. Torque', 'Qty', 'Price']],
        body: tableData,
        styles: { 
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 10, right: 10 }
      })
      
      // 统计信息
      const finalY = doc.lastAutoTable.finalY + 10
      const totalQuantity = successResults.reduce((sum, item) => sum + (item.quantity || 1), 0)
      const totalAmount = successResults.reduce((sum, item) => sum + ((item.recommendedActuator?.price || 0) * (item.quantity || 1)), 0)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`Total Items: ${successResults.length}`, 15, finalY)
      doc.text(`Total Quantity: ${totalQuantity}`, 15, finalY + 6)
      doc.text(`Total Amount: ¥${totalAmount.toFixed(2)}`, 15, finalY + 12)
      
      // 页脚
      const pageCount = doc.internal.getNumberOfPages()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }
      
      const fileName = `${currentProject?.projectName || 'Project'}_Batch_Selection_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`
      doc.save(fileName)
      message.success('PDF导出成功')
    } catch (error) {
      console.error('PDF导出失败:', error)
      message.error('PDF导出失败')
    }
  }
  
  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* 项目信息卡片 */}
      {currentProject && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
          message={
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong style={{ fontSize: 16 }}>
                🚀 为项目进行批量智能选型: {currentProject.projectName}
              </Text>
              <Space split={<Text type="secondary">|</Text>}>
                <Text type="secondary">项目编号: {currentProject.projectNumber}</Text>
                <Text type="secondary">客户: {currentProject.client?.name || '-'}</Text>
                {extractSafetyFactorFromText(currentProject.technical_requirements) && (
                  <Text type="secondary" style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    ✅ 已识别安全系数: {extractSafetyFactorFromText(currentProject.technical_requirements)}倍
                  </Text>
                )}
              </Space>
              {currentProject.technical_requirements && (
                <div style={{ 
                  marginTop: 8, 
                  padding: '8px 12px', 
                  background: '#f0f5ff', 
                  borderRadius: 4,
                  border: '1px solid #d9d9d9',
                  maxHeight: 100,
                  overflowY: 'auto'
                }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    技术需求:
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 13 }}>
                      {currentProject.technical_requirements}
                    </Text>
                  </div>
                </div>
              )}
            </Space>
          }
        />
      )}
      
      {/* 步骤条 */}
      <Card style={{ marginBottom: 24 }}>
        <Steps current={currentStep}>
          <Step title="上传数据" icon={<UploadOutlined />} />
          <Step title="自动选型" icon={<ThunderboltOutlined />} />
          <Step title="审核结果" icon={<CheckCircleOutlined />} />
        </Steps>
      </Card>
      
      {/* 步骤0: 上传Excel */}
      {currentStep === 0 && (
        <Card>
          <Row gutter={24}>
            <Col span={12}>
              <Title level={4}>📊 上传Excel表格</Title>
              <Paragraph>
                请上传包含阀门选型信息的Excel文件。系统会自动识别以下列：
              </Paragraph>
              <ul>
                <li><Text strong type="danger">扭矩(Nm)</Text>: 必需，阀门最大扭矩</li>
                <li><Text strong>安全系数</Text>: 可选，留空则使用默认值（下方设置）</li>
                <li><Text strong>TAG/位号</Text>: 设备位号（可选）</li>
                <li><Text strong>阀门类型</Text>: 球阀/蝶阀等（可选，默认球阀）</li>
                <li><Text strong>阀门尺寸</Text>: DN50/DN100等（可选）</li>
                <li><Text strong>数量</Text>: 需要数量（可选，默认1）</li>
              </ul>
              
              <Alert
                message="安全系数设置"
                description={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {currentProject?.technical_requirements && extractSafetyFactorFromText(currentProject.technical_requirements) ? (
                      <Text>
                        ✅ 已从项目技术需求中自动识别安全系数: <Text strong style={{ color: '#52c41a' }}>{extractSafetyFactorFromText(currentProject.technical_requirements)}倍</Text>
                        <br />
                        您可以在下方修改默认值：
                      </Text>
                    ) : (
                      <Text>如果Excel中未指定安全系数，将使用以下默认值：</Text>
                    )}
                    <Space>
                      <Text strong>默认安全系数:</Text>
                      <InputNumber
                        min={1.0}
                        max={2.0}
                        step={0.1}
                        value={safetyFactor}
                        onChange={(value) => setSafetyFactor(value || 1.3)}
                        style={{ width: 100 }}
                      />
                      <Text type="secondary">(通常为1.3倍，高安全要求可设为1.5倍)</Text>
                    </Space>
                    {currentProject?.technical_requirements && (
                      <Text type="secondary" style={{ fontSize: 11, fontStyle: 'italic' }}>
                        💡 提示: 系统已自动分析项目技术需求并识别安全系数要求
                      </Text>
                    )}
                  </Space>
                }
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
              
              
              <Space direction="vertical" style={{ width: '100%', marginTop: 24 }}>
                <Upload
                  accept=".xlsx,.xls"
                  beforeUpload={handleFileUpload}
                  showUploadList={false}
                >
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<UploadOutlined />}
                    style={{ width: 300 }}
                  >
                    选择Excel文件
                  </Button>
                </Upload>
                
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadTemplate}
                >
                  下载Excel模板
                </Button>
                
                <Button 
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate(`/projects/${projectId}?tab=technical-items`)}
                >
                  返回项目详情
                </Button>
              </Space>
            </Col>
            
            <Col span={12}>
              <Title level={4}>💡 使用说明</Title>
              <Alert
                message="自动选型逻辑"
                description={
                  <div>
                    <p><Text strong>1. 扭矩计算:</Text> 输入扭矩 × 安全系数（默认1.3，可自定义）</p>
                    <p><Text strong>2. 执行器匹配:</Text> 执行器扭矩 ≥ 安全扭矩</p>
                    <p><Text strong>3. 尺寸匹配:</Text> 执行器适配尺寸 ≥ 阀门尺寸</p>
                    <p><Text strong>4. 推荐结果:</Text> 最优性价比执行器</p>
                    <Divider style={{ margin: '12px 0' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      💡 Excel中可以为每行指定不同的安全系数。例如：<br />
                      • 常规环境：1.3倍<br />
                      • 高安全要求：1.5倍<br />
                      • 特殊要求：自定义（如1.2、1.4等）
                    </Text>
                  </div>
                }
                type="success"
                showIcon
              />
              
              <Alert
                message="支持的表格格式"
                description={
                  <div style={{ marginTop: 12 }}>
                    <Text>✅ 标准技术表格（带TAG、型号等）</Text><br />
                    <Text>✅ 简化表格（只有扭矩和尺寸）</Text><br />
                    <Text>✅ 混合格式（中文或英文列名）</Text>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </Col>
          </Row>
        </Card>
      )}
      
      {/* 步骤1: 选型中 */}
      {currentStep === 1 && loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
            <Title level={4} style={{ marginTop: 24 }}>正在进行批量选型...</Title>
            <Progress 
              percent={selectionProgress} 
              status="active"
              style={{ maxWidth: 600, margin: '24px auto' }}
            />
            <Text type="secondary">
              已完成 {uploadedData.length > 0 ? Math.round(uploadedData.length * selectionProgress / 100) : 0} / {uploadedData.length} 条
            </Text>
          </div>
        </Card>
      )}
      
      {/* 步骤2: 审核结果 */}
      {currentStep === 2 && (
        <>
          {/* 统计卡片 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="总数" 
                  value={selectionResults.length} 
                  suffix="条"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="成功" 
                  value={selectionResults.filter(r => r.status === 'success').length} 
                  valueStyle={{ color: '#3f8600' }}
                  suffix="条"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="失败" 
                  value={selectionResults.filter(r => r.status === 'failed').length} 
                  valueStyle={{ color: '#cf1322' }}
                  suffix="条"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="成功率" 
                  value={Math.round((selectionResults.filter(r => r.status === 'success').length / selectionResults.length) * 100)} 
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>
          
          {/* 操作按钮 */}
          <Card style={{ marginBottom: 16 }}>
            <Space wrap>
              <Button
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={handleGenerateTechnicalList}
                loading={loading}
                disabled={selectionResults.filter(r => r.status === 'success').length === 0}
                style={{
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  border: 'none',
                  fontWeight: 'bold'
                }}
              >
                ✅ 生成技术清单
              </Button>
              
              <Button
                type="default"
                size="large"
                icon={<FileExcelOutlined />}
                onClick={handleExportExcel}
                disabled={selectionResults.filter(r => r.status === 'success').length === 0}
                style={{
                  color: '#52c41a',
                  borderColor: '#52c41a'
                }}
              >
                导出Excel
              </Button>
              
              <Button
                type="default"
                size="large"
                icon={<FilePdfOutlined />}
                onClick={handleExportPDF}
                disabled={selectionResults.filter(r => r.status === 'success').length === 0}
                style={{
                  color: '#1890ff',
                  borderColor: '#1890ff'
                }}
              >
                导出PDF
              </Button>
              
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => {
                  setCurrentStep(0)
                  setUploadedData([])
                  setSelectionResults([])
                }}
              >
                重新上传
              </Button>
              
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(`/projects/${projectId}?tab=technical-items`)}
              >
                返回项目详情
              </Button>
            </Space>
          </Card>
          
          {/* 结果表格 */}
          <Card title="选型结果">
            <Table
              columns={resultColumns}
              dataSource={selectionResults}
              rowKey="key"
              pagination={{ pageSize: 20 }}
              scroll={{ x: 1200 }}
              rowClassName={(record) => {
                if (record.status === 'success') return 'success-row'
                if (record.status === 'failed') return 'error-row'
                return ''
              }}
            />
          </Card>
        </>
      )}
    </div>
  )
}

export default BatchSelection

