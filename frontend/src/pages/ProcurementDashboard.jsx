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
  Spin,
  Badge,
  List,
  Empty,
  message,
  Typography
} from 'antd';
import {
  ShoppingCartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  DollarOutlined,
  TruckOutlined,
  PlusOutlined,
  BellOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  RightOutlined
} from '@ant-design/icons';
import { materialRequirementsAPI, purchaseOrdersAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import GreetingWidget from '../components/dashboards/GreetingWidget';
import dayjs from 'dayjs';

const ProcurementDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    material: null,
    purchase: null
  });
  const [pendingRequirements, setPendingRequirements] = useState([]);
  const [myRequirements, setMyRequirements] = useState([]);
  const [recentPurchaseOrders, setRecentPurchaseOrders] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMaterialStats(),
        fetchPurchaseStats(),
        fetchPendingRequirements(),
        fetchMyRequirements(),
        fetchRecentPurchaseOrders()
      ]);
    } catch (error) {
      console.error('加载Dashboard数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialStats = async () => {
    try {
      const response = await materialRequirementsAPI.getStats();
      setStats(prev => ({ ...prev, material: response.data.data }));
    } catch (error) {
      console.error('获取物料需求统计失败:', error);
    }
  };

  const fetchPurchaseStats = async () => {
    try {
      const response = await purchaseOrdersAPI.getStats();
      setStats(prev => ({ ...prev, purchase: response.data.data }));
    } catch (error) {
      console.error('获取采购订单统计失败:', error);
    }
  };

  const fetchPendingRequirements = async () => {
    try {
      const response = await materialRequirementsAPI.getAll({
        status: '已提交',
        page: 1,
        limit: 5
      });
      setPendingRequirements(response.data.data || []);
    } catch (error) {
      console.error('获取待处理需求失败:', error);
    }
  };

  const fetchMyRequirements = async () => {
    try {
      const response = await materialRequirementsAPI.getAll({
        assigned_to: user._id,
        status: '采购中',
        page: 1,
        limit: 5
      });
      setMyRequirements(response.data.data || []);
    } catch (error) {
      console.error('获取我的需求失败:', error);
    }
  };

  const fetchRecentPurchaseOrders = async () => {
    try {
      const response = await purchaseOrdersAPI.getAll({
        page: 1,
        limit: 5
      });
      setRecentPurchaseOrders(response.data.data || []);
    } catch (error) {
      console.error('获取采购订单失败:', error);
    }
  };

  const handleAcceptRequirement = async (requirementId) => {
    try {
      await materialRequirementsAPI.accept(requirementId);
      message.success('接单成功');
      fetchDashboardData();
    } catch (error) {
      message.error('接单失败: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* 动态问候语 */}
      <GreetingWidget />

      {/* 🎯 顶部统计卡片区 - 6个核心指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable>
            <Statistic
              title="待接单需求"
              value={stats.material?.pendingForProcurement || 0}
              prefix={<BellOutlined style={{ color: '#f5222d' }} />}
              suffix="个"
              valueStyle={{ color: stats.material?.pendingForProcurement > 0 ? '#f5222d' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable>
            <Statistic
              title="我负责的需求"
              value={stats.material?.myRequirements || 0}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              suffix="个"
              valueStyle={{ color: stats.material?.myRequirements > 0 ? '#1890ff' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable>
            <Statistic
              title="紧急物料需求"
              value={stats.material?.urgentRequirements || 0}
              prefix={<WarningOutlined style={{ color: '#fa8c16' }} />}
              suffix="个"
              valueStyle={{ color: stats.material?.urgentRequirements > 0 ? '#fa8c16' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable>
            <Statistic
              title="执行中订单"
              value={stats.purchase?.statusCounts?.executing || 0}
              prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
              suffix="个"
              valueStyle={{ color: stats.purchase?.statusCounts?.executing > 0 ? '#722ed1' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable>
            <Statistic
              title="本月采购订单"
              value={stats.purchase?.total || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#13c2c2' }} />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card hoverable>
            <Statistic
              title="本月采购金额"
              value={(stats.purchase?.totalAmount || 0) / 10000}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="万元"
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ⚡ 快捷操作区 */}
      <Card 
        title={<><ThunderboltOutlined /> 快捷操作</>}
        style={{ marginBottom: 24 }}
      >
        <Space size="middle" wrap>
          <Button 
            type="primary" 
            icon={<BellOutlined />}
            onClick={() => navigate('/material-requirements?status=已提交')}
          >
            待接单需求
          </Button>
          <Button 
            icon={<FileTextOutlined />}
            onClick={() => navigate('/material-requirements?assigned_to=me')}
          >
            我的需求
          </Button>
          <Button 
            type="primary"
            danger={stats.material?.urgentRequirements > 0}
            icon={<WarningOutlined />}
            onClick={() => navigate('/material-requirements?priority=Urgent')}
          >
            紧急需求
          </Button>
          <Button 
            icon={<PlusOutlined />}
            onClick={() => navigate('/purchase-orders/create')}
          >
            创建采购订单
          </Button>
          <Button 
            icon={<ShoppingCartOutlined />}
            onClick={() => navigate('/purchase-orders')}
          >
            所有订单
          </Button>
          <Button 
            icon={<TeamOutlined />}
            onClick={() => navigate('/suppliers')}
          >
            供应商管理
          </Button>
        </Space>
      </Card>

      {/* 📋 任务提醒中心 */}
      <Card 
        title={<><BellOutlined /> 任务提醒中心</>}
        extra={<Badge count={
          (stats.material?.pendingForProcurement || 0) + 
          (stats.material?.urgentRequirements || 0) + 
          (stats.material?.upcomingRequirements || 0)
        } />}
        style={{ marginBottom: 24 }}
      >
        <List
          dataSource={[
            stats.material?.pendingForProcurement > 0 && {
              icon: <BellOutlined style={{ color: '#f5222d' }} />,
              title: `待接单需求`,
              description: `您有 ${stats.material.pendingForProcurement} 个物料需求等待接单处理`,
              action: () => navigate('/material-requirements?status=已提交')
            },
            stats.material?.urgentRequirements > 0 && {
              icon: <WarningOutlined style={{ color: '#fa8c16' }} />,
              title: `紧急物料需求`,
              description: `您有 ${stats.material.urgentRequirements} 个紧急物料需求需要立即处理`,
              action: () => navigate('/material-requirements?priority=Urgent')
            },
            stats.material?.upcomingRequirements > 0 && {
              icon: <ClockCircleOutlined style={{ color: '#1890ff' }} />,
              title: `即将到期`,
              description: `有 ${stats.material.upcomingRequirements} 个物料需求将在7天内到期`,
              action: () => navigate('/material-requirements?deadline=upcoming')
            }
          ].filter(Boolean)}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button 
                  type="link" 
                  onClick={item.action}
                  icon={<RightOutlined />}
                >
                  立即处理
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={item.icon}
                title={item.title}
                description={item.description}
              />
            </List.Item>
          )}
          locale={{
            emptyText: (
              <Empty 
                description="太棒了！所有任务已完成"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              </Empty>
            )
          }}
        />
      </Card>

      {/* 📋 待接单需求列表 */}
      {pendingRequirements.length > 0 && (
        <Card 
          title={<>📋 待接单需求</>}
          extra={<Badge count={pendingRequirements.length} />}
          style={{ marginBottom: 24 }}
        >
          <List
            dataSource={pendingRequirements}
            renderItem={(item) => {
              const daysUntil = dayjs(item.required_delivery_date).diff(dayjs(), 'days');
              const isUrgent = daysUntil <= 3 || item.priority === 'Urgent';
              
              return (
                <List.Item
                  actions={[
                    <Button 
                      type="primary" 
                      size="small"
                      onClick={() => handleAcceptRequirement(item._id)}
                    >
                      接单
                    </Button>,
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => navigate(`/material-requirements/${item._id}`)}
                    >
                      查看
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <strong style={{ color: isUrgent ? '#f5222d' : '#1890ff' }}>
                          {item.requirement_number}
                        </strong>
                        {isUrgent && <Tag color="red">紧急</Tag>}
                        <Tag color={
                          item.priority === 'Urgent' ? 'red' :
                          item.priority === 'High' ? 'orange' :
                          item.priority === 'Normal' ? 'blue' : 'default'
                        }>
                          {item.priority === 'Urgent' ? '紧急' :
                           item.priority === 'High' ? '高' :
                           item.priority === 'Normal' ? '正常' : '低'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        <span>
                          项目：{item.production_order_snapshot?.client_name} - {item.production_order_snapshot?.project_name}
                        </span>
                        <Space>
                          <span>物料数：{item.statistics?.total_items || 0} 项</span>
                          <span>预估金额：¥{(item.statistics?.total_estimated_amount || 0).toLocaleString()}</span>
                          <span style={{ color: isUrgent ? '#f5222d' : '#52c41a' }}>
                            要求到货：{dayjs(item.required_delivery_date).format('YYYY-MM-DD')}
                            {isUrgent && ' 🔥'}
                          </span>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button type="link" onClick={() => navigate('/material-requirements?status=已提交')}>
              查看全部待接单需求 →
            </Button>
          </div>
        </Card>
      )}

      {/* 📋 我负责的需求 */}
      {myRequirements.length > 0 && (
        <Card 
          title={<>📋 我负责的需求</>}
          extra={<Badge count={myRequirements.length} />}
          style={{ marginBottom: 24 }}
        >
          <List
            dataSource={myRequirements}
            renderItem={(item) => {
              const completed = item.statistics?.completed_items || 0;
              const total = item.statistics?.total_items || 0;
              const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
              
              return (
                <List.Item
                  actions={[
                    <Button 
                      type="primary" 
                      size="small"
                      onClick={() => navigate(`/material-requirements/${item._id}`)}
                    >
                      处理
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <strong style={{ color: '#1890ff' }}>
                          {item.requirement_number}
                        </strong>
                        <Tag color="processing">采购中</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        <span>
                          项目：{item.production_order_snapshot?.client_name} - {item.production_order_snapshot?.project_name}
                        </span>
                        <Space>
                          <span>进度：{completed}/{total} ({percentage}%)</span>
                          <span>要求到货：{dayjs(item.required_delivery_date).format('YYYY-MM-DD')}</span>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button type="link" onClick={() => navigate('/material-requirements?assigned_to=me')}>
              查看我的全部需求 →
            </Button>
          </div>
        </Card>
      )}

      {/* 📋 最近采购订单 */}
      <Card 
        title={<>📋 最近采购订单</>}
        extra={
          <Button 
            type="link" 
            onClick={() => navigate('/purchase-orders')}
          >
            查看全部 →
          </Button>
        }
      >
        {recentPurchaseOrders.length > 0 ? (
          <List
            dataSource={recentPurchaseOrders}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => navigate(`/purchase-orders/${item._id}`)}
                  >
                    查看详情
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <strong style={{ color: '#1890ff' }}>
                        {item.order_number}
                      </strong>
                      <Tag color={
                        item.status.includes('已收货') ? 'success' :
                        item.status.includes('已发货') ? 'purple' :
                        item.status.includes('执行中') ? 'processing' :
                        'default'
                      }>
                        {item.status.replace(/\s*\(.*?\)\s*/g, '')}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <span>供应商：{item.supplier_id?.name || '-'}</span>
                      <Space>
                        <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                          ¥{(item.total_amount || 0).toLocaleString()}
                        </span>
                        <span>
                          预计交货：{item.expected_delivery_date ? dayjs(item.expected_delivery_date).format('YYYY-MM-DD') : '-'}
                        </span>
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无采购订单" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* 📖 采购工作流程 */}
      <Card 
        title="🛒 采购工作流程"
        style={{ marginTop: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Space direction="vertical">
              <Typography.Title level={5}>
                <span style={{ color: '#1890ff' }}>1.</span> 创建项目并指派
              </Typography.Title>
              <Typography.Text type="secondary">
                接收生产计划员提交订单需求后，确认需求后接单。
              </Typography.Text>
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Space direction="vertical">
              <Typography.Title level={5}>
                <span style={{ color: '#fa8c16' }}>2.</span> 询价阶段
              </Typography.Title>
              <Typography.Text type="secondary">
                联系供应商进行询价比价，选择最优报价方案。
              </Typography.Text>
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Space direction="vertical">
              <Typography.Title level={5}>
                <span style={{ color: '#52c41a' }}>3.</span> 单赢阶段
              </Typography.Title>
              <Typography.Text type="secondary">
                创建采购订单，确认交货期和付款条款。
              </Typography.Text>
            </Space>
          </Col>
          <Col xs={24} md={6}>
            <Space direction="vertical">
              <Typography.Title level={5}>
                <span style={{ color: '#722ed1' }}>4.</span> 逐步生产
              </Typography.Title>
              <Typography.Text type="secondary">
                确认物流，确认到货，更新库存状态。
              </Typography.Text>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ProcurementDashboard;
