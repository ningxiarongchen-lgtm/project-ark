import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Card, Table, Button, Tag, Space, message, Modal, Form, 
  Input, Select, DatePicker, Statistic, Row, Col, Tooltip,
  Dropdown, Badge, Descriptions, Divider, Skeleton
} from 'antd'
import { 
  ShoppingCartOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  DollarOutlined, TruckOutlined, MoreOutlined, FileTextOutlined,
  CustomerServiceOutlined, PlusOutlined, UploadOutlined
} from '@ant-design/icons'
import { ordersAPI, ticketsAPI } from '../services/api'
import CloudUpload from '../components/CloudUpload'
import { TableSkeleton } from '../components/LoadingSkeletons'
import { useAuth } from '../hooks/useAuth'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

const OrderManagement = () => {
  const navigate = useNavigate()
  const { user } = useAuth() // 获取当前用户信息
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState(null)
  
  // 🔒 销售经理权限：只读视图
  const isSalesManager = user?.role === 'Sales Manager'
  const canEditOrders = user && ['Administrator', 'Production Planner'].includes(user.role)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  
  // 筛选条件
  const [filters, setFilters] = useState({
    status: undefined,
    paymentStatus: undefined,
    dateRange: null
  })
  
  // Modal状态
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusForm] = Form.useForm()
  
  // 🎫 售后工单相关状态
  const [ticketModalVisible, setTicketModalVisible] = useState(false)
  const [ticketForm] = Form.useForm()
  const [creatingTicket, setCreatingTicket] = useState(false)
  const [engineers, setEngineers] = useState([]) // 技术工程师列表
  const [uploadedAttachments, setUploadedAttachments] = useState([]) // 已上传的附件

  useEffect(() => {
    fetchOrders()
    fetchStatistics()
    fetchEngineers()
  }, [pagination.current, pagination.pageSize, filters])
  
  // 获取技术工程师列表
  const fetchEngineers = async () => {
    try {
      // 使用已有的API服务获取用户列表
      // 注意：如果没有usersAPI，可以暂时设置为空数组
      setEngineers([]) // 临时解决方案，避免require错误
      // TODO: 添加usersAPI来获取工程师列表
      // const response = await usersAPI.getAll()
      // const allUsers = response.data.data || []
      // const techEngineers = allUsers.filter(u => 
      //   u.role === 'Technical Engineer'
      // )
      // setEngineers(techEngineers)
    } catch (error) {
      console.error('获取工程师列表失败:', error)
    }
  }

  // 获取订单列表
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        status: filters.status,
        paymentStatus: filters.paymentStatus
      }
      
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD')
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD')
      }
      
      const response = await ordersAPI.getAll(params)
      
      setOrders(response.data.data)
      setPagination({
        ...pagination,
        total: response.data.pagination.total
      })
    } catch (error) {
      console.error('获取订单列表失败:', error)
      message.error('获取订单列表失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 获取统计信息
  const fetchStatistics = async () => {
    try {
      const response = await ordersAPI.getStatistics()
      setStatistics(response.data.data)
    } catch (error) {
      console.error('获取统计信息失败:', error)
    }
  }

  // 更新订单状态
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, { status: newStatus })
      message.success('订单状态已更新')
      fetchOrders()
      fetchStatistics()
    } catch (error) {
      console.error('更新状态失败:', error)
      message.error('更新状态失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 删除订单
  const handleDeleteOrder = async (orderId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此订单吗？此操作不可恢复。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await ordersAPI.delete(orderId)
          message.success('订单已删除')
          fetchOrders()
          fetchStatistics()
        } catch (error) {
          console.error('删除订单失败:', error)
          message.error('删除失败: ' + (error.response?.data?.message || error.message))
        }
      }
    })
  }

  // 查看订单详情
  const handleViewOrder = (orderId) => {
    navigate(`/orders/${orderId}`)
  }
  
  // 🎫 打开创建售后工单Modal
  const handleOpenTicketModal = (order) => {
    if (!order) {
      message.warning('订单信息加载中，请稍候...')
      return
    }
    
    // 设置选中的订单
    setSelectedOrder(order)
    
    // 从订单信息预填充客户信息
    ticketForm.setFieldsValue({
      service_type: '维修',
      priority: '正常',
      client_name: order.projectSnapshot?.client?.name || '',
      'client_info.company': order.projectSnapshot?.client?.company || '',
      'client_info.phone': order.projectSnapshot?.client?.phone || '',
      'client_info.contact_person': order.projectSnapshot?.client?.name || ''
    })
    
    // 清空之前上传的附件
    setUploadedAttachments([])
    setTicketModalVisible(true)
  }
  
  // 🎫 创建售后工单
  const handleCreateTicket = async (values) => {
    setCreatingTicket(true)
    try {
      
      // 构建符合新模型的工单数据
      const ticketData = {
        // 关联的销售订单
        related_order_id: selectedOrder._id,
        
        // 客户信息
        client_name: values.client_name,
        client_info: values.client_info || {},
        
        // 服务类型与优先级
        service_type: values.service_type,
        priority: values.priority,
        
        // 问题信息
        title: values.title,
        description: values.description,
        issue_category: values.issue_category,
        severity: values.severity,
        
        // 附件
        attachments: uploadedAttachments,
        
        // 指派的技术工程师（如果有选择）
        assigned_engineer_id: values.assigned_engineer_id
      }
      
      const response = await ticketsAPI.create(ticketData)
      
      
      message.success(`售后工单创建成功！工单号: ${response.data.data.ticket_number || response.data.data.ticketNumber}`)
      
      // 关闭Modal并重置
      setTicketModalVisible(false)
      ticketForm.resetFields()
      setUploadedAttachments([])
      setSelectedOrder(null)
      
      // 询问是否查看详情
      Modal.confirm({
        title: '售后工单创建成功',
        content: `工单号: ${response.data.data.ticket_number || response.data.data.ticketNumber}。是否立即查看详情？`,
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

  // 订单状态标签颜色
  const getStatusColor = (status) => {
    const colorMap = {
      'Pending': 'default',
      'Confirmed': 'processing',
      'In Production': 'blue',
      'Shipped': 'cyan',
      'Delivered': 'green',
      'Completed': 'success',
      'Cancelled': 'error'
    }
    return colorMap[status] || 'default'
  }

  // 付款状态标签颜色
  const getPaymentStatusColor = (status) => {
    const colorMap = {
      'Pending': 'default',
      'Partial': 'warning',
      'Paid': 'success',
      'Overdue': 'error'
    }
    return colorMap[status] || 'default'
  }

  // 状态中文映射
  const statusNameMap = {
    'Pending': '待处理',
    'Confirmed': '已确认',
    'In Production': '生产中',
    'Shipped': '已发货',
    'Delivered': '已送达',
    'Completed': '已完成',
    'Cancelled': '已取消'
  }

  const paymentStatusNameMap = {
    'Pending': '待付款',
    'Partial': '部分付款',
    'Paid': '已付款',
    'Overdue': '逾期'
  }

  // 表格列定义
  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      fixed: 'left',
      width: 150,
      render: (text, record) => (
        <Button 
          type="link" 
          onClick={() => handleViewOrder(record._id)}
          style={{ padding: 0, fontWeight: 'bold' }}
        >
          {text}
        </Button>
      )
    },
    {
      title: '项目信息',
      key: 'project',
      width: 200,
      render: (_, record) => (
        <div>
          <div><strong>{record.projectSnapshot?.projectNumber}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.projectSnapshot?.projectName}
          </div>
        </div>
      )
    },
    {
      title: '客户',
      key: 'client',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.projectSnapshot?.client?.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.projectSnapshot?.client?.company}
          </div>
        </div>
      )
    },
    {
      title: '订单日期',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {statusNameMap[status] || status}
        </Tag>
      )
    },
    {
      title: '付款状态',
      key: 'paymentStatus',
      width: 120,
      render: (_, record) => (
        <Tag color={getPaymentStatusColor(record.payment?.payment_status)}>
          {paymentStatusNameMap[record.payment?.payment_status] || record.payment?.payment_status}
        </Tag>
      )
    },
    {
      title: '订单金额',
      key: 'amount',
      width: 150,
      align: 'right',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
            ¥{(record.financial?.total_amount || 0).toLocaleString()}
          </div>
          {record.payment?.payment_status === 'Partial' && (
            <div style={{ fontSize: '12px', color: '#52c41a' }}>
              已付: ¥{(record.payment?.paid_amount || 0).toLocaleString()}
            </div>
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => {
        // 🔒 销售经理只能查看订单，不能编辑，但可以创建售后工单
        if (isSalesManager) {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewOrder(record._id)}
              >
                查看详情
              </Button>
              <Tooltip title="为此订单创建售后工单">
                <Button
                  size="small"
                  icon={<CustomerServiceOutlined />}
                  onClick={() => handleOpenTicketModal(record)}
                  style={{ 
                    borderColor: '#52c41a',
                    color: '#52c41a'
                  }}
                >
                  售后
                </Button>
              </Tooltip>
            </Space>
          );
        }
        
        // 管理员和生产计划员可以编辑
        const menuItems = [
          {
            key: 'view',
            label: '查看详情',
            icon: <EyeOutlined />,
            onClick: () => handleViewOrder(record._id)
          },
          {
            key: 'confirm',
            label: '确认订单',
            icon: <CheckCircleOutlined />,
            disabled: record.status !== 'Pending',
            onClick: () => handleUpdateStatus(record._id, 'Confirmed')
          },
          {
            key: 'ship',
            label: '标记发货',
            icon: <TruckOutlined />,
            disabled: !['Confirmed', 'In Production'].includes(record.status),
            onClick: () => handleUpdateStatus(record._id, 'Shipped')
          },
          {
            key: 'deliver',
            label: '标记送达',
            icon: <CheckCircleOutlined />,
            disabled: record.status !== 'Shipped',
            onClick: () => handleUpdateStatus(record._id, 'Delivered')
          },
          {
            type: 'divider'
          },
          {
            key: 'delete',
            label: '删除订单',
            icon: <DeleteOutlined />,
            danger: true,
            disabled: !['Pending', 'Cancelled'].includes(record.status),
            onClick: () => handleDeleteOrder(record._id)
          }
        ]

        return (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewOrder(record._id)}
            >
              查看
            </Button>
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <Button size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        )
      }
    }
  ]

  // Render loading skeleton
  if (loading && orders.length === 0) {
    return <TableSkeleton rows={10} columns={7} />
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>
          <ShoppingCartOutlined style={{ marginRight: 8 }} />
          订单管理
        </h2>

        {/* 统计卡片 */}
        {statistics && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="订单总数"
                  value={statistics.totalOrders}
                  prefix={<ShoppingCartOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="待处理订单"
                  value={statistics.ordersByStatus?.pending || 0}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总营收"
                  value={statistics.financials?.totalRevenue || 0}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="未收款金额"
                  value={statistics.financials?.totalUnpaid || 0}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 筛选条件 */}
        <Card style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="订单状态"
              allowClear
              style={{ width: 150 }}
              value={filters.status}
              onChange={(value) => {
                setFilters({ ...filters, status: value })
                setPagination({ ...pagination, current: 1 })
              }}
            >
              <Option value="Pending">待处理</Option>
              <Option value="Confirmed">已确认</Option>
              <Option value="In Production">生产中</Option>
              <Option value="Shipped">已发货</Option>
              <Option value="Delivered">已送达</Option>
              <Option value="Completed">已完成</Option>
              <Option value="Cancelled">已取消</Option>
            </Select>

            <Select
              placeholder="付款状态"
              allowClear
              style={{ width: 150 }}
              value={filters.paymentStatus}
              onChange={(value) => {
                setFilters({ ...filters, paymentStatus: value })
                setPagination({ ...pagination, current: 1 })
              }}
            >
              <Option value="Pending">待付款</Option>
              <Option value="Partial">部分付款</Option>
              <Option value="Paid">已付款</Option>
              <Option value="Overdue">逾期</Option>
            </Select>

            <RangePicker
              placeholder={['开始日期', '结束日期']}
              value={filters.dateRange}
              onChange={(dates) => {
                setFilters({ ...filters, dateRange: dates })
                setPagination({ ...pagination, current: 1 })
              }}
            />

            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setFilters({
                  status: undefined,
                  paymentStatus: undefined,
                  dateRange: null
                })
                setPagination({ ...pagination, current: 1 })
              }}
            >
              重置
            </Button>
          </Space>
        </Card>
      </div>

      {/* 订单列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize })
            }
          }}
          scroll={{ x: 1400 }}
        />
      </Card>
      
      {/* 🎫 创建售后工单Modal */}
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
          setUploadedAttachments([])
          setSelectedOrder(null)
        }}
        onOk={() => ticketForm.submit()}
        confirmLoading={creatingTicket}
        okText="创建工单"
        cancelText="取消"
        width={800}
      >
        <Form
          form={ticketForm}
          layout="vertical"
          onFinish={handleCreateTicket}
        >
          {/* 基本信息 */}
          <Divider orientation="left" style={{ marginTop: 0 }}>基本信息</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="service_type"
                label="服务类型"
                rules={[{ required: true, message: '请选择服务类型' }]}
              >
                <Select placeholder="选择服务类型">
                  <Option value="维修">维修</Option>
                  <Option value="备件">备件</Option>
                  <Option value="技术咨询">技术咨询</Option>
                  <Option value="安装调试">安装调试</Option>
                  <Option value="设备巡检">设备巡检</Option>
                  <Option value="培训">培训</Option>
                  <Option value="投诉处理">投诉处理</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select placeholder="选择优先级">
                  <Option value="低">低</Option>
                  <Option value="正常">正常</Option>
                  <Option value="高">高</Option>
                  <Option value="紧急">紧急</Option>
                  <Option value="危急">危急</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 客户信息 */}
          <Divider orientation="left">客户信息</Divider>

          <Form.Item
            name="client_name"
            label="客户名称"
            rules={[{ required: true, message: '请输入客户名称' }]}
          >
            <Input placeholder="客户名称" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['client_info', 'company']}
                label="公司名称"
              >
                <Input placeholder="公司名称（可选）" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['client_info', 'phone']}
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['client_info', 'contact_person']}
                label="联系人"
              >
                <Input placeholder="联系人姓名（可选）" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['client_info', 'email']}
                label="电子邮件"
              >
                <Input placeholder="电子邮件（可选）" />
              </Form.Item>
            </Col>
          </Row>

          {/* 问题描述 */}
          <Divider orientation="left">问题描述</Divider>

          <Form.Item
            name="title"
            label="问题标题"
            rules={[{ required: true, message: '请输入问题标题' }]}
          >
            <Input 
              placeholder="简要描述问题（例如：执行器无法正常启动）" 
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="问题详细描述"
            rules={[{ required: true, message: '请输入问题详细描述' }]}
            extra="请详细描述问题现象、发生时间、客户反馈等信息"
          >
            <TextArea 
              rows={5} 
              placeholder="请详细描述问题情况，包括：&#10;1. 问题现象&#10;2. 发生时间&#10;3. 故障频率&#10;4. 客户原始反馈&#10;5. 其他相关信息"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="issue_category"
                label="问题分类"
              >
                <Select placeholder="选择问题分类（可选）">
                  <Option value="硬件故障">硬件故障</Option>
                  <Option value="软件问题">软件问题</Option>
                  <Option value="性能问题">性能问题</Option>
                  <Option value="安装问题">安装问题</Option>
                  <Option value="操作问题">操作问题</Option>
                  <Option value="配件需求">配件需求</Option>
                  <Option value="技术咨询">技术咨询</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="severity"
                label="严重程度"
              >
                <Select placeholder="选择严重程度（可选）">
                  <Option value="轻微">轻微</Option>
                  <Option value="中等">中等</Option>
                  <Option value="严重">严重</Option>
                  <Option value="危急">危急</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 附件上传 */}
          <Divider orientation="left">附件上传</Divider>

          <Form.Item
            label="上传现场照片/视频"
            extra="支持客户提供的现场照片、视频或其他相关文件"
          >
            <CloudUpload
              onSuccess={(fileData) => {
                const newAttachment = {
                  file_name: fileData.name,
                  file_url: fileData.url,
                  file_type: fileData.name.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image' : 
                            fileData.name.match(/\.(mp4|avi|mov)$/i) ? 'video' : 'document',
                  file_size: fileData.size || 0
                }
                setUploadedAttachments(prev => [...prev, newAttachment])
                message.success(`文件 ${fileData.name} 上传成功`)
              }}
              onRemove={(file) => {
                setUploadedAttachments(prev => 
                  prev.filter(att => att.file_name !== file.name)
                )
              }}
              multiple
              listType="picture-card"
            >
              <div>
                <UploadOutlined style={{ fontSize: 24 }} />
                <div style={{ marginTop: 8 }}>点击上传</div>
              </div>
            </CloudUpload>
            
            {uploadedAttachments.length > 0 && (
              <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                已上传 {uploadedAttachments.length} 个文件
              </div>
            )}
          </Form.Item>

          {/* 指派技术工程师 */}
          <Divider orientation="left">指派给技术工程师</Divider>

          <Form.Item
            name="assigned_engineer_id"
            label="指派技术工程师"
            extra="选择负责处理此工单的技术工程师（可选，也可以稍后再分配）"
          >
            <Select 
              placeholder="选择技术工程师（可选）" 
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {engineers.map(engineer => (
                <Option key={engineer._id} value={engineer._id}>
                  {engineer.full_name || engineer.name} - {engineer.department || '技术部'}
                  {engineer.email && ` (${engineer.email})`}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>

        {/* 显示订单关联信息 */}
        {selectedOrder && (
          <Card 
            title="关联订单信息" 
            size="small" 
            style={{ marginTop: 16, background: '#f0f5ff', borderRadius: 8 }}
          >
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="订单编号">
                {selectedOrder.orderNumber}
              </Descriptions.Item>
              <Descriptions.Item label="订单日期">
                {dayjs(selectedOrder.orderDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="项目名称">
                {selectedOrder.projectSnapshot?.projectName}
              </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={getStatusColor(selectedOrder.status)}>
                  {statusNameMap[selectedOrder.status] || selectedOrder.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </Modal>
    </div>
  )
}

export default OrderManagement


