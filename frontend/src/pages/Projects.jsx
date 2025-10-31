import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Table, Button, Input, Space, Card, Modal, Form, 
  message, Popconfirm, Tag, Typography, InputNumber,
  Row, Col, Statistic
} from 'antd'
import { 
  PlusOutlined, SearchOutlined, EditOutlined, 
  DeleteOutlined, FolderOpenOutlined, ReloadOutlined,
  InboxOutlined, ProjectOutlined, DollarOutlined,
  CustomerServiceOutlined, FileTextOutlined, ToolOutlined
} from '@ant-design/icons'
import { projectsAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import CloudUpload from '../components/CloudUpload'
import dayjs from 'dayjs'

const { Title } = Typography
const { Search } = Input

const Projects = () => {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [searchText, setSearchText] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const navigate = useNavigate()
  
  // 统计数据
  const [stats, setStats] = useState({
    totalProjects: 0,
    pendingQuotation: 0,
    pendingDownPayment: 0,
    pendingProductionOrder: 0,
    pendingFinalPayment: 0,
    totalQuotes: 0,
    totalTickets: 0
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    // 搜索过滤
    if (searchText) {
      const filtered = projects.filter(project => 
        project.project_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        project.client_name?.toLowerCase().includes(searchText.toLowerCase())
      )
      setFilteredProjects(filtered)
    } else {
      setFilteredProjects(projects)
    }
  }, [searchText, projects])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await projectsAPI.getAll()
      // 修复：后端返回 { success: true, data: [...] }
      const projectsData = response.data?.data || []
      setProjects(projectsData)
      setFilteredProjects(projectsData)
      
      // 计算统计数据
      const totalProjects = projectsData.length
      
      // 商务工程师专属统计
      const pendingQuotation = projectsData.filter(p => 
        p.status === '待商务报价'
      ).length
      
      const pendingDownPayment = projectsData.filter(p => 
        p.status === '待预付款'
      ).length
      
      const pendingProductionOrder = projectsData.filter(p => 
        p.status === '生产准备中'
      ).length
      
      const pendingFinalPayment = projectsData.filter(p => 
        p.status === '生产中'
      ).length
      
      // 其他角色统计
      const totalQuotes = projectsData.filter(p => 
        p.status === '已报价' || p.status === '待商务报价'
      ).length
      
      const totalTickets = projectsData.filter(p => 
        p.service_tickets && p.service_tickets.length > 0
      ).length
      
      setStats({
        totalProjects,
        pendingQuotation,
        pendingDownPayment,
        pendingProductionOrder,
        pendingFinalPayment,
        totalQuotes,
        totalTickets
      })
    } catch (error) {
      message.error('获取项目列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingProject(null)
    form.resetFields()
    setFileList([])
    setUploadedFiles([])
    setIsModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingProject(record)
    form.setFieldsValue(record)
    setIsModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await projectsAPI.delete(id)
      message.success('删除成功')
      fetchProjects()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      // Add uploaded files to project data
      if (uploadedFiles.length > 0) {
        values.project_files = uploadedFiles.map(file => ({
          file_name: file.name,
          file_url: file.url,
          objectId: file.objectId
        }))
      }
      
      if (editingProject) {
        // 更新项目
        await projectsAPI.update(editingProject._id, values)
        message.success('更新成功')
      } else {
        // 创建项目
        await projectsAPI.create(values)
        message.success('创建成功')
      }
      
      setIsModalVisible(false)
      form.resetFields()
      setFileList([])
      setUploadedFiles([])
      fetchProjects()
    } catch (error) {
      if (error.errorFields) {
        // 表单验证错误
        return
      }
      message.error(editingProject ? '更新失败' : '创建失败')
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
    setEditingProject(null)
    setFileList([])
    setUploadedFiles([])
  }

  const handleFileUploadSuccess = (fileData) => {
    setUploadedFiles(prev => [...prev, fileData])
  }

  const handleFileRemove = (file) => {
    setUploadedFiles(prev => prev.filter(f => f.objectId !== file.response?.objectId))
  }

  const handleViewProject = (record) => {
    // 跳转到选型工作区
    navigate(`/selection-engine?projectId=${record._id}`)
  }

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text, record) => (
        <Button 
          type="link" 
          icon={<FolderOpenOutlined />}
          onClick={() => handleViewProject(record)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '客户名称',
      dataIndex: 'client_name',
      key: 'client_name',
      render: (text) => text || '-',
    },
    {
      title: '选型数量',
      dataIndex: 'selections',
      key: 'selections_count',
      render: (selections) => (
        <Tag color="blue">{selections?.length || 0} 个</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<FolderOpenOutlined />}
            onClick={() => handleViewProject(record)}
          >
            打开
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个项目吗？"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 🚨 测试标识：确认新代码已加载 */}
      {user?.role === 'Business Engineer' && (
        <div style={{
          background: '#52c41a',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '4px',
          marginBottom: '16px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          ✅ 商务工程师专属页面 v2.0 - 角色：{user?.role}
        </div>
      )}
      
      {/* 统计卡片 - 根据角色显示不同内容 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {user?.role === 'Business Engineer' ? (
          // 💼 商务工程师专属统计
          <>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="待完成报价"
                  value={stats.pendingQuotation}
                  prefix={<FileTextOutlined />}
                  suffix="个"
                  valueStyle={{ color: stats.pendingQuotation > 0 ? '#fa8c16' : '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="待催30%预付款"
                  value={stats.pendingDownPayment}
                  prefix={<DollarOutlined />}
                  suffix="个"
                  valueStyle={{ color: stats.pendingDownPayment > 0 ? '#f5222d' : '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="待下生产订单"
                  value={stats.pendingProductionOrder}
                  prefix={<ToolOutlined />}
                  suffix="个"
                  valueStyle={{ color: stats.pendingProductionOrder > 0 ? '#722ed1' : '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="待催70%尾款"
                  value={stats.pendingFinalPayment}
                  prefix={<DollarOutlined />}
                  suffix="个"
                  valueStyle={{ color: stats.pendingFinalPayment > 0 ? '#eb2f96' : '#52c41a' }}
                />
              </Card>
            </Col>
          </>
        ) : (
          // 其他角色统计
          <>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="总项目数"
                  value={stats.totalProjects}
                  prefix={<ProjectOutlined />}
                  suffix="个"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="总报价数"
                  value={stats.totalQuotes}
                  prefix={<DollarOutlined />}
                  suffix="个"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="总售后问题数"
                  value={stats.totalTickets}
                  prefix={<CustomerServiceOutlined />}
                  suffix="个"
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </>
        )}
      </Row>

      {/* 项目列表卡片 */}
      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>项目管理</Title>
          </Space>
        }
        extra={
          <Space>
            <Search
              placeholder="搜索项目或客户名称"
              allowClear
              style={{ width: 250 }}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchProjects}
            >
              刷新
            </Button>
            {/* 只有非商务工程师可以创建项目 */}
            {user?.role !== 'Business Engineer' && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                新建项目
              </Button>
            )}
          </Space>
        }
      >
        <Table
          loading={loading}
          columns={columns}
          dataSource={filteredProjects}
          rowKey="_id"
          pagination={{
            total: filteredProjects.length,
            pageSize: 10,
            showTotal: (total) => `共 ${total} 个项目`,
            showSizeChanger: true,
          }}
        />
      </Card>

      {/* 创建/编辑项目 Modal */}
      <Modal
        title={editingProject ? '编辑项目' : '新建项目'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="项目名称"
            name="project_name"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="输入项目名称" />
          </Form.Item>

          <Form.Item
            label="客户名称"
            name="client_name"
          >
            <Input placeholder="输入客户名称（可选）" />
          </Form.Item>

          <Form.Item
            label="项目预算（可选）"
            name="budget"
            tooltip="输入项目预算金额（元）"
          >
            <InputNumber
              placeholder="输入项目预算"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/¥\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            label="技术说明书/附件（可选）"
            tooltip="上传项目相关的技术文档或附件"
          >
            <CloudUpload
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              onSuccess={handleFileUploadSuccess}
              onRemove={handleFileRemove}
              folder="project_files"
              multiple
            >
              <div style={{ 
                padding: '20px', 
                border: '1px dashed #d9d9d9', 
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'center'
              }}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                <p className="ant-upload-hint" style={{ color: '#999' }}>
                  支持单个或批量上传技术说明书、需求文档等附件
                </p>
              </div>
            </CloudUpload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Projects
