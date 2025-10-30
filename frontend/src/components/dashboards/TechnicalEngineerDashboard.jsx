/**
 * TechnicalEngineerDashboard - 技术工程师仪表盘
 * 
 * 显示售后任务、工单处理等
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Row, Col, Card, Statistic, Button, List, Tag, Space, Typography,
  Empty, Spin, message, Table, Badge, Divider, Alert
} from 'antd'
import { 
  CustomerServiceOutlined, CheckCircleOutlined, ClockCircleOutlined,
  WarningOutlined, RocketOutlined, EyeOutlined, CheckOutlined
} from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { ticketsAPI } from '../../services/api'
import axios from 'axios'
import dayjs from 'dayjs'
import GreetingWidget from './GreetingWidget'

const { Title, Text } = Typography

const TechnicalEngineerDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [myTickets, setMyTickets] = useState([])
  const [stats, setStats] = useState({
    pending: 0,        // 待技术受理
    inProgress: 0,     // 技术处理中
    waitingFeedback: 0, // 等待客户反馈
    resolved: 0        // 问题已解决-待确认
  })
  const [acceptingTicket, setAcceptingTicket] = useState(null)

  useEffect(() => {
    fetchMyTickets()
  }, [])

  // 获取我的售后工单（只显示分配给我且未关闭的）
  const fetchMyTickets = async () => {
    setLoading(true)
    try {
      // 获取分配给当前用户的所有工单
      const response = await axios.get('/api/tickets', {
        params: {
          assignedEngineer: user.id || user._id,
          sortBy: '-createdAt'
        }
      })

      const tickets = response.data.data || []
      
      // 过滤掉已关闭的工单
      const activeTickets = tickets.filter(
        ticket => ticket.status !== '已关闭' && ticket.status !== 'Closed'
      )

      setMyTickets(activeTickets)

      // 计算统计数据
      const newStats = {
        pending: activeTickets.filter(t => t.status === '待技术受理').length,
        inProgress: activeTickets.filter(t => t.status === '技术处理中' || t.status === 'In Progress').length,
        waitingFeedback: activeTickets.filter(t => t.status === '等待客户反馈').length,
        resolved: activeTickets.filter(t => t.status === '问题已解决-待确认' || t.status === 'Resolved').length
      }
      setStats(newStats)

    } catch (error) {
      console.error('获取售后工单失败:', error)
      message.error('获取售后工单失败')
    } finally {
      setLoading(false)
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

  return (
    <Spin spinning={loading}>
      <div>
        {/* 动态问候语 */}
        <GreetingWidget />

        {/* 提示信息 */}
        {stats.pending > 0 && (
          <Alert
            message={`您有 ${stats.pending} 个新的售后工单等待受理`}
            description="请及时查看并接受任务，确保及时为客户提供服务"
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
                title="待技术受理"
                value={stats.pending}
                prefix={<ClockCircleOutlined />}
                suffix="个"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="技术处理中"
                value={stats.inProgress}
                prefix={<RocketOutlined />}
                suffix="个"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="等待客户反馈"
                value={stats.waitingFeedback}
                prefix={<CustomerServiceOutlined />}
                suffix="个"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="已解决-待确认"
                value={stats.resolved}
                prefix={<CheckCircleOutlined />}
                suffix="个"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 我的售后任务列表 */}
        <Card
          title={
            <Space>
              <CustomerServiceOutlined />
              <span style={{ fontSize: 16, fontWeight: 'bold' }}>我的售后任务</span>
              <Badge count={myTickets.length} style={{ backgroundColor: '#1890ff' }} />
            </Space>
          }
          extra={
            <Button
              type="primary"
              onClick={() => navigate('/service-center')}
            >
              查看全部工单
            </Button>
          }
        >
          {myTickets.length === 0 ? (
            <Empty 
              description="暂无分配给您的售后工单"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <>
              <Divider orientation="left">工单列表</Divider>
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
            </>
          )}
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

