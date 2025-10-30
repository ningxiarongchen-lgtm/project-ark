/**
 * SalesFunnel - 销售漏斗可视化组件
 * 展示销售流程各阶段的转化情况
 */

import { Card, Row, Col, Statistic, Space, Progress } from 'antd'
import { Funnel } from '@ant-design/plots'
import { 
  UserOutlined, 
  FileSearchOutlined, 
  DollarOutlined,
  TrophyOutlined,
  ArrowDownOutlined 
} from '@ant-design/icons'

const SalesFunnel = ({ data = {} }) => {
  // 漏斗数据
  const funnelData = [
    {
      stage: '潜在客户',
      number: data.leads || 120,
      icon: <UserOutlined />,
      color: '#5B8FF9'
    },
    {
      stage: '初步接触',
      number: data.contacted || 85,
      icon: <FileSearchOutlined />,
      color: '#5AD8A6'
    },
    {
      stage: '需求确认',
      number: data.qualified || 60,
      icon: <FileSearchOutlined />,
      color: '#5D7092'
    },
    {
      stage: '方案报价',
      number: data.quoted || 45,
      icon: <DollarOutlined />,
      color: '#F6BD16'
    },
    {
      stage: '商务谈判',
      number: data.negotiation || 30,
      icon: <DollarOutlined />,
      color: '#E86452'
    },
    {
      stage: '成交签约',
      number: data.won || 18,
      icon: <TrophyOutlined />,
      color: '#6DC8EC'
    }
  ]

  // 计算转化率
  const conversionRates = funnelData.map((item, index) => {
    if (index === 0) return { ...item, rate: 100 }
    const rate = funnelData[0].number > 0 
      ? ((item.number / funnelData[0].number) * 100).toFixed(1)
      : 0
    const stepRate = funnelData[index - 1].number > 0
      ? ((item.number / funnelData[index - 1].number) * 100).toFixed(1)
      : 0
    return { ...item, rate: parseFloat(rate), stepRate: parseFloat(stepRate) }
  })

  // 漏斗图配置
  const config = {
    data: funnelData.map(item => ({
      stage: item.stage,
      value: item.number
    })),
    xField: 'stage',
    yField: 'value',
    legend: false,
    height: 400,
    color: funnelData.map(item => item.color),
    label: {
      formatter: (datum) => {
        const item = funnelData.find(d => d.stage === datum.stage)
        const rate = item ? 
          ((item.number / funnelData[0].number) * 100).toFixed(1) : 0
        return `${datum.value}个 (${rate}%)`
      },
      style: {
        fill: '#fff',
        fontSize: 14,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      formatter: (datum) => {
        const item = funnelData.find(d => d.stage === datum.stage)
        const rate = item ? 
          ((item.number / funnelData[0].number) * 100).toFixed(1) : 0
        return {
          name: datum.stage,
          value: `${datum.value}个 (${rate}%)`
        }
      }
    },
    conversionTag: {
      formatter: (datum) => {
        const index = funnelData.findIndex(d => d.stage === datum.stage)
        if (index === 0) return ''
        const stepRate = funnelData[index - 1].number > 0
          ? ((datum.value / funnelData[index - 1].number) * 100).toFixed(1)
          : 0
        return `转化率 ${stepRate}%`
      }
    }
  }

  return (
    <div>
      <Card title="销售漏斗分析">
        <Row gutter={[16, 16]}>
          {/* 漏斗图 */}
          <Col xs={24} lg={14}>
            <Funnel {...config} />
          </Col>

          {/* 转化率详情 */}
          <Col xs={24} lg={10}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Card size="small" style={{ background: '#f0f2f5' }}>
                <Statistic
                  title="总体转化率"
                  value={funnelData[0].number > 0 
                    ? ((funnelData[funnelData.length - 1].number / funnelData[0].number) * 100).toFixed(1)
                    : 0
                  }
                  suffix="%"
                  valueStyle={{ color: '#3f8600', fontSize: 28 }}
                  prefix={<TrophyOutlined />}
                />
                <div style={{ marginTop: 8, color: '#666' }}>
                  从潜在客户到成交签约
                </div>
              </Card>

              {conversionRates.map((item, index) => (
                <div key={item.stage}>
                  <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <div style={{ fontSize: 24, color: item.color }}>
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: 14 }}>
                          {item.stage}
                        </div>
                        <div style={{ color: '#666', fontSize: 12 }}>
                          {item.number}个客户
                        </div>
                      </div>
                    </Space>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: 18, 
                        fontWeight: 'bold',
                        color: item.color 
                      }}>
                        {item.rate}%
                      </div>
                      {index > 0 && (
                        <div style={{ 
                          fontSize: 12, 
                          color: item.stepRate >= 50 ? '#52c41a' : '#faad14'
                        }}>
                          <ArrowDownOutlined /> {item.stepRate}%
                        </div>
                      )}
                    </div>
                  </Space>
                  {index < conversionRates.length - 1 && (
                    <Progress 
                      percent={item.rate} 
                      strokeColor={item.color}
                      showInfo={false}
                      size="small"
                      style={{ marginTop: 8 }}
                    />
                  )}
                </div>
              ))}
            </Space>
          </Col>
        </Row>

        {/* 关键指标 */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="平均转化周期"
                value={35}
                suffix="天"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="最快成交记录"
                value={12}
                suffix="天"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="本月新增客户"
                value={28}
                suffix="个"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default SalesFunnel

