/**
 * User管理组件
 */

import React, { useState } from 'react';
import { Tag, Row, Col, Statistic, Button, Space, Popconfirm, message, Modal, Input, Form } from 'antd';
import { LockOutlined, RedoOutlined } from '@ant-design/icons';
import DataManagementTable from './DataManagementTable';
import UserForm from './forms/UserForm';
import RoleBasedAccess from '../RoleBasedAccess';
import { dataManagementAPI } from '../../services/api';

const UserManagement = () => {
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [resetPasswordForm] = Form.useForm();

  // 生成随机密码
  const generateRandomPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    // 确保包含至少一个字母、数字和特殊字符
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

  // 打开重置密码弹窗
  const openResetPasswordModal = (user) => {
    setCurrentUserId(user._id);
    setCurrentUser(user);
    setResetPasswordModalVisible(true);
    resetPasswordForm.resetFields();
  };

  // 重置密码
  const handleResetPassword = async () => {
    try {
      const values = await resetPasswordForm.validateFields();
      await dataManagementAPI.users.resetPassword(currentUserId, values.newPassword);
      message.success(`用户 ${currentUser?.full_name || currentUser?.phone} 的密码已成功重置！`);
      setResetPasswordModalVisible(false);
      resetPasswordForm.resetFields();
      setCurrentUser(null);
      setCurrentUserId(null);
    } catch (error) {
      if (error.errorFields) {
        // 表单验证失败
        return;
      }
      message.error('重置密码失败: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // 切换状态
  const handleToggleStatus = async (userId) => {
    try {
      await dataManagementAPI.users.toggleStatus(userId);
      message.success('状态已更新');
      window.location.reload(); // 简化处理，实际应该刷新表格数据
    } catch (error) {
      message.error('更新状态失败: ' + (error.response?.data?.message || error.message));
    }
  };
  
  const columns = [
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      fixed: 'left',
      width: 130
    },
    {
      title: '姓名',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 120
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (text) => text && <Tag color="blue">{text}</Tag>
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (text) => (
        <Tag color={text ? 'success' : 'default'}>
          {text ? '激活' : '停用'}
        </Tag>
      )
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 180,
      render: (text) => text ? new Date(text).toLocaleString('zh-CN') : '-'
    },
    {
      title: '额外操作',
      key: 'extra_actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <RoleBasedAccess allowedRoles={['Administrator']}>
            <Popconfirm
              title="确定要切换用户状态吗？"
              onConfirm={() => handleToggleStatus(record._id)}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small" type="link">
                {record.isActive ? '停用' : '激活'}
              </Button>
            </Popconfirm>
          </RoleBasedAccess>
          <RoleBasedAccess allowedRoles={['Administrator']}>
            <Button 
              size="small" 
              type="link" 
              icon={<LockOutlined />}
              onClick={() => openResetPasswordModal(record)}
            >
              重置密码
            </Button>
          </RoleBasedAccess>
        </Space>
      )
    }
  ];
  
  const renderStatistics = (stats) => (
    <Row gutter={16}>
      <Col span={6}>
        <Statistic title="总用户数" value={stats.totalCount} />
      </Col>
      <Col span={6}>
        <Statistic title="激活用户" value={stats.activeCount} />
      </Col>
      <Col span={6}>
        <Statistic title="停用用户" value={stats.inactiveCount} />
      </Col>
      <Col span={6}>
        <Statistic title="角色数" value={stats.byRole?.length || 0} />
      </Col>
    </Row>
  );
  
  return (
    <>
      <DataManagementTable
        api={dataManagementAPI.users}
        columns={columns}
        title="用户"
        FormComponent={UserForm}
        renderStatistics={renderStatistics}
      />
      
      {/* 重置密码Modal */}
      <Modal
        title={`正在为用户 ${currentUser?.full_name || currentUser?.phone || ''} 重置密码`}
        open={resetPasswordModalVisible}
        onOk={handleResetPassword}
        onCancel={() => {
          setResetPasswordModalVisible(false);
          setCurrentUser(null);
          setCurrentUserId(null);
        }}
        width={500}
        okText="确认重置"
        cancelText="取消"
      >
        <Form form={resetPasswordForm} layout="vertical">
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' }
            ]}
          >
            <Input.Password 
              placeholder="请输入新密码（至少6位）" 
              prefix={<LockOutlined />}
            />
          </Form.Item>
          <Form.Item>
            <Button 
              icon={<RedoOutlined />}
              onClick={() => {
                const randomPassword = generateRandomPassword();
                resetPasswordForm.setFieldsValue({ newPassword: randomPassword });
                message.success('已生成随机密码');
              }}
              block
            >
              生成随机密码
            </Button>
          </Form.Item>
          <div style={{ padding: '12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4 }}>
            <strong>提示：</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
              <li>用户下次登录时将被强制修改此密码</li>
              <li>请通过安全方式（如钉钉/微信）将密码告知用户</li>
              <li>建议使用"生成随机密码"功能创建高强度密码</li>
            </ul>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default UserManagement;

