import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Select, Spin, message, Tabs, Table } from 'antd'
import {
  DollarOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  FileTextOutlined,
  PayCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  InboxOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { Line, Column, Pie } from '@ant-design/plots'
import { erpAPI } from '../services/api'
import dayjs from 'dayjs'

const { Option } = Select
const { TabPane } = Tabs

const ERPDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    fetchDashboardData()
  }, [period])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const response = await erpAPI.getDashboard({ period })
      setDashboardData(response.data.data)
    } catch (error) {
      console.error('获取统计数据失败:', error)
      message.error('获取统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 格式化金额
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0)
  }

  // 订单趋势图配置
  const orderTrendConfig = {
    data: dashboardData?.trends?.orders || [],
    xField: 'date',
    yField: 'count',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    xAxis: {
      label: {
        formatter: (v) => dayjs(v).format('MM-DD')
      }
    }
  }

  // 收入趋势图配置
  const revenueTrendConfig = {
    data: dashboardData?.trends?.revenue || [],
    xField: 'date',
    yField: 'amount',
    smooth: true,
    color: '#52c41a',
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    xAxis: {
      label: {
        formatter: (v) => dayjs(v).format('MM-DD')
      }
    },
    yAxis: {
      label: {
        formatter: (v) => formatCurrency(v)
      }
    },
    tooltip: {
      formatter: (datum) => {
        return {
          name: '回款金额',
          value: formatCurrency(datum.amount)
        }
      }
    }
  }

  if (loading || !dashboardData) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 20 }}>加载中...</div>
      </div>
    )
  }

  const { sales, production, finance, inventory } = dashboardData

  return (
    <div style={{ padding: 24, background: '#f0f2f5' }}>
      {/* 头部 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 'bold' }}>企业驾驶舱</h1>
          <p style={{ margin: '8px 0 0 0', color: '#888' }}>
            实时监控关键业务指标
          </p>
        </div>
        <Space>
          <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
            <Option value="today">今日</Option>
            <Option value="week">本周</Option>
            <Option value="month">本月</Option>
            <Option value="quarter">本季度</Option>
            <Option value="year">本年</Option>
          </Select>
          <button 
            onClick={fetchDashboardData}
            style={{
              padding: '8px 16px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <ReloadOutlined /> 刷新
          </button>
        </Space>
      </div>

      {/* 关键指标卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="销售额"
              value={sales?.totalValue || 0}
              precision={0}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#3f8600', fontSize: 24 }}
            />
            <div style={{ marginTop: 12, fontSize: 14 }}>
              {sales?.growthRate >= 0 ? (
                <span style={{ color: '#3f8600' }}>
                  <ArrowUpOutlined /> {sales?.growthRate}% 环比增长
                </span>
              ) : (
                <span style={{ color: '#cf1322' }}>
                  <ArrowDownOutlined /> {Math.abs(sales?.growthRate)}% 环比下降
                </span>
              )}
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="订单数"
              value={sales?.totalOrders || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ fontSize: 24 }}
            />
            <div style={{ marginTop: 12, fontSize: 14 }}>
              <span style={{ color: '#1890ff' }}>
                完成率: {sales?.completionRate || 0}%
              </span>
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="生产完成率"
              value={production?.completionRate || 0}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ fontSize: 24, color: production?.completionRate >= 95 ? '#3f8600' : '#faad14' }}
            />
            <div style={{ marginTop: 12, fontSize: 14 }}>
              <span>
                生产订单: {production?.totalOrders || 0}
              </span>
            </div>
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="回款率"
              value={finance?.invoices?.paymentRate || 0}
              suffix="%"
              prefix={<PayCircleOutlined />}
              valueStyle={{ fontSize: 24, color: finance?.invoices?.paymentRate >= 80 ? '#3f8600' : '#cf1322' }}
            />
            <div style={{ marginTop: 12, fontSize: 14 }}>
              <span style={{ color: '#cf1322' }}>
                应收账款: {formatCurrency(finance?.receivables || 0)}
              </span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 详细统计Tab */}
      <Card>
        <Tabs defaultActiveKey="sales">
          {/* 销售统计 */}
          <TabPane tab={<span><ShoppingCartOutlined /> 销售统计</span>} key="sales">
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="总销售额"
                    value={sales?.totalValue || 0}
                    prefix="¥"
                    precision={0}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="平均订单金额"
                    value={sales?.avgOrderValue || 0}
                    prefix="¥"
                    precision={0}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="待确认订单"
                    value={sales?.pendingOrders || 0}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="进行中订单"
                    value={sales?.confirmedOrders || 0}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="订单趋势" size="small">
              <Line {...orderTrendConfig} />
            </Card>
          </TabPane>

          {/* 生产统计 */}
          <TabPane tab={<span><ToolOutlined /> 生产统计</span>} key="production">
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="生产订单数"
                    value={production?.totalOrders || 0}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="总计划数量"
                    value={production?.totalQuantity || 0}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="已完成数量"
                    value={production?.completedQuantity || 0}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="平均进度"
                    value={production?.avgProgress || 0}
                    suffix="%"
                  />
                </Card>
              </Col>
            </Row>

            {production?.workOrders && (
              <Row gutter={16}>
                <Col span={12}>
                  <Card title="工单统计" size="small">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="总工单数"
                          value={production.workOrders.totalWorkOrders || 0}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="已完成工单"
                          value={production.workOrders.completedWorkOrders || 0}
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="质量统计" size="small">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="工单完成率"
                          value={production.workOrders.completionRate || 0}
                          suffix="%"
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="平均合格率"
                          value={production.workOrders.avgPassRate || 0}
                          suffix="%"
                          valueStyle={{ color: '#3f8600' }}
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
            )}
          </TabPane>

          {/* 财务统计 */}
          <TabPane tab={<span><FileTextOutlined /> 财务统计</span>} key="finance">
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="发票总额"
                    value={finance?.invoices?.totalAmount || 0}
                    prefix="¥"
                    precision={0}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="已回款金额"
                    value={finance?.invoices?.paidAmount || 0}
                    prefix="¥"
                    precision={0}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="应收账款"
                    value={finance?.receivables || 0}
                    prefix="¥"
                    precision={0}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="逾期金额"
                    value={finance?.overdueAmount || 0}
                    prefix="¥"
                    precision={0}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card title="回款统计" size="small">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="回款次数"
                        value={finance?.payments?.total || 0}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="平均回款金额"
                        value={finance?.payments?.avgAmount || 0}
                        prefix="¥"
                        precision={0}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="发票统计" size="small">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="发票数量"
                        value={finance?.invoices?.total || 0}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="逾期发票"
                        value={finance?.invoices?.overdue || 0}
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            <Card title="回款趋势" size="small">
              <Line {...revenueTrendConfig} />
            </Card>
          </TabPane>

          {/* 库存统计 */}
          <TabPane tab={<span><InboxOutlined /> 库存统计</span>} key="inventory">
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="产品总数"
                    value={inventory?.totalProducts || 0}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="库存总量"
                    value={inventory?.totalStock || 0}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="低库存产品"
                    value={inventory?.lowStockProducts || 0}
                    valueStyle={{ color: inventory?.lowStockProducts > 0 ? '#cf1322' : '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="库存周转率"
                    value={inventory?.turnoverRate || 0}
                    suffix="次/年"
                  />
                </Card>
              </Col>
            </Row>

            {inventory?.bySeries && inventory.bySeries.length > 0 && (
              <Card title="按系列统计" size="small">
                <Table
                  dataSource={inventory.bySeries}
                  columns={[
                    {
                      title: '系列',
                      dataIndex: '_id',
                      key: 'series'
                    },
                    {
                      title: '产品数量',
                      dataIndex: 'count',
                      key: 'count'
                    },
                    {
                      title: '库存总量',
                      dataIndex: 'totalStock',
                      key: 'totalStock'
                    }
                  ]}
                  pagination={false}
                  size="small"
                />
              </Card>
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default ERPDashboard

