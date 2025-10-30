import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Table, Button, Tag, Space, message, Modal, Form,
  Input, Select, DatePicker, Statistic, Row, Col, Tooltip,
  Dropdown, Rate, Badge, Alert
} from 'antd'
import {
  CustomerServiceOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, PlusOutlined, UserAddOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ToolOutlined, WarningOutlined, MoreOutlined,
  PhoneOutlined, MailOutlined, FilterOutlined
} from '@ant-design/icons'
import { ticketsAPI } from '../services/api'
import dayjs from 'dayjs'
import { useAuth } from '../hooks/useAuth'
import RoleBasedAccess from '../components/RoleBasedAccess'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

const ServiceCenter = () => {
  const navigate = useNavigate()
  const { user, hasAnyRole } = useAuth()
  
  // 权限检查
  const canCreate = hasAnyRole(['Administrator', 'After-sales Engineer', 'Sales Engineer', 'Technical Engineer', 'Sales Manager'])
  const canDelete = hasAnyRole(['Administrator'])
  const isAftersalesEngineer = user?.role === 'After-sales Engineer'
  const isSalesManager = user?.role === 'Sales Manager'
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // 筛选条件 - 售后工程师默认只看自己的工单
  const [showMyTicketsOnly, setShowMyTicketsOnly] = useState(isAftersalesEngineer)
  const [filters, setFilters] = useState({
    status: undefined,
    priority: undefined,
    ticketType: undefined,
    dateRange: null
  })

  // Modal状态
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [createForm] = Form.useForm()
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchTickets()
    fetchStatistics()
  }, [pagination.current, pagination.pageSize, filters, showMyTicketsOnly])

  // 获取工单列表
  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        status: filters.status,
        priority: filters.priority,
        ticketType: filters.ticketType
      }

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD')
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD')
      }
      
      // 如果启用"我的工单"筛选，只显示分配给当前用户的工单
      if (showMyTicketsOnly && user) {
        params.assignedEngineer = user._id || user.id
      }

      const response = await ticketsAPI.getAll(params)

      setTickets(response.data.data)
      setPagination({
        ...pagination,
        total: response.data.pagination.total
      })
    } catch (error) {
      console.error('获取工单列表失败:', error)
      message.error('获取工单列表失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 获取统计信息
  const fetchStatistics = async () => {
    try {
      const response = await ticketsAPI.getStatistics()
      setStatistics(response.data.data)
    } catch (error) {
      console.error('获取统计信息失败:', error)
    }
  }

  // 创建工单
  const handleCreateTicket = async (values) => {
    setCreating(true)
    try {
      console.log('🎫 正在创建服务工单...')

      const response = await ticketsAPI.create(values)

      console.log('✅ 工单创建成功:', response.data)

      message.success(`工单创建成功！工单号: ${response.data.data.ticketNumber}`)

      setCreateModalVisible(false)
      createForm.resetFields()
      fetchTickets()
      fetchStatistics()

      // 询问是否查看详情
      Modal.confirm({
        title: '工单创建成功',
        content: `工单号: ${response.data.data.ticketNumber}。是否立即查看详情？`,
        okText: '查看详情',
        cancelText: '留在当前页',
        onOk: () => {
          navigate(`/service-center/${response.data.data._id}`)
        }
      })

    } catch (error) {
      console.error('❌ 创建工单失败:', error)
      message.error('创建工单失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setCreating(false)
    }
  }

  // 删除工单
  const handleDeleteTicket = async (ticketId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此工单吗？此操作不可恢复。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await ticketsAPI.delete(ticketId)
          message.success('工单已删除')
          fetchTickets()
          fetchStatistics()
        } catch (error) {
          console.error('删除工单失败:', error)
          message.error('删除失败: ' + (error.response?.data?.message || error.message))
        }
      }
    })
  }

  // 查看工单详情
  const handleViewTicket = (ticketId) => {
    navigate(`/service-center/${ticketId}`)
  }

  // 状态标签颜色
  const getStatusColor = (status) => {
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
    return colorMap[status] || 'default'
  }

  // 优先级标签颜色
  const getPriorityColor = (priority) => {
    const colorMap = {
      'Low': 'default',
      'Normal': 'blue',
      'High': 'orange',
      'Urgent': 'red',
      'Critical': 'magenta'
    }
    return colorMap[priority] || 'default'
  }

  // 类型映射
  const typeNameMap = {
    'Installation': '安装',
    'Maintenance': '维护',
    'Repair': '维修',
    'Inspection': '检查',
    'Training': '培训',
    'Consultation': '咨询',
    'Complaint': '投诉',
    'Other': '其他'
  }

  const statusNameMap = {
    'Open': '待处理',
    'Assigned': '已分配',
    'In Progress': '处理中',
    'Pending Parts': '等待零件',
    'On Hold': '暂停',
    'Resolved': '已解决',
    'Closed': '已关闭',
    'Cancelled': '已取消'
  }

  const priorityNameMap = {
    'Low': '低',
    'Normal': '正常',
    'High': '高',
    'Urgent': '紧急',
    'Critical': '严重'
  }

  // 表格列定义
  const columns = [
    {
      title: '工单号',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      fixed: 'left',
      width: 140,
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => handleViewTicket(record._id)}
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
      render: (type) => (
        <Tag color="blue">{typeNameMap[type] || type}</Tag>
      )
    },
    {
      title: '问题标题',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (_, record) => (
        <Tooltip title={record.issue?.description}>
          {record.issue?.title || '-'}
        </Tooltip>
      )
    },
    {
      title: '客户',
      key: 'customer',
      width: 150,
      render: (_, record) => (
        <div>
          <div><strong>{record.customer?.name}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.customer?.company}
          </div>
        </div>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)} icon={
          priority === 'Critical' || priority === 'Urgent' ? <WarningOutlined /> : null
        }>
          {priorityNameMap[priority] || priority}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={
          status === 'In Progress' ? <ToolOutlined /> :
          status === 'Resolved' ? <CheckCircleOutlined /> :
          status === 'Open' ? <ClockCircleOutlined /> : null
        }>
          {statusNameMap[status] || status}
        </Tag>
      )
    },
    {
      title: '分配工程师',
      key: 'engineer',
      width: 120,
      render: (_, record) => (
        record.service?.assignedEngineer?.name || <Tag color="default">未分配</Tag>
      )
    },
    {
      title: 'SLA状态',
      key: 'sla',
      width: 100,
      align: 'center',
      render: (_, record) => (
        record.sla?.slaViolated ? (
          <Badge status="error" text="违反" />
        ) : (
          <Badge status="success" text="正常" />
        )
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => {
        const menuItems = [
          {
            key: 'view',
            label: '查看详情',
            icon: <EyeOutlined />,
            onClick: () => handleViewTicket(record._id)
          }
        ]
        
        // 只有管理员可以删除工单
        if (canDelete) {
          menuItems.push(
            {
              type: 'divider'
            },
            {
              key: 'delete',
              label: '删除',
              icon: <DeleteOutlined />,
              danger: true,
              disabled: !['Open', 'Cancelled'].includes(record.status),
              onClick: () => handleDeleteTicket(record._id)
            }
          )
        }

        return (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewTicket(record._id)}
            >
              查看
            </Button>
            {canDelete && (
              <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                <Button size="small" icon={<MoreOutlined />} />
              </Dropdown>
            )}
          </Space>
        )
      }
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>
            <CustomerServiceOutlined style={{ marginRight: 8 }} />
            售后服务中心
          </h2>
          <RoleBasedAccess allowedRoles={['Administrator', 'After-sales Engineer', 'Sales Engineer', 'Technical Engineer']}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
              size="large"
            >
              创建工单
            </Button>
          </RoleBasedAccess>
        </div>
        
        {/* 售后工程师的"我的工单"提示 */}
        {isAftersalesEngineer && showMyTicketsOnly && (
          <Alert
            message="当前显示：我的工单"
            description="正在显示分配给您的工单。点击下方按钮可查看所有工单。"
            type="info"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" onClick={() => setShowMyTicketsOnly(false)}>
                查看所有工单
              </Button>
            }
          />
        )}

        {/* 统计卡片 */}
        {statistics && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={4}>
              <Card>
                <Statistic
                  title="工单总数"
                  value={statistics.totalTickets}
                  prefix={<CustomerServiceOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="待处理"
                  value={statistics.ticketsByStatus?.open || 0}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="处理中"
                  value={statistics.ticketsByStatus?.inProgress || 0}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<ToolOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="已解决"
                  value={statistics.ticketsByStatus?.resolved || 0}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="平均满意度"
                  value={statistics.performance?.avgRating || 0}
                  suffix="/ 5"
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<Rate disabled defaultValue={statistics.performance?.avgRating || 0} style={{ fontSize: 12 }} />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="SLA违反"
                  value={statistics.performance?.slaViolated || 0}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 筛选条件 */}
        <Card style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="工单状态"
              allowClear
              style={{ width: 130 }}
              value={filters.status}
              onChange={(value) => {
                setFilters({ ...filters, status: value })
                setPagination({ ...pagination, current: 1 })
              }}
            >
              <Option value="Open">待处理</Option>
              <Option value="Assigned">已分配</Option>
              <Option value="In Progress">处理中</Option>
              <Option value="Pending Parts">等待零件</Option>
              <Option value="On Hold">暂停</Option>
              <Option value="Resolved">已解决</Option>
              <Option value="Closed">已关闭</Option>
              <Option value="Cancelled">已取消</Option>
            </Select>

            <Select
              placeholder="优先级"
              allowClear
              style={{ width: 120 }}
              value={filters.priority}
              onChange={(value) => {
                setFilters({ ...filters, priority: value })
                setPagination({ ...pagination, current: 1 })
              }}
            >
              <Option value="Low">低</Option>
              <Option value="Normal">正常</Option>
              <Option value="High">高</Option>
              <Option value="Urgent">紧急</Option>
              <Option value="Critical">严重</Option>
            </Select>

            <Select
              placeholder="工单类型"
              allowClear
              style={{ width: 120 }}
              value={filters.ticketType}
              onChange={(value) => {
                setFilters({ ...filters, ticketType: value })
                setPagination({ ...pagination, current: 1 })
              }}
            >
              <Option value="Installation">安装</Option>
              <Option value="Maintenance">维护</Option>
              <Option value="Repair">维修</Option>
              <Option value="Inspection">检查</Option>
              <Option value="Training">培训</Option>
              <Option value="Consultation">咨询</Option>
              <Option value="Complaint">投诉</Option>
              <Option value="Other">其他</Option>
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
                  priority: undefined,
                  ticketType: undefined,
                  dateRange: null
                })
                setPagination({ ...pagination, current: 1 })
              }}
            >
              重置
            </Button>
            
            {/* 售后工程师可以切换"我的工单"/"所有工单" */}
            {isAftersalesEngineer && (
              <Button
                type={showMyTicketsOnly ? 'primary' : 'default'}
                icon={<FilterOutlined />}
                onClick={() => {
                  setShowMyTicketsOnly(!showMyTicketsOnly)
                  setPagination({ ...pagination, current: 1 })
                }}
              >
                {showMyTicketsOnly ? '我的工单' : '所有工单'}
              </Button>
            )}
          </Space>
        </Card>
      </div>

      {/* 工单列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={tickets}
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
          scroll={{ x: 1500 }}
        />
      </Card>

      {/* 创建工单Modal */}
      <Modal
        title={
          <Space>
            <CustomerServiceOutlined style={{ color: '#1890ff', fontSize: 20 }} />
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>创建服务工单</span>
          </Space>
        }
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false)
          createForm.resetFields()
        }}
        onOk={() => createForm.submit()}
        confirmLoading={creating}
        okText="创建工单"
        cancelText="取消"
        width={700}
      >
        <Form
          form={createForm}
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
                <Input prefix={<PhoneOutlined />} placeholder="联系电话" />
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
      </Modal>
    </div>
  )
}

export default ServiceCenter


