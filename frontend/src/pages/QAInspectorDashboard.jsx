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
  Typography,
  Progress
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  FileSearchOutlined,
  WarningOutlined,
  TrophyOutlined,
  RightOutlined,
  PlayCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import GreetingWidget from '../components/dashboards/GreetingWidget';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const QAInspectorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    passed: 0,
    failed: 0,
    passRate: 0
  });
  const [pendingTasks, setPendingTasks] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [recentCompleted, setRecentCompleted] = useState([]);

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
        fetchRecentCompleted()
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
      const response = await api.get('/quality-checks/stats');
      if (response.data && Array.isArray(response.data)) {
        // 计算统计数据
        let pending = 0, inProgress = 0, completed = 0, passed = 0, failed = 0;
        
        response.data.forEach(stat => {
          pending += stat.pending || 0;
          inProgress += stat.inProgress || 0;
          const completedCount = (stat.passed || 0) + (stat.failed || 0);
          completed += completedCount;
          passed += stat.passed || 0;
          failed += stat.failed || 0;
        });

        const passRate = completed > 0 ? ((passed / completed) * 100).toFixed(1) : 0;

        setStats({
          pending,
          inProgress,
          completed,
          passed,
          failed,
          passRate: parseFloat(passRate)
        });
      }
    } catch (error) {
      console.error('获取质检统计失败:', error);
    }
  };

  const fetchPendingTasks = async () => {
    try {
      const response = await api.get('/quality-checks', {
        params: { status: 'Pending', limit: 5 }
      });
      setPendingTasks(response.data || []);
    } catch (error) {
      console.error('获取待检验任务失败:', error);
    }
  };

  const fetchInProgressTasks = async () => {
    try {
      const response = await api.get('/quality-checks', {
        params: { status: 'In Progress', limit: 5 }
      });
      setInProgressTasks(response.data || []);
    } catch (error) {
      console.error('获取进行中任务失败:', error);
    }
  };

  const fetchRecentCompleted = async () => {
    try {
      const response = await api.get('/quality-checks', {
        params: { status: 'Completed', limit: 5 }
      });
      setRecentCompleted(response.data || []);
    } catch (error) {
      console.error('获取已完成任务失败:', error);
    }
  };

  const handleStartInspection = async (checkId) => {
    try {
      await api.post(`/quality-checks/${checkId}/start`);
      message.success('已开始检验');
      navigate(`/quality/inspect/${checkId}`);
    } catch (error) {
      message.error('开始检验失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleViewDetails = (checkId) => {
    navigate(`/quality/inspect/${checkId}`);
  };

  const getCheckTypeTag = (type) => {
    const typeMap = {
      'IQC': { color: 'blue', text: 'IQC-来料检验' },
      'IPQC': { color: 'cyan', text: 'IPQC-过程检验' },
      'FQC': { color: 'green', text: 'FQC-成品检验' },
      'OQC': { color: 'orange', text: 'OQC-出货检验' }
    };
    const config = typeMap[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getResultTag = (result) => {
    if (result === 'Pass') {
      return <Tag icon={<CheckCircleOutlined />} color="success">合格</Tag>;
    } else if (result === 'Fail') {
      return <Tag icon={<CloseCircleOutlined />} color="error">不合格</Tag>;
    }
    return <Tag>-</Tag>;
  };

  const pendingColumns = [
    {
      title: '检验单号',
      dataIndex: 'checkNumber',
      key: 'checkNumber',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '检验类型',
      dataIndex: 'checkType',
      key: 'checkType',
      render: (type) => getCheckTypeTag(type)
    },
    {
      title: '来源单号',
      dataIndex: ['sourceDocument', 'number'],
      key: 'sourceNumber'
    },
    {
      title: '待检数量',
      key: 'quantity',
      render: (_, record) => {
        const total = record.itemsToCheck?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        return total;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => handleStartInspection(record._id)}
        >
          开始检验
        </Button>
      )
    }
  ];

  const completedColumns = [
    {
      title: '检验单号',
      dataIndex: 'checkNumber',
      key: 'checkNumber',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '检验类型',
      dataIndex: 'checkType',
      key: 'checkType',
      render: (type) => getCheckTypeTag(type)
    },
    {
      title: '检验结果',
      dataIndex: 'overallResult',
      key: 'overallResult',
      render: (result) => getResultTag(result)
    },
    {
      title: '缺陷数',
      dataIndex: 'defectCount',
      key: 'defectCount',
      render: (count) => count > 0 ? <Badge count={count} /> : '-'
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date) => date ? dayjs(date).format('MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record._id)}
        >
          查看详情
        </Button>
      )
    }
  ];

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
          <Card hoverable>
            <Statistic
              title="待检验任务"
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
              title="进行中任务"
              value={stats.inProgress}
              prefix={<SyncOutlined spin style={{ color: '#1890ff' }} />}
              suffix="个"
              valueStyle={{ color: stats.inProgress > 0 ? '#1890ff' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="已完成任务"
              value={stats.completed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="合格率"
              value={stats.passRate}
              prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
              suffix="%"
              precision={1}
              valueStyle={{ color: stats.passRate >= 95 ? '#52c41a' : stats.passRate >= 85 ? '#faad14' : '#ff4d4f' }}
            />
            <Progress
              percent={stats.passRate}
              showInfo={false}
              strokeColor={stats.passRate >= 95 ? '#52c41a' : stats.passRate >= 85 ? '#faad14' : '#ff4d4f'}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 质检结果统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="合格数"
              value={stats.passed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic
              title="不合格数"
              value={stats.failed}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 待检验任务列表 */}
      <Card
        title={
          <Space>
            <ClockCircleOutlined style={{ color: '#faad14' }} />
            <span>待检验任务</span>
            <Badge count={stats.pending} />
          </Space>
        }
        extra={
          <Button
            type="link"
            icon={<RightOutlined />}
            onClick={() => navigate('/quality-management')}
          >
            查看全部
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        {pendingTasks.length > 0 ? (
          <Table
            dataSource={pendingTasks}
            columns={pendingColumns}
            rowKey="_id"
            pagination={false}
            size="small"
          />
        ) : (
          <Empty description="暂无待检验任务" />
        )}
      </Card>

      {/* 进行中任务列表 */}
      {inProgressTasks.length > 0 && (
        <Card
          title={
            <Space>
              <SyncOutlined spin style={{ color: '#1890ff' }} />
              <span>进行中任务</span>
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
                    type="link"
                    onClick={() => handleViewDetails(item._id)}
                  >
                    继续检验
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<SafetyOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                  title={
                    <Space>
                      <Text strong>{item.checkNumber}</Text>
                      {getCheckTypeTag(item.checkType)}
                    </Space>
                  }
                  description={`来源单号: ${item.sourceDocument?.number || '-'}`}
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* 最近完成任务 */}
      <Card
        title={
          <Space>
            <FileSearchOutlined style={{ color: '#52c41a' }} />
            <span>最近完成</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {recentCompleted.length > 0 ? (
          <Table
            dataSource={recentCompleted}
            columns={completedColumns}
            rowKey="_id"
            pagination={false}
            size="small"
          />
        ) : (
          <Empty description="暂无已完成任务" />
        )}
      </Card>

      {/* 质检员工作流程 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Title level={5} style={{ color: '#1890ff', marginBottom: 8 }}>
              1. 接收检验任务
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              系统自动分配检验任务，或手动接收待检验任务。查看检验单号、来源单据、待检物料等信息。
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Title level={5} style={{ color: '#52c41a', marginBottom: 8 }}>
              2. 执行质量检验
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              按照检验标准进行IQC来料检验、IPQC过程检验、FQC成品检验或OQC出货检验。记录检验数据和缺陷信息。
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Title level={5} style={{ color: '#722ed1', marginBottom: 8 }}>
              3. 判定检验结果
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              根据检验标准和实测数据，判定产品质量是否合格。对不合格品进行分类标记，填写缺陷描述。
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Title level={5} style={{ color: '#fa8c16', marginBottom: 8 }}>
              4. 提交检验报告
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              完成检验后提交报告，系统自动更新合格率统计。合格品流转至下一环节，不合格品进入异常处理流程。
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default QAInspectorDashboard;

