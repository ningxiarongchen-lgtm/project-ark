/**
 * Accessory管理组件
 */

import React, { useMemo } from 'react';
import { Tag, Row, Col, Statistic } from 'antd';
import DataManagementTable from './DataManagementTable';
import AccessoryForm from './forms/AccessoryForm';
import { dataManagementAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const AccessoryManagement = () => {
  const { user } = useAuthStore();
  
  // 只有管理员和商务可以查看价格信息
  const canViewPrice = user?.role === 'Administrator' || user?.role === 'Sales Manager';
  
  const allColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 150
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (text) => text && <Tag color="blue">{text}</Tag>
    },
    {
      title: '制造商',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 150
    },
    {
      title: '型号',
      dataIndex: 'model_number',
      key: 'model_number',
      width: 120
    },
    {
      title: '常温价格',
      dataIndex: 'base_price_normal',
      key: 'base_price_normal',
      width: 120,
      render: (text) => text ? `¥${text.toFixed(2)}` : '-'
    },
    {
      title: '低温价格',
      dataIndex: 'base_price_low',
      key: 'base_price_low',
      width: 120,
      render: (text) => text ? `¥${text.toFixed(2)}` : '-'
    },
    {
      title: '高温价格',
      dataIndex: 'base_price_high',
      key: 'base_price_high',
      width: 120,
      render: (text) => text ? `¥${text.toFixed(2)}` : '-'
    },
    {
      title: '库存数量',
      key: 'stock_quantity',
      width: 100,
      render: (_, record) => {
        const quantity = record.stock_info?.quantity || 0;
        const available = record.stock_info?.available;
        
        if (!available) {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>缺货</span>;
        } else if (quantity === 0) {
          return <span style={{ color: 'orange' }}>0</span>;
        } else if (quantity < 10) {
          return <span style={{ color: 'orange', fontWeight: 'bold' }}>{quantity}</span>;
        } else {
          return <span>{quantity}</span>;
        }
      }
    },
    {
      title: '库存状态',
      key: 'stock_status',
      width: 100,
      render: (_, record) => {
        const available = record.stock_info?.available;
        const quantity = record.stock_info?.quantity || 0;
        
        if (!available) {
          return <Tag color="error">缺货</Tag>;
        } else if (quantity > 0) {
          return <Tag color="success">有货</Tag>;
        } else {
          return <Tag color="warning">按需采购</Tag>;
        }
      }
    }
  ];
  
  // 根据用户角色过滤列 - 只有管理员和商务可以看到价格
  const columns = useMemo(() => {
    if (!canViewPrice) {
      return allColumns.filter(col => 
        col.key !== 'base_price_normal' && 
        col.key !== 'base_price_low' && 
        col.key !== 'base_price_high'
      );
    }
    return allColumns;
  }, [canViewPrice]);
  
  const renderStatistics = (stats) => {
    // 只有管理员和商务显示价格相关统计
    if (!canViewPrice) {
      return (
        <Row gutter={16}>
          <Col span={8}>
            <Statistic title="总数量" value={stats.totalCount} />
          </Col>
          <Col span={8}>
            <Statistic 
              title="类别数" 
              value={stats.byCategory?.length || 0} 
            />
          </Col>
        </Row>
      );
    }
    
    return (
      <Row gutter={16}>
        <Col span={6}>
          <Statistic title="总数量" value={stats.totalCount || 0} />
        </Col>
        <Col span={6}>
          <Statistic 
            title="有价格配件" 
            value={stats.withPrice || 0}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="无价格配件" 
            value={stats.withoutPrice || 0}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="类别数" 
            value={stats.byCategory?.length || 0} 
          />
        </Col>
      </Row>
    );
  };
  
  return (
    <DataManagementTable
      api={dataManagementAPI.accessories}
      columns={columns}
      title="配件"
      FormComponent={AccessoryForm}
      renderStatistics={renderStatistics}
      addButtonText="新增配件"
    />
  );
};

export default AccessoryManagement;

