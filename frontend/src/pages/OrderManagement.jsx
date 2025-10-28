import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Card, Table, Button, Tag, Space, message, Modal, Form, 
  Input, Select, DatePicker, Statistic, Row, Col, Tooltip,
  Dropdown, Badge, Descriptions, Divider
} from 'antd'
import { 
  ShoppingCartOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  DollarOutlined, TruckOutlined, MoreOutlined, FileTextOutlined
} from '@ant-design/icons'
import { ordersAPI } from '../services/api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

const OrderManagement = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState(null)
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

  useEffect(() => {
    fetchOrders()
    fetchStatistics()
  }, [pagination.current, pagination.pageSize, filters])

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
    </div>
  )
}

export default OrderManagement


