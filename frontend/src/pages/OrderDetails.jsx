import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Card, Descriptions, Table, Button, Tag, Space, message, 
  Modal, Form, Input, InputNumber, Select, Steps, Divider,
  Row, Col, Statistic, Timeline, Badge, Tabs
} from 'antd'
import { 
  ArrowLeftOutlined, EditOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, DollarOutlined, FileTextOutlined,
  TruckOutlined, ShoppingCartOutlined, ToolOutlined,
  CustomerServiceOutlined, PlusOutlined, SendOutlined,
  InboxOutlined, UploadOutlined, FolderOutlined, EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import { ordersAPI, productionAPI, ticketsAPI } from '../services/api'
import CloudUpload from '../components/CloudUpload'
import axios from 'axios'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

const OrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // 售后工单相关
  const [serviceTickets, setServiceTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [ticketModalVisible, setTicketModalVisible] = useState(false)
  const [ticketForm] = Form.useForm()
  const [creatingTicket, setCreatingTicket] = useState(false)
  
  // 发货记录相关
  const [shipmentModalVisible, setShipmentModalVisible] = useState(false)
  const [shipmentForm] = Form.useForm()
  const [creatingShipment, setCreatingShipment] = useState(false)
  const [activeTab, setActiveTab] = useState('1')
  
  // Modal状态
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [paymentModalVisible, setPaymentModalVisible] = useState(false)
  const [productionModalVisible, setProductionModalVisible] = useState(false)
  const [statusForm] = Form.useForm()
  const [paymentForm] = Form.useForm()
  const [productionForm] = Form.useForm()
  const [creatingProduction, setCreatingProduction] = useState(false)

  useEffect(() => {
    fetchOrder()
    fetchServiceTickets()
  }, [id])

  const fetchOrder = async () => {
    try {
      const response = await ordersAPI.getById(id)
      setOrder(response.data.data)
    } catch (error) {
      console.error('获取订单详情失败:', error)
      message.error('获取订单详情失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取关联的售后工单
  const fetchServiceTickets = async () => {
    setLoadingTickets(true)
    try {
      const response = await ticketsAPI.getAll({ salesOrder: id })
      setServiceTickets(response.data.data || [])
    } catch (error) {
      console.error('获取售后工单失败:', error)
      // 不显示错误提示，因为可能没有关联的工单
    } finally {
      setLoadingTickets(false)
    }
  }

  // 更新订单状态
  const handleUpdateStatus = async (values) => {
    try {
      await ordersAPI.updateStatus(id, { status: values.status })
      message.success('订单状态已更新')
      setStatusModalVisible(false)
      statusForm.resetFields()
      fetchOrder()
    } catch (error) {
      console.error('更新状态失败:', error)
      message.error('更新状态失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 添加付款记录
  const handleAddPayment = async (values) => {
    try {
      await ordersAPI.addPayment(id, values)
      message.success('付款记录已添加')
      setPaymentModalVisible(false)
      paymentForm.resetFields()
      fetchOrder()
    } catch (error) {
      console.error('添加付款记录失败:', error)
      message.error('添加付款记录失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 打开生产任务创建Modal
  const handleOpenProductionModal = () => {
    // 检查订单状态
    if (!['Confirmed', 'In Production'].includes(order.status)) {
      message.warning('只有已确认或生产中的订单才能创建生产任务')
      return
    }

    // 设置默认值
    const today = new Date()
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    productionForm.setFieldsValue({
      plannedStartDate: today.toISOString().split('T')[0],
      plannedEndDate: in30Days.toISOString().split('T')[0],
      priority: 'Normal'
    })

    setProductionModalVisible(true)
  }

  // 创建生产任务
  const handleCreateProduction = async (values) => {
    setCreatingProduction(true)

    try {
      console.log('🚀 正在创建生产任务...')

      const response = await productionAPI.createFromOrder(id, values)

      console.log('✅ 生产任务创建成功:', response.data)

      message.success(`生产任务创建成功！生产订单号: ${response.data.data.productionOrderNumber}`)

      // 关闭Modal
      setProductionModalVisible(false)
      productionForm.resetFields()

      // 刷新订单数据
      await fetchOrder()

      // 询问是否跳转到生产排期页面
      Modal.confirm({
        title: '生产任务创建成功',
        content: `生产订单号: ${response.data.data.productionOrderNumber}。是否立即查看生产排期？`,
        okText: '查看排期',
        cancelText: '留在当前页',
        onOk: () => {
          navigate('/production-schedule')
        }
      })

    } catch (error) {
      console.error('❌ 创建生产任务失败:', error)

      let errorMessage = '创建生产任务失败'

      if (error.response?.status === 400) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      message.error(errorMessage)
    } finally {
      setCreatingProduction(false)
    }
  }

  // 打开创建售后工单Modal
  const handleOpenTicketModal = () => {
    if (!order) {
      message.warning('订单信息加载中，请稍候...')
      return
    }

    // 从订单信息预填充客户信息
    ticketForm.setFieldsValue({
      ticketType: 'Maintenance',
      priority: 'Normal',
      customer: {
        name: order.client?.name || '',
        company: order.client?.company || '',
        phone: order.client?.phone || '',
        email: order.client?.email || ''
      }
    })

    setTicketModalVisible(true)
  }

  // 创建售后工单
  const handleCreateTicket = async (values) => {
    setCreatingTicket(true)
    try {
      console.log('🎫 正在创建售后工单...')

      // 添加关联的销售订单ID
      const ticketData = {
        ...values,
        salesOrder: id
      }

      const response = await ticketsAPI.create(ticketData)

      console.log('✅ 售后工单创建成功:', response.data)

      message.success(`售后工单创建成功！工单号: ${response.data.data.ticketNumber}`)

      setTicketModalVisible(false)
      ticketForm.resetFields()
      
      // 刷新售后工单列表
      fetchServiceTickets()

      // 询问是否查看详情
      Modal.confirm({
        title: '售后工单创建成功',
        content: `工单号: ${response.data.data.ticketNumber}。是否立即查看详情？`,
        okText: '查看详情',
        cancelText: '留在当前页',
        onOk: () => {
          navigate(`/service-center/${response.data.data._id}`)
        }
      })

    } catch (error) {
      console.error('❌ 创建售后工单失败:', error)
      message.error('创建售后工单失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setCreatingTicket(false)
    }
  }

  // 打开创建发货记录Modal
  const handleOpenShipmentModal = () => {
    if (!order) {
      message.warning('订单信息加载中，请稍候...')
      return
    }

    // 检查订单状态
    if (!['Confirmed', 'In Production', 'Shipped'].includes(order.status)) {
      message.warning('只有已确认、生产中或已发货的订单才能添加发货记录')
      return
    }

    // 设置默认值
    shipmentForm.setFieldsValue({
      shipment_date: new Date().toISOString().split('T')[0],
      status: 'Preparing'
    })

    setShipmentModalVisible(true)
  }

  // 创建发货记录
  const handleCreateShipment = async (values) => {
    setCreatingShipment(true)
    try {
      console.log('📦 正在创建发货记录...')

      // 构建发货数据
      const shipmentData = {
        ...values,
        created_at: new Date()
      }

      // 更新订单的发货记录
      const updatedOrder = {
        ...order,
        shipments: [...(order.shipments || []), shipmentData]
      }

      const response = await ordersAPI.update(id, updatedOrder)

      console.log('✅ 发货记录创建成功:', response.data)

      message.success('发货记录创建成功！')

      setShipmentModalVisible(false)
      shipmentForm.resetFields()

      // 刷新订单数据
      await fetchOrder()

      // 切换到发货记录Tab
      setActiveTab('5')

    } catch (error) {
      console.error('❌ 创建发货记录失败:', error)
      message.error('创建发货记录失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setCreatingShipment(false)
    }
  }

  // 订单状态映射
  const getStatusStep = (status) => {
    const steps = ['Pending', 'Confirmed', 'In Production', 'Shipped', 'Delivered', 'Completed']
    return steps.indexOf(status)
  }

  // 订单明细列定义
  const itemColumns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1
    },
    {
      title: '物料类型',
      dataIndex: 'item_type',
      key: 'item_type',
      width: 100,
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: '型号',
      dataIndex: 'model_name',
      key: 'model_name',
      width: 200,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center'
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      align: 'right',
      render: (price) => `¥${(price || 0).toLocaleString()}`
    },
    {
      title: '总价',
      dataIndex: 'total_price',
      key: 'total_price',
      width: 140,
      align: 'right',
      render: (price) => (
        <strong style={{ color: '#1890ff' }}>
          ¥{(price || 0).toLocaleString()}
        </strong>
      )
    },
    {
      title: '生产状态',
      dataIndex: 'production_status',
      key: 'production_status',
      width: 100,
      render: (status) => {
        const colorMap = {
          'Pending': 'default',
          'In Production': 'processing',
          'Completed': 'success',
          'Shipped': 'cyan'
        }
        return <Tag color={colorMap[status]}>{status}</Tag>
      }
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes) => notes || '-'
    }
  ]

  // 发货记录列定义
  const shipmentColumns = [
    {
      title: '批次号',
      dataIndex: 'shipment_number',
      key: 'shipment_number',
      width: 140,
      render: (text) => text || '-'
    },
    {
      title: '物流单号',
      dataIndex: 'tracking_number',
      key: 'tracking_number',
      width: 180,
      render: (text) => <strong style={{ color: '#1890ff' }}>{text}</strong>
    },
    {
      title: '承运商',
      dataIndex: 'carrier',
      key: 'carrier',
      width: 130
    },
    {
      title: '发货日期',
      dataIndex: 'shipment_date',
      key: 'shipment_date',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '预计送达',
      dataIndex: 'estimated_delivery_date',
      key: 'estimated_delivery_date',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '实际送达',
      dataIndex: 'actual_delivery_date',
      key: 'actual_delivery_date',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colorMap = {
          'Preparing': 'default',
          'Shipped': 'processing',
          'In Transit': 'cyan',
          'Delivered': 'success',
          'Failed': 'error'
        }
        const nameMap = {
          'Preparing': '准备中',
          'Shipped': '已发货',
          'In Transit': '运输中',
          'Delivered': '已送达',
          'Failed': '失败'
        }
        return <Tag color={colorMap[status]}>{nameMap[status] || status}</Tag>
      }
    },
    {
      title: '包裹数',
      dataIndex: ['packaging', 'packages_count'],
      key: 'packages_count',
      width: 90,
      align: 'center',
      render: (count) => count || '-'
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes) => notes || '-'
    }
  ]

  // 售后工单列定义
  const ticketColumns = [
    {
      title: '工单号',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      width: 150,
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/service-center/${record._id}`)}
          style={{ padding: 0, fontWeight: 'bold' }}
        >
          {text}
        </Button>
      )
    },
    {
      title: '工单类型',
      dataIndex: 'ticketType',
      key: 'ticketType',
      width: 100,
      render: (type) => {
        const typeMap = {
          'Installation': '安装',
          'Maintenance': '维护',
          'Repair': '维修',
          'Inspection': '检查',
          'Training': '培训',
          'Consultation': '咨询',
          'Complaint': '投诉',
          'Other': '其他'
        }
        return <Tag color="blue">{typeMap[type] || type}</Tag>
      }
    },
    {
      title: '问题标题',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (_, record) => record.issue?.title || '-'
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority) => {
        const colorMap = {
          'Low': 'default',
          'Normal': 'blue',
          'High': 'orange',
          'Urgent': 'red',
          'Critical': 'magenta'
        }
        const nameMap = {
          'Low': '低',
          'Normal': '正常',
          'High': '高',
          'Urgent': '紧急',
          'Critical': '严重'
        }
        return <Tag color={colorMap[priority]}>{nameMap[priority] || priority}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colorMap = {
          'Open': 'default',
          'Assigned': 'cyan',
          'In Progress': 'processing',
          'Pending Parts': 'warning',
          'On Hold': 'orange',
          'Resolved': 'success',
          'Closed': 'default',
          'Cancelled': 'error'
        }
        const nameMap = {
          'Open': '待处理',
          'Assigned': '已分配',
          'In Progress': '处理中',
          'Pending Parts': '等待零件',
          'On Hold': '暂停',
          'Resolved': '已解决',
          'Closed': '已关闭',
          'Cancelled': '已取消'
        }
        return <Tag color={colorMap[status]}>{nameMap[status] || status}</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    }
  ]

  if (loading) {
    return <div>加载中...</div>
  }

  if (!order) {
    return <div>订单不存在</div>
  }

  return (
    <div>
      <Space style={{ marginBottom: 24 }} wrap>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/orders')}
        >
          返回订单列表
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => setStatusModalVisible(true)}
        >
          更新状态
        </Button>
        <Button
          icon={<DollarOutlined />}
          onClick={() => setPaymentModalVisible(true)}
        >
          添加付款记录
        </Button>
        <Button
          type="primary"
          icon={<ToolOutlined />}
          onClick={handleOpenProductionModal}
          disabled={!['Confirmed', 'In Production'].includes(order.status)}
          style={{
            background: 'linear-gradient(135deg, #ff9a56 0%, #ff6a00 100%)',
            border: 'none'
          }}
        >
          创建生产任务
        </Button>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleOpenShipmentModal}
          disabled={!['Confirmed', 'In Production', 'Shipped'].includes(order.status)}
          style={{
            background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
            border: 'none'
          }}
        >
          添加发货记录
        </Button>
      </Space>

      {/* 订单基本信息 */}
      <Card title="订单信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="订单编号">
            <strong style={{ fontSize: '16px' }}>{order.orderNumber}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="订单状态">
            <Tag color="processing" style={{ fontSize: '14px' }}>
              {order.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="项目编号">
            {order.projectSnapshot?.projectNumber}
          </Descriptions.Item>
          <Descriptions.Item label="项目名称">
            {order.projectSnapshot?.projectName}
          </Descriptions.Item>
          <Descriptions.Item label="客户名称">
            {order.projectSnapshot?.client?.name}
          </Descriptions.Item>
          <Descriptions.Item label="客户公司">
            {order.projectSnapshot?.client?.company || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="订单日期">
            {dayjs(order.orderDate).format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label="要求交付日期">
            {order.requestedDeliveryDate 
              ? dayjs(order.requestedDeliveryDate).format('YYYY-MM-DD')
              : '-'
            }
          </Descriptions.Item>
          <Descriptions.Item label="实际交付日期">
            {order.actualDeliveryDate 
              ? dayjs(order.actualDeliveryDate).format('YYYY-MM-DD')
              : '-'
            }
          </Descriptions.Item>
          <Descriptions.Item label="创建人">
            {order.created_by?.name || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 订单进度 */}
      <Card title="订单进度" style={{ marginBottom: 16 }}>
        <Steps
          current={getStatusStep(order.status)}
          items={[
            { title: '待处理', description: 'Pending' },
            { title: '已确认', description: 'Confirmed' },
            { title: '生产中', description: 'In Production' },
            { title: '已发货', description: 'Shipped' },
            { title: '已送达', description: 'Delivered' },
            { title: '已完成', description: 'Completed' }
          ]}
        />
      </Card>

      {/* 财务信息 */}
      <Card title="财务信息" style={{ marginBottom: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic
              title="小计"
              value={order.financial?.subtotal || 0}
              precision={2}
              prefix="¥"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="税额"
              value={order.financial?.tax_amount || 0}
              precision={2}
              prefix="¥"
              suffix={`(${order.financial?.tax_rate || 0}%)`}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="运费"
              value={order.financial?.shipping_cost || 0}
              precision={2}
              prefix="¥"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="折扣"
              value={order.financial?.discount || 0}
              precision={2}
              prefix="¥"
            />
          </Col>
        </Row>
        <Divider />
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="订单总额"
              value={order.financial?.total_amount || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1890ff', fontSize: '24px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="已付金额"
              value={order.payment?.paid_amount || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="未付金额"
              value={(order.financial?.total_amount || 0) - (order.payment?.paid_amount || 0)}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
        </Row>
        <Divider />
        <Descriptions column={2}>
          <Descriptions.Item label="付款状态">
            <Tag color={
              order.payment?.payment_status === 'Paid' ? 'success' :
              order.payment?.payment_status === 'Partial' ? 'warning' :
              order.payment?.payment_status === 'Overdue' ? 'error' : 'default'
            }>
              {order.payment?.payment_status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="付款条款">
            {order.payment?.payment_terms || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 付款记录 */}
      {order.payment?.payment_records && order.payment.payment_records.length > 0 && (
        <Card title="付款记录" style={{ marginBottom: 16 }}>
          <Timeline
            items={order.payment.payment_records.map((record, index) => ({
              key: index,
              color: 'green',
              children: (
                <div>
                  <div>
                    <strong>¥{(record.amount || 0).toLocaleString()}</strong>
                    <span style={{ marginLeft: 8, color: '#666' }}>
                      {dayjs(record.date).format('YYYY-MM-DD')}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    方式: {record.method || '-'} | 参考号: {record.reference || '-'}
                  </div>
                  {record.notes && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {record.notes}
                    </div>
                  )}
                </div>
              )
            }))}
          />
        </Card>
      )}

      {/* 详细信息Tabs */}
      <Card style={{ marginBottom: 16 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Tab 1: 订单明细 */}
          <Tabs.TabPane
            tab={
              <span>
                <ShoppingCartOutlined />
                订单明细
              </span>
            }
            key="1"
          >
            <Table
              columns={itemColumns}
              dataSource={order.orderItems}
              rowKey={(record, index) => `${record.model_name}_${index}`}
              pagination={false}
              scroll={{ x: 1200 }}
            />
            <Divider />
            <div style={{ textAlign: 'right', fontSize: '16px' }}>
              <Space size="large">
                <span>物料总数: <strong>{order.orderItems?.length || 0}</strong> 项</span>
                <span>数量总计: <strong>{order.orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0)}</strong> 台</span>
                <span>小计: <strong style={{ color: '#1890ff' }}>¥{(order.financial?.subtotal || 0).toLocaleString()}</strong></span>
              </Space>
            </div>
          </Tabs.TabPane>

          {/* Tab 2: 付款记录 */}
          <Tabs.TabPane
            tab={
              <span>
                <DollarOutlined />
                付款记录
                {order.payment?.payment_records && order.payment.payment_records.length > 0 && (
                  <Badge count={order.payment.payment_records.length} style={{ marginLeft: 8 }} />
                )}
              </span>
            }
            key="2"
          >
            {order.payment?.payment_records && order.payment.payment_records.length > 0 ? (
              <Timeline
                items={order.payment.payment_records.map((record, index) => ({
                  key: index,
                  color: 'green',
                  children: (
                    <div>
                      <div>
                        <strong>¥{(record.amount || 0).toLocaleString()}</strong>
                        <span style={{ marginLeft: 8, color: '#666' }}>
                          {dayjs(record.date).format('YYYY-MM-DD')}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        方式: {record.method || '-'} | 参考号: {record.reference || '-'}
                      </div>
                      {record.notes && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {record.notes}
                        </div>
                      )}
                    </div>
                  )
                }))}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <DollarOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>暂无付款记录</div>
              </div>
            )}
          </Tabs.TabPane>

          {/* Tab 3: 交付信息 */}
          <Tabs.TabPane
            tab={
              <span>
                <TruckOutlined />
                交付信息
              </span>
            }
            key="3"
          >
            <Descriptions bordered column={2}>
              <Descriptions.Item label="交付方式">
                {order.delivery?.shipping_method || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="交付条款">
                {order.delivery?.delivery_terms || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="跟踪号">
                {order.delivery?.tracking_number || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="交付地址" span={2}>
                {order.delivery?.shipping_address || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Tabs.TabPane>

          {/* Tab 4: 售后记录 */}
          <Tabs.TabPane
            tab={
              <span>
                <CustomerServiceOutlined />
                售后记录
                {serviceTickets.length > 0 && (
                  <Badge count={serviceTickets.length} style={{ marginLeft: 8 }} />
                )}
              </span>
            }
            key="4"
          >
            {serviceTickets.length > 0 ? (
              <Table
                columns={ticketColumns}
                dataSource={serviceTickets}
                rowKey="_id"
                loading={loadingTickets}
                pagination={false}
                scroll={{ x: 800 }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <CustomerServiceOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>暂无售后记录</div>
                <div style={{ marginTop: 8, fontSize: '12px' }}>
                  可点击上方"快速创建售后工单"按钮
                </div>
              </div>
            )}
          </Tabs.TabPane>

          {/* Tab 5: 合同文件 */}
          <Tabs.TabPane
            tab={
              <span>
                <FolderOutlined />
                合同文件
                {order.documents && order.documents.length > 0 && (
                  <Badge count={order.documents.length} style={{ marginLeft: 8 }} />
                )}
              </span>
            }
            key="5"
          >
            <div style={{ marginBottom: 16 }}>
              <CloudUpload
                onSuccess={async (fileData) => {
                  try {
                    await axios.post(`/api/orders/${id}/add-file`, {
                      file_name: fileData.name,
                      file_url: fileData.url,
                    });
                    message.success('文件已关联到订单！');
                    fetchOrder();
                  } catch (error) {
                    message.error('关联文件失败: ' + (error.response?.data?.message || error.message));
                  }
                }}
              >
                <Button icon={<UploadOutlined />} type="primary">
                  上传合同文件
                </Button>
              </CloudUpload>
            </div>
            
            {order.documents && order.documents.length > 0 ? (
              <Table
                dataSource={order.documents}
                rowKey={(record, index) => `doc_${index}`}
                pagination={false}
                columns={[
                  {
                    title: '文件名',
                    dataIndex: 'name',
                    key: 'name',
                    render: (text) => (
                      <Space>
                        <FileTextOutlined style={{ color: '#1890ff' }} />
                        <strong>{text}</strong>
                      </Space>
                    )
                  },
                  {
                    title: '类型',
                    dataIndex: 'type',
                    key: 'type',
                    width: 100,
                    render: (type) => <Tag color="blue">{type || 'other'}</Tag>
                  },
                  {
                    title: '上传时间',
                    dataIndex: 'uploadedAt',
                    key: 'uploadedAt',
                    width: 180,
                    render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
                  },
                  {
                    title: '操作',
                    key: 'actions',
                    width: 150,
                    render: (_, record) => (
                      <Space>
                        <Button
                          type="link"
                          icon={<EyeOutlined />}
                          onClick={() => window.open(record.url, '_blank')}
                        >
                          查看
                        </Button>
                        <Button
                          type="link"
                          icon={<DownloadOutlined />}
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = record.url;
                            link.download = record.name;
                            link.click();
                          }}
                        >
                          下载
                        </Button>
                      </Space>
                    )
                  }
                ]}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <FolderOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>暂无合同文件</div>
                <div style={{ marginTop: 8, fontSize: '12px' }}>
                  点击上方"上传合同文件"按钮开始上传
                </div>
              </div>
            )}
          </Tabs.TabPane>

          {/* Tab 6: 发货记录 */}
          <Tabs.TabPane
            tab={
              <span>
                <InboxOutlined />
                发货记录
                {order.shipments && order.shipments.length > 0 && (
                  <Badge count={order.shipments.length} style={{ marginLeft: 8 }} />
                )}
              </span>
            }
            key="6"
          >
            {order.shipments && order.shipments.length > 0 ? (
              <Table
                columns={shipmentColumns}
                dataSource={order.shipments}
                rowKey={(record, index) => `shipment_${index}`}
                pagination={false}
                scroll={{ x: 1200 }}
                expandable={{
                  expandedRowRender: (record) => (
                    <div style={{ padding: '16px', background: '#fafafa' }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Descriptions title="包装信息" size="small" column={1}>
                            <Descriptions.Item label="包裹数量">
                              {record.packaging?.packages_count || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="总重量">
                              {record.packaging?.total_weight 
                                ? `${record.packaging.total_weight} ${record.packaging.weight_unit || 'kg'}`
                                : '-'
                              }
                            </Descriptions.Item>
                            <Descriptions.Item label="尺寸">
                              {record.packaging?.dimensions || '-'}
                            </Descriptions.Item>
                          </Descriptions>
                        </Col>
                        <Col span={12}>
                          <Descriptions title="联系信息" size="small" column={1}>
                            <Descriptions.Item label="承运商联系方式">
                              {record.carrier_contact || '-'}
                            </Descriptions.Item>
                          </Descriptions>
                          {record.items && record.items.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>发货物料清单:</div>
                              {record.items.map((item, idx) => (
                                <div key={idx} style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                                  • {item.model_name} ({item.item_type}) x {item.quantity}
                                  {item.notes && ` - ${item.notes}`}
                                </div>
                              ))}
                            </div>
                          )}
                        </Col>
                      </Row>
                    </div>
                  )
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <InboxOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>暂无发货记录</div>
                <div style={{ marginTop: 8, fontSize: '12px' }}>
                  可点击上方"添加发货记录"按钮
                </div>
              </div>
            )}
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* 备注信息 */}
      {(order.notes || order.internal_notes || order.special_requirements) && (
        <Card title="备注信息">
          <Descriptions column={1}>
            {order.special_requirements && (
              <Descriptions.Item label="特殊要求">
                {order.special_requirements}
              </Descriptions.Item>
            )}
            {order.notes && (
              <Descriptions.Item label="订单备注">
                {order.notes}
              </Descriptions.Item>
            )}
            {order.internal_notes && (
              <Descriptions.Item label="内部备注">
                <Badge status="warning" text={order.internal_notes} />
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* 更新状态Modal */}
      <Modal
        title="更新订单状态"
        open={statusModalVisible}
        onCancel={() => {
          setStatusModalVisible(false)
          statusForm.resetFields()
        }}
        onOk={() => statusForm.submit()}
        okText="确认更新"
        cancelText="取消"
      >
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={handleUpdateStatus}
          initialValues={{ status: order.status }}
        >
          <Form.Item
            name="status"
            label="新状态"
            rules={[{ required: true, message: '请选择订单状态' }]}
          >
            <Select>
              <Option value="Pending">待处理</Option>
              <Option value="Confirmed">已确认</Option>
              <Option value="In Production">生产中</Option>
              <Option value="Shipped">已发货</Option>
              <Option value="Delivered">已送达</Option>
              <Option value="Completed">已完成</Option>
              <Option value="Cancelled">已取消</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加付款记录Modal */}
      <Modal
        title="添加付款记录"
        open={paymentModalVisible}
        onCancel={() => {
          setPaymentModalVisible(false)
          paymentForm.resetFields()
        }}
        onOk={() => paymentForm.submit()}
        okText="添加"
        cancelText="取消"
      >
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handleAddPayment}
        >
          <Form.Item
            name="amount"
            label="付款金额"
            rules={[{ required: true, message: '请输入付款金额' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入金额"
              prefix="¥"
            />
          </Form.Item>

          <Form.Item
            name="date"
            label="付款日期"
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item
            name="method"
            label="付款方式"
            rules={[{ required: true, message: '请输入付款方式' }]}
          >
            <Select placeholder="请选择付款方式">
              <Option value="Bank Transfer">银行转账</Option>
              <Option value="Cash">现金</Option>
              <Option value="Check">支票</Option>
              <Option value="Credit Card">信用卡</Option>
              <Option value="Other">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="reference"
            label="参考号 / 交易号"
          >
            <Input placeholder="例如: 转账单号" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={3} placeholder="付款备注（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建生产任务Modal */}
      <Modal
        title={
          <Space>
            <ToolOutlined style={{ color: '#ff6a00', fontSize: 20 }} />
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>创建生产任务</span>
          </Space>
        }
        open={productionModalVisible}
        onCancel={() => {
          setProductionModalVisible(false)
          productionForm.resetFields()
        }}
        onOk={() => productionForm.submit()}
        confirmLoading={creatingProduction}
        okText="创建生产任务"
        cancelText="取消"
        width={600}
      >
        <Form
          form={productionForm}
          layout="vertical"
          onFinish={handleCreateProduction}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="plannedStartDate"
                label="计划开始日期"
                rules={[{ required: true, message: '请选择计划开始日期' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="plannedEndDate"
                label="计划完成日期"
                rules={[{ required: true, message: '请选择计划完成日期' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select placeholder="选择优先级">
              <Option value="Low">低</Option>
              <Option value="Normal">正常</Option>
              <Option value="High">高</Option>
              <Option value="Urgent">紧急</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="productionLines"
            label="生产线"
          >
            <Select mode="tags" placeholder="输入生产线名称（可多选）">
              <Option value="生产线A">生产线A</Option>
              <Option value="生产线B">生产线B</Option>
              <Option value="生产线C">生产线C</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="productionNotes"
            label="生产备注"
          >
            <TextArea rows={3} placeholder="生产备注信息（可选）" />
          </Form.Item>

          <Form.Item
            name="technicalRequirements"
            label="技术要求"
          >
            <TextArea rows={2} placeholder="技术要求说明（可选）" />
          </Form.Item>

          <Form.Item
            name="specialInstructions"
            label="特殊说明"
          >
            <TextArea rows={2} placeholder="特殊说明（可选）" />
          </Form.Item>
        </Form>

        {/* 显示订单摘要 */}
        {order && order.orderItems && (
          <Card 
            title="订单物料摘要" 
            size="small" 
            style={{ marginTop: 16, background: '#fff7e6' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>物料种类:</strong> {order.orderItems.length} 种
              </div>
              <div>
                <strong>总数量:</strong> {order.orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0)} 台
              </div>
              <div>
                <strong>订单金额:</strong> ¥{(order.financial?.total_amount || 0).toLocaleString()}
              </div>
            </Space>
          </Card>
        )}
      </Modal>

      {/* 创建发货记录Modal */}
      <Modal
        title={
          <Space>
            <SendOutlined style={{ color: '#52c41a', fontSize: 20 }} />
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>添加发货记录</span>
          </Space>
        }
        open={shipmentModalVisible}
        onCancel={() => {
          setShipmentModalVisible(false)
          shipmentForm.resetFields()
        }}
        onOk={() => shipmentForm.submit()}
        confirmLoading={creatingShipment}
        okText="创建发货记录"
        cancelText="取消"
        width={800}
      >
        <Form
          form={shipmentForm}
          layout="vertical"
          onFinish={handleCreateShipment}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tracking_number"
                label="物流单号"
                rules={[{ required: true, message: '请输入物流单号' }]}
              >
                <Input placeholder="例如: SF1234567890" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="carrier"
                label="承运商"
                rules={[{ required: true, message: '请输入承运商' }]}
              >
                <Select placeholder="选择承运商">
                  <Option value="顺丰速运">顺丰速运</Option>
                  <Option value="圆通快递">圆通快递</Option>
                  <Option value="中通快递">中通快递</Option>
                  <Option value="申通快递">申通快递</Option>
                  <Option value="韵达快递">韵达快递</Option>
                  <Option value="德邦物流">德邦物流</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shipment_number"
                label="发货批次号"
              >
                <Input placeholder="例如: BATCH001（可选）" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="carrier_contact"
                label="承运商联系方式"
              >
                <Input placeholder="联系电话或其他方式" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="shipment_date"
                label="发货日期"
                rules={[{ required: true, message: '请选择发货日期' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="estimated_delivery_date"
                label="预计送达日期"
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="发货状态"
                rules={[{ required: true, message: '请选择发货状态' }]}
              >
                <Select placeholder="选择状态">
                  <Option value="Preparing">准备中</Option>
                  <Option value="Shipped">已发货</Option>
                  <Option value="In Transit">运输中</Option>
                  <Option value="Delivered">已送达</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>包装信息（可选）</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name={['packaging', 'packages_count']}
                label="包裹数量"
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="件数" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={['packaging', 'total_weight']}
                label="总重量"
              >
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="重量" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={['packaging', 'weight_unit']}
                label="重量单位"
                initialValue="kg"
              >
                <Select>
                  <Option value="kg">千克(kg)</Option>
                  <Option value="ton">吨(ton)</Option>
                  <Option value="lb">磅(lb)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name={['packaging', 'dimensions']}
            label="包装尺寸"
          >
            <Input placeholder="例如: 长×宽×高 (cm)" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={3} placeholder="发货备注（可选）" />
          </Form.Item>
        </Form>

        {/* 显示订单摘要 */}
        {order && order.orderItems && (
          <Card 
            title="订单摘要" 
            size="small" 
            style={{ marginTop: 16, background: '#e6f7ff' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>订单号:</strong> {order.orderNumber}
              </div>
              <div>
                <strong>物料种类:</strong> {order.orderItems.length} 种
              </div>
              <div>
                <strong>总数量:</strong> {order.orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0)} 台
              </div>
            </Space>
          </Card>
        )}
      </Modal>

      {/* 创建售后工单Modal */}
      <Modal
        title={
          <Space>
            <CustomerServiceOutlined style={{ color: '#1890ff', fontSize: 20 }} />
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>快速创建售后工单</span>
          </Space>
        }
        open={ticketModalVisible}
        onCancel={() => {
          setTicketModalVisible(false)
          ticketForm.resetFields()
        }}
        onOk={() => ticketForm.submit()}
        confirmLoading={creatingTicket}
        okText="创建工单"
        cancelText="取消"
        width={700}
      >
        <Form
          form={ticketForm}
          layout="vertical"
          onFinish={handleCreateTicket}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ticketType"
                label="工单类型"
                rules={[{ required: true, message: '请选择工单类型' }]}
              >
                <Select placeholder="选择类型">
                  <Option value="Installation">安装</Option>
                  <Option value="Maintenance">维护</Option>
                  <Option value="Repair">维修</Option>
                  <Option value="Inspection">检查</Option>
                  <Option value="Training">培训</Option>
                  <Option value="Consultation">咨询</Option>
                  <Option value="Complaint">投诉</Option>
                  <Option value="Other">其他</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
                initialValue="Normal"
              >
                <Select placeholder="选择优先级">
                  <Option value="Low">低</Option>
                  <Option value="Normal">正常</Option>
                  <Option value="High">高</Option>
                  <Option value="Urgent">紧急</Option>
                  <Option value="Critical">严重</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name={['customer', 'name']}
            label="客户姓名"
            rules={[{ required: true, message: '请输入客户姓名' }]}
          >
            <Input placeholder="客户姓名" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['customer', 'phone']}
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="联系电话" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name={['customer', 'email']}
                label="电子邮箱"
              >
                <Input placeholder="电子邮箱" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name={['customer', 'company']}
            label="公司名称"
          >
            <Input placeholder="公司名称" />
          </Form.Item>

          <Form.Item
            name={['issue', 'title']}
            label="问题标题"
            rules={[{ required: true, message: '请输入问题标题' }]}
          >
            <Input placeholder="简要描述问题" />
          </Form.Item>

          <Form.Item
            name={['issue', 'description']}
            label="问题详情"
            rules={[{ required: true, message: '请输入问题详情' }]}
          >
            <TextArea rows={4} placeholder="详细描述问题情况" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['issue', 'category']}
                label="问题类别"
              >
                <Select placeholder="选择类别">
                  <Option value="Hardware Failure">硬件故障</Option>
                  <Option value="Software Issue">软件问题</Option>
                  <Option value="Performance Problem">性能问题</Option>
                  <Option value="Installation Issue">安装问题</Option>
                  <Option value="User Error">用户错误</Option>
                  <Option value="Other">其他</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name={['issue', 'severity']}
                label="严重程度"
                initialValue="Moderate"
              >
                <Select placeholder="选择严重程度">
                  <Option value="Minor">轻微</Option>
                  <Option value="Moderate">中等</Option>
                  <Option value="Major">严重</Option>
                  <Option value="Critical">紧急</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        {/* 显示订单关联信息 */}
        {order && (
          <Card 
            title="关联订单信息" 
            size="small" 
            style={{ marginTop: 16, background: '#f0f5ff' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>订单号:</strong> {order.orderNumber}
              </div>
              <div>
                <strong>订单日期:</strong> {dayjs(order.orderDate).format('YYYY-MM-DD')}
              </div>
              <div>
                <strong>订单金额:</strong> ¥{(order.financial?.total_amount || 0).toLocaleString()}
              </div>
            </Space>
          </Card>
        )}
      </Modal>
    </div>
  )
}

export default OrderDetails

