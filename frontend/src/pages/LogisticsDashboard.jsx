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
  List,
  Empty,
  message,
  Typography,
  Badge,
  Progress
} from 'antd';
import {
  CarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TruckOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  RightOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { deliveryNotesAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import GreetingWidget from '../components/dashboards/GreetingWidget';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const LogisticsDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    shipped: 0,
    total: 0,
    onTimeRate: 0
  });
  const [pendingTasks, setPendingTasks] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [recentShipped, setRecentShipped] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchPendingTasks(),
        fetchInProgressTasks(),
        fetchRecentShipped()
      ]);
    } catch (error) {
      console.error('加载Dashboard数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await deliveryNotesAPI.getMyTasks({});
      const data = response.data.data || [];
      const statistics = response.data.statistics || {};
      
      setStats({
        pending: statistics.pending || 0,
        inProgress: statistics.inProgress || 0,
        shipped: statistics.shipped || 0,
        total: statistics.total || 0,
        onTimeRate: statistics.onTimeRate || 100
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const fetchPendingTasks = async () => {
    try {
      const response = await deliveryNotesAPI.getMyTasks({ 
        status: 'Pending',
        limit: 5 
      });
      setPendingTasks(response.data.data || []);
    } catch (error) {
      console.error('获取待处理任务失败:', error);
    }
  };

  const fetchInProgressTasks = async () => {
    try {
      const response = await deliveryNotesAPI.getMyTasks({ 
        status: 'In Progress',
        limit: 5 
      });
      setInProgressTasks(response.data.data || []);
    } catch (error) {
      console.error('获取进行中任务失败:', error);
    }
  };

  const fetchRecentShipped = async () => {
    try {
      const response = await deliveryNotesAPI.getMyTasks({ 
        status: 'Shipped',
        limit: 5 
      });
      setRecentShipped(response.data.data || []);
    } catch (error) {
      console.error('获取已完成任务失败:', error);
    }
  };

  const handleStartShipment = (taskId) => {
    navigate(`/my-delivery-tasks`);
  };

  const handleViewDetails = (taskId) => {
    navigate(`/delivery-notes/${taskId}`);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'Pending': { color: 'orange', text: '待处理', icon: <ClockCircleOutlined /> },
      'In Progress': { color: 'blue', text: '进行中', icon: <CarOutlined /> },
      'Shipped': { color: 'green', text: '已发货', icon: <CheckCircleOutlined /> },
      'Cancelled': { color: 'red', text: '已取消', icon: <ExclamationCircleOutlined /> }
    };
    const config = statusMap[status] || statusMap['Pending'];
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
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

      {/* 统计卡片区 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/my-delivery-tasks')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="待发货任务"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              suffix="个"
              valueStyle={{ color: stats.pending > 0 ? '#faad14' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="配送中任务"
              value={stats.inProgress}
              prefix={<CarOutlined style={{ color: '#1890ff' }} />}
              suffix="个"
              valueStyle={{ color: stats.inProgress > 0 ? '#1890ff' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="已完成任务"
              value={stats.shipped}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="准时送达率"
              value={stats.onTimeRate}
              prefix={<RocketOutlined style={{ color: '#722ed1' }} />}
              suffix="%"
              precision={1}
              valueStyle={{ color: stats.onTimeRate >= 95 ? '#52c41a' : stats.onTimeRate >= 85 ? '#faad14' : '#ff4d4f' }}
            />
            <Progress
              percent={stats.onTimeRate}
              showInfo={false}
              strokeColor={stats.onTimeRate >= 95 ? '#52c41a' : stats.onTimeRate >= 85 ? '#faad14' : '#ff4d4f'}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 待发货任务列表 */}
      <Card
        title={
          <Space>
            <ClockCircleOutlined style={{ color: '#faad14' }} />
            <span>待发货任务</span>
            <Badge count={stats.pending} />
          </Space>
        }
        extra={
          <Button
            type="link"
            icon={<RightOutlined />}
            onClick={() => navigate('/my-delivery-tasks')}
          >
            查看全部
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        {pendingTasks.length > 0 ? (
          <List
            dataSource={pendingTasks}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button
                    type="primary"
                    size="small"
                    icon={<CarOutlined />}
                    onClick={() => handleStartShipment(item._id)}
                  >
                    开始发货
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<TruckOutlined style={{ fontSize: 24, color: '#faad14' }} />}
                  title={
                    <Space>
                      <Text strong>{item.noteNumber}</Text>
                      {getStatusTag(item.status)}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">项目：{item.projectSnapshot?.projectName || '未知'}</Text>
                      <Text type="secondary">
                        <EnvironmentOutlined /> {item.shippingAddress?.address || '未填写地址'}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无待发货任务" />
        )}
      </Card>

      {/* 配送中任务 */}
      {inProgressTasks.length > 0 && (
        <Card
          title={
            <Space>
              <CarOutlined style={{ color: '#1890ff' }} />
              <span>配送中任务</span>
              <Badge count={stats.inProgress} />
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <List
            dataSource={inProgressTasks}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button
                    size="small"
                    onClick={() => handleViewDetails(item._id)}
                  >
                    查看详情
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<CarOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                  title={
                    <Space>
                      <Text strong>{item.noteNumber}</Text>
                      {getStatusTag(item.status)}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">
                        物流：{item.logistics?.company} ({item.logistics?.trackingNumber})
                      </Text>
                      <Text type="secondary">
                        <EnvironmentOutlined /> {item.shippingAddress?.address}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* 最近完成 */}
      <Card
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>最近完成</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {recentShipped.length > 0 ? (
          <List
            dataSource={recentShipped}
            renderItem={item => (
              <List.Item
                actions={[
                  <Text type="secondary">{dayjs(item.logistics?.shippedAt).format('MM-DD HH:mm')}</Text>
                ]}
              >
                <List.Item.Meta
                  avatar={<CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
                  title={
                    <Space>
                      <Text strong>{item.noteNumber}</Text>
                      {getStatusTag(item.status)}
                    </Space>
                  }
                  description={
                    <Text type="secondary">
                      {item.projectSnapshot?.projectName} → {item.projectSnapshot?.clientName}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无已完成任务" />
        )}
      </Card>

      {/* 物流专员工作流程 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Title level={5} style={{ color: '#1890ff', marginBottom: 8 }}>
              1. 接收发货任务
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              接收生产计划员安排的发货任务。查看发货单信息、项目信息、客户信息和收货地址。
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Title level={5} style={{ color: '#52c41a', marginBottom: 8 }}>
              2. 安排物流配送
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              联系物流公司，填写物流信息包括运单号、车牌号、司机信息。确认发货时间和预计送达时间。
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Title level={5} style={{ color: '#722ed1', marginBottom: 8 }}>
              3. 跟踪配送进度
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              实时跟踪货物运输状态，与司机保持联系。及时更新物流动态，处理运输过程中的异常情况。
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Title level={5} style={{ color: '#fa8c16', marginBottom: 8 }}>
              4. 确认送达完成
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              确认货物送达客户，收集签收凭证。更新发货状态为已完成，系统自动通知相关人员。
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LogisticsDashboard;

