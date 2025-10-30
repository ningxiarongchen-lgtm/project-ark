import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Button, 
  Space, 
  Spin, 
  message, 
  Typography, 
  List, 
  Avatar,
  Tag,
  Divider,
} from 'antd'
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  SettingOutlined,
  UserOutlined,
  FolderOutlined,
} from '@ant-design/icons'
import {
  AttioPanelGroup,
  AttioPanel,
  AttioResizeHandle,
  AttioCard,
  AttioButton,
  AttioTable,
  AttioTag,
  AttioContextMenu,
  commonContextMenuItems,
} from '../components'
import { projectsAPI } from '../services/api'
import { colors } from '../styles/theme'

const { Title, Text, Paragraph } = Typography

/**
 * ProjectDetailsAttio - Attio-style three-column layout
 * 
 * Layout:
 * - Left Panel: Project list / navigation tree
 * - Middle Panel: Main content (BOM table)
 * - Right Panel: Details / collaboration (tasks, files)
 */

const ProjectDetailsAttio = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch project data
  useEffect(() => {
    fetchProject()
  }, [id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const res = await projectsAPI.getProject(id)
      setProject(res.data)
    } catch (error) {
      message.error('加载项目失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    )
  }

  // BOM table columns
  const bomColumns = [
    {
      title: '项目编号',
      dataIndex: 'itemNo',
      key: 'itemNo',
      width: 100,
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <AttioTag color={status === '已完成' ? 'success' : 'warning'}>
          {status}
        </AttioTag>
      ),
    },
  ]

  // Mock BOM data
  const bomData = project?.bom_list?.length > 0 
    ? project.bom_list.map((item, index) => ({
        key: index,
        itemNo: `${index + 1}`,
        productName: item.product_name || '执行器',
        specification: item.specification || 'DN50',
        quantity: item.quantity || 1,
        status: '待处理',
      }))
    : []

  // Context menu items
  const getContextMenuItems = (record) => [
    commonContextMenuItems.edit(() => message.info(`编辑 ${record.productName}`)),
    commonContextMenuItems.copy(() => message.info('已复制')),
    commonContextMenuItems.divider(),
    commonContextMenuItems.delete(() => message.warning(`删除 ${record.productName}`)),
  ]

  return (
    <div style={{ height: 'calc(100vh - 112px)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        background: colors.background.primary,
        borderBottom: `1px solid ${colors.border.light}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Space>
          <AttioButton 
            variant="ghost" 
            onClick={() => navigate('/projects')}
            icon={<ArrowLeftOutlined />}
          >
            返回
          </AttioButton>
          <Divider type="vertical" />
          <Title level={4} style={{ margin: 0 }}>
            {project?.project_name || '项目详情'}
          </Title>
          <AttioTag color="primary">{project?.status || '进行中'}</AttioTag>
        </Space>
        <Space>
          <AttioButton variant="secondary" icon={<EditOutlined />}>
            编辑
          </AttioButton>
          <AttioButton variant="primary" icon={<PlusOutlined />}>
            新建任务
          </AttioButton>
        </Space>
      </div>

      {/* Three-Column Layout */}
      <AttioPanelGroup direction="horizontal">
        {/* Left Panel - Project Navigation */}
        <AttioPanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="attio-panel-content attio-panel-left">
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 12, color: colors.text.secondary }}>
                项目导航
              </Text>
            </div>
            
            <List
              size="small"
              dataSource={[
                { icon: <FileTextOutlined />, title: '项目概述', active: true },
                { icon: <FolderOutlined />, title: 'BOM 清单', active: false },
                { icon: <UserOutlined />, title: '团队成员', active: false },
                { icon: <SettingOutlined />, title: '项目设置', active: false },
              ]}
              renderItem={item => (
                <List.Item
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderRadius: 6,
                    background: item.active ? colors.primary[50] : 'transparent',
                    color: item.active ? colors.primary.main : colors.text.secondary,
                    marginBottom: 4,
                    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.background = colors.background.tertiary
                      e.currentTarget.style.color = colors.text.primary
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = colors.text.secondary
                    }
                  }}
                >
                  <Space>
                    {item.icon}
                    <span>{item.title}</span>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        </AttioPanel>

        <AttioResizeHandle />

        {/* Middle Panel - Main Content (BOM Table) */}
        <AttioPanel defaultSize={50} minSize={40}>
          <div className="attio-panel-content attio-panel-middle">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={5} style={{ margin: 0 }}>BOM 清单</Title>
              <Space>
                <AttioButton variant="secondary" size="small">
                  导出
                </AttioButton>
                <AttioButton variant="primary" size="small" icon={<PlusOutlined />}>
                  添加项目
                </AttioButton>
              </Space>
            </div>

            {/* BOM Table with Context Menu */}
            <AttioTable
              columns={bomColumns}
              dataSource={bomData}
              pagination={{ pageSize: 10 }}
              rowKey="key"
              components={{
                body: {
                  row: (props) => (
                    <AttioContextMenu items={getContextMenuItems(props['data-row-key'])}>
                      <tr {...props} />
                    </AttioContextMenu>
                  ),
                },
              }}
            />
          </div>
        </AttioPanel>

        <AttioResizeHandle />

        {/* Right Panel - Details / Collaboration */}
        <AttioPanel defaultSize={30} minSize={25} maxSize={40}>
          <div className="attio-panel-content attio-panel-right">
            {/* Project Info Card */}
            <AttioCard 
              title="项目信息" 
              padding="compact"
              style={{ marginBottom: 16 }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <div>
                  <Text strong style={{ fontSize: 12, color: colors.text.secondary }}>
                    项目编号
                  </Text>
                  <br />
                  <Text>{project?.project_number || '-'}</Text>
                </div>
                <div>
                  <Text strong style={{ fontSize: 12, color: colors.text.secondary }}>
                    客户名称
                  </Text>
                  <br />
                  <Text>{project?.customer_name || '-'}</Text>
                </div>
                <div>
                  <Text strong style={{ fontSize: 12, color: colors.text.secondary }}>
                    创建时间
                  </Text>
                  <br />
                  <Text>{project?.created_at ? new Date(project.created_at).toLocaleDateString() : '-'}</Text>
                </div>
              </Space>
            </AttioCard>

            {/* Tasks Card */}
            <AttioCard title="任务列表" padding="compact" style={{ marginBottom: 16 }}>
              <List
                size="small"
                dataSource={[
                  { title: '完成技术评审', done: true },
                  { title: '生成报价单', done: true },
                  { title: '等待客户确认', done: false },
                  { title: '签订合同', done: false },
                ]}
                renderItem={item => (
                  <List.Item
                    style={{
                      padding: '8px 0',
                      borderBottom: 'none',
                    }}
                  >
                    <Space>
                      {item.done ? (
                        <span style={{ color: colors.success.main }}>✓</span>
                      ) : (
                        <span style={{ color: colors.text.tertiary }}>○</span>
                      )}
                      <Text style={{ 
                        textDecoration: item.done ? 'line-through' : 'none',
                        color: item.done ? colors.text.secondary : colors.text.primary,
                      }}>
                        {item.title}
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            </AttioCard>

            {/* Files Card */}
            <AttioCard title="文件列表" padding="compact">
              <List
                size="small"
                dataSource={[
                  { name: '技术规格书.pdf', size: '2.3 MB' },
                  { name: '报价单.xlsx', size: '156 KB' },
                ]}
                renderItem={item => (
                  <List.Item
                    style={{
                      padding: '8px 0',
                      borderBottom: 'none',
                    }}
                  >
                    <Space>
                      <FileTextOutlined style={{ color: colors.text.secondary }} />
                      <div>
                        <Text>{item.name}</Text>
                        <br />
                        <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                          {item.size}
                        </Text>
                      </div>
                    </Space>
                  </List.Item>
                )}
              />
            </AttioCard>
          </div>
        </AttioPanel>
      </AttioPanelGroup>
    </div>
  )
}

export default ProjectDetailsAttio

