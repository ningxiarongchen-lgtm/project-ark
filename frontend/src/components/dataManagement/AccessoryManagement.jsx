/**
 * Accessory管理组件
 */

import React from 'react';
import { Tag, Row, Col, Statistic } from 'antd';
import DataManagementTable from './DataManagementTable';
import AccessoryForm from './forms/AccessoryForm';
import { dataManagementAPI } from '../../services/api';

const AccessoryManagement = () => {
  const columns = [
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
  
  const renderStatistics = (stats) => (
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

