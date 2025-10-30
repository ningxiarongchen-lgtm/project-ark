/**
 * SalesAnalytics - 销售预测和分析组件
 * 提供销售预测、趋势分析、目标达成情况等功能
 */

import { Card, Row, Col, Statistic, Progress, Space, Tag, Table, Alert } from 'antd'
import { Area, Pie, Column } from '@ant-design/plots'
import {
  RiseOutlined,
  FallOutlined,
  TrophyOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  DollarOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const SalesAnalytics = () => {
  // 销售目标数据
  const salesTarget = {
    monthly: 300000,
    quarterly: 900000,
    yearly: 3600000
  }

  // 当前完成情况
  const currentAchievement = {
    monthly: 245000,
    quarterly: 680000,
    yearly: 2800000
  }

  // 预测数据
  const forecast = {
    monthly: 280000,
    quarterly: 850000,
    yearly: 3400000
  }

  // 月度销售预测趋势
  const monthlyForecastData = Array.from({ length: 12 }, (_, i) => {
    const month = dayjs().subtract(11 - i, 'month').format('YYYY-MM')
    const isHistory = i < 10
    const baseValue = 200000 + i * 20000
    const actual = isHistory ? baseValue + (Math.random() - 0.5) * 30000 : null
    const predicted = !isHistory ? baseValue + (Math.random() - 0.3) * 25000 : null
    
    return {
      month,
      type: isHistory ? '实际销售额' : '预测销售额',
      value: isHistory ? actual : predicted,
      isHistory
    }
  })

  // 产品线销售占比
  const productSalesData = [
    { type: '阀门', value: 45, amount: 1260000 },
    { type: '执行器', value: 28, amount: 784000 },
    { type: '控制系统', value: 18, amount: 504000 },
    { type: '配件耗材', value: 9, amount: 252000 }
  ]

  // 区域销售分布
  const regionSalesData = [
    { region: '华北', sales: 850000, growth: 12.5, projects: 15 },
    { region: '华东', sales: 920000, growth: 18.3, projects: 18 },
    { region: '华南', sales: 680000, growth: -5.2, projects: 12 },
    { region: '西南', sales: 450000, growth: 22.8, projects: 9 },
    { region: '东北', sales: 320000, growth: 8.6, projects: 6 }
  ]

  // 销售预测曲线配置
  const forecastConfig = {
    data: monthlyForecastData,
    xField: 'month',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    height: 350,
    color: ['#1890ff', '#ff7875'],
    lineStyle: (datum) => {
      if (datum.type === '预测销售额') {
        return {
          lineDash: [4, 4],
          lineWidth: 2
        }
      }
      return {
        lineWidth: 2
      }
    },
    point: {
      size: 4,
      shape: 'circle'
    },
    yAxis: {
      label: {
        formatter: (v) => `¥${(v / 10000).toFixed(0)}万`
      }
    },
    legend: {
      position: 'top'
    },
    tooltip: {
      formatter: (datum) => {
        return {
          name: datum.type,
          value: `¥${(datum.value / 10000).toFixed(2)}万`
        }
      }
    },
    annotations: [
      {
        type: 'line',
        start: ['min', salesTarget.monthly],
        end: ['max', salesTarget.monthly],
        style: {
          stroke: '#52c41a',
          lineDash: [4, 4]
        },
        text: {
          content: '月度目标',
          position: 'end',
          style: {
            fill: '#52c41a'
          }
        }
      }
    ]
  }

  // 产品线占比配置
  const pieConfig = {
    data: productSalesData,
    angleField: 'value',
    colorField: 'type',
    height: 300,
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      type: 'spider',
      labelHeight: 28,
      content: '{name}\n{percentage}',
      style: {
        fontSize: 12
      }
    },
    statistic: {
      title: {
        content: '总销售额'
      },
      content: {
        content: '¥280万',
        style: {
          fontSize: 24
        }
      }
    },
    legend: {
      position: 'bottom'
    },
    tooltip: {
      formatter: (datum) => {
        return {
          name: datum.type,
          value: `¥${(datum.amount / 10000).toFixed(2)}万 (${datum.value}%)`
        }
      }
    }
  }

  // 区域销售柱状图配置
  const regionConfig = {
    data: regionSalesData,
    xField: 'region',
    yField: 'sales',
    height: 300,
    label: {
      position: 'top',
      formatter: (datum) => `¥${(datum.sales / 10000).toFixed(1)}万`
    },
    color: ({ growth }) => {
      return growth >= 0 ? '#52c41a' : '#ff4d4f'
    },
    tooltip: {
      formatter: (datum) => {
        return {
          name: '销售额',
          value: `¥${(datum.sales / 10000).toFixed(2)}万 (${datum.growth >= 0 ? '+' : ''}${datum.growth}%)`
        }
      }
    },
    yAxis: {
      label: {
        formatter: (v) => `¥${(v / 10000).toFixed(0)}万`
      }
    }
  }

  const regionColumns = [
    {
      title: '区域',
      dataIndex: 'region',
      key: 'region'
    },
    {
      title: '销售额',
      dataIndex: 'sales',
      key: 'sales',
      render: (value) => `¥${(value / 10000).toFixed(2)}万`,
      sorter: (a, b) => a.sales - b.sales
    },
    {
      title: '增长率',
      dataIndex: 'growth',
      key: 'growth',
      render: (value) => (
        <Space>
          {value >= 0 ? (
            <RiseOutlined style={{ color: '#52c41a' }} />
          ) : (
            <FallOutlined style={{ color: '#ff4d4f' }} />
          )}
          <span style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {value >= 0 ? '+' : ''}{value}%
          </span>
        </Space>
      ),
      sorter: (a, b) => a.growth - b.growth
    },
    {
      title: '项目数',
      dataIndex: 'projects',
      key: 'projects',
      render: (value) => <Tag color="blue">{value}个</Tag>,
      sorter: (a, b) => a.projects - b.projects
    }
  ]

  return (
    <div>
      {/* 目标达成情况 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card>
            <Statistic
              title="月度目标完成率"
              value={(currentAchievement.monthly / salesTarget.monthly * 100).toFixed(1)}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ 
                color: currentAchievement.monthly >= salesTarget.monthly ? '#52c41a' : '#faad14' 
              }}
            />
            <Progress 
              percent={(currentAchievement.monthly / salesTarget.monthly * 100).toFixed(1)}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              style={{ marginTop: 16 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              已完成: ¥{(currentAchievement.monthly / 10000).toFixed(2)}万 / 
              目标: ¥{(salesTarget.monthly / 10000).toFixed(2)}万
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <Statistic
              title="季度目标完成率"
              value={(currentAchievement.quarterly / salesTarget.quarterly * 100).toFixed(1)}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ 
                color: currentAchievement.quarterly >= salesTarget.quarterly * 0.9 ? '#52c41a' : '#faad14' 
              }}
            />
            <Progress 
              percent={(currentAchievement.quarterly / salesTarget.quarterly * 100).toFixed(1)}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              style={{ marginTop: 16 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              已完成: ¥{(currentAchievement.quarterly / 10000).toFixed(2)}万 / 
              目标: ¥{(salesTarget.quarterly / 10000).toFixed(2)}万
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <Statistic
              title="年度目标完成率"
              value={(currentAchievement.yearly / salesTarget.yearly * 100).toFixed(1)}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ 
                color: currentAchievement.yearly >= salesTarget.yearly * 0.8 ? '#52c41a' : '#faad14' 
              }}
            />
            <Progress 
              percent={(currentAchievement.yearly / salesTarget.yearly * 100).toFixed(1)}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              style={{ marginTop: 16 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              已完成: ¥{(currentAchievement.yearly / 10000).toFixed(2)}万 / 
              目标: ¥{(salesTarget.yearly / 10000).toFixed(2)}万
            </div>
          </Card>
        </Col>
      </Row>

      {/* 智能预测提醒 */}
      <Alert
        message="智能销售预测"
        description={
          <div>
            <p>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              根据历史数据分析，预计本月将完成销售额 ¥{(forecast.monthly / 10000).toFixed(2)}万，
              达成率 {(forecast.monthly / salesTarget.monthly * 100).toFixed(1)}%
            </p>
            <p>
              <AlertOutlined style={{ color: '#faad14', marginRight: 8 }} />
              当前进度略低于预期，建议重点跟进 "华东区域" 和 "阀门产品线" 的潜在项目
            </p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 销售预测趋势 */}
      <Card title="销售预测趋势" style={{ marginBottom: 24 }}>
        <Area {...forecastConfig} />
      </Card>

      {/* 产品线和区域分析 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="产品线销售占比">
            <Pie {...pieConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="区域销售分布">
            <Column {...regionConfig} />
            <Table
              columns={regionColumns}
              dataSource={regionSalesData}
              rowKey="region"
              pagination={false}
              size="small"
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 关键洞察 */}
      <Card title="关键洞察与建议" style={{ marginTop: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div style={{ padding: 16, background: '#f0f5ff', borderRadius: 8 }}>
              <Space direction="vertical">
                <DollarOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <h4>增长机会</h4>
                <p style={{ margin: 0, color: '#666' }}>
                  西南区域增长率达22.8%，建议加大资源投入
                </p>
              </Space>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ padding: 16, background: '#fff7e6', borderRadius: 8 }}>
              <Space direction="vertical">
                <AlertOutlined style={{ fontSize: 24, color: '#faad14' }} />
                <h4>风险预警</h4>
                <p style={{ margin: 0, color: '#666' }}>
                  华南区域销售额下降5.2%，需要制定改善计划
                </p>
              </Space>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ padding: 16, background: '#f6ffed', borderRadius: 8 }}>
              <Space direction="vertical">
                <TrophyOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                <h4>优势领域</h4>
                <p style={{ margin: 0, color: '#666' }}>
                  阀门产品线占比45%，继续保持市场领先地位
                </p>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default SalesAnalytics

