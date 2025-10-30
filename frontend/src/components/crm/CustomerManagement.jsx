/**
 * CustomerManagement - 客户关系管理模块
 * 提供客户信息管理、跟进记录、商机管理等CRM功能
 */

import { useState, useEffect } from 'react'
import { 
  Card, Table, Button, Space, Input, Select, Modal, Form, 
  Tag, Tooltip, message, Tabs, Descriptions, Timeline, 
  Row, Col, Statistic, Badge, Avatar, Drawer, Rate, DatePicker
} from 'antd'
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  PhoneOutlined, MailOutlined, EnvironmentOutlined, UserOutlined,
  StarOutlined, ClockCircleOutlined, DollarOutlined, FileTextOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [form] = Form.useForm()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      // 模拟数据 - 实际应调用API
      const mockCustomers = [
        {
          _id: '1',
          name: '中石化北京分公司',
          contact_person: '张经理',
          phone: '13800138001',
          email: 'zhang@sinopec.com',
          address: '北京市朝阳区',
          industry: '石油化工',
          status: '重点客户',
          level: 5,
          projects_count: 8,
          total_revenue: 2500000,
          last_contact: '2025-10-28',
          next_follow_up: '2025-11-05',
          notes: '长期合作客户，需求稳定',
          created_at: '2024-01-15'
        },
        {
          _id: '2',
          name: '某电力集团',
          contact_person: '李总',
          phone: '13900139002',
          email: 'li@power.com',
          address: '上海市浦东新区',
          industry: '电力能源',
          status: '潜在客户',
          level: 4,
          projects_count: 3,
          total_revenue: 800000,
          last_contact: '2025-10-25',
          next_follow_up: '2025-11-01',
          notes: '有大型项目意向，需重点跟进',
          created_at: '2024-06-20'
        },
        {
          _id: '3',
          name: '钢铁制造有限公司',
          contact_person: '王工',
          phone: '13700137003',
          email: 'wang@steel.com',
          address: '河北省唐山市',
          industry: '钢铁冶金',
          status: '活跃客户',
          level: 3,
          projects_count: 5,
          total_revenue: 1200000,
          last_contact: '2025-10-20',
          next_follow_up: '2025-10-30',
          notes: '季度性采购需求',
          created_at: '2024-03-10'
        }
      ]
      setCustomers(mockCustomers)
    } catch (error) {
      message.error('获取客户数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCustomer = () => {
    setEditingCustomer(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer)
    form.setFieldsValue({
      ...customer,
      last_contact: customer.last_contact ? dayjs(customer.last_contact) : null,
      next_follow_up: customer.next_follow_up ? dayjs(customer.next_follow_up) : null
    })
    setIsModalVisible(true)
  }

  const handleDeleteCustomer = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个客户吗？',
      onOk: () => {
        setCustomers(customers.filter(c => c._id !== id))
        message.success('删除成功')
      }
    })
  }

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer)
    setIsDetailDrawerVisible(true)
  }

  const handleSubmit = async (values) => {
    try {
      const formattedValues = {
        ...values,
        last_contact: values.last_contact?.format('YYYY-MM-DD'),
        next_follow_up: values.next_follow_up?.format('YYYY-MM-DD')
      }

      if (editingCustomer) {
        // 更新客户
        setCustomers(customers.map(c => 
          c._id === editingCustomer._id ? { ...c, ...formattedValues } : c
        ))
        message.success('客户信息更新成功')
      } else {
        // 新增客户
        const newCustomer = {
          _id: Date.now().toString(),
          ...formattedValues,
          projects_count: 0,
          total_revenue: 0,
          created_at: dayjs().format('YYYY-MM-DD')
        }
        setCustomers([newCustomer, ...customers])
        message.success('客户添加成功')
      }
      setIsModalVisible(false)
    } catch (error) {
      message.error('操作失败')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      '重点客户': 'red',
      '活跃客户': 'green',
      '潜在客户': 'blue',
      '沉睡客户': 'default'
    }
    return colors[status] || 'default'
  }

  const columns = [
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
      render: (text, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }}>
            {text.charAt(0)}
          </Avatar>
          <a onClick={() => handleViewDetails(record)}>{text}</a>
        </Space>
      )
    },
    {
      title: '联系人',
      dataIndex: 'contact_person',
      key: 'contact_person',
      width: 100
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (text) => (
        <Space>
          <PhoneOutlined />
          {text}
        </Space>
      )
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 120,
      render: (text) => <Tag>{text}</Tag>
    },
    {
      title: '客户等级',
      dataIndex: 'level',
      key: 'level',
      width: 130,
      render: (level) => <Rate disabled value={level} style={{ fontSize: 16 }} />
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: '项目数',
      dataIndex: 'projects_count',
      key: 'projects_count',
      width: 80,
      align: 'center',
      render: (count) => <Badge count={count} showZero />
    },
    {
      title: '累计销售额',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      width: 120,
      align: 'right',
      render: (revenue) => `¥${(revenue / 10000).toFixed(2)}万`
    },
    {
      title: '下次跟进',
      dataIndex: 'next_follow_up',
      key: 'next_follow_up',
      width: 120,
      render: (date) => {
        const days = dayjs(date).diff(dayjs(), 'day')
        return (
          <Tooltip title={days < 0 ? '已逾期' : days === 0 ? '今天' : `${days}天后`}>
            <Tag color={days < 0 ? 'red' : days <= 3 ? 'orange' : 'green'}>
              {date}
            </Tag>
          </Tooltip>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
          <Button 
            type="link" 
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditCustomer(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger 
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCustomer(record._id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  const filteredCustomers = customers.filter(customer => {
    const matchSearch = searchText === '' || 
      customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
      customer.contact_person?.toLowerCase().includes(searchText.toLowerCase())
    const matchStatus = filterStatus === 'all' || customer.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="客户总数"
              value={customers.length}
              suffix="个"
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="重点客户"
              value={customers.filter(c => c.status === '重点客户').length}
              suffix="个"
              prefix={<StarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待跟进"
              value={customers.filter(c => dayjs(c.next_follow_up).diff(dayjs(), 'day') <= 3).length}
              suffix="个"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="累计销售额"
              value={customers.reduce((sum, c) => sum + c.total_revenue, 0) / 10000}
              precision={2}
              suffix="万"
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 客户列表 */}
      <Card
        title="客户列表"
        extra={
          <Space>
            <Input
              placeholder="搜索客户名称或联系人"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 130 }}
            >
              <Option value="all">全部状态</Option>
              <Option value="重点客户">重点客户</Option>
              <Option value="活跃客户">活跃客户</Option>
              <Option value="潜在客户">潜在客户</Option>
              <Option value="沉睡客户">沉睡客户</Option>
            </Select>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddCustomer}
            >
              新增客户
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 新增/编辑客户Modal */}
      <Modal
        title={editingCustomer ? '编辑客户' : '新增客户'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="客户名称"
                name="name"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="联系人"
                name="contact_person"
                rules={[{ required: true, message: '请输入联系人' }]}
              >
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="联系电话"
                name="phone"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
              >
                <Input placeholder="请输入邮箱" prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="所在行业"
                name="industry"
                rules={[{ required: true, message: '请选择行业' }]}
              >
                <Select placeholder="请选择行业">
                  <Option value="石油化工">石油化工</Option>
                  <Option value="电力能源">电力能源</Option>
                  <Option value="钢铁冶金">钢铁冶金</Option>
                  <Option value="水处理">水处理</Option>
                  <Option value="制药">制药</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="客户状态"
                name="status"
                rules={[{ required: true, message: '请选择客户状态' }]}
              >
                <Select placeholder="请选择客户状态">
                  <Option value="重点客户">重点客户</Option>
                  <Option value="活跃客户">活跃客户</Option>
                  <Option value="潜在客户">潜在客户</Option>
                  <Option value="沉睡客户">沉睡客户</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="客户等级"
                name="level"
                rules={[{ required: true, message: '请选择客户等级' }]}
              >
                <Rate />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="下次跟进时间"
                name="next_follow_up"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="地址"
            name="address"
          >
            <Input placeholder="请输入地址" prefix={<EnvironmentOutlined />} />
          </Form.Item>
          <Form.Item
            label="备注"
            name="notes"
          >
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 客户详情Drawer */}
      <Drawer
        title="客户详情"
        placement="right"
        width={600}
        open={isDetailDrawerVisible}
        onClose={() => setIsDetailDrawerVisible(false)}
      >
        {selectedCustomer && (
          <Tabs defaultActiveKey="1">
            <Tabs.TabPane tab="基本信息" key="1">
              <Descriptions column={1} bordered>
                <Descriptions.Item label="客户名称">{selectedCustomer.name}</Descriptions.Item>
                <Descriptions.Item label="联系人">{selectedCustomer.contact_person}</Descriptions.Item>
                <Descriptions.Item label="联系电话">
                  <Space>
                    <PhoneOutlined />
                    {selectedCustomer.phone}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">
                  <Space>
                    <MailOutlined />
                    {selectedCustomer.email}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="地址">
                  <Space>
                    <EnvironmentOutlined />
                    {selectedCustomer.address}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="所在行业">
                  <Tag>{selectedCustomer.industry}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="客户状态">
                  <Tag color={getStatusColor(selectedCustomer.status)}>
                    {selectedCustomer.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="客户等级">
                  <Rate disabled value={selectedCustomer.level} />
                </Descriptions.Item>
                <Descriptions.Item label="项目数量">
                  <Badge count={selectedCustomer.projects_count} showZero />
                </Descriptions.Item>
                <Descriptions.Item label="累计销售额">
                  ¥{(selectedCustomer.total_revenue / 10000).toFixed(2)}万
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">{selectedCustomer.created_at}</Descriptions.Item>
                <Descriptions.Item label="备注">{selectedCustomer.notes}</Descriptions.Item>
              </Descriptions>
            </Tabs.TabPane>
            <Tabs.TabPane tab="跟进记录" key="2">
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: (
                      <>
                        <p><strong>2025-10-28</strong></p>
                        <p>电话沟通，客户对新产品感兴趣，约定下周现场演示</p>
                      </>
                    )
                  },
                  {
                    color: 'blue',
                    children: (
                      <>
                        <p><strong>2025-10-20</strong></p>
                        <p>发送产品资料和报价单</p>
                      </>
                    )
                  },
                  {
                    children: (
                      <>
                        <p><strong>2025-10-15</strong></p>
                        <p>首次拜访，了解客户需求</p>
                      </>
                    )
                  }
                ]}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab="关联项目" key="3">
              <p>该客户关联的项目列表...</p>
            </Tabs.TabPane>
          </Tabs>
        )}
      </Drawer>
    </div>
  )
}

export default CustomerManagement

