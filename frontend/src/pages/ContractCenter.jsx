/**
 * 合同管理中心
 * 使用 Ant Design 组件
 */

import React, { useState, useEffect } from 'react';
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
  Descriptions,
  Tabs,
  Statistic,
  Row,
  Col,
  Badge,
  Tooltip,
  Typography,
  Alert,
  Spin
} from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;
const { RangePicker } = DatePicker;

// 固定使用生产环境后端地址
const API_URL = 'https://project-ark-efy7.onrender.com/api';

const ContractCenter = () => {
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    underReview: 0,
    approved: 0,
    effective: 0,
    expired: 0
  });
  const [filters, setFilters] = useState({
    contractType: '',
    status: '',
    search: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // 加载合同数据
  useEffect(() => {
    fetchContracts();
    fetchStats();
  }, [filters]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/contracts`, {
        params: filters,
        withCredentials: true
      });
      
      if (response.data.success) {
        setContracts(response.data.data.contracts || []);
        setPagination({
          ...pagination,
          total: response.data.data.total || 0
        });
      }
    } catch (error) {
      console.error('获取合同列表失败:', error);
      message.error('获取合同列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/contracts/stats`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setStats(response.data.data || {});
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 合同状态映射
  const statusMap = {
    'Draft': { text: '草稿', color: 'default' },
    'Under Review': { text: '审批中', color: 'processing' },
    'Approved': { text: '已批准', color: 'success' },
    'Rejected': { text: '已驳回', color: 'error' },
    'Effective': { text: '生效中', color: 'success' },
    'Expired': { text: '已到期', color: 'warning' },
    'Terminated': { text: '已终止', color: 'default' }
  };

  // 合同类型映射
  const typeMap = {
    'Sales': { text: '销售合同', color: 'blue' },
    'Procurement': { text: '采购合同', color: 'green' },
    'Service': { text: '服务合同', color: 'orange' },
    'Framework': { text: '框架协议', color: 'purple' }
  };

  // 表格列定义
  const columns = [
    {
      title: '合同编号',
      dataIndex: 'contractNumber',
      key: 'contractNumber',
      width: 150,
      fixed: 'left',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '合同标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true
    },
    {
      title: '合同类型',
      dataIndex: 'contractType',
      key: 'contractType',
      width: 120,
      render: (type) => {
        const config = typeMap[type] || { text: type, color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const config = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '甲方',
      dataIndex: ['partyA', 'name'],
      key: 'partyA',
      width: 150,
      ellipsis: true
    },
    {
      title: '乙方',
      dataIndex: ['partyB', 'name'],
      key: 'partyB',
      width: 150,
      ellipsis: true
    },
    {
      title: '合同金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount) => `¥${amount?.toLocaleString() || 0}`
    },
    {
      title: '签订日期',
      dataIndex: 'signDate',
      key: 'signDate',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '生效日期',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '到期日期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="下载">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const handleView = (record) => {
    message.info(`查看合同: ${record.contractNumber}`);
    // TODO: 实现查看详情功能
  };

  const handleEdit = (record) => {
    message.info(`编辑合同: ${record.contractNumber}`);
    // TODO: 实现编辑功能
  };

  const handleDownload = (record) => {
    message.info(`下载合同: ${record.contractNumber}`);
    // TODO: 实现下载功能
  };

  const handleTableChange = (pagination) => {
    setFilters({
      ...filters,
      page: pagination.current,
      limit: pagination.pageSize
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <FileTextOutlined /> 合同管理中心
      </Title>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="合同总数"
              value={stats.total || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="草稿"
              value={stats.draft || 0}
              valueStyle={{ color: '#999' }}
              prefix={<EditOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
            <Card>
            <Statistic
              title="审批中"
              value={stats.underReview || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
            </Card>
        </Col>
        <Col span={4}>
            <Card>
            <Statistic
              title="已批准"
              value={stats.approved || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
            </Card>
        </Col>
        <Col span={4}>
            <Card>
            <Statistic
              title="生效中"
              value={stats.effective || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<DollarOutlined />}
            />
            </Card>
        </Col>
        <Col span={4}>
            <Card>
            <Statistic
              title="已到期"
              value={stats.expired || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleOutlined />}
            />
            </Card>
        </Col>
      </Row>

      {/* 提示信息 */}
      <Alert
        message="功能提示"
        description="此功能的实时提醒已集成到页面右上角的通知铃铛中 🔔。合同到期、审批等通知会实时推送。"
        type="info"
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />

      {/* 筛选和搜索 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Select
            placeholder="合同类型"
            style={{ width: 150 }}
            allowClear
            value={filters.contractType || undefined}
            onChange={(value) => setFilters({ ...filters, contractType: value || '' })}
          >
            <Select.Option value="Sales">销售合同</Select.Option>
            <Select.Option value="Procurement">采购合同</Select.Option>
            <Select.Option value="Service">服务合同</Select.Option>
            <Select.Option value="Framework">框架协议</Select.Option>
          </Select>

          <Select
            placeholder="合同状态"
            style={{ width: 150 }}
            allowClear
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value || '' })}
          >
            <Select.Option value="Draft">草稿</Select.Option>
            <Select.Option value="Under Review">审批中</Select.Option>
            <Select.Option value="Approved">已批准</Select.Option>
            <Select.Option value="Effective">生效中</Select.Option>
            <Select.Option value="Expired">已到期</Select.Option>
          </Select>

          <Search
            placeholder="搜索合同编号、标题"
            style={{ width: 250 }}
            onSearch={(value) => setFilters({ ...filters, search: value })}
            allowClear
          />

          <Button type="primary" icon={<PlusOutlined />}>
            新建合同
          </Button>
        </Space>
      </Card>

      {/* 合同列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={contracts}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1500 }}
        />
      </Card>
    </div>
  );
};

export default ContractCenter;
