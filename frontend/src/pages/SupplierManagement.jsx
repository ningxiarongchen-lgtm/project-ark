import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  message, 
  Popconfirm,
  Rate,
  Statistic,
  Row,
  Col,
  Divider,
  Result
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  StarOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  ShopOutlined,
  LockOutlined
} from '@ant-design/icons';
import { suppliersAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const { TextArea } = Input;

const SupplierManagement = () => {
  const navigate = useNavigate();
  const { user, hasAnyRole } = useAuth();
  
  // 权限检查 - 只有管理员和采购专员可以访问
  const canAccess = hasAnyRole(['Administrator', 'Procurement Specialist']);
  
  // 如果没有权限，显示无权限页面
  if (!canAccess) {
    return (
      <Result
        status="403"
        title="无权访问"
        subTitle="抱歉，您没有权限访问供应商管理页面。此功能仅限管理员和采购专员使用。"
        icon={<LockOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />}
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            返回首页
          </Button>
        }
      />
    );
  }
  
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState(null);

  // 搜索和筛选状态
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  useEffect(() => {
    fetchSuppliers();
    fetchStats();
  }, [searchText, statusFilter, ratingFilter]);

  // 获取供应商列表
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchText) params.search = searchText;
      if (statusFilter) params.status = statusFilter;
      if (ratingFilter) params.rating = ratingFilter;

      const response = await suppliersAPI.getAll(params);
      setSuppliers(response.data.data);
    } catch (error) {
      message.error('获取供应商列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await suppliersAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 打开新建/编辑Modal
  const handleOpenModal = (supplier = null) => {
    setEditingSupplier(supplier);
    if (supplier) {
      form.setFieldsValue(supplier);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 关闭Modal
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingSupplier(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      if (editingSupplier) {
        await suppliersAPI.update(editingSupplier._id, values);
        message.success('供应商更新成功');
      } else {
        await suppliersAPI.create(values);
        message.success('供应商创建成功');
      }
      handleCloseModal();
      fetchSuppliers();
      fetchStats();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  // 删除供应商
  const handleDelete = async (id) => {
    try {
      await suppliersAPI.delete(id);
      message.success('供应商删除成功');
      fetchSuppliers();
      fetchStats();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 更新评级
  const handleUpdateRating = async (id, rating) => {
    try {
      await suppliersAPI.updateRating(id, rating);
      message.success('评级更新成功');
      fetchSuppliers();
      fetchStats();
    } catch (error) {
      message.error('评级更新失败');
    }
  };

  // 更新状态
  const handleUpdateStatus = async (id, status) => {
    try {
      await suppliersAPI.updateStatus(id, status);
      message.success('状态更新成功');
      fetchSuppliers();
      fetchStats();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '供应商名称',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '联系人',
      dataIndex: 'contact_person',
      key: 'contact_person',
      width: 120,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (text) => text ? (
        <Space>
          <PhoneOutlined style={{ color: '#1890ff' }} />
          {text}
        </Space>
      ) : '-'
    },
    {
      title: '业务范围',
      dataIndex: 'business_scope',
      key: 'business_scope',
      width: 200,
      ellipsis: true,
      render: (text) => text ? (
        <Space>
          <ShopOutlined />
          {text}
        </Space>
      ) : '-'
    },
    {
      title: '评级',
      dataIndex: 'rating',
      key: 'rating',
      width: 180,
      align: 'center',
      render: (rating, record) => (
        <Rate 
          value={rating} 
          onChange={(value) => handleUpdateRating(record._id, value)}
        />
      )
    },
    {
      title: '认证状态',
      dataIndex: 'certification_status',
      key: 'certification_status',
      width: 130,
      align: 'center',
      render: (status) => {
        const statusConfig = {
          'Certified': { color: 'green', text: '已认证' },
          'Pending': { color: 'orange', text: '待认证' },
          'Not Certified': { color: 'default', text: '未认证' }
        };
        const config = statusConfig[status] || { color: 'default', text: '未设置' };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status, record) => {
        const statusConfig = {
          active: { color: 'green', text: '活跃' },
          inactive: { color: 'orange', text: '停用' },
          blacklisted: { color: 'red', text: '黑名单' }
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        
        return (
          <Select
            value={status}
            onChange={(value) => handleUpdateStatus(record._id, value)}
            style={{ width: 100 }}
            size="small"
          >
            <Select.Option value="active">
              <Tag color="green">活跃</Tag>
            </Select.Option>
            <Select.Option value="inactive">
              <Tag color="orange">停用</Tag>
            </Select.Option>
            <Select.Option value="blacklisted">
              <Tag color="red">黑名单</Tag>
            </Select.Option>
          </Select>
        );
      }
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此供应商吗？"
            onConfirm={() => handleDelete(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 16 }}>供应商管理</h2>
          
          {/* 统计信息 */}
          {stats && (
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总供应商数"
                    value={stats.total}
                    prefix={<ShopOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="活跃供应商"
                    value={stats.active}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<ShopOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="平均评级"
                    value={stats.avgRating}
                    precision={1}
                    suffix="/ 5.0"
                    prefix={<StarOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="黑名单"
                    value={stats.blacklisted}
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
              placeholder="搜索供应商名称、联系人、业务范围"
              style={{ width: 300 }}
              allowClear
              onSearch={setSearchText}
              onChange={(e) => !e.target.value && setSearchText('')}
            />
            
            <Select
              placeholder="筛选状态"
              style={{ width: 120 }}
              allowClear
              onChange={setStatusFilter}
            >
              <Select.Option value="active">活跃</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
              <Select.Option value="blacklisted">黑名单</Select.Option>
            </Select>

            <Select
              placeholder="最低评级"
              style={{ width: 120 }}
              allowClear
              onChange={setRatingFilter}
            >
              <Select.Option value="5">5星</Select.Option>
              <Select.Option value="4">4星及以上</Select.Option>
              <Select.Option value="3">3星及以上</Select.Option>
            </Select>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              新建供应商
            </Button>
          </Space>
        </div>

        {/* 供应商表格 */}
        <Table
          columns={columns}
          dataSource={suppliers}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1550 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个供应商`
          }}
        />
      </Card>

      {/* 新建/编辑Modal */}
      <Modal
        title={editingSupplier ? '编辑供应商' : '新建供应商'}
        open={modalVisible}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        width={700}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="供应商名称"
            rules={[{ required: true, message: '请输入供应商名称' }]}
          >
            <Input placeholder="例如: 上海阀门配件一厂" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contact_person"
                label="联系人"
              >
                <Input placeholder="例如: 张三" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="电话"
              >
                <Input placeholder="例如: 021-12345678" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="地址"
          >
            <Input placeholder="例如: 上海市浦东新区张江高科技园区" />
          </Form.Item>

          <Form.Item
            name="business_scope"
            label="业务范围"
          >
            <TextArea 
              rows={3} 
              placeholder="例如: 阀门配件、执行器配件、密封件"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="rating"
                label="评级"
                initialValue={3}
              >
                <Rate />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="certification_status"
                label="认证状态"
                initialValue="Not Certified"
              >
                <Select>
                  <Select.Option value="Certified">已认证</Select.Option>
                  <Select.Option value="Pending">待认证</Select.Option>
                  <Select.Option value="Not Certified">未认证</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="状态"
            initialValue="active"
          >
            <Select>
              <Select.Option value="active">活跃</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
              <Select.Option value="blacklisted">黑名单</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea 
              rows={3} 
              placeholder="备注信息..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplierManagement;

