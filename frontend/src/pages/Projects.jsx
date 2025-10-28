import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Table, Button, Input, Space, Card, Modal, Form, 
  message, Popconfirm, Tag, Typography 
} from 'antd'
import { 
  PlusOutlined, SearchOutlined, EditOutlined, 
  DeleteOutlined, FolderOpenOutlined, ReloadOutlined 
} from '@ant-design/icons'
import { projectsAPI } from '../services/api'
import dayjs from 'dayjs'

const { Title } = Typography
const { Search } = Input

const Projects = () => {
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [searchText, setSearchText] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [form] = Form.useForm()
  const navigate = useNavigate()

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
      setProjects(response.data || [])
      setFilteredProjects(response.data || [])
    } catch (error) {
      message.error('获取项目列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingProject(null)
    form.resetFields()
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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              新建项目
            </Button>
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
        </Form>
      </Modal>
    </div>
  )
}

export default Projects
