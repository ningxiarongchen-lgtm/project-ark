import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Card, Descriptions, Table, Button, Tag, Space, Spin, message, Modal, 
  Form, Input, InputNumber, Alert, Typography, Divider, Row, Col, Statistic,
  Tabs, DatePicker, Select, Popconfirm, Tooltip, Progress 
} from 'antd'
import {
  ArrowLeftOutlined, ThunderboltOutlined, WarningOutlined, CheckCircleOutlined,
  FileTextOutlined, ShoppingCartOutlined, PlusOutlined, EditOutlined, 
  SaveOutlined, DeleteOutlined, DownloadOutlined, UnorderedListOutlined,
  CheckSquareOutlined, ClockCircleOutlined, ExclamationCircleOutlined, ToolOutlined
} from '@ant-design/icons'
import { productionAPI } from '../services/api'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Title, Text } = Typography

const ProductionOrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // 基础状态
  const [loading, setLoading] = useState(true)
  const [productionOrder, setProductionOrder] = useState(null)
  
  // BOM相关状态
  const [explodedBOM, setExplodedBOM] = useState([])
  const [missingBOM, setMissingBOM] = useState([])
  const [bomStatistics, setBomStatistics] = useState({})
  const [bomLoading, setBomLoading] = useState(false)
  const [bomExploded, setBomExploded] = useState(false)
  
  // BOM维护Modal
  const [bomModalVisible, setBomModalVisible] = useState(false)
  const [currentActuator, setCurrentActuator] = useState(null)
  const [bomForm] = Form.useForm()
  const [savingBOM, setSavingBOM] = useState(false)
  
  // 采购需求Modal
  const [procurementModalVisible, setProcurementModalVisible] = useState(false)
  const [procurementForm] = Form.useForm()
  const [generatingProcurement, setGeneratingProcurement] = useState(false)

  // 标记为待质检Modal
  const [qcModalVisible, setQcModalVisible] = useState(false)
  const [qcForm] = Form.useForm()
  const [markingQC, setMarkingQC] = useState(false)

  // 验证 MongoDB ObjectId 格式
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id)
  }

  useEffect(() => {
    if (id) {
      // 检查 ID 是否有效
      if (!isValidObjectId(id)) {
        message.error('无效的生产订单ID')
        navigate('/production-schedule')
        return
      }
      fetchProductionOrder()
    }
  }, [id])

  const fetchProductionOrder = async () => {
    try {
      setLoading(true)
      const response = await productionAPI.getById(id)
      setProductionOrder(response.data)
    } catch (error) {
      console.error('获取生产订单失败:', error)
      message.error('获取生产订单失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 展开BOM
  const handleExplodeBOM = async () => {
    try {
      setBomLoading(true)
      const response = await productionAPI.explodeBOM(id)
      
      if (response.data.success) {
        setExplodedBOM(response.data.data.exploded_bom)
        setMissingBOM(response.data.data.missing_bom)
        setBomStatistics(response.data.data.statistics)
        setBomExploded(true)
        
        if (response.data.data.missing_bom.length > 0) {
          // 有缺失BOM的产品，显示警告
          Modal.warning({
            title: '检测到产品缺失BOM结构',
            content: (
              <div>
                <Alert
                  message="以下产品没有定义BOM结构，需要补充后才能完整展开物料清单："
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <ul>
                  {response.data.data.missing_bom.map((item, index) => (
                    <li key={index}>
                      <strong>{item.model_name}</strong> - 需求数量: {item.ordered_quantity}
                    </li>
                  ))}
                </ul>
                <Alert
                  message="请点击下方'补充BOM'按钮为这些产品添加BOM结构"
                  type="info"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              </div>
            ),
            width: 600,
            okText: '知道了'
          })
        } else {
          message.success('BOM展开成功！')
        }
      }
    } catch (error) {
      console.error('展开BOM失败:', error)
      message.error('展开BOM失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setBomLoading(false)
    }
  }

  // 打开BOM维护Modal
  const handleOpenBOMModal = (actuator) => {
    setCurrentActuator(actuator)
    setBomModalVisible(true)
    // 初始化表单（空BOM）
    bomForm.setFieldsValue({
      bom_items: [{ part_number: '', part_name: '', quantity: 1 }]
    })
  }

  // 保存BOM结构
  const handleSaveBOM = async () => {
    try {
      const values = await bomForm.validateFields()
      setSavingBOM(true)
      
      const bom_structure = values.bom_items.filter(item => 
        item.part_number && item.part_name && item.quantity
      )
      
      await productionAPI.updateActuatorBOM(currentActuator.actuator_id, bom_structure)
      
      message.success('BOM结构保存成功！')
      setBomModalVisible(false)
      
      // 从缺失列表中移除
      setMissingBOM(prev => prev.filter(item => item.actuator_id !== currentActuator.actuator_id))
      
      // 提示重新展开BOM
      Modal.confirm({
        title: 'BOM已保存',
        content: '是否重新展开BOM以包含刚刚补充的数据？',
        onOk: handleExplodeBOM
      })
      
    } catch (error) {
      console.error('保存BOM失败:', error)
      message.error('保存BOM失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setSavingBOM(false)
    }
  }

  // 生成采购需求
  const handleGenerateProcurement = () => {
    const shortageItems = explodedBOM.filter(item => item.shortage > 0)
    
    if (shortageItems.length === 0) {
      message.warning('没有缺口物料，无需生成采购需求')
      return
    }
    
    setProcurementModalVisible(true)
    procurementForm.setFieldsValue({
      priority: 'Normal',
      required_date: dayjs().add(30, 'days')
    })
  }

  // 提交采购需求
  const handleSubmitProcurement = async () => {
    try {
      const values = await procurementForm.validateFields()
      setGeneratingProcurement(true)
      
      const shortageItems = explodedBOM.filter(item => item.shortage > 0)
      
      const response = await productionAPI.generateProcurement(id, {
        shortage_items: shortageItems,
        notes: values.notes,
        priority: values.priority,
        required_date: values.required_date?.toISOString()
      })
      
      if (response.data.success) {
        message.success('采购需求生成成功！已通知采购专员')
        setProcurementModalVisible(false)
        procurementForm.resetFields()
        
        Modal.info({
          title: '采购需求已创建',
          content: (
            <div>
              <p><strong>采购需求单号：</strong>{response.data.data.request_number}</p>
              <p><strong>物料数量：</strong>{shortageItems.length} 项</p>
              <p><strong>预计金额：</strong>¥{response.data.data.total_estimated_cost?.toFixed(2)}</p>
            </div>
          )
        })
      }
    } catch (error) {
      console.error('生成采购需求失败:', error)
      message.error('生成采购需求失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setGeneratingProcurement(false)
    }
  }

  // 打开标记为待质检Modal
  const handleOpenQCModal = () => {
    setQcModalVisible(true)
    qcForm.resetFields()
  }

  // 提交标记为待质检
  const handleMarkAsAwaitingQC = async () => {
    try {
      const values = await qcForm.validateFields()
      setMarkingQC(true)
      
      const response = await productionAPI.markAsAwaitingQC(id, {
        notes: values.notes
      })
      
      if (response.data.success) {
        message.success('已标记为待质检，等待质检员检验')
        setQcModalVisible(false)
        qcForm.resetFields()
        // 重新获取订单数据
        fetchProductionOrder()
      }
    } catch (error) {
      console.error('标记为待质检失败:', error)
      message.error('标记为待质检失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setMarkingQC(false)
    }
  }

  // 渲染预计到货日期（带视觉预警）
  const renderDeliveryDate = (record) => {
    const estimatedDate = record.estimated_delivery_date || record.estimated_arrival_date
    
    if (!estimatedDate) {
      return (
        <Space>
          <Tag color="default">未设置</Tag>
          {record.shortage > 0 && (
            <Tooltip title="该物料有缺口但尚未设置到货日期">
              <WarningOutlined style={{ color: '#faad14' }} />
            </Tooltip>
          )}
        </Space>
      )
    }
    
    // 计划开工日期
    const plannedStartDate = productionOrder?.schedule?.plannedStartDate
    
    if (!plannedStartDate) {
      return (
        <span style={{ color: '#1890ff' }}>
          {dayjs(estimatedDate).format('YYYY-MM-DD')}
        </span>
      )
    }
    
    // 判断是否延期风险
    const isDelayed = dayjs(estimatedDate).isAfter(dayjs(plannedStartDate))
    const daysUntilStart = dayjs(plannedStartDate).diff(dayjs(estimatedDate), 'day')
    
    if (isDelayed) {
      // 红色警告：到货日期晚于计划开工日期
      const delayDays = dayjs(estimatedDate).diff(dayjs(plannedStartDate), 'day')
      return (
        <Tooltip 
          title={
            <div>
              <div>⚠️ <strong>延期风险！</strong></div>
              <div>预计到货: {dayjs(estimatedDate).format('YYYY-MM-DD')}</div>
              <div>计划开工: {dayjs(plannedStartDate).format('YYYY-MM-DD')}</div>
              <div style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                晚于开工日期 {delayDays} 天
              </div>
              <div style={{ marginTop: 8 }}>
                建议立即与采购专员沟通，催促供应商加快交付
              </div>
            </div>
          }
        >
          <Space>
            <Tag 
              color="error" 
              icon={<ExclamationCircleOutlined />}
              style={{ fontWeight: 'bold', fontSize: '13px' }}
            >
              {dayjs(estimatedDate).format('MM-DD')}
            </Tag>
            <Tag color="red">延期 {delayDays}天</Tag>
          </Space>
        </Tooltip>
      )
    } else if (daysUntilStart <= 3 && daysUntilStart >= 0) {
      // 橙色提示：到货日期接近开工日期（3天内）
      return (
        <Tooltip 
          title={
            <div>
              <div>⏰ <strong>时间紧张</strong></div>
              <div>预计到货: {dayjs(estimatedDate).format('YYYY-MM-DD')}</div>
              <div>计划开工: {dayjs(plannedStartDate).format('YYYY-MM-DD')}</div>
              <div style={{ color: '#faad14' }}>
                仅提前 {daysUntilStart} 天到货，时间较紧
              </div>
            </div>
          }
        >
          <Space>
            <Tag 
              color="warning" 
              icon={<ClockCircleOutlined />}
              style={{ fontSize: '13px' }}
            >
              {dayjs(estimatedDate).format('MM-DD')}
            </Tag>
            <Tag color="orange">提前 {daysUntilStart}天</Tag>
          </Space>
        </Tooltip>
      )
    } else {
      // 绿色正常：到货日期充裕
      return (
        <Tooltip 
          title={
            <div>
              <div>✓ 时间充裕</div>
              <div>预计到货: {dayjs(estimatedDate).format('YYYY-MM-DD')}</div>
              <div>计划开工: {dayjs(plannedStartDate).format('YYYY-MM-DD')}</div>
              <div style={{ color: '#52c41a' }}>
                提前 {daysUntilStart} 天到货
              </div>
            </div>
          }
        >
          <Space>
            <Tag color="success" style={{ fontSize: '13px' }}>
              {dayjs(estimatedDate).format('MM-DD')}
            </Tag>
            {daysUntilStart > 0 && (
              <span style={{ fontSize: '12px', color: '#52c41a' }}>
                ✓ 提前 {daysUntilStart}天
              </span>
            )}
          </Space>
        </Tooltip>
      )
    }
  }

  // BOM表格列定义
  const bomColumns = [
    {
      title: '零件编号',
      dataIndex: 'part_number',
      key: 'part_number',
      width: 150,
      fixed: 'left'
    },
    {
      title: '零件名称',
      dataIndex: 'part_name',
      key: 'part_name',
      width: 200
    },
    {
      title: '总需求量',
      dataIndex: 'total_required_quantity',
      key: 'total_required_quantity',
      width: 120,
      render: (value) => <strong>{value}</strong>
    },
    {
      title: '可用库存',
      dataIndex: 'available_stock',
      key: 'available_stock',
      width: 120,
      render: (value) => (
        <Tag color={value > 0 ? 'green' : 'default'}>
          {value || 0}
        </Tag>
      )
    },
    {
      title: '缺口',
      dataIndex: 'shortage',
      key: 'shortage',
      width: 120,
      render: (value) => (
        <Tag color={value > 0 ? 'red' : 'success'}>
          {value > 0 ? value : 0}
        </Tag>
      )
    },
    {
      title: '采购状态',
      dataIndex: 'procurement_status',
      key: 'procurement_status',
      width: 120,
      render: (status) => {
        const colorMap = {
          '未采购': 'default',
          '采购中': 'processing',
          '部分到货': 'warning',
          '已到货': 'success',
          'pending': 'default',
          'requested': 'processing',
          'ordered': 'warning',
          'arrived': 'success'
        }
        const textMap = {
          'pending': '待处理',
          'requested': '已申请',
          'ordered': '已下单',
          'arrived': '已到货'
        }
        return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>
      }
    },
    {
      title: (
        <Space>
          <span>预计到货日期</span>
          <Tooltip title="从关联的采购订单自动同步，红色表示延期风险">
            <ExclamationCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'estimated_delivery_date',
      key: 'estimated_delivery_date',
      width: 200,
      render: (date, record) => renderDeliveryDate(record)
    },
    {
      title: '采购订单',
      dataIndex: 'purchase_order_id',
      key: 'purchase_order_id',
      width: 150,
      render: (poId, record) => {
        if (!poId) {
          return record.shortage > 0 ? (
            <Tag color="default">待生成</Tag>
          ) : (
            <span style={{ color: '#999' }}>-</span>
          )
        }
        return (
          <Tooltip title="点击查看采购订单详情">
            <a 
              onClick={() => window.open(`/purchase-orders/${poId}`, '_blank')}
              style={{ fontSize: '12px' }}
            >
              {record.purchase_order_number || poId.slice(-8)}
            </a>
          </Tooltip>
        )
      }
    },
    {
      title: '来源',
      key: 'sources',
      width: 200,
      render: (_, record) => (
        <div>
          {record.sources?.map((source, index) => (
            <div key={index} style={{ fontSize: 12, color: '#666' }}>
              {source.product_model} × {source.product_quantity}
            </div>
          ))}
        </div>
      )
    }
  ]

  // 缺失BOM表格列定义
  const missingBOMColumns = [
    {
      title: '产品型号',
      dataIndex: 'model_name',
      key: 'model_name'
    },
    {
      title: '订单数量',
      dataIndex: 'ordered_quantity',
      key: 'ordered_quantity'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleOpenBOMModal(record)}
        >
          立即补充BOM
        </Button>
      )
    }
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!productionOrder) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Alert message="未找到生产订单" type="error" />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面头部 */}
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16 }}
        >
          返回
        </Button>
        
        <Title level={2}>
          生产订单详情 - {productionOrder.productionOrderNumber}
        </Title>
      </div>

      {/* 🔒 物料准备进度卡片 */}
      <Card 
        title={
          <Space>
            <ToolOutlined />
            物料准备状态
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col span={16}>
            {(() => {
              const status = productionOrder.material_readiness_status || '待分析'
              const shortageDetails = productionOrder.material_shortage_details || []
              const totalItems = shortageDetails.length
              const readyItems = shortageDetails.filter(item => item.shortage_quantity === 0).length
              const progressPercent = totalItems > 0 ? Math.round((readyItems / totalItems) * 100) : 0
              
              const statusConfig = {
                '待分析': { color: 'default', icon: '⏳', progressColor: '#d9d9d9' },
                '部分可用': { color: 'orange', icon: '⚠️', progressColor: '#faad14' },
                '全部可用(齐套)': { color: '#52c41a', icon: '✅', progressColor: '#52c41a' },
                '采购延迟': { color: '#ff4d4f', icon: '🔴', progressColor: '#ff4d4f' }
              }
              
              const config = statusConfig[status] || statusConfig['待分析']
              
              return (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Space>
                      <span style={{ fontSize: 16, fontWeight: 'bold' }}>当前状态:</span>
                      <Tag 
                        color={config.color} 
                        style={{ 
                          fontSize: 16, 
                          padding: '4px 12px',
                          fontWeight: status === '全部可用(齐套)' ? 'bold' : 'normal'
                        }}
                      >
                        {config.icon} {status}
                      </Tag>
                      {productionOrder.material_status_updated_at && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          更新于 {dayjs(productionOrder.material_status_updated_at).format('YYYY-MM-DD HH:mm')}
                        </Text>
                      )}
                    </Space>
                  </div>
                  
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <Space>
                        <Text strong>物料准备进度:</Text>
                        {totalItems > 0 ? (
                          <Text type="secondary">{readyItems} / {totalItems} 项物料已就绪</Text>
                        ) : (
                          <Text type="secondary">暂无物料数据</Text>
                        )}
                      </Space>
                    </div>
                    <Progress 
                      percent={progressPercent}
                      strokeColor={config.progressColor}
                      status={status === '全部可用(齐套)' ? 'success' : status === '采购延迟' ? 'exception' : 'active'}
                      strokeWidth={14}
                    />
                  </div>
                  
                  {status === '全部可用(齐套)' && (
                    <Alert
                      message="物料齐套，可以安排生产！"
                      description="所有生产物料已准备就绪，生产计划员可以立即安排全面生产。"
                      type="success"
                      showIcon
                      style={{ marginTop: 16 }}
                    />
                  )}
                  
                  {status === '采购延迟' && (
                    <Alert
                      message="存在采购延迟风险"
                      description="部分物料的预计到货日期晚于计划开工日期，建议立即与采购专员沟通。"
                      type="error"
                      showIcon
                      style={{ marginTop: 16 }}
                    />
                  )}
                </div>
              )
            })()}
          </Col>
          
          <Col span={8}>
            <Card size="small" style={{ background: '#fafafa' }}>
              <Statistic
                title="缺料项数"
                value={
                  (productionOrder.material_shortage_details || []).filter(
                    item => item.shortage_quantity > 0
                  ).length
                }
                suffix={`/ ${(productionOrder.material_shortage_details || []).length}`}
                valueStyle={{ 
                  color: 
                    productionOrder.material_readiness_status === '全部可用(齐套)' ? '#52c41a' :
                    productionOrder.material_readiness_status === '采购延迟' ? '#ff4d4f' :
                    '#faad14'
                }}
              />
              {productionOrder.material_shortage_details && 
               productionOrder.material_shortage_details.length > 0 && (
                <Button 
                  type="link" 
                  size="small" 
                  style={{ padding: 0, marginTop: 8 }}
                  onClick={() => {
                    // 滚动到物料清单部分
                    const bomSection = document.querySelector('[aria-label="BOM物料清单"]')
                    if (bomSection) {
                      bomSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                >
                  查看详细缺料信息 →
                </Button>
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 基本信息卡片 */}
      <Card 
        title="基本信息" 
        style={{ marginBottom: 16 }}
        extra={
          productionOrder.status === 'Completed' && (
            <Button
              type="primary"
              icon={<CheckSquareOutlined />}
              onClick={handleOpenQCModal}
            >
              标记为待质检
            </Button>
          )
        }
      >
        <Descriptions column={3} bordered>
          <Descriptions.Item label="生产订单号">{productionOrder.productionOrderNumber}</Descriptions.Item>
          <Descriptions.Item label="销售订单号">{productionOrder.orderSnapshot?.orderNumber}</Descriptions.Item>
          <Descriptions.Item label="项目名称">{productionOrder.orderSnapshot?.projectName}</Descriptions.Item>
          <Descriptions.Item label="客户名称">{productionOrder.orderSnapshot?.clientName}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={
              productionOrder.status === 'Completed' ? 'success' : 
              productionOrder.status === 'Awaiting QC' ? 'blue' :
              productionOrder.status === 'QC Passed' ? 'cyan' :
              'processing'
            }>
              {productionOrder.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="优先级">
            <Tag color={productionOrder.priority === 'Urgent' ? 'red' : 'default'}>
              {productionOrder.priority}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="计划开始">{dayjs(productionOrder.schedule?.plannedStartDate).format('YYYY-MM-DD')}</Descriptions.Item>
          <Descriptions.Item label="计划完成">{dayjs(productionOrder.schedule?.plannedEndDate).format('YYYY-MM-DD')}</Descriptions.Item>
          <Descriptions.Item label="总体进度">
            <strong>{productionOrder.progress?.overall_percentage || 0}%</strong>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 生产BOM核心功能 */}
      <Card 
        aria-label="BOM物料清单"
        title={
          <Space>
            <UnorderedListOutlined />
            <span>生产BOM物料清单</span>
          </Space>
        }
        extra={
          <Space>
            {!bomExploded && (
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={handleExplodeBOM}
                loading={bomLoading}
              >
                展开生产BOM
              </Button>
            )}
            {bomExploded && explodedBOM.filter(item => item.shortage > 0).length > 0 && (
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={handleGenerateProcurement}
                danger
              >
                生成采购需求 ({explodedBOM.filter(item => item.shortage > 0).length}项)
              </Button>
            )}
            {bomExploded && (
              <Button
                icon={<ThunderboltOutlined />}
                onClick={handleExplodeBOM}
                loading={bomLoading}
              >
                重新展开
              </Button>
            )}
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        {!bomExploded ? (
          <Alert
            message="请点击"展开生产BOM"按钮"
            description="系统将根据订单中的成品，从产品主数据中查找BOM结构，计算完整的物料清单。"
            type="info"
            showIcon
            icon={<FileTextOutlined />}
          />
        ) : (
          <div>
            {/* 统计信息 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic
                  title="物料种类"
                  value={bomStatistics.total_parts || 0}
                  suffix="种"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="缺口物料"
                  value={bomStatistics.total_shortage_items || 0}
                  suffix="种"
                  valueStyle={{ color: bomStatistics.total_shortage_items > 0 ? '#cf1322' : '#3f8600' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="缺失BOM产品"
                  value={bomStatistics.products_missing_bom || 0}
                  suffix="个"
                  valueStyle={{ color: bomStatistics.products_missing_bom > 0 ? '#fa8c16' : '#3f8600' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="BOM完整度"
                  value={((1 - (bomStatistics.products_missing_bom || 0) / (productionOrder.productionItems?.length || 1)) * 100).toFixed(0)}
                  suffix="%"
                  valueStyle={{ color: bomStatistics.products_missing_bom === 0 ? '#3f8600' : '#fa8c16' }}
                />
              </Col>
            </Row>

            {/* 缺失BOM警告 */}
            {missingBOM.length > 0 && (
              <Alert
                message={`有 ${missingBOM.length} 个产品缺失BOM结构`}
                description="这些产品需要补充BOM后才能完整展开物料清单"
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                action={
                  <Button size="small" type="primary" onClick={() => handleOpenBOMModal(missingBOM[0])}>
                    开始补充
                  </Button>
                }
                style={{ marginBottom: 16 }}
              />
            )}

            {/* 缺失BOM列表 */}
            {missingBOM.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>缺失BOM的产品</Title>
                <Table
                  columns={missingBOMColumns}
                  dataSource={missingBOM}
                  rowKey="model_name"
                  pagination={false}
                  size="small"
                />
              </div>
            )}

            <Divider />

            {/* 物料清单表格 */}
            <Table
              columns={bomColumns}
              dataSource={explodedBOM}
              rowKey="part_number"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 项物料`
              }}
              scroll={{ x: 1200 }}
              summary={(pageData) => {
                const totalShortage = pageData.reduce((sum, item) => sum + (item.shortage || 0), 0)
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        <strong>合计</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <Tag color={totalShortage > 0 ? 'red' : 'success'}>
                          <strong>{totalShortage}</strong>
                        </Tag>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} colSpan={3} />
                    </Table.Summary.Row>
                  </Table.Summary>
                )
              }}
            />
          </div>
        )}
      </Card>

      {/* BOM维护Modal */}
      <Modal
        title={`补充BOM结构 - ${currentActuator?.model_name}`}
        open={bomModalVisible}
        onCancel={() => setBomModalVisible(false)}
        onOk={handleSaveBOM}
        confirmLoading={savingBOM}
        width={800}
        okText="保存BOM"
        cancelText="取消"
      >
        <Alert
          message="请为该产品补充生产BOM结构"
          description="定义该产品由哪些零部件组成，以及每个零部件的数量。保存后将永久保存到产品主数据中。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form form={bomForm} layout="vertical">
          <Form.List name="bom_items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'part_number']}
                      rules={[{ required: true, message: '请输入零件编号' }]}
                      style={{ flex: 1 }}
                    >
                      <Input placeholder="零件编号" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'part_name']}
                      rules={[{ required: true, message: '请输入零件名称' }]}
                      style={{ flex: 2 }}
                    >
                      <Input placeholder="零件名称" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: '请输入数量' }]}
                      style={{ width: 100 }}
                    >
                      <InputNumber placeholder="数量" min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => remove(name)}
                    />
                  </div>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  添加零件
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* 采购需求Modal */}
      <Modal
        title="生成采购需求"
        open={procurementModalVisible}
        onCancel={() => setProcurementModalVisible(false)}
        onOk={handleSubmitProcurement}
        confirmLoading={generatingProcurement}
        width={600}
        okText="生成并通知采购专员"
        cancelText="取消"
      >
        <Alert
          message={`将为 ${explodedBOM.filter(item => item.shortage > 0).length} 项缺口物料生成采购需求`}
          description="系统将创建采购请求并通知采购专员处理。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form form={procurementForm} layout="vertical">
          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select>
              <Select.Option value="Low">低</Select.Option>
              <Select.Option value="Normal">正常</Select.Option>
              <Select.Option value="High">高</Select.Option>
              <Select.Option value="Urgent">紧急</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="required_date"
            label="要求到货日期"
            rules={[{ required: true, message: '请选择要求到货日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={4} placeholder="请输入备注信息..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 标记为待质检Modal */}
      <Modal
        title="标记为待质检"
        open={qcModalVisible}
        onCancel={() => setQcModalVisible(false)}
        onOk={handleMarkAsAwaitingQC}
        confirmLoading={markingQC}
        width={500}
        okText="确认标记"
        cancelText="取消"
      >
        <Alert
          message="生产已完成"
          description="将订单标记为待质检后，质检员将能够看到此订单并进行质量检验。"
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
        
        <Form form={qcForm} layout="vertical">
          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={4} placeholder="请输入备注信息（可选）..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProductionOrderDetails

