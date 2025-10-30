import { useState, useEffect, useCallback } from 'react'
import { Card, Table, Input, Select, Button, Space, Tag, Statistic, Row, Col, Alert, Spin, App } from 'antd'
import { SearchOutlined, ReloadOutlined, DatabaseOutlined, TagsOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Search } = Input

const ProductCatalog = () => {
  const { message } = App.useApp()
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [seriesFilter, setSeriesFilter] = useState(null)
  const [actionTypeFilter, setActionTypeFilter] = useState(null)
  const [yokeTypeFilter, setYokeTypeFilter] = useState(null)
  const [productTypeFilter, setProductTypeFilter] = useState(null)
  const [mechanismFilter, setMechanismFilter] = useState(null)
  const [valveTypeFilter, setValveTypeFilter] = useState(null)

  // 获取所有产品
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/catalog/products')
      setProducts(response.data.data)
      setFilteredProducts(response.data.data)
      message.success(`成功加载 ${response.data.count} 个产品`)
    } catch (error) {
      console.error('获取产品目录失败:', error)
      message.error('获取产品目录失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // 应用筛选
  useEffect(() => {
    let result = products

    // 关键词搜索
    if (searchKeyword) {
      result = result.filter(product => 
        product.model_base?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        product.series?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchKeyword.toLowerCase())
      )
    }

    // 系列筛选
    if (seriesFilter) {
      result = result.filter(product => product.series === seriesFilter)
    }

    // 作用类型筛选
    if (actionTypeFilter) {
      result = result.filter(product => product.action_type === actionTypeFilter)
    }

    // 轭架类型筛选
    if (yokeTypeFilter) {
      result = result.filter(product => product.yoke_type === yokeTypeFilter)
    }

    // 产品类型筛选
    if (productTypeFilter) {
      result = result.filter(product => product.product_type === productTypeFilter)
    }

    // 机构类型筛选
    if (mechanismFilter) {
      result = result.filter(product => product.mechanism === mechanismFilter)
    }

    // 阀门类型筛选
    if (valveTypeFilter) {
      result = result.filter(product => product.valve_type === valveTypeFilter)
    }

    setFilteredProducts(result)
  }, [searchKeyword, seriesFilter, actionTypeFilter, yokeTypeFilter, productTypeFilter, mechanismFilter, valveTypeFilter, products])

  // 获取唯一值用于筛选
  const uniqueSeries = [...new Set(products.map(p => p.series))].filter(Boolean)
  const uniqueActionTypes = [...new Set(products.map(p => p.action_type))].filter(Boolean)
  const uniqueYokeTypes = [...new Set(products.map(p => p.yoke_type))].filter(Boolean)
  const uniqueProductTypes = [...new Set(products.map(p => p.product_type))].filter(Boolean)
  const uniqueMechanisms = [...new Set(products.map(p => p.mechanism))].filter(Boolean)
  const uniqueValveTypes = [...new Set(products.map(p => p.valve_type))].filter(Boolean)

  // 重置筛选
  const handleReset = () => {
    setSearchKeyword('')
    setSeriesFilter(null)
    setActionTypeFilter(null)
    setYokeTypeFilter(null)
    setProductTypeFilter(null)
    setMechanismFilter(null)
    setValveTypeFilter(null)
  }

  // 表格列定义
  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
      fixed: 'left'
    },
    {
      title: '产品类型',
      dataIndex: 'product_type',
      key: 'product_type',
      width: 120,
      fixed: 'left',
      render: (text) => {
        const color = text === '执行器' ? 'blue' : text === '手动操作装置' ? 'green' : 'orange'
        return <Tag color={color}>{text}</Tag>
      },
      filters: uniqueProductTypes.map(t => ({ text: t, value: t })),
      onFilter: (value, record) => record.product_type === value
    },
    {
      title: '型号',
      dataIndex: 'model_base',
      key: 'model_base',
      width: 150,
      fixed: 'left',
      render: (text) => <strong style={{ color: '#1890ff' }}>{text}</strong>,
      sorter: (a, b) => (a.model_base || '').localeCompare(b.model_base || '')
    },
    {
      title: '系列',
      dataIndex: 'series',
      key: 'series',
      width: 100,
      render: (text) => <Tag color="blue">{text || '-'}</Tag>,
      filters: uniqueSeries.map(s => ({ text: s, value: s })),
      onFilter: (value, record) => record.series === value
    },
    {
      title: '机构类型',
      dataIndex: 'mechanism',
      key: 'mechanism',
      width: 120,
      render: (text) => {
        const color = text === '齿轮齿条' ? 'purple' : text === '拨叉式' ? 'cyan' : 'default'
        return <Tag color={color}>{text || '-'}</Tag>
      },
      filters: uniqueMechanisms.map(m => ({ text: m, value: m })),
      onFilter: (value, record) => record.mechanism === value
    },
    {
      title: '阀门类型',
      dataIndex: 'valve_type',
      key: 'valve_type',
      width: 100,
      render: (text) => {
        if (!text) return '-'
        const color = text === '球阀' ? 'gold' : 'geekblue'
        return <Tag color={color}>{text}</Tag>
      },
      filters: uniqueValveTypes.map(v => ({ text: v, value: v })),
      onFilter: (value, record) => record.valve_type === value
    },
    {
      title: '作用类型',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 120,
      render: (text) => {
        const color = text === 'DA' ? 'green' : text === 'SR' ? 'orange' : 'default'
        return <Tag color={color}>{text || '-'}</Tag>
      }
    },
    {
      title: '轭架类型',
      dataIndex: 'yoke_type',
      key: 'yoke_type',
      width: 120,
      render: (text) => <Tag>{text || '-'}</Tag>
    },
    {
      title: '输出扭矩(Nm)',
      dataIndex: 'output_torque',
      key: 'output_torque',
      width: 120,
      render: (torque) => <strong>{torque ? torque.toLocaleString() : '-'}</strong>,
      sorter: (a, b) => (a.output_torque || 0) - (b.output_torque || 0)
    },
    {
      title: '工作角度(°)',
      dataIndex: 'rotation_angle',
      key: 'rotation_angle',
      width: 110,
      render: (angle) => angle || '-'
    },
    {
      title: '工作压力(bar)',
      dataIndex: 'operating_pressure',
      key: 'operating_pressure',
      width: 120,
      render: (pressure) => pressure || '-'
    },
    {
      title: '重量(kg)',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
      render: (weight) => weight || '-'
    },
    {
      title: '库存量',
      dataIndex: 'inventory_quantity',
      key: 'inventory_quantity',
      width: 100,
      render: (qty) => {
        const quantity = qty || 0
        const color = quantity > 10 ? 'green' : quantity > 0 ? 'orange' : 'red'
        return <Tag color={color}>{quantity}</Tag>
      },
      sorter: (a, b) => (a.inventory_quantity || 0) - (b.inventory_quantity || 0)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        // 支持中文和英文状态值
        const isActive = status === 'active' || status === '已发布' || status === '在售'
        const color = isActive ? 'green' : 'default'
        const text = isActive ? '可售' : '停产'
        return <Tag color={color}>{text}</Tag>
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
      render: (text) => text || '-'
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <DatabaseOutlined style={{ color: '#1890ff' }} />
            产品目录
          </h2>
          <Alert
            message="销售经理产品目录"
            description="本页面显示所有产品的技术规格和库存信息，但不包含价格数据。如需了解产品定价，请联系商务团队。"
            type="info"
            showIcon
            icon={<TagsOutlined />}
            style={{ marginBottom: 16 }}
          />
        </div>

        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="产品总数"
                value={products.length}
                suffix="个"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="筛选结果"
                value={filteredProducts.length}
                suffix="个"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="执行器"
                value={products.filter(p => p.product_type === '执行器').length}
                suffix="个"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="手动操作装置"
                value={products.filter(p => p.product_type === '手动操作装置').length}
                suffix="个"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="附件"
                value={products.filter(p => p.product_type === '附件').length}
                suffix="个"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="有库存产品"
                value={products.filter(p => (p.inventory_quantity || 0) > 0).length}
                suffix="个"
                valueStyle={{ color: '#13c2c2' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="产品系列"
                value={uniqueSeries.length}
                suffix="个"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="产品类型"
                value={uniqueProductTypes.length}
                suffix="种"
                valueStyle={{ color: '#eb2f96' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 筛选工具栏 */}
        <Card style={{ marginBottom: 16, background: '#f5f5f5' }}>
          <Space wrap style={{ width: '100%' }}>
            <Search
              placeholder="搜索型号、系列或描述"
              allowClear
              style={{ width: 300 }}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={(value) => setSearchKeyword(value)}
              prefix={<SearchOutlined />}
            />
            
            <Select
              placeholder="选择系列"
              style={{ width: 150 }}
              allowClear
              value={seriesFilter}
              onChange={setSeriesFilter}
            >
              {uniqueSeries.map(series => (
                <Select.Option key={series} value={series}>
                  {series}
                </Select.Option>
              ))}
            </Select>

            <Select
              placeholder="产品类型"
              style={{ width: 150 }}
              allowClear
              value={productTypeFilter}
              onChange={setProductTypeFilter}
            >
              {uniqueProductTypes.map(type => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
            </Select>

            <Select
              placeholder="机构类型"
              style={{ width: 150 }}
              allowClear
              value={mechanismFilter}
              onChange={setMechanismFilter}
            >
              {uniqueMechanisms.map(mech => (
                <Select.Option key={mech} value={mech}>
                  {mech}
                </Select.Option>
              ))}
            </Select>

            <Select
              placeholder="阀门类型"
              style={{ width: 150 }}
              allowClear
              value={valveTypeFilter}
              onChange={setValveTypeFilter}
            >
              {uniqueValveTypes.map(valve => (
                <Select.Option key={valve} value={valve}>
                  {valve}
                </Select.Option>
              ))}
            </Select>

            <Select
              placeholder="作用类型"
              style={{ width: 150 }}
              allowClear
              value={actionTypeFilter}
              onChange={setActionTypeFilter}
            >
              {uniqueActionTypes.map(type => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
            </Select>

            <Select
              placeholder="轭架类型"
              style={{ width: 150 }}
              allowClear
              value={yokeTypeFilter}
              onChange={setYokeTypeFilter}
            >
              {uniqueYokeTypes.map(type => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
            </Select>

            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              重置筛选
            </Button>

            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchProducts}
              loading={loading}
            >
              刷新数据
            </Button>
          </Space>
        </Card>

        {/* 产品表格 */}
        <Spin spinning={loading} size="large" tip="加载产品目录...">
          <Table
            columns={columns}
            dataSource={filteredProducts}
            rowKey="_id"
            bordered
            scroll={{ x: 1800 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个产品`,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
            size="middle"
          />
        </Spin>
      </Card>
    </div>
  )
}

export default ProductCatalog

