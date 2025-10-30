import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Table,
  Timeline,
  message,
  Modal,
  Form,
  Input,
  Spin,
  Divider,
  Badge,
  Steps,
  Row,
  Col,
  Alert
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  UserOutlined,
  DollarOutlined,
  SendOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { ecoAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'

const { TextArea } = Input
const { Step } = Steps

const ECODetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [eco, setEco] = useState(null)
  const [loading, setLoading] = useState(false)
  
  // 审批Modal
  const [approvalModalVisible, setApprovalModalVisible] = useState(false)
  const [approvalType, setApprovalType] = useState('approve') // 'approve' or 'reject'
  const [approvalForm] = Form.useForm()
  const [submittingApproval, setSubmittingApproval] = useState(false)

  // 验证 MongoDB ObjectId 格式
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id)
  }

  useEffect(() => {
    if (id) {
      // 检查 ID 是否有效
      if (!isValidObjectId(id)) {
        message.error('无效的ECO ID')
        navigate('/data-management')
        return
      }
      fetchEcoDetails()
    }
  }, [id])

  const fetchEcoDetails = async () => {
    setLoading(true)
    try {
      const response = await ecoAPI.getById(id)
      setEco(response.data)
    } catch (error) {
      console.error('Failed to load ECO:', error)
      message.error('加载ECO详情失败')
    } finally {
      setLoading(false)
    }
  }

  // 提交审批
  const handleSubmitForApproval = async () => {
    try {
      await ecoAPI.submitForApproval(id)
      message.success('ECO已提交审批')
      fetchEcoDetails()
    } catch (error) {
      console.error('Failed to submit:', error)
      message.error('提交失败')
    }
  }

  // 打开审批Modal
  const handleOpenApprovalModal = (type) => {
    setApprovalType(type)
    setApprovalModalVisible(true)
  }

  // 执行审批
  const handleApproval = async (values) => {
    setSubmittingApproval(true)
    try {
      const approvalData = {
        role: values.role,
        comments: values.comments,
        conditions: values.conditions
      }
      
      if (approvalType === 'approve') {
        await ecoAPI.approve(id, approvalData)
        message.success('ECO已批准')
      } else {
        await ecoAPI.reject(id, approvalData)
        message.success('ECO已驳回')
      }
      
      setApprovalModalVisible(false)
      approvalForm.resetFields()
      fetchEcoDetails()
    } catch (error) {
      console.error('Failed to submit approval:', error)
      message.error('审批操作失败')
    } finally {
      setSubmittingApproval(false)
    }
  }

  // 关闭ECO
  const handleCloseEco = () => {
    Modal.confirm({
      title: '确认关闭ECO',
      content: '关闭后将无法再修改，是否继续？',
      onOk: async () => {
        try {
          await ecoAPI.close(id, {
            closed_reason: '成功实施',
            closed_notes: '变更已完成'
          })
          message.success('ECO已关闭')
          fetchEcoDetails()
        } catch (error) {
          console.error('Failed to close ECO:', error)
          message.error('关闭失败')
        }
      }
    })
  }

  // 状态颜色映射
  const getStatusColor = (status) => {
    const colorMap = {
      '草稿': 'default',
      '待审批': 'processing',
      '审批中': 'processing',
      '已批准': 'success',
      '已拒绝': 'error',
      '已取消': 'default'
    }
    return colorMap[status] || 'default'
  }

  const getApprovalStatusIcon = (status) => {
    const iconMap = {
      '待审批': <ClockCircleOutlined style={{ color: '#1890ff' }} />,
      '已批准': <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      '已拒绝': <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      '已跳过': <CloseCircleOutlined style={{ color: '#d9d9d9' }} />
    }
    return iconMap[status] || <ClockCircleOutlined />
  }

  // 受影响产品列
  const affectedProductColumns = [
    {
      title: '产品型号',
      dataIndex: 'model_base',
      key: 'model_base',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '当前版本',
      dataIndex: 'current_version',
      key: 'current_version',
      render: (version) => <Tag color="blue">{version}</Tag>
    },
    {
      title: '新版本',
      dataIndex: 'new_version',
      key: 'new_version',
      render: (version) => <Tag color="green">{version}</Tag>
    },
    {
      title: '变更说明',
      dataIndex: 'change_notes',
      key: 'change_notes',
      ellipsis: true
    }
  ]

  // 审批记录列
  const approvalColumns = [
    {
      title: '审批人',
      key: 'approver',
      render: (_, record) => (
        <Space>
          <UserOutlined />
          {record.approver?.username || record.approver}
        </Space>
      )
    },
    {
      title: '审批角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color="blue">{role}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Space>
          {getApprovalStatusIcon(status)}
          <Tag color={getStatusColor(status)}>{status}</Tag>
        </Space>
      )
    },
    {
      title: '审批日期',
      dataIndex: 'approval_date',
      key: 'approval_date',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '审批意见',
      dataIndex: 'comments',
      key: 'comments',
      ellipsis: true
    }
  ]

  // 实施步骤列
  const stepColumns = [
    {
      title: '序号',
      dataIndex: 'sequence',
      key: 'sequence',
      width: 80
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '负责人',
      key: 'responsible',
      render: (_, record) => (
        record.responsible?.username || '-'
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          '待开始': 'default',
          '进行中': 'processing',
          '已完成': 'success',
          '已取消': 'default'
        }
        return <Tag color={colorMap[status]}>{status}</Tag>
      }
    },
    {
      title: '完成日期',
      dataIndex: 'completed_date',
      key: 'completed_date',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    }
  ]

  if (loading || !eco) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  const canApprove = user.role === 'supervisor' || user.role === 'admin'
  const isInApproval = eco.approval?.status === '待审批' || eco.approval?.status === '审批中'
  const isDraft = eco.approval?.status === '草稿'

  return (
    <div>
      {/* 头部 */}
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          返回
        </Button>
        <Divider type="vertical" />
        <h1 style={{ margin: 0, display: 'inline' }}>
          {eco.eco_number}
        </h1>
        <Tag color={getStatusColor(eco.approval?.status)}>
          {eco.approval?.status || '草稿'}
        </Tag>
        {eco.closure?.is_closed && (
          <Tag color="default">已关闭</Tag>
        )}
      </Space>

      {/* 操作按钮 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          {isDraft && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmitForApproval}
            >
              提交审批
            </Button>
          )}
          
          {canApprove && isInApproval && !eco.closure?.is_closed && (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleOpenApprovalModal('approve')}
              >
                批准
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleOpenApprovalModal('reject')}
              >
                驳回
              </Button>
            </>
          )}
          
          {eco.approval?.status === '已批准' && !eco.closure?.is_closed && (
            <Button
              onClick={handleCloseEco}
            >
              关闭ECO
            </Button>
          )}
        </Space>
      </Card>

      {/* 基本信息 */}
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="ECO编号">
            <strong>{eco.eco_number}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="标题">
            {eco.title}
          </Descriptions.Item>
          <Descriptions.Item label="变更类型">
            <Tag>{eco.change_type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="优先级">
            <Tag color={
              eco.priority === '紧急' ? 'red' :
              eco.priority === '高' ? 'orange' :
              eco.priority === '中' ? 'blue' : 'default'
            }>
              {eco.priority}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="发起人">
            <Space>
              <UserOutlined />
              {eco.approval?.initiator?.username || '-'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="发起日期">
            {eco.approval?.initiated_date ? dayjs(eco.approval.initiated_date).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="变更描述" span={2}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{eco.description}</div>
          </Descriptions.Item>
          <Descriptions.Item label="变更原因" span={2}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{eco.reason}</div>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 受影响的产品 */}
      {eco.affected_products && eco.affected_products.length > 0 && (
        <Card title="受影响的产品" style={{ marginBottom: 16 }}>
          <Table
            columns={affectedProductColumns}
            dataSource={eco.affected_products}
            rowKey={(record) => record.actuator_id}
            pagination={false}
          />
        </Card>
      )}

      {/* 影响分析 */}
      {eco.impact_analysis && (
        <Card title="影响分析" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card type="inner" title="技术影响" size="small">
                {eco.impact_analysis.technical || '-'}
              </Card>
            </Col>
            <Col span={12}>
              <Card type="inner" title="质量影响" size="small">
                {eco.impact_analysis.quality || '-'}
              </Card>
            </Col>
            <Col span={12}>
              <Card type="inner" title="成本影响" size="small">
                {eco.impact_analysis.cost || '-'}
              </Card>
            </Col>
            <Col span={12}>
              <Card type="inner" title="交付影响" size="small">
                {eco.impact_analysis.delivery || '-'}
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* 成本估算 */}
      {eco.cost_estimate && (
        <Card
          title={
            <Space>
              <DollarOutlined />
              成本估算
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Descriptions bordered column={3}>
            <Descriptions.Item label="设计成本">
              ¥{(eco.cost_estimate.design_cost || 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="材料成本变化">
              ¥{(eco.cost_estimate.material_cost_change || 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="工装成本">
              ¥{(eco.cost_estimate.tooling_cost || 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="测试成本">
              ¥{(eco.cost_estimate.testing_cost || 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="其他成本">
              ¥{(eco.cost_estimate.other_cost || 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="总成本">
              <strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                ¥{(eco.cost_estimate.total_cost || 0).toLocaleString()}
              </strong>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* 审批流程 */}
      <Card title="审批流程" style={{ marginBottom: 16 }}>
        {eco.approval?.approvals && eco.approval.approvals.length > 0 ? (
          <>
            <Steps
              current={eco.approval.approvals.filter(a => a.status !== '待审批').length}
              style={{ marginBottom: 24 }}
            >
              {eco.approval.approvals.map((approval, index) => (
                <Step
                  key={index}
                  title={approval.role}
                  description={approval.approver?.username}
                  status={
                    approval.status === '已批准' ? 'finish' :
                    approval.status === '已拒绝' ? 'error' :
                    approval.status === '待审批' ? 'wait' : 'finish'
                  }
                  icon={getApprovalStatusIcon(approval.status)}
                />
              ))}
            </Steps>
            
            <Table
              columns={approvalColumns}
              dataSource={eco.approval.approvals}
              rowKey={(record, index) => index}
              pagination={false}
            />
          </>
        ) : (
          <Alert
            message="尚未设置审批流程"
            description="ECO提交审批后将自动添加审批记录"
            type="info"
            showIcon
          />
        )}
      </Card>

      {/* 实施计划 */}
      {eco.implementation?.steps && eco.implementation.steps.length > 0 && (
        <Card title="实施计划" style={{ marginBottom: 16 }}>
          <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="计划开始日期">
              {eco.implementation.planned_start_date ? dayjs(eco.implementation.planned_start_date).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="计划完成日期">
              {eco.implementation.planned_completion_date ? dayjs(eco.implementation.planned_completion_date).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="实际开始日期">
              {eco.implementation.actual_start_date ? dayjs(eco.implementation.actual_start_date).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="实际完成日期">
              {eco.implementation.actual_completion_date ? dayjs(eco.implementation.actual_completion_date).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
          </Descriptions>
          
          <Table
            columns={stepColumns}
            dataSource={eco.implementation.steps}
            rowKey={(record, index) => index}
            pagination={false}
          />
        </Card>
      )}

      {/* 关闭信息 */}
      {eco.closure?.is_closed && (
        <Card title="关闭信息">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="关闭日期">
              {dayjs(eco.closure.closed_date).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="关闭原因">
              {eco.closure.closed_reason}
            </Descriptions.Item>
            <Descriptions.Item label="关闭说明" span={2}>
              {eco.closure.closed_notes || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* 审批Modal */}
      <Modal
        title={
          <Space>
            {approvalType === 'approve' ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            )}
            <span>{approvalType === 'approve' ? '批准ECO' : '驳回ECO'}</span>
          </Space>
        }
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false)
          approvalForm.resetFields()
        }}
        onOk={() => approvalForm.submit()}
        confirmLoading={submittingApproval}
        okText="提交"
        cancelText="取消"
        width={600}
      >
        <Form
          form={approvalForm}
          layout="vertical"
          onFinish={handleApproval}
        >
          <Form.Item
            name="role"
            label="审批角色"
            rules={[{ required: true, message: '请选择审批角色' }]}
          >
            <Select placeholder="选择您的审批角色">
              <Select.Option value="技术审批">技术审批</Select.Option>
              <Select.Option value="质量审批">质量审批</Select.Option>
              <Select.Option value="生产审批">生产审批</Select.Option>
              <Select.Option value="财务审批">财务审批</Select.Option>
              <Select.Option value="管理审批">管理审批</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comments"
            label="审批意见"
            rules={[{ required: true, message: '请输入审批意见' }]}
          >
            <TextArea rows={4} placeholder="请输入您的审批意见" />
          </Form.Item>

          {approvalType === 'approve' && (
            <Form.Item
              name="conditions"
              label="附加条件（可选）"
            >
              <TextArea rows={2} placeholder="如有附加条件或建议，请在此填写" />
            </Form.Item>
          )}
        </Form>

        <Alert
          message={`您即将${approvalType === 'approve' ? '批准' : '驳回'}此ECO`}
          description={
            approvalType === 'approve' 
              ? '批准后，ECO将继续下一步审批流程或进入实施阶段'
              : '驳回后，ECO将返回给发起人修改'
          }
          type={approvalType === 'approve' ? 'info' : 'warning'}
          showIcon
          style={{ marginTop: 16 }}
        />
      </Modal>
    </div>
  )
}

export default ECODetails

