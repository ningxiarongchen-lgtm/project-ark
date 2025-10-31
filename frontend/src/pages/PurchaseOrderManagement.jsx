import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Popconfirm,
  Statistic,
  Row,
  Col,
  Select,
  DatePicker,
  Input,
  Descriptions,
  Divider,
  Result
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  FileDoneOutlined,
  ClockCircleOutlined,
  LockOutlined,
  UploadOutlined,
  FileTextOutlined,
  DownloadOutlined,
  FolderOutlined
} from '@ant-design/icons';
import { purchaseOrdersAPI, suppliersAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import CloudUpload from '../components/CloudUpload';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const PurchaseOrderManagement = () => {
  const navigate = useNavigate();
  const { user, hasAnyRole } = useAuth();

  // 权限检查 - 管理员、采购专员、商务工程师可以访问
  const canAccess = hasAnyRole(['Administrator', 'Procurement Specialist', 'Business Engineer']);

  if (!canAccess) {
    return (
      <Result
        status="403"
        title="无权访问"
        subTitle="抱歉，您没有权限访问采购订单管理页面。此功能仅限管理员和采购专员使用。"
        icon={<LockOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />}
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            返回首页
          </Button>
        }
      />
    );
  }

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // 筛选状态
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchPurchaseOrders();
    fetchStats();
    fetchSuppliers();
  }, [statusFilter, supplierFilter, dateRange, searchText]);

  // 获取采购订单列表
  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (supplierFilter) params.supplier_id = supplierFilter;
      if (searchText) params.search = searchText;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await purchaseOrdersAPI.getAll(params);
      setPurchaseOrders(response.data.data);
    } catch (error) {
      message.error('获取采购订单列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await purchaseOrdersAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 获取供应商列表
  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll({ status: 'active' });
      setSuppliers(response.data.data);
    } catch (error) {
      console.error('获取供应商列表失败:', error);
    }
  };

  // 查看订单详情 - 导航到详情页
  const handleViewDetail = (order) => {
    navigate(`/purchase-orders/${order._id}`);
  };

  // 删除采购订单
  const handleDelete = async (id) => {
    try {
      await purchaseOrdersAPI.delete(id);
      message.success('采购订单删除成功');
      fetchPurchaseOrders();
      fetchStats();
    } catch (error) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  // 更新订单状态
  const handleUpdateStatus = async (id, status) => {
    try {
      await purchaseOrdersAPI.updateStatus(id, status);
      message.success('状态更新成功');
      fetchPurchaseOrders();
      fetchStats();
    } catch (error) {
      message.error(error.response?.data?.message || '状态更新失败');
    }
  };

  // 状态配置
  const statusConfig = {
    '草稿 (Draft)': { color: 'default', text: '草稿' },
    '待处理 (Pending)': { color: 'default', text: '待处理' },
    '待拟定合同 (Pending Contract Draft)': { color: 'orange', text: '待拟定合同' },
    '待商务审核 (Pending Commercial Review)': { color: 'blue', text: '待商务审核' },
    '待供应商确认 (Pending Supplier Confirmation)': { color: 'cyan', text: '待供应商确认' },
    '执行中 (In Progress)': { color: 'processing', text: '执行中' },
    '已发货 (Shipped)': { color: 'purple', text: '已发货' },
    '已收货 (Received)': { color: 'success', text: '已收货' },
    '已取消 (Cancelled)': { color: 'error', text: '已取消' }
  };

  // 表格列定义
  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_number',
      key: 'order_number',
      fixed: 'left',
      width: 160,
      render: (text) => <strong style={{ color: '#1890ff' }}>{text}</strong>
    },
    {
      title: '供应商',
      dataIndex: ['supplier_id', 'name'],
      key: 'supplier',
      width: 180,
      render: (text, record) => record.supplier_id?.name || '-'
    },
    {
      title: '订单金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 130,
      align: 'right',
      render: (amount) => (
        <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
          ¥{amount?.toLocaleString() || '0'}
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      align: 'center',
      render: (status) => {
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '订单日期',
      dataIndex: 'order_date',
      key: 'order_date',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '预计交货',
      dataIndex: 'expected_delivery_date',
      key: 'expected_delivery_date',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '创建人',
      dataIndex: ['created_by', 'username'],
      key: 'created_by',
      width: 100,
      render: (text, record) => record.created_by?.username || '-'
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            size="small"
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/purchase-orders/edit/${record._id}`)}
            disabled={['已收货 (Received)', '已取消 (Cancelled)'].includes(record.status)}
            size="small"
          >
            编辑
          </Button>
          {hasAnyRole(['Administrator']) && record.status === '草稿 (Draft)' && (
            <Popconfirm
              title="确定删除此采购订单吗？"
              onConfirm={() => handleDelete(record._id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger icon={<DeleteOutlined />} size="small">
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 16 }}>
            <ShoppingCartOutlined style={{ marginRight: 8 }} />
            采购订单管理
          </h2>

          {/* 统计信息 */}
          {stats && (
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总订单数"
                    value={stats.total}
                    prefix={<FileDoneOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="已确认订单"
                    value={stats.statusCounts?.confirmed || 0}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<FileDoneOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="待审核订单"
                    value={stats.statusCounts?.pending || 0}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总交易金额"
                    value={stats.totalAmount || 0}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          <Divider />

          {/* 搜索和筛选 */}
          <Space style={{ marginBottom: 16 }} wrap>
            <Input.Search
              placeholder="搜索订单号或备注"
              style={{ width: 250 }}
              allowClear
              onSearch={setSearchText}
              onChange={(e) => !e.target.value && setSearchText('')}
            />

            <Select
              placeholder="筛选状态"
              style={{ width: 160 }}
              allowClear
              onChange={setStatusFilter}
              value={statusFilter || undefined}
            >
              <Select.Option value="草稿 (Draft)">草稿</Select.Option>
              <Select.Option value="待处理 (Pending)">待处理</Select.Option>
              <Select.Option value="待拟定合同 (Pending Contract Draft)">待拟定合同</Select.Option>
              <Select.Option value="待商务审核 (Pending Commercial Review)">待商务审核</Select.Option>
              <Select.Option value="待供应商确认 (Pending Supplier Confirmation)">待供应商确认</Select.Option>
              <Select.Option value="执行中 (In Progress)">执行中</Select.Option>
              <Select.Option value="已发货 (Shipped)">已发货</Select.Option>
              <Select.Option value="已收货 (Received)">已收货</Select.Option>
              <Select.Option value="已取消 (Cancelled)">已取消</Select.Option>
            </Select>

            <Select
              placeholder="筛选供应商"
              style={{ width: 200 }}
              allowClear
              onChange={setSupplierFilter}
              value={supplierFilter || undefined}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {suppliers.map((supplier) => (
                <Select.Option key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </Select.Option>
              ))}
            </Select>

            <RangePicker
              placeholder={['开始日期', '结束日期']}
              onChange={setDateRange}
              value={dateRange}
            />

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/purchase-orders/create')}
            >
              新建采购订单
            </Button>
          </Space>
        </div>

        {/* 采购订单表格 */}
        <Table
          columns={columns}
          dataSource={purchaseOrders}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个采购订单`
          }}
        />
      </Card>

    </div>
  );
};

export default PurchaseOrderManagement;

