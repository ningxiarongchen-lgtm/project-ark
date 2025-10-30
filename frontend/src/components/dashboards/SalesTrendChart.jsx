/**
 * SalesTrendChart - 销售趋势图表组件
 * 显示销售额、项目数量、成交率等趋势数据
 */

import { useState, useEffect } from 'react'
import { Card, Select, Row, Col, Statistic, Space } from 'antd'
import { Line, Column, DualAxes } from '@ant-design/plots'
import { 
  RiseOutlined, 
  FallOutlined, 
  TrophyOutlined,
  DollarOutlined 
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select

const SalesTrendChart = ({ data = [] }) => {
  const [timeRange, setTimeRange] = useState('month') // week, month, quarter, year
  const [chartData, setChartData] = useState([])
  const [summaryStats, setSummaryStats] = useState({
    totalRevenue: 0,
    totalProjects: 0,
    winRate: 0,
    avgDealSize: 0,
    revenueGrowth: 0,
    projectGrowth: 0
  })

  useEffect(() => {
    generateChartData()
  }, [timeRange, data])

  const generateChartData = () => {
    // 生成模拟数据（实际应该从API获取）
    const now = dayjs()
    let dateArray = []
    let format = ''

    switch (timeRange) {
      case 'week':
        dateArray = Array.from({ length: 7 }, (_, i) => now.subtract(6 - i, 'day'))
        format = 'MM-DD'
        break
      case 'month':
        dateArray = Array.from({ length: 30 }, (_, i) => now.subtract(29 - i, 'day'))
        format = 'MM-DD'
        break
      case 'quarter':
        dateArray = Array.from({ length: 12 }, (_, i) => now.subtract(11 - i, 'week'))
        format = 'MM-DD'
        break
      case 'year':
        dateArray = Array.from({ length: 12 }, (_, i) => now.subtract(11 - i, 'month'))
        format = 'YYYY-MM'
        break
      default:
        dateArray = Array.from({ length: 30 }, (_, i) => now.subtract(29 - i, 'day'))
        format = 'MM-DD'
    }

    // 生成模拟趋势数据
    const trendData = dateArray.map((date, index) => {
      const baseRevenue = 50000 + Math.random() * 30000
      const trend = index * 2000 // 上升趋势
      const noise = (Math.random() - 0.5) * 10000
      
      return {
        date: date.format(format),
        revenue: Math.round(baseRevenue + trend + noise),
        projects: Math.floor(3 + Math.random() * 5),
        wonProjects: Math.floor(1 + Math.random() * 3),
        quotedProjects: Math.floor(2 + Math.random() * 4)
      }
    })

    setChartData(trendData)

    // 计算汇总统计
    const totalRevenue = trendData.reduce((sum, item) => sum + item.revenue, 0)
    const totalProjects = trendData.reduce((sum, item) => sum + item.projects, 0)
    const totalWon = trendData.reduce((sum, item) => sum + item.wonProjects, 0)
    
    const prevPeriodRevenue = trendData.slice(0, Math.floor(trendData.length / 2))
      .reduce((sum, item) => sum + item.revenue, 0)
    const currPeriodRevenue = trendData.slice(Math.floor(trendData.length / 2))
      .reduce((sum, item) => sum + item.revenue, 0)
    
    const revenueGrowth = prevPeriodRevenue > 0 
      ? ((currPeriodRevenue - prevPeriodRevenue) / prevPeriodRevenue * 100).toFixed(1)
      : 0

    setSummaryStats({
      totalRevenue,
      totalProjects,
      winRate: totalProjects > 0 ? ((totalWon / totalProjects) * 100).toFixed(1) : 0,
      avgDealSize: totalProjects > 0 ? Math.round(totalRevenue / totalWon) : 0,
      revenueGrowth: parseFloat(revenueGrowth),
      projectGrowth: 8.5 // 模拟数据
    })
  }

  // 销售额趋势配置
  const revenueConfig = {
    data: chartData,
    xField: 'date',
    yField: 'revenue',
    smooth: true,
    height: 300,
    point: {
      size: 3,
      shape: 'circle',
    },
    label: {
      style: {
        fill: '#aaa',
      },
    },
    lineStyle: {
      lineWidth: 2,
    },
    color: '#1890ff',
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#d6e9ff 1:#aad8ff',
    },
    xAxis: {
      label: {
        autoRotate: true,
      },
    },
    yAxis: {
      label: {
        formatter: (v) => `¥${(v / 10000).toFixed(1)}万`,
      },
    },
    tooltip: {
      formatter: (datum) => {
        return {
          name: '销售额',
          value: `¥${(datum.revenue / 10000).toFixed(2)}万`
        }
      },
    },
  }

  // 项目数量趋势配置
  const projectsConfig = {
    data: chartData,
    xField: 'date',
    yField: 'projects',
    height: 300,
    color: '#52c41a',
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    label: {
      position: 'top',
      style: {
        fill: '#000000',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoRotate: true,
      },
    },
    yAxis: {
      label: {
        formatter: (v) => `${v}个`,
      },
    },
    tooltip: {
      formatter: (datum) => {
        return {
          name: '项目数',
          value: `${datum.projects}个`
        }
      },
    },
  }

  // 双轴图：销售额与项目数对比
  const dualAxesConfig = {
    data: [chartData, chartData],
    xField: 'date',
    yField: ['revenue', 'projects'],
    height: 350,
    geometryOptions: [
      {
        geometry: 'line',
        smooth: true,
        color: '#5B8FF9',
        lineStyle: {
          lineWidth: 2,
        },
      },
      {
        geometry: 'line',
        smooth: true,
        color: '#5AD8A6',
        lineStyle: {
          lineWidth: 2,
          lineDash: [4, 4],
        },
      },
    ],
    xAxis: {
      label: {
        autoRotate: true,
      },
    },
    yAxis: {
      revenue: {
        label: {
          formatter: (v) => `¥${(v / 10000).toFixed(0)}万`,
        },
      },
      projects: {
        label: {
          formatter: (v) => `${v}个`,
        },
      },
    },
    legend: {
      position: 'top',
      itemName: {
        formatter: (text, item) => {
          return item.value === 'revenue' ? '销售额' : '项目数'
        },
      },
    },
    tooltip: {
      shared: true,
      showCrosshairs: true,
    },
  }

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总销售额"
              value={summaryStats.totalRevenue / 10000}
              precision={2}
              suffix="万"
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <Space>
                {summaryStats.revenueGrowth >= 0 ? (
                  <RiseOutlined style={{ color: '#cf1322' }} />
                ) : (
                  <FallOutlined style={{ color: '#3f8600' }} />
                )}
                <span style={{ color: summaryStats.revenueGrowth >= 0 ? '#cf1322' : '#3f8600' }}>
                  {Math.abs(summaryStats.revenueGrowth)}%
                </span>
                <span style={{ color: '#888' }}>环比增长</span>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="项目总数"
              value={summaryStats.totalProjects}
              suffix="个"
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <Space>
                <RiseOutlined style={{ color: '#cf1322' }} />
                <span style={{ color: '#cf1322' }}>{summaryStats.projectGrowth}%</span>
                <span style={{ color: '#888' }}>环比增长</span>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均客单价"
              value={summaryStats.avgDealSize / 10000}
              precision={2}
              suffix="万"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="成交率"
              value={summaryStats.winRate}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 趋势图表 */}
      <Card 
        title="销售趋势分析"
        extra={
          <Select 
            value={timeRange} 
            onChange={setTimeRange}
            style={{ width: 120 }}
          >
            <Option value="week">近7天</Option>
            <Option value="month">近30天</Option>
            <Option value="quarter">近3个月</Option>
            <Option value="year">近一年</Option>
          </Select>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <div style={{ marginBottom: 16 }}>
              <h4>销售额与项目数对比</h4>
              <DualAxes {...dualAxesConfig} />
            </div>
          </Col>
          <Col xs={24} lg={12}>
            <div>
              <h4>销售额趋势</h4>
              <Line {...revenueConfig} />
            </div>
          </Col>
          <Col xs={24} lg={12}>
            <div>
              <h4>项目数量趋势</h4>
              <Column {...projectsConfig} />
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default SalesTrendChart

