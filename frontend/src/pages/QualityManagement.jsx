import { useEffect, useState } from 'react'
import {
  Card, Table, Button, Tag, Space, message, Modal, Form, Input, InputNumber,
  Select, DatePicker, Statistic, Row, Col, Badge, Tabs, Descriptions,
  Alert, Progress, Divider, Upload, Image
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { qualityAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import dayjs from 'dayjs'

const { TextArea } = Input
const { TabPane } = Tabs
const { Option } = Select

const QualityManagement = () => {
  const { user } = useAuthStore()
  const [qualityChecks, setQualityChecks] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')
  const [statistics, setStatistics] = useState(null)
  const [selectedQC, setSelectedQC] = useState(null)
  
  // Modal状态
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [inspectionModalVisible, setInspectionModalVisible] = useState(false)
  const [defectModalVisible, setDefectModalVisible] = useState(false)
  
  // Form
  const [inspectionForm] = Form.useForm()
  const [defectForm] = Form.useForm()

  useEffect(() => {
    fetchQualityChecks()
    fetchStatistics()
  }, [activeTab])

  // 获取质检列表
  const fetchQualityChecks = async () => {
    setLoading(true)
    try {
      let response
      if (activeTab === 'pending') {
        response = await qualityAPI.getPending()
      } else if (activeTab === 'my-tasks') {
        response = await qualityAPI.getMyTasks()
      } else {
        response = await qualityAPI.getAll({ status: activeTab })
      }
      setQualityChecks(response.data.data || [])
    } catch (error) {
      console.error('获取质检列表失败:', error)
      message.error('获取质检列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取统计信息
  const fetchStatistics = async () => {
    try {
      const response = await qualityAPI.getStats()
      setStatistics(response.data.data)
    } catch (error) {
      console.error('获取统计信息失败:', error)
    }
  }

  // 查看详情
  const handleViewDetail = async (qc) => {
    try {
      const response = await qualityAPI.getById(qc._id)
      setSelectedQC(response.data.data)
      setDetailModalVisible(true)
    } catch (error) {
      message.error('获取质检详情失败')
    }
  }

  // 开始检验
  const handleStartInspection = async (qc) => {
    try {
      await qualityAPI.start(qc._id)
      message.success('检验已开始')
      fetchQualityChecks()
    } catch (error) {
      message.error('开始检验失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 打开检验Modal
  const handleOpenInspectionModal = async (qc) => {
    try {
      const response = await qualityAPI.getById(qc._id)
      setSelectedQC(response.data.data)
      inspectionForm.resetFields()
      
      // 设置初始值
      inspectionForm.setFieldsValue({
        quantity: {
          accepted_quantity: response.data.data.quantity.submitted_quantity,
          rejected_quantity: 0
        }
      })
      
      setInspectionModalVisible(true)
    } catch (error) {
      message.error('获取质检详情失败')
    }
  }

  // 完成检验
  const handleCompleteInspection = async (values) => {
    try {
      await qualityAPI.complete(selectedQC._id, values)
      message.success('检验已完成')
      setInspectionModalVisible(false)
      inspectionForm.resetFields()
      fetchQualityChecks()
      fetchStatistics()
    } catch (error) {
      message.error('完成检验失败: ' + (error.response?.data?.message || error.message))
    }
  }

  // 打开不合格项Modal
  const handleOpenDefectModal = (qc) => {
    setSelectedQC(qc)
    defectForm.resetFields()
    setDefectModalVisible(true)
  }

  // 添加不合格项
  const handleAddDefect = async (values) => {
    try {
      await qualityAPI.addDefect(selectedQC._id, values)
      message.success('不合格项已添加')
      setDefectModalVisible(false)
      defectForm.resetFields()
      fetchQualityChecks()
    } catch (error) {
      message.error('添加不合格项失败')
    }
  }

  // 获取状态颜色
  const getStatusColor = (status) => {
    const colorMap = {
      '待检': 'blue',
      '检验中': 'processing',
      '已完成': 'success',
      '已取消': 'default'
    }
    return colorMap[status] || 'default'
  }

  // 获取结果颜色
  const getResultColor = (result) => {
    const colorMap = {
      '合格': 'success',
      '不合格': 'error',
      '让步接收': 'warning',
      '待判定': 'default'
    }
    return colorMap[result] || 'default'
  }

  // 表格列定义
  const columns = [
    {
      title: '质检编号',
      dataIndex: 'qc_number',
      key: 'qc_number',
      fixed: 'left',
      width: 150,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '工单号',
      key: 'work_order',
      width: 150,
      render: (_, record) => record.work_order?.work_order_number || '-'
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
      width: 150,
      render: (_, record) => (
        <>
          <div>{record.operation?.operation_name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>序号: {record.operation?.sequence}</div>
        </>
      )
    },
    {
      title: '检验类型',
      dataIndex: 'inspection_type',
      key: 'inspection_type',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (result) => <Tag color={getResultColor(result)}>{result}</Tag>
    },
    {
      title: '送检数量',
      key: 'quantity',
      width: 100,
      render: (_, record) => record.quantity?.submitted_quantity || 0
    },
    {
      title: '合格率',
      key: 'pass_rate',
      width: 120,
      render: (_, record) => {
        const total = record.quantity?.submitted_quantity || 0
        const accepted = record.quantity?.accepted_quantity || 0
        if (total === 0) return '-'
        const rate = Math.round((accepted / total) * 100)
        return <Progress percent={rate} size="small" status={rate >= 95 ? 'success' : rate >= 80 ? 'normal' : 'exception'} />
      }
    },
    {
      title: '检验员',
      key: 'inspector',
      width: 120,
      render: (_, record) => record.inspector?.username || '-'
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
      width: 250,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === '待检' && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              size="small"
              onClick={() => handleStartInspection(record)}
            >
              开始
            </Button>
          )}
          {record.status === '检验中' && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleOpenInspectionModal(record)}
              >
                录入结果
              </Button>
              <Button
                danger
                size="small"
                onClick={() => handleOpenDefectModal(record)}
              >
                添加不合格项
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]

  // 统计卡片
  const statsCards = statistics && (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={4}>
        <Card>
          <Statistic
            title="待检任务"
            value={statistics.pending || 0}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col span={4}>
        <Card>
          <Statistic
            title="检验中"
            value={statistics.in_progress || 0}
            prefix={<PlayCircleOutlined />}
          />
        </Card>
      </Col>
      <Col span={4}>
        <Card>
          <Statistic
            title="已完成"
            value={statistics.completed || 0}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
      </Col>
      <Col span={4}>
        <Card>
          <Statistic
            title="合格率"
            value={statistics.passRate || 0}
            suffix="%"
            valueStyle={{ color: statistics.passRate >= 95 ? '#3f8600' : '#faad14' }}
          />
        </Card>
      </Col>
      <Col span={4}>
        <Card>
          <Statistic
            title="不良率"
            value={statistics.defectRate || 0}
            suffix="%"
            valueStyle={{ color: statistics.defectRate > 5 ? '#cf1322' : '#3f8600' }}
          />
        </Card>
      </Col>
      <Col span={4}>
        <Card>
          <Statistic
            title="不合格数"
            value={statistics.failed || 0}
            prefix={<WarningOutlined />}
            valueStyle={{ color: '#cf1322' }}
          />
        </Card>
      </Col>
    </Row>
  )

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>质量管理</h1>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchQualityChecks()
              fetchStatistics()
            }}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      </div>

      {statsCards}

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <Badge count={statistics?.pending || 0} offset={[10, 0]}>
                待检列表
              </Badge>
            }
            key="pending"
          />
          <TabPane tab="我的任务" key="my-tasks" />
          <TabPane tab="检验中" key="检验中" />
          <TabPane tab="已完成" key="已完成" />
        </Tabs>

        <Table
          columns={columns}
          dataSource={qualityChecks}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1800 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个质检任务`
          }}
        />
      </Card>

      {/* 详情Modal */}
      <Modal
        title="质检详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {selectedQC && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="质检编号">{selectedQC.qc_number}</Descriptions.Item>
              <Descriptions.Item label="工单号">
                {selectedQC.work_order?.work_order_number || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="产品">
                {selectedQC.product?.model_base || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="工序">
                {selectedQC.operation?.operation_name} (序号: {selectedQC.operation?.sequence})
              </Descriptions.Item>
              <Descriptions.Item label="检验类型">{selectedQC.inspection_type}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(selectedQC.status)}>{selectedQC.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="结果">
                <Tag color={getResultColor(selectedQC.result)}>{selectedQC.result}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="检验员">
                {selectedQC.inspector?.username || '未分配'}
              </Descriptions.Item>
            </Descriptions>

            <Divider>数量统计</Divider>
            <Descriptions bordered column={4}>
              <Descriptions.Item label="送检数量">
                {selectedQC.quantity?.submitted_quantity || 0}
              </Descriptions.Item>
              <Descriptions.Item label="合格数量">
                <span style={{ color: '#3f8600', fontWeight: 'bold' }}>
                  {selectedQC.quantity?.accepted_quantity || 0}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="不合格数量">
                <span style={{ color: '#cf1322', fontWeight: 'bold' }}>
                  {selectedQC.quantity?.rejected_quantity || 0}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="合格率">
                {(() => {
                  const total = selectedQC.quantity?.submitted_quantity || 0
                  const accepted = selectedQC.quantity?.accepted_quantity || 0
                  if (total === 0) return '-'
                  return `${Math.round((accepted / total) * 100)}%`
                })()}
              </Descriptions.Item>
            </Descriptions>

            {selectedQC.inspection_items && selectedQC.inspection_items.length > 0 && (
              <>
                <Divider>检验项目</Divider>
                <Table
                  dataSource={selectedQC.inspection_items}
                  columns={[
                    { title: '检验项目', dataIndex: 'item_name', key: 'item_name' },
                    { title: '规格要求', dataIndex: 'specification', key: 'specification' },
                    { title: '实测值', dataIndex: 'measured_value', key: 'measured_value' },
                    {
                      title: '判定',
                      dataIndex: 'result',
                      key: 'result',
                      render: (result) => (
                        <Tag color={result === '合格' ? 'success' : 'error'}>{result}</Tag>
                      )
                    }
                  ]}
                  pagination={false}
                  size="small"
                />
              </>
            )}

            {selectedQC.defects && selectedQC.defects.length > 0 && (
              <>
                <Divider>不合格项</Divider>
                <Alert
                  message="发现不合格项"
                  type="error"
                  style={{ marginBottom: 16 }}
                />
                {selectedQC.defects.map((defect, idx) => (
                  <Card key={idx} size="small" style={{ marginBottom: 8 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Tag color="red">{defect.defect_type}</Tag>
                        <Tag>{defect.severity}</Tag>
                        <strong>数量: {defect.quantity}</strong>
                      </div>
                      <div>{defect.description}</div>
                      <div>处理方式: {defect.disposition}</div>
                    </Space>
                  </Card>
                ))}
              </>
            )}

            {selectedQC.notes && (
              <>
                <Divider>备注</Divider>
                <p>{selectedQC.notes}</p>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* 录入检验结果Modal */}
      <Modal
        title="录入检验结果"
        open={inspectionModalVisible}
        onCancel={() => setInspectionModalVisible(false)}
        onOk={() => inspectionForm.submit()}
        width={700}
      >
        <Form
          form={inspectionForm}
          layout="vertical"
          onFinish={handleCompleteInspection}
        >
          <Alert
            message={`送检数量: ${selectedQC?.quantity?.submitted_quantity || 0}`}
            type="info"
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['quantity', 'accepted_quantity']}
                label="合格数量"
                rules={[{ required: true, message: '请输入合格数量' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['quantity', 'rejected_quantity']}
                label="不合格数量"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['quantity', 'rework_quantity']}
                label="返工数量"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['quantity', 'scrap_quantity']}
                label="报废数量"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="检验备注"
          >
            <TextArea rows={3} placeholder="请填写检验备注..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加不合格项Modal */}
      <Modal
        title="添加不合格项"
        open={defectModalVisible}
        onCancel={() => setDefectModalVisible(false)}
        onOk={() => defectForm.submit()}
        width={600}
      >
        <Form
          form={defectForm}
          layout="vertical"
          onFinish={handleAddDefect}
        >
          <Form.Item
            name="defect_type"
            label="缺陷类型"
            rules={[{ required: true, message: '请选择缺陷类型' }]}
          >
            <Select>
              <Option value="尺寸偏差">尺寸偏差</Option>
              <Option value="外观缺陷">外观缺陷</Option>
              <Option value="性能不达标">性能不达标</Option>
              <Option value="功能异常">功能异常</Option>
              <Option value="材料问题">材料问题</Option>
              <Option value="装配错误">装配错误</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="severity"
            label="缺陷等级"
            rules={[{ required: true, message: '请选择缺陷等级' }]}
          >
            <Select>
              <Option value="严重">严重</Option>
              <Option value="主要">主要</Option>
              <Option value="次要">次要</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="不合格数量"
            rules={[{ required: true, message: '请输入不合格数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="description"
            label="缺陷描述"
            rules={[{ required: true, message: '请描述缺陷情况' }]}
          >
            <TextArea rows={4} placeholder="请详细描述缺陷情况..." />
          </Form.Item>

          <Form.Item
            name="disposition"
            label="处理方式"
            rules={[{ required: true, message: '请选择处理方式' }]}
          >
            <Select>
              <Option value="返工">返工</Option>
              <Option value="返修">返修</Option>
              <Option value="让步接收">让步接收</Option>
              <Option value="报废">报废</Option>
              <Option value="待定">待定</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default QualityManagement

