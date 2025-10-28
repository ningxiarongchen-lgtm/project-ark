import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber } from 'antd';

const { Option } = Select;

const AccessoryForm = ({ visible, record, onSubmit, onCancel }) => {
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
      title={record ? '编辑配件' : '新增配件'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="配件名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="category" label="类别" rules={[{ required: true }]}>
          <Select>
            <Option value="控制类">控制类</Option>
            <Option value="连接与传动类">连接与传动类</Option>
            <Option value="安全与保护类">安全与保护类</Option>
            <Option value="检测与反馈类">检测与反馈类</Option>
            <Option value="辅助与安装工具">辅助与安装工具</Option>
          </Select>
        </Form.Item>
        <Form.Item name="pricing_model" label="定价模式" rules={[{ required: true }]}>
          <Select>
            <Option value="fixed">固定价格</Option>
            <Option value="tiered">阶梯价格</Option>
          </Select>
        </Form.Item>
        <Form.Item name="base_price" label="基础价格">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="manufacturer" label="制造商">
          <Input />
        </Form.Item>
        <Form.Item name="model_number" label="型号">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AccessoryForm;

