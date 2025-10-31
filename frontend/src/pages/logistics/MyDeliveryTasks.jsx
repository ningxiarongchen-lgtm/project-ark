import { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Button, Space, message, Modal, Form, Input, 
  Descriptions, Divider, Badge, Tabs, Select, DatePicker, Row, Col, Statistic
} from 'antd';
import {
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { deliveryNotesAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { TabPane } = Tabs;

/**
 * 物流专员 - 我的发货任务页面
 */
const MyDeliveryTasks = () => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyTasks();
  }, [activeTab]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const statusFilter = activeTab === 'all' ? null : activeTab === 'pending' ? 'Pending' : 'Shipped';
      const response = await deliveryNotesAPI.getMyTasks({ status: statusFilter });
      setTasks(response.data.data || []);
      setStatistics(response.data.statistics || {});
    } catch (error) {
      console.error('获取发货任务失败:', error);
      message.error('获取发货任务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStartShipment = (task) => {
    setSelectedTask(task);
    form.setFieldsValue({
      company: task.logistics?.company || '',
      trackingNumber: task.logistics?.trackingNumber || '',
      vehicleNumber: task.logistics?.vehicleNumber || '',
      driverName: task.logistics?.driverName || '',
      driverPhone: task.logistics?.driverPhone || '',
      notes: task.logistics?.notes || ''
    });
    setModalVisible(true);
  };

  const handleConfirmShipment = async () => {
    try {
      const values = await form.validateFields();
      setConfirming(true);
      
      await deliveryNotesAPI.confirmShipment(selectedTask._id, {
        logistics: values
      });
      
      message.success('发货确认成功！');
      setModalVisible(false);
      setSelectedTask(null);
      form.resetFields();
      fetchMyTasks();
    } catch (error) {
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      console.error('确认发货失败:', error);
      message.error(error.response?.data?.message || '确认发货失败');
    } finally {
      setConfirming(false);
    }
  };

  const handleViewDetails = (task) => {
    navigate(`/delivery-notes/${task._id}`);
  };

  const columns = [
    {
      title: '发货单号',
      dataIndex: 'noteNumber',
      key: 'noteNumber',
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '项目信息',
      key: 'project',
      width: 250,
      render: (_, record) => (
        <div>
          <div><strong>{record.projectSnapshot?.projectName || '未知项目'}</strong></div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {record.projectSnapshot?.projectNumber}
          </div>
        </div>
      )
    },
    {
      title: '客户信息',
      key: 'client',
      width: 200,
      render: (_, record) => (
        <div>
          <div>{record.projectSnapshot?.clientName || '未填写'}</div>
          {record.projectSnapshot?.clientPhone && (
            <div style={{ fontSize: '12px', color: '#999' }}>
              <PhoneOutlined /> {record.projectSnapshot.clientPhone}
            </div>
          )}
        </div>
      )
    },
    {
      title: '收货地址',
      dataIndex: ['shippingAddress', 'address'],
      key: 'address',
      width: 250,
      ellipsis: true,
      render: (text) => (
        <span>
          <EnvironmentOutlined /> {text || '未填写'}
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          'Pending': { color: 'orange', text: '待处理', icon: <ClockCircleOutlined /> },
          'In Progress': { color: 'blue', text: '进行中', icon: <CarOutlined /> },
          'Shipped': { color: 'green', text: '已发货', icon: <CheckCircleOutlined /> },
          'Cancelled': { color: 'red', text: '已取消', icon: <ExclamationCircleOutlined /> }
        };
        const config = statusMap[status] || statusMap['Pending'];
        return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'Pending' && (
            <Button 
              type="primary" 
              size="small"
              icon={<CarOutlined />}
              onClick={() => handleStartShipment(record)}
            >
              开始发货
            </Button>
          )}
          <Button 
            type="link" 
            size="small"
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title={
          <Space>
            <CarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>我的发货任务</span>
          </Space>
        }
        extra={
          <Button onClick={fetchMyTasks}>刷新</Button>
        }
      >
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="待处理"
                value={statistics.pending || 0}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="进行中"
                value={statistics.inProgress || 0}
                prefix={<CarOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已完成"
                value={statistics.shipped || 0}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总计"
                value={statistics.total || 0}
                prefix={<FileTextOutlined />}
                suffix="个"
              />
            </Card>
          </Col>
        </Row>

        {/* 任务列表 */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={<Badge count={statistics.pending || 0}><span>待处理</span></Badge>} 
            key="pending"
          >
            <Table
              columns={columns}
              dataSource={tasks.filter(t => t.status === 'Pending')}
              rowKey="_id"
              loading={loading}
              scroll={{ x: 1300 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          </TabPane>
          <TabPane tab="已完成" key="shipped">
            <Table
              columns={columns}
              dataSource={tasks.filter(t => t.status === 'Shipped')}
              rowKey="_id"
              loading={loading}
              scroll={{ x: 1300 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          </TabPane>
          <TabPane tab="全部" key="all">
            <Table
              columns={columns}
              dataSource={tasks}
              rowKey="_id"
              loading={loading}
              scroll={{ x: 1300 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 发货确认弹窗 */}
      <Modal
        title={
          <Space>
            <CarOutlined style={{ color: '#1890ff' }} />
            <span>确认发货</span>
          </Space>
        }
        open={modalVisible}
        onOk={handleConfirmShipment}
        onCancel={() => {
          setModalVisible(false);
          setSelectedTask(null);
          form.resetFields();
        }}
        confirmLoading={confirming}
        okText="确认发货"
        cancelText="取消"
        width={800}
      >
        {selectedTask && (
          <>
            <Descriptions title="发货单信息" column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="发货单号" span={2}>
                <Tag color="blue">{selectedTask.noteNumber}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="项目名称" span={2}>
                {selectedTask.projectSnapshot?.projectName}
              </Descriptions.Item>
              <Descriptions.Item label="客户名称">
                {selectedTask.projectSnapshot?.clientName}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {selectedTask.projectSnapshot?.clientPhone || '未填写'}
              </Descriptions.Item>
              <Descriptions.Item label="收货地址" span={2}>
                {selectedTask.shippingAddress?.address}
              </Descriptions.Item>
              <Descriptions.Item label="收货人">
                {selectedTask.shippingAddress?.recipient || '未填写'}
              </Descriptions.Item>
              <Descriptions.Item label="收货电话">
                {selectedTask.shippingAddress?.phone || '未填写'}
              </Descriptions.Item>
            </Descriptions>

            <Divider>物流信息填写</Divider>

            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="物流公司"
                    name="company"
                    rules={[{ required: true, message: '请输入物流公司名称' }]}
                  >
                    <Input placeholder="请输入物流公司名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="运单号"
                    name="trackingNumber"
                    rules={[{ required: true, message: '请输入运单号' }]}
                  >
                    <Input placeholder="请输入运单号" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="车牌号"
                    name="vehicleNumber"
                    rules={[{ required: true, message: '请输入车牌号' }]}
                  >
                    <Input placeholder="例如：京A12345" style={{ textTransform: 'uppercase' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="司机姓名"
                    name="driverName"
                  >
                    <Input placeholder="请输入司机姓名" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="司机电话"
                    name="driverPhone"
                    rules={[
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                    ]}
                  >
                    <Input placeholder="请输入司机联系电话" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="备注"
                name="notes"
              >
                <TextArea 
                  rows={3} 
                  placeholder="请输入发货相关备注信息"
                  maxLength={200}
                  showCount
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default MyDeliveryTasks;
