import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  DatePicker,
  message,
  Modal,
  Popconfirm,
  Descriptions,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip
} from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  CheckOutlined,
  ReloadOutlined,
  ExportOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { materialRequirementsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Search } = Input;

const MaterialRequirements = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, hasAnyRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // 筛选条件
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || undefined,
    priority: searchParams.get('priority') || undefined,
    search: searchParams.get('search') || '',
    dateRange: null
  });

  // 权限检查
  const canCreate = hasAnyRole(['Administrator', 'Production Planner']);
  const canAccept = hasAnyRole(['Administrator', 'Procurement Specialist']);
  const isProcurement = hasAnyRole(['Procurement Specialist']);
  const isPlanner = hasAnyRole(['Production Planner']);

  useEffect(() => {
    fetchRequirements();
    fetchStats();
  }, [pagination.current, pagination.pageSize, filters]);

  // 获取物料需求列表
  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        status: filters.status,
        priority: filters.priority,
        search: filters.search
      };

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.start_date = filters.dateRange[0].format('YYYY-MM-DD');
        params.end_date = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await materialRequirementsAPI.getAll(params);
      setRequirements(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0
      }));
    } catch (error) {
      message.error('获取物料需求列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await materialRequirementsAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 提交物料需求
  const handleSubmit = async (id) => {
    try {
      await materialRequirementsAPI.submit(id);
      message.success('物料需求已成功提交给采购部门');
      fetchRequirements();
      fetchStats();
    } catch (error) {
      message.error('提交失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 接单
  const handleAccept = async (id) => {
    try {
      await materialRequirementsAPI.accept(id);
      message.success('接单成功');
      fetchRequirements();
      fetchStats();
    } catch (error) {
      message.error('接单失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 删除需求
  const handleDelete = async (id) => {
    try {
      await materialRequirementsAPI.delete(id);
      message.success('删除成功');
      fetchRequirements();
      fetchStats();
    } catch (error) {
      message.error('删除失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '需求编号',
      dataIndex: 'requirement_number',
      key: 'requirement_number',
      width: 150,
      fixed: 'left',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong style={{ color: '#1890ff' }}>{text}</strong>
          {record.priority === 'Urgent' && (
            <Tag color="red" style={{ fontSize: '10px' }}>紧急</Tag>
          )}
        </Space>
      )
    },
    {
      title: '关联生产订单',
      key: 'production_order',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.production_order_snapshot?.order_number || '-'}</span>
          <span style={{ fontSize: '12px', color: '#999' }}>
            {record.production_order_snapshot?.sales_order_number || '-'}
          </span>
        </Space>
      )
    },
    {
      title: '客户/项目',
      key: 'project',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.production_order_snapshot?.client_name || '-'}</span>
          <span style={{ fontSize: '12px', color: '#999' }}>
            {record.production_order_snapshot?.project_name || '-'}
          </span>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colorMap = {
          '草稿': 'default',
          '已提交': 'processing',
          '采购中': 'orange',
          '部分完成': 'cyan',
          '已完成': 'success',
          '已取消': 'error'
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      }
    },
    {
      title: '物料项目',
      key: 'items',
      width: 110,
      render: (_, record) => (
        <div>
          <div>
            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
              {record.statistics?.completed_items || 0}
            </span>
            {' / '}
            <span>{record.statistics?.total_items || 0}</span>
          </div>
          {record.statistics?.pending_items > 0 && (
            <Tag color="warning" style={{ fontSize: '11px', marginTop: 2 }}>
              待采购: {record.statistics.pending_items}
            </Tag>
          )}
        </div>
      )
    },
    {
      title: '预估金额',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
          ¥{(record.statistics?.total_estimated_amount || 0).toLocaleString()}
        </span>
      )
    },
    {
      title: '要求到货日期',
      dataIndex: 'required_delivery_date',
      key: 'required_delivery_date',
      width: 120,
      render: (date) => {
        const deliveryDate = dayjs(date);
        const daysUntil = deliveryDate.diff(dayjs(), 'days');
        const isOverdue = daysUntil < 0;
        const isUrgent = daysUntil >= 0 && daysUntil <= 3;
        
        return (
          <Tooltip title={`${daysUntil >= 0 ? '还有' : '已逾期'} ${Math.abs(daysUntil)} 天`}>
            <span style={{ 
              color: isOverdue ? '#ff4d4f' : isUrgent ? '#faad14' : '#52c41a',
              fontWeight: isOverdue || isUrgent ? 'bold' : 'normal'
            }}>
              {deliveryDate.format('YYYY-MM-DD')}
              {isOverdue && ' 🔴'}
              {isUrgent && ' 🔥'}
            </span>
          </Tooltip>
        );
      }
    },
    {
      title: '创建人',
      key: 'creator',
      width: 100,
      render: (_, record) => record.created_by?.full_name || '-'
    },
    {
      title: '采购专员',
      key: 'assigned',
      width: 100,
      render: (_, record) => record.assigned_to?.full_name || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/material-requirements/${record._id}`)}
          >
            查看
          </Button>
          
          {/* 生产计划员可以编辑和提交自己的草稿 */}
          {isPlanner && record.status === '草稿' && record.created_by?._id === user._id && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/material-requirements/${record._id}/edit`)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确认提交给采购部门？"
                onConfirm={() => handleSubmit(record._id)}
                okText="确认"
                cancelText="取消"
              >
                <Button
                  type="primary"
                  size="small"
                  icon={<SendOutlined />}
                >
                  提交
                </Button>
              </Popconfirm>
              <Popconfirm
                title="确定删除此物料需求吗？"
                onConfirm={() => handleDelete(record._id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                >
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
          
          {/* 采购专员可以接单 */}
          {canAccept && record.status === '已提交' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleAccept(record._id)}
            >
              接单
            </Button>
          )}
          
          {/* 采购专员可以处理自己负责的需求 */}
          {isProcurement && record.status === '采购中' && record.assigned_to?._id === user._id && (
            <Button
              type="primary"
              size="small"
              onClick={() => navigate(`/material-requirements/${record._id}/process`)}
            >
              处理
            </Button>
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
            <FileTextOutlined style={{ marginRight: 8 }} />
            物料需求管理
          </h2>

          {/* 统计卡片 */}
          {stats && (
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Statistic
                    title="总需求数"
                    value={stats.total || 0}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              {isProcurement && (
                <Col xs={24} sm={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="待接单"
                      value={stats.pendingForProcurement || 0}
                      prefix={<Badge status="processing" />}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Card>
                </Col>
              )}
              {isPlanner && (
                <Col xs={24} sm={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="草稿"
                      value={stats.statusCounts?.草稿 || 0}
                      prefix={<EditOutlined />}
                      valueStyle={{ color: '#8c8c8c' }}
                    />
                  </Card>
                </Col>
              )}
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Statistic
                    title="采购中"
                    value={stats.statusCounts?.采购中 || 0}
                    prefix={<Badge status="processing" />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card size="small">
                  <Statistic
                    title="已完成"
                    value={stats.statusCounts?.已完成 || 0}
                    prefix={<CheckOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* 搜索和筛选 */}
          <Space style={{ marginBottom: 16 }} wrap>
            <Search
              placeholder="搜索需求编号或物料名称"
              style={{ width: 280 }}
              allowClear
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onSearch={fetchRequirements}
            />

            <Select
              placeholder="筛选状态"
              style={{ width: 140 }}
              allowClear
              value={filters.status}
              onChange={(value) => {
                setFilters({ ...filters, status: value });
                setPagination({ ...pagination, current: 1 });
              }}
            >
              <Select.Option value="草稿">草稿</Select.Option>
              <Select.Option value="已提交">已提交</Select.Option>
              <Select.Option value="采购中">采购中</Select.Option>
              <Select.Option value="部分完成">部分完成</Select.Option>
              <Select.Option value="已完成">已完成</Select.Option>
              <Select.Option value="已取消">已取消</Select.Option>
            </Select>

            <Select
              placeholder="筛选优先级"
              style={{ width: 120 }}
              allowClear
              value={filters.priority}
              onChange={(value) => {
                setFilters({ ...filters, priority: value });
                setPagination({ ...pagination, current: 1 });
              }}
            >
              <Select.Option value="Low">低</Select.Option>
              <Select.Option value="Normal">正常</Select.Option>
              <Select.Option value="High">高</Select.Option>
              <Select.Option value="Urgent">紧急</Select.Option>
            </Select>

            <RangePicker
              placeholder={['开始日期', '结束日期']}
              value={filters.dateRange}
              onChange={(dates) => {
                setFilters({ ...filters, dateRange: dates });
                setPagination({ ...pagination, current: 1 });
              }}
            />

            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setFilters({
                  status: undefined,
                  priority: undefined,
                  search: '',
                  dateRange: null
                });
                setPagination({ ...pagination, current: 1 });
              }}
            >
              重置
            </Button>

            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/material-requirements/create')}
              >
                创建物料需求
              </Button>
            )}
          </Space>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={requirements}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1800 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            }
          }}
        />
      </Card>
    </div>
  );
};

export default MaterialRequirements;

