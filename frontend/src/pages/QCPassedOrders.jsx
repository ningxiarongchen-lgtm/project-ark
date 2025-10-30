import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Table, Button, Tag, Space, message, Modal, Form, Input, InputNumber,
  Descriptions, Alert, Checkbox, Row, Col, Statistic
} from 'antd'
import {
  CheckCircleOutlined, DollarOutlined, ReloadOutlined,
  EyeOutlined, RocketOutlined
} from '@ant-design/icons'
import { ordersAPI } from '../services/api'
import dayjs from 'dayjs'

const { TextArea } = Input

const QCPassedOrders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  
  // Modal状态
  const [paymentModalVisible, setPaymentModalVisible] = useState(false)
  const [shipModalVisible, setShipModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  
  // Form
  const [paymentForm] = Form.useForm()
  const [confirmingPayment, setConfirmingPayment] = useState(false)
  const [markingShip, setMarkingShip] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await ordersAPI.getQCPassedOrders()
      setOrders(response.data.data || [])
    } catch (error) {
      console.error('获取质检通过订单失败:', error)
      message.error('获取订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 打开付款确认Modal
  const handleOpenPaymentModal = (order) => {
    setSelectedOrder(order)
    paymentForm.resetFields()
    // 计算70%金额
    const finalPaymentAmount = (order.financial.total_amount * 0.7).toFixed(2)
    paymentForm.setFieldsValue({
      payment_amount: finalPaymentAmount,
      payment_method: 'Bank Transfer'
    })
    setPaymentModalVisible(true)
  }

  // 确认尾款
  const handleConfirmPayment = async () => {
    try {
      const values = await paymentForm.validateFields()
      setConfirmingPayment(true)
      
      await ordersAPI.confirmFinalPayment(selectedOrder._id, {
        payment_amount: values.payment_amount,
        payment_method: values.payment_method,
        payment_reference: values.payment_reference,
        notes: values.notes
      })
      
      message.success('尾款确认成功')
      setPaymentModalVisible(false)
      paymentForm.resetFields()
      fetchOrders()
    } catch (error) {
      console.error('确认尾款失败:', error)
      message.error('确认尾款失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setConfirmingPayment(false)
    }
  }

  // 打开准备发货Modal
  const handleOpenShipModal = (order) => {
    if (!order.payment?.final_payment_confirmed) {
      message.warning('请先确认收到70%尾款')
      return
    }
    setSelectedOrder(order)
    setShipModalVisible(true)
  }

  // 标记为准备发货
  const handleMarkAsReadyToShip = async () => {
    try {
      setMarkingShip(true)
      
      await ordersAPI.markAsReadyToShip(selectedOrder._id, {
        notes: '尾款已确认，准备发货'
      })
      
      message.success('已标记为准备发货，等待物流人员处理')
      setShipModalVisible(false)
      fetchOrders()
    } catch (error) {
      console.error('标记准备发货失败:', error)
      message.error('标记准备发货失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setMarkingShip(false)
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
      title: '订单金额',
      key: 'totalAmount',
      width: 120,
      render: (_, record) => `¥${record.financial?.total_amount?.toFixed(2) || 0}`
    },
    {
      title: '已付金额',
      key: 'paidAmount',
      width: 120,
      render: (_, record) => `¥${record.payment?.paid_amount?.toFixed(2) || 0}`
    },
    {
      title: '尾款状态',
      key: 'finalPayment',
      width: 120,
      render: (_, record) => (
        record.payment?.final_payment_confirmed ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>已确认</Tag>
        ) : (
          <Tag color="warning">待确认</Tag>
        )
      )
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'QC Passed' ? 'cyan' : 'default'}>
          {status}
        </Tag>
      )
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
      width: 280,
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
            icon={<DollarOutlined />}
            size="small"
            onClick={() => handleOpenPaymentModal(record)}
            disabled={record.payment?.final_payment_confirmed}
          >
            {record.payment?.final_payment_confirmed ? '已确认尾款' : '确认尾款'}
          </Button>
          <Button
            type="primary"
            icon={<RocketOutlined />}
            size="small"
            danger={!record.payment?.final_payment_confirmed}
            onClick={() => handleOpenShipModal(record)}
            disabled={!record.payment?.final_payment_confirmed}
          >
            准备发货
          </Button>
        </Space>
      )
    }
  ]

  // 统计卡片
  const totalOrders = orders.length
  const confirmedPaymentOrders = orders.filter(o => o.payment?.final_payment_confirmed).length
  const totalAmount = orders.reduce((sum, o) => sum + (o.financial?.total_amount || 0), 0)
  const paidAmount = orders.reduce((sum, o) => sum + (o.payment?.paid_amount || 0), 0)

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>质检通过订单（商务工程师）</h1>
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
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理订单"
              value={totalOrders}
              suffix="单"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已确认尾款"
              value={confirmedPaymentOrders}
              suffix="单"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="订单总额"
              value={totalAmount.toFixed(2)}
              prefix="¥"
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已付金额"
              value={paidAmount.toFixed(2)}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#3f8600' }}
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

      {/* 确认尾款Modal */}
      <Modal
        title="确认收到70%尾款"
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        onOk={handleConfirmPayment}
        confirmLoading={confirmingPayment}
        width={600}
      >
        <Alert
          message="订单信息"
          description={
            <div>
              <p><strong>订单号：</strong>{selectedOrder?.orderNumber}</p>
              <p><strong>订单总额：</strong>¥{selectedOrder?.financial?.total_amount?.toFixed(2)}</p>
              <p><strong>已付金额：</strong>¥{selectedOrder?.payment?.paid_amount?.toFixed(2)}</p>
              <p><strong>尾款金额（70%）：</strong>¥{(selectedOrder?.financial?.total_amount * 0.7)?.toFixed(2)}</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form form={paymentForm} layout="vertical">
          <Form.Item
            name="payment_amount"
            label="实际收到金额"
            rules={[{ required: true, message: '请输入收到的金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              prefix="¥"
            />
          </Form.Item>

          <Form.Item
            name="payment_method"
            label="付款方式"
            rules={[{ required: true, message: '请选择付款方式' }]}
          >
            <Input placeholder="如：银行转账、支票等" />
          </Form.Item>

          <Form.Item
            name="payment_reference"
            label="付款凭证号"
          >
            <Input placeholder="银行流水号或支票号等" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={3} placeholder="请输入备注信息..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 准备发货Modal */}
      <Modal
        title="准备发货"
        open={shipModalVisible}
        onCancel={() => setShipModalVisible(false)}
        onOk={handleMarkAsReadyToShip}
        confirmLoading={markingShip}
        width={500}
      >
        <Alert
          message="确认尾款已收到"
          description="确认后，订单将标记为"准备发货"状态，物流人员将能够看到此订单并安排发货。"
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
        
        <Descriptions bordered column={1}>
          <Descriptions.Item label="订单号">{selectedOrder?.orderNumber}</Descriptions.Item>
          <Descriptions.Item label="客户">{selectedOrder?.projectSnapshot?.client?.name}</Descriptions.Item>
          <Descriptions.Item label="订单总额">¥{selectedOrder?.financial?.total_amount?.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="已付金额">¥{selectedOrder?.payment?.paid_amount?.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="付款状态">
            <Tag color={selectedOrder?.payment?.payment_status === 'Paid' ? 'success' : 'warning'}>
              {selectedOrder?.payment?.payment_status}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
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
                <Tag color="cyan">{selectedOrder.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="项目名称">
                {selectedOrder.projectSnapshot?.projectName}
              </Descriptions.Item>
              <Descriptions.Item label="客户名称">
                {selectedOrder.projectSnapshot?.client?.name}
              </Descriptions.Item>
              <Descriptions.Item label="订单金额">
                ¥{selectedOrder.financial?.total_amount?.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="已付金额">
                ¥{selectedOrder.payment?.paid_amount?.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="付款状态">
                <Tag color={selectedOrder.payment?.payment_status === 'Paid' ? 'success' : 'warning'}>
                  {selectedOrder.payment?.payment_status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="尾款状态">
                {selectedOrder.payment?.final_payment_confirmed ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>已确认</Tag>
                ) : (
                  <Tag color="warning">待确认</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default QCPassedOrders

