/**
 * Supplier管理组件
 */

import React, { useMemo } from 'react';
import { Tag, Row, Col, Statistic, Rate } from 'antd';
import DataManagementTable from './DataManagementTable';
import SupplierForm from './forms/SupplierForm';
import { dataManagementAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const SupplierManagement = () => {
  const { user } = useAuthStore();
  
  // 技术工程师不能查看价格敏感信息
  const isTechnicalEngineer = user?.role === 'Technical Engineer';
  // 只有管理员和商务可以查看价格敏感信息
  const canViewPrice = user?.role === 'Administrator' || user?.role === 'Sales Manager';
  
  const allColumns = [
    {
      title: '供应商名称',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200
    },
    {
      title: '联系人',
      dataIndex: 'contact_person',
      key: 'contact_person',
      width: 120
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180
    },
    {
      title: '评级',
      dataIndex: 'rating',
      key: 'rating',
      width: 150,
      render: (text) => text && <Rate disabled value={text} />
    },
    {
      title: '认证状态',
      dataIndex: 'certification_status',
      key: 'certification_status',
      width: 120,
      render: (text) => {
        const colorMap = {
          'Certified': 'success',
          'Pending': 'processing',
          'Not Certified': 'default'
        };
        return text && <Tag color={colorMap[text]}>{text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text) => {
        const colorMap = {
          'active': 'success',
          'inactive': 'default',
          'blacklisted': 'error'
        };
        return text && <Tag color={colorMap[text]}>{text}</Tag>;
      }
    },
    {
      title: '累计交易额',
      dataIndex: 'total_transaction_value',
      key: 'total_transaction_value',
      width: 130,
      render: (text) => text ? `¥${text.toLocaleString()}` : '¥0'
    }
  ];
  
  // 根据用户角色过滤列 - 技术工程师不显示累计交易额
  const columns = useMemo(() => {
    if (isTechnicalEngineer) {
      return allColumns.filter(col => col.key !== 'total_transaction_value');
    }
    return allColumns;
  }, [isTechnicalEngineer]);
  
  const renderStatistics = (stats) => (
    <Row gutter={16}>
      <Col span={6}>
        <Statistic title="总数量" value={stats.totalCount} />
      </Col>
      <Col span={6}>
        <Statistic 
          title="活跃供应商" 
          value={stats.byStatus?.find(item => item._id === 'active')?.count || 0} 
        />
      </Col>
      <Col span={6}>
        <Statistic 
          title="平均评级" 
          value={stats.avgRating || 0}
          precision={1}
          suffix="/ 5"
        />
      </Col>
      <Col span={6}>
        <Statistic 
          title="平均交付率" 
          value={stats.avgDeliveryRate || 0}
          precision={1}
          suffix="%"
        />
      </Col>
    </Row>
  );
  
  return (
    <DataManagementTable
      api={dataManagementAPI.suppliers}
      columns={columns}
      title="供应商"
      FormComponent={SupplierForm}
      renderStatistics={renderStatistics}
      addButtonText="新增供应商"
    />
  );
};

export default SupplierManagement;

