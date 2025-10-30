import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Table, Button, Tag, Space, Spin, message, Modal, Form, InputNumber, Input, Tooltip, Divider, Statistic, Row, Col, Alert, Tabs, Typography, Popconfirm, Dropdown, List, Radio, Select, Checkbox, Timeline } from 'antd'
import { ArrowLeftOutlined, FileTextOutlined, PlusOutlined, DeleteOutlined, ThunderboltOutlined, SaveOutlined, EyeOutlined, FilePdfOutlined, UnorderedListOutlined, FileSearchOutlined, EditOutlined, CheckOutlined, CloseOutlined, FileExcelOutlined, DownloadOutlined, DownOutlined, HistoryOutlined, SwapOutlined, BulbOutlined, RobotOutlined, ShoppingCartOutlined, CheckCircleOutlined, SendOutlined, DollarOutlined, FileProtectOutlined, UploadOutlined, FolderOutlined, SettingOutlined, TagsOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons'
import { projectsAPI, quotesAPI, aiAPI, ordersAPI, contractsAPI, productionAPI } from '../services/api'
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
import AssignTechnicalSupport from '../components/AssignTechnicalSupport'
import TechnicalItemList from '../components/TechnicalItemList'
import ContractVersionHistory from '../components/ContractVersionHistory' // 🔒 合同版本历史组件
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
  
  // 🔒 销售经理权限：状态判断辅助函数
  const isSalesManager = user?.role === 'Sales Manager'
  
  // 🔒 技术编辑权限：销售经理不可编辑选型和BOM
  const canEditTechnical = user && ['Administrator', 'Technical Engineer', 'Sales Engineer'].includes(user.role)
  
  // 判断项目是否处于技术选型阶段（销售经理不可见技术清单）
  const isInTechnicalPhase = ['草稿', '进行中', '选型进行中', '已提交审核', '选型修正中'].includes(project?.project_status)
  
  // 判断项目是否已到达待商务报价阶段（销售经理可查看只读技术清单）
  const isReadyForQuotation = ['待商务报价', '已报价', '已确认', '已完成', 'Won', 'Lost'].includes(project?.project_status)
  
  // 判断项目是否已完成报价（销售经理可查看只读报价工作台）
  const isQuotationComplete = ['已报价', '已确认', '已完成', 'Won', 'Lost'].includes(project?.project_status)
  
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
  
  // 报价工作台状态
  const [quotationBomData, setQuotationBomData] = useState([]) // 报价BOM数据
  const [quotationEditingKey, setQuotationEditingKey] = useState('') // 当前编辑的行
  const [quotationForm] = Form.useForm() // 报价BOM编辑表单
  const [savingQuotation, setSavingQuotation] = useState(false) // 保存报价BOM状态
  const [generatingQuotation, setGeneratingQuotation] = useState(false) // 生成报价BOM状态
  const [pricingModalVisible, setPricingModalVisible] = useState(false) // 价格策略Modal
  const [currentPricingItem, setCurrentPricingItem] = useState(null) // 当前配置价格的项
  const [pricingForm] = Form.useForm() // 价格策略表单
  const [quotationBasedOnVersion, setQuotationBasedOnVersion] = useState(null) // 🔒 报价基于的技术清单版本
  
  // 合同处理状态
  const [uploadingContract, setUploadingContract] = useState(false) // 上传合同状态
  const [contractFileList, setContractFileList] = useState([]) // 合同文件列表
  
  // 生产订单创建状态
  const [paymentConfirmed, setPaymentConfirmed] = useState(false) // 是否确认收到预付款
  const [creatingProduction, setCreatingProduction] = useState(false) // 创建生产订单中
  
  // 🔒 技术清单版本管理状态
  const [technicalVersions, setTechnicalVersions] = useState([]) // 技术清单版本列表
  const [currentTechnicalVersion, setCurrentTechnicalVersion] = useState(null) // 当前活动版本
  const [technicalListLocked, setTechnicalListLocked] = useState(false) // 是否锁定
  const [modificationRequests, setModificationRequests] = useState([]) // 修改建议列表
  const [rejectModalVisible, setRejectModalVisible] = useState(false) // 驳回Modal
  const [rejectForm] = Form.useForm() // 驳回表单
  const [versionHistoryModalVisible, setVersionHistoryModalVisible] = useState(false) // 版本历史Modal
  const [modificationRequestModalVisible, setModificationRequestModalVisible] = useState(false) // 修改建议Modal
  
  // 🔒 合同版本历史和操作历史状态
  const [contractVersionHistoryVisible, setContractVersionHistoryVisible] = useState(false) // 合同版本历史Modal
  const [operationHistoryVisible, setOperationHistoryVisible] = useState(false) // 操作历史Modal
  
  // 🔒 项目锁定状态
  const [isProjectLocked, setIsProjectLocked] = useState(false) // 项目是否已锁定
  const [lockedReason, setLockedReason] = useState('') // 锁定原因

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
    
    // 加载报价BOM数据
    if (project?.quotation_bom) {
      const quotationDataWithKeys = project.quotation_bom.map((item, index) => ({
        ...item,
        key: `quotation_${index}_${item.model_name}`,
      }))
      setQuotationBomData(quotationDataWithKeys)
    }
    
    // 🔒 设置报价基于的版本号
    if (project?.quotation_based_on_version) {
      setQuotationBasedOnVersion(project.quotation_based_on_version)
    }
    
    // 🔒 设置项目锁定状态
    if (project?.is_locked) {
      setIsProjectLocked(true)
      setLockedReason(project.locked_reason || '已转化为合同订单')
    } else {
      setIsProjectLocked(false)
      setLockedReason('')
    }
  }, [project])

  const fetchProject = async () => {
    try {
      const response = await projectsAPI.getById(id)
      // 🔧 修复：后端返回格式是 { success: true, data: project }
      const projectData = response.data.data || response.data
      setProject(projectData)
      
      // 🔒 加载技术清单版本信息
      if (projectData.technical_list_versions) {
        setTechnicalVersions(projectData.technical_list_versions || [])
        setCurrentTechnicalVersion(projectData.current_technical_version)
        setTechnicalListLocked(projectData.technical_list_locked || false)
      }
      
      // 🔒 加载修改建议
      if (projectData.modification_requests) {
        setModificationRequests(projectData.modification_requests || [])
      }
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
  
  // 🔒 ========== 技术清单版本管理函数 ==========
  
  // 技术工程师提交技术清单
  const handleSubmitTechnicalList = async () => {
    if (!project.selections || project.selections.length === 0) {
      message.warning('暂无选型数据，无法提交技术清单')
      return
    }
    
    try {
      const response = await projectsAPI.submitTechnicalList(id, '技术清单提交审核')
      message.success(response.data.message || '技术清单已提交并锁定')
      await fetchProject()
    } catch (error) {
      message.error(error.response?.data?.message || '提交技术清单失败')
    }
  }
  
  // 商务工程师驳回技术清单
  const handleRejectTechnicalList = async (values) => {
    try {
      const suggestions = values.suggestions || []
      await projectsAPI.rejectTechnicalList(id, suggestions, currentTechnicalVersion)
      message.success('技术清单已驳回，修改建议已发送给技术工程师')
      setRejectModalVisible(false)
      rejectForm.resetFields()
      await fetchProject()
    } catch (error) {
      message.error(error.response?.data?.message || '驳回技术清单失败')
    }
  }
  
  // 技术工程师回复修改建议
  const handleRespondToModification = async (requestId, accept) => {
    try {
      await projectsAPI.respondToModification(id, requestId, accept ? '已接受修改建议' : '已拒绝修改建议', accept)
      message.success(accept ? '已接受修改建议' : '已拒绝修改建议')
      await fetchProject()
    } catch (error) {
      message.error(error.response?.data?.message || '回复修改建议失败')
    }
  }
  
  // 商务工程师确认技术清单版本
  const handleConfirmTechnicalVersion = async (version) => {
    try {
      await projectsAPI.confirmTechnicalVersion(id, version)
      message.success(`技术清单版本 ${version} 已确认`)
      await fetchProject()
    } catch (error) {
      message.error(error.response?.data?.message || '确认技术清单版本失败')
    }
  }
  
  // 查看版本历史
  const handleViewVersionHistory = () => {
    setVersionHistoryModalVisible(true)
  }
  
  // 查看修改建议
  const handleViewModificationRequests = () => {
    setModificationRequestModalVisible(true)
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

  // ========== 技术清单导出函数（仅含型号、数量、技术描述，不含价格）==========
  
  // 导出技术清单为Excel（技术工程师用，不含价格）
  const handleExportTechnicalListToExcel = () => {
    const selectionsData = project?.selections || []
    
    if (selectionsData.length === 0) {
      message.warning('暂无选型数据，无法导出技术清单')
      return
    }
    
    try {
      console.log('📊 导出技术清单为Excel（不含价格）...')
      
      // 准备Excel数据
      const excelData = selectionsData.map((selection, index) => ({
        '序号': index + 1,
        '位号 Tag': selection.tag_number || '-',
        '执行器型号 Model': selection.selected_actuator?.final_model_name || 
                           selection.selected_actuator?.recommended_model || 
                           selection.selected_actuator?.model_base || '-',
        '系列 Series': selection.selected_actuator?.series || '-',
        '数量 Qty': 1,
        '需求扭矩 Nm': selection.input_params?.required_torque || 
                      selection.input_params?.valve_torque || '-',
        '实际扭矩 Nm': selection.selected_actuator?.actual_torque || '-',
        '阀门类型': selection.input_params?.valve_type || '-',
        '阀门尺寸': selection.input_params?.valve_size || '-',
        '技术备注': selection.notes || ''
      }))
      
      // 创建工作簿
      const ws = XLSX.utils.json_to_sheet(excelData)
      
      // 设置列宽
      ws['!cols'] = [
        { wch: 6 },   // 序号
        { wch: 15 },  // 位号
        { wch: 25 },  // 执行器型号
        { wch: 12 },  // 系列
        { wch: 8 },   // 数量
        { wch: 12 },  // 需求扭矩
        { wch: 12 },  // 实际扭矩
        { wch: 15 },  // 阀门类型
        { wch: 12 },  // 阀门尺寸
        { wch: 30 }   // 技术备注
      ]
      
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '技术清单')
      
      // 生成文件名
      const projectNumber = project?.projectNumber || 'PROJECT'
      const timestamp = dayjs().format('YYYYMMDD_HHmmss')
      const filename = `技术清单_${projectNumber}_${timestamp}.xlsx`
      
      // 下载文件
      XLSX.writeFile(wb, filename)
      
      message.success(`Excel技术清单已导出: ${filename}`)
      console.log('✅ Excel技术清单导出成功')
    } catch (error) {
      console.error('导出Excel技术清单失败:', error)
      message.error('导出Excel技术清单失败: ' + error.message)
    }
  }
  
  // 导出技术清单为PDF（技术工程师用，不含价格）
  // 导出技术清单PDF（基于technical_item_list）
  const handleExportTechnicalItemListToPDF = () => {
    const technicalItems = project?.technical_item_list || []
    
    if (technicalItems.length === 0) {
      message.warning('暂无技术清单数据，无法导出')
      return
    }
    
    try {
      console.log('📄 导出技术清单为PDF...')
      
      // 创建PDF文档
      const doc = new jsPDF('landscape') // 使用横向布局以容纳更多列
      
      // 设置字体
      doc.setFont('helvetica')
      
      // 添加标题
      doc.setFontSize(18)
      doc.text('技术需求清单 / Technical Requirements List', 14, 20)
      
      // 添加项目信息
      doc.setFontSize(10)
      const projectInfo = [
        `项目编号 Project No.: ${project?.projectNumber || '-'}`,
        `项目名称 Project Name: ${project?.projectName || '-'}`,
        `客户 Client: ${project?.client?.name || '-'}`,
        `生成时间 Date: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`
      ]
      
      let yPos = 30
      projectInfo.forEach(info => {
        doc.text(info, 14, yPos)
        yPos += 6
      })
      
      // 准备表格数据
      const tableData = technicalItems.map((item, index) => [
        index + 1,
        item.tag || '-',
        item.model_name || '-',
        item.quantity || '-',
        item.description || '-',
        item.technical_specs?.torque || '-',
        item.technical_specs?.pressure || '-',
        item.technical_specs?.rotation || '-',
        item.technical_specs?.valve_type || '-',
        item.technical_specs?.valve_size || '-',
        item.notes || '-'
      ])
      
      // 添加表格
      doc.autoTable({
        startY: yPos + 5,
        head: [['No.', 'Tag', 'Model', 'Qty', 'Description', 'Torque\n(Nm)', 'Pressure\n(bar)', 'Rotation\n(°)', 'Valve\nType', 'Valve\nSize', 'Notes']],
        body: tableData,
        styles: {
          font: 'helvetica',
          fontSize: 7,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [24, 144, 255],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },   // No.
          1: { cellWidth: 25 },                      // Tag
          2: { cellWidth: 35 },                      // Model
          3: { cellWidth: 20, halign: 'center' },   // Qty
          4: { cellWidth: 50 },                      // Description
          5: { cellWidth: 20, halign: 'right' },    // Torque
          6: { cellWidth: 20, halign: 'right' },    // Pressure
          7: { cellWidth: 20, halign: 'center' },   // Rotation
          8: { cellWidth: 25 },                      // Valve Type
          9: { cellWidth: 20 },                      // Valve Size
          10: { cellWidth: 30 }                      // Notes
        }
      })
      
      // 添加页脚
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(
          `第 ${i} 页 / 共 ${pageCount} 页`,
          doc.internal.pageSize.getWidth() - 50,
          doc.internal.pageSize.getHeight() - 10
        )
        doc.text(
          '技术文档 - 仅供内部使用 | Technical Document - For Internal Use Only',
          14,
          doc.internal.pageSize.getHeight() - 10
        )
      }
      
      // 生成文件名
      const projectNumber = project?.projectNumber || 'PROJECT'
      const timestamp = dayjs().format('YYYYMMDD_HHmmss')
      const filename = `技术清单_${projectNumber}_${timestamp}.pdf`
      
      // 保存文件
      doc.save(filename)
      
      message.success(`PDF技术清单已导出: ${filename}`)
      console.log('✅ PDF技术清单导出成功')
    } catch (error) {
      console.error('导出PDF技术清单失败:', error)
      message.error('导出PDF技术清单失败: ' + error.message)
    }
  }

  // ========== 报价工作台函数 ==========
  
  // 价格计算函数：根据pricing_rules和quantity计算unit_price
  const calculateUnitPrice = (item) => {
    if (!item.pricing_rules) {
      return item.base_price || 0
    }
    
    const { type, tiers, manual_price } = item.pricing_rules
    const quantity = item.quantity || 1
    
    switch (type) {
      case 'manual_override':
        // 手动覆盖价格
        return manual_price || item.base_price || 0
        
      case 'tiered':
        // 阶梯价格：找到适用的价格档位
        if (!tiers || tiers.length === 0) {
          return item.base_price || 0
        }
        
        // 按min_quantity降序排序，找到第一个满足条件的档位
        const sortedTiers = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity)
        const applicableTier = sortedTiers.find(tier => quantity >= tier.min_quantity)
        
        return applicableTier ? applicableTier.unit_price : item.base_price || 0
        
      case 'standard':
      default:
        // 标准价格
        return item.base_price || 0
    }
  }
  
  // 从技术清单生成报价BOM（调用新API，基于版本快照）
  const handleGenerateQuotationFromTechnicalList = async () => {
    if (!technicalListLocked) {
      message.warning('技术清单尚未锁定，无法生成报价BOM')
      return
    }
    
    if (!currentTechnicalVersion) {
      message.warning('未找到技术清单版本，无法生成报价BOM')
      return
    }
    
    setGeneratingQuotation(true)
    
    try {
      console.log('🚀 从技术清单生成报价BOM...', { 
        projectId: id, 
        version: currentTechnicalVersion 
      })
      
      // 🔒 调用新的API接口，基于技术清单版本快照生成报价BOM
      const response = await axios.post(
        `/api/new-projects/${id}/generate-quotation-bom`,
        { version: currentTechnicalVersion },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      
      if (response.data.success) {
        message.success(response.data.message)
        
        // 更新报价BOM数据
        const quotationItems = response.data.data.quotation_bom || []
        const quotationDataWithKeys = quotationItems.map((item, index) => ({
          ...item,
          key: `quotation_${index}_${item.model_name}`
        }))
        
        setQuotationBomData(quotationDataWithKeys)
        
        // 🔒 设置报价基于的版本号
        setQuotationBasedOnVersion(response.data.data.based_on_version)
        
        // 重新加载项目数据以获取最新状态
        await fetchProject()
        
        message.success(`成功从技术清单版本 ${response.data.data.based_on_version} 生成报价BOM，包含 ${quotationDataWithKeys.length} 个项目`)
        console.log('✅ 报价BOM生成成功')
      } else {
        throw new Error(response.data.message || '生成失败')
      }
    } catch (error) {
      console.error('生成报价BOM失败:', error)
      message.error('生成报价BOM失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setGeneratingQuotation(false)
    }
  }
  
  // 手动添加报价BOM行
  const handleAddQuotationRow = () => {
    const newRow = {
      key: `quotation_new_${Date.now()}`,
      item_type: 'Manual',
      model_name: '',
      quantity: 1,
      base_price: 0,
      cost_price: 0,
      pricing_rules: {
        type: 'standard',
        tiers: [],
        discount_percentage: 0
      },
      unit_price: 0,
      total_price: 0,
      notes: '',
      is_manual: true
    }
    
    setQuotationBomData([...quotationBomData, newRow])
    setQuotationEditingKey(newRow.key)
    
    quotationForm.setFieldsValue({
      model_name: '',
      quantity: 1,
      base_price: 0,
      notes: ''
    })
    
    message.info('已添加新行，请填写内容')
  }
  
  // 编辑报价BOM行
  const handleEditQuotationRow = (record) => {
    quotationForm.setFieldsValue({
      model_name: record.model_name,
      quantity: record.quantity,
      base_price: record.base_price,
      notes: record.notes
    })
    setQuotationEditingKey(record.key)
  }
  
  // 取消编辑
  const handleCancelQuotationEdit = () => {
    setQuotationEditingKey('')
    quotationForm.resetFields()
  }
  
  // 保存编辑
  const handleSaveQuotationEdit = async (key) => {
    try {
      const row = await quotationForm.validateFields()
      
      const newData = [...quotationBomData]
      const index = newData.findIndex((item) => key === item.key)
      
      if (index > -1) {
        const item = newData[index]
        
        // 更新项目数据
        const updatedItem = {
          ...item,
          ...row,
        }
        
        // 重新计算价格
        updatedItem.unit_price = calculateUnitPrice(updatedItem)
        updatedItem.total_price = updatedItem.unit_price * updatedItem.quantity
        
        newData.splice(index, 1, updatedItem)
        
        setQuotationBomData(newData)
        setQuotationEditingKey('')
        message.success('保存成功')
      }
    } catch (error) {
      console.error('保存失败:', error)
      message.error('请检查输入是否正确')
    }
  }
  
  // 删除报价BOM行
  const handleDeleteQuotationRow = (key) => {
    const newData = quotationBomData.filter((item) => item.key !== key)
    setQuotationBomData(newData)
    message.success('删除成功')
  }
  
  // 打开价格策略设置Modal
  const handleOpenPricingModal = (record) => {
    setCurrentPricingItem(record)
    
    // 初始化表单值
    const pricingRules = record.pricing_rules || { type: 'standard', tiers: [], discount_percentage: 0 }
    
    pricingForm.setFieldsValue({
      pricing_type: pricingRules.type || 'standard',
      manual_price: pricingRules.manual_price || record.base_price,
      discount_percentage: pricingRules.discount_percentage || 0,
      tiers: pricingRules.tiers && pricingRules.tiers.length > 0 
        ? pricingRules.tiers 
        : [{ min_quantity: 1, unit_price: record.base_price }],
      pricing_notes: pricingRules.notes || ''
    })
    
    setPricingModalVisible(true)
  }
  
  // 保存价格策略
  const handleSavePricingStrategy = async () => {
    try {
      const values = await pricingForm.validateFields()
      
      const newData = [...quotationBomData]
      const index = newData.findIndex((item) => item.key === currentPricingItem.key)
      
      if (index > -1) {
        const item = newData[index]
        
        // 更新pricing_rules
        const pricingRules = {
          type: values.pricing_type,
          tiers: values.pricing_type === 'tiered' ? values.tiers : [],
          manual_price: values.pricing_type === 'manual_override' ? values.manual_price : undefined,
          discount_percentage: values.discount_percentage || 0,
          notes: values.pricing_notes
        }
        
        item.pricing_rules = pricingRules
        
        // 重新计算价格
        item.unit_price = calculateUnitPrice(item)
        item.total_price = item.unit_price * item.quantity
        
        // 计算实际折扣百分比（基于base_price）
        if (item.base_price > 0 && item.unit_price < item.base_price) {
          item.pricing_rules.discount_percentage = Math.round(
            ((item.base_price - item.unit_price) / item.base_price) * 100
          )
        }
        
        newData.splice(index, 1, item)
        setQuotationBomData(newData)
        
        setPricingModalVisible(false)
        setCurrentPricingItem(null)
        pricingForm.resetFields()
        
        message.success('价格策略已更新')
      }
    } catch (error) {
      console.error('保存价格策略失败:', error)
      message.error('请检查输入是否正确')
    }
  }
  
  // 保存报价BOM到后端
  const handleSaveQuotationBOM = async () => {
    if (!quotationBomData || quotationBomData.length === 0) {
      message.warning('报价BOM为空，无法保存')
      return
    }
    
    // 检查是否有正在编辑的行
    if (quotationEditingKey) {
      message.warning('请先保存或取消当前编辑的行')
      return
    }
    
    setSavingQuotation(true)
    
    try {
      // 移除key字段，准备保存到后端
      const quotationToSave = quotationBomData.map(({ key, ...rest }) => rest)
      
      // 调用后端API保存
      await projectsAPI.update(id, {
        quotation_bom: quotationToSave
      })
      
      message.success('报价BOM已保存！')
      
      // 刷新项目数据
      await fetchProject()
    } catch (error) {
      console.error('保存报价BOM失败:', error)
      message.error('保存失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setSavingQuotation(false)
    }
  }
  
  // 完成报价（更新项目状态为"已报价"）
  const handleCompleteQuotation = async () => {
    if (!quotationBomData || quotationBomData.length === 0) {
      message.warning('请先生成并保存报价BOM')
      return
    }
    
    Modal.confirm({
      title: '完成报价',
      content: '确定完成报价工作并标记项目为"已报价"状态吗？这将通知销售经理进行审批。',
      okText: '确认完成',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 先保存当前的quotation_bom
          await handleSaveQuotationBOM()
          
          // 更新项目状态为"已报价"
          await projectsAPI.update(id, { status: '已报价' })
          
          message.success('报价已完成！')
          await fetchProject()
        } catch (error) {
          console.error('完成报价失败:', error)
          message.error('完成报价失败: ' + (error.response?.data?.message || error.message))
        }
      }
    })
  }
  
  // 判断报价BOM行是否正在编辑
  const isQuotationEditing = (record) => record.key === quotationEditingKey
  
  // ========== 合同处理函数 ==========
  
  // 上传草签合同（销售经理，Won状态）
  const handleUploadDraftContract = async (fileData) => {
    setUploadingContract(true)
    
    try {
      console.log('📄 上传草签合同...')
      
      const contractData = {
        file_name: fileData.name,
        file_url: fileData.url,
        objectId: fileData.objectId
      }
      
      await contractsAPI.uploadDraft(id, contractData)
      
      message.success('草签合同已上传，已提交商务团队审核！')
      setContractFileList([])
      await fetchProject()
    } catch (error) {
      console.error('上传草签合同失败:', error)
      message.error('上传失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setUploadingContract(false)
    }
  }
  
  // 上传我方盖章合同（商务工程师，Pending Contract Review状态）
  const handleUploadCompanySealedContract = async (fileData) => {
    setUploadingContract(true)
    
    try {
      console.log('📄 上传我方盖章合同...')
      
      const contractData = {
        file_name: fileData.name,
        file_url: fileData.url,
        objectId: fileData.objectId,
        approved: true
      }
      
      await contractsAPI.reviewAndUploadSealed(id, contractData)
      
      message.success('我方盖章合同已上传，等待客户签字！')
      setContractFileList([])
      await fetchProject()
    } catch (error) {
      console.error('上传我方盖章合同失败:', error)
      message.error('上传失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setUploadingContract(false)
    }
  }
  
  // 上传最终合同（销售经理，Pending Client Signature状态）
  const handleUploadFinalContract = async (fileData) => {
    setUploadingContract(true)
    
    try {
      console.log('📄 上传最终合同...')
      
      const contractData = {
        file_name: fileData.name,
        file_url: fileData.url,
        objectId: fileData.objectId
      }
      
      await contractsAPI.uploadFinal(id, contractData)
      
      message.success('最终合同已上传，合同签订完成！')
      setContractFileList([])
      await fetchProject()
    } catch (error) {
      console.error('上传最终合同失败:', error)
      message.error('上传失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setUploadingContract(false)
    }
  }
  
  // ========== 生产订单创建函数 ==========
  
  // 🔒 确认收款并创建生产订单（带责任声明的二次确认）
  const handleCreateProductionOrder = async () => {
    if (!paymentConfirmed) {
      message.warning('请先确认已收到30%预付款')
      return
    }
    
    if (!project.quotation_bom || project.quotation_bom.length === 0) {
      message.error('项目没有报价BOM，无法创建生产订单')
      return
    }
    
    // 计算订单总金额和预付款金额
    const subtotal = project.quotation_bom.reduce((sum, item) => sum + (item.total_price || 0), 0)
    const tax_rate = 13 // 13%增值税
    const total_amount = subtotal * (1 + tax_rate / 100)
    const payment_amount = total_amount * 0.3 // 30%预付款
    const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    
    // 🔒 带有明确责任声明的二次确认框
    Modal.confirm({
      title: (
        <Space>
          <DollarOutlined style={{ color: '#52c41a', fontSize: 20 }} />
          <span style={{ fontSize: 16, fontWeight: 'bold' }}>💰 财务确认：收款到账并启动生产</span>
          <Tag color="orange">财务职责</Tag>
        </Space>
      ),
      width: 650,
      icon: null,
      okText: '我作为财务负责人确认，创建生产订单',
      okButtonProps: { 
        danger: true,
        size: 'large'
      },
      cancelText: '取消',
      content: (
        <div style={{ padding: '16px 0' }}>
          {/* 财务责任声明 */}
          <Alert
            message="⚠️ 财务职责重要提示：请仔细阅读以下财务确认内容"
            description={
              <div style={{ marginTop: 12 }}>
                <Typography.Paragraph strong style={{ fontSize: 16, marginBottom: 16, color: '#1890ff' }}>
                  作为公司财务负责人（商务工程师兼任），我郑重确认：
                </Typography.Paragraph>
                
                <Typography.Paragraph strong style={{ fontSize: 15, marginBottom: 16, background: '#fff7e6', padding: '12px', borderRadius: '4px', border: '1px solid #ffa940' }}>
                  📌 客户预付款项 <span style={{ color: '#52c41a', fontSize: 20, fontWeight: 'bold' }}>
                    ¥{payment_amount.toFixed(2)}
                  </span> 已于 <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                    {today}
                  </span> 实际到达公司银行账户。
                </Typography.Paragraph>
                
                <Typography.Paragraph style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 14 }}>
                  ⚠️ 作为财务负责人，我对此收款确认承担相应责任！
                </Typography.Paragraph>
                
                <Typography.Paragraph style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 14 }}>
                  ⚠️ 此操作将启动生产流程且不可逆！
                </Typography.Paragraph>
                
                <Divider style={{ margin: '12px 0' }} />
                
                <Typography.Paragraph style={{ fontSize: 13 }}>
                  <strong>财务确认后系统将：</strong>
                </Typography.Paragraph>
                <ul style={{ fontSize: 13, marginBottom: 0, paddingLeft: 20 }}>
                  <li>创建销售订单和生产订单</li>
                  <li>项目状态变更为"生产中"</li>
                  <li>记录您的财务确认操作（包括姓名、角色、时间、IP地址）</li>
                  <li>永久保存您的财务责任声明</li>
                  <li>通知生产部门开始备料和排产</li>
                </ul>
                
                <Divider style={{ margin: '12px 0' }} />
                
                <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0, background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                  <strong>财务负责人：</strong>{user?.full_name || user?.name || user?.phone} 
                  <Tag color="orange" style={{ marginLeft: 8 }}>商务工程师（兼财务）</Tag>
                  <br />
                  <strong>订单总额：</strong>¥{total_amount.toFixed(2)}（含13%增值税）
                  <br />
                  <strong>预付款（30%）：</strong>¥{payment_amount.toFixed(2)}
                  <br />
                  <strong>项目编号：</strong>{project.projectNumber}
                  <br />
                  <strong>确认时间：</strong>{new Date().toLocaleString('zh-CN')}
                </Typography.Paragraph>
              </div>
            }
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Alert
            message="📋 财务最终核对清单"
            description={
              <div>
                <p style={{ fontWeight: 'bold', marginBottom: 8 }}>请作为财务负责人再次确认：</p>
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li><strong>预付款已实际到账</strong>（请核对公司银行账户流水）</li>
                  <li>到账金额与预付款金额一致</li>
                  <li>报价BOM已最终确认无误</li>
                  <li>合同已经双方签署完成</li>
                  <li>已做好承担财务确认责任的准备</li>
                </ul>
              </div>
            }
            type="info"
            showIcon
          />
        </div>
      ),
      onOk: async () => {
        setCreatingProduction(true)
        
        try {
          console.log('💼 创建生产订单...')
          
          // 计算订单总金额
          const subtotal = project.quotation_bom.reduce((sum, item) => sum + (item.total_price || 0), 0)
          const tax_rate = 13 // 13%增值税
          const total_amount = subtotal * (1 + tax_rate / 100)
          const payment_amount = total_amount * 0.3 // 30%预付款
          
          const orderData = {
            payment_confirmed: true,
            payment_amount: payment_amount,
            payment_method: 'Bank Transfer',
            payment_notes: '30% prepayment confirmed',
            priority: 'Normal',
            productionNotes: `Created from project ${project.projectNumber}`,
            technicalRequirements: project.description || ''
          }
          
          const response = await productionAPI.createFromProject(id, orderData)
          
          message.success('生产订单创建成功！')
          console.log('生产订单创建结果:', response.data)
          
          // 显示创建结果
          Modal.success({
            title: '生产订单创建成功',
            content: (
              <div>
                <p><strong>销售订单号：</strong>{response.data.data.salesOrder.orderNumber}</p>
                <p><strong>生产订单号：</strong>{response.data.data.productionOrder.productionOrderNumber}</p>
                <p><strong>订单状态：</strong>{response.data.data.productionOrder.status}</p>
                <p><strong>订单总额：</strong>¥{response.data.data.salesOrder.total_amount?.toFixed(2)}</p>
                <p><strong>已付金额：</strong>¥{response.data.data.salesOrder.paid_amount?.toFixed(2)}</p>
              </div>
            )
          })
          
          // 重置确认状态
          setPaymentConfirmed(false)
          
          // 刷新项目数据
          await fetchProject()
        } catch (error) {
          console.error('创建生产订单失败:', error)
          message.error('创建失败: ' + (error.response?.data?.message || error.message))
        } finally {
          setCreatingProduction(false)
        }
      }
    })
  }
  
  // 选型列表列定义（智能制造综合管理系统）
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
  
  // 报价工作台BOM列定义（可编辑表格，带价格策略）
  const quotationBOMColumns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      fixed: 'left',
      render: (_, __, index) => index + 1,
    },
    {
      title: '型号',
      dataIndex: 'model_name',
      key: 'model_name',
      width: 180,
      editable: true,
      render: (model, record) => {
        if (isQuotationEditing(record)) {
          return (
            <Form.Item
              name="model_name"
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
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      editable: true,
      render: (qty, record) => {
        if (isQuotationEditing(record)) {
          return (
            <Form.Item
              name="quantity"
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
    {
      title: '基础价 (¥)',
      dataIndex: 'base_price',
      key: 'base_price',
      width: 120,
      render: (price, record) => {
        if (isQuotationEditing(record)) {
          return (
            <Form.Item
              name="base_price"
              style={{ margin: 0 }}
              rules={[{ required: true, message: '请输入基础价' }]}
            >
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          )
        }
        return `¥${(price || 0).toLocaleString()}`
      }
    },
    // 成本价列 - 仅管理员和采购可见
    ...(['Administrator', 'Procurement Specialist'].includes(user?.role) ? [{
      title: '成本价 (¥)',
      dataIndex: 'cost_price',
      key: 'cost_price',
      width: 120,
      render: (price) => (
        <span style={{ color: '#999' }}>¥{(price || 0).toLocaleString()}</span>
      )
    }] : []),
    {
      title: '价格策略',
      key: 'pricing_strategy',
      width: 150,
      render: (_, record) => {
        const pricingType = record.pricing_rules?.type || 'standard'
        const discount = record.pricing_rules?.discount_percentage || 0
        
        let typeText = '标准价格'
        let typeColor = 'default'
        
        if (pricingType === 'tiered') {
          typeText = '阶梯价格'
          typeColor = 'blue'
        } else if (pricingType === 'manual_override') {
          typeText = '手动覆盖'
          typeColor = 'orange'
        }
        
        return (
          <Space>
            <Tag color={typeColor}>{typeText}</Tag>
            {discount > 0 && <Tag color="red">-{discount}%</Tag>}
            {!isProjectLocked && (
              <Button
                type="link"
                size="small"
                icon={<SettingOutlined />}
                onClick={() => handleOpenPricingModal(record)}
                disabled={isQuotationEditing(record) && record.key !== quotationEditingKey}
              >
                配置
              </Button>
            )}
          </Space>
        )
      }
    },
    {
      title: '单价 (¥)',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      render: (price) => (
        <strong style={{ color: '#1890ff' }}>
          ¥{(price || 0).toLocaleString()}
        </strong>
      )
    },
    {
      title: '总价 (¥)',
      dataIndex: 'total_price',
      key: 'total_price',
      width: 140,
      render: (price) => (
        <strong style={{ color: '#52c41a', fontSize: '16px' }}>
          ¥{(price || 0).toLocaleString()}
        </strong>
      )
    },
    // 利润率列 - 仅管理员可见（销售经理在报价工作台不可见）
    ...(['Administrator'].includes(user?.role) ? [{
      title: '利润率',
      key: 'profit_margin',
      width: 100,
      render: (_, record) => {
        if (!record.cost_price || record.cost_price === 0) return '-'
        
        const margin = ((record.unit_price - record.cost_price) / record.cost_price) * 100
        const color = margin > 50 ? '#52c41a' : margin > 30 ? '#1890ff' : margin > 0 ? '#faad14' : '#f5222d'
        
        return (
          <strong style={{ color }}>
            {margin.toFixed(1)}%
          </strong>
        )
      }
    }] : []),
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      editable: true,
      render: (notes, record) => {
        if (isQuotationEditing(record)) {
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
        // 🔒 如果项目已锁定，不显示任何操作按钮
        if (isProjectLocked) {
          return <Tag color="red">已锁定</Tag>
        }
        
        const editable = isQuotationEditing(record)
        
        return editable ? (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleSaveQuotationEdit(record.key)}
            >
              保存
            </Button>
            <Button
              type="link"
              size="small"
              icon={<CloseOutlined />}
              onClick={handleCancelQuotationEdit}
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
              disabled={quotationEditingKey !== ''}
              onClick={() => handleEditQuotationRow(record)}
            >
              编辑
            </Button>
            <Popconfirm
              title="确定删除此行吗？"
              onConfirm={() => handleDeleteQuotationRow(record.key)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                size="small"
                icon={<DeleteOutlined />}
                disabled={quotationEditingKey !== ''}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        )
      },
    },
  ]
  
  // 只读的报价BOM列定义（销售经理专用，不显示成本和利润率）
  const readonlyQuotationBOMColumns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: '产品型号',
      dataIndex: 'model_name',
      key: 'model_name',
      width: 200,
      render: (model) => <strong>{model || '-'}</strong>
    },
    {
      title: '产品描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (desc) => desc || '-'
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (qty) => <Tag color="blue">{qty}</Tag>
    },
    {
      title: '单价 (¥)',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 150,
      render: (price) => (
        <strong style={{ color: '#1890ff', fontSize: '16px' }}>
          ¥{(price || 0).toLocaleString()}
        </strong>
      )
    },
    {
      title: '总价 (¥)',
      dataIndex: 'total_price',
      key: 'total_price',
      width: 150,
      render: (price) => (
        <strong style={{ color: '#52c41a', fontSize: '16px' }}>
          ¥{(price || 0).toLocaleString()}
        </strong>
      )
    },
    {
      title: '价格策略',
      key: 'pricing_info',
      width: 150,
      render: (_, record) => {
        const pricingType = record.pricing_rules?.type || 'standard'
        const discount = record.pricing_rules?.discount_percentage || 0
        
        let typeText = '标准价格'
        let typeColor = 'default'
        
        if (pricingType === 'tiered') {
          typeText = '阶梯价格'
          typeColor = 'blue'
        } else if (pricingType === 'manual_override') {
          typeText = '特惠价格'
          typeColor = 'orange'
        }
        
        return (
          <Space>
            <Tag color={typeColor}>{typeText}</Tag>
            {discount > 0 && <Tag color="red">优惠 {discount}%</Tag>}
          </Space>
        )
      }
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      ellipsis: true,
      render: (notes) => notes || '-'
    },
  ]
  
  // 导出报价单为Excel（销售经理用）
  const handleExportQuotationToExcel = () => {
    if (!quotationBomData || quotationBomData.length === 0) {
      message.warning('暂无报价数据，无法导出')
      return
    }
    
    try {
      console.log('📊 导出报价单为Excel...')
      
      // 准备Excel数据
      const excelData = quotationBomData.map((item, index) => ({
        '序号': index + 1,
        '产品型号': item.model_name || '-',
        '产品描述': item.description || '-',
        '数量': item.quantity || 0,
        '单价 (¥)': item.unit_price || 0,
        '总价 (¥)': item.total_price || 0,
        '价格策略': item.pricing_rules?.type === 'tiered' ? '阶梯价格' : 
                   item.pricing_rules?.type === 'manual_override' ? '特惠价格' : '标准价格',
        '折扣': item.pricing_rules?.discount_percentage ? `${item.pricing_rules.discount_percentage}%` : '-',
        '备注': item.notes || ''
      }))
      
      // 添加统计行
      const totalQuantity = quotationBomData.reduce((sum, item) => sum + (item.quantity || 0), 0)
      const totalPrice = quotationBomData.reduce((sum, item) => sum + (item.total_price || 0), 0)
      
      excelData.push({
        '序号': '',
        '产品型号': '合计',
        '产品描述': '',
        '数量': totalQuantity,
        '单价 (¥)': '',
        '总价 (¥)': totalPrice,
        '价格策略': '',
        '折扣': '',
        '备注': ''
      })
      
      // 创建工作簿
      const ws = XLSX.utils.json_to_sheet(excelData)
      
      // 设置列宽
      ws['!cols'] = [
        { wch: 6 },   // 序号
        { wch: 25 },  // 产品型号
        { wch: 30 },  // 产品描述
        { wch: 8 },   // 数量
        { wch: 15 },  // 单价
        { wch: 15 },  // 总价
        { wch: 12 },  // 价格策略
        { wch: 10 },  // 折扣
        { wch: 25 }   // 备注
      ]
      
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '报价单')
      
      // 生成文件名
      const projectNumber = project?.projectNumber || 'PROJECT'
      const timestamp = dayjs().format('YYYYMMDD_HHmmss')
      const filename = `报价单_${projectNumber}_${timestamp}.xlsx`
      
      // 下载文件
      XLSX.writeFile(wb, filename)
      
      message.success(`Excel报价单已导出: ${filename}`)
      console.log('✅ Excel报价单导出成功')
    } catch (error) {
      console.error('导出Excel报价单失败:', error)
      message.error('导出Excel报价单失败: ' + error.message)
    }
  }
  
  // 导出报价单为PDF（销售经理用）
  const handleExportQuotationToPDF = () => {
    if (!quotationBomData || quotationBomData.length === 0) {
      message.warning('暂无报价数据，无法导出')
      return
    }
    
    try {
      console.log('📄 导出报价单为PDF...')
      
      // 创建PDF文档
      const doc = new jsPDF()
      
      // 设置字体
      doc.setFont('helvetica')
      
      // 添加标题
      doc.setFontSize(20)
      doc.text('商务报价单', 14, 20)
      doc.setFontSize(12)
      doc.text('Commercial Quotation', 14, 28)
      
      // 添加项目信息
      doc.setFontSize(10)
      const projectInfo = [
        `项目编号 Project No.: ${project?.projectNumber || '-'}`,
        `项目名称 Project Name: ${project?.projectName || '-'}`,
        `客户 Client: ${project?.client?.name || '-'}`,
        `报价日期 Date: ${dayjs().format('YYYY-MM-DD')}`,
        `有效期 Valid Until: ${dayjs().add(30, 'day').format('YYYY-MM-DD')}`
      ]
      
      let yPos = 38
      projectInfo.forEach(info => {
        doc.text(info, 14, yPos)
        yPos += 6
      })
      
      // 准备表格数据
      const tableData = quotationBomData.map((item, index) => [
        index + 1,
        item.model_name || '-',
        item.description || '-',
        item.quantity || 0,
        `¥${(item.unit_price || 0).toLocaleString()}`,
        `¥${(item.total_price || 0).toLocaleString()}`,
      ])
      
      // 添加统计行
      const totalQuantity = quotationBomData.reduce((sum, item) => sum + (item.quantity || 0), 0)
      const totalPrice = quotationBomData.reduce((sum, item) => sum + (item.total_price || 0), 0)
      
      tableData.push([
        '',
        '合计 Total',
        '',
        totalQuantity,
        '',
        `¥${totalPrice.toLocaleString()}`,
      ])
      
      // 添加表格
      doc.autoTable({
        startY: yPos + 5,
        head: [['No.', 'Model', 'Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [24, 144, 255],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },   // No.
          1: { cellWidth: 40 },                      // Model
          2: { cellWidth: 50 },                      // Description
          3: { cellWidth: 15, halign: 'center' },   // Qty
          4: { cellWidth: 30, halign: 'right' },    // Unit Price
          5: { cellWidth: 35, halign: 'right' }     // Total
        },
        // 最后一行（合计行）使用特殊样式
        didParseCell: function(data) {
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.fillColor = [240, 240, 240]
            data.cell.styles.fontSize = 11
          }
        }
      })
      
      // 添加条款
      const finalY = doc.lastAutoTable.finalY + 15
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('条款与说明 / Terms & Conditions', 14, finalY)
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      const terms = [
        '• 付款条款 Payment Terms: Net 30 days',
        '• 交货期 Delivery: 2-4 weeks from order confirmation',
        '• 质保期 Warranty: 12 months from delivery date',
        '• 价格有效期 Price Validity: 30 days from quotation date',
        '• 备注 Note: Prices are subject to change without prior notice'
      ]
      
      let termsY = finalY + 7
      terms.forEach(term => {
        doc.text(term, 14, termsY)
        termsY += 6
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
        doc.text(
          'Commercial Quotation - Confidential',
          14,
          doc.internal.pageSize.getHeight() - 10
        )
      }
      
      // 生成文件名
      const projectNumber = project?.projectNumber || 'PROJECT'
      const timestamp = dayjs().format('YYYYMMDD_HHmmss')
      const filename = `报价单_${projectNumber}_${timestamp}.pdf`
      
      // 保存文件
      doc.save(filename)
      
      message.success(`PDF报价单已导出: ${filename}`)
      console.log('✅ PDF报价单导出成功')
    } catch (error) {
      console.error('导出PDF报价单失败:', error)
      message.error('导出PDF报价单失败: ' + error.message)
    }
  }
  
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
    if (user?.role === 'Technical Engineer') {
      // 开始选型按钮（自动滚动到技术清单Tab）
      buttons.push(
        <Button
          key="start-selection"
          type="primary"
          size="large"
          icon={<FileSearchOutlined />}
          onClick={() => {
            // 滚动到技术清单Tab区域
            const tabsElement = document.querySelector('.ant-tabs')
            if (tabsElement) {
              tabsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none'
          }}
        >
          📋 开始选型
        </Button>
      )
      
      // 导出技术清单按钮
      if (project?.technical_item_list && project.technical_item_list.length > 0) {
        buttons.push(
          <Button
            key="export-technical-list"
            icon={<FilePdfOutlined />}
            onClick={handleExportTechnicalItemListToPDF}
          >
            导出技术清单(PDF)
          </Button>
        )
      }
      
      // 完成选型按钮（如果状态允许）
      if (!technicalListLocked && ['选型进行中', '选型修正中', '草稿'].includes(project.status)) {
        buttons.push(
          <Button
            key="complete-selection"
            type="primary"
            icon={<SendOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '完成选型，请求报价',
                content: '确定完成技术选型并提交给商务团队进行报价吗？提交后技术清单将被锁定，商务工程师才能开始报价。',
                okText: '确认提交',
                cancelText: '取消',
                onOk: handleSubmitTechnicalList
              })
            }}
            style={{
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              border: 'none'
            }}
          >
            完成选型，请求报价
          </Button>
        )
      }
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
    <div style={{ padding: '24px' }}>
      {/* 页面头部 - 替代废弃的PageHeader组件 */}
      <div style={{ marginBottom: 24 }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
          >
            返回
          </Button>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {project.projectName || project.projectNumber}
          </Typography.Title>
          <Tag color={project.status === 'Completed' ? 'success' : 'processing'}>
            {project.status}
          </Tag>
        </Space>
        <Typography.Text type="secondary">项目详情</Typography.Text>
      </div>

      <Space style={{ marginBottom: 24 }} wrap>
        
        {/* 工作流按钮（基于角色和项目状态动态显示） */}
        {renderWorkflowButtons()}
      </Space>

      <Card 
        title="Project Information" 
        style={{ marginBottom: 16 }}
        extra={
          project.status === '待指派技术' && (user?.role === 'Sales Manager' || user?.role === 'Sales Engineer' || user?.role === 'Administrator') ? (
            <AssignTechnicalSupport project={project} onSuccess={fetchProject} />
          ) : null
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Project Number">{project.projectNumber}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={project.status === 'Completed' ? 'success' : 'processing'}>
              {project.status}
            </Tag>
          </Descriptions.Item>
          {project.owner && (
            <Descriptions.Item label="Project Owner">{project.owner?.full_name || project.owner?.phone || '-'}</Descriptions.Item>
          )}
          {project.technical_support && (
            <Descriptions.Item label="Technical Support">
              <Tag color="blue" icon={<UserAddOutlined />}>
                {project.technical_support?.full_name || project.technical_support?.phone || '-'}
              </Tag>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Project Name">{project.projectName}</Descriptions.Item>
          <Descriptions.Item label="Priority">
            <Tag color={project.priority === 'High' ? 'red' : 'default'}>{project.priority}</Tag>
          </Descriptions.Item>
          {project.budget && (
            <Descriptions.Item label="Budget">
              ¥{project.budget.toLocaleString()}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Client Name">{project.client?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Client Company">{project.client?.company || '-'}</Descriptions.Item>
          <Descriptions.Item label="Client Email">{project.client?.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="Client Phone">{project.client?.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Industry">{project.industry || '-'}</Descriptions.Item>
          <Descriptions.Item label="Application">{project.application || '-'}</Descriptions.Item>
          {project.technical_requirements && (
            <Descriptions.Item label="客户技术需求 / Technical Requirements" span={2}>
              <Card 
                size="small"
                style={{ 
                  background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px'
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#8c8c8c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <UserOutlined style={{ color: '#1890ff' }} />
                    <span>销售经理提供的客户技术要求</span>
                  </div>
                  <div style={{ 
                    fontSize: '15px',
                    lineHeight: '1.8',
                    color: '#262626',
                    padding: '12px 16px',
                    background: '#ffffff',
                    borderRadius: '6px',
                    border: '1px solid #e8e8e8',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'Arial, sans-serif'
                  }}>
                    {project.technical_requirements}
                  </div>
                </Space>
              </Card>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Created By">{project.createdBy?.name}</Descriptions.Item>
          <Descriptions.Item label="Created At">
            {dayjs(project.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          {project.description && (
            <Descriptions.Item label="Description" span={2}>{project.description}</Descriptions.Item>
          )}
          {/* 显示销售上传的项目文件 */}
          {project.project_files && project.project_files.length > 0 && (
            <Descriptions.Item label="项目附件 / Project Files" span={2}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {project.project_files.map((file, index) => (
                  <Space key={index}>
                    <FileTextOutlined style={{ color: '#1890ff' }} />
                    <Button
                      type="link"
                      onClick={() => window.open(file.file_url, '_blank')}
                      style={{ padding: 0 }}
                    >
                      {file.file_name}
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = file.file_url;
                        link.download = file.file_name;
                        link.click();
                      }}
                    >
                      下载
                    </Button>
                    {file.uploadedAt && (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        上传于: {dayjs(file.uploadedAt).format('YYYY-MM-DD HH:mm')}
                      </Typography.Text>
                    )}
                  </Space>
                ))}
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Tabs
          defaultActiveKey={user?.role === 'Technical Engineer' ? 'technical-items' : 'selections'}
          items={[
            // Tab 0: 技术清单 - 技术工程师、商务工程师和销售经理（受限）可见
            ...((user?.role === 'Technical Engineer' || user?.role === 'Sales Engineer' || (isSalesManager && isReadyForQuotation)) ? [{
              key: 'technical-items',
              label: (
                <span>
                  <FileSearchOutlined />
                  技术清单
                  {project?.technical_item_list && project.technical_item_list.length > 0 && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>{project.technical_item_list.length}</Tag>
                  )}
                </span>
              ),
              children: (
                <div>
                  {/* 技术清单显示 */}
                  {user?.role === 'Technical Engineer' ? (
                    <div>
                      {/* 技术工程师：左右分栏布局，左侧显示技术需求参考，右侧显示选型表格 */}
                      
                      {/* 🔒 版本锁定提示 */}
                      {technicalListLocked && (
                        <Alert
                          message={`🔒 技术清单已锁定 - 版本 ${currentTechnicalVersion}`}
                          description="技术清单已提交审核并锁定。如需修改，请等待商务工程师反馈或驳回。"
                          type="warning"
                          showIcon
                          style={{ marginBottom: 16 }}
                        />
                      )}
                      
                      {/* 🔒 待处理的修改建议提示 */}
                      {modificationRequests.filter(r => r.status === '待处理').length > 0 && (
                        <Alert
                          message="📝 商务工程师提出了修改建议"
                          description={
                            <div>
                              <p>商务工程师对技术清单提出了修改建议，请查看并处理。</p>
                              <Button
                                type="link"
                                onClick={handleViewModificationRequests}
                                style={{ padding: 0 }}
                              >
                                查看修改建议
                              </Button>
                            </div>
                          }
                          type="info"
                          showIcon
                          style={{ marginBottom: 16 }}
                        />
                      )}
                      
                      <Row gutter={16}>
                        {/* 左侧：客户技术需求参考面板 */}
                        <Col xs={24} lg={8}>
                          <Card 
                            title={
                              <span>
                                <FileTextOutlined style={{ marginRight: 8 }} />
                                客户技术需求参考
                              </span>
                            }
                            style={{ 
                              position: 'sticky', 
                              top: 16,
                              height: 'fit-content',
                              maxHeight: 'calc(100vh - 200px)',
                              overflowY: 'auto'
                            }}
                            size="small"
                          >
                            {/* 显示销售提供的技术需求 */}
                            {project.technical_requirements ? (
                              <div style={{ marginBottom: 16 }}>
                                <Typography.Title level={5}>技术要求</Typography.Title>
                                <div style={{ 
                                  background: '#f0f5ff',
                                  padding: 12,
                                  borderRadius: 4,
                                  whiteSpace: 'pre-wrap',
                                  lineHeight: 1.8,
                                  fontSize: 14
                                }}>
                                  {project.technical_requirements}
                                </div>
                              </div>
                            ) : (
                              <Alert
                                message="暂无技术要求"
                                description="销售经理未提供技术要求信息"
                                type="warning"
                                showIcon
                                style={{ marginBottom: 16 }}
                              />
                            )}
                            
                            {/* 显示项目附件/技术文件 */}
                            {project.project_files && project.project_files.length > 0 && (
                              <div>
                                <Divider style={{ margin: '12px 0' }} />
                                <Typography.Title level={5}>项目文件</Typography.Title>
                                <Space direction="vertical" style={{ width: '100%' }} size="small">
                                  {project.project_files.map((file, idx) => (
                                    <Button 
                                      key={idx}
                                      icon={<FileTextOutlined />}
                                      onClick={() => window.open(file.file_url, '_blank')}
                                      block
                                      size="small"
                                    >
                                      {file.file_name}
                                    </Button>
                                  ))}
                                </Space>
                              </div>
                            )}
                            
                            {/* 显示项目基本信息 */}
                            <div style={{ marginTop: 16 }}>
                              <Divider style={{ margin: '12px 0' }} />
                              <Typography.Title level={5}>项目信息</Typography.Title>
                              <Descriptions column={1} size="small">
                                <Descriptions.Item label="客户名称">{project.client?.name || '-'}</Descriptions.Item>
                                <Descriptions.Item label="行业">{project.industry || '-'}</Descriptions.Item>
                                <Descriptions.Item label="应用">{project.application || '-'}</Descriptions.Item>
                                <Descriptions.Item label="预算">¥{project.budget?.toLocaleString() || '-'}</Descriptions.Item>
                              </Descriptions>
                            </div>
                          </Card>
                        </Col>
                        
                        {/* 右侧：技术选型表格 */}
                        <Col xs={24} lg={16}>
                          <div style={{ marginBottom: 16 }}>
                            <Space wrap>
                              <Button
                                type="primary"
                                icon={<FilePdfOutlined />}
                                onClick={handleExportTechnicalItemListToPDF}
                                disabled={!project?.technical_item_list || project.technical_item_list.length === 0}
                              >
                                导出技术清单(PDF)
                              </Button>
                              
                              {!technicalListLocked && (project.status === '选型进行中' || project.status === '选型修正中' || project.status === '草稿') && (
                                <Button
                                  type="primary"
                                  icon={<SendOutlined />}
                                  onClick={() => {
                                    Modal.confirm({
                                      title: '完成选型，请求报价',
                                      content: '确定完成技术选型并提交给商务团队进行报价吗？提交后技术清单将被锁定，商务工程师才能开始报价。',
                                      okText: '确认提交',
                                      cancelText: '取消',
                                      onOk: handleSubmitTechnicalList
                                    })
                                  }}
                                  style={{
                                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                                    border: 'none'
                                  }}
                                >
                                  完成选型，请求报价
                                </Button>
                              )}
                            </Space>
                          </div>
                          <TechnicalItemList project={project} onUpdate={fetchProject} />
                        </Col>
                      </Row>
                    </div>
                  ) : user?.role === 'Sales Engineer' ? (
                    <div>
                      {/* 商务工程师：只读视图（可驳回/确认）*/}
                      {/* 🔒 显示当前版本和锁定状态 */}
                      {technicalListLocked ? (
                        <Alert
                          message={`🔒 技术清单已锁定 - 版本 ${currentTechnicalVersion}`}
                          description="技术工程师已提交技术清单。您可以查看并决定是否接受此版本，或驳回并提出修改建议。"
                          type="success"
                          showIcon
                          style={{ marginBottom: 16 }}
                        />
                      ) : (
                        <Alert
                          message="📋 技术清单（待提交）"
                          description="技术工程师正在完善技术清单，请等待其提交后再进行报价。"
                          type="warning"
                          showIcon
                          style={{ marginBottom: 16 }}
                        />
                      )}
                      
                      <div style={{ marginBottom: 16 }}>
                        <Space>
                          <Button
                            type="primary"
                            icon={<FilePdfOutlined />}
                            onClick={handleExportTechnicalItemListToPDF}
                            disabled={!project?.technical_item_list || project.technical_item_list.length === 0}
                          >
                            导出技术清单(PDF)
                          </Button>
                          
                          {/* 🔒 驳回并提出修改建议按钮 */}
                          {technicalListLocked && (
                            <>
                              <Button
                                danger
                                icon={<CloseOutlined />}
                                onClick={() => setRejectModalVisible(true)}
                              >
                                驳回并提出修改建议
                              </Button>
                              
                              <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={() => {
                                  Modal.confirm({
                                    title: '确认技术清单版本',
                                    content: `确认接受技术清单版本 ${currentTechnicalVersion} 并开始报价吗？`,
                                    okText: '确认',
                                    cancelText: '取消',
                                    onOk: () => handleConfirmTechnicalVersion(currentTechnicalVersion)
                                  })
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                                  border: 'none'
                                }}
                              >
                                确认版本并开始报价
                              </Button>
                            </>
                          )}
                        </Space>
                      </div>
                      
                      {/* 只读表格 */}
                      <Table
                        bordered
                        dataSource={project?.technical_item_list || []}
                        rowKey={(record, index) => `tech_${index}`}
                        pagination={{ pageSize: 20 }}
                        scroll={{ x: 1600 }}
                        columns={[
                          {
                            title: '位号/标签',
                            dataIndex: 'tag',
                            key: 'tag',
                            width: 120,
                            render: (text) => <Tag color="blue">{text || '-'}</Tag>
                          },
                          {
                            title: '型号名称',
                            dataIndex: 'model_name',
                            key: 'model_name',
                            width: 180,
                            render: (text) => <strong>{text}</strong>
                          },
                          {
                            title: '数量',
                            dataIndex: 'quantity',
                            key: 'quantity',
                            width: 80
                          },
                          {
                            title: '描述/技术要求',
                            dataIndex: 'description',
                            key: 'description',
                            width: 200
                          },
                          {
                            title: '扭矩(Nm)',
                            dataIndex: ['technical_specs', 'torque'],
                            key: 'torque',
                            width: 100,
                            render: (text) => text || '-'
                          },
                          {
                            title: '压力(bar)',
                            dataIndex: ['technical_specs', 'pressure'],
                            key: 'pressure',
                            width: 100,
                            render: (text) => text || '-'
                          },
                          {
                            title: '旋转角度(°)',
                            dataIndex: ['technical_specs', 'rotation'],
                            key: 'rotation',
                            width: 100,
                            render: (text) => text || '-'
                          },
                          {
                            title: '阀门类型',
                            dataIndex: ['technical_specs', 'valve_type'],
                            key: 'valve_type',
                            width: 120,
                            render: (text) => text || '-'
                          },
                          {
                            title: '阀门尺寸',
                            dataIndex: ['technical_specs', 'valve_size'],
                            key: 'valve_size',
                            width: 100,
                            render: (text) => text || '-'
                          },
                          {
                            title: '备注',
                            dataIndex: 'notes',
                            key: 'notes',
                            width: 150,
                            render: (text) => text || '-'
                          }
                        ]}
                      />
                    </div>
                  ) : isSalesManager ? (
                    <div>
                      {/* 🔒 销售经理：纯只读视图（无编辑和驳回权限）*/}
                      <Alert
                        message="📋 技术清单（只读）"
                        description="您可以查看技术工程师提交的技术清单，但无法修改。如需调整，请与技术团队沟通。"
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                      
                      <div style={{ marginBottom: 16 }}>
                        <Space>
                          <Button
                            type="primary"
                            icon={<FilePdfOutlined />}
                            onClick={handleExportTechnicalItemListToPDF}
                            disabled={!project?.technical_item_list || project.technical_item_list.length === 0}
                          >
                            导出技术清单(PDF)
                          </Button>
                        </Space>
                      </div>
                      
                      {/* 只读表格（销售经理视图）*/}
                      <Table
                        bordered
                        dataSource={project?.technical_item_list || []}
                        rowKey={(record, index) => `tech_sm_${index}`}
                        pagination={{ pageSize: 20 }}
                        scroll={{ x: 1600 }}
                        columns={[
                          {
                            title: '位号/标签',
                            dataIndex: 'tag',
                            key: 'tag',
                            width: 120,
                            render: (text) => <Tag color="blue">{text || '-'}</Tag>
                          },
                          {
                            title: '型号名称',
                            dataIndex: 'model_name',
                            key: 'model_name',
                            width: 180,
                            render: (text) => <strong>{text}</strong>
                          },
                          {
                            title: '数量',
                            dataIndex: 'quantity',
                            key: 'quantity',
                            width: 80
                          },
                          {
                            title: '扭矩(Nm)',
                            dataIndex: ['technical_specs', 'torque'],
                            key: 'torque',
                            width: 100,
                            render: (text) => text || '-'
                          },
                          {
                            title: '压力(bar)',
                            dataIndex: ['technical_specs', 'pressure'],
                            key: 'pressure',
                            width: 100,
                            render: (text) => text || '-'
                          },
                          {
                            title: '旋转角度(°)',
                            dataIndex: ['technical_specs', 'rotation'],
                            key: 'rotation',
                            width: 100,
                            render: (text) => text || '-'
                          },
                          {
                            title: '阀门类型',
                            dataIndex: ['technical_specs', 'valve_type'],
                            key: 'valve_type',
                            width: 120,
                            render: (text) => text || '-'
                          },
                          {
                            title: '阀门尺寸',
                            dataIndex: ['technical_specs', 'valve_size'],
                            key: 'valve_size',
                            width: 100,
                            render: (text) => text || '-'
                          },
                          {
                            title: '备注',
                            dataIndex: 'notes',
                            key: 'notes',
                            width: 150,
                            render: (text) => text || '-'
                          }
                        ]}
                      />
                    </div>
                  ) : null}
                </div>
              )
            }] : []),
            
            // Tab 1: 选型明细 - 非技术工程师可见，但销售经理不可见
            ...(user?.role !== 'Technical Engineer' && user?.role !== 'Sales Manager' ? [{
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
                    <Space>
                      {/* 技术工程师专用按钮 */}
                      {user?.role === 'Technical Engineer' && project.selections && project.selections.length > 0 && (
                        <>
                          <Dropdown
                            menu={{
                              items: [
                                {
                                  key: 'excel',
                                  label: '导出为Excel',
                                  icon: <FileExcelOutlined />,
                                  onClick: handleExportTechnicalListToExcel
                                },
                                {
                                  key: 'pdf',
                                  label: '导出为PDF',
                                  icon: <FilePdfOutlined />,
                                  onClick: handleExportTechnicalListToPDF
                                }
                              ]
                            }}
                          >
                            <Button icon={<DownloadOutlined />} type="default">
                              <Space>
                                导出技术清单
                                <DownOutlined />
                              </Space>
                            </Button>
                          </Dropdown>
                          
                          {['Pending Technical Assignment', 'In Progress'].includes(project.status) && (
                            <Button
                              type="primary"
                              icon={<SendOutlined />}
                              onClick={() => {
                                Modal.confirm({
                                  title: '完成选型，请求报价',
                                  content: '确定完成技术选型并提交给商务团队进行报价吗？',
                                  okText: '确认提交',
                                  cancelText: '取消',
                                  onOk: async () => {
                                    try {
                                      await projectsAPI.update(id, { status: 'Pending Quote' })
                                      message.success('选型已完成，已提交商务报价！')
                                      fetchProject()
                                    } catch (error) {
                                      message.error('提交失败: ' + (error.response?.data?.message || error.message))
                                    }
                                  }
                                })
                              }}
                              style={{
                                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                                border: 'none'
                              }}
                            >
                              完成选型，请求报价
                            </Button>
                          )}
                        </>
                      )}
                      
                    {/* 新增选型按钮 - 销售经理不可见 */}
                    {!isSalesManager && (
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/selection-engine')}>
                        新增选型
                      </Button>
                    )}
                    </Space>
                  </div>

                  {/* 优化按钮 - 仅管理员和商务工程师可见（排除销售经理）*/}
                  {['Administrator', 'Sales Engineer'].includes(user?.role) && 
                   project.selections && project.selections.length > 0 && (
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
            }] : []),
            
            // Tab 2: BOM清单 - 仅特定角色可见（排除技术工程师和销售经理）
            ...(['Administrator', 'Sales Engineer', 'Procurement Specialist'].includes(user?.role) ? [{
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
                      description={`您可以${canEditTechnical ? '从选型自动生成BOM清单，也可以手动添加、编辑或删除条目。' : '查看'}BOM清单。${canEditTechnical ? '编辑完成后请点击"保存BOM"按钮保存到项目中。' : ''}`}
                      type="info"
                      showIcon
                      style={{ marginBottom: 12 }}
                    />
                    
                    <Space size="middle" wrap>
                      {/* 生成BOM按钮 - 技术工程师和销售工程师可用（销售经理不可用）*/}
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
                      
                      {/* 手动添加行 - 可编辑角色（销售经理不可用）*/}
                      {canEditTechnical && (
                        <Button
                          icon={<PlusOutlined />}
                          onClick={handleAddBOMRow}
                          disabled={editingKey !== ''}
                        >
                          手动添加行
                        </Button>
                      )}
                      
                      {/* 保存BOM - 可编辑角色（销售经理不可用）*/}
                      {canEditTechnical && (
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
                  
                  {/* 可编辑的BOM表格（销售经理只读）*/}
                  {bomData.length > 0 ? (
                    <div>
                      <Form form={bomForm} component={false}>
                        <Table
                          columns={canEditTechnical ? editableBOMColumns : editableBOMColumns.filter(col => col.key !== 'actions')}
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
            // Tab 3: 报价工作台 - Sales Engineer和Administrator（可编辑），Sales Manager（只读，已报价后可见）
            ...(['Sales Engineer', 'Administrator'].includes(user?.role) || (isSalesManager && isQuotationComplete) ? [{
              key: 'quotation',
              label: (
                <span>
                  <TagsOutlined />
                  报价工作台
                  {quotationBomData.length > 0 && <Tag color="green" style={{ marginLeft: 8 }}>{quotationBomData.length}</Tag>}
                </span>
              ),
              children: (
                <div>
                  {isSalesManager ? (
                    /* 🔒 销售经理：纯只读视图 */
                    <div>
                      <Alert
                        message="💰 报价单（只读）"
                        description="您可以查看商务工程师完成的报价单，但无法修改。如需调整报价，请与商务团队沟通。"
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                      
                      {quotationBasedOnVersion && (
                        <Alert
                          message={`✅ 此报价基于技术清单版本: ${quotationBasedOnVersion}`}
                          description="报价数据已锁定，确保报价的准确性和可追溯性。"
                          type="success"
                          showIcon
                          icon={<CheckCircleOutlined />}
                          style={{ marginBottom: 16 }}
                        />
                      )}
                      
                      <div style={{ marginBottom: 16 }}>
                        <Space>
                          <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={handleExportQuotationToExcel}
                            disabled={quotationBomData.length === 0}
                          >
                            导出报价单(Excel)
                          </Button>
                          
                          <Button
                            icon={<FilePdfOutlined />}
                            onClick={handleGenerateQuotePDF}
                            disabled={quotationBomData.length === 0}
                          >
                            生成报价单PDF
                          </Button>
                        </Space>
                      </div>
                      
                      {quotationBomData.length > 0 ? (
                        <div>
                          <Table
                            columns={readonlyQuotationBOMColumns}
                            dataSource={quotationBomData}
                            rowKey="key"
                            pagination={false}
                            bordered
                            scroll={{ x: 1400 }}
                          />
                          
                          <Divider />
                          
                          {/* 统计信息 */}
                          <div style={{ textAlign: 'right' }}>
                            <Space size="large">
                              <Statistic
                                title="产品数"
                                value={quotationBomData.length}
                                suffix="个"
                              />
                              <Statistic
                                title="总数量"
                                value={quotationBomData.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                                suffix="台"
                              />
                              <Statistic
                                title="报价总额"
                                value={quotationBomData.reduce((sum, item) => sum + (item.total_price || 0), 0)}
                                prefix="¥"
                                valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
                              />
                            </Space>
                          </div>
                        </div>
                      ) : (
                        <Alert
                          message="暂无报价数据"
                          description="等待商务工程师完成报价..."
                          type="warning"
                          showIcon
                        />
                      )}
                    </div>
                  ) : (
                    /* 商务工程师：完整编辑视图 */
                    <div>
                      {/* 功能按钮区 */}
                      <div style={{ marginBottom: 16 }}>
                        {/* 🔒 项目锁定状态提示 */}
                        {isProjectLocked ? (
                      <Alert
                        message="🔒 项目已锁定"
                        description={`${lockedReason}。所有报价数据已锁定，如需变更，请执行合同变更流程（ECO）。`}
                        type="error"
                        showIcon
                        icon={<FileProtectOutlined />}
                        style={{ marginBottom: 12 }}
                      />
                    ) : !technicalListLocked ? (
                      <Alert
                        message="⚠️ 技术清单尚未锁定"
                        description="技术工程师尚未提交技术清单，请等待技术清单提交并锁定后再开始报价工作。报价必须基于已确认的技术清单版本。"
                        type="warning"
                        showIcon
                        style={{ marginBottom: 12 }}
                      />
                    ) : quotationBasedOnVersion ? (
                      <Alert
                        message={`✅ 此报价基于技术清单版本: ${quotationBasedOnVersion}`}
                        description={`报价BOM已从技术清单版本 ${quotationBasedOnVersion} 生成。该版本已锁定，确保报价的严谨性和可追溯性。您可以调整价格策略，但不能修改技术方案。`}
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                        style={{ marginBottom: 12 }}
                      />
                    ) : (
                      <Alert
                        message={`💰 报价工作台 - 当前技术清单版本 ${currentTechnicalVersion}`}
                        description='技术清单已锁定。点击"从技术清单生成"按钮，系统将基于当前锁定的技术清单版本创建报价BOM快照。'
                        type="info"
                        showIcon
                        style={{ marginBottom: 12 }}
                      />
                    )}
                    
                    <Space size="middle" wrap>
                      {/* 从技术清单生成 */}
                      <Tooltip title={isProjectLocked ? '项目已锁定，无法修改报价' : !technicalListLocked ? '请等待技术清单锁定后再生成报价' : ''}>
                        <Button
                          type="primary"
                          size="large"
                          icon={<ThunderboltOutlined />}
                          onClick={handleGenerateQuotationFromTechnicalList}
                          loading={generatingQuotation}
                          disabled={isProjectLocked || !technicalListLocked || !project?.technical_item_list || project.technical_item_list.length === 0}
                          style={{
                            background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                            border: 'none',
                          }}
                        >
                          从技术清单生成
                        </Button>
                      </Tooltip>
                      
                      {/* 手动添加行 */}
                      {!isProjectLocked && (
                        <Button
                          icon={<PlusOutlined />}
                          onClick={handleAddQuotationRow}
                          disabled={quotationEditingKey !== ''}
                        >
                          手动添加行
                        </Button>
                      )}
                      
                      {/* 保存报价BOM */}
                      {!isProjectLocked && (
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          onClick={handleSaveQuotationBOM}
                          loading={savingQuotation}
                          disabled={quotationBomData.length === 0 || quotationEditingKey !== ''}
                        >
                          保存报价BOM
                        </Button>
                      )}
                      
                      {/* 完成报价按钮 */}
                      {!isProjectLocked && (project.status === '待商务报价' || project.status === 'Pending Quote') && quotationBomData.length > 0 && (
                        <Button
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={handleCompleteQuotation}
                          disabled={quotationEditingKey !== ''}
                          style={{
                            background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
                            border: 'none'
                          }}
                        >
                          完成报价
                        </Button>
                      )}
                    </Space>
                  </div>
                  
                  {/* 可编辑的报价BOM表格 */}
                  {quotationBomData.length > 0 ? (
                    <div>
                      <Form form={quotationForm} component={false}>
                        <Table
                          columns={quotationBOMColumns}
                          dataSource={quotationBomData}
                          rowKey="key"
                          pagination={false}
                          bordered
                          scroll={{ x: 1600 }}
                          rowClassName={(record) => 
                            isQuotationEditing(record) ? 'editable-row-editing' : ''
                          }
                        />
                      </Form>
                      
                      <Divider />
                      
                      {/* 统计信息 */}
                      <div style={{ textAlign: 'right' }}>
                        <Space size="large">
                          <Statistic
                            title="产品数"
                            value={quotationBomData.length}
                            suffix="个"
                          />
                          <Statistic
                            title="总数量"
                            value={quotationBomData.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                            suffix="台"
                          />
                          <Statistic
                            title="报价总额"
                            value={quotationBomData.reduce((sum, item) => sum + (item.total_price || 0), 0)}
                            prefix="¥"
                            valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
                          />
                          {['Administrator'].includes(user?.role) && (
                            <>
                              <Statistic
                                title="总成本"
                                value={quotationBomData.reduce((sum, item) => sum + ((item.cost_price || 0) * (item.quantity || 0)), 0)}
                                prefix="¥"
                                valueStyle={{ color: '#999' }}
                              />
                              <Statistic
                                title="预计利润"
                                value={quotationBomData.reduce((sum, item) => 
                                  sum + (item.total_price - (item.cost_price || 0) * item.quantity), 0
                                )}
                                prefix="¥"
                                valueStyle={{ color: '#1890ff' }}
                              />
                            </>
                          )}
                        </Space>
                      </div>
                    </div>
                  ) : (
                    <Alert
                      message="暂无报价BOM数据"
                      description={
                        <div>
                          <p>您可以通过以下方式开始创建报价BOM：</p>
                          <ul style={{ marginBottom: 0 }}>
                            <li>点击"从技术清单生成"按钮，系统将自动导入技术工程师的选型数据，并带入标准基础价</li>
                            <li>点击"手动添加行"按钮，手动创建报价条目</li>
                            <li>使用"价格策略"工具为每个产品设置阶梯价格或批量折扣</li>
                          </ul>
                        </div>
                      }
                      type="warning"
                      showIcon
                    />
                  )}
                    </div>
                  )}
                </div>
              ),
            }] : []),
            // Tab 4: 报价详情 - 仅Sales Manager可见（只读版本）
            ...(user?.role === 'Sales Manager' ? [{
              key: 'quote_details',
              label: (
                <span>
                  <FileProtectOutlined />
                  报价详情
                  {quotationBomData.length > 0 && <Tag color="cyan" style={{ marginLeft: 8 }}>{quotationBomData.length}</Tag>}
                </span>
              ),
              children: (
                <div>
                  {/* 功能按钮区 */}
                  <div style={{ marginBottom: 16 }}>
                    <Alert
                      message="📄 报价详情 - Quote Details"
                      description="这是商务团队提交的报价方案，您可以查看详细价格并下载报价单文件。成本价和利润信息已隐藏，如需查看请联系管理员。"
                      type="info"
                      showIcon
                      style={{ marginBottom: 12 }}
                    />
                    
                    <Space size="middle" wrap>
                      {/* 下载报价单下拉菜单 */}
                      {quotationBomData.length > 0 && (
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: 'excel',
                                label: '导出为Excel',
                                icon: <FileExcelOutlined />,
                                onClick: handleExportQuotationToExcel
                              },
                              {
                                key: 'pdf',
                                label: '导出为PDF',
                                icon: <FilePdfOutlined />,
                                onClick: handleExportQuotationToPDF
                              }
                            ]
                          }}
                        >
                          <Button type="primary" icon={<DownloadOutlined />}>
                            <Space>
                              下载报价单
                              <DownOutlined />
                            </Space>
                          </Button>
                        </Dropdown>
                      )}
                      
                      {/* 审批按钮 */}
                      {project.status === 'Quoted' && quotationBomData.length > 0 && (
                        <>
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => {
                              Modal.confirm({
                                title: '审批通过报价',
                                content: '确定审批通过此报价方案吗？审批后将更新项目状态为"已审批"。',
                                okText: '审批通过',
                                cancelText: '取消',
                                onOk: async () => {
                                  try {
                                    await projectsAPI.update(id, { status: 'Approved' })
                                    message.success('报价已审批通过！')
                                    fetchProject()
                                  } catch (error) {
                                    message.error('审批失败: ' + (error.response?.data?.message || error.message))
                                  }
                                }
                              })
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                              border: 'none'
                            }}
                          >
                            审批通过
                          </Button>
                          
                          <Button
                            danger
                            icon={<CloseOutlined />}
                            onClick={() => {
                              Modal.confirm({
                                title: '驳回报价',
                                content: '确定驳回此报价方案吗？商务团队需要重新制定报价。',
                                okText: '确认驳回',
                                cancelText: '取消',
                                onOk: async () => {
                                  try {
                                    await projectsAPI.update(id, { status: 'Pending Quote' })
                                    message.success('报价已驳回，请商务团队重新报价')
                                    fetchProject()
                                  } catch (error) {
                                    message.error('操作失败: ' + (error.response?.data?.message || error.message))
                                  }
                                }
                              })
                            }}
                          >
                            驳回报价
                          </Button>
                        </>
                      )}
                    </Space>
                  </div>
                  
                  {/* 只读的报价BOM表格 */}
                  {quotationBomData.length > 0 ? (
                    <div>
                      <Table
                        columns={readonlyQuotationBOMColumns}
                        dataSource={quotationBomData}
                        rowKey="key"
                        pagination={false}
                        bordered
                        scroll={{ x: 1200 }}
                      />
                      
                      <Divider />
                      
                      {/* 统计信息 */}
                      <div style={{ textAlign: 'right' }}>
                        <Space size="large">
                          <Statistic
                            title="产品数"
                            value={quotationBomData.length}
                            suffix="个"
                          />
                          <Statistic
                            title="总数量"
                            value={quotationBomData.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                            suffix="台"
                          />
                          <Statistic
                            title="报价总额"
                            value={quotationBomData.reduce((sum, item) => sum + (item.total_price || 0), 0)}
                            prefix="¥"
                            valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
                          />
                        </Space>
                      </div>
                      
                      {/* 报价摘要信息 */}
                      <Divider />
                      <Card 
                        title="报价摘要 / Quotation Summary" 
                        size="small"
                        style={{ marginTop: 16, background: '#fafafa' }}
                      >
                        <Descriptions bordered column={2} size="small">
                          <Descriptions.Item label="项目编号">
                            {project?.projectNumber || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="项目名称">
                            {project?.projectName || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="客户名称">
                            {project?.client?.name || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="报价状态">
                            <Tag color={project.status === 'Quoted' ? 'processing' : 'success'}>
                              {project.status}
                            </Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="报价日期">
                            {dayjs().format('YYYY-MM-DD')}
                          </Descriptions.Item>
                          <Descriptions.Item label="有效期至">
                            {dayjs().add(30, 'day').format('YYYY-MM-DD')}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </div>
                  ) : (
                    <Alert
                      message="暂无报价数据"
                      description="商务团队尚未提交报价方案，请稍后再查看。"
                      type="warning"
                      showIcon
                    />
                  )}
                </div>
              ),
            }] : []),
            // Tab 5: 合同处理 - 销售经理和商务工程师可见
            ...(['Sales Manager', 'Sales Engineer', 'Administrator'].includes(user?.role) ? [{
              key: 'contract',
              label: (
                <span>
                  <FileProtectOutlined />
                  合同处理
                  {project.contract_files?.final_contract && <Tag color="success" style={{ marginLeft: 8 }}>已签订</Tag>}
                  {project.status === 'Pending Contract Review' && <Tag color="processing" style={{ marginLeft: 8 }}>待审核</Tag>}
                  {project.status === 'Pending Client Signature' && <Tag color="warning" style={{ marginLeft: 8 }}>待签字</Tag>}
                </span>
              ),
              children: (
                <div>
                  <Alert
                    message="📝 合同处理流程 - Contract Processing"
                    description="多步骤合同签订流程：销售经理上传草签合同 → 商务工程师盖章审核 → 销售经理上传最终签署合同"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  
                  {/* 流程步骤显示 */}
                  <Card title="合同流程进度" style={{ marginBottom: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                      {/* 步骤1: 销售经理上传草签合同 */}
                      <Card
                        type="inner"
                        title={
                          <Space>
                            <span>步骤 1: 上传草签合同</span>
                            {project.contract_files?.draft_contract ? (
                              <Tag color="success" icon={<CheckCircleOutlined />}>已完成</Tag>
                            ) : (
                              <Tag color={project.status === 'Won' ? 'processing' : 'default'}>
                                {project.status === 'Won' ? '待处理' : '未开始'}
                              </Tag>
                            )}
                          </Space>
                        }
                        size="small"
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Typography.Text type="secondary">
                            责任人：销售经理 | 状态要求：赢单(Won)
                          </Typography.Text>
                          
                          {project.contract_files?.draft_contract ? (
                            <div>
                              <Typography.Text strong>已上传草签合同：</Typography.Text>
                              <div style={{ marginTop: 8 }}>
                                <Space>
                                  <FileTextOutlined style={{ color: '#1890ff' }} />
                                  <Typography.Link onClick={() => window.open(project.contract_files.draft_contract.file_url, '_blank')}>
                                    {project.contract_files.draft_contract.file_name}
                                  </Typography.Link>
                                  <Button
                                    type="link"
                                    size="small"
                                    icon={<DownloadOutlined />}
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = project.contract_files.draft_contract.file_url;
                                      link.download = project.contract_files.draft_contract.file_name;
                                      link.click();
                                    }}
                                  >
                                    下载
                                  </Button>
                                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                    上传于: {dayjs(project.contract_files.draft_contract.uploadedAt).format('YYYY-MM-DD HH:mm')}
                                  </Typography.Text>
                                </Space>
                              </div>
                            </div>
                          ) : (
                            user?.role === 'Sales Manager' && project.status === 'Won' ? (
                              <div>
                                <Typography.Paragraph>
                                  请上传与客户初步确认的草签合同，上传后将自动提交给商务团队进行审核和盖章。
                                </Typography.Paragraph>
                                <CloudUpload
                                  fileList={contractFileList}
                                  onChange={({ fileList }) => setContractFileList(fileList)}
                                  onSuccess={handleUploadDraftContract}
                                  folder="contracts"
                                  maxCount={1}
                                >
                                  <Button type="primary" icon={<UploadOutlined />} loading={uploadingContract}>
                                    上传草签合同
                                  </Button>
                                </CloudUpload>
                              </div>
                            ) : (
                              <Typography.Text type="secondary">
                                等待销售经理上传草签合同...
                              </Typography.Text>
                            )
                          )}
                        </Space>
                      </Card>
                      
                      {/* 步骤2: 商务工程师上传我方盖章合同 */}
                      <Card
                        type="inner"
                        title={
                          <Space>
                            <span>步骤 2: 我方盖章审核</span>
                            {project.contract_files?.company_sealed_contract ? (
                              <Tag color="success" icon={<CheckCircleOutlined />}>已完成</Tag>
                            ) : (
                              <Tag color={project.status === 'Pending Contract Review' ? 'processing' : 'default'}>
                                {project.status === 'Pending Contract Review' ? '待处理' : '未开始'}
                              </Tag>
                            )}
                          </Space>
                        }
                        size="small"
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Typography.Text type="secondary">
                            责任人：商务工程师 | 状态要求：待商务审核合同(Pending Contract Review)
                          </Typography.Text>
                          
                          {project.contract_files?.company_sealed_contract ? (
                            <div>
                              <Typography.Text strong>已上传我方盖章合同：</Typography.Text>
                              <div style={{ marginTop: 8 }}>
                                <Space>
                                  <FileTextOutlined style={{ color: '#52c41a' }} />
                                  <Typography.Link onClick={() => window.open(project.contract_files.company_sealed_contract.file_url, '_blank')}>
                                    {project.contract_files.company_sealed_contract.file_name}
                                  </Typography.Link>
                                  <Button
                                    type="link"
                                    size="small"
                                    icon={<DownloadOutlined />}
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = project.contract_files.company_sealed_contract.file_url;
                                      link.download = project.contract_files.company_sealed_contract.file_name;
                                      link.click();
                                    }}
                                  >
                                    下载
                                  </Button>
                                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                    上传于: {dayjs(project.contract_files.company_sealed_contract.uploadedAt).format('YYYY-MM-DD HH:mm')}
                                  </Typography.Text>
                                </Space>
                              </div>
                            </div>
                          ) : (
                            user?.role === 'Sales Engineer' && project.status === 'Pending Contract Review' ? (
                              <div>
                                {project.contract_files?.draft_contract && (
                                  <div style={{ marginBottom: 16 }}>
                                    <Typography.Text strong>草签合同（供审核）：</Typography.Text>
                                    <div style={{ marginTop: 8 }}>
                                      <Space>
                                        <FileTextOutlined />
                                        <Typography.Link onClick={() => window.open(project.contract_files.draft_contract.file_url, '_blank')}>
                                          {project.contract_files.draft_contract.file_name}
                                        </Typography.Link>
                                        <Button
                                          type="link"
                                          size="small"
                                          icon={<DownloadOutlined />}
                                          onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = project.contract_files.draft_contract.file_url;
                                            link.download = project.contract_files.draft_contract.file_name;
                                            link.click();
                                          }}
                                        >
                                          下载
                                        </Button>
                                      </Space>
                                    </div>
                                  </div>
                                )}
                                <Typography.Paragraph>
                                  请审核草签合同，确认无误后盖上公司公章，并上传盖章后的合同。
                                </Typography.Paragraph>
                                <CloudUpload
                                  fileList={contractFileList}
                                  onChange={({ fileList }) => setContractFileList(fileList)}
                                  onSuccess={handleUploadCompanySealedContract}
                                  folder="contracts"
                                  maxCount={1}
                                >
                                  <Button type="primary" icon={<UploadOutlined />} loading={uploadingContract}>
                                    上传我方盖章合同
                                  </Button>
                                </CloudUpload>
                              </div>
                            ) : (
                              <Typography.Text type="secondary">
                                等待商务工程师审核并盖章...
                              </Typography.Text>
                            )
                          )}
                        </Space>
                      </Card>
                      
                      {/* 步骤3: 销售经理上传最终合同 */}
                      <Card
                        type="inner"
                        title={
                          <Space>
                            <span>步骤 3: 上传最终签署合同</span>
                            {project.contract_files?.final_contract ? (
                              <Tag color="success" icon={<CheckCircleOutlined />}>已完成</Tag>
                            ) : (
                              <Tag color={project.status === 'Pending Client Signature' ? 'processing' : 'default'}>
                                {project.status === 'Pending Client Signature' ? '待处理' : '未开始'}
                              </Tag>
                            )}
                          </Space>
                        }
                        size="small"
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Typography.Text type="secondary">
                            责任人：销售经理 | 状态要求：待客户盖章(Pending Client Signature)
                          </Typography.Text>
                          
                          {project.contract_files?.final_contract ? (
                            <div>
                              <Typography.Text strong style={{ color: '#52c41a' }}>✅ 最终签署合同：</Typography.Text>
                              <div style={{ marginTop: 8 }}>
                                <Space>
                                  <FileProtectOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                                  <Typography.Link strong onClick={() => window.open(project.contract_files.final_contract.file_url, '_blank')}>
                                    {project.contract_files.final_contract.file_name}
                                  </Typography.Link>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<DownloadOutlined />}
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = project.contract_files.final_contract.file_url;
                                      link.download = project.contract_files.final_contract.file_name;
                                      link.click();
                                    }}
                                  >
                                    下载最终合同
                                  </Button>
                                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                    上传于: {dayjs(project.contract_files.final_contract.uploadedAt).format('YYYY-MM-DD HH:mm')}
                                  </Typography.Text>
                                </Space>
                              </div>
                              <Alert
                                message="合同签订完成！"
                                description="双方签字盖章的最终合同已上传，合同流程已完成。"
                                type="success"
                                showIcon
                                style={{ marginTop: 16 }}
                              />
                            </div>
                          ) : (
                            user?.role === 'Sales Manager' && project.status === 'Pending Client Signature' ? (
                              <div>
                                {project.contract_files?.company_sealed_contract && (
                                  <div style={{ marginBottom: 16 }}>
                                    <Typography.Text strong>我方盖章合同（供客户签字）：</Typography.Text>
                                    <div style={{ marginTop: 8 }}>
                                      <Space>
                                        <FileTextOutlined />
                                        <Typography.Link onClick={() => window.open(project.contract_files.company_sealed_contract.file_url, '_blank')}>
                                          {project.contract_files.company_sealed_contract.file_name}
                                        </Typography.Link>
                                        <Button
                                          type="link"
                                          size="small"
                                          icon={<DownloadOutlined />}
                                          onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = project.contract_files.company_sealed_contract.file_url;
                                            link.download = project.contract_files.company_sealed_contract.file_name;
                                            link.click();
                                          }}
                                        >
                                          下载
                                        </Button>
                                      </Space>
                                    </div>
                                  </div>
                                )}
                                <Typography.Paragraph>
                                  请将我方盖章合同交给客户签字盖章，待客户签署完成后，上传双方签字盖章的最终版合同。
                                </Typography.Paragraph>
                                <CloudUpload
                                  fileList={contractFileList}
                                  onChange={({ fileList }) => setContractFileList(fileList)}
                                  onSuccess={handleUploadFinalContract}
                                  folder="contracts"
                                  maxCount={1}
                                >
                                  <Button type="primary" icon={<UploadOutlined />} loading={uploadingContract}>
                                    上传最终签署合同
                                  </Button>
                                </CloudUpload>
                              </div>
                            ) : (
                              <Typography.Text type="secondary">
                                等待销售经理上传客户签字后的最终合同...
                              </Typography.Text>
                            )
                          )}
                        </Space>
                      </Card>
                    </Space>
                  </Card>
                  
                  {/* 合同状态总览 */}
                  <Card title="合同状态总览" size="small">
                    <Descriptions bordered column={2}>
                      <Descriptions.Item label="当前项目状态">
                        <Tag color={
                          project.status === 'Contract Signed' ? 'success' :
                          project.status === 'Pending Client Signature' ? 'warning' :
                          project.status === 'Pending Contract Review' ? 'processing' :
                          project.status === 'Won' ? 'blue' : 'default'
                        }>
                          {project.status}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="合同流程进度">
                        {project.contract_files?.final_contract ? '100% - 已完成' :
                         project.contract_files?.company_sealed_contract ? '66% - 待客户签字' :
                         project.contract_files?.draft_contract ? '33% - 待商务审核' :
                         project.status === 'Won' ? '0% - 待上传草签合同' : '未开始'}
                      </Descriptions.Item>
                      <Descriptions.Item label="草签合同">
                        {project.contract_files?.draft_contract ? (
                          <Tag color="success" icon={<CheckCircleOutlined />}>已上传</Tag>
                        ) : (
                          <Tag>未上传</Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="我方盖章合同">
                        {project.contract_files?.company_sealed_contract ? (
                          <Tag color="success" icon={<CheckCircleOutlined />}>已上传</Tag>
                        ) : (
                          <Tag>未上传</Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="最终签署合同">
                        {project.contract_files?.final_contract ? (
                          <Tag color="success" icon={<CheckCircleOutlined />}>已上传</Tag>
                        ) : (
                          <Tag>未上传</Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="签订时间">
                        {project.contract_files?.final_contract?.uploadedAt ? 
                          dayjs(project.contract_files.final_contract.uploadedAt).format('YYYY-MM-DD HH:mm') : 
                          '-'
                        }
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                  
                  {/* 确认收款并创建生产订单 - 仅商务工程师可见，且项目状态为Contract Signed */}
                  {user?.role === 'Sales Engineer' && project.status === 'Contract Signed' && (
                    <Card 
                      title={
                        <Space>
                          <DollarOutlined style={{ color: '#52c41a' }} />
                          <span>💰 财务确认收款并创建生产订单</span>
                          <Tag color="orange">财务职责</Tag>
                        </Space>
                      }
                      style={{ marginTop: 16 }}
                      extra={
                        project.status === 'In Production' ? (
                          <Tag color="success" icon={<CheckCircleOutlined />}>已创建生产订单</Tag>
                        ) : null
                      }
                    >
                      <Alert
                        message="📋 财务收款确认与生产订单创建流程"
                        description={
                          <div>
                            <p><strong>财务职责提醒：</strong></p>
                            <p>作为公司财务负责人（商务工程师兼任），请您在确认预付款实际到账后，执行以下操作。</p>
                            <p>系统将记录您的确认操作，包括姓名、时间、IP地址等审计信息。</p>
                          </div>
                        }
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                      
                      {/* 🔒 操作历史和合同版本查看按钮 */}
                      <div style={{ marginBottom: 16 }}>
                        <Space>
                          <Button
                            icon={<HistoryOutlined />}
                            onClick={() => setOperationHistoryVisible(true)}
                          >
                            查看操作历史
                          </Button>
                          <Button
                            icon={<FileProtectOutlined />}
                            onClick={() => setContractVersionHistoryVisible(true)}
                          >
                            合同版本历史
                          </Button>
                        </Space>
                      </div>
                      
                      <Space direction="vertical" style={{ width: '100%' }} size="large">
                        {/* 报价BOM检查 */}
                        <div>
                          <Typography.Text strong>报价BOM检查：</Typography.Text>
                          {project.quotation_bom && project.quotation_bom.length > 0 ? (
                            <div style={{ marginTop: 8 }}>
                              <Tag color="success" icon={<CheckCircleOutlined />}>
                                报价BOM已就绪 ({project.quotation_bom.length} 项)
                              </Tag>
                              <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                                订单金额: ¥{(project.quotation_bom.reduce((sum, item) => sum + (item.total_price || 0), 0) * 1.13).toFixed(2)} (含13%税)
                              </Typography.Text>
                            </div>
                          ) : (
                            <div style={{ marginTop: 8 }}>
                              <Tag color="error">报价BOM未创建</Tag>
                              <Typography.Text type="danger" style={{ marginLeft: 8 }}>
                                请先在"报价工作台"Tab创建报价BOM
                              </Typography.Text>
                            </div>
                          )}
                        </div>
                        
                        {/* 预付款确认 */}
                        <div>
                          <Typography.Text strong>预付款确认：</Typography.Text>
                          <div style={{ marginTop: 8 }}>
                            <Space direction="vertical">
                              <div>
                                <Typography.Text type="secondary">
                                  预付款金额（30%）: ¥
                                  {project.quotation_bom && project.quotation_bom.length > 0 
                                    ? ((project.quotation_bom.reduce((sum, item) => sum + (item.total_price || 0), 0) * 1.13) * 0.3).toFixed(2)
                                    : '0.00'
                                  }
                                </Typography.Text>
                              </div>
                              <div>
                                <input
                                  type="checkbox"
                                  id="payment-confirmation"
                                  checked={paymentConfirmed}
                                  onChange={(e) => setPaymentConfirmed(e.target.checked)}
                                  style={{ marginRight: 8 }}
                                />
                                <label htmlFor="payment-confirmation" style={{ cursor: 'pointer' }}>
                                  <Typography.Text strong>
                                    确认已收到30%预付款
                                  </Typography.Text>
                                </label>
                              </div>
                            </Space>
                          </div>
                        </div>
                        
                        {/* 创建按钮 */}
                        <div>
                          <Button
                            type="primary"
                            size="large"
                            icon={<ShoppingCartOutlined />}
                            onClick={handleCreateProductionOrder}
                            disabled={!paymentConfirmed || !project.quotation_bom || project.quotation_bom.length === 0}
                            loading={creatingProduction}
                            block
                          >
                            创建生产订单
                          </Button>
                          {!paymentConfirmed && (
                            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8, textAlign: 'center' }}>
                              请先勾选"确认已收到30%预付款"
                            </Typography.Text>
                          )}
                        </div>
                        
                        {/* 说明 */}
                        <Alert
                          message="操作说明"
                          description={
                            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                              <li>点击"创建生产订单"后，系统将自动创建销售订单和生产订单</li>
                              <li>生产订单状态将设置为"待排产"，可在生产管理模块进行排程</li>
                              <li>项目状态将自动更新为"生产中"</li>
                              <li>订单金额基于报价BOM计算，包含13%增值税</li>
                            </ul>
                          }
                          type="warning"
                          showIcon
                        />
                      </Space>
                    </Card>
                  )}
                </div>
              ),
            }] : []),
            // Tab 6: 项目文件 - 所有人可见
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
        styles={{ body: { padding: '24px' } }}
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
                    styles={{ body: { padding: 12 } }}
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
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
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

      {/* 价格策略设置Modal */}
      <Modal
        title={
          <Space>
            <SettingOutlined style={{ color: '#1890ff', fontSize: 20 }} />
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>价格策略设置</span>
          </Space>
        }
        open={pricingModalVisible}
        onCancel={() => {
          setPricingModalVisible(false)
          setCurrentPricingItem(null)
          pricingForm.resetFields()
        }}
        onOk={handleSavePricingStrategy}
        okText="保存策略"
        cancelText="取消"
        width={800}
      >
        {currentPricingItem && (
          <div>
            <Alert
              message={`产品: ${currentPricingItem.model_name}`}
              description={`基础价: ¥${(currentPricingItem.base_price || 0).toLocaleString()} | 当前数量: ${currentPricingItem.quantity}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Form
              form={pricingForm}
              layout="vertical"
            >
              <Form.Item
                label="定价类型"
                name="pricing_type"
                rules={[{ required: true, message: '请选择定价类型' }]}
              >
                <Radio.Group>
                  <Radio.Button value="standard">标准价格</Radio.Button>
                  <Radio.Button value="tiered">阶梯价格</Radio.Button>
                  <Radio.Button value="manual_override">手动覆盖</Radio.Button>
                </Radio.Group>
              </Form.Item>
              
              <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.pricing_type !== currentValues.pricing_type}>
                {({ getFieldValue }) => {
                  const pricingType = getFieldValue('pricing_type')
                  
                  if (pricingType === 'manual_override') {
                    return (
                      <>
                        <Form.Item
                          label="手动价格 (¥)"
                          name="manual_price"
                          rules={[{ required: true, message: '请输入手动价格' }]}
                        >
                          <InputNumber
                            min={0}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="输入覆盖价格"
                          />
                        </Form.Item>
                        
                        <Form.Item
                          label="折扣百分比（显示用）"
                          name="discount_percentage"
                        >
                          <InputNumber
                            min={0}
                            max={100}
                            precision={1}
                            style={{ width: '100%' }}
                            placeholder="例如: 15 表示15%折扣"
                            suffix="%"
                          />
                        </Form.Item>
                      </>
                    )
                  }
                  
                  if (pricingType === 'tiered') {
                    return (
                      <Form.List
                        name="tiers"
                        rules={[
                          {
                            validator: async (_, tiers) => {
                              if (!tiers || tiers.length < 1) {
                                return Promise.reject(new Error('至少需要一个价格档位'))
                              }
                            },
                          },
                        ]}
                      >
                        {(fields, { add, remove }, { errors }) => (
                          <>
                            <div style={{ marginBottom: 8 }}>
                              <strong>阶梯价格配置：</strong>
                              <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                                根据购买数量设置不同单价
                              </Typography.Text>
                            </div>
                            
                            {fields.map((field, index) => (
                              <Space key={field.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                                <Form.Item
                                  {...field}
                                  label={index === 0 ? '最小数量' : ''}
                                  name={[field.name, 'min_quantity']}
                                  rules={[{ required: true, message: '必填' }]}
                                  style={{ marginBottom: 0, width: 120 }}
                                >
                                  <InputNumber min={1} placeholder="数量" style={{ width: '100%' }} />
                                </Form.Item>
                                
                                <Typography.Text>≤ 数量时，</Typography.Text>
                                
                                <Form.Item
                                  {...field}
                                  label={index === 0 ? '单价 (¥)' : ''}
                                  name={[field.name, 'unit_price']}
                                  rules={[{ required: true, message: '必填' }]}
                                  style={{ marginBottom: 0, width: 150 }}
                                >
                                  <InputNumber min={0} precision={2} placeholder="单价" style={{ width: '100%' }} />
                                </Form.Item>
                                
                                {fields.length > 1 && (
                                  <Button
                                    type="link"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => remove(field.name)}
                                  >
                                    删除
                                  </Button>
                                )}
                              </Space>
                            ))}
                            
                            <Button
                              type="dashed"
                              onClick={() => add({ min_quantity: 1, unit_price: currentPricingItem?.base_price || 0 })}
                              icon={<PlusOutlined />}
                              style={{ width: '100%', marginTop: 8 }}
                            >
                              添加价格档位
                            </Button>
                            
                            <Form.ErrorList errors={errors} />
                            
                            <Alert
                              message="提示"
                              description="系统会根据购买数量自动选择最优惠的价格档位。例如：1-9台单价¥1000，10-49台单价¥950，50台以上单价¥900"
                              type="info"
                              showIcon
                              style={{ marginTop: 16 }}
                            />
                          </>
                        )}
                      </Form.List>
                    )
                  }
                  
                  // standard 类型
                  return (
                    <Alert
                      message="标准价格"
                      description={`使用基础价格: ¥${(currentPricingItem?.base_price || 0).toLocaleString()}`}
                      type="success"
                      showIcon
                    />
                  )
                }}
              </Form.Item>
              
              <Form.Item
                label="定价备注"
                name="pricing_notes"
              >
                <Input.TextArea
                  rows={3}
                  placeholder="记录价格策略的原因或说明"
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
      
      {/* 🔒 版本历史Modal */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>技术清单版本历史</span>
          </Space>
        }
        open={versionHistoryModalVisible}
        onCancel={() => setVersionHistoryModalVisible(false)}
        footer={null}
        width={900}
      >
        <List
          dataSource={technicalVersions}
          renderItem={(version, index) => (
            <List.Item
              key={version.version}
              style={{
                background: version.version === currentTechnicalVersion ? '#f0f9ff' : 'transparent',
                padding: '16px',
                marginBottom: '8px',
                border: version.version === currentTechnicalVersion ? '2px solid #1890ff' : '1px solid #f0f0f0',
                borderRadius: '8px'
              }}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Tag color="blue">{version.version}</Tag>
                    <Tag color={
                      version.status === '已提交' ? 'green' :
                      version.status === '已驳回' ? 'red' :
                      version.status === '已确认' ? 'success' : 'default'
                    }>
                      {version.status}
                    </Tag>
                    {version.version === currentTechnicalVersion && (
                      <Tag color="processing">当前版本</Tag>
                    )}
                  </Space>
                }
                description={
                  <div>
                    <p><strong>创建时间：</strong>{dayjs(version.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
                    {version.notes && <p><strong>说明：</strong>{version.notes}</p>}
                    <p><strong>包含选型：</strong>{version.selections_snapshot?.length || 0} 项</p>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
      
      {/* 🔒 驳回并提出修改建议Modal */}
      <Modal
        title={
          <Space>
            <CloseOutlined />
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>驳回技术清单并提出修改建议</span>
          </Space>
        }
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false)
          rejectForm.resetFields()
        }}
        onOk={() => rejectForm.submit()}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
        cancelText="取消"
        width={800}
      >
        <Alert
          message="注意"
          description={`您即将驳回技术清单版本 ${currentTechnicalVersion}。驳回后，项目将返回给技术工程师进行修正。请详细说明需要修改的地方。`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={handleRejectTechnicalList}
        >
          <Form.List name="suggestions">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} style={{ marginBottom: 16 }} size="small">
                    <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Typography.Text strong>建议 #{key + 1}</Typography.Text>
                      <Button
                        type="link"
                        danger
                        onClick={() => remove(name)}
                        icon={<DeleteOutlined />}
                      >
                        删除
                      </Button>
                    </Space>
                    
                    <Form.Item
                      {...restField}
                      label="位号"
                      name={[name, 'tag_number']}
                      rules={[{ required: true, message: '请输入位号' }]}
                    >
                      <Input placeholder="例如: V-101" />
                    </Form.Item>
                    
                    <Form.Item
                      {...restField}
                      label="原型号"
                      name={[name, 'original_model']}
                      rules={[{ required: true, message: '请输入原型号' }]}
                    >
                      <Input placeholder="例如: SF10/C-150DA" />
                    </Form.Item>
                    
                    <Form.Item
                      {...restField}
                      label="建议型号"
                      name={[name, 'suggested_model']}
                      rules={[{ required: true, message: '请输入建议型号' }]}
                    >
                      <Input placeholder="例如: SF07/C-100DA" />
                    </Form.Item>
                    
                    <Form.Item
                      {...restField}
                      label="修改原因"
                      name={[name, 'reason']}
                      rules={[{ required: true, message: '请说明修改原因' }]}
                    >
                      <Input.TextArea
                        rows={2}
                        placeholder="例如: 为了降低成本，该阀门可使用更小型号"
                      />
                    </Form.Item>
                    
                    <Form.Item
                      {...restField}
                      label="详细说明"
                      name={[name, 'details']}
                    >
                      <Input.TextArea
                        rows={2}
                        placeholder="其他技术细节或说明"
                      />
                    </Form.Item>
                  </Card>
                ))}
                
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  添加修改建议
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
      
      {/* 🔒 修改建议查看Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>商务工程师的修改建议</span>
          </Space>
        }
        open={modificationRequestModalVisible}
        onCancel={() => setModificationRequestModalVisible(false)}
        footer={null}
        width={1000}
      >
        <List
          dataSource={modificationRequests}
          renderItem={(request) => (
            <List.Item
              key={request.request_id}
              style={{
                background: request.status === '待处理' ? '#fff7e6' : '#f5f5f5',
                padding: '16px',
                marginBottom: '12px',
                borderRadius: '8px',
                border: request.status === '待处理' ? '2px solid #faad14' : '1px solid #d9d9d9'
              }}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Tag color="orange">请求 ID: {request.request_id}</Tag>
                    <Tag color={
                      request.status === '待处理' ? 'warning' :
                      request.status === '已接受' ? 'success' :
                      request.status === '已拒绝' ? 'error' : 'default'
                    }>
                      {request.status}
                    </Tag>
                    <Typography.Text type="secondary">
                      {dayjs(request.requested_at).format('YYYY-MM-DD HH:mm')}
                    </Typography.Text>
                  </Space>
                }
                description={
                  <div>
                    <Divider style={{ margin: '12px 0' }} />
                    <Typography.Text strong>修改建议：</Typography.Text>
                    <List
                      size="small"
                      dataSource={request.suggestions}
                      renderItem={(suggestion, idx) => (
                        <List.Item style={{ padding: '8px 0' }}>
                          <Card size="small" style={{ width: '100%' }}>
                            <p><strong>位号：</strong><Tag color="blue">{suggestion.tag_number}</Tag></p>
                            <p><strong>原型号：</strong><code>{suggestion.original_model}</code></p>
                            <p><strong>建议型号：</strong><code style={{ color: '#52c41a', fontWeight: 'bold' }}>{suggestion.suggested_model}</code></p>
                            <p><strong>原因：</strong>{suggestion.reason}</p>
                            {suggestion.details && <p><strong>详情：</strong>{suggestion.details}</p>}
                          </Card>
                        </List.Item>
                      )}
                    />
                    
                    {request.response && (
                      <div style={{ marginTop: 16 }}>
                        <Divider style={{ margin: '12px 0' }} />
                        <Typography.Text strong>技术工程师回复：</Typography.Text>
                        <Alert
                          message={request.response}
                          type={request.status === '已接受' ? 'success' : 'error'}
                          showIcon
                          style={{ marginTop: 8 }}
                        />
                        {request.responded_at && (
                          <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                            回复时间: {dayjs(request.responded_at).format('YYYY-MM-DD HH:mm:ss')}
                          </Typography.Text>
                        )}
                      </div>
                    )}
                    
                    {request.status === '待处理' && user?.role === 'Technical Engineer' && (
                      <div style={{ marginTop: 16 }}>
                        <Divider style={{ margin: '12px 0' }} />
                        <Space>
                          <Button
                            type="primary"
                            icon={<CheckOutlined />}
                            onClick={() => {
                              Modal.confirm({
                                title: '接受修改建议',
                                content: '确认接受商务工程师的修改建议吗？',
                                okText: '确认接受',
                                cancelText: '取消',
                                onOk: () => handleRespondToModification(request.request_id, true)
                              })
                            }}
                          >
                            接受建议
                          </Button>
                          <Button
                            danger
                            icon={<CloseOutlined />}
                            onClick={() => {
                              Modal.confirm({
                                title: '拒绝修改建议',
                                content: '确认拒绝商务工程师的修改建议吗？',
                                okText: '确认拒绝',
                                okButtonProps: { danger: true },
                                cancelText: '取消',
                                onOk: () => handleRespondToModification(request.request_id, false)
                              })
                            }}
                          >
                            拒绝建议
                          </Button>
                        </Space>
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
      
      {/* 🔒 合同版本历史Modal */}
      <ContractVersionHistory
        visible={contractVersionHistoryVisible}
        onClose={() => setContractVersionHistoryVisible(false)}
        projectId={id}
      />
      
      {/* 🔒 操作历史Modal */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>关键操作历史记录</span>
          </Space>
        }
        open={operationHistoryVisible}
        onCancel={() => setOperationHistoryVisible(false)}
        footer={[
          <Button key="close" onClick={() => setOperationHistoryVisible(false)}>
            关闭
          </Button>
        ]}
        width={900}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {project?.operation_history && project.operation_history.length > 0 ? (
          <Timeline
            mode="left"
            items={project.operation_history
              .sort((a, b) => new Date(b.operation_time) - new Date(a.operation_time))
              .map((op) => ({
                color: op.operation_type === 'payment_confirmed' ? 'green' :
                       op.operation_type === 'production_order_created' ? 'blue' :
                       op.operation_type === 'contract_signed' ? 'gold' : 'gray',
                label: dayjs(op.operation_time).format('YYYY-MM-DD HH:mm:ss'),
                children: (
                  <Card size="small" style={{ marginBottom: 8 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <Tag color={
                          op.operation_type === 'payment_confirmed' ? 'success' :
                          op.operation_type === 'production_order_created' ? 'processing' :
                          op.operation_type === 'contract_signed' ? 'warning' : 'default'
                        }>
                          {op.operation_type === 'payment_confirmed' ? '💰 确认收款' :
                           op.operation_type === 'production_order_created' ? '🏭 创建生产订单' :
                           op.operation_type === 'contract_signed' ? '📝 合同签署' :
                           op.operation_type === 'contract_approved' ? '✅ 合同审批通过' :
                           op.operation_type === 'contract_rejected' ? '❌ 合同驳回' :
                           op.operation_type === 'project_status_changed' ? '🔄 状态变更' :
                           '📋 其他操作'}
                        </Tag>
                      </Space>
                      
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="操作描述">
                          <strong>{op.description}</strong>
                        </Descriptions.Item>
                        <Descriptions.Item label="操作人">
                          {op.operator_name}
                          {op.operator_role && (
                            <Space style={{ marginLeft: 8 }}>
                              <Tag color={op.operator_role === 'Sales Engineer' ? 'blue' : 'default'}>
                                {op.operator_role}
                              </Tag>
                              {op.operator_role === 'Sales Engineer' && op.operation_type === 'payment_confirmed' && (
                                <Tag color="orange">兼财务负责人</Tag>
                              )}
                            </Space>
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="操作时间">
                          {dayjs(op.operation_time).format('YYYY年MM月DD日 HH:mm:ss')}
                        </Descriptions.Item>
                        {op.confirmation_text && (
                          <Descriptions.Item label={
                            op.operation_type === 'payment_confirmed' ? 
                            '💰 财务确认声明' : 
                            '确认声明'
                          }>
                            <Alert
                              message={
                                op.operation_type === 'payment_confirmed' ? 
                                <div>
                                  <Tag color="orange" style={{ marginBottom: 8 }}>财务负责人责任声明</Tag>
                                  <div>{op.confirmation_text}</div>
                                </div> :
                                op.confirmation_text
                              }
                              type={op.operation_type === 'payment_confirmed' ? 'error' : 'warning'}
                              showIcon
                              style={{ marginTop: 8 }}
                            />
                          </Descriptions.Item>
                        )}
                        {op.details && (
                          <Descriptions.Item label="详细信息">
                            <pre style={{ 
                              background: '#f5f5f5', 
                              padding: '8px', 
                              borderRadius: '4px',
                              fontSize: 12,
                              margin: 0
                            }}>
                              {JSON.stringify(op.details, null, 2)}
                            </pre>
                          </Descriptions.Item>
                        )}
                        {op.ip_address && (
                          <Descriptions.Item label="IP地址">
                            <code>{op.ip_address}</code>
                          </Descriptions.Item>
                        )}
                        {op.notes && (
                          <Descriptions.Item label="备注">
                            {op.notes}
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    </Space>
                  </Card>
                )
              }))}
          />
        ) : (
          <Alert
            message="暂无操作历史"
            description="尚无关键操作记录"
            type="info"
            showIcon
          />
        )}
        
        <Divider />
        <Alert
          message="操作历史说明"
          description={
            <div>
              <p>• 系统自动记录所有关键操作，包括<strong>财务确认收款</strong>、创建生产订单、合同签署等</p>
              <p>• 每条记录包含操作人、角色（含财务职责标注）、操作时间、IP地址等完整审计信息</p>
              <p>• <strong style={{ color: '#ff4d4f' }}>财务确认收款操作</strong>会特别标注"财务负责人责任声明"，明确财务职责</p>
              <p>• 所有记录不可篡改，永久保存，可用于事后追溯和责任认定</p>
            </div>
          }
          type="info"
          showIcon
          style={{ fontSize: 12 }}
        />
      </Modal>
    </div>
  )
}

export default ProjectDetails


