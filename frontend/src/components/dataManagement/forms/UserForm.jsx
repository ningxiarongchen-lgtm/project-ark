import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch } from 'antd';

const { Option } = Select;

const UserForm = ({ visible, record, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  
  useEffect(() => {
    if (visible) {
      if (record) {
        form.setFieldsValue(record);
      } else {
        form.resetFields();
        form.setFieldsValue({ isActive: true });
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
      title={record ? '编辑用户' : '新增用户'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="username" label="用户名" rules={[
          { required: true, message: '请输入用户名' },
          { pattern: /^[a-zA-Z0-9_-]{3,20}$/, message: '用户名只能包含字母、数字、下划线和连字符，长度3-20位' }
        ]}>
          <Input placeholder="请输入用户名" disabled={!!record} />
        </Form.Item>
        <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
          <Input placeholder="请输入真实姓名" />
        </Form.Item>
        {!record && (
          <Form.Item name="password" label="初始密码" rules={[
            { required: true, message: '请输入初始密码' },
            { min: 6, message: '密码至少6位' }
          ]}>
            <Input.Password placeholder="请设置初始密码" />
          </Form.Item>
        )}
        <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
          <Select placeholder="请选择用户角色">
            <Option value="Technical Engineer">技术工程师</Option>
            <Option value="Sales Engineer">销售工程师</Option>
            <Option value="Sales Manager">销售经理</Option>
            <Option value="Procurement Specialist">采购专员</Option>
            <Option value="Production Planner">生产计划员</Option>
            <Option value="After-sales Engineer">售后工程师</Option>
            <Option value="Administrator">管理员</Option>
          </Select>
        </Form.Item>
        <Form.Item name="department" label="部门">
          <Input placeholder="请输入部门" />
        </Form.Item>
        <Form.Item name="phone" label="电话">
          <Input placeholder="请输入联系电话" />
        </Form.Item>
        <Form.Item name="isActive" label="激活状态" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserForm;

