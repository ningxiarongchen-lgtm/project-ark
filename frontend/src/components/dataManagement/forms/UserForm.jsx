import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Button, message } from 'antd';
import { RedoOutlined } from '@ant-design/icons';
import { ROLE_OPTIONS } from '../../utils/roleTranslations';

const { Option } = Select;

const UserForm = ({ visible, record, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  
  // 生成随机强密码
  const generateRandomPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    // 确保包含至少一个大写字母、小写字母、数字和特殊字符
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // 打乱密码字符
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };
  
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
      title={record ? '编辑用户' : '创建新员工账户'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={600}
      okText={record ? '保存更改' : '确认创建'}
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Form.Item 
          name="phone" 
          label="登录手机号" 
          rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的11位中国大陆手机号' }
          ]}
          extra={record ? "手机号作为登录凭证，创建后不可修改" : "此手机号将作为该员工的登录凭证"}
        >
          <Input 
            placeholder="请输入11位手机号" 
            disabled={!!record} 
            maxLength={11}
            prefix={<span>+86</span>}
          />
        </Form.Item>
        
        <Form.Item 
          name="full_name" 
          label="员工姓名" 
          rules={[
            { required: true, message: '请输入姓名' },
            { min: 2, message: '姓名至少2个字符' },
            { max: 50, message: '姓名不超过50个字符' }
          ]}
        >
          <Input placeholder="请输入员工真实姓名" />
        </Form.Item>
        
        {!record && (
          <>
            <Form.Item 
              name="password" 
              label="初始密码" 
              rules={[
                { required: true, message: '请输入初始密码' },
                { min: 6, message: '密码长度至少6位' },
                { max: 20, message: '密码长度不超过20位' }
              ]}
              extra="员工首次登录时将被要求修改此密码"
            >
              <Input.Password placeholder="请设置初始密码（至少6位）" />
            </Form.Item>
            <Form.Item>
              <Button 
                icon={<RedoOutlined />}
                onClick={() => {
                  const randomPassword = generateRandomPassword();
                  form.setFieldsValue({ password: randomPassword });
                  message.success(`已生成强密码：${randomPassword}`);
                }}
                block
                style={{ marginTop: -8 }}
              >
                自动生成强密码
              </Button>
            </Form.Item>
          </>
        )}
        <Form.Item 
          name="role" 
          label="分配角色" 
          rules={[{ required: true, message: '请选择角色' }]}
          extra="角色决定了用户在系统中的权限和可访问的功能"
        >
          <Select placeholder="请选择用户角色" showSearch>
            {ROLE_OPTIONS.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item 
          name="department" 
          label="所属部门"
          rules={[
            { max: 100, message: '部门名称不超过100个字符' }
          ]}
        >
          <Input placeholder="请输入部门名称（可选）" />
        </Form.Item>
        
        <Form.Item 
          name="isActive" 
          label="激活状态" 
          valuePropName="checked"
          extra="只有激活状态的用户才能登录系统"
        >
          <Switch checkedChildren="激活" unCheckedChildren="停用" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserForm;

