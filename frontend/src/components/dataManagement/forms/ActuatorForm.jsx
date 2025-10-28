import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber } from 'antd';

const { Option } = Select;

const ActuatorForm = ({ visible, record, onSubmit, onCancel }) => {
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
      title={record ? '编辑执行器' : '新增执行器'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="model_base" label="基础型号" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="series" label="系列">
          <Select>
            <Option value="SF">SF</Option>
            <Option value="AT">AT</Option>
            <Option value="GY">GY</Option>
          </Select>
        </Form.Item>
        <Form.Item name="body_size" label="本体尺寸">
          <Input />
        </Form.Item>
        <Form.Item name="action_type" label="作用类型" rules={[{ required: true }]}>
          <Select>
            <Option value="DA">DA - 双作用</Option>
            <Option value="SR">SR - 弹簧复位</Option>
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
      </Form>
    </Modal>
  );
};

export default ActuatorForm;

