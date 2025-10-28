import { useEffect, useState } from 'react'
import { Card, Table, Button, Tag, Space, message, Modal, Form, Input, InputNumber, Badge, Statistic, Row, Col, Alert, Tabs, Progress } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  ToolOutlined
} from '@ant-design/icons'
import { workOrdersAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

const { TextArea } = Input
const { TabPane } = Tabs

const ShopFloorTerminal = () => {
  const { user } = useAuthStore()
  const [workOrders, setWorkOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('my-tasks')
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null)
  
  // Modal状态
  const [progressModalVisible, setProgressModalVisible] = useState(false)
  const [issueModalVisible, setIssueModalVisible] = useState(false)
  const [progressForm] = Form.useForm()
  const [issueForm] = Form.useForm()
  
  // 当前操作的工单
  const [currentWO, setCurrentWO] = useState(null)

  useEffect(() => {
    fetchMyWorkOrders()
    // 每30秒自动刷新
    const interval = setInterval(fetchMyWorkOrders, 30000)
    return () => clearInterval(interval)
  }, [activeTab])

  // 获取我的工单
  const fetchMyWorkOrders = async () => {
    setLoading(true)
    try {
      const params = {}
      if (activeTab === 'my-tasks') {
        params.status = '已发布,进行中'
      }
      
      const response = await workOrdersAPI.getMyWorkOrders(params)
      setWorkOrders(response.data.data || [])
    } catch (error) {
      console.error('获取工单失败:', error)
      message.error('获取工单失败')
    } finally {
      setLoading(false)
    }
  }

  // 开始工单
  const handleStart = async (workOrder) => {
    try {
      await workOrdersAPI.start(workOrder._id)
      message.success('工单已开始')
      fetchMyWorkOrders()
    } catch (error) {
      message.error('开始工单失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 暂停工单
  const handlePause = (workOrder) => {
    Modal.confirm({
      title: '确认暂停',
      content: (
        <div>
          <p>确认暂停工单 {workOrder.work_order_number}？</p>
          <TextArea
            placeholder="请输入暂停原因"
            rows={3}
            id="pause-reason"
          />
        </div>
      ),
      onOk: async () => {
        const reason = document.getElementById('pause-reason').value
        try {
          await workOrdersAPI.pause(workOrder._id, reason)
          message.success('工单已暂停')
          fetchMyWorkOrders()
        } catch (error) {
          message.error('暂停工单失败: ' + (error.response?.data?.message || error.message))
        }
      }
    })
  }

  // 恢复工单
  const handleResume = async (workOrder) => {
    try {
      await workOrdersAPI.resume(workOrder._id)
      message.success('工单已恢复')
      fetchMyWorkOrders()
    } catch (error) {
      message.error('恢复工单失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 完成工单
  const handleComplete = (workOrder) => {
    Modal.confirm({
      title: '确认完成',
      content: `确认完成工单 ${workOrder.work_order_number}？`,
      onOk: async () => {
        try {
          await workOrdersAPI.complete(workOrder._id)
          message.success('工单已完成')
          fetchMyWorkOrders()
        } catch (error) {
          message.error('完成工单失败: ' + (error.response?.data?.message || error.message))
        }
      }
    })
  }

  // 打开报告进度Modal
  const handleOpenProgressModal = (workOrder) => {
    setCurrentWO(workOrder)
    progressForm.resetFields()
    setProgressModalVisible(true)
  }

  // 提交进度
  const handleSubmitProgress = async (values) => {
    try {
      await workOrdersAPI.reportProgress(currentWO._id, values)
      message.success('进度已更新')
      setProgressModalVisible(false)
      progressForm.resetFields()
      fetchMyWorkOrders()
    } catch (error) {
      message.error('更新进度失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 打开报告异常Modal
  const handleOpenIssueModal = (workOrder) => {
    setCurrentWO(workOrder)
    issueForm.resetFields()
    setIssueModalVisible(true)
  }

  // 提交异常
  const handleSubmitIssue = async (values) => {
    try {
      await workOrdersAPI.reportIssue(currentWO._id, values)
      message.success('异常已报告')
      setIssueModalVisible(false)
      issueForm.resetFields()
      fetchMyWorkOrders()
    } catch (error) {
      message.error('报告异常失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 获取状态颜色
  const getStatusColor = (status) => {
    const colorMap = {
      '待发布': 'default',
      '已发布': 'blue',
      '已接收': 'cyan',
      '进行中': 'processing',
      '暂停': 'warning',
      '已完成': 'success',
      '已关闭': 'default',
      '已取消': 'error'
    }
    return colorMap[status] || 'default'
  }

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    const colorMap = {
      '低': 'default',
      '正常': 'blue',
      '高': 'orange',
      '紧急': 'red'
    }
    return colorMap[priority] || 'default'
  }

  // 计算完成率
  const getCompletionRate = (wo) => {
    if (wo.plan.planned_quantity === 0) return 0
    return Math.round((wo.actual.actual_quantity / wo.plan.planned_quantity) * 100)
  }

  // 操作按钮
  const renderActions = (workOrder) => {
    const actions = []
    
    if (workOrder.status === '已发布' || workOrder.status === '已接收') {
      actions.push(
        <Button
          key="start"
          type="primary"
          icon={<PlayCircleOutlined />}
          size="small"
          onClick={() => handleStart(workOrder)}
        >
          开始
        </Button>
      )
    }
    
    if (workOrder.status === '进行中') {
      actions.push(
        <Button
          key="progress"
          type="primary"
          size="small"
          onClick={() => handleOpenProgressModal(workOrder)}
        >
          报告进度
        </Button>,
        <Button
          key="pause"
          icon={<PauseCircleOutlined />}
          size="small"
          onClick={() => handlePause(workOrder)}
        >
          暂停
        </Button>,
        <Button
          key="complete"
          type="primary"
          icon={<CheckCircleOutlined />}
          size="small"
          onClick={() => handleComplete(workOrder)}
          disabled={getCompletionRate(workOrder) < 100}
        >
          完成
        </Button>
      )
    }
    
    if (workOrder.status === '暂停') {
      actions.push(
        <Button
          key="resume"
          type="primary"
          icon={<PlayCircleOutlined />}
          size="small"
          onClick={() => handleResume(workOrder)}
        >
          恢复
        </Button>
      )
    }
    
    actions.push(
      <Button
        key="issue"
        danger
        icon={<WarningOutlined />}
        size="small"
        onClick={() => handleOpenIssueModal(workOrder)}
      >
        报告异常
      </Button>
    )
    
    return <Space>{actions}</Space>
  }

  // 工单卡片
  const WorkOrderCard = ({ workOrder }) => {
    const completionRate = getCompletionRate(workOrder)
    const isDelayed = workOrder.is_delayed || (new Date() > new Date(workOrder.plan.planned_end_time) && workOrder.status !== '已完成')
    
    return (
      <Card
        style={{ marginBottom: 16 }}
        hoverable
        onClick={() => setSelectedWorkOrder(workOrder._id === selectedWorkOrder?._id ? null : workOrder)}
      >
        <Row gutter={16}>
          <Col span={16}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Tag color={getPriorityColor(workOrder.priority)}>{workOrder.priority}</Tag>
                <Tag color={getStatusColor(workOrder.status)}>{workOrder.status}</Tag>
                {isDelayed && <Tag color="red">延期</Tag>}
                <strong style={{ fontSize: 16, marginLeft: 8 }}>{workOrder.work_order_number}</strong>
              </div>
              
              <div>
                <strong>产品:</strong> {workOrder.product?.model_base || '-'}
              </div>
              
              <div>
                <strong>工序:</strong> {workOrder.operation?.operation_name || '-'}
                <span style={{ marginLeft: 12, color: '#888' }}>
                  序号: {workOrder.operation?.sequence}
                </span>
              </div>
              
              <div>
                <strong>工作中心:</strong> {workOrder.work_center?.name || '-'}
              </div>
              
              <div>
                <strong>计划时间:</strong> {' '}
                {dayjs(workOrder.plan.planned_start_time).format('YYYY-MM-DD HH:mm')} ~ {' '}
                {dayjs(workOrder.plan.planned_end_time).format('HH:mm')}
              </div>
            </Space>
          </Col>
          
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <div style={{ marginBottom: 8 }}>完成进度</div>
                <Progress
                  percent={completionRate}
                  status={completionRate >= 100 ? 'success' : completionRate > 0 ? 'active' : 'normal'}
                />
                <div style={{ marginTop: 4, fontSize: 12, color: '#888' }}>
                  {workOrder.actual.actual_quantity} / {workOrder.plan.planned_quantity}
                </div>
              </div>
              
              <div>
                <Space>
                  <Statistic
                    title="合格"
                    value={workOrder.actual.good_quantity}
                    valueStyle={{ color: '#3f8600', fontSize: 16 }}
                  />
                  <Statistic
                    title="不合格"
                    value={workOrder.actual.reject_quantity}
                    valueStyle={{ color: '#cf1322', fontSize: 16 }}
                  />
                </Space>
              </div>
            </Space>
          </Col>
        </Row>
        
        {selectedWorkOrder?._id === workOrder._id && (
          <>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <Row gutter={16}>
                <Col span={24}>
                  {workOrder.notes && (
                    <Alert
                      message="工艺指导"
                      description={<pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{workOrder.notes}</pre>}
                      type="info"
                      style={{ marginBottom: 16 }}
                    />
                  )}
                  
                  {workOrder.issues && workOrder.issues.length > 0 && (
                    <Alert
                      message="异常记录"
                      description={
                        <div>
                          {workOrder.issues.filter(i => !i.resolved).map((issue, idx) => (
                            <div key={idx} style={{ marginBottom: 8 }}>
                              <Tag color="red">{issue.issue_type}</Tag>
                              {issue.description}
                            </div>
                          ))}
                        </div>
                      }
                      type="warning"
                      style={{ marginBottom: 16 }}
                    />
                  )}
                  
                  <div style={{ textAlign: 'right' }}>
                    {renderActions(workOrder)}
                  </div>
                </Col>
              </Row>
            </div>
          </>
        )}
      </Card>
    )
  }

  // 工单列表（表格视图）
  const columns = [
    {
      title: '工单号',
      dataIndex: 'work_order_number',
      key: 'work_order_number',
      fixed: 'left',
      width: 150,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => <Tag color={getPriorityColor(priority)}>{priority}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: '产品',
      key: 'product',
      width: 150,
      render: (_, record) => record.product?.model_base || '-'
    },
    {
      title: '工序',
      key: 'operation',
      width: 200,
      render: (_, record) => (
        <>
          <div>{record.operation?.operation_name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>序号: {record.operation?.sequence}</div>
        </>
      )
    },
    {
      title: '工作中心',
      key: 'work_center',
      width: 150,
      render: (_, record) => record.work_center?.name || '-'
    },
    {
      title: '计划开始',
      dataIndex: ['plan', 'planned_start_time'],
      key: 'planned_start',
      width: 150,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '进度',
      key: 'progress',
      width: 150,
      render: (_, record) => (
        <div>
          <Progress percent={getCompletionRate(record)} size="small" />
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            {record.actual.actual_quantity} / {record.plan.planned_quantity}
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 300,
      render: (_, record) => renderActions(record)
    }
  ]

  // 统计卡片
  const statsCards = (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Card>
          <Statistic
            title="进行中的工单"
            value={workOrders.filter(wo => wo.status === '进行中').length}
            prefix={<PlayCircleOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="待开始"
            value={workOrders.filter(wo => wo.status === '已发布' || wo.status === '已接收').length}
            prefix={<ClockCircleOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="已完成今日"
            value={workOrders.filter(wo => wo.status === '已完成' && dayjs(wo.actual.actual_end_time).isToday()).length}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="异常工单"
            value={workOrders.filter(wo => wo.issues && wo.issues.some(i => !i.resolved)).length}
            prefix={<WarningOutlined />}
            valueStyle={{ color: '#cf1322' }}
          />
        </Card>
      </Col>
    </Row>
  )

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>
            <ToolOutlined /> 车间终端
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#888' }}>
            操作工: {user?.username} | 最后更新: {dayjs().format('YYYY-MM-DD HH:mm:ss')}
          </p>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchMyWorkOrders}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      {statsCards}

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <Badge count={workOrders.filter(wo => wo.status !== '已完成' && wo.status !== '已关闭').length} offset={[10, 0]}>
                我的任务
              </Badge>
            }
            key="my-tasks"
          >
            <div>
              {workOrders.length > 0 ? (
                workOrders.map(wo => <WorkOrderCard key={wo._id} workOrder={wo} />)
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <p style={{ fontSize: 16, color: '#888' }}>暂无分配的工单</p>
                </div>
              )}
            </div>
          </TabPane>
          
          <TabPane tab="列表视图" key="list-view">
            <Table
              columns={columns}
              dataSource={workOrders}
              rowKey="_id"
              loading={loading}
              scroll={{ x: 1500 }}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 个工单`
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 报告进度Modal */}
      <Modal
        title="报告进度"
        open={progressModalVisible}
        onCancel={() => setProgressModalVisible(false)}
        onOk={() => progressForm.submit()}
        width={600}
      >
        <Form
          form={progressForm}
          layout="vertical"
          onFinish={handleSubmitProgress}
        >
          <Form.Item
            name="completed_quantity"
            label="完成数量"
            rules={[{ required: true, message: '请输入完成数量' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="good_quantity"
            label="合格数量"
            rules={[{ required: true, message: '请输入合格数量' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="reject_quantity"
            label="不合格数量"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 报告异常Modal */}
      <Modal
        title="报告异常"
        open={issueModalVisible}
        onCancel={() => setIssueModalVisible(false)}
        onOk={() => issueForm.submit()}
        width={600}
      >
        <Form
          form={issueForm}
          layout="vertical"
          onFinish={handleSubmitIssue}
        >
          <Form.Item
            name="issue_type"
            label="异常类型"
            rules={[{ required: true, message: '请选择异常类型' }]}
          >
            <Select>
              <Select.Option value="质量问题">质量问题</Select.Option>
              <Select.Option value="设备故障">设备故障</Select.Option>
              <Select.Option value="物料短缺">物料短缺</Select.Option>
              <Select.Option value="工具缺失">工具缺失</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="异常描述"
            rules={[{ required: true, message: '请描述异常情况' }]}
          >
            <TextArea rows={4} placeholder="请详细描述异常情况..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ShopFloorTerminal

