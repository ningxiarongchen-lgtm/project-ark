import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Descriptions, Table, Button, Tag, Space, message, 
  Modal, Form, Input, Select, Steps, Divider,
  Row, Col, Statistic, Timeline, Badge, Rate, InputNumber, Alert
} from 'antd'
import {
  ArrowLeftOutlined, EditOutlined, CheckCircleOutlined,
  UserAddOutlined, PlusOutlined, CustomerServiceOutlined,
  ClockCircleOutlined, ToolOutlined, StarOutlined,
  PhoneOutlined, MailOutlined, EnvironmentOutlined, LockOutlined,
  UploadOutlined, FileTextOutlined, EyeOutlined, DownloadOutlined,
  PaperClipOutlined
} from '@ant-design/icons'
import { ticketsAPI } from '../services/api'
import CloudUpload from '../components/CloudUpload'
import axios from 'axios'
import dayjs from 'dayjs'
import { useAuth } from '../hooks/useAuth'
import RoleBasedAccess from '../components/RoleBasedAccess'

const { TextArea } = Input
const { Option } = Select

const TicketDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, hasAnyRole } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // 权限检查
  const canAssign = hasAnyRole(['Administrator', 'Sales Manager'])
  const canUpdateStatus = hasAnyRole(['Administrator', 'After-sales Engineer', 'Technical Engineer'])
  const canAddFollowUp = hasAnyRole(['Administrator', 'After-sales Engineer', 'Technical Engineer'])
  const canSubmitFeedback = hasAnyRole(['Administrator', 'After-sales Engineer', 'Sales Engineer'])

  // Modal状态
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false)
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false)
  
  const [statusForm] = Form.useForm()
  const [assignForm] = Form.useForm()
  const [followUpForm] = Form.useForm()
  const [feedbackForm] = Form.useForm()

  useEffect(() => {
    fetchTicket()
  }, [id])

  const fetchTicket = async () => {
    try {
      const response = await ticketsAPI.getById(id)
      setTicket(response.data.data)
    } catch (error) {
      console.error('获取工单详情失败:', error)
      message.error('获取工单详情失败')
    } finally {
      setLoading(false)
    }
  }

  // 更新工单状态
  const handleUpdateStatus = async (values) => {
    try {
      await ticketsAPI.updateStatus(id, values)
      message.success('工单状态已更新')
      setStatusModalVisible(false)
      statusForm.resetFields()
      fetchTicket()
    } catch (error) {
      console.error('更新状态失败:', error)
      message.error('更新状态失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 分配工程师
  const handleAssignEngineer = async (values) => {
    try {
      await ticketsAPI.assignEngineer(id, values)
      message.success('工程师分配成功')
      setAssignModalVisible(false)
      assignForm.resetFields()
      fetchTicket()
    } catch (error) {
      console.error('分配工程师失败:', error)
      message.error('分配失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 添加跟进记录
  const handleAddFollowUp = async (values) => {
    try {
      await ticketsAPI.addFollowUp(id, values)
      message.success('跟进记录已添加')
      setFollowUpModalVisible(false)
      followUpForm.resetFields()
      fetchTicket()
    } catch (error) {
      console.error('添加跟进记录失败:', error)
      message.error('添加失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 提交反馈
  const handleSubmitFeedback = async (values) => {
    try {
      await ticketsAPI.submitFeedback(id, values)
      message.success('反馈提交成功')
      setFeedbackModalVisible(false)
      feedbackForm.resetFields()
      fetchTicket()
    } catch (error) {
      console.error('提交反馈失败:', error)
      message.error('提交失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 工单状态步骤
  const getStatusStep = (status) => {
    const steps = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed']
    return steps.indexOf(status)
  }

  if (loading) {
    return <div>加载中...</div>
  }

  if (!ticket) {
    return <div>工单不存在</div>
  }

  // 检查售后工程师是否是此工单的负责人
  const isAssignedEngineer = user?.role === 'After-sales Engineer' && 
    ticket?.service?.assignedEngineer?._id === (user?._id || user?.id)

  return (
    <div>
      {/* 售后工程师权限提示 */}
      {user?.role === 'After-sales Engineer' && !isAssignedEngineer && (
        <Alert
          message="只读模式"
          description="您只能操作分配给您的工单。此工单已分配给其他工程师或尚未分配。"
          type="warning"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      <Space style={{ marginBottom: 24 }} wrap>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/service-center')}
        >
          返回工单列表
        </Button>
        
        {/* 更新状态 - 售后工程师只能更新自己负责的工单 */}
        {canUpdateStatus && (user?.role !== 'After-sales Engineer' || isAssignedEngineer) && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setStatusModalVisible(true)}
          >
            更新状态
          </Button>
        )}
        
        {/* 分配工程师 - 只有管理员和销售经理可以 */}
        <RoleBasedAccess allowedRoles={['Administrator', 'Sales Manager']}>
          <Button
            icon={<UserAddOutlined />}
            onClick={() => setAssignModalVisible(true)}
          >
            分配工程师
          </Button>
        </RoleBasedAccess>
        
        {/* 添加跟进 - 售后工程师只能为自己的工单添加跟进 */}
        {canAddFollowUp && (user?.role !== 'After-sales Engineer' || isAssignedEngineer) && (
          <Button
            icon={<PlusOutlined />}
            onClick={() => setFollowUpModalVisible(true)}
          >
            添加跟进
          </Button>
        )}
        
        {/* 提交反馈 */}
        {ticket.status === 'Resolved' && !ticket.feedback?.rating && canSubmitFeedback && (
          <Button
            type="primary"
            icon={<StarOutlined />}
            onClick={() => setFeedbackModalVisible(true)}
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              border: 'none'
            }}
          >
            提交反馈
          </Button>
        )}
      </Space>

      {/* 工单基本信息 */}
      <Card title="工单信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="工单编号">
            <strong style={{ fontSize: '16px' }}>{ticket.ticketNumber}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="工单状态">
            <Tag color="processing" style={{ fontSize: '14px' }}>
              {ticket.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="工单类型">
            {ticket.ticketType}
          </Descriptions.Item>
          <Descriptions.Item label="优先级">
            <Tag color={
              ticket.priority === 'Critical' || ticket.priority === 'Urgent' ? 'red' :
              ticket.priority === 'High' ? 'orange' : 'blue'
            }>
              {ticket.priority}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(ticket.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="创建人">
            {ticket.createdBy?.name || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 工单进度 */}
      <Card title="工单进度" style={{ marginBottom: 16 }}>
        <Steps
          current={getStatusStep(ticket.status)}
          items={[
            { title: '待处理', description: 'Open' },
            { title: '已分配', description: 'Assigned' },
            { title: '处理中', description: 'In Progress' },
            { title: '已解决', description: 'Resolved' },
            { title: '已关闭', description: 'Closed' }
          ]}
        />
      </Card>

      {/* 客户信息 */}
      <Card title="客户信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="客户姓名">
            {ticket.customer?.name}
          </Descriptions.Item>
          <Descriptions.Item label="公司">
            {ticket.customer?.company || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={<Space><PhoneOutlined />联系电话</Space>}>
            {ticket.customer?.phone}
          </Descriptions.Item>
          <Descriptions.Item label={<Space><MailOutlined />电子邮箱</Space>}>
            {ticket.customer?.email || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={<Space><EnvironmentOutlined />地址</Space>} span={2}>
            {ticket.customer?.address || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 问题信息 */}
      <Card title="问题信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="问题标题">
            <strong>{ticket.issue?.title}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="问题描述">
            {ticket.issue?.description}
          </Descriptions.Item>
          <Descriptions.Item label="问题类别">
            <Tag>{ticket.issue?.category || '-'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="严重程度">
            <Tag color={
              ticket.issue?.severity === 'Critical' ? 'red' :
              ticket.issue?.severity === 'Major' ? 'orange' :
              ticket.issue?.severity === 'Moderate' ? 'blue' : 'default'
            }>
              {ticket.issue?.severity || '-'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 服务信息 */}
      <Card title="服务信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="服务类型">
            {ticket.service?.serviceType || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="分配工程师">
            {ticket.service?.assignedEngineer?.name || <Tag color="default">未分配</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="计划服务日期">
            {ticket.service?.scheduledDate ? dayjs(ticket.service.scheduledDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="实际服务日期">
            {ticket.service?.actualServiceDate ? dayjs(ticket.service.actualServiceDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="预计工时">
            {ticket.service?.estimatedHours ? `${ticket.service.estimatedHours} 小时` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="实际工时">
            {ticket.service?.actualHours ? `${ticket.service.actualHours} 小时` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="服务地址" span={2}>
            {ticket.service?.serviceAddress || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* SLA信息 */}
      <Card title="SLA (服务级别协议)" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="响应时间目标"
              value={ticket.sla?.responseTimeTarget || 0}
              suffix="小时"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际响应时间"
              value={ticket.sla?.actualResponseTime || 0}
              suffix="小时"
              valueStyle={{
                color: (ticket.sla?.actualResponseTime || 0) > (ticket.sla?.responseTimeTarget || 0) ? '#cf1322' : '#3f8600'
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="解决时间目标"
              value={ticket.sla?.resolutionTimeTarget || 0}
              suffix="小时"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="实际解决时间"
              value={ticket.sla?.actualResolutionTime || 0}
              suffix="小时"
              valueStyle={{
                color: (ticket.sla?.actualResolutionTime || 0) > (ticket.sla?.resolutionTimeTarget || 0) ? '#cf1322' : '#3f8600'
              }}
            />
          </Col>
        </Row>
        <Divider />
        <div>
          <strong>SLA状态: </strong>
          {ticket.sla?.slaViolated ? (
            <Badge status="error" text="违反SLA" />
          ) : (
            <Badge status="success" text="符合SLA" />
          )}
        </div>
      </Card>

      {/* 解决方案 */}
      {ticket.resolution?.description && (
        <Card title="解决方案" style={{ marginBottom: 16 }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="解决方案描述">
              {ticket.resolution.description}
            </Descriptions.Item>
            <Descriptions.Item label="根本原因">
              {ticket.resolution.rootCause || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="采取的行动">
              {ticket.resolution.actionTaken || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="解决日期">
              {ticket.resolution.resolvedDate ? dayjs(ticket.resolution.resolvedDate).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="解决人">
              {ticket.resolution.resolvedBy?.name || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* 客户反馈 */}
      {ticket.feedback?.rating && (
        <Card title="客户反馈" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <strong>满意度评分: </strong>
            <Rate disabled value={ticket.feedback.rating} />
            <span style={{ marginLeft: 8 }}>({ticket.feedback.rating}/5)</span>
          </div>
          {ticket.feedback.comments && (
            <div>
              <strong>评论: </strong>
              <p>{ticket.feedback.comments}</p>
            </div>
          )}
          <div style={{ color: '#999', fontSize: '12px' }}>
            反馈时间: {dayjs(ticket.feedback.feedbackDate).format('YYYY-MM-DD HH:mm')}
          </div>
        </Card>
      )}

      {/* 跟进记录 */}
      {ticket.followUps && ticket.followUps.length > 0 && (
        <Card title="跟进记录" style={{ marginBottom: 16 }}>
          <Timeline
            items={ticket.followUps.map((followUp, index) => ({
              key: index,
              color: followUp.type === 'Call' ? 'blue' :
                     followUp.type === 'Email' ? 'green' :
                     followUp.type === 'Visit' ? 'orange' : 'default',
              children: (
                <div>
                  <div>
                    <Tag color="blue">{followUp.type}</Tag>
                    <strong>{followUp.user?.name || '未知'}</strong>
                    <span style={{ marginLeft: 8, color: '#666' }}>
                      {dayjs(followUp.date).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, color: '#666' }}>
                    {followUp.content}
                  </div>
                </div>
              )
            }))}
          />
        </Card>
      )}

      {/* 附件管理 */}
      <Card 
        title={
          <Space>
            <PaperClipOutlined />
            <span>附件</span>
            {ticket.attachments && ticket.attachments.length > 0 && (
              <Badge count={ticket.attachments.length} />
            )}
          </Space>
        } 
        style={{ marginBottom: 16 }}
      >
        <Alert
          message="附件管理"
          description="您可以上传工单相关的照片、文档、视频等附件，支持多文件上传。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        {(canAddFollowUp && (user?.role !== 'After-sales Engineer' || isAssignedEngineer)) && (
          <div style={{ marginBottom: 16 }}>
            <CloudUpload
              multiple
              onSuccess={async (fileData) => {
                try {
                  await axios.post(`/api/tickets/${id}/add-attachment`, {
                    file_name: fileData.name,
                    file_url: fileData.url,
                  });
                  message.success('附件已上传！');
                  fetchTicket();
                } catch (error) {
                  message.error('上传附件失败: ' + (error.response?.data?.message || error.message));
                }
              }}
            >
              <Button icon={<UploadOutlined />} type="primary">
                上传附件
              </Button>
            </CloudUpload>
          </div>
        )}
        
        {ticket.attachments && ticket.attachments.length > 0 ? (
          <Table
            dataSource={ticket.attachments}
            rowKey={(record, index) => `att_${index}`}
            pagination={false}
            columns={[
              {
                title: '文件名',
                dataIndex: 'file_name',
                key: 'file_name',
                render: (text) => (
                  <Space>
                    <FileTextOutlined style={{ color: '#1890ff' }} />
                    <strong>{text}</strong>
                  </Space>
                )
              },
              {
                title: '类型',
                dataIndex: 'file_type',
                key: 'file_type',
                width: 100,
                render: (type) => <Tag color="blue">{type || 'other'}</Tag>
              },
              {
                title: '上传时间',
                dataIndex: 'uploaded_at',
                key: 'uploaded_at',
                width: 180,
                render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
              },
              {
                title: '上传者',
                dataIndex: 'uploaded_by',
                key: 'uploaded_by',
                width: 120,
                render: (uploadedBy) => uploadedBy?.name || '-'
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
                      onClick={() => window.open(record.file_url, '_blank')}
                    >
                      查看
                    </Button>
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = record.file_url;
                        link.download = record.file_name;
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
            <PaperClipOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>暂无附件</div>
            {(canAddFollowUp && (user?.role !== 'After-sales Engineer' || isAssignedEngineer)) && (
              <div style={{ marginTop: 8, fontSize: '12px' }}>
                点击上方"上传附件"按钮开始上传
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 更新状态Modal */}
      <Modal
        title="更新工单状态"
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
          initialValues={{ status: ticket.status }}
        >
          <Form.Item
            name="status"
            label="新状态"
            rules={[{ required: true, message: '请选择工单状态' }]}
          >
            <Select>
              <Option value="Open">待处理</Option>
              <Option value="Assigned">已分配</Option>
              <Option value="In Progress">处理中</Option>
              <Option value="Pending Parts">等待零件</Option>
              <Option value="On Hold">暂停</Option>
              <Option value="Resolved">已解决</Option>
              <Option value="Closed">已关闭</Option>
              <Option value="Cancelled">已取消</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 分配工程师Modal */}
      <Modal
        title="分配工程师"
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false)
          assignForm.resetFields()
        }}
        onOk={() => assignForm.submit()}
        okText="确认分配"
        cancelText="取消"
      >
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleAssignEngineer}
        >
          <Form.Item
            name="engineerId"
            label="工程师"
            rules={[{ required: true, message: '请选择工程师' }]}
          >
            <Input placeholder="工程师ID（实际应该是下拉选择）" />
          </Form.Item>

          <Form.Item
            name="scheduledDate"
            label="计划服务日期"
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item
            name="serviceAddress"
            label="服务地址"
          >
            <TextArea rows={2} placeholder="服务地址" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加跟进Modal */}
      <Modal
        title="添加跟进记录"
        open={followUpModalVisible}
        onCancel={() => {
          setFollowUpModalVisible(false)
          followUpForm.resetFields()
        }}
        onOk={() => followUpForm.submit()}
        okText="添加"
        cancelText="取消"
      >
        <Form
          form={followUpForm}
          layout="vertical"
          onFinish={handleAddFollowUp}
        >
          <Form.Item
            name="type"
            label="跟进类型"
            rules={[{ required: true, message: '请选择跟进类型' }]}
          >
            <Select placeholder="选择类型">
              <Option value="Call">电话</Option>
              <Option value="Email">邮件</Option>
              <Option value="Visit">拜访</Option>
              <Option value="Note">备注</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="跟进内容"
            rules={[{ required: true, message: '请输入跟进内容' }]}
          >
            <TextArea rows={4} placeholder="请输入跟进内容" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 提交反馈Modal */}
      <Modal
        title="客户反馈"
        open={feedbackModalVisible}
        onCancel={() => {
          setFeedbackModalVisible(false)
          feedbackForm.resetFields()
        }}
        onOk={() => feedbackForm.submit()}
        okText="提交"
        cancelText="取消"
      >
        <Form
          form={feedbackForm}
          layout="vertical"
          onFinish={handleSubmitFeedback}
        >
          <Form.Item
            name="rating"
            label="满意度评分"
            rules={[{ required: true, message: '请给出评分' }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item
            name="comments"
            label="评论"
          >
            <TextArea rows={4} placeholder="请输入您的评论（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TicketDetails


