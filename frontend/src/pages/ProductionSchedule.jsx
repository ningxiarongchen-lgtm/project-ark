import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Button, Statistic, Row, Col, Space, message, Modal, 
  Form, Select, DatePicker, Tabs, Result, Spin, Alert, Table, Tag
} from 'antd'
import {
  ToolOutlined, ClockCircleOutlined, PlayCircleOutlined,
  CheckCircleOutlined, ReloadOutlined, RocketOutlined,
  LockOutlined, TableOutlined, BarChartOutlined,
  EyeOutlined, ThunderboltOutlined
} from '@ant-design/icons'
import { productionAPI, workOrdersAPI } from '../services/api'
import dayjs from 'dayjs'
import { useAuth } from '../hooks/useAuth'
import ProductionGantt from '../components/ProductionGantt'

const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

const ProductionSchedule = () => {
  const navigate = useNavigate()
  const { user, hasAnyRole } = useAuth()
  
  // 权限检查
  const canAccessPage = hasAnyRole(['Administrator', 'Production Planner', 'Sales Manager'])
  const canModify = hasAnyRole(['Administrator', 'Production Planner'])
  
  // 如果没有页面访问权限，显示无权限提示
  if (!canAccessPage) {
    return (
      <Result
        status="403"
        title="无权访问"
        subTitle="抱歉，您没有权限访问生产排期页面。此功能仅限生产计划员和管理员使用。"
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            返回首页
          </Button>
        }
      />
    )
  }

  const [loading, setLoading] = useState(false)
  const [ganttLoading, setGanttLoading] = useState(false)
  const [statistics, setStatistics] = useState(null)
  const [ganttData, setGanttData] = useState(null)
  const [productionOrders, setProductionOrders] = useState([])
  const [activeTab, setActiveTab] = useState('gantt')
  
  // 筛选条件
  const [filters, setFilters] = useState({
    status: undefined,
    materialStatus: undefined, // 🔒 新增物料状态筛选
    dateRange: null
  })
  
  // 🔒 物料详情Modal
  const [materialDetailModalVisible, setMaterialDetailModalVisible] = useState(false)
  const [selectedMaterialDetails, setSelectedMaterialDetails] = useState(null)

  // APS排程Modal
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false)
  const [selectedProductionOrder, setSelectedProductionOrder] = useState(null)
  const [scheduling, setScheduling] = useState(false)

  useEffect(() => {
    fetchStatistics()
    fetchGanttData()
    if (activeTab === 'list') {
      fetchProductionOrders()
    }
  }, [])

  // 获取统计信息
  const fetchStatistics = async () => {
    try {
      const response = await productionAPI.getStatistics()
      setStatistics(response.data.data)
    } catch (error) {
      console.error('获取统计信息失败:', error)
    }
  }

  // 获取甘特图数据
  const fetchGanttData = async () => {
    setGanttLoading(true)
    try {
      const params = {
        status: filters.status
      }

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD')
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD')
      }

      const response = await productionAPI.getGanttData(params)
      setGanttData(response.data.data)
    } catch (error) {
      console.error('获取甘特图数据失败:', error)
      message.error('获取甘特图数据失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setGanttLoading(false)
    }
  }

  // 获取生产订单列表
  const fetchProductionOrders = async () => {
    setLoading(true)
    try {
      const params = {
        page: 1,
        limit: 100,
        status: filters.status,
        material_readiness_status: filters.materialStatus // 🔒 新增物料状态筛选
      }

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD')
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD')
      }

      const response = await productionAPI.getAll(params)
      setProductionOrders(response.data.data)
    } catch (error) {
      console.error('获取生产订单列表失败:', error)
      message.error('获取生产订单列表失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }
  
  // 🔒 显示物料详情
  const showMaterialDetails = (record) => {
    setSelectedMaterialDetails({
      orderNumber: record.productionOrderNumber,
      status: record.material_readiness_status,
      updatedAt: record.material_status_updated_at,
      shortageDetails: record.material_shortage_details || [],
      productionItems: record.productionItems || []
    })
    setMaterialDetailModalVisible(true)
  }

  // 执行APS智能排程
  const handleScheduleProduction = async (productionOrderId) => {
    setScheduling(true)
    try {
      const response = await productionAPI.scheduleProduction(productionOrderId)
      
      const result = response.data.data
      
      // 显示排程结果
      Modal.success({
        title: 'APS智能排程完成',
        width: 600,
        content: (
          <div>
            <p>已成功为生产订单执行智能排程</p>
            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <div>✓ 总工单数: {result.summary.totalWorkOrders}</div>
              <div>✓ 已排程: {result.summary.scheduledCount}</div>
              <div>✓ 总时长: {result.summary.totalDuration} 分钟 ({(result.summary.totalDuration / 60).toFixed(1)} 小时)</div>
              {result.summary.earliestStart && (
                <div>✓ 最早开始: {dayjs(result.summary.earliestStart).format('YYYY-MM-DD HH:mm')}</div>
              )}
              {result.summary.latestEnd && (
                <div>✓ 最晚完成: {dayjs(result.summary.latestEnd).format('YYYY-MM-DD HH:mm')}</div>
              )}
              {result.materialShortages.length > 0 && (
                <div style={{ color: '#faad14', marginTop: 8 }}>
                  ⚠ 物料短缺: {result.materialShortages.length} 项
                </div>
              )}
              {result.capacityIssues.length > 0 && (
                <div style={{ color: '#ff4d4f', marginTop: 4 }}>
                  ⚠ 产能问题: {result.capacityIssues.length} 项
                </div>
              )}
            </div>
          </div>
        )
      })

      // 刷新数据
      await fetchGanttData()
      await fetchStatistics()
      if (activeTab === 'list') {
        await fetchProductionOrders()
      }
      
      setScheduleModalVisible(false)
    } catch (error) {
      console.error('APS排程失败:', error)
      message.error('APS排程失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setScheduling(false)
    }
  }

  // 刷新所有数据
  const handleRefreshAll = async () => {
    await Promise.all([
      fetchStatistics(),
      fetchGanttData(),
      activeTab === 'list' ? fetchProductionOrders() : Promise.resolve()
    ])
    message.success('数据已刷新')
  }

  // 生产订单列表列定义
  const columns = [
    {
      title: '生产订单号',
      dataIndex: 'productionOrderNumber',
      key: 'productionOrderNumber',
      fixed: 'left',
      width: 150,
      render: (text) => <strong style={{ color: '#ff6a00' }}>{text}</strong>
    },
    {
      title: '销售订单',
      key: 'salesOrder',
      width: 150,
      render: (_, record) => (
        <div>
          <div><strong>{record.orderSnapshot?.orderNumber}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.orderSnapshot?.projectNumber}
          </div>
        </div>
      )
    },
    {
      title: '客户/项目',
      key: 'client',
      width: 180,
      render: (_, record) => (
        <div>
          <div>{record.orderSnapshot?.clientName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.orderSnapshot?.projectName}
          </div>
        </div>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => {
        const colorMap = { 'Low': 'default', 'Normal': 'blue', 'High': 'orange', 'Urgent': 'red' }
        const nameMap = { 'Low': '低', 'Normal': '正常', 'High': '高', 'Urgent': '紧急' }
        return <Tag color={colorMap[priority]}>{nameMap[priority] || priority}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colorMap = {
          'Pending': 'default',
          'Scheduled': 'cyan',
          'In Production': 'processing',
          'Completed': 'success'
        }
        const nameMap = {
          'Pending': '待生产',
          'Scheduled': '已排期',
          'In Production': '生产中',
          'Completed': '已完成'
        }
        return <Tag color={colorMap[status]}>{nameMap[status] || status}</Tag>
      }
    },
    {
      title: '🔧 物料齐套',
      dataIndex: 'material_readiness_status',
      key: 'material_readiness_status',
      width: 130,
      fixed: 'left',
      render: (status, record) => {
        const colorMap = {
          '待分析': 'default',
          '部分可用': 'warning',
          '全部可用(齐套)': 'success',
          '采购延迟': 'error'
        }
        const iconMap = {
          '待分析': '⏳',
          '部分可用': '⚠️',
          '全部可用(齐套)': '✅',
          '采购延迟': '🔴'
        }
        return (
          <Tag 
            color={colorMap[status] || 'default'}
            style={{ 
              fontWeight: status === '全部可用(齐套)' ? 'bold' : 'normal',
              fontSize: status === '全部可用(齐套)' ? '14px' : '12px',
              cursor: 'pointer'
            }}
            onClick={() => showMaterialDetails(record)}
          >
            {iconMap[status]} {status || '待分析'}
          </Tag>
        )
      }
    },
    {
      title: '计划时间',
      key: 'schedule',
      width: 200,
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          <div>{dayjs(record.schedule?.plannedStartDate).format('YYYY-MM-DD')}</div>
          <div style={{ color: '#999' }}>至</div>
          <div>{dayjs(record.schedule?.plannedEndDate).format('YYYY-MM-DD')}</div>
        </div>
      )
    },
    ...(canModify ? [{
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/production/${record._id}`)}
          >
            查看
          </Button>
          {record.status === 'Pending' && (
            <Button
              type="primary"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={() => {
                setSelectedProductionOrder(record)
                setScheduleModalVisible(true)
              }}
            >
              排程
            </Button>
          )}
        </Space>
      )
    }] : [{
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/production/${record._id}`)}
        >
          查看
        </Button>
      )
    }])
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>
          <ToolOutlined style={{ marginRight: 8 }} />
          生产排期 - 智能甘特图
        </h2>
        
        {/* 只读模式提示 */}
        {!canModify && (
          <Card style={{ marginBottom: 16, background: '#fffbe6', borderColor: '#ffe58f' }}>
            <Space>
              <LockOutlined style={{ color: '#faad14' }} />
              <span>
                <strong>只读模式：</strong>您当前以只读方式查看生产排期。如需修改或执行排程，请联系生产计划员或管理员。
              </span>
            </Space>
          </Card>
        )}

        {/* 统计卡片 */}
        {statistics && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={4}>
              <Card>
                <Statistic
                  title="生产订单总数"
                  value={statistics.totalOrders}
                  prefix={<ToolOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="待生产"
                  value={statistics.ordersByStatus?.pending || 0}
                  valueStyle={{ color: '#8c8c8c' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="已排期"
                  value={statistics.ordersByStatus?.scheduled || 0}
                  valueStyle={{ color: '#13c2c2' }}
                  prefix={<RocketOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="生产中"
                  value={statistics.ordersByStatus?.inProduction || 0}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<PlayCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="已完成"
                  value={statistics.ordersByStatus?.completed || 0}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="平均完成率"
                  value={statistics.performance?.avgCompletion || 0}
                  suffix="%"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* APS排程说明 */}
        {canModify && (
          <Alert
            message="APS智能排程系统"
            description={
              <div>
                <p style={{ marginBottom: 8 }}>
                  本系统集成了高级计划排程(APS)算法，可自动计算最优生产计划：
                </p>
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>✓ BOM物料需求展开</li>
                  <li>✓ ATP库存可用性检查</li>
                  <li>✓ 供应商采购周期计算</li>
                  <li>✓ 工作中心产能分析</li>
                  <li>✓ 启发式智能排程优化</li>
                  <li>✓ 自动考虑工作日历和班次</li>
                </ul>
              </div>
            }
            type="info"
            showIcon
            icon={<RocketOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 筛选条件 */}
        <Card style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="工单状态"
              allowClear
              style={{ width: 150 }}
              value={filters.status}
              onChange={(value) => {
                setFilters({ ...filters, status: value })
              }}
            >
              <Option value="待发布">待发布</Option>
              <Option value="已发布">已发布</Option>
              <Option value="已接收">已接收</Option>
              <Option value="进行中">进行中</Option>
              <Option value="暂停">暂停</Option>
              <Option value="待质检">待质检</Option>
              <Option value="已完成">已完成</Option>
            </Select>
            
            {/* 🔒 物料齐套状态筛选 */}
            <Select
              placeholder="🔧 物料齐套状态"
              allowClear
              style={{ width: 170 }}
              value={filters.materialStatus}
              onChange={(value) => {
                setFilters({ ...filters, materialStatus: value })
              }}
            >
              <Option value="全部可用(齐套)">✅ 全部可用(齐套)</Option>
              <Option value="部分可用">⚠️ 部分可用</Option>
              <Option value="采购延迟">🔴 采购延迟</Option>
              <Option value="待分析">⏳ 待分析</Option>
            </Select>

            <RangePicker
              placeholder={['计划开始', '计划结束']}
              value={filters.dateRange}
              onChange={(dates) => {
                setFilters({ ...filters, dateRange: dates })
              }}
            />

            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchGanttData()
                if (activeTab === 'list') {
                  fetchProductionOrders()
                }
              }}
            >
              应用筛选
            </Button>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setFilters({
                  status: undefined,
                  dateRange: null
                })
                fetchGanttData()
                if (activeTab === 'list') {
                  fetchProductionOrders()
                }
              }}
            >
              重置
            </Button>

            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefreshAll}
            >
              刷新全部
            </Button>
          </Space>
        </Card>
      </div>

      {/* 标签页：甘特图 / 列表视图 */}
      <Tabs 
        activeKey={activeTab} 
        onChange={(key) => {
          setActiveTab(key)
          if (key === 'list' && productionOrders.length === 0) {
            fetchProductionOrders()
          }
        }}
      >
        <TabPane
          tab={
            <span>
              <BarChartOutlined />
              甘特图视图
            </span>
          }
          key="gantt"
        >
          <Spin spinning={ganttLoading} tip="加载甘特图数据...">
            <ProductionGantt
              ganttData={ganttData}
              loading={ganttLoading}
              onRefresh={fetchGanttData}
            />
          </Spin>
        </TabPane>

        <TabPane
          tab={
            <span>
              <TableOutlined />
              列表视图
            </span>
          }
          key="list"
        >
          <Card>
            <Table
              columns={columns}
              dataSource={productionOrders}
              rowKey="_id"
              loading={loading}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
                pageSize: 20
              }}
              scroll={{ x: 1400 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* APS排程确认Modal */}
      <Modal
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#1890ff' }} />
            APS智能排程
          </Space>
        }
        open={scheduleModalVisible}
        onOk={() => {
          if (selectedProductionOrder) {
            handleScheduleProduction(selectedProductionOrder._id)
          }
        }}
        onCancel={() => setScheduleModalVisible(false)}
        confirmLoading={scheduling}
        okText="开始排程"
        cancelText="取消"
        width={600}
      >
        {selectedProductionOrder && (
          <div>
            <p>确认要为以下生产订单执行APS智能排程吗？</p>
            <Card size="small" style={{ marginTop: 16 }}>
              <div><strong>生产订单号:</strong> {selectedProductionOrder.productionOrderNumber}</div>
              <div><strong>销售订单:</strong> {selectedProductionOrder.orderSnapshot?.orderNumber}</div>
              <div><strong>客户:</strong> {selectedProductionOrder.orderSnapshot?.clientName}</div>
              <div><strong>项目:</strong> {selectedProductionOrder.orderSnapshot?.projectName}</div>
              <div><strong>优先级:</strong> <Tag color="blue">{selectedProductionOrder.priority}</Tag></div>
            </Card>
            <Alert
              message="排程说明"
              description="系统将自动分析物料需求、库存、采购周期和产能约束，计算出最优的工单执行时间。"
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        )}
      </Modal>
      
      {/* 🔒 物料详情Modal */}
      <Modal
        title={
          <Space>
            <ToolOutlined style={{ color: '#1890ff' }} />
            物料准备详情
          </Space>
        }
        open={materialDetailModalVisible}
        onCancel={() => setMaterialDetailModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setMaterialDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedMaterialDetails && (
          <div>
            <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <strong>生产订单:</strong> {selectedMaterialDetails.orderNumber}
                </Col>
                <Col span={8}>
                  <strong>当前状态:</strong>{' '}
                  {selectedMaterialDetails.status === '全部可用(齐套)' ? (
                    <Tag color="success">✅ {selectedMaterialDetails.status}</Tag>
                  ) : selectedMaterialDetails.status === '部分可用' ? (
                    <Tag color="warning">⚠️ {selectedMaterialDetails.status}</Tag>
                  ) : selectedMaterialDetails.status === '采购延迟' ? (
                    <Tag color="error">🔴 {selectedMaterialDetails.status}</Tag>
                  ) : (
                    <Tag color="default">⏳ {selectedMaterialDetails.status}</Tag>
                  )}
                </Col>
                <Col span={8}>
                  <strong>更新时间:</strong>{' '}
                  {selectedMaterialDetails.updatedAt 
                    ? dayjs(selectedMaterialDetails.updatedAt).format('YYYY-MM-DD HH:mm')
                    : '-'
                  }
                </Col>
              </Row>
            </Card>

            {/* 生产物料需求 */}
            <h4 style={{ marginBottom: 12 }}>📦 生产物料需求</h4>
            <Table
              dataSource={selectedMaterialDetails.productionItems}
              rowKey={(record, index) => index}
              pagination={false}
              size="small"
              style={{ marginBottom: 24 }}
              columns={[
                {
                  title: '物料名称',
                  dataIndex: 'model_name',
                  key: 'model_name',
                  render: (text) => <strong>{text}</strong>
                },
                {
                  title: '需求数量',
                  dataIndex: 'ordered_quantity',
                  key: 'ordered_quantity',
                  render: (qty) => <Tag color="blue">{qty}</Tag>
                },
                {
                  title: '生产状态',
                  dataIndex: 'production_status',
                  key: 'production_status',
                  render: (status) => {
                    const colorMap = {
                      'Pending': 'default',
                      'In Production': 'processing',
                      'Completed': 'success'
                    }
                    return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
                  }
                }
              ]}
            />

            {/* 缺料明细 */}
            {selectedMaterialDetails.shortageDetails.length > 0 ? (
              <>
                <h4 style={{ marginBottom: 12 }}>⚠️ 缺料明细</h4>
                <Table
                  dataSource={selectedMaterialDetails.shortageDetails}
                  rowKey={(record, index) => index}
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: '物料名称',
                      dataIndex: 'item_name',
                      key: 'item_name',
                      render: (text) => <strong style={{ color: '#ff4d4f' }}>{text}</strong>
                    },
                    {
                      title: '需求数量',
                      dataIndex: 'required_quantity',
                      key: 'required_quantity',
                      render: (qty) => <Tag color="blue">{qty}</Tag>
                    },
                    {
                      title: '可用数量',
                      dataIndex: 'available_quantity',
                      key: 'available_quantity',
                      render: (qty) => <Tag color="green">{qty}</Tag>
                    },
                    {
                      title: '缺料数量',
                      dataIndex: 'shortage_quantity',
                      key: 'shortage_quantity',
                      render: (qty) => <Tag color="red">{qty}</Tag>
                    },
                    {
                      title: '预计到货',
                      dataIndex: 'expected_arrival_date',
                      key: 'expected_arrival_date',
                      render: (date) => {
                        if (!date) return '-'
                        const arrivalDate = dayjs(date)
                        const isOverdue = arrivalDate.isBefore(dayjs())
                        return (
                          <span style={{ color: isOverdue ? '#ff4d4f' : '#52c41a' }}>
                            {arrivalDate.format('YYYY-MM-DD')}
                            {isOverdue && ' (延迟)'}
                          </span>
                        )
                      }
                    }
                  ]}
                />
              </>
            ) : (
              <Alert
                message="✅ 物料齐套"
                description="所有生产物料已准备就绪，可以安排全面生产！"
                type="success"
                showIcon
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ProductionSchedule

