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

  // 权限检查 - 只有管理员和采购专员可以访问
  const canAccess = hasAnyRole(['Administrator', 'Procurement Specialist']);

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
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  // 查看订单详情
  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
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
    draft: { color: 'default', text: '草稿' },
    pending: { color: 'orange', text: '待审核' },
    confirmed: { color: 'blue', text: '已确认' },
    shipped: { color: 'cyan', text: '已发货' },
    received: { color: 'green', text: '已收货' },
    cancelled: { color: 'red', text: '已取消' }
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
      render: (status, record) => {
        const config = statusConfig[status] || { color: 'default', text: status };
        return (
          <Select
            value={status}
            onChange={(value) => handleUpdateStatus(record._id, value)}
            style={{ width: 120 }}
            size="small"
            disabled={['received', 'cancelled'].includes(status)}
          >
            <Select.Option value="draft">
              <Tag color="default">草稿</Tag>
            </Select.Option>
            <Select.Option value="pending">
              <Tag color="orange">待审核</Tag>
            </Select.Option>
            <Select.Option value="confirmed">
              <Tag color="blue">已确认</Tag>
            </Select.Option>
            <Select.Option value="shipped">
              <Tag color="cyan">已发货</Tag>
            </Select.Option>
            <Select.Option value="received">
              <Tag color="green">已收货</Tag>
            </Select.Option>
            <Select.Option value="cancelled">
              <Tag color="red">已取消</Tag>
            </Select.Option>
          </Select>
        );
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
            disabled={['received', 'cancelled'].includes(record.status)}
            size="small"
          >
            编辑
          </Button>
          {hasAnyRole(['Administrator']) && record.status === 'draft' && (
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
              style={{ width: 140 }}
              allowClear
              onChange={setStatusFilter}
              value={statusFilter || undefined}
            >
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="pending">待审核</Select.Option>
              <Select.Option value="confirmed">已确认</Select.Option>
              <Select.Option value="shipped">已发货</Select.Option>
              <Select.Option value="received">已收货</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
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

      {/* 订单详情Modal */}
      <Modal
        title={`采购订单详情 - ${selectedOrder?.order_number || ''}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              setDetailModalVisible(false);
              navigate(`/purchase-orders/edit/${selectedOrder._id}`);
            }}
            disabled={
              selectedOrder &&
              ['received', 'cancelled'].includes(selectedOrder.status)
            }
          >
            编辑订单
          </Button>
        ]}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="订单号" span={2}>
                <strong>{selectedOrder.order_number}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="供应商">
                {selectedOrder.supplier_id?.name}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusConfig[selectedOrder.status]?.color}>
                  {statusConfig[selectedOrder.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单日期">
                {selectedOrder.order_date
                  ? dayjs(selectedOrder.order_date).format('YYYY-MM-DD')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="预计交货">
                {selectedOrder.expected_delivery_date
                  ? dayjs(selectedOrder.expected_delivery_date).format(
                      'YYYY-MM-DD'
                    )
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="付款条款" span={2}>
                {selectedOrder.payment_terms || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="收货地址" span={2}>
                {selectedOrder.shipping_address || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="联系人">
                {selectedOrder.contact_person || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {selectedOrder.contact_phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {selectedOrder.created_by?.username}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedOrder.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="订单备注" span={2}>
                {selectedOrder.notes || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider>订单明细</Divider>

            <Table
              columns={[
                {
                  title: '产品名称',
                  dataIndex: 'product_name',
                  key: 'product_name'
                },
                {
                  title: '产品编码',
                  dataIndex: 'product_code',
                  key: 'product_code'
                },
                {
                  title: '规格',
                  dataIndex: 'specification',
                  key: 'specification'
                },
                {
                  title: '数量',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  align: 'center'
                },
                {
                  title: '单位',
                  dataIndex: 'unit',
                  key: 'unit',
                  align: 'center'
                },
                {
                  title: '单价',
                  dataIndex: 'unit_price',
                  key: 'unit_price',
                  align: 'right',
                  render: (price) => `¥${price.toLocaleString()}`
                },
                {
                  title: '小计',
                  dataIndex: 'subtotal',
                  key: 'subtotal',
                  align: 'right',
                  render: (subtotal) => (
                    <strong style={{ color: '#f5222d' }}>
                      ¥{subtotal.toLocaleString()}
                    </strong>
                  )
                }
              ]}
              dataSource={selectedOrder.items}
              rowKey={(record, index) => index}
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={6} align="right">
                      <strong>订单总额：</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right">
                      <strong style={{ color: '#f5222d', fontSize: '16px' }}>
                        ¥{selectedOrder.total_amount?.toLocaleString()}
                      </strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
            
            <Divider>采购文件</Divider>
            
            {canAccess && (
              <div style={{ marginBottom: 16 }}>
                <CloudUpload
                  onSuccess={async (fileData) => {
                    try {
                      await axios.post(`/api/purchase-orders/${selectedOrder._id}/add-file`, {
                        file_name: fileData.name,
                        file_url: fileData.url,
                      });
                      message.success('文件已上传！');
                      // 刷新订单列表
                      fetchPurchaseOrders();
                      // 更新selectedOrder以显示新文件
                      const response = await purchaseOrdersAPI.getById(selectedOrder._id);
                      setSelectedOrder(response.data.data);
                    } catch (error) {
                      message.error('上传文件失败: ' + (error.response?.data?.message || error.message));
                    }
                  }}
                >
                  <Button icon={<UploadOutlined />} type="dashed" block>
                    上传采购文件
                  </Button>
                </CloudUpload>
              </div>
            )}
            
            {selectedOrder.documents && selectedOrder.documents.length > 0 ? (
              <Table
                dataSource={selectedOrder.documents}
                rowKey={(record, index) => `doc_${index}`}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: '文件名',
                    dataIndex: 'name',
                    key: 'name',
                    render: (text) => (
                      <Space>
                        <FileTextOutlined style={{ color: '#1890ff' }} />
                        {text}
                      </Space>
                    )
                  },
                  {
                    title: '上传时间',
                    dataIndex: 'uploadedAt',
                    key: 'uploadedAt',
                    width: 180,
                    render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
                  },
                  {
                    title: '操作',
                    key: 'actions',
                    width: 150,
                    render: (_, record) => (
                      <Space>
                        <Button
                          type="link"
                          icon={<EyeOutlined />}
                          size="small"
                          onClick={() => window.open(record.url, '_blank')}
                        >
                          查看
                        </Button>
                        <Button
                          type="link"
                          icon={<DownloadOutlined />}
                          size="small"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = record.url;
                            link.download = record.name;
                            link.click();
                          }}
                        >
                          下载
                        </Button>
                      </Space>
                    )
                  }
                ]}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#999', background: '#fafafa', borderRadius: '4px' }}>
                <FolderOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <div>暂无采购文件</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseOrderManagement;

