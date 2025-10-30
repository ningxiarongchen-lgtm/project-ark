import { useEffect, useState } from 'react'
import { Table, Card, Input, Select, Button, Space, Tag, message, Badge } from 'antd'
import { SearchOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { actuatorsAPI } from '../services/api'

const { Search } = Input

const Products = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    series: '',
    action_type: '',
    status: '',
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await actuatorsAPI.getAll(filters)
      // 后端返回格式: { success: true, data: [...], pagination: {...} }
      const productData = response.data.data || response.data.actuators || response.data || []
      setProducts(Array.isArray(productData) ? productData : [])
    } catch (error) {
      console.error('Failed to load products:', error)
      message.error('加载产品列表失败')
      setProducts([]) // 确保错误时也设置为空数组
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchProducts()
  }

  const handleViewDetails = (record) => {
    navigate(`/products/${record._id}`)
  }

  // 状态颜色映射
  const getStatusColor = (status) => {
    const colorMap = {
      '设计中': 'processing',
      '已发布': 'success',
      '已停产': 'default'
    }
    return colorMap[status] || 'default'
  }

  const columns = [
    {
      title: '型号',
      dataIndex: 'model_base',
      key: 'model_base',
      fixed: 'left',
      width: 150,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '系列',
      dataIndex: 'series',
      key: 'series',
      width: 100,
      render: (series) => series ? <Tag color="blue">{series}</Tag> : '-'
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (version) => (
        <Badge count={version} style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status || '已发布'}
        </Tag>
      )
    },
    {
      title: '作用类型',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 100,
      render: (type) => (
        <Tag color={type === 'DA' ? 'cyan' : 'orange'}>
          {type === 'DA' ? '双作用' : '弹簧复位'}
        </Tag>
      )
    },
    {
      title: '本体尺寸',
      dataIndex: 'body_size',
      key: 'body_size',
      width: 120
    },
    {
      title: '定价模式',
      dataIndex: 'pricing_model',
      key: 'pricing_model',
      width: 110,
      render: (model) => (
        <Tag color={model === 'fixed' ? 'green' : 'purple'}>
          {model === 'fixed' ? '固定价格' : '阶梯价格'}
        </Tag>
      )
    },
    {
      title: '基础价格',
      dataIndex: 'base_price',
      key: 'base_price',
      width: 120,
      render: (price) => price ? `¥${price.toLocaleString()}` : '-'
    },
    {
      title: '库存状态',
      key: 'stock_info',
      width: 100,
      render: (_, record) => (
        <Tag color={record.stock_info?.available ? 'success' : 'warning'}>
          {record.stock_info?.available ? '有货' : `${record.stock_info?.lead_time || 0}天`}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          查看详情
        </Button>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>产品数据库</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/products/new')}
        >
          添加新产品
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Search
            placeholder="搜索型号或描述"
            style={{ width: 300 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onSearch={handleSearch}
            enterButton
          />
          <Select
            placeholder="系列"
            style={{ width: 120 }}
            value={filters.series || undefined}
            onChange={(value) => setFilters({ ...filters, series: value })}
            allowClear
          >
            <Select.Option value="SF">SF</Select.Option>
            <Select.Option value="AT">AT</Select.Option>
            <Select.Option value="GY">GY</Select.Option>
          </Select>
          <Select
            placeholder="作用类型"
            style={{ width: 130 }}
            value={filters.action_type || undefined}
            onChange={(value) => setFilters({ ...filters, action_type: value })}
            allowClear
          >
            <Select.Option value="DA">双作用(DA)</Select.Option>
            <Select.Option value="SR">弹簧复位(SR)</Select.Option>
          </Select>
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value })}
            allowClear
          >
            <Select.Option value="设计中">设计中</Select.Option>
            <Select.Option value="已发布">已发布</Select.Option>
            <Select.Option value="已停产">已停产</Select.Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个产品`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
        />
      </Card>
    </div>
  )
}

export default Products


