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
  
  // 检查用户角色，技术工程师不显示价格
  const isTechnicalEngineer = user?.role === 'Technical Engineer';
  
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
      title: '定价模式',
      dataIndex: 'pricing_model',
      key: 'pricing_model',
      width: 100,
      render: (text) => (
        <Tag color={text === 'fixed' ? 'cyan' : 'purple'}>
          {text === 'fixed' ? '固定' : '阶梯'}
        </Tag>
      )
    },
    {
      title: '基础价格',
      dataIndex: 'base_price',
      key: 'base_price',
      width: 120,
      render: (text, record) => {
        const price = text || record.price;
        return price ? `¥${price.toFixed(2)}` : '-';
      }
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
      title: '库存',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      width: 100,
      render: (text, record) => {
        const isLow = text && record.reorder_level && text <= record.reorder_level;
        return (
          <span style={{ color: isLow ? 'red' : 'inherit', fontWeight: isLow ? 'bold' : 'normal' }}>
            {text || 0}
          </span>
        );
      }
    }
  ];
  
  // 根据用户角色过滤列 - 技术工程师不显示价格相关列
  const columns = useMemo(() => {
    if (isTechnicalEngineer) {
      return allColumns.filter(col => 
        col.key !== 'pricing_model' && col.key !== 'base_price'
      );
    }
    return allColumns;
  }, [isTechnicalEngineer]);
  
  const renderStatistics = (stats) => {
    // 技术工程师不显示价格相关统计
    if (isTechnicalEngineer) {
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
          <Statistic title="总数量" value={stats.totalCount} />
        </Col>
        <Col span={6}>
          <Statistic 
            title="类别数" 
            value={stats.byCategory?.length || 0} 
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="库存总价值" 
            value={stats.totalStockValue || 0}
            prefix="¥"
            precision={2}
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
    />
  );
};

export default AccessoryManagement;

