import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Tabs,
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
  Select,
  DatePicker,
  Spin,
  Empty,
  Badge,
  Divider
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  BranchesOutlined,
  FileTextOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { actuatorsAPI, ecoAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'

const { TextArea } = Input
const { TabPane } = Tabs

const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [product, setProduct] = useState(null)
  const [versionHistory, setVersionHistory] = useState([])
  const [ecos, setEcos] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('1')
  
  // ECO Modal
  const [ecoModalVisible, setEcoModalVisible] = useState(false)
  const [ecoForm] = Form.useForm()
  const [creatingEco, setCreatingEco] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProductDetails()
      fetchVersionHistory()
      fetchEcos()
    }
  }, [id])

  const fetchProductDetails = async () => {
    setLoading(true)
    try {
      const response = await actuatorsAPI.getById(id)
      setProduct(response.data)
    } catch (error) {
      console.error('Failed to load product:', error)
      message.error('加载产品详情失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchVersionHistory = async () => {
    try {
      const response = await actuatorsAPI.getVersionHistory(id)
      setVersionHistory(response.data || [])
    } catch (error) {
      console.error('Failed to load version history:', error)
    }
  }

  const fetchEcos = async () => {
    try {
      const response = await ecoAPI.getByProduct(id)
      setEcos(response.data || [])
    } catch (error) {
      console.error('Failed to load ECOs:', error)
    }
  }

  const handleCreateEco = async (values) => {
    setCreatingEco(true)
    try {
      const ecoData = {
        ...values,
        affected_products: [{
          actuator_id: product._id,
          model_base: product.model_base,
          current_version: product.version,
          new_version: values.new_version
        }],
        approval: {
          initiator: user._id
        }
      }
      
      await ecoAPI.create(ecoData)
      message.success('ECO创建成功')
      setEcoModalVisible(false)
      ecoForm.resetFields()
      fetchEcos()
    } catch (error) {
      console.error('Failed to create ECO:', error)
      message.error('创建ECO失败')
    } finally {
      setCreatingEco(false)
    }
  }

  const handleViewEco = (ecoId) => {
    navigate(`/ecos/${ecoId}`)
  }

  // 状态颜色映射
  const getStatusColor = (status) => {
    const colorMap = {
      '设计中': 'processing',
      '已发布': 'success',
      '已停产': 'default'
    }
    return colorMap[status] || 'default'
  }

  const getEcoStatusColor = (status) => {
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

  // 版本历史列配置
  const versionColumns = [
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      render: (version) => <Tag color="blue">{version}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      )
    },
    {
      title: '发布日期',
      dataIndex: 'release_date',
      key: 'release_date',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '变更说明',
      dataIndex: 'version_notes',
      key: 'version_notes',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/products/${record._id}`)}
        >
          查看
        </Button>
      )
    }
  ]

  // ECO列配置
  const ecoColumns = [
    {
      title: 'ECO编号',
      dataIndex: 'eco_number',
      key: 'eco_number',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '变更类型',
      dataIndex: 'change_type',
      key: 'change_type',
      render: (type) => <Tag>{type}</Tag>
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const colorMap = { '低': 'default', '中': 'blue', '高': 'orange', '紧急': 'red' }
        return <Tag color={colorMap[priority]}>{priority}</Tag>
      }
    },
    {
      title: '审批状态',
      key: 'approval_status',
      render: (_, record) => (
        <Tag color={getEcoStatusColor(record.approval?.status)}>
          {record.approval?.status || '草稿'}
        </Tag>
      )
    },
    {
      title: '创建日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => handleViewEco(record._id)}
        >
          查看详情
        </Button>
      )
    }
  ]

  if (loading || !product) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div>
      {/* 头部 */}
      <Space style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/products')}
        >
          返回列表
        </Button>
        <Divider type="vertical" />
        <h1 style={{ margin: 0, display: 'inline' }}>
          {product.model_base}
          <Badge
            count={product.version}
            style={{ backgroundColor: '#52c41a', marginLeft: 12 }}
          />
          <Tag
            color={getStatusColor(product.status)}
            style={{ marginLeft: 12 }}
          >
            {product.status || '已发布'}
          </Tag>
        </h1>
      </Space>

      {/* Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Tab 1: 基本信息 */}
          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                基本信息
              </span>
            }
            key="1"
          >
            <Descriptions bordered column={2}>
              <Descriptions.Item label="型号">
                <strong>{product.model_base}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="系列">
                {product.series ? <Tag color="blue">{product.series}</Tag> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="版本号">
                <Tag color="green">{product.version || '1.0'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(product.status)}>
                  {product.status || '已发布'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="作用类型">
                <Tag color={product.action_type === 'DA' ? 'cyan' : 'orange'}>
                  {product.action_type === 'DA' ? '双作用(DA)' : '弹簧复位(SR)'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="本体尺寸">
                {product.body_size}
              </Descriptions.Item>
              <Descriptions.Item label="定价模式">
                <Tag color={product.pricing_model === 'fixed' ? 'green' : 'purple'}>
                  {product.pricing_model === 'fixed' ? '固定价格' : '阶梯价格'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="基础价格">
                {product.base_price ? `¥${product.base_price.toLocaleString()}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="发布日期">
                {product.release_date ? dayjs(product.release_date).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="停产日期">
                {product.discontinue_date ? dayjs(product.discontinue_date).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="库存状态">
                <Tag color={product.stock_info?.available ? 'success' : 'warning'}>
                  {product.stock_info?.available ? '有货' : `${product.stock_info?.lead_time || 0}天`}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="激活状态">
                <Tag color={product.is_active ? 'success' : 'default'}>
                  {product.is_active ? '激活' : '未激活'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {product.version_notes && (
              <>
                <Divider>版本说明</Divider>
                <Card size="small" style={{ background: '#f5f5f5' }}>
                  {product.version_notes}
                </Card>
              </>
            )}

            {product.description && (
              <>
                <Divider>产品描述</Divider>
                <Card size="small" style={{ background: '#f5f5f5' }}>
                  {product.description}
                </Card>
              </>
            )}

            {/* 技术规格 */}
            {product.specifications && (
              <>
                <Divider>技术规格</Divider>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="工作压力范围">
                    {product.specifications.pressure_range?.min} - {product.specifications.pressure_range?.max} bar
                  </Descriptions.Item>
                  <Descriptions.Item label="工作温度范围">
                    {product.specifications.temperature_range?.min}°C - {product.specifications.temperature_range?.max}°C
                  </Descriptions.Item>
                  <Descriptions.Item label="旋转角度">
                    {product.specifications.rotation_angle}°
                  </Descriptions.Item>
                  <Descriptions.Item label="重量">
                    {product.specifications.weight ? `${product.specifications.weight} kg` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="接口类型">
                    {product.specifications.port_connection || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="安装标准">
                    {product.specifications.mounting_standard || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="材质-本体">
                    {product.specifications.materials?.body || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="材质-密封">
                    {product.specifications.materials?.seal || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </TabPane>

          {/* Tab 2: BOM结构 */}
          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                BOM结构
              </span>
            }
            key="2"
          >
            <Empty
              description="BOM结构功能开发中"
              style={{ padding: '60px 0' }}
            />
          </TabPane>

          {/* Tab 3: 版本历史 */}
          <TabPane
            tab={
              <span>
                <BranchesOutlined />
                版本历史
                <Badge
                  count={versionHistory.length}
                  style={{ backgroundColor: '#1890ff', marginLeft: 8 }}
                />
              </span>
            }
            key="3"
          >
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => message.info('创建新版本功能开发中')}
              >
                创建新版本
              </Button>
            </div>
            
            {versionHistory.length > 0 ? (
              <Table
                columns={versionColumns}
                dataSource={versionHistory}
                rowKey="_id"
                pagination={false}
              />
            ) : (
              <Empty description="暂无版本历史" />
            )}

            {/* 版本时间线 */}
            {versionHistory.length > 0 && (
              <>
                <Divider>版本演进时间线</Divider>
                <Timeline mode="left">
                  {versionHistory.map((version) => (
                    <Timeline.Item
                      key={version._id}
                      color={version.status === '已发布' ? 'green' : 'blue'}
                      label={version.release_date ? dayjs(version.release_date).format('YYYY-MM-DD') : '未发布'}
                    >
                      <p>
                        <strong>{version.version}</strong>
                        <Tag color={getStatusColor(version.status)} style={{ marginLeft: 8 }}>
                          {version.status}
                        </Tag>
                      </p>
                      {version.version_notes && <p>{version.version_notes}</p>}
                    </Timeline.Item>
                  ))}
                </Timeline>
              </>
            )}
          </TabPane>

          {/* Tab 4: 工程变更记录(ECOs) */}
          <TabPane
            tab={
              <span>
                <EditOutlined />
                工程变更记录
                <Badge
                  count={ecos.length}
                  style={{ backgroundColor: '#f5222d', marginLeft: 8 }}
                />
              </span>
            }
            key="4"
          >
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setEcoModalVisible(true)}
              >
                发起变更
              </Button>
            </div>

            {ecos.length > 0 ? (
              <Table
                columns={ecoColumns}
                dataSource={ecos}
                rowKey="_id"
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `共 ${total} 条ECO记录`
                }}
              />
            ) : (
              <Empty description="暂无工程变更记录" />
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* 创建ECO Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#1890ff' }} />
            <span>发起工程变更</span>
          </Space>
        }
        open={ecoModalVisible}
        onCancel={() => {
          setEcoModalVisible(false)
          ecoForm.resetFields()
        }}
        onOk={() => ecoForm.submit()}
        confirmLoading={creatingEco}
        okText="创建ECO"
        cancelText="取消"
        width={800}
      >
        <Form
          form={ecoForm}
          layout="vertical"
          onFinish={handleCreateEco}
        >
          <Form.Item
            name="title"
            label="ECO标题"
            rules={[{ required: true, message: '请输入ECO标题' }]}
          >
            <Input placeholder="简要描述本次变更" />
          </Form.Item>

          <Form.Item
            name="change_type"
            label="变更类型"
            rules={[{ required: true, message: '请选择变更类型' }]}
          >
            <Select placeholder="选择变更类型">
              <Select.Option value="设计变更">设计变更</Select.Option>
              <Select.Option value="纠正措施">纠正措施</Select.Option>
              <Select.Option value="性能优化">性能优化</Select.Option>
              <Select.Option value="成本优化">成本优化</Select.Option>
              <Select.Option value="材料替换">材料替换</Select.Option>
              <Select.Option value="工艺改进">工艺改进</Select.Option>
              <Select.Option value="安全改进">安全改进</Select.Option>
              <Select.Option value="客户要求">客户要求</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
            initialValue="中"
          >
            <Select>
              <Select.Option value="低">低</Select.Option>
              <Select.Option value="中">中</Select.Option>
              <Select.Option value="高">高</Select.Option>
              <Select.Option value="紧急">紧急</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="new_version"
            label="新版本号"
            rules={[{ required: true, message: '请输入新版本号' }]}
          >
            <Input placeholder="例如: 2.0" />
          </Form.Item>

          <Form.Item
            name="description"
            label="变更描述"
            rules={[{ required: true, message: '请输入变更描述' }]}
          >
            <TextArea rows={4} placeholder="详细描述本次变更的内容" />
          </Form.Item>

          <Form.Item
            name="reason"
            label="变更原因"
            rules={[{ required: true, message: '请输入变更原因' }]}
          >
            <TextArea rows={3} placeholder="说明为什么需要进行这次变更" />
          </Form.Item>
        </Form>

        <Card
          title="当前产品信息"
          size="small"
          style={{ marginTop: 16, background: '#f5f5f5' }}
        >
          <Space direction="vertical">
            <div><strong>型号:</strong> {product.model_base}</div>
            <div><strong>当前版本:</strong> {product.version}</div>
            <div><strong>状态:</strong> <Tag color={getStatusColor(product.status)}>{product.status}</Tag></div>
          </Space>
        </Card>
      </Modal>
    </div>
  )
}

export default ProductDetails

