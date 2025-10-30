/**
 * 数据管理页面
 * 提供Actuators、Accessories、Suppliers、Users的完整管理功能
 */

import React, { useState } from 'react';
import { Tabs, Card, Alert } from 'antd';
import {
  DatabaseOutlined,
  ToolOutlined,
  ShoppingOutlined,
  UserOutlined
} from '@ant-design/icons';
import ActuatorManagement from '../components/dataManagement/ActuatorManagement';
import AccessoryManagement from '../components/dataManagement/AccessoryManagement';
import SupplierManagement from '../components/dataManagement/SupplierManagement';
import { useAuthStore } from '../store/authStore';

const { TabPane } = Tabs;

const DataManagement = () => {
  const [activeTab, setActiveTab] = useState('actuators');
  const { user } = useAuthStore();
  
  // 检查权限
  const isAdmin = user?.role === 'Administrator';
  const isTechnical = user?.role === 'Technical Engineer';
  const isProcurement = user?.role === 'Procurement Specialist';
  
  const hasActuatorAccess = isAdmin || isTechnical;
  const hasAccessoryAccess = isAdmin || isTechnical;
  const hasSupplierAccess = isAdmin || isProcurement;
  
  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <span>
            <DatabaseOutlined /> 数据管理
          </span>
        }
        extra={
          <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>
            管理执行器、配件和供应商数据
          </span>
        }
      >
        {!hasActuatorAccess && !hasAccessoryAccess && !hasSupplierAccess && (
          <Alert
            message="权限不足"
            description="您没有权限访问数据管理功能。请联系管理员。"
            type="warning"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}
        
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
        >
          {hasActuatorAccess && (
            <TabPane
              tab={
                <span>
                  <ToolOutlined />
                  执行器管理
                </span>
              }
              key="actuators"
            >
              <ActuatorManagement />
            </TabPane>
          )}
          
          {hasAccessoryAccess && (
            <TabPane
              tab={
                <span>
                  <ShoppingOutlined />
                  配件管理
                </span>
              }
              key="accessories"
            >
              <AccessoryManagement />
            </TabPane>
          )}
          
          {hasSupplierAccess && (
            <TabPane
              tab={
                <span>
                  <ShoppingOutlined />
                  供应商管理
                </span>
              }
              key="suppliers"
            >
              <SupplierManagement />
            </TabPane>
          )}
        </Tabs>
      </Card>
    </div>
  );
};

export default DataManagement;

