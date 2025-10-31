import { useState } from 'react';
import { 
  Card, Button, Space, Tag, Descriptions, message, Modal, Input, Alert
} from 'antd';
import {
  DollarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { projectsAPI } from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

/**
 * 尾款确认组件（商务工程师专用）
 * 在项目详情页中显示，用于确认尾款到账
 */
const FinalPaymentConfirmation = ({ project, onConfirmed }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [confirming, setConfirming] = useState(false);

  // 检查是否显示此组件
  // 只有商务工程师且尾款状态为 Pending 时才显示
  const shouldShow = 
    project?.contract?.finalPaymentStatus === 'Pending' &&
    project?.contract?.finalPaymentAmount > 0;

  const handleConfirmClick = () => {
    setModalVisible(true);
    setPaymentNotes('');
  };

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      await projectsAPI.confirmFinalPayment(project._id, {
        notes: paymentNotes
      });
      message.success('尾款确认成功！已通知生产部门安排发货。');
      setModalVisible(false);
      setPaymentNotes('');
      // 触发父组件刷新
      onConfirmed && onConfirmed();
    } catch (error) {
      console.error('确认尾款失败:', error);
      message.error(error.response?.data?.message || '确认尾款失败');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setPaymentNotes('');
  };

  if (!shouldShow) {
    return null;
  }

  // 获取尾款状态的显示信息
  const getPaymentStatusDisplay = () => {
    const status = project.contract?.finalPaymentStatus;
    if (status === 'Confirmed') {
      return {
        color: 'success',
        icon: <CheckCircleOutlined />,
        text: '已确认',
        tag: <Tag color="green" icon={<CheckCircleOutlined />}>尾款已到账</Tag>
      };
    }
    return {
      color: 'warning',
      icon: <ClockCircleOutlined />,
      text: '待确认',
      tag: <Tag color="orange" icon={<ClockCircleOutlined />}>待确认尾款</Tag>
    };
  };

  const statusDisplay = getPaymentStatusDisplay();

  return (
    <>
      <Card
        title={
          <Space>
            <DollarOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>尾款管理</span>
            {statusDisplay.tag}
          </Space>
        }
        style={{ 
          marginTop: 24,
          borderLeft: '4px solid #52c41a'
        }}
      >
        <Alert
          message="成品已检验合格，请确认尾款"
          description="该项目的成品已通过质检，请确认客户尾款是否到账。确认后，系统将自动通知生产部门安排发货。"
          type="info"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 24 }}
        />

        <Descriptions column={2} bordered>
          <Descriptions.Item label="合同总金额" span={1}>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
              ¥{project.contract?.totalAmount?.toLocaleString() || '0'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="定金金额" span={1}>
            <span style={{ fontSize: '16px' }}>
              ¥{project.contract?.depositAmount?.toLocaleString() || '0'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="尾款金额" span={1}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
              ¥{project.contract?.finalPaymentAmount?.toLocaleString() || '0'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="定金状态" span={1}>
            {project.contract?.depositStatus === 'Received' ? (
              <Tag color="green" icon={<CheckCircleOutlined />}>已收款</Tag>
            ) : (
              <Tag color="orange" icon={<ClockCircleOutlined />}>待收款</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="尾款状态" span={2}>
            {statusDisplay.tag}
          </Descriptions.Item>
          {project.contract?.finalPaymentConfirmedDate && (
            <Descriptions.Item label="确认时间" span={2}>
              {dayjs(project.contract.finalPaymentConfirmedDate).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          )}
          {project.contract?.paymentNotes && (
            <Descriptions.Item label="付款备注" span={2}>
              {project.contract.paymentNotes}
            </Descriptions.Item>
          )}
        </Descriptions>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleConfirmClick}
            style={{ 
              height: '50px',
              fontSize: '16px',
              minWidth: '200px'
            }}
          >
            确认尾款已到账
          </Button>
        </div>
      </Card>

      {/* 确认弹窗 */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: '24px' }} />
            <span style={{ fontSize: '18px' }}>确认尾款已到账</span>
          </Space>
        }
        open={modalVisible}
        onOk={handleConfirm}
        onCancel={handleCancel}
        confirmLoading={confirming}
        okText="确认收款"
        cancelText="取消"
        width={600}
        okButtonProps={{
          danger: false,
          type: 'primary',
          size: 'large'
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="重要提示"
            description={
              <div>
                <p style={{ marginBottom: 8 }}>
                  <strong style={{ color: '#f5222d' }}>
                    请务必确认客户尾款已经到账后再点击"确认收款"按钮！
                  </strong>
                </p>
                <p style={{ marginBottom: 0, color: '#666' }}>
                  • 确认后，系统将自动通知生产部门安排发货<br />
                  • 该操作将更新生产订单状态为"准备发货"<br />
                  • 请谨慎操作，确保款项已到账
                </p>
              </div>
            }
            type="warning"
            showIcon
          />

          <Descriptions bordered column={1}>
            <Descriptions.Item label="项目名称">
              {project.project_name}
            </Descriptions.Item>
            <Descriptions.Item label="项目编号">
              {project.project_number}
            </Descriptions.Item>
            <Descriptions.Item label="客户名称">
              {project.client_name || '未填写'}
            </Descriptions.Item>
            <Descriptions.Item label="尾款金额">
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                ¥{project.contract?.finalPaymentAmount?.toLocaleString() || '0'}
              </span>
            </Descriptions.Item>
          </Descriptions>

          <div>
            <div style={{ marginBottom: 8 }}>
              <span>备注信息（选填）：</span>
            </div>
            <TextArea
              rows={4}
              placeholder="请输入收款相关备注，如：收款日期、收款账户、收款凭证号等"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              maxLength={300}
              showCount
            />
          </div>
        </Space>
      </Modal>
    </>
  );
};

export default FinalPaymentConfirmation;

