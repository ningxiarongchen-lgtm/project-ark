import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Table, Button, Tag, Space, Spin, message, Modal, Form, InputNumber, Input, Tooltip, Divider, Statistic, Row, Col, Alert, Tabs, Typography, Popconfirm, Dropdown, List } from 'antd'
import { ArrowLeftOutlined, FileTextOutlined, PlusOutlined, DeleteOutlined, ThunderboltOutlined, SaveOutlined, EyeOutlined, FilePdfOutlined, UnorderedListOutlined, FileSearchOutlined, EditOutlined, CheckOutlined, CloseOutlined, FileExcelOutlined, DownloadOutlined, DownOutlined, HistoryOutlined, SwapOutlined, BulbOutlined, RobotOutlined, ShoppingCartOutlined, CheckCircleOutlined, SendOutlined, DollarOutlined, FileProtectOutlined, UploadOutlined, FolderOutlined } from '@ant-design/icons'
import { projectsAPI, quotesAPI, aiAPI, ordersAPI } from '../services/api'
import { optimizeProjectSelection } from '../utils/optimization'
import { generateSelectionQuotePDF } from '../utils/pdfGenerator'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import './ProjectDetails.css'
import { useAuth } from '../hooks/useAuth'
import RoleBasedAccess from '../components/RoleBasedAccess'
import CloudUpload from '../components/CloudUpload'
import axios from 'axios'

const { TextArea } = Input

const ProjectDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth() // 获取当前用户信息
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quoteModalVisible, setQuoteModalVisible] = useState(false)
  const [quoteForm] = Form.useForm()
  
  // 权限检查
  const canEdit = user && ['Administrator', 'Technical Engineer', 'Sales Engineer', 'Sales Manager'].includes(user.role)
  const canSeeCost = user && ['Administrator', 'Sales Engineer', 'Sales Manager', 'Procurement Specialist'].includes(user.role)
  const canDelete = user && user.role === 'Administrator'
  const canApprove = user && ['Sales Manager', 'Administrator'].includes(user.role)
  const canCreateOrder = user && ['Sales Manager', 'Administrator'].includes(user.role)
  
  // 优化相关状态
  const [optimizationResult, setOptimizationResult] = useState(null)
  const [optimizationModalVisible, setOptimizationModalVisible] = useState(false)
  const [savingOptimization, setSavingOptimization] = useState(false)
  
  // BOM清单管理状态
  const [bomData, setBomData] = useState([]) // 可编辑的BOM数据
  const [editingKey, setEditingKey] = useState('') // 当前编辑的行key
  const [bomForm] = Form.useForm() // BOM编辑表单
  const [savingBOM, setSavingBOM] = useState(false) // 保存BOM状态
  const [generatingBOM, setGeneratingBOM] = useState(false) // 生成BOM状态
  
  // BOM版本历史状态
  const [bomVersions, setBomVersions] = useState([]) // 历史版本列表
  const [versionModalVisible, setVersionModalVisible] = useState(false) // 版本对比Modal
  const [selectedVersions, setSelectedVersions] = useState([]) // 选中要对比的版本（最多2个）
  const [loadingVersions, setLoadingVersions] = useState(false) // 加载版本历史状态
  
  // AI优化建议状态
  const [aiModalVisible, setAiModalVisible] = useState(false) // AI建议Modal
  const [aiSuggestion, setAiSuggestion] = useState('') // AI建议内容
  const [loadingAI, setLoadingAI] = useState(false) // 加载AI建议状态
  
  // 订单生成状态
  const [orderModalVisible, setOrderModalVisible] = useState(false) // 订单生成Modal
  const [orderForm] = Form.useForm() // 订单表单
  const [creatingOrder, setCreatingOrder] = useState(false) // 创建订单状态

  useEffect(() => {
    fetchProject()
  }, [id])
  
  // 当项目数据加载后，初始化BOM数据和版本历史
  useEffect(() => {
    if (project?.optimized_bill_of_materials) {
      // 为每行添加唯一的key
      const dataWithKeys = project.optimized_bill_of_materials.map((item, index) => ({
        ...item,
        key: `bom_${index}_${item.actuator_model}`,
      }))
      setBomData(dataWithKeys)
    }
    
    // 加载版本历史
    if (project?.bom_version_history) {
      setBomVersions(project.bom_version_history)
    }
  }, [project])

  const fetchProject = async () => {
    try {
      const response = await projectsAPI.getById(id)
      setProject(response.data)
    } catch (error) {
      message.error('Failed to load project details')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateQuote = async (values) => {
    try {
      const response = await quotesAPI.create({
        projectId: id,
        ...values
      })
      message.success('Quote created successfully')
      setQuoteModalVisible(false)
      quoteForm.resetFields()
      navigate(`/quotes/${response.data._id}`)
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create quote')
    }
  }

  const handleRemoveSelection = async (selectionId) => {
    try {
      await projectsAPI.removeSelection(id, selectionId)
      message.success('Selection removed')
      fetchProject()
    } catch (error) {
      message.error('Failed to remove selection')
    }
  }

  // 处理优化操作
  const handleOptimize = () => {
    if (!project || !project.selections || project.selections.length === 0) {
      message.warning('当前项目没有选型数据可供优化')
      return
    }

    try {
      console.log('🚀 开始优化项目选型...')
      const result = optimizeProjectSelection(project.selections)
      
      setOptimizationResult(result)
      setOptimizationModalVisible(true)
      
      message.success(result.statistics.message)
    } catch (error) {
      console.error('优化失败:', error)
      message.error('优化失败: ' + error.message)
    }
  }

  // 保存优化结果
  const handleSaveOptimization = async () => {
    if (!optimizationResult) {
      message.warning('没有优化结果可保存')
      return
    }

    setSavingOptimization(true)

    try {
      // 调用后端API保存优化结果
      await projectsAPI.update(id, {
        optimized_bill_of_materials: optimizationResult.optimized_bill_of_materials
      })

      message.success('优化结果已保存到项目中！')
      
      // 刷新项目数据
      await fetchProject()
      
      // 关闭模态框
      setOptimizationModalVisible(false)
    } catch (error) {
      console.error('保存优化结果失败:', error)
      message.error('保存失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setSavingOptimization(false)
    }
  }

  // 生成报价单PDF
  const handleGenerateQuotePDF = () => {
    try {
      console.log('🎯 生成报价单PDF')
      
      // 使用项目数据生成PDF（函数内部会自动判断是否使用优化BOM）
      const filename = generateSelectionQuotePDF(null, project)
      
      message.success(`报价单PDF已生成: ${filename}`)
    } catch (error) {
      console.error('生成PDF失败:', error)
      message.error('生成PDF失败: ' + error.message)
    }
  }
  
  // ========== BOM清单管理函数 ==========
  
  // 从选型自动生成BOM（调用优化算法）
  const handleGenerateBOMFromSelections = () => {
    if (!project || !project.selections || project.selections.length === 0) {
      message.warning('当前项目没有选型数据，无法生成BOM清单')
      return
    }
    
    setGeneratingBOM(true)
    
    try {
      console.log('🚀 从选型自动生成BOM清单...')
      
      // 调用优化算法
      const result = optimizeProjectSelection(project.selections)
      
      console.log('✅ 优化结果:', result)
      
      // 将优化结果转换为可编辑的BOM数据
      const newBomData = result.optimized_bill_of_materials.map((item, index) => ({
        ...item,
        key: `bom_${Date.now()}_${index}`,
      }))
      
      setBomData(newBomData)
      
      message.success(`成功生成BOM清单！原 ${result.statistics.original_count} 个选型优化为 ${result.statistics.optimized_count} 个型号`)
    } catch (error) {
      console.error('生成BOM失败:', error)
      message.error('生成BOM失败: ' + error.message)
    } finally {
      setGeneratingBOM(false)
    }
  }
  
  // 手动添加新BOM行
  const handleAddBOMRow = () => {
    const newRow = {
      key: `bom_new_${Date.now()}`,
      actuator_model: '',
      total_quantity: 1,
      unit_price: 0,
      total_price: 0,
      covered_tags: [],
      notes: '',
    }
    
    setBomData([...bomData, newRow])
    setEditingKey(newRow.key)
    
    // 设置表单初始值
    bomForm.setFieldsValue({
      actuator_model: '',
      total_quantity: 1,
      unit_price: 0,
      notes: '',
    })
    
    message.info('已添加新行，请填写内容')
  }
  
  // 编辑BOM行
  const handleEditBOMRow = (record) => {
    bomForm.setFieldsValue({
      actuator_model: record.actuator_model,
      total_quantity: record.total_quantity,
      unit_price: record.unit_price,
      notes: record.notes,
    })
    setEditingKey(record.key)
  }
  
  // 取消编辑
  const handleCancelEdit = () => {
    setEditingKey('')
    bomForm.resetFields()
  }
  
  // 保存编辑
  const handleSaveEdit = async (key) => {
    try {
      const row = await bomForm.validateFields()
      
      const newData = [...bomData]
      const index = newData.findIndex((item) => key === item.key)
      
      if (index > -1) {
        const item = newData[index]
        
        // 计算总价
        const totalPrice = row.total_quantity * row.unit_price
        
        newData.splice(index, 1, {
          ...item,
          ...row,
          total_price: totalPrice,
        })
        
        setBomData(newData)
        setEditingKey('')
        message.success('保存成功')
      }
    } catch (error) {
      console.error('保存失败:', error)
      message.error('请检查输入是否正确')
    }
  }
  
  // 删除BOM行
  const handleDeleteBOMRow = (key) => {
    const newData = bomData.filter((item) => item.key !== key)
    setBomData(newData)
    message.success('删除成功')
  }
  
  // 保存BOM到后端
  const handleSaveBOM = async () => {
    if (!bomData || bomData.length === 0) {
      message.warning('BOM清单为空，无法保存')
      return
    }
    
    // 检查是否有正在编辑的行
    if (editingKey) {
      message.warning('请先保存或取消当前编辑的行')
      return
    }
    
    setSavingBOM(true)
    
    try {
      // 移除key字段，准备保存到后端
      const bomToSave = bomData.map(({ key, ...rest }) => rest)
      
      // 创建版本快照
      const versionSnapshot = {
        version_number: (bomVersions.length + 1),
        timestamp: new Date().toISOString(),
        created_by: localStorage.getItem('username') || '当前用户',
        bom_data: bomToSave,
        statistics: {
          total_models: bomToSave.length,
          total_quantity: bomToSave.reduce((sum, item) => sum + (item.total_quantity || 0), 0),
          total_price: bomToSave.reduce((sum, item) => sum + (item.total_price || 0), 0)
        },
        description: '手动保存'
      }
      
      // 获取现有版本历史
      const existingVersions = project?.bom_version_history || []
      const updatedVersions = [...existingVersions, versionSnapshot]
      
      // 调用后端API保存（包含版本历史）
      await projectsAPI.update(id, {
        optimized_bill_of_materials: bomToSave,
        bom_version_history: updatedVersions
      })
      
      message.success('BOM清单已保存到项目中！（版本 ' + versionSnapshot.version_number + '）')
      
      // 更新本地版本历史
      setBomVersions(updatedVersions)
      
      // 刷新项目数据
      await fetchProject()
    } catch (error) {
      console.error('保存BOM失败:', error)
      message.error('保存失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setSavingBOM(false)
    }
  }
  
  // 判断行是否正在编辑
  const isEditing = (record) => record.key === editingKey
  
  // ========== BOM版本管理函数 ==========
  
  // 打开版本对比Modal
  const handleOpenVersionComparison = () => {
    if (bomVersions.length === 0) {
      message.warning('暂无历史版本')
      return
    }
    setVersionModalVisible(true)
    setSelectedVersions([])
  }
  
  // 选择要对比的版本（最多2个）
  const handleSelectVersion = (versionNumber) => {
    if (selectedVersions.includes(versionNumber)) {
      // 取消选择
      setSelectedVersions(selectedVersions.filter(v => v !== versionNumber))
    } else {
      // 添加选择（最多2个）
      if (selectedVersions.length < 2) {
        setSelectedVersions([...selectedVersions, versionNumber])
      } else {
        // 替换第二个
        setSelectedVersions([selectedVersions[0], versionNumber])
        message.info('最多选择2个版本进行对比，已自动替换')
      }
    }
  }
  
  // 对比两个版本的数据，返回差异信息
  const compareBOMVersions = (version1Data, version2Data) => {
    const differences = {
      added: [],      // 在version2中新增的
      removed: [],    // 在version2中删除的
      modified: []    // 数据有变化的
    }
    
    const v1Map = new Map(version1Data.map(item => [item.actuator_model, item]))
    const v2Map = new Map(version2Data.map(item => [item.actuator_model, item]))
    
    // 找出新增和修改的
    version2Data.forEach(v2Item => {
      const model = v2Item.actuator_model
      const v1Item = v1Map.get(model)
      
      if (!v1Item) {
        // 新增
        differences.added.push(v2Item)
      } else {
        // 检查是否有修改
        const hasChanges = 
          v1Item.total_quantity !== v2Item.total_quantity ||
          v1Item.unit_price !== v2Item.unit_price ||
          v1Item.total_price !== v2Item.total_price ||
          v1Item.notes !== v2Item.notes
        
        if (hasChanges) {
          differences.modified.push({
            model,
            old: v1Item,
            new: v2Item
          })
        }
      }
    })
    
    // 找出删除的
    version1Data.forEach(v1Item => {
      const model = v1Item.actuator_model
      if (!v2Map.has(model)) {
        differences.removed.push(v1Item)
      }
    })
    
    return differences
  }
  
  // 恢复到指定版本
  const handleRestoreVersion = (versionNumber) => {
    const version = bomVersions.find(v => v.version_number === versionNumber)
    if (!version) {
      message.error('版本不存在')
      return
    }
    
    Modal.confirm({
      title: '确认恢复版本？',
      content: `将BOM清单恢复到版本 ${versionNumber}（${dayjs(version.timestamp).format('YYYY-MM-DD HH:mm:ss')}）？当前未保存的修改将丢失。`,
      okText: '确认恢复',
      cancelText: '取消',
      onOk: () => {
        const dataWithKeys = version.bom_data.map((item, index) => ({
          ...item,
          key: `bom_${Date.now()}_${index}`
        }))
        setBomData(dataWithKeys)
        setVersionModalVisible(false)
        message.success(`已恢复到版本 ${versionNumber}`)
      }
    })
  }
  
  // ========== 订单生成函数 ==========
  
  // 打开订单生成Modal
  const handleOpenOrderModal = () => {
    // 检查项目状态
    if (project.status !== 'Won') {
      message.warning('只有状态为"赢单"的项目才能生成订单')
      return
    }
    
    // 检查BOM数据
    const bomData = project.optimized_bill_of_materials || project.bill_of_materials || []
    if (bomData.length === 0) {
      message.warning('项目没有BOM数据，请先生成BOM清单')
      return
    }
    
    // 设置表单初始值
    orderForm.setFieldsValue({
      shippingAddress: project.client?.address || '',
      shippingMethod: 'Standard',
      deliveryTerms: 'FOB Factory',
      paymentTerms: 'Net 30',
      taxRate: 13, // 默认13%增值税
      shippingCost: 0,
      discount: 0
    })
    
    setOrderModalVisible(true)
  }
  
  // 更新项目状态为"赢单"
  const handleMarkAsWon = async () => {
    try {
      await projectsAPI.update(id, { status: 'Won' })
      message.success('项目状态已更新为"赢单"！')
      await fetchProject()
    } catch (error) {
      console.error('更新项目状态失败:', error)
      message.error('更新失败: ' + (error.response?.data?.message || error.message))
    }
  }
  
  // 创建订单
  const handleCreateOrder = async (values) => {
    setCreatingOrder(true)
    
    try {
      console.log('🚀 正在从项目创建订单...')
      
      const response = await ordersAPI.createFromProject(id, values)
      
      console.log('✅ 订单创建成功:', response.data)
      
      message.success(`订单创建成功！订单编号: ${response.data.data.orderNumber}`)
      
      // 关闭Modal
      setOrderModalVisible(false)
      orderForm.resetFields()
      
      // 询问是否跳转到订单详情页
      Modal.confirm({
        title: '订单创建成功',
        content: `订单编号: ${response.data.data.orderNumber}。是否立即查看订单详情？`,
        okText: '查看订单',
        cancelText: '留在当前页',
        onOk: () => {
          navigate(`/orders/${response.data.data._id}`)
        }
      })
      
    } catch (error) {
      console.error('❌ 创建订单失败:', error)
      
      let errorMessage = '创建订单失败'
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      message.error(errorMessage)
    } finally {
      setCreatingOrder(false)
    }
  }
  
  // ========== AI优化建议函数 ==========
  
  // 获取AI优化建议
  const handleGetAISuggestion = async () => {
    if (!bomData || bomData.length === 0) {
      message.warning('BOM清单为空，无法获取AI建议')
      return
    }
    
    setLoadingAI(true)
    setAiModalVisible(true)
    setAiSuggestion('正在分析您的BOM清单，请稍候...')
    
    try {
      console.log('🤖 正在获取AI优化建议...')
      
      // 准备发送给后端的数据
      const bomDataToSend = bomData.map(({ key, ...rest }) => rest)
      
      const requestData = {
        bomData: bomDataToSend,
        projectInfo: {
          projectNumber: project?.projectNumber,
          projectName: project?.projectName,
          client: project?.client,
          industry: project?.industry,
          application: project?.application
        }
      }
      
      // 调用AI API
      const response = await aiAPI.optimizeBOM(requestData)
      
      console.log('✅ AI建议获取成功')
      
      // 设置AI建议内容
      setAiSuggestion(response.data.data.suggestion)
      
      message.success('AI优化建议已生成！')
    } catch (error) {
      console.error('❌ 获取AI建议失败:', error)
      
      // 根据错误类型显示不同的提示
      let errorMessage = 'AI优化建议失败'
      
      if (error.response?.status === 401) {
        errorMessage = 'OpenAI API密钥无效，请联系管理员配置'
      } else if (error.response?.status === 429) {
        errorMessage = error.response?.data?.message || 'API请求过于频繁或配额不足'
      } else if (error.response?.status === 504) {
        errorMessage = 'AI服务响应超时，请稍后重试'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      message.error(errorMessage)
      setAiSuggestion(`获取AI建议失败：${errorMessage}\n\n请检查：\n1. OpenAI API密钥是否已正确配置在后端.env文件中\n2. 网络连接是否正常\n3. OpenAI API配额是否充足`)
    } finally {
      setLoadingAI(false)
    }
  }
  
  // ========== BOM导出函数 ==========
  
  // 导出BOM为Excel
  const handleExportBOMToExcel = () => {
    if (!bomData || bomData.length === 0) {
      message.warning('BOM清单为空，无法导出')
      return
    }
    
    try {
      console.log('📊 导出BOM为Excel...')
      
      // 准备Excel数据
      const excelData = bomData.map((item, index) => ({
        '序号': index + 1,
        '执行器型号': item.actuator_model || '',
        '数量': item.total_quantity || 0,
        '单价 (¥)': item.unit_price || 0,
        '总价 (¥)': item.total_price || 0,
        '覆盖位号': Array.isArray(item.covered_tags) ? item.covered_tags.join(', ') : '',
        '备注': item.notes || ''
      }))
      
      // 添加统计行
      const totalQuantity = bomData.reduce((sum, item) => sum + (item.total_quantity || 0), 0)
      const totalPrice = bomData.reduce((sum, item) => sum + (item.total_price || 0), 0)
      
      excelData.push({
        '序号': '',
        '执行器型号': '合计',
        '数量': totalQuantity,
        '单价 (¥)': '',
        '总价 (¥)': totalPrice,
        '覆盖位号': '',
        '备注': ''
      })
      
      // 创建工作簿
      const ws = XLSX.utils.json_to_sheet(excelData)
      
      // 设置列宽
      ws['!cols'] = [
        { wch: 6 },  // 序号
        { wch: 20 }, // 执行器型号
        { wch: 8 },  // 数量
        { wch: 12 }, // 单价
        { wch: 12 }, // 总价
        { wch: 30 }, // 覆盖位号
        { wch: 20 }  // 备注
      ]
      
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'BOM清单')
      
      // 生成文件名
      const projectNumber = project?.projectNumber || 'PROJECT'
      const timestamp = dayjs().format('YYYYMMDD_HHmmss')
      const filename = `BOM清单_${projectNumber}_${timestamp}.xlsx`
      
      // 下载文件
      XLSX.writeFile(wb, filename)
      
      message.success(`Excel文件已导出: ${filename}`)
      console.log('✅ Excel导出成功')
    } catch (error) {
      console.error('导出Excel失败:', error)
      message.error('导出Excel失败: ' + error.message)
    }
  }
  
  // 导出BOM为PDF
  const handleExportBOMToPDF = () => {
    if (!bomData || bomData.length === 0) {
      message.warning('BOM清单为空，无法导出')
      return
    }
    
    try {
      console.log('📄 导出BOM为PDF...')
      
      // 创建PDF文档
      const doc = new jsPDF()
      
      // 设置中文字体（使用内置字体）
      doc.setFont('helvetica')
      
      // 添加标题
      doc.setFontSize(18)
      doc.text('BOM清单 / Bill of Materials', 14, 20)
      
      // 添加项目信息
      doc.setFontSize(10)
      const projectInfo = [
        `项目编号: ${project?.projectNumber || '-'}`,
        `项目名称: ${project?.projectName || '-'}`,
        `客户: ${project?.client?.name || '-'}`,
        `生成时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
      ]
      
      let yPos = 30
      projectInfo.forEach(info => {
        doc.text(info, 14, yPos)
        yPos += 6
      })
      
      // 准备表格数据
      const tableData = bomData.map((item, index) => [
        index + 1,
        item.actuator_model || '',
        item.total_quantity || 0,
        `¥${(item.unit_price || 0).toLocaleString()}`,
        `¥${(item.total_price || 0).toLocaleString()}`,
        Array.isArray(item.covered_tags) ? item.covered_tags.join(', ') : '',
        item.notes || ''
      ])
      
      // 添加统计行
      const totalQuantity = bomData.reduce((sum, item) => sum + (item.total_quantity || 0), 0)
      const totalPrice = bomData.reduce((sum, item) => sum + (item.total_price || 0), 0)
      
      tableData.push([
        '',
        '合计 / Total',
        totalQuantity,
        '',
        `¥${totalPrice.toLocaleString()}`,
        '',
        ''
      ])
      
      // 添加表格
      doc.autoTable({
        startY: yPos + 5,
        head: [['No.', 'Model', 'Qty', 'Unit Price', 'Total Price', 'Tags', 'Notes']],
        body: tableData,
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 15 },  // No.
          1: { cellWidth: 35 },  // Model
          2: { cellWidth: 20 },  // Qty
          3: { cellWidth: 25 },  // Unit Price
          4: { cellWidth: 25 },  // Total Price
          5: { cellWidth: 40 },  // Tags
          6: { cellWidth: 30 }   // Notes
        },
        // 最后一行（合计行）使用特殊样式
        didParseCell: function(data) {
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.fillColor = [240, 240, 240]
          }
        }
      })
      
      // 添加页脚
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() - 30,
          doc.internal.pageSize.getHeight() - 10
        )
      }
      
      // 生成文件名
      const projectNumber = project?.projectNumber || 'PROJECT'
      const timestamp = dayjs().format('YYYYMMDD_HHmmss')
      const filename = `BOM清单_${projectNumber}_${timestamp}.pdf`
      
      // 保存文件
      doc.save(filename)
      
      message.success(`PDF文件已导出: ${filename}`)
      console.log('✅ PDF导出成功')
    } catch (error) {
      console.error('导出PDF失败:', error)
      message.error('导出PDF失败: ' + error.message)
    }
  }

  // 选型列表列定义（适配新的选型系统）
  const selectionColumns = [
    {
      title: '位号 / Tag',
      dataIndex: 'tag_number',
      key: 'tag_number',
      render: (tag) => <Tag color="blue">{tag || '-'}</Tag>
    },
    {
      title: '执行器型号 / Actuator Model',
      key: 'actuator_model',
      render: (_, record) => (
        record.selected_actuator?.final_model_name || 
        record.selected_actuator?.recommended_model || 
        record.selected_actuator?.model_base || 
        '-'
      ),
    },
    {
      title: '系列 / Series',
      key: 'series',
      render: (_, record) => (
        <Tag color="green">{record.selected_actuator?.series || '-'}</Tag>
      ),
    },
    {
      title: '需求扭矩 / Required Torque',
      key: 'required_torque',
      render: (_, record) => (
        `${record.input_params?.required_torque || record.input_params?.valve_torque || 0} Nm`
      ),
    },
    {
      title: '实际扭矩 / Actual Torque',
      key: 'actual_torque',
      render: (_, record) => (
        `${record.selected_actuator?.actual_torque || 0} Nm`
      ),
    },
    {
      title: '总价 / Total Price',
      key: 'total_price',
      render: (_, record) => (
        <strong>¥{(record.total_price || 0).toLocaleString()}</strong>
      ),
    },
    {
      title: '状态 / Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          '待选型': 'default',
          '已选型': 'processing',
          '已确认': 'success',
          '已报价': 'cyan'
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      }
    },
    {
      title: '操作 / Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
          >
            查看
          </Button>
          {(canEdit || canDelete) && (
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveSelection(record._id)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ]

  // 可编辑的BOM列定义（根据权限动态生成）
  const editableBOMColumns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      fixed: 'left',
      render: (_, __, index) => index + 1,
    },
    {
      title: '执行器型号',
      dataIndex: 'actuator_model',
      key: 'actuator_model',
      width: 180,
      editable: true,
      render: (model, record) => {
        if (isEditing(record)) {
          return (
            <Form.Item
              name="actuator_model"
              style={{ margin: 0 }}
              rules={[{ required: true, message: '请输入型号' }]}
            >
              <Input placeholder="例如: SF050-DA" />
            </Form.Item>
          )
        }
        return <strong>{model || '-'}</strong>
      }
    },
    {
      title: '数量',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
      width: 100,
      editable: true,
      render: (qty, record) => {
        if (isEditing(record)) {
          return (
            <Form.Item
              name="total_quantity"
              style={{ margin: 0 }}
              rules={[{ required: true, message: '请输入数量' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          )
        }
        return <Tag color="blue">{qty}</Tag>
      }
    },
    // 单价列 - 仅有成本查看权限的角色可见
    ...(canSeeCost ? [{
      title: '单价 (¥)',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      editable: true,
      render: (price, record) => {
        if (isEditing(record)) {
          return (
            <Form.Item
              name="unit_price"
              style={{ margin: 0 }}
              rules={[{ required: true, message: '请输入单价' }]}
            >
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          )
        }
        return `¥${(price || 0).toLocaleString()}`
      }
    }] : []),
    // 总价列 - 仅有成本查看权限的角色可见
    ...(canSeeCost ? [{
      title: '总价 (¥)',
      dataIndex: 'total_price',
      key: 'total_price',
      width: 140,
      render: (price) => (
        <strong style={{ color: '#1890ff' }}>
          ¥{(price || 0).toLocaleString()}
        </strong>
      )
    }] : []),
    {
      title: '覆盖位号',
      dataIndex: 'covered_tags',
      key: 'covered_tags',
      width: 200,
      render: (tags) => {
        if (!tags || tags.length === 0) return '-'
        return (
          <Tooltip title={tags.join(', ')}>
            <Space size={4} wrap>
              {tags.slice(0, 2).map((tag, idx) => (
                <Tag key={idx} color="purple" style={{ margin: 0 }}>
                  {tag}
                </Tag>
              ))}
              {tags.length > 2 && (
                <Tag color="default" style={{ margin: 0 }}>
                  +{tags.length - 2}
                </Tag>
              )}
            </Space>
          </Tooltip>
        )
      },
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      editable: true,
      render: (notes, record) => {
        if (isEditing(record)) {
          return (
            <Form.Item
              name="notes"
              style={{ margin: 0 }}
            >
              <Input.TextArea 
                rows={1} 
                placeholder="备注信息"
                autoSize={{ minRows: 1, maxRows: 3 }}
              />
            </Form.Item>
          )
        }
        return notes || '-'
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const editable = isEditing(record)
        
        return editable ? (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleSaveEdit(record.key)}
            >
              保存
            </Button>
            <Button
              type="link"
              size="small"
              icon={<CloseOutlined />}
              onClick={handleCancelEdit}
            >
              取消
            </Button>
          </Space>
        ) : (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              disabled={editingKey !== ''}
              onClick={() => handleEditBOMRow(record)}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定删除此行吗？"
              onConfirm={() => handleDeleteBOMRow(record.key)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                size="small"
                icon={<DeleteOutlined />}
                disabled={editingKey !== ''}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]
  
  // 只读的BOM列定义（用于显示已保存的BOM，根据权限动态生成）
  const optimizedBOMColumns = [
    {
      title: '序号 / No.',
      key: 'index',
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: '执行器型号 / Actuator Model',
      dataIndex: 'actuator_model',
      key: 'actuator_model',
      render: (model) => <strong>{model}</strong>
    },
    {
      title: '数量 / Quantity',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
      width: 100,
      render: (qty) => <Tag color="blue">{qty}</Tag>
    },
    // 单价列 - 仅有成本查看权限的角色可见
    ...(canSeeCost ? [{
      title: '单价 / Unit Price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      render: (price) => `¥${price.toLocaleString()}`
    }] : []),
    // 总价列 - 仅有成本查看权限的角色可见
    ...(canSeeCost ? [{
      title: '总价 / Total Price',
      dataIndex: 'total_price',
      key: 'total_price',
      width: 140,
      render: (price) => <strong style={{ color: '#1890ff' }}>¥{price.toLocaleString()}</strong>
    }] : []),
    {
      title: '覆盖位号 / Covered Tags',
      dataIndex: 'covered_tags',
      key: 'covered_tags',
      render: (tags) => (
        <Tooltip title={tags.join(', ')}>
          <Space size={4} wrap>
            {tags.slice(0, 3).map((tag, idx) => (
              <Tag key={idx} color="purple" style={{ margin: 0 }}>
                {tag}
              </Tag>
            ))}
            {tags.length > 3 && (
              <Tag color="default" style={{ margin: 0 }}>
                +{tags.length - 3} more
              </Tag>
            )}
          </Space>
        </Tooltip>
      ),
    },
    {
      title: '备注 / Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes) => notes || '-'
    },
  ]

  if (loading) {
    return <div className="loading-container"><Spin size="large" /></div>
  }

  if (!project) {
    return <div>Project not found</div>
  }

  // 渲染工作流按钮（基于角色和项目状态）
  const renderWorkflowButtons = () => {
    if (!project) return null
    
    const buttons = []
    
    // 技术工程师 - 选型阶段
    if (user?.role === 'Technical Engineer' && ['In Progress', 'Planning'].includes(project.status)) {
      buttons.push(
        <RoleBasedAccess key="submit-design" allowedRoles={['Technical Engineer']}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '提交技术方案',
                content: '确定将技术选型方案提交给商务团队吗？',
                okText: '确认提交',
                cancelText: '取消',
                onOk: async () => {
                  try {
                    await projectsAPI.update(id, { status: 'Pending Quote' })
                    message.success('技术方案已提交！')
                    fetchProject()
                  } catch (error) {
                    message.error('提交失败')
                  }
                }
              })
            }}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            提交技术方案
          </Button>
        </RoleBasedAccess>
      )
    }
    
    // 销售工程师 - 报价阶段
    if (user?.role === 'Sales Engineer' && project.status === 'Pending Quote') {
      buttons.push(
        <RoleBasedAccess key="complete-quote" allowedRoles={['Sales Engineer']}>
          <Button
            type="primary"
            icon={<DollarOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '完成报价',
                content: '确定完成报价并通知销售经理审批吗？',
                okText: '确认完成',
                cancelText: '取消',
                onOk: async () => {
                  try {
                    await projectsAPI.update(id, { status: 'Pending Approval' })
                    message.success('报价已完成，等待审批！')
                    fetchProject()
                  } catch (error) {
                    message.error('操作失败')
                  }
                }
              })
            }}
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none'
            }}
          >
            完成报价
          </Button>
        </RoleBasedAccess>
      )
    }
    
    // 销售经理 - 审批和赢单
    if (user?.role === 'Sales Manager' || user?.role === 'Administrator') {
      if (project.status === 'Pending Approval') {
        buttons.push(
          <RoleBasedAccess key="approve" allowedRoles={['Sales Manager', 'Administrator']}>
            <Button
              type="primary"
              icon={<FileProtectOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: '审批报价',
                  content: '确定审批通过此报价方案吗？',
                  okText: '审批通过',
                  cancelText: '取消',
                  onOk: async () => {
                    try {
                      await projectsAPI.update(id, { status: 'Approved' })
                      message.success('报价已审批通过！')
                      fetchProject()
                    } catch (error) {
                      message.error('审批失败')
                    }
                  }
                })
              }}
              style={{
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                border: 'none'
              }}
            >
              审批报价
            </Button>
          </RoleBasedAccess>
        )
      }
      
      if (['Approved', 'Quoted'].includes(project.status)) {
        buttons.push(
          <RoleBasedAccess key="mark-won" allowedRoles={['Sales Manager', 'Administrator']}>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleMarkAsWon}
              style={{
                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                border: 'none'
              }}
            >
              标记为赢单
            </Button>
          </RoleBasedAccess>
        )
      }
      
      if (project.status === 'Won') {
        buttons.push(
          <RoleBasedAccess key="create-order" allowedRoles={['Sales Manager', 'Administrator']}>
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={handleOpenOrderModal}
              style={{
                background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
                border: 'none'
              }}
            >
              生成合同订单
            </Button>
          </RoleBasedAccess>
        )
      }
    }
    
    return buttons
  }

  return (
    <div>
      <Space style={{ marginBottom: 24 }} wrap>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>
          返回项目列表
        </Button>
        
        {/* 基础功能按钮 */}
        <RoleBasedAccess allowedRoles={['Administrator', 'Sales Engineer', 'Sales Manager']}>
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={handleGenerateQuotePDF}
            disabled={!project.selections || project.selections.length === 0}
          >
            生成报价单PDF
          </Button>
        </RoleBasedAccess>
        
        <RoleBasedAccess allowedRoles={['Administrator', 'Sales Engineer', 'Sales Manager']}>
          <Button
            icon={<FileTextOutlined />}
            onClick={() => setQuoteModalVisible(true)}
            disabled={!project.selections || project.selections.length === 0}
          >
            创建正式报价
          </Button>
        </RoleBasedAccess>
        
        {/* 工作流按钮（基于角色和项目状态动态显示） */}
        {renderWorkflowButtons()}
      </Space>

      <Card title="Project Information" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Project Number">{project.projectNumber}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={project.status === 'Completed' ? 'success' : 'processing'}>
              {project.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Project Name">{project.projectName}</Descriptions.Item>
          <Descriptions.Item label="Priority">
            <Tag color={project.priority === 'High' ? 'red' : 'default'}>{project.priority}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Client Name">{project.client.name}</Descriptions.Item>
          <Descriptions.Item label="Client Company">{project.client.company || '-'}</Descriptions.Item>
          <Descriptions.Item label="Client Email">{project.client.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="Client Phone">{project.client.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Industry">{project.industry || '-'}</Descriptions.Item>
          <Descriptions.Item label="Application">{project.application || '-'}</Descriptions.Item>
          <Descriptions.Item label="Created By">{project.createdBy?.name}</Descriptions.Item>
          <Descriptions.Item label="Created At">
            {dayjs(project.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          {project.description && (
            <Descriptions.Item label="Description" span={2}>{project.description}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Tabs
          defaultActiveKey="selections"
          items={[
            // Tab 1: 选型明细 - 所有人可见
            {
              key: 'selections',
              label: (
                <span>
                  <UnorderedListOutlined />
                  选型明细
                </span>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>选型列表 / Product Selections</h3>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/selection-engine')}>
                      新增选型
                    </Button>
                  </div>

                  {/* 优化按钮 */}
                  {project.selections && project.selections.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <Alert
                        message="💡 智能优化提示"
                        description="您可以使用智能优化算法将多个选型条目整合成精简的物料清单，降低采购成本并简化供应链管理。"
                        type="info"
                        showIcon
                        style={{ marginBottom: 12 }}
                      />
                      <Button
                        type="primary"
                        size="large"
                        icon={<ThunderboltOutlined />}
                        onClick={handleOptimize}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none',
                          height: '48px',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}
                      >
                        生成优化报价清单 (Optimize BOM)
                      </Button>
                    </div>
                  )}
                  
                  <Table
                    columns={selectionColumns}
                    dataSource={project.selections}
                    rowKey="_id"
                    pagination={false}
                  />
                  
                  {project.selections && project.selections.length > 0 && (
                    <div style={{ marginTop: 16, textAlign: 'right', fontSize: '16px', fontWeight: 'bold' }}>
                      原始选型总价 / Original Total: ¥{project.selections.reduce((total, sel) => 
                        total + (sel.total_price || 0), 0
                      ).toLocaleString()}
                    </div>
                  )}
                </div>
              ),
            },
            // Tab 2: BOM清单 - 仅特定角色可见
            ...(['Administrator', 'Sales Engineer', 'Sales Manager', 'Technical Engineer', 'Procurement Specialist'].includes(user?.role) ? [{
              key: 'bom',
              label: (
                <span>
                  <FileSearchOutlined />
                  BOM清单
                  {bomData.length > 0 && <Tag color="blue" style={{ marginLeft: 8 }}>{bomData.length}</Tag>}
                </span>
              ),
              children: (
                <div>
                  {/* 功能按钮区 */}
                  <div style={{ marginBottom: 16 }}>
                    <Alert
                      message="BOM清单管理"
                      description={`您可以${canEdit ? '从选型自动生成BOM清单，也可以手动添加、编辑或删除条目。' : '查看'}BOM清单。${canEdit ? '编辑完成后请点击"保存BOM"按钮保存到项目中。' : ''}`}
                      type="info"
                      showIcon
                      style={{ marginBottom: 12 }}
                    />
                    
                    <Space size="middle" wrap>
                      {/* 生成BOM按钮 - 技术工程师和销售工程师可用 */}
                      <RoleBasedAccess allowedRoles={['Administrator', 'Technical Engineer', 'Sales Engineer']}>
                        <Button
                          type="primary"
                          size="large"
                          icon={<ThunderboltOutlined />}
                          onClick={handleGenerateBOMFromSelections}
                          loading={generatingBOM}
                          disabled={!project?.selections || project.selections.length === 0}
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                          }}
                        >
                          从选型自动生成
                        </Button>
                      </RoleBasedAccess>
                      
                      {/* 手动添加行 - 可编辑角色 */}
                      {canEdit && (
                        <Button
                          icon={<PlusOutlined />}
                          onClick={handleAddBOMRow}
                          disabled={editingKey !== ''}
                        >
                          手动添加行
                        </Button>
                      )}
                      
                      {/* 保存BOM - 可编辑角色 */}
                      {canEdit && (
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          onClick={handleSaveBOM}
                          loading={savingBOM}
                          disabled={bomData.length === 0 || editingKey !== ''}
                        >
                          保存BOM
                        </Button>
                      )}
                      
                      {/* 导出下拉菜单 - 有查看成本权限的角色可导出 */}
                      {canSeeCost && (
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: 'excel',
                                label: '导出为Excel',
                                icon: <FileExcelOutlined />,
                                onClick: handleExportBOMToExcel
                              },
                              {
                                key: 'pdf',
                                label: '导出为PDF',
                                icon: <FilePdfOutlined />,
                                onClick: handleExportBOMToPDF
                              }
                            ]
                          }}
                          disabled={bomData.length === 0}
                        >
                          <Button icon={<DownloadOutlined />}>
                            <Space>
                              导出BOM
                              <DownOutlined />
                            </Space>
                          </Button>
                        </Dropdown>
                      )}
                      
                      {/* 生成报价单PDF - 销售相关角色可用 */}
                      <RoleBasedAccess allowedRoles={['Administrator', 'Sales Engineer', 'Sales Manager']}>
                        <Button
                          icon={<FilePdfOutlined />}
                          onClick={handleGenerateQuotePDF}
                          disabled={bomData.length === 0}
                        >
                          生成报价单PDF
                        </Button>
                      </RoleBasedAccess>
                      
                      {/* 历史版本 - 所有人可查看 */}
                      <Button
                        icon={<HistoryOutlined />}
                        onClick={handleOpenVersionComparison}
                        disabled={bomVersions.length === 0}
                      >
                        历史版本与对比
                        {bomVersions.length > 0 && <Tag color="blue" style={{ marginLeft: 4 }}>{bomVersions.length}</Tag>}
                      </Button>
                      
                      {/* AI优化建议 - 技术和销售工程师可用 */}
                      <RoleBasedAccess allowedRoles={['Administrator', 'Technical Engineer', 'Sales Engineer']}>
                        <Button
                          type="primary"
                          icon={<BulbOutlined />}
                          onClick={handleGetAISuggestion}
                          disabled={bomData.length === 0}
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                          }}
                        >
                          AI优化建议
                        </Button>
                      </RoleBasedAccess>
                      
                      {/* 清空BOM - 仅管理员可用 */}
                      {bomData.length > 0 && canDelete && (
                        <Popconfirm
                          title="确定清空所有BOM数据吗？此操作不可恢复！"
                          onConfirm={() => {
                            setBomData([])
                            message.success('已清空BOM数据')
                          }}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button danger icon={<DeleteOutlined />}>
                            清空BOM
                          </Button>
                        </Popconfirm>
                      )}
                    </Space>
                  </div>
                  
                  {/* 可编辑的BOM表格 */}
                  {bomData.length > 0 ? (
                    <div>
                      <Form form={bomForm} component={false}>
                        <Table
                          columns={canEdit ? editableBOMColumns : editableBOMColumns.filter(col => col.key !== 'actions')}
                          dataSource={bomData}
                          rowKey="key"
                          pagination={false}
                          bordered
                          scroll={{ x: 1200 }}
                          rowClassName={(record) => 
                            isEditing(record) ? 'editable-row-editing' : ''
                          }
                        />
                      </Form>
                      
                      <Divider />
                      
                      {/* 统计信息 */}
                      <div style={{ textAlign: 'right' }}>
                        <Space size="large">
                          <Statistic
                            title="型号数"
                            value={bomData.length}
                            suffix="个"
                          />
                          <Statistic
                            title="总数量"
                            value={bomData.reduce((sum, item) => sum + (item.total_quantity || 0), 0)}
                            suffix="台"
                          />
                          <Statistic
                            title="总价"
                            value={bomData.reduce((sum, item) => sum + (item.total_price || 0), 0)}
                            prefix="¥"
                            valueStyle={{ color: '#3f8600' }}
                          />
                        </Space>
                      </div>
                    </div>
                  ) : (
                    <Alert
                      message="暂无BOM数据"
                      description={
                        <div>
                          <p>您可以通过以下方式添加BOM数据：</p>
                          <ul style={{ marginBottom: 0 }}>
                            <li>点击"从选型自动生成"按钮，系统将使用优化算法自动生成BOM清单</li>
                            <li>点击"手动添加行"按钮，手动创建BOM条目</li>
                          </ul>
                        </div>
                      }
                      type="warning"
                      showIcon
                    />
                  )}
                </div>
              ),
            }] : []),
            // Tab 3: 项目文件 - 所有人可见
            {
              key: 'files',
              label: (
                <span>
                  <FolderOutlined />
                  项目文件
                  {project.documents && project.documents.length > 0 && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>{project.documents.length}</Tag>
                  )}
                </span>
              ),
              children: (
                <div>
                  <Alert
                    message="项目文件管理"
                    description="您可以上传与此项目相关的文档、图纸、合同等文件。文件将存储在云端，团队成员可以随时访问。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  
                  {canEdit && (
                    <div style={{ marginBottom: 16 }}>
                      <CloudUpload
                        onSuccess={async (fileData) => {
                          try {
                            await axios.post(`/api/projects/${id}/add-file`, {
                              file_name: fileData.name,
                              file_url: fileData.url,
                            });
                            message.success('文件已关联到项目！');
                            fetchProject();
                          } catch (error) {
                            message.error('关联文件失败: ' + (error.response?.data?.message || error.message));
                          }
                        }}
                      >
                        <Button icon={<UploadOutlined />} type="primary">
                          上传项目文件
                        </Button>
                      </CloudUpload>
                    </div>
                  )}
                  
                  {project.documents && project.documents.length > 0 ? (
                    <List
                      dataSource={project.documents}
                      renderItem={(doc) => (
                        <List.Item
                          actions={[
                            <Button
                              type="link"
                              icon={<EyeOutlined />}
                              onClick={() => window.open(doc.url, '_blank')}
                            >
                              查看
                            </Button>,
                            <Button
                              type="link"
                              icon={<DownloadOutlined />}
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = doc.url;
                                link.download = doc.name;
                                link.click();
                              }}
                            >
                              下载
                            </Button>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                            title={doc.name}
                            description={
                              <Space direction="vertical" size={0}>
                                {doc.description && <span>{doc.description}</span>}
                                <span style={{ fontSize: 12, color: '#999' }}>
                                  上传时间: {dayjs(doc.uploadedAt).format('YYYY-MM-DD HH:mm')}
                                </span>
                                {doc.uploadedBy && (
                                  <span style={{ fontSize: 12, color: '#999' }}>
                                    上传者: {doc.uploadedBy.name || '未知'}
                                  </span>
                                )}
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Alert
                      message="暂无项目文件"
                      description={canEdit ? "点击'上传项目文件'按钮开始上传文档。" : "暂时还没有上传任何文件。"}
                      type="warning"
                      showIcon
                    />
                  )}
                </div>
              ),
            },
          ].filter(Boolean)}
        />
      </Card>

      {project.quotes && project.quotes.length > 0 && (
        <Card title="Related Quotes">
          <Space direction="vertical" style={{ width: '100%' }}>
            {project.quotes.map((quote) => (
              <Card
                key={quote._id}
                size="small"
                onClick={() => navigate(`/quotes/${quote._id}`)}
                style={{ cursor: 'pointer' }}
                hoverable
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>{quote.quoteNumber}</strong></span>
                  <Tag>{quote.status}</Tag>
                </div>
              </Card>
            ))}
          </Space>
        </Card>
      )}

      <Modal
        title="Generate Quote"
        open={quoteModalVisible}
        onCancel={() => {
          setQuoteModalVisible(false)
          quoteForm.resetFields()
        }}
        onOk={() => quoteForm.submit()}
        width={600}
      >
        <Form
          form={quoteForm}
          layout="vertical"
          onFinish={handleCreateQuote}
        >
          <Form.Item
            name="taxRate"
            label="Tax Rate (%)"
            initialValue={0}
          >
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>

          <Form.Item
            name="shippingCost"
            label="Shipping Cost"
            initialValue={0}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>

          <Form.Item
            name="shippingMethod"
            label="Shipping Method"
            initialValue="Standard"
          >
            <Input placeholder="e.g., Standard, Express" />
          </Form.Item>

          <Form.Item
            name="paymentTerms"
            label="Payment Terms"
            initialValue="Net 30"
          >
            <Input placeholder="e.g., Net 30, Net 60" />
          </Form.Item>

          <Form.Item
            name="deliveryTerms"
            label="Delivery Terms"
            initialValue="FOB Factory"
          >
            <Input placeholder="e.g., FOB, CIF" />
          </Form.Item>

          <Form.Item
            name="warranty"
            label="Warranty"
            initialValue="12 months from delivery"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="externalNotes"
            label="External Notes (visible to client)"
          >
            <TextArea rows={3} placeholder="Notes for the client" />
          </Form.Item>

          <Form.Item
            name="internalNotes"
            label="Internal Notes"
          >
            <TextArea rows={3} placeholder="Internal notes (not visible to client)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 优化结果模态框 */}
      <Modal
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#667eea' }} />
            <span>优化报价清单 / Optimized BOM</span>
          </Space>
        }
        open={optimizationModalVisible}
        onCancel={() => setOptimizationModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setOptimizationModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            loading={savingOptimization}
            onClick={handleSaveOptimization}
          >
            确认并保存
          </Button>,
        ]}
        width={1000}
      >
        {optimizationResult && (
          <div>
            {/* 统计信息 */}
            <Alert
              message={optimizationResult.statistics.message}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="原始选型数"
                    value={optimizationResult.statistics.original_count}
                    suffix="个"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="优化后型号数"
                    value={optimizationResult.statistics.optimized_count}
                    suffix="个"
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="合并率"
                    value={optimizationResult.statistics.consolidation_rate}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="优化后总价"
                    value={optimizationResult.statistics.total_price}
                    prefix="¥"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>

            <Divider>优化后的物料清单</Divider>

            {/* 优化后的BOM表格 */}
            <Table
              columns={optimizedBOMColumns}
              dataSource={optimizationResult.optimized_bill_of_materials}
              rowKey={(record, index) => `opt_${record.actuator_model}_${index}`}
              pagination={false}
              style={{ marginBottom: 16 }}
            />

            <Alert
              message="💡 保存提示"
              description="点击'确认并保存'按钮后，优化结果将保存到项目中，可用于生成报价单和PDF文档。"
              type="info"
              showIcon
            />
          </div>
        )}
      </Modal>

      {/* BOM版本历史与对比Modal */}
      <Modal
        title={
          <Space>
            <HistoryOutlined style={{ color: '#1890ff' }} />
            <span>BOM版本历史与对比</span>
          </Space>
        }
        open={versionModalVisible}
        onCancel={() => {
          setVersionModalVisible(false)
          setSelectedVersions([])
        }}
        width={1200}
        footer={null}
        bodyStyle={{ padding: '24px' }}
      >
        <Row gutter={24}>
          {/* 左侧：版本列表 */}
          <Col span={8}>
            <Card 
              title={
                <Space>
                  <HistoryOutlined />
                  <span>历史版本列表</span>
                  <Tag color="blue">{bomVersions.length} 个版本</Tag>
                </Space>
              }
              size="small"
              style={{ height: '600px', overflow: 'auto' }}
            >
              <Alert
                message="选择版本"
                description="勾选最多2个版本进行对比，或点击'恢复'按钮恢复到指定版本"
                type="info"
                showIcon
                style={{ marginBottom: 12 }}
              />
              
              <Space direction="vertical" style={{ width: '100%' }}>
                {[...bomVersions].reverse().map((version) => (
                  <Card
                    key={version.version_number}
                    size="small"
                    hoverable
                    style={{
                      borderColor: selectedVersions.includes(version.version_number) ? '#1890ff' : '#d9d9d9',
                      borderWidth: selectedVersions.includes(version.version_number) ? 2 : 1
                    }}
                    bodyStyle={{ padding: 12 }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size={4}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                          <Typography.Text strong style={{ fontSize: 16 }}>
                            版本 {version.version_number}
                          </Typography.Text>
                          <input
                            type="checkbox"
                            checked={selectedVersions.includes(version.version_number)}
                            onChange={() => handleSelectVersion(version.version_number)}
                            style={{ cursor: 'pointer' }}
                          />
                        </Space>
                        <Button
                          type="link"
                          size="small"
                          icon={<SwapOutlined />}
                          onClick={() => handleRestoreVersion(version.version_number)}
                        >
                          恢复
                        </Button>
                      </Space>
                      
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(version.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                      </Typography.Text>
                      
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        创建者: {version.created_by}
                      </Typography.Text>
                      
                      {version.description && (
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {version.description}
                        </Typography.Text>
                      )}
                      
                      <Divider style={{ margin: '8px 0' }} />
                      
                      <Space>
                        <Tag color="blue">{version.statistics?.total_models || 0} 个型号</Tag>
                        <Tag color="green">{version.statistics?.total_quantity || 0} 台</Tag>
                        <Tag color="orange">¥{(version.statistics?.total_price || 0).toLocaleString()}</Tag>
                      </Space>
                    </Space>
                  </Card>
                ))}
              </Space>
            </Card>
          </Col>

          {/* 右侧：版本对比 */}
          <Col span={16}>
            {selectedVersions.length === 0 && (
              <Alert
                message="请选择版本"
                description="从左侧选择1-2个版本查看详情或进行对比"
                type="info"
                showIcon
                style={{ marginTop: 100 }}
              />
            )}
            
            {selectedVersions.length === 1 && (() => {
              const version = bomVersions.find(v => v.version_number === selectedVersions[0])
              return (
                <Card title={`版本 ${version.version_number} 详情`} size="small">
                  <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="版本号">{version.version_number}</Descriptions.Item>
                    <Descriptions.Item label="创建时间">
                      {dayjs(version.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="创建者">{version.created_by}</Descriptions.Item>
                    <Descriptions.Item label="型号数">{version.statistics?.total_models}</Descriptions.Item>
                    <Descriptions.Item label="总数量">{version.statistics?.total_quantity}</Descriptions.Item>
                    <Descriptions.Item label="总价">¥{(version.statistics?.total_price || 0).toLocaleString()}</Descriptions.Item>
                  </Descriptions>
                  
                  <Table
                    columns={[
                      { title: '序号', key: 'index', width: 60, render: (_, __, index) => index + 1 },
                      { title: '执行器型号', dataIndex: 'actuator_model', key: 'actuator_model' },
                      { title: '数量', dataIndex: 'total_quantity', key: 'total_quantity', width: 80 },
                      { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 100, render: (price) => `¥${(price || 0).toLocaleString()}` },
                      { title: '总价', dataIndex: 'total_price', key: 'total_price', width: 120, render: (price) => <strong>¥{(price || 0).toLocaleString()}</strong> },
                    ]}
                    dataSource={version.bom_data}
                    rowKey={(record, index) => `${record.actuator_model}_${index}`}
                    pagination={false}
                    size="small"
                    scroll={{ y: 400 }}
                  />
                </Card>
              )
            })()}
            
            {selectedVersions.length === 2 && (() => {
              const version1 = bomVersions.find(v => v.version_number === selectedVersions[0])
              const version2 = bomVersions.find(v => v.version_number === selectedVersions[1])
              const differences = compareBOMVersions(version1.bom_data, version2.bom_data)
              
              return (
                <div>
                  <Alert
                    message="版本对比"
                    description={`对比版本 ${version1.version_number} 和版本 ${version2.version_number}，差异已高亮显示`}
                    type="success"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  
                  {/* 差异统计 */}
                  <Space style={{ marginBottom: 16 }}>
                    <Tag color="green">新增: {differences.added.length}</Tag>
                    <Tag color="red">删除: {differences.removed.length}</Tag>
                    <Tag color="orange">修改: {differences.modified.length}</Tag>
                  </Space>
                  
                  <Row gutter={16}>
                    {/* 版本1 */}
                    <Col span={12}>
                      <Card 
                        title={`版本 ${version1.version_number}`} 
                        size="small"
                        style={{ marginBottom: 16 }}
                      >
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(version1.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                        </Typography.Text>
                        <Table
                          columns={[
                            { title: '型号', dataIndex: 'actuator_model', key: 'actuator_model', width: 120 },
                            { title: '数量', dataIndex: 'total_quantity', key: 'total_quantity', width: 60 },
                            { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 80, render: (price) => `¥${(price || 0).toLocaleString()}` },
                          ]}
                          dataSource={version1.bom_data}
                          rowKey={(record, index) => `v1_${record.actuator_model}_${index}`}
                          pagination={false}
                          size="small"
                          scroll={{ y: 400 }}
                          rowClassName={(record) => {
                            const model = record.actuator_model
                            if (differences.removed.find(r => r.actuator_model === model)) {
                              return 'version-diff-removed'
                            }
                            if (differences.modified.find(m => m.model === model)) {
                              return 'version-diff-modified'
                            }
                            return ''
                          }}
                        />
                      </Card>
                    </Col>
                    
                    {/* 版本2 */}
                    <Col span={12}>
                      <Card 
                        title={`版本 ${version2.version_number}`} 
                        size="small"
                        style={{ marginBottom: 16 }}
                      >
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(version2.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                        </Typography.Text>
                        <Table
                          columns={[
                            { title: '型号', dataIndex: 'actuator_model', key: 'actuator_model', width: 120 },
                            { title: '数量', dataIndex: 'total_quantity', key: 'total_quantity', width: 60 },
                            { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 80, render: (price) => `¥${(price || 0).toLocaleString()}` },
                          ]}
                          dataSource={version2.bom_data}
                          rowKey={(record, index) => `v2_${record.actuator_model}_${index}`}
                          pagination={false}
                          size="small"
                          scroll={{ y: 400 }}
                          rowClassName={(record) => {
                            const model = record.actuator_model
                            if (differences.added.find(a => a.actuator_model === model)) {
                              return 'version-diff-added'
                            }
                            if (differences.modified.find(m => m.model === model)) {
                              return 'version-diff-modified'
                            }
                            return ''
                          }}
                        />
                      </Card>
                    </Col>
                  </Row>
                  
                  {/* 差异详情 */}
                  {(differences.added.length > 0 || differences.removed.length > 0 || differences.modified.length > 0) && (
                    <Card title="差异详情" size="small">
                      {differences.added.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <Typography.Text strong>新增项 ({differences.added.length}):</Typography.Text>
                          <ul>
                            {differences.added.map((item, index) => (
                              <li key={index} style={{ color: '#52c41a' }}>
                                {item.actuator_model} - 数量: {item.total_quantity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {differences.removed.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <Typography.Text strong>删除项 ({differences.removed.length}):</Typography.Text>
                          <ul>
                            {differences.removed.map((item, index) => (
                              <li key={index} style={{ color: '#ff4d4f' }}>
                                {item.actuator_model} - 数量: {item.total_quantity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {differences.modified.length > 0 && (
                        <div>
                          <Typography.Text strong>修改项 ({differences.modified.length}):</Typography.Text>
                          <ul>
                            {differences.modified.map((item, index) => (
                              <li key={index} style={{ color: '#fa8c16' }}>
                                <strong>{item.model}:</strong>
                                {item.old.total_quantity !== item.new.total_quantity && (
                                  <span> 数量: {item.old.total_quantity} → {item.new.total_quantity}</span>
                                )}
                                {item.old.unit_price !== item.new.unit_price && (
                                  <span> 单价: ¥{item.old.unit_price} → ¥{item.new.unit_price}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              )
            })()}
          </Col>
        </Row>
      </Modal>

      {/* AI优化建议Modal */}
      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#667eea', fontSize: 20 }} />
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>AI 优化建议</span>
          </Space>
        }
        open={aiModalVisible}
        onCancel={() => setAiModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setAiModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={900}
        bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
      >
        {loadingAI ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#666' }}>
              AI正在分析您的BOM清单，请稍候...
            </div>
          </div>
        ) : (
          <div>
            <Alert
              message="💡 提示"
              description="以下建议由AI生成，仅供参考。请结合实际情况进行判断和决策。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Card
              style={{ 
                background: '#f9f9f9',
                border: '1px solid #e8e8e8'
              }}
            >
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8 }}>
                {aiSuggestion}
              </Typography.Paragraph>
            </Card>
            
            {aiSuggestion && !aiSuggestion.includes('获取AI建议失败') && (
              <Alert
                message="如何使用这些建议？"
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                    <li>仔细评估AI提出的每个优化点</li>
                    <li>与您的技术团队讨论可行性</li>
                    <li>考虑实际应用场景和客户需求</li>
                    <li>在BOM清单中进行相应调整</li>
                    <li>保存修改后重新生成报价单</li>
                  </ul>
                }
                type="success"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        )}
      </Modal>

      {/* 订单生成Modal */}
      <Modal
        title={
          <Space>
            <ShoppingCartOutlined style={{ color: '#1890ff', fontSize: 20 }} />
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>生成合同订单</span>
          </Space>
        }
        open={orderModalVisible}
        onCancel={() => {
          setOrderModalVisible(false)
          orderForm.resetFields()
        }}
        onOk={() => orderForm.submit()}
        confirmLoading={creatingOrder}
        okText="创建订单"
        cancelText="取消"
        width={700}
      >
        <Alert
          message="提示"
          description="系统将基于当前项目的BOM清单创建销售订单。请填写订单相关信息。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={orderForm}
          layout="vertical"
          onFinish={handleCreateOrder}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="requestedDeliveryDate"
                label="要求交付日期"
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="shippingMethod"
                label="运输方式"
                rules={[{ required: true, message: '请输入运输方式' }]}
              >
                <Input placeholder="例如: Standard, Express" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="shippingAddress"
            label="交付地址"
            rules={[{ required: true, message: '请输入交付地址' }]}
          >
            <TextArea rows={2} placeholder="请输入详细的交付地址" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="deliveryTerms"
                label="交付条款"
                rules={[{ required: true, message: '请输入交付条款' }]}
              >
                <Input placeholder="例如: FOB, CIF" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="paymentTerms"
                label="付款条款"
                rules={[{ required: true, message: '请输入付款条款' }]}
              >
                <Input placeholder="例如: Net 30, Net 60" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>财务信息</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="taxRate"
                label="税率 (%)"
                rules={[{ required: true, message: '请输入税率' }]}
              >
                <InputNumber 
                  min={0} 
                  max={100} 
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="13"
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="shippingCost"
                label="运费 (¥)"
              >
                <InputNumber 
                  min={0} 
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="discount"
                label="折扣 (¥)"
              >
                <InputNumber 
                  min={0} 
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="specialRequirements"
            label="特殊要求"
          >
            <TextArea rows={3} placeholder="请输入特殊要求（可选）" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="订单备注"
          >
            <TextArea rows={2} placeholder="客户可见的订单备注（可选）" />
          </Form.Item>

          <Form.Item
            name="internalNotes"
            label="内部备注"
          >
            <TextArea rows={2} placeholder="内部备注，客户不可见（可选）" />
          </Form.Item>
        </Form>

        {/* 显示BOM摘要 */}
        {project && (project.optimized_bill_of_materials || project.bill_of_materials) && (
          <Card 
            title="BOM清单摘要" 
            size="small" 
            style={{ marginTop: 16, background: '#fafafa' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>物料数量:</strong> {(project.optimized_bill_of_materials || project.bill_of_materials || []).length} 个型号
              </div>
              <div>
                <strong>总台数:</strong> {(project.optimized_bill_of_materials || project.bill_of_materials || []).reduce((sum, item) => 
                  sum + (item.total_quantity || item.quantity || 0), 0
                )} 台
              </div>
              <div>
                <strong>小计金额:</strong> ¥{(project.optimized_bill_of_materials || project.bill_of_materials || []).reduce((sum, item) => 
                  sum + (item.total_price || 0), 0
                ).toLocaleString()}
              </div>
            </Space>
          </Card>
        )}
      </Modal>
    </div>
  )
}

export default ProjectDetails


