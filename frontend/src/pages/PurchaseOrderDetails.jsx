import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Descriptions, Table, Button, Tag, Space, message, 
  Modal, Form, Input, Steps, Divider, Row, Col, Statistic,
  Badge, Alert, Spin, Result, Tabs, Timeline, InputNumber,
  Select, DatePicker
} from 'antd';
import { 
  ArrowLeftOutlined, EditOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, DollarOutlined, FileTextOutlined,
  ShoppingCartOutlined, UploadOutlined, FolderOutlined, 
  EyeOutlined, DownloadOutlined, SendOutlined, 
  SafetyOutlined, LockOutlined, TruckOutlined,
  InboxOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import { purchaseOrdersAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import CloudUpload from '../components/CloudUpload';
import axios from 'axios';
import dayjs from 'dayjs';

const { TextArea } = Input;

const PurchaseOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasAnyRole } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  
  // Modal状态
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [shipmentModalVisible, setShipmentModalVisible] = useState(false);
  const [receivingModalVisible, setReceivingModalVisible] = useState(false);
  const [qualityCheckModalVisible, setQualityCheckModalVisible] = useState(false);
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  
  // 审批/驳回状态
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  
  // 预计到货日期编辑状态
  const [editingDeliveryDate, setEditingDeliveryDate] = useState(false);
  const [savingDeliveryDate, setSavingDeliveryDate] = useState(false);
  const [tempDeliveryDate, setTempDeliveryDate] = useState(null);
  
  // Form实例
  const [paymentForm] = Form.useForm();
  const [shipmentForm] = Form.useForm();
  const [receivingForm] = Form.useForm();
  const [qualityCheckForm] = Form.useForm();
  const [followUpForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  
  // 权限检查
  const isProcurementSpecialist = hasAnyRole(['Administrator', 'Procurement Specialist']);
  const isCommercialEngineer = hasAnyRole(['Administrator', 'Business Engineer']); // 商务工程师就是 Business Engineer
  const isAdministrator = hasAnyRole(['Administrator']);
  const canAccess = isProcurementSpecialist || isCommercialEngineer;

  // 验证 MongoDB ObjectId 格式
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  useEffect(() => {
    if (id) {
      // 检查 ID 是否有效
      if (!isValidObjectId(id)) {
        message.error('无效的采购单ID');
        navigate('/purchase-orders');
        return;
      }
      if (canAccess) {
        fetchOrder();
      }
    }
  }, [id, canAccess]);

  const fetchOrder = async () => {
    try {
      const response = await purchaseOrdersAPI.getById(id);
      setOrder(response.data.data);
    } catch (error) {
      console.error('获取采购订单详情失败:', error);
      message.error('获取采购订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 上传合同文件
  const handleUploadContract = async (fileData, contractType) => {
    setUploading(true);
    try {
      await axios.post(`/api/purchase-orders/${id}/add-file`, {
        file_name: fileData.name,
        file_url: fileData.url,
        file_type: contractType,
        uploaded_by: user._id
      });
      
      message.success(`${getContractTypeName(contractType)}上传成功！`);
      await fetchOrder();
    } catch (error) {
      message.error('上传文件失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  // 更新订单状态
  const handleUpdateStatus = async (newStatus, confirmMessage) => {
    Modal.confirm({
      title: '确认操作',
      content: confirmMessage,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setUpdatingStatus(true);
        try {
          await purchaseOrdersAPI.update(id, { status: newStatus });
          message.success('状态更新成功！');
          await fetchOrder();
        } catch (error) {
          message.error('状态更新失败: ' + (error.response?.data?.message || error.message));
        } finally {
          setUpdatingStatus(false);
        }
      }
    });
  };

  // 获取合同类型名称
  const getContractTypeName = (type) => {
    const typeMap = {
      'contract_draft': '采购合同草稿',
      'contract_sealed': '我方已盖章版采购合同',
      'contract_final': '最终版采购合同'
    };
    return typeMap[type] || type;
  };

  // 添加付款记录
  const handleAddPayment = async (values) => {
    try {
      await axios.post(`/api/purchase-orders/${id}/payments`, values);
      message.success('付款记录添加成功！');
      setPaymentModalVisible(false);
      paymentForm.resetFields();
      await fetchOrder();
    } catch (error) {
      message.error('添加付款记录失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 添加物流信息
  const handleAddShipment = async (values) => {
    try {
      await axios.post(`/api/purchase-orders/${id}/shipments`, values);
      message.success('物流信息添加成功！');
      setShipmentModalVisible(false);
      shipmentForm.resetFields();
      await fetchOrder();
      setActiveTab('3'); // 切换到物流信息Tab
    } catch (error) {
      message.error('添加物流信息失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 确认收货
  const handleConfirmReceiving = async (values) => {
    try {
      await axios.post(`/api/purchase-orders/${id}/receive`, values);
      message.success('收货确认成功！');
      setReceivingModalVisible(false);
      receivingForm.resetFields();
      await fetchOrder();
      setActiveTab('4'); // 切换到收货信息Tab
    } catch (error) {
      message.error('确认收货失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 更新质检状态
  const handleUpdateQualityCheck = async (values) => {
    try {
      await axios.patch(`/api/purchase-orders/${id}/quality-check`, values);
      message.success('质检信息更新成功！');
      setQualityCheckModalVisible(false);
      qualityCheckForm.resetFields();
      await fetchOrder();
    } catch (error) {
      message.error('更新质检信息失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 更新预计到货日期
  const handleUpdateDeliveryDate = async () => {
    if (!tempDeliveryDate) {
      message.warning('请选择预计到货日期');
      return;
    }

    setSavingDeliveryDate(true);
    try {
      await purchaseOrdersAPI.update(id, { 
        expected_delivery_date: tempDeliveryDate.toISOString()
      });
      message.success('预计到货日期更新成功！');
      setEditingDeliveryDate(false);
      await fetchOrder();
    } catch (error) {
      message.error('更新预计到货日期失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setSavingDeliveryDate(false);
    }
  };

  // 添加跟进记录
  const handleAddFollowUp = async (values) => {
    try {
      await axios.post(`/api/purchase-orders/${id}/follow-ups`, {
        ...values,
        user_id: user._id,
        timestamp: new Date().toISOString()
      });
      message.success('跟进记录添加成功！');
      setFollowUpModalVisible(false);
      followUpForm.resetFields();
      await fetchOrder();
    } catch (error) {
      message.error('添加跟进记录失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 管理员审批订单
  const handleAdminApprove = async () => {
    Modal.confirm({
      title: '确认批准',
      content: '确认批准该采购订单吗？批准后订单将进入"待拟定合同"流程。',
      okText: '批准',
      cancelText: '取消',
      onOk: async () => {
        setApproving(true);
        try {
          await axios.post(`/api/purchase-orders/${id}/admin-approve`);
          message.success('采购订单审批通过！');
          await fetchOrder();
        } catch (error) {
          message.error('审批失败: ' + (error.response?.data?.message || error.message));
        } finally {
          setApproving(false);
        }
      }
    });
  };

  // 管理员驳回订单
  const handleAdminReject = async (values) => {
    setRejecting(true);
    try {
      await axios.post(`/api/purchase-orders/${id}/admin-reject`, {
        rejection_reason: values.rejection_reason
      });
      message.success('采购订单已驳回！');
      setRejectModalVisible(false);
      rejectForm.resetFields();
      await fetchOrder();
    } catch (error) {
      message.error('驳回失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setRejecting(false);
    }
  };

  // 获取当前状态对应的步骤
  const getCurrentStep = (status) => {
    const stepMap = {
      '草稿 (Draft)': 0,
      '待处理 (Pending)': 0,
      '待管理员审批 (Pending Admin Approval)': -1, // 特殊状态，不在正常流程中
      '已驳回 (Rejected)': -1,
      '待拟定合同 (Pending Contract Draft)': 0,
      '待商务审核 (Pending Commercial Review)': 1,
      '待供应商确认 (Pending Supplier Confirmation)': 2,
      '执行中 (In Progress)': 3,
      '已发货 (Shipped)': 4,
      '已收货 (Received)': 5,
      '已取消 (Cancelled)': -1
    };
    return stepMap[status] ?? 0;
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    const colorMap = {
      '草稿 (Draft)': 'default',
      '待处理 (Pending)': 'default',
      '待管理员审批 (Pending Admin Approval)': 'warning',
      '已驳回 (Rejected)': 'error',
      '待拟定合同 (Pending Contract Draft)': 'orange',
      '待商务审核 (Pending Commercial Review)': 'blue',
      '待供应商确认 (Pending Supplier Confirmation)': 'cyan',
      '执行中 (In Progress)': 'processing',
      '已发货 (Shipped)': 'purple',
      '已收货 (Received)': 'success',
      '已取消 (Cancelled)': 'error'
    };
    return colorMap[status] || 'default';
  };

  // 获取文件按类型分组
  const getFilesByType = (type) => {
    if (!order || !order.documents) return [];
    return order.documents.filter(doc => doc.type === type);
  };

  // 渲染文件列表
  const renderFileTable = (files, canDelete = false) => {
    if (!files || files.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#999', background: '#fafafa', borderRadius: '4px' }}>
          <FolderOutlined style={{ fontSize: 32, marginBottom: 8 }} />
          <div>暂无文件</div>
        </div>
      );
    }

    return (
      <Table
        dataSource={files}
        rowKey={(record, index) => `file_${index}`}
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
                <strong>{text}</strong>
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
    );
  };

  // 渲染工作流操作按钮
  const renderWorkflowButtons = () => {
    if (!order) return null;

    const status = order.status;
    const contractDraft = getFilesByType('contract_draft');
    const contractSealed = getFilesByType('contract_sealed');
    const contractFinal = getFilesByType('contract_final');

    return (
      <Space wrap style={{ marginTop: 16 }}>
        {/* 采购专员 - 提交合同给商务审核 */}
        {isProcurementSpecialist && 
         status === '待拟定合同 (Pending Contract Draft)' && 
         contractDraft.length > 0 && (
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => handleUpdateStatus(
              '待商务审核 (Pending Commercial Review)',
              '确认要将采购合同提交给商务工程师审核吗？'
            )}
            loading={updatingStatus}
            style={{
              background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
              border: 'none'
            }}
          >
            提交合同给商务审核
          </Button>
        )}

        {/* 商务工程师 - 审核通过，回传给采购 */}
        {isCommercialEngineer && 
         status === '待商务审核 (Pending Commercial Review)' && 
         contractSealed.length > 0 && (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleUpdateStatus(
              '待供应商确认 (Pending Supplier Confirmation)',
              '确认审核通过并将盖章合同回传给采购专员吗？'
            )}
            loading={updatingStatus}
            style={{
              background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
              border: 'none'
            }}
          >
            审核通过，回传给采购
          </Button>
        )}

        {/* 采购专员 - 完成签署，开始执行 */}
        {isProcurementSpecialist && 
         status === '待供应商确认 (Pending Supplier Confirmation)' && 
         contractFinal.length > 0 && (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleUpdateStatus(
              '执行中 (In Progress)',
              '确认供应商已签署并将订单状态更新为"执行中"吗？'
            )}
            loading={updatingStatus}
            style={{
              background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
              border: 'none'
            }}
          >
            完成签署，开始执行
          </Button>
        )}

        {/* 采购专员 - 标记为已发货 */}
        {isProcurementSpecialist && 
         status === '执行中 (In Progress)' && (
          <Button
            type="primary"
            onClick={() => handleUpdateStatus(
              '已发货 (Shipped)',
              '确认供应商已发货吗？'
            )}
            loading={updatingStatus}
          >
            标记为已发货
          </Button>
        )}

        {/* 采购专员 - 确认收货 */}
        {isProcurementSpecialist && 
         status === '已发货 (Shipped)' && (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleUpdateStatus(
              '已收货 (Received)',
              '确认已收到货物吗？'
            )}
            loading={updatingStatus}
            style={{
              background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
              border: 'none'
            }}
          >
            确认收货
          </Button>
        )}
      </Space>
    );
  };

  // 订单明细列定义
  const itemColumns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1
    },
    {
      title: '产品名称',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text) => <strong>{text}</strong>
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
      width: 80,
      align: 'center'
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 70,
      align: 'center'
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      align: 'right',
      render: (price) => `¥${(price || 0).toLocaleString()}`
    },
    {
      title: '小计',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 140,
      align: 'right',
      render: (price) => (
        <strong style={{ color: '#f5222d' }}>
          ¥{(price || 0).toLocaleString()}
        </strong>
      )
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes) => notes || '-'
    }
  ];

  // 权限检查
  if (!canAccess) {
    return (
      <Result
        status="403"
        title="无权访问"
        subTitle="抱歉，您没有权限访问采购订单详情。此功能仅限管理员、采购专员和商务工程师使用。"
        icon={<LockOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />}
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            返回首页
          </Button>
        }
      />
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#999' }}>加载中...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <Result
        status="404"
        title="采购订单不存在"
        subTitle="抱歉，未找到该采购订单。"
        extra={
          <Button type="primary" onClick={() => navigate('/purchase-orders')}>
            返回采购订单列表
          </Button>
        }
      />
    );
  }

  const contractDraft = getFilesByType('contract_draft');
  const contractSealed = getFilesByType('contract_sealed');
  const contractFinal = getFilesByType('contract_final');

  return (
    <div style={{ padding: '24px' }}>
      <Space style={{ marginBottom: 24 }} wrap>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/purchase-orders')}
        >
          返回采购订单列表
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/purchase-orders/edit/${id}`)}
          disabled={['已收货 (Received)', '已取消 (Cancelled)'].includes(order.status)}
        >
          编辑订单
        </Button>
      </Space>

      {/* 管理员审批/驳回区域 - 仅在待审批状态下对管理员显示 */}
      {isAdministrator && order.status === '待管理员审批 (Pending Admin Approval)' && (
        <Alert
          message={
            <Space>
              <FileDoneOutlined style={{ fontSize: 18 }} />
              <strong>待您审批</strong>
            </Space>
          }
          description={
            <div>
              <div style={{ marginBottom: 16 }}>
                该采购订单来自<strong>临时供应商</strong>，订单金额为 <strong style={{ color: '#f5222d', fontSize: 16 }}>¥{(order.total_amount || 0).toLocaleString()}</strong>，
                超过了 ¥100,000 的审批阈值，需要您进行审批。
              </div>
              <Space>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleAdminApprove}
                  loading={approving}
                  style={{
                    background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                    border: 'none'
                  }}
                >
                  批准订单
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => setRejectModalVisible(true)}
                  loading={rejecting}
                >
                  驳回订单
                </Button>
              </Space>
            </div>
          }
          type="warning"
          showIcon={false}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 驳回提示 - 显示驳回原因 */}
      {order.status === '已驳回 (Rejected)' && order.rejection_reason && (
        <Alert
          message="订单已驳回"
          description={
            <div>
              <div><strong>驳回原因：</strong>{order.rejection_reason}</div>
              {order.rejected_by && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  驳回人：{order.rejected_by.full_name} | 
                  驳回时间：{dayjs(order.rejected_at).format('YYYY-MM-DD HH:mm')}
                </div>
              )}
            </div>
          }
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 订单基本信息 */}
      <Card title="采购订单信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="订单号">
            <strong style={{ fontSize: '16px', color: '#1890ff' }}>{order.order_number}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="订单状态">
            <Tag color={getStatusColor(order.status)} style={{ fontSize: '14px' }}>
              {order.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="供应商">
            <strong>{order.supplier_id?.name || '-'}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="供应商联系人">
            {order.supplier_id?.contact_person || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="供应商电话">
            {order.supplier_id?.phone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="供应商邮箱">
            {order.supplier_id?.email || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="订单日期">
            {dayjs(order.order_date).format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label="预计交货日期">
            {order.expected_delivery_date 
              ? dayjs(order.expected_delivery_date).format('YYYY-MM-DD')
              : '-'
            }
          </Descriptions.Item>
          <Descriptions.Item label="实际交货日期">
            {order.actual_delivery_date 
              ? dayjs(order.actual_delivery_date).format('YYYY-MM-DD')
              : '-'
            }
          </Descriptions.Item>
          <Descriptions.Item label="创建人">
            {order.created_by?.full_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="审批人">
            {order.approved_by?.full_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="付款条款" span={2}>
            {order.payment_terms || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="收货地址" span={2}>
            {order.shipping_address || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="联系人">
            {order.contact_person || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="联系电话">
            {order.contact_phone || '-'}
          </Descriptions.Item>
          {order.notes && (
            <Descriptions.Item label="备注" span={2}>
              {order.notes}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 采购跟进 - 预计到货日期管理 */}
      {isProcurementSpecialist && (
        <Card 
          title={
            <Space>
              <TruckOutlined style={{ color: '#1890ff' }} />
              <span>采购跟进管理</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
          extra={
            order.status !== '已收货 (Received)' && 
            order.status !== '已取消 (Cancelled)' && (
              <Button
                type="primary"
                icon={<FileTextOutlined />}
                onClick={() => setFollowUpModalVisible(true)}
                size="small"
              >
                添加跟进记录
              </Button>
            )
          }
        >
          <Row gutter={24}>
            <Col span={12}>
              <Card 
                type="inner" 
                title="预计到货日期 (Est. Delivery Date)"
                style={{ height: '100%' }}
              >
                <Form layout="vertical">
                  <Form.Item 
                    label={
                      <Space>
                        <span style={{ fontWeight: 500 }}>预计到货日期</span>
                        {order.expected_delivery_date && (
                          <Tag color="blue">已设置</Tag>
                        )}
                      </Space>
                    }
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <DatePicker
                        value={
                          editingDeliveryDate 
                            ? tempDeliveryDate 
                            : (order.expected_delivery_date ? dayjs(order.expected_delivery_date) : null)
                        }
                        onChange={(date) => {
                          setTempDeliveryDate(date);
                          if (!editingDeliveryDate) {
                            setEditingDeliveryDate(true);
                          }
                        }}
                        style={{ width: '100%' }}
                        placeholder="请选择预计到货日期"
                        format="YYYY-MM-DD"
                        disabled={
                          savingDeliveryDate || 
                          order.status === '已收货 (Received)' || 
                          order.status === '已取消 (Cancelled)'
                        }
                      />
                      
                      {editingDeliveryDate && (
                        <Space>
                          <Button
                            type="primary"
                            size="small"
                            loading={savingDeliveryDate}
                            onClick={handleUpdateDeliveryDate}
                            icon={<CheckCircleOutlined />}
                          >
                            保存更新
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              setEditingDeliveryDate(false);
                              setTempDeliveryDate(null);
                            }}
                            disabled={savingDeliveryDate}
                          >
                            取消
                          </Button>
                        </Space>
                      )}
                    </Space>
                  </Form.Item>
                </Form>

                {order.expected_delivery_date && (
                  <Alert
                    message="当前预计到货日期"
                    description={
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff', marginBottom: 4 }}>
                          {dayjs(order.expected_delivery_date).format('YYYY年MM月DD日')}
                        </div>
                        {order.actual_delivery_date ? (
                          <div style={{ fontSize: '12px', color: '#52c41a' }}>
                            ✓ 已于 {dayjs(order.actual_delivery_date).format('YYYY-MM-DD')} 实际到货
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            距离预计到货还有 {dayjs(order.expected_delivery_date).diff(dayjs(), 'day')} 天
                          </div>
                        )}
                      </div>
                    }
                    type="info"
                    showIcon
                  />
                )}
              </Card>
            </Col>

            <Col span={12}>
              <Card 
                type="inner" 
                title="最新跟进记录"
                style={{ height: '100%' }}
              >
                {order.follow_ups && order.follow_ups.length > 0 ? (
                  <div>
                    <Timeline>
                      {order.follow_ups.slice(0, 3).map((record, index) => (
                        <Timeline.Item 
                          key={index}
                          color={index === 0 ? 'green' : 'gray'}
                        >
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            {dayjs(record.timestamp).format('YYYY-MM-DD HH:mm')}
                          </div>
                          <div style={{ marginTop: 4 }}>
                            {record.content}
                          </div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: 4 }}>
                            - {record.user_id?.full_name || '系统'}
                          </div>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                    {order.follow_ups.length > 3 && (
                      <div style={{ textAlign: 'center', marginTop: 8 }}>
                        <Button 
                          type="link" 
                          size="small"
                          onClick={() => setActiveTab('5')}
                        >
                          查看全部 {order.follow_ups.length} 条记录
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                    <FileTextOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                    <div>暂无跟进记录</div>
                    <div style={{ fontSize: '12px', marginTop: 4 }}>
                      点击右上角"添加跟进记录"按钮开始记录
                    </div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* 合同审批流程 */}
      <Card title="合同审批流程" style={{ marginBottom: 16 }}>
        <Steps
          current={getCurrentStep(order.status)}
          status={order.status === '已取消 (Cancelled)' ? 'error' : 'process'}
          items={[
            { 
              title: '拟定合同', 
              description: '采购专员上传合同草稿',
              icon: <FileTextOutlined />
            },
            { 
              title: '商务审核', 
              description: '商务工程师审核并盖章',
              icon: <SafetyOutlined />
            },
            { 
              title: '供应商确认', 
              description: '供应商签署确认',
              icon: <CheckCircleOutlined />
            },
            { 
              title: '执行订单', 
              description: '订单执行中',
              icon: <ShoppingCartOutlined />
            },
            { 
              title: '已发货', 
              description: '供应商已发货'
            },
            { 
              title: '已收货', 
              description: '确认收货完成'
            }
          ]}
        />

        {/* 流程提示 */}
        {order.status === '待拟定合同 (Pending Contract Draft)' && contractDraft.length === 0 && isProcurementSpecialist && (
          <Alert
            message="下一步操作"
            description='请上传采购合同草稿文件，然后点击「提交合同给商务审核」按钮。'
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        {order.status === '待商务审核 (Pending Commercial Review)' && contractSealed.length === 0 && isCommercialEngineer && (
          <Alert
            message="下一步操作"
            description="请下载合同草稿进行审核，完成内部盖章后上传「我方已盖章版采购合同」，然后点击「审核通过，回传给采购」按钮。"
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        {order.status === '待供应商确认 (Pending Supplier Confirmation)' && contractFinal.length === 0 && isProcurementSpecialist && (
          <Alert
            message="下一步操作"
            description="请将盖章合同发送给供应商，待供应商回传双方签署的最终版合同后，上传「最终版采购合同」，然后点击「完成签署，开始执行」按钮。"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        {/* 工作流操作按钮 */}
        {renderWorkflowButtons()}
      </Card>

      {/* 合同文件管理 */}
      <Card title="合同文件" style={{ marginBottom: 16 }}>
        {/* 1. 采购合同草稿 */}
        <Card 
          type="inner" 
          title={
            <Space>
              <FileTextOutlined style={{ color: '#1890ff' }} />
              <span>采购合同草稿</span>
              {contractDraft.length > 0 && (
                <Badge count={contractDraft.length} />
              )}
            </Space>
          }
          extra={
            isProcurementSpecialist && 
            ['待拟定合同 (Pending Contract Draft)'].includes(order.status) && (
              <CloudUpload
                onSuccess={(fileData) => handleUploadContract(fileData, 'contract_draft')}
              >
                <Button 
                  icon={<UploadOutlined />} 
                  type="primary"
                  size="small"
                  loading={uploading}
                >
                  上传合同草稿
                </Button>
              </CloudUpload>
            )
          }
          style={{ marginBottom: 16 }}
        >
          <div style={{ marginBottom: 8, color: '#666', fontSize: '12px' }}>
            采购专员草拟的采购合同，待提交给商务工程师审核
          </div>
          {renderFileTable(contractDraft)}
        </Card>

        {/* 2. 我方已盖章版采购合同 */}
        <Card 
          type="inner" 
          title={
            <Space>
              <SafetyOutlined style={{ color: '#52c41a' }} />
              <span>我方已盖章版采购合同</span>
              {contractSealed.length > 0 && (
                <Badge count={contractSealed.length} />
              )}
            </Space>
          }
          extra={
            isCommercialEngineer && 
            ['待商务审核 (Pending Commercial Review)'].includes(order.status) && (
              <CloudUpload
                onSuccess={(fileData) => handleUploadContract(fileData, 'contract_sealed')}
              >
                <Button 
                  icon={<UploadOutlined />} 
                  type="primary"
                  size="small"
                  loading={uploading}
                >
                  上传盖章合同
                </Button>
              </CloudUpload>
            )
          }
          style={{ marginBottom: 16 }}
        >
          <div style={{ marginBottom: 8, color: '#666', fontSize: '12px' }}>
            商务工程师审核通过并完成内部盖章的合同版本
          </div>
          {renderFileTable(contractSealed)}
        </Card>

        {/* 3. 最终版采购合同 */}
        <Card 
          type="inner" 
          title={
            <Space>
              <CheckCircleOutlined style={{ color: '#722ed1' }} />
              <span>最终版采购合同（双方签署）</span>
              {contractFinal.length > 0 && (
                <Badge count={contractFinal.length} />
              )}
            </Space>
          }
          extra={
            isProcurementSpecialist && 
            ['待供应商确认 (Pending Supplier Confirmation)'].includes(order.status) && (
              <CloudUpload
                onSuccess={(fileData) => handleUploadContract(fileData, 'contract_final')}
              >
                <Button 
                  icon={<UploadOutlined />} 
                  type="primary"
                  size="small"
                  loading={uploading}
                >
                  上传最终版合同
                </Button>
              </CloudUpload>
            )
          }
        >
          <div style={{ marginBottom: 8, color: '#666', fontSize: '12px' }}>
            供应商签署确认后的双方盖章版最终合同
          </div>
          {renderFileTable(contractFinal)}
        </Card>
      </Card>

      {/* 财务信息 */}
      <Card title="财务信息" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="订单总额"
              value={order.total_amount || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#f5222d', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Col>
          <Col span={8}>
            <Card>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: 8 }}>付款条款</div>
              <div style={{ fontSize: '16px' }}>{order.payment_terms || '-'}</div>
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: 8 }}>审批信息</div>
              <div style={{ fontSize: '14px' }}>
                {order.approved_by ? (
                  <>
                    <div>审批人: {order.approved_by.full_name}</div>
                    <div>审批时间: {dayjs(order.approved_at).format('YYYY-MM-DD HH:mm')}</div>
                  </>
                ) : (
                  <span style={{ color: '#999' }}>暂未审批</span>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 订单明细 */}
      <Card title="订单明细" style={{ marginBottom: 16 }}>
        <Table
          columns={itemColumns}
          dataSource={order.items}
          rowKey={(record, index) => `item_${index}`}
          pagination={false}
          scroll={{ x: 1200 }}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={7} align="right">
                  <strong style={{ fontSize: '16px' }}>订单总额：</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell align="right">
                  <strong style={{ color: '#f5222d', fontSize: '18px' }}>
                    ¥{(order.total_amount || 0).toLocaleString()}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      {/* 其他采购文件 */}
      {order.documents && order.documents.filter(doc => !doc.type || doc.type === 'other').length > 0 && (
        <Card title="其他采购文件" style={{ marginBottom: 16 }}>
          {renderFileTable(order.documents.filter(doc => !doc.type || doc.type === 'other'))}
        </Card>
      )}

      {/* 执行阶段：付款、物流、收货信息 Tabs */}
      <Card title="执行阶段管理" style={{ marginBottom: 16 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Tab 1: 付款记录 */}
          <Tabs.TabPane
            tab={
              <span>
                <DollarOutlined />
                付款记录
                {order.payment_info?.payment_records?.length > 0 && (
                  <Badge count={order.payment_info.payment_records.length} style={{ marginLeft: 8 }} />
                )}
              </span>
            }
            key="1"
          >
            <div style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="订单总额"
                    value={order.total_amount || 0}
                    precision={2}
                    prefix="¥"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="已付款金额"
                    value={order.payment_info?.paid_amount || 0}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="未付款金额"
                    value={(order.total_amount || 0) - (order.payment_info?.paid_amount || 0)}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Col>
              </Row>
              <Divider />
              <Space>
                <Tag color={
                  order.payment_info?.payment_status === '已付款 (Paid)' ? 'success' :
                  order.payment_info?.payment_status === '部分付款 (Partial)' ? 'warning' :
                  order.payment_info?.payment_status === '逾期 (Overdue)' ? 'error' : 'default'
                }>
                  {order.payment_info?.payment_status || '未付款 (Unpaid)'}
                </Tag>
                {(isProcurementSpecialist || isCommercialEngineer) && (
                  <Button
                    type="primary"
                    icon={<DollarOutlined />}
                    onClick={() => setPaymentModalVisible(true)}
                  >
                    添加付款记录
                  </Button>
                )}
              </Space>
            </div>

            {order.payment_info?.payment_records && order.payment_info.payment_records.length > 0 ? (
              <Timeline
                items={order.payment_info.payment_records.map((record, index) => ({
                  key: index,
                  color: 'green',
                  children: (
                    <div>
                      <div>
                        <strong style={{ fontSize: '16px' }}>¥{(record.amount || 0).toLocaleString()}</strong>
                        <span style={{ marginLeft: 8, color: '#666' }}>
                          {dayjs(record.payment_date).format('YYYY-MM-DD')}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        方式: {record.payment_method || '-'} | 参考号: {record.reference_number || '-'}
                      </div>
                      {record.notes && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                          {record.notes}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#999', marginTop: 4 }}>
                        记录时间: {dayjs(record.recorded_at).format('YYYY-MM-DD HH:mm')}
                      </div>
                    </div>
                  )
                }))}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <DollarOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>暂无付款记录</div>
              </div>
            )}
          </Tabs.TabPane>

          {/* Tab 2: 物流信息 */}
          <Tabs.TabPane
            tab={
              <span>
                <TruckOutlined />
                物流信息
                {order.shipments?.length > 0 && (
                  <Badge count={order.shipments.length} style={{ marginLeft: 8 }} />
                )}
              </span>
            }
            key="3"
          >
            <div style={{ marginBottom: 16 }}>
              {isProcurementSpecialist && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => setShipmentModalVisible(true)}
                >
                  添加物流信息
                </Button>
              )}
            </div>

            {order.shipments && order.shipments.length > 0 ? (
              <Table
                dataSource={order.shipments}
                rowKey={(record, index) => `shipment_${index}`}
                pagination={false}
                columns={[
                  {
                    title: '物流单号',
                    dataIndex: 'tracking_number',
                    key: 'tracking_number',
                    render: (text) => <strong style={{ color: '#1890ff' }}>{text}</strong>
                  },
                  {
                    title: '承运商',
                    dataIndex: 'carrier',
                    key: 'carrier'
                  },
                  {
                    title: '发货日期',
                    dataIndex: 'shipped_date',
                    key: 'shipped_date',
                    render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
                  },
                  {
                    title: '预计送达',
                    dataIndex: 'estimated_delivery_date',
                    key: 'estimated_delivery_date',
                    render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
                  },
                  {
                    title: '实际送达',
                    dataIndex: 'actual_delivery_date',
                    key: 'actual_delivery_date',
                    render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
                  },
                  {
                    title: '状态',
                    dataIndex: 'shipment_status',
                    key: 'shipment_status',
                    render: (status) => {
                      const colorMap = {
                        '准备中': 'default',
                        '已发货': 'processing',
                        '运输中': 'cyan',
                        '已送达': 'success',
                        '异常': 'error'
                      };
                      return <Tag color={colorMap[status]}>{status}</Tag>;
                    }
                  }
                ]}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <TruckOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>暂无物流信息</div>
              </div>
            )}
          </Tabs.TabPane>

          {/* Tab 3: 跟进记录 */}
          <Tabs.TabPane
            tab={
              <span>
                <FileTextOutlined />
                跟进记录
                {order.follow_ups?.length > 0 && (
                  <Badge count={order.follow_ups.length} style={{ marginLeft: 8 }} />
                )}
              </span>
            }
            key="5"
          >
            <div style={{ marginBottom: 16 }}>
              {isProcurementSpecialist && (
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={() => setFollowUpModalVisible(true)}
                >
                  添加跟进记录
                </Button>
              )}
            </div>

            {order.follow_ups && order.follow_ups.length > 0 ? (
              <Timeline mode="left">
                {order.follow_ups.map((record, index) => (
                  <Timeline.Item 
                    key={index}
                    color={index === 0 ? 'green' : 'blue'}
                    label={dayjs(record.timestamp).format('YYYY-MM-DD HH:mm')}
                  >
                    <Card size="small" style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                        {record.content}
                      </div>
                      <Divider style={{ margin: '8px 0' }} />
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        <Space>
                          <span>记录人: {record.user_id?.full_name || '系统'}</span>
                          {record.updated_delivery_date && (
                            <Tag color="orange">
                              更新到货日期至: {dayjs(record.updated_delivery_date).format('YYYY-MM-DD')}
                            </Tag>
                          )}
                        </Space>
                      </div>
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>暂无跟进记录</div>
                <div style={{ fontSize: '12px', marginTop: 8 }}>
                  点击上方"添加跟进记录"按钮开始记录供应商沟通和交期变更
                </div>
              </div>
            )}
          </Tabs.TabPane>

          {/* Tab 4: 收货信息 */}
          <Tabs.TabPane
            tab={
              <span>
                <InboxOutlined />
                收货信息
              </span>
            }
            key="4"
          >
            <div style={{ marginBottom: 16 }}>
              {isProcurementSpecialist && order.status === '已发货 (Shipped)' && !order.receiving_info && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => setReceivingModalVisible(true)}
                >
                  确认收货
                </Button>
              )}
              {order.receiving_info && (
                <Button
                  icon={<SafetyCertificateOutlined />}
                  onClick={() => setQualityCheckModalVisible(true)}
                >
                  更新质检状态
                </Button>
              )}
            </div>

            {order.receiving_info ? (
              <div>
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="收货日期">
                    {order.receiving_info.received_date 
                      ? dayjs(order.receiving_info.received_date).format('YYYY-MM-DD HH:mm')
                      : '-'
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="收货人">
                    {order.receiving_info.received_by?.full_name || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="仓库位置" span={2}>
                    {order.receiving_info.warehouse_location || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="质检状态">
                    <Tag color={
                      order.receiving_info.quality_check?.status === '合格' ? 'success' :
                      order.receiving_info.quality_check?.status === '不合格' ? 'error' :
                      order.receiving_info.quality_check?.status === '检验中' ? 'processing' : 'default'
                    }>
                      {order.receiving_info.quality_check?.status || '待检验'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="质检员">
                    {order.receiving_info.quality_check?.inspector?.full_name || '-'}
                  </Descriptions.Item>
                  {order.receiving_info.quality_check?.inspection_date && (
                    <Descriptions.Item label="检验日期" span={2}>
                      {dayjs(order.receiving_info.quality_check.inspection_date).format('YYYY-MM-DD HH:mm')}
                    </Descriptions.Item>
                  )}
                  {order.receiving_info.quality_check?.inspection_notes && (
                    <Descriptions.Item label="质检备注" span={2}>
                      {order.receiving_info.quality_check.inspection_notes}
                    </Descriptions.Item>
                  )}
                  {order.receiving_info.notes && (
                    <Descriptions.Item label="收货备注" span={2}>
                      {order.receiving_info.notes}
                    </Descriptions.Item>
                  )}
                </Descriptions>

                {order.receiving_info.received_items && order.receiving_info.received_items.length > 0 && (
                  <>
                    <Divider>收货明细</Divider>
                    <Table
                      dataSource={order.receiving_info.received_items}
                      rowKey={(record, index) => `received_${index}`}
                      pagination={false}
                      size="small"
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
                          title: '订购数量',
                          dataIndex: 'ordered_quantity',
                          key: 'ordered_quantity',
                          align: 'center'
                        },
                        {
                          title: '实收数量',
                          dataIndex: 'received_quantity',
                          key: 'received_quantity',
                          align: 'center',
                          render: (qty, record) => (
                            <span style={{ 
                              color: qty === record.ordered_quantity ? '#52c41a' : '#faad14',
                              fontWeight: 'bold'
                            }}>
                              {qty}
                            </span>
                          )
                        },
                        {
                          title: '损坏数量',
                          dataIndex: 'damaged_quantity',
                          key: 'damaged_quantity',
                          align: 'center',
                          render: (qty) => qty > 0 ? <Tag color="error">{qty}</Tag> : '-'
                        },
                        {
                          title: '单位',
                          dataIndex: 'unit',
                          key: 'unit',
                          align: 'center'
                        },
                        {
                          title: '备注',
                          dataIndex: 'notes',
                          key: 'notes'
                        }
                      ]}
                    />
                  </>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <InboxOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>暂未收货</div>
                {order.status === '已发货 (Shipped)' && (
                  <div style={{ marginTop: 8, fontSize: '12px' }}>
                    点击上方"确认收货"按钮进行收货登记
                  </div>
                )}
              </div>
            )}
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Modal: 添加付款记录 */}
      <Modal
        title="添加付款记录"
        open={paymentModalVisible}
        onCancel={() => {
          setPaymentModalVisible(false);
          paymentForm.resetFields();
        }}
        onOk={() => paymentForm.submit()}
        okText="添加"
        cancelText="取消"
        width={600}
      >
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handleAddPayment}
        >
          <Form.Item
            name="amount"
            label="付款金额"
            rules={[{ required: true, message: '请输入付款金额' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入金额"
              prefix="¥"
            />
          </Form.Item>

          <Form.Item
            name="payment_date"
            label="付款日期"
            rules={[{ required: true, message: '请选择付款日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="payment_method"
            label="付款方式"
            rules={[{ required: true, message: '请选择付款方式' }]}
            initialValue="银行转账"
          >
            <Select>
              <Select.Option value="银行转账">银行转账</Select.Option>
              <Select.Option value="支票">支票</Select.Option>
              <Select.Option value="现金">现金</Select.Option>
              <Select.Option value="信用证">信用证</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="reference_number"
            label="参考号/交易号"
          >
            <Input placeholder="例如: 转账单号" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={3} placeholder="付款备注（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: 添加物流信息 */}
      <Modal
        title="添加物流信息"
        open={shipmentModalVisible}
        onCancel={() => {
          setShipmentModalVisible(false);
          shipmentForm.resetFields();
        }}
        onOk={() => shipmentForm.submit()}
        okText="添加"
        cancelText="取消"
        width={700}
      >
        <Form
          form={shipmentForm}
          layout="vertical"
          onFinish={handleAddShipment}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tracking_number"
                label="物流单号"
                rules={[{ required: true, message: '请输入物流单号' }]}
              >
                <Input placeholder="例如: SF1234567890" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="carrier"
                label="承运商"
                rules={[{ required: true, message: '请选择承运商' }]}
              >
                <Select placeholder="选择承运商">
                  <Select.Option value="顺丰速运">顺丰速运</Select.Option>
                  <Select.Option value="德邦物流">德邦物流</Select.Option>
                  <Select.Option value="中通快递">中通快递</Select.Option>
                  <Select.Option value="圆通快递">圆通快递</Select.Option>
                  <Select.Option value="申通快递">申通快递</Select.Option>
                  <Select.Option value="韵达快递">韵达快递</Select.Option>
                  <Select.Option value="其他">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shipment_number"
                label="发货批次号"
              >
                <Input placeholder="例如: BATCH001（可选）" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="carrier_contact"
                label="承运商联系方式"
              >
                <Input placeholder="联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="shipped_date"
                label="发货日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="estimated_delivery_date"
                label="预计送达日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="shipment_status"
                label="物流状态"
                initialValue="已发货"
              >
                <Select>
                  <Select.Option value="准备中">准备中</Select.Option>
                  <Select.Option value="已发货">已发货</Select.Option>
                  <Select.Option value="运输中">运输中</Select.Option>
                  <Select.Option value="已送达">已送达</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={3} placeholder="物流备注（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: 确认收货 */}
      <Modal
        title="确认收货"
        open={receivingModalVisible}
        onCancel={() => {
          setReceivingModalVisible(false);
          receivingForm.resetFields();
        }}
        onOk={() => receivingForm.submit()}
        okText="确认收货"
        cancelText="取消"
        width={600}
      >
        <Form
          form={receivingForm}
          layout="vertical"
          onFinish={handleConfirmReceiving}
        >
          <Form.Item
            name="warehouse_location"
            label="仓库位置"
            rules={[{ required: true, message: '请输入仓库位置' }]}
          >
            <Input placeholder="例如: A区-001货架" />
          </Form.Item>

          <Form.Item
            name="quality_check_status"
            label="质检状态"
            initialValue="待检验"
          >
            <Select>
              <Select.Option value="待检验">待检验</Select.Option>
              <Select.Option value="检验中">检验中</Select.Option>
              <Select.Option value="合格">合格</Select.Option>
              <Select.Option value="不合格">不合格</Select.Option>
              <Select.Option value="部分合格">部分合格</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="收货备注"
          >
            <TextArea rows={3} placeholder="收货备注（可选）" />
          </Form.Item>

          <Alert
            message="提示"
            description="确认收货后，订单状态将自动更新为「已收货」。请确保货物已全部验收无误。"
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Form>
      </Modal>

      {/* Modal: 更新质检状态 */}
      <Modal
        title="更新质检状态"
        open={qualityCheckModalVisible}
        onCancel={() => {
          setQualityCheckModalVisible(false);
          qualityCheckForm.resetFields();
        }}
        onOk={() => qualityCheckForm.submit()}
        okText="更新"
        cancelText="取消"
        width={600}
      >
        <Form
          form={qualityCheckForm}
          layout="vertical"
          onFinish={handleUpdateQualityCheck}
        >
          <Form.Item
            name="status"
            label="质检状态"
            rules={[{ required: true, message: '请选择质检状态' }]}
          >
            <Select placeholder="选择质检状态">
              <Select.Option value="待检验">待检验</Select.Option>
              <Select.Option value="检验中">检验中</Select.Option>
              <Select.Option value="合格">合格</Select.Option>
              <Select.Option value="不合格">不合格</Select.Option>
              <Select.Option value="部分合格">部分合格</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="inspection_notes"
            label="质检备注"
          >
            <TextArea rows={4} placeholder="质检备注信息" />
          </Form.Item>

          <Form.Item
            name="defect_description"
            label="缺陷描述"
          >
            <TextArea rows={3} placeholder="如有缺陷，请详细描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: 添加跟进记录 */}
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1890ff' }} />
            <span>添加采购跟进记录</span>
          </Space>
        }
        open={followUpModalVisible}
        onCancel={() => {
          setFollowUpModalVisible(false);
          followUpForm.resetFields();
        }}
        onOk={() => followUpForm.submit()}
        okText="保存"
        cancelText="取消"
        width={700}
      >
        <Alert
          message="跟进记录说明"
          description="用于记录与供应商的沟通内容、交期变更、质量问题等重要信息，建立完整的采购过程追溯链。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={followUpForm}
          layout="vertical"
          onFinish={handleAddFollowUp}
        >
          <Form.Item
            name="content"
            label="跟进内容"
            rules={[
              { required: true, message: '请输入跟进内容' },
              { min: 10, message: '跟进内容至少10个字符' }
            ]}
          >
            <TextArea 
              rows={6} 
              placeholder="例如：&#10;- 6月10日致电供应商李经理，确认原材料已到货&#10;- 因生产线调整，预计交期由6月20日延迟至6月25日&#10;- 供应商承诺加急处理，争取提前3天交货&#10;- 质量问题已整改完成，附整改报告"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="follow_up_type"
            label="跟进类型"
            initialValue="常规跟进"
          >
            <Select>
              <Select.Option value="常规跟进">常规跟进</Select.Option>
              <Select.Option value="交期确认">交期确认</Select.Option>
              <Select.Option value="交期延迟">交期延迟</Select.Option>
              <Select.Option value="质量问题">质量问题</Select.Option>
              <Select.Option value="价格变更">价格变更</Select.Option>
              <Select.Option value="紧急催货">紧急催货</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="contact_person"
            label="联系人"
          >
            <Input placeholder="供应商联系人姓名（可选）" />
          </Form.Item>

          <Form.Item
            name="contact_method"
            label="联系方式"
          >
            <Select placeholder="选择联系方式（可选）">
              <Select.Option value="电话">电话</Select.Option>
              <Select.Option value="邮件">邮件</Select.Option>
              <Select.Option value="微信">微信</Select.Option>
              <Select.Option value="现场拜访">现场拜访</Select.Option>
              <Select.Option value="视频会议">视频会议</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>

          <Divider>示例格式</Divider>
          <div style={{ 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666',
            lineHeight: '1.8'
          }}>
            <div><strong>示例 1 - 交期延迟：</strong></div>
            <div>2024-06-10：与供应商确认，因原料供应问题，原定6月15日的交期将延迟至6月25日。供应商已出具书面说明，承诺不再延期。</div>
            <br />
            <div><strong>示例 2 - 紧急催货：</strong></div>
            <div>2024-06-12：致电采购经理王总，强调该批物料已影响生产计划，要求务必在6月20日前发货。对方承诺全力协调。</div>
          </div>
        </Form>
      </Modal>

      {/* Modal: 管理员驳回订单 */}
      <Modal
        title={
          <Space>
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>驳回采购订单</span>
          </Space>
        }
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          rejectForm.resetFields();
        }}
        onOk={() => rejectForm.submit()}
        okText="确认驳回"
        okButtonProps={{ danger: true, loading: rejecting }}
        cancelText="取消"
        width={600}
      >
        <Alert
          message="驳回说明"
          description="驳回后，采购员将收到通知，订单状态将变为「已驳回」。请务必填写清晰的驳回原因，以便采购员了解并改进。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={handleAdminReject}
        >
          <Form.Item
            name="rejection_reason"
            label="驳回原因"
            rules={[
              { required: true, message: '请填写驳回原因' },
              { min: 10, message: '驳回原因至少10个字符，请详细说明' }
            ]}
          >
            <TextArea 
              rows={6} 
              placeholder="请详细说明驳回原因，例如：&#10;- 订单金额超出预算范围&#10;- 供应商选择不符合要求&#10;- 采购需求不明确，需要补充说明&#10;- 价格明显偏高，建议重新询价"
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PurchaseOrderDetails;

