import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Alert,
  Spin,
  Progress,
  Tabs,
  Divider,
  Timeline,
  Empty
} from 'antd';
import {
  AppstoreOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ShoppingCartOutlined,
  ToolOutlined,
  RocketOutlined,
  FileTextOutlined,
  PlusOutlined,
  EyeOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { productionAPI, materialRequirementsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import GreetingWidget from '../components/dashboards/GreetingWidget';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

const PlannerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    production: null,
    material: null
  });
  const [productionOrders, setProductionOrders] = useState([]);
  const [materialRequirements, setMaterialRequirements] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProductionStats(),
        fetchMaterialStats(),
        fetchRecentProductionOrders(),
        fetchRecentMaterialRequirements()
      ]);
    } catch (error) {
      console.error('加载Dashboard数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取生产统计
  const fetchProductionStats = async () => {
    try {
      const response = await productionAPI.getStatistics();
      setStats(prev => ({ ...prev, production: response.data.data }));
    } catch (error) {
      console.error('获取生产统计失败:', error);
    }
  };

  // 获取物料需求统计
  const fetchMaterialStats = async () => {
    try {
      const response = await materialRequirementsAPI.getStats();
      setStats(prev => ({ ...prev, material: response.data.data }));
    } catch (error) {
      console.error('获取物料需求统计失败:', error);
    }
  };

  // 获取最近的生产订单
  const fetchRecentProductionOrders = async () => {
    try {
      const response = await productionAPI.getAll({
        page: 1,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setProductionOrders(response.data.data || []);
    } catch (error) {
      console.error('获取生产订单失败:', error);
    }
  };

  // 获取最近的物料需求
  const fetchRecentMaterialRequirements = async () => {
    try {
      const response = await materialRequirementsAPI.getAll({
        page: 1,
        limit: 5
      });
      setMaterialRequirements(response.data.data || []);
    } catch (error) {
      console.error('获取物料需求失败:', error);
    }
  };

  // 生产订单表格列
  const productionColumns = [
    {
      title: '订单号',
      dataIndex: 'productionOrderNumber',
      key: 'productionOrderNumber',
      width: 150,
      render: (text) => <strong style={{ color: '#ff6a00' }}>{text}</strong>
    },
    {
      title: '客户/项目',
      key: 'project',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{record.orderSnapshot?.clientName}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {record.orderSnapshot?.projectName}
          </div>
        </div>
      )
    },
    {
      title: '物料状态',
      dataIndex: 'material_readiness_status',
      key: 'material_readiness_status',
      width: 130,
      render: (status) => {
        const colorMap = {
          '待分析': 'default',
          '部分可用': 'warning',
          '全部可用(齐套)': 'success',
          '采购延迟': 'error'
        };
        const iconMap = {
          '待分析': '⏳',
          '部分可用': '⚠️',
          '全部可用(齐套)': '✅',
          '采购延迟': '🔴'
        };
        return (
          <Tag color={colorMap[status] || 'default'}>
            {iconMap[status]} {status || '待分析'}
          </Tag>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colorMap = {
          'Pending': 'default',
          'Scheduled': 'cyan',
          'In Production': 'processing',
          'Completed': 'success'
        };
        const nameMap = {
          'Pending': '待生产',
          'Scheduled': '已排期',
          'In Production': '生产中',
          'Completed': '已完成'
        };
        return <Tag color={colorMap[status]}>{nameMap[status] || status}</Tag>;
      }
    },
    {
      title: '进度',
      key: 'progress',
      width: 120,
      render: (_, record) => (
        <Progress
          percent={record.progress?.overall_percentage || 0}
          size="small"
          status={record.progress?.overall_percentage === 100 ? 'success' : 'active'}
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/production/${record._id}`)}
          >
            查看
          </Button>
        </Space>
      )
    }
  ];

  // 物料需求表格列
  const materialColumns = [
    {
      title: '需求编号',
      dataIndex: 'requirement_number',
      key: 'requirement_number',
      width: 140,
      render: (text) => <strong style={{ color: '#1890ff' }}>{text}</strong>
    },
    {
      title: '关联生产订单',
      key: 'production_order',
      width: 150,
      render: (_, record) => (
        <span>{record.production_order_snapshot?.order_number || '-'}</span>
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
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority) => {
        const colorMap = {
          'Low': 'default',
          'Normal': 'blue',
          'High': 'orange',
          'Urgent': 'red'
        };
        const nameMap = {
          'Low': '低',
          'Normal': '正常',
          'High': '高',
          'Urgent': '紧急'
        };
        return <Tag color={colorMap[priority]}>{nameMap[priority]}</Tag>;
      }
    },
    {
      title: '物料项目',
      key: 'items',
      width: 100,
      render: (_, record) => (
        <span>
          {record.statistics?.completed_items || 0} / {record.statistics?.total_items || 0}
        </span>
      )
    },
    {
      title: '要求到货',
      dataIndex: 'required_delivery_date',
      key: 'required_delivery_date',
      width: 110,
      render: (date) => {
        const deliveryDate = dayjs(date);
        const isOverdue = deliveryDate.isBefore(dayjs());
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : '#52c41a' }}>
            {deliveryDate.format('YYYY-MM-DD')}
          </span>
        );
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
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
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div>
      {/* 动态问候语 */}
      <GreetingWidget />

      {/* 快速操作 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large" wrap>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate('/material-requirements/create')}
          >
            创建物料需求
          </Button>
          <Button
            size="large"
            icon={<AppstoreOutlined />}
            onClick={() => navigate('/production-schedule')}
          >
            生产排期
          </Button>
          <Button
            size="large"
            icon={<FileTextOutlined />}
            onClick={() => navigate('/material-requirements')}
          >
            物料需求列表
          </Button>
          <Button
            size="large"
            icon={<ShoppingCartOutlined />}
            onClick={() => navigate('/purchase-orders')}
          >
            查看采购订单
          </Button>
        </Space>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="生产订单总数"
              value={stats.production?.totalOrders || 0}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待生产订单"
              value={stats.production?.ordersByStatus?.pending || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="物料需求（草稿）"
              value={stats.material?.statusCounts?.草稿 || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待采购物料"
              value={stats.material?.statusCounts?.已提交 || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 紧急和预警信息 */}
      {(stats.material?.urgentRequirements > 0 || stats.material?.upcomingRequirements > 0) && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {stats.material?.urgentRequirements > 0 && (
            <Col xs={24} md={12}>
              <Alert
                message="紧急物料需求"
                description={`有 ${stats.material.urgentRequirements} 个紧急物料需求需要处理`}
                type="error"
                showIcon
                icon={<WarningOutlined />}
                action={
                  <Button
                    size="small"
                    danger
                    onClick={() => navigate('/material-requirements?priority=Urgent')}
                  >
                    查看
                  </Button>
                }
              />
            </Col>
          )}
          {stats.material?.upcomingRequirements > 0 && (
            <Col xs={24} md={12}>
              <Alert
                message="即将到期"
                description={`有 ${stats.material.upcomingRequirements} 个物料需求将在7天内到期`}
                type="warning"
                showIcon
                icon={<ClockCircleOutlined />}
                action={
                  <Button
                    size="small"
                    onClick={() => navigate('/material-requirements?deadline=upcoming')}
                  >
                    查看
                  </Button>
                }
              />
            </Col>
          )}
        </Row>
      )}

      {/* 标签页：生产订单 / 物料需求 */}
      <Tabs defaultActiveKey="production" size="large">
        <TabPane
          tab={
            <span>
              <ToolOutlined />
              最近生产订单
            </span>
          }
          key="production"
        >
          <Card>
            <Table
              columns={productionColumns}
              dataSource={productionOrders}
              rowKey="_id"
              pagination={false}
              scroll={{ x: 1000 }}
              locale={{
                emptyText: (
                  <Empty
                    description="暂无生产订单"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )
              }}
            />
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button
                type="link"
                onClick={() => navigate('/production-schedule')}
              >
                查看全部生产订单 →
              </Button>
            </div>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <FileTextOutlined />
              物料需求
            </span>
          }
          key="material"
        >
          <Card>
            <Table
              columns={materialColumns}
              dataSource={materialRequirements}
              rowKey="_id"
              pagination={false}
              scroll={{ x: 1000 }}
              locale={{
                emptyText: (
                  <Empty
                    description="暂无物料需求"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )
              }}
            />
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button
                type="link"
                onClick={() => navigate('/material-requirements')}
              >
                查看全部物料需求 →
              </Button>
            </div>
          </Card>
        </TabPane>
      </Tabs>

      {/* 物料齐套状态概览 */}
      {stats.production && (
        <Card
          title={
            <span>
              <ThunderboltOutlined style={{ marginRight: 8 }} />
              物料齐套状态概览
            </span>
          }
          style={{ marginTop: 24 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Card type="inner">
                <Statistic
                  title="✅ 全部可用(齐套)"
                  value={stats.production.materialReadiness?.全部可用 || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card type="inner">
                <Statistic
                  title="⚠️ 部分可用"
                  value={stats.production.materialReadiness?.部分可用 || 0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card type="inner">
                <Statistic
                  title="🔴 采购延迟"
                  value={stats.production.materialReadiness?.采购延迟 || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card type="inner">
                <Statistic
                  title="⏳ 待分析"
                  value={stats.production.materialReadiness?.待分析 || 0}
                  valueStyle={{ color: '#8c8c8c' }}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default PlannerDashboard;

