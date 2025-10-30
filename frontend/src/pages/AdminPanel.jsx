/**
 * 用户管理页面（仅管理员可访问）
 * 只负责用户账号管理和密码重置
 */

import React from 'react';
import { Card, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import UserManagement from '../components/dataManagement/UserManagement';

const { Title } = Typography;

const AdminPanel = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <span>
            <UserOutlined /> 用户管理
          </span>
        }
        extra={
          <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>
            管理系统用户账号和权限
          </span>
        }
      >
        <UserManagement />
      </Card>
    </div>
  );
};

export default AdminPanel;
