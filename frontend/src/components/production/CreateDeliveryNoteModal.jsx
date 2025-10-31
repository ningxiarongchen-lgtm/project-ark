import { useState, useEffect } from 'react';
import { 
  Modal, Form, Input, Select, message, Spin, Space, Descriptions, Tag
} from 'antd';
import { 
  CarOutlined, UserOutlined, EnvironmentOutlined 
} from '@ant-design/icons';
import { deliveryNotesAPI } from '../../services/api';
import api from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

/**
 * 创建发货通知单弹窗
 * 生产计划员/车间主管专用
 */
const CreateDeliveryNoteModal = ({ visible, onClose, productionOrder, onSuccess }) => {
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [logisticsUsers, setLogisticsUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchLogisticsUsers();
      if (productionOrder) {
        // 预填发货明细
        const items = productionOrder.productionItems?.map(item => ({
          item_type: item.item_type,
          model: item.model_name,
          quantity: item.ordered_quantity,
          unit: '台'
        })) || [];
        
        form.setFieldsValue({
          items: items.length > 0 ? JSON.stringify(items) : '',
          shippingAddress: productionOrder.salesOrder?.client_contact?.address || ''
        });
      }
    } else {
      form.resetFields();
    }
  }, [visible, productionOrder, form]);

  const fetchLogisticsUsers = async () => {
    try {
      setLoadingUsers(true);
      // 获取所有物流专员
      const response = await api.get('/admin/users', {
        params: { role: 'Logistics Specialist' }
      });
      setLogisticsUsers(response.data.users || []);
    } catch (error) {
      console.error('获取物流专员列表失败:', error);
      // 如果获取失败，设置为空数组
      setLogisticsUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);

      // 构建发货单数据
      const deliveryNoteData = {
        projectId: productionOrder.salesOrder?._id,
        productionOrderId: productionOrder._id,
        items: productionOrder.productionItems?.map(item => ({
          item_type: item.item_type,
          model: item.model_name,
          quantity: item.ordered_quantity,
          unit: '台'
        })) || [],
        shippingAddress: {
          address: values.shippingAddress,
          recipient: values.recipient,
          phone: values.phone
        },
        handlerId: values.handlerId,
        notes: values.notes
      };

      await deliveryNotesAPI.create(deliveryNoteData);
      message.success('发货通知单创建成功！已通知物流专员。');
      form.resetFields();
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      console.error('创建发货通知单失败:', error);
      message.error(error.response?.data?.message || '创建发货通知单失败');
    } finally {
      setCreating(false);
    }
  };

  if (!productionOrder) return null;

  return (
    <Modal
      title={
        <Space>
          <CarOutlined style={{ color: '#1890ff' }} />
          <span>创建发货通知单</span>
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={creating}
      okText="创建发货单"
      cancelText="取消"
      width={800}
      destroyOnClose
    >
      <Descriptions title="生产订单信息" column={2} bordered size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="生产订单号" span={2}>
          <Tag color="blue">{productionOrder.productionOrderNumber}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="项目名称" span={2}>
          {productionOrder.orderSnapshot?.projectName || '未知项目'}
        </Descriptions.Item>
        <Descriptions.Item label="客户名称" span={2}>
          {productionOrder.orderSnapshot?.clientName || '未填写'}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color="green">{productionOrder.status}</Tag>
        </Descriptions.Item>
      </Descriptions>

      <Form form={form} layout="vertical">
        <Form.Item
          label="收货地址"
          name="shippingAddress"
          rules={[{ required: true, message: '请输入收货地址' }]}
        >
          <TextArea 
            rows={2} 
            placeholder="请输入详细的收货地址"
            prefix={<EnvironmentOutlined />}
          />
        </Form.Item>

        <Form.Item
          label="收货人"
          name="recipient"
          rules={[{ required: true, message: '请输入收货人姓名' }]}
        >
          <Input placeholder="请输入收货人姓名" prefix={<UserOutlined />} />
        </Form.Item>

        <Form.Item
          label="收货电话"
          name="phone"
          rules={[
            { required: true, message: '请输入收货电话' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
          ]}
        >
          <Input placeholder="请输入收货人联系电话" />
        </Form.Item>

        <Form.Item
          label="指派物流专员"
          name="handlerId"
          rules={[{ required: true, message: '请选择物流专员' }]}
        >
          <Select
            placeholder="请选择负责此次发货的物流专员"
            loading={loadingUsers}
            showSearch
            optionFilterProp="children"
            notFoundContent={loadingUsers ? <Spin size="small" /> : '暂无物流专员'}
          >
            {logisticsUsers.map(user => (
              <Option key={user._id} value={user._id}>
                {user.name || user.username} {user.phone && `(${user.phone})`}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="备注"
          name="notes"
        >
          <TextArea 
            rows={3} 
            placeholder="请输入发货相关备注信息（选填）"
            maxLength={200}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateDeliveryNoteModal;

