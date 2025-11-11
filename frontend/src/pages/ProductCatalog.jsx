import { useState, useEffect, useCallback } from 'react'
import { Card, Table, Input, Select, Button, Space, Tag, Statistic, Row, Col, Alert, Spin, message } from 'antd'
import { SearchOutlined, ReloadOutlined, DatabaseOutlined, TagsOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Search } = Input

const ProductCatalog = () => {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [seriesFilter, setSeriesFilter] = useState(null)
  const [actionTypeFilter, setActionTypeFilter] = useState(null)
  const [mechanismFilter, setMechanismFilter] = useState(null)
  const [valveTypeFilter, setValveTypeFilter] = useState(null)

  // 翻译映射
  const mechanismTranslation = {
    'Rack & Pinion': '齿轮齿条',
    'Scotch Yoke': '拨叉式',
    '齿轮齿条': '齿轮齿条',
    '拨叉式': '拨叉式'
  }

  const valveTypeTranslation = {
    'Ball Valve': '球阀',
    'Butterfly Valve': '蝶阀',
    'Gate Valve': '闸阀',
    'Globe Valve': '截止阀',
    'Control Valve': '直行程调节阀',
    '球阀': '球阀',
    '蝶阀': '蝶阀',
    '闸阀': '闸阀',
    '截止阀': '截止阀',
    '直行程调节阀': '直行程调节阀'
  }

  const actionTypeTranslation = {
    'DA': '双作用DA',
    'SR': '单作用SR',
    '双作用DA': '双作用DA',
    '单作用SR': '单作用SR'
  }

  // 翻译函数
  const translateMechanism = (value) => mechanismTranslation[value] || value
  const translateValveType = (value) => valveTypeTranslation[value] || value
  const translateActionType = (value) => actionTypeTranslation[value] || value

  // 获取所有产品
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/catalog/products')
      setProducts(response.data.data)
      setFilteredProducts(response.data.data)
      message.success(`成功加载 ${response.data.count} 个产品`)
    } catch (error) {
      console.error('获取产品目录失败:', error)
      message.error('获取产品目录失败: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }, [])

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

    // 机构类型筛选
    if (mechanismFilter) {
      result = result.filter(product => translateMechanism(product.mechanism) === mechanismFilter)
    }

    // 阀门类型筛选
    if (valveTypeFilter) {
      result = result.filter(product => translateValveType(product.valve_type) === valveTypeFilter)
    }

    setFilteredProducts(result)
  }, [searchKeyword, seriesFilter, actionTypeFilter, mechanismFilter, valveTypeFilter, products])

  // 获取唯一值用于筛选（只显示中文）
  const uniqueSeries = [...new Set(products.map(p => p.series))].filter(Boolean)
  
  // 作用类型：只显示 DA 和 SR，翻译为中文
  const uniqueActionTypes = [...new Set(products.map(p => p.action_type))]
    .filter(Boolean)
    .filter(type => type === 'DA' || type === 'SR')
  
  // 机构类型：只显示齿轮齿条和拨叉式
  const uniqueMechanisms = [...new Set(products.map(p => translateMechanism(p.mechanism)))]
    .filter(Boolean)
    .filter(mech => mech === '齿轮齿条' || mech === '拨叉式')
  
  // 根据机构类型动态获取对应的阀门类型（只显示球阀和蝶阀）
  const getValveTypesByMechanism = () => {
    if (mechanismFilter === '齿轮齿条') {
      // 齿轮齿条不应该有球阀蝶阀，但根据需求只显示球阀蝶阀
      return ['球阀', '蝶阀']
    } else if (mechanismFilter === '拨叉式') {
      return ['球阀', '蝶阀']
    } else {
      // 未选择机构类型时，只显示球阀和蝶阀
      const allValveTypes = [...new Set(products.map(p => translateValveType(p.valve_type)))]
        .filter(Boolean)
        .filter(valve => valve === '球阀' || valve === '蝶阀')
      return allValveTypes.length > 0 ? allValveTypes : ['球阀', '蝶阀']
    }
  }
  
  const availableValveTypes = getValveTypesByMechanism()

  // 重置筛选
  const handleReset = () => {
    setSearchKeyword('')
    setSeriesFilter(null)
    setActionTypeFilter(null)
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
        const translated = translateMechanism(text)
        const color = translated === '齿轮齿条' ? 'purple' : translated === '拨叉式' ? 'cyan' : 'default'
        return <Tag color={color}>{translated || '-'}</Tag>
      },
      filters: uniqueMechanisms.map(m => ({ text: m, value: m })),
      onFilter: (value, record) => translateMechanism(record.mechanism) === value
    },
    {
      title: '阀门类型',
      dataIndex: 'valve_type',
      key: 'valve_type',
      width: 100,
      render: (text) => {
        if (!text) return '-'
        const translated = translateValveType(text)
        const color = translated === '球阀' ? 'gold' : translated === '蝶阀' ? 'cyan' : 'geekblue'
        return <Tag color={color}>{translated}</Tag>
      },
      filters: availableValveTypes.map(v => ({ text: v, value: v })),
      onFilter: (value, record) => translateValveType(record.valve_type) === value
    },
    {
      title: '作用类型',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 120,
      render: (text) => {
        const translated = translateActionType(text)
        const color = text === 'DA' ? 'green' : text === 'SR' ? 'orange' : 'default'
        return <Tag color={color}>{translated || '-'}</Tag>
      }
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

        {/* 统计信息 - 只显示5个核心指标 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="产品总数"
                value={products.length}
                suffix="个"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="筛选结果"
                value={filteredProducts.length}
                suffix="个"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="有库存产品"
                value={products.filter(p => (p.inventory_quantity || 0) > 0).length}
                suffix="个"
                valueStyle={{ color: '#13c2c2' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="产品系列"
                value={uniqueSeries.length}
                suffix="个"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="机构类型"
                value={uniqueMechanisms.length}
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
              placeholder="机构类型"
              style={{ width: 150 }}
              allowClear
              value={mechanismFilter}
              onChange={(value) => {
                setMechanismFilter(value)
                // 切换机构类型时，清空阀门类型筛选（避免不匹配）
                setValveTypeFilter(null)
              }}
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
              {availableValveTypes.map(valve => (
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
                  {translateActionType(type)}
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

