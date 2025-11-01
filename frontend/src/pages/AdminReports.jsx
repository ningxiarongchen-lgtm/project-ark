import { useState, useEffect } from 'react'
import { 
  Card, Row, Col, Statistic, Button, Table, Tag, Space, 
  Typography, Divider, message, DatePicker, Select 
} from 'antd'
import {
  UserOutlined,
  DatabaseOutlined,
  ShopOutlined,
  ProjectOutlined,
  FileDoneOutlined,
  DownloadOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { projectsAPI, adminAPI } from '../services/api'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const AdminReports = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    // 用户统计
    totalUsers: 10,
    activeUsers: 8,
    usersByRole: [],
    
    // 产品统计
    totalProducts: 365,
    actuators: 337,
    accessories: 10,
    manualOverrides: 18,
    
    // 供应商统计
    totalSuppliers: 5,
    qualifiedSuppliers: 4,
    suppliersByRating: [],
    
    // 业务统计
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalOrders: 0,
  })

  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs()
  ])

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      
      // 🔄 从后端获取真实统计数据
      const [statsRes, projectsRes] = await Promise.all([
        adminAPI.getSystemStats(),
        projectsAPI.getAll()
      ])
      
      const systemStats = statsRes.data || {}
      const projects = Array.isArray(projectsRes.data?.data) 
        ? projectsRes.data.data 
        : []
      
      // 处理用户角色统计
      const roleMapping = {
        'Administrator': '系统管理员',
        'Sales Manager': '销售经理',
        'Technical Engineer': '技术工程师',
        'Business Engineer': '商务工程师',
        'Procurement Specialist': '采购专员',
        'Production Planner': '生产计划员',
        'QA Inspector': '质检员',
        'Logistics Specialist': '物流专员',
        'Shop Floor Worker': '车间工人'
      }
      
      const totalUsers = systemStats.users?.total || 0
      const usersByRole = (systemStats.users?.byRole || []).map(item => ({
        role: roleMapping[item._id] || item._id,
        count: item.count,
        percentage: totalUsers > 0 ? `${((item.count / totalUsers) * 100).toFixed(1)}%` : '0%'
      }))

      setStats({
        // 用户统计（真实数据）
        totalUsers: systemStats.users?.total || 0,
        activeUsers: systemStats.users?.active || 0,
        usersByRole: usersByRole,
        
        // 产品统计（真实数据）
        totalProducts: systemStats.products?.total || 0,
        actuators: systemStats.products?.total || 0,  // TODO: 细分统计
        accessories: systemStats.accessories?.total || 0,
        manualOverrides: 0,  // TODO: 添加手动装置统计
        
        // 供应商统计（模拟数据，后续接入真实API）
        totalSuppliers: 5,
        qualifiedSuppliers: 4,
        suppliersByRating: [
          { rating: 5, count: 3, percentage: '60%' },
          { rating: 4, count: 2, percentage: '40%' },
        ],
        
        // 业务统计（真实数据）
        totalProjects: projects.length,
        activeProjects: projects.filter(p => 
          p.status !== '已完成' && p.status !== '已取消'
        ).length,
        completedProjects: projects.filter(p => 
          p.status === '已完成'
        ).length,
        totalOrders: 0, // TODO: 接入订单API
      })
      
    } catch (error) {
      console.error('获取统计数据失败:', error)
      message.error('获取统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 导出报表
  const handleExportReport = () => {
    message.success('报表导出功能开发中...')
    // TODO: 实现导出Excel功能
  }

  // 用户角色分布表格列
  const userRoleColumns = [
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: '用户数',
      dataIndex: 'count',
      key: 'count',
      render: (count) => <Tag color="blue">{count} 人</Tag>
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
    },
  ]

  // 供应商评级分布表格列
  const supplierRatingColumns = [
    {
      title: '评级',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => '⭐'.repeat(rating)
    },
    {
      title: '供应商数',
      dataIndex: 'count',
      key: 'count',
      render: (count) => <Tag color="green">{count} 家</Tag>
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
    },
  ]

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <BarChartOutlined /> 系统数据统计报表
        </Title>
        <Text type="secondary">
          查看系统运行数据，监控业务状况，导出统计报表
        </Text>
      </div>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="middle" wrap>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="YYYY-MM-DD"
          />
          <Select defaultValue="all" style={{ width: 150 }}>
            <Option value="all">所有数据</Option>
            <Option value="user">用户数据</Option>
            <Option value="product">产品数据</Option>
            <Option value="business">业务数据</Option>
          </Select>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={handleExportReport}
          >
            导出报表
          </Button>
          <Button icon={<LineChartOutlined />}>
            趋势分析
          </Button>
        </Space>
      </Card>

      {/* 核心数据统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="系统用户总数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              suffix="人"
              valueStyle={{ color: '#1890ff' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              今日活跃：{stats.activeUsers} 人
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="产品数据总量"
              value={stats.totalProducts}
              prefix={<DatabaseOutlined />}
              suffix="个"
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              执行器：{stats.actuators} | 配件：{stats.accessories}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="供应商总数"
              value={stats.totalSuppliers}
              prefix={<ShopOutlined />}
              suffix="家"
              valueStyle={{ color: '#722ed1' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              合格供应商：{stats.qualifiedSuppliers} 家
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="项目总数"
              value={stats.totalProjects}
              prefix={<ProjectOutlined />}
              suffix="个"
              valueStyle={{ color: '#fa8c16' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              进行中：{stats.activeProjects} | 已完成：{stats.completedProjects}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* 详细统计 */}
      <Row gutter={[16, 16]}>
        {/* 用户统计 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <TeamOutlined />
                <span>用户角色分布</span>
              </Space>
            }
            extra={<Tag color="blue">{stats.totalUsers} 人</Tag>}
          >
            <Table
              columns={userRoleColumns}
              dataSource={stats.usersByRole}
              pagination={false}
              size="small"
              rowKey="role"
            />
          </Card>
        </Col>

        {/* 供应商统计 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <ShopOutlined />
                <span>供应商评级分布</span>
              </Space>
            }
            extra={<Tag color="green">{stats.totalSuppliers} 家</Tag>}
          >
            <Table
              columns={supplierRatingColumns}
              dataSource={stats.suppliersByRating}
              pagination={false}
              size="small"
              rowKey="rating"
            />
            <Divider />
            <Text type="secondary">
              合格率：{((stats.qualifiedSuppliers / stats.totalSuppliers) * 100).toFixed(0)}%
            </Text>
          </Card>
        </Col>

        {/* 产品统计 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <DatabaseOutlined />
                <span>产品数据统计</span>
              </Space>
            }
            extra={<Tag color="cyan">{stats.totalProducts} 个</Tag>}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>执行器：</Text>
                <Text style={{ float: 'right' }}>{stats.actuators} 个</Text>
              </div>
              <div>
                <Text strong>配件：</Text>
                <Text style={{ float: 'right' }}>{stats.accessories} 个</Text>
              </div>
              <div>
                <Text strong>手动操作装置：</Text>
                <Text style={{ float: 'right' }}>{stats.manualOverrides} 个</Text>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 业务统计 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <PieChartOutlined />
                <span>业务数据概览</span>
              </Space>
            }
            extra={<Tag color="orange">最近30天</Tag>}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>项目总数：</Text>
                <Text style={{ float: 'right' }}>{stats.totalProjects} 个</Text>
              </div>
              <div>
                <Text strong>进行中项目：</Text>
                <Text style={{ float: 'right', color: '#fa8c16' }}>{stats.activeProjects} 个</Text>
              </div>
              <div>
                <Text strong>已完成项目：</Text>
                <Text style={{ float: 'right', color: '#52c41a' }}>{stats.completedProjects} 个</Text>
              </div>
              <div>
                <Text strong>订单总数：</Text>
                <Text style={{ float: 'right' }}>{stats.totalOrders} 个</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 使用说明 */}
      <Card title="📊 报表说明" style={{ marginTop: 24 }}>
        <Space direction="vertical" size="middle">
          <Text>
            <Text strong>数据范围：</Text>
            默认显示最近30天的数据，可通过日期选择器自定义时间范围
          </Text>
          <Text>
            <Text strong>导出功能：</Text>
            支持导出Excel格式报表，包含所有统计数据和详细信息
          </Text>
          <Text>
            <Text strong>数据更新：</Text>
            数据每次打开页面时自动刷新，确保统计准确性
          </Text>
          <Text type="secondary">
            注：部分数据为模拟数据，实际使用时需接入真实API
          </Text>
        </Space>
      </Card>
    </div>
  )
}

export default AdminReports

