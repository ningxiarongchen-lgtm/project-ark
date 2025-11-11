import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Table, Space, Button, Tag, Typography, Badge, Tabs,
  Input, Select, DatePicker, Row, Col, Statistic, Alert, Divider,
  Tooltip, Modal, message, Empty, Descriptions
} from 'antd'
import {
  ThunderboltOutlined, FileTextOutlined, EyeOutlined,
  ClockCircleOutlined, CheckCircleOutlined, SearchOutlined,
  FilterOutlined, ReloadOutlined, FolderOpenOutlined,
  DownloadOutlined, TeamOutlined
} from '@ant-design/icons'
import { projectsAPI } from '../services/api'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs
const { Search } = Input
const { RangePicker } = DatePicker

/**
 * 技术工程师选型工作台
 * 专为技术工程师设计的高效选型界面
 */
const TechnicianWorkbench = () => {
  const navigate = useNavigate()
  
  // 状态管理
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending') // pending, in-progress, completed
  const [showTechModal, setShowTechModal] = useState(false)
  
  // 统计数据
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [projects, searchText, statusFilter])

  // 获取项目列表
  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await projectsAPI.getAll()
      const projectList = response.data || []
      setProjects(projectList)
      
      // 计算统计数据
      const stats = {
        total: projectList.length,
        pending: projectList.filter(p => p.status === '技术评审').length,
        inProgress: projectList.filter(p => p.status === '选型中' || p.status === '方案设计').length,
        completed: projectList.filter(p => p.status === '已报价' || p.status === '合同签订').length
      }
      setStatistics(stats)
    } catch (error) {
      message.error('获取项目列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 应用筛选
  const applyFilters = () => {
    let filtered = [...projects]

    // 搜索过滤
    if (searchText) {
      filtered = filtered.filter(p =>
        p.projectName?.toLowerCase().includes(searchText.toLowerCase()) ||
        p.projectNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
        p.client?.name?.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    // 状态过滤
    if (statusFilter === 'pending') {
      filtered = filtered.filter(p => p.status === '技术评审')
    } else if (statusFilter === 'in-progress') {
      filtered = filtered.filter(p => p.status === '选型中' || p.status === '方案设计')
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter(p => p.status === '已报价' || p.status === '合同签订')
    }

    // 按创建时间降序排列
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    setFilteredProjects(filtered)
  }

  // 查看技术需求文档
  const handleViewTechDoc = (project) => {
    setSelectedProject(project)
    setShowTechModal(true)
  }

  // 开始选型
  const handleStartSelection = (project) => {
    navigate(`/selection-engine?projectId=${project._id}`)
  }

  // 批量选型
  const handleBatchSelection = (project) => {
    navigate(`/batch-selection?projectId=${project._id}`)
  }

  // 项目状态标签
  const getStatusTag = (status) => {
    const statusMap = {
      '技术评审': { color: 'gold', text: '待选型' },
      '选型中': { color: 'processing', text: '选型中' },
      '方案设计': { color: 'cyan', text: '方案设计' },
      '已报价': { color: 'success', text: '已完成' },
      '合同签订': { color: 'success', text: '已完成' }
    }
    const config = statusMap[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 优先级标签
  const getPriorityTag = (priority) => {
    const priorityMap = {
      '紧急': { color: 'red', icon: '🔥' },
      '高': { color: 'orange', icon: '⚡' },
      '中': { color: 'blue', icon: '📋' },
      '低': { color: 'default', icon: '📝' }
    }
    const config = priorityMap[priority] || priorityMap['中']
    return (
      <Tag color={config.color}>
        {config.icon} {priority}
      </Tag>
    )
  }

  // 表格列定义
  const columns = [
    {
      title: '项目信息',
      key: 'project',
      width: 300,
      fixed: 'left',
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Text strong style={{ fontSize: 15 }}>{record.projectName}</Text>
          </div>
          <Space size={[8, 4]} wrap>
            <Text type="secondary" style={{ fontSize: 12 }}>
              编号: {record.projectNumber || '-'}
            </Text>
            <Divider type="vertical" />
            <Text type="secondary" style={{ fontSize: 12 }}>
              <TeamOutlined /> {record.client?.name || '-'}
            </Text>
          </Space>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => getPriorityTag(priority)
    },
    {
      title: '技术需求',
      dataIndex: 'technical_requirements',
      key: 'technical_requirements',
      width: 250,
      ellipsis: {
        showTitle: false
      },
      render: (text) => (
        <Tooltip title={text || '暂无技术需求'}>
          <Text ellipsis style={{ width: 230, display: 'block' }}>
            {text || <Text type="secondary">暂无技术需求</Text>}
          </Text>
        </Tooltip>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="primary"
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => handleStartSelection(record)}
          >
            智能选型
          </Button>
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => handleBatchSelection(record)}
          >
            批量选型
          </Button>
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleViewTechDoc(record)}
          >
            技术文档
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/projects/${record._id}`)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          <ThunderboltOutlined /> 技术选型工作台
        </Title>
        <Paragraph type="secondary">
          高效处理项目选型任务，快速查看技术文档，一键开始智能选型
        </Paragraph>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总项目数"
              value={statistics.total}
              prefix={<FolderOpenOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待选型"
              value={statistics.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="选型中"
              value={statistics.inProgress}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={statistics.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速操作提示 */}
      <Alert
        message="💡 快速操作提示"
        description={
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li>点击"智能选型"进行单个选型</li>
            <li>点击"批量选型"上传Excel进行批量选型</li>
            <li>点击"技术文档"查看项目完整技术需求</li>
          </ul>
        }
        type="info"
        closable
        style={{ marginBottom: 24 }}
      />

      {/* 筛选和搜索 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="搜索项目名称、项目编号、客户名称..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={() => applyFilters()}
              enterButton
              size="large"
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              size="large"
            >
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="pending">
                <Badge status="warning" text="待选型" />
              </Select.Option>
              <Select.Option value="in-progress">
                <Badge status="processing" text="选型中" />
              </Select.Option>
              <Select.Option value="completed">
                <Badge status="success" text="已完成" />
              </Select.Option>
            </Select>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchProjects}
              size="large"
            >
              刷新
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 项目列表表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredProjects}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个项目`
          }}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty
                description="暂无项目"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />
      </Card>

      {/* 技术文档模态框 */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>项目技术文档</span>
          </Space>
        }
        open={showTechModal}
        onCancel={() => setShowTechModal(false)}
        width={800}
        footer={[
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={() => {
              // TODO: 实现文档下载功能
              message.info('文档下载功能开发中')
            }}
          >
            下载文档
          </Button>,
          <Button
            key="selection"
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={() => {
              setShowTechModal(false)
              handleStartSelection(selectedProject)
            }}
          >
            开始选型
          </Button>,
          <Button key="close" onClick={() => setShowTechModal(false)}>
            关闭
          </Button>
        ]}
      >
        {selectedProject && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="项目名称" span={2}>
                <Text strong>{selectedProject.projectName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="项目编号">
                {selectedProject.projectNumber || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="客户">
                {selectedProject.client?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(selectedProject.status)}
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                {getPriorityTag(selectedProject.priority)}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {dayjs(selectedProject.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">技术需求说明</Divider>
            <Card style={{ background: '#f5f5f5', marginBottom: 16 }}>
              <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                {selectedProject.technical_requirements || (
                  <Text type="secondary">暂无技术需求说明</Text>
                )}
              </Paragraph>
            </Card>

            {selectedProject.specifications && (
              <>
                <Divider orientation="left">技术规格</Divider>
                <Card style={{ background: '#f5f5f5' }}>
                  <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                    {selectedProject.specifications}
                  </Paragraph>
                </Card>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default TechnicianWorkbench
