import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Tag,
  message,
  Descriptions,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Timeline,
  Divider,
  Row,
  Col,
  Statistic,
  Alert,
  Spin,
  Popconfirm,
  Checkbox
} from 'antd';
import {
  FileTextOutlined,
  ArrowLeftOutlined,
  SendOutlined,
  CheckOutlined,
  ShoppingCartOutlined,
  HistoryOutlined,
  ToolOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  EditOutlined
} from '@ant-design/icons';
import { materialRequirementsAPI, suppliersAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import dayjs from 'dayjs';

const { TextArea } = Input;

const MaterialRequirementDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, hasAnyRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requirement, setRequirement] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  
  // Modal状态
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
  const [createPOModalVisible, setCreatePOModalVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Form实例
  const [followUpForm] = Form.useForm();
  const [poForm] = Form.useForm();

  // 权限检查
  const isPlanner = hasAnyRole(['Production Planner']);
  const isProcurement = hasAnyRole(['Procurement Specialist', 'Administrator']);
  const canSubmit = isPlanner && requirement?.status === '草稿' && requirement?.created_by?._id === user._id;
  const canAccept = isProcurement && requirement?.status === '已提交';
  const canProcess = isProcurement && requirement?.status === '采购中';

  useEffect(() => {
    fetchRequirementDetail();
    fetchSuppliers();
  }, [id]);

  // 获取物料需求详情
  const fetchRequirementDetail = async () => {
    setLoading(true);
    try {
      const response = await materialRequirementsAPI.getById(id);
      setRequirement(response.data.data);
    } catch (error) {
      message.error('获取物料需求详情失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 获取供应商列表
  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll({ status: 'active' });
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error('获取供应商列表失败:', error);
    }
  };

  // 提交物料需求
  const handleSubmit = async () => {
    try {
      await materialRequirementsAPI.submit(id);
      message.success('物料需求已成功提交给采购部门');
      fetchRequirementDetail();
    } catch (error) {
      message.error('提交失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 接单
  const handleAccept = async () => {
    try {
      await materialRequirementsAPI.accept(id);
      message.success('接单成功');
      fetchRequirementDetail();
    } catch (error) {
      message.error('接单失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 添加跟进记录
  const handleAddFollowUp = async () => {
    try {
      const values = await followUpForm.validateFields();
      await materialRequirementsAPI.addFollowUp(id, values);
      message.success('跟进记录添加成功');
      setFollowUpModalVisible(false);
      followUpForm.resetFields();
      fetchRequirementDetail();
    } catch (error) {
      if (error.errorFields) return; // 表单验证失败
      message.error('添加跟进记录失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 创建采购订单
  const handleCreatePurchaseOrder = async () => {
    try {
      if (selectedItems.length === 0) {
        message.warning('请至少选择一个物料项目');
        return;
      }
      
      const values = await poForm.validateFields();
      const data = {
        ...values,
        item_ids: selectedItems
      };
      
      await materialRequirementsAPI.createPurchaseOrder(id, data);
      message.success('采购订单创建成功');
      setCreatePOModalVisible(false);
      poForm.resetFields();
      setSelectedItems([]);
      fetchRequirementDetail();
    } catch (error) {
      if (error.errorFields) return; // 表单验证失败
      message.error('创建采购订单失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 物料项目表格列
  const itemColumns = [
    {
      title: '物料编码',
      dataIndex: 'material_code',
      key: 'material_code',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '物料名称',
      dataIndex: 'material_name',
      key: 'material_name',
      width: 200,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: '需求数量',
      dataIndex: 'purchase_quantity',
      key: 'purchase_quantity',
      width: 100,
      render: (qty, record) => `${qty} ${record.unit}`
    },
    {
      title: '预估单价',
      dataIndex: 'estimated_unit_price',
      key: 'estimated_unit_price',
      width: 100,
      align: 'right',
      render: (price) => price ? `¥${price.toLocaleString()}` : '-'
    },
    {
      title: '预估金额',
      dataIndex: 'estimated_amount',
      key: 'estimated_amount',
      width: 120,
      align: 'right',
      render: (amount) => (
        <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
          {amount ? `¥${amount.toLocaleString()}` : '-'}
        </span>
      )
    },
    {
      title: '采购状态',
      dataIndex: 'procurement_status',
      key: 'procurement_status',
      width: 100,
      render: (status) => {
        const colorMap = {
          '待采购': 'default',
          '已下单': 'processing',
          '部分到货': 'warning',
          '已到货': 'success',
          '已取消': 'error'
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      }
    },
    {
      title: '关联采购订单',
      dataIndex: 'purchase_order',
      key: 'purchase_order',
      width: 140,
      render: (po) => {
        if (!po) return '-';
        return (
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/purchase-orders/${po._id}`)}
          >
            {po.order_number}
          </Button>
        );
      }
    },
    {
      title: '需求日期',
      dataIndex: 'required_date',
      key: 'required_date',
      width: 110,
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      ellipsis: true,
      render: (text) => text || '-'
    }
  ];

  // 如果是采购专员且在处理状态，添加选择框列
  if (canProcess) {
    itemColumns.unshift({
      title: '选择',
      key: 'select',
      width: 60,
      fixed: 'left',
      render: (_, record) => {
        // 只能选择待采购的物料
        if (record.procurement_status !== '待采购') return null;
        return (
          <Checkbox
            checked={selectedItems.includes(record._id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedItems([...selectedItems, record._id]);
              } else {
                setSelectedItems(selectedItems.filter(id => id !== record._id));
              }
            }}
          />
        );
      }
    });
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!requirement) {
    return (
      <Alert
        message="物料需求不存在"
        type="error"
        showIcon
        action={
          <Button onClick={() => navigate('/material-requirements')}>
            返回列表
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 头部操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/material-requirements')}
            >
              返回列表
            </Button>
            <h2 style={{ margin: 0 }}>
              <FileTextOutlined style={{ marginRight: 8 }} />
              物料需求详情 - {requirement.requirement_number}
            </h2>
          </Space>
          
          <Space>
            {canSubmit && (
              <Popconfirm
                title="确认提交给采购部门？"
                description="提交后将无法修改，请确认信息无误"
                onConfirm={handleSubmit}
                okText="确认提交"
                cancelText="取消"
              >
                <Button type="primary" icon={<SendOutlined />}>
                  提交给采购部门
                </Button>
              </Popconfirm>
            )}
            
            {canAccept && (
              <Button type="primary" icon={<CheckOutlined />} onClick={handleAccept}>
                接单
              </Button>
            )}
            
            {canProcess && (
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={() => setCreatePOModalVisible(true)}
                disabled={selectedItems.length === 0}
              >
                创建采购订单 ({selectedItems.length})
              </Button>
            )}
            
            {(isProcurement || isPlanner) && (
              <Button
                icon={<EditOutlined />}
                onClick={() => setFollowUpModalVisible(true)}
              >
                添加跟进
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总物料项目"
              value={requirement.statistics?.total_items || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已完成项目"
              value={requirement.statistics?.completed_items || 0}
              prefix={<CheckOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待采购项目"
              value={requirement.statistics?.pending_items || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="预估总金额"
              value={(requirement.statistics?.total_estimated_amount || 0) / 10000}
              precision={2}
              suffix="万"
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 基本信息 */}
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
          <Descriptions.Item label="需求编号">
            <strong style={{ color: '#1890ff' }}>{requirement.requirement_number}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={
              requirement.status === '已完成' ? 'success' :
              requirement.status === '采购中' ? 'processing' :
              requirement.status === '草稿' ? 'default' : 'orange'
            }>
              {requirement.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="优先级">
            <Tag color={
              requirement.priority === 'Urgent' ? 'red' :
              requirement.priority === 'High' ? 'orange' :
              requirement.priority === 'Normal' ? 'blue' : 'default'
            }>
              {
                requirement.priority === 'Urgent' ? '紧急' :
                requirement.priority === 'High' ? '高' :
                requirement.priority === 'Normal' ? '正常' : '低'
              }
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="关联生产订单" span={2}>
            {requirement.production_order_snapshot?.order_number || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="销售订单">
            {requirement.production_order_snapshot?.sales_order_number || '-'}
          </Descriptions.Item>
          
          <Descriptions.Item label="客户" span={2}>
            {requirement.production_order_snapshot?.client?.name || requirement.production_order_snapshot?.client_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="项目名称">
            {requirement.production_order_snapshot?.projectName || requirement.production_order_snapshot?.project_name || '-'}
          </Descriptions.Item>
          
          <Descriptions.Item label="要求到货日期" span={2}>
            <Space>
              <CalendarOutlined />
              <span style={{ 
                color: dayjs(requirement.required_delivery_date).isBefore(dayjs()) ? '#ff4d4f' : '#52c41a',
                fontWeight: 'bold'
              }}>
                {dayjs(requirement.required_delivery_date).format('YYYY-MM-DD')}
              </span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="提交时间">
            {requirement.submitted_at ? dayjs(requirement.submitted_at).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          
          <Descriptions.Item label="创建人">
            <Space>
              <UserOutlined />
              {requirement.created_by?.full_name || '-'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="采购专员" span={2}>
            <Space>
              {requirement.assigned_to ? (
                <>
                  <UserOutlined />
                  {requirement.assigned_to.full_name}
                  {requirement.accepted_at && (
                    <span style={{ color: '#999', fontSize: '12px' }}>
                      (接单时间: {dayjs(requirement.accepted_at).format('YYYY-MM-DD HH:mm')})
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: '#999' }}>未指派</span>
              )}
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="需求说明" span={3}>
            {requirement.description || '-'}
          </Descriptions.Item>
          
          {requirement.urgent_reason && (
            <Descriptions.Item label="紧急原因" span={3}>
              <Alert
                message={requirement.urgent_reason}
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
              />
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 物料项目明细 */}
      <Card title="物料项目明细" style={{ marginBottom: 16 }}>
        {canProcess && requirement.items.some(item => item.procurement_status === '待采购') && (
          <Alert
            message="提示"
            description="请选择需要创建采购订单的物料项目，然后点击上方'创建采购订单'按钮"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Table
          columns={itemColumns}
          dataSource={requirement.items}
          rowKey="_id"
          pagination={false}
          scroll={{ x: 1500 }}
          summary={(pageData) => {
            const totalAmount = pageData.reduce((sum, item) => sum + (item.estimated_amount || 0), 0);
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={canProcess ? 6 : 5}>
                    <strong>合计</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <strong style={{ color: '#f5222d', fontSize: '16px' }}>
                      ¥{totalAmount.toLocaleString()}
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} colSpan={4} />
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>

      {/* 关联的采购订单 */}
      {requirement.purchase_orders && requirement.purchase_orders.length > 0 && (
        <Card title="关联的采购订单" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {requirement.purchase_orders.map((po) => (
              <Card
                key={po._id}
                size="small"
                type="inner"
                extra={
                  <Button
                    type="link"
                    onClick={() => navigate(`/purchase-orders/${po._id}`)}
                  >
                    查看详情 →
                  </Button>
                }
              >
                <Row gutter={16}>
                  <Col span={6}>
                    <strong>订单号:</strong> {po.order_number}
                  </Col>
                  <Col span={6}>
                    <strong>供应商:</strong> {po.supplier_id?.name || '-'}
                  </Col>
                  <Col span={6}>
                    <strong>金额:</strong>{' '}
                    <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                      ¥{(po.total_amount || 0).toLocaleString()}
                    </span>
                  </Col>
                  <Col span={6}>
                    <strong>状态:</strong> <Tag>{po.status}</Tag>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        </Card>
      )}

      {/* 跟进记录 */}
      <Card title={<><HistoryOutlined /> 跟进记录</>}>
        {requirement.follow_ups && requirement.follow_ups.length > 0 ? (
          <Timeline>
            {requirement.follow_ups.map((followUp, index) => (
              <Timeline.Item key={index} color={
                followUp.follow_up_type === '问题反馈' ? 'red' :
                followUp.follow_up_type === '状态更新' ? 'blue' : 'green'
              }>
                <div>
                  <strong>{followUp.user?.full_name || '未知用户'}</strong>
                  {' · '}
                  <Tag>{followUp.follow_up_type}</Tag>
                  {' · '}
                  <span style={{ color: '#999', fontSize: '12px' }}>
                    {dayjs(followUp.timestamp).format('YYYY-MM-DD HH:mm')}
                  </span>
                </div>
                <div style={{ marginTop: 8 }}>
                  {followUp.content}
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Alert
            message="暂无跟进记录"
            type="info"
            showIcon
          />
        )}
      </Card>

      {/* 添加跟进Modal */}
      <Modal
        title="添加跟进记录"
        open={followUpModalVisible}
        onOk={handleAddFollowUp}
        onCancel={() => {
          setFollowUpModalVisible(false);
          followUpForm.resetFields();
        }}
        okText="提交"
        cancelText="取消"
      >
        <Form form={followUpForm} layout="vertical">
          <Form.Item
            label="跟进类型"
            name="follow_up_type"
            rules={[{ required: true, message: '请选择跟进类型' }]}
          >
            <Select>
              <Select.Option value="状态更新">状态更新</Select.Option>
              <Select.Option value="价格确认">价格确认</Select.Option>
              <Select.Option value="交期确认">交期确认</Select.Option>
              <Select.Option value="问题反馈">问题反馈</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="跟进内容"
            name="content"
            rules={[{ required: true, message: '请输入跟进内容' }]}
          >
            <TextArea rows={4} placeholder="请输入跟进内容..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建采购订单Modal */}
      <Modal
        title="创建采购订单"
        open={createPOModalVisible}
        onOk={handleCreatePurchaseOrder}
        onCancel={() => {
          setCreatePOModalVisible(false);
          poForm.resetFields();
        }}
        width={600}
        okText="创建"
        cancelText="取消"
      >
        <Alert
          message="提示"
          description={`您已选择 ${selectedItems.length} 个物料项目，将为这些项目创建采购订单`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={poForm} layout="vertical">
          <Form.Item
            label="供应商"
            name="supplier_id"
            rules={[{ required: true, message: '请选择供应商' }]}
          >
            <Select
              showSearch
              placeholder="请选择供应商"
              optionFilterProp="children"
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
          </Form.Item>
          <Form.Item
            label="预计交货日期"
            name="expected_delivery_date"
            rules={[{ required: true, message: '请选择预计交货日期' }]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item
            label="付款条款"
            name="payment_terms"
          >
            <Input placeholder="例如：货到付款、30天账期等" />
          </Form.Item>
          <Form.Item
            label="备注"
            name="notes"
          >
            <TextArea rows={3} placeholder="其他说明..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MaterialRequirementDetail;

