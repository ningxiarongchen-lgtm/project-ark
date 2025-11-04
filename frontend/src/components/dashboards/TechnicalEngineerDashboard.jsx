/**
 * TechnicalEngineerDashboard - 技术工程师仪表盘
 * 
 * 显示技术选型任务和售后工单
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, List, Tag, Space, Typography,
  Empty, Spin, message, Table, Badge, Divider, Alert, Tabs
} from 'antd'
import { 
  CustomerServiceOutlined, CheckCircleOutlined, ClockCircleOutlined,
  WarningOutlined, RocketOutlined, EyeOutlined, CheckOutlined,
  ProjectOutlined, FileSearchOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { ticketsAPI } from '../../services/api'
import axios from 'axios'
import dayjs from 'dayjs'
import GreetingWidget from './GreetingWidget'

const { Title, Text } = Typography
const { TabPane } = Tabs

const TechnicalEngineerDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [myProjects, setMyProjects] = useState([])
  const [myTickets, setMyTickets] = useState([])
  const [stats, setStats] = useState({
    pendingProjects: 0,      // 待我选型的项目
    completedProjects: 0,    // 我已完成选型的项目
    pendingTickets: 0,       // 待我处理的售后工单
    completedTickets: 0      // 我已完成的售后工单
  })
  const [acceptingTicket, setAcceptingTicket] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  // 获取项目和售后工单数据
  const fetchData = async () => {
    setLoading(true)
    try {
      const [projectStats, ticketStats] = await Promise.all([
        fetchMyProjects(),
        fetchMyTickets()
      ])
      
      // 合并统计数据
      setStats({
        pendingProjects: projectStats?.pendingProjects || 0,
        completedProjects: projectStats?.completedProjects || 0,
        pendingTickets: ticketStats?.pendingTickets || 0,
        completedTickets: ticketStats?.completedTickets || 0
      })
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取分配给我的技术选型项目
  const fetchMyProjects = async () => {
    try {
      const response = await axios.get('/api/projects', {
        params: {
          sortBy: '-createdAt',
          limit: 1000  // 增加limit以获取所有项目
        }
      })

      // 后端已经根据用户角色自动过滤了项目，不需要前端再过滤
      const myProjects = response.data.data || []
      
      console.log('📊 技术工程师项目数据:', {
        总项目数: myProjects.length,
        用户ID: user._id,
        用户名: user.full_name || user.phone,
        项目列表: myProjects.map(p => ({
          项目名: p.project_name,
          状态: p.project_status || p.status,
          技术负责人: p.technical_support
        }))
      })

      setMyProjects(myProjects)

      // 计算项目统计
      // 待选型：选型中、待选型、待指派技术等状态
      const pendingStatuses = ['选型中', '待选型', '待指派技术', '选型进行中']
      // 已完成：待商务报价、已报价、已确认等后续状态
      const completedStatuses = ['待商务报价', '已报价', '已确认', '已完成', 'Won', 'Lost']

      const pendingCount = myProjects.filter(p => 
        pendingStatuses.includes(p.project_status) || 
        pendingStatuses.includes(p.status)
      ).length
      
      const completedCount = myProjects.filter(p => 
        completedStatuses.includes(p.project_status) || 
        completedStatuses.includes(p.status)
      ).length

      console.log('📊 项目统计结果:', {
        待选型: pendingCount,
        已完成: completedCount
      })

      return {
        pendingProjects: pendingCount,
        completedProjects: completedCount
      }
    } catch (error) {
      console.error('获取项目数据失败:', error)
      message.error('获取项目数据失败: ' + (error.response?.data?.message || error.message))
      return { pendingProjects: 0, completedProjects: 0 }
    }
  }

  // 获取我的售后工单
  const fetchMyTickets = async () => {
    try {
      const response = await axios.get('/api/tickets', {
        params: {
          assignedEngineer: user._id,
          sortBy: '-createdAt'
        }
      })

      const tickets = response.data.data || []
      setMyTickets(tickets)

      console.log('🎫 技术工程师售后工单数据:', {
        工单总数: tickets.length,
        用户ID: user._id,
        工单列表: tickets.map(t => ({
          工单标题: t.title,
          状态: t.status,
          指派工程师: t.assignedEngineer
        }))
      })

      // 计算售后工单统计
      // 待处理：待技术受理、技术处理中、等待客户反馈
      const pendingStatuses = ['待技术受理', '技术处理中', '等待客户反馈', 'In Progress']
      // 已完成：问题已解决-待确认、已关闭
      const completedStatuses = ['问题已解决-待确认', '已关闭', 'Resolved', 'Closed']

      const pendingCount = tickets.filter(t => pendingStatuses.includes(t.status)).length
      const completedCount = tickets.filter(t => completedStatuses.includes(t.status)).length

      console.log('🎫 售后工单统计结果:', {
        待处理: pendingCount,
        已完成: completedCount
      })

      return {
        pendingTickets: pendingCount,
        completedTickets: completedCount
      }
    } catch (error) {
      console.error('获取售后工单失败:', error)
      message.error('获取售后工单失败: ' + (error.response?.data?.message || error.message))
      return { pendingTickets: 0, completedTickets: 0 }
    }
  }

  // 接受任务（将"待技术受理"状态更新为"技术处理中"）
  const handleAcceptTicket = async (ticketId) => {
    setAcceptingTicket(ticketId)
    try {
      await axios.patch(`/api/tickets/${ticketId}/accept`)
      message.success('任务已接受，开始处理')
      fetchMyTickets() // 刷新列表
    } catch (error) {
      console.error('接受任务失败:', error)
      message.error('接受任务失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setAcceptingTicket(null)
    }
  }

  // 获取状态显示配置
  const getStatusConfig = (status) => {
    const statusMap = {
      '待技术受理': { color: 'default', text: '待受理' },
      '技术处理中': { color: 'processing', text: '处理中' },
      'In Progress': { color: 'processing', text: '处理中' },
      '等待客户反馈': { color: 'warning', text: '等待反馈' },
      '问题已解决-待确认': { color: 'success', text: '已解决-待确认' },
      'Resolved': { color: 'success', text: '已解决' }
    }
    return statusMap[status] || { color: 'default', text: status }
  }

  // 获取优先级配置
  const getPriorityConfig = (priority) => {
    const priorityMap = {
      '低': { color: 'default', text: '低' },
      '正常': { color: 'blue', text: '正常' },
      '高': { color: 'orange', text: '高' },
      '紧急': { color: 'red', text: '紧急' },
      '危急': { color: 'magenta', text: '危急' },
      'Low': { color: 'default', text: '低' },
      'Normal': { color: 'blue', text: '正常' },
      'High': { color: 'orange', text: '高' },
      'Urgent': { color: 'red', text: '紧急' },
      'Critical': { color: 'magenta', text: '危急' }
    }
    return priorityMap[priority] || { color: 'default', text: priority }
  }

  // 工单列表表格列定义
  const columns = [
    {
      title: '工单号',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      width: 150,
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/service-center/${record._id}`)}
          style={{ padding: 0, fontWeight: 'bold' }}
        >
          {text || record.ticketNumber}
        </Button>
      )
    },
    {
      title: '问题标题',
      key: 'title',
      width: 250,
      ellipsis: true,
      render: (_, record) => record.title || record.issue?.title || '-'
    },
    {
      title: '客户',
      key: 'client',
      width: 150,
      render: (_, record) => record.client_name || record.customer?.name || '-'
    },
    {
      title: '服务类型',
      key: 'service_type',
      width: 100,
      render: (_, record) => (
        <Tag color="blue">{record.service_type || record.ticketType || '-'}</Tag>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority) => {
        const config = getPriorityConfig(priority)
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => {
        const config = getStatusConfig(status)
        return <Tag color={config.color}>{config.text}</Tag>
      }
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
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {(record.status === '待技术受理') && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleAcceptTicket(record._id)}
              loading={acceptingTicket === record._id}
              style={{
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                border: 'none'
              }}
            >
              接受任务
            </Button>
          )}
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/service-center/${record._id}`)}
          >
            查看详情
          </Button>
        </Space>
      )
    }
  ]

  // 项目列表表格列定义
  const projectColumns = [
    {
      title: '项目编号',
      dataIndex: 'projectNumber',
      key: 'projectNumber',
      width: 150,
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/projects/${record._id}`)}
          style={{ padding: 0, fontWeight: 'bold' }}
        >
          {text || record.project_number}
        </Button>
      )
    },
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      ellipsis: true,
      render: (text, record) => text || record.project_name
    },
    {
      title: '客户',
      key: 'client',
      width: 150,
      render: (_, record) => record.client?.name || record.client_name || '-'
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const status = record.project_status || record.status
        const statusColors = {
          '选型中': 'processing',
          '选型进行中': 'processing',
          '待商务报价': 'success',
          '已报价': 'success',
          '已确认': 'default'
        }
        return <Tag color={statusColors[status] || 'default'}>{status}</Tag>
      }
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
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/projects/${record._id}`)}
        >
          查看
        </Button>
      )
    }
  ]

  return (
    <Spin spinning={loading}>
      <div>
        {/* 动态问候语 */}
        <GreetingWidget />

        {/* 提示信息 */}
        {(stats.pendingProjects > 0 || stats.pendingTickets > 0) && (
          <Alert
            message={
              `您有 ${stats.pendingProjects} 个项目待选型` +
              (stats.pendingTickets > 0 ? `，${stats.pendingTickets} 个售后工单待处理` : '')
            }
            description="请及时处理您的任务"
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 24 }}
            closable
          />
        )}

        {/* 工作统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="待我选型的项目"
                value={stats.pendingProjects}
                prefix={<ProjectOutlined />}
                suffix="个"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="我已完成选型的项目"
                value={stats.completedProjects}
                prefix={<CheckCircleOutlined />}
                suffix="个"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="待我处理的售后工单"
                value={stats.pendingTickets}
                prefix={<ClockCircleOutlined />}
                suffix="个"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="我已完成的售后工单"
                value={stats.completedTickets}
                prefix={<CustomerServiceOutlined />}
                suffix="个"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 我的任务列表 - 分Tab显示项目和售后工单 */}
        <Card
          title={
            <Space>
              <FileSearchOutlined />
              <span style={{ fontSize: 16, fontWeight: 'bold' }}>我的任务</span>
              <Badge 
                count={myProjects.length + myTickets.length} 
                style={{ backgroundColor: '#1890ff' }} 
              />
            </Space>
          }
        >
          <Tabs defaultActiveKey="projects" type="card">
            <TabPane
              tab={
                <span>
                  <ProjectOutlined />
                  技术选型项目 ({myProjects.length})
                </span>
              }
              key="projects"
            >
              {myProjects.length === 0 ? (
                <Empty 
                  description="暂无分配给您的选型项目"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Table
                  columns={projectColumns}
                  dataSource={myProjects}
                  rowKey="_id"
                  pagination={{
                    pageSize: 10,
                    showTotal: (total) => `共 ${total} 个项目`,
                    showSizeChanger: true,
                    showQuickJumper: true
                  }}
                  scroll={{ x: 1000 }}
                />
              )}
            </TabPane>

            <TabPane
              tab={
                <span>
                  <CustomerServiceOutlined />
                  售后工单 ({myTickets.length})
                </span>
              }
              key="tickets"
            >
              {myTickets.length === 0 ? (
                <Empty 
                  description="暂无分配给您的售后工单"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Table
                  columns={columns}
                  dataSource={myTickets}
                  rowKey="_id"
                  pagination={{
                    pageSize: 10,
                    showTotal: (total) => `共 ${total} 个工单`,
                    showSizeChanger: true,
                    showQuickJumper: true
                  }}
                  scroll={{ x: 1200 }}
                  rowClassName={(record) => {
                    if (record.status === '待技术受理') return 'pending-row'
                    if (record.priority === '紧急' || record.priority === 'Urgent') return 'urgent-row'
                    return ''
                  }}
                />
              )}
            </TabPane>
          </Tabs>
        </Card>
      </div>

      <style jsx="true">{`
        .pending-row {
          background-color: #fffbe6;
        }
        .urgent-row {
          background-color: #fff1f0;
        }
        .pending-row:hover,
        .urgent-row:hover {
          background-color: #fafafa !important;
        }
      `}</style>
    </Spin>
  )
}

export default TechnicalEngineerDashboard

