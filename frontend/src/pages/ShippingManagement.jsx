import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Table, Button, Tag, Space, message, Modal, Form, Input, InputNumber,
  Descriptions, Alert, Row, Col, Statistic, DatePicker
} from 'antd'
import {
  RocketOutlined, ReloadOutlined, EyeOutlined, PlusOutlined
} from '@ant-design/icons'
import { ordersAPI } from '../services/api'
import dayjs from 'dayjs'

const { TextArea } = Input

const ShippingManagement = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  
  // Modal状态
  const [shipmentModalVisible, setShipmentModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  
  // Form
  const [shipmentForm] = Form.useForm()
  const [addingShipment, setAddingShipment] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await ordersAPI.getReadyToShipOrders()
      setOrders(response.data.data || [])
    } catch (error) {
      console.error('获取待发货订单失败:', error)
      message.error('获取订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 打开物流信息Modal
  const handleOpenShipmentModal = (order) => {
    setSelectedOrder(order)
    shipmentForm.resetFields()
    shipmentForm.setFieldsValue({
      shipment_date: dayjs(),
      estimated_delivery_date: dayjs().add(7, 'days')
    })
    setShipmentModalVisible(true)
  }

  // 录入物流信息
  const handleAddShipment = async () => {
    try {
      const values = await shipmentForm.validateFields()
      setAddingShipment(true)
      
      await ordersAPI.addShipment(selectedOrder._id, {
        tracking_number: values.tracking_number,
        carrier: values.carrier,
        carrier_contact: values.carrier_contact,
        shipment_date: values.shipment_date?.toISOString(),
        estimated_delivery_date: values.estimated_delivery_date?.toISOString(),
        packaging: {
          packages_count: values.packages_count,
          total_weight: values.total_weight,
          weight_unit: values.weight_unit || 'kg',
          dimensions: values.dimensions
        },
        notes: values.notes
      })
      
      message.success('物流信息已录入，订单已发货')
      setShipmentModalVisible(false)
      shipmentForm.resetFields()
      fetchOrders()
    } catch (error) {
      console.error('录入物流信息失败:', error)
      message.error('录入物流信息失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setAddingShipment(false)
    }
  }

  // 查看详情
  const handleViewDetail = (order) => {
    setSelectedOrder(order)
    setDetailModalVisible(true)
  }

  // 表格列定义
  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      fixed: 'left',
      width: 150,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '项目名称',
      key: 'projectName',
      width: 200,
      render: (_, record) => record.projectSnapshot?.projectName || '-'
    },
    {
      title: '客户名称',
      key: 'clientName',
      width: 150,
      render: (_, record) => record.projectSnapshot?.client?.name || '-'
    },
    {
      title: '收货地址',
      key: 'address',
      width: 250,
      ellipsis: true,
      render: (_, record) => record.delivery?.shipping_address || record.projectSnapshot?.client?.address || '-'
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'Ready to Ship' ? 'orange' : 'default'}>
          {status}
        </Tag>
      )
    },
    {
      title: '要求交付日期',
      key: 'deliveryDate',
      width: 150,
      render: (_, record) => record.requestedDeliveryDate ? 
        dayjs(record.requestedDeliveryDate).format('YYYY-MM-DD') : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="primary"
            icon={<RocketOutlined />}
            size="small"
            onClick={() => handleOpenShipmentModal(record)}
          >
            录入物流信息
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>待发货订单（物流管理）</h1>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchOrders}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="待发货订单"
              value={orders.length}
              suffix="单"
              valueStyle={{ color: '#fa8c16' }}
              prefix={<RocketOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="今日待发货"
              value={orders.filter(o => 
                dayjs(o.createdAt).isSame(dayjs(), 'day')
              ).length}
              suffix="单"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="紧急订单"
              value={orders.filter(o => 
                o.requestedDeliveryDate && dayjs(o.requestedDeliveryDate).diff(dayjs(), 'day') <= 3
              ).length}
              suffix="单"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个订单`
          }}
        />
      </Card>

      {/* 录入物流信息Modal */}
      <Modal
        title="录入物流信息"
        open={shipmentModalVisible}
        onCancel={() => setShipmentModalVisible(false)}
        onOk={handleAddShipment}
        confirmLoading={addingShipment}
        width={700}
        okText="确认发货"
        cancelText="取消"
      >
        <Alert
          message="订单信息"
          description={
            <div>
              <p><strong>订单号：</strong>{selectedOrder?.orderNumber}</p>
              <p><strong>客户：</strong>{selectedOrder?.projectSnapshot?.client?.name}</p>
              <p><strong>收货地址：</strong>{selectedOrder?.delivery?.shipping_address || selectedOrder?.projectSnapshot?.client?.address}</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form form={shipmentForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tracking_number"
                label="物流单号"
                rules={[{ required: true, message: '请输入物流单号' }]}
              >
                <Input placeholder="请输入物流单号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="carrier"
                label="承运商"
                rules={[{ required: true, message: '请输入承运商名称' }]}
              >
                <Input placeholder="如：顺丰、德邦等" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="carrier_contact"
            label="承运商联系方式"
          >
            <Input placeholder="承运商电话或联系人" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shipment_date"
                label="发货日期"
                rules={[{ required: true, message: '请选择发货日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="estimated_delivery_date"
                label="预计送达日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="packages_count"
                label="包裹数量"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  placeholder="包裹数"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="total_weight"
                label="总重量"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  placeholder="重量"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="weight_unit"
                label="重量单位"
                initialValue="kg"
              >
                <Input placeholder="kg" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="dimensions"
            label="包裹尺寸"
          >
            <Input placeholder="如：100x80x60cm" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={3} placeholder="请输入备注信息..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 订单详情Modal */}
      <Modal
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="订单号">{selectedOrder.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color="orange">{selectedOrder.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="项目名称">
                {selectedOrder.projectSnapshot?.projectName}
              </Descriptions.Item>
              <Descriptions.Item label="客户名称">
                {selectedOrder.projectSnapshot?.client?.name}
              </Descriptions.Item>
              <Descriptions.Item label="客户电话">
                {selectedOrder.projectSnapshot?.client?.phone}
              </Descriptions.Item>
              <Descriptions.Item label="收货地址" span={2}>
                {selectedOrder.delivery?.shipping_address || selectedOrder.projectSnapshot?.client?.address}
              </Descriptions.Item>
              <Descriptions.Item label="交付方式">
                {selectedOrder.delivery?.shipping_method || 'Standard'}
              </Descriptions.Item>
              <Descriptions.Item label="交付条款">
                {selectedOrder.delivery?.delivery_terms || 'FOB Factory'}
              </Descriptions.Item>
              <Descriptions.Item label="要求交付日期">
                {selectedOrder.requestedDeliveryDate ? 
                  dayjs(selectedOrder.requestedDeliveryDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
              <>
                <h3 style={{ marginTop: 24, marginBottom: 16 }}>订单明细</h3>
                <Table
                  dataSource={selectedOrder.orderItems}
                  columns={[
                    { title: '物料类型', dataIndex: 'item_type', key: 'item_type' },
                    { title: '型号', dataIndex: 'model_name', key: 'model_name' },
                    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                    { title: '备注', dataIndex: 'notes', key: 'notes' }
                  ]}
                  pagination={false}
                  size="small"
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ShippingManagement

