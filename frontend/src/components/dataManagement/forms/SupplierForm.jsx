import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber } from 'antd';

const { Option } = Select;

const SupplierForm = ({ visible, record, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  
  useEffect(() => {
    if (visible) {
      if (record) {
        form.setFieldsValue(record);
      } else {
        form.resetFields();
      }
    }
  }, [visible, record, form]);
  
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };
  
  return (
    <Modal
      title={record ? '编辑供应商' : '新增供应商'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="供应商名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="contact_person" label="联系人">
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="电话">
          <Input />
        </Form.Item>
        <Form.Item name="email" label="邮箱">
          <Input type="email" />
        </Form.Item>
        <Form.Item name="address" label="地址">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="business_scope" label="经营范围">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="rating" label="评级">
          <InputNumber min={1} max={5} />
        </Form.Item>
        <Form.Item name="certification_status" label="认证状态">
          <Select>
            <Option value="Certified">已认证</Option>
            <Option value="Pending">待认证</Option>
            <Option value="Not Certified">未认证</Option>
          </Select>
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select>
            <Option value="active">活跃</Option>
            <Option value="inactive">不活跃</Option>
            <Option value="blacklisted">黑名单</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SupplierForm;

